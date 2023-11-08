import React, { useState } from 'react';
import Room from './Room';
import '../CSS/RoomArea.css';

interface RoomAreaProps {
  RoomList: RoomType[];
  setRoomList: (newRoomList: RoomType[]) => void;
}

const RoomArea = ({ RoomList, setRoomList }: RoomAreaProps) => {
  const [floorFilter, setFloorFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [sortType, setSortType] = useState<string>('name'); // Default sorting by name
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const updateRoomProperty = (roomId: string, propertyName: string, newValue: any) => {
    setRoomList((prevRoomList: RoomType[]) => {
      const updatedRoomList = prevRoomList.map((room: RoomType) => {
        if (room.id === roomId) {
          return {
            ...room,
            [propertyName]: newValue,
          };
        }
        return room;
      });
      return updatedRoomList;
    });
  };

  const filterAndSortRooms = () => {
    let filteredRooms = RoomList;
    if (floorFilter) {
      filteredRooms = filteredRooms.filter((room) => room.floor.toString() === floorFilter);
    }
    if (roomFilter) {
      filteredRooms = filteredRooms.filter((room) => room.roomIndex.toString() === roomFilter);
    }

    return filteredRooms.sort((a, b) => {
      // Define a sorting function based on the selected sortType and sortDirection
      const comparison = sortDirection === 'asc' ? -1 : 1;
      switch (sortType) {
        case 'name':
          return comparison * (a.Person?.name || '').localeCompare(b.Person?.name || '');
        case 'price':
          return comparison * (a.price - b.price);
        case 'floor':
          return comparison * (a.floor - b.floor);
        case 'room':
          return comparison * (a.roomIndex - b.roomIndex);
        default:
          return 0;
      }
    });
  };

  const sortedAndFilteredRooms = filterAndSortRooms();

  return (
    <>
      <div className="MAINCONTAINER">
        <div className="SideBarContainer"></div>
        <div className="SecondNavBarContainer" style={{ width: 'calc(70% - 315px)' }}>
          <div className="SearchBarContainer">
            Floor:
            <input
              type="number"
              className="FloorSearchBar"
              value={floorFilter}
              onChange={(e) => setFloorFilter(e.target.value)}
            />
            Room:
            <input
              type="number"
              className="RoomSearchBar"
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
            />
            <select value={sortType} onChange={(e) => setSortType(e.target.value)} className="sort-drop">
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="floor">Sort by Floor</option>
              <option value="room">Sort by Room</option>
            </select>
          </div>
        </div>
        <div className="RoomContainerContainer" style={{ width: 'calc(100% - 315px)' }}>
          <div style={{ height: '50px' }}></div>
          <div className="RoomContainer">
            {sortedAndFilteredRooms.map((room, index) => (
              <Room roomType={room} updateRoomProperty={updateRoomProperty} id={room.id} key={room.id} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomArea;
