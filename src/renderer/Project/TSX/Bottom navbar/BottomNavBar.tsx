import React, { useState } from 'react';
import DashboardDarkIcon from '../../../assets/assets/Dark mode/Dashboard.png';
import PeoplesDarkIcon from '../../../assets/assets/Dark mode/Peoples.png';
import SettingsDarkIcon from '../../../assets/assets/Dark mode/SettingsIcon.png';
import notificationIcon from '../../../assets/assets/Dark mode/Notification.png';
import NotificationPanel from './NotificationPanel';
const BottomNavBar = ({ SelectedPage, setSelectedPage }: any) => {
  const [NotificationOnState, setNotificationOnState] = useState(false);
  return (
    <>
      <div className="BottomNavBarMain">
        {NotificationOnState && <NotificationPanel />}
        <div className="BottomNavBar">
          <button
            onClick={() => {
              setSelectedPage('Dashboard');
            }}
            style={{ padding: 'var(--1px-V)' }}
          >
            <img src={DashboardDarkIcon} style={{ width: 'var(--35px-V)' }} alt="" />
          </button>
          <button
            onClick={() => {
              setSelectedPage('People');
            }}
            style={{ padding: 'var(--1px-V)' }}
          >
            <img src={PeoplesDarkIcon} style={{ width: 'var(--35px-V)' }} alt="" />
          </button>
          <button
            style={{ padding: 'var(--1px-V)' }}
            onClick={() => {
              setSelectedPage('Rooms');
            }}
          >
            Rooms
          </button>
          <button
            style={{ padding: 'var(--1px-V)' }}
            onClick={() => {
              setSelectedPage('Calendar');
            }}
          >
            Calendar
          </button>
          <button
            style={{ padding: 'var(--1px-V)' }}
            onClick={() => {
              setSelectedPage('Settings');
            }}
          >
            <img src={SettingsDarkIcon} style={{ width: 'var(--35px-V)' }} alt="" />
          </button>
        </div>
        <button
          className="NotificationButton"
          onClick={() => {
            setNotificationOnState(!NotificationOnState);
          }}
        >
          {' '}
          <img src={notificationIcon} style={{ width: 'var(--25px-V)' }} alt="" />
        </button>
      </div>
    </>
  );
};

export default React.memo(BottomNavBar);
