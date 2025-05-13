import React, { useContext } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { NetworkContext } from "../contexts/NetworkContext";
import { useSyncStatus } from "../hooks/useSync";

export default function OfflineBanner() {
  const { isConnected } = useContext(NetworkContext);
  const { socketConnected, connectionError } = useSyncStatus();

  // Don't show anything if both network and socket are connected
  if (isConnected && socketConnected) return null;

  // Different messages based on connection state
  let message = "You are Offline";
  let backgroundColor = "#b52424"; // Red for offline

  if (isConnected && !socketConnected) {
    message = connectionError
      ? `Server Connection Issue: ${connectionError}`
      : "Server Connection Issue";
    backgroundColor = "#f39c12"; // Orange for server connection issues
  }

  return (
    <View style={[styles.banner, { backgroundColor }]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    padding: 10,
    alignItems: "center",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  text: {
    color: "#fff",
    fontWeight: "bold",
  },
});
