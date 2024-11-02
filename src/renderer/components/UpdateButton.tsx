import React, { useEffect, useState, useRef } from 'react';

interface UpdateStatus {
  downloading: boolean;
  progress: number;
  totalSize: number;
  downloadedSize: number;
  ready: boolean;
  updateAvailable: boolean;
}

export const UpdateButton = () => {
  const [status, setStatus] = useState<UpdateStatus>({
    downloading: false,
    progress: 0,
    totalSize: 0,
    downloadedSize: 0,
    ready: false,
    updateAvailable: false
  });
  
  const listenersSet = useRef(false);

  useEffect(() => {
    if (!listenersSet.current) {
      // Check if update is available
      window.electron.ipcRenderer.on('update-available', () => {
        setStatus(prev => ({ ...prev, updateAvailable: true }));
      });

      window.electron.ipcRenderer.on('download-progress', (progressObj: any) => {
        setStatus(prev => ({
          ...prev,
          downloading: true,
          progress: progressObj.percent,
          totalSize: progressObj.total,
          downloadedSize: progressObj.transferred,
          updateAvailable: true
        }));
      });

      window.electron.ipcRenderer.on('update-downloaded', () => {
        setStatus(prev => ({
          ...prev,
          downloading: false,
          ready: true,
          progress: 100
        }));
      });

      listenersSet.current = true;
    }
  }, []);

  const handleUpdate = () => {
    if (status.ready) {
      window.electron.ipcRenderer.send('restart-app');
    }
  };

  // Don't render if no update is available
  if (!status.updateAvailable) {
    return null;
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="update-container">
      <div className="update-status">
        <div className="update-header">
          {status.downloading ? 'Downloading Update...' : 
           status.ready ? 'Update Ready to Install' : 
           'Checking for Updates...'}
        </div>
        
        {(status.downloading || status.ready) && (
          <>
            <div className="progress-bar-container">
              <div 
                className="progress-bar" 
                style={{ width: `${status.progress}%` }}
              />
            </div>
            
            <div className="progress-details">
              <span>{status.progress.toFixed(1)}%</span>
              <span>
                {formatBytes(status.downloadedSize)} / {formatBytes(status.totalSize)}
              </span>
            </div>
          </>
        )}
      </div>

      {status.ready && (
        <button 
          className="install-button"
          onClick={handleUpdate}
        >
          Install & Restart
        </button>
      )}
    </div>
  );
};