class StorageManager {
    constructor() {
      this.isElectron = Boolean(window.electron);
      this.webStorage = {
        get: (key) => {
          try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
          } catch (error) {
            console.warn(`Error reading ${key} from localStorage:`, error);
            return null;
          }
        },
        set: (key, value) => {
          try {
            localStorage.setItem(key, JSON.stringify(value));
          } catch (error) {
            console.error(`Error setting ${key} in localStorage:`, error);
          }
        }
      };
    }
  
    initialize() {
      if (this.isElectron) {
        // In Electron environment
        this.storage = {
          get: (key) => window.electron.store.get(key),
          set: (key, value) => window.electron.store.set(key, value)
        };
      } else {
        // In web environment
        this.storage = this.webStorage;
      }
  
      // If in Electron, provide web storage fallback
      if (this.isElectron) {
        window.electron.store.setImplementation(this.webStorage);
      }
    }
  
    get(key) {
      return this.storage.get(key);
    }
  
    set(key, value) {
      this.storage.set(key, value);
    }
  }
  
  export const storageManager = new StorageManager();
  storageManager.initialize();
  
  export const getFromStore = (key) => storageManager.get(key);
  export const setToStore = (key, value) => storageManager.set(key, value);