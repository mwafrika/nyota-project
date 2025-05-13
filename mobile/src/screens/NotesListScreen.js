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
    if (!isMounted.current) return;

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
    const createdDate = new Date(item.createdAt).toLocaleString();

    return (
      <TouchableOpacity style={styles.noteItem} activeOpacity={0.7}>
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
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
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
    padding: 40,
    height: 300,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
});
