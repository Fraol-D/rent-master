import CryptoJS from 'crypto-js';

// Toggle encryption on or off
const encryptData = true;

const secretKey = window.electron ? '':import.meta.env.VITE_ENCRYPTION_KEY;

const encrypt = (data) => {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
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
      const storedData = window.electron.store.get(key);
      return storedData;
    } catch (error) {
      console.error('Error reading from electron store:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      const dataToStore = value;
      window.electron.store.set(key, dataToStore);
    } catch (error) {
      console.error('Error writing to electron store:', error);
    }
  },
};

const webStorage = {
  get: (key) => {
    try {
      const storedData = localStorage.getItem(key);
      return encryptData ? decrypt(storedData) : JSON.parse(storedData);
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      const dataToStore = encryptData ? encrypt(value) : JSON.stringify(value);
      localStorage.setItem(key, dataToStore);
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
  }
};

// Export the appropriate storage implementation
export const storageManager = isElectron() ? electronStorage : webStorage;
