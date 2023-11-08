import React from 'react';
import '../CSS/Room.css';
interface prop {
  roomType: RoomType;
  updateRoomProperty: (
    productId: string,
    propertyName: string,
    newValue: any
  ) => void;
  id: string;
}
const Room = ({ roomType, updateRoomProperty, id }: prop) => {
  const handleAddPerson = () => {};

  return (
    <>
      <div className="MainContainer">
        <div className="FirstLine">
          <p className="FloorText">Floor {roomType.floor}</p>
          <p className="RoomText">Room {roomType.roomIndex}</p>

          <div className="StatusContainer">
            <p className="StatusText">
              Current Status: <br />{' '}
              <strong style={{ fontSize: '15px', fontWeight: '600' }}>
                {roomType.status === 'Taken' ? (
                  <strong>Taken by {roomType.Person?.name}</strong>
                ) : (
                  <>
                    Empty <br></br>
                    <em
                      style={{
                        fontWeight: '400',
                        borderBottom: '1px solid black',
                      }}
                      onClick={() => {
                        /* TO DO */ handleAddPerson();
                      }}
                    >
                      Add person
                    </em>
                  </>
                )}
              </strong>
              {roomType.status === 'Taken' && (
                <div style={{ fontSize: '16px', marginTop: '5px' }}>
                  View Agreement
                </div>
              )}
            </p>
          </div>
        </div>
        <div className="SecondLine">
          <div className="PriceMainContainer">
            <div className="PriceContainer">
              <div>
                Price: <strong>{roomType.price}</strong>
              </div>{' '}
            </div>
            {/*<div className="ChangePriceButtonContianer">
              <button className="ChangePriceButton">a</button>
            </div> */}
          </div>
        </div>
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
