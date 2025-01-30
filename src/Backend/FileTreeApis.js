// File Tree API Functions
import { SendFileManagerApi, SendFileTreeManagerApi } from './localServerApis';
import { storageManager } from '../renderer/storeManager';
// Get directory contents

export const getFileTreeDirectory = async (path) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/directory/${encodeURIComponent(path)}`,
      'GET'
    );
    return response;
  } catch (error) {
    console.error('Error getting directory contents:', error);
    return [];
  }
};

// Get single file/folder info
export const getFileInfo = async (path) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/info/${encodeURIComponent(path)}`,
      'GET'
    );
    return response;
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
};

// Rename file/folder
export const renameFileTreeItem = async (oldPath, newName) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/rename`,
      'PUT',
      {
        'Content-Type': 'application/json',
      },
      {
        oldPath,
        newName,
      }
    );
    return response;
  } catch (error) {
    console.error('Error renaming item:', error);
    return null;
  }
};

// Delete file/folder
export const deleteFileTreeItem = async (path) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/delete/${encodeURIComponent(path)}`,
      'DELETE'
    );
    return response;
  } catch (error) {
    console.error('Error deleting item:', error);
    return null;
  }
};

// Create new folder
export const createFolder = async (parentPath, folderName) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/createFolder`,
      'POST',
      {
        'Content-Type': 'application/json',
      },
      {
        parentPath,
        folderName,
      }
    );
    return response;
  } catch (error) {
    console.error('Error creating folder:', error);
    return null;
  }
};

// Move file/folder
export const moveFileTreeItem = async (sourcePath, destinationPath) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/move`,
      'PUT',
      {
        'Content-Type': 'application/json',
      },
      {
        sourcePath,
        destinationPath,
      }
    );
    return response;
  } catch (error) {
    console.error('Error moving item:', error);
    return null;
  }
};

// Copy file/folder
export const copyFileTreeItem = async (sourcePath, destinationPath) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/copy`,
      'POST',
      {
        'Content-Type': 'application/json',
      },
      {
        sourcePath,
        destinationPath,
      }
    );
    return response;
  } catch (error) {
    console.error('Error copying item:', error);
    return null;
  }
};

// Upload files
// Upload files// Current implementation
// Upload files
// Upload files
export const uploadFiles = async (path, files) => {
  try {
    // Convert all files to base64 promises
    const filePromises = Array.from(files).map((file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          resolve({
            base64File: reader.result,
            fileName: file.name,
          });
        };
        reader.onerror = (error) => reject(error);
      });
    });

    // Wait for all files to be converted
    const base64Files = await Promise.all(filePromises);

    // Send the files to the server
    const response = await SendFileManagerApi(
      `/fileTree/upload`,
      'POST',
      {
        'Content-Type': 'application/json',
      },
      {
        files: base64Files,
        path: path,
      }
    );
    return response;
  } catch (error) {
    console.error('Error uploading files:', error);
    return null;
  }
};
// Download file
export const downloadFile = async (path) => {
  try {
    const branchId =
      storageManager.get('BranchName') +
      ' - ' +
      storageManager.get('SelectedBranchId');

    const response = await SendFileManagerApi(
      `/fileTree/download/${encodeURIComponent(path)}`,
      'GET',
      {
        'branch-id': branchId,
        responseType: 'blob',
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', path.split('/').pop());
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error downloading file:', error);
    return null;
  }
};

// Download folder as zip
export const downloadFolder = async (path) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/downloadFolder/${encodeURIComponent(path)}`,
      'GET'
    );
    return response;
  } catch (error) {
    console.error('Error downloading folder:', error);
    return null;
  }
};

// Search files
export const searchFiles = async (searchTerm) => {
  try {
    const response = await SendFileManagerApi(
      `/fileTree/search`,
      'POST',
      {
        'Content-Type': 'application/json',
      },
      {
        searchTerm,
      }
    );
    return response;
  } catch (error) {
    console.error('Error searching files:', error);
    return [];
  }
};
// Add this function for folder compression
export const compressAndDownloadFolder = async (path) => {
  try {
    const branchId =
      storageManager.get('BranchName') +
      ' - ' +
      storageManager.get('SelectedBranchId');

    const response = await SendFileManagerApi(
      `/fileTree/compressFolder/${encodeURIComponent(path)}`,
      'GET',
      {
        'branch-id': branchId,
        responseType: 'blob',
      }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${path.split('/').pop()}.zip`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error('Error compressing folder:', error);
    return null;
  }
};
