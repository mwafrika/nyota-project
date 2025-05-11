import { useContext, useEffect } from "react";
import io from "socket.io-client";
import { NetworkContext } from "../contexts/NetworkContext";
import {
  getQueue,
  clearQueue,
  getAllNotes,
  saveNotes,
} from "../storage/notesStore";

const SOCKET_URL = "https://my-api-to-be-used-here.com";

export function useSync() {
  const { isConnected } = useContext(NetworkContext);

  useEffect(() => {
    const socket = io(SOCKET_URL);

    socket.on("note:created", (serverNote) => {
      // Merge serverNote into local notes
      (async () => {
        const notes = await getAllNotes();
        if (!notes.find((n) => n.id === serverNote.id)) {
          notes.unshift(serverNote);
          await saveNotes(notes);
        }
      })();
    });

    if (isConnected) {
      (async () => {
        const queue = await getQueue();
        for (const note of queue) {
          socket.emit("note:create", note);
        }
        await clearQueue();
      })();
    }

    return () => socket.disconnect();
  }, [isConnected]);
}
