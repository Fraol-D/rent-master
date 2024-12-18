import React, { useEffect } from 'react';
import Room from '../Helpers/Room';
import CalendarGUI from '../Helpers/GUIs/CalendarGUI';
export function CalendarPage({
  updateRoomProperty,
  sortedAndFilteredRooms,
  RoomList,
  filterOptions,
  removeFilterOption,
  SelectedBranchId
}: any) {
  useEffect(() => {
    console.log(sortedAndFilteredRooms);
  }, []);
  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}></div>
      <div
        className="RoomContainerContainer"
        style={{
          width: '100%',
          height: 'calc(100% - var(--60px-V))',

          overflowY: 'hidden',
        }}
      >
        <CalendarGUI
          rooms={sortedAndFilteredRooms.filter(
            (r: RoomType) => r.status === 'Taken'
          )}
          initialMonths={1}
          initialMonthsPast={1}
          SelectedBranchId={SelectedBranchId}
        ></CalendarGUI>
      </div>
    </>
  );
}
