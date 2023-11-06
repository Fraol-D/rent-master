import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import icon from '../../assets/icon.svg';
import './App.css';
import RoomArea from './TSX/RoomArea';
import { useState } from 'react';

declare global {
  type RoomType = {
    floor: number;
    roomIndex: number;
    status: 'Empty' | 'Taken';
    Person?: Person;
  };
  type Person = {
    name: string;
    phoneNumber: string;
    phoneNumber2?: string;
    email?: string;
  };
}
function Hello() {
  const [RoomList, setRoomList] = useState<RoomType[]>([
    { roomIndex: 44000, floor: 9999, status: 'Taken', Person:{name:"Eren Yegre", phoneNumber: "09090", phoneNumber2: "09090", email: "d"} },
    { roomIndex: 2, floor: 1, status: 'Empty' },
    { roomIndex: 3, floor: 1, status: 'Empty' },
    { roomIndex: 1, floor: 2, status: 'Empty' },
    { roomIndex: 2, floor: 2, status: 'Empty' },
    { roomIndex: 3, floor: 2, status: 'Empty' },
  ]);

  return (
    <div>
      <RoomArea RoomList={RoomList} />
    </div>
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
