const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const multer = require('multer');
const extract = require('extract-zip');
const log4js = require('log4js');
const JSZip = require('jszip');
const app = express();
const PORT = process.env.PORT || 3000;
const apiKey = 'HH(CzZuQoW@tB$By)e';
const baseDir = path.join(__dirname, 'User Files');

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-api-key'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(
  cors({
    origin: ['http://localhost:1212', 'https://www.rentmaster.markethubet.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true,
  })
);
const corsOptions = {
  origin: 'http://localhost:1212',
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
// API Key Middleware
const checkApiKey = (req, res, next) => {
  const providedApiKey = req.headers['x-api-key'];
  if (providedApiKey === apiKey) {
    next();
  } else {
    res.status(403).send('Forbidden');
  }
};
app.use('/api', checkApiKey);

// Multer configuration
const upload = multer({ dest: 'temp/' });

// MySQL Pool
const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'marketuz_SWB',
  password: 'Plp5H9:Li(UO#6[y+26E',
  database: 'marketuz_SWB',
});

// Logger configuration
log4js.configure({
  appenders: { everything: { type: 'file', filename: 'logs.log' } },
  categories: { default: { appenders: ['everything'], level: 'ALL' } },
});
const logger = log4js.getLogger();
app.get('/log', (req, res) => {
  res.sendFile(path.join(__dirname, 'logs.log'));
});

// Email ALL

const sendEmail = async (email, subject, text) => {
  logger.debug(`Attempting to send email to: ${email}`);
  const transporter = nodemailer.createTransport({
    host: 'rentmaster.markethubet.com',
    port: 465,
    secure: true,
    auth: {
      user: 'seblewenglesbuilding@rentmaster.markethubet.com',
      pass: 'Plp5H9:Li(UO#6[y+26E',
    },
  });

  const mailOptions = {
    from: 'seblewenglesbuilding@rentmaster.markethubet.com',
    to: email,
    subject: subject,
    text: text,
  };

  try {
    logger.debug(`Sending email with subject: "${subject}"`);
    await transporter.sendMail(mailOptions);
    logger.debug(`Email sent successfully to: ${email}`);
    return { success: true };
  } catch (error) {
    logger.debug(`Failed to send email to: ${email}. Error: ${error.message}`);
    return { success: false, error: error.message };
  }
};

const shouldSendNotification = (paymentDay, notificationSetting) => {
  logger.debug(
    `Checking notification for payment day: ${paymentDay}, notification setting: ${notificationSetting}`
  );
  const dueMoment = moment.unix(paymentDay);
  const now = moment().startOf('day');
  const daysFromDue = now.diff(dueMoment, 'days');

  logger.debug(`Days from due: ${daysFromDue}`);

  const notificationDays = [-5, -3, -1, 0, 1, 3, 5, 7];
  for (let i = 0; i < notificationDays.length; i++) {
    if (daysFromDue === notificationDays[i]) {
      const emailBit = i * 2;
      const smsBit = i * 2 + 1;
      const shouldSendEmail = (notificationSetting & (1 << emailBit)) !== 0;
      const shouldSendSMS = (notificationSetting & (1 << smsBit)) !== 0;
      logger.debug(
        `Notification check result: Email: ${shouldSendEmail}, SMS: ${shouldSendSMS}`
      );
      return { shouldSendEmail, shouldSendSMS };
    }
  }
  logger.debug('No notification needed for this date');
  return { shouldSendEmail: false, shouldSendSMS: false };
};

const processNotifications = async () => {
  logger.debug('Starting processNotifications');
  try {
    logger.debug('Fetching all users');
    const users = await new Promise((resolve, reject) => {
      pool.query('SELECT * FROM users', (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });
    logger.debug(`Fetched ${users.length} users`);

    for (const user of users) {
      logger.debug(`Processing user: ${user.id}`);
      const query = `
        SELECT r.*
        FROM rooms r
        WHERE r.userId = ? AND r.notificationSettings != 0
      `;
      logger.debug(`Fetching rooms for user: ${user.id}`);
      const rooms = await new Promise((resolve, reject) => {
        pool.query(query, [user.id], (error, results) => {
          if (error) reject(error);
          else resolve(results);
        });
      });
      logger.debug(`Fetched ${rooms.length} rooms for user: ${user.id}`);

      for (const room of rooms) {
        logger.debug(`Processing room: ${room.id}`);
        const currentDate = moment();
        const currentTimestamp = currentDate.valueOf();
        const roomId = room.id;
        const userId = user.id;

        const getRoomPayInfoQuery = `
          (SELECT * FROM room_pay_info
           WHERE roomId = ? AND userId = ? AND Paid = 0 AND Day < ?
           ORDER BY Day DESC LIMIT 5)
          UNION ALL
          (SELECT * FROM room_pay_info
           WHERE roomId = ? AND userId = ? AND Paid = 0 AND Day >= ?
           ORDER BY Day ASC LIMIT 5)
          ORDER BY Day ASC
        `;

        const roomPayInfo = await new Promise((resolve, reject) => {
          pool.query(
            getRoomPayInfoQuery,
            [
              roomId,
              userId,
              currentTimestamp,
              roomId,
              userId,
              currentTimestamp,
            ],
            (error, results) => {
              if (error) reject(error);
              else resolve(results);
            }
          );
        });

        logger.debug(
          `Fetched ${roomPayInfo.length} payment info records for room ${roomId}`
        );

        if (roomPayInfo.length > 0) {
          const nextPayment = roomPayInfo[0]; // The first unpaid payment
          logger.debug(
            `Room ${room.id} has unpaid payment due on: ${moment(
              nextPayment.Day
            ).format('YYYY-MM-DD')}`
          );

          // Fetch tenant information
          const getTenantQuery = `
            SELECT * FROM tenants
            WHERE roomId = ?
          `;
          const [tenant] = await new Promise((resolve, reject) => {
            pool.query(getTenantQuery, [roomId], (error, results) => {
              if (error) reject(error);
              else resolve(results);
            });
          });

          if (!tenant) {
            logger.debug(`No tenant found for room ${roomId}`);
            continue;
          }

          const { shouldSendEmail, shouldSendSMS } = shouldSendNotification(
            nextPayment.Day,
            room.notificationSettings
          );

          if (shouldSendEmail) {
            logger.debug(
              `Sending email notification for room ${room.id} to tenant ${tenant.email}`
            );
            const emailSubject = `Rent Payment Reminder for floor: ${room.floor}, room ${room.roomIndex}`;
            const emailBody = `
Dear ${tenant.name},

This is a friendly reminder that your rent payment for floor: ${
              room.floor
            }, room ${room.roomIndex} is due on ${moment(
              nextPayment.Day
            ).format('MMMM D, YYYY')}.

Payment Details:
- Amount Due: $${nextPayment.Value.toFixed(2)}
- Due Date: ${moment(nextPayment.Day).format('MMMM D, YYYY')}

Please ensure that your payment is made on time to avoid any late fees or inconveniences. If you have already made the payment, please disregard this message.

If you have any questions or concerns, please don't hesitate to contact us.

Thank you for your prompt attention to this matter.

Best regards,
${user.fullName}
Property Management
            `;

            const emailResult = await sendEmail(
              tenant.email,
              emailSubject,
              emailBody
            );
            logger.debug(
              `Email sending result: ${JSON.stringify(emailResult)}`
            );
          }

          if (shouldSendSMS) {
            logger.debug(
              `Sending SMS notification for room ${room.id} to tenant ${tenant.phoneNumber}`
            );
            // TODO: Implement actual SMS sending here
            // const smsMessage = `Rent reminder: Your payment of $${nextPayment.Value.toFixed(2)} for ${room.name} is due on ${moment(nextPayment.Day).format('MM/DD/YYYY')}. Please pay on time to avoid late fees.`;
            // const smsResult = await sendSMS(tenant.phoneNumber, smsMessage);
            // logger.debug(`SMS sending result: ${JSON.stringify(smsResult)}`);
          }
        } else {
          logger.debug(
            `Room ${room.id} has no unpaid payments or notifications are disabled`
          );
        }
      }
    }

    logger.debug('Notification processing completed');
  } catch (error) {
    logger.error('Error processing notifications:', error);
  }
};

cron.schedule('0 10 * * *', async () => {
  logger.debug('Running daily email check and send at 10:00 AM');
  try {
    await processNotifications();
    logger.debug('Daily email check and send completed');
  } catch (error) {
    logger.error('Error in daily email check and send:', error);
  }
});

app.get('/api/test-check-and-send', async (req, res) => {
  logger.debug('Manual trigger of check-and-send process');
  try {
    await processNotifications();
    logger.debug('Manual check-and-send completed successfully');
    res.status(200).json({
      status: 'success',
      message: 'Emails checked and sent',
    });
  } catch (error) {
    logger.error('Error in manual check-and-send:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking and sending emails',
      error: error.message,
    });
  }
});

// Routes
app.post('/api/check-missing-files', async (req, res) => {
  const { userId, localDirectory } = req.body;
  const serverBasePath = path.join(baseDir, userId);
  const missingFiles = [];

  logger.debug(`Received request to check missing files for user ${userId}`);

  async function checkDirectory(clientDir, serverPath, relativePath = '') {
    const serverFiles = await fs.promises.readdir(serverPath, {
      withFileTypes: true,
    });
    logger.debug(`Checking server directory: ${serverPath}`);

    for (const serverFile of serverFiles) {
      const serverFilePath = path.join(serverPath, serverFile.name);
      const relativeFilePath = path.join(relativePath, serverFile.name);

      if (serverFile.isDirectory()) {
        logger.debug(`Directory found on server: ${relativeFilePath}`);
        const clientSubDir = clientDir.children.find(
          (child) =>
            child.name === serverFile.name && child.type === 'directory'
        );
        if (clientSubDir) {
          await checkDirectory(clientSubDir, serverFilePath, relativeFilePath);
        } else {
          logger.debug(`Missing directory in client: ${relativeFilePath}`);
          missingFiles.push(relativeFilePath);
        }
      } else {
        logger.debug(`File found on server: ${relativeFilePath}`);
        const clientFile = clientDir.children.find(
          (child) => child.name === serverFile.name && child.type === 'file'
        );
        if (!clientFile) {
          logger.debug(`Missing file in client: ${relativeFilePath}`);
          missingFiles.push(relativeFilePath);
        }
      }
    }
  }

  try {
    logger.debug(`Initiating directory check for user ${userId}`);
    await checkDirectory(localDirectory, serverBasePath);
    logger.debug(
      `Missing files for user ${userId}: ${JSON.stringify(missingFiles)}`
    );
    res.json({ missingFiles });
  } catch (error) {
    logger.error('Error checking missing files:', error);
    res
      .status(500)
      .json({ error: 'Failed to check missing files', details: error.message });
  }
});

app.post('/api/download-missing-files', async (req, res) => {
  const { userId, missingFiles } = req.body;
  const serverBasePath = path.join(baseDir, userId);
  logger.debug(`Received request to download missing files for user ${userId}`);

  try {
    const zip = new JSZip();

    async function addToZip(filePath) {
      const fullPath = path.join(serverBasePath, filePath);
      const stats = await fs.promises.stat(fullPath);

      if (stats.isDirectory()) {
        logger.debug(`Adding directory to zip: ${filePath}`);
        const files = await fs.promises.readdir(fullPath);
        for (const file of files) {
          await addToZip(path.join(filePath, file));
        }
      } else {
        logger.debug(`Adding file to zip: ${filePath}`);
        const fileContent = await fs.promises.readFile(fullPath);
        zip.file(filePath, fileContent);
      }
    }

    for (const filePath of missingFiles) {
      await addToZip(filePath);
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    logger.debug(`Sending zip file for user ${userId}`);
    res.set('Content-Type', 'application/zip');
    res.set(
      'Content-Disposition',
      `attachment; filename=missing_files_${userId}.zip`
    );
    res.send(zipContent);
  } catch (error) {
    logger.error('Error preparing missing files for download:', error);
    res.status(500).json({
      error: 'Failed to prepare missing files for download',
      details: error.message,
    });
  }
});

app.post('/api/check-user-directory', async (req, res) => {
  const { userId, directory } = req.body;
  const serverBasePath = path.join(baseDir, userId);
  const requiredFiles = [];

  async function checkDirectory(clientDir, serverPath, relativePath = '') {
    for (const item of clientDir.children) {
      const itemRelativePath = path.join(relativePath, item.name);
      const itemServerPath = path.join(serverPath, item.name);
      if (item.type === 'directory') {
        await checkDirectory(item, itemServerPath, itemRelativePath);
      } else if (!fs.existsSync(itemServerPath)) {
        requiredFiles.push(itemRelativePath);
      }
    }
  }

  try {
    await fs.promises.mkdir(serverBasePath, { recursive: true });
    await checkDirectory(directory, serverBasePath);
    res.json({ requiredFiles });
  } catch (error) {
    console.error('Error checking user directory:', error);
    res.status(500).json({
      error: 'Failed to check user directory',
      details: error.message,
    });
  }
});

app.post(
  '/api/upload-missing-files',
  upload.single('files'),
  async (req, res) => {
    const { userId } = req.body;
    const zipFilePath = req.file.path;
    const extractPath = path.join(baseDir, userId);

    try {
      await extract(zipFilePath, { dir: extractPath });
      fs.unlinkSync(zipFilePath);

      const extractedFiles = await getAllFiles(extractPath);
      console.log('Extracted files:', extractedFiles);

      res.json({
        message: 'Files uploaded and extracted successfully',
        extractedFiles,
      });
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      res.status(500).json({
        error: 'Failed to process uploaded files',
        details: error.message,
      });
    }
  }
);

const validateTableName = (tableName) => {
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
  return validTables.includes(tableName);
};

app.get('/api/:tableName', (req, res) => {
  const { tableName } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(`SELECT * FROM ??`, [tableName], (error, rows) => {
      connection.release();
      if (!error) {
        res.send(rows);
      } else {
        console.error(error);
        res.sendStatus(500);
      }
    });
  });
});

app.get('/api/:tableName/:sqlCode', (req, res) => {
  const { tableName, sqlCode } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }

  pool.getConnection((err, connection) => {
    if (err) throw err;
    const query = `SELECT * FROM ?? ${sqlCode}`;
    connection.query(query, [tableName], (error, rows) => {
      connection.release();
      if (!error) {
        res.send(rows);
      } else {
        console.error(error);
        res.sendStatus(500);
      }
    });
  });
});

app.get('/api/:tableName/:id', (req, res) => {
  const { tableName, id } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(
      `SELECT * FROM ?? WHERE id = ?`,
      [tableName, id],
      (error, rows) => {
        connection.release();
        if (!error) {
          res.send(rows);
        } else {
          console.error(error, 'bruh');
          res.sendStatus(500);
        }
      }
    );
  });
});

app.delete('/api/:tableName/:id', (req, res) => {
  const { tableName, id } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }

  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(
      `DELETE FROM ?? WHERE id = ?`,
      [tableName, id],
      (error, result) => {
        connection.release();
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
  });
});

app.post('/api/:tableName', (req, res) => {
  const { tableName } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }

  const params = req.body;
  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(
      `INSERT INTO ?? SET ?`,
      [tableName, params],
      (error, result) => {
        connection.release();
        if (!error) {
          res.json({
            message: `New record added to ${tableName}.`,
          });
        } else {
          console.error(error);
          res.sendStatus(500);
        }
      }
    );
  });
});

app.put('/api/:tableName/:id/:columnName', (req, res) => {
  const { tableName, id, columnName } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }

  const columnValue = req.body[columnName];
  pool.getConnection((err, connection) => {
    if (err) throw err;
    connection.query(
      `UPDATE ?? SET ?? = ? WHERE id = ?`,
      [tableName, columnName, columnValue, id],
      (error, result) => {
        connection.release();
        if (!error) {
          if (result.affectedRows > 0) {
            res.json({
              message: `Record with id ${id} in ${tableName} has been updated.`,
            });
          } else {
            res.status(404).json({
              error: `Record with ID ${id} not found.`,
            });
          }
        } else {
          console.error(error);
          res.sendStatus(500);
        }
      }
    );
  });
});

// Start server
app.listen(PORT, () => {
  logger.debug(`Server is running on port ${PORT}`);
});
