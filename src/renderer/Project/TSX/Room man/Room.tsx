import React, { useState } from 'react';
import '../../CSS/Room.css';
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
  const [paymentCycle, setPaymentCycle] = useState('');
  const [customDays, setCustomDays] = useState('');
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
      return `Payment due in ${daysUntilPayment} days.`;
    } else {
      return `Payment day past by ${Math.abs(daysUntilPayment)} days.`;
    }
  };

  const paymentStatus = checkPaymentStatus(roomType.AllRoomPayInfo);

  const payments = roomType.AllRoomPayInfo.RoomPayInfo;
  const visiblePayments = payments.slice(-5).concat(payments.slice(0, 5));

  const pay = (payment: any) => {
    updateRoomProperty(roomType.id, 'AllRoomPayInfo', {
      ...roomType.AllRoomPayInfo,
      RoomPayInfo: roomType.AllRoomPayInfo.RoomPayInfo.map((p) =>
        p.Day === payment.Day ? { ...p, Paid: true } : p
      ),
    });
  };

  return (
    <>
      <div
        className="MainContainer"
        style={{
          backgroundColor: roomType.AddPersonState
            ? '#2C2C30'
            : roomType.status === 'Empty'
            ? '#2e2f30'
            : '#546C83',
          border: roomType.AddPersonState ? '1px solid #00e1f1' : '',
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
                            borderBottom: '1px solid white',
                          }}
                          onClick={() => {
                            /* TO DO */ handleAddPerson();
                          }}
                        >
                          Add tenant
                        </strong>
                      </>
                    ) : (
                      <>
                        <em
                          style={{
                            fontWeight: '400',
                            borderBottom: '1px solid white',
                          }}
                          onClick={() => {
                            /* TO DO */ handleAddPerson();
                          }}
                        >
                          Add tenant
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
                          borderBottom: '1px solid white',
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
                          borderBottom: '1px solid white',
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
            <div
              className="PayAndDueShowerContainer"
              style={{ border: '1px solid white' }}
            >
              <p>{paymentStatus}</p>
              <button
                className="Show-button-Pay"
                onClick={() => {
                  updateRoomProperty(
                    roomType.id,
                    'ShowPayTimeLine',
                    !roomType.ShowPayTimeLine
                  );
                }}
              >
                {roomType.ShowPayTimeLine ? 'Hide' : 'Show'}
              </button>
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

        <div className="PopOutContainer">
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
                  placeholder="Enter name of tenant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="AddPersonContainerinnerElement">
                Tel 1:{' '}
                <input
                  className="AddPersonContainerinnerInput"
                  placeholder="Enter Tel of tenant"
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
              <div className="AddPersonContainerinnerElement">
      Payment cycle every:{' '}
      <select
        className="AddPersonContainerinnerInput"
        style={{ width: '150px' }}
        value={paymentCycle}
        onChange={(e) => setPaymentCycle(e.target.value)}
      >
        <option value="30">30 days</option>
        <option value="15">15 days</option>
        <option value="7">7 days</option>
        <option value="monthly">monthly</option>
        <option value="weekly">weekly</option>
        <option value="daily">daily</option>
        <option value="custom">custom days</option>
      </select>
      {paymentCycle === 'custom' && (
        <input
          type="number"
          className="AddPersonContainerinnerInput"
          style={{ width: '100px', marginLeft: '10px' }}
          placeholder="Enter days"
          value={customDays}
          onChange={(e) => setCustomDays(e.target.value)}
        />
      )}
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
        <div className="PopOutContainer" style={{ top: '205px' }}>
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
        <div
          className="PopOutContainer"
          style={{ top: '125px', left: '-545px' }}
        >
          <div
            className="TimeLineMainContaner"
            style={{
              width: roomType.ShowPayTimeLine ? '850px' : '0px',
              height: roomType.ShowPayTimeLine ? '150px' : '0px',
              opacity: roomType.ShowPayTimeLine ? '1' : '0',
            }}
          >
            <table
              className="PaymentTimeline"
              style={{
                transform: 'scaleY(.5)',
                position: 'relative',
                bottom: '64px',
              }}
            >
              <tr className="PastTimeline" style={{ transform: 'scaleY(2)' }}>
                {visiblePayments.map((payment) => (
                  <td key={payment.Day}>
                    {new Date(payment.Day).toLocaleDateString()}
                  </td>
                ))}
              </tr>
              <tr className="FutureTimeline">
                {visiblePayments.map((payment) => (
                  <td
                    key={payment.Day}
                    style={{
                      padding: '0px',
                      height: '20px',
                    }}
                  ></td>
                ))}
              </tr>
              <tr className="FutureTimeline">
                {visiblePayments.map((payment) => (
                  <td
                    key={payment.Day}
                    style={{
                      padding: '0px',
                    }}
                  >
                    <div
                      style={{
                        width: '5px',
                        background: 'black',
                        height: '37px',
                        marginLeft: 'calc(50% - 4px)',
                      }}
                    ></div>
                  </td>
                ))}
              </tr>
              <tr className="FutureTimeline" style={{ background: 'black' }}>
                {visiblePayments.map((payment) => (
                  <td key={payment.Day}></td>
                ))}
              </tr>
              <tr className="FutureTimeline">
                {visiblePayments.map((payment) => (
                  <td
                    key={payment.Day}
                    style={{
                      padding: '0px',
                    }}
                  >
                    <div
                      style={{
                        width: '5px',
                        background: 'black',
                        height: '37px',
                        marginLeft: 'calc(50% - 4px)',
                      }}
                    ></div>
                  </td>
                ))}
              </tr>
              <tr className="FutureTimeline">
                {visiblePayments.map((payment) => (
                  <td
                    key={payment.Day}
                    style={{
                      padding: '0px',
                      height: '20px',
                    }}
                  ></td>
                ))}
              </tr>
              <tr style={{ transform: 'scaleY(2)' }}>
                {visiblePayments.map((payment) => (
                  <td
                    key={payment.Day}
                    className={payment.Paid ? 'Paid' : 'Due'}
                  >
                    {payment.Paid ? (
                      <p style={{ color: 'green' }}>Paid ✅</p>
                    ) : (
                      <button
                        className="PayButton"
                        onClick={() => pay(payment)}
                      >
                        Pay
                      </button>
                    )}
                  </td>
                ))}
              </tr>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;
