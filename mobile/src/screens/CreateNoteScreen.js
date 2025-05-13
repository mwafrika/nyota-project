import React, { useState, useContext, useEffect } from "react";
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { v4 as uuidv4 } from "../utils/idGenerator";
import { getAllNotes, saveNotes, enqueueNote } from "../storage/notesStore";
import { NetworkContext } from "../contexts/NetworkContext";
import { useSyncStatus } from "../hooks/useSync";

export default function CreateNoteScreen({ navigation }) {
  const [text, setText] = useState("");
  const { isConnected } = useContext(NetworkContext);
  const { socketConnected, getSocketInstance } = useSyncStatus();
  const [screenHeight, setScreenHeight] = useState(
    Dimensions.get("window").height
  );

  // Handle screen dimension changes
  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenHeight(window.height);
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription.remove();
  }, []);

  // Set navigation options
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "Create Note",
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });
  }, [navigation]);

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
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.headerText}>Create New Note</Text>
            <Text style={styles.subHeaderText}>
              {isConnected
                ? "Online - Will sync immediately"
                : "Offline - Will sync later"}
            </Text>
          </View>

          <View style={styles.formContainer}>
            <TextInput
              placeholder="What's on your mind?"
              value={text}
              onChangeText={setText}
              style={[styles.input, { minHeight: screenHeight * 0.4 }]}
              multiline
              autoFocus={true}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[
                styles.saveButton,
                !text.trim() && styles.saveButtonDisabled,
              ]}
              onPress={save}
              disabled={!text.trim()}
            >
              <Text style={styles.saveButtonText}>Save Note</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    backgroundColor: "#4CAF50",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  subHeaderText: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
  },
  formContainer: {
    flex: 1,
    padding: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#fff",
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  saveButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
