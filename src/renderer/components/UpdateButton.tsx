import { storageManager } from '../storeManager';
import React, { useEffect, useState, useRef } from 'react';

interface UpdateStatus {
  downloading: boolean;
  progress: number;
  totalSize: number;
  downloadedSize: number;
  ready: boolean;
  updateAvailable: boolean;
  newVersion: string;
  releaseNotes: string;
}

export const UpdateButton = () => {
  const [status, setStatus] = useState<UpdateStatus>(() => {
    // Initialize from electron-store
    const updateInfo = storageManager.get('updateInfo') || {};
    const updateProgress = storageManager.get('updateProgress') || {};
    const updateReady = storageManager.get('updateReady') || false;

    return {
      downloading: !!updateProgress.percent,
      progress: updateProgress.percent || 0,
      totalSize: updateProgress.total || 0,
      downloadedSize: updateProgress.transferred || 0,
      ready: updateReady,
      updateAvailable: updateInfo.available || false,
      newVersion: updateInfo.version || '',
      releaseNotes: updateInfo.releaseNotes || '',
    };
  });

  const listenersSet = useRef(false);

  useEffect(() => {
    if (!listenersSet.current) {
      window.electron.ipcRenderer.on('update-available', (info: any) => {
        setStatus((prev) => ({
          ...prev,
          updateAvailable: true,
          newVersion: info.version,
          releaseNotes: info.releaseNotes,
        }));
      });

      window.electron.ipcRenderer.on(
        'download-progress',
        (progressObj: any) => {
          setStatus((prev) => ({
            ...prev,
            downloading: true,
            progress: progressObj.percent,
            totalSize: progressObj.total,
            downloadedSize: progressObj.transferred,
            updateAvailable: true,
          }));
        }
      );

      window.electron.ipcRenderer.on('update-downloaded', () => {
        setStatus((prev) => ({
          ...prev,
          downloading: false,
          ready: true,
          progress: 100,
        }));
      });

      listenersSet.current = true;
    }

    // Cleanup function
    return () => {
      // We don't remove listeners, but we can clean up other resources if needed
    };
  }, []);

  const handleUpdate = () => {
    if (status.ready) {
      // Clear stored update info
      storageManager.set('updateInfo', null);
      storageManager.set('updateProgress', null);
      storageManager.set('updateReady', false);
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
          {status.downloading
            ? `Downloading v${status.newVersion}...`
            : status.ready
            ? `Ready to Install v${status.newVersion}`
            : 'Checking for Updates...'}
        </div>

        {status.releaseNotes && (
          <div className="release-notes">
            <h4>What's New in v{status.newVersion}:</h4>
            <div dangerouslySetInnerHTML={{ __html: status.releaseNotes }} />
          </div>
        )}

        {(status.downloading || status.ready) && (
          <>
            <div className="progress-bar-container">
              <div
                className="progress-bar"
                style={{ width: `${status.progress}%` }}
              />
            </div>

            <div className="progress-details">
              <span>{status.progress ? status.progress.toFixed(1) : 0}%</span>
              <span>
                {formatBytes(status.downloadedSize)} /{' '}
                {formatBytes(status.totalSize)}
              </span>
            </div>
          </>
        )}
      </div>

      {status.ready && (
        <button className="install-button" onClick={handleUpdate}>
          Install & Restart
        </button>
      )}
    </div>
  );
};
