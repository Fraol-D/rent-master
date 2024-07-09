
//import { downloadImageFromLocalEndpoint, getFileContent, getListOfFiles } from './localServerApis';

const baseUrl = 'https://www.management.markethubet.com';
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
) => {
  const totalChanges = offline_changes_Array.length;
  const syncProgressWeight = 0.5;
  const uploadProgressWeight = 1 - syncProgressWeight;
  let failedUploads = [];

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
              },
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
              },
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
                },
              );
              await addResponse.json();
            }
            break;
          case 'addImage':
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
            break;

          default:
            console.error(`Unknown change type: ${change.type}`);
        }
      }
      // If the upload was successful, delete the offline change row
      await deleteValue('offline_changes', change.id);
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
    console.log(
      `Failed to upload ${failedUploads.length} changes. Retrying...`,
    );
    // Optionally, you can retry failed uploads here
    // For simplicity, let's assume that the retry mechanism is implemented elsewhere
    // and we're only logging the failed uploads for now
  }

  // Sync online to local and update progress
  await syncOnlineToLocalWithCallback(SelectedUserId, (syncProgress) => {
    const totalProgress =
      syncProgress * syncProgressWeight + uploadProgressWeight * 100;
    setUploadProgress(totalProgress);
  });

  return true;
};
export const syncOnlineToLocalWithCallback = async (SelectedUserId, setSyncProgress) => {
  const tables = [
    'settings_table',
    'product_price_changes',
    'product_advanced_positions',
    'products',
    'branches',
    'categories',
    'saleshistory',
    'number_time_ob_statgraph',
    'number_time_ob_statgraph_productids',
    'customers',
    'vendors',
    'paylater_customers',
    'paylater_vendor',
    'stockitems',
    'stockitemsimport',
    'sellandprofittotimeproduct',
  ];

  // Get all the correct branchIds for the SelectedUserId
  const branchesData = await fetchDataFromOnlineDatabase('branches');
  const correctBranchIds = branchesData
    .filter((branch) => branch.userId === SelectedUserId)
    .map((branch) => branch.id);

  // Get all the correct productIds for the correctBranchIds
  const productsData = await fetchDataFromOnlineDatabase('products');
  const CurrentProductIDs = productsData
    .filter((product) => correctBranchIds.includes(product.branchId))
    .map((product) => product.id);

  let completedTables = 0;
  const totalTables = tables.length;

  for (const table of tables) {
    const onlineData = await fetchDataFromOnlineDatabase(table);
    const localData = await fetchDataFromLocalDatabase(table);

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    // Add or update rows in the local database
    for (const [id, onlineRow] of onlineDataMap.entries()) {
      if (table === 'branches') {
        if (onlineRow.userId !== SelectedUserId) {
          continue;
        }
      } else if (table === 'products') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'categories') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'customers') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'vendors') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'paylater_customers') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'paylater_vendor') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'number_time_ob_statgraph') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'number_time_ob_statgraph_productids') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'saleshistory') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'number_time_ob_statgraph_productids') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'settings_table') {
        if (SelectedUserId !== onlineRow.branchId) {
          continue;
        }
      } else if (table === 'product_price_changes') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'product_advanced_positions') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'sellandprofittotimeproduct') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'stockitems') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'stockitemsimport') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (JSON.stringify(onlineRow) !== JSON.stringify(localRow)) {
          await updateLocalRecord(table, id, onlineRow);
        }
      } else {
        await addLocalRecord(table, onlineRow);
      }
    }

    // Optionally delete local rows that do not exist in the online database
    for (const id of localDataMap.keys()) {
      if (!onlineDataMap.has(id)) {
        await deleteLocalRecord(table, id);
      }
    }

    completedTables++;
    const progress = (completedTables / totalTables) * 100;
    setSyncProgress(progress);
  }

  // Apply images
  const localImages = await getListOfFiles(SelectedUserId);
  const OnlineImages = await getOnlineFileNames(SelectedUserId);
  const UserImages = await getValuesWithSql_Online("user_images", `WHERE user_id = "${SelectedUserId}"`);

  let completedImages = 0;
  const totalImages = UserImages.length;

  for (let i = 0; i < UserImages.length; i++) {
    const element = UserImages[i];
    const filename = element.filename;

    // Check if the image exists locally
    if (!localImages.includes(filename)) {
      // Check if the image exists online
      if (OnlineImages.includes(filename)) {
        // Download the image
        try {
          await downloadImageFromLocalEndpoint(SelectedUserId, filename);
          console.log(`Downloaded image: ${filename}`);
        } catch (error) {
          console.error(`Failed to download image: ${filename}`, error);
        }
      } else {
        console.warn(`Image not found online: ${filename}`);
      }
    }

    completedImages++;
    const progress = ((completedTables * totalTables) + completedImages) / (totalTables + totalImages) * 100;
    setSyncProgress(progress);
  }

  // Apply offline changes
  const offlineChanges = await fetchOfflineChanges();
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  return 'Sync completed';
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
      },
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
  return getValues(tableName);
};
/*
// Sync data from online to local database
export const syncOnlineToLocal = async (SelectedUserId) => {
  const tables = [
    'settings_table',
    'product_price_changes',
    'product_advanced_positions',
    'products',
    'branches',
    'categories',
    'saleshistory',
    'number_time_ob_statgraph',
    'number_time_ob_statgraph_productids',
    'customers',
    'vendors',
    'paylater_customers',
    'paylater_vendor',
    'stockitems',
    'stockitemsimport',
    'sellandprofittotimeproduct',
  ];

  // Get all the correct branchIds for the SelectedUserId
  const branchesData = await fetchDataFromOnlineDatabase('branches');
  const correctBranchIds = branchesData
    .filter((branch) => branch.userId === SelectedUserId)
    .map((branch) => branch.id);

  // Get all the correct productIds for the correctBranchIds
  const productsData = await fetchDataFromOnlineDatabase('products');
  const CurrentProductIDs = productsData
    .filter((product) => correctBranchIds.includes(product.branchId))
    .map((product) => product.id);

  for (const table of tables) {
    const onlineData = await fetchDataFromOnlineDatabase(table);
    const localData = await fetchDataFromLocalDatabase(table);

    const onlineDataMap = new Map(onlineData.map((row) => [row.id, row]));
    const localDataMap = new Map(localData.map((row) => [row.id, row]));

    // Add or update rows in the local database
    for (const [id, onlineRow] of onlineDataMap.entries()) {
      if (table === 'branches') {
        if (onlineRow.userId !== SelectedUserId) {
          continue;
        }
      } else if (table === 'products') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'categories') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'customers') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'vendors') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'paylater_customers') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'paylater_vendor') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'number_time_ob_statgraph') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'number_time_ob_statgraph_productids') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'saleshistory') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'number_time_ob_statgraph_productids') {
        if (!correctBranchIds.includes(onlineRow.branchId)) {
          continue;
        }
      } else if (table === 'settings_table') {
        if (SelectedUserId !== onlineRow.branchId) {
          continue;
        }
      } else if (table === 'product_price_changes') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'product_advanced_positions') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'sellandprofittotimeproduct') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'stockitems') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      } else if (table === 'stockitemsimport') {
        if (!CurrentProductIDs.includes(onlineRow.productId)) {
          continue;
        }
      }

      if (localDataMap.has(id)) {
        const localRow = localDataMap.get(id);
        if (JSON.stringify(onlineRow) !== JSON.stringify(localRow)) {
          await updateLocalRecord(table, id, onlineRow);
        }
      } else {
        await addLocalRecord(table, onlineRow);
      }
    }

    // Optionally delete local rows that do not exist in the online database
    for (const id of localDataMap.keys()) {
      if (!onlineDataMap.has(id)) {
        await deleteLocalRecord(table, id);
      }
    }
  }
  //Apply images
  const localImages = await getListOfFiles(SelectedUserId);
  const OnlineImages = await getOnlineFileNames(SelectedUserId);
  const UserImages = await getValuesWithSql_Online("user_images", `WHERE user_id = "${SelectedUserId}"`);
  
  for (let i = 0; i < UserImages.length; i++) {
    const element = UserImages[i];
    const filename = element.filename;
  
    // Check if the image exists locally
    if (!localImages.includes(filename)) {
      // Check if the image exists online
      if (OnlineImages.includes(filename)) {
        // Download the image
        try {
          await downloadImageFromLocalEndpoint(SelectedUserId, filename);
          console.log(`Downloaded image: ${filename}`);
        } catch (error) {
          console.error(`Failed to download image: ${filename}`, error);
        }
      } else {
        console.warn(`Image not found online: ${filename}`);
      }
    }
  }
  // Apply offline changes
  const offlineChanges = await fetchOfflineChanges();
  await applyOfflineChangesToLocalDatabase(offlineChanges);

  return 'Sync completed';
};

// Fetch offline changes from the local SQLite database
const fetchOfflineChanges = async () => {
  return getValues('offline_changes');
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
          JSON.parse(change.addedJsonData),
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
      },
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating value:', error);
    return null;
  }
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
};
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

      const productsData = await getValues('products');

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