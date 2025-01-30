import CryptoJS from 'crypto-js';
import { tryoutData } from './Project/TSX/Helpers/tryoutData';
// Toggle encryption on or off
const encryptData = true;
const isTryout = window.location.href.includes('tryout');
const secretKey = window.electron ? '' : import.meta.env.VITE_ENCRYPTION_KEY;
const secretKeyKEY = window.electron ? '' : import.meta.env.VITE_secretKeyKEY;

// One month in milliseconds (30 days)
const ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

// Keys that should always be stored in localStorage without expiration
const PERSISTENT_KEYS = ['tutorialPreferences', 'DontRememberMe'];

const withExpiration = (value, key) => {
  if (PERSISTENT_KEYS.includes(key)) {
    return value;
  }
  return {
    value,
    timestamp: new Date().getTime(),
    expiresIn: ONE_MONTH,
  };
};

const isExpired = (timestamp, expiresIn) => {
  if (!timestamp || !expiresIn) return false;
  const now = new Date().getTime();
  return now - timestamp > expiresIn;
};

const encrypt = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
};

// Simple but secure key encryption using base64 and a salt
const encryptKey = (key) => {
  if (!encryptData) {
    return key;
  }
  const salt = secretKeyKEY; // Static salt adds consistency
  const combined = key + salt;
  const base64 = btoa(combined);
  return base64.split('').reverse().join(''); // Simple reversal for extra obfuscation
};

const decrypt = (data) => {
  if (!data) {
    return null;
  }
  const bytes = CryptoJS.AES.decrypt(data, secretKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
};

const isElectron = () => {
  return window?.electron !== undefined;
};

const electronStorage = {
  get: (key) => {
    try {
      const encryptedKey = encryptKey(key);
      const storedData = window.electron.store.get(encryptedKey);
      if (PERSISTENT_KEYS.includes(key)) {
        return storedData;
      }
      if (storedData && storedData.timestamp) {
        if (isExpired(storedData.timestamp, storedData.expiresIn)) {
          window.electron.store.delete(encryptedKey);
          return null;
        }
        return storedData.value;
      }
      return storedData;
    } catch (error) {
      console.error('Error reading from electron store:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      const encryptedKey = encryptKey(key);
      const dataToStore = withExpiration(value, key);
      window.electron.store.set(encryptedKey, dataToStore);
    } catch (error) {
      console.error('Error writing to electron store:', error);
    }
  },
};

const webStorage = {
  get: (key) => {
    try {
      const encryptedKey = encryptKey(key);
      const storage = PERSISTENT_KEYS.includes(key)
        ? localStorage
        : localStorage.getItem('DontRememberMe') === 'true' && encryptData
        ? sessionStorage
        : localStorage;

      const storedData = storage.getItem(encryptedKey);
      if (!storedData) return null;

      const parsedData = encryptData
        ? decrypt(storedData)
        : JSON.parse(storedData);

      if (PERSISTENT_KEYS.includes(key)) {
        return parsedData;
      }

      if (parsedData && parsedData.timestamp) {
        if (isExpired(parsedData.timestamp, parsedData.expiresIn)) {
          storage.removeItem(encryptedKey);
          return null;
        }
        return parsedData.value;
      }
      return parsedData;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      const encryptedKey = encryptKey(key);
      const dataWithExpiration = withExpiration(value, key);
      const dataToStore = encryptData
        ? encrypt(dataWithExpiration)
        : JSON.stringify(dataWithExpiration);
      const storage = PERSISTENT_KEYS.includes(key)
        ? localStorage
        : localStorage.getItem('DontRememberMe') === 'true' && encryptData
        ? sessionStorage
        : localStorage;
      storage.setItem(encryptedKey, dataToStore);
    } catch (error) {
      console.error('Error writing to storage:', error);
    }
  },
  clear: () => {
    try {
      const storage =
        localStorage.getItem('DontRememberMe') === 'true' && encryptData
          ? sessionStorage
          : localStorage;
      // Only clear non-persistent items
      const persistentData = {};
      PERSISTENT_KEYS.forEach((key) => {
        const encryptedKey = encryptKey(key);
        persistentData[encryptedKey] = localStorage.getItem(encryptedKey);
      });
      storage.clear();
      // Restore persistent items
      Object.entries(persistentData).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value);
      });
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

// Export the appropriate storage implementation
export const storageManager = isElectron() ? electronStorage : webStorage;
if (isTryout) {
  Object.keys(tryoutData).forEach((key) => {
    storageManager.set(key, tryoutData[key]);
  });
}
