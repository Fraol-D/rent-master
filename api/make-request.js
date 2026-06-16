const axios = require('axios');
const CryptoJS = require('crypto-js');

const TIMEOUT = 30000;
const encryptData = true;
const secretKey = process.env.VITE_ENCRYPTION_KEY || '';
const apiKey = process.env.VITE_AppCodeElectronString || '';

const axiosInstance = axios.create({
  timeout: TIMEOUT,
  validateStatus: (status) => status < 500,
});

const encrypt = (data) => {
  if (!encryptData || !secretKey) return data;
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
};

const decrypt = (data) => {
  if (!encryptData || !data || !secretKey) return data;
  const bytes = CryptoJS.AES.decrypt(data, secretKey);
  const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
  return JSON.parse(decryptedString);
};

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (!req.body?.dataString) {
      return res.status(400).json({ success: false, error: 'Invalid request format' });
    }

    const decryptedData = decrypt(req.body.dataString);

    if (!decryptedData?.targetUrl || !decryptedData?.method) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
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
      timeout: TIMEOUT,
    };

    if (['post', 'put', 'patch'].includes(method.toLowerCase()) && data) {
      config.data = data;
    }
    if (params) {
      config.params = { userId: params };
    }

    const response = await axiosInstance(config);
    const responseData = response.data || null;

    return res.status(response.status).json({
      success: true,
      data: responseData ? encrypt(responseData) : null,
      status: response.status,
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        success: false,
        error: 'Request timeout',
        details: { timeout: TIMEOUT },
      });
    }

    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data || error.code,
    });
  }
};