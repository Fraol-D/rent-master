import React, { useState, useEffect } from 'react';
import '../../../CSS/DocumentInteractor.css';
const { v4: uuidv4 } = require('uuid');

import {
  AddRoomDocuments,
  deleteRoomDocument,
  getRoomDocuments,
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

const DocumentInteractor: React.FC<DocumentInteractorProps> = ({
  room,
  isAddRoomDocument = false,
  refreshState,
  SetRefreshState,
  TenantsList,AddTenant
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

  const fetchRoomDocuments = async () => {
    if (room) {
      const roomDocs = await getRoomDocuments(room.id);
      if (roomDocs && roomDocs.documents) {
        setDocuments(roomDocs.documents);
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
            // Use the new method for adding tenant documents
            const roomId = 'Add a tenant documents';
            const results = await uploadTenantDocument(files[0], roomId);
            if (results) {
              console.log('Tenant document uploaded successfully:', results);
              fetchRoomDocuments2();
            } else {
              console.error('Failed to upload tenant document');
            }
          } else {
            // Use the original method for adding room documents
            const roomId = room?.id || 'default-room-id';
            const tenantId = room.tenantId || '';
            const tenantName = TenantsList.find((t:tenant) => t.id === tenantId)?.name || '';
            const AddedTimeReal = new Date(TenantsList.find((t:tenant) => t.id === tenantId)?.startTime || 0).toDateString();
  
            if (!roomId || !tenantName || !tenantId) {
              console.error('Missing required room or tenant information');
              return;
            }
  
            const results = await AddRoomDocuments(files, roomId, tenantName, tenantId, AddedTimeReal);
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
      const roomId = room ? room.id : 'Add a room documents';
      const result = await deleteRoomDocument(roomId, fileName);
      if (result && result.message === 'Document deleted successfully') {
        setDocuments((prevDocs) => prevDocs.filter((doc) => doc !== selectedDocument));
        setSelectedDocument(null);
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
      return match ? match[1] + fullFileName.substring(match[1].length) : fullFileName;
    }
  return (
    <div className="document-interactor" style={{ width: '100%', height: AddTenant ? "160px":'100%',maxHeight: AddTenant ? "230px":"" ,display: 'flex', flexDirection: 'column' }}>
      <div className="document-list" style={{ flex: 1, overflowY: 'auto',maxHeight: "183px" }}>
        {documents.length > 0 ? (
          documents.map((doc) => (
            <div
              key={uuidv4()}
              className={`${doc === selectedDocument ? 'document-itemSelected' : 'document-item`'}`}
              onClick={() => setSelectedDocument(doc)}
              style={{cursor: 'pointer' }}
            >
              {getFileName(doc)}
            </div>
          ))
        ) : (
          <div>No documents added</div>
        )}
      </div>
      <div className="document-controls" style={{ display: 'flex', justifyContent: 'space-around', padding: '10px' }}>
        <button onClick={handleOnAddDocument}>Add Document</button>
        <button onClick={handleOpenDocument} disabled={!selectedDocument}>Open</button>
        <button onClick={handleShowInExplorer} disabled={!selectedDocument}>Open in Files</button>
        <button onClick={handleDeleteDocument} disabled={!selectedDocument}>Delete</button>
      </div>
    </div>
  );
};

export default DocumentInteractor;
