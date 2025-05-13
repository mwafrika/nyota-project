import { useContext, useEffect } from "react";
import io from "socket.io-client";
import { Platform } from "react-native";
import { NetworkContext } from "../contexts/NetworkContext";
import {
  getQueue,
  clearQueue,
  getAllNotes,
  saveNotes,
} from "../storage/notesStore";
import { triggerLocalNotification } from "../notifications/notifications";
import { API_URL, LOCALHOST_URL } from "../config/env";

const getSocketUrl = () => {
  // For emulators
  if (Platform.OS === "android" && !__DEV__) {
    return API_URL; // for production
  } else if (Platform.OS === "android") {
    return LOCALHOST_URL; // for Android emulator
  } else {
    return API_URL; // for other platforms
  }
};

export function useSync() {
  const { isConnected } = useContext(NetworkContext);

  useEffect(() => {
    let socket;

    try {
      const socketUrl = getSocketUrl();
      console.log("useSync: Connecting to socket server at:", socketUrl);

      socket = io(socketUrl, {
        transports: ["websocket"],
        reconnectionAttempts: 5,
        reconnectionDelay: 5000,
        timeout: 10000,
      });

      socket.on("connect", () => {
        console.log("Connected to server");
      });

      socket.on("connect_error", (error) => {
        console.error("Connection error:", error);
      });

      socket.on("note:created", (serverNote) => {
        // Merge serverNote into local notes
        (async () => {
          const notes = await getAllNotes();
          if (!notes.find((n) => n.id === serverNote.id)) {
            notes.unshift(serverNote);
            await saveNotes(notes);
            // Trigger local notification
            triggerLocalNotification(
              "Note Synced",
              "Your note has been synced to the server."
            );
          }
        })();
      });

      // Listen for acknowledgments
      socket.on("note:ack", (data) => {
        console.log("Note acknowledgment received:", data);
      });

      // Listen for errors
      socket.on("note:error", (data) => {
        console.error("Note error received:", data);
      });

      if (isConnected) {
        (async () => {
          const queue = await getQueue();
          console.log(`Syncing ${queue.length} queued notes`);
          for (const note of queue) {
            console.log("Emitting note from queue:", note.id);
            socket.emit("note:create", note);
          }
          await clearQueue();
        })();
      }
    } catch (error) {
      console.error("Error initializing socket:", error);
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isConnected]);
}
