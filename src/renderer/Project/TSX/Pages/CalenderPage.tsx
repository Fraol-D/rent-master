import React, { useEffect } from 'react';
import Room from '../Helpers/Room';
import CalendarGUI from '../Helpers/CalendarGUI';
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
        }}
      >
        <CalendarGUI
          rooms={sortedAndFilteredRooms.filter(
            (r: RoomType) => r.status === 'Taken'
          )}
          initialMonths={2}
          tenantList={tenantList}
        ></CalendarGUI>
      </div>
    </>
  );
}
