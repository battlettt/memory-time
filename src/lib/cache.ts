import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * A local copy of the reel, so a session works without a network.
 *
 * This matters more than it sounds: the rooms this app is used in — care
 * homes, hospital bays, a chair by a window at the back of a house — have
 * famously bad signal, and an app that shows an empty screen there is an app
 * that gets abandoned.
 *
 * One honest limitation: photographs are fetched from signed URLs, so a
 * genuinely offline session shows the questions and answers but not the
 * pictures. Caching the image bytes themselves is a bigger job and would need
 * care about how much of someone's phone it quietly fills.
 */

const PREFIX = 'memory-time:cache:';

export async function writeCache<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ at: Date.now(), value }));
  } catch {
    // A full disk must not break the app; the network copy is authoritative.
  }
}

export async function readCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; value: T };
    return parsed.value ?? null;
  } catch {
    return null;
  }
}

export async function clearCache(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith(PREFIX)));
  } catch {
    /* nothing to do */
  }
}
