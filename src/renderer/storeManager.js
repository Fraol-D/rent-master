import CryptoJS from 'crypto-js';
import { tryoutData } from './Project/TSX/Helpers/tryoutData';
// Toggle encryption on or off
const encryptData = true;
const isTryout = window.location.href.includes('tryout');
const secretKey = window.electron ? '' : import.meta.env.VITE_ENCRYPTION_KEY;
const secretKeyKEY = window.electron ? '' : import.meta.env.VITE_secretKeyKEY;

const encrypt = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
};

// Simple but secure key encryption using base64 and a salt
const encryptKey = (key) => {
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
      return storedData;
    } catch (error) {
      console.error('Error reading from electron store:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      const encryptedKey = encryptKey(key);
      const dataToStore = value;
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
      const storedData = localStorage.getItem(encryptedKey);
      return encryptData ? decrypt(storedData) : JSON.parse(storedData);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      const encryptedKey = encryptKey(key);
      const dataToStore = encryptData ? encrypt(value) : JSON.stringify(value);
      localStorage.setItem(encryptedKey, dataToStore);
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
  clear: () => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Export the appropriate storage implementation
export const storageManager = isElectron() ? electronStorage : webStorage;
if (isTryout) {
  Object.keys(tryoutData).forEach(key => {
    storageManager.set(key, tryoutData[key]);
  });
}