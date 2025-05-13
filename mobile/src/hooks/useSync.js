import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import io from "socket.io-client";
import { Platform } from "react-native";
import { NetworkContext } from "../contexts/NetworkContext";
import {
  getQueue,
  clearQueue,
  getAllNotes,
  saveNotes,
  enqueueNote,
  getPendingNotes,
} from "../storage/notesStore";
import { triggerLocalNotification } from "../notifications/notifications";
import { API_URL, LOCALHOST_URL } from "../config/env";

// Global socket instance (singleton)
let globalSocketInstance = null;

// Function to get socket URL
export const getSocketUrl = () => {
  // For emulators
  if (!__DEV__) {
    return API_URL; // for production
  } else if (Platform.OS === "android") {
    return LOCALHOST_URL; // for Android emulator LOCALHOST_URL
  } else {
    return API_URL; // for other platforms
  }
};

// Create a sync context
const SyncContext = createContext({
  socketConnected: false,
  connectionError: null,
  connecting: false,
  getSocketInstance: () => null,
});

// SyncProvider component
export function SyncProvider({ children }) {
  const [socketConnected, setSocketConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const { isConnected } = useContext(NetworkContext);

  // Provide socket instance to child components
  const getSocketInstance = useCallback(() => {
    return globalSocketInstance;
  }, []);

  // Connect to socket server
  const connectToSocket = useCallback(() => {
    if (connecting) return; // Prevent multiple connection attempts

    try {
      setConnecting(true);
      console.log("Connecting to socket server...");

      const socketUrl = getSocketUrl();
      console.log("Socket URL:", socketUrl);

      // Disconnect existing socket if any
      if (globalSocketInstance) {
        console.log("Disconnecting existing socket");
        globalSocketInstance.disconnect();
        globalSocketInstance = null;
      }

      // Create new socket connection
      globalSocketInstance = io(socketUrl, {
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 3000,
        timeout: 10000,
      });

      // Set up event handlers
      globalSocketInstance.on("connect", () => {
        console.log("Socket connected with ID:", globalSocketInstance.id);
        setSocketConnected(true);
        setConnecting(false);
        setConnectionError(null);

        // Sync pending notes
        syncPendingNotes();
      });

      globalSocketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error.message);
        setSocketConnected(false);
        setConnecting(false);
        setConnectionError(error.message);
      });

      globalSocketInstance.on("disconnect", (reason) => {
        console.log("Socket disconnected:", reason);
        setSocketConnected(false);
      });

      globalSocketInstance.on("note:created", (serverNote) => {
        // Merge serverNote into local notes
        (async () => {
          const notes = await getAllNotes();
          if (!notes.find((n) => n.id === serverNote.id)) {
            notes.unshift(serverNote);
            await saveNotes(notes);
            triggerLocalNotification("Note Synced", "Note synced to server");
          }
        })();
      });

      globalSocketInstance.on("note:ack", (data) => {
        console.log("Note acknowledgment received:", data);

        // Update note sync status
        (async () => {
          try {
            const notes = await getAllNotes();
            const index = notes.findIndex((n) => n.id === data.id);
            if (index !== -1) {
              notes[index].synced = true;
              await saveNotes(notes);
              console.log(`Note ${data.id} marked as synced`);
            }
          } catch (error) {
            console.error("Error updating note status:", error);
          }
        })();
      });

      globalSocketInstance.on("note:error", (data) => {
        console.error("Note error received:", data);
      });
    } catch (error) {
      console.error("Error initializing socket:", error);
      setSocketConnected(false);
      setConnecting(false);
      setConnectionError(error.message);
      globalSocketInstance = null;
    }
  }, [connecting]);

  // Function to sync pending notes
  const syncPendingNotes = useCallback(async () => {
    await clearQueue();
    if (!globalSocketInstance || !globalSocketInstance.connected) {
      console.log("Cannot sync notes - socket not connected");
      return;
    }

    try {
      // First sync any pending notes from local storage
      const pendingNotes = await getPendingNotes();
      if (pendingNotes.length > 0) {
        console.log(`Syncing ${pendingNotes.length} pending notes`);
        for (const note of pendingNotes) {
          globalSocketInstance.emit("note:create", note);
          console.log(`Emitted pending note ${note.id} for sync`);
        }
      }

      // Then sync any notes in the queue
      const queue = await getQueue();
      if (queue.length > 0) {
        console.log(`Syncing ${queue.length} queued notes`);
        for (const note of queue) {
          console.log("Emitting note from queue:", note.id);
          globalSocketInstance.emit("note:create", note);
        }
        await clearQueue();
      }
    } catch (error) {
      console.error("Error syncing notes:", error);
    }
  }, []);

  // Connect socket when network becomes available
  useEffect(() => {
    if (isConnected && !socketConnected && !connecting) {
      connectToSocket();
    }

    return () => {
      // No cleanup here - we want the socket to persist
    };
  }, [isConnected, socketConnected, connecting, connectToSocket]);

  return (
    <SyncContext.Provider
      value={{
        socketConnected,
        connectionError,
        connecting,
        getSocketInstance,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSyncStatus() {
  return useContext(SyncContext);
}

export function useSync() {
  const { socketConnected, connectionError, connecting } = useSyncStatus();
  const { isConnected } = useContext(NetworkContext);

  return {
    socketConnected,
    connectionError,
    connecting,
    isConnected,
  };
}
