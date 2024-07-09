import { RoomListComponent } from './Pages/RoomListComponent';
import { PeopleComponentPage } from './Pages/PeopleComponentPage';
import React, { useEffect, useState } from 'react';
const { v4: uuidv4 } = require('uuid');

import Room from './Helpers/Room';
import '../CSS/RoomArea.css';
import AddIcon from '../../assets/icons8-add-100.png';
import saveIcon from '../../assets/icons8-save-100(3).png';
import deleteIcon from '../../assets/icons8-delete-100(1).png';
import editIcon from '../../assets/icons8-edit-100.png';
import OnStateIcon from '../../assets/On.png';
import OFFStateIcon from '../../assets/OFF.png';
import Xicon from '../../../assets/X.png';
import InsertImageIcon from '../../assets/Insert Image Pic.png';
import dropDownImg from '../../assets/icons8-drop-down-100.png';
import SortIcon from '../../assets/icons8-sort-100.png';
import SelectIcon from '../../assets/icons8-select-100(2).png';
import SelectIconfill from '../../assets/icons8-select-100(1).png';
import SettingIcon from '../../assets/icons8-settings-480.png';
import ProductsIcon from '../../assets/icons8-products-100.png';
import WarningRed from '../../assets/icons8-general-warning-sign-100.png';
import WarningYellow from '../../assets/icons8-general-warning-sign-100(1).png';
import ShowPasswordIcon from '../../assets/Account Managment/icons8-show-password-100.png';
import HidePasswordIcon from '../../assets/Account Managment/icons8-hide-password-100.png';
import PasswordIcon from '../../assets/Account Managment/icons8-password-100.png';
import UsernameIcon from '../../assets/Account Managment/icons8-name-100.png';
import PasswordGearIcon from '../../assets/Account Managment/icons8-password-100-gear.png';
import UsernameGearIcon from '../../assets/Account Managment/icons8-name-100-Gear.png';
import AccountImage from '../../assets/Account Managment/Administrator Male.png';
import AccountImageAdmin from '../../assets/Account Managment/Admin Settings Male.png';
import StastistcsIcon from '../../assets/icons8-statistic-100(2).png';
import ArrowIcon2 from '../../assets/icons8-forward-100.png';
import BottomNavBar from './Bottom navbar/BottomNavBar';
import { CalanderPage } from './Pages/CalanderPage';
import { addValue, updateValue } from 'Backend/localServerApis';
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

  const removeFilterOption = (index: number) => {
    setFilterOptions((options) => {
      const removedOption = options[index];
      switch (removedOption.key) {
        case 'floor':
          setFloorFilter(''); // Reset the floor filter
          break;
        case 'tenantName':
          setFloorFilter(''); // Reset the floor filter
          break;
        case 'room':
          setRoomFilter(''); // Reset the room filter
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
      return options.filter((_, i) => i !== index);
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

  const [SelectedPage, setSelectedPage] = useState<
    'Dashboard' | 'People' | 'Rooms' | 'Calander' | 'Settings'
  >('Rooms');

  const [AddARoomState, setAddARoomState] = useState(false);
  const [AddRoomFormFloor, setAddRoomFormFloor] = useState(0);
  const [AddRoomFormRoomIndex, setAddRoomFormRoomIndex] = useState(0);
  const [AddRoomFormPrice, setAddRoomFormPrice] = useState(0);
  const [AddRoomFormPaymentCycleType, setAddRoomFormPaymentCycleType] =
    useState('monthly');
  const [
    AddRoomFormPaymentCycleCustomDays,
    setAddRoomFormPaymentCycleCustomDays,
  ] = useState(0);
  const [AddRoomFormSquareMeters, setAddRoomFormSquareMeters] = useState(0);
  const [AddRoomFormRoomSpecifications, setAddRoomFormRoomSpecifications] =
    useState<RoomSpecificationType[]>([
      { type: 'bool', Detail: '', Boolean: false, Number: 0, id: 'avx' },
    ]);

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
      { type: 'bool', Detail: '', Boolean: false, Number: 0, id: 'avx' },
    ]);
  };

  const removeAddRoomFormSpecification = (index: number) => {
    setAddRoomFormRoomSpecifications((prevSpecs) =>
      prevSpecs.filter((_, i) => i !== index)
    );
  };

  const handleAddRoom = async () => {
    console.log(AddRoomFormRoomSpecifications);
    const newRoom: RoomType = {
      id: '',
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
    };
    console.log(newRoom);
    setAddARoomState(false);
    //Add to sqlite database
    roomAPI.AddRoomApi(
      uuidv4(),
      AddRoomFormFloor,
      AddRoomFormRoomIndex,
      AddRoomFormPrice,
      AddRoomFormPaymentCycleType,
      AddRoomFormPaymentCycleCustomDays,
      AddRoomFormSquareMeters,
      AddRoomFormRoomSpecifications
    );
  };

  return (
    <>
      <div className="MAINCONTAINER">
        <div className="SideBarContainer">
          <div
            className="SideBarRoomPageTopPart"
            style={{ height: AddARoomState ? '40%' : '100%' }}
          >
            <h1
              onClick={() => {
                console.log(TenantList);
              }}
            >
              Search options
            </h1>
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
                        addFilterOption('filterDueDateValue', e.target.value);
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
            style={{ height: AddARoomState ? '60%' : '0%' }}
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
                  :Room number
                </div>
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
                    <button onClick={addAddRoomFormSpecification}>Add</button>
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
                          onClick={() => removeAddRoomFormSpecification(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="AddaNewRoomBottomContianer">
              <button className="HorizontalButton">Cancel</button>{' '}
              <button className="HorizontalButton">
                Add Room and continue adding
              </button>
              <button
                className="HorizontalButton"
                onClick={() => {
                  handleAddRoom();
                }}
              >
                Add Room
              </button>
            </div>
          </div>
        </div>

        <div style={{ width: 'calc(100% - 290px)' }}>
          {SelectedPage === 'Rooms' && (
            <RoomListComponent
              updateRoomProperty={updateRoomProperty}
              updateRoomPropertyWithOutRefresh={
                updateRoomPropertyWithOutRefresh
              }
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
            />
          )}
          {SelectedPage === 'People' && (
            <PeopleComponentPage TenantList={TenantList} />
          )}
          {SelectedPage === 'Calander' && (
            <CalanderPage
              updateRoomProperty={updateRoomProperty}
              RoomList={RoomList}
              sortedAndFilteredRooms={sortedAndFilteredRooms}
              removeFilterOption={removeFilterOption}
              filterOptions={filterOptions}
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
          <BottomNavBar
            setSelectedPage={setSelectedPage}
            SelectedPage={SelectedPage}
          ></BottomNavBar>
        </div>
      </div>
    </>
  );
};

export default MainPage;
