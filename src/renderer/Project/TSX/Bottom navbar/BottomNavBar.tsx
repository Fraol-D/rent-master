import React from 'react';

const BottomNavBar = ({ SelectedPage, setSelectedPage }: any) => {
  return (
    <div className="BottomNavBarMain">
      <div className="BottomNavBar">
        <button
          onClick={() => {
            setSelectedPage('Dashboard');
          }}
        >
          Dashboard
        </button>
        <button
          onClick={() => {
            setSelectedPage('People');
          }}
        >
          People
        </button>
        <button
          onClick={() => {
            setSelectedPage('Rooms');
          }}
        >
          Rooms
        </button>
        <button
          onClick={() => {
            setSelectedPage('Calander');
          }}
        >
          Calander
        </button>
        <button
          onClick={() => {
            setSelectedPage('Settings');
          }}
        >
          Settings
        </button>
      </div>
    </div>
  );
};

export default BottomNavBar;
