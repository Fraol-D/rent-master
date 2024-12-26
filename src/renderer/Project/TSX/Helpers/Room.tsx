import React, {
  memo,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { v4 as uuidv4 } from 'uuid';
import ImageInteractor2 from './GUIs/ImageInteractor2';
import PaymentProgressBarGUI from './GUIs/PaymentProgressBarGUI';
import EditIconDark from '../../../assets/assets/Dark mode/Editicon.png';
import EditIconLight from '../../../assets/assets/Light mode/Editicon.png';
import DocumentInteractor from './GUIs/DocumentInteractor';
import {
  AddRoomDocuments,
  addValue,
  deleteFolderImages,
  deleteTenantDocumentFolder,
  deleteValue,
  getRoomDocuments,
  getValuesWithSql,
  RenameAddTenantDocumentFolder,
  updateValue,
  uploadTenantDocument,
  uploadTenantDocumentsV2,
} from '../../../../Backend/localServerApis';
import LeavePanel from './LeavePanel';
import EthiopianCalanderConverterMenu from './GUIs/EthiopianCalanderConverterMenu';
import AgreementViewerForRoom from './GUIs/AgreementViewerForRoom';
import { toEthiopianDateString } from '../../../Project/JS/Calendar Converter';
import NotificationSettingsTable from './GUIs/NotificationSettingsProps';
import UtilityPaymentsTable from './UtilityPaymentsTable';
import UtilityPanel from './GUIs/UtilityPanel';
import { addDays, addMonths, differenceInDays } from 'date-fns';
import CurrencySign, {
  formatNumberWithSuffix,
  GetCurrencyAsOptionsOnSelect,
  GetDefaultCurrency,
} from './CurrencySign';
import { Input } from './CustomReactComponents';
import { getUserPrivileges } from '../../../App';
import { storageManager } from 'renderer/storeManager';
import loadingGif from 'renderer/assets/assets/Loading/Rolling-1s-200px.gif';
import { useGlobal } from 'renderer/components/GlobalContext';
const Room = ({
  roomType,
  updateRoomProperty,
  turnOffAddTenantStateForAll,

  turnOffViewStateForAll,

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
  setChangeMade,
  SelectedUserId,
  SelectedBranchId,
  SelectedAppUser,
  setChangeProgress,
  changeProgress,
}: {
  roomType: RoomType;
  updateRoomProperty: any;
  turnOffAddTenantStateForAll: any;
  turnOffViewStateForAll: any;

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
  setChangeMade: any;
  SelectedUserId: any;
  SelectedBranchId: any;
  SelectedAppUser: any;
  setChangeProgress: any;
  changeProgress: any;
}) => {
  const handleAddTenant = () => {
    turnOffAddTenantStateForAll();
    updateRoomPropertyLocal(
      roomType.id,
      'AddTenantState',
      !roomType.AddTenantState
    );
  };
  const privileges = useMemo(
    () => getUserPrivileges(SelectedAppUser),
    [SelectedAppUser]
  );
  const {
    
    setAllRoomPayInfo,
    AllAgreements,
    setAllAgreements,
    AllTenants,
    setAllUtilityPayments,
    AllUtilityPayments,

    setAllTenants,
    AllRoomPayInfoHistory,
    setAllRoomPayInfoHistory,isOnTutorial,AllRoomPayInfo,isMobileState
  } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [tel1, setTel1] = useState('');
  const [tel2, setTel2] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');
  const [TIN, setTIN] = useState('');
  const [RentReason, setRentReason] = useState('');
  const [selectedAgreement, setSelectedAgreement] = useState<
    'Open-Ended' | 'Fixed-Term'
  >('Fixed-Term');
  const [startTime, setStartTime] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endTime, setEndTime] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);
    date.setMonth(6); // July is 6 (0-based)
    date.setDate(7);
    return date.toISOString().split('T')[0];
  });
  const [signDate, setSignDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [Representative, setRepresentative] = useState('');
  const [agreedPrice, setAgreedPrice] = useState(roomType.price);
  const [paymentCycle, setPaymentCycle] = useState(
    roomType.PaymentCycleType ? roomType.PaymentCycleType : 'monthly'
  );
  const [customDays, setCustomDays] = useState(
    roomType.PaymentCycleCustomeDays ? roomType.PaymentCycleCustomeDays : ''
  );
  const [searchTermTenant, setSearchTermTenant] = useState('');
  const filteredTenants =
    AllTenants &&
    AllTenants.filter(
      (tenant: tenant) =>
        tenant.name.toLowerCase().includes(searchTermTenant.toLowerCase()) ||
        tenant.phoneNumber.includes(searchTermTenant) ||
        (tenant.phoneNumber2 &&
          tenant.phoneNumber2.includes(searchTermTenant)) ||
        (tenant.email &&
          tenant.email.toLowerCase().includes(searchTermTenant.toLowerCase()))
    );
  const addTenantRef = useRef(null);
  const viewAgreementRef = useRef(null);
  const showPayTimeLineRef = useRef(null);
  const hideButtonRef = useRef(null);
  const utilityShowerRefHider = useRef(null);
  const utilityShowerRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        addTenantRef.current &&
        !(addTenantRef.current as HTMLElement).contains(event.target as Node) &&
        roomType.AddTenantState&&
        !isOnTutorial
      ) {
        updateRoomPropertyLocal(roomType.id, 'AddTenantState', 0);
      }
      if (
        viewAgreementRef.current &&
        !(viewAgreementRef.current as HTMLElement).contains(
          event.target as Node
        ) &&
        roomType.ViewAgreement &&
        !document.activeElement?.closest('.ViewAgreementContainer') &&
        !(event.target as HTMLElement).closest('#confirm-overlay')&&
        !isOnTutorial
      ) {
        updateRoomPropertyLocal(roomType.id, 'ViewAgreement', 0);
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
        roomType.ShowPayTimeLine &&
        !(event.target as HTMLElement).closest('#confirm-overlay')&&
        !isOnTutorial
      ) {
        updateRoomPropertyLocal(roomType.id, 'ShowPayTimeLine', 0);
      }
      if (
        utilityShowerRef.current &&
        !(utilityShowerRef.current as HTMLElement).contains(
          event.target as Node
        ) &&
        utilityShowerRefHider.current &&
        !(utilityShowerRefHider.current as HTMLElement).contains(
          event.target as Node
        ) &&
        roomType.ShowUtilityLine &&
        !(event.target as HTMLElement).closest('#confirm-overlay')&&
        !isOnTutorial
      ) {
        updateRoomPropertyLocal(roomType.id, 'ShowUtilityLine', 0);
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
    // Find the tenant in the AllTenants
    const tenantIndex = AllTenants.findIndex(
      (tenant: any) => tenant.id === SelectedTenantIdOnAdding
    );
    const tenant = AllTenants[tenantIndex];

    if (tenantIndex !== -1) {
      if (!tenant.RentingOrOut) {
        // Existing logic for non-renting tenant
        await handleExistingTenant(tenant, tenant.name);
      } else {
        // Handle duplicate tenant case
        await handleDuplicateTenant(tenant);
      }
    }
    SetRefreshState(true);

    await handlePaymentRefresh();
  };

  const handleExistingTenant = async (tenant: any, tenant_name: string) => {
    // Original logic for non-renting tenant
    tenantAPI.EditTenantApiWithOutRefresh(tenant.id, 'RentingOrOut', true);
    tenantAPI.EditTenantApiWithOutRefresh(
      tenant.id,
      'SelectedAgreement',
      selectedAgreement
    );
    tenantAPI.EditTenantApiWithOutRefresh(
      tenant.id,
      'agreedPrice',
      agreedPrice || roomType.price
    );
    tenantAPI.EditTenantApiWithOutRefresh(
      tenant.id,
      'Currency',
      AddTenantFormCurrency || roomType.Currency
    );

    tenantAPI.EditTenantApiWithOutRefresh(
      tenant.id,
      'startTime',
      new Date(startTime).getTime()
    );
    tenantAPI.EditTenantApi(tenant.id, 'endTime', endTime);

    await updateRoomAndPaymentInfo(tenant.id, tenant_name);
  };

  const handleDuplicateTenant = async (originalTenant: any) => {
    // Find next available number for duplicate
    const baseNameMatch = originalTenant.name.match(/(.*?)(?:\s*\((\d+)\))?$/);
    const baseName = baseNameMatch[1];
    const currentNumber = baseNameMatch[2] ? parseInt(baseNameMatch[2]) : 0;

    // Find next available number
    let nextNumber = currentNumber + 1;
    while (
      AllTenants.some((t: any) => t.name === `${baseName}(${nextNumber})`)
    ) {
      nextNumber++;
    }

    // Create new tenant object
    const newTenant: tenant = {
      id: uuidv4(),
      name: `${baseName}(${nextNumber})`,
      phoneNumber: originalTenant.phoneNumber,
      phoneNumber2: originalTenant.phoneNumber2,
      email: originalTenant.email,
      TIN: originalTenant.TIN,
      RentReason: originalTenant.RentReason,
      RentingOrOut: true,
      SelectedAgreement: selectedAgreement,
      startTime: new Date(startTime).getTime(),
      endTime: new Date(endTime).getTime(),
      agreedPrice: agreedPrice || roomType.price,
      AddedTime: Date.now(),
      Currency: AddTenantFormCurrency,
      userId: SelectedUserId,
      branchId: SelectedBranchId,
    };

    // Add new tenant using AddValue
    await addValue('tenants', newTenant);
    setAllTenants([...AllTenants, newTenant]);
    await updateRoomAndPaymentInfo(newTenant.id, newTenant.name);
  };

  const updateRoomAndPaymentInfo = async (
    tenantId: string,
    tenant_name: string
  ) => {
    // Update room properties
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
    updateRoomPropertyWithOutRefresh(
      roomType.id,
      'Currency',
      AddTenantFormCurrency || roomType.Currency
    );
    updateRoomPropertyWithOutRefresh(roomType.id, 'AgreedPrice', agreedPrice);
    updateRoomPropertyWithOutRefresh(roomType.id, 'tenantId', tenantId);
    updateRoomPropertyLocal(roomType.id, 'AddTenantState', 0);

    // Initialize AllRoomPayInfo if needed
    if (!roomType.AllRoomPayInfo) {
      roomType.AllRoomPayInfo = { RoomPayInfo: [] };
    }

    // Handle broker if used
    if (AddTenantUseBrokerState) {
      await brokersRecommendationListApi.AddBrokerRecommendation(
        uuidv4(),
        AddTenantSelectedBrokerId,
        roomType.id,
        tenantId,
        Date.now(),
        isPercentCommission
          ? (commissionValue / 100) * agreedPrice
          : commissionValue
      );
    }

    // Handle documents
    await handleDocuments(tenantId, tenant_name);

    // Handle agreement for fixed term lease
    if (selectedAgreement === 'Fixed-Term') {
      const AgreementId = uuidv4();
      const paymentCycleType2 =
        paymentCycle === 'custom'
          ? `-${customDays}`
          : roomType.PaymentCycleType;

      await agreementApi.addAgreementApi(
        AgreementId,
        roomType.id,
        tenantId,
        new Date(startTime).getTime(),
        new Date(endTime).getTime(),
        new Date(signDate).getTime(),
        agreedPrice,
        paymentCycleType2,
        '',
        '',
        Representative,
        AddTenantFormCurrency
      );
      await updateRoomProperty(roomType.id, 'selectedAgreementId', AgreementId);
    }
    updateRoomPropertyLocal(
      roomType.id,
      'DaysTillNextPayment',
      calculateDaysTillNextPayment(await calculatePredictedPayments(roomType))
    );

    SetRefreshState(true);
    await handlePaymentRefresh();
  };
  const handleDocuments = async (tenantId: string, tenant_name: string) => {
    console.log('tenant_name', tenant_name);
    const roomDocs = await getRoomDocuments('Add a tenant documents');
    if (roomDocs?.documents && roomDocs.documents.length > 0) {
      if(window.electron) {
         for (const element of roomDocs.documents) {
        
        const fileName = element.split('\\').pop().split('/').pop();
        let fileContent;

        // Check if running in Electron environment
        if (window.electron) {
          // Use Electron's IPC to read the file
          fileContent = await window.electron.ipcRenderer.invoke(
            'read-file',
            element
          );
        } else {
          // Fallback to fetch the file content
          const response = await fetch(element);
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${fileName}`);
          }
          console.log(roomDocs);
          fileContent = await response.blob(); // Get the file content as a Blob
        }

        const blob = new Blob([fileContent]);
        const file = new File([blob], fileName, {
          type: 'application/octet-stream',
        });

        await uploadTenantDocumentsV2(
          [file],
          roomType.id,
          tenant_name,
          tenantId,
          new Date(startTime).toDateString()
        );
      }
      } else {
        await RenameAddTenantDocumentFolder(    roomType.id,
          tenant_name,
          tenantId,
          new Date(startTime).toDateString());
      }
     
     if(window.electron) await deleteTenantDocumentFolder();
    }
  };
  const getCorrectPaymentStatment = (text: string, custom: string) => {
    switch (text) {
      case '30':
        return '30 days';
      case '15':
        return '15 days';
      case '7':
        return '7 days';
      case 'monthly':
        return 'month';
      case 'weekly':
        return 'week';
      case 'Annually':
        return 'year';
      case 'daily':
        return 'day';
      default:
        return custom + ' days';
    }
  };
  const handleAddTenantButton = async () => {
    if (AddTenantUseBrokerState && AddTenantSelectedBrokerId == '') return;
    if (isNaN(new Date(startTime).getTime())) return;
    if (TenantPageSelected === 'Select') {
      handleTenantSelectWhenNew();
      return;
    }

    if (name.length >= 3 && tel1.length >= 6 && startTime.length >= 1) {
      const fixedName = name.trim();
      setIsUpdatingTenantList(true);
      setIsLoading(true)
      const tenantId = uuidv4();
      const tenant = {
        id: tenantId,
        name: fixedName,
        phoneNumber: tel1,
        phoneNumber2: tel2,
        email,
        description,
        SelectedAgreement: selectedAgreement,
        startTime: new Date(startTime),
        endTime,
        agreedPrice: agreedPrice ? roomType.price : agreedPrice,
        RentingOrOut: true,
        TIN: TIN,
        RentReason: RentReason,
        AddedTime: Date.now(),
        Currency: AddTenantFormCurrency,
      };

      await updateRoomPropertyWithOutRefresh(
        roomType.id,
        'Currency',
        AddTenantFormCurrency
      );
      await updateRoomPropertyWithOutRefresh(roomType.id, 'status', 'Taken');
      await updateRoomPropertyWithOutRefresh(
        roomType.id,
        'PaymentCycleCustomeDays',
        customDays
      );
      await updateRoomPropertyWithOutRefresh(
        roomType.id,
        'PaymentCycleType',
        paymentCycle
      );
      await updateRoomPropertyWithOutRefresh(
        roomType.id,
        'AgreedPrice',
        agreedPrice
      );
      await updateRoomPropertyWithOutRefresh(roomType.id, 'tenantId', tenantId);
      await updateRoomPropertyLocal(roomType.id, 'AddTenantState', 0);
      await updateRoomProperty(
        roomType.id,
        'Price',
        agreedPrice ? roomType.price : agreedPrice
      );
      //add a tenant to the tenant list
      await tenantAPI.addTenantApi(
        tenant.id,
        tenant.name,
        tenant.phoneNumber,
        tenant.phoneNumber2,
        tenant.email,
        tenant.description,
        tenant.SelectedAgreement,
        tenant.RentingOrOut,
        tenant.startTime,
        tenant.endTime,
        tenant.agreedPrice,
        tenant.TIN,
        tenant.RentReason,
        tenant.AddedTime,
        tenant.Currency
      );

      if (!roomType.AllRoomPayInfo) {
        roomType.AllRoomPayInfo = {
          RoomPayInfo: [],
        };
      }
      const paymentCycleType2 =
        paymentCycle === 'custom'
          ? ('-' + customDays).toString()
          : paymentCycle;
      if (selectedAgreement === 'Fixed-Term') {
        const AgreementId = uuidv4();
        const result = await agreementApi.addAgreementApi(
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
          Representative,
          tenant.Currency
        );
        console.log(result);
        await updateRoomProperty(
          roomType.id,
          'selectedAgreementId',
          AgreementId
        );
      }

      if (AddTenantUseBrokerState) {
        await brokersRecommendationListApi.AddBrokerRecommendation(
          uuidv4(),
          AddTenantSelectedBrokerId,
          roomType.id,
          tenant.id,
          Date.now(),
          isPercentCommission
            ? (commissionValue / 100) * agreedPrice
            : commissionValue
        );
      }
     await  handleDocuments(tenant.id, tenant.name);
      SetRefreshState(true);
      setIsLoading(false)

    }
    updateRoomPropertyLocal(
      roomType.id,
      'DaysTillNextPayment',
      calculateDaysTillNextPayment(await calculatePredictedPayments(roomType))
    );
    await handlePaymentRefresh();
  };
  const calculatePredictedPayments = async (room: RoomType) => {
    const allPayments = [];
    const today = new Date();
    const yearEnd = new Date(today.getFullYear() + 1, 11, 31);
    const tenant = AllTenants.find((t) => t.id === room.tenantId);
    let startDate = new Date(tenant?.startTime || Date.now()).getTime();

    let endDate = null;
    if (room.selectedAgreementId) {
      const agreements = AllAgreements.find(
        (a) => a.id === room.selectedAgreementId
      );
      if (agreements) {
        startDate = agreements.startTime;
      }
      if (tenant?.SelectedAgreement === 'Fixed-Term') {
        if (agreements) {
          endDate = agreements.endTime;
        }
      }
    }

    let currentDate = new Date(startDate);
    while (
      currentDate <= yearEnd &&
      (endDate == null || currentDate <= new Date(endDate))
    ) {
      const paymentId = `${room.id}-${currentDate.getTime()}`;
      allPayments.push({
        id: paymentId,
        Day: currentDate.getTime(),
        Value: room.AgreedPrice,
        Paid: false,
        roomId: room.id,
      });

      switch (room.PaymentCycleType) {
        case '30':
          currentDate = addDays(currentDate, 30);
          break;
        case '15':
          currentDate = addDays(currentDate, 15);
          break;
        case '7':
          currentDate = addDays(currentDate, 7);
          break;
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 7);
          break;
        case 'Annually':
          currentDate = addDays(currentDate, 7);
          break;
        case 'custom':
          currentDate = addDays(
            currentDate,
            room.PaymentCycleCustomeDays || 30
          );
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
    }

    const actualPayments = AllRoomPayInfo.filter(
      (r: RoomPayInfo) => r.roomId === room.id && r.tenantId === room.tenantId
    );

    const finalPayments = allPayments.map((payment) => {
      const actualPayment = actualPayments.find(
        (p: any) => p.id === payment.id
      );
      return actualPayment
        ? { ...payment, Paid: actualPayment.Paid === 1 }
        : payment;
    });

    if (finalPayments.length === 0) {
      console.log('No payments predicted. Possible reasons:');
      console.log('- No tenant assigned to the room');
      console.log('- No valid start date for the tenant');
      console.log('- No valid payment cycle set for the room');
      console.log('- End date is before or equal to start date');
    }

    return finalPayments;
  };

  const calculateDaysTillNextPayment = (predictedPayments: Payment[]) => {
    const today = new Date();

    const sortedPayments = predictedPayments.sort((a, b) => a.Day - b.Day);

    for (const payment of sortedPayments) {
      const paymentDate = new Date(payment.Day);
      const daysDifference = differenceInDays(paymentDate, today);

      if (!payment.Paid) {
        if (daysDifference === 0) {
          return 0;
        } else if (daysDifference < 0) {
          return daysDifference;
        } else {
          return daysDifference;
        }
      }
    }

    return 0;
  };
  const [refreshState, SetRefreshState] = useState(false);
  const extendPaymentSchedule = async () => {
    updateRoomProperty(
      roomType.id,
      'paymentShowAmount',
      roomType.paymentShowAmount + 1
    );
  };
  const checkPaymentStatus = (allRoomPayInfo?: any): string => {
    if (roomType.DaysTillNextPayment > 0) {
      return `Rent due in ${roomType.DaysTillNextPayment} days... ${addDays(
        new Date(),
        roomType.DaysTillNextPayment + 1
      ).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`;
    } else if (roomType.DaysTillNextPayment === -98989898) {
      return `All payments complete.`;
    } else {
      return `Payment day past by ${Math.abs(
        roomType.DaysTillNextPayment
      )} days.`;
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

    if (val === '30') {
      setAgreedPrice(Math.round(roomType.price));
    } else if (val === '15') {
      setAgreedPrice(Math.round(roomType.price / 2));
    } else if (val === '7') {
      setAgreedPrice(Math.round(roomType.price / 4.28));
    } else if (val === 'monthly') {
      setAgreedPrice(Math.round(roomType.price));
    } else if (val === 'daily') {
      setAgreedPrice(Math.round(roomType.price / 30));
    } else if (val === 'custom') {
      setAgreedPrice(Math.round(roomType.price));
    }
  };
  const getBorderColor = () => {
    const daysUntilPayment = roomType.DaysTillNextPayment;
    if (daysUntilPayment === -98989898) {
      return 'var(--1px-V) solid green';
    } else if (daysUntilPayment > 8) {
      return 'var(--2px-V) solid white';
    } else if (daysUntilPayment > 5) {
      return 'var(--2px-V) solid lightpink';
    } else if (daysUntilPayment > 2) {
      return 'var(--2px-V) solid tomato';
    } else if (daysUntilPayment > 0) {
      return 'var(--2px-V) solid red';
    } else {
      return 'var(--2px-V) solid red'; // Default case if daysUntilPayment is not greater than 0
    }
  };
  const [TenantPageSelected, setTenantPageSelected] = useState<
    'Select' | 'New'
  >('New');
  const [TransferTenantPageSelected, setTransferTenantPageSelected] =
    useState(false);
  const [SelectTenantSearch, setSelectTenantSearch] = useState('');
  const [SelectedTenantIdOnAdding, setSelectedTenantIdOnAdding] = useState('');
  const handleTenantLeft = async () => {
    try {
      // Get the current agreement for the room
      if (
        AllTenants.find((t: tenant) => t.SelectedAgreement === 'Fixed-Term')
      ) {
        const currentAgreement = AllAgreements.find(
          (a: agreements) =>
            a.roomId === roomType.id && a.tenantId === roomType.tenantId
        );
        if (currentAgreement) {
          // Get all payments for this agreement
          const payments = AllRoomPayInfo(
            (r: RoomPayInfo) =>
              r.roomId === roomType.id &&
              r.Day <= Date.now() &&
              r.Day >= currentAgreement.startTime &&
              r.tenantId === roomType.tenantId
          );

          // Add these payments to the historical payments table
          for (const payment of payments) {
            await addValue(
              'room_pay_info_history',
              {
                ...payment,
                agreementId: currentAgreement.id,
                branchId: SelectedBranchId,
              },
              setChangeMade
            );
            await deleteValue('room_pay_info', payment.id, setChangeMade);
            setAllRoomPayInfoHistory([
              ...AllRoomPayInfoHistory,
              {
                ...payment,
                agreementId: currentAgreement.id,
                branchId: SelectedBranchId,
              },
            ]);

            setAllRoomPayInfo(
              AllRoomPayInfo.filter((p: any) => p.id !== payment.id)
            );
          }

          // Now delete the payments from the room_pay_info table
        }
      } else {
        const payments = AllRoomPayInfo.filter(
          (r: RoomPayInfo) =>
            r.roomId === roomType.id && r.tenantId === roomType.tenantId
        );

        // Add these payments to the historical payments table
        for (const payment of payments) {
          await addValue(
            'room_pay_info_history',
            {
              ...payment,
              agreementId: '',
              branchId: SelectedBranchId,
            },
            setChangeMade
          );
          await deleteValue('room_pay_info', payment.id, setChangeMade);
          setAllRoomPayInfoHistory([
            ...AllRoomPayInfoHistory,
            {
              ...payment,
              agreementId: '',
              branchId: SelectedBranchId,
            },
            ,
          ]);

          setAllRoomPayInfo(
            AllRoomPayInfo.filter((p: any) => p.id !== payment.id)
          );
        }
      }
      // Update the room's tenant information
      await updateValue('rooms', roomType.id, 'tenantId', '', setChangeMade, 0);
      await updateValue(
        'rooms',
        roomType.id,
        'selectedAgreementId',
        '',
        setChangeMade,
        0
      );

      // Update the tenant's information
      await updateValue(
        'tenants',
        roomType.tenantId,
        'RentingOrOut',
        0,
        setChangeMade,
        0
      );
      await updateValue(
        'tenants',
        roomType.tenantId,
        'endTime',
        Date.now(),
        setChangeMade,
        0
      );
      await updateValue(
        'tenants',
        roomType.tenantId,
        'SelectedAgreement',
        '',
        setChangeMade,
        0
      );

      // Additional logic from the original function
      const allPayInfos = AllRoomPayInfo.filter(
        (r: RoomPayInfo) => r.roomId === roomType.id
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

      await addValue(
        'PastTenantsForRoom',
        {
          id: uuidv4(),
          roomId: roomType.id,
          brokerId:
            agreedCommissionForBroker.length > 0
              ? agreedCommissionForBroker[0].brokerId
              : '',
          tenantId: roomType.tenantId,
          enterDate: new Date(
            AllTenants.find((t: tenant) => t.id === roomType.tenantId).startTime
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
          userId: SelectedUserId,
          branchId: SelectedBranchId,
          Currency: roomType.Currency,
        },
        setChangeMade
      );

      setEndReason('');
      setTenantDescription('');
      setTenantRating(0);

      // Update the room's status to 'Empty'
      updateRoomPropertyWithOutRefresh(roomType.id, 'status', 'Empty');

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

      const utilityPayments = AllUtilityPayments.filter(
        (u: UtilityPayment) => u.roomId === roomType.id
      );
      if (utilityPayments)
        for (let i = 0; i < utilityPayments.length; i++) {
          const element = utilityPayments[i];
          deleteValue('utility_payments', element.id, setChangeMade);
          setAllUtilityPayments(
            AllUtilityPayments.filter((p: any) => p.id !== element.id)
          );
        }

      // Reset the room's AddTenantState
      updateRoomPropertyLocal(roomType.id, 'AddTenantState', 0);
      updateRoomPropertyLocal(roomType.id, 'ViewAgreement', 0);

      setTenantLeavePannelState(false);
    } catch (error) {
      console.error('Error in handleTenantLeft:', error);
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
  const [ShowReceipt, setShowReceipt] = useState(false);
  const [showUtilityPanel, setShowUtilityPanel] = useState(false);

  const handlePaymentRefresh = async () => {
    const listOfPayments = AllRoomPayInfo.filter(
      (p) => p.roomId === roomType.id && p.tenantId === roomType.tenantId
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

  const [TelegramNumberRN, setTelegramNumberRN] = useState('');
  const [TelegramMessageRN, setTelegramMessageRN] = useState('');

  const handleSendTelegramMessageRN = () => {
    // Implement the logic to send Telegram message here
    console.log(`Sending message to ${TelegramNumberRN}: ${TelegramMessageRN}`);
    // Reset the input fields after sending
    setTelegramNumberRN('');
    setTelegramMessageRN('');
  };

  const setMessageNumberRN = (value: string) => {
    setTelegramMessageRN(value);
  };
  const [notificationSettings, setNotificationSettings] = useState<number>(0);
  const InfoItem: React.FC<{
    label: string;
    value: string;
    title?: string;
  }> = React.memo(({ label, value, title }) => (
    <div
      style={{
        marginBottom: 'var(--10px-V)',
        fontSize: 'var(--16px-V)',
        color: 'var(--Text-Color-Grey)',
      }}
    >
      <span style={{ fontWeight: '600', color: 'var(--Text-Color)' }}>
        {label}:
      </span>{' '}
      <em
        style={{ fontWeight: '600', color: 'var(--Text-Color)' }}
        title={title}
      >
        {value}
      </em>
    </div>
  ));

  const InfoItem2: React.FC<{
    label: string;
    value: string;
    onSave: (newValue: string) => void;
    textArea?: boolean;
  }> = React.memo(({ label, value, onSave, textArea }) => {
    const isEditing = editingField === label;
    const [editValue, setEditValue] = useState(value);

    const handleSave = () => {
      onSave(editValue);
      setEditingField(null);
    };

    const handleCancel = () => {
      setEditValue(value);
      setEditingField(null);
    };

    return (
      <div
        style={{
          marginBottom: 'var(--10px-V)',
          fontSize: 'var(--16px-V)',
          color: 'var(--Text-Color-Grey)',
        }}

      >
        {isEditing ? (
          <>
            <span style={{ fontWeight: 'bold' }}>{label}:</span>{' '}
            {textArea ? (
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{
                  marginRight: 'var(--5px-V)',
                  width: '50%',
                  height: 'var(--100px-V)',
                }}
              />
            ) : (
              <input
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                style={{ marginRight: 'var(--5px-V)', width: '50%' }}
              />
            )}
            <button
              onClick={handleSave}
              style={{ marginRight: 'var(--5px-V)' }}
            >
              Save
            </button>
            <button onClick={handleCancel}>Cancel</button>
          </>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span style={{ fontWeight: '400', color: 'var(--Text-Color)' }}>
                {label}:
              </span>{' '}
              {!textArea ? (
                <em style={{ fontWeight: '600', color: 'var(--Accent-Color)' }}>
                  {value}
                </em>
              ) : (
                <em
                  style={{
                    fontWeight: '600',
                    color: 'var(--Accent-Color)',
                    fontSize: 'var(--13px-V)',
                  }}
                >
                  {value}
                </em>
              )}
            </div>
            {privileges.editTenantRoomTenantInfo && (
              <button
                onClick={() => setEditingField(label)}
                style={{ marginLeft: 'var(--5px-V)' }}
              >
                Edit
              </button>
            )}
          </div>
        )}
      </div>
    );
  });
  const editTenantInfo = (field: string, newValue: string) => {
    const tenant = AllTenants.find(
      (tenant: any) => tenant.id === roomType.tenantId
    );
    if (tenant) {
      tenantAPI.EditTenantApi(tenant.id, field, newValue);
      setAllTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenant.id ? { ...tenant, [field]: newValue } : tenant
        )
      );

      setAllTenants((prev) =>
        prev.map((tenant) =>
          tenant.id === tenant.id ? { ...tenant, [field]: newValue } : tenant
        )
      );
    }
    setTimeout(() => {
      updateRoomPropertyLocal(roomType.id, 'ViewAgreement', true);
    }, 200);
  };
  const renderInfoItem = (label: string, value: string, title?: string) => (
    <div
      style={{
        marginBottom: 'var(--10px-V)',
        fontSize: 'var(--16px-V)',
        color: 'var(--Text-Color-Grey)',
      }}
    >
      <span style={{ fontWeight: '400', color: 'var(--Text-Color)' }}>
        {label}:
      </span>{' '}
      <em
        style={{ fontWeight: '600', color: 'var(--Accent-Color)' }}
        title={title}
      >
        {value}
      </em>
    </div>
  );
  const [editingField, setEditingField] = useState<string | null>(null);
  const isValidDate = (dateString: string): boolean => {
    const date = new Date(dateString);
    return !isNaN(date.getTime());
  };

  const [sectionStates, setSectionStates] = useState({
    tenantInformation: true,
    agreementInformation: false,
    tenantPortal: false,
    fileAttachments: false,
    remindersAndNotifications: false,
    utilitySettings: false,
  });

  const CollapsibleSection: React.FC<{
    title: string;
    content: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
  }> = memo(({ title, content, isOpen, onToggle }) => {
    return (
      <div
        style={{
          width: '93%',
          background: 'var(--Secondary-Color30)',
          padding: 'var(--5px-V)',
          marginBottom: 'var(--10px-V)',
          borderRadius: 'var(--5px-V)',
        }}
        id={"room-view-agreement-tenant-information" + roomType.id}
      >
        <div
          style={{
            fontSize: 'var(--18px-V)',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer',
          }}
          onClick={onToggle}
        >
          <span style={{ marginBottom: 'var(--10px-V)' }}>
            {isOpen ? '▼' : '▶'} {title}
          </span>
        </div>
        {isOpen && <div>{content}</div>}
      </div>
    );
  });

  const CollapsibleSection2: React.FC<{
    title: string;
    content: React.ReactNode;
    onEdit?: () => void;
  }> = ({ title, content, onEdit }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div
        style={{
          width: '93%',
          background: 'var(--Secondary-Color30)',
          padding: 'var(--5px-V)',
          marginBottom: 'var(--10px-V)',
          borderRadius: 'var(--5px-V)',
        }}
      >
        <div
          style={{
            fontSize: 'var(--18px-V)',
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{ cursor: 'pointer', marginBottom: 'var(--10px-V)' }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? '▼' : '▶'} {title}
          </span>
        </div>
        {isOpen && (
          <div style={{ paddingLeft: 'var(--20px-V)' }}>{content}</div>
        )}
      </div>
    );
  };
  const [AddTenantFormCurrency, setAddTenantFormCurrency] = useState(
    roomType.Currency ? roomType.Currency : GetDefaultCurrency()
  );

  const toggleSetting = (
    timing: 'before' | 'due' | 'after',
    settingType: 'emailTenant' | 'smsTenant' | 'emailRep' | 'smsRep'
  ) => {
    const bitOffsets = {
      before: 0, // bits 0-3
      due: 4, // bits 4-7
      after: 8, // bits 8-11
    };

    const typeBits = {
      emailTenant: 0,
      smsTenant: 1,
      emailRep: 2,
      smsRep: 3,
    };

    const bitPosition = bitOffsets[timing] + typeBits[settingType];
    const newSettings =
      roomType.UtilityNotificationSettings ^ (1 << bitPosition);

    updateRoomProperty(roomType.id, 'UtilityNotificationSettings', newSettings);
  };

  const isChecked = (
    timing: 'before' | 'due' | 'after',
    settingType: 'emailTenant' | 'smsTenant' | 'emailRep' | 'smsRep'
  ) => {
    const bitOffsets = {
      before: 0,
      due: 4,
      after: 8,
    };

    const typeBits = {
      emailTenant: 0,
      smsTenant: 1,
      emailRep: 2,
      smsRep: 3,
    };

    const bitPosition = bitOffsets[timing] + typeBits[settingType];
    return (roomType.UtilityNotificationSettings & (1 << bitPosition)) !== 0;
  };
// Add LoadingOverlay component
const LoadingOverlay = ({ isLoading }: { isLoading: boolean }) => (
  <div
    style={{
      display: isLoading ? 'flex' : 'none',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      borderRadius: 'var(--10px-V)',
    }}
  >
    <img
      src={loadingGif}
      style={{
        width: '40px',
        height: '40px',
      }}
      alt="Loading..."
    />
  </div>
);

  return (
    <>
      <div
        id={`room-${roomType.id}`}
        className="MainContainer"
        style={{
          width: isMobileState ? '100%' : '',
          background: roomType.AddTenantState
            ? 'var(--Secondary-Color20)'
            : roomType.status === 'Empty'
            ? ''
            : 'var(--Secondary-Color30)',
          border: roomType.AddTenantState ? 'var(--1px-V) solid #00e1f1' : '',
        }}
      >  <LoadingOverlay isLoading={isLoading} />
        <div className="FirstLine">
          <div id={'room-floorRoom-text-' + roomType.id}><div style={{ display: 'flex' }}>
            <p className="FloorText">Floor {roomType.floor}</p>{' '}
            <img
              onClick={() => {
                setSelectedEditRoomId(roomType.id);
                setTypeOfRoomState(true);
              }}
              src={
                storageManager.get('ThemeMode') === 'dark'
                  ? EditIconLight
                  : EditIconDark
              }
              style={{
                width: 'var(--23px-V)',
                height: 'var(--23px-V)',
                marginLeft: 'var(--10px-V)',
              }}
              alt=""
            />
            {/* {roomType.status === 'Empty' && (
              <button
                style={{ padding: '0' }}
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
            )} */}
          </div>
          <p className="RoomText">Room {roomType.roomIndex}</p>
</div>
          <div id={'room-status-Main-container' + roomType.id} className="StatusContainer">
            <div className="StatusText">
              <p>
                Current Status:{' '}
                {roomType.status === 'Taken' ? (
                  <strong>Taken by </strong>
                ) : (
                  <>Empty</>
                )}
              </p>
              <strong style={{ fontSize: 'var(--15px-V)', fontWeight: '600' }}>
                {roomType.status === 'Taken' ? (
                  <p
                    style={{
                      fontSize: 'var(--15px-V)',
                      height: 'var(--20px-V)',
                      margin: 'var(--0px-V)',
                      marginTop: 'var(--5px-V)',
                      fontWeight: '400',
                    }}
                 >
                    {AllTenants.find(
                      (tenant: any) => tenant.id === roomType.tenantId
                    ) ? (
                      AllTenants.find(
                        (tenant: any) => tenant.id === roomType.tenantId
                      ).name
                    ) : (
                      <>
                        <span>Tenant not found, </span>
                       
                      </>
                    )}
                  </p>
                ) : (
                  <>
                    {roomType.AddTenantState ? (
                      <>
                        {privileges.addTenant && (
                          <strong
                            id={'room-status-add-tenant-button' + roomType.id}
                            className="PageNavigatorButtonSelected"
                            style={{
                              width: '77%',
                              border: 'none',
                              height: 'var(--22px-V)',
                              marginTop: 'var(--0px-V)',
                              paddingTop: 'var(--0px-V)',
                            }}
                          >
                            Add a tenant
                          </strong>
                        )}
                      </>
                    ) : (
                      <>
                        {privileges.addTenant && (
                          <button
                            className="PageNavigatorButtonSelected"
                            style={{
                              width: '77%',
                              border: 'none',
                              height: 'var(--22px-V)',
                              marginTop: 'var(--10px-V)',
                              paddingTop: 'var(--0px-V)',
                            }}
                            onClick={() => {
                              handleAddTenant();
                            }}        id={'room-status-add-tenant-button' + roomType.id}
                          >
                            Add a tenant
                          </button>
                        )}
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
                        fontSize: 'var(--17px-V)',
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 'var(--5px-V)',
                      }}
                      onClick={() => {
                        turnOffViewStateForAll();
                        updateRoomPropertyLocal(
                          roomType.id,
                          'ViewAgreement',
                          !roomType.ViewAgreement
                        );
                      }}
                      id={"room-view-agreement-button" + roomType.id}
                    >
                      <p
                        style={{
                          width: 'var(--140px-V)',
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
                        fontSize: 'var(--16px-V)',
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: 'var(--5px-V)',
                        fontWeight: '400',
                      }}
                      onClick={() => {
                        turnOffViewStateForAll();
                        updateRoomPropertyLocal(
                          roomType.id,
                          'ViewAgreement',
                          !roomType.ViewAgreement
                        );
                      }}
                    >
                      <button
                        className="PageNavigatorButtonSelected"
                        style={{
                          width: '77%',
                          border: 'none',
                          height: 'var(--22px-V)',
                          marginTop: 'var(--0px-V)',
                          paddingTop: 'var(--0px-V)',
                        }}  id={"room-view-agreement-button" + roomType.id}
                      >
                        View Agreement
                      </button>
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
          <div className="PriceMainContainer"id={'room-price-payment-cycle' + roomType.id}>
            <div className="PriceContainer">
              <div 
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  userSelect: 'all',
                  justifyContent: 'center',
                }}
              >
                {roomType.status === 'Empty' ? (
                  <>
                    <div
                      title={
                        'Price: ' +
                        roomType.price.toLocaleString() +
                        ' ' +
                        roomType.Currency
                      }
                    >
                      Price:{' '}
                      <strong>
                        {formatNumberWithSuffix(
                          roomType.price.toLocaleString()
                        )}
                        {CurrencySign(roomType.Currency)}
                      </strong>
                    </div>{' '}
                    <p style={{ fontSize: 'var(--12px-V)' }}>
                      Every{' '}
                      {getCorrectPaymentStatment(
                        roomType.PaymentCycleType,
                        roomType.PaymentCycleCustomeDays.toString()
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <div
                      title={
                        'Price: ' +
                        roomType.AgreedPrice.toLocaleString() +
                        ' ' +
                        roomType.Currency
                      }
                    >
                      Price:{' '}
                      <strong>
                        {formatNumberWithSuffix(
                          roomType.AgreedPrice.toLocaleString()
                        )}{' '}
                        {CurrencySign(roomType.Currency)}
                      </strong>
                    </div>{' '}
                    <p style={{ fontSize: 'var(--12px-V)' }}>
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
              style={{
                boxShadow:
                  'var(--3px-V) var(--3px-V) var(--2px-V) var(--1px-V) ' +
                  getBorderColor(),
              }}
            >
              <p>
                {paymentStatus == 'All payments have been made.' ? (
                  <>
                    All payments have been made.{' '}
                    <em
                      onClick={() => {
                        extendPaymentSchedule();
                      }}
                      style={{
                        borderBottom: 'var(--1px-V) solid white',
                        width: 'var(--30px-V)',
                      }}
                    >
                      Extend?
                    </em>
                  </>
                ) : (
                  paymentStatus
                )}
              </p>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {privileges.editRoomPayment && (
                  <button
                    className="PageNavigatorButtonSelected"
                    ref={hideButtonRef}
                    style={{
                      width: 'var(--100px-V)',
                      backgroundColor: 'var(--Primary-Color)',
                      color: 'var(--Text-Color-Reverse)',
                      border: 'none',
                    }}
                    id={"room-payment-timeline-button" + roomType.id}
                    onClick={() => {
                      turnOffViewStateForAll();
                      updateRoomPropertyLocal(
                        roomType.id,
                        'ShowPayTimeLine',
                        !roomType.ShowPayTimeLine
                      );
                    }}
                  >
                    {roomType.ShowPayTimeLine ? 'Hide' : 'Payments'}
                  </button>
                )}
                {privileges.editUtilityPayments && (
                  <button
                    style={{
                      height: 'var(--35px-V)',
                    }}
                    ref={utilityShowerRefHider}
                    onClick={() => {
                      turnOffViewStateForAll();

                      updateRoomPropertyLocal(
                        roomType.id,
                        'ShowUtilityLine',
                        !roomType.ShowUtilityLine
                      );
                    }}
                  >
                    {roomType.ShowUtilityLine ? 'Hide' : 'Utility'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="ThirdLine" id={'room-typeOfRoomMainContainer' + roomType.id}>
          {TypeOfRoomState ? (
            <>
              {' '}
              <div className="RoomTypeContainer">
                <div
                  style={{ display: 'flex', justifyContent: 'space-around' }}
                >
                  {' '}
                  Type of Room{' '}
                  <button
                    onClick={() => {
                      setTypeOfRoomState(false);
                    }}
                  >
                    {'▶'}
                  </button>
                </div>

                <div style={{ overflowY: 'auto' }}>
                  {roomType.RoomSpecifications.map((roomSpec: any) => (
                    <p key={roomSpec.id} className="RoomTypeContainertext">
                      {roomSpec.type === 'number' ? (
                        <>
                          {roomSpec.Number}: {roomSpec.Detail}
                        </>
                      ) : (
                        <>
                          {roomSpec.Boolean ? 'Yes: ' : 'No: '}{' '}
                          {roomSpec.Detail}
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
                    fontSize: 'var(--17px-V)',
                  }}
                >
                  {roomType.squareMeters} Square Meters
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
                  style={{
                    width: '95%',
                    height: '81%',
                    borderRadius: 'var(--5px-V)',
                  }}
                >
                  {' '}
                  <ImageInteractor2 room={roomType} />
                </div>
              </div>
            </>
          )}
        </div>

        {roomType.AddTenantState ? (
          <div
            className="PopOutContainerNoZindex"
            ref={addTenantRef}
            style={{
              zIndex: roomType.AddTenantState ? '' : '-1',
              top: 'var(--260px-V)',
              marginTop: 'var(--20px-V)',
            }}
          >
            <div
              className="AddTenantContainerinner"
              id={'room-add-tenant-container' + roomType.id}
              style={{
                width: roomType.AddTenantState
                  ? 'var(--365px-V)'
                  : 'var(--0px-V)',
                height: roomType.AddTenantState
                  ? 'var(--445px-V)'
                  : 'var(--0px-V)',
                opacity: roomType.AddTenantState ? '1' : '0',
                userSelect: 'text',
                overflowY: 'auto',
                fontSize: 'var(--17px-V)',
                paddingBottom: 'var(--15px-V)',
              }}
            >
              <div className="InnerAddtenantTop" style={{ height: '100%' }}>
                <div className="TabsContainerForTenantAdding">
                  <button
                    onClick={() => {
                      setTenantPageSelected('New');
                      setTransferTenantPageSelected(false);
                    }}
                    style={{
                      width: TenantPageSelected === 'New' ? '60%' : '40%',
                      borderBottom:
                        TenantPageSelected === 'New'
                          ? 'var(--1px-V) solid var(--Primary-Color)'
                          : 'var(--1px-V) solid grey',
                    }}
                  >
                    New tenant
                  </button>
                  <button
                    onClick={() => {
                      setTenantPageSelected('Select');
                      setTransferTenantPageSelected(false);
                    }}
                    style={{
                      width: TenantPageSelected === 'Select' ? '60%' : '40%',
                      borderBottom:
                        TenantPageSelected === 'Select'
                          ? 'var(--1px-V) solid var(--Primary-Color)'
                          : 'var(--1px-V) solid grey',
                    }}
                  >
                    Select a tenant
                  </button>
                </div>

                {TenantPageSelected === 'New' ? (
                  <div id={'room-add-tenant-container-tenantInfo' + roomType.id}>
                    <h3
                      style={{
                        marginTop: 'var(--5px-V)',
                        marginBottom: 'var(--5px-V)',
                        textAlign: 'center',
                      }}
                    >
                      Tenant Information
                    </h3>
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
                    <div
                      className="AddTenantContainerinnerElement"
                      style={{ display: 'flex' }}
                    >
                      Description:
                      <textarea
                        className="AddTenantContainerinnerInput"
                        placeholder="Optional"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        style={{
                          width: 'var(--238px-V)',
                          height: 'var(--107px-V)',
                        }}
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
                  </div>
                ) : (
                  <>
                    <h3
                      style={{
                        marginTop: 'var(--5px-V)',
                        marginBottom: 'var(--5px-V)',
                        textAlign: 'center',
                      }}
                    >
                      Select Existing Tenant
                    </h3>
                    {AllTenants.length >= 1 ? (
                      <input
                        type="text"
                        placeholder="Search tenant"
                        style={{ width: '95%' }}
                        value={searchTermTenant}
                        onChange={(e) => setSearchTermTenant(e.target.value)}
                      />
                    ) : (
                      <p style={{ textAlign: 'center' }}>
                        You don't have any tenants
                      </p>
                    )}
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
                              <p style={{ fontSize: 'var(--10px-V)' }}>
                                {tenant.phoneNumber}
                              </p>
                            </button>
                          </div>
                          <span
                            style={{
                              fontSize: 'var(--12px-V)',
                              marginRight: 'var(--10px-V)',
                            }}
                          >
                            {tenant.RentingOrOut
                              ? 'Renting, so duplicate here'
                              : 'Not Renting, add here'}
                          </span>
                          {SelectedTenantIdOnAdding === '' ? (
                            <></>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedTenantIdOnAdding('');
                              }}
                              style={{
                                width: 'var(--35px-V)',
                                height: 'var(--35px-V)',
                              }}
                            >
                              X
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div
                        className="TenantRow"
                        key={
                          AllTenants.find(
                            (tenant: any) =>
                              tenant.id == SelectedTenantIdOnAdding
                          ).key
                        }
                      >
                        <button
                          onClick={() => {
                            setSelectedTenantIdOnAdding(
                              AllTenants.find(
                                (tenant: any) =>
                                  tenant.id == SelectedTenantIdOnAdding
                              ).id
                            );
                          }}
                        >
                          <p>
                            {
                              AllTenants.find(
                                (tenant: any) =>
                                  tenant.id == SelectedTenantIdOnAdding
                              ).name
                            }
                          </p>
                          <p style={{ fontSize: 'var(--10px-V)' }}>
                            {
                              AllTenants.find(
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
                          style={{
                            width: 'var(--35px-V)',
                            height: 'var(--35px-V)',
                          }}
                        >
                          X
                        </button>
                      </div>
                    )}
                  </>
                )}
                <hr />

                {TenantPageSelected === 'New' ? (
                  <div id={'room-add-tenant-container-agreementDetails' + roomType.id}>
                    <h3
                      style={{
                        marginTop: 'var(--5px-V)',
                        marginBottom: 'var(--5px-V)',
                        textAlign: 'center',
                      }}
                    >
                      Agreement Details
                    </h3>
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
                              style={{
                                fontWeight: '700',
                                width: 'var(--200px-V)',
                              }}
                              onChange={(e) =>
                                setRepresentative(e.target.value)
                              }
                            />{' '}
                          </div>
                        </>
                      )}
                    </div>
                    <div className="AddTenantContainerinnerElement">
                      Payment cycle every:{' '}
                      <select
                        className="AddTenantContainerinnerInput"
                        style={{ width: 'var(--100px-V)' }}
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
                          style={{
                            width: 'var(--50px-V)',
                            marginLeft: 'var(--10px-V)',
                          }}
                          placeholder="Enter days"
                          value={customDays}
                          onChange={(e) => setCustomDays(e.target.value)}
                        />
                      )}
                    </div>
                    <div className="AddTenantContainerinnerElement">
                      Currency:
                      <select
                        value={AddTenantFormCurrency}
                        onChange={(e) =>
                          setAddTenantFormCurrency(e.target.value)
                        }
                        className="AddANewRoomSelectMid"
                      >
                        {GetCurrencyAsOptionsOnSelect()}
                      </select>
                      <br />
                      Agreed Price:{' '}
                      <input
                        type="number"
                        className="AddTenantContainerinnerInput"
                        style={{ width: 'var(--70px-V)' }}
                        placeholder="Enter price"
                        value={agreedPrice}
                        onChange={(e) =>
                          setAgreedPrice(parseInt(e.target.value))
                        }
                      />
                      {CurrencySign(AddTenantFormCurrency)}
                      <button
                        style={{
                          marginLeft: 'var(--10px-V)',
                        }}
                        onClick={() => {
                          setAgreedPrice(roomType.price);
                        }}
                      >
                        Same
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {TenantPageSelected === 'Select' &&
                      SelectedTenantIdOnAdding != '' && (
                        <>
                          <h3
                            style={{
                              marginTop: 'var(--5px-V)',
                              marginBottom: 'var(--5px-V)',
                              textAlign: 'center',
                            }}
                          >
                            Agreement Details
                          </h3>
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
                              <option value="Fixed-Term">
                                Fixed-Term Lease
                              </option>
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
                              <>
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
                                </div>{' '}
                                <div>
                                  Sign date:
                                  <input
                                    type="date"
                                    value={signDate}
                                    style={{ fontWeight: '700' }}
                                    onChange={(e) =>
                                      setSignDate(e.target.value)
                                    }
                                  />
                                </div>
                              </>
                            )}
                          </div>
                          <div className="AddTenantContainerinnerElement">
                            Payment cycle every:{' '}
                            <select
                              className="AddTenantContainerinnerInput"
                              style={{ width: 'var(--100px-V)' }}
                              value={paymentCycle}
                              onChange={handlePaymentCycleChange}
                            >
                              <option value="30">30 days</option>
                              <option value="15">15 days</option>
                              <option value="7">7 days</option>
                              <option value="daily">daily</option>
                              <option value="monthly">monthly</option>
                              <option value="custom">custom days</option>
                            </select>
                            {paymentCycle === 'custom' && (
                              <input
                                type="number"
                                className="AddTenantContainerinnerInput"
                                style={{
                                  width: 'var(--50px-V)',
                                  marginLeft: 'var(--10px-V)',
                                }}
                                placeholder="Enter days"
                                value={customDays}
                                onChange={(e) => setCustomDays(e.target.value)}
                              />
                            )}
                          </div>
                          Currency:
                          <select
                            value={AddTenantFormCurrency}
                            onChange={(e) =>
                              setAddTenantFormCurrency(e.target.value)
                            }
                            className="AddANewRoomSelectMid"
                          >
                            {GetCurrencyAsOptionsOnSelect()}
                          </select>
                          <div className="AddTenantContainerinnerElement">
                            Agreed Price:{' '}
                            <input
                              type="number"
                              className="AddTenantContainerinnerInput"
                              style={{ width: 'var(--70px-V)' }}
                              placeholder="Enter price"
                              value={agreedPrice}
                              onChange={(e) =>
                                setAgreedPrice(parseInt(e.target.value))
                              }
                            />
                            {CurrencySign(AddTenantFormCurrency)}
                            <button
                              style={{
                                marginLeft: 'var(--10px-V)',
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
                <hr />
                {TenantPageSelected === 'Select' ? (
                  SelectedTenantIdOnAdding != '' && (
                    <>
                      <h3
                        style={{
                          marginTop: 'var(--5px-V)',
                          marginBottom: 'var(--5px-V)',
                          textAlign: 'center',
                        }}
                      >
                        Broker Information
                      </h3>
                      <div
                        className="AddTenantContainerinnerElement"
                        style={{ display: 'flex', alignItems: 'center' }}
                      >
                        Track broker:{' '}
                        <input
                          type="checkbox"
                          style={{ width: 'var(--20px-V)' }}
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
                    </>
                  )
                ) : (
                  <>
                    <h3
                      style={{
                        marginTop: 'var(--5px-V)',
                        marginBottom: 'var(--5px-V)',
                        textAlign: 'center',
                      }}
                    >
                      Broker Information
                    </h3>
                    <div
                      className="AddTenantContainerinnerElement"
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      Track broker:{' '}
                      <input
                        type="checkbox"
                        style={{ width: 'var(--20px-V)' }}
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
                  </>
                )}

                {AddTenantUseBrokerState && (
                  <>
                    {AddTenantAddBrokerState ? (
                      <>
                        <h4 style={{ margin: 'var(--0px-V)' }}>
                          Add New Broker
                        </h4>
                        <input
                          type="text"
                          placeholder="Name"
                          value={AddTenantAddBrokerFormName}
                          onChange={(e) =>
                            setAddTenantAddBrokerFormName(e.target.value)
                          }
                        />
                        <span
                          style={{
                            color: 'var(--Text-Color-Grey)',
                            fontSize: 'var(--12px-V)',
                          }}
                        >
                          longer than 3
                        </span>
                        <input
                          type="text"
                          placeholder="Phone Number"
                          value={AddTenantAddBrokerFormPhoneNumber}
                          onChange={(e) =>
                            setAddTenantAddBrokerFormPhoneNumber(e.target.value)
                          }
                        />
                        <span
                          style={{
                            color: 'var(--Text-Color-Grey)',
                            fontSize: 'var(--12px-V)',
                          }}
                        >
                          longer than 8
                        </span>
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
                            <h4 style={{ margin: 'var(--0px-V)' }}>
                              Selected Broker
                            </h4>
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
                                    <p style={{ fontSize: 'var(--10px-V)' }}>
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
                                      width: 'var(--35px-V)',
                                      height: 'var(--35px-V)',
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
                                    ? 'var(--80px-V)'
                                    : 'var(--40px-V)',
                                }}
                                value={commissionValue}
                                onChange={(e) =>
                                  setCommissionValue(parseFloat(e.target.value))
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
                                  <em
                                    style={{
                                      color: 'var(--Text-Color-Grey)',
                                    }}
                                  >
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
                                  onChange={() => setIsPercentCommission(true)}
                                />
                                Percentage
                              </label>
                              <label>
                                <input
                                  type="checkbox"
                                  checked={!isPercentCommission}
                                  onChange={() => setIsPercentCommission(false)}
                                />
                                Number
                              </label>
                            </div>
                          </>
                        ) : (
                          <>
                            <h4 style={{ margin: 'var(--0px-V)' }}>
                              Select a Broker
                            </h4>
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
                                    <p style={{ fontSize: 'var(--10px-V)' }}>
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

                {TenantPageSelected == 'Select' &&
                  SelectedTenantIdOnAdding != '' && (
                    <>
                      <h3
                        style={{
                          marginTop: 'var(--5px-V)',
                          marginBottom: 'var(--5px-V)',
                          textAlign: 'center',
                        }}
                      >
                        Document Attachments
                      </h3>
                      <DocumentInteractor
                        room={roomType}
                        TenantsList={AllTenants}
                        AddTenant={true}
                        isAddRoomDocument={true}
                        SetRefreshState={SetRefreshState}
                        refreshState={refreshState}
                      />
                    </>
                  )}
                {TenantPageSelected == 'New' && (
                  <>
                    <h3
                      style={{
                        marginTop: 'var(--5px-V)',
                        marginBottom: 'var(--5px-V)',
                        textAlign: 'center',
                      }}
                    >
                      Document Attachments
                    </h3>
                    <DocumentInteractor
                      room={roomType}
                      TenantsList={AllTenants}
                      AddTenant={true}
                      isAddRoomDocument={true}
                      SetRefreshState={SetRefreshState}
                      refreshState={refreshState}
                    />
                  </>
                )}
                <div
                  className="BottomAddTenantContainer"
                  style={{
                    display: 'flex',
                    justifyContent: 'space-evenly',
                    flexDirection: 'column',
                    alignItems: 'center',
                    height: 'var(--70px-V)',
                  }}
                >
                  {TenantPageSelected === 'New' && name.length <= 3 && (
                    <p
                      style={{
                        color: 'var(--Text-Color-Grey)',
                        fontSize: 'var(--14px-V)',
                      }}
                    >
                      Name has to be longer than 3
                    </p>
                  )}{' '}
                  {AddTenantUseBrokerState &&
                    AddTenantSelectedBrokerId === '' && (
                      <p
                        style={{
                          color: 'var(--Text-Color-Grey)',
                          fontSize: 'var(--14px-V)',
                        }}
                      >
                        Broker must be selected if you click track broker
                      </p>
                    )}{' '}
                  {TenantPageSelected === 'New' && tel1.length <= 6 && (
                    <p
                      style={{
                        color: 'var(--Text-Color-Grey)',
                        fontSize: 'var(--14px-V)',
                      }}
                    >
                      Phone number has to be longer than 8
                    </p>
                  )}
                  {TenantPageSelected == 'Select' &&
                    SelectedTenantIdOnAdding != '' &&
                    !isValidDate(startTime) && (
                      <p
                        style={{
                          color: 'var(--Text-Color-Grey)',
                          fontSize: 'var(--14px-V)',
                        }}
                      >
                        Start time has to be valid
                      </p>
                    )}
                  {TenantPageSelected === 'New' && !isValidDate(startTime) && (
                    <p
                      style={{
                        color: 'var(--Text-Color-Grey)',
                        fontSize: 'var(--14px-V)',
                      }}
                    >
                      Start time has to be valid
                    </p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-evenly',
                      alignItems: 'center',
                      height: 'var(--60px-V)',
                      width: '100%',
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
                        updateRoomPropertyLocal(
                          roomType.id,
                          'AddTenantState',
                          false
                        );
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
          </div>
        ) : (
          <></>
        )}
        {roomType.ViewAgreement ? (
          <div
            className="PopOutContainerNoZindex"
            ref={viewAgreementRef}
            style={{
              top: 'var(--310px-V)',
             
            }}
          >
            <div
              className="ViewAgreementContainer"
              style={{
                width: roomType.ViewAgreement
                  ? 'var(--400px-V)'
                  : 'var(--0px-V)',
                height: roomType.ViewAgreement
                  ? 'var(--470px-V)'
                  : 'var(--0px-V)',
                opacity: roomType.ViewAgreement ? '1' : '0',
              }}     id={'room-view-agreement-container' + roomType.id}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    padding: 'var(--10px-V)',
                  }}
                >
                  {/* Tenant Information Section */}
                  <CollapsibleSection
                    title="Tenant Information"
                    content={
                      <>
                        <InfoItem
                          label="Name"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.name || ''
                          }
                          onSave={(newValue) => {
                            editTenantInfo('name', newValue);
                          }}
                        />
                        <InfoItem2
                          label="Tel 1"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.phoneNumber || ''
                          }
                          onSave={(newValue) =>
                            editTenantInfo('phoneNumber', newValue)
                          }
                        />
                        <InfoItem2
                          label="Tel 2"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.phoneNumber2 || ''
                          }
                          onSave={(newValue) =>
                            editTenantInfo('phoneNumber2', newValue)
                          }
                        />
                        <InfoItem2
                          label="Email"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.email || ''
                          }
                          onSave={(newValue) =>
                            editTenantInfo('email', newValue)
                          }
                        />
                        <InfoItem2
                          label="Description"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.description || ''
                          }
                          onSave={(newValue) =>
                            editTenantInfo('description', newValue)
                          }
                          textArea={true}
                        />
                        <InfoItem2
                          label="TIN"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.TIN || ''
                          }
                          onSave={(newValue) => editTenantInfo('TIN', newValue)}
                        />
                        <InfoItem2
                          label="Rent Reason"
                          value={
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.RentReason || ''
                          }
                          onSave={(newValue) =>
                            editTenantInfo('RentReason', newValue)
                          }
                        />
                      </>
                    }
                    isOpen={sectionStates.tenantInformation}
                    onToggle={() =>
                      setSectionStates((prev) => ({
                        ...prev,
                        tenantInformation: !prev.tenantInformation,
                      }))
                    }
                  />

                  {/* Agreement Information Section f*/}
                  {privileges.editTenantRoomAgreementInfo && (
                    <div
                    id={'room-view-agreement-information' + roomType.id}
                      style={{
                        width: '93%',
                        background: 'var(--Secondary-Color30)',
                        padding: 'var(--5px-V)',
                        marginBottom: 'var(--10px-V)',
                        borderRadius: 'var(--5px-V)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--18px-V)',
                          fontWeight: 'bold',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setSectionStates((prev) => ({
                            ...prev,
                            agreementInformation: !prev.agreementInformation,
                          }))
                        }
                      >
                        <span style={{ marginBottom: 'var(--10px-V)' }}>
                          {sectionStates.agreementInformation ? '▼' : '▶'}{' '}
                          Agreement Information
                        </span>
                      </div>
                      {sectionStates.agreementInformation && (
                        <>
                          {renderInfoItem(
                            'Agreement type',
                            AllTenants.find(
                              (tenant: any) => tenant.id === roomType.tenantId
                            )?.SelectedAgreement
                          )}
                          {AllTenants.find(
                            (tenant: any) => tenant.id === roomType.tenantId
                          )?.SelectedAgreement !== 'Fixed-Term' ? (
                            <>
                              {renderInfoItem(
                                'Start time',
                                new Date(
                                  AllTenants.find(
                                    (tenant: any) =>
                                      tenant.id === roomType.tenantId
                                  )?.startTime
                                ).toDateString(),
                                toEthiopianDateString(
                                  new Date(
                                    AllTenants.find(
                                      (tenant: any) =>
                                        tenant.id === roomType.tenantId
                                    )?.startTime
                                  )
                                )
                              )}
                              {renderInfoItem(
                                'Agreed Price',
                                `${roomType.AgreedPrice}${CurrencySign(
                                  roomType.Currency
                                )} per ${roomType.PaymentCycleType} days`
                              )}
                              {renderInfoItem(
                                'Payment cycle',
                                roomType.PaymentCycleType
                              )}
                            </>
                          ) : (
                            <AgreementViewerForRoom
                              view={
                                AllTenants.find(
                                  (tenant: any) =>
                                    tenant.id === roomType.tenantId
                                )?.SelectedAgreement == 'Fixed-Term'
                              }
                              updateRoomPropertyLocal={updateRoomPropertyLocal}
                              getCorrectPaymentStatment={
                                getCorrectPaymentStatment
                              }
                              SelectedBranchId={SelectedBranchId}
                              roomType={roomType}
                              agreementApi={agreementApi}
                              ShowState={roomType.ViewAgreement}
                              calculateDaysDifference={calculateDaysDifference}
                              roomPaymentInfoApi={roomPaymentInfoApi}
                              updateRoomProperty={updateRoomProperty}
                              handlePaymentRefresh={handlePaymentRefresh}
                              setChangeMade={setChangeMade}
                            />
                          )}
                        </>
                      )}
                    </div>
                  )}
                  {privileges.editTenantRoomTenantPortal && (
                    <div
                    id={'room-view-agreement-tenant-portal' + roomType.id}
                      style={{
                        width: '93%',
                        background: 'var(--Secondary-Color30)',
                        padding: 'var(--5px-V)',
                        marginBottom: 'var(--10px-V)',
                        borderRadius: 'var(--5px-V)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--18px-V)',
                          fontWeight: 'bold',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setSectionStates((prev) => ({
                            ...prev,
                            tenantPortal: !prev.tenantPortal,
                          }))
                        }
                      >
                        <span style={{ marginBottom: 'var(--10px-V)' }}>
                          {sectionStates.tenantPortal ? '▼' : '▶'} Tenant Portal
                        </span>
                      </div>
                      {sectionStates.tenantPortal && (
                        <>
                          <div style={{ padding: 'var(--10px-V)' }}>
                            <p
                              style={{
                                marginBottom: 'var(--10px-V)',
                                color: 'var(--Text-Color-Grey)',
                              }}
                            >
                              Configure tenant portal settings and access
                              permissions. <br />
                            </p>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 'var(--10px-V)',
                              }}
                            >
                              <label
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--10px-V)',
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={roomType.useTenantPortal || false}
                                  onChange={(e) =>
                                    updateRoomProperty(
                                      roomType.id,
                                      'useTenantPortal',
                                      e.target.checked
                                    )
                                  }
                                />
                                Enable Tenant Portal Access
                              </label>
                              {roomType.useTenantPortal && (
                                <>
                                  <div
                                    style={{
                                      fontSize: 'var(--12px-V)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--10px-V)',
                                    }}
                                  >
                                    Page:{' '}
                                    <a
                                      href={`https://rentmaster.markethubet.com/tenantPortal/${
                                        storageManager
                                          .get('Branches')
                                          .find(
                                            (branch: any) =>
                                              branch.id === SelectedBranchId
                                          ).name
                                      }-${
                                        storageManager
                                          .get('users')
                                          .find(
                                            (user: any) =>
                                              user.id === SelectedUserId
                                          ).companyName
                                      }/${
                                        AllTenants.find(
                                          (tenant: any) =>
                                            tenant.id === roomType.tenantId
                                        )?.name
                                      }`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      https://rentmaster.markethubet.com/tenantPortal/{' '}
                                      <br />
                                      {
                                        storageManager
                                          .get('Branches')
                                          .find(
                                            (branch: any) =>
                                              branch.id === SelectedBranchId
                                          ).name
                                      }
                                      -
                                      {
                                        storageManager
                                          .get('users')
                                          .find(
                                            (user: any) =>
                                              user.id === SelectedUserId
                                          ).companyName
                                      }
                                      /
                                      {
                                        AllTenants.find(
                                          (tenant: any) =>
                                            tenant.id === roomType.tenantId
                                        )?.name
                                      }
                                    </a>
                                    <br />{' '}
                                  </div>
                                  <button
                                    onClick={() => {
                                      const url = `https://rentmaster.markethubet.com/tenantPortal/${
                                        storageManager
                                          .get('Branches')
                                          .find(
                                            (branch: any) =>
                                              branch.id === SelectedBranchId
                                          ).name
                                      }-${
                                        storageManager
                                          .get('users')
                                          .find(
                                            (user: any) =>
                                              user.id === SelectedUserId
                                          ).companyName
                                      }/${
                                        AllTenants.find(
                                          (tenant: any) =>
                                            tenant.id === roomType.tenantId
                                        )?.name
                                      }`;
                                      navigator.clipboard.writeText(url);
                                    }}
                                  >
                                    Copy
                                  </button>{' '}
                                  <label
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--10px-V)',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        roomType.TenantPortalShowReceipts ||
                                        false
                                      }
                                      onChange={(e) =>
                                        updateRoomProperty(
                                          roomType.id,
                                          'TenantPortalShowReceipts',
                                          e.target.checked
                                        )
                                      }
                                    />
                                    Show Payment Receipts
                                  </label>
                                  <label
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--10px-V)',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={
                                        roomType.TenantPortalAllowOnlinePayments ||
                                        false
                                      }
                                      onChange={(e) =>
                                        updateRoomProperty(
                                          roomType.id,
                                          'TenantPortalAllowOnlinePayments',
                                          e.target.checked
                                        )
                                      }
                                    />
                                    Allow Online Payments
                                  </label>
                                </>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {privileges.editTenantRoomUtilitySettings && (
                    <div
                      id={'room-view-agreement-utility-settings' + roomType.id}
                      style={{
                        width: '93%',
                        background: 'var(--Secondary-Color30)',
                        padding: 'var(--5px-V)',
                        marginBottom: 'var(--10px-V)',
                        borderRadius: 'var(--5px-V)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--18px-V)',
                          fontWeight: 'bold',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setSectionStates((prev) => ({
                            ...prev,
                            utilitySettings: !prev.utilitySettings,
                          }))
                        }
                      >
                        <span style={{ marginBottom: 'var(--10px-V)' }}>
                          {sectionStates.utilitySettings ? '▼' : '▶'} Utility
                          Settings
                        </span>
                      </div>
                      {sectionStates.utilitySettings && (
                        <div>
                          <div className="utility-settings">
                            <label>
                              Payment:
                              <select
                                value={roomType.utilityPaymentEvery}
                                onChange={(e) =>
                                  updateRoomProperty(
                                    roomType.id,
                                    'utilityPaymentEvery',
                                    e.target.value
                                  )
                                }
                              >
                                <option value="30">Every 30 days</option>
                                <option value="15">Every 15 days</option>
                                <option value="7">Every 7 days</option>
                                <option value="monthly">monthly</option>
                                <option value="custom">
                                  Custom amount of days
                                </option>
                              </select>
                            </label>
                            {roomType.utilityPaymentEvery === 'custom' && (
                              <input
                                type="number"
                                value={roomType.utilityPaymentEveryCustom}
                                onChange={(e) =>
                                  updateRoomProperty(
                                    roomType.id,
                                    'utilityPaymentEveryCustom',
                                    parseInt(e.target.value)
                                  )
                                }
                              />
                            )}
                          </div>
                          <div className="utility-settings">
                            <label>
                              Use a different start date:
                              <input
                                type="checkbox"
                                checked={
                                  roomType.utilityPaymentUseDifferentStartDate
                                }
                                onChange={(e) => {
                                  updateRoomProperty(
                                    roomType.id,
                                    'utilityPaymentStartDate',
                                    AllTenants.find(
                                      (tenant: any) =>
                                        tenant.id === roomType.tenantId
                                    )?.startTime
                                  );
                                  updateRoomProperty(
                                    roomType.id,
                                    'utilityPaymentUseDifferentStartDate',
                                    e.target.checked
                                  );
                                }}
                              />
                            </label>
                            {roomType.utilityPaymentUseDifferentStartDate && (
                              <input
                                type="Date"
                                value={
                                  new Date(roomType.utilityPaymentStartDate)
                                    .toISOString()
                                    .split('T')[0] || '0'
                                }
                                onChange={(e) => {
                                  const dateValue = new Date(e.target.value);
                                  if (!isNaN(dateValue.getTime())) {
                                    updateRoomProperty(
                                      roomType.id,
                                      'utilityPaymentStartDate',
                                      dateValue.getTime()
                                    );
                                  }
                                }}
                              />
                            )}
                          </div>
                          <UtilityPaymentsTable
                            roomId={roomType.id}
                            utilityPayments={roomType.utilityPayments}
                            updateRoomPropertyLocal={updateRoomPropertyLocal}
                            setChangeMade={setChangeMade}
                            userId={SelectedUserId}
                            SelectedBranchId={SelectedBranchId}
                          />
                          <hr />
                          <div className="reminder-group">
                            <p className="Reminder-p">
                              Send utility reminder 3 days before
                            </p>
                            <div className="checkbox-group">
                              <label className="Reminder-label">
                                Email Tenant:
                                <input
                                  type="checkbox"
                                  checked={isChecked('before', 'emailTenant')}
                                  onChange={() =>
                                    toggleSetting('before', 'emailTenant')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                SMS Tenant:
                                <input
                                  type="checkbox"
                                  checked={isChecked('before', 'smsTenant')}
                                  onChange={() =>
                                    toggleSetting('before', 'smsTenant')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                Email Representative:
                                <input
                                  type="checkbox"
                                  checked={isChecked('before', 'emailRep')}
                                  onChange={() =>
                                    toggleSetting('before', 'emailRep')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                SMS Representative:
                                <input
                                  type="checkbox"
                                  checked={isChecked('before', 'smsRep')}
                                  onChange={() =>
                                    toggleSetting('before', 'smsRep')
                                  }
                                />
                              </label>
                            </div>
                          </div>

                          {/* On Due Date */}
                          <div className="reminder-group">
                            <p className="Reminder-p">
                              Send utility reminder on due date
                            </p>
                            <div className="checkbox-group">
                              <label className="Reminder-label">
                                Email Tenant:
                                <input
                                  type="checkbox"
                                  checked={isChecked('due', 'emailTenant')}
                                  onChange={() =>
                                    toggleSetting('due', 'emailTenant')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                SMS Tenant:
                                <input
                                  type="checkbox"
                                  checked={isChecked('due', 'smsTenant')}
                                  onChange={() =>
                                    toggleSetting('due', 'smsTenant')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                Email Representative:
                                <input
                                  type="checkbox"
                                  checked={isChecked('due', 'emailRep')}
                                  onChange={() =>
                                    toggleSetting('due', 'emailRep')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                SMS Representative:
                                <input
                                  type="checkbox"
                                  checked={isChecked('due', 'smsRep')}
                                  onChange={() =>
                                    toggleSetting('due', 'smsRep')
                                  }
                                />
                              </label>
                            </div>
                          </div>

                          {/* 3 Days After */}
                          <div className="reminder-group">
                            <p className="Reminder-p">
                              Send utility reminder 3 days after
                            </p>
                            <div className="checkbox-group">
                              <label className="Reminder-label">
                                Email Tenant:
                                <input
                                  type="checkbox"
                                  checked={isChecked('after', 'emailTenant')}
                                  onChange={() =>
                                    toggleSetting('after', 'emailTenant')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                SMS Tenant:
                                <input
                                  type="checkbox"
                                  checked={isChecked('after', 'smsTenant')}
                                  onChange={() =>
                                    toggleSetting('after', 'smsTenant')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                Email Representative:
                                <input
                                  type="checkbox"
                                  checked={isChecked('after', 'emailRep')}
                                  onChange={() =>
                                    toggleSetting('after', 'emailRep')
                                  }
                                />
                              </label>
                              <label className="Reminder-label">
                                SMS Representative:
                                <input
                                  type="checkbox"
                                  checked={isChecked('after', 'smsRep')}
                                  onChange={() =>
                                    toggleSetting('after', 'smsRep')
                                  }
                                />
                              </label>
                            </div>
                          </div>

                          <style jsx>{`
                            .reminder-group {
                              margin: var(--15px-V) 0;
                              padding: var(--10px-V);
                              border-radius: var(--5px-V);
                            }

                            .checkbox-group {
                              display: grid;
                              gap: var(--10px-V);
                            }

                            .Reminder-label {
                              display: flex;
                              align-items: center;
                              gap: var(--5px-V);
                            }

                            .Reminder-p {
                              margin-bottom: var(--10px-V);
                              font-weight: bold;
                            }
                          `}</style>
                        </div>
                      )}
                    </div>
                  )}
                  {/* File Attachments Section */}
                  {privileges.editTenantRoomAttachments && (
                    <div
                      id={'room-view-agreement-file-attachments' + roomType.id}
                      style={{
                        width: '93%',
                        background: 'var(--Secondary-Color30)',
                        padding: 'var(--5px-V)',
                        marginBottom: 'var(--10px-V)',
                        borderRadius: 'var(--5px-V)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--18px-V)',
                          fontWeight: 'bold',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setSectionStates((prev) => ({
                            ...prev,
                            fileAttachments: !prev.fileAttachments,
                          }))
                        }
                      >
                        <span style={{ marginBottom: 'var(--10px-V)' }}>
                          {sectionStates.fileAttachments ? '▼' : '▶'} File
                          Attachments
                        </span>
                      </div>
                      {sectionStates.fileAttachments && (
                        <div
                          style={{
                            width: '97%',
                            background: 'var(--Secondary-Color20)',
                            minHeight: 'var(--100px-V)',
                            padding: 'var(--5px-V)',
                            borderRadius: 'var(--10px-V)',
                          }}
                        >
                          <DocumentInteractor
                            room={roomType}
                            TenantsList={AllTenants}
                          />
                        </div>
                      )}
                    </div>
                  )}
                  {/* Reminders and Notifications Section */}
                  {privileges.editTenantRoomNotificationSettings && (
                    <div
                      id={'room-view-agreement-reminders-and-notifications' + roomType.id}
                      style={{
                        width: '93%',
                        background: 'var(--Secondary-Color30)',
                        padding: 'var(--5px-V)',
                        marginBottom: 'var(--10px-V)',
                        borderRadius: 'var(--5px-V)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--18px-V)',
                          fontWeight: 'bold',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() =>
                          setSectionStates((prev) => ({
                            ...prev,
                            remindersAndNotifications:
                              !prev.remindersAndNotifications,
                          }))
                        }
                      >
                        <span style={{ marginBottom: 'var(--10px-V)' }}>
                          {sectionStates.remindersAndNotifications ? '▼' : '▶'}{' '}
                          Reminders and Notifications
                        </span>
                      </div>
                      {sectionStates.remindersAndNotifications && (
                        <NotificationSettingsTable
                          notificationSettings={roomType.notificationSettings}
                          setNotificationSettings={(settings: number) =>
                            updateRoomProperty(
                              roomType.id,
                              'notificationSettings',
                              settings
                            )
                          }
                          userId={SelectedUserId}
                          setChangeMade={setChangeMade}
                          roomId={roomType.id}
                          SelectedBranchId={SelectedBranchId}
                        />
                      )}
                    </div>
                  )}

                  <div
                    className="BottomAddTenantContainer"
                    style={{
                      height: 'var(--55px-V)',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginTop: 'var(--20px-V)',
                    }}
                  >
                    {privileges.editTenantRoomTenantStay && (
                      <button
                        onClick={() => {
                          setTenantLeavePannelState(true);
                        }}
                        style={{ marginRight: 'var(--20px-V)' }}
                      >
                        End Stay
                      </button>
                    )}
                    <button
                      className="AddTenantButton"
                      onClick={() =>
                        updateRoomPropertyLocal(
                          roomType.id,
                          'ViewAgreement',
                          false
                        )
                      }
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <></>
        )}
        {roomType.ShowPayTimeLine ? (
          <div
            className="PopOutContainerNoZindex"
            ref={showPayTimeLineRef}
            style={{
              top: 'var(--200px-V)',
              left: 'var(---567px-V)',
            
            }}
          >
            <PaymentProgressBarGUI
              setChangeProgress={setChangeProgress}
              changeProgress={changeProgress}
              paymentData={roomType.AllRoomPayInfo.RoomPayInfo || []}
              roomPaymentInfoApi={roomPaymentInfoApi}
              roomType={roomType}
              agreedPrice={roomType.AgreedPrice}
              extendPaymentSchedule={extendPaymentSchedule}
              refresh={handlePaymentRefresh}
              ShowReceipt={ShowReceipt}
              setShowReceipt={setShowReceipt}
              setChangeMade={setChangeMade}
              SelectedBranchId={SelectedBranchId}
              SelectedUserId={SelectedUserId}
              updateRoomPropertyLocal={updateRoomPropertyLocal}
              Currency={roomType.Currency}
              fromRoom={true}
            />
          </div>
        ) : roomType.ShowUtilityLine ? (
          <div
            className="PopOutContainer"
            ref={utilityShowerRef}
            style={{
              top: 'var(--104px-V)',

              left: 'var(---757px-V)',

              height: 'var(--383px-V)',
              zIndex: '3',
            }}
          >
            <UtilityPanel
              roomType={roomType}
              AllTenants={AllTenants}
              selectedUserId={SelectedUserId}
              SelectedBranchId={SelectedBranchId}
              setChangeMade={setChangeMade}
            />
          </div>
        ) : (
          <></>
        )}

        {TenantLeavePannelState && (
          <>
            <div
              className="TenantLeavePannelOpacity"
              onClick={() => {
                setTenantLeavePannelState(false);
              }}
            ></div>
            <div className="TenantLeavePannelScreen" style={{width: isMobileState ? '95%' : ''}}>
              <LeavePanel
                tenant={
                  AllTenants.find(
                    (tenant: any) => tenant.id === roomType.tenantId
                  ) &&
                  AllTenants.find(
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
                  setTenantLeavePannelState(false);
                }}
                style={{ marginLeft: 'var(--20px-V)' }}
              >
                Back
              </button>
              <button
                onClick={() => {
                  handleTenantLeft();
                }}
                style={{ marginLeft: 'var(--20px-V)' }}
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

export default React.memo(Room);
