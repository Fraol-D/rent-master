import React, { useEffect } from 'react';
import Room from '../Helpers/Room';
import Calendar from '../Helpers/Calendar';
export function CalanderPage({
    updateRoomProperty,
    sortedAndFilteredRooms,
    RoomList,
    filterOptions,
    removeFilterOption,
    tenantList
  }: any) {
    useEffect(()=> {console.log(sortedAndFilteredRooms)},[])
  return (
    <>
       <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        <div className="FilterOptions">
          <strong style={{ marginRight: '10px' }}>
            Showing {sortedAndFilteredRooms.length} room
            {sortedAndFilteredRooms.length != 1 && 's'}
          </strong>
          {filterOptions.length > 0 && <strong>Filter options:</strong>}
          {filterOptions.map((option: any, index: any) => (
            <>
              <div
                style={{ marginRight: '10px', marginLeft: '10px' }}
                key={index}
              >
                <span style={{ color: 'white' }}>
                  {option.key}: <strong>{option.value}</strong>
                </span>
                <button
                  style={{
                    width: '20px',
                    height: '20px',
                    textAlign: 'center',
                    padding: '0px',
                    marginLeft: '5px',
                  }}
                  onClick={() => removeFilterOption(index)}
                >
                  X
                </button>
              </div>
            </>
          ))}
        </div>
      </div>
      <div
        className="RoomContainerContainer"
        style={{
          width: '100%',
          height: 'calc(100% - 45px)',
          color: 'white',
        }}
      >
       <Calendar rooms={sortedAndFilteredRooms} monthsToShow={3} tenantList={tenantList}></Calendar>
      </div>
    </>
  );
}