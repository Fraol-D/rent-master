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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
app.use(cors({
  origin: ['http://localhost:1212', 'https://www.rentmaster.markethubet.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
  credentials: true
}));
const corsOptions = {
  origin: 'http://localhost:1212',
  optionsSuccessStatus: 200
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
  categories: { default: { appenders: ['everything'], level: 'ALL' } }
});
const logger = log4js.getLogger();

// Email sending function
app.get('/log', (req, res) => {
  res.sendFile(path.join(__dirname, 'logs.log'));
});


// EMAIL ALLLL

const sendEmail = async (email, subject, text,user) => {
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
      pass: user.selectedEmailToSendWithPassword
    }
  });

  const mailOptions = {
    from: user.selectedEmailToSendWith,
    to: email,
    subject: subject,
    text: text
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
  logger.debug(`Checking notification for payment day: ${paymentDay}, notification setting: ${notificationSetting}`);
  const dueMoment = moment(paymentDay);
  const now = moment().startOf('day');
  const daysFromDue = now.diff(dueMoment, 'days');

  logger.debug(`Due date: ${dueMoment.format('YYYY-MM-DD')}, Days from due: ${daysFromDue}`);

  const notificationDays = [-5, -3, -1, 0, 1, 3, 5, 7];
  for (let i = 0; i < notificationDays.length; i++) {
    if (daysFromDue === notificationDays[i]) {
      const emailBit = i * 2;
      const smsBit = i * 2 + 1;
      const shouldSendEmail = (notificationSetting & (1 << emailBit)) !== 0;
      const shouldSendSMS = (notificationSetting & (1 << smsBit)) !== 0;
      logger.debug(`Notification check result: Email: ${shouldSendEmail}, SMS: ${shouldSendSMS}`);
      return { shouldSendEmail, shouldSendSMS };
    }
  }
  logger.debug('No notification needed for this date');
  return { shouldSendEmail: false, shouldSendSMS: false };
};

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
      roomId: room.id
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
      roomId: room.id
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
      case 'custom':
        currentPaymentDate.add(room.PaymentCycleCustomeDays || 30, 'days');
        break;
      default:
        currentPaymentDate.add(1, 'month');
    }
  }

  return newPayments;
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
      logger.debug(`Fetched ${rooms.length} rooms for user: ${user.id}`);

      for (const room of rooms) {
        logger.debug(`Processing room: ${room.id}`);
        const currentDate = moment();

        const predictedPayments = await calculatePredictedPayments(room, currentDate);
        logger.debug(`Generated ${predictedPayments.length} predicted payments for room ${room.id}`);

        const nextUnpaidPayment = predictedPayments.find(payment => !payment.Paid);

        if (nextUnpaidPayment) {
          logger.debug(`Room ${room.id} has unpaid payment due on: ${moment(nextUnpaidPayment.Day).format('YYYY-MM-DD')}`);

          // Fetch tenant information
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

          if (!tenant) {
            logger.debug(`No tenant found for room ${room.id}`);
            continue;
          }

          const { shouldSendEmail, shouldSendSMS } = shouldSendNotification(
            nextUnpaidPayment.Day,
            room.notificationSettings
          );

          if (shouldSendEmail) {
            logger.debug(
              `Sending email notification for room ${room.id} to tenant ${tenant.email}`
            );
            const notificationTypes = [
              '5 days before due',
              '3 days before due',
              '1 day before due',
              'On due date',
              '1 day after due',
              '3 days after due',
              '5 days after due',
              '7 days after due',
            ];

            const getEmailTemplateIdQuery = `SELECT * FROM notification_template_selections WHERE id = '${
              room.id
            }_${notificationTypes.find((type) => {
              const daysBeforeDue = moment(nextUnpaidPayment.Day).diff(currentDate, 'days');
              return (
                (type === '5 days before due' && daysBeforeDue === 5) ||
                (type === '3 days before due' && daysBeforeDue === 3) ||
                (type === '1 day before due' && daysBeforeDue === 1) ||
                (type === 'On due date' && daysBeforeDue === 0) ||
                (type === '1 day after due' && daysBeforeDue === -1) ||
                (type === '3 days after due' && daysBeforeDue === -3) ||
                (type === '5 days after due' && daysBeforeDue === -5) ||
                (type === '7 days after due' && daysBeforeDue === -7)
              );
            })}'`;

            const [EmailTemplateObject] = await new Promise(
              (resolve, reject) => {
                pool.query(getEmailTemplateIdQuery, (error, results) => {
                  if (error) reject(error);
                  else resolve(results);
                });
              }
            );

            logger.debug(
              `EmailTemplateObject: ${JSON.stringify(EmailTemplateObject)}`
            );

            if (
              !EmailTemplateObject ||
              !EmailTemplateObject.email_template_id
            ) {
              logger.warn(`No email template selected for room ${room.id}`);
              return; // Skip sending email if no template is selected
            }

            const getSelectedEmailTemplateQuery = `SELECT * FROM email_templates WHERE id = ?`;
            const [selectedEmailTemplate] = await new Promise(
              (resolve, reject) => {
                pool.query(
                  getSelectedEmailTemplateQuery,
                  [EmailTemplateObject.email_template_id],
                  (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                  }
                );
              }
            );

            logger.debug(
              `selectedEmailTemplate: ${JSON.stringify(selectedEmailTemplate)}`
            );

            if (!selectedEmailTemplate) {
              logger.warn(
                `Email template with id ${EmailTemplateObject.email_template_id} not found`
              );
              return; // Skip sending email if the template is not found
            }

            const variables = [
              'tenant_name',
              'landlord_name',
              'due_amount',
              'due_date',
              'landlord_Email',
              'landlord_Telephone',
              'due_duration',
            ];

            let endOfBillingPeriod;
            switch (room.PaymentCycleType) {
              case '30':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(30, 'days');
                break;
              case '15':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(15, 'days');
                break;
              case '7':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(7, 'days');
                break;
              case 'monthly':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(1, 'months');
                break;
              case 'weekly':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(1, 'weeks');
                break;
              case 'daily':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(1, 'days');
                break;
              case 'custom':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(room.PaymentCycleCustomeDays, 'days');
                break;
              default:
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(1, 'months');
                break;
            }

            const startOfBillingPeriod = moment(nextUnpaidPayment.Day)
              .subtract(0, 'months')
              .startOf('day');

            const replacements = {
              tenant_name: tenant.name,
              landlord_name: user.fullName,
              due_amount: nextUnpaidPayment.Value,
              due_date: moment(nextUnpaidPayment.Day).format('MMMM D, YYYY'),
              landlord_Email: user.email,
              landlord_Telephone: user.phoneNumber,
              due_duration: `${startOfBillingPeriod.format(
                'MMMM D, YYYY'
              )} - ${endOfBillingPeriod.format('MMMM D, YYYY')}`,
            };

            let emailSubject = selectedEmailTemplate.subject;
            let emailBody = selectedEmailTemplate.body;

        

            variables.forEach((variable) => {
              const regex = new RegExp(`{{${variable}}}`, 'g');
              emailSubject = emailSubject.replace(
                regex,
                replacements[variable]
              );
              emailBody = emailBody.replace(
                regex,
                replacements[variable]
              );
            });

            const emailResult = await sendEmail(
              tenant.email,
              emailSubject,
              emailBody,
              user
            );
            logger.debug(
              `Email sending result: ${JSON.stringify(emailResult)}`
            );
            // Add a row to email_history
            const addToEmailHistoryQuery = `
              INSERT INTO email_history (id, receiver, subject, body, templateId, sentDate, \`from\`, mode,userId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
            `;
            const emailHistoryId = `${room.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const sentDate = moment().valueOf();

            await new Promise((resolve, reject) => {
              pool.query(
                addToEmailHistoryQuery,
                [
                  emailHistoryId,
                  tenant.email,
                  emailSubject,
                  emailBody,
                  EmailTemplateObject.email_template_id,
                  sentDate,
                  user.selectedEmailToSendWith,
                  `Automatically`,
                  user.id,
                ],
                (error, results) => {
                  if (error) reject(error);
                  else resolve(results);
                }
              );
            });
          }
          if (shouldSendSMS) {
            logger.debug(
              `Sending SMS notification for room ${room.id} to tenant ${tenant.phoneNumber}`
            );
            // TODO: Implement actual SMS sending here
            // const smsMessage = `Rent reminder: Your payment of $${nextUnpaidPayment.Value.toFixed(2)} for ${room.name} is due on ${moment(nextUnpaidPayment.Day).format('MM/DD/YYYY')}. Please pay on time to avoid late fees.`;
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

let notificationTask;

// Schedule the cron job
notificationTask = cron.schedule('0 13 * * *', async () => {
  logger.debug('Cron job triggered: Running daily email check and send at 10:00 AM Ethiopian Time');
  try {
    await processNotifications();
    logger.debug('Daily email check and send completed');
  } catch (error) {
    logger.error('Error in daily email check and send:', error);
  }
}, {
  scheduled: true,
  timezone: "Africa/Addis_Ababa"
});app.get('/api/trigger-cron', (req, res) => {
  logger.debug('Manual trigger of cron job');
  if (notificationTask) {
    processNotifications()
      .then(() => {
        res.status(200).json({ message: 'Cron job triggered manually and completed successfully' });
      })
      .catch((error) => {
        logger.error('Error in manual cron job execution:', error);
        res.status(500).json({ message: 'Error occurred while executing cron job manually', error: error.message });
      });
  } else {
    res.status(500).json({ message: 'Cron job is not properly initialized' });
  }
});
app.get('/api/test-check-and-send', async (req, res) => {
  logger.debug('Manual trigger of check-and-send process');
  try {
    await processNotifications();
    logger.debug('Manual check-and-send completed successfully');
    res.status(200).json({
      status: 'success',
      message: 'Emails checked and sent'
    });
  } catch (error) {
    logger.error('Error in manual check-and-send:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error checking and sending emails',
      error: error.message
    });
  }
});
// Routes
app.post('/api/replace-user-data', async (req, res) => {
  const { userId, tables } = req.body;
  console.log('Received data:', JSON.stringify({ userId, tables }, null, 2));

  const connection = await pool.promise().getConnection();

  try {
    await connection.beginTransaction();

    for (const [tableName, newRows] of Object.entries(tables)) {
      // Check if the table has a userId column
      const [columns] = await connection.query(`SHOW COLUMNS FROM ${tableName} LIKE 'userId'`);
      const hasUserId = columns.length > 0;

      if (hasUserId) {
        // Delete existing rows if userId column exists
        await connection.query('DELETE FROM ?? WHERE userId = ?', [tableName, userId]);
      }

      // Insert new rows
      if (Array.isArray(newRows) && newRows.length > 0) {
        const columns = Object.keys(newRows[0]).join(', ');
        const placeholders = Array(Object.keys(newRows[0]).length).fill('?').join(', ');
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
      fileList.push(...await getAllFiles(filePath));
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
    const serverFiles = await fs.promises.readdir(serverPath, { withFileTypes: true });
    logger.debug(`Checking server directory: ${serverPath}`);

    for (const serverFile of serverFiles) {
      const serverFilePath = path.join(serverPath, serverFile.name);
      const relativeFilePath = path.join(relativePath, serverFile.name);
      
      if (serverFile.isDirectory()) {
        logger.debug(`Directory found on server: ${relativeFilePath}`);
        const clientSubDir = clientDir.children.find(child => child.name === serverFile.name && child.type === 'directory');
        if (clientSubDir) {
          await checkDirectory(clientSubDir, serverFilePath, relativeFilePath);
        } else {
          logger.debug(`Missing directory in client: ${relativeFilePath}`);
          missingFiles.push(relativeFilePath);
        }
      } else {
        logger.debug(`File found on server: ${relativeFilePath}`);
        const clientFile = clientDir.children.find(child => child.name === serverFile.name && child.type === 'file');
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
    logger.debug(`Missing files for user ${userId}: ${JSON.stringify(missingFiles)}`);
    res.json({ missingFiles });
  } catch (error) {
    logger.error('Error checking missing files:', error);
    res.status(500).json({ error: 'Failed to check missing files', details: error.message });
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
    res.set('Content-Disposition', `attachment; filename=missing_files_${userId}.zip`);
    res.send(zipContent);
  } catch (error) {
    logger.error('Error preparing missing files for download:', error);
    res.status(500).json({ error: 'Failed to prepare missing files for download', details: error.message });
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
    res.status(500).json({ error: 'Failed to check user directory', details: error.message });
  }
});

app.post('/api/upload-missing-files', upload.single('files'), async (req, res) => {
  const { userId } = req.body;
  const zipFilePath = req.file.path;
  const extractPath = path.join(baseDir, userId);

  try {
    await extract(zipFilePath, { dir: extractPath });
    fs.unlinkSync(zipFilePath);

    const extractedFiles = await getAllFiles(extractPath);
    logger.debug('Extracted files:', extractedFiles);

    res.json({ message: 'Files uploaded and extracted successfully', extractedFiles });
  } catch (error) {
    logger.debug('Error processing uploaded files:', error);
    res.status(500).json({ error: 'Failed to process uploaded files', details: error.message });
  }
});




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
    'agreements','notification_template_selections','email_templates','utility_payments','utility_payments_settings','sms_templates','email_history','expenses'
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
        logger.debug(error);
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
        logger.debug(error);
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
          logger.debug(error, 'bruh');
          res.sendStatus(500);
        }
      },
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
          logger.debug(error);
          res.sendStatus(500);
        }
      },
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
          logger.debug(error);
          res.sendStatus(500);
        }
      },
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
                  logger.debug(error);
          res.sendStatus(500);
        }
      },
    );
  });
});

// Start server
app.listen(PORT, () => {
  logger.debug(`Server is running on port ${PORT}`);
});





