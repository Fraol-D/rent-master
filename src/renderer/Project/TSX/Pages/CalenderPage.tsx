import React, { useEffect } from 'react';
import Room from '../Helpers/Room';
import CalendarGUI from '../Helpers/GUIs/CalendarGUI';
export function CalendarPage({
  updateRoomProperty,
  sortedAndFilteredRooms,
  RoomList,
  filterOptions,
  removeFilterOption,
  tenantList,
}: any) {
  useEffect(() => {
    console.log(sortedAndFilteredRooms);
  }, []);
  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        
      </div>
      <div
        className="RoomContainerContainer"
        style={{
          width: '100%',
          height: 'calc(100% - 60px)',
          color: 'white',
          overflowY: "hidden"
        }}
      >
        <CalendarGUI
          rooms={sortedAndFilteredRooms.filter(
            (r: RoomType) => r.status === 'Taken'
          )}
          initialMonths={1}
          initialMonthsPast={1}
          tenantList={tenantList}
        ></CalendarGUI>
      </div>
    </>
  );
}
