import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NetworkProvider } from "./contexts/NetworkContext";
import { SyncProvider } from "./hooks/useSync";
import NotesListScreen from "./screens/NotesListScreen";
import CreateNoteScreen from "./screens/CreateNoteScreen";
import OfflineBanner from "./components/OfflineBanner";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, StyleSheet } from "react-native";

const Stack = createNativeStackNavigator();

function AppContent() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Notes" component={NotesListScreen} />
      <Stack.Screen name="Create" component={CreateNoteScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <SyncProvider>
          <View style={styles.container}>
            <OfflineBanner />
            <NavigationContainer>
              <AppContent />
            </NavigationContainer>
          </View>
        </SyncProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
