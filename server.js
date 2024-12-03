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
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);

  if (err.code === 'ETIMEDOUT') {
    return res.status(504).json({
      error: 'Connection timed out',
      message: 'Server is taking too long to respond. Please try again.',
    });
  }

  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});
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
  connectTimeout: 60000, // 60 seconds
  acquireTimeout: 60000,
  timeout: 60000,
  waitForConnections: true,
  queueLimit: 0,
});
pool.on('connection', (connection) => {
  logger.debug('New database connection established');
});

pool.on('error', (err) => {
  logger.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    logger.error('Database connection was closed. Attempting to reconnect...');
  }
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
app.get('/logs', (req, res) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    
      <title>Log Viewer</title>
      <style>
        body {
          margin: 0;
          padding: 20px;
          background: #1e1e1e;
          color: #fff;
          font-family: monospace;
        }
        .controls {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 10px;
          background: #2d2d2d;
          border-bottom: 1px solid #3d3d3d;
          display: flex;
          gap: 10px;
          z-index: 100;
        }
        .search-container {
          display: flex;
          gap: 10px;
          flex: 1;
        }
        .search-input {
          flex: 1;
          padding: 8px;
          background: #3d3d3d;
          border: 1px solid #4d4d4d;
          border-radius: 4px;
          color: white;
          font-family: monospace;
        }
        .button {
          padding: 8px 16px;
          background: #4a4a4a;
          border: none;
          border-radius: 4px;
          color: white;
          cursor: pointer;
          transition: background 0.2s;
        }
        .button:hover {
          background: #5a5a5a;
        }
        #logContent {
          margin-top: 50px;
          white-space: pre-wrap;
          word-break: break-all;
          padding: 10px;
        }
        .log-entry {
          padding: 4px 0;
          border-bottom: 1px solid #333;
        }
        .highlight {
          background-color: #ffd700;
          color: #000;
        }
        .hidden {
          display: none;
        }
      </style>
    </head>
    <body>
      <div class="controls">
        <div class="search-container">
          <input type="text" id="searchInput" class="search-input" placeholder="Search logs..." onkeyup="filterLogs()">
          <button class="button" onclick="highlightAll()">Highlight All</button>
        </div>
        <button class="button" onclick="clearLogs()">Clear Logs</button>
        <button class="button" onclick="scrollToBottom()">Scroll to Bottom</button>
      </div>
      <div id="logContent"></div>

      <script>
        let lastLogLength = 0;
        let autoScroll = true;

        function fetchLogs() {
          fetch('/log')
            .then(response => response.text())
            .then(logs => {
              const logContent = document.getElementById('logContent');
              const searchTerm = document.getElementById('searchInput').value.toLowerCase();
              const lines = logs.split('\\n');
              let html = '';
              
              lines.forEach(line => {
                if (line.trim()) {
                  const logEntry = document.createElement('div');
                  logEntry.className = 'log-entry';
                  logEntry.textContent = line;
                  
                  // Apply filter if search term exists
                  if (searchTerm && !line.toLowerCase().includes(searchTerm)) {
                    logEntry.classList.add('hidden');
                  }
                  
                  html += logEntry.outerHTML;
                }
              });
              
              logContent.innerHTML = html;
              
              // Apply highlighting if needed
              if (searchTerm) {
                highlightText(searchTerm);
              }
              
              // Auto-scroll if enabled and content has grown
              if (autoScroll && lines.length > lastLogLength) {
                scrollToBottom();
                lastLogLength = lines.length;
              }
            });
        }

        function filterLogs() {
          const searchTerm = document.getElementById('searchInput').value.toLowerCase();
          const logEntries = document.querySelectorAll('.log-entry');
          
          logEntries.forEach(entry => {
            const text = entry.textContent.toLowerCase();
            if (searchTerm && !text.includes(searchTerm)) {
              //entry.classList.add('hidden');
            } else {
              //entry.classList.remove('hidden');
            }
          });
          
          highlightText(searchTerm);
        }

        function highlightText(searchTerm) {
          const logEntries = document.querySelectorAll('.log-entry:not(.hidden)');
          
          logEntries.forEach(entry => {
            let html = entry.textContent;
            if (searchTerm) {
              const regex = new RegExp(searchTerm, 'gi');
              html = html.replace(regex, match => \`<span class="highlight">\${match}</span>\`);
            }
            entry.innerHTML = html;
          });
        }

        function highlightAll() {
          const searchTerm = document.getElementById('searchInput').value;
          if (searchTerm) {
            highlightText(searchTerm);
          }
        }

        function clearLogs() {
          fetch('/clear-logs', { method: 'POST' })
            .then(() => {
              document.getElementById('logContent').innerHTML = '';
              lastLogLength = 0;
            })
            .catch(error => console.error('Error clearing logs:', error));
        }

        function scrollToBottom() {
          window.scrollTo(0, document.body.scrollHeight);
        }

        // Initial fetch and setup periodic refresh
        fetchLogs();
        setInterval(fetchLogs, 20000);
      </script>
    </body>
    </html>
  `;
  res.send(htmlContent);
});
// Add a route to clear logs

// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs

const styles = `
    body {
      margin: 0;
      padding: 20px;
      background: #1e1e1e;
      color: #fff;
      font-family: monospace;
    }
    .controls {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      padding: 10px;
      background: #2d2d2d;
      border-bottom: 1px solid #3d3d3d;
      display: flex;
      gap: 10px;
      z-index: 100;
    }
    .content {
      margin-top: 60px;
      text-align: center;
    }
    h1 {
      font-size: 2em;
      margin-bottom: 20px;
    }
    p {
      font-size: 1.2em;
      color: #ccc;
    }
  `;
//TENANT PORTAL
app.get('/tenantPortal', (req, res) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
    <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8VQZ0E1PPS"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8VQZ0E1PPS');
</script>
      <title>Tenant Portal</title>
      <style>${styles}</style>
    </head>
    <body>
      <div class="controls">
        <h2>Tenant Portal</h2>
      </div>
      <div class="content">
        <h1>Welcome to the Tenant Portal</h1>
        <p>This is a placeholder for the tenant portal interface.</p>
        <p>More features coming soon!</p>
      </div>
    </body>
    </html>
  `;
  res.send(htmlContent);
});

app.get('/tenantPortal/:BranchAndCompany/:TenantName', async (req, res) => {
  const { BranchAndCompany, TenantName } = req.params;

  try {
    // Decode URL components to handle spaces and special characters
    const decodedBranchAndCompany = decodeURIComponent(BranchAndCompany);
    const decodedTenantName = decodeURIComponent(TenantName);

    const [branchName, companyName] = decodedBranchAndCompany.split('-');

    // Get branch
    const [branchResults] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM branches WHERE name = ?',
        [branchName],
        (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        }
      );
    });
    const branch = branchResults[0];
    if (!branch) {
      throw new Error(`Branch "${branchName}" not found`);
    }

    // Get user/company
    const [userResults] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM users WHERE companyName = ?',
        [companyName],
        (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        }
      );
    });
    const user = userResults[0];
    if (!user) {
      throw new Error(`Company "${companyName}" not found`);
    }

    // Get tenant
    const [tenantResults] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM tenants WHERE name = ?',
        [decodedTenantName],
        (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        }
      );
    });
    const tenant = tenantResults[0];
    if (!tenant) {
      throw new Error(`Tenant "${decodedTenantName}" not found`);
    }

    // Get room
    const [roomResults] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM rooms WHERE tenantId = ?',
        [tenant.id],
        (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        }
      );
    });
    const room = roomResults[0];
    if (!room) {
      throw new Error(`No room found for tenant "${decodedTenantName}"`);
    }

    // Get agreements
    const [agreements] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM agreements WHERE roomId = ?',
        [room.id],
        (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        }
      );
    });

    // Get paid payments
    const [PaidPayments] = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM room_pay_info WHERE tenantId = ?',
        [tenant.id],
        (error, results) => {
          if (error) reject(error);
          else resolve([results]);
        }
      );
    });

    // Function to get receipt path for a payment
    function getReceiptPath(payment) {
      if (!payment?.Paid) return null;

      const paymentDate = new Date(payment.Day);
      const receiptFileName = `${paymentDate.getFullYear()}-${String(
        paymentDate.getMonth() + 1
      ).padStart(2, '0')}-${String(paymentDate.getDate()).padStart(2, '0')}_`;

      // Construct the receipts folder path
      const receiptsPath = path.join(
        __dirname,
        'User Files',
        user.id,
        'Room Documents',
        `${tenant.name}, ${new Date(tenant.startTime).toDateString()}, ${
          tenant.id
        }`,
        'receipts'
      );

      // Find matching receipt file
      try {
        const files = fs.readdirSync(receiptsPath);
        const receiptFile = files.find((file) =>
          file.startsWith(receiptFileName)
        );
        return receiptFile ? receiptFile : null;
      } catch (error) {
        console.error('Error finding receipt:', error);
        return null;
      }
    }

    // Function to calculate payments based on agreements and paid status
    function calculatePayments(room, tenant, agreements) {
      const payments = [];
      const agreement = agreements.find(
        (a) => a.id === room.selectedAgreementId
      );
      if (!agreement) return [];

      let startDate = tenant?.startTime || Date.now();
      let endDate = agreement.endTime;

      let currentDate = new Date(startDate);
      const today = new Date();

      while (currentDate <= new Date(endDate)) {
        // Get receipt filename if payment is paid

        // Find if payment exists for this date
        const paid = PaidPayments.find((p) => {
          const paymentDate = new Date(p.Day);
          return (
            paymentDate.getDate() === currentDate.getDate() &&
            paymentDate.getMonth() === currentDate.getMonth() &&
            paymentDate.getFullYear() === currentDate.getFullYear()
          );
        });
        const receiptFile = paid ? getReceiptPath(paid) : null;

        // Find receipt for this payment

        const payment = {
          date: currentDate.getTime(),
          amount: paid ? paid.Value : agreement.agreedPrice,
          paid: paid ? paid.Paid : false,
          receiptFile: receiptFile,
          status: paid
            ? 'paid'
            : currentDate < today
            ? 'past-due'
            : currentDate <=
              new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000)
            ? 'near-due'
            : 'future',
        };
        payments.push(payment);

        // Advance to next payment date based on cycle
        switch (agreement.paymentCycleType) {
          case '30':
            currentDate.setDate(currentDate.getDate() + 30);
            break;
          case '15':
            currentDate.setDate(currentDate.getDate() + 15);
            break;
          case '7':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'monthly':
            currentDate.setMonth(currentDate.getMonth() + 1);
            break;
          case 'weekly':
            currentDate.setDate(currentDate.getDate() + 7);
            break;
          case 'daily':
            currentDate.setDate(currentDate.getDate() + 1);
            break;
          case 'Annually':
            currentDate.setFullYear(currentDate.getFullYear() + 1);
            break;
          default:
            currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      return payments;
    }
    function formatDate(dateString) {
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        '0'
      )}-${String(date.getDate()).padStart(2, '0')}`;
    }
    // Update the view receipt script
    const checkoutScript = `
  <script>
    async function viewReceipt(dateString) {
      console.log(dateString);
      try {
        const date = new Date(dateString);
        const formattedDate = \`\${date.getFullYear()}-\${String(date.getMonth() + 1).padStart(2, '0')}-\${String(date.getDate()).padStart(2, '0')}\`;
        const response = await fetch('/receipt/${user.id}/${room.id}/${tenant.id}/' + formattedDate);
        if (!response.ok) {
          throw new Error('Receipt not found');
        }
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url);
      } catch (error) {
        console.error('Error fetching receipt:', error);
        alert('Could not load receipt');
      }
    }
  </script>
`;
    const payments = calculatePayments(room, tenant, agreements);
    const agreement = agreements.find((a) => a.id === room.selectedAgreementId);

    // Add this script to the HTML template (before closing body tag)
    const positioningScript = `
<script>
  function updateCurrentDatePosition() {
    const timeline = document.querySelector('.timeline');
    const indicator = document.querySelector('.current-date-indicator');
    if (timeline && indicator) {
      const timelineLeft = timeline.getBoundingClientRect().left;
      const indicatorLeft = indicator.getBoundingClientRect().left;
      const position = indicatorLeft - timelineLeft;
      timeline.style.setProperty('--current-date-position', position + 'px');
    }
  }

  // Update position when page loads and on window resize
  window.addEventListener('load', updateCurrentDatePosition);
  window.addEventListener('resize', updateCurrentDatePosition);
</script>
`;
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
      <!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-8VQZ0E1PPS"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-8VQZ0E1PPS');
</script>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Tenant Portal</title>
        <link rel="stylesheet" href="/assets2/index-Dap_4Qtg.css">
        ${checkoutScript}
      </head>
      <body>
        <div id="root">
          <div class="MainContainerTP">
            <div class="controls">
              <div class="tenant-info-container">
                <h1 class="tenant-name">${tenant.name}</h1>

                <div class="room-info">
                  <div class="room-details">
                    <p class="room-text">
                      Room: ${room.roomIndex} - Floor: ${room.floor}
                    </p>
                    <p class="branch-text">
                      <span class="branch-name">${branch.name}</span>
                      <span class="branch-location">${branch.location}</span>
                    </p>
                  </div>
                </div>

                <div class="tenant-details">
                  <p class="detail-row">
                    <span class="detail-label">Rent Reason:</span>
                    <span class="detail-value">${
                      tenant.RentReason ? tenant.RentReason : '-'
                    }</span>
                  </p>

                  ${
                    tenant.TIN && tenant.TIN.toString().length >= 10
                      ? `
                    <p class="detail-row">
                      <span class="detail-label">TIN:</span>
                      <span class="detail-value">${tenant.TIN}</span>
                    </p>
                    `
                      : ''
                  }

                  ${
                    tenant.SelectedAgreement === 'Fixed-Term'
                      ? `
                    <p class="detail-row">
                      <span class="detail-label">Current Agreement:</span>
                      <span class="agreement-date">
                        ${new Date(
                          agreements.find(
                            (agreement) =>
                              agreement.id === room.selectedAgreementId
                          ).startTime
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        ${' - '}
                        ${new Date(
                          agreements.find(
                            (agreement) =>
                              agreement.id === room.selectedAgreementId
                          ).endTime
                        ).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </p>
                    `
                      : ''
                  }
                </div>
              </div>
              
              <div class="agreements-container">
                <h2 class="agreements-title">Agreements</h2>

                <table class="agreements-table">
                  <thead>
                    <tr class="agreements-header-row">
                      <th class="agreements-header">Start</th>
                      <th class="agreements-header">End</th>
                      <th class="agreements-header">Price</th>
                      <th class="agreements-header">Representative</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${agreements
                      .map(
                        (agreement) => `
                      <tr
                        class="agreements-row ${
                          agreement.id === room.selectedAgreementId
                            ? 'selected'
                            : ''
                        }"
                      >
                        <td class="agreements-cell">
                          <div class="date-container">
                            <span class="date-primary">
                              ${new Date(
                                agreement.startTime
                              ).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </span>
                            <span class="date-secondary">
                              ${new Date(agreement.startTime).getFullYear()}
                            </span>
                          </div>
                        </td>
                        <td class="agreements-cell">
                          <div class="date-container">
                            <span class="date-primary">
                              ${new Date(agreement.endTime).toLocaleDateString(
                                'en-US',
                                {
                                  month: 'short',
                                  day: 'numeric',
                                }
                              )}
                            </span>
                            <span class="date-secondary">
                              ${new Date(agreement.endTime).getFullYear()}
                            </span>
                          </div>
                        </td>
                        <td class="agreements-cell">
                          <div class="price-container">
                            <div class="price-row">
                              <span class="price-amount">
                                ${agreement.agreedPrice.toLocaleString()}
                              </span>
                              <span class="price-currency">
                                ${agreement.Currency}
                              </span>
                            </div>
                            <span class="price-cycle">
                              Per ${
                                agreement.paymentCycleType === '30'
                                  ? '30 days'
                                  : agreement.paymentCycleType === '15'
                                  ? '15 days'
                                  : agreement.paymentCycleType === '7'
                                  ? '7 days'
                                  : agreement.paymentCycleType === 'monthly'
                                  ? 'Month'
                                  : agreement.paymentCycleType === 'weekly'
                                  ? 'Week'
                                  : agreement.paymentCycleType === 'daily'
                                  ? 'Day'
                                  : agreement.paymentCycleType === 'Annually'
                                  ? 'Year'
                                  : agreement.paymentCycleType.startsWith('-')
                                  ? `${agreement.paymentCycleType.substring(
                                      1
                                    )} days`
                                  : agreement.paymentCycleType
                              }
                            </span>
                          </div>
                        </td>
                        <td class="agreements-cell representative">
                          ${agreement.representative || '-'}
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>
              </div>
              
          <div class="payment-timeline-container">
            <div class="timeline-header">
              <h2 class="section-title" style="margin: 0px;">
                Payment Timeline
              </h2>
              <div class="timeline-info">
                <span class="next-payment-text">
                  ${(() => {
                    const nextPayment = payments.find(
                      (p) => !p.paid && new Date(p.date) > new Date()
                    );
                    if (!nextPayment) return 'All payments are up to date';

                    const daysUntil = Math.floor(
                      (new Date(nextPayment.date) - new Date()) /
                        (1000 * 60 * 60 * 24)
                    );
                    const formattedDate = new Date(
                      nextPayment.date
                    ).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });

                    if (daysUntil < 0) {
                      return `Payment overdue by ${Math.abs(
                        daysUntil
                      )} days (${formattedDate})`;
                    } else if (daysUntil === 0) {
                      return `Payment due today (${formattedDate})`;
                    } else {
                      return `Next payment due in ${daysUntil} days (${formattedDate})`;
                    }
                  })()}
                </span>
              </div>
            </div>

            <div class="timeline-summary">
              <div class="summary-item">
                <span class="summary-label">Total Payments</span>
                <span class="summary-value">${payments.length}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Paid</span>
                <span class="summary-value highlight">${
                  payments.filter((p) => p.paid).length
                }</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Unpaid</span>
                <span class="summary-value warning">${
                  payments.filter((p) => !p.paid).length
                }</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Past Due</span>
                <span class="summary-value danger">${
                  payments.filter((p) => p.status === 'past-due').length
                }</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Payment Cycle</span>
                <span class="summary-value">
                  ${
                    agreement.paymentCycleType.charAt(0).toUpperCase() +
                    agreement.paymentCycleType.slice(1)
                  }
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Payment Amount</span>
                <span class="summary-value">
                  ${agreement.agreedPrice.toLocaleString()} ${
      agreement.Currency
    }
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Agreement Start</span>
                <span class="summary-value">
                  ${new Date(agreement.startTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Agreement End</span>
                <span class="summary-value">
                  ${new Date(agreement.endTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            <div class="timeline-scroll">
              <div class="timeline" style="--current-date-position: 0px;">
                <div class="timeline-edge-box first-box">
                  <span>Start</span>
                  <div class="edge-date">
                    ${new Date(
                      payments[0]?.date || Date.now()
                    ).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>

                ${payments
                  .map(
                    (payment, index) => `
                  <div class="timeline-item ${payment.status} ${
                      payment.paid ? 'paid' : ''
                    }">
                    <div class="timeline-date">
                      <div class="date-primary">
                        ${new Date(payment.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                      <div class="date-secondary">
                        ${new Date(payment.date).getFullYear()}
                      </div>
                    </div>

                    <div class="timeline-content">
                      <div class="payment-Box">
                        ${payment.amount.toLocaleString()} ${agreement.Currency}
                      </div>

                      <div class="payment-status ${
                        payment.paid ? 'paid' : ''
                      } ${payment.status === 'past-due' ? 'past-due' : ''}">
                        ${payment.paid ? 'Paid' : 'Unpaid'}
                      </div>

                      ${
                        room.TenantPortalAllowOnlinePayments && !payment.paid
                          ? `
                        <button class="pay-now-button" onclick='handlePaymentClick(${JSON.stringify(
                          payment
                        )})'>
                          Pay Now
                        </button>
                      `
                          : ''
                      }
${
  room.TenantPortalShowReceipts && payment.paid
    ? `
    <button class="receipt-button" onclick="viewReceipt(${payment.date})">
      <span>View Receipt</span>
      <svg width="16" height="16" viewBox="0 0 16 16">
        <path d="M4 14h8v-1H4v1zm0-3h8v-1H4v1zm0-3h8V7H4v1zm0-3h8V4H4v1zm0-3h8V1H4v1z" />
      </svg>
    </button>
    `
    : ''
}
                    </div>
                    ${
                      index < payments.length - 1 &&
                      new Date(payment.date) <= new Date() &&
                      new Date(payments[index + 1].date) >= new Date()
                        ? `
                      <div class="current-date-indicator">
                        <div class="indicator-line"></div>
                        <div class="indicator-label">Today</div>
                        <div class="indicator-date">
                          ${new Date().toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    `
                        : ''
                    }
                  </div>
                `
                  )
                  .join('')}

                <div class="timeline-edge-box last-box">
                  <span>End</span>
                  <div class="edge-date">
                    ${new Date(
                      payments[payments.length - 1]?.date || Date.now()
                    ).toLocaleDateString('en-US', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </div>
            </div>
          
        </div>
      </div>
    </div>
    ${positioningScript}
  </body>
</html>
  `;
    res.send(htmlContent);
  } catch (error) {
    // Return error page
    const errorContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - Invalid Link</title>
        <style>${styles}</style>
      </head>
      <body>
        <div class="controls">
          <h2>Error</h2>
        </div>
        <div class="content">
          <h1>Invalid Tenant Portal Link</h1>
          <p style="color: #ff4444;">The link you are trying to access is not valid.</p>
          <p>Please contact your landlord to get the correct tenant portal link.</p>
          <p id="error-details" style="color: #888; font-size: 0.9em;">${error.message}</p>
        </div>
      </body>
      </html>
    `;
    res.send(errorContent);
  }
});
// Add route to serve receipt files
app.get('/receipt/:userId/:roomId/:tenantId/:date', async (req, res) => {
  try {
    const { userId, roomId, tenantId, date } = req.params;

    // Validate the date format (YYYY-MM-DD)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).send('Invalid date format. Use YYYY-MM-DD');
    }

    // Get tenant from database
    const tenant = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM tenants WHERE id = ?',
        [tenantId],
        (error, results) => {
          if (error) reject(error);
          else resolve(results[0]);
        }
      );
    });

    if (!tenant) {
      return res
        .status(404)
        .send(`Tenant not found, ${tenantId}, ${tenant.name}`);
    }

    const receiptDir = path.join(
      __dirname,
      'User Files',
      userId,
      'Room Documents',
      roomId,
      `${tenant.name}, ${new Date(
        new Date(tenant.startTime).getTime() + 24 * 60 * 60 * 1000
      ).toDateString()}, ${tenantId}`,
      'receipts'
    );

    // Read directory and filter files by date
    const files = fs.readdirSync(receiptDir);
    const matchingFile = files.find((file) => file.startsWith(date));

    if (matchingFile) {
      res.sendFile(path.join(receiptDir, matchingFile));
    } else {
      res.status(404).send(`No receipt found for date ${date}`);
    }
  } catch (error) {
    console.error('Error serving receipt:', error);
    res.status(500).send('Error serving receipt');
  }
});
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs
// Add a route to clear logs

app.post('/clear-logs', (req, res) => {
  try {
    fs.writeFileSync(path.join(__dirname, 'logs.log'), '');
    res.sendStatus(200);
  } catch (error) {
    logger.error('Error clearing logs:', error);
    res.sendStatus(500);
  }
});
const sendSMSWithUserId = async (phoneNumber, message, userId) => {
  const user = await new Promise((resolve, reject) => {
    pool.query(
      'SELECT * FROM users WHERE id = ?',
      [userId],
      (error, results) => {
        if (error) reject(error);
        else resolve(results[0]);
      }
    );
  });

  let formattedPhone = phoneNumber;
  if (phoneNumber.startsWith('0')) {
    // Remove leading 0 and add 2519
    formattedPhone = `251${phoneNumber.substring(1)}`;
  } else if (!phoneNumber.startsWith('251')) {
    // If doesn't start with 251, assume it needs full prefix
    formattedPhone = `251${phoneNumber}`;
  }

  logger.debug(
    `Attempting to send SMS to: ${formattedPhone}, checking limit.. MAX LIMIT IS ${user.SMSMonthlyLimit}`
  );
  const history = await new Promise((resolve, reject) => {
    const startOfMonth = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    );
    const endOfMonth = Math.floor(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59
      ).getTime()
    );
    logger.debug(
      `Checking SMS history for user ${user.id} from ${startOfMonth} to ${endOfMonth} FOR MANUAL SMS`
    );
    pool.query(
      `SELECT * FROM sms_history WHERE userId = ? AND sentDate BETWEEN ? AND ?`,
      [user.id, startOfMonth, endOfMonth],
      (error, results) => {
        if (error) reject(error);
        else resolve(results);
      }
    );
  });

  if (user.SMSMonthlyLimit <= history.length) {
    logger.debug(
      `SMS limit reached for user ${user.id}. Current limit: ${history.length}, Max limit: ${user.SMSMonthlyLimit}`
    );
    return {
      success: false,
      log: 'data.log',
      error: `Limit Reached ${history.length}/${user.SMSMonthlyLimit}`,
      api_log_id: 'data.api_log_id',
    };
  }
  logger.debug('SMS SENT (is suppose to) 🙃');
  const smsHistoryId = `${userId}_${Date.now()}_Manual_SMS`;
  await new Promise((resolve, reject) => {
    pool.query(
      `INSERT INTO sms_history (id, receiver, body, templateId, sentDate, mode, userId)
VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        smsHistoryId,
        formattedPhone,
        `[REP] ${message}`,
        "Manual_SMS",
        moment().valueOf(),
        'Manual_SMS',
        userId,
      ],
      (error) => {
        if (error) reject(error);
        else resolve(true);
      }
    );
  });
  return {
    success: true,
    log: 'data.log',
    api_log_id: 'data.api_log_id',
  };
  if (!user.SmsToken) {
    logger.debug('SMS token not configured');
    return { success: false, error: 'SMS token not configured' };
  }

  // Format phone number to start with 251 and 9

  const params = new URLSearchParams({
    token: user.SmsToken,
    phone: formattedPhone,
    msg: message,
    ...(user.SmsShortCode && { shortcode_id: user.SmsShortCode }),
  });

  try {
    logger.debug(`Sending SMS with message length: ${message.length}`);
    const response = await fetch(
      `https://api.geezsms.com/api/v1/sms/send?${params.toString()}`
    );
    const data = await response.json();

    if (data && data.message_status === 'success') {
      logger.debug(`SMS sent successfully to: ${phoneNumber}`);
      return {
        success: true,
        log: data.log,
        api_log_id: data.api_log_id,
      };
    } else {
      throw new Error(data?.message || 'Unknown error');
    }
  } catch (error) {
    logger.debug(
      `Failed to send SMS to: ${phoneNumber}. Error: ${error.message}`
    );
    return { success: false, error: error.message };
  }
};
const sendSMS = async (phoneNumber, message, user) => {
  let formattedPhone = phoneNumber;
  if (phoneNumber.startsWith('0')) {
    // Remove leading 0 and add 2519
    formattedPhone = `251${phoneNumber.substring(1)}`;
  } else if (!phoneNumber.startsWith('251')) {
    // If doesn't start with 251, assume it needs full prefix
    formattedPhone = `251${phoneNumber}`;
  }

  logger.debug(
    `Attempting to send SMS to: ${formattedPhone}, checking limit.. MAX LIMIT IS ${user.SMSMonthlyLimit}`
  );

  const history = await new Promise((resolve, reject) => {
    const startOfMonth = Math.floor(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
    );
    const endOfMonth = Math.floor(
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59
      ).getTime()
    );
    logger.debug(
      `Checking SMS history for user ${user.id} from ${startOfMonth} to ${endOfMonth} FOR MANUAL SMS`
    );
    pool.query(
      `SELECT * FROM sms_history WHERE userId = ? AND sentDate BETWEEN ? AND ?`,
      [user.id, startOfMonth, endOfMonth],
      (error, results) => {
        if (error) reject(error);
        else resolve(results);
      }
    );
  });

  if (user.SMSMonthlyLimit <= history.length) {
    logger.debug(
      `SMS limit reached for user ${user.id}. Current limit: ${history.length}, Max limit: ${user.SMSMonthlyLimit}`
    );
    return {
      success: false,
      log: 'data.log',
      api_log_id: 'data.api_log_id',
    };
  }
  return {
    success: true,
    log: 'data.log',
    api_log_id: 'data.api_log_id',
  };
  if (!user.SmsToken) {
    logger.debug('SMS token not configured');
    return { success: false, error: 'SMS token not configured' };
  }

  // Format phone number to start with 251 and 9

  const params = new URLSearchParams({
    token: user.SmsToken,
    phone: formattedPhone,
    msg: message,
    ...(user.SmsShortCode && { shortcode_id: user.SmsShortCode }),
  });

  try {
    logger.debug(`Sending SMS with message length: ${message.length}`);
    const response = await fetch(
      `https://api.geezsms.com/api/v1/sms/send?${params.toString()}`
    );
    const data = await response.json();

    if (data && data.message_status === 'success') {
      logger.debug(`SMS sent successfully to: ${phoneNumber}`);
      return {
        success: true,
        log: data.log,
        api_log_id: data.api_log_id,
      };
    } else {
      throw new Error(data?.message || 'Unknown error');
    }
  } catch (error) {
    logger.debug(
      `Failed to send SMS to: ${phoneNumber}. Error: ${error.message}`
    );
    return { success: false, error: error.message };
  }
};
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
    '-5': 0, // 5 days before
    '-3': 4, // 3 days before
    '-1': 8, // 1 day before
    0: 12, // On due date
    1: 16, // 1 day after
    3: 20, // 3 days after
    5: 24, // 5 days after
    7: 28, // 7 days after
  };

  const bitPosition = notificationMap[daysFromDue.toString()];
  if (bitPosition !== undefined) {
    // Check all 4 notification types for this timing
    const shouldSendTenantEmail =
      (notificationSetting & (1 << bitPosition)) !== 0;
    const shouldSendTenantSMS =
      (notificationSetting & (1 << (bitPosition + 1))) !== 0;
    const shouldSendRepEmail =
      (notificationSetting & (1 << (bitPosition + 2))) !== 0;
    const shouldSendRepSMS =
      (notificationSetting & (1 << (bitPosition + 3))) !== 0;

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
      shouldSendRepSMS,
    };
  }

  logger.debug('No notification needed for this date');
  return {
    shouldSendTenantEmail: false,
    shouldSendTenantSMS: false,
    shouldSendRepEmail: false,
    shouldSendRepSMS: false,
  };
};
// Function to fetch and store exchange rates
const fetchAndStoreExchangeRates = async () => {
  logger.debug('Fetching exchange rates...');
  try {
    const response = await fetch(
      'https://v6.exchangerate-api.com/v6/dc263c2acc91e59fb8905502/latest/USD'
    );
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
      logger.debug(
        `Exchange rate for timestamp ${dayStart} already exists, skipping...`
      );
      return {
        status: 'skipped',
        message: 'Rate for this day already exists',
        timestamp: dayStart,
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

    logger.debug(
      `Stored new exchange rate: ${data.conversion_rates.ETB} for timestamp ${dayStart}`
    );
    return {
      status: 'success',
      message: 'New rate stored successfully',
      timestamp: dayStart,
      rate: data.conversion_rates.ETB,
    };
  } catch (error) {
    logger.error('Error fetching/storing exchange rates:', error);
    throw error;
  }
};

// Schedule the cron job to run at 00:01 every day
const exchangeRateTask = cron.schedule(
  '1 0 * * *',
  async () => {
    logger.debug('Running scheduled exchange rate update');
    try {
      await fetchAndStoreExchangeRates();
    } catch (error) {
      logger.error('Scheduled exchange rate update failed:', error);
    }
  },
  {
    scheduled: true,
    timezone: 'UTC',
  }
);

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
      message: error.message,
    });
  }
});
// Add this endpoint to your server.js file

// Send SMS endpoint
app.post('/api/send-sms', async (req, res) => {
  const { phoneNumber, message, user } = req.body;

  // Validate required fields
  if (!phoneNumber || !message || !user) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: phoneNumber, message, user',
    });
  }

  try {
    const result = await sendSMS(phoneNumber, message, user);
    res.json(result);
  } catch (error) {
    logger.error(`Failed to send SMS to: ${phoneNumber}. Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.post('/api/send-sms-with-id', async (req, res) => {
  const { phoneNumber, message, userId } = req.body;

  // Validate required fields
  if (!phoneNumber || !message || !userId) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: phoneNumber, message, userId',
    });
  }

  try {
    const result = await sendSMSWithUserId(phoneNumber, message, userId);
    res.json(result);
  } catch (error) {
    logger.error(`Failed to send SMS to: ${phoneNumber}. Error:`, error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
app.post('/api/send-email', async (req, res) => {
  const { email, subject, text, user } = req.body;

  // Fix typo in logger.debug
  logger.debug('Send email', subject, email?.slice(0, 100), text);

  try {
    // Validate required fields
    if (
      !email ||
      !subject ||
      !text ||
      !user?.selectedEmailToSendWith ||
      !user?.selectedEmailToSendWithPassword
    ) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Create transporter with more detailed configuration
    const transporter = nodemailer.createTransport({
      host: 'rentmaster.markethubet.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: user.selectedEmailToSendWith,
        pass: user.selectedEmailToSendWithPassword,
      },
      tls: {
        rejectUnauthorized: false, // Only during development/testing
      },
      debug: true, // Enable debug logs
      logger: true, // Enable built-in logger
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      logger.error('Transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Email server configuration error',
      });
    }

    const mailOptions = {
      from: `"RentMaster" <${user.selectedEmailToSendWith}>`,
      to: email,
      subject: subject,
      text: text,
      // Optional: Add HTML version
      html: text.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.debug('Email sent successfully:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error(`Failed to send email to: ${email}. Error:`, error);

    // Send appropriate error response
    const statusCode = error.responseCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
    });
  }
});
app.post('/api/send-email-without-user', async (req, res) => {
  const { email, subject, text } = req.body;

  // Fix typo in logger.debug
  logger.debug('Send email', subject, email?.slice(0, 100), text);

  try {
    // Validate required fields
    if (!email || !subject || !text) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
      });
    }

    // Create transporter with more detailed configuration
    const transporter = nodemailer.createTransport({
      host: 'rentmaster.markethubet.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: 'rentmaster@rentmaster.markethubet.com',
        pass: 'Plp5H9:Li(UO#6[y+26E',
      },
      tls: {
        rejectUnauthorized: false, // Only during development/testing
      },
      debug: true, // Enable debug logs
      logger: true, // Enable built-in logger
    });

    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      logger.error('Transporter verification failed:', verifyError);
      return res.status(500).json({
        success: false,
        error: 'Email server configuration error',
      });
    }

    const mailOptions = {
      from: `rentmaster@rentmaster.markethubet.com`,
      to: email,
      subject: subject,
      text: text,
      // Optional: Add HTML version
      html: text.replace(/\n/g, '<br>'),
    };

    const info = await transporter.sendMail(mailOptions);
    logger.debug('Email sent successfully:', info.messageId);

    res.json({
      success: true,
      messageId: info.messageId,
    });
  } catch (error) {
    logger.error(`Failed to send email to: ${email}. Error:`, error);

    // Send appropriate error response
    const statusCode = error.responseCode || 500;
    res.status(statusCode).json({
      success: false,
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR',
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
      error: error.message,
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

        const predictedPayments = await calculatePredictedPayments(
          room,
          currentDate
        );
        logger.debug(
          `Generated ${predictedPayments.length} predicted payments for room ${room.id}`
        );

        const nextUnpaidPayment = predictedPayments.find(
          (payment) => !payment.Paid
        );

        if (nextUnpaidPayment) {
          logger.debug(
            `Room ${room.id} has unpaid payment due on: ${moment(
              nextUnpaidPayment.Day
            ).format('YYYY-MM-DD')}`
          );

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

          const {
            shouldSendTenantEmail,
            shouldSendTenantSMS,
            shouldSendRepEmail,
            shouldSendRepSMS,
          } = shouldSendNotification(
            nextUnpaidPayment.Day,
            room.notificationSettings
          );

          if (shouldSendTenantEmail || shouldSendRepEmail) {
            logger.debug(
              `Sending email notification for room ${room.id} to tenant ${tenant.email}`
            );
            const notificationTypes = [
              { type: '5 days before due', index: 0 },
              { type: '3 days before due', index: 1 },
              { type: '1 day before due', index: 2 },
              { type: 'On due date', index: 3 },
              { type: '1 day after due', index: 4 },
              { type: '3 days after due', index: 5 },
              { type: '5 days after due', index: 6 },
              { type: '7 days after due', index: 7 },
            ];

            let daysBeforeDue = moment(nextUnpaidPayment.Day).diff(
              currentDate,
              'days'
            );
            const notificationType = notificationTypes.find((notification) => {
              return (
                (notification.type === '5 days before due' &&
                  daysBeforeDue === 5) ||
                (notification.type === '3 days before due' &&
                  daysBeforeDue === 3) ||
                (notification.type === '1 day before due' &&
                  daysBeforeDue === 1) ||
                (notification.type === 'On due date' && daysBeforeDue === 0) ||
                (notification.type === '1 day after due' &&
                  daysBeforeDue === -1) ||
                (notification.type === '3 days after due' &&
                  daysBeforeDue === -3) ||
                (notification.type === '5 days after due' &&
                  daysBeforeDue === -5) ||
                (notification.type === '7 days after due' &&
                  daysBeforeDue === -7)
              );
            });

            if (!notificationType) {
              logger.debug(
                `No matching notification type found for days before due: ${daysBeforeDue}`
              );
              continue;
            }

            const getEmailTemplateIdQuery = `SELECT * FROM notification_template_selections WHERE id = '${room.id}_${notificationType.type}'`;

            const [EmailTemplateObject] = await new Promise(
              (resolve, reject) => {
                pool.query(getEmailTemplateIdQuery, (error, results) => {
                  if (error) reject(error);
                  else resolve(results);
                });
              }
            );

            logger.debug(
              `EmailTemplateObject: ${JSON.stringify(
                EmailTemplateObject
              )}, ${getEmailTemplateIdQuery}, `
            );

            if (
              !EmailTemplateObject ||
              !EmailTemplateObject.email_template_id
            ) {
              logger.warn(`No email template selected for room ${room.id}`);
              continue; // Skip sending email if no template is selected
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
              continue; // Skip sending email if the template is not found
            }

            const variables = [
              'tenant_name',
              'landlord_name',
              'due_amount',
              'due_date',
              'landlord_Email',
              'landlord_Telephone',
              'due_duration',
              'currency',
            ];

            let endOfBillingPeriod;
            switch (room.PaymentCycleType) {
              case '30':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  30,
                  'days'
                );
                break;
              case '15':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  15,
                  'days'
                );
                break;
              case '7':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  7,
                  'days'
                );
                break;
              case 'monthly':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  1,
                  'months'
                );
                break;
              case 'weekly':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  1,
                  'weeks'
                );
                break;
              case 'Annually':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  1,
                  'year'
                );
                break;
              case 'daily':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  1,
                  'days'
                );
                break;
              case 'custom':
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  room.PaymentCycleCustomeDays,
                  'days'
                );
                break;
              default:
                endOfBillingPeriod = moment(nextUnpaidPayment.Day).add(
                  1,
                  'months'
                );
                break;
            }

            const startOfBillingPeriod = moment(nextUnpaidPayment.Day)
              .subtract(0, 'months')
              .startOf('day');

            const replacements = {
              tenant_name: tenant.name,
              landlord_name: user.LandlordName || user.fullName,
              due_amount: nextUnpaidPayment.Value,
              due_date: moment(nextUnpaidPayment.Day).format('MMMM D, YYYY'),
              landlord_Email: user.LandlordEmail || user.email,
              landlord_Telephone: user.LandlordTelephone || user.phoneNumber,
              due_duration: `${startOfBillingPeriod.format(
                'MMMM D, YYYY'
              )} - ${endOfBillingPeriod.format('MMMM D, YYYY')}`,
              currency: tenant.Currency,
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

            if (shouldSendTenantEmail) {
              const emailResult = await sendEmail(
                tenant.email,
                emailSubject,
                emailBody,
                user
              );
              logger.debug(
                `Email sending result: ${JSON.stringify(emailResult)}`
              );

              const addToEmailHistoryQuery = `
              INSERT INTO email_history (id, receiver, subject, body, templateId, sentDate, \`from\`, mode,userId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
            `;
              const emailHistoryId = `${room.id}_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
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
                    `Rent_Automatic`,
                    user.id,
                  ],
                  (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                  }
                );
              });
            }

            // Check notification settings for representative email
            const notificationResult = shouldSendNotification(
              nextUnpaidPayment.Day,
              room.notificationSettings
            );

            if (notificationResult.shouldSendRepEmail) {
              const representativeEmails = user.RepresentativeEmails.split(',')
                .map((email) => email.trim())
                .filter((email) => validateAndLogEmail(email, logger));

              for (const repEmail of representativeEmails) {
                logger.debug(
                  `Sending representative notification to: ${repEmail}`
                );

                const repEmailResult = await sendEmail(
                  repEmail,
                  `[REPRESENTATIVE] ${emailSubject}`,
                  `[REPRESENTATIVE NOTIFICATION]\n\n${emailBody}`,
                  user
                );

                if (repEmailResult.success) {
                  const repEmailHistoryId = `${
                    room.id
                  }_${Date.now()}_rep_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                  await new Promise((resolve, reject) => {
                    pool.query(
                      `INSERT INTO email_history (id, receiver, subject, body, templateId, sentDate, \`from\`, mode, userId)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        repEmailHistoryId,
                        repEmail,
                        `[REPRESENTATIVE] ${emailSubject}`,
                        `[REPRESENTATIVE NOTIFICATION]\n\n${emailBody}`,
                        EmailTemplateObject.email_template_id,
                        moment().valueOf(),
                        user.selectedEmailToSendWith,
                        'Rent_Representative_Automatic',
                        user.id,
                      ],
                      (error) => {
                        if (error) reject(error);
                        else resolve(true);
                      }
                    );
                  });
                }
              }
            }
          }

          if (shouldSendTenantSMS || shouldSendRepSMS) {
            logger.debug(
              `Sending SMS notification for room ${room.id} to tenant ${tenant.phoneNumber}`
            );

            // Define notification type based on days from due
            let daysFromDue = moment(nextUnpaidPayment.Day).diff(
              currentDate,
              'days'
            );
            let notificationType = {
              type: (() => {
                switch (daysFromDue) {
                  case 5:
                    return '5 days before due';
                  case 3:
                    return '3 days before due';
                  case 1:
                    return '1 day before due';
                  case 0:
                    return 'On due date';
                  case -1:
                    return '1 day after due';
                  case -3:
                    return '3 days after due';
                  case -5:
                    return '5 days after due';
                  case -7:
                    return '7 days after due';
                  default:
                    return null;
                }
              })(),
            };

            if (!notificationType.type) {
              logger.warn(
                `No matching notification type for ${daysFromDue} days from due`
              );
              continue;
            }

            // Get SMS template
            const getSmsTemplateIdQuery = `SELECT * FROM notification_template_selections WHERE id = '${room.id}_${notificationType.type}'`;
            const [SmsTemplateObject] = await new Promise((resolve, reject) => {
              pool.query(getSmsTemplateIdQuery, (error, results) => {
                if (error) reject(error);
                else resolve(results);
              });
            });

            if (!SmsTemplateObject || !SmsTemplateObject.sms_template_id) {
              logger.warn(`No SMS template selected for room ${room.id}`);
              continue;
            }

            // Get the selected SMS template
            const [selectedSmsTemplate] = await new Promise(
              (resolve, reject) => {
                pool.query(
                  'SELECT * FROM sms_templates WHERE id = ?',
                  [SmsTemplateObject.sms_template_id],
                  (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                  }
                );
              }
            );

            if (!selectedSmsTemplate) {
              logger.warn(
                `SMS template with id ${SmsTemplateObject.sms_template_id} not found`
              );
              continue;
            }

            // Replace variables in SMS template
            let smsBody = selectedSmsTemplate.body;
            const smsReplacements = {
              tenant_name: tenant.name,
              landlord_name: user.LandlordName || user.fullName,
              due_amount: nextUnpaidPayment.Value,
              due_date: moment(nextUnpaidPayment.Day).format('MMMM D, YYYY'),
              landlord_Email: user.LandlordEmail || user.email,
              landlord_Telephone: user.LandlordTelephone || user.phoneNumber,
              currency: tenant.Currency,
            };

            Object.entries(smsReplacements).forEach(([key, value]) => {
              const regex = new RegExp(`{{${key}}}`, 'g');
              smsBody = smsBody.replace(regex, value);
            });

            // Send SMS
            if (shouldSendTenantSMS) {
              const smsResult = await sendSMS(
                tenant.phoneNumber,
                smsBody,
                user
              );
              logger.debug(`SMS sending result: ${JSON.stringify(smsResult)}`);

              // Record SMS history if successful
              if (smsResult.success) {
                const smsHistoryId = `${room.id}_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`;
                await new Promise((resolve, reject) => {
                  pool.query(
                    `INSERT INTO sms_history (id, receiver, body, templateId, sentDate, mode, userId)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      smsHistoryId,
                      tenant.phoneNumber,
                      smsBody,
                      SmsTemplateObject.sms_template_id,
                      moment().valueOf(),
                      'Rent_Automatic',
                      user.id,
                    ],
                    (error) => {
                      if (error) reject(error);
                      else resolve(true);
                    }
                  );
                });
              }
            }

            // Handle representative SMS if needed
            if (shouldSendRepSMS && user.RepresentativePhoneNumbers) {
              const repPhones = user.RepresentativePhoneNumbers.split(',').map(
                (phone) => phone.trim()
              );

              for (const repPhone of repPhones) {
                const repSmsResult = await sendSMS(
                  repPhone,
                  `[REP] ${smsBody}`,
                  user
                );

                if (repSmsResult.success) {
                  const repSmsHistoryId = `${
                    room.id
                  }_${Date.now()}_rep_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;
                  await new Promise((resolve, reject) => {
                    pool.query(
                      `INSERT INTO sms_history (id, receiver, body, templateId, sentDate, mode, userId)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
                      [
                        repSmsHistoryId,
                        repPhone,
                        `[REP] ${smsBody}`,
                        SmsTemplateObject.sms_template_id,
                        moment().valueOf(),
                        'Rent_Representative_Automatic',
                        user.id,
                      ],
                      (error) => {
                        if (error) reject(error);
                        else resolve(true);
                      }
                    );
                  });
                }
              }
            }
          }
        } else {
          logger.debug(
            `Room ${room.id} has no unpaid payments or notifications are disabled`
          );
        }
      }
    }

    logger.debug('Notification processing completed');

    logger.debug('Starting utility notification processing');

    await processUtilityNotifications();

    logger.debug('Utility notification processing completed');
  } catch (error) {
    logger.error('Error processing notifications:', error);
  }
};
const generateUtilityDueDates = (room, startDate, currentDate) => {
  const cycleType = room.utilityPaymentEvery || '30';
  const customDays = room.utilityPaymentEveryCustom || 0;

  let dueDate = moment(startDate);
  const dueDates = [];

  // Generate dates until we're past current date
  while (dueDate.isSameOrBefore(moment(currentDate).add(5, 'days'))) {
    dueDates.push(dueDate.clone());

    switch (cycleType) {
      case '30':
        dueDate.add(30, 'days');
        break;
      case '15':
        dueDate.add(15, 'days');
        break;
      case '7':
        dueDate.add(7, 'days');
        break;
      case 'monthly':
        dueDate.add(1, 'month');
        break;
      case 'weekly':
        dueDate.add(1, 'week');
        break;
      case 'custom':
        dueDate.add(customDays, 'days');
        break;
      default:
        dueDate.add(30, 'days');
    }
  }

  return dueDates;
};

const processUtilityNotifications = async () => {
  try {
    logger.debug('╔════════════════════════════════════════');
    logger.debug('║ Starting Utility Notification Processing');
    logger.debug('╚════════════════════════════════════════');

    // Get all utility settings with their rooms and tenants
    const utilitySettings = await new Promise((resolve, reject) => {
      pool.query(
        `SELECT 
           ups.*,  -- Get all utility payment settings fields
           r.id as roomId,
           r.tenantId,
           r.utilityPaymentStartDate as utilityPaymentStartDate,
           r.utilityPaymentUseDifferentStartDate as utilityPaymentUseDifferentStartDate,
           r.utilityPaymentEvery as utilityPaymentEvery,
           r.utilityPaymentEveryCustom as utilityPaymentEveryCustom,
           r.UtilityNotificationSettings as UtilityNotificationSettings,
           r.roomIndex as roomIndex,
           r.floor as floor,
        
           t.name as tenantName,
           t.email as tenantEmail,
           t.phoneNumber as tenantPhone,
           t.startTime as startTime,
           u.selectedEmailToSendWith,
           u.selectedEmailToSendWithPassword,
           u.SmsShortCode as smsShortCode
         FROM utility_payments_settings ups
         INNER JOIN rooms r ON ups.roomId = r.id 
         LEFT JOIN tenants t ON r.tenantId = t.id
         LEFT JOIN users u ON ups.userId = u.id
         WHERE ups.useThis = 1`,
        (error, results) => {
          if (error) {
            logger.debug(`Query error: ${error.message}`);
            reject(error);
          } else {
            // Debug log the results
            logger.debug(`Raw utility settings: ${JSON.stringify(results[0])}`);
            resolve(results);
          }
        }
      );
    });

    logger.debug(`Found ${utilitySettings.length} active utility settings`);

    // Group utilities by room
    const utilitiesByRoom = utilitySettings.reduce((acc, setting) => {
      if (!acc[setting.roomId]) {
        acc[setting.roomId] = [];
      }
      acc[setting.roomId].push(setting);
      return acc;
    }, {});

    logger.debug(`Grouped into ${Object.keys(utilitiesByRoom).length} rooms`);

    for (const [roomId, utilities] of Object.entries(utilitiesByRoom)) {
      const room = utilities[0]; // Room data is included in each utility setting
      logger.debug(
        `\n┌─── Processing Room: ${roomId} (Floor ${room.floor}, Room ${room.roomIndex}) ───┐`
      );

      // Check if room has a tenant
      if (!room.tenantId) {
        logger.debug('│ ⚠️ Skipping room - no tenant assigned');
        continue;
      }

      logger.debug(`│ Found tenant: ${room.tenantName} (${room.tenantId})`);
      logger.debug(`│ Tenant email: ${room.tenantEmail}`);
      logger.debug(
        `│ utility start date use: ${room.utilityPaymentUseDifferentStartDate}`
      );
      logger.debug(`│ utility start date: ${room.utilityPaymentStartDate}`);
      logger.debug(`│ Tenant start date: ${room.startTime}`);

      // Determine start date
      const startDate = room.utilityPaymentUseDifferentStartDate
        ? moment(room.utilityPaymentStartDate).add(1, 'day')
        : moment(room.startTime).add(1, 'day');

      if (!startDate.isValid()) {
        logger.debug('│ ⚠️ Skipping room - invalid start date');
        logger.debug(
          `│ utilityPaymentUseDifferentStartDate: ${room.utilityPaymentUseDifferentStartDate}`
        );
        logger.debug(
          `│ utilityPaymentStartDate: ${room.utilityPaymentStartDate}`
        );
        logger.debug(`│ startTime: ${room.startTime}`);
        continue;
      }

      logger.debug(`│ Using start date: ${startDate.format('YYYY-MM-DD')}`);

      // Generate due dates
      const currentDate = moment();
      const dueDates = generateUtilityDueDates(
        room,
        startDate.toDate(),
        currentDate.toDate()
      );

      logger.debug(`│ Generated ${dueDates.length} due dates:`);
      dueDates.forEach((date) => {
        logger.debug(
          `│ - ${date.format('YYYY-MM-DD')} (${date.diff(
            currentDate,
            'days'
          )} days from now)`
        );
      });

      const allUtilityPayments = await new Promise((resolve, reject) => {
        pool.query(
          'SELECT * FROM utility_payments WHERE userId = ?',
          [room.userId],
          (error, results) => {
            if (error) {
              logger.debug(`Query error: ${error.message}`);
              reject(error);
            } else {
              // Debug log the results
              logger.debug(
                `Raw utility settings: ${JSON.stringify(results[0])}`
              );
              resolve(results);
            }
          }
        );
      });

      // Process each due date
      for (const dueDate of dueDates) {
        const daysUntilDue = dueDate
          .startOf('day')
          .diff(moment().startOf('day'), 'days');
        logger.debug(
          `│\n│ Checking due date: ${dueDate.format(
            'YYYY-MM-DD'
          )} (${daysUntilDue} days until due)`
        );

        // Only process if it's a notification day (-3, 0, or 3 days)
        if (![-3, 0, 3].includes(daysUntilDue)) {
          logger.debug(
            `│ │ Skipping - not a notification day (${daysUntilDue} days)`
          );
          continue;
        }

        logger.debug(
          `│ ALL DATA is 
          allUtilityPayments: ${JSON.stringify(allUtilityPayments)}
          roomID: ${room.id}
          dueDate: ${dueDate}
          `
        );
        // Check if utility payment exists and is paid
        const matchingPayments = JSON.parse(JSON.stringify(allUtilityPayments))
          .filter((payment) => {
            const dueDateStart = moment(dueDate).startOf('day');
            const paymentDate = moment(payment.date)
              .startOf('day')
              .add(1, 'day');
            logger.debug(`│ │ Checking payment:
            Payment ID: ${payment.id}
            Date: ${paymentDate} OTHER: ${dueDateStart} CHECK: ${paymentDate.isSame(
              dueDateStart
            )}
            `);

            return paymentDate.isSame(dueDateStart);
          })
          .filter((payment) => {
            const dueDateStart = moment(dueDate).startOf('day');
            const paymentDate = moment(payment.date)
              .startOf('day')
              .add(1, 'day');

            // Log each check
            logger.debug(`│ │ Checking payment:
            Payment ID: ${payment.id}
            Room Match: ${payment.roomId === room.roomId} (payment: ${
              payment.roomId
            }, room: ${room.roomId})
            Date Match: ${paymentDate.isSame(
              dueDateStart
            )} (payment: ${paymentDate.format(
              'YYYY-MM-DD'
            )}, due: ${dueDateStart.format('YYYY-MM-DD')}) 
            Paid Status: ${payment.paid === 1} (status: ${payment.paid})`);
            logger.debug(
              `│ │ RETURNING: ${
                payment.roomId === room.roomId &&
                paymentDate.isSame(dueDateStart) &&
                payment.paid === 1
              }`
            );
            return (
              payment.roomId === room.roomId &&
              paymentDate.isSame(dueDateStart) &&
              payment.paid === 1
            );
          });
        logger.debug(
          `│ │ MATCHING PAYMENTS: ${matchingPayments}, ammount ${
            matchingPayments.length
          }, AS PARSED: ${JSON.parse(
            JSON.stringify(matchingPayments)
          )}, as stringified: ${JSON.stringify(matchingPayments)} `
        );

        logger.debug(
          `│ │ ✓ Notification day matched: ${daysUntilDue} days until due`
        );

        const notificationTiming =
          daysUntilDue === 3 ? 'before' : daysUntilDue === 0 ? 'due' : 'after';

        const bitOffset = daysUntilDue === 3 ? 0 : daysUntilDue === 0 ? 4 : 8;

        // Check notification settings
        const settings = room.UtilityNotificationSettings || 0;
        const shouldSendTenantEmail = (settings & (1 << bitOffset)) !== 0;
        const shouldSendTenantSMS = (settings & (1 << (bitOffset + 1))) !== 0;
        const shouldSendRepEmail = (settings & (1 << (bitOffset + 2))) !== 0;
        const shouldSendRepSMS = (settings & (1 << (bitOffset + 3))) !== 0;

        logger.debug(`│ │ Notification settings (${settings}):`);
        logger.debug(`│ │ ├─ Tenant Email: ${shouldSendTenantEmail}`);
        logger.debug(`│ │ ├─ Tenant SMS: ${shouldSendTenantSMS}`);
        logger.debug(`│ │ ├─ Rep Email: ${shouldSendRepEmail}`);
        logger.debug(`│ │ └─ Rep SMS: ${shouldSendRepSMS}`);

        if (
          !(
            shouldSendTenantEmail ||
            shouldSendTenantSMS ||
            shouldSendRepEmail ||
            shouldSendRepSMS
          )
        ) {
          logger.debug(
            `│ │ No notifications configured for ${notificationTiming}`
          );
          continue;
        }

        // Get user info for email sending
        const [user] = await new Promise((resolve, reject) => {
          pool.query(
            'SELECT * FROM users WHERE id = ?',
            [room.userId],
            (error, results) => {
              if (error) reject(error);
              else resolve(results);
            }
          );
        });

        if (!user) {
          logger.debug('│ │ ⚠️ Skipping - user not found');
          continue;
        }

        // Prepare utility summary and track unpaid utilities
        const unpaidUtilities = [];
        const utilitiesList = utilities
          .map((utilitySettings) => {
            // Ensure we're using the price from utility_payments_settings
            const price = Number(utilitySettings.price) || 0;
            // ... existing code ...
            const matchingPayment = matchingPayments.find(
              (p) => p.type === utilitySettings.type
            );
            logger.debug(
              `│ │ Checking for payment for ${utilitySettings.type}, found: ${
                matchingPayment ? JSON.stringify(matchingPayment) : 'undefined'
              }`
            );

            // ... existing code ...
            if (matchingPayment) {
              logger.debug(`│ │ ✓ Payment found for ${utilitySettings.type}`);
              return;
            }

            // Add to unpaid utilities if no payment found
            unpaidUtilities.push(utilitySettings);

            return `${utilitySettings.type}: ${price.toFixed(2)} ${
              utilitySettings.Currency
            }`;
          })
          .filter(Boolean)
          .join('\n');

        if (utilitiesList.length === 0) {
          logger.debug(`│ │ ⚠️ Skipping - no utilities to pay`);
          continue;
        }

        // Calculate total amount per currency for unpaid utilities only
        const totalsByCurrency = unpaidUtilities.reduce(
          (acc, utilitySettings) => {
            const currency = utilitySettings.Currency;
            const price = Number(utilitySettings.price) || 0;
            logger.debug(
              `Adding price ${price} ${currency} from utility ${utilitySettings.type}`
            );

            if (!acc[currency]) {
              acc[currency] = 0;
            }
            acc[currency] += price;
            return acc;
          },
          {}
        );

        // Format totals by currency
        const totalAmountText = Object.entries(totalsByCurrency)
          .map(([currency, amount]) => `${amount.toFixed(2)} ${currency}`)
          .join(' + ');

        logger.debug(`Utilities list: ${utilitiesList}`); // Debug log
        logger.debug(`Totals by currency: ${JSON.stringify(totalsByCurrency)}`); // Debug log

        const emailBody = `
Dear ${room.tenantName},

This is a ${
          notificationTiming === 'after' ? 'overdue notice' : 'reminder'
        } for your utility payment${
          notificationTiming === 'before' ? ' due in 3 days' : ''
        }.

UTILITY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Room: Floor ${room.floor}, Room ${room.roomIndex}
${utilitiesList}
Total Amount: ${totalAmountText}
Due Date: ${dueDate.format('MMMM D, YYYY')}

Please ensure timely payment to avoid any inconvenience.

This is an automated notification from RentMaster System.
Generated on: ${currentDate.format('MMMM D, YYYY, h:mm A')}
`;

        // Send tenant email if configured
        if (shouldSendTenantEmail) {
          // Use tenantEmail and tenantName from our query results
          const tenantEmail = utilities[0].tenantEmail; // We got this from our JOIN
          const tenantName = utilities[0].tenantName; // We got this from our JOIN

          logger.debug(
            `Tenant details - Name: ${tenantName}, Email: ${tenantEmail}`
          );

          if (tenantEmail) {
            const emailSubject = `Utility Payment ${
              notificationTiming === 'after' ? 'Overdue' : 'Reminder'
            } - Floor ${room.floor}, Room ${room.roomIndex}`;
            const emailBody = `
Dear ${tenantName},

This is a ${
              notificationTiming === 'after' ? 'overdue notice' : 'reminder'
            } for your utility payment${
              notificationTiming === 'before' ? ' due in 3 days' : ''
            }.

UTILITY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Room: Floor ${room.floor}, Room ${room.roomIndex}
${utilitiesList}
Total Amount: ${totalAmountText}
Due Date: ${dueDate.format('MMMM D, YYYY')}

Please ensure timely payment to avoid any inconvenience.

This is an automated notification from RentMaster System.
Generated on: ${currentDate.format('MMMM D, YYYY, h:mm A')}
`;

            try {
              await sendEmail(tenantEmail, emailSubject, emailBody, {
                selectedEmailToSendWith: utilities[0].selectedEmailToSendWith,
                selectedEmailToSendWithPassword:
                  utilities[0].selectedEmailToSendWithPassword,
              });
              logger.debug(`│ │ ✓ Sent email to tenant: ${tenantEmail}`);
              const addToEmailHistoryQuery = `
              INSERT INTO email_history (id, receiver, subject, body, templateId, sentDate, \`from\`, mode,userId)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
            `;
              const emailHistoryId = `${room.id}_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              const sentDate = moment().valueOf();

              await new Promise((resolve, reject) => {
                pool.query(
                  addToEmailHistoryQuery,
                  [
                    emailHistoryId,
                    tenantEmail,
                    emailSubject,
                    emailBody,
                    'Utility',
                    sentDate,
                    utilities[0].selectedEmailToSendWith,
                    `Utility_Automatic_Tenant`,
                    utilities[0].userId,
                  ],
                  (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                  }
                );
              });
            } catch (error) {
              logger.debug(
                `│ │ ✗ Failed to send email to tenant: ${error.message}`
              );
            }
          } else {
            logger.debug(
              `│ │ ⚠️ Email notification enabled but tenant email is missing. Tenant: ${tenantName}`
            );
          }
        }
        const users = await new Promise((resolve, reject) => {
          pool.query(
            'SELECT * FROM users WHERE id = ?',
            [room.userId],
            (error, results) => {
              if (error) reject(error);
              else resolve(results);
            }
          );
        });
        if (shouldSendRepEmail) {
          if (users && users.length > 0 && users[0].RepresentativeEmails) {
            const repEmails = users[0].RepresentativeEmails.split(',').map(
              (email) => email.trim()
            );

            if (repEmails.length > 0) {
              const emailSubject = `[REPRESENTATIVE] Utility Payment Due Today For - Floor ${room.floor}, Room ${room.roomIndex}`;
              const emailBody = `
Dear Representative,

This is a notification for utility payments due today for:
Room: Floor ${room.floor}, Room ${room.roomIndex} (${
                utilities[0].tenantName
              }'s room)

UTILITY DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${utilitiesList}
Total Amount: ${totalAmountText}
Due Date: ${dueDate.format('MMMM D, YYYY')}

This is an automated notification from RentMaster System.
Generated on: ${currentDate.format('MMMM D, YYYY, h:mm A')}
`;

              for (const repEmail of repEmails) {
                if (repEmail) {
                  try {
                    await sendEmail(repEmail, emailSubject, emailBody, {
                      selectedEmailToSendWith:
                        utilities[0].selectedEmailToSendWith,
                      selectedEmailToSendWithPassword:
                        utilities[0].selectedEmailToSendWithPassword,
                    });
                    logger.debug(
                      `│ │ ✓ Sent email to representative: ${repEmail}`
                    );
                    const addToEmailHistoryQuery = `
                    INSERT INTO email_history (id, receiver, subject, body, templateId, sentDate, \`from\`, mode,userId)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)
                  `;
                    const emailHistoryId = `${
                      room.id
                    }_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                    const sentDate = moment().valueOf();

                    await new Promise((resolve, reject) => {
                      pool.query(
                        addToEmailHistoryQuery,
                        [
                          emailHistoryId,
                          repEmail,
                          emailSubject,
                          emailBody,
                          'Utility',
                          sentDate,
                          users[0].selectedEmailToSendWith,
                          `Utility_Automatic_Representative`,
                          users[0].id,
                        ],
                        (error, results) => {
                          if (error) reject(error);
                          else resolve(results);
                        }
                      );
                    });
                  } catch (error) {
                    logger.debug(
                      `│ │ ✗ Failed to send email to representative: ${error.message}`
                    );
                  }
                }
              }
            } else {
              logger.debug(
                `│ │ ⚠️ Representative email notification enabled but no valid representative emails found`
              );
            }
          } else {
            logger.debug(
              `│ │ ⚠️ Representative email notification enabled but no representative emails configured`
            );
          }
        }

        if (shouldSendRepSMS && users[0].RepresentativePhoneNumbers) {
          const repPhones = users[0].RepresentativePhoneNumbers.split(',')
            .map((phone) => phone.trim())
            .filter((phone) => validateAndLogPhone(phone, logger));

          const smsMessage = `
UTILITY PAYMENT DUE
Room: ${utilities[0].tenantName}'s room
Due: ${dueDate.format('MMM D, YYYY')}
Amount: ${totalAmountText}

Details:
${utilitiesList}

-RentMaster System`;

          for (const repPhone of repPhones) {
            try {
              const repSmsMessage = `RentMaster Alert: ${
                utilities[0].tenantName
              }'s utilities due ${dueDate.format('MMM D')}
Total: ${totalAmountText.replace(/\.00/g, '')}`;
              const smsResult = await sendSMS(repPhone, repSmsMessage, user);
              if (smsResult.success) {
                logger.debug(`│ │ ✓ Sent SMS to representative: ${repPhone}`);
                const smsHistoryId = `${room.id}_${Date.now()}_${Math.random()
                  .toString(36)
                  .substr(2, 9)}`;
                const sentDate = moment().valueOf();

                await new Promise((resolve, reject) => {
                  pool.query(
                    `INSERT INTO sms_history (id, receiver, body, templateId, sentDate, mode, userId)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                      smsHistoryId,
                      repPhone,
                      '',
                      repSmsMessage,
                      'Utility',
                      sentDate,
                      utilities[0].smsShortCode || '',
                      'Utility_Automatic_Representative',
                      user.id,
                    ],
                    (error, results) => {
                      if (error) reject(error);
                      else resolve(results);
                    }
                  );
                });
                logger.debug(
                  `│ │ ✓ Added SMS history to representative: ${repPhone}`
                );
              } else {
                logger.debug(
                  `│ │ ✗ Failed to send SMS to representative: ${repPhone}`
                );
              }
            } catch (error) {
              logger.debug(
                `│ │ ✗ Error sending SMS to representative: ${error.message}`
              );
            }
          }
        }
        logger.debug(
          `│ │ ✗ Failed But continue: ${utilities[0].tenantPhone}, ${shouldSendTenantSMS}`
        );
        if (shouldSendTenantSMS && utilities[0].tenantPhone) {
          const tenantPhone = utilities[0].tenantPhone;
          if (validateAndLogPhone(tenantPhone, logger)) {
            const tenantSmsMessage = `RentMaster: Utility payment due ${dueDate.format(
              'MMM D'
            )}
${utilitiesList.replace(/\.00/g, '')}
Total: ${totalAmountText.replace(/\.00/g, '')}`;

            const smsResult = await sendSMS(
              tenantPhone,
              tenantSmsMessage,
              user
            );
            if (smsResult.success) {
              logger.debug(`│ │ ✓ Sent SMS to tenant: ${tenantPhone}`);
              const smsHistoryId = `${room.id}_${Date.now()}_${Math.random()
                .toString(36)
                .substr(2, 9)}`;
              const sentDate = moment().valueOf();

              await new Promise((resolve, reject) => {
                pool.query(
                  `INSERT INTO sms_history (id, receiver, body, templateId, sentDate, mode, userId)
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    smsHistoryId,
                    tenantPhone,
                    '',
                    tenantSmsMessage,
                    'Utility',
                    sentDate,
                    utilities[0].smsShortCode || '',
                    'Utility_Automatic_Tenant',
                    user.id,
                  ],
                  (error, results) => {
                    if (error) reject(error);
                    else resolve(results);
                  }
                );
              });
              logger.debug(`│ │ ✓ Added SMS history to tenant: ${tenantPhone}`);
            } else {
              logger.debug(
                `│ │ ✗ Failed to send SMS to tenant: ${tenantPhone}`
              );
            }
          }
        }
      }
    }

    logger.debug('\n✓ Utility notification processing completed');
  } catch (error) {
    logger.error('✗ Error processing utility notifications:', error);
    throw error;
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
notificationTask = cron.schedule(
  '0 10 * * *',
  async () => {
    logger.debug(
      'Cron job triggered: Running daily email check and send at 10:00 AM Ethiopian Time'
    );
    try {
      await handleNotificationProcess();
      logger.debug('Daily email check and send completed');
    } catch (error) {
      logger.error('Error in daily email check and send:', error);
    }
  },
  {
    scheduled: true,
    timezone: 'Africa/Addis_Ababa',
  }
);

// Manual trigger endpoint
app.get('/api/trigger-cron', async (req, res) => {
  logger.debug('Manual trigger of cron job');
  if (!notificationTask) {
    return res
      .status(500)
      .json({ message: 'Cron job is not properly initialized' });
  }

  try {
    if (isProcessing) {
      return res.status(409).json({
        message: 'Notification process is already running',
        status: 'processing',
      });
    }

    await handleNotificationProcess();
    res.status(200).json({
      message: 'Cron job triggered manually and completed successfully',
      status: 'success',
    });
  } catch (error) {
    logger.error('Error in manual cron job execution:', error);
    res.status(500).json({
      message: 'Error occurred while executing cron job manually',
      error: error.message,
      status: 'error',
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
        message: 'Notification process is already running',
      });
    }

    await handleNotificationProcess();
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

// Add a status endpoint to check if notifications are currently processing
app.get('/api/notification-status', (req, res) => {
  res.json({
    isProcessing,
    lastProcessed: isProcessing ? null : new Date().toISOString(),
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

// Utility functions
const validateEmail = (email) => {
  if (!email) return false;
  const emailRegex =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return emailRegex.test(email);
};
const validatePhoneNumber = (phone) => {
  if (!phone) return false;
  // Allow Ethiopian phone numbers starting with 0 followed by 9 digits
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

const sanitizeEmail = (email) => {
  return email.toLowerCase().trim();
};

const sanitizePhoneNumber = (phone) => {
  return phone.replace(/[\s-]/g, '').trim();
};

const validateAndLogEmail = (email, logger) => {
  const sanitizedEmail = sanitizeEmail(email);
  const isValid = validateEmail(sanitizedEmail);
  logger.debug(`Email validation for ${email}:`);
  logger.debug(`  Sanitized: ${sanitizedEmail}`);
  logger.debug(`  Valid: ${isValid}`);
  return isValid;
};

const validateAndLogPhone = (phone, logger) => {
  const sanitizedPhone = sanitizePhoneNumber(phone);
  const isValid = validatePhoneNumber(sanitizedPhone);
  logger.debug(`Phone validation for ${phone}:`);
  logger.debug(`  Sanitized: ${sanitizedPhone}`);
  logger.debug(`  Valid: ${isValid}`);
  return isValid;
};
// Add this function to generate predicted expenses
const calculatePredictedExpenses = async (expense, currentDate) => {
  logger.debug(`Calculating predicted expenses for expense ID: ${expense.id}`);
  const predictedExpenses = [];

  if (!expense.doesReoccur) {
    logger.debug(`Expense ${expense.id} is non-recurring, using single date`);
    predictedExpenses.push({
      ...expense,
      date: new Date(expense.date).getTime(),
    });
    return predictedExpenses;
  }

  let currentExpenseDate = moment(expense.date).startOf('day');
  const endDate = expense.HasEndDate
    ? moment(expense.EndDate).startOf('day')
    : moment(currentDate).add(1, 'year').startOf('day'); // Predict up to 1 year ahead

  logger.debug(
    `Generating recurring expenses from ${currentExpenseDate.format(
      'YYYY-MM-DD'
    )} to ${endDate.format('YYYY-MM-DD')}`
  );
  logger.debug(
    `Recurring type: ${expense.recurringType}, cycle: ${expense.recurringCycle}`
  );

  while (currentExpenseDate.isSameOrBefore(endDate)) {
    const expenseId = `${expense.id}-${currentExpenseDate.valueOf()}`;
    predictedExpenses.push({
      ...expense,
      id: expenseId,
      date: currentExpenseDate.valueOf(),
    });

    // Calculate next expense date based on recurring type
    switch (expense.recurringType) {
      case 'Day':
        currentExpenseDate.add(expense.recurringCycle, 'days');
        break;
      case 'Monthly':
        currentExpenseDate.add(1, 'month');
        break;
      case 'Yearly':
        currentExpenseDate.add(1, 'year');
        break;
      default:
        logger.warn(
          `Unknown recurring type: ${expense.recurringType}, defaulting to monthly`
        );
        currentExpenseDate.add(1, 'month');
    }
    logger.debug(
      `Generated expense date: ${currentExpenseDate.format('YYYY-MM-DD')}`
    );
  }

  return predictedExpenses;
};

// Update the processExpenseNotifications function
const processExpenseNotifications = async () => {
  logger.debug('Starting processExpenseNotifications');
  try {
    const expenses = await new Promise((resolve, reject) => {
      pool.query(
        'SELECT * FROM expenses WHERE sendEmail = 1 OR sendSms = 1',
        (error, results) => {
          if (error) reject(error);
          else resolve(results);
        }
      );
    });

    logger.debug(
      `Fetched ${expenses.length} expenses with notifications enabled`
    );

    const currentDate = moment().startOf('day');
    logger.debug(`Current date: ${currentDate.format('YYYY-MM-DD')}`);

    for (const expense of expenses) {
      const branches = await new Promise((resolve, reject) => {
        pool.query(
          'SELECT * FROM branches WHERE id = ?',
          [expense.branchId],
          (error, results) => {
            if (error) reject(error);
            else resolve(results);
          }
        );
      });
      const branch = branches[0] || { name: 'Unknown Branch' };
      logger.debug(`\n=== Processing expense ID: ${expense.id} ===`);
      try {
        const predictedExpenses = await calculatePredictedExpenses(
          expense,
          currentDate
        );
        logger.debug(
          `Generated ${predictedExpenses.length} predicted expenses`
        );

        // Find the next upcoming expense
        const nextExpense = predictedExpenses.find((exp) =>
          moment(exp.date).isSameOrAfter(currentDate)
        );

        if (!nextExpense) {
          logger.debug(
            `No upcoming expenses found for expense ID: ${expense.id}`
          );
          continue;
        }

        const daysUntilDue = moment(nextExpense.date).diff(currentDate, 'days');
        logger.debug(
          `Next expense due in ${daysUntilDue} days on ${moment(
            nextExpense.date
          ).format('YYYY-MM-DD')}`
        );

        const shouldSendEmailNow =
          expense.sendEmail && daysUntilDue === expense.emailDaysBefore;
        const shouldSendSMSNow =
          expense.sendSms && daysUntilDue === expense.smsDaysBefore;

        logger.debug(
          `Should send email: ${shouldSendEmailNow}, Should send SMS: ${shouldSendSMSNow}`
        );

        if (shouldSendEmailNow || shouldSendSMSNow) {
          logger.debug(
            `Notifications will be sent for expense ID: ${expense.id}`
          );

          const [user] = await new Promise((resolve, reject) => {
            pool.query(
              'SELECT * FROM users WHERE id = ?',
              [expense.userId],
              (error, results) => {
                if (error) reject(error);
                else resolve(results);
              }
            );
          });

          if (!user) {
            logger.warn(`No user found for expense ID: ${expense.id}`);
            continue;
          }

          logger.debug(
            `User found for expense ID: ${expense.id}: ${user.name}`
          );

          const emailSubject = `Expense Reminder: ${expense.name} due in ${daysUntilDue} days`;
          const emailBody = `
From ${user.companyName},
to you
This is a reminder about an upcoming expense:

EXPENSE DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${expense.name}
Amount: ${expense.price || 0} ${expense.Currency}
Due Date: ${moment(nextExpense.date).format('MMMM D, YYYY')}

Branch: ${branch.name}
Type: ${expense.fullBuilding ? 'Entire Building' : 'Specific room'}
${expense.floor ? `Floor: ${expense.floor}` : ''}
${expense.room ? `Room: ${expense.room}` : ''}

PAYMENT SCHEDULE
━━━━━━━━━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━
Type: ${expense.doesReoccur ? 'Recurring' : 'One-time'} Payment
${
  expense.doesReoccur
    ? `Started on: ${moment(expense.date).format('MMMM D, YYYY')}`
    : ''
}
${
  expense.doesReoccur
    ? `Frequency:  ${
        expense.recurringType === 'Day'
          ? `Every ${expense.recurringCycle}(s)`
          : ''
      } ${expense.recurringType}`
    : ''
}

${
  expense.HasEndDate
    ? `End Date: ${moment(expense.EndDate).format('MMMM D, YYYY')}`
    : ''
}

Please ensure this payment is paid on time.

This is an automated notification from RentMaster System.
Generated on: ${moment().format('MMMM D, YYYY, h:mm A')}
`;

          if (shouldSendEmailNow && expense.emailTo) {
            const emailRecipients = expense.emailTo
              .split(',')
              .map((email) => email.trim());
            logger.debug(
              `Email Recipients (raw): ${emailRecipients.join(', ')}`
            );

            for (const recipient of emailRecipients) {
              logger.debug(`Processing email for recipient: ${recipient}`);

              if (validateAndLogEmail(recipient, logger)) {
                const sanitizedEmail = sanitizeEmail(recipient);
                logger.debug(
                  `Sending email to validated address: ${sanitizedEmail}`
                );
                const emailResult = await sendEmail(
                  sanitizedEmail,
                  emailSubject,
                  emailBody,
                  user
                );

                if (emailResult.success) {
                  logger.debug(`Email sent successfully to: ${sanitizedEmail}`);
                  const emailHistoryId = `exp_${
                    expense.id
                  }_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                  await new Promise((resolve, reject) => {
                    pool.query(
                      `INSERT INTO email_history (id, receiver, subject, body, templateId, sentDate, \`from\`, mode, userId)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                      [
                        emailHistoryId,
                        sanitizedEmail,
                        emailSubject,
                        emailBody,
                        'EXPENSE_NOTIFICATION',
                        moment().valueOf(),
                        user.selectedEmailToSendWith,
                        'Expense_Automatic',
                        user.id,
                      ],
                      (error) => {
                        if (error) reject(error);
                        else resolve(true);
                      }
                    );
                  });
                  logger.debug(`Email history logged for: ${sanitizedEmail}`);
                } else {
                  logger.error(`Failed to send email to: ${sanitizedEmail}`);
                }
              } else {
                logger.warn(`⚠️ Skipping invalid email address: ${recipient}`);
              }
            }
          }

          if (shouldSendSMSNow && expense.smsTo) {
            const smsRecipients = expense.smsTo
              .split(',')
              .map((phone) => phone.trim());
            logger.debug(`SMS Recipients (raw): ${smsRecipients.join(', ')}`);

            for (const recipient of smsRecipients) {
              logger.debug(`Processing SMS for recipient: ${recipient}`);

              if (validateAndLogPhone(recipient, logger)) {
                const sanitizedPhone = sanitizePhoneNumber(recipient);
                logger.debug(
                  `Would send SMS to validated number: ${sanitizedPhone}`
                );
                sendSMS(sanitizedPhone, smsBody, user);
              } else {
                logger.warn(`⚠️ Skipping invalid phone number: ${recipient}`);
              }
            }
          }
        } else {
          logger.debug(
            `No notifications to send for expense ID: ${expense.id}`
          );
        }
      } catch (error) {
        logger.error(`Error processing expense ID: ${expense.id}:`, error);
        continue;
      }
    }

    logger.debug('Expense notification processing completed');
  } catch (error) {
    logger.error('Error in expense notification process:', error);
  }
};

// Schedule the expense notification cron job
const expenseNotificationTask = cron.schedule(
  '30 10 * * *',
  async () => {
    logger.debug(
      'Cron job triggered: Running daily expense notifications at 10:30 AM Ethiopian Time'
    );
    try {
      await processExpenseNotifications();
      logger.debug('Daily expense notifications completed');
    } catch (error) {
      logger.error('Error in daily expense notifications:', error);
    }
  },
  {
    scheduled: true,
    timezone: 'Africa/Addis_Ababa',
  }
);

// Add to manual trigger endpoint
app.get('/api/trigger-expense-notifications', async (req, res) => {
  logger.debug('Manual trigger of expense notifications');
  try {
    await processExpenseNotifications();
    res.status(200).json({
      message:
        'Expense notifications triggered manually and completed successfully',
      status: 'success',
    });
  } catch (error) {
    logger.error('Error in manual expense notification execution:', error);
    res.status(500).json({
      message: 'Error occurred while executing expense notifications',
      error: error.message,
      status: 'error',
    });
  }
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
    logger.debug('Error checking user directory:', error);
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
      logger.debug('Extracted files:', extractedFiles);

      res.json({
        message: 'Files uploaded and extracted successfully',
        extractedFiles,
      });
    } catch (error) {
      logger.debug('Error processing uploaded files:', error);
      res.status(500).json({
        error: 'Failed to process uploaded files',
        details: error.message,
      });
    }
  }
);
app.post('/api/check-missing-files2', async (req, res) => {
  const { userId, path } = req.body;
  const serverBasePath = path.join(baseDir, userId, path);

  try {
    // Get list of all files on server
    const getFilesRecursively = (dir) => {
      let files = [];
      const items = fs.readdirSync(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        if (fs.statSync(fullPath).isDirectory()) {
          files = files.concat(getFilesRecursively(fullPath));
        } else {
          files.push({
            path: path.relative(path.join(baseDir, userId), fullPath),
            size: fs.statSync(fullPath).size,
          });
        }
      }
      return files;
    };

    const files = getFilesRecursively(serverBasePath);
    res.json({ files });
  } catch (error) {
    logger.error('Error checking files:', error);
    res.status(500).json({
      error: 'Failed to check files',
      details: error.message,
    });
  }
});

app.post('/api/download-files2', async (req, res) => {
  const { userId, files } = req.body;
  const serverBasePath = path.join(baseDir, userId);

  try {
    const zip = new JSZip();

    // Add requested files to zip
    for (const file of files) {
      const fullPath = path.join(serverBasePath, file.path);
      if (fs.existsSync(fullPath)) {
        const content = await fs.promises.readFile(fullPath);
        zip.file(file.path, content);
      }
    }

    const zipContent = await zip.generateAsync({ type: 'nodebuffer' });

    res.set('Content-Type', 'application/zip');
    res.set('Content-Disposition', `attachment; filename=files_${userId}.zip`);
    res.send(zipContent);
  } catch (error) {
    logger.error('Error preparing download:', error);
    res.status(500).json({
      error: 'Failed to prepare download',
      details: error.message,
    });
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
    'agreements',
    'notification_template_selections',
    'Exchange_RatesUSDtoETB',
    'email_templates',
    'utility_payments',
    'utility_payments_settings',
    'sms_templates',
    'email_history',
    'sms_history',
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
// Modify the server start log message with ASCII art and color codes
app.listen(PORT, () => {
  logger.debug(
    '╔════════════════════════════════════════════════════════════════════════════╗'
  );
  logger.debug(
    '║                     SERVER STARTED SUCCESSFULLY                            ║'
  );
  logger.debug(
    '║                     PORT: ' + PORT.toString().padEnd(39) + '      ║'
  );
  logger.debug(
    '╚════════════════════════════════════════════════════════════════════════════╝'
  );
});
