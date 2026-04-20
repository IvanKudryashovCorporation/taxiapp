import AsyncStorage from "@react-native-async-storage/async-storage";

export async function setItem(key, value) {
  try {
    if (value === null || value === undefined) {
      await AsyncStorage.removeItem(key);
    } else {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    }
  } catch (e) {
    console.warn("storage.set", key, e);
  }
}

export async function getItem(key) {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    console.warn("storage.get", key, e);
    return null;
  }
}

export async function removeItem(key) {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn("storage.remove", key, e);
  }
}
