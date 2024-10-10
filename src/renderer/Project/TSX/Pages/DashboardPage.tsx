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
import DashbEmailHistory from '../Dashboard Wigets/DashbEmailHistory';
interface props {
  RoomList: RoomType[];
  tenantList: tenant[];
  roomPaymentInfoApi: any;
  BrokerList: BrokerType[];
  PastTenantReviews: PastTenantReviewType[];
  BrokerRecommendationList: BrokerRecommendationType[];
  DashboardSelectedPage: string;
  SelectedUserId: string;
}
const DashboardPage: React.FC<props> = ({
  RoomList,
  tenantList,
  roomPaymentInfoApi,
  PastTenantReviews,
  BrokerList,
  BrokerRecommendationList,
  DashboardSelectedPage,SelectedUserId
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}>
      {DashboardSelectedPage === 'Overview' ? (
        <>
          <DashbRoomSummary RoomList={RoomList} />
          <DashbTotalCollected RoomList={RoomList} />
          <DashbPastPayments
            tenantList={tenantList}
            RoomList={RoomList}
            roomPaymentInfoApi={roomPaymentInfoApi}
          />
          <div>
            <DashbRevenuePerSquareFoot RoomList={RoomList} />
            <TopPerformingUnits
              RoomList={RoomList}
              TenantList={tenantList}
              BrokerList={BrokerList}
              PastTenantReviews={PastTenantReviews}
              BrokerRecommendationList={BrokerRecommendationList}
            />
            <TenantGrowthWidget TenantList={tenantList} />
          </div>
          <DashbOverAllTax RoomList={RoomList} />
          <UpcomingAgreements RoomList={RoomList} TenantList={tenantList} />
        </>
      ) : DashboardSelectedPage === 'Email History' ? (
        <>
          <DashbEmailHistory SelectedUserId={SelectedUserId}></DashbEmailHistory>
        </>
      ) : DashboardSelectedPage === 'SMS History' ? (
        <></>
      ) : (
        <></>
      )}
    </div>
  );
};

export default React.memo(DashboardPage);
