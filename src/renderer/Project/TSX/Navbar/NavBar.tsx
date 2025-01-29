import { storageManager } from '../../../storeManager';
import React, { useState, useEffect, useMemo } from 'react';

import { Input } from '../Helpers/CustomReactComponents';

import InsertImageIcon from '../../../assets/assets/Dark mode/Insert Image Pic.png';
import {
  checkFileSystemSync,
  DownloadUserFilesFromOnlineDatabase,
  getValuesWithSql_Online,
  SetBackUpAsMain,
  syncOnlineToLocalBranchWithBool,
  UploadUserFilesToTheOnlineDatabase,
} from '../../../../Backend/OnlineServerApis';
import { getUserPrivileges } from '../../../App';
import { dropAllRowsInTable } from '../../../../Backend/localServerApis';
import { useConfirm } from '../../../components/useConfirm';
import { useGlobal } from 'renderer/components/GlobalContext';
import { useAlert } from 'renderer/components/useAlert';

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
  setViewBranchManagementPage: (newval: boolean) => void;
  setViewBranchManagementPageNONAdm: (newval: boolean) => void;
  branchName: string;
  ShowAdvancedUpload: boolean;
  setShowAdvancedUpload: (newval: boolean) => void;
  UploadAssetsProgress: number;
  setUploadAssetsProgress: (newval: number) => void;
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
  setViewBranchManagementPage,
  setViewBranchManagementPageNONAdm,
  branchName,
  ShowAdvancedUpload,
  setShowAdvancedUpload,
  UploadAssetsProgress,
  setUploadAssetsProgress,
}: Props) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
const {showAlert} = useAlert()
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
  const [DownloadAssetsProgress, setDownloadAssetsProgress] = useState(0);
  const {isMobileState, langSwitch, ChangeLanguage, text} = useGlobal();
  const tabs = text.app.navbar.tabs;
  const upload = text.app.navbar.upload;
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
  const checkForChanges = async () => {
    try {
      const localChange = storageManager.get('changeAmount');
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
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    if (window.electron) {
      const intervalId = setInterval(() => {
        if (navigator.onLine) {
          checkForChanges();
        } else {
          setOnlineChanges(0);
        }
        console.log('This function runs every minute');
      }, 10000);

      // Clean up the interval when the component unmounts
      return () => clearInterval(intervalId);
    }
  }, []);
  const { confirm } = useConfirm();

  const handleResetOfflineChanges = async () => {
    if (navigator.onLine) {
      const confirmDelete = await confirm(
        'Are you sure you want to reset all your offline changes?',
        {
          title: 'Reset Changes',
          confirmText: 'Reset',
          cancelText: 'Keep',
          type: 'danger',
        }
      );
      if (confirmDelete) {
        await dropAllRowsInTable('offline_changes');
        setChangeMade(0);
        await syncOnlineToLocalBranchWithBool(
          SelectedUserId,
          storageManager.get('SelectedBranchId'),
          setIsSyncing,
          setSyncProgress,
          RefreshDataFromSqlite
        );
      }
    }
  };
  const handleSyncOnlineToLocal = async () => {
    const done = await syncOnlineToLocalBranchWithBool(
      SelectedUserId,
      storageManager.get('SelectedBranchId'),
      setIsSyncing,
      setSyncProgress,
      RefreshDataFromSqlite
    );
    if (done === 'Sync completed') {
      setOnlineChanges(0);
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
          <p className="Name-ofShop" style={{ height: 'var(--28px-V)' }}>
            Rent{' '}
            <span
              style={{
                color: 'var(--Primary-Color)',
                fontSize: 'var(--30px-V)',
              }}
            >
              Master
            </span>
            <span
              style={{
                color: '',
                fontSize: 'var(--16px-V)',
                marginLeft: 'var(--10px-V)',
              }}
            >
              {branchName}
            </span>
            <button
              style={{ marginLeft: 'var(--10px-V)' }}
              onClick={() => {
                if (navigator.onLine) {
                  setViewBranchManagementPage(true);

                  setViewBranchManagementPageNONAdm(false);
                }
              }}
            >
              Properties
            </button>
          </p>
          <p
            className="Name-ofShop"
            style={{ fontSize: 'var(--14px-V)', height: 'auto' }}
          >
            <span style={{ color: 'grey',marginRight: 'var(--5px-V)' }}>
              {storageManager.get('users')?.[0]?.email || ""} {' '}
            </span>
            {storageManager.get('SelectedAppUserId') === 'admin' ? (
              <>{window.location.href.includes('tryout')?"  " :" - "} Admin user</>
            ) : (
              storageManager
                ?.get('app_users')
                ?.find(
                  (appUser: appUser) =>
                    appUser.id === storageManager.get('SelectedAppUserId')
                )?.roleName||""
            )}{' '}
           {!window.location.href.includes('tryout')&& <span
              style={{
                marginLeft: 'var(--10px-V)',
                cursor: 'pointer',
                borderBottom: 'var(--1px-V) solid var(--Accent-Color)',
                color: 'var(--Accent-Color)',
              }}
              onClick={() => {
                if (navigator.onLine) {
                  if (storageManager.get('SelectedAppUserId') === 'admin') {
                    setAppUserManagerShow(true);
                    setAppUserManagerPromptPassword(false);
                    return;
                  }
                  setAppUserManagerShow(true);
                  setAppUserManagerPromptPassword(true);
                }
              }}
            >
              {storageManager.get('SelectedAppUserId') === 'admin'
                ? 'Go to App Users'
                : 'Switch User'}
            </span>}
          </p>
        </div>
      </div>
    {!isMobileState &&  <div className="TopPageNavigatorContainer">
        {privileges.viewDashboard && (
          <button
            className={
              SelectedPage === 'Dashboard'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Dashboard')}   id="top-nav-button-dashboard"
          >
            {tabs.dashboard}
          </button>
        )}

        {privileges.viewRoomsPage && (
          <button
            className={
              SelectedPage === 'Rooms'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Rooms')}   id="top-nav-button-rooms"
          >
            {tabs.rooms}
          </button>
        )}

        {privileges.editExpenses && (
          <button
            className={
              SelectedPage === 'Expense'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Expense')}   id="top-nav-button-expenses"
          >
            {tabs.expenses}
          </button>
        )}
        {privileges.viewToolsPage && (
          <button
            className={
              SelectedPage === 'Tools'
                ? 'PageNavigatorButtonSelected'
                : 'PageNavigatorButton'
            }
            onClick={() => setSelectedPage('Tools')}   id="top-nav-button-tools"
          >
            {tabs.tools}
          </button>
        )}
        <button onClick={() => langSwitch()}>{text.gen.changeLanguage}</button>
      </div>} 

      <div className="RightSide">
        <div></div>
        {window.electron && (
          <>
            {' '}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {' '}
              <button
                style={{
                  marginLeft: 'var(--10px-V)',
                  borderRadius:
                    'var(--10px-V) var(--0px-V) var(--0px-V) var(--10px-V)',
                }}
                onClick={() => {
                  if (navigator.onLine) handleUpload();
                }}
                disabled={ChangeMade <= 0}
                title="Upload Local Changes to Server"
              >
                <p>
                  {/*ChangeMade >= 1 ? (
                    uploadProgress === 100 || uploadProgress === 0 ? (
                      <>
                        Upload <br />
                        <span style={{ fontSize: 'var(--10px-V)' }}>
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
                  )*/upload.uploadButton(ChangeMade, uploadProgress)}
                </p>
                {UploadingLoadingEffect && (
                  <p
                    style={{
                      fontSize: 'var(--20px-V)',
                      marginLeft: 'var(--10px-V)',
                    }}
                  >
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
                    ? 'var(--0px-V) var(--10px-V) var(--0px-V) var(--0px-V)'
                    : 'var(--0px-V) var(--10px-V) var(--10px-V) var(--0px-V)',
                  height:
                    ChangeMade >= 1
                      ? uploadProgress === 100 || uploadProgress === 0
                        ? 'var(--48px-V)'
                        : uploadProgress >= 50
                        ? 'var(--48px-V)'
                        : 'var(--48px-V)'
                      : 'var(--28px-V)',
                  paddingTop: 'var(--7px-V)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderTop:
                    OnlineChanges > 0
                      ? 'var(--3px-V) solid var(--Accent-Color)'
                      : 'none',
                  borderRight:
                    OnlineChanges > 0
                      ? 'var(--3px-V) solid var(--Accent-Color)'
                      : 'none',
                  borderBottom:
                    OnlineChanges > 0
                      ? 'var(--3px-V) solid var(--Accent-Color)'
                      : 'none',
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
                  {ChangeMade >= 1 && (
                    <>
                      <h3
                        style={{
                          margin: '0',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        {upload.upload}{' '}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          width: '100%',
                        }}
                      >
                        <button
                          onClick={() => {
                            handleResetOfflineChanges();
                          }}
                          style={{
                            width: '100%',
                            marginTop: 'var(--10px-V)',
                            color: 'red',
                            fontWeight: 'bold',
                          }}
                          title="Discard All Local Changes"
                          aria-label="Discard All Local Changes"
                        >
                          <p>{upload.resetOfflineChanges}</p>
                        </button>
                      </div>
                      <hr style={{ margin: 'var(--10px-V)', width: '100%' }} />
                    </>
                  )}
                  <h3
                    style={{
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {upload.completeSync}{' '}
                  </h3>
                  <button
                    onClick={() => {
                      if (navigator.onLine) {
                        handleSyncOnlineToLocal();
                      } else {
                        showAlert(upload.alerts.offline)
                      }
                    }}
                    style={{
                      width: '100%',
                      marginTop: 'var(--10px-V)',
                      border:
                        OnlineChanges > 0
                          ? 'var(--3px-V) solid var(--Accent-Color)'
                          : '',
                      animation:
                        OnlineChanges > 0 ? 'blinkingBorder 1s infinite' : '',
                    }}
                    title="Download and Apply Server Updates"
                    aria-label="Download and Apply Server Updates"
                  >
                    <p>
                      {upload.syncIncomingChanges}
                    </p>
                  </button>
                  {ChangeMade >= 1 && (
                    <button
                      onClick={() => {
                        if (navigator.onLine) {
                          handleSyncOnlineToLocal();
                        }
                      }}
                      style={{
                        width: '100%',
                        marginTop: 'var(--10px-V)',
                      }}
                      title={upload.setAsMainTitle}
                    >
                      <p>{upload.setAsMain}</p>
                    </button>
                  )}
                  <hr style={{ margin: 'var(--10px-V)', width: '100%' }} />
                  <h3
                    style={{
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {upload.assets}{' '}
                    <span style={{ fontSize: 'var(--12px-V)' }}>
                      {upload.roomAssets}
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
                      title={upload.uploadRoomAssetsTitle}
                    >
                      <span className="AdvancedUploadButtonsButtonText">
                        {upload.uploadRoomAssets}
                      </span>
                      <span className="AdvancedUploadButtonsProgressText">
                        {UploadAssetsProgress === 100 ||
                        UploadAssetsProgress === 0
                          ? ''
                          : UploadAssetsProgress + '%'}
                      </span>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: `${UploadAssetsProgress}%`,
                          height: 'var(--3px-V)',
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
                      title={upload.downloadRoomAssetsTitle}
                    >
                      <span className="AdvancedUploadButtonsButtonText">
                        {upload.downloadRoomAssets}
                      </span>
                      <span className="AdvancedUploadButtonsProgressText">
                        {DownloadAssetsProgress === 100 ||
                        DownloadAssetsProgress === 0
                          ? ''
                          : DownloadAssetsProgress + '%'}
                      </span>
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          width: `${DownloadAssetsProgress}%`,
                          height: 'var(--3px-V)',
                          backgroundColor: 'var(--Primary-Color)',
                          transition: 'width 0.3s ease-in-out',
                        }}
                      />
                    </button>
                  </div>
                  <hr style={{ margin: 'var(--10px-V)', width: '100%' }} />
                  <h3
                    style={{
                      margin: '0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {upload.backup}{' '}
                  </h3>
                  <div style={{ display: 'flex', width: '100%' }}>
                    <button
                      onClick={() => {
                        window.electron.ipcRenderer.send(
                          'create-backup',
                          false
                        );
                      }}
                      style={{
                        width: '100%',
                        marginTop: 'var(--10px-V)',
                        marginRight: 'var(--10px-V)',
                      }}
                      title={upload.createBackupTitle}
                    >
                      <p>{upload.createBackup}</p>
                    </button>
                    <button
                      onClick={() => {
                        window.electron.ipcRenderer.send('load-backup');
                      }}
                      style={{ width: '100%', marginTop: 'var(--10px-V)' }}
                      title={upload.loadBackupTitle}
                    >
                      <p>{upload.loadBackup}</p>
                    </button>
                  </div>{' '}
                  {storageManager.get('IsOnBackup') && (
                    <>
                      <button
                        onClick={() => {
                          window.electron.ipcRenderer.invoke(
                            'load-specific-backup',
                            storageManager.get('MainBackupPath')
                          );
                        }}
                        style={{
                          width: '100%',
                          marginTop: 'var(--10px-V)',
                          marginRight: 'var(--10px-V)',
                        }}
                        title={upload.revertDataTitle}
                      >
                        <p>{upload.revertData}</p>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await SetBackUpAsMain(
                              SelectedUserId
                            );
                            console.log('Data sync completed:', result);
                            storageManager.set('MainBackupPath', '');
                            storageManager.set('IsOnBackup', false);
                          } catch (error) {
                            console.error('Error during sync:', error);
                            // Handle sync error (e.g., show an error message)
                          }
                        }}
                        style={{ width: '100%', marginTop: 'var(--10px-V)' }}
                        title={upload.setMainBackupTitle}
                      >
                        <p>{upload.setMainBackup}</p>
                      </button>
                    </>
                  )}
                </div>
              </>
            ) : (
              <></>
            )}
          </>
        )}
        {window.electron ? (
          <></>
        ) : (
          <>
            {' '}
           {!isMobileState && <button
              style={{
                marginLeft: 'var(--10px-V)',
              }}
              onClick={() => {
                RefreshDataFromSqlite();
              }}
            >
              {upload.refreshData}
              </button>}
          </>
        )}
        <button
          style={{ marginLeft: 'var(--10px-V)', marginRight: 'var(--10px-V)' }}
          onClick={() => {
            ChangeTheme(ThemeMode === 'light' ? 'dark' : 'light');
          }}
        >
          To{' '}
          {ThemeMode === 'light' ? 'light' : ThemeMode === 'dark' ? 'dark' : ''}
        </button>

        {!isMobileState && <><div className="CurrentTimeContainer">
          <p className="CurrentTime">
            {currentHour}:{currentMinute}
          </p>
          <p className="CurrentTimeSmall">
            {currentMonth}/{new Date(currentTime).getDate()}/{currentYear}
          </p>
        </div></>}
      </div>
      {showSignOutConfirm && (
        <div className="signOutConfirmation">
          <p>{upload.signOutConfirmation}</p>
          <button onClick={confirmSignOut}>{text.app.yes}</button>
          <button onClick={cancelSignOut}>{text.app.no}</button>
        </div>
      )}
    </div>
  );
};

export default React.memo(NavBar);
