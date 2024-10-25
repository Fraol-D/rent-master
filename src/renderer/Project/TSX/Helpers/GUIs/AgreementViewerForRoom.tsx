import React, { useEffect, useState } from 'react';
import '../../../CSS/AgreementViewerForRoom.css';
const { v4: uuidv4 } = require('uuid');

import {
  convertToGC,
  toEthiopianDateString,
} from 'renderer/Project/JS/Calendar Converter';
import EthiopianCalanderConverterMenu from './EthiopianCalanderConverterMenu';
import {
  addValue,
  deleteValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
import { addDays } from 'date-fns'; // Add this import

const AgreementViewerForRoom = ({
  TenantList,
  roomType,
  getCorrectPaymentStatment,
  updateRoomPropertyLocal,
  updateRoomProperty,
  agreementApi,
  ShowState,
  calculateDaysDifference,
  roomPaymentInfoApi,
  handlePaymentRefresh,
  setChangeMade,
  view,
}: any) => {
  const [Agreements, setAgreements] = useState<agreements[]>([]);
  const [CurrentAgreementIndex, setCurrentAgreementIndex] = useState(0);
  const [ShowAddAgreementPannal, setShowAddAgreementPannal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const getAgreements = async () => {
    const agreements = await agreementApi.getAgreementsByRoomIdApi(roomType.id);

    // Sort agreements by signTime, oldest first
    const sortedAgreements = agreements.sort(
      (a: agreements, b: agreements) =>
        new Date(a.signTime).getTime() - new Date(b.signTime).getTime()
    );

    // Find the index of the selected agreement
    const selectedIndex = sortedAgreements.findIndex(
      (agreement: agreements) => agreement.id === roomType.selectedAgreementId
    );

    // If found, move it to the end
    if (selectedIndex !== -1) {
      const selectedAgreement = sortedAgreements.splice(selectedIndex, 1)[0];
      sortedAgreements.push(selectedAgreement);
    }
    if (agreements.length >= 1) setCurrentAgreementIndex(agreements.length - 1);

    setAgreements(sortedAgreements);
  };
  useEffect(() => {
    //Get

    if (ShowState) getAgreements();
  }, [ShowState, refreshKey]);
  useEffect(() => {
    if (Agreements[CurrentAgreementIndex]) {
      setMemoText(Agreements[CurrentAgreementIndex].Memo);
      setRentReservedText(
        Agreements[CurrentAgreementIndex].RentReserved.toString() || ''
      );
    }
  }, [CurrentAgreementIndex]);
  useEffect(() => {
    if (Agreements[CurrentAgreementIndex]) {
      setMemoText(Agreements[CurrentAgreementIndex].Memo);
      setRentReservedText(
        Agreements[CurrentAgreementIndex].RentReserved.toString()
      );
    }
  }, [view]);
  const handlePrevAgreement = () => {
    setCurrentAgreementIndex((prevIndex) =>
      prevIndex > 0 ? prevIndex - 1 : prevIndex
    );
  };

  const handleNextAgreement = () => {
    setCurrentAgreementIndex((prevIndex) =>
      prevIndex < Agreements.length - 1 ? prevIndex + 1 : prevIndex
    );
  };
  const [paymentOption, setPaymentOption] = useState<
    'deleteUnpaid' | 'keepUnpaid' | 'makeAllPaid'
  >('deleteUnpaid');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [signDate, setSignDate] = useState('');
  const [Representative, setRepresentative] = useState('');
  const [ShowConverter, setShowConverter] = useState(false);
  const [ShowConverterEndDate, setShowConverterEndDate] = useState(false);
  const [ShowConverterSignDate, setShowConverterSignDate] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState('');
  const [paymentCycle, setPaymentCycle] = useState('Every 30 days');
  const [customDays, setCustomDays] = useState('');
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [endDateError, setEndDateError] = useState('');

  const handlePaymentCycleChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setPaymentCycle(e.target.value);
    if (e.target.value !== 'custom') {
      setCustomDays('');
    }
  };
  const movePaymentsToHistory = async (
    roomId: string,
    newAgreementId: string
  ) => {
    const existingPayments = await getValuesWithSql(
      'room_pay_info',
      `WHERE roomId = '${roomId}' AND tenantId = '${roomType.tenantId}'`
    );

    for (const payment of existingPayments) {
      if (payment.Paid)
        await addValue(
          'room_pay_info_history',
          {
            ...payment,
            agreementId: newAgreementId,
          },
          setChangeMade
        );
      await deleteValue('room_pay_info', payment.id, setChangeMade);
    }

    // Now delete only the paid payments from room_pay_info
  };
  const HandleAddAgreement = async () => {
    // Deal with deleting, keeping, and makeing true of payments
    if (paymentOption === 'deleteUnpaid') {
      const FutruePaymentsRaw = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${roomType.id}' AND tenantId = '${
          roomType.tenantId
        }' AND Day >= '${Date.now()}' AND Paid = '0'`
      );

      if (FutruePaymentsRaw.length >= 1) {
        for (let i = 0; i < FutruePaymentsRaw.length; i++) {
          const element = FutruePaymentsRaw[i];
          await deleteValue('room_pay_info', element.id);
        }
      }
    } else if (paymentOption === 'keepUnpaid') {
    } else if (paymentOption === 'makeAllPaid') {
      const FutruePaymentsRaw = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${roomType.id}' AND tenantId = '${
          roomType.tenantId
        }' AND Day >= '${Date.now()}' AND Paid = '0'`
      );
      console.log(FutruePaymentsRaw.length, 'length');
      if (FutruePaymentsRaw.length >= 1) {
        for (let i = 0; i < FutruePaymentsRaw.length; i++) {
          const element = FutruePaymentsRaw[i];
          await updateValue(
            'room_pay_info',
            element.id,
            'Paid',
            1,
            setChangeMade,
            0
          );
        }
      }
    }
    const agreementId = uuidv4();

    // Move existing payments to history
    await movePaymentsToHistory(roomType.id, agreementId);

    // Create new payment data from start time to endtime using payment cycle
    console.log(paymentCycle);
    const paymentIntervals = {
      'Every 30 days': 30,
      'Every 15 days': 15,
      'Every 7 days': 7,
      monthly: 1,
      daily: 1,
      custom: parseInt(customDays, 10) || 30, // Provide a fallback value
    };

    let interval: number =
      paymentIntervals[paymentCycle as keyof typeof paymentIntervals] || 30;

    console.log('reached1', interval);

    const startDate = new Date(startTime);

    // Create a new agreement ID first

    // Create a new agreement and add it to the agreements table
    agreementApi.addAgreementApi(
      agreementId,
      roomType.id,
      roomType.tenantId,
      new Date(startTime).getTime(),
      new Date(endTime).getTime(),
      new Date(signDate).getTime(),
      agreedPrice,
      paymentCycle === 'custom' ? '-' + customDays : paymentCycle,
      '',
      '',
      Representative
    );
    // Set the roomType.SelectedAgreementId to the new agreement Id
    updateRoomProperty(roomType.id, 'selectedAgreementId', agreementId);
    updateRoomProperty(roomType.id, 'AgreedPrice', agreedPrice);
    updateRoomProperty(roomType.id, 'PaymentCycleType', paymentCycle);
    updateRoomProperty(roomType.id, 'PaymentCycleCustomeDays', customDays);

    //Refresh component to render new data
    setRefreshKey((prevKey) => prevKey + 1);

    handlePaymentRefresh();
    // Reset all the input fields
    setStartTime('');
    setEndTime('');
    setSignDate('');
    setRepresentative('');
    setPaymentCycle('Every 30 days');
    setCustomDays('');
    setAgreedPrice(0);
    setShowAddAgreementPannal(false);
    console.log('Show add agreement form');
  };

  const HandleCancelAddAgreement = () => {
    // Reset all the input fields
    setStartTime('');
    setEndTime('');
    setSignDate('');
    setRepresentative('');
    setPaymentCycle('Every 30 days');
    setCustomDays('');
    setAgreedPrice(0);

    // Hide the add agreement form or modal
    // This is a placeholder, you might want to implement a state to control the visibility of the form
    setShowAddAgreementPannal(false);
    console.log('Hide add agreement form');
  };
  const [MemoText, setMemoText] = useState('INITIALLLI');
  const [RentReservedText, setRentReservedText] = useState('INITIALLLI');

  return (
    ShowState &&
    Agreements.length >= 1 && (
      <>
        <div className="AgreementMainContianer">
          <div>
            {Agreements.length >= 1 && (
              <div className="AgreementNavigationButtons">
                <button
                  onClick={handlePrevAgreement}
                  disabled={CurrentAgreementIndex === 0}
                >
                  ◀
                </button>
                <strong
                  style={{
                    background:
                      Agreements[CurrentAgreementIndex].id ===
                      roomType.selectedAgreementId
                        ? 'var(--Primary-Color)'
                        : '',
                    padding: '5px ',
                    borderRadius: '5px',
                  }}
                >
                  {Agreements[CurrentAgreementIndex].id ===
                  roomType.selectedAgreementId
                    ? 'Current'
                    : 'Expired ' +
                      (Agreements.indexOf(Agreements[CurrentAgreementIndex]) +
                        1)}
                </strong>{' '}
                <button
                  onClick={handleNextAgreement}
                  disabled={CurrentAgreementIndex === Agreements.length - 1}
                >
                  ▶
                </button>
                <button
                  onClick={() => {
                    setShowAddAgreementPannal(true);
                  }}
                >
                  Add an agreement
                </button>
              </div>
            )}
            <div className="AddTenantContainerinnerElement" style={{}}>
              <div>
                Representative:
                <em style={{ fontWeight: '600' }}>
                  {Agreements[CurrentAgreementIndex].representative || '---'}
                </em>
              </div>
            </div>
            <div className="AddTenantContainerinnerElement" style={{}}>
              <div
                title={toEthiopianDateString(
                  new Date(Agreements[CurrentAgreementIndex].startTime)
                )}
              >
                Start:
                <em style={{ fontWeight: '600' }}>
                  {new Date(
                    Agreements[CurrentAgreementIndex].startTime
                  ).toDateString()}
                </em>
              </div>
            </div>

            <div
              className="AddTenantContainerinnerElement"
              title={toEthiopianDateString(
                new Date(Agreements[CurrentAgreementIndex].endTime)
              )}
            >
              End:
              <em style={{ fontWeight: '600' }}>
                {new Date(
                  Agreements[CurrentAgreementIndex].endTime
                ).toDateString()}
              </em>{' '}
              <em style={{ color: 'var(--Text-Color-Grey)' }}>
                -
                {calculateDaysDifference(
                  new Date(Agreements[CurrentAgreementIndex].startTime),
                  new Date(Agreements[CurrentAgreementIndex].endTime)
                ).toLocaleString()}{' '}
              </em>
            </div>
            <div
              className="AddTenantContainerinnerElement"
              title={toEthiopianDateString(
                new Date(Agreements[CurrentAgreementIndex].signTime)
              )}
            >
              Signed:
              <em style={{ fontWeight: '600' }}>
                {new Date(
                  Agreements[CurrentAgreementIndex].signTime
                ).toDateString()}
              </em>{' '}
            </div>
          </div>
          <div className="AddTenantContainerinnerElement">
            Agreed Price:{' '}
            <em style={{ fontWeight: '600' }}>
              {Agreements[CurrentAgreementIndex].agreedPrice.toLocaleString()}
            </em>
            $ Every{' '}
            {getCorrectPaymentStatment(
              Agreements[CurrentAgreementIndex].paymentCycleType,
              Agreements[CurrentAgreementIndex].paymentCycleType.slice(1)
            )}
          </div>
          <div className="AddTenantContainerinnerElement">
            Payment cycle:{' '}
            <em style={{ fontWeight: '600' }}>
              Every{' '}
              {getCorrectPaymentStatment(
                Agreements[CurrentAgreementIndex].paymentCycleType,
                Agreements[CurrentAgreementIndex].paymentCycleType.slice(1)
              )}
            </em>
          </div>
          <div className="AddTenantContainerinnerElement">
            Memo:{' '}
            <input
              type="text"
              className="StartTime"
              value={
                MemoText === 'INITIALLLI'
                  ? Agreements[CurrentAgreementIndex].Memo
                  : MemoText
              }
              onChange={(e) => {
                setMemoText(e.target.value);
              }}
              onBlur={() => {
                agreementApi.editAgreementApi(
                  Agreements[CurrentAgreementIndex].id,
                  'Memo',
                  MemoText,
                  Agreements[CurrentAgreementIndex].Memo
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  agreementApi.editAgreementApi(
                    Agreements[CurrentAgreementIndex].id,
                    'Memo',
                    MemoText,
                    Agreements[CurrentAgreementIndex].Memo
                  );
                }
              }}
            />
          </div>
          <div className="AddTenantContainerinnerElement">
            Rent Reserved:{' '}
            <input
              type="text"
              style={{ width: '80px' }}
              className="StartTime"
              value={
                RentReservedText === 'INITIALLLI'
                  ? Agreements[CurrentAgreementIndex].RentReserved
                  : RentReservedText
              }
              onChange={(e) => {
                setRentReservedText(e.target.value);
              }}
              onBlur={() => {
                agreementApi.editAgreementApi(
                  Agreements[CurrentAgreementIndex].id,
                  'RentReserved',
                  RentReservedText,
                  Agreements[CurrentAgreementIndex].RentReserved
                );
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  agreementApi.editAgreementApi(
                    Agreements[CurrentAgreementIndex].id,
                    'RentReserved',
                    RentReservedText,
                    Agreements[CurrentAgreementIndex].RentReserved
                  );
                }
              }}
            />
          </div>
        </div>
        {ShowAddAgreementPannal && (
          <div className="PopOutContainerAgreement">
            <div className="AgreementPopUpContainerOpacity"></div>
            <div className="AgreementPopUpContainer">
              <div>
                <h2>Add a new agreement</h2>
                <p>
                  The current agreement will be expired and a new agreement will
                  be created.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    alignContent: 'flex-start',
                  }}
                >
                  <div className="radio-group">
                    <label>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="deleteUnpaid"
                        checked={paymentOption === 'deleteUnpaid'}
                        onChange={() => setPaymentOption('deleteUnpaid')}
                      />
                      Delete all unpaid future payments
                    </label>
                    <br />
                    <label>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="keepUnpaid"
                        checked={paymentOption === 'keepUnpaid'}
                        onChange={() => setPaymentOption('keepUnpaid')}
                      />
                      Keep all unpaid future payments
                    </label>
                    <br />
                    <label>
                      <input
                        type="radio"
                        name="paymentOption"
                        value="makeAllPaid"
                        checked={paymentOption === 'makeAllPaid'}
                        onChange={() => setPaymentOption('makeAllPaid')}
                      />
                      Make all unpaid future payments paid
                    </label>
                    <br />
                  </div>
                  <div
                    className="AddTenantContainerinnerElement"
                    style={{ marginTop: '20px' }}
                  >
                    <div>
                      Representative:
                      <input
                        type="text"
                        value={Representative}
                        className="StartTime"
                        style={{ fontWeight: '700' }}
                        onChange={(e) => setRepresentative(e.target.value)}
                      />{' '}
                    </div>
                    <div>
                      Start time:
                      <input
                        type="date"
                        style={{ fontWeight: '700' }}
                        value={startTime}
                        className="StartTime"
                        onChange={(e) => setStartTime(e.target.value)}
                      />
                      <button
                        onClick={() => {
                          setShowConverter(true);
                        }}
                      >
                        ET date
                      </button>
                      {ShowConverter && (
                        <EthiopianCalanderConverterMenu
                          onConvert={(s) => {
                            console.log(s);
                          }}
                          Cancel={() => {
                            setShowConverter(false);
                          }}
                          handleUse={(num: number) => {
                            const date = new Date(num);
                            date.setDate(date.getDate() + 1);
                            setStartTime(date.toISOString().split('T')[0]);
                            setShowConverter(false);
                          }}
                        ></EthiopianCalanderConverterMenu>
                      )}{' '}
                    </div>{' '}
                    <div>
                      End time:
                      <input
                        type="date"
                        value={endTime}
                        className="StartTime"
                        style={{ fontWeight: '700' }}
                        onChange={(e) => {
                          setEndTime(e.target.value);
                          if (new Date(e.target.value) <= new Date(startTime)) {
                            setEndDateError(
                              'End date must be after start date'
                            );
                          } else {
                            setEndDateError('');
                          }
                        }}
                      />{' '}
                      <button
                        onClick={() => {
                          setShowConverterEndDate(true);
                        }}
                      >
                        ET date
                      </button>
                      {ShowConverterEndDate && (
                        <EthiopianCalanderConverterMenu
                          onConvert={(s) => {
                            console.log(s);
                          }}
                          Cancel={() => {
                            setShowConverterEndDate(false);
                          }}
                          handleUse={(num: number) => {
                            const date = new Date(num);
                            date.setDate(date.getDate() + 1);
                            const newEndDate = date.toISOString().split('T')[0];
                            setEndTime(newEndDate);
                            setShowConverterEndDate(false);
                            if (new Date(newEndDate) <= new Date(startTime)) {
                              setEndDateError(
                                'End date must be after start date'
                              );
                            } else {
                              setEndDateError('');
                            }
                          }}
                        ></EthiopianCalanderConverterMenu>
                      )}{' '}
                      {endDateError && (
                        <span style={{ color: 'red' }}>{endDateError}</span>
                      )}
                    </div>
                    <div>
                      Sign date:
                      <input
                        type="date"
                        value={signDate}
                        className="StartTime"
                        style={{ fontWeight: '700' }}
                        onChange={(e) => setSignDate(e.target.value)}
                      />{' '}
                      <button
                        onClick={() => {
                          setShowConverterSignDate(true);
                        }}
                      >
                        ET date
                      </button>
                      {ShowConverterSignDate && (
                        <EthiopianCalanderConverterMenu
                          onConvert={(s) => {
                            console.log(s);
                          }}
                          Cancel={() => {
                            setShowConverterSignDate(false);
                          }}
                          handleUse={(num: number) => {
                            const date = new Date(num);
                            date.setDate(date.getDate() + 1);
                            setSignDate(date.toISOString().split('T')[0]);
                            setShowConverterSignDate(false);
                          }}
                        ></EthiopianCalanderConverterMenu>
                      )}{' '}
                    </div>
                  </div>
                  <div className="AddTenantContainerinnerElement">
                    Payment cycle every:{' '}
                    <select
                      className="AddTenantContainerinnerInput"
                      style={{ width: '100px' }}
                      value={paymentCycle}
                      onChange={handlePaymentCycleChange}
                    >
                      <option value="30">30 days</option>
                      <option value="15">15 days</option>
                      <option value="7">7 days</option>
                      <option value="daily">daily</option>
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
                      <option value="Annually">annually</option>
                      <option value="custom">custom days</option>
                    </select>
                    {paymentCycle === 'custom' && (
                      <input
                        type="number"
                        className="AddTenantContainerinnerInput"
                        style={{ width: '50px', marginLeft: '10px' }}
                        placeholder="Enter days"
                        value={customDays}
                        onChange={(e) => setCustomDays(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="AddTenantContainerinnerElement">
                    Agreed Price:{' '}
                    <input
                      type="number"
                      className="AddTenantContainerinnerInput"
                      style={{ width: '70px' }}
                      placeholder="Enter price"
                      value={agreedPrice}
                      onChange={(e) => setAgreedPrice(parseInt(e.target.value))}
                    />
                    $
                    <button
                      style={{
                        marginLeft: '10px',
                      }}
                      onClick={() => {
                        setAgreedPrice(roomType.price);
                      }}
                    >
                      Same
                    </button>
                  </div>
                </div>
              </div>
              <div></div>
              <div style={{ display: 'flex' }}>
                <button onClick={HandleCancelAddAgreement}>Cancel</button>
                <button onClick={HandleAddAgreement} disabled={!!endDateError}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    )
  );
};

export default React.memo(AgreementViewerForRoom);
