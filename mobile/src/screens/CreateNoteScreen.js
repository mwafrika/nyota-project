import React, { useState, useContext } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { v4 as uuidv4 } from "../utils/idGenerator";
import { getAllNotes, saveNotes, enqueueNote } from "../storage/notesStore";
import { NetworkContext } from "../contexts/NetworkContext";
import { useSyncStatus } from "../hooks/useSync";
import io from "socket.io-client";
import { getSocketUrl } from "../hooks/useSync";

export default function CreateNoteScreen({ navigation }) {
  const [text, setText] = useState("");
  const { isConnected } = useContext(NetworkContext);
  const { socketConnected } = useSyncStatus();

  async function save() {
    try {
      const newNote = {
        id: uuidv4(),
        text,
        synced: false,
        createdAt: Date.now(),
      };

      // Save locally first
      const notes = await getAllNotes();
      notes.unshift(newNote);
      await saveNotes(notes);

      // If connected to server, emit directly
      if (isConnected && socketConnected) {
        try {
          const socket = io(getSocketUrl(), {
            transports: ["websocket", "polling"],
          });

          // Wait for connection
          socket.on("connect", () => {
            socket.emit("note:create", newNote);
            console.log("Emitted note:create directly:", newNote.id);

            socket.disconnect();
          });
        } catch (error) {
          console.error("Error emitting note:", error);
          await enqueueNote(newNote);
        }
      } else {
        await enqueueNote(newNote);
        console.log("Added note to sync queue:", newNote.id);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error saving note:", error);
    }
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Enter note..."
        value={text}
        onChangeText={setText}
        style={styles.input}
        multiline
      />
      <Button title="Save" onPress={save} disabled={!text.trim()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
    padding: 10,
    marginBottom: 16,
    minHeight: 100,
  },
});
