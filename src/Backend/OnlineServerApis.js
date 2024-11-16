import {
  deleteAllFromTable,
  getLocalUserDirectory,
  getValuesWithSql,
} from './localServerApis';

const baseUrl = 'https://www.rentmaster.markethubet.com/api';
const baseUrlLocal = 'http://localhost:8100';
const apiKey = 'HH(CzZuQoW@tB$By)e';
import axios from 'axios';
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
      'x-api-key': apiKey,
    };
    return await window.electron.ipcRenderer.invoke('api-request', {
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
      'x-api-key': apiKey,
    };
    return await window.electron.ipcRenderer.invoke('api-request', {
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
    await window.electron.ipcRenderer.invoke('cleanup-on-sign-out');
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
      'x-api-key': apiKey,
    };
    return await window.electron.ipcRenderer.invoke('api-request', {
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
    'x-api-key': apiKey,
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
              await window.electron.ipcRenderer.invoke('api-request', {
                url: `${baseUrl}/${change.tableName}/${rowData.id}`,
                method: 'put',
                headers,
                data: JSON.parse(change.addedJsonData),
              });
            } else {
              // Row doesn't exist, add it
              await window.electron.ipcRenderer.invoke('api-request', {
                url: `${baseUrl}/${change.tableName}`,
                method: 'post',
                headers,
                data: JSON.parse(change.addedJsonData),
              });
            }
          }
          break;

        case 'edit':
          await window.electron.ipcRenderer.invoke('api-request', {
            url: `${baseUrl}/${change.tableName}/${change.rowId}/${change.columnName}`,
            method: 'put',
            headers,
            data: { [change.columnName]: change.newValue },
          });
          break;

        case 'delete':
          await window.electron.ipcRenderer.invoke('api-request', {
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

  window.electron.store.set(
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
  window.electron.store.set('changeAmount', changeAmountOnline[0].changeAmount);
};

export const RevertOfflineChanges = async () => {
  try {
    const url = `${baseUrlLocal}/offline_changes`;
    return await window.electron.ipcRenderer.invoke('api-request', {
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
      'x-api-key': apiKey,
    };
    return await window.electron.ipcRenderer.invoke('api-request', {
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
      'x-api-key': apiKey,
    };
    const response = await window.electron.ipcRenderer.invoke('api-request', {
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
      'x-api-key': apiKey,
    };
    const response = await window.electron.ipcRenderer.invoke('api-request', {
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
    if (navigator.onLine) {
      const url = `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`;
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      };
      return await window.electron.ipcRenderer.invoke('api-request', {
        url,
        method: 'get',
        headers,
      });
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
      'x-api-key': apiKey,
    };
    return await window.electron.ipcRenderer.invoke('api-request', {
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
        'x-api-key': apiKey,
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
    return await window.electron.ipcRenderer.invoke('api-request', {
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
    return await window.electron.ipcRenderer.invoke('api-request', {
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
      'x-api-key': apiKey,
    };
    return await window.electron.ipcRenderer.invoke('api-request', {
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

    if (!result.success) {
      throw new Error(result.message);
    }

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
export const DownloadUserFilesFromOnlineDatabase = async (userId, setProgressValue) => {
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

   
    const result = await window.electron.ipcRenderer.invoke('download-files', {
      userId
    });
    console.log(result)

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
      'x-api-key': apiKey,
    };
    const data = await window.electron.ipcRenderer.invoke('api-request', {
      url,
      method: 'post',
      headers,
      data: {
        userId,
        tables: filteredTables,
      },
    });

    if (!data.ok) {
      throw new Error(`HTTP error! status: ${data.status}, response: ${data}`);
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
    const lastUpdate = window.electron.store.get('lastExchangeRateUpdate');

    if (
      !lastUpdate ||
      new Date(latestRate.date * 1000).getTime() !==
        new Date(lastUpdate).getTime()
    ) {
      window.electron.store.set('exchangeRate', latestRate.rates);
      window.electron.store.set(
        'lastExchangeRateUpdate',
        latestRate.date * 1000
      );
      console.log('Exchange rates updated:', latestRate.rates);
    } else {
      console.log('Exchange rates are up to date.');
    }
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error);
  }
};
