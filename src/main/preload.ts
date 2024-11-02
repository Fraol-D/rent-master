// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

export type Channels =
  | 'renderer-to-main'
  | 'SendVerificationCode'
  | 'yet-another-channel';

const electronHandler = {
  sendMessage: (channel: Channels, ...args: unknown[]) => {
    ipcRenderer.send(channel, ...args);
  },
  store: {
    get(key: any) {
      return ipcRenderer.sendSync('electron-store-get', key);
    },
    set(property: any, val: any) {
      ipcRenderer.send('electron-store-set', property, val);
    },
    // Other method you want to add like has(), reset(), etc.
  },
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    send: (channel: Channels, data: unknown[]) =>
      ipcRenderer.send(channel, data),
    invoke: (channel: string, ...args: any) =>
      ipcRenderer.invoke(channel, ...args),
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  showContextMenu: () => ipcRenderer.send('show-context-menu'),
  onContextMenuCommand: (callback) => ipcRenderer.on('context-menu-command', callback),
  update: {
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    install: () => ipcRenderer.invoke('install-update'),
    isReady: () => ipcRenderer.invoke('is-update-ready'),
  }
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
