import React from 'react';
import DashbRoomSummary from '../Dashboard Wigets/DashbRoomSummary';
import '../../CSS/Dashboard.css';
import DashbTotalCollected from '../Dashboard Wigets/DashbTotalCollected';
import DashbPastPayments from '../Dashboard Wigets/DashbPastPayments';
import DashbOverAllTax from '../Dashboard Wigets/DashbOverAllTax';
import DashbRevenuePerSquareFoot from '../Dashboard Wigets/DashbRevenuePerSquareFoot';
import TopPerformingUnits from '../Dashboard Wigets/TopPerformingUnits';
import TenantGrowthWidget from '../Dashboard Wigets/TenantGrowthWidget';
import UpcomingAgreements from '../Dashboard Wigets/UpcomingAgreements';
interface props {
  RoomList: RoomType[];
  tenantList: tenant[];
  roomPaymentInfoApi:any;
  BrokerList: BrokerType[];
  PastTenantReviews: PastTenantReviewType[];
  BrokerRecommendationList: BrokerRecommendationType[];
}
const DashboardPage: React.FC<props> = ({ RoomList, tenantList,roomPaymentInfoApi ,PastTenantReviews,BrokerList,BrokerRecommendationList}) => {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'row',flexWrap:"wrap" }}
    >
      <DashbRoomSummary RoomList={RoomList}/>
      <DashbTotalCollected RoomList={RoomList}/>
<DashbPastPayments tenantList={tenantList}RoomList={RoomList} roomPaymentInfoApi={roomPaymentInfoApi}/>
<div><DashbRevenuePerSquareFoot RoomList={RoomList} />
      <TopPerformingUnits 
  RoomList={RoomList} 
  TenantList={tenantList} 
  BrokerList={BrokerList}
  PastTenantReviews={PastTenantReviews}BrokerRecommendationList={BrokerRecommendationList}
/><TenantGrowthWidget TenantList={tenantList} /></div>
      <DashbOverAllTax RoomList={RoomList} />
      <UpcomingAgreements RoomList={RoomList} TenantList={tenantList} />



    </div>
  );
};

export default DashboardPage;
