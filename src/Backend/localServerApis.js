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