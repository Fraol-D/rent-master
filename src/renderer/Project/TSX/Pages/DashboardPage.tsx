import React from 'react';
import DashbRoomSummary from '../Dashboard Wigets/DashbRoomSummary';
import '../../CSS/Dashboard.css';
import DashbTotalCollected from '../Dashboard Wigets/DashbTotalCollected';
import DashbPastPayments from '../Dashboard Wigets/DashbPastPayments';
interface props {
  RoomList: RoomType[];
  tenantList: tenant[];
  roomPaymentInfoApi:any;
}
const DashboardPage: React.FC<props> = ({ RoomList, tenantList,roomPaymentInfoApi }) => {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'row',flexWrap:"wrap" }}
    >
      <DashbRoomSummary RoomList={RoomList}/>
      <DashbTotalCollected RoomList={RoomList}/>
<DashbPastPayments tenantList={tenantList}RoomList={RoomList} roomPaymentInfoApi={roomPaymentInfoApi}/>
    </div>
  );
};

export default DashboardPage;
