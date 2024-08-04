import { RoomListComponent } from './Pages/RoomListComponent';
import { PeopleComponentPage } from './Pages/PeopleComponentPage';
import React, { useEffect, useState } from 'react';
const { v4: uuidv4 } = require('uuid');
import ImageInteractor from './Helpers/ImageIntractorGUI';
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
  getValuesWithSql,
  renameFolder,
  updateValue,
} from 'Backend/localServerApis';
import ImageInteractor2 from './Helpers/ImageInteractor2';
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
  type RoomType = {
    id: string;
    floor: number;
    roomIndex: number;
    status: 'Empty' | 'Taken';
    price: number;
    AgreedPrice: number;
    PaymentCycleType:
      | '30'
      | '15'
      | '7'
      | 'monthly'
      | 'weekly'
      | 'daily'
      | 'custom';
    PaymentCycleCustomeDays: number;
    squareMeters: number;
    RoomSpecifications: RoomSpecificationType[];

    tenantId?: string;
    AddTenantState?: boolean;
    ViewAgreement?: boolean;
    ShowPayTimeLine?: boolean;
    AllRoomPayInfo: AllRoomPayInfo;
  };
  type BrokerRecommendationType = {
    id: string;
    roomId: string;
    brokerId: string;
    recommendedTenantId: string;
    AddedTime: number;
    AgreedCommission: number;
  };
  type RoomSpecificationType = {
    id: string;
    Detail: string;
    Number: number;
    type: 'bool' | 'number';
    Boolean: boolean;
  };
  type tenant = {
    id: string;
    name: string;
    phoneNumber: string;
    phoneNumber2?: string;
    email?: string;
    SelectedAgreement: string;
    RentingOrOut: boolean;
    startTime: string;
    endTime?: string;
    agreedPrice: string;
  };
  type BrokerType = {
    id: string;
    name: string;
    phoneNumber: string;
    phoneNumber2?: string;
    email?: string;
    RecommendedTenantsIdList: string[];
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
    Day: number;
    Paid: boolean;
  };
  /*type CategoryType = {
    id: string;
    type: 'floor' | 'rooms' | 'branch';
    name: string;
    floorIndex?: number;
  };*/
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
    description: string;
    endReason: string;
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
}: any) => {
  const [floorFilter, setFloorFilter] = useState<string>('');
  const [TenantNameFilter, setTenantNameFilter] = useState<string>('');
  const [roomFilter, setRoomFilter] = useState<string>('');
  const [sortType, setSortType] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const updateRoomProperty = async (
    roomId: string,
    propertyName: string,
    newValue: any
  ) => {
    await updateValue('rooms', roomId, propertyName, newValue);
    await roomAPI.getRoomFromApi();
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
    await updateValue('rooms', roomId, propertyName, newValue);
    await roomAPI.getRoomFromApi();
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
    if (FilterDueDateValue == '' || FilterDueDateValue == '0')
      removeFilterOptionByName('filterDueDateValue');
  }, [
    floorFilter,
    TenantNameFilter,
    roomFilter,
    filterPriceValue,
    filterSquareFeetValue,
    FilterDueDateValue,
  ]);

  const sortedAndFilteredRooms = filterAndSortRooms();

  const [PeopleSelectedPage, setPeopleSelectedPage] = useState<
    'TenantsList' | 'BrokersList' | 'TenantReviews'
  >('TenantsList');
  const [AddARoomState, setAddARoomState] = useState(false);
  const [AddRoomFormFloor, setAddRoomFormFloor] = useState(1);
  const [AddRoomFormRoomIndex, setAddRoomFormRoomIndex] = useState(1);
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
  const [RoomExistsWarning, setRoomExistsWarning] = useState(false)

  const handleAddRoom = async (continueAdding: boolean) => {
    // Check if the room already exists
    const roomExists = sortedAndFilteredRooms.some(
      (room) => room.floor === AddRoomFormFloor && room.roomIndex === AddRoomFormRoomIndex
    )

    if (roomExists) {
      // Room already exists, show an error message or handle as needed
      console.error(`Room ${AddRoomFormRoomIndex} on floor ${AddRoomFormFloor} already exists.`)
      setRoomExistsWarning(true);
      return
    }

    // If the room doesn't exist, proceed with adding the new room
    const newRoom: RoomType = {
      id: uuidv4(),
      floor: AddRoomFormFloor,
      roomIndex: AddRoomFormRoomIndex,
      price: AddRoomFormPrice,
      PaymentCycleType: AddRoomFormPaymentCycleType as
        | '30'
        | '15'
        | '7'
        | 'monthly'
        | 'weekly'
        | 'daily'
        | 'custom',
      PaymentCycleCustomeDays: AddRoomFormPaymentCycleCustomDays,
      squareMeters: AddRoomFormSquareMeters,
      RoomSpecifications: AddRoomFormRoomSpecifications,
      status: 'Empty',
      AgreedPrice: AddRoomFormPrice,
      AllRoomPayInfo: { RoomPayInfo: [] },
    }
    console.log(newRoom)

    // Add to sqlite database
    await roomAPI.AddRoomApi(
      newRoom.id,
      AddRoomFormFloor,
      AddRoomFormRoomIndex,
      AddRoomFormPrice,
      AddRoomFormPaymentCycleType,
      AddRoomFormPaymentCycleCustomDays,
      AddRoomFormSquareMeters,
      AddRoomFormRoomSpecifications
    )

    handleRenameFolder(
      'Add a room images',
      `Room ${AddRoomFormFloor}, Floor ${AddRoomFormRoomIndex} - ${newRoom.id}`
    )

    // Reset the variables
    ResetAddRoomForumVariables()
    setRefreshInspectorForAddRoom(true)
    if (!continueAdding) setAddARoomState(false)

      setRoomExistsWarning(false);
  };
  const handleCancelAddRoom = () => {
    ResetAddRoomForumVariables();
    handleDeleteFolderImages('Add a room images');
  };
  const ResetAddRoomForumVariables = () => {
    setRoomExistsWarning(false);

    setAddARoomState(false);
    setAddRoomFormFloor(1);
    setAddRoomFormRoomIndex(1);
    setAddRoomFormPrice(0);
    setAddRoomFormPaymentCycleType('monthly');
    setAddRoomFormPaymentCycleCustomDays(0);
    setAddRoomFormSquareMeters(0);
    setAddRoomFormRoomSpecifications([
      { type: 'bool', Detail: '', Boolean: false, Number: 0, id: 'avx' },
    ]);

   
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
      setRefreshInspectorForAddRoom(true)
    } else {
      console.error('Failed to delete folder images');
    }
  };

  const [SelectedEditRoomId, setSelectedEditRoomId] = useState('');
  const [DeleteConfimation, setDeleteConfimation] = useState(false);
  const handleDeleteFirst = async () => {
    if (!DeleteConfimation) setDeleteConfimation(true);
    if (DeleteConfimation) {
      const listOfPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${SelectedEditRoomId}'`
      );
      if (listOfPayments)
        for (let i = 0; i < listOfPayments.length; i++) {
          const element = listOfPayments[i];
          deleteValue('room_pay_info', element.id);
        }
      roomAPI.DeleteRoom(SelectedEditRoomId);
      setSelectedEditRoomId('');
      setDeleteConfimation(false);
    }
  };

  const [HideSideBarForCalendar, setHideSideBarForCalendar] = useState(false);
  useEffect(() => {
    if (SelectedPage === 'People') {
      RefreshDataFromSqlite();
    }
    if (SelectedPage === 'Calendar') {
      setHideSideBarForCalendar(true);
    } else {
      setHideSideBarForCalendar(false);
    }
  }, [SelectedPage]);

  const handleAddRoomButtonInitial = (state: boolean, plusOne?:boolean) => {
    setAddARoomState(state);
    if (RoomList.length > 0 && RoomList) {
      const sortedRoomList = [...RoomList].sort(
        (a: RoomType, b: RoomType) => a.roomIndex - b.roomIndex
      );
      const a = plusOne ? sortedRoomList.reverse()[0].roomIndex + 2: sortedRoomList.reverse()[0].roomIndex + 1;
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
  
  return (
    <>
      <div className="MainContainerMain">
        <button
          className="SideBarShowButton"
          onClick={handleCloseSideBar}
          style={{
            visibility: SideBarShowState
              ? 'hidden'
              : HideSideBarForCalendar
              ? 'hidden'
              : 'visible',
          }}
        >
          Show Sidebar
        </button>
        <div
          className="SideBarContainer"
          style={{
            width: HideSideBarForCalendar ? '0px' : `${SideBarWidth}px`,
            transition: 'all .2s',
            visibility: HideSideBarForCalendar ? 'hidden' : 'visible',
          }}
        >
          {SelectedPage === 'Rooms' ? (
            <>
              <div
                className="SideBarRoomPageTopPart"
                style={{ height: AddARoomState ? '40%' : '100%' }}
              >
                <div className="SideBarTopContainer">
                  <button
                    className="SideBarTopButton"
                    onClick={handleCloseSideBar}
                  >
                    <img src={DoubleArrowIconDark} alt="" />
                  </button>
                  <button
                    className="SideBarTopButton"
                    onClick={() => {
                      handleAddRoomButtonInitial(!AddARoomState);
                    }}
                  >
                    Add room
                  </button>
                  <button
                    className="SideBarTopButton"
                    onClick={handleClearFilters}
                  >
                    Clear Filters
                  </button>
                  <button className="SideBarTopButton">d</button>{' '}
                </div>
                <div className="SearchBarContainer">
                  <div className="TenantSearchBarContainer">
                    {' '}
                    Tenant name:
                    <input
                      type="text1"
                      className="TenantSearchBar"
                      value={TenantNameFilter}
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
                <div className="AdvanceRoomFinding">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      marginRight: '10px',
                      flexDirection: 'row',
                      justifyContent: 'center',
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
                      style={{ width: '90px', height: '30px' }}
                    >
                      <option value="Taken">Taken</option>
                      <option value="Empty">Empty</option>
                    </select>
                  </div>
                  <div
                    className="AdvanceRoomFindingINPUTCONTAINER"
                    style={{ width: '100%' }}
                  >
                    <div style={{ marginBottom: '10px', marginTop: '10px' }}>
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
                          style={{ width: '30px', height: '30px' }}
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
                            addFilterOption('filterPriceValue', e.target.value);
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ marginBottom: '10px', marginTop: '10px' }}>
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
                          style={{ width: '30px', height: '30px' }}
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
                          style={{ width: '30px', height: '30px' }}
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
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
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
              </div>
              <div
                className="SideBarRoomPageBottomPartAddRoom"
                style={{ height: AddARoomState ? 'calc(60% - 61px)' : '0%' }}
              >
                <div>
                  <h1 style={{ display: 'flex', justifyContent: 'center' }}>
                    Add a room
                  </h1>
                  <div>
                    <div className="AddaNewRoomRowObject">
                      <input
                        className="AddANewRoomInputsSmall"
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
                        className="AddANewRoomInputsSmall"
                        type="number"
                        placeholder="Room Index"
                        value={AddRoomFormRoomIndex}
                        onChange={(e) =>
                          setAddRoomFormRoomIndex(parseInt(e.target.value))
                        }
                      />
                      :Room number {RoomExistsWarning && <em style={{ color: 'red' }}>Already exist</em>}                    </div>
                    <div className="AddaNewRoomRowObject">
                      Price (per month):
                      <input
                        className="AddANewRoomInputsSmall"
                        type="number"
                        placeholder="Price"
                        value={AddRoomFormPrice}
                        onChange={(e) =>
                          setAddRoomFormPrice(parseInt(e.target.value))
                        }
                      />
                      $
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
                        <option value="Every 30 days">30 days</option>
                        <option value="Every 15 days">15 days</option>
                        <option value="Every 7 days">7 days</option>
                        <option value="daily">daily</option>

                        <option value="monthly">monthly</option>
                        <option value="custom">custom days</option>
                      </select>
                    </div>
                    {AddRoomFormPaymentCycleType === 'custom' && (
                      <div style={{ marginLeft: '10px' }}>
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
                      <input
                        className="AddANewRoomInputsSmall"
                        type="number"
                        placeholder="Square Meters"
                        value={AddRoomFormSquareMeters}
                        onChange={(e) =>
                          setAddRoomFormSquareMeters(parseInt(e.target.value))
                        }
                      />
                      : Square Meters
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
                      />
                    </div>
                  </div>
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
                  <button
                    className="HorizontalButton"
                    onClick={() => {
                      handleAddRoom(true);
                      ResetAddRoomForumVariables();
                      handleAddRoomButtonInitial(true, true);
                      setAddARoomState(true);
                    }}
                  >
                    Add Room and continue adding
                  </button>
                  <button
                    className="HorizontalButton"
                    onClick={() => {
                      handleAddRoom(false);
                    }}
                  >
                    Add Room
                  </button>
                </div>
              </div>
            </>
          ) : SelectedPage === 'People' ? (
            <>
              <p>
                Peoples page{' '}
                <button onClick={RefreshDataFromSqlite}>Refresh</button>
              </p>
              <div
                onClick={() => {
                  setPeopleSelectedPage('TenantsList');
                }}
                className={
                  PeopleSelectedPage === 'TenantsList'
                    ? 'sideBarItemComponentMainSelected'
                    : 'sideBarItemComponentMain'
                }
              >
                <div>Tenant list</div>
                {PeopleSelectedPage !== 'TenantsList' ? (
                  <div>{'-→'}</div>
                ) : (
                  <></>
                )}
              </div>
              <div
                onClick={() => {
                  setPeopleSelectedPage('BrokersList');
                }}
                className={
                  PeopleSelectedPage === 'BrokersList'
                    ? 'sideBarItemComponentMainSelected'
                    : 'sideBarItemComponentMain'
                }
              >
                <div>Broker list</div>
                {PeopleSelectedPage !== 'BrokersList' ? (
                  <div>{'-→'}</div>
                ) : (
                  <></>
                )}
              </div>
              <div
                onClick={() => {
                  setPeopleSelectedPage('TenantReviews');
                }}
                className={
                  PeopleSelectedPage === 'TenantReviews'
                    ? 'sideBarItemComponentMainSelected'
                    : 'sideBarItemComponentMain'
                }
              >
                <div>Tenant Reviews</div>
                {PeopleSelectedPage !== 'TenantReviews' ? (
                  <div>{'-→'}</div>
                ) : (
                  <></>
                )}
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
            <div className="EditRoomScreenMainContainer">
              <ImageInteractor
                images={[
                  DoubleArrowIconDark,
                  SortIcon,
                  DoubleArrowIconDarkb,
                  DoubleArrowIconDarka,
                  DoubleArrowIconDarkc,
                  LONGIMAGE,
                ]}
                onAddImage={() => handleAddImage(SelectedEditRoomId)}
                onDeleteImage={(index) =>
                  handleDeleteImage(SelectedEditRoomId, index)
                }
                onShowInExplorer={handleShowInExplorer}
                room={RoomList.find(
                  (r: RoomType) => r.id === SelectedEditRoomId
                )}
              />
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
              : `calc(100% - ${SideBarWidth}px)`,
          }}
        >
          {SelectedPage === 'Rooms' && (
            <RoomListComponent
              updateRoomProperty={updateRoomProperty}
              updateRoomPropertyWithOutRefresh={
                updateRoomPropertyWithOutRefresh
              }
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
            />
          )}
          {SelectedPage === 'People' && (
            <PeopleComponentPage
              TenantList={TenantList}
              PeopleSelectedPage={PeopleSelectedPage}
              PastTenantReviews={PastTenantReviews}
              RoomList={RoomList}
              BrokerList={BrokerList}
              RefreshDataFromSqlite={RefreshDataFromSqlite}
              BrokerRecommendationList={BrokerRecommendationList}
            />
          )}
          {SelectedPage === 'Calendar' && (
            <CalendarPage
              updateRoomProperty={updateRoomProperty}
              RoomList={RoomList}
              sortedAndFilteredRooms={sortedAndFilteredRooms}
              removeFilterOption={removeFilterOption}
              filterOptions={filterOptions}
              tenantList={TenantList}
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
            />
          )}
          {SelectedPage === 'Dashboard' && (
            <RoomListComponent
              updateRoomProperty={updateRoomProperty}
              roomPaymentInfoApi={roomPaymentInfoApi}
              RoomList={RoomList}
              sortedAndFilteredRooms={sortedAndFilteredRooms}
              removeFilterOption={removeFilterOption}
              filterOptions={filterOptions}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default MainPage;
