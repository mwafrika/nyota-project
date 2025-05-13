export function triggerLocalNotification(title, message) {
  console.log(`[Notification] ${title}: ${message}`);
  // Add implementation later when proper notification libraries are added
  return true;
}

export async function requestNotificationPermissions() {
  console.log("Notification permissions requested");
  return true;
}
