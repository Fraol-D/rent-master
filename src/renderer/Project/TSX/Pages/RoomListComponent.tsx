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
  brokerApi,
  setBrokerList,
  BrokerList,
  setIsUpdatingTenantList,
  setSelectedEditRoomId,
  pastTenantReviewApi,
  brokersRecommendationListApi,
  handleAddRoomButtonInitial,
  updateRoomPropertyLocal,
  agreementApi,
  ShowArchived,setChangeMade,SelectedUserId,SelectedAppUser,roomListContainerRef,SelectedBranchId
}: any) {
  // Sort the rooms based on floor and room number
  const sortedRooms = sortedAndFilteredRooms.sort((a, b) => {
    if (a.floor === b.floor) {
      return a.roomIndex - b.roomIndex;
    }
    return a.floor - b.floor;
  });

  return (
    <>
      <div className="SecondNavBarContainer" style={{ width: '100%' }}>
        <div className="FilterOptions">
          <strong style={{ marginRight: 'var(--10px-V)' }}>
            Showing {ShowArchived ? sortedRooms.filter((r:RoomType)=>r.Archived).length : sortedRooms.filter((r:RoomType)=>!r.Archived).length} {ShowArchived && 'archived'}{' '}
            room
            {ShowArchived ? sortedRooms.filter((r:RoomType)=>r.Archived).length != 1 && 's': sortedRooms.filter((r:RoomType)=>!r.Archived).length != 1 && 's'}
          </strong>
          {filterOptions.length > 0 && <strong>Filter options:</strong>}
          {filterOptions.map((option: any, index: any) => (
            <>
              <div
                style={{ marginRight: 'var(--10px-V)', marginLeft: 'var(--10px-V)' }}
                key={index}
              >
                <span>
                  {option.key}: <strong>{option.value}</strong>
                </span>
                <button
                  style={{
                    width: 'var(--20px-V)',
                    height: 'var(--20px-V)',
                    textAlign: 'center',
                    padding: 'var(--0px-V)',
                    marginLeft: 'var(--5px-V)',
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
          height: 'calc(100% - var(--60px-V))',
        }}ref={roomListContainerRef}
      >
        <div
          style={{
            height: 'var(--25px-V)',
          }}
        ></div>
        <div className="RoomContainer" >
          {sortedRooms.filter((r: RoomType) => r.Archived == ShowArchived).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--20px-V)',width:'100%', color:'var(--Text-Color-Grey)'}}>
              <p>There are no rooms. Add a room by clicking the "Add room" button on the left.</p>
            </div>
          ) : (
            sortedRooms
              .filter((r: RoomType) => r.Archived == ShowArchived)
              .map((room: any, index: any) => (
                <Room
              
                  agreementApi={agreementApi}
                  SelectedUserId={SelectedUserId}
                  setChangeMade={setChangeMade}
                  brokerApi={brokerApi}
                  brokersRecommendationListApi={brokersRecommendationListApi}
                  BrokerList={BrokerList}
                  updateRoomPropertyLocal={updateRoomPropertyLocal}
                  setBrokerList={setBrokerList}
                  isUpdatingTenantList={isUpdatingTenantList}
                  setIsUpdatingTenantList={setIsUpdatingTenantList}
                  setSelectedEditRoomId={setSelectedEditRoomId}
                  roomPaymentInfoApi={roomPaymentInfoApi}
                  roomType={room}
                  updateRoomPropertyWithOutRefresh={updateRoomPropertyWithOutRefresh}
                  updateRoomProperty={updateRoomProperty}
                  turnOffAddTenantStateForAll={() => {
                    for (let i = 0; i < RoomList.length; i++) {
                      const element = RoomList[i];
                      if (element.AddTenantState) {
                        updateRoomPropertyLocal(element.id, 'AddTenantState', 0);
                      }
                    }

                    for (let i = 0; i < RoomList.length; i++) {
                      const element = RoomList[i];
                      if (element.ViewAgreement) {
                        updateRoomPropertyLocal(element.id, 'ViewAgreement', 0);
                      }
                    }
                    for (let i = 0; i < RoomList.length; i++) {
                      const element = RoomList[i];
                      if (element.ShowUtilityLine) {
                        updateRoomPropertyLocal(element.id, 'ShowUtilityLine', 0);
                      }
                    }
                  }}
                  turnOffViewStateForAll={() => {
                    for (let i = 0; i < RoomList.length; i++) {
                      const element = RoomList[i];
                      if (element.AddTenantState) {
                        updateRoomPropertyLocal(element.id, 'AddTenantState', 0);
                      }
                    }

                    for (let i = 0; i < RoomList.length; i++) {
                      const element = RoomList[i];
                      if (element.ViewAgreement) {
                        updateRoomPropertyLocal(element.id, 'ViewAgreement', 0);
                      }
                    }
                    for (let i = 0; i < RoomList.length; i++) {
                      const element = RoomList[i];
                      if (element.ShowUtilityLine) {
                        updateRoomPropertyLocal(element.id, 'ShowUtilityLine', 0);
                      }
                    }
                  }}
                  key={room.id}
                  setTenantList={setTenantList}
                  TenantList={TenantList}
                  tenantAPI={tenantAPI}SelectedBranchId={SelectedBranchId}
                  pastTenantReviewApi={pastTenantReviewApi}SelectedAppUser={SelectedAppUser}
                />
              ))
          )}
        </div>
      </div>
    </>
  );
}
