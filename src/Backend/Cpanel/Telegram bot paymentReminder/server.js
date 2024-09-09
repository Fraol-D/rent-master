const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const app = express();
const PORT = 8100;
app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
  },
});
const apiKey = 'HH(CzZuQoW@tB$By)e';

const checkApiKey = (req, res, next) => {
  const providedApiKey = req.headers['x-api-key'];
  if (providedApiKey === apiKey) {
    next();
  } else {
    res.status(403).send('Forbidden');
  }
};

app.use('/api', checkApiKey);

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'marketuz_SWB',
  password: 'Plp5H9:Li(UO#6[y+26E',
  database: 'marketuz_SWB',
});

const log4js = require('log4js');
log4js.configure({
  appenders: { everything: { type: 'file', filename: 'logs.log' } },
  categories: { default: { appenders: ['everything'], level: 'ALL' } }
});
const logger = log4js.getLogger();

app.get('/api/test-email', async (req, res) => {
  try {
    const result = await sendEmail('christian.watch.cool@gmail.com', 'Test Subject', 'This is a test email');
    if (result.success) {
      res.status(200).send('Test email sent successfully');
    } else {
      res.status(500).send('Failed to send test email: ' + result.error);
    }
  } catch (error) {
    res.status(500).send('Error sending test email: ' + error.message);
  }
});

app.get('/api/log', (req, res) => {
  res.sendFile(path.join(__dirname + '/logs.log'));
});

const sendEmail = async (email, subject, text) => {
  const transporter = nodemailer.createTransport({
    host: 'rentmaster.markethubet.com',
    port: 465,
    secure: true,
    auth: {
      user: 'seblewenglesbuilding@rentmaster.markethubet.com',
      pass: 'Plp5H9:Li(UO#6[y+26E'
    }
  });

  const mailOptions = {
    from: 'seblewenglesbuilding@rentmaster.markethubet.com',
    to: email,
    subject: subject,
    text: text
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const checkAndSendEmails = async () => {
  logger.debug('Starting checkAndSendEmails function');
  const currentTimestamp = Math.floor(Date.now() / 1000);
  logger.debug(`Current timestamp: ${currentTimestamp}`);
  const query = 'SELECT * FROM notifications WHERE status != "sent" AND sendOn <= ?';

  return new Promise((resolve, reject) => {
    logger.debug('Querying database for notifications');
    pool.query(query, [currentTimestamp], async (err, results) => {
      if (err) {
        logger.debug('Error fetching notifications:', err);
        reject(err);
        return;
      }

      logger.debug(`Found ${results.length} notifications to process`);

      const sentEmails = [];
      const failedEmails = [];
      const failedEmailsErrors = [];

      for (const notification of results) {
        logger.debug(`Processing notification ID: ${notification.id}`);
        logger.debug(`Sending email to: ${notification.email}`);
        const emailResult = await sendEmail(notification.email, 'Payment Notification', notification.message);

        if (emailResult.success) {
          logger.debug(`Email sent successfully for notification ID: ${notification.id}`);
          const updateQuery = 'UPDATE notifications SET status = "sent" WHERE id = ?';
          pool.query(updateQuery, [notification.id], (updateErr) => {
            if (updateErr) {
              logger.debug('Error updating notification status:', updateErr);
            } else {
              logger.debug(`Updated status to "sent" for notification ID: ${notification.id}`);
            }
          });
          sentEmails.push(notification.id);
        } else {
          logger.debug(`Error sending notification email for ID ${notification.id}:`, emailResult.error);
          const updateQuery = 'UPDATE notifications SET status = "failed" WHERE id = ?';
          pool.query(updateQuery, [notification.id], (updateErr) => {
            if (updateErr) {
              logger.debug('Error updating notification status:', updateErr);
            } else {
              logger.debug(`Updated status to "failed" for notification ID: ${notification.id}`);
            }
          });
          failedEmails.push(notification.id);
          failedEmailsErrors.push(`Error sending notification email for ID ${notification.id}: ${emailResult.error}`);
        }
      }

      logger.debug(`Processed all notifications. Sent: ${sentEmails.length}, Failed: ${failedEmails.length}`);
      resolve({ sentEmails, failedEmails, failedEmailsErrors });
    });
  });
};

app.post('/api/check-and-send-emails', async (req, res) => {
  try {
    const result = await checkAndSendEmails();
    res.status(200).send({
      status: 'success',
      message: 'Emails checked and sent',
      sentEmails: result.sentEmails,
      failedEmails: result.failedEmails
    });
  } catch (error) {
    res.status(500).send({
      status: 'error',
      message: 'Error checking and sending emails',
      error: error.message
    });
  }
});

cron.schedule('0 */6 * * *', async () => {
  try {
    await checkAndSendEmails();
    logger.debug('Scheduled email check and send completed');
  } catch (error) {
    logger.debug('Error in scheduled email check and send:', error);
  }
});

app.post('/api/add-notification', (req, res) => {
  const { user_id, email, message, sendOn } = req.body;

  if (!user_id || !email || !message || !sendOn) {
    return res.status(400).send('All fields are required');
  }

  const query = 'INSERT INTO notifications (user_id, email, message, status, sendOn) VALUES (?, ?, ?, "pending", ?)';
  pool.query(query, [user_id, email, message, sendOn], (err, results) => {
    if (err) {
      return res.status(500).send('Error adding notification: ' + err.message);
    }

    res.status(201).send({ status: 'success', id: results.insertId });
  });
});

app.post('/api/delete-notification', (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).send('Notification ID is required');
  }

  const query = 'DELETE FROM notifications WHERE id = ?';
  pool.query(query, [id], (err, results) => {
    if (err) {
      return res.status(500).send('Error deleting notification: ' + err.message);
    }
    res.status(200).send({ status: 'success', message: 'Notification deleted' });
  });
});

app.get('/api/list-notifications', (req, res) => {
  const query = 'SELECT * FROM notifications';
  pool.query(query, (err, results) => {
    if (err) {
      return res.status(500).send('Error listing notifications: ' + err.message);
    }
    res.status(200).send(results);
  });
});
/*
app.get('/api/downloadImage', (req, res) => {
  const userId = req.headers['user-id'];
  const filename = req.headers['filename'];

  if (!userId || !filename) {
    return res.status(400).json({ error: 'User ID and filename are required in headers' });
  }

  const filePath = path.join(__dirname, 'Images', userId, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'File not found' });
    }

    const mimeType = mime.lookup(filePath);
    res.setHeader('Content-Type', mimeType);
    res.sendFile(filePath);
  });
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  const userId = req.headers['user-id'];
  const filename = req.headers['filename'];

  if (!file) {
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  if (!userId) {
    return res.status(400).json({ error: 'User ID not provided in headers.' });
  }

  if (!filename) {
    return res.status(400).json({ error: 'Filename not provided in headers.' });
  }

  const userDir = path.join(__dirname, 'Images', userId);
  const newFilePath = path.join(userDir, filename);

  fs.mkdir(userDir, { recursive: true }, (err) => {
    if (err) {
      console.error('Error creating directory:', err);
      return res.status(500).json({ error: `Error creating directory: ${err.message}` });
    }

    fs.rename(file.path, newFilePath, (err) => {
      if (err) {
        console.error('Error moving file:', err);
        return res.status(500).json({ error: `Error moving file: ${err.message}` });
      }

      if (file.size > 5 * 1024 * 1024) {
        return res.status(400).json({ error: 'File size exceeds 5 MB limit.' });
      }

      res.status(200).json({ message: 'File saved successfully', filename: filename });
    });
  });
});

app.get('/api/directory/:userId', (req, res) => {
  const userId = req.params.userId;
  const userDir = path.join(__dirname, 'Images', userId);

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  fs.access(userDir, fs.constants.F_OK, (err) => {
    if (err) {
      return res.status(404).json({ error: 'User directory not found.' });
    }

    const directoryStructure = getDirectoryStructure(userDir);
    res.json({ structure: directoryStructure });
  });
});

const getDirectoryStructure = (dirPath) => {
  const structure = {};

  const items = fs.readdirSync(dirPath);
  items.forEach((item) => {
    const fullPath = path.join(dirPath, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      structure[item] = getDirectoryStructure(fullPath);
    } else {
      structure[item] = 'file';
    }
  });

  return structure;
};

app.delete('/api/delete', (req, res) => {
  const userId = req.headers['user-id'];
  const filename = req.headers['filename'];

  if (!userId || !filename) {
    return res.status(400).json({ error: 'User ID and Filename must be provided in headers.' });
  }

  const userDir = path.join(__dirname, 'Images', userId);
  const filePath = path.join(userDir, filename);

  fs.access(filePath, fs.constants.F_OK, (err) => {
    const directoryStructure = getDirectoryStructure(path.join(__dirname, 'Images'));
    if (err) {
      return res.status(404).json({ error: 'File not found.', structure: directoryStructure });
    }

    fs.unlink(filePath, (err) => {
      if (err) {
        return res.status(500).json({ error: 'Error deleting file.', structure: directoryStructure });
      }

      res.status(200).json({
        message: 'File deleted successfully',
        structure: directoryStructure,
      });
    });
  });
});
*/
const validateTableName = (tableName) => {
  const validTables = [
    'users',
    "settings_table",
    'product_price_changes',
    'product_advanced_positions',
    'products',
    'branches',
    'categories',
    'saleshistory',
    'number_time_ob_statgraph',
    'number_time_ob_statgraph_productids',
    'customers',
    'vendors',
    'paylater_customers',
    'paylater_vendor',
    'stockitems',
    'stockitemsimport',
    'sellandprofittotimeproduct',
    "user_images"
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
          console.error(error);
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
          console.error(error);
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
          console.error(error);
          res.sendStatus(500);
        }
      },
    );
  });
});

app.listen(PORT, () => {
  logger.debug(`Server is running on port ${PORT}`);
});
