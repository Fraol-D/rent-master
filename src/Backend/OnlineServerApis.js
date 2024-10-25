import { deleteAllFromTable, getLocalUserDirectory , getValuesWithSql } from './localServerApis';

//import { downloadImageFromLocalEndpoint, getFileContent, getListOfFiles } from './localServerApis';
const baseUrl = 'https://www.rentmaster.markethubet.com/api';
const baseUrlLocal = 'http://localhost:8100';
const apiKey = 'HH(CzZuQoW@tB$By)e';

const deleteValue = async (tableName, id) => {
  try {
    const response = await fetch(`${baseUrlLocal}/${tableName}/${id}`, {
      method: 'DELETE',
    });
    const data = await response.text();

    return data;
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};
export const updateValueOnline = async (tableName, id, columnName, columnValue) => {
  try {
    const response = await fetch(
      `${baseUrl}/${tableName}/${id}/${columnName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ [columnName]: columnValue }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Successfully updated ${columnName} for ${tableName} with id ${id}`);
    return data;
  } catch (error) {
    console.error('Error updating value online:', error);
    throw error;
  }
};

export const deleteValueOnline = async (tableName, id) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });
    const data = await response.text();
   
    return data;
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
    const response = await fetch(`${baseUrl}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: json,
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
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
  const syncProgressWeight = 0.5;
  const uploadProgressWeight = 1 - syncProgressWeight;
  let failedUploads = [];
  let uploadedChanges = [];

  for (let i = 0; i < totalChanges; i++) {
    const change = offline_changes_Array[i];
    try {
      if (change.type === 'edit' && change.tableName === 'settings_table') {
        // Your existing code for handling settings_table edits
      } else {
        switch (change.type) {
          case 'edit':
            const editResponse = await fetch(
              `${baseUrl}/${change.tableName}/${change.rowId}/${change.columnName}`,
              {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                },
                body: JSON.stringify({ [change.columnName]: change.newValue }),
              }
            );
            await editResponse.json();
            break;
          case 'delete':
            const deleteResponse = await fetch(
              `${baseUrl}/${change.tableName}/${change.rowId}`,
              {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey,
                },
              }
            );
            await deleteResponse.text();
            break;
          case 'add':
            if (change.tableName === 'settings_table') {
              // Your existing code for handling settings_table additions
            } else {
              const addResponse = await fetch(
                `${baseUrl}/${change.tableName}`,
                {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': 'HH(CzZuQoW@tB$By)e',
                  },
                  body: change.addedJsonData,
                }
              );
              await addResponse.json();
            }
            break;
          /*case 'addImage':
            const userId = JSON.parse(JSON.parse(change.addedJsonData)).user_id;
            const filename = JSON.parse(
              JSON.parse(change.addedJsonData),
            ).filename;
            let rowID = change.columnName;
            const fileContent = await getFileContent(filename);

            const fileBlob = new Blob([fileContent], { type: 'image/png' }); // Assuming the file is a PNG image
            const file = new File([fileBlob], filename, { type: 'image/png' });
            if (rowID <= 0) {
              rowID = JSON.parse(
                JSON.parse(change.addedJsonData),
              ).id;
            }
            await uploadImage(userId, file, filename, change.columnName);
            break;*/

          default:
            console.error(`Unknown change type: ${change.type}`);
        }
      }
      // If the upload was successful, delete the offline change row
      await deleteValue('offline_changes', change.id);
      changeAmount++;
      uploadedChanges.push(change);
    } catch (error) {
      console.log(`Error processing ${change.type} change:`, error);
      failedUploads.push(change);
      continue;
    }
    // Update upload progress
    const uploadProgress =
      ((i + 1) / totalChanges) * uploadProgressWeight * 100;
    setUploadProgress(uploadProgress);
  }

  // Handle failed uploads
  if (failedUploads.length > 0) {
    console.log(`Failed to upload ${failedUploads.length} changes.`);
    // Optionally, you can retry failed uploads here
    // For simplicity, let's assume that the retry mechanism is implemented elsewhere
    // and we're only logging the failed uploads for now
  }
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
  console.log(changeAmountOnline[0].changeAmount + changeAmount, 'changeAmountOnline + changeAmount', changeAmountOnline[0].changeAmount);
  window.electron.store.set('changeAmount', changeAmountOnline[0].changeAmount + changeAmount);
  await syncOnlineToLocalWithCallback(SelectedUserId, (syncProgress) => {
    const totalProgress =
      syncProgress * syncProgressWeight + uploadProgressWeight * 100;
    setUploadProgress(totalProgress);
  });

  console.log('Uploaded changes:', uploadedChanges);
  RefreshApp();
  return true;
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

    const onlineData = await fetchDataFromOnlineDatabase(table);
    console.log(
      `Fetched ${onlineData.length} rows from online database for table: ${table}`
    );

    const localData = await fetchDataFromLocalDatabase(table);
    console.log(
      `Fetched ${localData.length} rows from local database for table: ${table}`
    );

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    console.log(`Processing rows for table: ${table}`);
    let updatedRows = 0;
    let addedRows = 0;
    let skippedRows = 0;

    // Add or update rows in the local database
    for (const [id, onlineRow] of onlineDataMap.entries()) {
      if (onlineRow.userId !== SelectedUserId) {
        skippedRows++;
        continue;
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (JSON.stringify(onlineRow) !== JSON.stringify(localRow)) {
          await updateLocalRecord(table, id, onlineRow);
          updatedRows++;
          console.log(`Updated row with id: ${id} in table: ${table}`);
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

    // Optionally delete local rows that do not exist in the online database
    let deletedRows = 0;
    for (const id of localDataMap.keys()) {
      if (!onlineDataMap.has(id)) {
        await deleteLocalRecord(table, id);
        deletedRows++;
        console.log(`Deleted row with id: ${id} from table: ${table}`);
      }
    }

    console.log(`Deleted ${deletedRows} rows from table: ${table}`);

    completedTables++;
    const progress = (completedTables / totalTables) * 100;
    setSyncProgress(progress);
    console.log(`Sync progress: ${progress.toFixed(2)}%`);
  }

  setChangeAmount(SelectedUserId)
  console.log('Applying offline changes');
  const offlineChanges = await fetchOfflineChanges();
  console.log(`Found ${offlineChanges.length} offline changes to apply`);
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  console.log('Sync completed');
  return 'Sync completed';
};
const setChangeAmount = async (SelectedUserId) => {
  const changeAmountOnline = await getValuesWithSql_Online(
    'users',
    `WHERE id = '${SelectedUserId}'`
  );
  console.log(`WHERE id = '${SelectedUserId}'`, changeAmountOnline[0],changeAmountOnline[0].changeAmount, '==========================================================================================');
  window.electron.store.set('changeAmount', changeAmountOnline[0].changeAmount);
};
export const RevertOfflineChanges = async () => {
  //make it delete all the rows in the offlinechangestable
  try {
    const response = await fetch(`${baseUrlLocal}/offline_changes`, {
      method: 'DELETE',
    });
    const data = await response.text();

    return data;
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await fetch(`${baseUrl}/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};
export async function verifyCredentials(email, password) {
  try {
    const response = await fetch(`${baseUrl}/verify-credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'HH(CzZuQoW@tB$By)e'
      },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data.isValid;
  } catch (error) {
    console.error('Error verifying credentials:', error);
    return false;
  }
}
export const getValuesWithSql_Online = async (tableName, sqlCode) => {
  try {
    const response = await fetch(
      `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching values with SQL code:', error);
    return [];
  }
};

export const getValuesFromOnlineDatabase = async (tableName) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching values from the online database:', error);
    return [];
  }
};

// Fetch data from the online MySQL database
const fetchDataFromOnlineDatabase = async (tableName) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
    });
    if (!response.ok) {
      throw new Error(`Error fetching data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching values from the online database:', error);
    return [];
  }
};

// Fetch data from the local SQLite database
const fetchDataFromLocalDatabase = async (tableName) => {
  return getValuesWithSql(tableName, 'WHERE 1');
};

// Sync data from online to local database
export const syncOnlineToLocal = async (SelectedUserId) => {
  console.log(`Starting sync process for user: ${SelectedUserId}`);

  console.log(`Tables to sync: ${tables.join(', ')}`);

  for (const table of tables) {
    console.log(`Processing table: ${table}`);

    const onlineData = await fetchDataFromOnlineDatabase(table);
    console.log(
      `Fetched ${onlineData.length} rows from online database for table: ${table}`
    );

    const localData = await fetchDataFromLocalDatabase(table);
    console.log(
      `Fetched ${localData.length} rows from local database for table: ${table}`
    );

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    console.log(`Processing rows for table: ${table}`);
    let updatedRows = 0;
    let addedRows = 0;
    let skippedRows = 0;

    // Add or update rows in the local database
    for (const [id, onlineRow] of onlineDataMap.entries()) {
      if (onlineRow.userId !== SelectedUserId) {
        skippedRows++;
        continue;
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (JSON.stringify(onlineRow) !== JSON.stringify(localRow)) {
          await updateLocalRecord(table, id, onlineRow);
          updatedRows++;
          console.log(`Updated row with id: ${id} in table: ${table}`);
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

    // Optionally delete local rows that do not exist in the online database
    let deletedRows = 0;
    for (const id of localDataMap.keys()) {
      if (!onlineDataMap.has(id)) {
        await deleteLocalRecord(table, id);
        deletedRows++;
        console.log(`Deleted row with id: ${id} from table: ${table}`);
      }
    }

    console.log(`Deleted ${deletedRows} rows from table: ${table}`);
  }
 
  setChangeAmount(SelectedUserId)
  console.log('Applying offline changes');
  const offlineChanges = await fetchOfflineChanges();
  console.log(`Found ${offlineChanges.length} offline changes to apply`);
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  // Sync action_history separately
  await syncActionHistory(SelectedUserId);

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

  for (const table of tables) {
    console.log(`Processing table: ${table}`);

    const onlineData = await fetchDataFromOnlineDatabase(table);
    console.log(
      `Fetched ${onlineData.length} rows from online database for table: ${table}`
    );

    const localData = await fetchDataFromLocalDatabase(table);
    console.log(
      `Fetched ${localData.length} rows from local database for table: ${table}`
    );

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    console.log(`Processing rows for table: ${table}`);
    let updatedRows = 0;
    let addedRows = 0;
    let skippedRows = 0;

    // Add or update rows in the local database
    for (const [id, onlineRow] of onlineDataMap.entries()) {
      if (onlineRow.userId !== SelectedUserId) {
        skippedRows++;
        continue;
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (JSON.stringify(onlineRow) !== JSON.stringify(localRow)) {
          await updateLocalRecord(table, id, onlineRow);
          updatedRows++;
          console.log(`Updated row with id: ${id} in table: ${table}`);
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

    // Optionally delete local rows that do not exist in the online database
    let deletedRows = 0;
    for (const id of localDataMap.keys()) {
      if (!onlineDataMap.has(id)) {
        await deleteLocalRecord(table, id);
        deletedRows++;
        console.log(`Deleted row with id: ${id} from table: ${table}`);
      }
    }

    console.log(`Deleted ${deletedRows} rows from table: ${table}`);

    currentStep++;
    setSyncProgress(Math.round((currentStep / totalSteps) * 100));
  }

  setChangeAmount(SelectedUserId)
  console.log('Applying offline changes');
  const offlineChanges = await fetchOfflineChanges();
  console.log(`Found ${offlineChanges.length} offline changes to apply`);
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  // Sync action_history separately
  await syncActionHistory(SelectedUserId);

  currentStep++;
  setSyncProgress(100);

  console.log('Sync completed');
  setIsSyncing(false);
  RefreshDataFromSqlite();
  return 'Sync completed';
};

// New function to sync action_history
const syncActionHistory = async (SelectedUserId) => {
  console.log('Syncing action_history');
  const onlineActionHistory = await fetchDataFromOnlineDatabase('action_history');
  const filteredActionHistory = onlineActionHistory.filter(action => action.userId === SelectedUserId);
  
  // Clear existing action_history in local database
  const existingActionHistory = await getValuesWithSql('action_history', 'WHERE 1');
  for (const action of existingActionHistory) {
    await deleteLocalRecord('action_history', action.id);
  }
  
  // Add new action_history from online database
  for (const action of filteredActionHistory) {
    await addLocalRecord('action_history', action);
  }
  
  console.log('action_history sync completed');
};

export const getValues = async (tableName) => {
  try {
    const response = await fetch(`${baseUrlLocal}/${tableName}`);
    const data = await response.json();
    return data;
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
  for (const change of changes) {
    switch (change.type) {
      case 'edit':
        await updateLocalRecord(change.tableName, change.rowId, {
          [change.columnName]: change.newValue,
        });
        break;
      case 'add':
        await addLocalRecord(
          change.tableName,
          JSON.parse(change.addedJsonData)
        );
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
    const response = await fetch(`${baseUrlLocal}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding value:', error);
    return null;
  }
};
export const addValueOnline = async (tableName, value) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },

      body: JSON.stringify(value),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding value:', error);
    return null;
  }
};

export const updateValue = async (tableName, id, columnName, columnValue) => {
  try {
    const response = await fetch(
      `${baseUrlLocal}/${tableName}/${id}/${columnName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [columnName]: columnValue }),
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating value:', error);
    return null;
  }
};

/// UIAMgeses
export const UploadUserFilesToTheOnlineDatabase = async (userId, setProgressValue) => {
  try {
    setProgressValue(0);
    console.log('Getting local directory...');
    const localDirectory = await getLocalUserDirectory();
    console.log('Local directory obtained:', localDirectory);
    setProgressValue(10);

    console.log('Sending directory data to online database...');
    const response = await retry(() => fetch(`${baseUrl}/check-user-directory`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ userId, directory: localDirectory }),
    }));
    const { requiredFiles } = await response.json();
    console.log('Response received from online database:', requiredFiles);
    setProgressValue(30);

    if (requiredFiles.length > 0) {
      console.log('Required files missing:', requiredFiles);
      
      const prepareResponse = await fetch(`${baseUrlLocal}/prepare-upload-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, requiredFiles }),
      });
      
      const zipContent = await prepareResponse.arrayBuffer();
      const totalSize = zipContent.byteLength;
      console.log(`Total upload size: ${totalSize} bytes`);
      setProgressValue(50);

      const formData = new FormData();
      formData.append('files', new Blob([zipContent]), 'required_files.zip');
      formData.append('userId', userId);

      console.log('Sending zip file to online database...');
      const startTime = Date.now();
      let uploadedSize = 0;
      const logInterval = setInterval(() => {
        console.log(`Upload progress: ${((uploadedSize / totalSize) * 100).toFixed(2)}%`);
        console.log(`Upload size: ${uploadedSize} bytes`);
      }, 3000);

      await fetch(`${baseUrl}/upload-missing-files`, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
        },
        body: formData,
      });

      clearInterval(logInterval);
      const endTime = Date.now();
      const uploadTime = (endTime - startTime) / 1000;
      console.log(`Upload completed in ${uploadTime} seconds`);
      console.log('Missing files uploaded successfully.');
      setProgressValue(90);
    } else {
      console.log('No missing files required for upload.');
      setProgressValue(90);
    }

    console.log('Upload completed successfully.');
    setProgressValue(100);
  } catch (error) {
    console.error('Error during file upload process:', error);
    setProgressValue(0);
  }
};


const retry = async (fn, maxRetries = 3, delay = 1000) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};
export const DownloadUserFilesFromOnlineDatabase = async (userId, setProgressValue) => {
  try {
    setProgressValue(0);
    console.log('Getting local directory structure...');
    const localDirectory = await getLocalUserDirectory();
    setProgressValue(20);

    console.log('Requesting file list from online database...');
    const response = await fetch(`${baseUrl}/check-missing-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ userId, localDirectory }),
    });
    const { missingFiles } = await response.json();
    setProgressValue(40);

    if (missingFiles.length > 0) {
      console.log('Downloading missing files...');
      const downloadResponse = await fetch(`${baseUrl}/download-missing-files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({ userId, missingFiles }),
      });

      const reader = downloadResponse.body.getReader();
      const contentLength = +downloadResponse.headers.get('Content-Length');
      let receivedLength = 0;
      const chunks = [];
      const startTime = Date.now();

      const logInterval = setInterval(() => {
        console.log(`Download size: ${receivedLength} bytes`);
        console.log(`Download progress: ${((receivedLength / contentLength) * 100).toFixed(2)}%`);
      }, 3000);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        receivedLength += value.length;
        setProgressValue(40 + (receivedLength / contentLength) * 30);
      }

      clearInterval(logInterval);

      const zipBuffer = new Uint8Array(receivedLength);
      let position = 0;
      for (const chunk of chunks) {
        zipBuffer.set(chunk, position);
        position += chunk.length;
      }

      console.log('Extracting downloaded files...');
      const extractStartTime = Date.now();
      await extractDownloadedFiles(zipBuffer, userId);
      const extractEndTime = Date.now();
      const extractionTime = (extractEndTime - extractStartTime) / 1000;
      console.log(`Extraction time: ${extractionTime} seconds`);
      console.log(`Extracted size: ${receivedLength} bytes`);

      setProgressValue(90);
      console.log('Files downloaded and extracted successfully.');
    } else {
      console.log('No missing files to download.');
      setProgressValue(90);
    }
    setProgressValue(100);
  } catch (error) {
    console.error('Error during file download process:', error);
    setProgressValue(0);
  }
};

const extractDownloadedFiles = async (zipBuffer, userId) => {
  try {
    const response = await fetch(`${baseUrlLocal}/extract-downloaded-files`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: zipBuffer,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Files extracted successfully:', result);
  } catch (error) {
    console.error('Error extracting files:', error);
    throw error;
  }
};



export const replaceUserData = async (userId, tables) => {
  const filteredTables = Object.fromEntries(
    Object.entries(tables).map(([tableName, rows]) => [
      tableName,
      rows.map(row => {
        const { RecommendedTenantsIdList, ...rest } = row;
        return rest;
      })
    ])
  );

  try {
    const response = await fetch('https://www.rentmaster.markethubet.com/api/replace-user-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({ userId, tables: filteredTables }),
    });

    const responseData = await response.text();
    console.log('Full server response:', responseData);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, response: ${responseData}`);
    }

    return JSON.parse(responseData);
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
  ];

export const SetBackUpAsMain = async (userId) => {
  const allData = {};

  // Fetch data from all tables except action_history
  for (const table of tables) {
    const tableData = await getValuesWithSql(table, "WHERE 1");
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
/*


const FormData = require('form-data');
const { v4: uuidv4 } = require('uuid');
const deleteImageLocal = async (userId, filename) => {
  try {
    const response = await fetch(`${baseUrlLocal}/delete`, {
      method: 'DELETE',
      headers: {
        'x-api-key': apiKey,
        'user-id': userId,
        filename: filename,
      },
    });

    if (response.status === 200) {
      const data = await response.json();
      return data;
    } else {
      const data = await response.json();
      console.error('Failed to delete file:', data);
      return null;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

const deleteImage = async (userId, filename) => {
  try {
    const response = await fetch(`${baseUrl}/delete`, {
      method: 'delete',

      headers: {
        'x-api-key': apiKey,
        'user-id': userId,
        filename: filename,
      },
    });

    if (response.status === 200) {
      return response.data;
    } else {
      console.error('Failed to delete file:', response.data);
      return null;
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};
const getOnlineFileNames = async (userId) => {
  try {
    const response = await fetch(`${baseUrl}/directory/${userId}`, {
      method: 'GET',
      headers: {
        'x-api-key': 'HH(CzZuQoW@tB$By)e'  // Replace with your actual API key
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const { structure } = await response.json();
    const filenames = extractFilenames(structure);
    return filenames;
  } catch (error) {
    console.error('Error fetching filenames:', error.message);
    return null;
  }
};

// Function to recursively extract filenames from directory structure
const extractFilenames = (structure) => {
  const filenames = [];

  Object.keys(structure).forEach(key => {
    if (structure[key] === 'file') {
      filenames.push(key);
    } else if (typeof structure[key] === 'object') {
      // Recursively extract filenames from sub-directory structure
      const subFilenames = extractFilenames(structure[key]);
      filenames.push(...subFilenames.map(filename => `${key}/${filename}`));
    }
  });

  return filenames;
};
// Function to upload an image
export const uploadImage = async (userId, file, newFilename, rowId) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(`${baseUrl}/upload`, {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'user-id': userId,
        filename: newFilename,
      },
      body: formData,
    });

    const data = await response.json();

    if (response.ok && data.message === 'File saved successfully') {
      const allImageRows = await getValuesWithSql_Online(
        'user_images',
        `WHERE user_id = '${userId}'`,
      );

      let tempExistOrNot = false;
      for (let i = 0; i < allImageRows.length; i++) {
        const element = allImageRows[i];
        if (element.id === rowId) {
          // Delete the old image if exists
          await deleteImage(userId, element.filename);
          await deleteImageLocal(userId, element.filename);
          const editResponse = await fetch(
            `${baseUrl}/user_images/${rowId}/filename`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
              },
              body: JSON.stringify({ filename: newFilename }),
            },
          );
          await editResponse.json();
          tempExistOrNot = true;
        }
      }
      // Get the list of files in the user's directory
      const filesInDirectory = await getListOfFiles(userId);

      const productsData = await getValuesWithSql('products');

      for (const file of filesInDirectory) {
        const isAssignedToProduct = productsData.some(
          (product) => product.image === file,
        );
        if (!isAssignedToProduct) {
          await deleteImageLocal(userId, file);
        }
      }
      const onlineFileDirectoryList = await getOnlineFileNames(userId);
      for (const file of onlineFileDirectoryList) {
        const isAssignedToProduct = productsData.some(
          (product) => product.image === file,
        );
        if (!isAssignedToProduct) {
          await deleteImage(userId, file);
        }
      }
      if (!tempExistOrNot) {
        const addResponse = await fetch(`${baseUrl}/user_images`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
          },
          body: JSON.stringify({
            id: rowId,
            user_id: userId,
            filename: newFilename,
            created_at: Date.now(),
          }),
        });
        await addResponse.json();
      }

      return true;
    } else {
      console.error('Error uploading file:', data);
      return false;
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return false;
  }
};
*/

