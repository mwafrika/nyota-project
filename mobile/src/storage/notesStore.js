import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTES_KEY = "NOTES_LIST";
const QUEUE_KEY = "NOTES_QUEUE";

export async function getAllNotes() {
  const json = await AsyncStorage.getItem(NOTES_KEY);
  return json ? JSON.parse(json) : [];
}

export async function saveNotes(notes) {
  await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export async function enqueueNote(note) {
  const q = await AsyncStorage.getItem(QUEUE_KEY);
  const queue = q ? JSON.parse(q) : [];
  queue.push(note);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue() {
  const q = await AsyncStorage.getItem(QUEUE_KEY);
  return q ? JSON.parse(q) : [];
}

export async function clearQueue() {
  await AsyncStorage.removeItem(QUEUE_KEY);
}
