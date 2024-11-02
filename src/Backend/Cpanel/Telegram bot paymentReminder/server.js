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
             case 'Annually':
            currentPaymentDate = addYears(currentDate, 1);
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
                  case 'Annually':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(1, 'year');
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
let isProcessing = false; // Add flag to prevent concurrent executions

// Helper function to handle the notification process
async function handleNotificationProcess() {
  if (isProcessing) {
    logger.debug('Notification process already running, skipping...');
    return;
  }

  try {
    isProcessing = true;
    logger.debug('Starting notification process');
    await processNotifications();
    logger.debug('Notification process completed');
  } catch (error) {
    logger.error('Error in notification process:', error);
    throw error;
  } finally {
    isProcessing = false;
  }
}

// Schedule the cron job
notificationTask = cron.schedule('0 10 * * *', async () => {
  logger.debug('Cron job triggered: Running daily email check and send at 10:00 AM Ethiopian Time');
  try {
    await handleNotificationProcess();
    logger.debug('Daily email check and send completed');
  } catch (error) {
    logger.error('Error in daily email check and send:', error);
  }
}, {
  scheduled: true,
  timezone: "Africa/Addis_Ababa"
});

// Manual trigger endpoint
app.get('/api/trigger-cron', async (req, res) => {
  logger.debug('Manual trigger of cron job');
  if (!notificationTask) {
    return res.status(500).json({ message: 'Cron job is not properly initialized' });
  }

  try {
    if (isProcessing) {
      return res.status(409).json({ 
        message: 'Notification process is already running',
        status: 'processing'
      });
    }

    await handleNotificationProcess();
    res.status(200).json({ 
      message: 'Cron job triggered manually and completed successfully',
      status: 'success'
    });
  } catch (error) {
    logger.error('Error in manual cron job execution:', error);
    res.status(500).json({ 
      message: 'Error occurred while executing cron job manually', 
      error: error.message,
      status: 'error'
    });
  }
});

// Test endpoint
app.get('/api/test-check-and-send', async (req, res) => {
  logger.debug('Manual trigger of check-and-send process');
  try {
    if (isProcessing) {
      return res.status(409).json({
        status: 'processing',
        message: 'Notification process is already running'
      });
    }

    await handleNotificationProcess();
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

// Add a status endpoint to check if notifications are currently processing
app.get('/api/notification-status', (req, res) => {
  res.json({
    isProcessing,
    lastProcessed: isProcessing ? null : new Date().toISOString()
  });
});

// Add a cleanup function for proper shutdown
function cleanup() {
  if (notificationTask) {
    notificationTask.stop();
  }
  isProcessing = false;
}

// Handle process termination
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);