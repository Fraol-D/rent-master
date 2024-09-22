import React, { useState, useEffect } from 'react';
import '../../Css/NavBarCss.css';

import InsertImageIcon from '../../../assets/assets/Dark mode/Insert Image Pic.png';
import {
  DownloadUserFilesFromOnlineDatabase,
  syncOnlineToLocalWithBool,
  UploadUserFilesToTheOnlineDatabase,
} from 'Backend/OnlineServerApis';

interface Props {
  Image: string;
  ProfileState: boolean;
  ShopName: string;
  setSelectedPage: (newval: any) => void;
  SelectedPage: string;
  setThemeMode: (newval: any) => void;
  ThemeMode: string;
  ChangeTheme: () => void;
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

}: Props) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

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

  useEffect(()=>{if(uploadProgress >= 50) {
    setIsSyncing(true);
      setSyncProgress(uploadProgress);
  }
if(uploadProgress<=49 || uploadProgress>=101) {
      setIsSyncing(false);
      setSyncProgress(0);
    }
},[uploadProgress])
  return (
    <div className="navigation">
      <div className="LeftSide">
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
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
          <p className="Name-ofShop">Rent Master</p>
        </div>
      </div>
      <div className="TopPageNavigatorContainer">
        {['Dashboard', 'People', 'Rooms', 'Calendar', 'Database', 'Tools'].map(
          (page) => (
            <button
              key={page}
              className={
                SelectedPage === page
                  ? 'PageNavigatorButtonSelected'
                  : 'PageNavigatorButton'
              }
              onClick={() => setSelectedPage(page)}
            >
              {page}
            </button>
          )
        )}
      </div>

      <div className="RightSide">
        <div></div>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {' '}
          <button
            style={{ marginLeft: '10px', borderRadius: '10px 0px 0px 10px' }}
            onClick={handleUpload}
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
                style={{ width: '100%', marginTop: '10px' }}
              >
                <p>Sync</p>
              </button>
              <hr style={{ margin: '10px',width:"100%" }} />
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
                    UploadUserFilesToTheOnlineDatabase(
                      SelectedUserId,
                      setUploadAssetsProgress
                    );
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
                </button>
                <button
                  className="AdvancedUploadButtonsUploadButton"
                  onClick={() => {
                    DownloadUserFilesFromOnlineDatabase(
                      SelectedUserId,
                      setDownloadAssetsProgress
                    );
                  }}
                >
                  <span className="AdvancedUploadButtonsButtonText">
                    Download Room Assets
                  </span>
                  <span className="AdvancedUploadButtonsProgressText">
                    {DownloadAssetsProgress === 100 ||
                    DownloadAssetsProgress === 0
                      ? ''
                      : DownloadAssetsProgress + '%'}
                  </span>
                </button>
              </div>
            </div>
          </>
        ) : (
          <></>
        )}
        <button
          style={{ marginLeft: '10px', marginRight: '10px' }}
          onClick={() => {
            ChangeTheme();
            switch (ThemeMode) {
              case 'light':
                setThemeMode('dark');
                break;
              case 'dark':
                setThemeMode('grey');
                break;
              case 'grey':
                setThemeMode('light');
                break;
              default:
                break;
            }
          }}
        >
          To{' '}
          {ThemeMode === 'light'
            ? 'dark'
            : ThemeMode === 'dark'
            ? 'light'
            : 'grey'}
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

export default NavBar;
