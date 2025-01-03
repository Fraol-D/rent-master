import { storageManager } from '../renderer/storeManager';
import {
  deleteAllFromTable,
  getLocalUserDirectory,
  getValuesWithSql,
} from './localServerApis';
const baseUrl = 'https://www.rentmaster.markethubet.com/api';
const baseUrl2 = 'https://www.rentmaster.markethubet.com';
const baseUrlLocal = 'http://localhost:8100';
import {
  makeProxyRequest,
  makeProxyRequestFileManager,
} from './viteApiHandler';
import axios from 'axios';
const isTryout = window.location.href.includes('tryout');
const makeRequest = async (input, init = {}, onlineOnly = false) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    isFileManager = false,
    useProxy = !window.electron,
  } = init;

  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // If in tryout mode, handle data locally using storageManager
    if (isTryout && !onlineOnly) {
      const url = new URL(input);
      const pathParts = url.pathname.split('/');
      const tableName = pathParts[pathParts.length - 1];

      if (method === 'GET') {
        // For SQL queries
        if (pathParts.length > 2) {
          const sqlQuery = decodeURIComponent(pathParts[pathParts.length - 1]);
          const tableData = (await storageManager.get(tableName)) || [];
          // Basic SQL WHERE clause parsing
          if (sqlQuery.includes('WHERE')) {
            const conditions = sqlQuery.split('WHERE')[1].trim();
            return tableData.filter((item) => {
              // Very basic condition evaluation
              return eval(conditions.replace(/'/g, '"'));
            });
          }
          return tableData;
        }
        return (await storageManager.get(tableName)) || [];
      }

      if (method === 'POST') {
        const tableData = (await storageManager.get(tableName)) || [];
        const newData = JSON.parse(body);
        tableData.push(newData);
        await storageManager.set(tableName, tableData);
        return newData;
      }

      if (method === 'PUT') {
        const tableData = (await storageManager.get(tableName)) || [];
        const id = pathParts[pathParts.length - 2];
        const columnName = pathParts[pathParts.length - 1];
        const newValue = JSON.parse(body)[columnName];

        const updatedData = tableData.map((item) => {
          if (item.id === id) {
            return { ...item, [columnName]: newValue };
          }
          return item;
        });

        await storageManager.set(tableName, updatedData);
        return { success: true };
      }

      if (method === 'DELETE') {
        const tableData = (await storageManager.get(tableName)) || [];
        const id = pathParts[pathParts.length - 1];
        const filteredData = tableData.filter((item) => item.id !== id);
        await storageManager.set(tableName, filteredData);
        return { success: true };
      }
      return;
    }

    // Normal API request flow
    if (useProxy) {
      const proxyResponse = await makeProxyRequest(
        'local',
        input,
        method,
        headers,
        body,
        userId
      );

      return await proxyResponse;
    } else {
      const response = await fetch(input, init);

      return response.headers.get('content-type')?.includes('application/json')
        ? response.json()
        : response.text();
    }
  } catch (error) {
    console.error('Request error:', error);
    throw error;
  }
};
let sendApiFunction = async (string, { url, method, headers, data }) => {
  if (window.electron) {
    return await window.electron.ipcRenderer.invoke(string, {
      url,
      method,
      headers,
      data,
    });
  } else {
    const response = await makeProxyRequest(
      'online',
      url,
      method,
      headers,
      data
    );

    return response;
  }
};

const deleteValue = async (tableName, id) => {
  try {
    const { data } = await axios.delete(`${baseUrlLocal}/${tableName}/${id}`);
    return data;
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};

export const updateValueOnline = async (
  tableName,
  id,
  columnName,
  columnValue
) => {
  try {
    const url = `${baseUrl}/${tableName}/${id}/${columnName}`;
    const headers = {
      'Content-Type': 'application/json',
    };
    return await sendApiFunction('api-request', {
      url,
      method: 'put',
      headers,
      data: { [columnName]: columnValue },
    });
  } catch (error) {
    console.error('Error updating value online:', error);
    throw error;
  }
};

export const deleteValueOnline = async (tableName, id) => {
  try {
    const url = `${baseUrl}/${tableName}/${id}`;
    const headers = {
      'Content-Type': 'application/json',
    };
    return await sendApiFunction('api-request', {
      url,
      method: 'delete',
      headers,
    });
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};

const handleSignOut = async () => {
  try {
    if (window.electron) await sendApiFunction('cleanup-on-sign-out');
    else storageManager.clear();
    console.log('Cleanup completed successfully');
    // Perform any additional sign-out logic here
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
};

export const SignOutUser = async () => {
  // Clear the local storage
  handleSignOut();
};

export const AddUserOnline = async (json) => {
  try {
    const url = `${baseUrl}/users`;
    const headers = {
      'Content-Type': 'application/json',
    };
    return await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data: json,
    });
  } catch (error) {
    console.error('Error adding user:', error);
    return [];
  }
};

const removeKeys = (obj, keys) => {
  keys.forEach((key) => {
    delete obj[key];
  });
  return obj;
};

function convertBase64ToBlob(base64String) {
  const binaryString = window.atob(base64String);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  return blob;
}

export const Upload = async (
  offline_changes_Array,
  SelectedUserId,
  setUploadProgress,
  RefreshApp
) => {
  let changeAmount = 0;
  const totalChanges = offline_changes_Array.length;
  let failedUploads = [];
  let uploadedChanges = [];

  const headers = {
    'Content-Type': 'application/json',
  };

  // Process changes in original order
  for (let i = 0; i < totalChanges; i++) {
    const change = offline_changes_Array[i];
    try {
      if (change.type === 'edit' && change.tableName === 'settings_table') {
        continue;
      }

      switch (change.type) {
        case 'add':
          if (change.tableName === 'settings_table') {
            // Settings table add handling
          } else {
            const rowData = JSON.parse(change.addedJsonData);
            const existingRows = await getValuesWithSql_Online(
              change.tableName,
              `WHERE id = '${rowData.id}'`
            );

            if (existingRows && existingRows.length > 0) {
              // Row exists, update it
              console.log(
                `Row ${rowData.id} exists, updating instead of adding`
              );
              await sendApiFunction('api-request', {
                url: `${baseUrl}/${change.tableName}/${rowData.id}`,
                method: 'put',
                headers,
                data: JSON.parse(change.addedJsonData),
              });
            } else {
              // Row doesn't exist, add it
              await sendApiFunction('api-request', {
                url: `${baseUrl}/${change.tableName}`,
                method: 'post',
                headers,
                data: JSON.parse(change.addedJsonData),
              });
            }
          }
          break;

        case 'edit':
          await sendApiFunction('api-request', {
            url: `${baseUrl}/${change.tableName}/${change.rowId}/${change.columnName}`,
            method: 'put',
            headers,
            data: { [change.columnName]: change.newValue },
          });
          break;

        case 'delete':
          await sendApiFunction('api-request', {
            url: `${baseUrl}/${change.tableName}/${change.rowId}`,
            method: 'delete',
            headers,
          });
          break;
      }

      await deleteValue('offline_changes', change.id);
      changeAmount++;
      uploadedChanges.push(change);
    } catch (error) {
      console.log(`Error processing ${change.type} change:`, error);
      failedUploads.push(change);
      continue;
    }

    const uploadProgress = ((i + 1) / totalChanges) * 100;
    setUploadProgress(uploadProgress);
  }

  // Update change amount
  const changeAmountOnline = await getValuesWithSql_Online(
    'users',
    `WHERE id = '${SelectedUserId}'`
  );

  await updateValueOnline(
    'users',
    SelectedUserId,
    'changeAmount',
    changeAmountOnline[0].changeAmount + changeAmount
  );

  storageManager.set(
    'changeAmount',
    changeAmountOnline[0].changeAmount + changeAmount
  );
  console.log('Uploaded changes:', uploadedChanges);
  RefreshApp();
  return true;
};

function normalizeObject(obj) {
  // Create a new object with sorted keys
  return Object.keys(obj)
    .sort()
    .reduce((normalized, key) => {
      let value = obj[key];

      // Convert string numbers to actual numbers
      if (typeof value === 'string') {
        // Handle decimal strings (e.g., "0.00")
        const numberValue = Number(value);
        if (!isNaN(numberValue)) {
          value = numberValue;
        }
      }

      // Handle boolean values that might be 0/1
      if (key === 'Archived' || key.startsWith('is') || key.includes('State')) {
        value = Boolean(value);
      }

      normalized[key] = value;
      return normalized;
    }, {});
}

function areObjectsEqual(obj1, obj2) {
  const norm1 = normalizeObject(obj1);
  const norm2 = normalizeObject(obj2);

  // For debugging
  const str1 = JSON.stringify(norm1);
  const str2 = JSON.stringify(norm2);
  if (str1 !== str2) {
    console.log('Differences found:', {
      obj1: norm1,
      obj2: norm2,
    });
  }

  return str1 === str2;
}

const setChangeAmount = async (SelectedUserId) => {
  const changeAmountOnline = await getValuesWithSql_Online(
    'users',
    `WHERE id = '${SelectedUserId}'`
  );
  console.log(
    `WHERE id = '${SelectedUserId}'`,
    changeAmountOnline[0],
    changeAmountOnline[0].changeAmount,
    '=========================================================================================='
  );
  storageManager.set('changeAmount', changeAmountOnline[0].changeAmount);
};

export const RevertOfflineChanges = async () => {
  try {
    const url = `${baseUrlLocal}/offline_changes`;
    return await sendApiFunction('api-request', {
      url,
      method: 'delete',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const url = `${baseUrl}/users`;
    const headers = {
      'Content-Type': 'application/json',
    };
    return await sendApiFunction('api-request', {
      url,
      method: 'get',
      headers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export async function verifyCredentials(email, password) {
  try {
    const url = `${baseUrl}/verify-credentials`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data: { email, password },
    });
    return response.isValid;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return false;
  }
}

export async function verifyAppUserCredentials(email, password) {
  try {
    const url = `${baseUrl}/verify-credentials-app-user`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data: { email, password },
    });
    return response.isValid;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return false;
  }
}

export const getValuesWithSql_Online = async (tableName, sqlCode) => {
  try {
    if (window.electron) {
      if (navigator.onLine) {
        const url = `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`;
        const headers = {
          'Content-Type': 'application/json',
        };
        const answer = await makeRequest(url, { method: 'get', headers });
        console.log(answer);
        return answer;
      }
    } else {
      if (
        window.location.href.includes('tryout') &&
        tableName === 'Exchange_RatesUSDtoETB'
      ) {
        const url = `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`;
        const headers = {
          'Content-Type': 'application/json',
        };
        const answer = await makeRequest(url, { method: 'get', headers }, true);
        console.log(answer);
        return answer;
      }
      return await getValuesWithSql(tableName, sqlCode);
    }
  } catch (error) {
    console.error('Error in getValuesWithSql_Online:', error);
    return [];
  }
};

export const getValuesFromOnlineDatabase = async (tableName) => {
  try {
    const url = `${baseUrl}/${tableName}`;
    const headers = {
      'Content-Type': 'application/json',
    };
    return await sendApiFunction('api-request', {
      url,
      method: 'get',
      headers,
    });
  } catch (error) {
    console.error('Error fetching values from the online database:', error);
    return [];
  }
};

// Fetch data from the online MySQL database
const fetchDataFromOnlineDatabase = async (tableName) => {
  try {
    const { data } = await axios.get(`${baseUrl}/${tableName}`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return data;
  } catch (error) {
    console.error('Error fetching values from the online database:', error);
    return [];
  }
};

// Fetch data from the local SQLite database
const fetchDataFromLocalDatabase = async (tableName) => {
  return getValuesWithSql(tableName, 'WHERE 1');
};

async function syncActionHistory(onlineData, localData, SelectedUserId) {
  // Create a Set of existing IDs for faster lookup
  const existingIds = new Set(localData.map((row) => row.id));
  console.log(
    existingIds,
    '000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000'
  );
  let addedRows = 0;
  let skippedRows = 0;

  for (const onlineRow of onlineData) {
    // Skip if not for current user
    if (onlineRow.userId !== SelectedUserId) {
      skippedRows++;
      continue;
    }

    // Skip if already exists
    if (existingIds.has(onlineRow.id)) {
      skippedRows++;
      continue;
    }

    try {
      await addLocalRecord('action_history', onlineRow);
      addedRows++;
    } catch (error) {
      // If we somehow still get a constraint error, just skip it
      skippedRows++;
    }
  }

  console.log(
    `Action History Sync - Added: ${addedRows}, Skipped: ${skippedRows}`
  );
}

// Update the sync functions
export const syncOnlineToLocal = async (SelectedUserId) => {
  console.log(`Starting sync process for user: ${SelectedUserId}`);
  console.log(`Tables to sync: ${tables.join(', ')}`);

  for (const table of tables) {
    console.log(`Processing table: ${table}`);

    const onlineData = await getValuesWithSql_Online(
      table,
      `WHERE userId = '${SelectedUserId}'`
    );
    console.log(
      `Fetched ${onlineData.length} rows from online database for table: ${table}`
    );

    const localData = await fetchDataFromLocalDatabase(table);
    console.log(
      `Fetched ${localData.length} rows from local database for table: ${table}`
    );

    if (table === 'action_history') {
      await syncActionHistory(onlineData, localData, SelectedUserId);
      continue;
    }

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    console.log(`Processing rows for table: ${table}`);
    let updatedRows = 0;
    let addedRows = 0;
    let skippedRows = 0;

    for (const [id, onlineRow] of onlineDataMap.entries()) {
      if (onlineRow.userId !== SelectedUserId) {
        skippedRows++;
        console.log(`Skipped row with id: ${id} (different user)`);
        continue;
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (!areObjectsEqual(onlineRow, localRow)) {
          await updateLocalRecord(table, id, onlineRow);
          updatedRows++;
          console.log(
            `Updated row with id: ${id} in table: ${table}, ${JSON.stringify(
              onlineRow
            )} ${JSON.stringify(localRow)}`
          );
        } else {
          skippedRows++;
          console.log(`Skipped row with id: ${id} (no changes)`);
        }
      } else {
        await addLocalRecord(table, onlineRow);
        addedRows++;
        console.log(`Added new row with id: ${id} to table: ${table}`);
      }
    }

    console.log(
      `Table ${table} - Updated: ${updatedRows}, Added: ${addedRows}, Skipped: ${skippedRows}`
    );
  }

  setChangeAmount(SelectedUserId);
  console.log('Applying offline changes');
  const offlineChanges = await fetchOfflineChanges();
  console.log(`Found ${offlineChanges.length} offline changes to apply`);
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  console.log('Sync completed');
  return 'Sync completed';
};

export const syncOnlineToLocalWithCallback = async (
  SelectedUserId,
  setSyncProgress
) => {
  console.log(`Starting sync process for user: ${SelectedUserId}`);
  console.log(`Tables to sync: ${tables.join(', ')}`);

  let completedTables = 0;
  const totalTables = tables.length;

  for (const table of tables) {
    console.log(`Processing table: ${table}`);

    const onlineData = await getValuesWithSql_Online(
      table,
      `WHERE userId = '${SelectedUserId}'`
    );
    console.log(
      `Fetched ${onlineData.length} rows from online database for table: ${table}`
    );

    const localData = await fetchDataFromLocalDatabase(table);
    console.log(
      `Fetched ${localData.length} rows from local database for table: ${table}`
    );

    if (table === 'action_history') {
      await syncActionHistory(onlineData, localData, SelectedUserId);
    } else {
      const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
      const localDataMap = new Map(localData.map((row) => [row.id, row]));

      console.log(`Processing rows for table: ${table}`);
      let updatedRows = 0;
      let addedRows = 0;
      let skippedRows = 0;

      for (const [id, onlineRow] of onlineDataMap.entries()) {
        if (onlineRow.userId !== SelectedUserId) {
          skippedRows++;
          console.log(`Skipped row with id: ${id} (different user)`);
          continue;
        }

        if (localDataMap.has(id)) {
          const localRow = localDataMap.get(id);
          if (!areObjectsEqual(onlineRow, localRow)) {
            console.log(`Updating row due to differences:`, {
              online: onlineRow,
              local: localRow,
            });
            await updateLocalRecord(table, id, onlineRow);
            updatedRows++;
          } else {
            skippedRows++;
            console.log(
              `Skipped row with id: ${id} (no changes after normalization)`
            );
          }
        } else {
          await addLocalRecord(table, onlineRow);
          addedRows++;
          console.log(`Added new row with id: ${id} to table: ${table}`);
        }
      }

      console.log(
        `Table ${table} - Updated: ${updatedRows}, Added: ${addedRows}, Skipped: ${skippedRows}`
      );
    }

    completedTables++;
    const progress = (completedTables / totalTables) * 100;
    setSyncProgress(progress);
    console.log(`Sync progress: ${progress.toFixed(2)}%`);
  }

  setChangeAmount(SelectedUserId);
  console.log('Applying offline changes');
  const offlineChanges = await fetchOfflineChanges();
  console.log(`Found ${offlineChanges.length} offline changes to apply`);
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  console.log('Sync completed');
  return 'Sync completed';
};

export const syncOnlineToLocalWithBool = async (
  SelectedUserId,
  setIsSyncing,
  setSyncProgress,
  RefreshDataFromSqlite
) => {
  console.log(`Starting sync process for user: ${SelectedUserId}`);
  setIsSyncing(true);
  setSyncProgress(0);

  console.log(`Tables to sync: ${tables.join(', ')}`);
  const totalSteps = tables.length + 1; // +1 for offline changes
  let currentStep = 0;

  try {
    try {
      for (const table of tables) {
        console.log(`Processing table: ${table}`);

        const onlineData = await getValuesWithSql_Online(
          table,
          `WHERE userId = '${SelectedUserId}'`
        );
        console.log(
          `Fetched ${onlineData.length} rows from online database for table: ${table}`
        );

        const localData = await fetchDataFromLocalDatabase(table);
        console.log(
          `Fetched ${localData.length} rows from local database for table: ${table}`
        );

        if (table === 'action_history') {
          await syncActionHistory(onlineData, localData, SelectedUserId);
        } else {
          const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
          const localDataMap = new Map(localData.map((row) => [row.id, row]));

          console.log(`Processing rows for table: ${table}`);
          let updatedRows = 0;
          let addedRows = 0;
          let skippedRows = 0;

          for (const [id, onlineRow] of onlineDataMap.entries()) {
            if (onlineRow.userId !== SelectedUserId) {
              skippedRows++;
              console.log(`Skipped row with id: ${id} (different user)`);
              continue;
            }

            if (localDataMap.has(id)) {
              const localRow = localDataMap.get(id);
              if (!areObjectsEqual(onlineRow, localRow)) {
                await updateLocalRecord(table, id, onlineRow);
                updatedRows++;
                console.log(
                  `Updated row with id: ${id} in table: ${table}, ${JSON.stringify(
                    onlineRow
                  )} ${JSON.stringify(localRow)}`
                );
              } else {
                skippedRows++;
                console.log(`Skipped row with id: ${id} (no changes)`);
              }
            } else {
              await addLocalRecord(table, onlineRow);
              addedRows++;
              console.log(`Added new row with id: ${id} to table: ${table}`);
            }
          }

          console.log(
            `Table ${table} - Updated: ${updatedRows}, Added: ${addedRows}, Skipped: ${skippedRows}`
          );
        }

        currentStep++;
        setSyncProgress((currentStep / totalSteps) * 100);
      }
    } catch (error) {
      console.log(error);
    }
    setChangeAmount(SelectedUserId);
    console.log('Applying offline changes');
    const offlineChanges = await fetchOfflineChanges();
    console.log(`Found ${offlineChanges.length} offline changes to apply`);
    await applyOfflineChangesToLocalDatabase(offlineChanges);

    currentStep++;
    setSyncProgress(100);

    setIsSyncing(false);
    RefreshDataFromSqlite();
    console.log('Sync completed');
    return 'Sync completed';
  } catch (error) {
    console.error('Error during sync:', error);
    setIsSyncing(false);
    throw error;
  }
};

// Version 1: Basic branch sync
export const syncOnlineToLocalBranch = async (SelectedUserId, BranchId) => {
  console.log(
    `Starting branch sync process for user: ${SelectedUserId}, branch: ${BranchId}`
  );

  for (const table of tables) {
    console.log(`Processing table: ${table}`);

    const onlineData = await getValuesWithSql_Online(
      table,
      `WHERE userId = '${SelectedUserId}'`
    );

    const localData = await fetchDataFromLocalDatabase(table);

    if (table === 'action_history') {
      await syncActionHistory(onlineData, localData, SelectedUserId);
      continue;
    }

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    let updatedRows = 0;
    let addedRows = 0;
    let skippedRows = 0;

    for (const [id, onlineRow] of onlineDataMap.entries()) {
      // Skip if wrong user or branch
      if (
        onlineRow.userId !== SelectedUserId ||
        (onlineRow.branchId && onlineRow.branchId !== BranchId)
      ) {
        skippedRows++;
        continue;
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (!areObjectsEqual(onlineRow, localRow)) {
          await updateLocalRecord(table, id, onlineRow);
          updatedRows++;
        }
      } else {
        await addLocalRecord(table, onlineRow);
        addedRows++;
      }
    }
  }

  return 'Branch sync completed';
};

// Version 2: With progress callback
export const syncOnlineToLocalBranchWithCallback = async (
  SelectedUserId,
  BranchId,
  setSyncProgress
) => {
  let completedTables = 0;
  const totalTables = tables.length;

  for (const table of tables) {
    const onlineData = await getValuesWithSql_Online(
      table,
      `WHERE userId = '${SelectedUserId}'`
    );
    const localData = await fetchDataFromLocalDatabase(table);

    if (table === 'action_history') {
      await syncActionHistory(onlineData, localData, SelectedUserId);
    } else {
      const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
      const localDataMap = new Map(localData.map((row) => [row.id, row]));

      for (const [id, onlineRow] of onlineDataMap.entries()) {
        // Skip if wrong user or branch
        if (
          onlineRow.userId !== SelectedUserId ||
          (onlineRow.branchId && onlineRow.branchId !== BranchId)
        ) {
          continue;
        }

        if (localDataMap.has(id)) {
          const localRow = localDataMap.get(id);
          if (!areObjectsEqual(onlineRow, localRow)) {
            await updateLocalRecord(table, id, onlineRow);
          }
        } else {
          await addLocalRecord(table, onlineRow);
        }
      }
    }

    completedTables++;
    const progress = (completedTables / totalTables) * 100;
    setSyncProgress(progress);
  }

  return 'Branch sync completed';
};

// Version 3: With full state management
export const syncOnlineToLocalBranchWithBool = async (
  SelectedUserId,
  BranchId,
  setIsSyncing,
  setSyncProgress,
  RefreshDataFromSqlite
) => {
  try {
    setIsSyncing(true);
    setSyncProgress(0);
    const offlineChanges = await fetchOfflineChanges();
    const totalSteps = tables.length;
    let currentStep = 0;

    for (const table of tables) {
      const onlineData = await getValuesWithSql_Online(
        table,
        `WHERE userId = '${SelectedUserId}'`
      );
      const localData = await fetchDataFromLocalDatabase(table);

      if (table === 'action_history') {
        await syncActionHistory(onlineData, localData, SelectedUserId);
      } else {
        const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
        const localDataMap = new Map(localData.map((row) => [row.id, row]));

        // Check for records that exist locally but not online
        for (const [id, localRow] of localDataMap.entries()) {
          if (!onlineDataMap.has(id)) {
            // Check if this record exists in offline changes as an 'add'
            const isInOfflineChanges = offlineChanges.some(
              (change) =>
                change.type === 'add' &&
                change.tableName === table &&
                change.rowId === id
            );

            if (!isInOfflineChanges) {
              // If not in offline changes, delete from local database
              await deleteLocalRecord(table, id);
            }
          }
        }

        // Update or add records from online
        for (const [id, onlineRow] of onlineDataMap.entries()) {
          // Skip if wrong user or branch
          if (
            onlineRow.userId !== SelectedUserId ||
            (onlineRow.branchId && onlineRow.branchId !== BranchId)
          ) {
            continue;
          }

          if (localDataMap.has(id)) {
            const localRow = localDataMap.get(id);
            // Check if schemas match before updating
            const onlineKeys = Object.keys(onlineRow).sort();
            const localKeys = Object.keys(localRow).sort();
            const schemasMatch =
              JSON.stringify(onlineKeys) === JSON.stringify(localKeys);

            if (!schemasMatch) {
              console.warn(
                `Schema mismatch for table ${table}, row ${id} - skipping update`
              );
              continue;
            }

            if (!areObjectsEqual(onlineRow, localRow)) {
              await updateLocalRecord(table, id, onlineRow);
            }
          } else {
            await addLocalRecord(table, onlineRow);
          }
        }
      }

      currentStep++;
      setSyncProgress((currentStep / totalSteps) * 100);
    }
    setChangeAmount(SelectedUserId);

    await applyOfflineChangesToLocalDatabase(offlineChanges);

    currentStep++;

    setIsSyncing(false);
    RefreshDataFromSqlite();
    setSyncProgress(100);
    console.log('Sync completed');
    return 'Sync completed';
  } catch (error) {
    console.error('Error during branch sync:', error);
    setIsSyncing(false);
    throw error;
  }
};

export const getValues = async (tableName) => {
  try {
    const url = `${baseUrlLocal}/${tableName}`;
    return await sendApiFunction('api-request', {
      url,
      method: 'get',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Error fetching values:', error);
    return [];
  }
}; // Fetch offline changes from the local SQLite database
const fetchOfflineChanges = async () => {
  return getValuesWithSql('offline_changes', 'WHERE 1');
};
// Apply offline changes to the local SQLite database
const applyOfflineChangesToLocalDatabase = async (changes) => {
  console.log(changes);

  for (const change of changes) {
    switch (change.type) {
      case 'edit':
        await updateLocalRecord(change.tableName, change.rowId, {
          [change.columnName]: change.newValue,
        });
        console.log(change.rowId, change);
        break;
      case 'add':
        //await addLocalRecord(change.tableName, JSON.parse(change.addedJsonData));
        break;
      case 'delete':
        await deleteLocalRecord(change.tableName, change.rowId);
        break;
      default:
        console.error(`Unknown change type: ${change.type}`);
    }
  }
};

// Helper functions to interact with the local database
const updateLocalRecord = async (tableName, id, values) => {
  for (const [columnName, columnValue] of Object.entries(values)) {
    await updateValue(tableName, id, columnName, columnValue);
  }
};

const addLocalRecord = async (tableName, values) => {
  await addValue(tableName, values);
};

const deleteLocalRecord = async (tableName, id) => {
  await deleteValue(tableName, id);
};

export const addValue = async (tableName, value) => {
  try {
    const url = `${baseUrlLocal}/${tableName}`;
    return await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
      },
      data: value,
    });
  } catch (error) {
    console.error('Error adding value:', error);
    return null;
  }
};

export const addValueOnline = async (tableName, value) => {
  try {
    const url = `${baseUrl}/${tableName}`;
    const headers = {
      'Content-Type': 'application/json',
    };
    return await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data: value,
    });
  } catch (error) {
    console.error('Error adding value:', error);
    return null;
  }
};

export const updateValue = async (tableName, id, columnName, columnValue) => {
  try {
    const { data } = await axios.put(
      `${baseUrlLocal}/${tableName}/${id}/${columnName}`,
      { [columnName]: columnValue },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    return data;
  } catch (error) {
    console.error('Error updating value:', error);
    return null;
  }
}; /// UIAMgeses

export const UploadUserFilesToTheOnlineDatabase = async (
  userId,
  setProgressValue
) => {
  try {
    console.log('Starting file upload process...');

    // Create a progress handler
    const handleProgress = (progress) => {
      setProgressValue(progress);
    };

    // Register progress listener
    window.electron.ipcRenderer.on('upload-progress', handleProgress);

    // Call the main process
    const result = await window.electron.ipcRenderer.invoke(
      'upload-user-files',
      {
        userId,
      }
    );

    // Clean up listener
    window.electron.ipcRenderer.removeListener(
      'upload-progress',
      handleProgress
    );
    setProgressValue(100);

    return result;
  } catch (error) {
    console.error('Error during file upload process:', error);
    throw error;
  }
};

const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};
export const DownloadUserFilesFromOnlineDatabase = async (
  userId,
  setProgressValue
) => {
  let cleanup = null;
  try {
    console.log('Starting file download process...');
    setProgressValue(0);

    // Set up progress listener
    const handleProgress = (event, progress) => {
      if (typeof setProgressValue === 'function') {
        setProgressValue(progress);
      }
    };
    window.electron.ipcRenderer.on('download-progress', handleProgress);

    const result = await window.electron.ipcRenderer.invoke('download-files', {
      userId,
    });
    console.log(result);

    // Clean up listener
    window.electron.ipcRenderer.removeListener(
      'download-progress',
      handleProgress
    );
    setProgressValue(100);
  } catch (error) {
    console.error('Error during file download process:', error);
    setProgressValue(0);
  }
};

export const replaceUserData = async (userId, tables) => {
  const filteredTables = Object.fromEntries(
    Object.entries(tables).map(([tableName, rows]) => [
      tableName,
      rows.map((row) => {
        const { RecommendedTenantsIdList, ...rest } = row;
        return rest;
      }),
    ])
  );

  try {
    const url = `${baseUrl}/replace-user-data`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const data = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data: {
        userId,
        tables: filteredTables,
      },
    });

    if (!data.ok) {
    }

    return data;
  } catch (error) {
    console.error('Error replacing user data:', error);
    throw error;
  }
};

const tables = [
  'rooms',
  'room_specifications',
  'tenants',
  'room_pay_info',
  'room_pay_info_history',
  'email_templates',
  'sms_templates',
  'expenses',
  'notification_template_selections',
  'utility_payments',
  'utility_payments_settings',
  'brokers',
  'brokersRecommendationList',
  'PastTenantsForRoom',
  'agreements',
  'action_history',
];

export const SetBackUpAsMain = async (userId) => {
  const allData = {};

  // Fetch data from all tables except action_history
  for (const table of tables) {
    const tableData = await getValuesWithSql(table, 'WHERE 1');
    allData[table] = Array.isArray(tableData) ? tableData : [];
  }

  console.log(allData);

  // Replace online data with local data
  try {
    const result = await replaceUserData(userId, allData);
    console.log('Data sync completed:', result);
    return result;
  } catch (error) {
    console.error('Error syncing data:', error);
    throw error;
  }
};

// Function to fetch the latest exchange rate from your database
export const fetchAndUpdateExchangeRates = async () => {
  try {
    const response = await axios.get(`${baseUrl}/exchange-rates`);
    const rates = response.data;
    const latestRate = rates[0]; // Assuming the latest rate comes first
    const lastUpdate = storageManager.get('lastExchangeRateUpdate');

    if (
      !lastUpdate ||
      new Date(latestRate.date * 1000).getTime() !==
        new Date(lastUpdate).getTime()
    ) {
      storageManager.set('exchangeRate', latestRate.rates);
      storageManager.set('lastExchangeRateUpdate', latestRate.date * 1000);
      console.log('Exchange rates updated:', latestRate.rates);
    } else {
      console.log('Exchange rates are up to date.');
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
  }
};
// Function to send SMS
export const sendSMS = async (phoneNumber, message, user) => {
  try {
    const url = `${baseUrl}/send-sms`; // Adjust the endpoint as necessary
    const headers = {
      'Content-Type': 'application/json',
    };
    const data = {
      phoneNumber,
      message,
      user,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });

    return response; // Return the response from the API
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};
export const sendSMSWithUserId = async (phoneNumber, message, userId) => {
  try {
    const url = `${baseUrl}/send-sms-with-id`; // Adjust the endpoint as necessary
    const headers = {
      'Content-Type': 'application/json',
    };
    const data = {
      phoneNumber,
      message,
      userId,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });

    return response; // Return the response from the API
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
};
export const sendEmailAPI = async (email, subject, text, userId) => {
  try {
    const url = `${baseUrl}/send-email`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const data = {
      email,
      subject,
      text,
      userId,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export const sendEmailAPIForVerify = async (email, code) => {
  try {
    const url = `${baseUrl}/send-email-for-verify`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const text = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Verification</title>
      <style>
     
      body,
      h1,
      p {
        margin: 0;
        padding: 0;
      }
  
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        background-color: #f5f5f5;
      }
  
      .container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        background-color: #ffffff;
        border-radius: 8px;
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
      }
  
      h1 {
        font-size: 24px;
        color: #333333;
        margin-bottom: 10px;
      }
  
      p {
        font-size: 16px;
        color: #666666;
        margin-bottom: 20px;
      }
  
      .verification-code {
        margin-bottom: 30px;
      }
  
      .btn {
        display: inline-block;
        padding: 10px 20px;
        background-color: #007bff;
        color: #ffffff;
        text-decoration: none;
        border-radius: 4px;
      }
  
      .footer {
        margin-top: 20px;
        border-top: 1px solid #cccccc;
        padding-top: 20px;
      }
  
      .footer p {
        margin-bottom: 10px;
      }
  
      .footer a {
        color: #007bff;
        text-decoration: none;
        margin-right: 10px;
      }
    </style>
    </head>
    <body>
      <div class="container">
        <h1>Email Verification</h1>
        <p>Thank you for signing up with RentMaster. Please verify your email address to complete your registration.</p>
        <p class="verification-code"><strong>Your Verification Code:</strong> <span style="font-weight: bold; font-size: 18px;">${code}</span></p>
     
        <div class="footer">
          <p>Contact us at <a href="mailto:support@markethubet.com">rentmaster.et@gmail.com</a> for assistance.</p>
          <p>Visit our website: <a href="https://www.rentmaster.markethubet.com">www.rentmaster.markethubet.com</a></p>
        </div>
      </div>
    </body>
    </html>
  `;

    const subject = 'Email Verification';
    const data = {
      email,
      subject,
      text,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};
export const sendEmailAPIForWebsite = async (email2, text, subject) => {
  try {
    const url = `${baseUrl}/send-email-without-user`;
    const headers = {
      'Content-Type': 'application/json',
    };

    const data = {
      email: 'rentmaster.et@gmail.com',
      subject,
      text,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });
    return response;
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

export const checkIfCompanyNameExists = async (companyName) => {
  try {
    const url = `${baseUrl}/check-company-name`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const data = {
      companyName,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });
    console.log(response);
    const result = await response;
    return response;
  } catch (error) {
    console.error('Error checking company name:', error);
    return { success: false, error: error.message };
  }
};

export const checkRoomLimit = async (SelectedUserId) => {
  try {
    const url = `${baseUrl}/check-room-limit`;
    const headers = {
      'Content-Type': 'application/json',
    };
    const data = {
      userId: SelectedUserId,
    };

    const response = await sendApiFunction('api-request', {
      url,
      method: 'post',
      headers,
      data,
    });
    console.log(response);
    return !response.valid;
  } catch (error) {}
};
export const downloadAllUserFiles = async (userId) => {
  try {
    const response = await axios({
      method: 'POST',
      url: `${baseUrl2}/download-all-user-files`,
      data: { userId },
      headers: {
        'user-id': userId,
      },
      responseType: 'blob',
      timeout: 300000, // 5 minute timeout
      onDownloadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        // You can use this to update a progress bar
        console.log(`Download Progress: ${percentCompleted}%`);
      },
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    const filename =
      response.headers['content-disposition']
        ?.split('filename=')[1]
        ?.replace(/"/g, '') || `user_${userId}_files.zip`;

    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading user files:', error);
    throw new Error(
      error.response?.data?.error ||
        'Failed to download files. Please try again.'
    );
  }
};
