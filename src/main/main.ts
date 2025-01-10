import { storageManager } from '../renderer/storeManager';
import path from 'path';
import { app, BrowserWindow, shell, ipcMain, Menu } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { Console } from 'console';
import AdmZip from 'adm-zip';
import { dialog } from 'electron';
import mime from 'mime';
//const nodemailer = require('nodemailer');
const nodemailer = require('nodemailer');
const { translate, detectLanguage } = require('afrotranslate');
const Store = require('electron-store');
const store = new Store();
const getStoreValue = (key: string) => {
  return store.get(key);
};
// Replace console with electron-log
Object.assign(console, log);
// Capture renderer logs

const setStoreValue = (key: string, value: any) => {
  store.set(key, value);
};
ipcMain.on('electron-store-get', async (event, val) => {
  event.returnValue = getStoreValue(val);
});
ipcMain.on('electron-store-set', async (event, key, val) => {
  setStoreValue(key, val);
});

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    store.set('updateReady', false);
    autoUpdater.logger = log;

    // Disable auto downloading
    autoUpdater.autoDownload = false;

    // Set the GitHub configuration directly
    autoUpdater.setFeedURL({
      provider: 'github',
      owner: 'Doorlock06',
      repo: 'rentmaster',
      private: true,
      token: process.env.GH_TOKEN, // Make sure you have this set
    });

    // Handle update available with more info
    autoUpdater.on('update-available', (info) => {
      log.info('Update available:', info);
      // Store update info
      store.set('updateInfo', {
        available: true,
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
      });
      mainWindow?.webContents.send('update-available', {
        version: info.version,
        releaseNotes: info.releaseNotes,
        releaseDate: info.releaseDate,
        path: info.path,
      });
      autoUpdater.downloadUpdate();
    });

    // Add error logging
    autoUpdater.on('error', (err) => {
      log.error('Update error:', err);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      log.info(`Download progress: ${progressObj.percent}%`);
      // Store progress
      store.set('updateProgress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
      mainWindow?.webContents.send('download-progress', {
        percent: progressObj.percent,
        transferred: progressObj.transferred,
        total: progressObj.total,
        bytesPerSecond: progressObj.bytesPerSecond,
      });
    });

    // Handle update downloaded
    autoUpdater.on('update-downloaded', () => {
      log.info('Update downloaded');
      store.set('updateReady', true);
      mainWindow?.webContents.send('update-downloaded');
    });

    // Add this IPC handler
    ipcMain.on('restart-app', () => {
      autoUpdater.quitAndInstall(false, true);
    });

    // Check for updates
    try {
      autoUpdater.checkForUpdates().catch((err) => {
        log.error('Error checking for updates:', err);
      });
    } catch (err) {
      log.error('Error in update check:', err);
    }
  }
}

// Add this helper method to install updates
export function installUpdate() {
  autoUpdater.quitAndInstall(false, true);
}

let mainWindow: BrowserWindow | null = null;
let connectionCheckInterval: NodeJS.Timeout | null = null;
let lastHeartbeat = Date.now();
let debugLog: string[] = [];

function logDebug(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}`;
  debugLog.push(logMessage);
}

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  event.reply('ipc-example', msgTemplate('pong'));
});

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};
const os = require('os');
// Serve static files from the 'src/renderer' directory
// Add this near the top of main.ts
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  dialog.showErrorBox(
    'Critical Error',
    `An unexpected error occurred: ${error.message}\n\nThe application will try to restart.`
  );
  app.relaunch();
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Connection monitoring functions
function setupConnectionMonitoring(window: BrowserWindow) {
  if (!window) {
    logDebug('Setup failed: Window is null');
    return;
  }

  if (connectionCheckInterval) {
    logDebug('Clearing existing interval');
    clearInterval(connectionCheckInterval);
  }

  lastHeartbeat = Date.now();
  logDebug('Connection monitoring setup started');
}

function cleanupConnectionMonitoring() {
  if (connectionCheckInterval) {
    clearInterval(connectionCheckInterval);
    connectionCheckInterval = null;
  }
}

const createWindow = async () => {
  if (isDebug) {
    // await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };
  // Load the previous window state or use default values
  const windowState = store.get('windowState', {
    width: 1024,
    height: 728,
    x: undefined,
    y: undefined,
    FullScreen: false,
  });

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } =
    primaryDisplay.workAreaSize;

  let finalWidth = windowState.width;
  let finalHeight = windowState.height;
  let finalX = windowState.x;
  let finalY = windowState.y;

  if (windowState.x >= screenWidth && screen.getAllDisplays().length === 1) {
    finalWidth = Math.min(windowState.width, screenWidth);
    finalX = Math.floor((screenWidth - finalWidth) / 2);
    finalY = Math.floor((screenHeight - finalHeight) / 2);
  }

  if (finalX >= 1800) {
    finalX = 0;
  }
  mainWindow = new BrowserWindow({
    show: false,
    width: finalWidth,
    height: finalHeight,
    fullscreen: windowState.FullScreen,
    x: finalX,
    y: finalY,
    icon: getAssetPath('icon.png'),
    autoOpenDevTools: false,
    title: `RentMaster v${app.getVersion()}`,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    autoHideMenuBar: true,
  }).on('error', (error) => {
    console.error('Window creation error:', error);
  });

  // Add error handler for window load
  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      console.error('Window failed to load:', errorDescription);
      dialog.showErrorBox(
        'Application Error',
        `Failed to load the application: ${errorDescription}`
      );
    }
  );
  Menu.setApplicationMenu(null);
  try {
    mainWindow.loadURL(resolveHtmlPath('index.html'));
  } catch (error) {
    console.error('Error loading main window:', error);
  }
  // Get the PC name

  mainWindow.on('ready-to-show', () => {
    try {
      if (!mainWindow) {
        throw new Error('"mainWindow" is not defined');
      }

      if (process.env.START_MINIMIZED) {
        mainWindow.minimize();
      } else {
        mainWindow.show();
      }
    } catch (error: any) {
      console.log(error);
    }
  });

  // Modify the window close handler
  mainWindow.on('close', async (e) => {
    console.log('Close event triggered');
    if (dev) return;
    // Immediately prevent closing
    e.preventDefault();

    if (!mainWindow) {
      console.log('No mainWindow, allowing close');
      return;
    }

    try {
      // Save window state
      const { width, height } = mainWindow.getBounds();
      store.set('windowState', {
        width,
        height,
        x: mainWindow.getPosition()[0],
        y: mainWindow.getPosition()[1],
        FullScreen: mainWindow.isFullScreen(),
      });
      console.log('Window state saved');

      // Check conditions
      const isOnline = await mainWindow.webContents.executeJavaScript(
        'navigator.onLine'
      );
      console.log('Is online:', isOnline);

      const hasChanges = await hasOfflineChanges();
      console.log('Has changes:', hasChanges);

      if (isOnline && hasChanges) {
        console.log('Showing dialog');
        const choice = await dialog.showMessageBox(mainWindow, {
          type: 'question',
          buttons: [
            'Upload Changes then Keep Working',
            'Upload Changes then Close App',
            'Close Anyway',
            'Cancel',
          ],
          defaultId: 1,
          title: 'Unuploaded Changes',
          message:
            'There are offline changes that can be uploaded. Would you like to upload before closing?',
          detail:
            'Your changes will remain in the on your local pc if you choose "Close Anyway".',
          noLink: true, // Prevents the dialog from closing when clicking outside
        });

        console.log('Dialog response:', choice.response);

        switch (choice.response) {
          case 0: // Upload & Keep Working
            console.log('Syncing changes and keeping app open');
            try {
              await mainWindow.webContents.executeJavaScript(`
                (async () => {
                  try {
                    await window.handleUploadChanges();
                    return true;
                  } catch (error) {
                    console.error('Upload error:', error);
                    return false;
                  }
                })()
              `);
              console.log('Sync complete, keeping app open');
            } catch (error) {
              console.error('Sync error:', error);
              dialog.showMessageBox(mainWindow, {
                type: 'error',
                title: 'Sync Error',
                message: 'Failed to upload changes. You can try again later.',
                buttons: ['OK'],
              });
            }
            break;

          case 1: // Upload & Close
            console.log('Syncing changes and closing');
            try {
              const success = await mainWindow.webContents.executeJavaScript(`
                (async () => {
                  try {
                    await window.handleUploadChanges();
                    return true;
                  } catch (error) {
                    console.error('Upload error:', error);
                    return false;
                  }
                })()
              `);

              if (success) {
                console.log('Sync complete, closing app');
                mainWindow.destroy();
              } else {
                const retryChoice = await dialog.showMessageBox(mainWindow, {
                  type: 'error',
                  buttons: ['Try Again', 'Close Anyway'],
                  defaultId: 0,
                  title: 'Sync Failed',
                  message:
                    'Failed to upload changes. Would you like to try again?',
                });

                if (retryChoice.response === 1) {
                  mainWindow.destroy();
                }
              }
            } catch (error) {
              console.error('Sync error:', error);
              mainWindow.destroy();
            }
            break;

          case 2: // Close Without Uploading
            console.log('Closing without upload');
            mainWindow.destroy();
            break;

          case 3: // Cancel
            console.log('Cancelled close');
            break;

          default:
            console.log('Dialog closed, keeping app open');
            break;
        }
      } else {
        console.log('No changes or offline, closing directly');
        mainWindow.destroy();
      }
    } catch (error) {
      console.error('Error in close handler:', error);
      mainWindow.destroy();
    }
  });

  // Add this to handle the actual window destruction
  mainWindow.on('closed', () => {
    console.log('Window closed event');
    cleanupConnectionMonitoring();
    mainWindow = null;
  });

  // Add this to handle app quit
  app.on('before-quit', (e) => {
    console.log('Before quit event');
    if (mainWindow) {
      e.preventDefault();
      mainWindow.close();
    }
  });
  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  new AppUpdater();

  // Initialize monitoring after window is ready
  mainWindow.webContents.on('did-finish-load', () => {
    setupConnectionMonitoring(mainWindow);
  });

  // Add these near other IPC handlers
  ipcMain.handle('check-for-updates', async () => {
    return autoUpdater.checkForUpdates();
  });

  ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  ipcMain.handle('is-update-ready', () => {
    return store.get('updateReady', false);
  });

  // Add diagnostic IPC handlers
  ipcMain.handle('get-connection-logs', () => {
    return debugLog;
  });

  // Add error handlers for the window
  mainWindow.webContents.on('crashed', (event) => {
    logDebug('Renderer process crashed');
    console.error('Renderer crashed:', event);
  });

  mainWindow.on('unresponsive', () => {
    logDebug('Window became unresponsive');
  });

  mainWindow.webContents.on(
    'did-fail-load',
    (event, errorCode, errorDescription) => {
      logDebug(`Page failed to load: ${errorDescription} (${errorCode})`);
    }
  );
};

app.on('window-all-closed', () => {
  cleanupConnectionMonitoring();
  if (process.platform !== 'darwin') {
    app.quit();
  }
}); // Add this function to check offline changes

ipcMain.handle('os-info', () => {
  const userInfo = os.userInfo();
  const pcName = os.hostname();
  const platform = os.platform();
  const architecture = os.arch();
  const cpuInfo = os.cpus();
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const homeDirectory = os.homedir();

  return {
    userInfo,
    pcName,
    platform,
    architecture,
    cpuInfo,
    totalMemory,
    freeMemory,
    homeDirectory,
  };
});
app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });

    // Check for backup on app start
    if (store.get('users'))
      if (store.get('users')[0])
        if (store.get('users')[0].allowed === 1) checkAndCreateBackup();
    ipcMain.on('reload-app', () => {
      reloadApp();
    });
    // Set up daily check for backup
    setInterval(checkAndCreateBackup, 24 * 60 * 60 * 1000);
  })
  .catch(console.log);
import { v4 as uuidv4 } from 'uuid';
// Sending verification codes
ipcMain.on('SendCustomEmail', async (event, message) => {
  console.log('Send custom email:', message.to, message.subject, message.body);

  const sendEmail = async (
    email: any,
    subject: any,
    text: any,
    userEmail: any,
    userPassword: any
  ) => {
    // Prepare data for API call
    const data = {
      email: email,
      subject: subject,
      text: text,
      user: {
        email: userEmail,
        password: userPassword,
      },
    };

    try {
      // Call the API to send the email
      const response = await axios.post(`${baseUrl}/api/send-email`, data);
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  try {
    const result = await sendEmail(
      message.to,
      message.subject,
      message.body,
      message.userEmail,
      message.userPassword
    );
    if (result.success) {
      event.reply('SendCustomEmailResponse', {
        success: true,
        message: 'Email sent successfully',
      });
    } else {
      event.reply('SendCustomEmailResponse', {
        success: false,
        message: 'Failed to send email',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Error while sending email:', error);
    event.reply('SendCustomEmailResponse', {
      success: false,
      message: 'Failed to send email',
      error: error.message,
    });
  }
});
ipcMain.on('SendVerificationCode', (event, message) => {
  console.log('Send verfication code:', message.to, message.code);
  async function sendVerificationEmail(to: any, code: any) {
    let transporter = nodemailer.createTransport({
      host: 'mail.markethubet.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.VITE_VERIFY_EMAIL_USER,
        pass: process.env.VITE_VERIFY_EMAIL_PASS,
      },
    });

    let mailOptions = {
      from: process.env.VITE_VERIFY_EMAIL_USER,
      to: to,
      subject: 'Email Verification',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
         
          body,
          h1,
          p {
            margin: 0;
            padding: 0;
          }
      
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            background-color: #f5f5f5;
          }
      
          .container {
            max-width: 600px;
            margin: 20px auto;
            padding: 20px;
            background-color: #ffffff;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          }
      
          h1 {
            font-size: 24px;
            color: #333333;
            margin-bottom: 10px;
          }
      
          p {
            font-size: 16px;
            color: #666666;
            margin-bottom: 20px;
          }
      
          .verification-code {
            margin-bottom: 30px;
          }
      
          .btn {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: #ffffff;
            text-decoration: none;
            border-radius: 4px;
          }
      
          .footer {
            margin-top: 20px;
            border-top: 1px solid #cccccc;
            padding-top: 20px;
          }
      
          .footer p {
            margin-bottom: 10px;
          }
      
          .footer a {
            color: #007bff;
            text-decoration: none;
            margin-right: 10px;
          }
        </style>
        </head>
        <body>
          <div class="container">
            <h1>Email Verification</h1>
            <p>Thank you for signing up with RentMaster. Please verify your email address to complete your registration.</p>
            <p class="verification-code"><strong>Your Verification Code:</strong> <span style="font-weight: bold; font-size: 18px;">${code}</span></p>
            <a href="#" class="btn">Verify Email</a>
            <div class="footer">
              <p>Contact us at <a href="mailto:support@markethubet.com">support@markethubet.com</a> for assistance.</p>
              <p>Visit our website: <a href="https://www.rentmaster.markethubet.com">www.markethubet.com</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    try {
      let info = await transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error while sending email:', error);
    }
  }
  sendVerificationEmail(message.to, message.code);
});
// Server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const fs = require('fs');

const appDB = express();
appDB.use(express.static(path.join(__dirname, 'src/renderer')));

const port = 8100;
const dev = false;
const appname = dev ? 'Electron' : 'rent-master';
appDB.use(
  cors({
    origin: ['http://localhost:1212', 'https://www.rentmaster.markethubet.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'user-id'],
    credentials: true,
  })
);
appDB.use(bodyParser.json({ limit: '50mb' }));
appDB.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

appDB.use(cors({ origin: '*' }));
appDB.use(bodyParser.urlencoded({ extended: false }));
appDB.use(bodyParser.json());

// To:
require('dotenv').config({
  path: path.resolve(__dirname, '../../.env'),
});
const apiKey = process.env.VITE_AppCodeElectronString; // Add VITE_ prefix

// Function to validate table names
const validateTableName = (tableName: string) => {
  //return validTables.includes(tableName);
  return true;
};
// Table structures based on the provided types
const tableStructures = [
  {
    name: 'users',
    columns: [
      'id TEXT PRIMARY KEY',
      'Allowed INTEGER ',
      'email TEXT ',
      'phoneNumber TEXT ',
      'fullName TEXT ',
      'password TEXT ',
      'companyName TEXT ',
      'maxNumberOfBranches INTEGER  DEFAULT 3',
      'packageType TEXT  DEFAULT "Free"',
      'TrailEndDate INTEGER  DEFAULT 1',
    ],
  },
  {
    name: 'branches',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT',
      'location TEXT',
      'description TEXT',
      'googleMapPinPoint TEXT',
      'userId TEXT',
    ],
  },
  {
    name: 'rooms',
    columns: [
      'id TEXT PRIMARY KEY',
      'floor INTEGER ',
      'roomIndex INTEGER ',
      'status TEXT ',
      'price REAL DEFAULT 0',
      'AgreedPrice REAL DEFAULT 0',
      'PaymentCycleType TEXT ',
      'paymentShowAmount INTEGER DEFAULT 1',
      'PaymentCycleCustomeDays INTEGER',
      'squareMeters REAL DEFAULT 0',
      'tenantId TEXT',
      'AddTenantState BOOLEAN',
      'ViewAgreement BOOLEAN',
      'ShowPayTimeLine BOOLEAN',
      'selectedAgreementId TEXT',
      'Archived BOOLEAN DEFAULT 0',
      'notificationSettings INTEGER DEFAULT 0',
      'utilityPaymentEvery TEXT DEFAULT 30',
      'utilityPaymentEveryCustom INTEGER DEFAULT 0',
      'utilityPaymentStartDate INTEGER DEFAULT 0',
      'utilityPaymentUseDifferentStartDate BOOLEAN DEFAULT 0',
      'UtilityNotificationSettings INTEGER DEFAULT 0',
      'Currency TEXT DEFAULT "ETB"',
      'useTenantPortal BOOLEAN DEFAULT 0',
      'TenantPortalShowTenantDetails BOOLEAN DEFAULT 0',
      'TenantPortalShowReceipts BOOLEAN DEFAULT 0',
      'TenantPortalAllowOnlinePayments BOOLEAN DEFAULT 0',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'room_specifications',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT ',
      'Detail TEXT ',
      'Number REAL DEFAULT 0',
      'type TEXT ',
      'Boolean BOOLEAN',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'tenants',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT ',
      'phoneNumber TEXT ',
      'phoneNumber2 TEXT',
      'email TEXT',
      'description TEXT ',
      'SelectedAgreement TEXT ',
      'RentingOrOut BOOLEAN ',
      'startTime INTEGER ', // Assuming storing as UNIX timestamp
      'endTime INTEGER',
      'agreedPrice REAL DEFAULT 0',
      'TIN TEXT',
      'RentReason TEXT',
      'AddedTime INTEGER',
      'Currency TEXT DEFAULT "ETB"',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'room_pay_info',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT ',
      'tenantId TEXT ',
      'Day INTEGER ', // Assuming storing as UNIX timestamp
      'Paid BOOLEAN ',
      'Value REAL DEFAULT 0',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },

  {
    name: 'room_pay_info_history',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT',
      'Day INTEGER',
      'Value REAL',
      'Paid INTEGER',
      'userId TEXT',
      'branchId TEXT', // Added
      'agreementId TEXT',
      'tenantId TEXT ',
    ],
  },
  {
    name: 'brokers',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT ',
      'phoneNumber TEXT ',
      'phoneNumber2 TEXT',
      'email TEXT',

      'AddedTime INTEGER ',
      'AgreedCommission TEXT ',
      'rating REAL DEFAULT 0',
      'notes TEXT',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'brokersRecommendationList',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT',
      'brokerId TEXT ',
      'recommendedTenantId TEXT ',
      'AddedTime INTEGER ',
      'AgreedCommission INTEGER ',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'PastTenantsForRoom',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT',
      'brokerId TEXT',
      'tenantId TEXT',
      'enterDate INTEGER',
      'exitDate INTEGER',
      'totalEarnings INTEGER',
      'paymentCycleType TEXT',
      'AgreedPrice INTEGER',
      'AgreedCommission INTEGER ',
      'Stars INTEGER ',
      'description TEXT ',
      'endReason TEXT ',
      'Currency TEXT DEFAULT "ETB"',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'agreements',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT',
      'tenantId TEXT',
      'startTime INTEGER',
      'endTime INTEGER',
      'signTime INTEGER',
      'agreedPrice REAL DEFAULT 0',
      'paymentCycleType TEXT',
      'Memo TEXT',
      'RentReserved REAL DEFAULT 0',
      'representative TEXT',
      'Currency TEXT DEFAULT "ETB"',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'offline_changes',
    columns: [
      'id TEXT PRIMARY KEY',
      'type TEXT',
      'columnName TEXT',
      'rowId TEXT',
      'newValue TEXT',
      'tableName TEXT',
      'addedJsonData TEXT',
      'originalValue TEXT',
    ],
  },
  {
    name: 'email_templates',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT',
      'subject TEXT',
      'body TEXT',
      'created_at REAL DEFAULT 0',
      'updated_at REAL DEFAULT 0',
      'userId TEXT',
    ],
  },
  {
    name: 'sms_templates',
    columns: [
      'id TEXT PRIMARY KEY',
      'name TEXT',
      'body TEXT',
      'created_at REAL DEFAULT 0',
      'updated_at REAL DEFAULT 0',
      'userId TEXT',
    ],
  },
  {
    name: 'notification_template_selections',
    columns: [
      'id TEXT PRIMARY KEY',
      'notification_type TEXT',
      'email_template_id TEXT',
      'sms_template_id TEXT',
      'userId  TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'utility_payments_settings',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT',
      'type TEXT',
      'useThis BOOLEAN',
      'price REAL DEFAULT 0',
      'alwaysAsk BOOLEAN',
      'Currency TEXT DEFAULT "ETB"',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'utility_payments',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT',
      'type TEXT',
      'price REAL DEFAULT 0',
      'custom BOOLEAN',
      'Currency TEXT DEFAULT "ETB"',
      'paid BOOLEAN',
      'date INTEGER',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
  {
    name: 'expenses',
    columns: [
      'id TEXT PRIMARY KEY',

      'fullBuilding BOOLEAN',
      'floor INTEGER',
      'room INTEGER',
      'name TEXT',
      'description TEXT',

      'doesReoccur BOOLEAN',
      'recurringCycle INTEGER',
      'price REAL DEFAULT 0',
      'recurringType TEXT',
      'EndDate INTEGER',
      'HasEndDate BOOLEAN',
      'date INTEGER',
      'userId TEXT',
      'branchId TEXT',

      // New notification fields
      'sendEmail BOOLEAN DEFAULT 0',

      'emailDaysBefore INTEGER DEFAULT 0',
      'sendSms BOOLEAN DEFAULT 0',

      'smsDaysBefore INTEGER DEFAULT 0',
      'emailTo TEXT',
      'smsTo TEXT',
      'Currency TEXT DEFAULT "ETB"',
      'category TEXT DEFAULT "Other"',
      'beforeTax BOOLEAN DEFAULT 0',
    ],
  },

  {
    name: 'action_history',
    columns: [
      'id TEXT PRIMARY KEY',
      'action_table TEXT',
      'action_type TEXT',
      'description TEXT',
      'performed_by TEXT',
      'action_date INTEGER',
      'userInfo TEXT',
      'userId TEXT',
      'branchId TEXT', // Added
    ],
  },
];

// Function to initialize tables
const initializeTables = (db: any) => {
  tableStructures.forEach((table) => {
    const { name, columns } = table;
    db.get(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
      [name],
      (err: any, row: any) => {
        if (err) {
          console.error(`Error checking if table ${name} exists:`, err);
        } else if (row) {
          console.log(
            `Table ${name} already exists. Checking table structure.`
          );
          checkAndUpdateTableStructure(db, table);
        } else {
          const createTableQuery = `CREATE TABLE ${name} (${columns.join(
            ', '
          )})`;
          db.run(createTableQuery, (err: any) => {
            if (err) {
              console.error(`Failed to create table ${name}`, err);
            } else {
              console.log(`Table ${name} initialized.`);
            }
          });
        }
      }
    );
  });
};
import https from 'https';
import axios from 'axios';
const secureAgent = new https.Agent({
  secureProtocol: 'TLS_method',
  rejectUnauthorized: false,
});
import FormData from 'form-data';

const baseUrl = 'https://www.rentmaster.markethubet.com/api';

// Add IPC handler for secure HTTPS agent configuration
ipcMain.handle('get-https-agent', () => {
  try {
    const agent = new https.Agent({
      secureProtocol: 'TLS_method',
      rejectUnauthorized: false,
    });
    return agent;
  } catch (error) {
    console.error('Error creating HTTPS agent:', error);
    throw error;
  }
});

// Function to check and update table structure
const checkAndUpdateTableStructure = (
  db: { all: (arg0: string, arg1: (error: any, rows: any) => void) => void },
  table: { name: any; columns: any }
) => {
  db.all(`PRAGMA table_info(${table.name})`, (error: any, rows: any[]) => {
    if (error) {
      console.error('Error checking table structure:', error);
    } else {
      const existingColumns = rows.map((row: { name: any }) => row.name);
      const requiredColumns = table.columns.map(
        (column: string) => column.split(' ')[0]
      );
      const missingColumns = requiredColumns.filter(
        (column: any) => !existingColumns.includes(column)
      );

      if (missingColumns.length > 0) {
        console.log(
          `Table ${table.name} structure needs updating. Missing columns:`,
          missingColumns
        );
        updateTableStructure(db, table, missingColumns);
      } else {
        console.log(`Table ${table.name} structure is up to date.`);
      }
    }
  });
};
appDB.use(
  (
    req: any,
    res: { header: (arg0: string, arg1: string) => void },
    next: () => void
  ) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, x-api-key'
    );
    next();
  }
);
// Function to update table structure

const updateTableStructure = (
  db: any,
  table: { columns: any[]; name: any },
  missingColumns: any[]
) => {
  db.serialize(() => {
    db.run(`BEGIN TRANSACTION`);
    missingColumns.forEach((column: any) => {
      const columnDefinition = table.columns.find((col: string) =>
        col.startsWith(column)
      );
      db.run(
        `ALTER TABLE ${table.name} ADD COLUMN ${columnDefinition}`,
        (error: any) => {
          if (error) {
            console.error(
              `Error adding column ${column} to table ${table.name}:`,
              error
            );
          } else {
            console.log(`Added column ${column} to table ${table.name}`);
          }
        }
      );
    });
    db.run(`COMMIT`);
    console.log(`Table ${table.name} structure updated successfully.`);
  });
};
// Add helper for reading files

const NodeClam = require('clamscan');
const JSZip = require('jszip');
const fs2 = require('fs').promises;
const mime2 = require('mime-types');

const ClamScan = new NodeClam().init({
  removeInfected: false, // Set to false if you don't want to remove infected files
  quarantineInfected: '/path/to/quarantine',
  scanRecursively: true,
  clamscan: {
    path: '/usr/bin/clamscan',
    db: '/var/lib/clamav',
  },
});

// Initialize the ClamScan object
ClamScan.then((clamscan: any) => {
  // ClamScan is now initialized and can be used
  // You can use clamscan.isInfected(filePath) as shown below
}).catch((err: any) => {
  console.error('Error initializing ClamScan:', err);
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const allowedFileTypes = [
  'image/jpeg',
  'image/png',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Allowed folders for files: 'Room Pictures' and 'Room Documents'
const allowedFolders = ['Room Pictures', 'Room Documents'];

function isAllowedFileSize(file: { size: any }) {
  return file.size <= MAX_FILE_SIZE;
}

function isAllowedFileType(file: { type: any }) {
  return allowedFileTypes.includes(file.type);
}

async function isFileClean(filePath: any) {
  try {
    const clamscan = await ClamScan;
    const { isInfected, viruses } = await clamscan.isInfected(filePath);
    if (isInfected) {
      console.log(`Virus detected in file ${filePath}: ${viruses}`);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error scanning file:', error);
    return false;
  }
}
appDB.use(
  cors({
    origin: ['http://localhost:1212', 'https://www.rentmaster.markethubet.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key', 'User-ID'],
    credentials: true,
  })
);
// Add this middleware before your routes
appDB.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }));

appDB.options('/extract-downloaded-files', cors());

appDB.post(
  '/extract-downloaded-files',
  async (
    req: { body: any },
    res: {
      json: (arg0: { message: string }) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string; details: any }): void; new (): any };
      };
    }
  ) => {
    try {
      console.log('Received zip file for extraction');
      const zipBuffer = req.body;
      const zip = new JSZip();
      await zip.loadAsync(zipBuffer);

      const appDataPath =
        process.env.APPDATA ||
        (process.platform == 'darwin'
          ? process.env.HOME + '/Library/Preferences'
          : process.env.HOME + '/.local/share');
      const basePath = path.join(appDataPath, appname);
      console.log('Base extraction path:', basePath);

      for (const [filePath, file] of Object.entries(zip.files)) {
        const fullPath = path.join(basePath, filePath);
        console.log('Processing:', filePath);

        if (file.dir) {
          console.log('Creating directory:', fullPath);
          await fs2.mkdir(fullPath, { recursive: true });
        } else {
          console.log('Extracting file:', fullPath);
          const content = await file.async('nodebuffer');
          await fs2.mkdir(path.dirname(fullPath), { recursive: true });
          await fs2.writeFile(fullPath, content);
        }
      }

      console.log('Extraction completed successfully');
      res.json({ message: 'Files extracted successfully' });
    } catch (error) {
      console.error('Error during extraction:', error);
      res
        .status(500)
        .json({ error: 'Failed to extract files', details: error.message });
    }

    //Just download zip
    /*try {
    console.log('Received zip file for saving');
    const zipBuffer = req.body;

    const appDataPath =
      process.env.APPDATA ||
      (process.platform == 'darwin'
        ? process.env.HOME + '/Library/Preferences'
        : process.env.HOME + '/.local/share');
    const basePath = path.join(appDataPath, appname);
    const zipFilePath = path.join(basePath, 'downloaded_files.zip');

    console.log('Saving zip file to:', zipFilePath);
    await fs2.writeFile(zipFilePath, zipBuffer);

    console.log('Zip file saved successfully');
    res.json({ message: 'Zip file saved successfully', path: zipFilePath });
  } catch (error) {
    console.error('Error saving zip file:', error);
    res
      .status(500)
      .json({ error: 'Failed to save zip file', details: error.message });
  }*/
  }
);

// Add these constants but keep existing ones
const UPLOAD_TIMEOUT = 60000;

ipcMain.handle(
  'upload-user-files',
  async (event, { userId }: { userId: string }) => {
    try {
      let currentProgress = 0;
      const smoothProgress = (targetProgress: number) => {
        const step = 0.5;
        const interval = setInterval(() => {
          if (currentProgress < targetProgress) {
            currentProgress += step;
            event.sender.send('upload-progress', currentProgress);
          } else {
            clearInterval(interval);
          }
        }, 16); // ~60fps
      };

      smoothProgress(5);
      console.log('Getting local directory...');
      const getLocalUserDirectory2 = async () => {
        const userDataPath = process.env.APPDATA || app.getPath('userData');
        const bmsFolderPath = path.join(userDataPath, appname);

        function directoryToJson(dir: string) {
          const result = {
            name: path.basename(dir),
            type: 'directory',
            children: [],
          };
          const files = fs.readdirSync(dir, { withFileTypes: true });

          files.forEach((file: { name: string; isDirectory: () => any }) => {
            const filePath = path.join(dir, file.name);
            if (file.isDirectory()) {
              result.children.push(directoryToJson(filePath));
            } else {
              result.children.push({ name: file.name, type: 'file' });
            }
          });

          return result;
        }

        try {
          const directoryStructure = directoryToJson(bmsFolderPath);
          return directoryStructure;
        } catch (error) {
          console.error('Error reading directory structure:', error);
          return null;
        }
      };

      const localDirectory = await getLocalUserDirectory2();
      const filteredDirectory = {
        name: localDirectory.name,
        type: 'directory',
        children: localDirectory.children.filter((child) =>
          ['Room Pictures', 'Room Documents'].includes(child.name)
        ),
      };

      console.log(
        'Filtered directory structure:',
        JSON.stringify(filteredDirectory, null, 2)
      );
      smoothProgress(15);

      console.log('Sending directory data to online database...');
      const checkResponse = await axios.post(
        `${baseUrl}/check-user-directory`,
        {
          userId,
          directory: filteredDirectory,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          httpsAgent: secureAgent,
        }
      );

      const { requiredFiles } = checkResponse.data;
      console.log('Response received from online database:', requiredFiles);
      smoothProgress(25);

      if (requiredFiles?.length > 0) {
        console.log('Required files missing:', requiredFiles);

        const zip = new JSZip();
        let totalSize = 0;
        let processedSize = 0;

        // First pass to calculate total size
        for (const filePath of requiredFiles) {
          if (
            filePath.startsWith('Room Pictures/') ||
            filePath.startsWith('Room Documents/')
          ) {
            const fullPath = path.join(process.env.APPDATA || '', appname, filePath);
            if (fs.existsSync(fullPath)) {
              const stats = fs.statSync(fullPath);
              totalSize += stats.size;
            }
          }
        }

        // Second pass to add files and update progress
        for (const filePath of requiredFiles) {
          try {
            if (
              !filePath.startsWith('Room Pictures/') &&
              !filePath.startsWith('Room Documents/')
            ) {
              console.log('Skipping non-room file:', filePath);
              continue;
            }

            const fullPath = path.join(
              process.env.APPDATA || '',
              appname,
              filePath
            );
            if (fs.existsSync(fullPath)) {
              const fileContent = fs.readFileSync(fullPath);
              zip.file(filePath, fileContent);
              processedSize += fileContent.length;
              
              // Calculate progress between 25-85 based on processed size
              const fileProgress = 25 + ((processedSize / totalSize) * 60);
              smoothProgress(fileProgress);
            } else {
              console.warn(`File not found: ${fullPath}`);
            }
          } catch (error) {
            console.warn(`Error adding file ${filePath} to zip:`, error);
          }
        }

        console.log(`Total upload size: ${totalSize} bytes`);
        smoothProgress(85);

        if (totalSize === 0) {
          console.log('No valid files to upload');
          smoothProgress(100);
          return {
            success: true,
            message: 'No files needed to be uploaded',
          };
        }

        const zipBuffer = await zip.generateAsync({ 
          type: 'nodebuffer',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 },
          onUpdate: (metadata) => {
            // Progress during zip compression (85-90)
            const compressionProgress = 85 + (metadata.percent * 0.05);
            smoothProgress(compressionProgress);
          }
        });

        console.log('Sending zip file to online database...');
        const form = new FormData();
        form.append('files', zipBuffer, {
          filename: 'required_files.zip',
          contentType: 'application/zip',
        });
        form.append('userId', userId);
        
        smoothProgress(90);
        
        const uploadResponse = await axios.post(
          `${baseUrl}/upload-missing-files`,
          form,
          {
            headers: {
              'x-api-key': apiKey,
              ...form.getHeaders(),
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            httpsAgent: secureAgent,
            onUploadProgress: (progressEvent) => {
              // Progress during final upload (90-100)
              const uploadProgress = 90 + ((progressEvent.loaded / progressEvent.total) * 10);
              smoothProgress(uploadProgress);
            }
          }
        );

        if (!uploadResponse.data?.success) {
          throw new Error('Upload response indicated failure');
        }

        console.log('Upload completed successfully:', uploadResponse.data);
        smoothProgress(100);
      } else {
        console.log('No files need to be uploaded');
        smoothProgress(100);
      }

      return {
        success: true,
        message: 'Upload completed successfully',
      };
    } catch (error) {
      console.error('Upload error:', error);

      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.message || error.message;
        const statusCode = error.response?.status;
        return {
          success: false,
          message: `Upload failed (${statusCode}): ${errorMessage}`,
          error: {
            status: statusCode,
            data: error.response?.data,
          },
        };
      }

      return {
        success: false,
        message: error.message || 'Unknown error occurred',
      };
    }
  }
);

// Add helper function for retrying uploads
const retryUpload = async (
  uploadFn: () => Promise<any>,
  maxRetries = 3
): Promise<any> => {
  let lastError;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      console.error(`Upload attempt ${attempt + 1} failed:`, error);
      lastError = error;

      if (attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

// Add error handling for the existing prepare-upload-files endpoint
appDB.post('/prepare-upload-files', async (req, res) => {
  const { userId, requiredFiles } = req.body;

  try {
    const zip = new JSZip();
    let totalSize = 0;

    for (const filePath of requiredFiles) {
      try {
        const fullPath = path.join(process.env.APPDATA, appname, filePath);

        if (
          !(await fs2
            .access(fullPath)
            .then(() => true)
            .catch(() => false))
        ) {
          console.warn(`File not found: ${fullPath}`);
          continue;
        }

        const fileStats = await fs2.stat(fullPath);
        if (fileStats.size === 0) {
          console.warn(`Empty file skipped: ${filePath}`);
          continue;
        }

        const fileContent = await fs2.readFile(fullPath);
        zip.file(filePath, fileContent);
        totalSize += fileContent.length;
      } catch (error) {
        console.error(`Error processing file ${filePath}:`, error);
      }
    }

    if (totalSize === 0) {
      return res.send(null);
    }

    const zipContent = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    res.send(zipContent);
  } catch (error) {
    console.error('Error preparing files for upload:', error);
    res.status(500).json({
      error: 'Failed to prepare files for upload',
      details: error.message,
    });
  }
});

appDB.get(
  '/local-user-directory',
  (
    req: any,
    res: {
      json: (arg0: { name: string; type: string; children: never[] }) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
    }
  ) => {
    const userDataPath = process.env.APPDATA || app.getPath('userData');
    const bmsFolderPath = path.join(userDataPath, appname);

    function directoryToJson(dir: string) {
      const result = {
        name: path.basename(dir),
        type: 'directory',
        children: [],
      };
      const files = fs.readdirSync(dir, { withFileTypes: true });

      files.forEach((file: { name: string; isDirectory: () => any }) => {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          result.children.push(directoryToJson(filePath));
        } else {
          result.children.push({ name: file.name, type: 'file' });
        }
      });

      return result;
    }

    try {
      const directoryStructure = directoryToJson(bmsFolderPath);
      res.json(directoryStructure);
    } catch (error) {
      console.error('Error reading directory structure:', error);
      res.status(500).json({ error: 'Failed to read directory structure' });
    }
  }
);

appDB.delete(
  '/deleteAll/:tableName',
  (
    req: { params: { tableName: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): void; new (): any };
      };
      json: (arg0: { message: string }) => void;
    }
  ) => {
    const { tableName } = req.params;
    db.run(`DELETE FROM ${tableName}`, (err: any) => {
      if (err) {
        console.error(err);
        res.status(500).send('Error deleting data from table');
      } else {
        res.json({ message: `All data deleted from ${tableName}` });
      }
    });
  }
);
appDB.delete(
  '/drop-all-rows/:tableName',
  (
    req: { params: { tableName: any }; headers: { [x: string]: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): void; new (): any };
      };
      send: (arg0: string) => void;
    }
  ) => {
    const { tableName } = req.params;

    // Validate the table name
    if (!validateTableName(tableName)) {
      return res.status(400).send('Invalid table name');
    }

    const query = `DELETE FROM ${tableName}`;
    db.run(query, (err: { message: any }) => {
      if (err) {
        console.error(`Error dropping all rows from ${tableName}:`, err);
        res
          .status(500)
          .send(`Error dropping all rows from ${tableName}: ${err.message}`);
      } else {
        res.send(`All rows dropped from ${tableName} successfully.`);
      }
    });
  }
);
//----------------------------------File stuff
appDB.post(
  '/upload-receipt-document',
  (
    req: {
      body: {
        base64Document: any;
        fileName: any;
        roomId: any;
        tenantName: any;
        tenantId: any;
        formattedDate: any;
        AddedTimeText: any;
      };
    },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string; details?: any }): void; new (): any };
      };
      json: (arg0: {
        message: string;
        fileName: any;
        filePath: string;
      }) => void;
    }
  ) => {
    try {
      const {
        base64Document,
        fileName,
        roomId,
        tenantName,
        tenantId,
        formattedDate,
        AddedTimeText,
      } = req.body;
      if (
        !base64Document ||
        !fileName ||
        !roomId ||
        !tenantName ||
        !tenantId ||
        !formattedDate ||
        !AddedTimeText
      ) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const base64Data = base64Document.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const dirPath = path.join(
        process.env.APPDATA || '',
        appname || '',
        'Room Documents',
        roomId,
        `${tenantName}, ${AddedTimeText}, ${tenantId}`,
        'receipts'
      );

      fs.mkdirSync(dirPath, { recursive: true });
      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, buffer);

      res.json({
        message: 'Receipt document uploaded successfully',
        fileName,
        filePath,
      });
    } catch (error) {
      console.error('Error uploading receipt document:', error);
      res.status(500).json({
        error: 'Failed to upload receipt document',
        details: error.message,
      });
    }
  }
);
appDB.post(
  '/upload-tenant-documentV2',
  (
    req: {
      body: {
        base64Document: any;
        fileName: any;
        roomId: any;
        tenantName: any;
        tenantId: any;
        AddedTimeText: any;
      };
    },
    res: {
      json: (arg0: {
        message: string;
        fileName: any;
        filePath: string;
      }) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const {
        base64Document,
        fileName,
        roomId,
        tenantName,
        tenantId,
        AddedTimeText,
      } = req.body;

      const sanitizedRoomId = roomId;
      const sanitizedTenantName = tenantName;
      const sanitizedTenantId = tenantId;
      const sanitizedAddedTimeText = AddedTimeText;

      const dirPath = path.join(
        process.env.APPDATA || '',
        appname || '',
        'Room Documents',
        sanitizedRoomId,
        `${sanitizedTenantName}, ${sanitizedAddedTimeText}, ${sanitizedTenantId}`
      );

      fs.mkdirSync(dirPath, { recursive: true });
      const filePath = path.join(dirPath, fileName);

      const base64Data = base64Document.replace(/^data:.*?;base64,/, '');
      fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));

      res.json({
        message: 'Tenant document uploaded successfully',
        fileName,
        filePath,
      });
    } catch (error: any) {
      console.error('Error uploading tenant document:', error);
      res.status(500).json({ error: 'Failed to upload tenant document' });
    }
  }
);
appDB.delete(
  '/delete-tenant-document-folder',
  (
    req: any,
    res: {
      json: (arg0: { message: string }) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const folderPath = path.join(
        process.env.APPDATA || '',
        appname || '',
        'Room Documents',
        'Add a tenant documents',
        'Add a tenant document'
      );

      if (fs.existsSync(folderPath)) {
        fs.rmdirSync(folderPath, { recursive: true });
        res.json({ message: 'Tenant document folder deleted successfully' });
      } else {
        res.status(404).json({ error: 'Tenant document folder not found' });
      }
    } catch (error: any) {
      console.error('Error deleting tenant document folder:', error);
      res
        .status(500)
        .json({ error: 'Failed to delete tenant document folder' });
    }
  }
);
appDB.delete(
  '/room-document/delete-tenant-document/:fileName',
  (
    req: { params: { fileName: any } },
    res: {
      json: (arg0: { message: string }) => void;
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
    }
  ) => {
    try {
      const { fileName } = req.params;
      const filePath = path.join(
        process.env.APPDATA || '',
        appname || '',
        'Room Documents',
        'Add a tenant documents',
        'Add a tenant document',
        fileName
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.json({ message: 'Tenant document deleted successfully' });
      } else {
        res.status(404).json({ error: 'Tenant document not found' });
      }
    } catch (error: any) {
      console.error('Error deleting tenant document:', error);
      res.status(500).json({ error: 'Failed to delete tenant document' });
    }
  }
);
appDB.post(
  '/room-document/upload-tenant-document',
  (
    req: { body: { base64Document: any; fileName: any; roomId: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string; details?: any }): void; new (): any };
      };
      json: (arg0: { message: string; fileName: any; roomId: any }) => void;
    }
  ) => {
    try {
      const { base64Document, fileName, roomId } = req.body;
      if (!base64Document || !fileName || !roomId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const base64Data = base64Document.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const dirPath = path.join(
        process.env.APPDATA || '',
        appname || '',
        'Room Documents',
        roomId,
        'Add a tenant document'
      );

      fs.mkdirSync(dirPath, { recursive: true });
      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, buffer);

      res.json({
        message: 'Tenant document uploaded successfully',
        fileName,
        roomId,
      });
    } catch (error: any) {
      console.error('Error uploading tenant document:', error);
      res.status(500).json({
        error: 'Failed to upload tenant document',
        details: error.message,
      });
    }
  }
);
appDB.delete(
  '/room-document/:roomId/:fileName',
  (
    req: { params: { roomId: any; fileName: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
      json: (arg0: { message: string }) => void;
    }
  ) => {
    const { roomId, fileName } = req.params;
    const roomDocumentsPath = path.join(
      process.env.APPDATA || '',
      appname,
      'Room Documents',
      roomId
    );

    fs.readdir(roomDocumentsPath, (err: any, tenantFolders: any) => {
      if (err) {
        return res
          .status(500)
          .json({ error: 'Failed to read room documents directory' });
      }

      let fileDeleted = false;
      for (const tenantFolder of tenantFolders) {
        const filePath = path.join(roomDocumentsPath, tenantFolder, fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          fileDeleted = true;
          break;
        }
      }

      if (fileDeleted) {
        res.json({ message: 'Document deleted successfully' });
      } else {
        res.status(404).json({ error: 'Document not found' });
      }
    });
  }
);
appDB.post(
  '/upload-room-document',
  (
    req: {
      body: {
        base64Document: any;
        fileName: any;
        roomId: any;
        tenantName: any;
        tenantId: any;
        AddedTimeText: any;
      };
    },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
      json: (arg0: {
        message: string;
        fileName: any;
        roomId: any;
        tenantName: any;
        tenantId: any;
      }) => void;
    }
  ) => {
    try {
      const {
        base64Document,
        fileName,
        roomId,
        tenantName,
        tenantId,
        AddedTimeText,
      } = req.body;
      if (!base64Document || !fileName || !roomId || !tenantName || !tenantId) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }
      const base64Data = base64Document.replace(/^data:.*?;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const addedTime = new Date()
        .toISOString()
        .replace(/:/g, '_')
        .replace(/\./g, '-');
      const safeTenantName = tenantName;
      const dirPath = path.join(
        process.env.APPDATA || '',
        appname || '',
        'Room Documents',
        roomId,
        `${safeTenantName}, ${AddedTimeText}, ${tenantId}`
      );
      fs.mkdirSync(dirPath, { recursive: true });
      const filePath = path.join(dirPath, fileName);
      fs.writeFileSync(filePath, buffer);
      res.json({
        message: 'Document uploaded successfully',
        fileName,
        roomId,
        tenantName,
        tenantId,
      });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);
appDB.get(
  '/room-documents/:roomId',
  (
    req: { params: { roomId: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): any; new (): any };
      };
      json: (arg0: { documents: any[] | never[]; roomFolder: any }) => void;
    }
  ) => {
    const roomId = req.params.roomId;
    const roomDocumentsPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Documents'
    );
    fs.readdir(roomDocumentsPath, (err: any, folders: any[]) => {
      if (err) {
        return res
          .status(500)
          .json({ error: 'Failed to read room documents directory' });
      }
      const roomFolder = folders.find((folder: string | any[]) =>
        folder.includes(roomId)
      );
      if (!roomFolder) {
        return res.json({ documents: [], roomFolder: null });
      }
      const roomFolderPath = path.join(roomDocumentsPath, roomFolder);
      fs.readdir(roomFolderPath, (err: any, tenantFolders: any[]) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to read room folder' });
        }
        const documents: string[] = [];
        tenantFolders.forEach((tenantFolder: string) => {
          const tenantFolderPath = path.join(roomFolderPath, tenantFolder);
          if (fs.existsSync(tenantFolderPath)) {
            const files = fs.readdirSync(tenantFolderPath);
            files.forEach((file: string) => {
              documents.push(
                `local-resource://${path.join(tenantFolderPath, file)}`
              );
            });
          }
        });
        res.json({ documents, roomFolder });
      });
    });
  }
);
appDB.get(
  '/room-documents/:roomId/:string',
  (
    req: { params: { roomId: string; string: string } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): any; new (): any };
      };
      json: (arg0: {
        documents: string[];
        roomFolder: string | null;
        tenantFolder: string | null;
      }) => void;
    }
  ) => {
    const { roomId, string } = req.params;
    const roomDocumentsPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Documents'
    );

    fs.readdir(roomDocumentsPath, (err: any, folders: string[]) => {
      if (err) {
        return res
          .status(500)
          .json({ error: 'Failed to read room documents directory' });
      }

      const roomFolder = folders.find((folder: string) =>
        folder.includes(roomId)
      );
      if (!roomFolder) {
        return res.json({
          documents: [],
          roomFolder: null,
          tenantFolder: null,
        });
      }

      const roomFolderPath = path.join(roomDocumentsPath, roomFolder);
      fs.readdir(roomFolderPath, (err: any, tenantFolders: string[]) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to read room folder' });
        }

        console.log(string);
        const tenantFolder = tenantFolders.find(
          (folder: string) => folder === string
        );

        if (!tenantFolder) {
          return res.json({ documents: [], roomFolder, tenantFolder: null });
        }

        const tenantFolderPath = path.join(roomFolderPath, tenantFolder);
        fs.readdir(tenantFolderPath, (err: any, files: string[]) => {
          if (err) {
            return res
              .status(500)
              .json({ error: 'Failed to read tenant folder' });
          }

          const documents = files.map(
            (file: string) =>
              `local-resource://${path.join(tenantFolderPath, file)}`
          );

          res.json({ documents, roomFolder, tenantFolder });
        });
      });
    });
  }
);

appDB.delete(
  '/room-image/:roomId/:fileName',
  (
    req: { params: { roomId: any; fileName: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): any; new (): any };
      };
      json: (arg0: { message: string }) => void;
    }
  ) => {
    const { roomId, fileName } = req.params;
    const roomPicturesPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Pictures'
    );

    fs.readdir(roomPicturesPath, (err: any, folders: any[]) => {
      if (err) {
        return res
          .status(500)
          .json({ error: 'Failed to read room pictures directory' });
      }

      const roomFolder = folders.find((folder: string | any[]) =>
        folder.includes(roomId)
      );
      if (!roomFolder) {
        return res.status(404).json({ error: 'Room folder not found' });
      }

      const filePath = path.join(roomPicturesPath, roomFolder, fileName);
      fs.unlink(filePath, (err: any) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to delete image' });
        }
        res.json({ message: 'Image deleted successfully' });
      });
    });
  }
);
appDB.get(
  '/room-images/:roomId',
  (
    req: { params: { roomId: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): any; new (): any };
      };
      json: (arg0: { images: any; roomFolder: any }) => void;
    }
  ) => {
    const roomId = req.params.roomId;
    const roomPicturesPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Pictures'
    );

    fs.readdir(roomPicturesPath, (err: any, folders: any[]) => {
      if (err) {
        return res
          .status(500)
          .json({ error: 'Failed to read room pictures directory' });
      }

      const roomFolder = folders.find((folder: string | any[]) =>
        folder.includes(roomId)
      );
      if (!roomFolder) {
        return res.status(404).json({ error: 'Room folder not found' });
      }

      const roomFolderPath = path.join(roomPicturesPath, roomFolder);
      fs.readdir(roomFolderPath, (err: any, files: any[]) => {
        if (err) {
          return res.status(500).json({ error: 'Failed to read room folder' });
        }
        const imageFiles = files
          ? files
              .filter((file: string) => /\.(jpg|jpeg|png|gif)$/i.test(file))
              .map(
                (file: string) =>
                  `local-resource://${path.join(roomFolderPath, file)}`
              )
          : [];

        res.json({ images: imageFiles, roomFolder: roomFolder });
      });
    });
  }
);

appDB.post(
  '/duplicate-room-images-folder',
  (
    req: { body: { sourceFolderName: string; newFolderName: string } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): void; new (): any };
      };
      json: (arg0: { message: string }) => void;
    }
  ) => {
    try {
      const { sourceFolderName, newFolderName } = req.body;

      const sourcePath = path.join(
        process.env.APPDATA,
        appname,
        'Room Pictures',
        sourceFolderName
      );

      const destPath = path.join(
        process.env.APPDATA,
        appname,
        'Room Pictures',
        newFolderName
      );

      // Check if source exists
      if (!fs.existsSync(sourcePath)) {
        return res.status(404).json({ error: 'Source folder not found' });
      }

      // Create destination folder
      fs.mkdirSync(destPath, { recursive: true });

      // Copy all files from source to destination
      fs.readdirSync(sourcePath).forEach((file) => {
        const sourceFile = path.join(sourcePath, file);
        const destFile = path.join(destPath, file);
        fs.copyFileSync(sourceFile, destFile);
      });

      res.json({ message: 'Folder duplicated successfully' });
    } catch (error) {
      console.error('Error duplicating folder:', error);
      res.status(500).json({ error: 'Failed to duplicate folder' });
    }
  }
);
appDB.put(
  '/rename-folder',
  (
    req: { body: { oldName: any; newName: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): any; new (): any };
      };
      json: (arg0: { message: string }) => void;
    }
  ) => {
    const { oldName, newName } = req.body;
    const oldPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Pictures',
      oldName
    );
    const newPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Pictures',
      newName
    );

    fs.rename(oldPath, newPath, (err: any) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to rename folder' });
      }
      res.json({ message: 'Folder renamed successfully' });
    });
  }
);
appDB.delete(
  '/delete-folder-images/:folderName',
  (
    req: { params: { folderName: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        json: { (arg0: { error: string }): any; new (): any };
      };
      json: (arg0: { message: string }) => any;
    }
  ) => {
    const folderName = req.params.folderName;
    const folderPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Pictures',
      folderName
    );

    fs.readdir(folderPath, (err: any, files: any[]) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to read folder' });
      }

      const deletePromises = files.map((file: string) =>
        fs.promises.unlink(path.join(folderPath, file))
      );

      Promise.all(deletePromises)
        .then(() => res.json({ message: 'All images deleted successfully' }))
        .catch((error) =>
          res.status(500).json({ error: 'Failed to delete images' })
        );
    });
  }
);

appDB.post('/upload-room-image', (req: any, res: any) => {
  try {
    const { base64Image, fileName, FolderText, FileId } = req.body;

    // Remove the data:image/jpeg;base64, part
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');

    // Create a buffer from the base64 string
    const buffer = Buffer.from(base64Data, 'base64');

    // Create the directory path
    const dirPath = path.join(
      process.env.APPDATA,
      appname,
      'Room Pictures',
      FolderText
    );

    // Create the directory if it doesn't exist
    fs.mkdirSync(dirPath, { recursive: true });

    // Create the file path
    const filePath = path.join(dirPath, `${FileId}-${fileName}`);

    // Write the file
    fs.writeFileSync(filePath, buffer);

    res.json({
      message: 'Image uploaded successfully',
      fileName: fileName,
      FolderText: FolderText,
      FileId: FileId,
    });
  } catch (error: any) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});
//----------------------Table stuff
appDB.get(
  '/:tableName/:sqlCode',
  (
    req: { params: { tableName: any; sqlCode: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): any; new (): any };
      };
      send: (arg0: any) => void;
      sendStatus: (arg0: number) => void;
    }
  ) => {
    const { tableName, sqlCode } = req.params;
    if (!validateTableName(tableName)) {
      return res.status(400).send('Invalid table name.');
    }
    const query = `SELECT * FROM ${tableName} ${sqlCode}`;
    db.all(query, (error: any, rows: any) => {
      if (!error) {
        res.send(rows);
      } else {
        console.error(error);
        res.sendStatus(500);
      }
    });
  }
);

appDB.get(
  '/:tableName/:id',
  (
    req: { params: { tableName: any; id: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): any; new (): any };
      };
      send: (arg0: any) => void;
      sendStatus: (arg0: number) => void;
    }
  ) => {
    const { tableName, id } = req.params;
    if (!validateTableName(tableName)) {
      return res.status(400).send('Invalid table name.');
    }
    db.get(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [id],
      (error: any, row: any) => {
        if (!error) {
          res.send(row);
        } else {
          console.error(error);
          res.sendStatus(500);
        }
      }
    );
  }
);
appDB.delete(
  '/:tableName/:id',
  (
    req: { params: { tableName: any; id: any } },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): any; new (): any };
      };
      json: (arg0: { message: string }) => void;
      sendStatus: (arg0: number) => void;
    }
  ) => {
    const { tableName, id } = req.params;
    if (!validateTableName(tableName)) {
      return res.status(400).send('Invalid table name.');
    }
    db.run(
      `DELETE FROM ${tableName} WHERE id = ?`,
      [id],
      function (error: any) {
        if (!error) {
          res.json({
            message: `Record with id ${id} from table ${tableName} has been deleted.`,
          });
        } else {
          console.error(error);
          res.sendStatus(500);
        }
      }
    );
  }
);

appDB.post(
  '/:tableName',
  (
    req: { params: { tableName: any }; body: any },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): any; new (): any };
      };
      json: (arg0: { message: string }) => void;
      sendStatus: (arg0: number) => void;
    }
  ) => {
    const { tableName } = req.params;
    if (!validateTableName(tableName)) {
      return res.status(400).send('Invalid table name.');
    }
    const params = req.body;
    const placeholders = Object.keys(params)
      .map(() => '?')
      .join(',');
    const columns = Object.keys(params).join(',');

    db.run(
      `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`,
      Object.values(params),
      function (error: any) {
        if (!error) {
          res.json({ message: `New record added to ${tableName}.` });
        } else {
          console.error(error);
          res.sendStatus(500);
        }
      }
    );
  }
);

appDB.put(
  '/:tableName/:id/:columnName',
  (
    req: {
      params: { tableName: any; id: any; columnName: any };
      body: { [x: string]: any };
    },
    res: {
      status: (arg0: number) => {
        (): any;
        new (): any;
        send: { (arg0: string): any; new (): any };
      };
      json: (arg0: { message: string }) => void;
      sendStatus: (arg0: number) => void;
    }
  ) => {
    const { tableName, id, columnName } = req.params;
    if (!validateTableName(tableName)) {
      return res.status(400).send('Invalid table name.');
    }
    const newValue = req.body[columnName];

    db.run(
      `UPDATE ${tableName} SET ${columnName} = ? WHERE id = ?`,
      [newValue, id],
      function (error: any) {
        if (!error) {
          res.json({
            message: `Record with id ${id} in table ${tableName} has been updated.`,
          });
        } else {
          console.error(error);
          res.sendStatus(500);
        }
      }
    );
  }
);

export const cleanupOnSignOut = async () => {
  const userDataPath = process.env.APPDATA || app.getPath('userData');
  const dbPath = path.join(userDataPath, appname, 'database.db');
  const bmsPath = path.join(userDataPath, appname);
  store.set('users', []);
  store.set('app_users', []);
  store.set('SelectedAppUserId', '');
  store.set('changeAmount', 0);
  //So it can be deleted
  // Close the database connection
  db.close((err: Error | null) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');

      fs.unlink(dbPath, (err: NodeJS.ErrnoException | null) => {
        if (err) {
          console.error('Error deleting database file:', err);
        } else {
          console.log('Database file deleted successfully.');
        }
      });
    }
  });

  const imageDirectories = ['Room Pictures', 'Room Documents'];

  for (const dir of imageDirectories) {
    const folderPath = path.join(bmsPath, dir);

    if (fs.existsSync(folderPath)) {
      try {
        fs.rmdirSync(folderPath, { recursive: true });
        console.log(`Directory deleted successfully: ${folderPath}`);
      } catch (error) {
        console.error(`Error deleting directory ${folderPath}:`, error);
      }
    } else {
      console.log(`Directory not found: ${folderPath}`);
    }
  }
  app.quit();
  console.log('Cleanup completed: database and images deleted');
};

// Create an IPC endpoint to access the cleanupOnSignOut function
ipcMain.handle('cleanup-on-sign-out', () => {
  cleanupOnSignOut();
  return 'Cleanup completed';
});
const dbPath = path.join(process.env.APPDATA || '', appname, 'database.db');
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}
const db = new sqlite3.Database(dbPath, (err: { message: any }) => {
  if (err) {
    console.error('Database connection error:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    initializeTables(db);
  }
});

appDB.listen(port, () => {
  console.log(`Express app listening on port ${port}`);
});
const { protocol } = require('electron');

app.whenReady().then(() => {
  protocol.registerFileProtocol('local-resource', (request, callback) => {
    const url = request.url.replace('local-resource://', '');
    const decodedUrl = decodeURI(url);
    callback({ path: path.normalize(`${decodedUrl}`) });
  });
});

ipcMain.on('show-item-in-folder', (event, path) => {
  const filePath = path.replace('local-resource://', '');
  shell.showItemInFolder(filePath);
});

ipcMain.on('open-document', (event, filePath) => {
  const decodedPath = filePath.replace('local-resource://', '');
  shell.openPath(decodedPath);
});
ipcMain.handle('read-file', async (event, filePath) => {
  const cleanPath = filePath.replace('local-resource://', '');
  return fs.readFileSync(cleanPath);
});

export async function createBackup(Another?: boolean, num?: number) {
  const backupPath = path.join(app.getPath('documents'), appname + '_Backups');
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  const zip = new AdmZip();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  let backupFileName = `${appname}_Backup_${timestamp}.zip`;
  if (Another) {
    backupFileName = `${appname}_Backup_ToLoadAnother_${timestamp}.zip`;
    if (num !== 1) store.set('MainBackupPath', backupFileName);
  }
  const appDataPath = process.env.APPDATA || '';
  const bmsPath = path.join(appDataPath, appname);

  const roomPicturesPath = path.join(bmsPath, 'Room Pictures');
  const roomDocumentsPath = path.join(bmsPath, 'Room Documents');
  const databasePath = path.join(bmsPath, 'database.db');

  if (fs.existsSync(roomPicturesPath)) {
    zip.addLocalFolder(roomPicturesPath, 'Room Pictures');
  }
  if (fs.existsSync(roomDocumentsPath)) {
    zip.addLocalFolder(roomDocumentsPath, 'Room Documents');
  }
  if (fs.existsSync(databasePath)) {
    zip.addLocalFile(databasePath, '');
  }

  zip.writeZip(path.join(backupPath, backupFileName));

  fs.writeFileSync(
    path.join(backupPath, 'last_backup.txt'),
    Date.now().toString()
  );

  dialog.showMessageBox({
    type: 'info',
    title: Another ? 'Backup Created To Load Another' : 'Backup Created',
    message: `Backup created successfully at ${path.join(
      backupPath,
      backupFileName
    )}`,
  });
}

function checkAndCreateBackup() {
  const backupPath = path.join(app.getPath('documents'), appname + '_Backups');
  const lastBackupFile = path.join(backupPath, 'last_backup.txt');

  if (fs.existsSync(lastBackupFile)) {
    const lastBackupTime = parseInt(fs.readFileSync(lastBackupFile, 'utf8'));
    const sevenDaysInMs = 7 * 24 * 60 * 60 * 1000;

    if (Date.now() - lastBackupTime > sevenDaysInMs) {
      createBackup();
    }
  } else {
    createBackup();
  }
}
export async function loadBackup() {
  console.log('Starting backup load process');

  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Zip Files', extensions: ['zip'] }],
    title: `Select ${appname} Backup File`,
  });

  console.log('File dialog result:', result);

  if (result.canceled || result.filePaths.length === 0) {
    console.log('Backup selection canceled or no file selected');
    return;
  }

  const backupPath = result.filePaths[0];
  console.log('Selected backup file:', backupPath);

  const zip = new AdmZip(backupPath);
  const zipEntries = zip.getEntries();
  console.log(
    'Zip entries:',
    zipEntries.map((entry: { entryName: any }) => entry.entryName)
  );

  createBackup(true);
  const bmsPath = path.join(process.env.APPDATA || '', appname);
  console.log('rent-master path:', bmsPath);

  console.log('Clearing existing data...');
  try {
    fs.rmdirSync(path.join(bmsPath, 'Room Pictures'), {
      recursive: true,
      force: true,
    });
    fs.rmdirSync(path.join(bmsPath, 'Room Documents'), {
      recursive: true,
      force: true,
    });
    fs.unlinkSync(path.join(bmsPath, 'database.db'));
    console.log('Existing data cleared successfully');
  } catch (error: any) {
    console.error('Error clearing existing data:', error);
  }

  console.log('Extracting new data...');
  zip.extractAllTo(bmsPath, true);
  console.log('Extraction complete');

  console.log('Verifying extracted files...');
  fs.readdirSync(bmsPath).forEach((file: any) => {
    console.log('Extracted file/folder:', file);
  });

  if (fs.existsSync(path.join(bmsPath, 'database.db'))) {
    console.log('Database file extracted successfully');
  } else {
    console.log('Failed to extract database file');
  }

  console.log('Closing database and restarting application...');
  db.close(() => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Backup Loaded',
      message:
        'Backup has been successfully loaded. The application will now restart.',
    });

    app.relaunch();
    app.exit();
  });
  store.set('IsOnBackup', true);
}

// Add IPC handlers for create-backup and load-backup
ipcMain.on('create-backup', (event, isAnother) => {
  createBackup(isAnother);
});

ipcMain.on('load-backup', () => {
  loadBackup();
});

export async function loadSpecificBackup(backupFileName: string) {
  console.log('Starting specific backup load process');

  const backupPath = path.join(
    app.getPath('documents'),
    appname + '_Backups',
    backupFileName
  );
  console.log('Attempting to load backup:', backupPath);

  if (!fs.existsSync(backupPath)) {
    console.log('Backup file not found');
    dialog.showMessageBox({
      type: 'error',
      title: 'Backup Not Found',
      message: `The backup file ${backupFileName} was not found in the ${appname}_Backups folder.`,
    });
    return;
  }

  console.log('Backup file found, proceeding with load');

  const zip = new AdmZip(backupPath);
  const zipEntries = zip.getEntries();
  console.log(
    'Zip entries:',
    zipEntries.map((entry: { entryName: any }) => entry.entryName)
  );

  //createBackup(true,2);
  const bmsPath = path.join(process.env.APPDATA || '', appname);
  console.log('rent-master path:', bmsPath);

  console.log('Clearing existing data...');
  try {
    fs.rmdirSync(path.join(bmsPath, 'Room Pictures'), {
      recursive: true,
      force: true,
    });
    fs.rmdirSync(path.join(bmsPath, 'Room Documents'), {
      recursive: true,
      force: true,
    });
    fs.unlinkSync(path.join(bmsPath, 'database.db'));
    console.log('Existing data cleared successfully');
  } catch (error: any) {
    console.error('Error clearing existing data:', error);
  }

  console.log('Extracting new data...');
  zip.extractAllTo(bmsPath, true);
  console.log('Extraction complete');

  console.log('Verifying extracted files...');
  fs.readdirSync(bmsPath).forEach((file: any) => {
    console.log('Extracted file/folder:', file);
  });

  if (fs.existsSync(path.join(bmsPath, 'database.db'))) {
    console.log('Database file extracted successfully');
  } else {
    console.log('Failed to extract database file');
  }

  console.log('Closing database and restarting application...');
  db.close(() => {
    dialog.showMessageBox({
      type: 'info',
      title: 'Specific Backup Loaded',
      message: `Backup ${backupFileName} has been successfully loaded. The application will now restart.`,
    });

    app.relaunch();
    app.exit();
  });
  store.set('IsOnBackup', false);
  store.set('MainBackupPath', '');
}

// Add IPC handler for load-specific-backup
ipcMain.handle('load-specific-backup', (event, backupFileName) => {
  loadSpecificBackup(backupFileName);
});

ipcMain.handle('get-receipt-file', (event, dirPath, formattedDate) => {
  const files = fs.readdirSync(dirPath);
  const receiptFile = files.find((file: string) =>
    file.startsWith(formattedDate)
  );
  return receiptFile ? path.join(dirPath, receiptFile) : null;
});

ipcMain.on('delete-receipt', (event, filePath) => {
  try {
    const filePath2 = filePath.replace('local-resource://', '');
    fs.unlinkSync(filePath2);
    event.reply('receipt-deleted', { success: true });
  } catch (error) {
    console.error('Error deleting receipt:', error);
    event.reply('receipt-deleted', { success: false, error: error.message });
  }
});

import { format, isBefore, isAfter, subDays, differenceInDays } from 'date-fns';
import {
  addValueOnline,
  getValuesWithSql_Online,
} from '../Backend/OnlineServerApis';
import { getLocalUserDirectory } from '../Backend/localServerApis';
ipcMain.handle('GetReceiptFile', (event, date, roomId, tenant) => {
  const formattedDate = format(new Date(date), 'yyyy-MM-dd');
  const addedTimeText = format(
    new Date(tenant?.startTime || 0),
    'EEE MMM dd yyyy'
  );
  const tenantName = tenant?.name || '';
  const tenantId = tenant?.id || '';
  const dirPath = path.join(
    process.env.APPDATA || '',
    appname,
    'Room Documents',
    roomId,
    `${tenantName}, ${addedTimeText}, ${tenantId}`,
    'receipts'
  );

  try {
    const files = fs.readdirSync(dirPath);
    const receiptFile = files.find((file: string) =>
      file.startsWith(formattedDate)
    );

    if (receiptFile) {
      const filePath = path.join(dirPath, receiptFile);
      return `local-resource://${filePath}`;
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error reading receipt directory:', error);
    return null;
  }
});

function reloadApp() {
  BrowserWindow.getFocusedWindow()?.webContents.reload();
}
async function hasOfflineChanges(): Promise<boolean> {
  return new Promise((resolve) => {
    db.get('SELECT COUNT(*) as count FROM offline_changes', [], (err, row) => {
      if (err) {
        console.error('Error checking offline changes:', err);
        resolve(false);
        return;
      }

      console.log('Raw offline changes data:', row);
      const count = row ? row.count : 0;
      console.log('Offline changes count:', count);
      resolve(count > 0);
    });
  });
}
// Add IPC handler for sync-offline-changes
ipcMain.handle('sync-offline-changes', async () => {
  if (!mainWindow) return false;

  try {
    // Call the renderer's handleUploadChanges function
    await mainWindow.webContents.executeJavaScript(`
      (async () => {
        try {
          if (storageManager.get('SelectedUserId')) {
            await window.handleUploadChanges();
            return true;
          }
          return false;
        } catch (error) {
          console.error('Upload error:', error);
          return false;
        }
      })()
    `);

    return true;
  } catch (error) {
    console.error('Error syncing changes:', error);
    return false;
  }
});
const formatFolderName = (name: string) => {
  const spaceMatch = name.match(/^(.*?)\s+(\d+)$/);
  const parenthesesMatch = name.match(/^(.*?)\((\d+)\)$/);

  if (spaceMatch) {
    return `${spaceMatch[1]}(${spaceMatch[2]})`;
  } else if (parenthesesMatch) {
    return name;
  }
  return name;
};
ipcMain.on('console-message', (event, messageData) => {
  const data = JSON.parse(messageData);
  log.info('Renderer:', {
    type: data.type,
    message: data.message,
    data: data.data,
    source: data.source,
  });
});
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (error) => {
  log.error('Unhandled Rejection:', error);
}); // Add this with your other IPC handlers
import dns from 'dns';
import { promisify } from 'util';
import { AxiosInstance } from 'axios';
// Constants
const BASE_URL = 'https://www.rentmaster.markethubet.com/api';

const MAX_RETRIES = 3;
const TIMEOUT = 30000;

// Create axios instance with default config
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    httpsAgent: new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      timeout: TIMEOUT,
    }),
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  // Add request interceptor for logging
  instance.interceptors.request.use((config) => {
    console.log(
      `Making ${config.method?.toUpperCase()} request to: ${config.url}`
    );
    return config;
  });

  // Add response interceptor for retries
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;

      if (!config || !config.retry) {
        return Promise.reject(error);
      }

      config.retry -= 1;

      if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        const delay = (MAX_RETRIES - config.retry) * 2000;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return instance(config);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// Create a single axios instance
const axiosInstance = createAxiosInstance();

// Helper function to check server connectivity
const checkServerConnectivity = async (): Promise<boolean> => {
  try {
    const lookup = promisify(dns.lookup);
    const { address } = await lookup('www.rentmaster.markethubet.com');

    return true;
  } catch (error) {
    console.error('Server connectivity check failed:', error);
    return false;
  }
};

// Main API request handler
ipcMain.handle(
  'api-request',
  async (event, { url, method, headers = {}, data }) => {
    try {
      // Check server connectivity first
      const isConnected = await checkServerConnectivity();
      if (!isConnected) {
        return {
          error: true,
          message:
            'Cannot connect to server. Please check your internet connection.',
        };
      }

      const config = {
        url: url.replace(BASE_URL, ''), // Remove base URL if included
        method,
        headers: {
          ...headers,
          'x-api-key': apiKey, // Ensure API key is always included
        },
        data,
        retry: MAX_RETRIES,
      };

      const response = await axiosInstance.request(config);

      return response.data;
    } catch (error) {
      console.error('API Request Failed:', {
        url,
        method,
        error: {
          message: error.message,
          code: error.code,
          response: error.response?.data,
        },
      });

      // Return structured error response
      return {
        error: true,
        message: error.message,
        code: error.code,
        status: error.response?.status,
        details: error.response?.data,
      };
    }
  }
);

// File download handler with improved error handling
ipcMain.handle('download-files', async (event, { userId }) => {
  const sendProgress = (progress: number) => {
    event.sender.send('download-progress2', progress);
  };

  try {
    // Check connectivity first
    const isConnected = await checkServerConnectivity();
    if (!isConnected) {
      throw new Error('Cannot connect to server');
    }

    console.log('Starting file download process for user:', userId);
    sendProgress(10);

    // Get local directory structure
    const localDirectory = await getLocalUserDirectory2();
    console.log('Local directory obtained:', localDirectory);
    sendProgress(20);

    // Request file list with timeout and retry
    console.log('Sending directory data to online database...');
    const fileListResponse = await axiosInstance.post('/check-missing-files', {
      userId,
      localDirectory,
    });

    const { missingFiles } = fileListResponse.data;
    console.log('Response received from online database:', missingFiles);
    sendProgress(40);

    if (missingFiles.length === 0) {
      console.log('No files needed to be downloaded');
      sendProgress(100);
      return {
        success: true,
        message: 'No files needed to be downloaded',
      };
    }

    console.log('Required files missing:', missingFiles);

    // Download missing files
    console.log('Downloading missing files...');
    const startTime = Date.now();
    const downloadResponse = await axiosInstance.post(
      '/download-missing-files',
      { userId, missingFiles },
      { responseType: 'arraybuffer' }
    );
    const endTime = Date.now();
    const downloadTime = (endTime - startTime) / 1000;
    console.log(`Download completed in ${downloadTime} seconds`);
    sendProgress(70);

    // Extract files
    console.log('Extracting downloaded files...');
    await extractDownloadedFiles(Buffer.from(downloadResponse.data), userId);
    console.log('Files extracted successfully');
    sendProgress(100);

    return {
      success: true,
      message: 'Files downloaded and extracted successfully',
      filesCount: missingFiles.length,
    };
  } catch (error: any) {
    console.error('Download process failed:', error);
    sendProgress(0);

    return {
      success: false,
      message: error.message || 'Download failed',
      error: {
        code: error.code,
        status: error.response?.status,
        details: error.response?.data,
      },
    };
  }
});
const getLocalUserDirectory2 = async () => {
  const userDataPath = process.env.APPDATA || app.getPath('userData');
  const bmsFolderPath = path.join(userDataPath, appname);

  function directoryToJson(dir: string) {
    const result = {
      name: path.basename(dir),
      type: 'directory',
      children: [],
    };
    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach((file: { name: string; isDirectory: () => any }) => {
      const filePath = path.join(dir, file.name);
      if (file.isDirectory()) {
        result.children.push(directoryToJson(filePath));
      } else {
        result.children.push({ name: file.name, type: 'file' });
      }
    });

    return result;
  }

  try {
    const directoryStructure = directoryToJson(bmsFolderPath);
    return directoryStructure;
  } catch (error) {
    console.error('Error reading directory structure:', error);
    return null;
  }
};

// Helper retry function
const retry = async (fn: () => Promise<any>, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

const baseUrlLocal = 'http://localhost:8100';

const extractDownloadedFiles = async (zipBuffer: Buffer, userId: string) => {
  try {
    const response = await axios.post(
      `${baseUrlLocal}/extract-downloaded-files`,
      zipBuffer,
      {
        headers: {
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity, // Allow large file uploads
        maxContentLength: Infinity,
      }
    );

    if (response.status !== 200) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    console.log('Files extracted successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error extracting files:', error);
    throw error;
  }
};
