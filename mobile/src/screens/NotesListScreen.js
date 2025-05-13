import React, { useEffect, useState, useCallback, useContext } from "react";
import {
  View,
  FlatList,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from "react-native";
import { getAllNotes, saveNotes } from "../storage/notesStore";
import { useFocusEffect } from "@react-navigation/native";
import { NetworkContext } from "../contexts/NetworkContext";
import { useSyncStatus } from "../hooks/useSync";

export default function NotesListScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const { isConnected } = useContext(NetworkContext);
  const { socketConnected, getSocketInstance } = useSyncStatus();

  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: "All Notes",
      headerStyle: {
        backgroundColor: "#2196F3",
      },
      headerTintColor: "#fff",
      headerTitleStyle: {
        fontWeight: "bold",
      },
    });
  }, [navigation]);

  // Set up listeners for real-time updates
  useEffect(() => {
    const socket = getSocketInstance();
    if (!socket) return;

    // Listen for updates from other devices
    const handleNoteUpdated = (updatedNote) => {
      console.log(
        "NotesListScreen received note:updated event:",
        updatedNote.id
      );
      setNotes((currentNotes) => {
        // Find if we already have this note
        const noteIndex = currentNotes.findIndex(
          (note) => note.id === updatedNote.id
        );

        if (noteIndex !== -1) {
          // Create a new array with the updated note
          const newNotes = [...currentNotes];
          newNotes[noteIndex] = { ...updatedNote, synced: true };
          return newNotes;
        } else {
          // Add it to the beginning of the array
          return [{ ...updatedNote, synced: true }, ...currentNotes];
        }
      });
    };

    // Listen for new notes from other devices
    const handleNoteCreated = (newNote) => {
      console.log("NotesListScreen received note:created event:", newNote.id);
      setNotes((currentNotes) => {
        // Check if we already have this note
        if (!currentNotes.some((note) => note.id === newNote.id)) {
          return [{ ...newNote, synced: true }, ...currentNotes];
        }
        return currentNotes;
      });
    };

    // Listen for acknowledgments to update sync status
    const handleNoteAck = (data) => {
      console.log("NotesListScreen received note:ack event:", data.id);
      setNotes((currentNotes) => {
        return currentNotes.map((note) => {
          if (note.id === data.id) {
            return { ...note, synced: true, syncedAt: Date.now() };
          }
          return note;
        });
      });
    };

    // Listen for update acknowledgments
    const handleUpdateAck = (data) => {
      console.log("NotesListScreen received note:update_ack event:", data.id);
      setNotes((currentNotes) => {
        return currentNotes.map((note) => {
          if (note.id === data.id) {
            return { ...note, synced: true, syncedAt: Date.now() };
          }
          return note;
        });
      });
    };

    // Listen for note deletions from other devices
    const handleNoteDeleted = (data) => {
      console.log("NotesListScreen received note:deleted event:", data.id);
      setNotes((currentNotes) => {
        return currentNotes.filter((note) => note.id !== data.id);
      });
    };

    // Listen for delete acknowledgments
    const handleDeleteAck = (data) => {
      console.log("NotesListScreen received note:delete_ack event:", data.id);
      setNotes((currentNotes) => {
        return currentNotes.filter((note) => note.id !== data.id);
      });
    };

    // Set up listeners
    socket.on("note:updated", handleNoteUpdated);
    socket.on("note:created", handleNoteCreated);
    socket.on("note:ack", handleNoteAck);
    socket.on("note:update_ack", handleUpdateAck);
    socket.on("note:deleted", handleNoteDeleted);
    socket.on("note:delete_ack", handleDeleteAck);

    // Clean up listeners when component unmounts
    return () => {
      socket.off("note:updated", handleNoteUpdated);
      socket.off("note:created", handleNoteCreated);
      socket.off("note:ack", handleNoteAck);
      socket.off("note:update_ack", handleUpdateAck);
      socket.off("note:deleted", handleNoteDeleted);
      socket.off("note:delete_ack", handleDeleteAck);
    };
  }, [getSocketInstance]);

  useEffect(() => {
    loadNotes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
      return () => {};
    }, [])
  );

  const loadNotes = async () => {
    try {
      setRefreshing(true);
      const notesData = await getAllNotes();
      setNotes(notesData);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleEditNote = (note) => {
    navigation.navigate("Edit", { note });
  };

  const handleDeleteNote = async (note) => {
    try {
      // Remove from local state first for immediate UI feedback
      setNotes((currentNotes) => currentNotes.filter((n) => n.id !== note.id));

      // Then update storage
      const allNotes = await getAllNotes();
      const updatedNotes = allNotes.filter((n) => n.id !== note.id);
      await saveNotes(updatedNotes);

      // If connected, send delete request to server
      const socket = getSocketInstance();
      if (socket && socket.connected) {
        socket.emit("note:delete", { id: note.id });
        console.log("Emitted note:delete for note:", note.id);
      }
    } catch (error) {
      console.error("Error deleting note:", error);
      // Reload notes in case of error
      loadNotes();
    }
  };

  const handleLongPress = (note) => {
    Alert.alert("Note Options", "What would you like to do with this note?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Edit",
        onPress: () => handleEditNote(note),
      },
      {
        text: "Delete",
        onPress: () => confirmDelete(note),
        style: "destructive",
      },
    ]);
  };

  const confirmDelete = (note) => {
    Alert.alert(
      "Delete Note",
      "Are you sure you want to delete this note? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => handleDeleteNote(note),
          style: "destructive",
        },
      ]
    );
  };

  function renderItem({ item }) {
    const createdDate = new Date(item.createdAt).toLocaleString();

    return (
      <TouchableOpacity
        style={styles.noteItem}
        activeOpacity={0.7}
        onPress={() => handleEditNote(item)}
        onLongPress={() => handleLongPress(item)}
      >
        <View style={styles.noteContent}>
          <Text style={styles.noteText} numberOfLines={3} ellipsizeMode="tail">
            {item.text}
          </Text>

          <View style={styles.noteFooter}>
            <Text style={styles.timestamp}>Created: {createdDate}</Text>
            <Text
              style={[
                styles.syncStatus,
                { color: item.synced ? "green" : "orange" },
              ]}
            >
              {item.synced ? `Synced` : "Pending"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>My Notes</Text>
        <Text style={styles.subHeaderText}>
          {notes.length} {notes.length === 1 ? "note" : "notes"} available
        </Text>
      </View>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={loadNotes}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No notes yet. Create your first note!
            </Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("Create")}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#4CAF50",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    marginBottom: 10,
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
  listContent: {
    padding: 10,
  },
  noteItem: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 16,
    marginBottom: 12,
    lineHeight: 22,
  },
  noteFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 8,
  },
  timestamp: {
    fontSize: 12,
    color: "#666",
  },
  syncStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#2196F3",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
