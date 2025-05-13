import React, { useState, useContext, useEffect } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Alert,
} from "react-native";
import { getAllNotes, saveNotes, enqueueNote } from "../storage/notesStore";
import { NetworkContext } from "../contexts/NetworkContext";
import { useSyncStatus } from "../hooks/useSync";

export default function EditNoteScreen({ route, navigation }) {
  const { note } = route.params;
  const [text, setText] = useState(note.text);
  const [originalText] = useState(note.text);
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
      title: "Edit Note",
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
      headerRight: () => (
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={text === originalText}
        >
          <Text
            style={[
              styles.headerButtonText,
              text === originalText ? styles.headerButtonDisabled : {},
            ]}
          >
            Save
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, text, originalText]);

  async function handleSave() {
    if (text.trim() === "") {
      Alert.alert("Error", "Note cannot be empty");
      return;
    }

    try {
      const allNotes = await getAllNotes();
      const updatedNotes = allNotes.map((item) => {
        if (item.id === note.id) {
          return {
            ...item,
            text: text,
            synced: isConnected && socketConnected ? true : false,
            updatedAt: Date.now(),
            syncedAt: isConnected && socketConnected ? Date.now() : null,
          };
        }
        return item;
      });

      await saveNotes(updatedNotes);
      console.log("Note updated locally:", note.id);

      const socket = getSocketInstance();
      if (isConnected && socketConnected && socket && socket.connected) {
        try {
          const updatedNote = updatedNotes.find((item) => item.id === note.id);
          socket.emit("note:update", updatedNote);
          console.log("Note update emitted for sync:", note.id);
        } catch (error) {
          console.error("Socket emit error:", error);
          await enqueueNote(updatedNotes.find((item) => item.id === note.id));
          console.log("Error during sync, added to queue:", note.id);
        }
      } else {
        await enqueueNote(updatedNotes.find((item) => item.id === note.id));
        console.log("Network/socket not available, queued for sync:", note.id);
      }

      navigation.goBack();
    } catch (error) {
      console.error("Error updating note:", error);
      Alert.alert("Error", "Failed to update note");
    }
  }

  function handleCancel() {
    if (text !== originalText) {
      Alert.alert(
        "Discard Changes",
        "You have unsaved changes. Are you sure you want to discard them?",
        [
          {
            text: "Keep Editing",
            style: "cancel",
          },
          {
            text: "Discard",
            onPress: () => navigation.goBack(),
            style: "destructive",
          },
        ]
      );
    } else {
      navigation.goBack();
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
            <Text style={styles.headerText}>Edit Note</Text>
            <Text style={styles.subHeaderText}>
              ID: {note.id.substring(0, 8)}...
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

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.saveButton,
                  (text === originalText || !text.trim()) &&
                    styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={text === originalText || !text.trim()}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
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
    backgroundColor: "#FF9800", // Orange for edit screen
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
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  saveButton: {
    backgroundColor: "#2196F3",
    marginLeft: 8,
  },
  saveButtonDisabled: {
    backgroundColor: "#B0BEC5",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#ddd",
    marginRight: 8,
  },
  cancelButtonText: {
    color: "#333",
    fontSize: 16,
  },
  headerButton: {
    padding: 8,
    marginRight: 8,
  },
  headerButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  headerButtonDisabled: {
    opacity: 0.5,
  },
});
