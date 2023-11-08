import React, { useState, useEffect } from 'react';
import '../Css/NavBarCss.css';
import lockIcon from '../../assets/icons8-lock-100.png';
import EmploeeyIcon from '../../assets/Account Managment/Administrator Male.png';
import AdminIcon from '../../assets/Account Managment/Admin Settings Male.png';
import saveIcon from '../../assets/icons8-save-100(3).png';
import InsertImageIcon from '../../assets/Insert Image Pic.png';

interface Props {
  UpdateImageForLogo: (newLogo: string) => void;
  Image: string;
  ProfileState: boolean;
  SetEditButtonState: (State: boolean) => void;
  ShopName: string;
  setShopName: (newName: string) => void;
  /*setSohwPageContent: (bool: boolean) => void;
  AdmintrueNormalfalse: boolean;
  DayTrailstate: string;
  endDay: Date;
  RemaingDay: number;
  SAVEButtonFunction: () => void;
  LastSavedSconds: number;*/
}

const NavBar = ({
  UpdateImageForLogo,
  Image,
  ProfileState,
  ShopName,
  setShopName,
}: /*setSohwPageContent,
  AdmintrueNormalfalse,
  SAVEButtonFunction,
  LastSavedSconds,*/
//SetEditButtonState,
Props) => {
  const [currentTime, setCurrentTime] = useState(new Date());

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

  const handleImageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleImageInputChange called');
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          const imageURL = event.target.result;
          console.log(imageURL);
          UpdateImageForLogo(imageURL); // Call the onImageChange prop with the new image URL
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNameInputChange = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setShopName(e.target.value.toString());
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
  return (
    <div className="navigation">
      <div className="LeftSide">
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <img
            className={ProfileState ? 'LogoImageEdit' : 'LogoImage'}
            src={Image || InsertImageIcon}
            alt="Logo"
            onClick={handleImageClick}
          />

          {ProfileState ? (
            <input
              type="text"
              className="Name-ofShop-input"
              value={ShopName}
              onChange={handleNameInputChange}
            />
          ) : (
            <p className="Name-ofShop">{ShopName}</p>
          )}
        </div>
        {/*<button
          onClick={() => {
            SAVEButtonFunction();
          }}
          className="SaveButtonLong"
        >
          <img className={'SaveButtonicon'} src={saveIcon}></img>
          <p>
            Last saved <strong>{LastSavedSconds}</strong>
          </p>
        </button>
        window.electron.store.get('TrialEnded') === 'using' ? (
          <>
            <div className="TrialExpire">
              Trial Expires on <br />
              <strong>
                {formatDate(
                  new Date(window.electron.store.get('trialEndTime')),
                  'mm dd yy'
                )}
              </strong>
              ,{' '}
              <strong>
                {calculateDaysDifference(
                  window.electron.store.get('trialEndTime'),
                  Date.now()
                )}
              </strong>{' '}
              {calculateDaysDifference(
                window.electron.store.get('trialEndTime'),
                Date.now()
              ) === 1
                ? 'day'
                : 'days'}{' '}
              left
            </div>
          </>
        ) : (
          <></>
        )
      </div>

        <p
          onClick={() => {
            setSohwPageContent(false);
          }}
          className="AdminAccountIndicator"
        >
          {/*AdmintrueNormalfalse ? 'Admin account' : 'Normal account'
          {AdmintrueNormalfalse ? (
            <img src={AdminIcon} className="adminandemploeeyicons"></img>
          ) : (
            <img src={EmploeeyIcon} className="adminandemploeeyicons"></img>
          )}
        </p>

        <button
          onClick={() => {
            setSohwPageContent(false);
          }}
          className="lockContiner"
        >
          <img src={lockIcon} alt="" className="lockicon" />
        </button>*/}
      </div>
      <div className="RightSide">
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
          onChange={handleImageInputChange} // Remove the empty arrow function
        />
      </div>
    </div>
  );
};

export default NavBar;
