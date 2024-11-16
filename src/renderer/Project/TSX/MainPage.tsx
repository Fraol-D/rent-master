import { RoomListComponent } from './Pages/RoomListComponent';
import { PeopleComponentPage } from './Pages/PeopleComponentPage';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from './Helpers/CustomReactComponents';
const { v4: uuidv4 } = require('uuid');
import ImageInteractor from './Helpers/GUIs/ImageIntractorGUI';
import LONGIMAGE from './Helpers/WIN_20240802_19_41_23_Pro.jpg';
import Room from './Helpers/Room';
import '../CSS/RoomArea.css';
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
} from 'Backend/localServerApis';
import ImageInteractor2 from './Helpers/GUIs/ImageInteractor2';
import { set } from 'date-fns';
import DashboardPage from './Pages/DashboardPage';
import DatabasePage from './Pages/DatabasePage';
import ToolsPage from './Pages/ToolsPage';
import { getUserPrivileges } from 'renderer/App';
import { UpdateButton } from 'renderer/components/UpdateButton';
import CurrencySign, {
  GetCurrencyAsOptionsOnSelect,
  GetDefaultCurrency,
} from './Helpers/CurrencySign';
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
    price: string;
    custom: boolean;
    branchId: string; // Added
    Currency: string;
    userId: string;
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
    agreedPrice: string;
    TIN: string;
    RentReason: string;
    AddedTime: number;
    Currency: string;
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
  type AllRoomPayInfo = {
    RoomPayInfo: RoomPayInfo[];
  };
  type RoomPayInfo = {
    id: string;
    roomId: string;
    branchId: string; // Added
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
  TenantList,
  setTenantList,
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
}: any) => {
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
    '=' | '<' | '>' | 'None'
  >('None');
  const [FilterDueDateOperator, setFilterDueDateOperator] = useState<
    '=' | '<' | '>' | 'None'
  >('None');
  const [filterPriceValue, setFilterPriceValue] = useState<string>('');
  const [FilterDueDateValue, setFilterDueDateValue] = useState<string>('');
  const [filterSquareFeetOperator, setFilterSquareFeetOperator] = useState<
    '=' | '<' | '>' | 'None'
  >('None');
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
  const addFilterOption = (key: string, value: any) => {
    setFilterOptions((prevOptions) => {
      return [
        ...prevOptions.filter((option) => option.key !== key),
        { key, value },
      ];
    });
  };

  const removeFilterOption = (indexaggg: number) => {
    setFilterOptions((options) => {
      const removedOption = options[indexaggg];
      console.log(removedOption.key);

      if (removedOption.key === 'floor') {
        setFloorFilter(''); // Reset the floor filter
      } else if (removedOption.key === 'tenantName') {
        setFloorFilter(''); // Reset the floor filter
      } else if (removedOption.key === 'room') {
        setRoomFilter(''); // Reset the room filter
      } else if (removedOption.key === 'sort') {
        setSortType('name'); // Reset the sort type to the default
      } else if (removedOption.key === 'filterstatus') {
        setFilterStatus('all'); // Reset the filter status to 'all'
      } else if (removedOption.key === 'filterPriceValue') {
        setFilterPriceValue(''); // Reset the filter price value
      } else if (removedOption.key === 'filterDueDateValue') {
        setFilterDueDateValue(''); // Reset the filter price value
      } else if (removedOption.key === 'filterSquareFeetValue') {
        setFilterSquareFeetValue(''); // Reset the filter square feet value
      } else if (removedOption.key === 'selectedCurrency') {
        setSelectedCurrency('all');
      }
      // If none of the above conditions are met, it will handle unknown keys by doing nothing

      const newOptions = [];
      for (let i = 0; i < options.length; i++) {
        if (i !== indexaggg) {
          newOptions.push(options[i]);
        }
      }
      return newOptions;
    });
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
    let filteredRooms = RoomList || [];

    // Loop through the filter options and apply them to the rooms
    filterOptions.forEach((option) => {
      const { key, value } = option;

      switch (key) {
        case 'floor':
          filteredRooms = filteredRooms.filter(
            (room: { floor: { toString: () => any } }) =>
              room.floor.toString() === value
          );
          break;
        case 'tenantName':
          if (TenantList.length > 0)
            filteredRooms = filteredRooms.filter((room: { tenantId: any }) =>
              TenantList.find((tenant: any) => tenant.id === room.tenantId)
                ?.name.toLowerCase()
                .includes(value.toLowerCase())
            );

          break;
        case 'room':
          filteredRooms = filteredRooms.filter(
            (room: { roomIndex: { toString: () => any } }) =>
              room.roomIndex.toString() === value
          );
          break;
        case 'filterstatus':
          if (value === 'None') {
            filteredRooms = filteredRooms.filter(
              (room: { status: any }) => !room.status
            );
          } else {
            filteredRooms = filteredRooms.filter(
              (room: { status: any }) => room.status === value
            );
          }
          break;
        case 'filterDueDateValue':
          if (!isNaN(parseInt(value, 10)) && FilterDueDateOperator !== 'None') {
            const daysUntilPayment = parseInt(value, 10);
            switch (FilterDueDateOperator) {
              case '=':
                filteredRooms = filteredRooms.filter(
                  (room: {
                    AllRoomPayInfo: {
                      RoomPayInfo: { Day: number; Paid: boolean }[];
                    };
                  }) =>
                    getDaysUntilPayment(room.AllRoomPayInfo) ===
                    daysUntilPayment
                );
                break;
              case '<':
                filteredRooms = filteredRooms.filter(
                  (room: {
                    AllRoomPayInfo: {
                      RoomPayInfo: { Day: number; Paid: boolean }[];
                    };
                  }) =>
                    getDaysUntilPayment(room.AllRoomPayInfo) < daysUntilPayment
                );
                break;
              case '>':
                filteredRooms = filteredRooms.filter(
                  (room: {
                    AllRoomPayInfo: {
                      RoomPayInfo: { Day: number; Paid: boolean }[];
                    };
                  }) =>
                    getDaysUntilPayment(room.AllRoomPayInfo) > daysUntilPayment
                );
                break;
              default:
                // Optionally handle unexpected operators
                console.warn(`Unexpected operator: ${FilterDueDateOperator}`);
                break;
            }
          }
          break;

        case 'filterPriceValue':
          if (!isNaN(parseInt(value, 10)) && filterPriceOperator !== 'None') {
            const price = parseInt(value, 10);
            switch (filterPriceOperator) {
              case '=':
                filteredRooms = filteredRooms.filter(
                  (room: { price: number }) => room.price === price
                );
                break;
              case '<':
                filteredRooms = filteredRooms.filter(
                  (room: { price: number }) => room.price < price
                );
                break;
              case '>':
                filteredRooms = filteredRooms.filter(
                  (room: { price: number }) => room.price > price
                );
                break;
              default:
                break;
            }
          }
          break;
        case 'filterSquareFeetValue':
          if (
            !isNaN(parseInt(value, 10)) &&
            filterSquareFeetOperator !== 'None'
          ) {
            const squareFeet = parseInt(value, 10);
            switch (filterSquareFeetOperator) {
              case '=':
                filteredRooms = filteredRooms.filter(
                  (room: { squareMeters: number }) =>
                    room.squareMeters === squareFeet
                );
                break;
              case '<':
                filteredRooms = filteredRooms.filter(
                  (room: { squareMeters: number }) =>
                    room.squareMeters < squareFeet
                );
                break;
              case '>':
                filteredRooms = filteredRooms.filter(
                  (room: { squareMeters: number }) =>
                    room.squareMeters > squareFeet
                );
                break;
              default:
                break;
            }
          }
          break;
        case 'selectedCurrency':
          if (value !== 'all')
            filteredRooms = filteredRooms.filter(
              (room: { Currency: string }) => room.Currency === value
            );
          break;
        case 'sort':
          // You can decide how to handle sorting here
          break;
        default:
          break;
      }
    });

    return filteredRooms.length > 0
      ? filteredRooms.sort(
          (
            a: { price: number; floor: number; roomIndex: number },
            b: { price: number; floor: number; roomIndex: number }
          ) => {
            const comparison = sortDirection === 'asc' ? -1 : 1;
            switch (sortType) {
              /* case 'name':
          return (
           /* comparison *
            TenantList > 0 ?(TenantList.find((tenant:any) => tenant.id === a.tenantId)?.name || '').localeCompare(TenantList.find((tenant:any) => tenant.id === b.tenantId)?.name || ''):
          );*/
              case 'price':
                return comparison * (a.price - b.price);
              case 'floor':
                return comparison * (a.floor - b.floor);
              case 'room':
                return comparison * (a.roomIndex - b.roomIndex);
              default:
                return 0;
            }
          }
        )
      : [];
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

  const sortedAndFilteredRooms = filterAndSortRooms();

  const [PeopleSelectedPage, setPeopleSelectedPage] = useState<
    'TenantsList' | 'BrokersList' | 'TenantReviews'
  >('TenantsList');
  const [ToolsSelectedPage, setToolsSelectedPage] = useState<
    'EmailTemplates' | 'SMSTemplates' | 'Expense Manager' | 'Settings'
  >('EmailTemplates');
  const [DashboardSelectedPage, setDashboardSelectedPage] = useState<
    'Overview' | 'Email History' | 'Expenses' | 'Action History'| 'SMS Details'
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
    useState<RoomSpecificationType[]>([]);

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

    try {
      setIsAddingRoom(true); // Start loading

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
      }
      
      setRoomExistsWarning(false);
      setIsMoreThanOneImage(false);
      setRefreshInspectorForAddRoom(true);

      

    } catch (error) {
      console.error('Error adding room:', error);
    } finally {
      setIsAddingRoom(false); // End loading
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
        setAddRoomFormRoomSpecifications([]);
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
      setAddRoomFormRoomSpecifications([]);
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
    setAddRoomFormRoomSpecifications([]);
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
  const handleDeleteFirst = async () => {
    if (!DeleteConfimation) setDeleteConfimation(true);
    if (DeleteConfimation) {
      if (
        RoomList.find((r: RoomType) => r.id === SelectedEditRoomId).status ===
        'Taken'
      ) {
        alert('You can not delete a room that is taken');
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
      RefreshDataFromSqlite();
    }
    if (SelectedPage === 'Calendar' || SelectedPage === 'Database') {
      setHideSideBarForCalendar(true);
    } else {
      setHideSideBarForCalendar(false);
    }
    if (
      SelectedPage === 'People' ||
      SelectedPage === 'Dashboard' ||
      SelectedPage === 'ToolsPage'
    ) {
      if (!SideBarShowState) {
        setSideBarWidth(290);
        setSideBarShowState(true);
      }
    }
  }, [SelectedPage]);

  const handleAddRoomButtonInitial = (state: boolean, plusOne?: boolean) => {
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
  const [SideBarWidth, setSideBarWidth] = useState<number>(290);
  const [SideBarShowState, setSideBarShowState] = useState<boolean>(true);

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
    setFilterPriceOperator('None');
    setFilterPriceValue('');
    setFilterDueDateOperator('None');
    setFilterDueDateValue('');
    setFilterSquareFeetOperator('None');
    setFilterSquareFeetValue('');
    setSelectedCurrency('all');
    setSortType('name');
    setSortDirection('asc');
  }
  const [RefreshInspectorForAddRoom, setRefreshInspectorForAddRoom] =
    useState(false);
  useEffect(() => {}, []);
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
    } else {
      if (OnDataBase) {
        RefreshDataFromSqlite();

        setOnDataBase(false);
      } else {
      }
    }
  }, [SelectedPage]);

  const SideBarItem = ({ page, currentPage, onClick, children }: any) => (
    <button
      onClick={onClick}
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
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

  return (
    <>
      <div
        className="MainContainerMain"
        style={{
          height:
            SelectedPage === 'Dashboard'
              ? 'calc(100% - var(--60px-V))'
              : '100%',
        }}
      >
        <button
          className="SideBarShowButton"
          onClick={handleCloseSideBar}
          style={{
            zIndex: 2,
            visibility: SideBarShowState
              ? 'hidden'
              : HideSideBarForCalendar
              ? 'hidden'
              : HideSideBarForDashboard
              ? 'hidden'
              : 'visible',
          }}
        >
          Show Sidebar
        </button>
        <div
          className="SideBarContainer"
          style={{
            width: HideSideBarForCalendar
              ? 'var(--0px-V)'
              : `var(--${SideBarWidth}px-V)`,
            transition: 'all .2s',
            visibility: HideSideBarForCalendar ? 'hidden' : 'visible',
          }}
        >
          {SelectedPage === 'Rooms' ? (
            <>
              <div
                className="SideBarTopContainer"
                style={{
                  borderBottom: SideBarShowState
                    ? 'var(--1px-V) solid var(--Text-Color-Grey)'
                    : 'none',
                }}
              >
                <button
                  className="SideBarTopButton"
                  onClick={handleCloseSideBar}
                >
                  close sidebar
                </button>
                {privileges.addRoom ? (
                  <button
                    className="SideBarTopButton"
                    onClick={() => {
                      handleAddRoomButtonInitial(!AddARoomState);
                    }}
                  >
                    Add room
                  </button>
                ) : (
                  <></>
                )}
                <button
                  className="SideBarTopButton"
                  onClick={handleClearFilters}
                  style={{
                    visibility: SideBarShowState ? 'visible' : 'hidden',
                  }}
                >
                  Clear Filters
                </button>
                <button
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
                </button>{' '}
              </div>
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
                      height: isSearchOpen ? 'var(--115px-V)' : 'var(--50px-V)',
                    }}
                  >
                    <div
                      onClick={toggleSearch}
                      style={{
                        cursor: 'pointer',
                        fontSize: 'var(--22px-V)',
                        marginLeft: 'var(--10px-V)',
                        color: 'var(--Accent-Color)',
                      }}
                    >
                      {isSearchOpen ? '▼' : '▶'} Search rooms
                    </div>
                    {isSearchOpen && (
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          marginLeft: 'var(--30px-V)',
                          alignItems: 'flex-start',
                        }}
                      >
                        {' '}
                        <div className="TenantSearchBarContainer">
                          {' '}
                          Tenant name:
                          <input
                            type="text1"
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
                            {' '}
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
                  <div className="AdvanceRoomFinding">
                    <div
                      onClick={toggleFilter}
                      style={{
                        cursor: 'pointer',
                        fontSize: 'var(--22px-V)',
                        marginLeft: 'var(--10px-V)',
                        color: 'var(--Accent-Color)',
                      }}
                    >
                      {isFilterOpen ? '▼' : '▶'} Filter rooms
                    </div>
                    {isFilterOpen && (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginRight: 'var(--10px-V)',
                            flexDirection: 'row',
                            justifyContent: 'flex-start',
                            marginLeft: 'var(--30px-V)',
                            marginTop: 'var(--10px-V)',
                          }}
                        >
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
                            }}
                          >
                            <option value="Taken">Taken</option>
                            <option value="Empty">Empty</option>
                          </select>
                        </div>
                        <div
                          className="AdvanceRoomFindingINPUTCONTAINER"
                          style={{
                            width: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            justifyContent: 'flex-start',
                            marginLeft: 'var(--30px-V)',
                          }}
                        >
                          <div style={{ marginTop: 'var(--10px-V)' }}>
                            <div>
                              Filter Price:
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
                                  width: 'var(--30px-V)',
                                  height: 'var(--30px-V)',
                                }}
                                className="filter-drop"
                              >
                                <option value="=">{'='}</option>
                                <option value="<">{'<'}</option>
                                <option value=">">{'>'}</option>
                                <option value="none">none</option>
                              </select>
                              <input
                                type="number"
                                className="AdvanceRoomFindingInput"
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
                          </div>
                          <div
                            style={{
                              marginBottom: 'var(--10px-V)',
                              marginTop: 'var(--10px-V)',
                            }}
                          >
                            <div>
                              Filter due dates:
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
                                  width: 'var(--30px-V)',
                                  height: 'var(--30px-V)',
                                }}
                                className="filter-drop"
                              >
                                <option value="=">{'='}</option>
                                <option value="<">{'<'}</option>
                                <option value=">">{'>'}</option>
                                <option value="none">none</option>
                              </select>
                              <input
                                type="number"
                                className="AdvanceRoomFindingInput"
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
                          </div>
                          <div>
                            <div>
                              Filter SMeters:
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
                                  width: 'var(--30px-V)',
                                  height: 'var(--30px-V)',
                                }}
                                className="filter-drop"
                              >
                                <option value="=">{'='}</option>
                                <option value="<">{'<'}</option>
                                <option value=">">{'>'}</option>
                                <option value="none">none</option>
                              </select>
                              <input
                                type="number"
                                className="AdvanceRoomFindingInput"
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
                          </div>
                          <div>
                            <div
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              Filter Currency:
                              <div className="FilterSection">
                                <select
                                  value={selectedCurrency}
                                  onChange={(e) => {
                                    setSelectedCurrency(e.target.value);
                                    addFilterOption(
                                      'selectedCurrency',
                                      e.target.value
                                    );
                                  }}
                                  className="FilterSelect"
                                >
                                  <option value="all">All Currencies</option>
                                  {GetCurrencyAsOptionsOnSelect()}
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            visibility: 'hidden',
                          }}
                        >
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
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <UpdateButton />
              </div>

              <div
                className="SideBarRoomPageBottomPartAddRoom"
                style={{
                  height: AddARoomState ? 'calc(100% - var(--130px-V))' : '0%',
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
                      <div className="AddaNewRoomRowObject">
                        Currency:
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
                      <div className="AddaNewRoomRowObject">
                        Price (inc. VAT):
                        <input
                          className={`AddANewRoomInputsSmall ${
                            highlightedFields.includes('roomPrice')
                              ? 'highlight-reset-field'
                              : ''
                          }`}
                          type="number"
                          placeholder="Price"
                          value={AddRoomFormPrice}
                          onChange={(e) =>
                            setAddRoomFormPrice(parseInt(e.target.value))
                          }
                        />
                        {CurrencySign(AddRoomFormCurrency)}
                      </div>
                      <div className="AddaNewRoomRowObject">
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
                          <option value= "7">7 days</option>
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
                      <div className="AddaNewRoomRowObject">
                        Square Meters:
                        <input
                          className={`AddANewRoomInputsSmall ${
                            highlightedFields.includes('squareMeters')
                              ? 'highlight-reset-field'
                              : ''
                          }`}
                          type="number"
                          placeholder="Square Meters"
                          value={AddRoomFormSquareMeters}
                          onChange={(e) =>
                            setAddRoomFormSquareMeters(parseInt(e.target.value))
                          }
                        />
                      </div>

                      <div className="RoomSpecficationsMainContainer">
                        <h3>
                          Room Specifications{' - '}
                          <button onClick={addAddRoomFormSpecification}>
                            Add
                          </button>
                        </h3>
                        {AddRoomFormRoomSpecifications.map((spec, index) => (
                          <div
                            key={index}
                            className="AddANewRoomSpecObjectMainContainer"
                          >
                            <div>
                              Name:
                              <input
                                className="AddANewRoomInputsMid"
                                value={spec.Detail}
                                onChange={(e) =>
                                  handleAddRoomFormSpecificationChange(
                                    index,
                                    'Detail',
                                    e.target.value
                                  )
                                }
                              />
                              {spec.type === 'bool' ? (
                                <>
                                  <input
                                    type="checkbox"
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
                                />
                              )}
                            </div>
                            <div>
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
                              Number{' - - '}
                              <button
                                onClick={() =>
                                  removeAddRoomFormSpecification(index)
                                }
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="AddARoomImageMainContainer">
                        <ImageInteractor2
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
                    >
                      {isAddingRoom ? 'Adding...' : 'Add Room'}
                    </button>
                  )}
                </div>
              </div>
            </>
          ) : SelectedPage === 'People' ? (
            <>
              <p>
                Peoples page{' '}
                <button onClick={RefreshDataFromSqlite}>Refresh</button>
              </p>

              <SideBarItem
                page="TenantsList"
                currentPage={PeopleSelectedPage}
                onClick={() => setPeopleSelectedPage('TenantsList')}
              >
                Tenant list
              </SideBarItem>
              <SideBarItem
                page="BrokersList"
                currentPage={PeopleSelectedPage}
                onClick={() => setPeopleSelectedPage('BrokersList')}
              >
                Broker list
              </SideBarItem>
              <SideBarItem
                page="TenantReviews"
                currentPage={PeopleSelectedPage}
                onClick={() => setPeopleSelectedPage('TenantReviews')}
              >
                Tenant Reviews
              </SideBarItem>
            </>
          ) : SelectedPage === 'Tools' ? (
            <>
              {privileges.editEmailTemplates && (
                <SideBarItem
                  page="EmailTemplates"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('EmailTemplates')}
                >
                  Email Settings
                </SideBarItem>
              )}
              {privileges.editSmsTemplates && (
                <SideBarItem
                  page="SMSTemplates"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('SMSTemplates')}
                >
                  SMS Settings
                </SideBarItem>
              )}
              {privileges.editExpenses && (
                <SideBarItem
                  page="Expense Manager"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('Expense Manager')}
                >
                  Expense Manager
                </SideBarItem>
              )}
              
              {privileges.editSettings && (
                <SideBarItem
                  page="Settings"
                  currentPage={ToolsSelectedPage}
                  onClick={() => setToolsSelectedPage('Settings')}
                >
                  Settings
                </SideBarItem>
              )}
              
            </>
          ) : SelectedPage === 'Dashboard' ? (
            <>
              <SideBarItem
                page="Overview"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Overview')}
              >
                Overview
              </SideBarItem>
              <SideBarItem
                page="Expenses"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Expenses')}
              >
                Expenses
              </SideBarItem>
              <SideBarItem
                page="Email History"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Email History')}
              >
                Email History
              </SideBarItem>
              <SideBarItem
                page="SMS Details"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('SMS Details')}
              >
                SMS Details
              </SideBarItem>
              <SideBarItem
                page="Action History"
                currentPage={DashboardSelectedPage}
                onClick={() => setDashboardSelectedPage('Action History')}
              >
                Action History
              </SideBarItem>
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
            <div className="EditRoomScreenMainContainer">
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
                  }
                </p>
              </div>{' '}
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
              </div>
              <div style={{ display: 'flex' }}>
                <div className={`RoomSpecficationsMainContainer ${
    highlightedFields.includes('specifications') ? 'highlight-reset-field' : ''
  }`}>
                  <h3>
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
                          Number{' - - '}
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
              <button
                onClick={() => {
                  handleDeleteFirst();
                }}
              >
                {DeleteConfimation ? 'Confirm Delete' : 'Delete this room'}
              </button>
            </div>
          </>
        )}
        <div
          style={{
            width: HideSideBarForCalendar
              ? '100%'
              : `calc(100% - var(--${SideBarWidth}px-V))`,
            overflowY: SelectedPage === 'Database' ? 'hidden' : 'auto',
            height:
              SelectedPage === 'Database' || SelectedPage === 'Tools'
                ? 'calc(100% - var(--60px-V))'
                : '',
          }}
        >
          {SelectedPage === 'Rooms' && (
            <RoomListComponent
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
              setTenantList={setTenantList}
              tenantAPI={tenantAPI}
              TenantList={TenantList}
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
          )}
          {SelectedPage === 'People' && (
            <PeopleComponentPage
              TenantList={TenantList}
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
              tenantList={TenantList}
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
              tenantList={TenantList}
              BrokerList={BrokerList}
              PastTenantReviews={PastTenantReviews}
              BrokerRecommendationList={BrokerRecommendationList}
              DashboardSelectedPage={DashboardSelectedPage}
              SelectedUserId={SelectedUserId}
              setChangeMade={setChangeMade}
              updateRoomPropertyLocal={updateRoomPropertyLocal}
              updateRoomProperty={updateRoomProperty}
              SelectedBranchId={SelectedBranchId}
            />
          )}
          {SelectedPage === 'Database' && (
            <DatabasePage
              setChangeMade={setChangeMade}
              SelectedAppUser={SelectedAppUser}
              SelectedBranchId={SelectedBranchId}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default React.memo(MainPage);
