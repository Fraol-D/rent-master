import React, { useState, useEffect, useMemo } from 'react';
import '../../Css/NavBarCss.css';

import InsertImageIcon from '../../../assets/assets/Dark mode/Insert Image Pic.png';
import {
  DownloadUserFilesFromOnlineDatabase,
  getValuesWithSql_Online,
  SetBackUpAsMain,
  syncOnlineToLocalWithBool,
  UploadUserFilesToTheOnlineDatabase,
} from 'Backend/OnlineServerApis';
import { getUserPrivileges } from 'renderer/App';
import { dropAllRowsInTable } from 'Backend/localServerApis';

interface Props {
  Image: string;
  ProfileState: boolean;
  ShopName: string;
  setSelectedPage: (newval: any) => void;
  SelectedPage: string;
  setThemeMode: (newval: any) => void;
  ThemeMode: string;
  ChangeTheme: (theme: 'light' | 'dark') => void;
  signOutUserAndRestart: () => void;
  UploadingLoadingEffect: boolean;
  uploadProgress: number;
  ChangeMade: number;
  handleUpload: () => void;
  SelectedUserId: string;
  isSyncing: boolean;
  setIsSyncing: (newval: boolean) => void;
  RefreshDataFromSqlite: () => void;
  setSyncProgress: (newval: number) => void;
  setAppUserManagerShow: (newval: boolean) => void;
  setAppUserManagerPromptPassword: (newval: boolean) => void;
  SelectedAppUser: appUser | null;
  setChangeMade: (newval: number) => void;
}

const NavBar = ({
  Image,
  ProfileState,
  ShopName,
  setSelectedPage,
  SelectedPage,
  setThemeMode,
  ThemeMode,
  ChangeTheme,
  signOutUserAndRestart,
  UploadingLoadingEffect,
  uploadProgress,
  ChangeMade,
  handleUpload,
  SelectedUserId,
  setIsSyncing,
  setSyncProgress,
  RefreshDataFromSqlite,
  setAppUserManagerShow,
  setAppUserManagerPromptPassword,
  SelectedAppUser,
  setChangeMade,
}: Props) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const currentHour = currentTime.getHours().toString().padStart(2, '0');
  const currentMinute = currentTime.getMinutes().toString().padStart(2, '0');
  //const currentSeconds = currentTime.getSeconds().toString().padStart(2, "0");
  const currentMonth = (currentTime.getMonth() + 1).toString().padStart(2, '0');
  const currentYear = currentTime.getFullYear().toString();

  const handleImageClick = () => {
    if (ProfileState) {
      document.getElementById('image-input')?.click();
    }
  };
  const privileges = useMemo(
    () => getUserPrivileges(SelectedAppUser),
    [SelectedAppUser]
  );
  function calculateDaysDifference(
    startDate: Date | number,
    endDate: Date | number
  ): number {
    const startTime =
      startDate instanceof Date ? startDate.getTime() : startDate;
    const endTime = endDate instanceof Date ? endDate.getTime() : endDate;

    const timeDifference = endTime - startTime;
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));

    return Math.abs(daysDifference);
  }

  function formatDate(date: Date, format: 'dd mm yy' | 'mm dd yy'): string {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString();

    if (format === 'dd mm yy') {
      return `${day} ${month} ${year}`;
    } else if (format === 'mm dd yy') {
      return `${month}/${day}/${year}`;
    } else {
      throw new Error('Invalid format. Use "dd mm yy" or "mm dd yy".');
    }
  }

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
  };

  const confirmSignOut = () => {
    signOutUserAndRestart();

    setShowSignOutConfirm(false);
  };

  const cancelSignOut = () => {
    setShowSignOutConfirm(false);
  };
  const [UploadAssetsProgress, setUploadAssetsProgress] = useState(0);
  const [DownloadAssetsProgress, setDownloadAssetsProgress] = useState(0);

  const [ShowAdvancedUpload, setShowAdvancedUpload] = useState(false);

  useEffect(() => {
    if (uploadProgress >= 50) {
      setIsSyncing(true);
      setSyncProgress(uploadProgress);
    }
    if (uploadProgress >= 99) {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [uploadProgress]);
  const [OnlineChanges, setOnlineChanges] = useState(0);
  useEffect(() => {
    const checkForChanges = async () => {
      const localChange = window.electron.store.get('changeAmount');
      const onlineUser = await getValuesWithSql_Online(
        'users',
        `WHERE id = '${SelectedUserId}'`
      );
      if (onlineUser) {
        const onlineChange = onlineUser[0].changeAmount;

        if (localChange !== onlineChange) {
          setOnlineChanges(Math.abs(onlineChange - localChange));
        } else {
          setOnlineChanges(0);
        }
      }
    };
    const intervalId = setInterval(() => {
      if (navigator.onLine) {
        fetch('https://www.google.com', { mode: 'no-cors' })
          .then(() => {
            checkForChanges();
          })
          .catch(() => {
            console.log('Internet connection is not available');
          });
      } else {
        setOnlineChanges(0);
      }
      console.log('This function runs every minute');
    }, 60000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, []);
  const handleResetOfflineChanges = async () => {
    if (navigator.onLine) {
      const confirmDelete = window.confirm(
        'Are you sure you want to reset offline changes?'
      );
      if (confirmDelete) {
        await dropAllRowsInTable('offline_changes');
        setChangeMade(0);
        await syncOnlineToLocalWithBool(
          SelectedUserId,
          setIsSyncing,
          setSyncProgress,
          RefreshDataFromSqlite
        );
      }
    }
  };

  return (
    <div className="navigation">
      <div className="LeftSide">
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            flexDirection: 'column',
          }}
        >
          {/* <img
            className={ProfileState ? 'LogoImageEdit' : 'LogoImage'}
            src={Image || InsertImageIcon}
            alt="Logo"
            onClick={handleImageClick}
          />

          {ProfileState ? (
            <input type="text" className="Name-ofShop-input" value={ShopName} />
          ) : (
            <p className="Name-ofShop">{ShopName}</p>
          )} */}{' '}
          <p className="Name-ofShop" style={{ height: '28px' }}>
            Rent <p style={{ color: 'var(--Primary-Color)' }}>Master</p>
            <button
              style={{ marginLeft: '10px' }}
              onClick={() => {
                if (navigator.onLine) {
                  setAppUserManagerShow(true);
                  setAppUserManagerPromptPassword(true);
                }
              }}
            >
              Switch User
            </button>
          </p>
          <p
            className="Name-ofShop"
            style={{ fontSize: '14px', color: 'grey', height: 'auto' }}
          >
            {window.electron.store.get('users')[0].email} --- {'  '}
            {window.electron.store.get('SelectedAppUserId') === 'admin' ? (
              <>Admin User</>
            ) : (
              window.electron.store
                .get('app_users')
                .find(
                  (appUser: appUser) =>
                    appUser.id ===
                    window.electron.store.get('SelectedAppUserId')
                )?.roleName
            )}
          </p>
        </div>
      </div>
      <div className="TopPageNavigatorContainer">
        {privileges.viewDashboard && (
          <button
            className={
              SelectedPage === 'Dashboard'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Dashboard')}
          >
            Dashboard
          </button>
        )}
        {privileges.viewPeoplesPage && (
          <button
            className={
              SelectedPage === 'People'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('People')}
          >
            People
          </button>
        )}
        {privileges.viewRoomsPage && (
          <button
            className={
              SelectedPage === 'Rooms'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Rooms')}
          >
            Rooms
          </button>
        )}
        {privileges.viewCalendar && (
          <button
            className={
              SelectedPage === 'Calendar'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Calendar')}
          >
            Calendar
          </button>
        )}
        {privileges.viewDatabase && (
          <button
            className={
              SelectedPage === 'Database'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Database')}
          >
            Database
          </button>
        )}
        {privileges.viewToolsPage && (
          <button
            className={
              SelectedPage === 'Tools'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Tools')}
          >
            Tools
          </button>
        )}
      </div>

      <div className="RightSide">
        <div></div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {' '}
          <button
            style={{ marginLeft: '10px', borderRadius: '10px 0px 0px 10px' }}
            onClick={() => {
              if (navigator.onLine) handleUpload();
            }}
            disabled={ChangeMade <= 0}
          >
            <p>
              {ChangeMade >= 1 ? (
                uploadProgress === 100 || uploadProgress === 0 ? (
                  <>
                    Upload <br />
                    <span style={{ fontSize: '10px' }}>
                      {ChangeMade} change
                    </span>
                  </>
                ) : uploadProgress >= 50 ? (
                  'Syncing'
                ) : (
                  'Uploading'
                )
              ) : (
                'No Change'
              )}
            </p>
            {UploadingLoadingEffect && (
              <p style={{ fontSize: '20px', marginLeft: '10px' }}>
                {uploadProgress.toString().slice(0, 5)}%
              </p>
            )}
          </button>
          <style>
            {`
                @keyframes blinkingBorder {
                  0% { border-color: var(--Accent-Color); }
                  50% { border-color: transparent; }
                  100% { border-color: var(--Accent-Color); }
                }
              `}
          </style>
          <button
            style={{
              borderRadius: ShowAdvancedUpload
                ? '0px 10px 0px 0px'
                : '0px 10px 10px 0px',
              height:
                ChangeMade >= 1
                  ? uploadProgress === 100 || uploadProgress === 0
                    ? '42px'
                    : uploadProgress >= 50
                    ? '42px'
                    : '42px'
                  : '26px',
              paddingTop: '7px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderTop:
                OnlineChanges > 0 ? '3px solid var(--Accent-Color)' : 'none',
              borderRight:
                OnlineChanges > 0 ? '3px solid var(--Accent-Color)' : 'none',
              borderBottom:
                OnlineChanges > 0 ? '3px solid var(--Accent-Color)' : 'none',
              borderLeft: 'none',
              animation:
                OnlineChanges > 0 ? 'blinkingBorder 1s infinite' : 'none',
            }}
            onClick={() => {
              setShowAdvancedUpload(!ShowAdvancedUpload);
            }}
          >
            {ShowAdvancedUpload ? <>▲</> : <>▼</>}
          </button>
        </div>
        {ShowAdvancedUpload ? (
          <>
            <div className="AdvancedUploadPanel">
              <h3
                style={{ margin: '0', display: 'flex', alignItems: 'center' }}
              >
                Complete Sync{' '}
              </h3>
              <button
                onClick={() => {
                  if (navigator.onLine) {
                    syncOnlineToLocalWithBool(
                      SelectedUserId,
                      setIsSyncing,
                      setSyncProgress,
                      RefreshDataFromSqlite
                    );
                  }
                }}
                style={{
                  width: '100%',
                  marginTop: '10px',
                  border:
                    OnlineChanges > 0 ? '3px solid var(--Accent-Color)' : '',
                  animation:
                    OnlineChanges > 0 ? 'blinkingBorder 1s infinite' : '',
                }}
              >
                <p>Sync {OnlineChanges} changes</p>
              </button>
              {ChangeMade >= 1 && (
                <button
                  onClick={() => {
                    handleResetOfflineChanges();
                }}
                style={{
                  width: '50%',
                  marginTop: '10px',
                  color: 'red',
                }}
              >
                <p>Reset Offline Changes</p>
              </button>)}
              <hr style={{ margin: '10px', width: '100%' }} />
              <h3
                style={{ margin: '0', display: 'flex', alignItems: 'center' }}
              >
                Assets{' '}
                <span style={{ fontSize: '12px' }}>
                  (Room Pictures,Documents)
                </span>
              </h3>
              <div className="AdvancedUploadButtons">
                <button
                  className="AdvancedUploadButtonsUploadButton"
                  onClick={() => {
                    if (navigator.onLine)
                      UploadUserFilesToTheOnlineDatabase(
                        SelectedUserId,
                        setUploadAssetsProgress
                      );
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <span className="AdvancedUploadButtonsButtonText">
                    Upload Room Assets
                  </span>
                  <span className="AdvancedUploadButtonsProgressText">
                    {UploadAssetsProgress === 100 || UploadAssetsProgress === 0
                      ? ''
                      : UploadAssetsProgress + '%'}
                  </span>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: `${UploadAssetsProgress}%`,
                      height: '3px',
                      backgroundColor: 'var(--Primary-Color)',
                      transition: 'width 0.3s ease-in-out',
                    }}
                  />
                </button>
                <button
                  className="AdvancedUploadButtonsUploadButton"
                  onClick={() => {
                    if (navigator.onLine)
                      DownloadUserFilesFromOnlineDatabase(
                        SelectedUserId,
                        setDownloadAssetsProgress
                      );
                  }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <span className="AdvancedUploadButtonsButtonText">
                    Download Room Assets
                  </span>
                  <span className="AdvancedUploadButtonsProgressText">
                    {DownloadAssetsProgress === 100 ||
                    DownloadAssetsProgress === 0
                      ? ''
                      : DownloadAssetsProgress.toFixed(2) + '%'}
                  </span>
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      width: `${DownloadAssetsProgress}%`,
                      height: '3px',
                      backgroundColor: 'var(--Primary-Color)',
                      transition: 'width 0.3s ease-in-out',
                    }}
                  />
                </button>
              </div>
              <hr style={{ margin: '10px', width: '100%' }} />
              <h3
                style={{ margin: '0', display: 'flex', alignItems: 'center' }}
              >
                Backup{' '}
              </h3>
              <div style={{ display: 'flex', width: '100%' }}>
                <button
                  onClick={() => {
                    window.electron.ipcRenderer.send('create-backup', false);
                  }}
                  style={{
                    width: '100%',
                    marginTop: '10px',
                    marginRight: '10px',
                  }}
                >
                  <p>Create Backup</p>
                </button>
                <button
                  onClick={() => {
                    window.electron.ipcRenderer.send('load-backup');
                  }}
                  style={{ width: '100%', marginTop: '10px' }}
                >
                  <p>Load Backup</p>
                </button>
              </div>{' '}
              {window.electron.store.get('IsOnBackup') ? (
                <>
                  {' '}
                  <p
                    style={{
                      margin: '0',
                      marginTop: '5px',
                      display: 'flex',
                      fontSize: '14px',
                      alignItems: 'center',
                      background: 'var(--Accent-Color)',
                      textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
                      textAlign: 'center',
                    }}
                  >
                    You have changed to an older backup, do you want to{' '}
                  </p>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <button
                      onClick={() => {
                        window.electron.ipcRenderer.invoke(
                          'load-specific-backup',
                          window.electron.store.get('MainBackupPath')
                        );
                      }}
                      style={{
                        width: '100%',
                        marginTop: '10px',
                        marginRight: '10px',
                      }}
                    >
                      <p>Revert to old</p>
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const result = await SetBackUpAsMain(SelectedUserId);
                          console.log('Data sync completed:', result);
                          window.electron.store.set('MainBackupPath', '');
                          window.electron.store.set('IsOnBackup', false);
                        } catch (error) {
                          console.error('Error during sync:', error);
                          // Handle sync error (e.g., show an error message)
                        }
                      }}
                      style={{ width: '100%', marginTop: '10px' }}
                    >
                      <p>Set as main</p>
                    </button>
                  </div>
                </>
              ) : (
                <></>
              )}
            </div>
          </>
        ) : (
          <></>
        )}
        <button
          style={{ marginLeft: '10px', marginRight: '10px' }}
          onClick={() => {
            ChangeTheme(ThemeMode === 'light' ? 'dark' : 'light');
          }}
        >
          To{' '}
          {ThemeMode === 'light' ? 'light' : ThemeMode === 'dark' ? 'dark' : ''}
        </button>

        <button onClick={handleSignOut}>Sign out</button>
        <div className="CurrentTimeContainer">
          <p className="CurrentTime">
            {currentHour}:{currentMinute}
          </p>
          <p className="CurrentTimeSmall">
            {currentMonth}/{new Date(currentTime).getDate()}/{currentYear}
          </p>
        </div>
        <input
          id="image-input"
          type="file"
          accept=".png,.jpg,.jpeg"
          style={{ display: 'none' }}
        />
      </div>
      {showSignOutConfirm && (
        <div className="signOutConfirmation">
          <p>Are you sure you want to sign out?</p>
          <button onClick={confirmSignOut}>Yes</button>
          <button onClick={cancelSignOut}>No</button>
        </div>
      )}
    </div>
  );
};

export default React.memo(NavBar);
