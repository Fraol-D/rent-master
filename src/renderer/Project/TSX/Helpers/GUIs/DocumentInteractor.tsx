import React, { useState, useEffect } from 'react';
import '../../../CSS/DocumentInteractor.css';
import { v4 as uuidv4 } from 'uuid';

import {
  AddRoomDocuments,
  deleteRoomDocument,
  deleteTenantDocument,
  downloadDocument,
  getRoomDocuments,
  getTenantRoomDocuments,
  uploadTenantDocument,
} from 'Backend/localServerApis';
import { useConfirm } from 'renderer/components/useConfirm';
import { useAlert } from 'renderer/components/useAlert';

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
        const formattedDate = date
          .toLocaleDateString('en-US', options)
          .replace(/,/g, '');

        const roomDocs = await getTenantRoomDocuments(
          room.id,
          `${formattedName}, ${formattedDate}, ${tenant.id}`
        );
        console.log(roomDocs);
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
  const { showAlert } = useAlert(); 
  const handleOnAddDocument = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;

    input.onchange = async (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        try {
          const filteredFiles = Array.from(files).filter(file => file.size <= 5 * 1024 * 1024); // 5MB limit
         console.log(filteredFiles.length,files.length)
          if(filteredFiles.length === 0){
            showAlert('All files are above the 5MB limit.', 'error');
            return;
          } else if (filteredFiles.length < files.length) {
            showAlert('Some files exceeded the 5MB limit and were not uploaded.', 'error');
          }
          
          if (isAddRoomDocument) {
            const roomId = 'Add a tenant documents';
            const uploadPromises = filteredFiles.map((file) =>
              uploadTenantDocument(file, roomId)
            );
            const results = await Promise.all(uploadPromises);
            if (results.every((result) => result)) {
              showAlert('Documents uploaded successfully', 'success');
              console.log('Tenant documents uploaded successfully:', results);
              fetchRoomDocuments2();
            } else {
              console.error('Failed to upload some tenant documents');
              showAlert('Failed to upload some tenant documents. Please try again.', 'error');
            }
          } else {
            const roomId = room?.id || 'default-room-id';
            const tenantId = room?.tenantId || '';
            const tenant = TenantsList.find((t: tenant) => t.id === tenantId);
            const tenantName = tenant ? formatTenantName(tenant.name) : '';
            const AddedTimeReal = tenant
              ? new Date(tenant.startTime).toDateString()
              : '';

            if (!roomId || !tenantName || !tenantId) {
              console.error('Missing required room or tenant information');
              return;
            }

            const results = await AddRoomDocuments(
              filteredFiles,
              roomId,
              tenantName,
              tenantId,
              AddedTimeReal
            );

            if (results) {
              console.log('Documents uploaded successfully:', results);
              fetchRoomDocuments();
              showAlert('Documents uploaded successfully', 'success');
            } else {
              console.error('Failed to upload documents');
              showAlert('Failed to upload documents. Please try again.', 'error');
            }
          }
        } catch (error) {
          console.error('Error uploading files:', error);
        }
      }
    };

    input.click();
  };
  const { confirm } = useConfirm();
  const handleDeleteDocument = async () => {
    const choice = await confirm('Are you sure you want to delete this document?', {
      type: 'danger',
      title: 'Delete Document',
      confirmText: 'Delete',
      cancelText: 'Cancel',
    });
    if(choice)
    if (selectedDocument) {
      const fileName = selectedDocument.split('/').pop();

      if (isAddRoomDocument) {
        const fileName2 = selectedDocument.split('\\').pop();
        const result = await deleteTenantDocument(fileName2);
        if (
          result &&
          result.message === 'Tenant document deleted successfully'
        ) {
          showAlert('Document deleted successfully', 'success');
          setDocuments((prevDocs) =>
            prevDocs.filter((doc) => doc !== selectedDocument)
          );
          setSelectedDocument(null);
        }
      } else {
        const roomId = room ? room.id : 'Add a tenant documents';
        const result = await deleteRoomDocument(roomId, fileName);
        if (result && result.message === 'Document deleted successfully') {
          showAlert('Document deleted successfully', 'success');
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

  // Update the handleOpenDocument function
const handleOpenDocument = async () => {
  if (selectedDocument) {
    if (window.electron) {
      // Electron version - open file
      window.electron.ipcRenderer.send('open-document', selectedDocument);
    } else {
       // Web version - download file
       try {
        const fileName = getFileName(selectedDocument);
        const roomId = room?.status === "Taken" ? room.id : 'Add a tenant documents';
        
        await downloadDocument(roomId, fileName);
      } catch (error) {
        console.error('Error downloading document:', error);
        alert('Failed to download document. Please try again.');
      }
    }
  }
};

  const getFileName = (filePath: string) => {
    if (!filePath) return '';
    
    // Handle both Windows and Unix-style paths
    const parts = filePath.split(/[/\\]/);
    const fileName = parts[parts.length - 1];
    
    // Skip the receipts folder
    if (fileName === 'receipts') return '';
    
    // Handle WIN_ prefix files
    const match = fileName.match(/^(WIN_\d{8}_\d{2}_\d{2}_\d{2})/);
    return match ? match[1] + fileName.substring(match[1].length) : fileName;
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
        style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 'var(--120px-V)', maxHeight: 'var(--183px-V)'}}
      >
        <div style={{height: '100%', minHeight: 'var(--120px-V)',display: 'flex', flexDirection: 'column', overflowX: 'auto'}}>
        {documents.length > 0 ? (
          documents
            .filter(doc => {
              const fileName = getFileName(doc);
              return fileName && fileName !== 'receipts'; // Filter out empty names and receipts folder
            })
            .map((doc) => (
              <div
                key={uuidv4()}
                className={`${
                  doc === selectedDocument
                    ? 'document-itemSelected'
                    : 'document-item'
                }`}
                onClick={() => setSelectedDocument(doc)}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap',display: 'flex', justifyContent: 'flex-start', alignItems: 'center', minWidth: 'fit-content'}}
              >
                {getFileName(doc)}
              </div>
            ))
        ) : (
          <div>No documents added</div>
        )}
        </div>
      </div>
      <div
        className="document-controls"
        style={{
          display: 'flex',
          justifyContent: 'space-around',
          padding: 'var(--10px-V)',
          borderRadius: 'var(--5px-V)',
          background: 'var(--Secondary-Color30)'
        }}
      >
        <button onClick={handleOnAddDocument}>Add Document</button>
        {selectedDocument && (
          <>
            <button onClick={handleOpenDocument} disabled={!selectedDocument}>
              {window.electron ? 'Open' : 'Download'}
            </button>
           {window.electron && <button onClick={handleShowInExplorer} disabled={!selectedDocument}>
              Open in Files
            </button>}
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
