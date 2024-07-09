import React, { useEffect, useRef, useState } from 'react';
import '../../CSS/Room.css';
const { v4: uuidv4 } = require('uuid');
import PaymentProgressBar from './PaymentProgressBar';
import EditIcon from "../../../assets/assets/Dark mode/Editicon.png"
const Room = ({
  roomType,
  updateRoomProperty,
  turnOffAddTenantStateForAll,
  turnOffViewStateForAll,
  TenantList,
  setTenantList,
  tenantAPI,
  updateRoomPropertyWithOutRefresh,
  roomPaymentInfoApi,
  isUpdatingTenantList,
  setIsUpdatingTenantList,setSelectedEditRoomId
}: any) => {
  const handleAddTenant = () => {
    turnOffAddTenantStateForAll();
    updateRoomProperty(roomType.id, 'AddTenantState', !roomType.AddTenantState);
  };
  const [name, setName] = useState('');
  const [tel1, setTel1] = useState('');
  const [tel2, setTel2] = useState('');
  const [email, setEmail] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState('Open-Ended');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [agreedPrice, setAgreedPrice] = useState(roomType.price);
  const [paymentCycle, setPaymentCycle] = useState('30');
  const [customDays, setCustomDays] = useState('');
  const [searchTermTenant, setSearchTermTenant] = useState('');
  const filteredTenants =
    TenantList &&
    TenantList.filter(
      (tenant: tenant) =>
        (tenant.name.toLowerCase().includes(searchTermTenant.toLowerCase()) ||
          tenant.phoneNumber.includes(searchTermTenant) ||
          (tenant.phoneNumber2 &&
            tenant.phoneNumber2.includes(searchTermTenant)) ||
          (tenant.email &&
            tenant.email
              .toLowerCase()
              .includes(searchTermTenant.toLowerCase()))) &&
        !tenant.RentingOrOut
    );
  const addTenantRef = useRef(null);
  const viewAgreementRef = useRef(null);
  const showPayTimeLineRef = useRef(null);
  const hideButtonRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addTenantRef.current &&
        !(addTenantRef.current as HTMLElement).contains(event.target as Node) &&
        roomType.AddTenantState
      ) {
        updateRoomProperty(roomType.id, 'AddTenantState', 0);
      }
      if (
        viewAgreementRef.current &&
        !(viewAgreementRef.current as HTMLElement).contains(
          event.target as Node
        ) &&
        roomType.ViewAgreement
      ) {
        updateRoomProperty(roomType.id, 'ViewAgreement', 0);
      }
      if (
        showPayTimeLineRef.current &&
        !(showPayTimeLineRef.current as HTMLElement).contains(
          event.target as Node
        ) &&
        hideButtonRef.current &&
        !(hideButtonRef.current as HTMLElement).contains(
          event.target as Node
        ) &&
        roomType.ShowPayTimeLine
      ) {
        updateRoomProperty(roomType.id, 'ShowPayTimeLine', 0);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [roomType]);

  function calculateDaysDifference(startDate: Date, endDate: Date): number {
    const timeDifference =
      new Date(endDate).getTime() - new Date(startDate).getTime();
    const daysDifference = Math.floor(timeDifference / (1000 * 3600 * 24));
    return daysDifference;
  }
  const handleTenantSelectWhenNew = () => {
    // Find the tenant in the TenantList
    const tenantIndex = TenantList.findIndex(
      (tenant: any) => tenant.id === SelectedTenantIdOnAdding
    );
    if (tenantIndex !== -1) {
      tenantAPI.EditTenantApiWithOutRefresh(
        SelectedTenantIdOnAdding,
        'RentingOrOut',
        true
      );
      tenantAPI.EditTenantApiWithOutRefresh(
        SelectedTenantIdOnAdding,
        'SelectedAgreement',
        selectedAgreement
      );
      tenantAPI.EditTenantApiWithOutRefresh(
        SelectedTenantIdOnAdding,
        'agreedPrice',
        agreedPrice ? roomType.price : agreedPrice
      );
      tenantAPI.EditTenantApiWithOutRefresh(
        SelectedTenantIdOnAdding,
        'startTime',
        startTime
      );
      tenantAPI.EditTenantApi(SelectedTenantIdOnAdding, 'endTime', endTime);
    }

    updateRoomPropertyWithOutRefresh(roomType.id, 'status', 'Taken');
    updateRoomPropertyWithOutRefresh(
      roomType.id,
      'PaymentCycleCustomeDays',
      customDays
    );
    updateRoomPropertyWithOutRefresh(
      roomType.id,
      'PaymentCycleType',
      paymentCycle
    );
    updateRoomPropertyWithOutRefresh(roomType.id, 'AgreedPrice', agreedPrice);
    updateRoomPropertyWithOutRefresh(
      roomType.id,
      'tenantId',
      SelectedTenantIdOnAdding
    );
    updateRoomProperty(roomType.id, 'AddTenantState', 0);

    if (!roomType.AllRoomPayInfo) {
      roomType.AllRoomPayInfo = {
        RoomPayInfo: [],
      };
    }

    const paymentIntervals = {
      'Every 30 days': 30,
      'Every 15 days': 15,
      'Every 7 days': 7,
      monthly: 1,
      daily: 1,
      custom: parseInt(customDays, 10),
    };

    const getPaymentDay = (
      interval: number,
      start: Date,
      index: number,
      type: string
    ) => {
      const paymentDay = new Date(start);
      if (type === 'monthly') {
        paymentDay.setMonth(paymentDay.getMonth() + index);
      } else {
        paymentDay.setDate(paymentDay.getDate() + index * interval);
      }
      return paymentDay;
    };

    let interval: number =
      paymentIntervals[paymentCycle as keyof typeof paymentIntervals];
    if (!interval || isNaN(interval)) {
      console.error(
        `Invalid payment cycle: ${paymentCycle}. Defaulting to 30 days.`
      );
      interval = 30; // Default to 30 days if the payment cycle is invalid
    }

    for (let i = 0; i < 40; i++) {
      const paymentDay = getPaymentDay(
        interval,
        new Date(startTime),
        i,
        paymentCycle
      );

      roomPaymentInfoApi.addRoomPaymentApiWithOutRefresh(
        uuidv4(),
        SelectedTenantIdOnAdding,
        paymentDay.getTime(),
        false
      );
    }

    console.log(roomType.AllRoomPayInfo.RoomPayInfo);
  };
  const handleAddTenantButton = () => {
    if (TenantPageSelected === 'Select') {
      handleTenantSelectWhenNew();
      return;
    }
    if (name.length >= 3 && tel1.length >= 6 && startTime.length >= 1) {
      setIsUpdatingTenantList(true);
      const tenantId = uuidv4();
      const tenant = {
        id: tenantId,
        name,
        phoneNumber: tel1,
        phoneNumber2: tel2,
        email,
        SelectedAgreement: selectedAgreement,
        startTime,
        endTime,
        agreedPrice: agreedPrice ? roomType.price : agreedPrice,
        RentingOrOut: true,
      };

      updateRoomPropertyWithOutRefresh(roomType.id, 'status', 'Taken');
      updateRoomPropertyWithOutRefresh(
        roomType.id,
        'PaymentCycleCustomeDays',
        customDays
      );
      updateRoomPropertyWithOutRefresh(
        roomType.id,
        'PaymentCycleType',
        paymentCycle
      );
      updateRoomPropertyWithOutRefresh(roomType.id, 'AgreedPrice', agreedPrice);
      updateRoomPropertyWithOutRefresh(roomType.id, 'tenantId', tenantId);
      updateRoomProperty(roomType.id, 'AddTenantState', 0);
      //add a tenant to the tenant list
      tenantAPI.addTenantApi(
        tenant.id,
        tenant.name,
        tenant.phoneNumber,
        tenant.phoneNumber2,
        tenant.email,
        tenant.SelectedAgreement,
        tenant.RentingOrOut,
        tenant.startTime,
        tenant.endTime,
        tenant.agreedPrice
      );
      if (!roomType.AllRoomPayInfo) {
        roomType.AllRoomPayInfo = {
          RoomPayInfo: [],
        };
      }

      const paymentIntervals = {
        'Every 30 days': 30,
        'Every 15 days': 15,
        'Every 7 days': 7,
        monthly: 1,
        daily: 1,
        custom: parseInt(customDays, 10),
      };

      const getPaymentDay = (
        interval: number,
        start: Date,
        index: number,
        type: string
      ) => {
        const paymentDay = new Date(start);
        if (type === 'monthly') {
          paymentDay.setMonth(paymentDay.getMonth() + index);
        } else {
          paymentDay.setDate(paymentDay.getDate() + index * interval);
        }
        return paymentDay;
      };

      let interval: number =
        paymentIntervals[paymentCycle as keyof typeof paymentIntervals];
      if (!interval || isNaN(interval)) {
        console.error(
          `Invalid payment cycle: ${paymentCycle}. Defaulting to 30 days.`
        );
        interval = 30; // Default to 30 days if the payment cycle is invalid
      }
      console.log("reached1")

      for (let i = 0; i < 40; i++) {
      console.log("reached")

        const paymentDay = getPaymentDay(
          interval,
          new Date(startTime),
          i,
          paymentCycle
        );
          
        roomPaymentInfoApi.addRoomPaymentApiWithOutRefresh(
          uuidv4(),
          roomType.id,
          paymentDay.getTime(),
          false
        );
      }

      console.log(roomType.AllRoomPayInfo.RoomPayInfo);
    }
  };
  const extendPaymentSchedule = async () => {
    if (!roomType.AllRoomPayInfo || !roomType.AllRoomPayInfo.RoomPayInfo)
      return;

    const lastPayment =
      roomType.AllRoomPayInfo.RoomPayInfo[
        roomType.AllRoomPayInfo.RoomPayInfo.length - 1
      ];
    if (!lastPayment) return;

    const lastPaymentDate = new Date(lastPayment.Day);
    const paymentIntervals = {
      'Every 30 days': 30,
      'Every 15 days': 15,
      'Every 7 days': 7,
      monthly: 1,
      daily: 1,
      custom: parseInt(customDays, 10),
    };

    const getPaymentDay = (
      interval: number,
      start: Date,
      index: number,
      type: string
    ) => {
      const paymentDay = new Date(start);
      if (type === 'monthly') {
        paymentDay.setMonth(paymentDay.getMonth() + index);
      } else {
        paymentDay.setDate(paymentDay.getDate() + index * interval);
      }
      return paymentDay;
    };

    let interval: number =
      paymentIntervals[paymentCycle as keyof typeof paymentIntervals];
    if (!interval || isNaN(interval)) {
      console.error(
        `Invalid payment cycle: ${paymentCycle}. Defaulting to 30 days.`
      );
      interval = 30; // Default to 30 days if the payment cycle is invalid
    }

    const newPayments: { Day: number; Paid: boolean }[] = [];
    for (let i = 1; i <= 10; i++) {
      const paymentDay = getPaymentDay(
        interval,
        lastPaymentDate,
        i,
        paymentCycle
      );

      await roomPaymentInfoApi.addRoomPaymentApiWithOutRefresh(
        uuidv4(),
        roomType.id,
        paymentDay.getTime(),
        false
      );
    }
  };
  const checkPaymentStatus = (allRoomPayInfo?: {
    RoomPayInfo?: { Day: number; Paid: boolean }[];
  }): string => {
    if (allRoomPayInfo == undefined) {
      return 'No payment information available.';
    }
    if (!allRoomPayInfo || !allRoomPayInfo.RoomPayInfo) {
      return 'No payment information available.';
    }

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
      return `Payment due in ${daysUntilPayment} days. On ${
        new Date(nearestPaymentDate.Day).getMonth() + 1
      }/${new Date(nearestPaymentDate.Day).getDate()}/${new Date(
        nearestPaymentDate.Day
      ).getFullYear()}`;
    } else {
      return `Payment day past by ${Math.abs(daysUntilPayment)} days.`;
    }
  };

  const getDaysUntilPayment = (allRoomPayInfo: {
    RoomPayInfo: { Day: number; Paid: boolean }[];
  }): number => {
    const currentDate = new Date().getTime();

    const unpaidPayments = allRoomPayInfo.RoomPayInfo.filter(
      (payment) => !payment.Paid
    );

    if (unpaidPayments.length === 0) {
      return 0;
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
    return daysUntilPayment;
  };
  const paymentStatus = checkPaymentStatus(roomType.AllRoomPayInfo);

  const pay = (payment: any) => {
    updateRoomProperty(roomType.id, 'AllRoomPayInfo', {
      ...roomType.AllRoomPayInfo,
      RoomPayInfo: roomType.AllRoomPayInfo.RoomPayInfo.map((p: any) =>
        p.Day === payment.Day ? { ...p, Paid: true } : p
      ),
    });
  };

  const handlePaymentCycleChange = (e: any) => {
    setPaymentCycle(e.target.value);
    const val = e.target.value;

    if (val === 'Every 30 days') {
      setAgreedPrice(Math.round(roomType.price));
    } else if (val === 'Every 15 days') {
      setAgreedPrice(Math.round(roomType.price / 2));
    } else if (val === 'Every 7 days') {
      setAgreedPrice(Math.round(roomType.price / 4.28));
    } else if (val === 'monthly') {
      setAgreedPrice(Math.round(roomType.price));
    } else if (val === 'daily') {
      setAgreedPrice(Math.round(roomType.price / 30));
    } else if (val === 'custom') {
      setAgreedPrice(Math.round(roomType.price));
    }
  };
  const getBorderColor = (roomInfo: AllRoomPayInfo) => {
    const daysUntilPayment = getDaysUntilPayment(roomInfo);
    if (daysUntilPayment > 8) {
      return '1px solid white';
    } else if (daysUntilPayment > 5) {
      return '1px solid lightpink';
    } else if (daysUntilPayment > 2) {
      return '1px solid tomato';
    } else if (daysUntilPayment > 0) {
      return '1px solid red';
    } else {
      return '1px solid red'; // Default case if daysUntilPayment is not greater than 0
    }
  };
  const [TenantPageSelected, setTenantPageSelected] = useState<
    'Select' | 'New'
  >('New');
  const [SelectTenantSearch, setSelectTenantSearch] = useState('');
  const [SelectedTenantIdOnAdding, setSelectedTenantIdOnAdding] = useState('');

  return (
    <>
      <div
        className="MainContainer"
        style={{
          backgroundColor: roomType.AddTenantState
            ? '#2C2C30'
            : roomType.status === 'Empty'
            ? '#2e2f30'
            : '#546C83',
          border: roomType.AddTenantState ? '1px solid #00e1f1' : '',
        }}
      >
        <div className="FirstLine">
          <div style={{display:"flex", }}><p className="FloorText">Floor {roomType.floor}</p> <img onClick={()=>{setSelectedEditRoomId(roomType.id)}} src={EditIcon} style={{width:"23px",height:"23px",marginLeft:"10px"}} alt="" /></div>
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
                    {TenantList.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    )
                      ? TenantList.find(
                          (tenant: any) => tenant.id === roomType.tenantId
                        ).name
                      : 'Tenant not found'}
                  </p>
                ) : (
                  <>
                    {roomType.AddTenantState ? (
                      <>
                        <strong
                          style={{
                            fontWeight: '600',
                            fontSize: '17px',
                            borderBottom: '1px solid white',
                          }}
                          onClick={() => {
                            /* TO DO */ handleAddTenant();
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
                            /* TO DO */ handleAddTenant();
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
                Price: <strong>{roomType.price.toLocaleString()}$</strong>
              </div>{' '}
            </div>
            {/*<div className="ChangePriceButtonContianer">
              <button className="ChangePriceButton">a</button>
            </div> */}
          </div>
          {roomType.status === 'Taken' && (
            <div
              className="PayAndDueShowerContainer"
              style={{ border: getBorderColor(roomType.AllRoomPayInfo) }}
            >
              <p>
                {paymentStatus == 'All payments have been made.' ? (
                  <>
                    All payments have been made.{' '}
                    <em
                      onClick={() => {
                        extendPaymentSchedule();
                      }}
                      style={{ borderBottom: '1px solid white', width: '30px' }}
                    >
                      Extend?
                    </em>
                  </>
                ) : (
                  paymentStatus
                )}
              </p>
              <button
                className="Show-button-Pay"
                ref={hideButtonRef}
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
            <div style={{ overflowY: 'auto' }}>
              {roomType.RoomSpecifications.map((roomSpec: any) => (
                <p key={roomSpec.id} className="RoomTypeContainertext">
                  {roomSpec.type === 'number' ? (
                    <>
                      {roomSpec.Number} - {roomSpec.Detail}
                    </>
                  ) : (
                    <>
                      {roomSpec.Boolean ? 'Yes' : 'No'} {roomSpec.Detail}
                    </>
                  )}
                </p>
              ))}
            </div>
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

        <div
          className="PopOutContainer"
          ref={addTenantRef}
          style={{ zIndex: roomType.AddTenantState ? '1' : '-1' }}
        >
          <div
            className="AddTenantContainerinner"
            style={{
              width: roomType.AddTenantState ? '280px' : '0px',
              height: roomType.AddTenantState ? '280px' : '0px',
              opacity: roomType.AddTenantState ? '1' : '0',

              fontSize: '17px',
            }}
          >
            <div className="InnerAddtenantTop">
              <div className="TabsContainerForTenantAdding">
                <button
                  className="ButtonTabsContainerForTenantAdding"
                  onClick={() => {
                    setTenantPageSelected('Select');
                  }}
                  style={{
                    width: TenantPageSelected === 'Select' ? '60%' : '40%',
                    borderBottom:
                      TenantPageSelected === 'Select'
                        ? '1px solid #00e1ff'
                        : '1px solid grey',
                  }}
                >
                  Select a tenant
                </button>
                <button
                  className="ButtonTabsContainerForTenantAdding"
                  onClick={() => {
                    setTenantPageSelected('New');
                  }}
                  style={{
                    width: TenantPageSelected === 'New' ? '60%' : '40%',
                    borderBottom:
                      TenantPageSelected === 'New'
                        ? '1px solid #00e1ff'
                        : '1px solid grey',
                  }}
                >
                  New tenant
                </button>
              </div>
              {TenantPageSelected === 'New' ? (
                <>
                  <div className="AddTenantContainerinnerElement">
                    Name:{' '}
                    <input
                      className="AddTenantContainerinnerInput"
                      placeholder="Enter name of tenant"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="AddTenantContainerinnerElement">
                    Tel 1:{' '}
                    <input
                      className="AddTenantContainerinnerInput"
                      placeholder="Enter Tel of tenant"
                      value={tel1}
                      onChange={(e) => setTel1(e.target.value)}
                    />
                  </div>
                  <div className="AddTenantContainerinnerElement">
                    Tel 2:{' '}
                    <input
                      className="AddTenantContainerinnerInput"
                      placeholder="Optional"
                      value={tel2}
                      onChange={(e) => setTel2(e.target.value)}
                    />
                  </div>
                  <div className="AddTenantContainerinnerElement">
                    Email:{' '}
                    <input
                      className="AddTenantContainerinnerInput"
                      placeholder="Optional"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <input
                    type="text"
                    placeholder="Search tenant"
                    style={{ width: '100%' }}
                    value={SelectTenantSearch}
                    onChange={(e) => setSelectTenantSearch(e.target.value)}
                  />
                  {SelectedTenantIdOnAdding === '' ? (
                    filteredTenants.map((tenant: any) => (
                      <div className="TenantRow" key={tenant.key}>
                        <button
                          onClick={() => {
                            setSelectedTenantIdOnAdding(tenant.id);
                          }}
                        >
                          <p>{tenant.name}</p>
                          <p style={{ fontSize: '10px' }}>
                            {tenant.phoneNumber}
                          </p>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedTenantIdOnAdding('');
                          }}
                          style={{ width: '35px', height: '35px' }}
                        >
                          X
                        </button>
                      </div>
                    ))
                  ) : (
                    <div
                      className="TenantRow"
                      key={
                        TenantList.find(
                          (tenant: any) => tenant.id == SelectedTenantIdOnAdding
                        ).key
                      }
                    >
                      <button
                        onClick={() => {
                          setSelectedTenantIdOnAdding(
                            TenantList.find(
                              (tenant: any) =>
                                tenant.id == SelectedTenantIdOnAdding
                            ).id
                          );
                        }}
                      >
                        <p>
                          {
                            TenantList.find(
                              (tenant: any) =>
                                tenant.id == SelectedTenantIdOnAdding
                            ).name
                          }
                        </p>
                        <p style={{ fontSize: '10px' }}>
                          {
                            TenantList.find(
                              (tenant: any) =>
                                tenant.id == SelectedTenantIdOnAdding
                            ).phoneNumber
                          }
                        </p>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTenantIdOnAdding('');
                        }}
                        style={{ width: '35px', height: '35px' }}
                      >
                        X
                      </button>
                    </div>
                  )}
                </>
              )}
              {TenantPageSelected === 'New' ? (
                <>
                  <div>
                    Agreement type:{' '}
                    <select
                      value={selectedAgreement}
                      onChange={(e) => setSelectedAgreement(e.target.value)}
                      className="Agreementtype"
                    >
                      <option value="Open-Ended">Open-Ended</option>
                      <option value="Fixed-Term">Fixed-Term Lease</option>
                    </select>
                  </div>
                  <div className="AddTenantContainerinnerElement" style={{}}>
                    <div>
                      Start time:
                      <input
                        type="date"
                        style={{ fontWeight: '700' }}
                        value={startTime}
                        className="StartTime"
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
                  <div className="AddTenantContainerinnerElement">
                    Payment cycle every:{' '}
                    <select
                      className="AddTenantContainerinnerInput"
                      style={{ width: '100px' }}
                      value={paymentCycle}
                      onChange={handlePaymentCycleChange}
                    >
                      <option value="Every 30 days">30 days</option>
                      <option value="Every 15 days">15 days</option>
                      <option value="Every 7 days">7 days</option>
                      <option value="daily">daily</option>

                      <option value="monthly">monthly</option>
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
                </>
              ) : (
                <>
                  {TenantPageSelected === 'Select' &&
                    SelectedTenantIdOnAdding != '' && (
                      <>
                        <div>
                          Agreement type:{' '}
                          <select
                            value={selectedAgreement}
                            onChange={(e) =>
                              setSelectedAgreement(e.target.value)
                            }
                            className="Agreementtype"
                          >
                            <option value="Open-Ended">Open-Ended</option>
                            <option value="Fixed-Term">Fixed-Term Lease</option>
                          </select>
                        </div>
                        <div
                          className="AddTenantContainerinnerElement"
                          style={{}}
                        >
                          <div>
                            Start time:
                            <input
                              type="date"
                              style={{ fontWeight: '700' }}
                              value={startTime}
                              className="StartTime"
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
                        <div className="AddTenantContainerinnerElement">
                          Payment cycle every:{' '}
                          <select
                            className="AddTenantContainerinnerInput"
                            style={{ width: '100px' }}
                            value={paymentCycle}
                            onChange={handlePaymentCycleChange}
                          >
                            <option value="Every 30 days">30 days</option>
                            <option value="Every 15 days">15 days</option>
                            <option value="Every 7 days">7 days</option>
                            <option value="daily">daily</option>

                            <option value="monthly">monthly</option>
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
                            onChange={(e) =>
                              setAgreedPrice(parseInt(e.target.value))
                            }
                          />
                          $
                          <button
                            style={{
                              width: '40px',
                              height: '20px',
                              marginLeft: '10px',
                              background: 'white',
                            }}
                            onClick={() => {
                              setAgreedPrice(roomType.price);
                            }}
                          >
                            Same
                          </button>
                        </div>
                      </>
                    )}
                </>
              )}
            </div>
            <div className="BottomAddTenantContainer">
              <button
                className="AddTenantButton"
                onClick={() => {
                  setName('');
                  setTel1('');
                  setTel2('');
                  setEmail('');
                  setSelectedAgreement('Open-Ended');
                  setStartTime('');
                  setEndTime('');
                  setAgreedPrice(0);
                  updateRoomProperty(roomType.id, 'AddTenantState', false);
                }}
              >
                Cancel
              </button>
              <button
                className="AddTenantButton"
                onClick={() => {
                  handleAddTenantButton();
                }}
              >
                Add
              </button>
            </div>
          </div>
        </div>
        <div
          className="PopOutContainer"
          ref={viewAgreementRef}
          style={{ top: '205px', zIndex: roomType.ViewAgreement ? '1' : '-1' }}
        >
          <div
            className="AddTenantContainerinner"
            style={{
              width: roomType.ViewAgreement ? '280px' : '0px',
              height: roomType.ViewAgreement ? '260px' : '0px',
              opacity: roomType.ViewAgreement ? '1' : '0',
            }}
          >
            <div className="InnerAddtenantTop" style={{ width: '95%' }}>
              <div className="AddTenantContainerinnerElement">
                Name:{' '}
                <em style={{ fontWeight: '600' }}>
                  {
                    TenantList.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    )?.name
                  }
                </em>
              </div>
              <div className="AddTenantContainerinnerElement">
                Tel 1:{' '}
                <em style={{ fontWeight: '600' }}>
                  {
                    TenantList.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    )?.phoneNumber
                  }
                </em>
              </div>
              <div className="AddTenantContainerinnerElement">
                Tel 2:{' '}
                <em style={{ fontWeight: '600' }}>
                  {
                    TenantList.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    )?.phoneNumber2
                  }
                </em>
              </div>
              <div className="AddTenantContainerinnerElement">
                {' '}
                Email:{' '}
                <em style={{ fontWeight: '600' }}>
                  {
                    TenantList.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    )?.email
                  }
                </em>
              </div>
              <div className="AddTenantContainerinnerElement">
                Agreement type:{' '}
                <em style={{ fontWeight: '600' }}>
                  {
                    TenantList.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    )?.SelectedAgreement
                  }
                </em>
              </div>
              <div className="AddTenantContainerinnerElement" style={{}}>
                <div>
                  Start time:
                  <em style={{ fontWeight: '600' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.startTime
                    }
                  </em>
                </div>
              </div>
              {selectedAgreement === 'Fixed-Term' && (
                <div className="AddTenantContainerinnerElement">
                  End time :
                  <em style={{ fontWeight: '600' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.endTime
                    }
                  </em>{' '}
                  {calculateDaysDifference(
                    new Date(startTime),
                    new Date(endTime)
                  )}{' '}
                  Days
                </div>
              )}
              <div className="AddTenantContainerinnerElement">
                Agreed Price:{' '}
                <em style={{ fontWeight: '600' }}>{roomType.AgreedPrice}</em>$
                per{' '}
                <em style={{ fontWeight: '600' }}>
                  {roomType.PaymentCycleType}
                </em>{' '}
                days
              </div>
              <div className="AddTenantContainerinnerElement">
                Payment cycle:{' '}
                <em style={{ fontWeight: '600' }}>
                  {roomType.PaymentCycleType}
                </em>
              </div>
            </div>
            <div className="BottomAddTenantContainer">
              <button
                className="AddTenantButton"
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
          ref={showPayTimeLineRef}
          style={{
            top: '155px',
            left: '-528px',
            zIndex: roomType.ShowPayTimeLine ? '1' : '-1',
          }}
        >
          <div
            className="TimeLineMainContaner"
            style={{
              width: roomType.ShowPayTimeLine ? '500px' : '0px',
              height: roomType.ShowPayTimeLine ? '185px' : '0px',
              opacity: roomType.ShowPayTimeLine ? '1' : '0',
            }}
          >
            <PaymentProgressBar
              paymentData={roomType.AllRoomPayInfo.RoomPayInfo || []}
              setPaymentData={(
                newPaymentData: import('c:/Users/chris/Documents/Projects APPS ---------/Building managment/BMS/src/renderer/Project/TSX/Helpers/PaymentProgressBar').RoomPayInfo[]
              ) =>
                updateRoomProperty(roomType.id, 'AllRoomPayInfo', {
                  RoomPayInfo: newPaymentData.map((payInfo: any) => ({
                    id: payInfo.id,
                    roomId: payInfo.roomId,
                    ...payInfo,
                  })),
                })
              }
              agreedPrice={roomType.AgreedPrice}
            ></PaymentProgressBar>
          </div>
        </div>
      </div>
    </>
  );
};

export default Room;
