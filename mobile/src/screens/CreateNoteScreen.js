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
      // Create new note
      const newNote = {
        id: uuidv4(),
        text,
        synced: false,
        createdAt: Date.now(),
      };

      const notes = await getAllNotes();
      notes.unshift(newNote);
      await saveNotes(notes);
      console.log("Note saved locally:", newNote.id);


      if (isConnected && socketConnected) {
        const socket = getSocketInstance();
        if (socket && socket.connected) {
          socket.emit("note:create", newNote);
          console.log("Note emitted for immediate sync:", newNote.id);
        } else {
          await enqueueNote(newNote);
          console.log(
            "Socket unavailable, added note to sync queue:",
            newNote.id
          );
        }
      } else {
        await enqueueNote(newNote);
        console.log("Offline - added note to sync queue:", newNote.id);
      }

      // Navigate back to the notes list
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
