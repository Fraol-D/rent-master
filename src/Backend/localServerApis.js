const baseUrl = 'http://localhost:8100';
const { v4: uuidv4 } = require('uuid');

export const getValuesWithSql = async (tableName, sqlCode) => {
  try {
    const response = await fetch(
      `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching values with SQL code:', error);
    return [];
  }
};
const getValuesWithSqlL = async (tableName, sqlCode) => {
  try {
    const response = await fetch(
      `${baseUrl}/${tableName}/${encodeURIComponent(sqlCode)}`
    );
    const data = await response.json();
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
  originalValue
) => {
  if (tableName === 'user_images') {
    const RowWithTheSameThing = await getValuesWithSqlL(
      'offline_changes',
      `WHERE columnName = '${columnNameP}'  AND type = 'addImage'`
    );
    if (RowWithTheSameThing.length === 0) {
      const response = await fetch(`${baseUrl}/${'offline_changes'}`, {
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
      const data = await response.json();
      console.log(
        `Row with that id(${RowIdP}) with type(${typevalue}) was not found so it added`,
        data
      );
    } else {
      try {
        const response = await fetch(
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

        await response.json();
      } catch (error) {
        console.error('Error updating value:', error);
        return null;
      }
    }
  } else if (
    tableName !== 'users' &&
    columnNameP !== 'MainPc' &&
    columnNameP !== 'LockToBranchId'
  ) {
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
        console.log(
          `-----------------------------------------------------------------------------HI ${allRows[0].id}`
        );

        //If there is a row i want you to delete that edit row and add a delete row
        if (allRows.length > 0) {
          console.log(
            `WHERE rowId = \'${RowIdP}\' AND type = 'edit' ------------------------------------------------------------------------------------------------------- `
          );

          const response = await fetch(
            `${baseUrl}/${'offline_changes'}/${allRows[0].id}`,
            {
              method: 'DELETE',
            }
          );
          const data = await response.text();
          console.log('Deleted: ', data);
        } else {
          const response = await fetch(`${baseUrl}/${'offline_changes'}`, {
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
          const data = await response.json();
          console.log(
            `Row with that id(${RowIdP}) with type(${typevalue}) was not found so it added`,
            data
          );
        }
      } else {
        const response = await fetch(`${baseUrl}/${'offline_changes'}`, {
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
        const data = await response.json();
        console.log(
          `Row with that id(${RowIdP}) with type(${typevalue}) was not found so it added`,
          data
        );
      }
    } else {
      if (columnValueP === RowWithTheSameThing[0].originalValue) {
        // Delete the offline changes row if the new value matches the original value
        const deleteResponse = await fetch(
          `${baseUrl}/${'offline_changes'}/${RowWithTheSameThing[0].id}`,
          {
            method: 'DELETE',
          }
        );
        const deleteData = await deleteResponse.text();
        console.log(`Deleted offline change row: ${deleteData}`);
      } else {
        // Update the existing offline change row
        const response = await fetch(
          `${baseUrl}/${'offline_changes'}/${RowWithTheSameThing[0].id}/newValue`,
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
        const data = await response.json();
        console.log(
          `Row with that id(${RowIdP}) with type(${typevalue}) was successfully found so it edited it with`,
          data
        );
      }
    }
    
    setChangeMade((prevValue) => prevValue + 1);
  }
};

export const getValues = async (tableName) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching values:', error);
    return [];
  }
};

export const getValueById = async (tableName, id) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}/${id}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching value by ID:', error);
    return null;
  }
};
export const addValue = async (tableName, value, setChangeMade) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    const data = await response.json();
    await addRowToOfflineChanges(
      tableName,
      value.id,
      'not_needed',
      'not_needed',
      'add',
      value,
      setChangeMade
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

    const response = await fetch(
      `${baseUrl}/${tableName}/${id}/${columnName}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [columnName]: columnValue }),
      }
    );

    const data = await response.json();

    await addRowToOfflineChanges(
      tableName,
      id,
      columnName,
      columnValue,
      'edit',
      'not_needed',
      setChangeMade,
      originalValue
    );
  } catch (error) {
    console.error('Error updating value:', error);
    return null;
  }
};
export const deleteValue = async (tableName, id, setChangeMade) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}/${id}`, {
      method: 'DELETE',
    });
    const data = await response.text();
    await addRowToOfflineChanges(
      tableName,
      id,
      'not_needed',
      'not_needed',
      'delete',
      'not_needed',
      setChangeMade
    );
    return data;
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
  }
};

export const deleteValueALL = async () => {
  try {
    const response = await fetch(`${baseUrl}/delete-all-data`, {
      method: 'DELETE',
    });
    const data = await response.text();

    return data;
  } catch (error) {
    console.error('Error deleting all data:', error);
    throw error; // Rethrow the error to handle it in the caller function
  }
};

export const AddRoomImageToFiles = async (files, FolderText) => {
  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const base64Image = await fileToBase64(file);
      const FileId = uuidv4();
      const response = await fetch(`${baseUrl}/upload-room-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Image,
          fileName: file.name,
          FolderText,
          FileId,
        }),
      });
      return response.json();
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading room images:', error);
    return null;
  }
};
export const getRoomImages = async (roomId) => {
  try {
    const response = await fetch(`${baseUrl}/room-images/${roomId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return []; // Return an empty array in case of any error
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
export const deleteRoomImage = async (roomId, fullPath) => {
  const fileName = fullPath.split('\\').pop(); // Use backslash for Windows paths
  try {
    const response = await fetch(
      `${baseUrl}/room-image/${roomId}/${encodeURIComponent(fileName)}`,
      {
        method: 'DELETE',
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting room image:', error);
    return null;
  }
};
export const deleteFolderImages = async (folderName) => {
  try {
    const response = await fetch(
      `${baseUrl}/delete-folder-images/${encodeURIComponent(folderName)}`,
      {
        method: 'DELETE',
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting folder images:', error);
    return null;
  }
};
export const renameFolder = async (oldName, newName) => {
  try {
    const response = await fetch(`${baseUrl}/rename-folder`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ oldName, newName }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error renaming folder:', error);
    return null;
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
      const response = await fetch(`${baseUrl}/upload-room-document`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Document,
          fileName: file.name,
          roomId,
          tenantName,
          tenantId,
          AddedTimeText,
        }),
      });
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
    const response = await fetch(`${baseUrl}/room-documents/${roomId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    return [];
  }
};
export const deleteRoomDocument = async (roomId, filePath) => {
  try {
    const fileName = filePath.split('\\').pop();
    const response = await fetch(
      `${baseUrl}/room-document/${roomId}/${encodeURIComponent(fileName)}`,
      {
        method: 'DELETE',
      }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting room document:', error);
    return null;
  }
};
// Client-side API function
export const uploadTenantDocument = async (file, roomId) => {
  try {
    const base64Document = await fileToBase64(file);
    const response = await fetch(
      `${baseUrl}/room-document/upload-tenant-document`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Document,
          fileName: file.name,
          roomId,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload tenant document');
    }

    return response.json();
  } catch (error) {
    console.error('Error uploading tenant document:', error);
    throw error;
  }
};

export const deleteTenantDocument = async (fileName) => {
  try {
    const response = await fetch(
      `${baseUrl}/room-document/delete-tenant-document/${encodeURIComponent(
        fileName
      )}`,
      {
        method: 'DELETE',
      }
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
      const response = await fetch(`${baseUrl}/upload-tenant-documentV2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Document,
          fileName: file.name,
          roomId,
          tenantName,
          tenantId,
          AddedTimeText,
        }),
      });
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
    const response = await fetch(`${baseUrl}/delete-tenant-document-folder`, {
      method: 'DELETE',
    });
    return response.json();
  } catch (error) {
    console.error('Error deleting tenant document folder:', error);
    return null;
  }
};
export const deleteAllFromTable = async (tableName) => {
  try {
    const response = await fetch(`${baseUrl}/deleteAll/${tableName}`, {
      method: 'DELETE',
    });
    const data = await response.text();
    console.log(data);
    return data;
  } catch (error) {
    console.error(`Error deleting all values from ${tableName}:`, error);
    return null;
  }
};
