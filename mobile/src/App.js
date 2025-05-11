import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { NetworkProvider } from "./contexts/NetworkContext";
import { useSync } from "./hooks/useSync";
import NotesListScreen from "./screens/NotesListScreen";
import CreateNoteScreen from "./screens/CreateNoteScreen";
import { registerForPushNotificationsAsync } from "./notifications/notifications";

const Stack = createStackNavigator();

export default function App() {
  useSync();
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <NetworkProvider>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Notes" component={NotesListScreen} />
          <Stack.Screen name="Create" component={CreateNoteScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </NetworkProvider>
  );
}
