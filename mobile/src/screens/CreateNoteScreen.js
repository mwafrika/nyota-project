import React, { useState, useContext } from "react";
import { View, TextInput, Button } from "react-native";
import { v4 as uuidv4 } from "uuid";
import { getAllNotes, saveNotes, enqueueNote } from "../storage/notesStore";
import { NetworkContext } from "../contexts/NetworkContext";

export default function CreateNoteScreen({ navigation }) {
  const [text, setText] = useState("");
  const { isConnected } = useContext(NetworkContext);

  async function save() {
    const newNote = {
      id: uuidv4(),
      text,
      synced: false,
      createdAt: Date.now(),
    };
    const notes = await getAllNotes();
    notes.unshift(newNote);
    await saveNotes(notes);

    if (isConnected) {
      // Will be picked up by useSync hook and sent via socket when API is ready
    } else {
      await enqueueNote(newNote);
    }

    navigation.goBack();
  }

  return (
    <View style={{ padding: 16 }}>
      <TextInput
        placeholder="Enter note..."
        value={text}
        onChangeText={setText}
        style={{ borderWidth: 1, padding: 8, marginBottom: 16 }}
      />
      <Button title="Save" onPress={save} disabled={!text.trim()} />
    </View>
  );
}
