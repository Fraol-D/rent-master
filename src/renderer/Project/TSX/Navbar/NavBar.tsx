import React, { useState, useEffect } from 'react';
import '../../Css/NavBarCss.css';

import InsertImageIcon from '../../../assets/assets/Dark mode/Insert Image Pic.png';

interface Props {
  Image: string;
  ProfileState: boolean;
  ShopName: string;
  setSelectedPage:(newval:any)=>void;
  SelectedPage: string;
  setThemeMode: (newval: any) => void;
  ThemeMode: string;
  ChangeTheme: () => void;
}

const NavBar = ({
  Image,
  ProfileState,
  ShopName,
  setSelectedPage,
  SelectedPage,setThemeMode,ThemeMode,ChangeTheme
}: Props) => {
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
          )} */} <p className="Name-ofShop">Rent Master</p>
        </div>
      </div>
      <div className="TopPageNavigatorContainer">
        {['Dashboard', 'People', 'Rooms', 'Calendar', "Database"].map((page) => (
          <button
            key={page}
              className={SelectedPage === page? "PageNavigatorButtonSelected":"PageNavigatorButton"}
              
            onClick={() => setSelectedPage(page)}
          >
            {page}
          </button>
        ))}
      </div>

      <div className="RightSide">
        <button onClick={()=>{ChangeTheme();setThemeMode(ThemeMode === "light" ? "dark" : "light")}}>To {ThemeMode === "light" ? "dark" : "light"}</button><div className="CurrentTimeContainer">
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
    </div>
  );
};

export default NavBar;
