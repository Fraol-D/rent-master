import React from 'react';
import '../CSS/Room.css';
interface prop {
  roomType: RoomType;
}
const Room = ({ roomType }: prop) => {
  return (
    <>
      <div className="MainContainer">
        <div className="FirstLine">
          <p className="FloorText">Floor {roomType.floor}</p>
          <p className="RoomText">Room {roomType.roomIndex}</p>

          <div className="StatusContainer">
            <p className="StatusText">
              Current Status: <br />{' '}
              <strong style={{ fontSize: '15px', fontWeight:"600" }}>
                {roomType.status === 'Taken' ? (
                  <>Taken by {roomType.Person?.name}</>
                ) : (
                  <>"Empty"</>
                )}
              </strong>
              {roomType.status === 'Taken' && (
                <div style={{ fontSize: '16px',marginTop:"5px"  }}>View Agreement</div>
              )}
            </p>
          </div>
        </div>
        <div className="SecondLine">a</div>
        <div className="ThirdLine">
          <div className="RoomTypeContainer">
            Type of Room <br />
            <p className="RoomTypeContainertext">- 4 bedrooms</p>
            <p className="RoomTypeContainertext">- 2 bath rooms</p>
            <p className="RoomTypeContainertext">- 1 Kitchen rooms</p>
          </div>
          <div className="RoomTypeContainerBottom">
            <p
              className="RoomTypeContainertext"
              style={{ textAlign: 'center', paddingLeft: 0, fontSize: '17px' }}
            >
              50 square feet
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;
