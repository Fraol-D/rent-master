import React, { useState, useEffect } from 'react';
import '../../../CSS/DocumentInteractor.css';
const { v4: uuidv4 } = require('uuid');

import {
  AddRoomDocuments,
  deleteRoomDocument,
  deleteTenantDocument,
  getRoomDocuments,
  getTenantRoomDocuments,
  uploadTenantDocument,
} from 'Backend/localServerApis';

interface DocumentInteractorProps {
  room?: RoomType;
  isAddRoomDocument?: boolean;
  refreshState?: boolean;
  SetRefreshState?: (newval: boolean) => void;
  TenantsList: any;
  AddTenant?: boolean;
}

const formatTenantName = (name: string) => {
  const spaceMatch = name.match(/^(.*?)\s+(\d+)$/);
  const parenthesesMatch = name.match(/^(.*?)\((\d+)\)$/);
  
  if (spaceMatch) {
    return `${spaceMatch[1]}(${spaceMatch[2]})`;
  } else if (parenthesesMatch) {
    return name;
  }
  return name;
};

const DocumentInteractor: React.FC<DocumentInteractorProps> = ({
  room,
  isAddRoomDocument = false,
  refreshState,
  SetRefreshState,
  TenantsList,
  AddTenant,
}) => {
  const [documents, setDocuments] = useState<string[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  useEffect(() => {
    if (isAddRoomDocument && refreshState) {
      fetchRoomDocuments2();
      if (SetRefreshState) SetRefreshState(false);
    }
  }, [refreshState]);

  useEffect(() => {
    if (!isAddRoomDocument && room) {
      fetchRoomDocuments();
    }
  }, [room?.id, isAddRoomDocument]);


  useEffect(() => {
    if (isAddRoomDocument) {      
      fetchRoomDocuments2();
    }
  }, []);
  function convertUnixToDateString(unixTimestamp) {
    
    const date = new Date(unixTimestamp);
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };
    console.log(date.toLocaleDateString('en-US', options).replace(/,/g, ''));
    return date.toLocaleDateString('en-US', options).replace(/,/g, '');
  
  }

  const fetchRoomDocuments = async () => {
    if (room) {
      const tenant: tenant = TenantsList.find(
        (t: any) => t.id === room.tenantId
      );
      if (tenant) {
        const date = new Date(tenant.startTime);
        const options = {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: '2-digit',
        };
        const formattedName = formatTenantName(tenant.name);
        const formattedDate = date.toLocaleDateString('en-US', options).replace(/,/g, '');
        
        const roomDocs = await getTenantRoomDocuments(
          room.id,
          `${formattedName}, ${formattedDate}, ${tenant.id}`
        );
        
        if (roomDocs && roomDocs.documents) {
          setDocuments(roomDocs.documents);
        }
      }
    }
  };

  const fetchRoomDocuments2 = async () => {
    const roomDocs = await getRoomDocuments('Add a tenant documents');
    if (roomDocs && roomDocs.documents) {
      setDocuments(roomDocs.documents);
    } else {
      setDocuments([]);
    }
  };
  const handleOnAddDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          if (isAddRoomDocument) {
            const roomId = 'Add a tenant documents';
            const uploadPromises = Array.from(files).map((file) =>
              uploadTenantDocument(file, roomId)
            );
            const results = await Promise.all(uploadPromises);
            if (results.every((result) => result)) {
              console.log('Tenant documents uploaded successfully:', results);
              fetchRoomDocuments2();
            } else {
              console.error('Failed to upload some tenant documents');
            }
          } else {
            const roomId = room?.id || 'default-room-id';
            const tenantId = room?.tenantId || '';
            const tenant = TenantsList.find((t: tenant) => t.id === tenantId);
            const tenantName = tenant ? formatTenantName(tenant.name) : '';
            const AddedTimeReal = tenant ? new Date(tenant.startTime).toDateString() : '';

            if (!roomId || !tenantName || !tenantId) {
              console.error('Missing required room or tenant information');
              return;
            }

            const results = await AddRoomDocuments(
              files,
              roomId,
              tenantName,
              tenantId,
              AddedTimeReal
            );
            
            if (results) {
              console.log('Documents uploaded successfully:', results);
              fetchRoomDocuments();
            } else {
              console.error('Failed to upload documents');
            }
          }
        } catch (error) {
          console.error('Error uploading files:', error);
        }
      }
    };

    input.click();
  };

  const handleDeleteDocument = async () => {
    if (selectedDocument) {
      const fileName = selectedDocument.split('/').pop();

      if (isAddRoomDocument) {
        const fileName2 = selectedDocument.split('\\').pop();
        const result = await deleteTenantDocument(fileName2);
        if (
          result &&
          result.message === 'Tenant document deleted successfully'
        ) {
          setDocuments((prevDocs) =>
            prevDocs.filter((doc) => doc !== selectedDocument)
          );
          setSelectedDocument(null);
        }
      } else {
        const roomId = room ? room.id : 'Add a room documents';
        const result = await deleteRoomDocument(roomId, fileName);
        if (result && result.message === 'Document deleted successfully') {
          setDocuments((prevDocs) =>
            prevDocs.filter((doc) => doc !== selectedDocument)
          );
          setSelectedDocument(null);
        }
      }
    }
  };

  const handleShowInExplorer = () => {
    if (selectedDocument) {
      window.electron.ipcRenderer.send('show-item-in-folder', selectedDocument);
    }
  };

  const handleOpenDocument = () => {
    if (selectedDocument) {
      window.electron.ipcRenderer.send('open-document', selectedDocument);
    }
  };
  const getFileName = (filePath: string) => {
    const lastBackslashIndex = filePath.lastIndexOf('\\');
    if (lastBackslashIndex === -1) {
      return '';
    }
    const fullFileName = filePath.substring(lastBackslashIndex + 1);
    const match = fullFileName.match(/^(WIN_\d{8}_\d{2}_\d{2}_\d{2})/);
    return match
      ? match[1] + fullFileName.substring(match[1].length)
      : fullFileName;
  };
  return (
    <div
      className="document-interactor"
      style={
        AddTenant
          ? {
              width: '100%',
              height: 'var(--160px-V)',
              maxHeight: 'var(--230px-V)',
              display: 'flex',
              background: 'var(--Secondary-Color20)',
              flexDirection: 'column',
              borderRadius: 'var(--10px-V)',
              marginBottom: 'var(--20px-V)',
            }
          : {
              width: '100%',
              height: AddTenant ? 'var(--160px-V)' : '100%',
              maxHeight: AddTenant ? 'var(--230px-V)' : '',
              display: 'flex',
              flexDirection: 'column',
            }
      }
    >
      <div
        className="document-list"
        style={{ flex: 1, overflowY: 'auto', maxHeight: 'var(--183px-V)' }}
      >
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={uuidv4()}
              className={`${
                doc === selectedDocument
                  ? 'document-itemSelected'
                  : 'document-item`'
              }`}
              onClick={() => setSelectedDocument(doc)}
              style={{ cursor: 'pointer' }}
            >
              {getFileName(doc)}
            </div>
          ))
        ) : (
          <div>No documents added</div>
        )}
      </div>
      <div
        className="document-controls"
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: 'var(--10px-V)',
        }}
      >
        <button onClick={handleOnAddDocument}>Add Document</button>
        {selectedDocument && (
          <>
            <button onClick={handleOpenDocument} disabled={!selectedDocument}>
              Open
            </button>
            <button onClick={handleShowInExplorer} disabled={!selectedDocument}>
              Open in Files
            </button>
            <button onClick={handleDeleteDocument} disabled={!selectedDocument}>
              Delete
            </button>
          </>
        )}{' '}
      </div>
    </div>
  );
};

export default React.memo(DocumentInteractor);
