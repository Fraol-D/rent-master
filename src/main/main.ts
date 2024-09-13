import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
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

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

ipcMain.on('ipc-example', async (event, arg) => {
  const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
  console.log(msgTemplate(arg));
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

const createWindow = async () => {
  if (isDebug) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  new AppUpdater();
};

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app
  .whenReady()
  .then(() => {
    createWindow();
    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });
    ipcMain.on('renderer-to-main', (event, message) => {
      const sendEmail = async (email: any, subject: any, text: any) => {
        // Create a transporter using SMTP
        const transporter = nodemailer.createTransport({
          host: 'rentmaster.markethubet.com',
          port: 465,
          secure: true,
          auth: {
            user: 'seblewenglesbuilding@rentmaster.markethubet.com',
            pass: 'Plp5H9:Li(UO#6[y+26E',
          },
        });

        // Define the email options
        const mailOptions = {
          from: 'seblewenglesbuilding@rentmaster.markethubet.com',
          to: email,
          subject: subject,
          text: text,
        };

        try {
          // Send the email
          await transporter.sendMail(mailOptions);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };
      sendEmail(
        'christian.b.taye@gmail.com',
        'Bro this is so cool',
        'this is ht ebody'
      )
        .then((result) => console.log(result))
        .catch((error) => console.error(error));
    });
    // Check for backup on app start
    checkAndCreateBackup();
    ipcMain.on('reload-app', () => {
      reloadApp();
    });
    // Set up daily check for backup
    setInterval(checkAndCreateBackup, 24 * 60 * 60 * 1000);
    ipcMain.on('SendVerificationCode', (event, message) => {
      console.log('Send verfication code:', message.to, message.code);
      async function sendVerificationEmail(to: any, code: any) {
        let transporter = nodemailer.createTransport({
          host: 'mail.markethubet.com',
          port: 465,
          secure: true, // true for 465, false for other ports
          auth: {
            user: 'verify@markethubet.com',
            pass: 'Plp5H9:Li(UO#6[y+26E',
          },
        });

        let mailOptions = {
          from: 'verify@markethubet.com',
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
                <p>Thank you for signing up with MarketHub. Please verify your email address to complete your registration.</p>
                <p class="verification-code"><strong>Your Verification Code:</strong> <span style="font-weight: bold; font-size: 18px;">${code}</span></p>
                <a href="#" class="btn">Verify Email</a>
                <div class="footer">
                  <p>Contact us at <a href="mailto:support@markethubet.com">support@markethubet.com</a> for assistance.</p>
                  <p>Visit our website: <a href="https://www.markethubet.com">www.markethubet.com</a></p>
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
  })
  .catch(console.log);

// Sending verification codes

// Server
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const fs = require('fs');

const appDB = express();
const port = 8100;
const appname = 'BMS';
appDB.use(cors({
  origin: ['http://localhost:1212', 'https://www.rentmaster.markethubet.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));
appDB.use(bodyParser.json({ limit: '50mb' }));
appDB.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

appDB.use(cors({ origin: '*' }));
appDB.use(bodyParser.urlencoded({ extended: false }));
appDB.use(bodyParser.json());

const apiKey = 'HH(CzZuQoW@tB$By)e';
const validTables = [
  'users',
  'rooms',
  'room_specifications',
  'tenants',
  'room_pay_info',
  'PastTenantReview',
  'brokers',
  'brokersRecommendationList',
  'PastTenantsForRoom',
  'agreements',
];
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
    name: 'rooms',
    columns: [
      'id TEXT PRIMARY KEY',
      'floor INTEGER ',
      'roomIndex INTEGER ',
      'status TEXT ',
      'price REAL ',
      'AgreedPrice REAL ',
      'PaymentCycleType TEXT ',
      'PaymentCycleCustomeDays INTEGER',
      'squareMeters REAL ',
      'tenantId TEXT',
      'AddTenantState BOOLEAN',
      'ViewAgreement BOOLEAN',
      'ShowPayTimeLine BOOLEAN',
      'selectedAgreementId TEXT',
      'Archived BOOLEAN DEFAULT 0',
      'userId TEXT',
    ],
  },
  {
    name: 'room_specifications',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT ',
      'Detail TEXT ',
      'Number REAL',
      'type TEXT ',
      'Boolean BOOLEAN',
      'userId TEXT',
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
      'SelectedAgreement TEXT ',
      'RentingOrOut BOOLEAN ',
      'startTime INTEGER ', // Assuming storing as UNIX timestamp
      'endTime INTEGER',
      'agreedPrice REAL',
      'TIN TEXT',
      'RentReason TEXT',
      'AddedTime INTEGER',
      'userId TEXT',
    ],
  },
  {
    name: 'room_pay_info',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT ',
      'Day INTEGER ', // Assuming storing as UNIX timestamp
      'Paid BOOLEAN ',
      'Value REAL',
      'userId TEXT',
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
      'rating REAL ',
      'notes TEXT',
      'userId TEXT',
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
      'userId TEXT',
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
      'agreedPrice REAL',
      'paymentCycleType TEXT',
      'Memo TEXT',
      'RentReserved REAL',
      'representative TEXT',
      'userId TEXT',
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
appDB.use((req: any, res: { header: (arg0: string, arg1: string) => void; }, next: () => void) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
  next();
});
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
};const NodeClam = require('clamscan');
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
ClamScan.then(clamscan => {
  // ClamScan is now initialized and can be used
  // You can use clamscan.isInfected(filePath) as shown below
}).catch(err => {
  console.error('Error initializing ClamScan:', err);
});

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const allowedFileTypes = [
  'image/jpeg', 
  'image/png', 
  'application/pdf', 
  'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

// Allowed folders for files: 'Room Pictures' and 'Room Documents'
const allowedFolders = ['Room Pictures', 'Room Documents'];

function isAllowedFileSize(file) {
  return file.size <= MAX_FILE_SIZE;
}

function isAllowedFileType(file) {
  return allowedFileTypes.includes(file.type);
}

async function isFileClean(filePath) {
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

appDB.post('/prepare-upload-files', async (req, res) => {
  const { userId, requiredFiles } = req.body;

  try {
    const zip = new JSZip();

    for (const filePath of requiredFiles) {
      const fullPath = path.join(process.env.APPDATA, 'BMS', filePath);
      const relativePath = path.relative(process.env.APPDATA, fullPath);

      const normalizedPath = relativePath.substring(relativePath.indexOf('/') + 1);
      if (!allowedFolders.some(folder => normalizedPath.includes(folder))) {
        console.log(`Skipping file not in allowed folder: ${relativePath}`);
        continue;
      }

      const fileStats = await fs2.stat(fullPath);
      const fileType = mime2.lookup(fullPath);

      if (!isAllowedFileType({ type: fileType })) {
        console.log(`Skipping file with disallowed type: ${filePath}`);
        continue;
      }

      if (!isAllowedFileSize({ size: fileStats.size })) {
        console.log(`Skipping file that exceeds size limit: ${filePath}`);
        continue;
      }

    /*  if (!(await isFileClean(fullPath))) {
        console.log(`Skipping file that failed virus scan: ${filePath}`);
        continue;
      }*/

      const fileContent = await fs2.readFile(fullPath);
      zip.file(filePath, fileContent);
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });
    res.send(zipContent);
  } catch (error) {
    console.error('Error preparing files for upload:', error);
    res.status(500).json({ error: 'Failed to prepare files for upload', details: error.message });
  }
});

appDB.get('/local-user-directory', (req: any, res: { json: (arg0: { name: string; type: string; children: never[]; }) => void; status: (arg0: number) => { (): any; new(): any; json: { (arg0: { error: string; }): void; new(): any; }; }; }) => {
  const userDataPath = process.env.APPDATA || app.getPath('userData');
  const bmsFolderPath = path.join(userDataPath, 'BMS');

  function directoryToJson(dir: string) {
    const result = { name: path.basename(dir), type: 'directory', children: [] };
    const files = fs.readdirSync(dir, { withFileTypes: true });

    files.forEach((file: { name: string; isDirectory: () => any; }) => {
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
});

appDB.delete('/deleteAll/:tableName', (req: { params: { tableName: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; send: { (arg0: string): void; new(): any; }; }; json: (arg0: { message: string; }) => void; }) => {
  const { tableName } = req.params;
  db.run(`DELETE FROM ${tableName}`, (err: any) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error deleting data from table');
    } else {
      res.json({ message: `All data deleted from ${tableName}` });
    }
  });
});
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
      const safeTenantName = tenantName.replace(/[^a-z0-9]/gi, ' ');
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
      'BMS',
      'Room Pictures',
      oldName
    );
    const newPath = path.join(
      process.env.APPDATA,
      'BMS',
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
      'BMS',
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
  const dbPath = path.join(userDataPath, 'BMS', 'database.db');
  const bmsPath = path.join(userDataPath, 'BMS');

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



export async function createBackup(Another?: boolean) {
  const backupPath = path.join(app.getPath('documents'), 'BMS_Backups');
  if (!fs.existsSync(backupPath)) {
    fs.mkdirSync(backupPath, { recursive: true });
  }

  const zip = new AdmZip();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  let backupFileName = `BMS_Backup_${timestamp}.zip`;
  if (Another) {
    backupFileName = `BMS_Backup_ToLoadAnother_${timestamp}.zip`;
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
  const backupPath = path.join(app.getPath('documents'), 'BMS_Backups');
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
    title: 'Select BMS Backup File',
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

  // ... [rest of the validation code] ...

  const bmsPath = path.join(process.env.APPDATA || '', appname);
  console.log('BMS path:', bmsPath);

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
}

function reloadApp() {
  BrowserWindow.getFocusedWindow()?.webContents.reload();
}


