import React from 'react';
import Room from './Room';
import '../CSS/RoomArea.css';

interface prop {
  RoomList: RoomType[];
}
const RoomArea = ({ RoomList }: prop) => {
  return (
    <>
      <div className="RoomContainer">
        {RoomList.map((room, index) => (
          <Room roomType={room}></Room>
        ))}
      </div>
    </>
  );
};

export default RoomArea;
