import React, { useEffect, useState } from "react";
import { View, FlatList, Text, Button } from "react-native";
import { getAllNotes } from "../storage/notesStore";
import OfflineBanner from "../components/OfflineBanner";

export default function NotesListScreen({ navigation }) {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    (async () => {
      setNotes(await getAllNotes());
    })();
  }, []);

  function renderItem({ item }) {
    return (
      <View style={{ padding: 12, borderBottomWidth: 1 }}>
        <Text>{item.text}</Text>
        <Text style={{ fontSize: 12, color: item.synced ? "green" : "orange" }}>
          {item.synced ? "Synced" : "Pending"}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
      />
      <Button title="New Note" onPress={() => navigation.navigate("Create")} />
    </View>
  );
}
