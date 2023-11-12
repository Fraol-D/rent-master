import React, { useState } from 'react';
import '../CSS/Room.css';
interface prop {
  roomType: RoomType;
  

  turnOffAddPersonStateForAll: () => void;
  updateRoomProperty: (
    productId: string,
    propertyName: string,
    newValue: any
  ) => void;
}
const Room = ({
  roomType,
  updateRoomProperty,
  turnOffAddPersonStateForAll,
}: prop) => {
  const handleAddPerson = () => {
    turnOffAddPersonStateForAll();
    updateRoomProperty(roomType.id, 'AddPersonState', !roomType.AddPersonState);
  };

  const [name, setName] = useState('');
  const [tel1, setTel1] = useState('');
  const [tel2, setTel2] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState('Open-Ended');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [agreedPrice, setAgreedPrice] = useState('');
  function calculateDaysDifference(startDate: Date, endDate: Date): number {
    const timeDifference =
      new Date(endDate).getTime() - new Date(startDate).getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
  }
  const handleAddPersonButton = () => {
    if (name.length >= 3 && tel1.length >= 6 && startTime.length >= 1) {
      updateRoomProperty(roomType.id, 'status', 'Taken');
      updateRoomProperty(roomType.id, 'Person', {
        name: name,
        phoneNumber: tel1,
        phoneNumber2: tel2,
        email: email,
        SelectedAgreement: selectedAgreement,
        startTime: startTime,
        endTime: endTime,
        agreedPrice: agreedPrice,
      });

      updateRoomProperty(roomType.id, 'AddPersonState', false);
    }
  };
  return (
    <>
      <div
        className="MainContainer"
        style={{
          backgroundColor: roomType.AddPersonState
            ? '#dadada'
            : roomType.status === 'Empty'
            ? '#8f8f8f'
            : '#b3b3b3',
        }}
      >
        <div className="FirstLine">
          <p className="FloorText">Floor {roomType.floor}</p>
          <p className="RoomText">Room {roomType.roomIndex}</p>

          <div className="StatusContainer">
            <p className="StatusText">
              <div>
                Current Status:{' '}
                {roomType.status === 'Taken' ? (
                  <strong>Taken by </strong>
                ) : (
                  <>Empty</>
                )}
              </div>
              <strong style={{ fontSize: '15px', fontWeight: '600' }}>
                {roomType.status === 'Taken' ? (
                  <p
                    style={{
                      fontSize: '15px',
                      height: '20px',
                      margin: '0px',
                      marginTop: '5px',
                      fontWeight: '400',
                    }}
                  >
                    {roomType.Person?.name}
                  </p>
                ) : (
                  <>
                    {roomType.AddPersonState ? (
                      <>
                        <strong
                          style={{
                            fontWeight: '600',
                            fontSize: '17px',
                            borderBottom: '1px solid black',
                          }}
                          onClick={() => {
                            /* TO DO */ handleAddPerson();
                          }}
                        >
                          Add person
                        </strong>
                      </>
                    ) : (
                      <>
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
                  </>
                )}
              </strong>
              {roomType.status === 'Taken' && (
                <em
                  style={{
                    fontSize: '16px',
                    borderBottom: '1px solid black',
                    marginTop: '5px',
                    width: '120px',
                    marginLeft: '25px',
                  }}
                >
                  View Agreement
                </em>
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
              {roomType.squareMeters} square meters
            </p>
          </div>
        </div>

        <div className="AddPersonContainer">
          <div
            className="AddPersonContainerinner"
            style={{
              width: roomType.AddPersonState ? '280px' : '0px',
              height: roomType.AddPersonState ? '260px' : '0px',
              opacity: roomType.AddPersonState ? '1' : '0',
            }}
          >
            <div className="InnerAddpersonTop">
              <div className="AddPersonContainerinnerElement">
                Name:{' '}
                <input
                  className="AddPersonContainerinnerInput"
                  placeholder="Enter name of client"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="AddPersonContainerinnerElement">
                Tel 1:{' '}
                <input
                  className="AddPersonContainerinnerInput"
                  placeholder="Enter Tel of client"
                  value={tel1}
                  onChange={(e) => setTel1(e.target.value)}
                />
              </div>
              <div className="AddPersonContainerinnerElement">
                Tel 2:{' '}
                <input
                  className="AddPersonContainerinnerInput"
                  placeholder="Optional"
                  value={tel2}
                  onChange={(e) => setTel2(e.target.value)}
                />
              </div>
              <div className="AddPersonContainerinnerElement">
                Email:{' '}
                <input
                  className="AddPersonContainerinnerInput"
                  placeholder="Optional"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                Agreement type:{' '}
                <select
                  value={selectedAgreement}
                  onChange={(e) => setSelectedAgreement(e.target.value)}
                >
                  <option value="Open-Ended">Open-Ended</option>
                  <option value="Fixed-Term">Fixed-Term Lease</option>
                </select>
              </div>
              <div className="AddPersonContainerinnerElement" style={{}}>
                <div>
                  Start time:
                  <input
                    type="date"
                    style={{ fontWeight: '700' }}
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                {selectedAgreement === 'Fixed-Term' && (
                  <div>
                    End time:
                    <input
                      type="date"
                      value={endTime}
                      style={{ fontWeight: '700' }}
                      onChange={(e) => setEndTime(e.target.value)}
                    />
                    {calculateDaysDifference(
                      new Date(startTime),
                      new Date(endTime)
                    )}{' '}
                    Days
                  </div>
                )}
              </div>
              <div className="AddPersonContainerinnerElement">
                Agreed Price:{' '}
                <input
                  type="number"
                  className="AddPersonContainerinnerInput"
                  style={{ width: '100px' }}
                  placeholder="Enter price"
                  value={agreedPrice}
                  onChange={(e) => setAgreedPrice(e.target.value)}
                />
                <button
                  style={{
                    width: '40px',
                    height: '20px',
                    marginLeft: '10px',
                    background: 'white',
                  }}
                  onClick={() => {
                    setAgreedPrice(roomType.price + '');
                  }}
                >
                  Same
                </button>
              </div>
            </div>
            <div className="BottomAddPersonContainer">
              <button
                className="AddPersonButton"
                onClick={() => {
                  setName('');
                  setTel1('');
                  setTel2('');
                  setEmail('');
                  setSelectedAgreement('Open-Ended');
                  setStartTime('');
                  setEndTime('');
                  setAgreedPrice('');
                  updateRoomProperty(roomType.id, 'AddPersonState', false);
                }}
              >
                Cancel
              </button>
              <button
                className="AddPersonButton"
                onClick={() => {
                  handleAddPersonButton();
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;
