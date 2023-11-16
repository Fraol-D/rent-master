import React, { useState } from 'react';
import '../CSS/Room.css';
interface prop {
  roomType: RoomType;

  turnOffAddPersonStateForAll: () => void;
  turnOffViewStateForAll: () => void;
  updateRoomProperty: (
    productId: string,
    propertyName: string,
    newValue: any
  ) => void;
}
const PaymentCard = ({ payment, onPay }: any) => (
  <div className="PaymentCard">
    <p>{new Date(payment.Day).toLocaleDateString()}</p>
    {!payment.Paid && (
      <button className="PayButton" onClick={onPay}>
        Pay
      </button>
    )}
  </div>
);
const Room = ({
  roomType,
  updateRoomProperty,
  turnOffAddPersonStateForAll,
  turnOffViewStateForAll,
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
        agreedPrice: agreedPrice.length === 0 ? roomType.price : agreedPrice,
      });

      updateRoomProperty(roomType.id, 'AddPersonState', false);

      if (!roomType.AllRoomPayInfo) {
        roomType.AllRoomPayInfo = {
          RoomPayInfo: [],
        };
      }

      for (let i = 0; i < 100; i++) {
        const dayDifference = i * 30;
        const paymentDay = new Date(startTime);
        paymentDay.setDate(paymentDay.getDate() + dayDifference);

        roomType.AllRoomPayInfo.RoomPayInfo.push({
          Day: paymentDay.getTime(),
          Paid: false,
        });
      }

      console.log(roomType.AllRoomPayInfo.RoomPayInfo);
    }
  };
  const checkPaymentStatus = (allRoomPayInfo: AllRoomPayInfo): string => {
    const currentDate = new Date().getTime();

    const unpaidPayments = allRoomPayInfo.RoomPayInfo.filter(
      (payment) => !payment.Paid
    );

    if (unpaidPayments.length === 0) {
      return 'All payments have been made.';
    }

    const nearestPaymentDate = unpaidPayments.reduce((nearest, payment) => {
      return Math.abs(payment.Day - currentDate) <
        Math.abs(nearest.Day - currentDate)
        ? payment
        : nearest;
    });

    const daysUntilPayment = Math.ceil(
      (nearestPaymentDate.Day - currentDate) / (24 * 60 * 60 * 1000)
    );

    if (daysUntilPayment > 0) {
      return `Will pay in ${daysUntilPayment} days.`;
    } else {
      return `Payment day past by ${Math.abs(daysUntilPayment)} days.`;
    }
  };

  const pay = (payment: RoomPayInfo) => {
    // Perform the necessary logic to update the payment
    // You can use onUpdateRoomProperty to update the RoomPayInfo array
    // based on the logic you have in your application
    updateRoomProperty(roomType.id, 'AllRoomPayInfo', {
      ...roomType.AllRoomPayInfo,
      RoomPayInfo: roomType.AllRoomPayInfo.RoomPayInfo.map((p) =>
        p.Day === payment.Day ? { ...p, Paid: true } : p
      ),
    });
  };
  const paymentStatus = checkPaymentStatus(roomType.AllRoomPayInfo);
  return (
    <>
      <div
        className="MainContainer"
        style={{
          backgroundColor: roomType.AddPersonState
            ? 'rgb(46 44 44)'
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
              {roomType.status === 'Taken' ? (
                roomType.ViewAgreement ? (
                  <>
                    <strong
                      style={{
                        fontWeight: '600',
                        fontSize: '17px',
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '5px',
                      }}
                      onClick={() => {
                        turnOffViewStateForAll();
                        updateRoomProperty(
                          roomType.id,
                          'ViewAgreement',
                          !roomType.ViewAgreement
                        );
                      }}
                    >
                      <p
                        style={{
                          borderBottom: '1px solid black',
                          width: '140px',
                        }}
                      >
                        View Agreement
                      </p>
                    </strong>
                  </>
                ) : (
                  <>
                    <em
                      style={{
                        fontSize: '16px',
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '5px',

                        fontWeight: '400',
                      }}
                      onClick={() => {
                        turnOffViewStateForAll();
                        updateRoomProperty(
                          roomType.id,
                          'ViewAgreement',
                          !roomType.ViewAgreement
                        );
                      }}
                    >
                      <p
                        style={{
                          borderBottom: '1px solid black',
                          width: '120px',
                        }}
                      >
                        View Agreement
                      </p>
                    </em>
                  </>
                )
              ) : (
                <></>
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
          {roomType.status === 'Taken' && (
            <div className="PayAndDueShowerContainer">
              <p>{paymentStatus}</p>
              {/*<button className="PayButton" onClick={pay}>
                Pay
              </button> */}
              <div className="PaymentCardContianer">
                {roomType.AllRoomPayInfo.RoomPayInfo.slice(0, 8).map(
                  (payment) => (

                      <PaymentCard
                        key={payment.Day}
                        payment={payment}
                        onPay={() => pay(payment)}
                      />

                  )
                )}
              </div>
            </div>
          )}
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

              fontSize: '17px',
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
        <div className="AddPersonContainer" style={{ top: '205px' }}>
          <div
            className="AddPersonContainerinner"
            style={{
              width: roomType.ViewAgreement ? '280px' : '0px',
              height: roomType.ViewAgreement ? '260px' : '0px',
              opacity: roomType.ViewAgreement ? '1' : '0',
            }}
          >
            <div className="InnerAddpersonTop" style={{ width: '95%' }}>
              <div className="AddPersonContainerinnerElement">
                Name:{' '}
                <em style={{ fontWeight: '600' }}>{roomType.Person?.name}</em>
              </div>
              <div className="AddPersonContainerinnerElement">
                Tel 1:{' '}
                <em style={{ fontWeight: '600' }}>
                  {roomType.Person?.phoneNumber}
                </em>
              </div>
              <div className="AddPersonContainerinnerElement">
                Tel 2:{' '}
                <em style={{ fontWeight: '600' }}>
                  {roomType.Person?.phoneNumber2}
                </em>
              </div>
              <div className="AddPersonContainerinnerElement">
                {' '}
                Email:{' '}
                <em style={{ fontWeight: '600' }}>{roomType.Person?.email}</em>
              </div>
              <div className="AddPersonContainerinnerElement">
                Agreement type:{' '}
                <em style={{ fontWeight: '600' }}>
                  {roomType.Person?.SelectedAgreement}
                </em>
              </div>
              <div className="AddPersonContainerinnerElement" style={{}}>
                <div>
                  Start time:
                  <em style={{ fontWeight: '600' }}>
                    {roomType.Person?.startTime}
                  </em>
                </div>
              </div>
              {selectedAgreement === 'Fixed-Term' && (
                <div className="AddPersonContainerinnerElement">
                  End time :
                  <em style={{ fontWeight: '600' }}>
                    {roomType.Person?.endTime}
                  </em>{' '}
                  {calculateDaysDifference(
                    new Date(startTime),
                    new Date(endTime)
                  )}{' '}
                  Days
                </div>
              )}
              <div className="AddPersonContainerinnerElement">
                Agreed Price:{' '}
                <em style={{ fontWeight: '600' }}>
                  {roomType.Person?.agreedPrice}
                </em>
              </div>
            </div>
            <div className="BottomAddPersonContainer">
              <button
                className="AddPersonButton"
                onClick={() =>
                  updateRoomProperty(roomType.id, 'ViewAgreement', false)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;
