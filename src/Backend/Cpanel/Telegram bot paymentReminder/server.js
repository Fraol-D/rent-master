
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
            WHERE id = ?
          `;
          const [tenant] = await new Promise((resolve, reject) => {
            pool.query(getTenantQuery, [room.tenantId], (error, results) => {
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
              const daysBeforeDue = moment(nextPayment.Day).diff(
                currentDate,
                'days'
              );
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
            const variables = [
              'tenant_name',
              'landlord_name',
              'due_amount',
              'due_date',
              'landlord_Email',
              'landlord_Telephone',
            ];

            const replacements = {
              tenant_name: tenant.name,
              landlord_name: user.fullName,
              due_amount: nextPayment.Amount,
              due_date: moment(nextPayment.Day).format('MMMM D, YYYY'),
              landlord_Email: user.email,
              landlord_Telephone: user.fullName,
            };

            let emailSubject = selectedEmailTemplate.subject;
            let emailBody = selectedEmailTemplate.body;

            variables.forEach((variable) => {
              const regex = new RegExp(`{{${variable}}}`, 'g');
              emailSubject = emailSubject.replace(
                regex,
                replacements[variable]
              );
              emailBody = emailBody.replace(regex, replacements[variable]);
            });
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
