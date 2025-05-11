import * as Notifications from "expo-notifications";

export async function registerForPushNotificationsAsync() {
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") return;
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  // Send token to backend when API is ready
}

export function triggerLocalNotification(title, body) {
  Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null,
  });
}
