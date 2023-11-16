import React, { useState } from 'react';
import Room from './Project/TSX/Room';
import './Project/CSS/RoomArea.css';
import AddIcon from './assets/icons8-add-100.png';
import saveIcon from './assets/icons8-save-100(3).png';
import deleteIcon from './assets/icons8-delete-100(1).png';
import editIcon from './assets/icons8-edit-100.png';
import OnStateIcon from './assets/On.png';
import OFFStateIcon from './assets/OFF.png';
import Xicon from './assets/X.png';
import InsertImageIcon from './assets/Insert Image Pic.png';
import dropDownImg from './assets/icons8-drop-down-100.png';
import SortIcon from './assets/icons8-sort-100.png';
import SelectIcon from './assets/icons8-select-100(2).png';
import SelectIconfill from './assets/icons8-select-100(1).png';
import SettingIcon from './assets/icons8-settings-480.png';
import ProductsIcon from './assets/icons8-products-100.png';
import WarningRed from './assets/icons8-general-warning-sign-100.png';
import WarningYellow from './assets/icons8-general-warning-sign-100(1).png';
import ShowPasswordIcon from './assets/Account Managment/icons8-show-password-100.png';
import HidePasswordIcon from './assets/Account Managment/icons8-hide-password-100.png';
import PasswordIcon from './assets/Account Managment/icons8-password-100.png';
import UsernameIcon from './assets/Account Managment/icons8-name-100.png';
import PasswordGearIcon from './assets/Account Managment/icons8-password-100-gear.png';
import UsernameGearIcon from './assets/Account Managment/icons8-name-100-Gear.png';
import AccountImage from './assets/Account Managment/Administrator Male.png';
import AccountImageAdmin from './assets/Account Managment/Admin Settings Male.png';
import StastistcsIcon from './assets/icons8-statistic-100(2).png';
import ArrowIcon2 from './assets/icons8-forward-100.png';
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
    squareMeters: number;
    Person?: Person;
    AddPersonState?: boolean;
    ViewAgreement?: boolean;
    AllRoomPayInfo: AllRoomPayInfo;
  };
  type Person = {
    name: string;
    phoneNumber: string;
    phoneNumber2?: string;
    email?: string;
    SelectedAgreement: string;
    startTime: string;
    endTime?: string;
    agreedPrice: string;
  };
  type AllRoomPayInfo = {
    RoomPayInfo: RoomPayInfo[];
  };
  type RoomPayInfo = {
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
interface RoomAreaProps {
  RoomList: RoomType[];
  setRoomList: (newRoomList: RoomType[]) => void;
}

const RoomArea = ({ RoomList, setRoomList }: RoomAreaProps) => {
  const [floorFilter, setFloorFilter] = useState<string>('');
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
  const [filterPriceValue, setFilterPriceValue] = useState<string>('');
  const [filterSquareFeetOperator, setFilterSquareFeetOperator] = useState<
    '=' | '<' | '>' | 'None'
  >('None');
  const [filterSquareFeetValue, setFilterSquareFeetValue] =
    useState<string>('');
  const [filterOptions, setFilterOptions] = useState<FilterOption[]>([]);
  const updateRoomProperty = (
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

  const filterAndSortRooms = () => {
    let filteredRooms = RoomList;

    // Loop through the filter options and apply them to the rooms
    filterOptions.forEach((option) => {
      const { key, value } = option;

      switch (key) {
        case 'floor':
          filteredRooms = filteredRooms.filter(
            (room) => room.floor.toString() === value
          );
          break;
        case 'room':
          filteredRooms = filteredRooms.filter(
            (room) => room.roomIndex.toString() === value
          );
          break;
        case 'filterstatus':
          if (value === 'None') {
            filteredRooms = filteredRooms.filter((room) => !room.status);
          } else {
            filteredRooms = filteredRooms.filter(
              (room) => room.status === value
            );
          }
          break;
        case 'filterPriceValue':
          if (!isNaN(parseInt(value, 10)) && filterPriceOperator !== 'None') {
            const price = parseInt(value, 10);
            switch (filterPriceOperator) {
              case '=':
                filteredRooms = filteredRooms.filter(
                  (room) => room.price === price
                );
                break;
              case '<':
                filteredRooms = filteredRooms.filter(
                  (room) => room.price < price
                );
                break;
              case '>':
                filteredRooms = filteredRooms.filter(
                  (room) => room.price > price
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
                  (room) => room.squareMeters === squareFeet
                );
                break;
              case '<':
                filteredRooms = filteredRooms.filter(
                  (room) => room.squareMeters < squareFeet
                );
                break;
              case '>':
                filteredRooms = filteredRooms.filter(
                  (room) => room.squareMeters > squareFeet
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

    return filteredRooms.sort((a, b) => {
      const comparison = sortDirection === 'asc' ? -1 : 1;
      switch (sortType) {
        case 'name':
          return (
            comparison *
            (a.Person?.name || '').localeCompare(b.Person?.name || '')
          );
        case 'price':
          return comparison * (a.price - b.price);
        case 'floor':
          return comparison * (a.floor - b.floor);
        case 'room':
          return comparison * (a.roomIndex - b.roomIndex);
        default:
          return 0;
      }
    });
  };

  const sortedAndFilteredRooms = filterAndSortRooms();

  return (
    <>
      <div className="MAINCONTAINER">
        <div className="SideBarContainer"></div>

        <div
          className="SecondNavBarContainer"
          style={{ width: 'calc(70% - 315px)' }}
        >
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
          <div className="SearchBarContainer">
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
          <div className="AdvanceRoomFinding">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '10px',
                flexDirection: 'column',
              }}
            >
              Room status
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value as 'all' | 'Taken' | 'Empty');
                  addFilterOption(
                    'filterstatus',
                    e.target.value as 'all' | 'Taken' | 'Empty'
                  );
                }}
                className="filter-drop"
              >
                <option value="Taken">Taken</option>
                <option value="Empty">Empty</option>
              </select>
            </div>
            <div
              className="AdvanceRoomFindingINPUTCONTAINER"
              style={{ width: '250px', display: 'flex', alignItems: 'center' }}
            >
              <div style={{ marginRight: '10px' }}>
                <div>
                  Price:
                  <select
                    value={filterPriceOperator}
                    onChange={(e) => {
                      setFilterPriceOperator(e.target.value as '=' | '<' | '>');
                      addFilterOption(
                        'filterPriceOperator',
                        e.target.value as '=' | '<' | '>'
                      );
                    }}
                    className="filter-drop"
                  >
                    <option value="=">{'='}</option>
                    <option value="<">{'<'}</option>
                    <option value=">">{'>'}</option>
                    <option value="none">none</option>
                  </select>
                </div>
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
              <div>
                <div>
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
                    className="filter-drop"
                  >
                    <option value="=">{'='}</option>
                    <option value="<">{'<'}</option>
                    <option value=">">{'>'}</option>
                    <option value="none">none</option>
                  </select>
                </div>
                <input
                  type="number"
                  className="AdvanceRoomFindingInput"
                  value={filterSquareFeetValue}
                  onChange={(e) => {
                    setFilterSquareFeetValue(e.target.value);
                    addFilterOption('filterSquareFeetValue', e.target.value);
                  }}
                />
              </div>
            </div>
          </div>
          <div className="FilterOptions">
            {filterOptions.map((option, index) => (
              <>
                <div
                  style={{ marginRight: '10px', marginLeft: '10px' }}
                  key={index}
                >
                  <span>
                    {option.key}: <strong>{option.value}</strong>
                  </span>
                  <button
                    style={{
                      width: '20px',
                      height: '20px',
                      textAlign: 'center',
                      padding: '0px',
                      marginLeft: '5px',
                    }}
                    onClick={() => removeFilterOption(index)}
                  >
                    X
                  </button>
                </div>
              </>
            ))}
          </div>
        </div>
        <div
          className="RoomContainerContainer"
          style={{ width: 'calc(100% - 315px)' }}
        >
          <div style={{ height: '65px' }}></div>
          <div className="RoomContainer">
            {sortedAndFilteredRooms.map((room, index) => (
              <Room
                roomType={room}
                updateRoomProperty={updateRoomProperty}
                turnOffAddPersonStateForAll={() => {
                  for (let i = 0; i < RoomList.length; i++) {
                    const element = RoomList[i];
                    updateRoomProperty(element.id, 'AddPersonState', false);
                  }
                  for (let i = 0; i < RoomList.length; i++) {
                    const element = RoomList[i];
                    updateRoomProperty(element.id, 'ViewAgreement', false);
                  }
                }}
                turnOffViewStateForAll={() => {
                  for (let i = 0; i < RoomList.length; i++) {
                    const element = RoomList[i];
                    updateRoomProperty(element.id, 'ViewAgreement', false);
                  }
                  for (let i = 0; i < RoomList.length; i++) {
                    const element = RoomList[i];
                    updateRoomProperty(element.id, 'AddPersonState', false);
                  }
                }}
                key={room.id}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default RoomArea;
