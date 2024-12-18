import CryptoJS from 'crypto-js';

const encryptData = false;
const secretKey = window.electron ? '':import.meta.env.VITE_ENCRYPTION_KEY;
const TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 100; // 1 second

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
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      let proxyUrl = 'https://rentmaster.markethubet.com/make-request';
     
      if(window.electron) {
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

      if (localOrOnline === 'local') {
        const result = await response.json();

        if (!result.success) {
         console.log("result sucess does not show ", result)
        }

        const decryptedData = result.data ? decrypt(result.data) : null;

        // Validate the response data
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

        // Validate the response data
        if (decryptedData === null && method !== 'DELETE') {
          throw new Error('Invalid response data');
        }
        return decryptedData;
      }
    } catch (error) {
      lastError = error;
     

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      } else {
        
      }
      break;
    }
  }
console.error("After several retries data can not", error)
  throw lastError;
};
export const makeProxyRequestFileManager = async (

  targetUrl,
  method,
  headers = {},
  data = null,
  params = null
) => {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
      let proxyUrl = 'https://rentmaster.markethubet.com/make-request-filemanager';
     
      if(window.electron) {
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
        await delay(RETRY_DELAY * attempt); // Exponential backoff
        continue;
      } else {
        
      }
      break;
    }
  }
console.error("After several retries data can not", error)
  throw lastError;
};
