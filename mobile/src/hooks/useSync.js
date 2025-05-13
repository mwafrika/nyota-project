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
  const [socket, setSocket] = useState(null);
  const { isConnected } = useContext(NetworkContext);
  const socketRef = React.useRef(null);

  // Provide socket instance to child components
  const getSocketInstance = useCallback(() => {
    return socketRef.current;
  }, []);

  useEffect(() => {
    let socketInstance;

    const connectToSocket = () => {
      try {
        setConnecting(true);
        const socketUrl = getSocketUrl();
        console.log("useSync: Connecting to socket server at:", socketUrl);

        if (socketRef.current) {
          socketRef.current.disconnect();
          socketRef.current = null;
        }

        socketInstance = io(socketUrl, {
          transports: ["websocket", "polling"],
          reconnectionAttempts: 5,
          reconnectionDelay: 5000,
          timeout: 10000,
        });

        // Store socket instance in ref
        socketRef.current = socketInstance;
        setSocket(socketInstance);

        socketInstance.on("connect", () => {
          console.log("Connected to server with ID:", socketInstance.id);
          setSocketConnected(true);
          setConnecting(false);
          setConnectionError(null);

          // Auto-sync when connected
          if (isConnected) {
            setTimeout(async () => {
              try {
                // First, sync any pending notes from the local database
                const pendingNotes = await getPendingNotes();
                if (pendingNotes.length > 0) {
                  console.log(`Syncing ${pendingNotes.length} pending notes`);
                  for (const note of pendingNotes) {
                    socketInstance.emit("note:create", note);
                    console.log(`Emitted pending note ${note.id} for sync`);
                  }
                }

                // Then sync any notes in the queue
                const queue = await getQueue();
                if (queue.length > 0) {
                  console.log(`Syncing ${queue.length} queued notes`);
                  for (const note of queue) {
                    console.log("Emitting note from queue:", note.id);
                    socketInstance.emit("note:create", note);
                  }
                  await clearQueue();
                }
              } catch (error) {
                console.error("Error syncing notes:", error);
              }
            }, 1000);
          }
        });

        socketInstance.on("connect_error", (error) => {
          console.error("Connection error:", error);
          setSocketConnected(false);
          setConnecting(false);
          setConnectionError(error.message);
        });

        socketInstance.on("disconnect", (reason) => {
          console.log("Socket disconnected:", reason);
          setSocketConnected(false);
          setConnecting(false);
        });

        socketInstance.on("note:created", (serverNote) => {
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

        // Listen for acknowledgments
        socketInstance.on("note:ack", (data) => {
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

        // Listen for errors
        socketInstance.on("note:error", (data) => {
          console.error("Note error received:", data);
        });
      } catch (error) {
        console.error("Error initializing socket:", error);
        setSocketConnected(false);
        setConnecting(false);
        setConnectionError(error.message);
      }
    };

    // Connect to socket if network is connected
    if (isConnected && !socketConnected && !connecting) {
      connectToSocket();
    }

    // Cleanup function
    return () => {
      if (socketInstance) {
        console.log("Disconnecting socket on cleanup");
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
  }, [isConnected, socketConnected, connecting]);

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

// Function to get socket URL
export const getSocketUrl = () => {
  // For emulators
  if (Platform.OS === "android" && !__DEV__) {
    return API_URL; // for production
  } else if (Platform.OS === "android") {
    return LOCALHOST_URL; // for Android emulator
  } else {
    return API_URL; // for other platforms
  }
};

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
