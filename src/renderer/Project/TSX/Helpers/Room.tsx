import React, { useEffect, useRef, useState } from 'react';
import '../../CSS/Room.css';
const { v4: uuidv4 } = require('uuid');
import ImageInteractor2 from './GUIs/ImageInteractor2';
import PaymentProgressBarGUI from './GUIs/PaymentProgressBarGUI';
import EditIcon from '../../../assets/assets/Dark mode/Editicon.png';
import DocumentInteractor from './GUIs/DocumentInteractor';
import {
  AddRoomDocuments,
  addValue,
  deleteFolderImages,
  deleteTenantDocumentFolder,
  deleteValue,
  getRoomDocuments,
  getValuesWithSql,
  updateValue,
  uploadTenantDocument,
  uploadTenantDocumentsV2,
} from 'Backend/localServerApis';
import LeavePanel from './LeavePanel';
import EthiopianCalanderConverterMenu from './GUIs/EthiopianCalanderConverterMenu';
import AgreementViewerForRoom from './GUIs/AgreementViewerForRoom';
import { toEthiopianDateString } from 'renderer/Project/JS/Calendar Converter';
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
  setIsUpdatingTenantList,
  setSelectedEditRoomId,
  pastTenantReviewApi,
  brokerApi,
  BrokerList,
  setBrokerList,
  brokersRecommendationListApi,
  updateRoomPropertyLocal,
  agreementApi,
}: {
  roomType: RoomType;
  updateRoomProperty: any;
  turnOffAddTenantStateForAll: any;
  turnOffViewStateForAll: any;
  TenantList: any;
  setTenantList: any;
  tenantAPI: any;
  updateRoomPropertyWithOutRefresh: any;
  roomPaymentInfoApi: any;
  isUpdatingTenantList: any;
  setIsUpdatingTenantList: any;
  setSelectedEditRoomId: any;
  pastTenantReviewApi: any;
  brokerApi: any;
  BrokerList: any;
  setBrokerList: any;
  brokersRecommendationListApi: any;
  updateRoomPropertyLocal: any;
  agreementApi: any;
}) => {
  const handleAddTenant = () => {
    turnOffAddTenantStateForAll();
    updateRoomProperty(roomType.id, 'AddTenantState', !roomType.AddTenantState);
  };
  const [name, setName] = useState('');
  const [tel1, setTel1] = useState('');
  const [tel2, setTel2] = useState('');
  const [email, setEmail] = useState('');
  const [TIN, setTIN] = useState('');
  const [RentReason, setRentReason] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<
    'Open-Ended' | 'Fixed-Term'
  >('Open-Ended');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [signDate, setSignDate] = useState('');
  const [Representative, setRepresentative] = useState('');
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
  const handleTenantSelectWhenNew = async () => {
    // Find the tenant in the TenantList
    const tenantIndex = TenantList.findIndex(
      (tenant: any) => tenant.id === SelectedTenantIdOnAdding
    );
    const tenant = TenantList[tenantIndex];
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
    console.log('reached1');
    if (selectedAgreement === 'Fixed-Term') {
      const startDate = new Date(startTime);
      const endDate = new Date(endTime);
      let currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        roomPaymentInfoApi.addRoomPaymentApiWithOutRefresh(
          uuidv4(),
          roomType.id,
          currentDate.getTime(),
          false,
          agreedPrice
        );

        if (paymentCycle === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + interval);
        }
      }
    } else {
      for (let i = 0; i < 10; i++) {
        console.log('reached');

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
          false,
          agreedPrice
        );
      }
    }

    if (AddTenantUseBrokerState) {
      brokersRecommendationListApi.AddBrokerRecommendation(
        uuidv4(),
        AddTenantSelectedBrokerId,
        roomType.id,
        tenant.id,
        Date.now(),
        isPercentCommission
          ? (commissionValue / 100) * agreedPrice
          : commissionValue
      );
      await updateValue(
        'brokers',
        AddTenantSelectedBrokerId,
        'RecommendedTenantsIdList',
        [
          ...BrokerList.find(
            (b: BrokerType) => b.id === AddTenantSelectedBrokerId
          ).RecommendedTenantsIdList,
          tenant.id,
        ]
      );
    }
    let DocumentFiles = [];
    const roomDocs = await getRoomDocuments('Add a tenant documents');
    if (roomDocs && roomDocs.documents) {
      DocumentFiles = roomDocs.documents;
      for (let i = 0; i < DocumentFiles.length; i++) {
        const element = DocumentFiles[i];
        const fileName = element.split('\\').pop().split('/').pop();
        const fileContent = await window.electron.ipcRenderer.invoke(
          'read-file',
          element
        );
        const blob = new Blob([fileContent]);
        const file = new File([blob], fileName, {
          type: 'application/octet-stream',
        });
        console.log(file);
        await uploadTenantDocumentsV2(
          [file],
          roomType.id,
          tenant.name,
          tenant.id,
          new Date(tenant.startTime).toDateString()
        );
      }
      await deleteTenantDocumentFolder();
    } else {
      DocumentFiles = [];
    }
    SetRefreshState(true);
    const paymentCycleType2 =
      paymentCycle === 'custom'
        ? ('-' + customDays).toString()
        : roomType.PaymentCycleType;
    //fixed term lease
    if (selectedAgreement === 'Fixed-Term') {
      const AgreementId = uuidv4();
      agreementApi.addAgreementApi(
        AgreementId,
        roomType.id,
        tenant.id,
        new Date(startTime).getTime(),
        new Date(endTime).getTime(),
        new Date(signDate).getTime(),
        agreedPrice,
        paymentCycleType2,
        '',
        '',
        Representative
      );
      updateRoomProperty(roomType.id, 'selectedAgreementId', AgreementId);
    }
    await handlePaymentRefresh();
  };
  const getCorrectPaymentStatment = (text: string, custom: string) => {
    switch (text) {
      case '30':
      case 'Every 30 days':
        return '30 days';
      case '15':
      case 'Every 15 days':
        return '15 days';
      case '7':
      case 'Every 7 days':
        return '7 days';
      case 'monthly':
        return 'month';
      case 'weekly':
        return 'week';
      case 'daily':
        return 'day';
      default:
        return custom + ' days';
    }
    handlePaymentRefresh;
  };
  const handleAddTenantButton = async () => {
    if (AddTenantUseBrokerState && AddTenantSelectedBrokerId == '') return;
    if (isNaN(new Date(startTime).getTime())) return;
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
        TIN: TIN,
        RentReason: RentReason,
        AddedTime: Date.now(),
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
      updateRoomProperty(
        roomType.id,
        'Price',
        agreedPrice ? roomType.price : agreedPrice
      );
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
        tenant.agreedPrice,
        tenant.TIN,
        tenant.RentReason,
        tenant.AddedTime
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
        interval = 30; // Default to 30 days if the payment cycle is invalid
      }
      console.log('reached1');

      if (selectedAgreement === 'Fixed-Term') {
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          roomPaymentInfoApi.addRoomPaymentApiWithOutRefresh(
            uuidv4(),
            roomType.id,
            currentDate.getTime(),
            false,
            agreedPrice
          );

          if (paymentCycle === 'monthly') {
            currentDate.setMonth(currentDate.getMonth() + 1);
          } else {
            currentDate.setDate(currentDate.getDate() + interval);
          }
        }
      } else {
        for (let i = 0; i < 10; i++) {
          console.log('reached');

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
            false,
            agreedPrice
          );
        }
      }

      if (AddTenantUseBrokerState) {
        brokersRecommendationListApi.AddBrokerRecommendation(
          uuidv4(),
          AddTenantSelectedBrokerId,
          roomType.id,
          tenant.id,
          Date.now(),
          isPercentCommission
            ? (commissionValue / 100) * agreedPrice
            : commissionValue
        );
        await updateValue(
          'brokers',
          AddTenantSelectedBrokerId,
          'RecommendedTenantsIdList',
          [
            ...BrokerList.find(
              (b: BrokerType) => b.id === AddTenantSelectedBrokerId
            ).RecommendedTenantsIdList,
            tenant.id,
          ]
        );
      }
      let DocumentFiles = [];
      const roomDocs = await getRoomDocuments('Add a tenant documents');
      if (roomDocs && roomDocs.documents) {
        DocumentFiles = roomDocs.documents;
        for (let i = 0; i < DocumentFiles.length; i++) {
          const element = DocumentFiles[i];
          const fileName = element.split('\\').pop().split('/').pop();
          const fileContent = await window.electron.ipcRenderer.invoke(
            'read-file',
            element
          );
          const blob = new Blob([fileContent]);
          const file = new File([blob], fileName, {
            type: 'application/octet-stream',
          });
          console.log(file);
          await uploadTenantDocumentsV2(
            [file],
            roomType.id,
            tenant.name,
            tenant.id,
            new Date(tenant.startTime).toDateString()
          );
        }
        await deleteTenantDocumentFolder();
      } else {
        DocumentFiles = [];
      }
      SetRefreshState(true);
      const paymentCycleType2 =
        paymentCycle === 'custom'
          ? ('-' + customDays).toString()
          : paymentCycle;
      //fixed term lease
      if (selectedAgreement === 'Fixed-Term') {
        const AgreementId = uuidv4();
        agreementApi.addAgreementApi(
          AgreementId,
          roomType.id,
          tenant.id,
          new Date(startTime).getTime(),
          new Date(endTime).getTime(),
          new Date(signDate).getTime(),
          agreedPrice,
          paymentCycleType2,
          '',
          '',
          Representative
        );
        updateRoomProperty(roomType.id, 'selectedAgreementId', AgreementId);
      }
    }
    await handlePaymentRefresh();
  };
  const [refreshState, SetRefreshState] = useState(false);
  const extendPaymentSchedule = async () => {
    if (!roomType.AllRoomPayInfo || !roomType.AllRoomPayInfo.RoomPayInfo)
      return;

    const existingPayments = new Set(
      roomType.AllRoomPayInfo.RoomPayInfo.map((payment) =>
        new Date(payment.Day).setUTCHours(0, 0, 0, 0)
      )
    );

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
    console.log(
      paymentIntervals,
      roomType.PaymentCycleType,
      ' new ',
      roomType.PaymentCycleType
    );
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
      paymentIntervals[
        roomType.PaymentCycleType as keyof typeof paymentIntervals
      ];
    if (!interval || isNaN(interval)) {
      console.error(
        `Invalid payment cycle: ${roomType.PaymentCycleType}. Defaulting to 30 days.`
      );
      interval = 30; // Default to 30 days if the payment cycle is invalid
    }

    let i = 1;
    let newPaymentsAdded = 0;
    while (newPaymentsAdded < 10) {
      const paymentDay = getPaymentDay(
        interval,
        lastPaymentDate,
        i,
        roomType.PaymentCycleType
      );
      const paymentDayUTC = paymentDay.setUTCHours(0, 0, 0, 0);

      if (!existingPayments.has(paymentDayUTC)) {
        await roomPaymentInfoApi.addRoomPaymentApiWithOutRefresh(
          uuidv4(),
          roomType.id,
          paymentDay.getTime(),
          false,
          roomType.AgreedPrice
        );
        existingPayments.add(paymentDayUTC);
        newPaymentsAdded++;
      }
      i++;
    }
    handlePaymentRefresh();
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
  const handleTenantLeft = async () => {
    // Find the tenant in the TenantList
    const tenantIndex = TenantList.findIndex(
      (tenant: any) => tenant.id === roomType.tenantId
    );
    const allPayInfos = await getValuesWithSql(
      'room_pay_info',
      `WHERE roomId = '${roomType.id}'`
    );
    let totalEarningsFromTenant = 0;
    if (allPayInfos) {
      for (let i = 0; i < allPayInfos.length; i++) {
        const element = allPayInfos[i];
        if (element.Paid) {
          totalEarningsFromTenant += roomType.AgreedPrice;
        }
      }
    }
    let agreedCommissionForBroker = (
      await getValuesWithSql(
        'brokersRecommendationList',
        `WHERE roomId = '${roomType.id}'`
      )
    ).sort((a: any, b: any) => b.AddedTime - a.AddedTime);
    if (agreedCommissionForBroker.length > 0) {
    } else {
    }
    addValue('PastTenantsForRoom', {
      id: uuidv4(),
      roomId: roomType.id,
      brokerId:
        agreedCommissionForBroker.length > 0
          ? agreedCommissionForBroker[0].brokerId
          : '',
      tenantId: roomType.tenantId,
      enterDate: new Date(
        TenantList.find((t: tenant) => t.id === roomType.tenantId).startTime
      ).getTime(),
      exitDate: Date.now(),
      totalEarnings: totalEarningsFromTenant,
      paymentCycleType:
        roomType.PaymentCycleType === 'custom'
          ? ('-' + roomType.PaymentCycleCustomeDays).toString()
          : roomType.PaymentCycleType,
      AgreedPrice: roomType.AgreedPrice,
      AgreedCommission:
        agreedCommissionForBroker.length > 0
          ? agreedCommissionForBroker[0].AgreedCommission
          : 0,
      Stars: tenantRating,
      description: tenantDescription,
      endReason: endReason,
    });
    setEndReason('');
    setTenantDescription('');
    setTenantRating(0);
    if (tenantIndex !== -1) {
      // Update the tenant's RentingOrOut status to false
      tenantAPI.EditTenantApi(roomType.tenantId, 'RentingOrOut', false);

      // Update the room's status to 'Empty'
      updateRoomPropertyWithOutRefresh(roomType.id, 'status', 'Empty');

      // Clear the room's tenantId
      updateRoomPropertyWithOutRefresh(roomType.id, 'tenantId', '');

      // Clear the room's AgreedPrice
      updateRoomPropertyWithOutRefresh(roomType.id, 'AgreedPrice', 0);

      // Clear the room's PaymentCycleType
      updateRoomPropertyWithOutRefresh(roomType.id, 'PaymentCycleType', '');

      // Clear the room's PaymentCycleCustomeDays
      updateRoomPropertyWithOutRefresh(
        roomType.id,
        'PaymentCycleCustomeDays',
        0
      );

      const listOfPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${roomType.id}'`
      );
      if (listOfPayments)
        for (let i = 0; i < listOfPayments.length; i++) {
          const element = listOfPayments[i];
          deleteValue('room_pay_info', element.id);
        }

      // Reset the room's AddTenantState
      updateRoomProperty(roomType.id, 'AddTenantState', 0);
      updateRoomProperty(roomType.id, 'ViewAgreement', 0);

      setTenantLeavePannelState(false);
    }
  };

  const [TenantLeavePannelState, setTenantLeavePannelState] = useState(false);
  const [extraPayments, setExtraPayments] = useState('');
  const [tenantRating, setTenantRating] = useState(0);
  const [tenantDescription, setTenantDescription] = useState('');
  const [endReason, setEndReason] = useState('');

  const [TenantReviews, setTenantReviews] = useState([]);

  const [AddTenantUseBrokerState, setAddTenantUseBrokerState] = useState(false);
  const [AddTenantAddBrokerState, setAddTenantAddBrokerState] = useState(false);
  const [AddTenantSelectedBrokerId, setAddTenantSelectedBrokerId] =
    useState('');

  const [AddTenantAddBrokerFormName, setAddTenantAddBrokerFormName] =
    useState('');
  const [
    AddTenantAddBrokerFormPhoneNumber,
    setAddTenantAddBrokerFormPhoneNumber,
  ] = useState('');
  const [
    AddTenantAddBrokerFormPhoneNumber2,
    setAddTenantAddBrokerFormPhoneNumber2,
  ] = useState('');
  const [AddTenantAddBrokerFormEmail, setAddTenantAddBrokerFormEmail] =
    useState('');
  const [
    AddTenantAddBrokerFormAgreedCommission,
    setAddTenantAddBrokerFormAgreedCommission,
  ] = useState('');
  const [AddTenantAddBrokerFormRating, setAddTenantAddBrokerFormRating] =
    useState(0);
  const [AddTenantAddBrokerFormNotes, setAddTenantAddBrokerFormNotes] =
    useState('');
  const handleAddBroker = () => {
    if (
      AddTenantAddBrokerFormName.length >= 2 &&
      AddTenantAddBrokerFormPhoneNumber.length >= 2
    ) {
      const broker: BrokerType = {
        id: uuidv4(),
        name: AddTenantAddBrokerFormName,
        phoneNumber: AddTenantAddBrokerFormPhoneNumber,
        phoneNumber2: AddTenantAddBrokerFormPhoneNumber2 || '',
        email: AddTenantAddBrokerFormEmail || '',
        RecommendedTenantsIdList: [],
        AddedTime: Date.now(),
        AgreedCommission: AddTenantAddBrokerFormAgreedCommission,
        rating: AddTenantAddBrokerFormRating,
        notes: AddTenantAddBrokerFormNotes,
      };
      brokerApi.addBrokerApi(broker);
      setAddTenantAddBrokerFormName('');
      setAddTenantAddBrokerFormPhoneNumber('');
      setAddTenantAddBrokerFormPhoneNumber2('');
      setAddTenantAddBrokerFormEmail('');
      setAddTenantAddBrokerFormAgreedCommission('');
      setAddTenantAddBrokerFormRating(0);
      setAddTenantAddBrokerFormNotes('');

      setAddTenantSelectedBrokerId(broker.id);
      setAddTenantAddBrokerState(false);
    }
  };
  const [searchBroker, setSearchBroker] = useState('');
  const filteredBrokerList = BrokerList.filter((broker: any) =>
    broker.name.toLowerCase().includes(searchBroker.toLowerCase())
  );

  const handleSearchBroker = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBroker(event.target.value);
  };

  const [isPercentCommission, setIsPercentCommission] = useState(true);
  const [commissionValue, setCommissionValue] = useState<number>(0);

  const handlePaymentRefresh = async () => {
    const listOfPayments = await getValuesWithSql(
      'room_pay_info',
      `WHERE roomId = '${roomType.id}'`
    );

    const updatedRoomPayInfo: RoomPayInfo[] = listOfPayments.map(
      (payment: any) => ({
        id: payment.id,
        roomId: payment.roomId,
        Day: payment.Day,
        Paid: payment.Paid,
        Value: payment.Value,
      })
    );

    const updatedAllRoomPayInfo: AllRoomPayInfo = {
      RoomPayInfo: updatedRoomPayInfo,
    };

    updateRoomPropertyLocal(
      roomType.id,
      'AllRoomPayInfo',
      updatedAllRoomPayInfo
    );
    console.log(updatedAllRoomPayInfo, roomType.AllRoomPayInfo);
  };
  const [TypeOfRoomState, setTypeOfRoomState] = useState(true);
  const [ShowConverter, setShowConverter] = useState(false);
  const [ShowConverterEndDate, setShowConverterEndDate] = useState(false);
  const [ShowConverterSignDate, setShowConverterSignDate] = useState(false);

  return (
    <>
      <div
        className="MainContainer"
        style={{
          background: roomType.AddTenantState
            ? '#2C2C30'
            : roomType.status === 'Empty'
            ? '#14325'
            : '#63809d',
          border: roomType.AddTenantState ? '1px solid #00e1f1' : '',
        }}
      >
        <div className="FirstLine">
          <div style={{ display: 'flex' }}>
            <p className="FloorText">Floor {roomType.floor}</p>{' '}
            <img
              onClick={() => {
                setSelectedEditRoomId(roomType.id);
              }}
              src={EditIcon}
              style={{ width: '23px', height: '23px', marginLeft: '10px' }}
              alt=""
            />
            {roomType.status === 'Empty' && (
              <button
                onClick={() => {
                  updateRoomProperty(
                    roomType.id,
                    'Archived',
                    !roomType.Archived
                  );
                }}
              >
                {roomType.Archived ? 'Unarchive' : 'Archive'}
              </button>
            )}
          </div>
          <p className="RoomText">Room {roomType.roomIndex}</p>

          <div className="StatusContainer">
            <div className="StatusText">
              <p>
                Current Status:{' '}
                {roomType.status === 'Taken' ? (
                  <strong>Taken by </strong>
                ) : (
                  <>Empty</>
                )}
              </p>
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
                          width: '134px',
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
            </div>
          </div>
        </div>
        <div className="SecondLine">
          <div className="PriceMainContainer">
            <div className="PriceContainer">
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',

                  justifyContent: 'center',
                }}
              >
                {roomType.status === 'Empty' ? (
                  <>
                    <div>
                      Price: <strong>{roomType.price.toLocaleString()}$</strong>
                    </div>{' '}
                    <p style={{ fontSize: '12px' }}>
                      Every{' '}
                      {getCorrectPaymentStatment(
                        roomType.PaymentCycleType,
                        roomType.PaymentCycleCustomeDays.toString()
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <div>
                      Price:{' '}
                      <strong>{roomType.AgreedPrice.toLocaleString()}$</strong>
                    </div>{' '}
                    <p style={{ fontSize: '12px' }}>
                      Every{' '}
                      {getCorrectPaymentStatment(
                        roomType.PaymentCycleType,
                        roomType.PaymentCycleCustomeDays.toString()
                      )}
                    </p>
                  </>
                )}
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
                  if (
                    !roomType.ShowPayTimeLine &&
                    roomType.AllRoomPayInfo.RoomPayInfo.length === 0
                  ) {
                  }
                }}
              >
                {roomType.ShowPayTimeLine ? 'Hide' : 'Show'}
              </button>
            </div>
          )}
        </div>
        <div className="ThirdLine">
          {TypeOfRoomState ? (
            <>
              {' '}
              <div className="RoomTypeContainer">
                <div
                  style={{ display: 'flex', justifyContent: 'space-around' }}
                >
                  {' '}
                  Type of Room{' '}
                  <div
                    onClick={() => {
                      setTypeOfRoomState(false);
                    }}
                  >
                    {'▶'}
                  </div>
                </div>

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
                  style={{
                    textAlign: 'center',
                    paddingLeft: 0,
                    fontSize: '17px',
                  }}
                >
                  {roomType.squareMeters} square meters
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="RoomImageContainer">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    width: '100%',
                  }}
                >
                  <div
                    onClick={() => {
                      setTypeOfRoomState(true);
                    }}
                  >
                    {'◀'}
                  </div>
                  Images{' '}
                </div>
                <div
                  style={{ width: '95%', height: '81%', borderRadius: '5px' }}
                >
                  {' '}
                  <ImageInteractor2 room={roomType} />
                </div>
              </div>
            </>
          )}
        </div>

        <div
          className="PopOutContainer"
          ref={addTenantRef}
          style={{ zIndex: roomType.AddTenantState ? '1' : '-1', top: '216px' }}
        >
          <div
            className="AddTenantContainerinner"
            style={{
              width: roomType.AddTenantState ? '325px' : '0px',
              height: roomType.AddTenantState ? '345px' : '0px',
              opacity: roomType.AddTenantState ? '1' : '0',
              userSelect: 'text',
              overflowY: 'auto',
              fontSize: '17px',
              paddingBottom: '15px',
            }}
          >
            <div className="InnerAddtenantTop" style={{ height: '100%' }}>
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
                  <div className="AddTenantContainerinnerElement">
                    TIN:{' '}
                    <input
                      className="AddTenantContainerinnerInput"
                      placeholder="Optional"
                      value={TIN}
                      onChange={(e) => setTIN(e.target.value)}
                    />
                  </div>
                  <div className="AddTenantContainerinnerElement">
                    Rent Reason:{' '}
                    <input
                      className="AddTenantContainerinnerInput"
                      placeholder="Optional"
                      style={{ width: '60%' }}
                      value={RentReason}
                      onChange={(e) => setRentReason(e.target.value)}
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
                      <div className="TenantRow" key={tenant.id}>
                        <div>
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
                        </div>
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
              <hr />
              {TenantPageSelected === 'New' ? (
                <>
                  <div>
                    Agreement type:{' '}
                    <select
                      value={selectedAgreement}
                      onChange={(e) =>
                        setSelectedAgreement(
                          e.target.value as 'Open-Ended' | 'Fixed-Term'
                        )
                      }
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
                    {selectedAgreement === 'Fixed-Term' && (
                      <>
                        <div>
                          End time:
                          <input
                            type="date"
                            value={endTime}
                            className="StartTime"
                            style={{ fontWeight: '700' }}
                            onChange={(e) => setEndTime(e.target.value)}
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
                                setEndTime(date.toISOString().split('T')[0]);
                                setShowConverterEndDate(false);
                              }}
                            ></EthiopianCalanderConverterMenu>
                          )}{' '}
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
                      </>
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
                  <hr />
                  <div
                    className="AddTenantContainerinnerElement"
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    Track broker:{' '}
                    <input
                      type="checkbox"
                      style={{ width: '20px' }}
                      checked={AddTenantUseBrokerState}
                      onChange={(e) => {
                        setAddTenantUseBrokerState(e.target.checked);
                      }}
                    />
                    {AddTenantUseBrokerState &&
                      AddTenantSelectedBrokerId == '' && (
                        <button
                          onClick={() => {
                            setAddTenantAddBrokerState(
                              !AddTenantAddBrokerState
                            );
                          }}
                        >
                          {AddTenantAddBrokerState
                            ? 'Cancel add'
                            : 'Add new broker'}
                        </button>
                      )}
                  </div>
                  {AddTenantUseBrokerState && (
                    <>
                      {AddTenantAddBrokerState ? (
                        <>
                          <input
                            type="text"
                            placeholder="Name"
                            value={AddTenantAddBrokerFormName}
                            onChange={(e) =>
                              setAddTenantAddBrokerFormName(e.target.value)
                            }
                          />
                          <input
                            type="text"
                            placeholder="Phone Number"
                            value={AddTenantAddBrokerFormPhoneNumber}
                            onChange={(e) =>
                              setAddTenantAddBrokerFormPhoneNumber(
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="text"
                            placeholder="Phone Number 2"
                            value={AddTenantAddBrokerFormPhoneNumber2}
                            onChange={(e) =>
                              setAddTenantAddBrokerFormPhoneNumber2(
                                e.target.value
                              )
                            }
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            value={AddTenantAddBrokerFormEmail}
                            onChange={(e) =>
                              setAddTenantAddBrokerFormEmail(e.target.value)
                            }
                          />

                          <button
                            onClick={() => {
                              handleAddBroker();
                            }}
                          >
                            Add
                          </button>
                        </>
                      ) : (
                        <>
                          {AddTenantSelectedBrokerId !== '' ? (
                            <>
                              {BrokerList.find(
                                (broker: BrokerType) =>
                                  broker.id === AddTenantSelectedBrokerId
                              ) && (
                                <div
                                  className="TenantRow"
                                  key={
                                    BrokerList.find(
                                      (broker: BrokerType) =>
                                        broker.id === AddTenantSelectedBrokerId
                                    )?.id
                                  }
                                >
                                  <div>
                                    <button
                                      onClick={() => {
                                        setAddTenantSelectedBrokerId(
                                          BrokerList.find(
                                            (broker: BrokerType) =>
                                              broker.id ===
                                              AddTenantSelectedBrokerId
                                          )?.id || ''
                                        );
                                      }}
                                    >
                                      <p>
                                        {
                                          BrokerList.find(
                                            (broker: BrokerType) =>
                                              broker.id ===
                                              AddTenantSelectedBrokerId
                                          )?.name
                                        }
                                      </p>
                                      <p style={{ fontSize: '10px' }}>
                                        {
                                          BrokerList.find(
                                            (broker: BrokerType) =>
                                              broker.id ===
                                              AddTenantSelectedBrokerId
                                          )?.phoneNumber
                                        }
                                      </p>
                                    </button>
                                  </div>
                                  {AddTenantSelectedBrokerId !== '' && (
                                    <button
                                      onClick={() => {
                                        setAddTenantSelectedBrokerId('');
                                      }}
                                      style={{ width: '35px', height: '35px' }}
                                    >
                                      X
                                    </button>
                                  )}
                                </div>
                              )}
                              {/* Commission Section */}

                              <div>
                                Commission:{' '}
                                <input
                                  type="number"
                                  style={{
                                    width: !isPercentCommission
                                      ? '80px'
                                      : '40px',
                                  }}
                                  value={commissionValue}
                                  onChange={(e) =>
                                    setCommissionValue(
                                      parseFloat(e.target.value)
                                    )
                                  }
                                  className="AddTenantContainerinnerInput"
                                  placeholder={
                                    isPercentCommission
                                      ? 'Enter percent'
                                      : 'Enter number'
                                  }
                                />
                                {isPercentCommission && (
                                  <>
                                    %{' '}
                                    <em style={{ color: 'grey' }}>
                                      {commissionValue != '' &&
                                        (commissionValue / 100) * agreedPrice}
                                    </em>
                                  </>
                                )}
                                {!isPercentCommission && '$'}
                                <br />{' '}
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={isPercentCommission}
                                    onChange={() =>
                                      setIsPercentCommission(true)
                                    }
                                  />
                                  Percentage
                                </label>
                                <label>
                                  <input
                                    type="checkbox"
                                    checked={!isPercentCommission}
                                    onChange={() =>
                                      setIsPercentCommission(false)
                                    }
                                  />
                                  Number
                                </label>
                              </div>
                            </>
                          ) : (
                            <>
                              <input
                                type="text"
                                placeholder="Search broker"
                                value={searchBroker}
                                onChange={handleSearchBroker}
                              />{' '}
                              {filteredBrokerList.map((broker: BrokerType) => (
                                <div className="TenantRow" key={broker.id}>
                                  <div>
                                    <button
                                      onClick={() => {
                                        setAddTenantSelectedBrokerId(broker.id);
                                      }}
                                    >
                                      <p>{broker.name}</p>
                                      <p style={{ fontSize: '10px' }}>
                                        {broker.phoneNumber}
                                      </p>
                                    </button>
                                  </div>
                                  <div>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <span
                                        key={star}
                                        style={{
                                          color:
                                            broker.rating >= star
                                              ? 'gold'
                                              : 'grey',
                                        }}
                                      >
                                        ★
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </>
                          )}
                        </>
                      )}
                    </>
                  )}
                  <hr />
                  <DocumentInteractor
                    room={roomType}
                    TenantsList={TenantList}
                    AddTenant={true}
                    isAddRoomDocument={true}
                    SetRefreshState={SetRefreshState}
                    refreshState={refreshState}
                  />
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
                              setSelectedAgreement(
                                e.target.value as 'Open-Ended' | 'Fixed-Term'
                              )
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
                              marginLeft: '10px',
                            }}
                            onClick={() => {
                              setAgreedPrice(roomType.price);
                            }}
                          >
                            Same
                          </button>
                        </div>
                        <hr />
                        <div
                          className="AddTenantContainerinnerElement"
                          style={{ display: 'flex', alignItems: 'center' }}
                        >
                          Track broker:{' '}
                          <input
                            type="checkbox"
                            style={{ width: '20px' }}
                            checked={AddTenantUseBrokerState}
                            onChange={(e) => {
                              setAddTenantUseBrokerState(e.target.checked);
                            }}
                          />
                          {AddTenantUseBrokerState &&
                            AddTenantSelectedBrokerId == '' && (
                              <button
                                onClick={() => {
                                  setAddTenantAddBrokerState(
                                    !AddTenantAddBrokerState
                                  );
                                }}
                              >
                                {AddTenantAddBrokerState
                                  ? 'Cancel add'
                                  : 'Add new broker'}
                              </button>
                            )}
                        </div>
                        {AddTenantUseBrokerState && (
                          <>
                            {AddTenantAddBrokerState ? (
                              <>
                                <input
                                  type="text"
                                  placeholder="Name"
                                  value={AddTenantAddBrokerFormName}
                                  onChange={(e) =>
                                    setAddTenantAddBrokerFormName(
                                      e.target.value
                                    )
                                  }
                                />
                                <input
                                  type="text"
                                  placeholder="Phone Number"
                                  value={AddTenantAddBrokerFormPhoneNumber}
                                  onChange={(e) =>
                                    setAddTenantAddBrokerFormPhoneNumber(
                                      e.target.value
                                    )
                                  }
                                />
                                <input
                                  type="text"
                                  placeholder="Phone Number 2"
                                  value={AddTenantAddBrokerFormPhoneNumber2}
                                  onChange={(e) =>
                                    setAddTenantAddBrokerFormPhoneNumber2(
                                      e.target.value
                                    )
                                  }
                                />
                                <input
                                  type="email"
                                  placeholder="Email"
                                  value={AddTenantAddBrokerFormEmail}
                                  onChange={(e) =>
                                    setAddTenantAddBrokerFormEmail(
                                      e.target.value
                                    )
                                  }
                                />

                                <button
                                  onClick={() => {
                                    handleAddBroker();
                                  }}
                                >
                                  Add
                                </button>
                              </>
                            ) : (
                              <>
                                {AddTenantSelectedBrokerId !== '' ? (
                                  <>
                                    {BrokerList.find(
                                      (broker: BrokerType) =>
                                        broker.id === AddTenantSelectedBrokerId
                                    ) && (
                                      <div
                                        className="TenantRow"
                                        key={
                                          BrokerList.find(
                                            (broker: BrokerType) =>
                                              broker.id ===
                                              AddTenantSelectedBrokerId
                                          )?.id
                                        }
                                      >
                                        <div>
                                          <button
                                            onClick={() => {
                                              setAddTenantSelectedBrokerId(
                                                BrokerList.find(
                                                  (broker: BrokerType) =>
                                                    broker.id ===
                                                    AddTenantSelectedBrokerId
                                                )?.id || ''
                                              );
                                            }}
                                          >
                                            <p>
                                              {
                                                BrokerList.find(
                                                  (broker: BrokerType) =>
                                                    broker.id ===
                                                    AddTenantSelectedBrokerId
                                                )?.name
                                              }
                                            </p>
                                            <p style={{ fontSize: '10px' }}>
                                              {
                                                BrokerList.find(
                                                  (broker: BrokerType) =>
                                                    broker.id ===
                                                    AddTenantSelectedBrokerId
                                                )?.phoneNumber
                                              }
                                            </p>
                                          </button>
                                        </div>
                                        {AddTenantSelectedBrokerId !== '' && (
                                          <button
                                            onClick={() => {
                                              setAddTenantSelectedBrokerId('');
                                            }}
                                            style={{
                                              width: '35px',
                                              height: '35px',
                                            }}
                                          >
                                            X
                                          </button>
                                        )}
                                      </div>
                                    )}
                                    <div>
                                      Commission:{' '}
                                      <input
                                        type="number"
                                        style={{
                                          width: !isPercentCommission
                                            ? '80px'
                                            : '40px',
                                        }}
                                        value={commissionValue}
                                        onChange={(e) =>
                                          setCommissionValue(
                                            parseFloat(e.target.value)
                                          )
                                        }
                                        className="AddTenantContainerinnerInput"
                                        placeholder={
                                          isPercentCommission
                                            ? 'Enter percent'
                                            : 'Enter number'
                                        }
                                      />
                                      {isPercentCommission && (
                                        <>
                                          %{' '}
                                          <em style={{ color: 'grey' }}>
                                            {commissionValue != '' &&
                                              (commissionValue / 100) *
                                                agreedPrice}
                                          </em>
                                        </>
                                      )}
                                      {!isPercentCommission && '$'}
                                      <br />{' '}
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={isPercentCommission}
                                          onChange={() =>
                                            setIsPercentCommission(true)
                                          }
                                        />
                                        Percentage
                                      </label>
                                      <label>
                                        <input
                                          type="checkbox"
                                          checked={!isPercentCommission}
                                          onChange={() =>
                                            setIsPercentCommission(false)
                                          }
                                        />
                                        Number
                                      </label>
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <input
                                      type="text"
                                      placeholder="Search broker"
                                      value={searchBroker}
                                      onChange={handleSearchBroker}
                                    />{' '}
                                    {filteredBrokerList.map(
                                      (broker: BrokerType) => (
                                        <div
                                          className="TenantRow"
                                          key={broker.id}
                                        >
                                          <div>
                                            <button
                                              onClick={() => {
                                                setAddTenantSelectedBrokerId(
                                                  broker.id
                                                );
                                              }}
                                            >
                                              <p>{broker.name}</p>
                                              <p style={{ fontSize: '10px' }}>
                                                {broker.phoneNumber}
                                              </p>
                                            </button>
                                          </div>
                                          <div>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <span
                                                key={star}
                                                style={{
                                                  color:
                                                    broker.rating >= star
                                                      ? 'gold'
                                                      : 'grey',
                                                }}
                                              >
                                                ★
                                              </span>
                                            ))}
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        )}
                        <hr />
                        <DocumentInteractor
                          room={roomType}
                          TenantsList={TenantList}
                          AddTenant={true}
                          isAddRoomDocument={true}
                          SetRefreshState={SetRefreshState}
                          refreshState={refreshState}
                        />
                      </>
                    )}
                </>
              )}
              <div
                className="BottomAddTenantContainer"
                style={{
                  display: 'flex',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                }}
              >
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
        </div>
        <div
          className="PopOutContainer"
          ref={viewAgreementRef}
          style={{
            top: '310px',
            zIndex: roomType.ViewAgreement ? '1' : '-1',
          }}
        >
          <div
            className="ViewAgreementContainer"
            style={{
              width: roomType.ViewAgreement ? '400px' : '0px',
              height: roomType.ViewAgreement ? '470px' : '0px',
              opacity: roomType.ViewAgreement ? '1' : '0',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="InnerAddtenantTop" style={{ width: '100%' }}>
                <p
                  className="DashboardWigetPieChartTextHeader"
                  style={{ width: '400px', fontSize: '20px' }}
                >
                  Tenant Information
                </p>
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: 'GREY',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>Name:</span>{' '}
                  <em style={{ fontWeight: '600', color: '#02b2af' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.name
                    }
                  </em>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: 'GREY',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>Tel 1:</span>{' '}
                  <em style={{ fontWeight: '600', color: '#02b2af' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.phoneNumber
                    }
                  </em>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: 'GREY',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>Tel 2:</span>{' '}
                  <em style={{ fontWeight: '600', color: '#02b2af' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.phoneNumber2
                    }
                  </em>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: 'GREY',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>Email:</span>{' '}
                  <em style={{ fontWeight: '600', color: '#02b2af' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.email
                    }
                  </em>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: 'GREY',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>TIN:</span>{' '}
                  <em style={{ fontWeight: '600', color: '#02b2af' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.TIN
                    }
                  </em>
                </div>
                <div
                  style={{
                    marginBottom: '10px',
                    fontSize: '16px',
                    color: 'GREY',
                  }}
                >
                  <span style={{ fontWeight: 'bold' }}>Rent Reason:</span>{' '}
                  <em style={{ fontWeight: '600', color: '#02b2af' }}>
                    {
                      TenantList.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      )?.RentReason
                    }
                  </em>
                </div>
                <hr />
                <p
                  className="DashboardWigetPieChartTextHeader"
                  style={{ width: '400px', fontSize: '20px' }}
                >
                  Agreement Info
                </p>
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
                {TenantList.find(
                  (tenant: any) => tenant.id === roomType.tenantId
                )?.SelectedAgreement !== 'Fixed-Term' ? (
                  <>
                    <div className="AddTenantContainerinnerElement" style={{}}>
                      <div>
                        Start time:
                        <em
                          style={{ fontWeight: '600' }}
                          title={toEthiopianDateString(
                            new Date(
                              TenantList.find(
                                (tenant: any) => tenant.id === roomType.tenantId
                              )?.startTime
                            )
                          )}
                        >
                          {new Date(
                            TenantList.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.startTime
                          ).toDateString()}
                        </em>
                      </div>
                    </div>
                    <div className="AddTenantContainerinnerElement">
                      Agreed Price:{' '}
                      <em style={{ fontWeight: '600' }}>
                        {roomType.AgreedPrice}
                      </em>
                      $ per{' '}
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
                  </>
                ) : (
                  <>
                    <AgreementViewerForRoom
                      updateRoomPropertyLocal={updateRoomPropertyLocal}
                      getCorrectPaymentStatment={getCorrectPaymentStatment}
                      TenantList={TenantList}
                      roomType={roomType}
                      agreementApi={agreementApi}
                      ShowState={roomType.ViewAgreement}
                      calculateDaysDifference={calculateDaysDifference}
                      roomPaymentInfoApi={roomPaymentInfoApi}
                      updateRoomProperty={updateRoomProperty}
                      handlePaymentRefresh={handlePaymentRefresh}
                    />
                  </>
                )}
                <hr />
                <p
                  className="DashboardWigetPieChartTextHeader"
                  style={{ width: '400px', fontSize: '20px' }}
                >
                  Attachments
                </p>
              </div>
              <div
                style={{
                  width: '100%',
                  background: '#434445',
                  minHeight: '100px',
                  paddingTop: '5px',
                  paddingLeft: '5px',
                  borderRadius: '10px',
                }}
              >
                <DocumentInteractor room={roomType} TenantsList={TenantList} />
              </div>
            </div>
            <div
              className="BottomAddTenantContainer"
              style={{
                height: '55px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '20px',
              }}
            >
              <button
                onClick={() => {
                  setTenantLeavePannelState(true);
                }}
                style={{ marginRight: '20px' }}
              >
                End Stay
              </button>
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
            <PaymentProgressBarGUI
              paymentData={roomType.AllRoomPayInfo.RoomPayInfo || []}
              roomPaymentInfoApi={roomPaymentInfoApi}
              roomType={roomType}
              agreedPrice={roomType.AgreedPrice}
              extendPaymentSchedule={extendPaymentSchedule}
              refresh={handlePaymentRefresh}
            ></PaymentProgressBarGUI>
          </div>
        </div>
        {TenantLeavePannelState && (
          <>
            <div
              className="TenantLeavePannelOpacity"
              onClick={() => {
                setTenantLeavePannelState(false);
              }}
            ></div>
            <div className="TenantLeavePannelScreen">
              <LeavePanel
                tenant={
                  TenantList.find(
                    (tenant: any) => tenant.id === roomType.tenantId
                  ) &&
                  TenantList.find(
                    (tenant: any) => tenant.id === roomType.tenantId
                  )
                }
                room={roomType}
                totalIncome={
                  roomType.AllRoomPayInfo.RoomPayInfo.filter(
                    (payInfo: RoomPayInfo) => payInfo.Paid
                  ).length * roomType.AgreedPrice
                }
                paymentNumbers={
                  roomType.AllRoomPayInfo.RoomPayInfo.filter(
                    (payInfo: RoomPayInfo) => payInfo.Paid
                  ).length
                }
                incompletePastPayments={
                  roomType.AllRoomPayInfo.RoomPayInfo.filter(
                    (payInfo: RoomPayInfo) =>
                      !payInfo.Paid && new Date(payInfo.Day) < new Date()
                  ).length
                }
                extraPayments={extraPayments}
                setExtraPayments={setExtraPayments}
                tenantRating={tenantRating}
                setTenantRating={setTenantRating}
                tenantDescription={tenantDescription}
                setTenantDescription={setTenantDescription}
                endReason={endReason}
                setEndReason={setEndReason}
              />
              <button
                onClick={() => {
                  handleTenantLeft();
                }}
                style={{ marginLeft: '20px' }}
              >
                Tenant done
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Room;
