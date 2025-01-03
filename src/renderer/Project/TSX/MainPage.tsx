import { RoomListComponent } from './Pages/RoomListComponent';
import { PeopleComponentPage } from './Pages/PeopleComponentPage';
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  Suspense,
  lazy,
} from 'react';
import { Input } from './Helpers/CustomReactComponents';
import { v4 as uuidv4 } from 'uuid';
import ImageInteractor from './Helpers/GUIs/ImageIntractorGUI';
import LONGIMAGE from './Helpers/WIN_20240802_19_41_23_Pro.jpg';
import Room from './Helpers/Room';
import loadingGif from '../../assets/assets/Loading/Rolling-1s-200px.gif';
import SortIcon from '../../assets/icons8-sort-100.png';
import DoubleArrowIconDark from '../../assets/assets/Dark mode/Left2Arrow.png';
import DoubleArrowIconDarkb from '../../assets/assets/Dark mode/Admin Settings Male.png';
import DoubleArrowIconDarka from '../../assets/assets/Dark mode/Cloud.png';
import DoubleArrowIconDarkc from '../../assets/assets/Dark mode/Customer.png';
import BottomNavBar from './Bottom navbar/BottomNavBar';
import { CalendarPage } from './Pages/CalenderPage';
import {
  addValue,
  deleteFolderImages,
  deleteValue,
  duplicateRoomImagesFolder,
  getValuesWithSql,
  renameFolder,
  updateValue,
} from '../../../Backend/localServerApis';
import ImageInteractor2 from './Helpers/GUIs/ImageInteractor2';
import { set } from 'date-fns';
import DashboardPage from './Pages/DashboardPage';
import DatabasePage from './Pages/DatabasePage';
import ToolsPage from './Pages/ToolsPage';
import { getUserPrivileges } from './../../App';
import { UpdateButton } from './../../components/UpdateButton';
import CurrencySign, {
  GetCurrencyAsOptionsOnSelect,
  GetDefaultCurrency,
} from './Helpers/CurrencySign';
import { IconsGUI } from '../getIcons';
import { useAlert } from '../../components/useAlert';
import { useConfirm } from 'renderer/components/useConfirm';
import { useGlobal } from 'renderer/components/GlobalContext';
import { storageManager } from 'renderer/storeManager';
import { checkRoomLimit } from 'Backend/OnlineServerApis';
import ExpenseManager from './Tools page components/ExpenseManager';
import ExpenseCalendar from './Tools page components/ExpenseCalendar';
import { dividerClasses } from '@mui/material';

type FilterOption = {
  key: string;
  value: any;
};
interface RoomCategory {
  id: string;
  name: string;
  floors?: RoomCategory[];
  rooms?: string[];
}
declare global {
  type BranchType = {
    // Primary identifiers
    id: string;
    userId: string;
    // Added

    // Basic information
    name: string;
    location: string;
    description: string;
    lock?: boolean;
    googleMapPinPoint: string;
  };
  type BranchTypeWithData = {
    // Primary identifiers
    id: string;
    userId: string;

    // Basic information
    name: string;
    location: string;
    description: string;
    googleMapPinPoint: string;

    totalRooms?: number;
    totalFloors?: number;
    totalTenants?: number;
    occupiedRooms?: number;
    vacantRooms?: number;
    monthlyRevenue?: number;
    monthlyExpenses?: number;
    monthlyProfit?: number;
    userAccountsWhichHaveAccess?: string[];
    lock?: boolean;
  };
  type RoomType = {
    id: string;
    floor: number;
    roomIndex: number;
    status: 'Empty' | 'Taken';
    price: number;
    AgreedPrice: number;
    utilityPaymentEvery: string;
    Currency: string;
    utilityPaymentStartDate: number;
    utilityPaymentUseDifferentStartDate: boolean;
    utilityPaymentEveryCustom: number;
    PaymentCycleType:
      | '30'
      | '15'
      | '7'
      | 'monthly'
      | 'weekly'
      | 'daily'
      | 'Annually'
      | 'custom';
    PaymentCycleCustomeDays: number;
    paymentShowAmount: number;
    squareMeters: number;
    RoomSpecifications: RoomSpecificationType[];
    Archived: boolean;
    tenantId?: string;
    AddTenantState?: boolean;
    ViewAgreement?: boolean;
    ShowPayTimeLine?: boolean;
    ShowUtilityLine?: boolean;
    AllRoomPayInfo: AllRoomPayInfo;
    selectedAgreementId: string;
    notificationSettings: number;
    utilityPayments: UtilityPaymentSettings[];
    DaysTillNextPayment: number;
    branchId: string; // Added
    UtilityNotificationSettings: number;

    // Tenant Portal
    useTenantPortal: boolean;
    TenantPortalShowTenantDetails: boolean;
    TenantPortalShowReceipts: boolean;
    TenantPortalAllowOnlinePayments: boolean;
  };
  type RoomSpecificationType = {
    id: string;
    Detail: string;
    Number: number;
    type: 'bool' | 'number';
    branchId: string; // Added
    Boolean: boolean;
  };
  type UtilityPaymentSettings = {
    type: string;
    useThis: boolean;
    price: string;
    alwaysAsk: boolean;
    id: string;
    branchId: string; // Added
    userId: string;
    Currency: string;
  };
  type UtilityPayment = {
    id: string;
    roomId: string;
    type: string;
    price: number;
    custom: boolean;
    branchId: string; // Added
    Currency: string;
    userId: string;
  };
  type SMSTemplate = {
    id: string;
    name: string;
    body: string;
    Type: string;
  };
  type EmailTemplate = {
    id: string;
    name: string;
    subject: string;
    body: string;
    Type: string;
  };
  type BrokerRecommendationType = {
    id: string;
    roomId: string;
    brokerId: string;
    recommendedTenantId: string;
    branchId: string; // Added
    AddedTime: number;
    AgreedCommission: number;
  };

  type tenant = {
    id: string;
    name: string;
    phoneNumber: string;
    phoneNumber2?: string;
    email?: string;
    description?: string;
    SelectedAgreement: string;
    RentingOrOut: boolean;
    startTime: number;
    endTime?: number;
    agreedPrice: number;
    TIN: string;
    RentReason: string;
    AddedTime: number;
    Currency: string;
    userId: string;
    branchId: string; // Added
  };
  type BrokerType = {
    id: string;
    name: string;
    phoneNumber: string;
    phoneNumber2?: string;
    email?: string;
    branchId: string; // Added

    AddedTime: number;
    AgreedCommission: string;
    rating: number;
    notes: string;
  };
  type AllRoomPayInfoHistory = {
    id: string;
    roomId: string;
    Day: number;
    Value: number;
    Paid: boolean;
    userId: string;
    branchId: string; // Added
    agreementId: string;
    tenantId: string;
  };
  type AllRoomPayInfo = {
    RoomPayInfo: RoomPayInfo[];
  };
  type RoomPayInfo = {
    id: string;
    roomId: string;
    branchId: string; // Added
    userId: string;
    Day: number;
    Paid: boolean;
    Value: number;
  };
  type PastTenantReviewType = {
    id: string;
    roomId: string;
    brokerId: string;
    tenantId: string;
    enterDate: number;
    exitDate: number;
    totalEarnings: number;
    paymentCycleType: string;
    paymentCycleTypeCustom: string;
    AgreedCommission: number;
    AgreedPrice: number;
    Stars: number;
    branchId: string; // Added
    description: string;
    Currency: string;
    endReason: string;
  };
  type agreements = {
    id: string;
    roomId: string;
    tenantId: string;
    startTime: number;
    endTime: number;
    signTime: number;
    agreedPrice: number;
    paymentCycleType: string;
    branchId: string; // Added
    Memo: string;
    RentReserved: number;
    representative: string;
    Currency: string;
  };
  type email_templates = {
    id: string;
    name: string;
    subject: string;
    body: string;
    created_at: number;
    updated_at: number;
    userId: string;
  };
  type expenses = {
    id: string;
    fullBuilding: boolean;
    floor: number;
    room: number;
    branchId: string;
    name: string;
    description: string;
    doesReoccur: boolean;
    recurringCycle: number;
    recurringType: 'Day' | 'Monthly' | 'Yearly';
    showNotifySettings: boolean;
    EndDate: number;
    HasEndDate: boolean;
    price: number;
    date: number;
    userId: string;

    // New notification fields
    sendEmail: boolean;
    emailDaysBefore: number;
    sendSms: boolean;
    smsDaysBefore: number;
    emailTo: string | null;
    smsTo: string | null;
    Currency: string;
  };
  type notification_template_selections = {
    id: string;
    notification_type: string;
    email_template_id: string;
    sms_template_id: string;
    userId: string;
    branchId: string; // Added
  };
  type appUser = {
    id: string;
    roleName: string;
    privileges: string;
    userId: string;
    addedDate: number;
    AllowedBranches: string;
    password: string;
    EnterWithPassword: boolean;
  };
}
const MainPage = ({
  RoomList,
  setRoomList,

  roomAPI,
  tenantAPI,
  roomPaymentInfoApi,
  isUpdatingTenantList,
  setIsUpdatingTenantList,
  pastTenantReviewApi,
  brokerApi,
  setBrokerList,
  BrokerList,
  brokersRecommendationListApi,
  PastTenantReviews,
  RefreshDataFromSqlite,
  BrokerRecommendationList,
  setSelectedPage,
  SelectedPage,
  agreementApi,
  roomSpecificationAPI,
  setChangeMade,
  SelectedUserId,
  SelectedAppUser,
  SelectedBranchId,
  signOutUserAndRestart,
  setChangeProgress,
  changeProgress,
  SideBarWidth,
  setSideBarWidth,
  SideBarShowState,
  setSideBarShowState,
}: any) => {
  const {
    AllRoomSpecifications,
    AllTenants,
    setAllTenants,
    setAllExpenses,
    AllExpenses,
    isOnTutorial,
    setTutorialNewExpenseId,
    tutorialNewRoomId,
    setTutorialNewRoomId,
    isMobileState,
  } = useGlobal();

  const [floorFilter, setFloorFilter] = useState<string>('');
  const [TenantNameFilter, setTenantNameFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [sortType, setSortType] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const privileges = useMemo(
    () => getUserPrivileges(SelectedAppUser),
    [SelectedAppUser]
  );

  // Add state variables for filtering
  const [filterStatus, setFilterStatus] = useState<
    'all' | 'Taken' | 'Empty' | 'None'
  >('all');
  const [filterPriceOperator, setFilterPriceOperator] = useState<
    '=' | '<' | '>'
  >('=');
  const [FilterDueDateOperator, setFilterDueDateOperator] = useState<
    '=' | '<' | '>'
  >('=');
  const [filterPriceValue, setFilterPriceValue] = useState<string>('');
  const [FilterDueDateValue, setFilterDueDateValue] = useState<string>('');
  const [filterSquareFeetOperator, setFilterSquareFeetOperator] = useState<
    '=' | '<' | '>'
  >('=');
  const [filterSquareFeetValue, setFilterSquareFeetValue] =
    useState<string>('');
  const [selectedCurrency, setSelectedCurrency] = useState<string>('all');
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const getOriginlPropertyValue = (
    list: any[],
    id: string,
    propertyName: string
  ) => {
    const room = list.find((r: RoomType) => r.id === id);
    if (room) {
      const propertyValue = room[propertyName];
      return propertyValue;
    }
  };
  const updateRoomProperty = async (
    roomId: string,
    propertyName: string,
    newValue: any
  ) => {
    await updateValue(
      'rooms',
      roomId,
      propertyName,
      newValue,
      setChangeMade,
      getOriginlPropertyValue(RoomList, roomId, propertyName)
    );
    //Load the updated room data from the API With THE specific ROOM ID and only get the value insted of the  whole object
    setRoomList((prevRoomList: any[]) => {
      return prevRoomList.map((room: { id: string }) => {
        if (room.id === roomId) {
          return { ...room, [propertyName]: newValue };
        }
        return room;
      });
    });

    //await roomAPI.getRoomFromApi();
    /*setRoomList((prevRoomList: RoomType[]) => {
      const updatedRoomList = prevRoomList.map((room: RoomType) => {
        if (room.id === roomId) {
          return {
            ...room,
            [propertyName]: newValue,
          };
        }
        return room;
      });
      return updatedRoomList;
    });*/
  };
  const updateRoomPropertyLocal = async (
    roomId: string,
    propertyName: string,
    newValue: any
  ) => {
    setRoomList((prevRoomList: RoomType[]) => {
      const updatedRoomList = prevRoomList.map((room: RoomType) => {
        if (room.id === roomId) {
          return {
            ...room,
            [propertyName]: newValue,
          };
        }
        return room;
      });
      return updatedRoomList;
    });
  };
  const updateRoomPropertyWithOutRefresh = async (
    roomId: string,
    propertyName: string,
    newValue: any
  ) => {
    await updateValue(
      'rooms',
      roomId,
      propertyName,
      newValue,
      setChangeMade,
      getOriginlPropertyValue(RoomList, roomId, propertyName)
    );
    setRoomList((prevRoomList: any[]) => {
      return prevRoomList.map((room: { id: string }) => {
        if (room.id === roomId) {
          return { ...room, [propertyName]: newValue };
        }
        return room;
      });
    });

    //await roomAPI.getRoomFromApi();
    /*setRoomList((prevRoomList: RoomType[]) => {
      const updatedRoomList = prevRoomList.map((room: RoomType) => {
        if (room.id === roomId) {
          return {
            ...room,
            [propertyName]: newValue,
          };
        }
        return room;
      });
      return updatedRoomList;
    });*/
  };
  const addFilterOption = (key: string, value: string) => {
    // Only add filter if value is not empty
    if (value) {
      const existingIndex = filterOptions.findIndex(
        (option) => option.key === key
      );
      if (existingIndex !== -1) {
        const newOptions = [...filterOptions];
        newOptions[existingIndex] = { key, value };
        setFilterOptions(newOptions);
      } else {
        setFilterOptions([...filterOptions, { key, value }]);
      }
    } else {
      // Remove filter if value is empty
      removeFilterOption(key);
    }
  };

  // Update removeFilterOption to handle removal by key
  const removeFilterOption = (keyToRemove: string) => {
    setFilterOptions(
      filterOptions.filter((option) => option.key !== keyToRemove)
    );

    // Reset corresponding state based on key
    switch (keyToRemove) {
      case 'floor':
        setFloorFilter('');
        break;
      case 'room':
        setRoomFilter('');
        break;
      case 'tenantName':
        setTenantNameFilter('');
        break;
      case 'filterstatus':
        setFilterStatus('all');
        break;
      // Add other cases as needed
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
  const filterAndSortRooms = () => {
    let filteredRooms = [...RoomList];

    // Apply tenant name filter
    if (TenantNameFilter) {
      filteredRooms = filteredRooms.filter((room) => {
        const tenant = AllTenants.find((t) => t.id === room.tenantId);
        return tenant?.name
          .toLowerCase()
          .includes(TenantNameFilter.toLowerCase());
      });
    }

    // Filter by price
    if (filterPriceValue !== '') {
      const priceValue = parseFloat(filterPriceValue);
      if (!isNaN(priceValue)) {
        filteredRooms = filteredRooms.filter((room) => {
          console.log(room.AgreedPrice, priceValue);
          switch (filterPriceOperator) {
            case '=':
              return room.AgreedPrice === priceValue;
            case '<':
              return room.AgreedPrice < priceValue;
            case '>':
              return room.AgreedPrice > priceValue;
            default:
              return true;
          }
        });
      }
    }

    // Filter by square meters
    if (filterSquareFeetValue !== '') {
      const squareMetersValue = parseFloat(filterSquareFeetValue);
      if (!isNaN(squareMetersValue)) {
        filteredRooms = filteredRooms.filter((room) => {
          switch (filterSquareFeetOperator) {
            case '=':
              return room.squareMeters === squareMetersValue;
            case '<':
              return room.squareMeters < squareMetersValue;
            case '>':
              return room.squareMeters > squareMetersValue;
            default:
              return true;
          }
        });
      }
    }

    // Filter by days until payment
    if (FilterDueDateValue !== '') {
      const daysValue = parseInt(FilterDueDateValue, 10);
      if (!isNaN(daysValue)) {
        filteredRooms = filteredRooms.filter((room) => {
          const daysUntil = getDaysUntilPayment(room.AllRoomPayInfo);
          switch (FilterDueDateOperator) {
            case '=':
              return daysUntil === daysValue;
            case '<':
              return daysUntil < daysValue;
            case '>':
              return daysUntil > daysValue;
            default:
              return true;
          }
        });
      }
    }

    // Apply other existing filters
    if (filterStatus !== 'all') {
      filteredRooms = filteredRooms.filter(
        (room) => room.status === filterStatus
      );
    }

    if (floorFilter) {
      filteredRooms = filteredRooms.filter(
        (room) => room.floor === parseInt(floorFilter, 10)
      );
    }

    if (roomFilter) {
      filteredRooms = filteredRooms.filter(
        (room) => room.roomIndex === parseInt(roomFilter, 10)
      );
    }

    if (selectedCurrency !== 'all') {
      filteredRooms = filteredRooms.filter(
        (room) => room.Currency === selectedCurrency
      );
    }

    // Sort rooms
    filteredRooms.sort((a, b) => {
      let comparison = 0;
      switch (sortType) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'floor':
          comparison = a.floor - b.floor;
          break;
        case 'room':
          comparison = a.roomIndex - b.roomIndex;
          break;
        case 'name':
        default:
          comparison =
            a.floor === b.floor ? a.roomIndex - b.roomIndex : a.floor - b.floor;
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filteredRooms;
  };
  const removeFilterOptionByName = (key: any) => {
    setFilterOptions((options) => {
      switch (key) {
        case 'floor':
          setFloorFilter(''); // Reset the floor filter
          break;
        case 'tenantName':
          setTenantNameFilter(''); // Reset the tenant name filter
          break;
        case 'room':
          setRoomFilter('');
          // Reset the room filter
          break;
        case 'sort':
          setSortType('name'); // Reset the sort type to the default
          break;
        case 'filterstatus':
          setFilterStatus('all'); // Reset the filter status to 'all'
          break;
        case 'filterPriceValue':
          setFilterPriceValue(''); // Reset the filter price value
          break;
        case 'filterDueDateValue':
          setFilterDueDateValue(''); // Reset the filter price value
          break;
        case 'filterSquareFeetValue':
          setFilterSquareFeetValue(''); // Reset the filter square feet value
          break;
        case 'selectedCurrency':
          setSelectedCurrency('all');
          break;
        default:
          // Handle unknown key
          break;
      }
      return options.filter((_, i) => i !== options.indexOf(key));
    });
  };
  useEffect(() => {
    if (floorFilter == '' || floorFilter == '0')
      removeFilterOptionByName('floor');
    if (TenantNameFilter == '' || TenantNameFilter == '0')
      removeFilterOptionByName('tenantName');
    if (roomFilter == '' || roomFilter == '0') removeFilterOptionByName('room');
    if (filterPriceValue == '' || filterPriceValue == '0')
      removeFilterOptionByName('filterPriceValue');
    if (filterSquareFeetValue == '' || filterSquareFeetValue == '0')
      removeFilterOptionByName('filterSquareFeetValue');
    if (selectedCurrency == 'all') removeFilterOptionByName('selectedCurrency');
    if (FilterDueDateValue == '' || FilterDueDateValue == '0')
      removeFilterOptionByName('filterDueDateValue');
  }, [
    floorFilter,
    TenantNameFilter,
    roomFilter,
    filterPriceValue,
    filterSquareFeetValue,
    selectedCurrency,
    FilterDueDateValue,
  ]);

  const sortedAndFilteredRooms = useMemo(() => {
    return filterAndSortRooms();
  }, [
    RoomList,
    filterStatus,
    filterPriceOperator,
    filterPriceValue,
    filterSquareFeetOperator,
    filterSquareFeetValue,
    FilterDueDateOperator,
    FilterDueDateValue,
    floorFilter,
    roomFilter,
    TenantNameFilter,
    selectedCurrency,
    sortType,
    sortDirection,
  ]);

  const [PeopleSelectedPage, setPeopleSelectedPage] = useState<
    'TenantsList' | 'BrokersList' | 'TenantReviews'
  >('TenantsList');
  const [ToolsSelectedPage, setToolsSelectedPage] = useState<
    'EmailTemplates' | 'SMSTemplates' | 'Database' | 'Settings' | 'Support'
  >(
    privileges.editEmailTemplates
      ? 'EmailTemplates'
      : privileges.editSmsTemplates
      ? 'SMSTemplates'
      : privileges.viewDatabase
      ? 'Database'
      : 'Settings'
  );
  const [DashboardSelectedPage, setDashboardSelectedPage] = useState<
    | 'Overview'
    | 'Email History'
    | 'Expenses'
    | 'Action History'
    | 'SMS Details'
    | 'Basic Rental income report'
    | 'TenantsList'
    | 'BrokersList'
    | 'TenantReviews'
  >('Overview');
  const [AddARoomState, setAddARoomState] = useState(false);
  const [AddRoomFormFloor, setAddRoomFormFloor] = useState(1);
  const [AddRoomFormRoomIndex, setAddRoomFormRoomIndex] = useState(1);
  const [AddRoomFormCurrency, setAddRoomFormCurrency] = useState(
    GetDefaultCurrency()
  );
  const [AddRoomFormPrice, setAddRoomFormPrice] = useState(0);
  const [AddRoomFormPaymentCycleType, setAddRoomFormPaymentCycleType] =
    useState('monthly');
  const [
    AddRoomFormPaymentCycleCustomDays,
    setAddRoomFormPaymentCycleCustomDays,
  ] = useState(0);

  const [AddRoomFormSquareMeters, setAddRoomFormSquareMeters] = useState(0);
  const [AddRoomFormRoomSpecifications, setAddRoomFormRoomSpecifications] =
    useState<RoomSpecificationType[]>(
      AllRoomSpecifications.filter((spec) => spec.roomId === 'DEFAULT')
    );

  const handleAddRoomFormSpecificationChange = (
    index: number,
    field: string,
    value: any
  ) => {
    setAddRoomFormRoomSpecifications((prevSpecs) =>
      prevSpecs.map((spec, i) =>
        i === index ? { ...spec, [field]: value } : spec
      )
    );
  };

  const addAddRoomFormSpecification = () => {
    setAddRoomFormRoomSpecifications((prevSpecs) => [
      ...prevSpecs,
      { type: 'bool', Detail: '', Boolean: false, Number: 0, id: uuidv4() },
    ]);
  };

  const removeAddRoomFormSpecification = (index: number) => {
    setAddRoomFormRoomSpecifications((prevSpecs) =>
      prevSpecs.filter((_, i) => i !== index)
    );
  };
  const [RoomExistsWarning, setRoomExistsWarning] = useState(false);
  const roomListContainerRef = useRef<HTMLDivElement>(null);

  // Add a loading state
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const newRoomRef = useRef<HTMLDivElement>(null);

  // Modify the handleAddRoom function
  const handleAddRoom = async (continueAdding = false) => {
    if (isAddingRoom) return; // Prevent multiple clicks
    if (navigator.onLine) {
     if(window.location.href.includes('tryout')){
      const limit = 5
      const reachedLimit = RoomList.length >= limit;
      if(reachedLimit){
        showAlert('Room limit reached. Please sign up to add more rooms.');
        return;
      }

     } else {
      const reachedLimit = await checkRoomLimit(SelectedUserId);

      console.log(reachedLimit);
      if (reachedLimit) {
        showAlert('Room limit reached. Please upgrade to add more rooms.');

        return;
      }}
    } else {
      //IMPLIMENT ROOM LIMIT ON offline electron
    }

    try {
      setIsAddingRoom(true); // Start loading
      setLoadingAddExpense(true);
      // Check if room exists
      const roomExists = sortedAndFilteredRooms.some(
        (room: any) =>
          room.floor === AddRoomFormFloor &&
          room.roomIndex === AddRoomFormRoomIndex
      );

      if (roomExists) {
        console.error(
          `Room ${AddRoomFormRoomIndex} on floor ${AddRoomFormFloor} already exists.`
        );
        setRoomExistsWarning(true);
        return;
      }

      // Create and add the new room
      const newRoom: RoomType = {
        id: uuidv4(),
        floor: AddRoomFormFloor,
        roomIndex: AddRoomFormRoomIndex,
        price: AddRoomFormPrice,
        PaymentCycleType: AddRoomFormPaymentCycleType,
        PaymentCycleCustomeDays: AddRoomFormPaymentCycleCustomDays,
        squareMeters: AddRoomFormSquareMeters,
        RoomSpecifications: AddRoomFormRoomSpecifications,
        status: 'Empty',
        AgreedPrice: AddRoomFormPrice,
        AllRoomPayInfo: { RoomPayInfo: [] },
        selectedAgreementId: '',
        Archived: false,
        Currency: AddRoomFormCurrency || GetDefaultCurrency(),
        utilityPaymentEvery: 30,
        utilityPaymentStartDate: new Date().toISOString(),
        utilityPaymentUseDifferentStartDate: false,
        utilityPaymentEveryCustom: 30,
        UtilityNotificationSettings: 0,
        AddTenantState: 0,
        ViewAgreement: 0,
        ShowUtilityLine: 0,
        ShowPaymentLine: 0,
        ShowTenantLine: 0,
      };

      // Add to database
      await roomAPI.AddRoomApi(
        newRoom.id,
        AddRoomFormFloor,
        AddRoomFormRoomIndex,
        AddRoomFormPrice,
        AddRoomFormPaymentCycleType,
        AddRoomFormPaymentCycleCustomDays,
        AddRoomFormSquareMeters,
        AddRoomFormRoomSpecifications,
        AddRoomFormCurrency || GetDefaultCurrency()
      );

      // Handle images if needed
      if (isMoreThanOneImage) {
        if (!resetRoomImages) {
          await duplicateRoomImagesFolder(
            'Add a room images',
            'New Room Images Folder'
          );
          await handleRenameFolder(
            'New Room Images Folder',
            `Room ${AddRoomFormFloor}, Floor ${AddRoomFormRoomIndex} - ${newRoom.id}`
          );
        } else {
          await handleRenameFolder(
            'Add a room images',
            `Room ${AddRoomFormFloor}, Floor ${AddRoomFormRoomIndex} - ${newRoom.id}`
          );
        }
      }

      // Reset form and update UI
      ResetAddRoomForumVariables(continueAdding);

      // Update states in correct order
      if (!continueAdding) {
        setAddARoomState(false);
        handleDeleteFolderImages('Add a room images');
      }

      setRoomExistsWarning(false);
      setIsMoreThanOneImage(false);
      setRefreshInspectorForAddRoom(true);
      if (isOnTutorial) setTutorialNewRoomId(newRoom.id);
      // Wait a bit for the DOM to update
      setTimeout(() => {
        const roomContainer = document.querySelector('.RoomContainerContainer');
        const newRoomElement = document.getElementById(`room-${newRoom.id}`);

        if (roomContainer && newRoomElement) {
          // Add highlight effect
          newRoomElement.style.backgroundColor = 'var(--Accent-Color50)';
          newRoomElement.style.transition = 'background-color 0.5s ease';

          // Calculate scroll position
          const containerRect = roomContainer.getBoundingClientRect();
          const newRoomRect = newRoomElement.getBoundingClientRect();

          roomContainer.scrollTop +=
            newRoomRect.top -
            containerRect.top -
            containerRect.height / 2 +
            newRoomRect.height / 2;

          // Remove highlight after 2 seconds
          setTimeout(() => {
            newRoomElement.style.backgroundColor = '';
          }, 1000);
        }
      }, 100);
      setLoadingAddExpense(false);
    } catch (error) {
      console.error('Error adding room:', error);
    } finally {
      setIsAddingRoom(false);
      setLoadingAddExpense(false); // End loading
    }
  };

  const handleCancelAddRoom = () => {
    ResetAddRoomForumVariables2();
    setAddARoomState(false);
    handleDeleteFolderImages('Add a room images');
  };

  const [showContinueAddingSettings, setShowContinueAddingSettings] =
    useState(false);
  const ResetAddRoomForumVariables = (continueAdding = false) => {
    if (continueAdding) {
      const fieldsToHighlight: string[] = [];

      if (!incrementRoomNumber) {
        setAddRoomFormRoomIndex(0);
        fieldsToHighlight.push('roomNumber');
      } else {
        setAddRoomFormRoomIndex((prev) => (parseInt(prev) + 1).toString());
      }

      if (resetPrice) {
        setAddRoomFormPrice(0);
        fieldsToHighlight.push('roomPrice');
      }

      if (resetSquareMeters) {
        setAddRoomFormSquareMeters(0);
        fieldsToHighlight.push('squareMeters');
      }

      if (resetRoomSpecifications) {
        setAddRoomFormRoomSpecifications(
          AllRoomSpecifications.filter((spec) => spec.roomId === 'DEFAULT')
        );
        fieldsToHighlight.push('specifications');
      }

      if (resetRoomImages) {
        setRefreshInspectorForAddRoom(true);
        fieldsToHighlight.push('images');
      }

      // Set the highlighted fields and remove them after animation
      setHighlightedFields(fieldsToHighlight);
      setTimeout(() => {
        setHighlightedFields([]);
      }, 2000);
    } else {
      // Reset all fields without highlighting
      setAddRoomFormRoomIndex('');
      setAddRoomFormPrice(0);
      setAddRoomFormSquareMeters(0);
      setAddRoomFormRoomSpecifications(
        AllRoomSpecifications.filter((spec) => spec.roomId === 'DEFAULT')
      );
      setRefreshInspectorForAddRoom(true);
    }
  };
  const ResetAddRoomForumVariables2 = () => {
    // Handle room number and floor increments
    setAddRoomFormRoomIndex(1);
    setAddRoomFormFloor(AddRoomFormFloor);

    // Reset other fields based on settings
    setAddRoomFormPrice(0);
    setAddRoomFormPaymentCycleType('monthly');
    setAddRoomFormPaymentCycleCustomDays(0);
    setAddRoomFormSquareMeters(0);
    setAddRoomFormRoomSpecifications(
      AllRoomSpecifications.filter((spec) => spec.roomId === 'DEFAULT')
    );
    handleDeleteFolderImages('Add a room images');
  };
  const handleRenameFolder = async (oldName: string, newName: string) => {
    const result = await renameFolder(oldName, newName);
    if (result && result.message === 'Folder renamed successfully') {
      console.log('Folder renamed successfully');
      // Optionally, update your UI or state here
    } else {
      console.error('Failed to rename folder');
    }
  };

  const handleDeleteFolderImages = async (folderName: string) => {
    const result = await deleteFolderImages(folderName);
    if (result && result.message === 'All images deleted successfully') {
      console.log('All images in folder deleted successfully');
      setRefreshInspectorForAddRoom(true);
    } else {
      console.error('Failed to delete folder images');
    }
  };

  const [SelectedEditRoomId, setSelectedEditRoomId] = useState('');
  const [DeleteConfimation, setDeleteConfimation] = useState(false);
  const { showAlert } = useAlert();
  const { confirm } = useConfirm();
  const handleDeleteFirst = async () => {
    if (!DeleteConfimation) {
      const choice = await confirm(
        'Are you sure you want to delete this room?',
        {
          type: 'danger',
          title: 'Delete Room',
          confirmText: 'Delete',
          cancelText: 'Cancel',
        }
      );
      if (choice) setInterval(() => setDeleteConfimation(true), 1000);
    }
    if (DeleteConfimation) {
      if (
        RoomList.find((r: RoomType) => r.id === SelectedEditRoomId).status ===
        'Taken'
      ) {
        showAlert('You can not delete a room that is taken', 'error');
        return;
      }
      const listOfPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${SelectedEditRoomId}'`
      );
      if (listOfPayments)
        for (let i = 0; i < listOfPayments.length; i++) {
          const element = listOfPayments[i];
          deleteValue('room_pay_info', element.id, setChangeMade);
        }
      roomAPI.DeleteRoom(SelectedEditRoomId);

      setSelectedEditRoomId('');
      setDeleteConfimation(false);
    }
  };

  const [HideSideBarForCalendar, setHideSideBarForCalendar] = useState(false);
  const [HideSideBarForDashboard, setHideSideBarForDashboard] = useState(false);
  useEffect(() => {
    if (SelectedPage === 'People') {
      //RefreshDataFromSqlite();
    }
    if (SelectedPage === 'Calendar' || SelectedPage === 'Database') {
      setHideSideBarForCalendar(true);
    } else {
      setHideSideBarForCalendar(false);
    }
    if (false) {
      if (!SideBarShowState) {
        setSideBarWidth(290);
        setSideBarShowState(true);
      }
    }
  }, [SelectedPage]);

  const handleAddRoomButtonInitial = (state: boolean, plusOne?: boolean) => {
    if (!isOnTutorial)
      setAddRoomFormRoomSpecifications(
        AllRoomSpecifications.filter((spec) => spec.roomId === 'DEFAULT')
      );

    setAddARoomState(state);
    if (RoomList.length > 0 && RoomList) {
      const sortedRoomList = [...RoomList].sort(
        (a: RoomType, b: RoomType) => a.roomIndex - b.roomIndex
      );
      const a = plusOne
        ? sortedRoomList.reverse()[0].roomIndex + 2
        : sortedRoomList.reverse()[0].roomIndex + 1;
      setAddRoomFormRoomIndex(a);
    }
  };

  const handleCloseSideBar = () => {
    if (SideBarShowState) {
      setSideBarWidth(0);
      setSideBarShowState(false);
      setAddARoomState(false);
    } else {
      setSideBarWidth(290);
      setSideBarShowState(true);
    }
  };

 
  function handleClearFilters() {
    setFilterOptions([]);
    setFloorFilter('');
    setTenantNameFilter('');
    setRoomFilter('');
    setFilterStatus('all');
    setFilterPriceOperator('=');
    setFilterPriceValue('');
    setFilterDueDateOperator('=');
    setFilterDueDateValue('');
    setFilterSquareFeetOperator('=');
    setFilterSquareFeetValue('');
    setSelectedCurrency('all');
    setSortType('name');
    setSortDirection('asc');
  }
  const [RefreshInspectorForAddRoom, setRefreshInspectorForAddRoom] =
    useState(false);
 
  const handleAddImage = (roomId: string) => {
    // This function will be implemented later
    console.log('Add image for room', roomId);
  };

  const handleDeleteImage = (roomId: string, index: number) => {
    // This function will be implemented later
    console.log('Delete image', index, 'for room', roomId);
  };

  const handleShowInExplorer = (path: string) => {
    // This function will be implemented later
    console.log('Show in explorer', path);
  };
  const [isMoreThanOneImage, setIsMoreThanOneImage] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  const toggleSearch = () => setIsSearchOpen(!isSearchOpen);
  const toggleFilter = () => setIsFilterOpen(!isFilterOpen);
  const [ShowArchived, setShowArchived] = useState(false);

  const [OnDataBase, setOnDataBase] = useState(false);
  useEffect(() => {
    if (SelectedPage === 'Database') {
      setOnDataBase(true);
      //RefreshDataFromSqlite();
    } else {
      setOnDataBase(false);
    }
  }, [SelectedPage]);

  const SideBarItem = ({ page, currentPage, onClick, children, id }: any) => (
    <button
      onClick={() => {
        onClick();
        if (isMobileState) handleCloseSideBar();
      }}
      style={{ display: SideBarShowState ? '' : 'none' }}
      id={id || ''}
      className={
        currentPage === page
          ? 'sideBarItemComponentMainSelected'
          : 'sideBarItemComponentMain'
      }
    >
      <div>{children}</div>
      {currentPage !== page && <div>{'-▶'}</div>}
    </button>
  );
  const [tempSquareMeters, setTempSquareMeters] = useState(
    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)?.squareMeters ||
      0
  );
  const [tempPrice, setTempPrice] = useState(
    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)?.price || 0
  );
  const [tempPaymentCycle, setTempPaymentCycle] = useState(
    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)?.paymentCycle ||
      'monthly'
  );
  const [tempPaymentCycleCustomDays, setTempPaymentCycleCustomDays] = useState(
    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)
      ?.PaymentCycleCustomeDays || 0
  );
  useEffect(() => {
    setTempSquareMeters(
      RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)
        ?.squareMeters || 0
    );
  }, [SelectedEditRoomId]);
  const handleBlur = () => {
    updateRoomProperty(
      SelectedEditRoomId,
      'squareMeters',
      parseInt(tempSquareMeters.toString())
    );
  };
  const handleBlurPrice = () => {
    updateRoomProperty(
      SelectedEditRoomId,
      'price',
      parseInt(tempPrice.toString())
    );
  };
  const handleBlurCustomePaymentCycle = () => {
    updateRoomProperty(
      SelectedEditRoomId,
      'PaymentCycleCustomeDays',
      parseInt(tempPaymentCycleCustomDays.toString())
    );
  };
  const handleBlurPaymentCycle = () => {
    updateRoomProperty(
      SelectedEditRoomId,
      'PaymentCycleType',
      tempPaymentCycle
    );
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
  };
  const handleKeyDownPrice = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlurPrice();
    }
  };
  const handleKeyDownCustomePaymentCycle = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter') {
      handleBlurCustomePaymentCycle();
    }
  };
  const [incrementRoomNumber, setIncrementRoomNumber] = useState(true);
  const [incrementFloor, setIncrementFloor] = useState(false);
  const [resetPrice, setResetPrice] = useState(false);
  const [resetCurrency, setResetCurrency] = useState(false);
  const [resetPaymentCycle, setResetPaymentCycle] = useState(false);
  const [resetSquareMeters, setResetSquareMeters] = useState(false);
  const [resetRoomSpecifications, setResetRoomSpecifications] = useState(false);
  const [resetRoomImages, setResetRoomImages] = useState(false);

  const resetAllValuesContinueAddingVariables = () => {
    setIncrementRoomNumber(true);
    setIncrementFloor(false);
    setResetPrice(false);
    setResetCurrency(false);
    setResetPaymentCycle(false);
    setResetSquareMeters(false);
    setResetRoomSpecifications(false);
    setResetRoomImages(false);
  };

  const [addMultipleRoomsState, setAddMultipleRoomsState] = useState(false);
  const [floorCount, setFloorCount] = useState(0);
  const [roomsPerFloor, setRoomsPerFloor] = useState(0);
  const [floorRoomData, setFloorRoomData] = useState([]);
  const AddMultipleRooms = () => {
    const handleContinue = () => {
      if (floorCount > 0 && roomsPerFloor > 0) {
        const newFloorRoomData = Array(floorCount)
          .fill()
          .map((_, floorIndex) => ({
            floor: floorIndex + 1,
            rooms: Array(roomsPerFloor)
              .fill()
              .map((_, roomIndex) => ({
                roomIndex: roomIndex + 1,
                paymentCycle: '30',
                price: 0,
                squareMeters: 0,
              })),
          }));
        setFloorRoomData(newFloorRoomData);
      }
    };

    const updateRoomData = (
      floorIndex: number,
      roomIndex: string | number,
      field: string,
      value: string | number
    ) => {
      setFloorRoomData((prevData) => {
        const newData = [...prevData];
        newData[floorIndex].rooms[roomIndex][field] = value;
        return newData;
      });
    };

    const handleAddRooms = () => {
      floorRoomData.forEach((floor) => {
        floor.rooms.forEach(
          (room: {
            roomIndex: any;
            price: any;
            paymentCycle: any;
            squareMeters: any;
          }) => {
            roomAPI.AddRoomApi(
              uuidv4(),
              floor.floor,
              room.roomIndex,
              room.price,
              room.paymentCycle,
              0, // PaymentCycleCustomDays
              room.squareMeters,
              [] // RoomSpecifications
            );
          }
        );
      });
      setAddMultipleRoomsState(false);
      setFloorRoomData([]);
    };

    return (
      <div>
        <input
          type="number"
          placeholder="Number of floors"
          value={floorCount}
          onChange={(e) => setFloorCount(parseInt(e.target.value))}
        />
        <input
          type="number"
          placeholder="Rooms per floor"
          value={roomsPerFloor}
          onChange={(e) => setRoomsPerFloor(parseInt(e.target.value))}
        />
        <button onClick={handleContinue}>Continue</button>

        {floorRoomData.map((floor, floorIndex) => (
          <div key={floorIndex}>
            <h3>Floor {floor.floor}</h3>
            <input
              type="number"
              value={floor.rooms.length}
              onChange={(e) => {
                const newRoomCount = parseInt(e.target.value);
                setFloorRoomData((prevData) => {
                  const newData = [...prevData];
                  newData[floorIndex].rooms = Array(newRoomCount)
                    .fill()
                    .map((_, i) => ({
                      roomIndex: i + 1,
                      paymentCycle: '30',
                      price: 0,
                      squareMeters: 0,
                    }));
                  return newData;
                });
              }}
            />
            <button
              onClick={() =>
                setFloorRoomData((prevData) => {
                  const newData = [...prevData];
                  newData[floorIndex].showRooms =
                    !newData[floorIndex].showRooms;
                  return newData;
                })
              }
            >
              {floor.showRooms ? 'Hide' : 'Show'}
            </button>
            {floor.showRooms &&
              floor.rooms.map(
                (
                  room: {
                    roomIndex:
                      | string
                      | number
                      | boolean
                      | React.ReactElement<
                          any,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | null
                      | undefined;
                    paymentCycle:
                      | string
                      | number
                      | readonly string[]
                      | undefined;
                    price: string | number | readonly string[] | undefined;
                    squareMeters:
                      | string
                      | number
                      | readonly string[]
                      | undefined;
                  },
                  roomIndex: React.Key | null | undefined
                ) => (
                  <div key={roomIndex}>
                    <span>Room {room.roomIndex}</span>
                    <select
                      value={room.paymentCycle}
                      onChange={(e) =>
                        updateRoomData(
                          floorIndex,
                          roomIndex,
                          'paymentCycle',
                          e.target.value
                        )
                      }
                    >
                      <option value="30">30 days</option>
                      <option value="15">15 days</option>
                      <option value="7">7 days</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <input
                      type="number"
                      placeholder="Price"
                      value={room.price}
                      onChange={(e) =>
                        updateRoomData(
                          floorIndex,
                          roomIndex,
                          'price',
                          parseInt(e.target.value)
                        )
                      }
                    />
                    <input
                      type="number"
                      placeholder="Square Meters"
                      value={room.squareMeters}
                      onChange={(e) =>
                        updateRoomData(
                          floorIndex,
                          roomIndex,
                          'squareMeters',
                          parseInt(e.target.value)
                        )
                      }
                    />
                  </div>
                )
              )}
          </div>
        ))}
        <button onClick={handleAddRooms}>Add Rooms</button>
      </div>
    );
  };
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  // Add these near the top of MainPage component
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [showRoomCalendar, setShowRoomCalendar] = useState(false);
  // Add these state variables at the top with other states
  const [fullBuildingFilter, setFullBuildingFilter] = useState<
    'yes' | 'no' | 'all'
  >('all');
  const [floorFilterExpense, setFloorFilterExpense] = useState('');
  const [roomFilterExpense, setRoomFilterExpense] = useState('');
  const [beforeTaxFilter, setBeforeTaxFilter] = useState<'yes' | 'no' | 'all'>(
    'all'
  );
  const [reoccurringFilter, setReoccurringFilter] = useState<
    'yes' | 'no' | 'all'
  >('all');
  const [reoccurringTypeFilter, setReoccurringTypeFilter] = useState<
    'Day' | 'Monthly' | 'Yearly' | 'all'
  >('all');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editedExpense, setEditedExpense] = useState<expenses | null>(null);
  const [reoccurringDayCount, setReoccurringDayCount] = useState<string>('');
  // Add this with other state variables
  const [showExpenseFilters, setShowExpenseFilters] = useState(true);
  const [showExpenseFilters2, setShowExpenseFilters2] = useState(false);
  const [loadingAddExpense, setLoadingAddExpense] = useState(false);

  const handleAddExpense = async () => {
    setLoadingAddExpense(true);
    const newExpense: expenses = {
      id: uuidv4(),
      name: 'New Expense',
      description: 'New Expense Description',
      price: 0,
      date: Date.now(),
      userId: SelectedUserId,
      fullBuilding: false,
      floor: 0,
      room: 0,
      doesReoccur: false,
      recurringCycle: 0,
      recurringType: 'Day',
      HasEndDate: false,
      EndDate: 0,
      branchId: SelectedBranchId,
      // New notification fields
      sendEmail: false,
      emailDaysBefore: 0,
      sendSms: false,
      smsDaysBefore: 0,
      emailTo: null,
      smsTo: null,
      Currency: 'ETB',
      category: 'Other',
      beforeTax: false,
    };
    if (isOnTutorial) {
      setTutorialNewExpenseId(newExpense.id);
    }
    if(isMobileState) handleCloseSideBar();
    setEditingExpenseId(newExpense.id);
    setEditedExpense(newExpense);
    await addValue('expenses', newExpense, setChangeMade);
    setAllExpenses([...AllExpenses, newExpense]);
    setExpenses([...expenses, newExpense]);
    setLoadingAddExpense(false);
  };
  const [expenses, setExpenses] = useState<expenses[]>([]);

  // Add this handler to prevent clicks in the sidebar from triggering the expense save
  const handleSidebarClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Add this state near other states
  const [showExpenseCalendar, setShowExpenseCalendar] = useState(false);
  const LoadingOverlay = () => (
    <div
      style={{
        display: loadingAddExpense ? 'flex' : 'none',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,

        height: '100%',
        paddingRight: 'var(--12px-V)',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <img
        src={loadingGif}
        style={{
          width: 'var(--80px-V)',
          height: 'var(--80px-V)',
        }}
      />
    </div>
  );
  return (
    <>
      <LoadingOverlay />
      {isMobileState && (
        <BottomNavBar
          SelectedPage={SelectedPage}
          setSelectedPage={setSelectedPage}
        />
      )}
      <div
        className="MainContainerMain"
        style={{
          height:
            SelectedPage === 'Dashboard'
              ? !isMobileState
                ? 'calc(100% - var(--60px-V))'
                : 'calc(100% - var(--50px-V) - var(--70px-V))'
              : !isMobileState
              ? '100%'
              : 'calc(100% - var(--60px-V));',
        }}
      >
        <button
          className="SideBarShowButton"
          onClick={handleCloseSideBar}
          style={
            isMobileState
              ? {
               
                height: 'var(--35px-V)',
                background: 'var(--Secondary-Color)',
                display: 'flex',
                alignItems: 'center',
                top: 'var(--70px-V)',
                left: 'var(--10px-V)',
                margin: 'var(--0px-V)',
              }
              : {
                  zIndex: 2,   display: 'flex',
                  alignItems: 'center',
                  visibility: SideBarShowState
                    ? 'hidden'
                    : HideSideBarForCalendar
                    ? 'hidden'
                    : HideSideBarForDashboard
                    ? 'hidden'
                    : 'visible',
                }
          }
        >
          <img
            src={IconsGUI().Left2ArrowIcon}
            style={{
              width: 'var(--25px-V)',
              height: 'var(--25px-V)',
              rotate: !SideBarShowState ? '180deg' : '0deg',
            }}
            alt=""
          />{' '}
          {SideBarShowState ? 'Hide' : 'Show'}
        </button>
        <div
          className="SideBarContainer"
          style={{
            ...(isMobileState
              ? {
                  width: `var(--${SideBarWidth}px-V)`,
                  transition: '0.2s',
                  visibility: 'visible',
                  position: 'absolute',
                  height: 'calc(100% - var(--110px-V))',
                  background: 'var(--Background-Color2)',
                  zIndex: '2',
                }
              : {
                  width: HideSideBarForCalendar
                    ? 'var(--0px-V)'
                    : `var(--${SideBarWidth}px-V)`,
                  transition: 'all .2s',
                  visibility: HideSideBarForCalendar ? 'hidden' : 'visible',
                }),
          }}
        >
          {SelectedPage === 'Rooms' ? (
            <>
              <h3
                style={{
                  display: SideBarShowState ? '' : 'none',
                  fontSize: 'var(--28px-V)',
                  margin: 'var(--15px-V) 0px var(--15px-V) 0px',
                }}
                id="room-manager-title"
              >
                Room Manager
              </h3>
              <div
                className="SideBarTopContainer"
                style={{
                  borderBottom: SideBarShowState
                    ? 'var(--1px-V) solid var(--Text-Color-Grey)'
                    : 'none',
                  width: '90%',
                }}
              >
                {!isMobileState && (
                  <button
                    className="SideBarTopButton"
                    onClick={handleCloseSideBar}
                    title="Close Sidebar"
                    style={{ display: SideBarShowState ? '' : 'none' }}
                >
                  {/* <img src={IconsGUI().Left2ArrowIcon} alt="" /> */}
                    Close sidebar
                  </button>
                )}
                {privileges.addRoom ? (
                  <button
                    className="SideBarTopButton"
                    onClick={() => {
                      handleAddRoomButtonInitial(!AddARoomState);
                    }}
                    title="Add room"
                    id="add-room-button"
                    style={{ display: SideBarShowState ? '' : 'none' }}
                  >
                    Add Room
                  </button>
                ) : (
                  <></>
                )}
                <button
                  className="SideBarTopButton"
                  onClick={() => setShowRoomCalendar(!showRoomCalendar)}
                  style={{
                    visibility: SideBarShowState ? 'visible' : 'hidden',
                  }}
                  title="Show room calendar"
                  id="room-calendar-toggle"
                >
                  {!showRoomCalendar ? 'Show Calendar' : 'Hide Calendar'}
                </button>

                {/* <button
                  className="SideBarTopButton"
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    visibility: SideBarShowState ? 'visible' : 'hidden',
                  }}
                  onClick={() => {
                    setShowArchived(!ShowArchived);
                  }}
                >
                  {ShowArchived ? 'Show unarchived' : 'Show archived'}
                </button>{' '} */}
              </div>
              {filterOptions.length > 0 && (
                <button
                  className="SideBarTopButton"
                  onClick={handleClearFilters}
                  style={{
                    width: '90%',
                    maxHeight: 'var(--30px-V)',
                    marginTop: 'var(--10px-V)',
                    display: SideBarShowState ? '' : 'none',
                  }}
                >
                  Clear all filters
                </button>
              )}
              <div
                className="SideBarRoomPageTopPart"
                style={{
                  height: AddARoomState ? '0%' : 'calc(100% - var(--135px-V))',
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexDirection: 'column',
                }}
              >
                <div>
                  <div
                    className="SearchBarContainer"
                    style={{
                      backgroundColor: 'var(--Secondary-Color30)',
                      margin: 'var(--10px-V)',
                      borderRadius: 'var(--10px-V)',
                      padding: 'var(--10px-V)',
                      boxShadow:
                        'var(--3px-V) var(--3px-V) var(--5px-V) var(---1px-V) var(--Secondary-Color30)',
                    }}
                    id="room-search-container"
                  >
                    <div
                      onClick={toggleSearch}
                      style={{
                        cursor: 'pointer',
                        fontSize: 'var(--22px-V)',
                      }}
                    >
                      Search rooms
                    </div>
                    {isSearchOpen && (
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          marginLeft: 'var(--10px-V)',
                          marginTop: 'var(--10px-V)',
                          alignItems: 'flex-start',
                        }}
                      >
                        {' '}
                        <div className="TenantSearchBarContainer">
                          Tenant:
                          <input
                            type="text"
                            className="TenantSearchBar"
                            placeholder="Search tenant name"
                            value={TenantNameFilter}
                            style={{ width: 'var(--145px-V)' }}
                            onChange={(e) => {
                              setTenantNameFilter(e.target.value);
                              addFilterOption('tenantName', e.target.value);
                            }}
                          />
                        </div>
                        <div className="RoomAndFloorContainer">
                          <div>
                            Floor:
                            <input
                              type="number"
                              placeholder="0"
                              className="FloorSearchBar"
                              value={floorFilter}
                              onChange={(e) => {
                                setFloorFilter(e.target.value);
                                addFilterOption('floor', e.target.value);
                              }}
                            />
                          </div>
                          <div>
                            Room:
                            <input
                              placeholder="0"
                              type="number"
                              className="RoomSearchBar"
                              value={roomFilter}
                              onChange={(e) => {
                                setRoomFilter(e.target.value);
                                addFilterOption('room', e.target.value);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className="SearchBarContainer"
                    style={{
                      backgroundColor: 'var(--Secondary-Color30)',
                      margin: 'var(--10px-V)',
                      borderRadius: 'var(--10px-V)',
                      padding: 'var(--10px-V)',
                      boxShadow:
                        'var(--3px-V) var(--3px-V) var(--5px-V) var(---1px-V) var(--Secondary-Color30)',
                    }}
                    id="room-search-container-filters"
                  >
                    <div
                      onClick={toggleFilter}
                      style={{
                        cursor: 'pointer',
                        fontSize: 'var(--22px-V)',
                      }}
                    >
                      Filter rooms
                    </div>
                    {isFilterOpen && (
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          marginLeft: 'var(--10px-V)',
                          marginTop: 'var(--10px-V)',
                          alignItems: 'flex-start',
                        }}
                      >
                        <div id="room-search-container-status">
                          Room status:
                          <select
                            value={filterStatus}
                            onChange={(e) => {
                              setFilterStatus(
                                e.target.value as 'all' | 'Taken' | 'Empty'
                              );
                              addFilterOption(
                                'filterstatus',
                                e.target.value as 'all' | 'Taken' | 'Empty'
                              );
                            }}
                            className="filter-drop"
                            style={{
                              width: 'var(--90px-V)',
                              height: 'var(--30px-V)',
                              marginLeft: 'var(--10px-V)',
                            }}
                          >
                            <option value="all">All</option>
                            <option value="Taken">Taken</option>
                            <option value="Empty">Empty</option>
                          </select>
                        </div>

                        <div
                          id="room-search-container-price"
                          style={{ marginTop: 'var(--10px-V)' }}
                        >
                          Price:
                          <select
                            value={filterPriceOperator}
                            onChange={(e) => {
                              setFilterPriceOperator(
                                e.target.value as '=' | '<' | '>'
                              );
                              addFilterOption(
                                'filterPriceOperator',
                                e.target.value as '=' | '<' | '>'
                              );
                            }}
                            style={{
                              width: 'var(--50px-V)',
                              height: 'var(--25px-V)',
                              marginLeft: 'var(--10px-V)',
                              marginRight: 'var(--10px-V)',
                            }}
                            className="filter-drop"
                          >
                            <option value="=">{'='}</option>
                            <option value="<">{'<'}</option>
                            <option value=">">{'>'}</option>
                          </select>
                          <input
                            type="number"
                            className="RoomSearchBar"
                            placeholder="2500"
                            value={filterPriceValue}
                            onChange={(e) => {
                              setFilterPriceValue(e.target.value);
                              addFilterOption(
                                'filterPriceValue',
                                e.target.value
                              );
                            }}
                          />
                        </div>

                        <div
                          id="room-search-container-due-date"
                          style={{ marginTop: 'var(--10px-V)' }}
                        >
                          Due dates:
                          <select
                            value={FilterDueDateOperator}
                            onChange={(e) => {
                              setFilterDueDateOperator(
                                e.target.value as '=' | '<' | '>'
                              );
                              addFilterOption(
                                'filterDueDateOperator',
                                e.target.value as '=' | '<' | '>'
                              );
                            }}
                            style={{
                              width: 'var(--50px-V)',
                              height: 'var(--25px-V)',
                              marginLeft: 'var(--10px-V)',
                              marginRight: 'var(--10px-V)',
                            }}
                            className="filter-drop"
                          >
                            <option value="=">{'='}</option>
                            <option value="<">{'<'}</option>
                            <option value=">">{'>'}</option>
                          </select>
                          <input
                            type="number"
                            className="RoomSearchBar"
                            placeholder="5 days"
                            value={FilterDueDateValue}
                            onChange={(e) => {
                              setFilterDueDateValue(e.target.value);
                              setFilterStatus('Taken');
                              addFilterOption('filterstatus', 'Taken');
                              addFilterOption(
                                'filterDueDateValue',
                                e.target.value
                              );
                            }}
                          />
                        </div>

                        <div
                          id="room-search-container-square-meters"
                          style={{ marginTop: 'var(--10px-V)' }}
                        >
                          SMeters:
                          <select
                            value={filterSquareFeetOperator}
                            onChange={(e) => {
                              setFilterSquareFeetOperator(
                                e.target.value as '=' | '<' | '>'
                              );
                              addFilterOption(
                                'filterSquareFeetOperator',
                                e.target.value as '=' | '<' | '>'
                              );
                            }}
                            style={{
                              width: 'var(--50px-V)',
                              height: 'var(--25px-V)',
                              marginLeft: 'var(--10px-V)',
                              marginRight: 'var(--10px-V)',
                            }}
                            className="filter-drop"
                          >
                            <option value="=">{'='}</option>
                            <option value="<">{'<'}</option>
                            <option value=">">{'>'}</option>
                          </select>
                          <input
                            type="number"
                            className="RoomSearchBar"
                            placeholder="35m²"
                            value={filterSquareFeetValue}
                            onChange={(e) => {
                              setFilterSquareFeetValue(e.target.value);
                              addFilterOption(
                                'filterSquareFeetValue',
                                e.target.value
                              );
                            }}
                          />
                        </div>

                        <div
                          id="room-search-container-currency"
                          style={{ marginTop: 'var(--10px-V)' }}
                        >
                          Filter Currency:
                          <select
                            key={uuidv4()}
                            value={selectedCurrency}
                            onChange={(e) => {
                              setSelectedCurrency(e.target.value);
                              addFilterOption(
                                'selectedCurrency',
                                e.target.value
                              );
                            }}
                            className="filter-drop"
                            style={{
                              width: 'var(--130px-V)',
                              height: 'var(--25px-V)',
                              marginLeft: 'var(--10px-V)',
                            }}
                          >
                            <option value="all">All Currencies</option>
                            {GetCurrencyAsOptionsOnSelect()}
                          </select>
                        </div>

                        {/** <div style={{ visibility: 'hidden', marginTop: 'var(--10px-V)' }}>
                          <button
                            className="sort-button"
                            onClick={() => {
                              if (sortDirection === 'asc') {
                                setSortDirection('desc');
                              } else {
                                setSortDirection('asc');
                              }
                            }}
                          >
                            <img
                              src={SortIcon}
                              className={
                                sortDirection === 'asc'
                                  ? 'sort-button-img'
                                  : 'sort-button-img-Flip'
                              }
                            ></img>
                          </button>
                          <select
                            value={sortType}
                            onChange={(e) => {
                              setSortType(e.target.value);
                              addFilterOption('sort', e.target.value);
                            }}
                            className="sort-drop"
                          >
                            <option value="price">Sort by Price</option>
                            <option value="floor">Sort by Floor</option>
                            <option value="room">Sort by Room</option>
                          </select>
                        </div> */}
                      </div>
                    )}
                  </div>
                </div>
                {window.electron && <UpdateButton />}
              </div>

              <div
                className="SideBarRoomPageBottomPartAddRoom"
                style={{
                  height: AddARoomState
                    ? isMobileState
                      ? '100%'
                      : 'calc(100% - var(--180px-V) - var(--10px-V))'
                    : '0%',
                }}
              >
                <div>
                  <h1 style={{ display: 'flex', justifyContent: 'center' }}>
                    Add a room
                    {/** <button onClick={() => setAddMultipleRoomsState(true)}>
                      Add Multiple Rooms
                    </button> */}
                  </h1>
                  {addMultipleRoomsState ? (
                    <AddMultipleRooms />
                  ) : (
                    <div>
                      <div className="AddaNewRoomRowObject">
                        <input
                          className={`AddANewRoomInputsSmall ${
                            highlightedFields.includes('floor')
                              ? 'highlight-reset-field'
                              : ''
                          }`}
                          type="number"
                          placeholder="Floor"
                          id="add-room-floor-input"
                          value={AddRoomFormFloor}
                          onChange={(e) =>
                            setAddRoomFormFloor(parseInt(e.target.value))
                          }
                        />
                        :Floor number
                      </div>
                      <div className="AddaNewRoomRowObject">
                        <input
                          className={`AddANewRoomInputsSmall ${
                            highlightedFields.includes('roomIndex')
                              ? 'highlight-reset-field'
                              : ''
                          }`}
                          type="number"
                          placeholder="Room Index"
                          id="add-room-index-input"
                          value={AddRoomFormRoomIndex}
                          onChange={(e) =>
                            setAddRoomFormRoomIndex(parseInt(e.target.value))
                          }
                        />
                        :Room number{' '}
                        {RoomExistsWarning && (
                          <em style={{ color: 'red' }}>Already exist</em>
                        )}{' '}
                      </div>

                      <div
                        id="add-room-price-container"
                        className="AddaNewRoomRowObject"
                      >
                        Price (inc. VAT):
                        <input
                          style={{ width: 'var(--100px-V)' }}
                          className="AddANewRoomInputsSmall"
                          type="number"
                          placeholder="Price"
                          value={AddRoomFormPrice}
                          onChange={(e) =>
                            setAddRoomFormPrice(parseInt(e.target.value))
                          }
                        />
                        <select
                          value={AddRoomFormCurrency}
                          onChange={(e) =>
                            setAddRoomFormCurrency(e.target.value)
                          }
                          className="AddANewRoomSelectMid"
                        >
                          {GetCurrencyAsOptionsOnSelect()}
                        </select>
                      </div>
                      <div
                        id="add-room-payment-cycle"
                        className="AddaNewRoomRowObject"
                      >
                        Payment cycle:{' '}
                        <select
                          value={AddRoomFormPaymentCycleType}
                          onChange={(e) =>
                            setAddRoomFormPaymentCycleType(e.target.value)
                          }
                          className="AddANewRoomSelectMid"
                        >
                          <option value="30">30 days</option>
                          <option value="15">15 days</option>
                          <option value="7">7 days</option>
                          <option value="daily">daily</option>
                          <option value="monthly">monthly</option>
                          <option value="custom">custom days</option>
                        </select>
                      </div>
                      {AddRoomFormPaymentCycleType === 'custom' && (
                        <div style={{ marginLeft: 'var(--10px-V)' }}>
                          Custom Days:
                          <input
                            className="AddANewRoomInputsSmall"
                            type="number"
                            placeholder="Custom Days"
                            value={AddRoomFormPaymentCycleCustomDays}
                            onChange={(e) =>
                              setAddRoomFormPaymentCycleCustomDays(
                                parseInt(e.target.value)
                              )
                            }
                          />
                        </div>
                      )}
                      <div
                        id="add-room-square-meters"
                        className="AddaNewRoomRowObject"
                      >
                        Square Meters:
                        <input
                          className="AddANewRoomInputsSmall"
                          type="number"
                          placeholder="Square Meters"
                          value={AddRoomFormSquareMeters}
                          onChange={(e) =>
                            setAddRoomFormSquareMeters(parseInt(e.target.value))
                          }
                        />
                      </div>

                      <div
                        className="RoomSpecficationsMainContainer"
                        id="room-specs-section"
                      >
                        <h3 style={{ marginTop: '0px' }}>
                          Room Specifications{' - '}
                          <button
                            onClick={addAddRoomFormSpecification}
                            id="add-room-spec-button"
                          >
                            Add
                          </button>
                        </h3>
                        {AddRoomFormRoomSpecifications.length === 0 ? (
                          <div className="AddANewRoomSpecObjectMainContainer">
                            <div
                              style={{
                                color: 'var(--Text-Color-Grey)',
                                fontStyle: 'italic',
                              }}
                            >
                              <div>Click "Add" above to add specifications</div>
                              Example specifications:
                              <div>• Bedrooms: 3</div>
                              <div>• Balcony: Yes</div>
                            </div>
                          </div>
                        ) : (
                          AddRoomFormRoomSpecifications.map((spec, index) => (
                            <div
                              key={index}
                              className="AddANewRoomSpecObjectMainContainer"
                            >
                              <div>
                                Name:
                                <input
                                  className="AddANewRoomInputsMid"
                                  value={spec.Detail}
                                  placeholder="Enter name"
                                  onChange={(e) =>
                                    handleAddRoomFormSpecificationChange(
                                      index,
                                      'Detail',
                                      e.target.value
                                    )
                                  }
                                  id={`room-spec-name-input`}
                                />
                                {spec.type === 'bool' ? (
                                  <>
                                    <input
                                      type="checkbox"
                                      id={`room-spec-input`}
                                      checked={spec.Boolean}
                                      onChange={(e) =>
                                        handleAddRoomFormSpecificationChange(
                                          index,
                                          'Boolean',
                                          e.target.checked
                                        )
                                      }
                                    />{' '}
                                    {spec.Boolean ? 'Yes' : 'No'}
                                  </>
                                ) : (
                                  <input
                                    type="number"
                                    className="AddANewRoomInputsSmall"
                                    value={spec.Number}
                                    onChange={(e) =>
                                      handleAddRoomFormSpecificationChange(
                                        index,
                                        'Number',
                                        e.target.value
                                      )
                                    }
                                    id="room-spec-input"
                                  />
                                )}
                              </div>
                              <div
                                style={{
                                  marginTop: 'var(--5px-V)',
                                  display: 'flex',
                                  flexDirection: 'row',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                }}
                              >
                                <div
                                  id="room-spec-type-radio"
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`spec-${index}`}
                                      value="bool"
                                      checked={spec.type === 'bool'}
                                      onChange={(e) =>
                                        handleAddRoomFormSpecificationChange(
                                          index,
                                          'type',
                                          'bool'
                                        )
                                      }
                                    />{' '}
                                    Yes/No
                                  </div>
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                    }}
                                  >
                                    <input
                                      type="radio"
                                      name={`spec-${index}`}
                                      value="number"
                                      checked={spec.type === 'number'}
                                      onChange={(e) =>
                                        handleAddRoomFormSpecificationChange(
                                          index,
                                          'type',
                                          'number'
                                        )
                                      }
                                    />{' '}
                                    Number
                                  </div>
                                </div>
                                <button
                                  onClick={() =>
                                    removeAddRoomFormSpecification(index)
                                  }
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <div
                        className="AddARoomImageMainContainer"
                        id="room-images-section"
                      >
                        <ImageInteractor2
                          sidebarState={AddARoomState}
                          isAddRoomImage={true}
                          refreshState={RefreshInspectorForAddRoom}
                          SetRefreshState={setRefreshInspectorForAddRoom}
                          AddRoomState={true}
                          setIsMoreThanOneImage={setIsMoreThanOneImage}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="AddaNewRoomBottomContianer">
                  <button
                    className="HorizontalButton"
                    onClick={() => {
                      handleCancelAddRoom();
                    }}
                  >
                    Cancel
                  </button>{' '}
                  {showContinueAddingSettings && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        background: 'var(--Secondary-Color60)',
                        padding: 'var(--5px-V)',
                        borderRadius: 'var(--10px-V)',
                        marginBottom: 'var(--10px-V)',
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: 'var(--12px-V)',
                            color: 'var(--Text-Color-Grey)',
                          }}
                        >
                          After this room is add the below options will be
                          applied to the next room
                        </span>
                        <br />
                        <input
                          type="radio"
                          name="roomNumberAction"
                          value="increment"
                          checked={incrementRoomNumber}
                          onChange={() => setIncrementRoomNumber(true)}
                        />{' '}
                        Increment Room Number <br />
                        <input
                          type="radio"
                          name="roomNumberAction"
                          value="reset"
                          checked={!incrementRoomNumber}
                          onChange={() => setIncrementRoomNumber(false)}
                        />{' '}
                        Reset Room Number
                        <br />
                      </div>
                      <div>
                        <input
                          type="radio"
                          name="floorAction"
                          value="increment"
                          checked={incrementFloor}
                          onChange={() => setIncrementFloor(true)}
                        />{' '}
                        Increment Floor Number
                        <br />
                        <input
                          type="radio"
                          name="floorAction"
                          value="reset"
                          checked={!incrementFloor}
                          onChange={() => setIncrementFloor(false)}
                        />{' '}
                        Keep Floor Number same
                        <br />
                        <hr />
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          name="resetCurrency"
                          checked={resetCurrency}
                          onChange={() => setResetCurrency(!resetCurrency)}
                        />{' '}
                        Reset Currency
                        <br />
                        <input
                          type="checkbox"
                          name="resetPrice"
                          checked={resetPrice}
                          onChange={() => setResetPrice(!resetPrice)}
                        />{' '}
                        Reset Price
                        <br />
                        <input
                          type="checkbox"
                          name="resetPaymentCycle"
                          checked={resetPaymentCycle}
                          onChange={() =>
                            setResetPaymentCycle(!resetPaymentCycle)
                          }
                        />{' '}
                        Reset Payment Cycle
                        <br />
                        <input
                          type="checkbox"
                          name="resetSquareMeters"
                          checked={resetSquareMeters}
                          onChange={() =>
                            setResetSquareMeters(!resetSquareMeters)
                          }
                        />{' '}
                        Reset Square Meters
                        <br />
                        <input
                          type="checkbox"
                          name="resetRoomSpecifications"
                          checked={resetRoomSpecifications}
                          onChange={() =>
                            setResetRoomSpecifications(!resetRoomSpecifications)
                          }
                        />{' '}
                        Reset Room Specifications
                        <br />
                        <input
                          type="checkbox"
                          name="resetRoomImages"
                          checked={resetRoomImages}
                          onChange={() => setResetRoomImages(!resetRoomImages)}
                        />{' '}
                        Reset Room Images
                        <br />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          marginTop: 'var(--10px-V)',
                        }}
                      >
                        <button
                          className="HorizontalButton"
                          style={{ marginRight: 'var(--10px-V)' }}
                          onClick={() => {
                            setShowContinueAddingSettings(false);
                            resetAllValuesContinueAddingVariables();
                          }}
                        >
                          Close
                        </button>
                        <button
                          className="HorizontalButton"
                          disabled={isAddingRoom}
                          onClick={() => {
                            handleAddRoom(true);

                            setAddARoomState(true);
                          }}
                        >
                          {isAddingRoom ? 'Adding...' : 'Add'}
                        </button>
                      </div>
                    </div>
                  )}
                  <div
                    className="HorizontalButton"
                    style={{ background: 'none', padding: '0' }}
                  >
                    <button
                      onClick={() => {
                        setShowContinueAddingSettings(
                          !showContinueAddingSettings
                        );
                      }}
                      style={{ width: '100%' }}
                    >
                      {showContinueAddingSettings
                        ? 'Close'
                        : 'Add Another Room'}
                    </button>
                  </div>
                  {!showContinueAddingSettings && (
                    <button
                      className="HorizontalButton"
                      onClick={() => handleAddRoom(false)}
                      disabled={isAddingRoom}
                      id="add-room-submit"
                    >
                      {isAddingRoom ? 'Adding...' : 'Add Room'}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : SelectedPage === 'People' ? (
            <>
              <h3
                style={{
                  display: SideBarShowState ? '' : 'none',
                  fontSize: 'var(--28px-V)',
                  margin: 'var(--15px-V) 0px var(--15px-V) 0px',
                }}
              >
                People Lists
              </h3>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              ></h3>
              <SideBarItem
                page="TenantsList"
                currentPage={PeopleSelectedPage}
                onClick={() => setPeopleSelectedPage('TenantsList')}
                id="dashboard-tenants-list-tab"
              >
                Tenant list
              </SideBarItem>
              <SideBarItem
                page="BrokersList"
                currentPage={PeopleSelectedPage}
                onClick={() => setPeopleSelectedPage('BrokersList')}
                id="dashboard-broker-list-tab"
              >
                Broker list
              </SideBarItem>
              <SideBarItem
                page="TenantReviews"
                currentPage={PeopleSelectedPage}
                onClick={() => setPeopleSelectedPage('TenantReviews')}
                id="dashboard-tenant-reviews-tab"
              >
                Tenant Reviews
              </SideBarItem>
            </>
          ) : SelectedPage === 'Tools' ? (
            <>
              {' '}
              <h3
                style={{
                  display: SideBarShowState ? '' : 'none',
                  fontSize: 'var(--28px-V)',
                  margin: 'var(--15px-V) 0px var(--15px-V) 0px',
                }}
                id="tools-title"
              >
                Tools and Settings
              </h3>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              ></h3>
              {privileges.editEmailTemplates && (
                <SideBarItem
                  page="EmailTemplates"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('EmailTemplates')}
                  id="tools-email-templates-tab"
                >
                  Email Templates
                </SideBarItem>
              )}
              {privileges.editSmsTemplates && (
                <SideBarItem
                  page="SMSTemplates"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('SMSTemplates')}
                  id="tools-sms-templates-tab"
                >
                  SMS Templates
                </SideBarItem>
              )}
              {privileges.viewDatabase && (
                <SideBarItem
                  page="Database"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('Database')}
                  id="tools-database-tab"
                >
                  Database
                </SideBarItem>
              )}
              {(privileges.viewDatabase ||
                privileges.editSmsTemplates ||
                privileges.editEmailTemplates) && <br />}
              <SideBarItem
                page="Settings"
                currentPage={ToolsSelectedPage}
                onClick={() => setToolsSelectedPage('Settings')}
                id="tools-settings-tab"
              >
                Settings
              </SideBarItem>
            </>
          ) : SelectedPage === 'Dashboard' ? (
            <>
              <h3
                style={{
                  display: SideBarShowState ? '' : 'none',
                  fontSize: 'var(--28px-V)',
                  margin: 'var(--15px-V) 0px var(--15px-V) 0px',
                }}
                id="dashboard-title"
              >
                Dashboard
              </h3>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              >
                Overview
              </h3>
              <SideBarItem
                page="Overview"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Overview')}
                id="dashboard-overview-tab"
              >
                Overview
              </SideBarItem>

              <SideBarItem
                page="Expenses"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Expenses')}
                id="dashboard-expenses-tab"
              >
                Expenses
              </SideBarItem>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              >
                Lists
              </h3>
              <SideBarItem
                page="TenantsList"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('TenantsList')}
                id="dashboard-tenants-list-tab"
              >
                Tenant list
              </SideBarItem>
              <SideBarItem
                page="BrokersList"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('BrokersList')}
                id="dashboard-broker-list-tab"
              >
                Broker list
              </SideBarItem>
              <SideBarItem
                page="TenantReviews"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('TenantReviews')}
                id="dashboard-tenant-reviews-tab"
              >
                Tenant Reviews
              </SideBarItem>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              >
                Communication
              </h3>
              <SideBarItem
                page="Email History"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Email History')}
                id="dashboard-email-history-tab"
              >
                Email History
              </SideBarItem>
              <SideBarItem
                page="SMS Details"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('SMS Details')}
                id="dashboard-sms-history-tab"
              >
                SMS Details
              </SideBarItem>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              >
                History
              </h3>
              <SideBarItem
                page="Action History"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Action History')}
                id="dashboard-action-history-tab"
              >
                Action History
              </SideBarItem>
              <h3
                style={{
                  fontSize: 'var(--20px-V)',
                  margin: '0px 0px 0px 0px',
                  display: SideBarShowState ? '' : 'none',
                }}
              >
                Reports
              </h3>
              <SideBarItem
                page="Basic Rental income report"
                currentPage={DashboardSelectedPage}
                onClick={() =>
                  setDashboardSelectedPage('Basic Rental income report')
                }
                id="dashboard-basic-rental-income-report-tab"
              >
                Basic Rental income report
              </SideBarItem>
              <p
                style={{
                  fontSize: 'var(--12px-V)',
                  color: 'var(--Text-Color-Grey)',
                  display: SideBarShowState ? '' : 'none',
                }}
              >
                More reports coming soon
              </p>
            </>
          ) : SelectedPage === 'Expense' ? (
            <>
              <h3
                style={{
                  display: SideBarShowState ? '' : 'none',
                  fontSize: 'var(--28px-V)',
                  margin: 'var(--15px-V) 0px var(--15px-V) 0px',
                }}
                id="expense-manager-title"
              >
                Expense Manager
              </h3>
              <div
                className="SideBarTopContainer"
                style={{
                  borderBottom: SideBarShowState
                    ? 'var(--1px-V) solid var(--Text-Color-Grey)'
                    : 'none',
                  width: '90%',
                }}
              >
                {' '}
                {!isMobileState && <button
                  className="SideBarTopButton"
                  onClick={handleCloseSideBar}
                  title="Close Sidebar"
                  style={{ display: SideBarShowState ? '' : 'none' }}
                >
                  {/* <img src={IconsGUI().Left2ArrowIcon} alt="" /> */}
                  Close sidebar
                </button>}
                <button
                  className="SideBarTopButton"
                  onClick={handleAddExpense}
                  title="Add Expense"
                  id="add-expense-button"
                  style={{ display: SideBarShowState ? '' : 'none' }}
                >
                  Add Expense
                </button>
                <button
                  className="SideBarTopButton"
                  onClick={() => {setShowExpenseCalendar(!showExpenseCalendar); if(isMobileState) handleCloseSideBar()}}
                  style={{ display: SideBarShowState ? '' : 'none' }}
                  title="Show Calendar"
                  id="expense-calendar-toggle"
                >
                  {showExpenseCalendar ? 'Hide Calendar' : 'Show Calendar'}
                </button>
              </div>{' '}
              {(searchTerm ||
                selectedCategory.length > 0 ||
                selectedCurrency !== 'all' ||
                minPrice ||
                maxPrice ||
                fullBuildingFilter !== 'all' ||
                floorFilter ||
                roomFilter ||
                beforeTaxFilter !== 'all' ||
                reoccurringFilter !== 'all' ||
                reoccurringTypeFilter !== 'all' ||
                reoccurringDayCount ||
                startDateFilter) && (
                <button
                  className="SideBarTopButton"
                  style={{
                    width: '90%',
                    maxHeight: 'var(--30px-V)',
                    marginTop: 'var(--10px-V)',
                    display: SideBarShowState ? '' : 'none',
                  }}
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory([]);
                    setSelectedCurrency('all');
                    setMinPrice('');
                    setMaxPrice('');
                    setFullBuildingFilter('all');
                    setFloorFilter('');
                    setRoomFilter('');
                    setBeforeTaxFilter('all');
                    setReoccurringFilter('all');
                    setReoccurringTypeFilter('all');
                    setReoccurringDayCount('');
                    setStartDateFilter('');
                  }}
                >
                  Reset Filters
                </button>
              )}
              <div
                style={{
                  display: 'flex',
                  overflowY: 'auto',
                  height: 'calc(100% - var(--200px-V) - var(--35px-V))',
                  flexDirection: 'column',
                  width: '100%',
                  alignItems: 'center',
                }}
              >
                <div
                  className="SearchBarContainer"
                  style={{
                    backgroundColor: 'var(--Secondary-Color30)',
                    margin: 'var(--5px-V)',
                    display: SideBarShowState ? '' : 'none',
                    width: '85%',
                    borderRadius: 'var(--10px-V)',
                    padding: 'var(--10px-V)',
                    boxShadow:
                      'var(--3px-V) var(--3px-V) var(--5px-V) var(---1px-V) var(--Secondary-Color30)',
                  }}
                >
                  <div
                    onClick={() => setShowExpenseFilters(!showExpenseFilters)}
                    style={{
                      cursor: 'pointer',
                      fontSize: 'var(--22px-V)',
                    }}
                    id="expense-filters-toggle"
                  >
                    Search & Filter
                  </div>
                  {showExpenseFilters && (
                    <div
                      style={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        marginLeft: 'var(--10px-V)',
                        marginTop: 'var(--10px-V)',
                        alignItems: 'flex-start',
                      }}
                      id="expense-filters-container"
                    >
                      <div
                        style={{ width: '100%', marginBottom: 'var(--10px-V)' }}
                      >
                        <input
                          type="text"
                          placeholder="Search expenses"
                          id="expense-search-input"
                          style={{ padding: 'var(--5px-V)' }}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <div id="expense-price-filters">
                        <div
                          style={{
                            width: '100%',
                            marginBottom: 'var(--10px-V)',
                          }}
                        >
                          <select
                            value={selectedCurrency}
                            onChange={(e) =>
                              setSelectedCurrency(e.target.value)
                            }
                            style={{ padding: 'var(--5px-V)' }}
                          >
                            <option value="all">All Currencies</option>
                            {GetCurrencyAsOptionsOnSelect()}
                          </select>
                        </div>

                        <div
                          style={{
                            width: '100%',
                            marginBottom: 'var(--10px-V)',
                          }}
                        >
                          Price Range:
                          <div style={{ display: 'flex', gap: 'var(--5px-V)' }}>
                            <input
                              type="number"
                              placeholder="Min"
                              style={{ width: '40%', padding: 'var(--5px-V)' }}
                              value={minPrice}
                              onChange={(e) =>
                                setMinPrice(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : ''
                                )
                              }
                            />
                            <input
                              type="number"
                              placeholder="Max"
                              style={{ width: '40%', padding: 'var(--5px-V)' }}
                              value={maxPrice}
                              onChange={(e) =>
                                setMaxPrice(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : ''
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        style={{ width: '100%', marginBottom: 'var(--10px-V)' }}
                        id="expense-location-filters"
                      >
                        <select
                          value={fullBuildingFilter}
                          onChange={(e) =>
                            setFullBuildingFilter(
                              e.target.value as 'yes' | 'no' | 'all'
                            )
                          }
                          style={{ padding: 'var(--5px-V)' }}
                        >
                          <option value="all">All Buildings</option>
                          <option value="yes">Full Building Only</option>
                          <option value="no">Specific Rooms Only</option>
                        </select>

                        {fullBuildingFilter === 'no' && (
                          <div
                            style={{
                              display: 'flex',
                              gap: 'var(--5px-V)',
                              marginTop: 'var(--5px-V)',
                            }}
                          >
                            <input
                              type="number"
                              placeholder="Floor"
                              value={floorFilter}
                              onChange={(e) => setFloorFilter(e.target.value)}
                              style={{ width: '40%', padding: 'var(--5px-V)' }}
                            />
                            <input
                              type="number"
                              placeholder="Room"
                              value={roomFilter}
                              onChange={(e) => setRoomFilter(e.target.value)}
                              style={{ width: '40%', padding: 'var(--5px-V)' }}
                            />
                          </div>
                        )}
                      </div>

                      <div
                        style={{ width: '100%', marginBottom: 'var(--10px-V)' }}
                        id="expense-tax-filters"
                      >
                        <select
                          value={beforeTaxFilter}
                          onChange={(e) =>
                            setBeforeTaxFilter(
                              e.target.value as 'yes' | 'no' | 'all'
                            )
                          }
                          style={{ padding: 'var(--5px-V)' }}
                        >
                          <option value="all">All Tax Types</option>
                          <option value="yes">Before Tax Only</option>
                          <option value="no">After Tax Only</option>
                        </select>
                      </div>

                      <div
                        style={{ width: '100%', marginBottom: 'var(--10px-V)' }}
                        id="expense-recurring-filters"
                      >
                        <select
                          value={reoccurringFilter}
                          onChange={(e) =>
                            setReoccurringFilter(
                              e.target.value as 'yes' | 'no' | 'all'
                            )
                          }
                          style={{ padding: 'var(--5px-V)' }}
                        >
                          <option value="all">All Recurrence Types</option>
                          <option value="yes">Recurring Only</option>
                          <option value="no">One-time Only</option>
                        </select>

                        {reoccurringFilter === 'yes' && (
                          <>
                            <select
                              value={reoccurringTypeFilter}
                              onChange={(e) =>
                                setReoccurringTypeFilter(
                                  e.target.value as
                                    | 'Day'
                                    | 'Monthly'
                                    | 'Yearly'
                                    | 'all'
                                )
                              }
                              style={{
                                marginTop: 'var(--5px-V)',
                                padding: 'var(--5px-V)',
                              }}
                            >
                              <option value="all">All Periods</option>
                              <option value="Day">By Day Count</option>
                              <option value="Monthly">Monthly</option>
                              <option value="Yearly">Yearly</option>
                            </select>{' '}
                            {reoccurringTypeFilter === 'Day' && (
                              <>
                                <input
                                  type="number"
                                  placeholder="Day Count"
                                  value={reoccurringDayCount}
                                  onChange={(e) =>
                                    setReoccurringDayCount(e.target.value)
                                  }
                                  style={{
                                    width: '40%',
                                    padding: 'var(--5px-V)',
                                  }}
                                />
                              </>
                            )}
                          </>
                        )}
                      </div>

                      <div
                        style={{ width: '100%', marginBottom: 'var(--10px-V)' }}
                        id="expense-date-filter"
                      >
                        <div>Date:</div>
                        <input
                          type="date"
                          value={startDateFilter}
                          onChange={(e) => setStartDateFilter(e.target.value)}
                          style={{ padding: 'var(--5px-V)' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                {/* Categories Section */}
                <div
                  className="SearchBarContainer"
                  style={{
                    backgroundColor: 'var(--Secondary-Color30)',
                    margin: 'var(--5px-V)',
                    display: SideBarShowState ? '' : 'none',
                    width: '85%',
                    borderRadius: 'var(--10px-V)',
                    padding: 'var(--10px-V)',
                    boxShadow:
                      'var(--3px-V) var(--3px-V) var(--5px-V) var(---1px-V) var(--Secondary-Color30)',
                  }}
                >
                  <div
                    onClick={() => setShowExpenseFilters2(!showExpenseFilters2)}
                    style={{
                      cursor: 'pointer',
                      fontSize: 'var(--22px-V)',
                    }}
                    id="expense-categories-container"
                  >
                    Categories
                  </div>
                  {showExpenseFilters2 && (
                    <div style={{ marginTop: 'var(--10px-V)', width: '95%' }}>
                      {[
                        'Property Maintenance',
                        'Utilities',
                        'Administrative',
                        'Staff',
                        'Taxes',
                        'Capital',
                        'Financial',
                        'Security',
                        'Professional',
                        'Other',
                      ].map((category) => (
                        <div
                          key={category}
                          onClick={() =>
                            setSelectedCategory(
                              selectedCategory.includes(category)
                                ? selectedCategory.filter((c) => c !== category)
                                : [...selectedCategory, category]
                            )
                          }
                          className={
                            selectedCategory.includes(category)
                              ? 'expense-filters-categoryButton-Selected'
                              : 'expense-filters-categoryButton'
                          }
                        >
                          {category}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <></>
          )}
        </div>
        {SelectedEditRoomId && (
          <>
            <div
              className="EditRoomScreenMainContainerOpacity"
              onClick={() => {
                setSelectedEditRoomId('');
                setDeleteConfimation(false);
              }}
            ></div>{' '}
            <div className="EditRoomScreenMainContainer" style={{width: isMobileState ? '95%' : ''}}>
              <div style={{ display: 'flex' }}>
                <button
                  onClick={() => {
                    setSelectedEditRoomId('');
                    setDeleteConfimation(false);
                  }}
                >
                  {'<'} Close
                </button>
                <p className="DashboardWigetPieChartTextHeader">
                  Editing Floor:{' '}
                  {
                    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)
                      .floor
                  }{' '}
                  Room:{' '}
                  {
                    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)
                      .roomIndex
                  }{' '}
                  (
                  {
                    RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)
                      .status
                  }
                  )
                </p>
                <button
                  style={{ width: '20%', marginLeft: 'auto' }}
                  onClick={() => {
                    handleDeleteFirst();
                  }}
                >
                  {DeleteConfimation ? 'Confirm Delete' : 'Delete this room'}
                </button>
              </div>{' '}
              {RoomList.find((r: RoomType) => r.id === SelectedEditRoomId)
                .status === 'Empty' && (
                <>
                  {' '}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      width: '100%',
                    }}
                  >
                    <div className="AddaNewRoomRowObject">
                      Payment Cycle :{' '}
                      <select
                        value={tempPaymentCycle}
                        onChange={(e) => setTempPaymentCycle(e.target.value)}
                        onBlur={handleBlurPaymentCycle}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="daily">Daily</option>
                        <option value="30">30</option>
                        <option value="15">15</option>
                        <option value="7">7</option>
                        <option value="Annually">Annually</option>
                        <option value="custom">Custom</option>
                      </select>
                      {tempPaymentCycle === 'custom' && (
                        <input
                          type="number"
                          value={tempPaymentCycleCustomDays}
                          onBlur={handleBlurCustomePaymentCycle}
                          onKeyDown={handleKeyDownCustomePaymentCycle}
                          onChange={(e) =>
                            setTempPaymentCycleCustomDays(e.target.value)
                          }
                        />
                      )}
                    </div>
                    <div className="AddaNewRoomRowObject">
                      Price :{' '}
                      <input
                        className="AddANewRoomInputsSmall"
                        type="number"
                        placeholder="Price"
                        value={tempPrice}
                        onChange={(e) => setTempPrice(e.target.value)}
                        onBlur={handleBlurPrice}
                        onKeyDown={handleKeyDownPrice}
                      />
                    </div>
                    <div className="AddaNewRoomRowObject">
                      Square Meters :{' '}
                      <input
                        className="AddANewRoomInputsSmall"
                        type="number"
                        placeholder="Square Meters"
                        value={tempSquareMeters}
                        onChange={(e) => setTempSquareMeters(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                      />
                    </div>{' '}
                  </div>{' '}
                </>
              )}
              <div style={{ display: 'flex' }}>
                <div
                  style={{
                    height:
                      RoomList.find(
                        (r: RoomType) => r.id === SelectedEditRoomId
                      ).status === 'Empty'
                        ? 'var(--440px-V)'
                        : 'var(--480px-V)',
                    width: isMobileState ? '70%' : '',
                  }}
                  className={`RoomSpecficationsMainContainer ${
                    highlightedFields.includes('specifications')
                      ? 'highlight-reset-field'
                      : ''
                  }`}
                >
                  <h3 style={{ marginTop: '0px' }}>
                    Room Specifications{' - '}
                    <button
                      onClick={() => {
                        const ids = uuidv4();
                        roomSpecificationAPI.addRoomSpecification(
                          ids,
                          RoomList.find(
                            (r: RoomType) => r.id === SelectedEditRoomId
                          ).id,
                          'something',
                          1,
                          'bool',
                          '1'
                        );
                        let updatedSpecifications = RoomList.find(
                          (r: RoomType) => r.id === SelectedEditRoomId
                        ).RoomSpecifications;
                        updatedSpecifications.push({
                          id: ids,
                          Detail: 'something',
                          Number: 1,
                          type: 'bool',
                          Boolean: true,
                        });
                        updateRoomPropertyLocal(
                          SelectedEditRoomId,
                          'RoomSpecifications',
                          updatedSpecifications
                        );
                      }}
                    >
                      Add
                    </button>
                  </h3>
                  {RoomList.find(
                    (r: RoomType) => r.id === SelectedEditRoomId
                  ).RoomSpecifications.map(
                    (
                      spec: {
                        Detail: string | number | readonly string[] | undefined;
                        id: any;
                        type: string;
                        Boolean: boolean | undefined;
                        Number: string | number | readonly string[] | undefined;
                      },
                      index: React.Key | null | undefined
                    ) => (
                      <div
                        key={index}
                        className="AddANewRoomSpecObjectMainContainer"
                      >
                        <div>
                          Name:
                          <input
                            className="AddANewRoomInputsMid"
                            value={spec.Detail}
                            placeholder="Enter name"
                            onChange={(e) => {
                              roomSpecificationAPI.editRoomSpecificationApi(
                                spec.id,
                                'Detail',
                                e.target.value,
                                spec.Detail
                              );
                              const updatedSpecifications = RoomList.find(
                                (r: RoomType) => r.id === SelectedEditRoomId
                              ).RoomSpecifications.map((s: { id: any }) =>
                                s.id === spec.id
                                  ? { ...s, Detail: e.target.value }
                                  : s
                              );
                              updateRoomPropertyLocal(
                                SelectedEditRoomId,
                                'RoomSpecifications',
                                updatedSpecifications
                              );
                            }}
                          />
                          {spec.type === 'bool' ? (
                            <>
                              <input
                                type="checkbox"
                                checked={spec.Boolean}
                                onChange={(e) => {
                                  roomSpecificationAPI.editRoomSpecificationApi(
                                    spec.id,
                                    'Boolean',
                                    e.target.checked,
                                    spec.Boolean
                                  );
                                  const updatedSpecifications = RoomList.find(
                                    (r: RoomType) => r.id === SelectedEditRoomId
                                  ).RoomSpecifications.map((s: { id: any }) =>
                                    s.id === spec.id
                                      ? { ...s, Boolean: e.target.checked }
                                      : s
                                  );
                                  updateRoomPropertyLocal(
                                    SelectedEditRoomId,
                                    'RoomSpecifications',
                                    updatedSpecifications
                                  );
                                }}
                              />{' '}
                              {spec.Boolean ? 'Yes' : 'No'}
                              {}
                            </>
                          ) : (
                            <input
                              type="number"
                              className="AddANewRoomInputsSmall"
                              value={spec.Number}
                              onChange={(e) => {
                                roomSpecificationAPI.editRoomSpecificationApi(
                                  spec.id,
                                  'Number',
                                  e.target.value,
                                  spec.Number
                                );
                                const updatedSpecifications = RoomList.find(
                                  (r: RoomType) => r.id === SelectedEditRoomId
                                ).RoomSpecifications.map((s: { id: any }) =>
                                  s.id === spec.id
                                    ? { ...s, Number: e.target.value }
                                    : s
                                );
                                updateRoomPropertyLocal(
                                  SelectedEditRoomId,
                                  'RoomSpecifications',
                                  updatedSpecifications
                                );
                              }}
                            />
                          )}
                        </div>
                        <div>
                          <input
                            type="radio"
                            name={`spec-${index}`}
                            value="bool"
                            checked={spec.type === 'bool'}
                            onChange={(e) => {
                              roomSpecificationAPI.editRoomSpecificationApi(
                                spec.id,
                                'type',
                                'bool',
                                spec.type
                              );

                              const updatedSpecifications = RoomList.find(
                                (r: RoomType) => r.id === SelectedEditRoomId
                              ).RoomSpecifications.map((s: { id: any }) =>
                                s.id === spec.id ? { ...s, type: 'bool' } : s
                              );
                              updateRoomPropertyLocal(
                                SelectedEditRoomId,
                                'RoomSpecifications',
                                updatedSpecifications
                              );
                            }}
                          />{' '}
                          Yes/No
                          <input
                            type="radio"
                            name={`spec-${index}`}
                            value="number"
                            checked={spec.type === 'number'}
                            onChange={(e) => {
                              roomSpecificationAPI.editRoomSpecificationApi(
                                spec.id,
                                'type',
                                'number',
                                spec.type
                              );

                              const updatedSpecifications = RoomList.find(
                                (r: RoomType) => r.id === SelectedEditRoomId
                              ).RoomSpecifications.map((s: { id: any }) =>
                                s.id === spec.id ? { ...s, type: 'number' } : s
                              );
                              updateRoomPropertyLocal(
                                SelectedEditRoomId,
                                'RoomSpecifications',
                                updatedSpecifications
                              );
                            }}
                          />{' '}
                          Number
                          <button
                            onClick={() => {
                              roomSpecificationAPI.deleteRoomSpecificationApi(
                                spec.id
                              );
                              const updatedSpecifications = RoomList.find(
                                (r: RoomType) => r.id === SelectedEditRoomId
                              ).RoomSpecifications.filter(
                                (s: { id: any }) => s.id !== spec.id
                              );
                              updateRoomPropertyLocal(
                                SelectedEditRoomId,
                                'RoomSpecifications',
                                updatedSpecifications
                              );
                            }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <ImageInteractor
                  onAddImage={() => handleAddImage(SelectedEditRoomId)}
                  onDeleteImage={(index) =>
                    handleDeleteImage(SelectedEditRoomId, index)
                  }
                  onShowInExplorer={handleShowInExplorer}
                  room={RoomList.find(
                    (r: RoomType) => r.id === SelectedEditRoomId
                  )}
                />
              </div>
            </div>
          </>
        )}
        <div
          style={{
            width:
              HideSideBarForCalendar || isMobileState
                ? '100%'
                : `calc(100% - var(--${SideBarWidth}px-V))`,
            height:isMobileState?"": SelectedPage === 'Tools' ? 'calc(100% - var(--60px-V))' :SelectedPage === 'Rooms' ?  'calc(100% - var(--60px-V))' :SelectedPage === 'Expense' ? 'calc(100% - var(--60px-V))' : '',
            overflowY: SelectedPage === 'Tools' ?  ToolsSelectedPage === "Database" ? "hidden":'auto' : 'auto',
          }}
        >
          {isMobileState && SideBarShowState ? (
            <>
              <div
                onClick={() => handleCloseSideBar()}
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: 'calc(100% - var(--110px-V))',
                  backgroundColor: '#000000',
                  opacity: '0.5',
                  zIndex: '1',
                }}
              ></div>
            </>
          ) : (
            <></>
          )}

          {SelectedPage === 'Rooms' && (
            <>
              {showRoomCalendar ? (
                <>
                  <CalendarPage
                    updateRoomProperty={updateRoomProperty}
                    RoomList={RoomList}
                    sortedAndFilteredRooms={RoomList}
                    removeFilterOption={removeFilterOption}
                    filterOptions={[]}
                    SelectedBranchId={SelectedBranchId}
                  />
                </>
              ) : (
                <>
                  {' '}
                  <RoomListComponent
                    setChangeProgress={setChangeProgress}
                    changeProgress={changeProgress}
                    SelectedAppUser={SelectedAppUser}
                    updateRoomProperty={updateRoomProperty}
                    updateRoomPropertyWithOutRefresh={
                      updateRoomPropertyWithOutRefresh
                    }
                    SelectedAppUser={SelectedAppUser}
                    SelectedBranchId={SelectedBranchId}
                    SelectedUserId={SelectedUserId}
                    ShowArchived={ShowArchived}
                    agreementApi={agreementApi}
                    updateRoomPropertyLocal={updateRoomPropertyLocal}
                    handleAddRoomButtonInitial={handleAddRoomButtonInitial}
                    brokerApi={brokerApi}
                    BrokerList={BrokerList}
                    setBrokerList={setBrokerList}
                    pastTenantReviewApi={pastTenantReviewApi}
                    RoomList={RoomList}
                    sortedAndFilteredRooms={sortedAndFilteredRooms}
                    removeFilterOption={removeFilterOption}
                    filterOptions={filterOptions}
                    tenantAPI={tenantAPI}
                    AddARoomState={AddARoomState}
                    setAddARoomState={setAddARoomState}
                    roomPaymentInfoApi={roomPaymentInfoApi}
                    isUpdatingTenantList={isUpdatingTenantList}
                    setIsUpdatingTenantList={setIsUpdatingTenantList}
                    setSelectedEditRoomId={setSelectedEditRoomId}
                    brokersRecommendationListApi={brokersRecommendationListApi}
                    setChangeMade={setChangeMade}
                    roomListContainerRef={roomListContainerRef}
                  />
                </>
              )}
            </>
          )}
          {SelectedPage === 'People' && (
            <PeopleComponentPage
              agreementApi={agreementApi}
              PeopleSelectedPage={PeopleSelectedPage}
              PastTenantReviews={PastTenantReviews}
              RoomList={RoomList}
              BrokerList={BrokerList}
              RefreshDataFromSqlite={RefreshDataFromSqlite}
              BrokerRecommendationList={BrokerRecommendationList}
            />
          )}
          {SelectedPage === 'Tools' && (
            <ToolsPage
              signOutUserAndRestart={signOutUserAndRestart}
              ToolsSelectedPage={ToolsSelectedPage}
              setToolsSelectedPage={setToolsSelectedPage}
              SelectedAppUser={SelectedAppUser}
              setChangeMade={setChangeMade}
              SelectedUserId={SelectedUserId}
              SelectedBranchId={SelectedBranchId}
            />
          )}
          {SelectedPage === 'Calendar' && (
            <CalendarPage
              updateRoomProperty={updateRoomProperty}
              RoomList={RoomList}
              sortedAndFilteredRooms={RoomList}
              removeFilterOption={removeFilterOption}
              filterOptions={[]}
              SelectedBranchId={SelectedBranchId}
            />
          )}
          {SelectedPage === 'Settings' && (
            <RoomListComponent
              updateRoomProperty={updateRoomProperty}
              RoomList={RoomList}
              roomPaymentInfoApi={roomPaymentInfoApi}
              sortedAndFilteredRooms={sortedAndFilteredRooms}
              removeFilterOption={removeFilterOption}
              filterOptions={filterOptions}
              setChangeMade={setChangeMade}
            />
          )}
          {SelectedPage === 'Dashboard' && (
            <DashboardPage
              roomPaymentInfoApi={roomPaymentInfoApi}
              RoomList={RoomList}
              BrokerList={BrokerList}
              PastTenantReviews={PastTenantReviews}
              BrokerRecommendationList={BrokerRecommendationList}
              DashboardSelectedPage={DashboardSelectedPage}
              SelectedUserId={SelectedUserId}
              setChangeMade={setChangeMade}
              updateRoomPropertyLocal={updateRoomPropertyLocal}
              updateRoomProperty={updateRoomProperty}
              SelectedBranchId={SelectedBranchId}
              agreementApi={agreementApi}
            />
          )}
          {SelectedPage === 'Database' && (
            <DatabasePage
              setChangeMade={setChangeMade}
              SelectedAppUser={SelectedAppUser}
              SelectedBranchId={SelectedBranchId}
            />
          )}
          {SelectedPage === 'Expense' && (
            <ExpenseManager
              setChangeMade={setChangeMade}
              SelectedUserId={SelectedUserId}
              SelectedBranchId={SelectedBranchId}
              searchTerm={searchTerm}
              selectedCategory={selectedCategory}
              selectedCurrency={selectedCurrency}
              minPrice={minPrice}
              maxPrice={maxPrice}
              fullBuildingFilter={fullBuildingFilter}
              floorFilter={floorFilter}
              roomFilter={roomFilter}
              beforeTaxFilter={beforeTaxFilter}
              reoccurringFilter={reoccurringFilter}
              reoccurringTypeFilter={reoccurringTypeFilter}
              startDateFilter={startDateFilter}
              expenses={expenses}
              setExpenses={setExpenses}
              setEditingExpenseId={setEditingExpenseId}
              setEditedExpense={setEditedExpense}
              editingExpenseId={editingExpenseId}
              editedExpense={editedExpense}
              reoccurringDayCount={reoccurringDayCount}
              setReoccurringDayCount={setReoccurringDayCount}
              showExpenseCalendar={showExpenseCalendar}
              setShowExpenseCalendar={setShowExpenseCalendar}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(MainPage);
