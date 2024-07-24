import React from 'react';
import DashboardDarkIcon from "../../../assets/assets/Dark mode/Dashboard.png";
import PeoplesDarkIcon from "../../../assets/assets/Dark mode/Peoples.png";
import SettingsDarkIcon from "../../../assets/assets/Dark mode/SettingsIcon.png";

const BottomNavBar = ({ SelectedPage, setSelectedPage }: any) => {
  return (
    <div className="BottomNavBarMain">
      <div className="BottomNavBar">
        <button
          onClick={() => {
            setSelectedPage('Dashboard');
          }}
          style={{padding:"1px"}}
        >
          <img src={DashboardDarkIcon} style={{width:"35px"}}alt="" />
        </button>
        <button
          onClick={() => {
            setSelectedPage('People');
          }}
        >
                    <img src={PeoplesDarkIcon}style={{width:"35px"}} alt="" />

        </button>
        <button
                   style={{padding:"1px"}}

          onClick={() => {
            setSelectedPage('Rooms');
          }}
        >
          Rooms
        </button>
        <button
                style={{padding:"1px"}}

          onClick={() => {
            setSelectedPage('Calander');
          }}
        >
          Calander
        </button>
        <button
                    style={{padding:"1px"}}

          onClick={() => {
            setSelectedPage('Settings');
          }}
        >
                 <img src={SettingsDarkIcon}style={{width:"35px"}} alt="" />

        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;
