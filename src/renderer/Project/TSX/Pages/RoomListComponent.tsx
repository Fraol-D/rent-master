import React from 'react';
import Room from '../Helpers/Room';
export function RoomListComponent({
  updateRoomProperty,
  sortedAndFilteredRooms,
  RoomList,
  filterOptions,
  removeFilterOption,
  TenantList,
  setTenantList,
  setAddARoomState,
  AddARoomState,
  tenantAPI,
  updateRoomPropertyWithOutRefresh,
  roomPaymentInfoApi,
  isUpdatingTenantList,
  setIsUpdatingTenantList,setSelectedEditRoomId
}: any) {
  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        <button
          onClick={() => {
            setAddARoomState(!AddARoomState);
          }}
        >
          Add a room
        </button>
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
        }}
      >
        <div
          style={{
            height: '25px',
          }}
        ></div>
        <div className="RoomContainer">
          {sortedAndFilteredRooms.map((room: any, index: any) => (
            <Room
            isUpdatingTenantList={isUpdatingTenantList}
            setIsUpdatingTenantList={setIsUpdatingTenantList}
            setSelectedEditRoomId={setSelectedEditRoomId}
              roomPaymentInfoApi={roomPaymentInfoApi}
              roomType={room}
              updateRoomPropertyWithOutRefresh={
                updateRoomPropertyWithOutRefresh
              }
              updateRoomProperty={updateRoomProperty}
              turnOffAddTenantStateForAll={() => {
                for (let i = 0; i < RoomList.length; i++) {
                  const element = RoomList[i];
                  updateRoomProperty(element.id, 'AddTenantState', 0);
                }

                for (let i = 0; i < RoomList.length; i++) {
                  const element = RoomList[i];
                  updateRoomProperty(element.id, 'ViewAgreement', 0);
                }
              }}
              turnOffViewStateForAll={() => {
                for (let i = 0; i < RoomList.length; i++) {
                  const element = RoomList[i];
                  updateRoomProperty(element.id, 'ViewAgreement', 0);
                }

                for (let i = 0; i < RoomList.length; i++) {
                  const element = RoomList[i];
                  updateRoomProperty(element.id, 'AddTenantState', 0);
                }
              }}
              key={room.id}
              setTenantList={setTenantList}
              TenantList={TenantList}
              tenantAPI={tenantAPI}
            />
          ))}
        </div>
      </div>
    </>
  );
}
