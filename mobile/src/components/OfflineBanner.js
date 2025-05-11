import React, { useContext } from "react";
import { View, Text, StyleSheet } from "react-native";
import { NetworkContext } from "../contexts/NetworkContext";

export default function OfflineBanner() {
  const { isConnected } = useContext(NetworkContext);
  if (isConnected) return null;

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>You are Offline</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: "#b52424",
    padding: 8,
    alignItems: "center",
  },
  text: { color: "#fff" },
});
