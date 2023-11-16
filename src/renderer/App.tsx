import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import RoomArea from './RoomArea';
import { useState } from 'react';
import NavBar from './Project/TSX/NavBar';
import LogoImage from './assets/Insert Image Pic.png';

function Hello() {
  const [RoomList, setRoomList] = useState<RoomType[]>([
    {
      id: '1',
      roomIndex: 44000,
      floor: 9999,
      status: 'Empty',

      price: 23000,
      squareMeters: 50,
      AllRoomPayInfo: { RoomPayInfo: [] },
    },
    {
      id: '2',
      roomIndex: 2,
      floor: 1,
      status: 'Empty',
      price: 12000,
      squareMeters: 50,
      AllRoomPayInfo: { RoomPayInfo: [] },
    },
    {
      id: '3',
      roomIndex: 3,
      floor: 1,
      status: 'Empty',
      price: 20000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '4',
      roomIndex: 1,
      floor: 2,
      status: 'Empty',
      price: 11000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '5',
      roomIndex: 2,
      floor: 2,
      status: 'Empty',
      price: 18000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '6',
      roomIndex: 3,
      floor: 2,
      status: 'Empty',
      price: 29000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '7',
      roomIndex: 3,
      floor: 1,
      status: 'Empty',
      price: 20000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '8',
      roomIndex: 1,
      floor: 2,
      status: 'Empty',
      price: 11000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '9',
      roomIndex: 2,
      floor: 2,
      status: 'Empty',
      price: 18000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
    {
      id: '10',
      roomIndex: 3,
      floor: 2,
      status: 'Empty',
      price: 29000,
      AllRoomPayInfo: { RoomPayInfo: [] },
      squareMeters: 50,
    },
  ]);
  const [ComponyLogo, setComponyLogo] = useState(LogoImage);
  const [ComponyName, setComponyName] = useState('');

  const [ProfileEditState, setProfileEditState] = useState(false);
  const handleUpdateImage = (newImageURL: React.SetStateAction<string>) => {
    setComponyLogo(newImageURL);
  };
  return (
    <>
      <NavBar
        ProfileState={ProfileEditState}
        SetEditButtonState={setProfileEditState}
        UpdateImageForLogo={handleUpdateImage}
        Image={ComponyLogo}
        ShopName={ComponyName}
        setShopName={setComponyName}
      ></NavBar>
      <RoomArea RoomList={RoomList} setRoomList={setRoomList} />
    </>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
