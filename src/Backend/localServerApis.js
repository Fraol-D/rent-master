import { storageManager } from '../renderer/storeManager';
let baseUrl = 'http://localhost:8100';


if (!window.electron) {
  baseUrl = 'https://www.rentmaster.markethubet.com/api';
}

import { v4 as uuidv4 } from 'uuid';

import { makeProxyRequest } from './viteApiHandler';

// Base request function
const makeRequest = async (input, init = {}) => {
  const {
    method = 'GET',
    headers = {},
    body = null,
    isFileManager = false,
    useProxy = !window.electron
  } = init;
  //if(window.electron) return await fetch(input,init)
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // Normalize URL
    
    if (useProxy) {
      
      const proxyResponse = await makeProxyRequest('local',input, method, headers, body, userId)
      
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

export const dropAllRowsInTable = async (tableName) => {
  try {
    const response = await makeRequest(`${baseUrl}/drop-all-rows/${tableName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json', 
       
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = response;
    console.log(data);
    return data;
  } catch (error) {
    console.error(`Error dropping all rows from ${tableName}:`, error);
    return null;
  }
};
export const addValueROOM = async (tableName, value, setChangeMade) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(value),
    });
    if (!response.ok) {
      const errorText = response;
      throw new Error(
        `HTTP error! status: ${response.status}, body: ${errorText}`
      );
    }
    const data =  response;
    await addRowToOfflineChanges(
      tableName,
      value.id,
      'not_needed',
      'not_needed',
      'add',
      value,
      setChangeMade,
      'Not needed',
      true
    );
    return data;
  } catch (error) {
    console.error('Error adding value:', error.message);
    console.error('Request body:', JSON.stringify(value, null, 2));
    return null;
  }
};
export const getValuesWithSql = async (tableName, sqlCode) => {
  try {
    const response = await makeRequest(
      `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`,
      {
        method: 'GET',
        headers: {
          
        },
      }
    );
    const data =  response;
    return data;
  } catch (error) {
    console.error('Error fetching values with SQL code:', error);
    return [];
  }
};
const getValuesWithSqlL = async (tableName, sqlCode) => {
  try {
    const response = await makeRequest(
      `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`,
      {
        method: 'GET',
        headers: {
          
        },
      }
    );
    const data =  response;
    return data;
  } catch (error) {
    console.error('Error fetching values with SQL code:', error);
    return [];
  }
};
const addRowToOfflineChanges = async (
  tableName,
  RowIdP,
  columnNameP,
  columnValueP,
  typevalue,
  addedJsonData,
  setChangeMade,
  originalValue,
  actionHis
) => {
  if (window.electron) {
    if (tableName === 'user_images') {
      const RowWithTheSameThing = await getValuesWithSqlL(
        'offline_changes',
        `WHERE columnName = '${columnNameP}'  AND type = 'addImage'`
      );
      if (RowWithTheSameThing.length === 0) {
        const response = await makeRequest(`${baseUrl}/${'offline_changes'}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            
          },
          body: JSON.stringify({
            id: uuidv4(), // Generate a random UUID
            type: typevalue,
            columnName: columnNameP,
            rowId: RowIdP,
            newValue: columnValueP,
            tableName: tableName,
            addedJsonData: JSON.stringify(addedJsonData),
          }),
        });
        const data = response;
        console.log(
          `Row with that id(${RowIdP}) with type(${typevalue}) was not found so it added`,
          data
        );
      } else {
        try {
          const response = await makeRequest(
            `${baseUrl}/${'offline_changes'}/${
              RowWithTheSameThing[0].id
            }/${'rowId'}`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                
              },
              body: JSON.stringify({ ['rowId']: RowIdP }),
            }
          );

          response;
        } catch (error) {
          console.error('Error updating value:', error);
          return null;
        }
      }
    } else if (columnNameP !== 'MainPc' && columnNameP !== 'LockToBranchId') {
      const RowWithTheSameThing = await getValuesWithSqlL(
        'offline_changes',
        `WHERE columnName = '${columnNameP}' AND rowId = '${RowIdP}' AND type = 'edit'`
      );

      if (RowWithTheSameThing.length === 0) {
        if (typevalue === 'delete') {
          //get all the rows from the offlinechanges
          const allRows = await getValuesWithSqlL(
            'offline_changes',
            `WHERE rowId = \'${RowIdP}\' AND type = 'add'`
          );

          //If there is a row i want you to delete that edit row and add a delete row
          if (allRows.length > 0) {
            const response = await makeRequest(
              `${baseUrl}/${'offline_changes'}/${allRows[0].id}`,
              {
                method: 'DELETE',
              }
            );
            const data = response;
          } else {
            const response = await makeRequest(`${baseUrl}/${'offline_changes'}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                
              },
              body: JSON.stringify({
                id: uuidv4(), // Generate a random UUID
                type: typevalue,
                columnName: columnNameP,
                rowId: RowIdP,
                newValue: columnValueP,
                tableName: tableName,
                addedJsonData: JSON.stringify(addedJsonData),
              }),
            });
            const data = response;
            console.log(
              `Row with that id(${RowIdP}) with type(${typevalue}) was not found so it added`,
              data
            );
          }
        } else {
          if (columnValueP !== originalValue) {
            const response = await makeRequest(`${baseUrl}/${'offline_changes'}`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                
              },
              body: JSON.stringify({
                id: uuidv4(), // Generate a random UUID
                type: typevalue,
                columnName: columnNameP,
                rowId: RowIdP,
                newValue: columnValueP,
                tableName: tableName,
                addedJsonData: JSON.stringify(addedJsonData),
                originalValue: originalValue,
              }),
            });
            const data = response;
            console.log(
              `Row with that id(${RowIdP}) with type(${typevalue}) was not found so it added`,
              data
            );
          }
        }
      } else {
        console.log(
          String(columnValueP),
          String(RowWithTheSameThing[0].originalValue)
        );

        const compareValues = (value1, value2) => {
          // Compare as strings
          if (String(value1) === String(value2)) return true;

          // Compare as numbers
          if (
            !isNaN(value1) &&
            !isNaN(value2) &&
            Number(value1) === Number(value2)
          )
            return true;

          // Compare as booleans
          if (
            (value1 === true &&
              (value2 === 'true' || value2 === '1' || value2 === 1)) ||
            (value1 === false &&
              (value2 === 'false' || value2 === '0' || value2 === 0))
          )
            return true;

          return false;
        };

        if (compareValues(columnValueP, RowWithTheSameThing[0].originalValue)) {
          setChangeMade((prev) => prev - 1);
          const response = await makeRequest(
            `${baseUrl}/offline_changes/${RowWithTheSameThing[0].id}`,
            {
              method: 'DELETE',
            }
          );
          const data = response;
          console.log(
            `Deleted offline change row with id: ${RowWithTheSameThing[0].id}`
          );
        } else {
          // Update the existing offline change row
          const response = await makeRequest(
            `${baseUrl}/${'offline_changes'}/${
              RowWithTheSameThing[0].id
            }/newValue`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                
              },
              body: JSON.stringify({
                newValue: columnValueP,
              }),
            }
          );
          const data = response;
          console.log(
            `Row with that id(${RowIdP}) with type(${typevalue}) was successfully found so it edited it with`,
            data
          );
        }
      }

      setChangeMade((prevValue) => prevValue + 1);
    }
  }
  // User history
  if (actionHis === true) {
    async function addToActionHistory(
      actionTable,
      actionType,
      description,
      performedBy,
      userId
    ) {
      const id = uuidv4();
      const actionDate = Date.now();
      const userInfos = window.electron
        ? await window.electron.ipcRenderer.invoke('os-info')
        : {};
      const platform = window.electron
        ? userInfos.platform === 'win32'
          ? 'Windows'
          : userInfos.platform
        : 'Web Version';
      const userInfoString = window.electron
        ? platform + ' ' + userInfos.pcName + ' ' + userInfos.userInfo.username
        : 'Web Version';
      console.log(
        userInfoString,
        ':----------------------------------------------------------:',
        userInfos
      );
      await addValueActionHistory(
        'action_history',
        {
          id,
          action_table: actionTable,
          action_type: actionType,
          description,
          performed_by: performedBy,
          action_date: actionDate,
          userInfo: userInfoString,
          branchId: storageManager.get('SelectedBranchId'),
          userId: userId,
        },
        setChangeMade
      );
    }
    if (originalValue !== columnValueP) {
      const users = await storageManager.get('users');
      let description = '...';
      if (typevalue === 'add') {
        description = 'Added ' + RowIdP + ' to the ' + tableName;
      } else if (typevalue === 'edit') {
        description = `edited '${RowIdP}'s ${columnNameP} to ${columnValueP}`;
        if (originalValue !== null) {
          description = `edited '${RowIdP}'s ${columnNameP} from ${originalValue} to ${columnValueP}`;
        }
      } else if (typevalue === 'delete') {
        description = 'deleted ' + RowIdP + ' from the ' + tableName;
      }
      const performedBy =
        storageManager.get('SelectedAppUserId') === 'admin'
          ? 'Admin'
          : storageManager
              .get('app_users')
              .find(
                (user) => user.id === storageManager.get('SelectedAppUserId')
              )?.roleName || 'Unknown User';

      await addToActionHistory(
        tableName,
        typevalue,
        description,
        performedBy,
        users[0].id
      );
    }
  }
};

export const getValues = async (tableName) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}`);
    const data = response;
    return data;
  } catch (error) {
    console.error('Error fetching values:', error);
    return [];
  }
};

export const getValueById = async (tableName, id) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}/${id}`);
    const data = response;
    return data;
  } catch (error) {
    console.error('Error fetching value by ID:', error);
    return null;
  }
};
export const addValue = async (tableName, value, setChangeMade) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(value),
    });
    const data = response;
    await addRowToOfflineChanges(
      tableName,
      value.id,
      'not_needed',
      'not_needed',
      'add',
      value,
      setChangeMade,
      'Not needed',
      true
    );

    return data;
  } catch (error) {
    console.error(
      'Error adding value:',
      error,
      'Body is',
      JSON.stringify(value)
    );
    return null;
  }
};
export const addValueActionHistory = async (
  tableName,
  value,
  setChangeMade
) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(value),
    });
    const data = response;
    await addRowToOfflineChanges(
      tableName,
      value.id,
      'not_needed',
      'not_needed',
      'add',
      value,
      setChangeMade,
      'Not needed',
      false
    );

    return data;
  } catch (error) {
    console.error(
      'Error adding value:',
      error,
      'Body is',
      JSON.stringify(value)
    );
    return null;
  }
};
export const addValueWithOutOfflineChange = async (tableName, value) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        
      },
      body: JSON.stringify(value),
    });
    const data = response;

    return data;
  } catch (error) {
    console.error(
      'Error adding value:',
      error,
      'Body is',
      JSON.stringify(value)
    );
    return null;
  }
};
export const updateValue = async (
  tableName,
  id,
  columnName,
  columnValue,
  setChangeMade,
  originalValue
) => {
  try {
    // get original value false new value is true so add but if it exist in offline changes and when it went from true back to false it needs to know what the value was when first changing it
    // So add a column to offline changes that says original value then wehn adding a new row to offline changes
    // set orignal value to original value then when editing a offline changes check if the new value is equal to the orignal value and if it is remove it

    const response = await makeRequest(
      `${baseUrl}/${tableName}/${id}/${columnName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          
        },
        body: JSON.stringify({ [columnName]: columnValue }),
      }
    );

    const data = response;

    await addRowToOfflineChanges(
      tableName,
      id,
      columnName,
      columnValue,
      'edit',
      'not_needed',
      setChangeMade,
      originalValue,
      true
    );
  } catch (error) {
    console.error('Error updating value:', error);
    return null;
  }
};
export const deleteValue = async (tableName, id, setChangeMade) => {
  try {
    const response = await makeRequest(`${baseUrl}/${tableName}/${id}`, {
      method: 'DELETE',
      headers: {
        
      },
    });
    const data = response;
    await addRowToOfflineChanges(
      tableName,
      id,
      'not_needed',
      'not_needed',
      'delete',
      'not_needed',
      setChangeMade,
      'Not needed',
      true
    );
    return data;
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};

export const deleteValueALL = async () => {
  try {
    const response = await makeRequest(`${baseUrl}/delete-all-data`, {
      method: 'DELETE',
    });
    const data = response;

    return data;
  } catch (error) {
    console.error('Error deleting all data:', error);
    throw error; // Rethrow the error to handle it in the caller function
  }
};
//////////////////////////////////////////////
// Fix the SendFileManagerApi function first
const SendFileManagerApi = async (url, method, headers = {}, data = null) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // Ensure url starts with a slash
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    // Fix URL construction
    const urlReal = window.electron
      ? `${baseUrl}${normalizedUrl}`.replace(/([^:]\/)\/+/g, '$1')
      : `${baseUrl}/filemanager${normalizedUrl}`.replace(/([^:]\/)\/+/g, '$1');

    let options = {
      method,
      headers: {
        ...headers,
        
        'user-id': userId,
      },
    };

    // For GET requests, append userId as query parameter
    if (method === 'GET') {
      const separator = urlReal.includes('?') ? '&' : '?';
      const finalUrl = `${urlReal}${separator}userId=${encodeURIComponent(
        userId
      )}`;
      console.log('Making GET request to:', finalUrl);
      return makeRequest(finalUrl, options);
    }

    // For other methods, include data in body
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify({ ...data, userId });
    }

    return makeRequest(urlReal, options);
  } catch (error) {
    console.error('Error in SendFileManagerApi:', error);
    throw error;
  }
};
const SendNormalApi = async (url, method, headers = {}, data = null) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // Ensure url starts with a slash
    const normalizedUrl = url.startsWith('/') ? url : `/${url}`;

    // Fix URL construction
    const urlReal = window.electron
      ? `${baseUrl}${normalizedUrl}`.replace(/([^:]\/)\/+/g, '$1')
      : `${baseUrl}${normalizedUrl}`.replace(/([^:]\/)\/+/g, '$1');

    let options = {
      method,
      headers: {
        ...headers,
        
        'user-id': userId,
      },
    };

    // For GET requests, append userId as query parameter
    if (method === 'GET') {
      const separator = urlReal.includes('?') ? '&' : '?';
      const finalUrl = `${urlReal}${separator}userId=${encodeURIComponent(
        userId
      )}`;
      console.log('Making GET request to:', finalUrl);
      return makeRequest(finalUrl, options);
    }

    // For other methods, include data in body
    if (data) {
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify({ ...data, userId });
    }

    return makeRequest(urlReal, options);
  } catch (error) {
    console.error('Error in SendFileManagerApi:', error);
    throw error;
  }
};
export const deleteReceipt2 = async (date, roomId, tenant) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // Format the date consistently
    const formattedDate = new Date(date).toISOString().split('T')[0];
    const addedTimeText = new Date(tenant?.startTime || 0).toDateString();

    const response = await SendFileManagerApi(
      `/delete-receipt/${encodeURIComponent(userId)}/${encodeURIComponent(roomId)}/${encodeURIComponent(formattedDate)}`,
      'DELETE',
      {
        'Content-Type': 'application/json',
        'user-id': userId,
        'tenant-id': tenant?.id || '',
        'tenant-name': tenant?.name || '',
        'tenant-start-time': addedTimeText,
      }
    );

    if (!response.ok) {
      throw new Error('Failed to delete receipt');
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting receipt:', error);
    return { success: false, error: error.message };
  }
};
export const GetReceiptFileApi = async (date, roomId, tenant) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // Format the date consistently
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // Make the request
    const response = await SendFileManagerApi(
      `/receipt-file/${encodeURIComponent(roomId)}/${encodeURIComponent(formattedDate)}`,
      'GET',
      {
        'Content-Type': 'application/json',
        'user-id': userId,
        'tenant-id': tenant?.id || '',
        'tenant-name': tenant?.name || '',
        'tenant-start-time': tenant?.startTime || '',
      }
    );
 
    // Handle non-200 responses
    if (!response.ok) {
      if (response.status === 404) {
        return 'Add receipt';
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Try to parse JSON response
    let data;
    const text = response;
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('Failed to parse JSON:', text);
      return 'Add receipt';
    }

    if (!data.receiptUrl) {
      return 'Add receipt';
    }

    return `https://www.rentmaster.markethubet.com${data.receiptUrl}`;

  } catch (error) {
    console.error('Error getting receipt file:', error);
    return null;
  }
};
export const uploadReceiptDocumentsOnline = async (file, roomId, tenantList,tenantId, date,AddedTimeText) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // Get tenant info
    const tenant = tenantList.find(t => t.id === tenantId);
    if (!tenant) {
      throw new Error('Tenant not found');
    }
console.log(date)
    // Convert file to base64
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64Document = reader.result;
          const fileName = `${date}_${file.name}`;
          const response = await SendFileManagerApi(
            '/upload-receipt-document',
            'POST',
            {
              'Content-Type': 'application/json',
              'user-id': userId,
            },
            {
              base64Document,
              fileName,
              roomId,
              tenantName: tenant.name,
              tenantId,
              formattedDate: date,
              AddedTimeText
            }
          );

          if (!response.ok) {
            throw new Error('Failed to upload receipt');
          }

          const result = response;
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = (error) => reject(error);
    });
  } catch (error) {
    console.error('Error uploading receipt:', error);
    throw error;
  }
};
export const AddRoomImageToFiles = async (files, FolderText) => {
  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const base64Image = await fileToBase64(file);
      const FileId = uuidv4();
      const response = await SendFileManagerApi(
        `/upload-room-image`,
        'POST',
        {
          'Content-Type': 'application/json',
          
        },
        {
          base64Image,
          fileName: file.name,
          FolderText,
          FileId,
        }
      );
      return response.json();
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading room images:', error);
    return null;
  }
};
export const getRealFile = async (fullurl) => {
  const users = await storageManager.get('users');
  if (!users?.[0]?.id) {
    throw new Error('User ID not found');
  }
  const userId = users[0].id;

  const response = await makeRequest(fullurl, {
    headers: {
      'user-id': userId,
      
    },
  });
  const blob = await response.blob();
  return blob;
};
// Fix the getRoomImages function
export const getRoomImages = async (roomId) => {
  try {
    if (!roomId) {
      throw new Error('Room ID is required');
    }

    console.log('Fetching room images for roomId:', roomId);
    const response = await SendFileManagerApi(
      `/room-images/${encodeURIComponent(roomId)}`,
      'GET'
    );

    const data = response;

    // Modify the URLs to include the base URL
    if (data.images) {
      data.images = data.images.map((image) => ({
        ...image,
        url: `${baseUrl}${image.url}`, // Add the base URL
        fullUrl: window.electron
          ? `${baseUrl}${image.url}`
          : `https://www.rentmaster.markethubet.com${image.url}`,
      }));
    }

    return data;
  } catch (error) {
    console.error('Error in getRoomImages:', error);
    return { images: [], roomFolder: null };
  }
};
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};
export const downloadDocument = async (roomId, fileName) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // First, get the tenant information if it's a room document
    let tenantFolderName = '';
    if (roomId !== 'Add a tenant documents') {
      const response = await SendFileManagerApi(
        `/tenant-document-info/${encodeURIComponent(roomId)}`,
        'GET'
      );
      if (!response.ok) {
        throw new Error('Failed to get tenant document info');
      }
      const { folderName } = response;
      tenantFolderName = folderName;
    } else {
      tenantFolderName = 'Add a tenant document';
    }

    // Make the download request with the correct path structure
    const response = await SendFileManagerApi(
      `/download-document/${encodeURIComponent(roomId)}/${encodeURIComponent(tenantFolderName)}/${encodeURIComponent(fileName)}`,
      'GET',
      {
        'Content-Type': 'application/json',
        'user-id': userId,
        
      },
      null,
      true
    );

    if (!response.ok) {
      const errorText = response;
      throw new Error(`Failed to download document: ${errorText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading document:', error);
    throw error;
  }
};
export const deleteRoomImage = async (roomId, fullPath) => {
 
  if (window.electron) { const fileName = fullPath.split('\\').pop();
    // Use backslash for Windows paths
    try {
      const response = await SendFileManagerApi(
        `/room-image/${roomId}/${encodeURIComponent(fileName)}`,
        'DELETE'
      );
      const data = response;
      return data;
    } catch (error) {
      console.error('Error deleting room image:', error);
      return null;
    }
  } else {
    try {
      // Extract just the filename from the full path
      const fileName = fullPath.split(/[/\\]/).pop();
      const userId = storageManager.get('users')[0].id;
      
      console.log('Deleting room image:', { roomId, fileName, userId, fullPath }); // Debug log
      
      const response = await SendFileManagerApi(
        `/room-image/${encodeURIComponent(roomId)}/${encodeURIComponent(fileName)}/${encodeURIComponent(userId)}`,
        'DELETE'
      );
      const data = response;
      return data;
    } catch (error) {
      console.error('Error deleting room image:', error);
      return null;
    }
  }
};
export const deleteFolderImages = async (folderName) => {
  try {
    const response = await SendFileManagerApi(
      `/delete-folder-images/${encodeURIComponent(folderName)}`,
      'DELETE'
    );
    const data = response;
    return data;
  } catch (error) {
    console.error('Error deleting folder images:', error);
    return null;
  }
};
export const renameFolder = async (oldName, newName) => {
  try {
    const response = await SendFileManagerApi(
      `/rename-folder`,
      'PUT',
      {
        'Content-Type': 'application/json',
      },
      {
        oldName,
        newName,
      }
    );
    const data = response;
    return data;
  } catch (error) {
    console.error('Error renaming folder:', error);
    return null;
  }
};
export const duplicateRoomImagesFolder = async (
  sourceFolderName,
  newFolderName
) => {
  try {
    const response = await SendFileManagerApi(
      `/duplicate-room-images-folder`,
      'POST',
      {
        'Content-Type': 'application/json',
        
      },
      {
        sourceFolderName,
        newFolderName,
      }
    );
    const data = response;
    return data;
  } catch (error) {
    console.error('Error duplicating room images folder:', error);
    return null;
  }
};
export const downloadImage = async (roomId, imageName) => {
  try {
    const users = await storageManager.get('users');
    if (!users?.[0]?.id) {
      throw new Error('User ID not found');
    }
    const userId = users[0].id;

    // First get the room folder info
    const folderResponse = await SendFileManagerApi(
      `/room-folder-info/${encodeURIComponent(roomId)}`,
      'GET'
    );

    if (!folderResponse.ok) {
      throw new Error('Failed to get room folder info');
    }

    const { folderName } = await folderResponse.json();

    // Make the download request with the correct folder name
    const response = await SendFileManagerApi(
      `/download-image/${encodeURIComponent(roomId)}/${encodeURIComponent(folderName)}/${encodeURIComponent(imageName)}/${encodeURIComponent(userId)}`,
      'GET',
      {
        'Content-Type': 'application/json',
        'user-id': userId,
        
      },
      null,
      true
    );

    if (!response.ok) {
      const errorText = response;
      throw new Error(`Failed to download image: ${errorText}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = imageName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
};
export const AddRoomDocuments = async (
  files,
  roomId,
  tenantName,
  tenantId,
  AddedTimeText
) => {
  if (!files || !roomId || !tenantName || !tenantId) {
    console.error('Missing required parameters for AddRoomDocuments');
    return null;
  }
  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const base64Document = await fileToBase64(file);
      const response = await SendFileManagerApi(
        `/upload-room-document`,
        'POST',
        {
          'Content-Type': 'application/json',
          
        },
        {
          base64Document,
          fileName: file.name,
          roomId,
          tenantName,
          tenantId,
          AddedTimeText,
        }
      );
      return response.json();
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading room documents:', error);
    return null;
  }
};
export const getRoomDocuments = async (roomId) => {
  try {
    const response = await SendFileManagerApi(
      `/room-documents/${roomId}`,
      'GET'
    );
    const data = response;
    return data;
  } catch (error) {
    return [];
  }
};
export const getTenantRoomDocuments = async (roomId, string) => {
  try {
    const url = `/room-documents/${roomId}/${string}`;

    console.log('Attempting to makeRequest documents from:', url);

    const response = await SendFileManagerApi(url, 'GET');
    const data = response;

    return data;
  } catch (error) {
    console.log('Error fetching tenant room documents:', error);
    return { documents: [], roomFolder: null, tenantFolder: null };
  }
};
export const deleteRoomDocument = async (roomId, filePath) => {
  try {
    const fileName = filePath.split('\\').pop();
    const response = await SendFileManagerApi(
      `/room-document/${roomId}/${encodeURIComponent(fileName)}`,
      'DELETE'
    );
    const data = response;
    return data;
  } catch (error) {
    console.error('Error deleting room document:', error);
    return null;
  }
};
export const uploadTenantDocument = async (file, roomId) => {
  try {
    const base64Document = await fileToBase64(file);
    const response = await SendFileManagerApi(
      `/room-document/upload-tenant-document`,
      'POST',
      {
        'Content-Type': 'application/json',
        
      },
      {
        base64Document,
        fileName: file.name,
        roomId,
      }
    );

    if (!response.ok) {
      const errorData = response;
      throw new Error(errorData.error || 'Failed to upload tenant document');
    }

    return response.json();
  } catch (error) {
    console.error('Error uploading tenant document:', error);
    throw error;
  }
};
export const deleteTenantDocument = async (filePath) => {
  try {
    // Extract just the filename from the full path
    const fileName = filePath.split(/[/\\]/).pop(); // Handle both forward and backward slashes

    console.log('Deleting tenant document:', fileName); // Debug log

    const response = await SendFileManagerApi(
      `/room-document/delete-tenant-document/${encodeURIComponent(
        window.electron ? filePath : fileName
      )}`,
      'DELETE'
    );
    return response.json();
  } catch (error) {
    console.error('Error deleting tenant document:', error);
    return null;
  }
};
export const uploadTenantDocumentsV2 = async (
  files,
  roomId,
  tenantName,
  tenantId,
  AddedTimeText
) => {
  if (!files || !roomId || !tenantName || !tenantId) {
    console.error('Missing required parameters for uploadTenantDocuments');
    return null;
  }
  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const base64Document = await fileToBase64(file);
      const response = await SendFileManagerApi(
        `/upload-tenant-documentV2`,
        'POST',
        {
          'Content-Type': 'application/json',
          
        },
        {
          base64Document,
          fileName: file.name,
          roomId,
          tenantName,
          tenantId,
          AddedTimeText,
        }
      );
      return response.json();
    });
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading tenant documents:', error);
    return null;
  }
};
export const deleteTenantDocumentFolder = async () => {
  try {
    const response = await SendFileManagerApi(
      `/delete-tenant-document-folder`,
      'DELETE'
    );
    return response.json();
  } catch (error) {
    console.error('Error deleting tenant document folder:', error);
    return null;
  }
};
export const uploadReceiptDocuments = async (
  files,
  roomId,
  tenantName,
  tenantId,
  formattedDate,
  AddedTimeText
) => {
  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const base64Document = await fileToBase64(file);
      const response = await SendFileManagerApi(
        `/upload-receipt-document`,
        'POST',
        {
          'Content-Type': 'application/json',
          
        },
        {
          base64Document,
          fileName: `${formattedDate}_${file.name}`,
          roomId,
          tenantName,
          tenantId,
          formattedDate,
          AddedTimeText,
        }
      );
      return response.json();
    });
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading receipt documents:', error);
    return null;
  }
};

//////////////////////////////////////
export const getLocalUserDirectory = async () => {
  try {
    const response = await makeRequest(`${baseUrl}/local-user-directory`);
    if (!response.ok) {
      throw new Error('Failed to makeRequest local images directory');
    }
    const data = response;
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching local images directory:', error);
    return null;
  }
};
export const deleteAllFromTable = async (tableName) => {
  try {
    const response = await makeRequest(`${baseUrl}/deleteAll/${tableName}`, {
      method: 'DELETE',
    });
    const data = response;
    console.log(data);
    return data;
  } catch (error) {
    console.error(`Error deleting all values from ${tableName}:`, error);
    return null;
  }
};
export const updateLocalRecordsBatch = async (tableName, records) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const stmt = db.prepare(
        `UPDATE ${tableName} SET ${Object.keys(records[0])
          .map((key) => `${key} = ?`)
          .join(', ')} WHERE id = ?`
      );

      records.forEach((record) => {
        const values = [...Object.values(record), record.id];
        stmt.run(values, (err) => {
          if (err) {
            console.error(`Error updating record in ${tableName}:`, err);
          }
        });
      });

      stmt.finalize();

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          db.run('ROLLBACK');
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};
export const addLocalRecordsBatch = async (tableName, records) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const columns = Object.keys(records[0]).join(', ');
      const placeholders = Object.keys(records[0])
        .map(() => '?')
        .join(', ');
      const stmt = db.prepare(
        `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`
      );

      records.forEach((record) => {
        const values = Object.values(record);
        stmt.run(values, (err) => {
          if (err) {
            console.error(`Error adding record to ${tableName}:`, err);
          }
        });
      });

      stmt.finalize();

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          db.run('ROLLBACK');
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};
export const deleteLocalRecordsBatch = async (tableName, ids) => {
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      const stmt = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`);

      ids.forEach((id) => {
        stmt.run(id, (err) => {
          if (err) {
            console.error(`Error deleting record from ${tableName}:`, err);
          }
        });
      });

      stmt.finalize();

      db.run('COMMIT', (err) => {
        if (err) {
          console.error('Error committing transaction:', err);
          db.run('ROLLBACK');
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
};
