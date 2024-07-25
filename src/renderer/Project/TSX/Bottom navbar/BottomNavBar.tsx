import React, { useState } from 'react';
import DashboardDarkIcon from "../../../assets/assets/Dark mode/Dashboard.png";
import PeoplesDarkIcon from "../../../assets/assets/Dark mode/Peoples.png";
import SettingsDarkIcon from "../../../assets/assets/Dark mode/SettingsIcon.png";
import notificationIcon from "../../../assets/assets/Dark mode/Notification.png"
import NotificationPanel from './NotificationPanel';
const BottomNavBar = ({ SelectedPage, setSelectedPage }: any) => {
  const [NotificationOnState, setNotificationOnState] = useState(false)
  return (
    <><div className="BottomNavBarMain">{NotificationOnState &&<NotificationPanel />}
      <div className="BottomNavBar">
        <button
          onClick={() => {
            setSelectedPage('Dashboard');
          } }
          style={{ padding: "1px" }}
        >
          <img src={DashboardDarkIcon} style={{ width: "35px" }} alt="" />
        </button>
        <button
          onClick={() => {
            setSelectedPage('People');
          } }
          style={{ padding: "1px" }}
        >
          <img src={PeoplesDarkIcon} style={{ width: "35px" }} alt="" />

        </button>
        <button
          style={{ padding: "1px" }}

          onClick={() => {
            setSelectedPage('Rooms');
          } }
        >
          Rooms
        </button>
        <button
          style={{ padding: "1px" }}

          onClick={() => {
            setSelectedPage('Calander');
          } }
        >
          Calander
        </button>
        <button
          style={{ padding: "1px" }}

          onClick={() => {
            setSelectedPage('Settings');
          } }
        >
          <img src={SettingsDarkIcon} style={{ width: "35px" }} alt="" />

        </button>
      </div>
      <button className="NotificationButton" onClick={()=>{setNotificationOnState(!NotificationOnState)}}>  <img src={notificationIcon} style={{ width: "25px" }} alt="" /></button>
    </div></>
  );
};

export default BottomNavBar;
