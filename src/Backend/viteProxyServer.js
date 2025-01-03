const express = require('express');
const axios = require('axios');
const cors = require('cors');
const CryptoJS = require('crypto-js');
const path = require('path');
require('dotenv').config({
    path: path.resolve(__dirname, '../../.env')
  });
  
const app = express();
const port = process.env.PORT || 3000;
const TIMEOUT = 30000; // 30 seconds

// Axios instance with timeout
const axiosInstance = axios.create({
  timeout: TIMEOUT,
  validateStatus: status => status < 500 // Treat 4xx as valid responses
});

// Toggle encryption on or off
const encryptData = true;

const secretKey = process.env.VITE_ENCRYPTION_KEY;
const apiKey = process.env.VITE_AppCodeElectronString;


const encrypt = (data) => {
  if (!encryptData) return data;
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
  } catch (error) {
    console.error('Encryption error:', error.message);
    throw error;
  }
};

const decrypt = (data) => {
  if (!encryptData || !data) return data;
  try {
    const bytes = CryptoJS.AES.decrypt(data, secretKey);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Decryption error:', error.message);
    throw error;
  }
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request handler
app.all('/make-request', async (req, res) => {
  try {
    if (!req.body?.dataString) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request format'
      });
    }

    const decryptedData = decrypt(req.body.dataString);
  
    if (!decryptedData?.targetUrl || !decryptedData?.method) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const { targetUrl, method, headers = {}, data, params } = decryptedData;

    const isLocalRequest = targetUrl.includes('localhost');
    const baseUrl = isLocalRequest
      ? 'http://localhost:8100'
      : 'https://www.rentmaster.markethubet.com/api';

    const fullUrl = targetUrl.startsWith('http')
      ? targetUrl
      : `${baseUrl}${targetUrl.startsWith('/') ? targetUrl : `/${targetUrl}`}`;

    const config = {
      method: method.toLowerCase(),
      url: fullUrl,
      headers: {
        ...headers,
        'x-api-key': apiKey,
      },
      timeout: TIMEOUT
    };

    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && data) {
      config.data = data;
    }
    if (params) {
      config.params = {userId:params};
    }

    try {
      const response = await axiosInstance(config);
      
      // Handle empty responses
      const responseData = response.data || null;
      
      res.status(response.status).json({
        success: true,
        data: responseData ? encrypt(responseData) : null,
        status: response.status,
      });
    } catch (axiosError) {
      if (axiosError.code === 'ECONNABORTED') {
        return res.status(504).json({
          success: false,
          error: 'Request timeout',
          details: { timeout: TIMEOUT }
        });
      }
      throw axiosError;
    }

  } catch (error) {
    console.error('Proxy request error:', error.message);
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.code
    });
  }
});

// Add better error handling middleware
app.use((err, req, res, next) => {
  console.error('Proxy Server Error:', err);
  res.status(500).json({
    success: false,
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// Start server if not being required as a module
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Proxy server running at http://localhost:${port}`);
  });
}
