import React, { useState } from 'react';
import DashboardDarkIcon from '../../../assets/assets/Dark mode/Dashboard.png';
import PeoplesDarkIcon from '../../../assets/assets/Dark mode/Peoples.png';
import SettingsDarkIcon from '../../../assets/assets/Dark mode/SettingsIcon.png';
import notificationIcon from '../../../assets/assets/Dark mode/Notification.png';
import NotificationPanel from './NotificationPanel';
const BottomNavBar = ({ SelectedPage, setSelectedPage }: any) => {
  return (
    <>
      <div className="BottomNavBarMain">
        <button
          onClick={() => {
            setSelectedPage('Dashboard');
          }}
          className={
            SelectedPage === 'Dashboard'
              ? 'PageNavigatorButtonSelected'
              : 'PageNavigatorButton'
          }
        >
          Dashboard
        </button>

        <button
          onClick={() => {
            setSelectedPage('Rooms');
          }}
          className={
            SelectedPage === 'Rooms'
              ? 'PageNavigatorButtonSelected'
              : 'PageNavigatorButton'
          }
        >
          Rooms
        </button>

        <button
         
          onClick={() => {
            setSelectedPage('Expense');
          }}
          className={
            SelectedPage === 'Expense'
              ? 'PageNavigatorButtonSelected'
              : 'PageNavigatorButton'
          }
        >
          Expenses
        </button>
        <button
         
          onClick={() => {
            setSelectedPage('Tools');
          }}
          className={
            SelectedPage === 'Tools'
              ? 'PageNavigatorButtonSelected'
              : 'PageNavigatorButton'
          }
        >
          Settings
        </button>
      </div>
    </>
  );
};

export default React.memo(BottomNavBar);
