import React from 'react';
import DashbRoomSummary from '../Dashboard Wigets/DashbRoomSummary';
import '../../CSS/Dashboard.css';
interface props {
  RoomList: RoomType[];
  tenantList: tenant[];
}
const DashboardPage: React.FC<props> = ({ RoomList, tenantList }) => {
  return (
    <>
      <DashbRoomSummary RoomList={RoomList}/>
    </>
  );
};

export default DashboardPage;
