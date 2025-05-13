import React, { useState, useEffect } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { testSocketConnection, testEmitNote } from "../utils/socketTest";
import { API_URL } from "../config/env";

const SocketDebugger = () => {
  const [logs, setLogs] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Custom logging function to keep track of all messages
  const log = (message, type = "info") => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = { message, timestamp, type };
    setLogs((prevLogs) => [...prevLogs, logEntry]);
    console.log(`[${timestamp}] ${message}`);
  };

  // Connect to socket
  const handleConnect = () => {
    try {
      // Override console.log and console.error to capture in our UI
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;

      console.log = (...args) => {
        log(args.join(" "));
        originalConsoleLog(...args);
      };

      console.error = (...args) => {
        log(args.join(" "), "error");
        originalConsoleError(...args);
      };

      log(`Attempting to connect to: ${API_URL}`);
      const socketInstance = testSocketConnection();

      socketInstance.on("connect", () => {
        setIsConnected(true);
        log("Socket connected!");
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
        log("Socket disconnected");
      });

      setSocket(socketInstance);
    } catch (error) {
      log(`Error: ${error.message}`, "error");
    }
  };

  // Send test note
  const handleSendTestNote = () => {
    if (!socket) {
      log("Socket not connected. Connect first.", "error");
      return;
    }

    log("Sending test note...");
    testEmitNote(socket);
  };

  // Disconnect socket
  const handleDisconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      log("Socket disconnected manually");
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [socket]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Socket.IO Debugger</Text>
      <Text style={styles.subtitle}>Server: {API_URL}</Text>
      <Text style={styles.status}>
        Status:{" "}
        <Text style={isConnected ? styles.connected : styles.disconnected}>
          {isConnected ? "Connected" : "Disconnected"}
        </Text>
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Connect"
          onPress={handleConnect}
          disabled={isConnected}
        />
        <Button
          title="Send Test Note"
          onPress={handleSendTestNote}
          disabled={!isConnected}
        />
        <Button
          title="Disconnect"
          onPress={handleDisconnect}
          disabled={!isConnected}
        />
      </View>

      <Text style={styles.logsTitle}>Logs:</Text>
      <ScrollView style={styles.logs}>
        {logs.map((log, index) => (
          <Text
            key={index}
            style={[styles.logEntry, log.type === "error" && styles.errorLog]}
          >
            {log.timestamp}: {log.message}
          </Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  status: {
    fontSize: 16,
    marginBottom: 16,
  },
  connected: {
    color: "green",
    fontWeight: "bold",
  },
  disconnected: {
    color: "red",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  logs: {
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 4,
    flex: 1,
  },
  logEntry: {
    fontSize: 12,
    marginBottom: 4,
  },
  errorLog: {
    color: "red",
  },
});

export default SocketDebugger;
