import CryptoJS from 'crypto-js';

const isTryout = window.location.href.includes('tryout');
const encryptData =
  !isTryout &&
  !window.electron &&
  Boolean(import.meta.env.VITE_ENCRYPTION_KEY);
const secretKey = window.electron ? '' : import.meta.env.VITE_ENCRYPTION_KEY || 'tryout-demo-key';

const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // 1 second

// Queue system for API requests
class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  async enqueue(request) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        request,
        resolve,
        reject
      });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { request, resolve, reject } = this.queue.shift();

    try {
      const result = await request();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.isProcessing = false;
      this.processQueue();
    }
  }
}

const requestQueue = new RequestQueue();

const encrypt = (data) => {
  if (!encryptData) return data;
  try {
    const jsonString = JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, secretKey).toString();
  } catch (error) {
    console.error('Encryption error:', error);
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
    console.error('Decryption error:', error);
    throw error;
  }
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const makeProxyRequest = async (
  localOrOnline,
  targetUrl,
  method,
  headers = {},
  data = null,
  params = null
) => {
  const makeRequest = async () => {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        // Dynamically set timeout
    const TIMEOUT = targetUrl.includes('filemanager') ? 30000 : 10000;

        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        let proxyUrl = '/make-request';

        if (window.electron) {
          proxyUrl = 'http://localhost:3000/make-request';
        }
        const requestData = {
          targetUrl,
          method,
          headers,
          data,
          params,
        };

        const encryptedData = encrypt(requestData);

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataString: encryptedData,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

      // Check if response is ok before trying to parse JSON
   
        if (localOrOnline === 'local') {
          const result = await response.json();

          if (!result.success) {
            console.log('result success does not show ', result);
          }

          const decryptedData = result.data ? decrypt(result.data) : null;

          if (decryptedData === null && method !== 'DELETE') {
            throw new Error('Invalid response data');
          }

          return decryptedData;
        } else {
          const result = await response.json();

          if (!result.success) {
            throw new Error(result.error || 'Proxy request failed');
          }

          const decryptedData = result.data ? decrypt(result.data) : null;

          if (decryptedData === null && method !== 'DELETE') {
            throw new Error('Invalid response data');
          }
          return decryptedData;
        }
      } catch (error) {
        lastError = error;

        if (attempt < MAX_RETRIES) {
          console.log("RETRYING WAIT >...........................................", targetUrl);
          await delay(RETRY_DELAY * attempt);
          continue;
        }
        break;
      }
    }
    console.error('After several retries data can not', lastError);
    throw lastError;
  };

  return requestQueue.enqueue(makeRequest);
};

export const makeProxyRequestFileManager = async (
  targetUrl,
  method,
  headers = {},
  data = null,
  params = null
) => {
  const makeRequest = async () => {
    let lastError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const controller = new AbortController();
        const TIMEOUT = targetUrl.includes('filemanager') ? 30000 : 10000;
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
        let proxyUrl = '/make-request-filemanager';

        if (window.electron) {
          proxyUrl = 'http://localhost:3000/make-request';
        }
        const requestData = {
          targetUrl,
          method,
          headers,
          data,
          params,
        };

        const encryptedData = encrypt(requestData);

        const response = await fetch(proxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            dataString: encryptedData,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        return response;

      } catch (error) {
        lastError = error;

        if (attempt < MAX_RETRIES) {
          await delay(RETRY_DELAY * attempt);
          continue;
        }
        break;
      }
    }
    console.error('After several retries data can not', lastError);
    throw lastError;
  };

  return requestQueue.enqueue(makeRequest);
};
