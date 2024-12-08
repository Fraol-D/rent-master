

const isElectron = () => {
  return window?.electron !== undefined;
};

const electronStorage = {
  get: (key) => {
    try {
      return window.electron.store.get(key);
    } catch (error) {
      console.error('Error reading from electron store:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      window.electron.store.set(key, value);
    } catch (error) {
      console.error('Error writing to electron store:', error);
    }
  },
};

const webStorage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  },
};

// Export the appropriate storage implementation
export const storageManager = isElectron() ? electronStorage : webStorage;
