import path from 'path';
import { app, BrowserWindow, shell, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
//const nodemailer = require('nodemailer');

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
      console.log('Message from renderer process:', message);
    });
    /* ipcMain.on('SendVerificationCode', (event, message) => {
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
    });*/
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

appDB.use(cors({ origin: '*' }));
appDB.use(bodyParser.urlencoded({ extended: false }));
appDB.use(bodyParser.json());

const apiKey = 'HH(CzZuQoW@tB$By)e';

// Function to validate table names
const validateTableName = (tableName: string) => {
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
  ];
  return validTables.includes(tableName);
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
      'agreedPrice REAL ',
    ],
  },
  {
    name: 'room_pay_info',
    columns: [
      'id TEXT PRIMARY KEY',
      'roomId TEXT ',
      'Day INTEGER ', // Assuming storing as UNIX timestamp
      'Paid BOOLEAN ',
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
      'RecommendedTenantsIdList TEXT ',
      'AddedTime INTEGER ',
      'AgreedCommission TEXT ',
      'rating REAL ',
      'notes TEXT',
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
    ],
  },
  // Add more tables here as needed
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

const dbPath = path.join(process.env.APPDATA, appname, 'database.db');
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
