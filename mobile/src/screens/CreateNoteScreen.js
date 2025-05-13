import React, { useState, useContext } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";
import { v4 as uuidv4 } from "../utils/idGenerator";
import { getAllNotes, saveNotes, enqueueNote } from "../storage/notesStore";
import { NetworkContext } from "../contexts/NetworkContext";
import { useSyncStatus } from "../hooks/useSync";

export default function CreateNoteScreen({ navigation }) {
  const [text, setText] = useState("");
  const { isConnected } = useContext(NetworkContext);
  const { socketConnected, getSocketInstance } = useSyncStatus();

  async function save() {
    try {
      const newNote = {
        id: uuidv4(),
        text,
        synced: false,
        createdAt: Date.now(),
        syncedAt: null,
      };

      const notes = await getAllNotes();
      notes.unshift(newNote);
      await saveNotes(notes);
      console.log("Note saved locally:", newNote.id);
      const socket = getSocketInstance();

      if (isConnected && socketConnected && socket && socket.connected) {
        try {
          socket.emit("note:create", newNote);
          console.log("Note emitted for immediate sync:", newNote.id);
        } catch (error) {
          console.error("Socket emit error:", error);
          await enqueueNote(newNote);
          console.log("Error during sync, added to queue:", newNote.id);
        }
      } else {
        await enqueueNote(newNote);
        console.log(
          "Network/socket not available, queued for later sync:",
          newNote.id
        );
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
