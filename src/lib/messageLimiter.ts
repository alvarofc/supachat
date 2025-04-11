const ANON_USER_LIMIT = 2;
const REGISTERED_USER_LIMIT = 10; // Ideally managed server-side

interface MessageCountData {
  count: number;
  date: string; // Store date as YYYY-MM-DD
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

function getStorageKey(userId: string | null): string {
  // Use a generic key for anon, user-specific for registered (for local demo)
  return userId ? `messageCount_${userId}` : 'messageCount_anon';
}

function getMessageCountData(userId: string | null): MessageCountData {
  const key = getStorageKey(userId);
  const today = getTodayDateString();
  try {
    const storedData = localStorage.getItem(key);
    if (storedData) {
      const data: MessageCountData = JSON.parse(storedData);
      // Reset count if it's a new day
      if (data.date === today) {
        return data;
      }
    }
  } catch (error) {
    console.error("Error reading message count from localStorage:", error);
  }
  // Default or reset data
  return { count: 0, date: today };
}

function saveMessageCountData(userId: string | null, data: MessageCountData): void {
  const key = getStorageKey(userId);
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving message count to localStorage:", error);
  }
}

/**
 * Checks if the user can send another message based on their daily limit.
 * @param userId The user's ID (null if anonymous).
 * @returns True if the user can send a message, false otherwise.
 */
export function canSendMessage(userId: string | null): boolean {
  const data = getMessageCountData(userId);
  const limit = userId ? REGISTERED_USER_LIMIT : ANON_USER_LIMIT;
  return data.count < limit;
}

/**
 * Increments the message count for the user for the current day.
 * Should be called after a message is successfully sent.
 * @param userId The user's ID (null if anonymous).
 */
export function incrementMessageCount(userId: string | null): void {
  const data = getMessageCountData(userId);
  const today = getTodayDateString();

  // Ensure data is for today before incrementing
  if (data.date !== today) {
    data.count = 0; // Reset if date changed unexpectedly
    data.date = today;
  }

  data.count += 1;
  saveMessageCountData(userId, data);
}

/**
 * Gets the remaining messages for the user for the current day.
 * @param userId The user's ID (null if anonymous).
 * @returns The number of remaining messages.
 */
export function getRemainingMessages(userId: string | null): number {
    const data = getMessageCountData(userId);
    const limit = userId ? REGISTERED_USER_LIMIT : ANON_USER_LIMIT;
    const remaining = limit - data.count;
    return Math.max(0, remaining); // Ensure non-negative
} 