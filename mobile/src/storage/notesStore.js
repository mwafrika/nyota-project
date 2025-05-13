import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTES_KEY = "NOTES_LIST";
const QUEUE_KEY = "NOTES_QUEUE";

export async function getAllNotes() {
  try {
    const json = await AsyncStorage.getItem(NOTES_KEY);
    console.log("Retrieved notes:", json ? JSON.parse(json).length : 0);
    return json ? JSON.parse(json) : [];
  } catch (error) {
    console.error("Error retrieving notes:", error);
    return [];
  }
}

export async function saveNotes(notes) {
  try {
    await AsyncStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    console.log(`Saved ${notes.length} notes to storage`);
    return true;
  } catch (error) {
    console.error("Error saving notes:", error);
    return false;
  }
}

export async function enqueueNote(note) {
  try {
    const q = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = q ? JSON.parse(q) : [];
    queue.push(note);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    console.log(`Note ${note.id} added to sync queue`);
    return true;
  } catch (error) {
    console.error("Error enqueueing note:", error);
    return false;
  }
}

export async function getQueue() {
  try {
    const q = await AsyncStorage.getItem(QUEUE_KEY);
    const queue = q ? JSON.parse(q) : [];
    console.log(`Retrieved queue with ${queue.length} items`);
    return queue;
  } catch (error) {
    console.error("Error getting queue:", error);
    return [];
  }
}

export async function clearQueue() {
  try {
    await AsyncStorage.removeItem(QUEUE_KEY);
    console.log("Queue cleared");
    return true;
  } catch (error) {
    console.error("Error clearing queue:", error);
    return false;
  }
}

// Get all notes with pending sync status
export async function getPendingNotes() {
  try {
    const notes = await getAllNotes();
    const pendingNotes = notes.filter((note) => note.synced === false);
    console.log(`Found ${pendingNotes.length} pending notes`);
    return pendingNotes;
  } catch (error) {
    console.error("Error getting pending notes:", error);
    return [];
  }
}

// Mark a note as synced
export async function markNoteSynced(noteId) {
  try {
    const notes = await getAllNotes();
    const index = notes.findIndex((note) => note.id === noteId);

    if (index !== -1) {
      notes[index].synced = true;
      notes[index].syncedAt = Date.now();
      await saveNotes(notes);
      console.log(
        `Note ${noteId} marked as synced at ${new Date().toISOString()}`
      );
      return true;
    }

    console.log(`Note ${noteId} not found`);
    return false;
  } catch (error) {
    console.error("Error marking note as synced:", error);
    return false;
  }
}
