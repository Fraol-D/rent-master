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
export const addValue = async (tableName, value) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    const data = await response.json();

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
export const updateValue = async (tableName, id, columnName, columnValue) => {
  try {
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
  } catch (error) {
    console.error('Error updating value:', error);
    return null;
  }
};
export const deleteValue = async (tableName, id) => {
  try {
    const response = await fetch(`${baseUrl}/${tableName}/${id}`, {
      method: 'DELETE',
    });
    const data = await response.text();

    return data;
  } catch (error) {
    console.error('Error deleting value:', error);
    return null;
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
    console.error('Error fetching room images:', error);
    return null;
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
    const response = await fetch(`${baseUrl}/room-image/${roomId}/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting room image:', error);
    return null;
  }
};
export const deleteFolderImages = async (folderName) => {
  try {
    const response = await fetch(`${baseUrl}/delete-folder-images/${encodeURIComponent(folderName)}`, {
      method: 'DELETE',
    });
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


export const AddRoomDocuments = async (files, roomId, tenantName, tenantId,AddedTimeText) => {
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
          AddedTimeText
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
    console.error('Error fetching room documents:', error);
    return null;
  }
};

export const deleteRoomDocument = async (roomId, filePath) => {
  try {
    const fileName = filePath.split('\\').pop();
    const response = await fetch(`${baseUrl}/room-document/${roomId}/${encodeURIComponent(fileName)}`, {
      method: 'DELETE',
    });
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
    const response = await fetch(`${baseUrl}/room-document/upload-tenant-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        base64Document,
        fileName: file.name,
        roomId,
      }),
    });

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

