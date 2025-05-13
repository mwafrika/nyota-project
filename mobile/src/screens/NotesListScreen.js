import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  FlatList,
  Text,
  Button,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { getAllNotes } from "../storage/notesStore";
import { useFocusEffect } from "@react-navigation/native";

export default function NotesListScreen({ navigation }) {
  const [notes, setNotes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load notes on initial render
  useEffect(() => {
    loadNotes();
  }, []);

  // Reload notes when screen comes into focus
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

  function renderItem({ item }) {
    return (
      <TouchableOpacity style={styles.noteItem}>
        <Text style={styles.noteText}>{item.text}</Text>
        <Text
          style={[
            styles.syncStatus,
            { color: item.synced ? "green" : "orange" },
          ]}
        >
          {item.synced ? "Synced" : "Pending"}
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        refreshing={refreshing}
        onRefresh={loadNotes}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  noteItem: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  noteText: {
    fontSize: 16,
    marginBottom: 8,
  },
  syncStatus: {
    fontSize: 12,
    fontWeight: "bold",
  },
  addButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
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
    padding: 20,
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
