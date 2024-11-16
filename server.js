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
const moment = require('moment');
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

// Email sending function
app.get('/log', (req, res) => {
  res.sendFile(path.join(__dirname, 'logs.log'));
});

// EMAIL ALLLL
const sendEmail = async (email, subject, text, user) => {
  logger.debug(`Attempting to send email to: ${email}`);
  const users = await new Promise((resolve, reject) => {
    pool.query('SELECT * FROM users', (error, results) => {
      if (error) reject(error);
      else resolve(results);
    });
  });
  const transporter = nodemailer.createTransport({
    host: 'rentmaster.markethubet.com',
    port: 465,
    secure: true,
    auth: {
      user: user.selectedEmailToSendWith,
      pass: user.selectedEmailToSendWithPassword,
    },
  });

  const mailOptions = {
    from: user.selectedEmailToSendWith,
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

// Update the shouldSendNotification function
const shouldSendNotification = (paymentDay, notificationSetting) => {
  logger.debug(
    `Checking notification for payment day: ${paymentDay}, notification setting: ${notificationSetting}`
  );
  const dueMoment = moment(paymentDay);
  const now = moment().startOf('day');
  const daysFromDue = now.diff(dueMoment, 'days');

  logger.debug(
    `Due date: ${dueMoment.format('YYYY-MM-DD')}, Days from due: ${daysFromDue}`
  );

  // Map days to bit positions (4 bits per notification type)
  const notificationMap = {
    '-5': 0,  // 5 days before
    '-3': 4,  // 3 days before
    '-1': 8,  // 1 day before
    '0': 12,  // On due date
    '1': 16,  // 1 day after
    '3': 20,  // 3 days after
    '5': 24,  // 5 days after
    '7': 28   // 7 days after
  };

  const bitPosition = notificationMap[daysFromDue.toString()];
  if (bitPosition !== undefined) {
    // Check all 4 notification types for this timing
    const shouldSendTenantEmail = (notificationSetting & (1 << bitPosition)) !== 0;
    const shouldSendTenantSMS = (notificationSetting & (1 << (bitPosition + 1))) !== 0;
    const shouldSendRepEmail = (notificationSetting & (1 << (bitPosition + 2))) !== 0;
    const shouldSendRepSMS = (notificationSetting & (1 << (bitPosition + 3))) !== 0;

    logger.debug(
      `Notification check result for ${daysFromDue} days from due:
       Tenant Email: ${shouldSendTenantEmail}
       Tenant SMS: ${shouldSendTenantSMS}
       Representative Email: ${shouldSendRepEmail}
       Representative SMS: ${shouldSendRepSMS}`
    );

    return {
      shouldSendTenantEmail,
      shouldSendTenantSMS,
      shouldSendRepEmail,
      shouldSendRepSMS
    };
  }

  logger.debug('No notification needed for this date');
  return {
    shouldSendTenantEmail: false,
    shouldSendTenantSMS: false,
    shouldSendRepEmail: false,
    shouldSendRepSMS: false
  };
};
// Function to fetch and store exchange rates
const fetchAndStoreExchangeRates = async () => {
  logger.debug('Fetching exchange rates...');
  try {
    const response = await fetch('https://v6.exchangerate-api.com/v6/dc263c2acc91e59fb8905502/latest/USD');
    const data = await response.json();
    
    if (data.result !== 'success') {
      throw new Error('Failed to fetch exchange rates');
    }

    const currentUnixTime = Math.floor(Date.now() / 1000);
    // Round down to the start of the day (00:00:00)
    const dayStart = Math.floor(currentUnixTime / 86400) * 86400;
    
    // Check if we already have this day's rates
    const [existingRate] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM Exchange_RatesUSDtoETB WHERE id = ?',
        [dayStart],
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    if (existingRate) {
      logger.debug(`Exchange rate for timestamp ${dayStart} already exists, skipping...`);
      return {
        status: 'skipped',
        message: 'Rate for this day already exists',
        timestamp: dayStart
      };
    }

    // Store new rate
    await new Promise((resolve, reject) => {
      pool.query(
        'INSERT INTO Exchange_RatesUSDtoETB (id, rates) VALUES (?, ?)',
        [dayStart, data.conversion_rates.ETB],
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    logger.debug(`Stored new exchange rate: ${data.conversion_rates.ETB} for timestamp ${dayStart}`);
    return {
      status: 'success',
      message: 'New rate stored successfully',
      timestamp: dayStart,
      rate: data.conversion_rates.ETB
    };
  } catch (error) {
    logger.error('Error fetching/storing exchange rates:', error);
    throw error;
  }
};

// Schedule the cron job to run at 00:01 every day
const exchangeRateTask = cron.schedule('1 0 * * *', async () => {
  logger.debug('Running scheduled exchange rate update');
  try {
    await fetchAndStoreExchangeRates();
  } catch (error) {
    logger.error('Scheduled exchange rate update failed:', error);
  }
}, {
  scheduled: true,
  timezone: 'UTC'
});

// Manual trigger endpoint
app.post('/api/trigger-exchange-rate-update', async (req, res) => {
  logger.debug('Manual trigger of exchange rate update');
  try {
    const result = await fetchAndStoreExchangeRates();
    res.json(result);
  } catch (error) {
    logger.error('Manual exchange rate update failed:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

app.get('/api/exchange-rates', async (req, res) => {
  const { start, end } = req.query;
  let query = 'SELECT * FROM `Exchange_RatesUSDtoETB`';

  if (start) {
    query += ` WHERE \`id\` >= UNIX_TIMESTAMP(?)`;
    if (end) {
      query += ` AND \`id\` <= UNIX_TIMESTAMP(?) ORDER BY \`id\` DESC`;
    } else {
      query += ' ORDER BY `id` DESC';
    }
  } else {
    query += ' ORDER BY `id` DESC';
  }

  try {
    const params = [];
    if (start) params.push(start);
    if (end) params.push(end);

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
    res.status(500).json({
      message: 'Failed to fetch exchange rates',
      error: error.message
    });
  }
});
app.post('/api/verify-credentials', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Query the database to find the user with the given email
    const [user] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    if (!user) {
      return res.json({ isValid: false });
    }

    // Compare the provided password with the stored hash
    const isPasswordValid = password === user.password;

    res.json({ isValid: isPasswordValid });
  } catch (error) {
    logger.error('Error verifying credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
const calculatePredictedPayments = async (room, currentDate) => {
  const newPayments = [];
  const [tenant] = await new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM tenants WHERE id = ?',
      [room.tenantId],
      (error, results) => {
        if (error) reject(error);
        else resolve(results);
      }
    );
  });

  let paymentStartDate = moment(tenant?.startTime || Date.now());
  let paymentEndDate = null;

  if (room.selectedAgreementId) {
    const [agreement] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM agreements WHERE id = ?',
        [room.selectedAgreementId],
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    if (agreement) {
      paymentStartDate = moment(agreement.startTime);
      if (tenant?.SelectedAgreement === 'Fixed-Term') {
        paymentEndDate = moment(agreement.endTime);
      }
    }
  }

  const existingPayments = await new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM room_pay_info WHERE roomId = ?',
      [room.id],
      (error, results) => {
        if (error) reject(error);
        else resolve(results);
      }
    );
  });

  let currentPaymentDate = paymentStartDate.clone();

  // Generate past payments up to the current date
  while (currentPaymentDate.isSameOrBefore(currentDate)) {
    const paymentId = `${room.id}-${currentPaymentDate.valueOf()}`;
    newPayments.push({
      id: paymentId,
      Day: currentPaymentDate.valueOf(),
      Value: room.AgreedPrice,
      Paid: existingPayments.find((p) => p.id === paymentId)?.Paid || false,
      roomId: room.id,
    });

    // Calculate next payment date based on payment cycle
    switch (room.PaymentCycleType) {
      case '30':
        currentPaymentDate.add(30, 'days');
        break;
      case '15':
        currentPaymentDate.add(15, 'days');
        break;
      case '7':
        currentPaymentDate.add(7, 'days');
        break;
      case 'daily':
        currentPaymentDate.add(1, 'day');
        break;
      case 'monthly':
        currentPaymentDate.add(1, 'month');
        break;
      case 'Annually':
        currentPaymentDate.add(1, 'year');
        break;
      case 'weekly':
        currentPaymentDate.add(7, 'days');
        break;
      case 'custom':
        currentPaymentDate.add(room.PaymentCycleCustomeDays || 30, 'days');
        break;
      default:
        currentPaymentDate.add(1, 'month');
    }
  }

  // Generate future payments (next 10 payments)
  for (let i = 0; i < 10; i++) {
    if (paymentEndDate && currentPaymentDate.isAfter(paymentEndDate)) {
      break;
    }

    const paymentId = `${room.id}-${currentPaymentDate.valueOf()}`;
    newPayments.push({
      id: paymentId,
      Day: currentPaymentDate.valueOf(),
      Value: room.AgreedPrice,
      Paid: false,
      roomId: room.id,
    });

    // Calculate next payment date based on payment cycle
    switch (room.PaymentCycleType) {
      case '30':
        currentPaymentDate.add(30, 'days');
        break;
      case '15':
        currentPaymentDate.add(15, 'days');
        break;
      case '7':
        currentPaymentDate.add(7, 'days');
        break;
      case 'daily':
        currentPaymentDate.add(1, 'day');
        break;
      case 'monthly':
        currentPaymentDate.add(1, 'month');
        break;
      case 'weekly':
        currentPaymentDate.add(7, 'days');
        break;
      case 'Annually':
        currentPaymentDate.add(1, 'year');
        break;
      case 'custom':
        currentPaymentDate.add(room.PaymentCycleCustomeDays || 30, 'days');
        break;
      default:
        currentPaymentDate.add(1, 'month');
    }
  }

  return newPayments;
};

// Notification Processing
const processNotifications = async () => {
  logger.debug('Starting notification process');
  try {
    logger.debug('Fetching all users');
    const users = await new Promise((resolve, reject) => {
      pool.query('SELECT * FROM users', (error, results) => {
        if (error) reject(error);
        else resolve(results);
      });
    });

    for (const user of users) {
      logger.debug(`Processing user: ${user.id}`);
      const rooms = await new Promise((resolve, reject) => {
        pool.query(
          'SELECT * FROM rooms WHERE userId = ? AND notificationSettings != 0',
          [user.id],
          (error, results) => {
            if (error) reject(error);
            else resolve(results);
          }
        );
      });

      for (const room of rooms) {
        try {
          const tenant = await new Promise((resolve, reject) => {
            pool.query(
              'SELECT * FROM tenants WHERE id = ?',
              [room.tenantId],
              (error, results) => {
                if (error) reject(error);
                else resolve(results[0]);
              }
            );
          });

          if (!tenant) continue;

          const predictedPayments = await calculatePredictedPayments(room, moment());
          const nextUnpaidPayment = predictedPayments.find(p => !p.Paid);

          if (nextUnpaidPayment) {
            const notificationResult = shouldSendNotification(
              nextUnpaidPayment.Day,
              room.notificationSettings
            );

            if (notificationResult.shouldSendTenantEmail || notificationResult.shouldSendRepEmail) {
              const emailTemplate = await getEmailTemplate(room, nextUnpaidPayment);
              if (!emailTemplate) continue;

              if (notificationResult.shouldSendTenantEmail && tenant.email) {
                await sendEmail(
                  tenant.email,
                  emailTemplate.subject,
                  emailTemplate.body,
                  user
                );
                await logEmailSent(tenant.email, emailTemplate, user, 'TENANT');
              }

              if (notificationResult.shouldSendRepEmail && user.RepresentativeEmail) {
                const repEmails = user.RepresentativeEmail.split(',');
                for (const repEmail of repEmails) {
                  await sendEmail(
                    repEmail.trim(),
                    `[REP] ${emailTemplate.subject}`,
                    emailTemplate.body,
                    user
                  );
                  await logEmailSent(repEmail.trim(), emailTemplate, user, 'REP');
                }
              }
            }
          }
        } catch (error) {
          logger.error(`Error processing room ${room.id}:`, error);
        }
      }
    }
  } catch (error) {
    logger.error('Error in notification process:', error);
  }
};

// Helper functions
const getEmailTemplate = async (room, payment) => {
  // Add your email template fetching logic here
  // Return { subject, body }
};

const logEmailSent = async (recipient, template, user, type) => {
  const historyEntry = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    receiver: recipient,
    subject: template.subject,
    body: template.body,
    sentDate: Date.now(),
    from: user.selectedEmailToSendWith,
    mode: `${type}_Automatic`,
    userId: user.id
  };

  await new Promise((resolve, reject) => {
    pool.query(
      'INSERT INTO email_history SET ?',
      [historyEntry],
      (error) => {
        if (error) reject(error);
        else resolve();
      }
    );
  });
};

// Add these routes before your existing routes
app.post('/api/trigger-notifications', async (req, res) => {
  logger.debug('Manual trigger of check-and-send process');
  try {
    await processNotifications();
    res.json({ success: true, message: 'Notifications processed successfully' });
  } catch (error) {
    logger.error('Error processing notifications:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Add the cron job to run notifications automatically
cron.schedule('0 10 * * *', async () => {
  logger.debug('Running scheduled notification check');
  await processNotifications();
}, {
  scheduled: true,
  timezone: 'Africa/Addis_Ababa'
});

// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// Routes ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// Add this endpoint to your server code
// Add this to your server code

app.post('/api/replace-user-data', async (req, res) => {
  const { userId, tables } = req.body;
  console.log('Received data:', JSON.stringify({ userId, tables }, null, 2));

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    for (const [tableName, newRows] of Object.entries(tables)) {
      // Check if the table has a userId column
      const [columns] = await connection.query(
        `SHOW COLUMNS FROM ${tableName} LIKE 'userId'`
      );
      const hasUserId = columns.length > 0;

      if (hasUserId) {
        // Delete existing rows if userId column exists
        await connection.query('DELETE FROM ?? WHERE userId = ?', [
          tableName,
          userId,
        ]);
      }

      // Insert new rows
      if (Array.isArray(newRows) && newRows.length > 0) {
        const columns = Object.keys(newRows[0]).join(', ');
        const placeholders = Array(Object.keys(newRows[0]).length)
          .fill('?')
          .join(', ');
        const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;

        for (const row of newRows) {
          await connection.query(query, Object.values(row));
        }
      }
    }

    await connection.commit();
    res.json({ message: 'User data replaced successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
});

const getAllFiles = async (dirPath) => {
  const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  const fileList = [];

  for (const file of files) {
    const filePath = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      fileList.push(...(await getAllFiles(filePath)));
    } else {
      fileList.push(filePath);
    }
  }

  return fileList;
};

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
    res
      .status(500)
      .json({
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
    logger.debug('Error checking user directory:', error);
    res
      .status(500)
      .json({
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
      logger.debug('Extracted files:', extractedFiles);

      res.json({
        message: 'Files uploaded and extracted successfully',
        extractedFiles,
      });
    } catch (error) {
      logger.debug('Error processing uploaded files:', error);
      res
        .status(500)
        .json({
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
    'notification_template_selections','Exchange_RatesUSDtoETB',
    'email_templates',
    'utility_payments',
    'utility_payments_settings',
    'sms_templates',
    'email_history', 'sms_history',
    'expenses',
    'room_pay_info_history',
    'app_users',
    'action_history',
    'branches',
  ];

  if (!validTables.includes(tableName)) {
    logger.debug(`Invalid table name attempted: ${tableName}`);
    return false;
  }
  return true;
};

app.get('/api/:tableName', (req, res) => {
  const { tableName } = req.params;
  if (!validateTableName(tableName)) {
    return res.status(400).send('Invalid table name.');
  }
 

  pool.getConnection((err, connection) => {
    if (err) {
      logger.debug(`Database connection error: ${err.message}`);
      throw err;
    }

    connection.query(`SELECT * FROM ??`, [tableName], (error, rows) => {
      connection.release();
      if (!error) {
        res.send(rows);
      } else {
        logger.debug(`Error selecting from ${tableName}: ${error.message}`);
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
    if (err) {
      logger.debug(`Database connection error: ${err.message}`);
      throw err;
    }

    const query = `SELECT * FROM ?? ${sqlCode}`;
    connection.query(query, [tableName], (error, rows) => {
      connection.release();
      if (!error) {
        res.send(rows);
      } else {
        logger.debug(`Error executing query on ${tableName}: ${error.message}`);
        logger.debug(`Failed SQL: ${query}`);
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
    if (err) {
      logger.debug(`Database connection error: ${err.message}`);
      throw err;
    }

    connection.query(
      `SELECT * FROM ?? WHERE id = ?`,
      [tableName, id],
      (error, rows) => {
        connection.release();
        if (!error) {
          res.send(rows);
        } else {
          logger.debug(
            `Error selecting id ${id} from ${tableName}: ${error.message}`
          );
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
    if (err) {
      logger.debug(`Database connection error: ${err.message}`);
      throw err;
    }

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
          logger.debug(
            `Error deleting id ${id} from ${tableName}: ${error.message}`
          );
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
    if (err) {
      logger.debug(`Database connection error: ${err.message}`);
      throw err;
    }

    connection.query(
      `INSERT INTO ?? SET ?`,
      [tableName, params],
      (error, result) => {
        connection.release();
        if (!error) {
          res.json({ message: `New record added to ${tableName}.` });
        } else {
          logger.debug(`Error inserting into ${tableName}: ${error.message}`);
          logger.debug(`Failed insert params: ${JSON.stringify(params)}`);
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
    if (err) {
      logger.debug(`Database connection error: ${err.message}`);
      throw err;
    }

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
            logger.debug(`Record not found - table: ${tableName}, id: ${id}`);
            res.status(404).json({ error: `Record with ID ${id} not found.` });
          }
        } else {
          logger.debug(
            `Error updating ${tableName} id ${id}: ${error.message}`
          );
          logger.debug(`Failed update value: ${columnValue}`);
          res.sendStatus(500);
        }
      }
    );
  });
});

app.listen(PORT, () => {
  logger.debug(
    `Server started successfully on port ${PORT} /n /n ------------------------------------------------------------------------------------------------------`
  );
});
