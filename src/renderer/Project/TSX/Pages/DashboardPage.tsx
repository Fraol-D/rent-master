import React, { useEffect, useState } from 'react';
import DashbRoomSummary from '../Dashboard Wigets/DashbRoomSummary';

import DashbTotalCollected from '../Dashboard Wigets/DashbTotalCollected';
import DashbPastPayments from '../Dashboard Wigets/DashbPastPayments';
import DashbOverAllTax from '../Dashboard Wigets/DashbOverAllTax';
import DashbRevenuePerSquareFoot from '../Dashboard Wigets/DashbRevenuePerSquareFoot';
import TopPerformingUnits from '../Dashboard Wigets/TopPerformingUnits';
import TenantGrowthWidget from '../Dashboard Wigets/TenantGrowthWidget';
import UpcomingAgreements from '../Dashboard Wigets/UpcomingAgreements';
import DashbEmailHistory from '../Dashboard Wigets/DashbEmailHistory';
import DashbNetProfitTotalCollected from '../Dashboard Wigets/DashbNetProfitTotalCollected';
import DashbMonthlyExpenseTrendWidget from '../Dashboard Wigets/DashbMonthlyExpenseTrendWidget';
import { getValuesWithSql } from 'Backend/localServerApis';
import DashbExpenseHistory from '../Dashboard Wigets/DashbExpenseHistory';
import DashbUpcomingExpensesWidget from '../Dashboard Wigets/DashbUpcomingExpensesWidget';
import DashbActionHistoryDashboard from '../Dashboard Wigets/DashbActionHistoryDashboard';
import DashbSmsDetails from '../Dashboard Wigets/DashbSmsDetails';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import DashRentalIncomeReport from '../Dashboard Wigets/Reprots page/DashRentalIncomeReport';
import DashbExpenseDistribution from '../Dashboard Wigets/DashbExpenseDistribution';
interface props {
  RoomList: RoomType[];
  
  roomPaymentInfoApi: any;
  BrokerList: BrokerType[];
  PastTenantReviews: PastTenantReviewType[];
  BrokerRecommendationList: BrokerRecommendationType[];
  DashboardSelectedPage: string;
  SelectedUserId: string;
  setChangeMade: any;
  updateRoomPropertyLocal: any;
  updateRoomProperty: any;
  SelectedBranchId: any;
}

const DashboardPage: React.FC<props> = ({
  RoomList,

  roomPaymentInfoApi,
  PastTenantReviews,
  BrokerList,
  BrokerRecommendationList,
  DashboardSelectedPage,
  SelectedUserId,
  setChangeMade,
  updateRoomPropertyLocal,
  updateRoomProperty,
  SelectedBranchId,
}) => {


  return (
    <>
      {DashboardSelectedPage === 'Overview' ? (
        <div
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
          <DashbRoomSummary RoomList={RoomList} />
          <DashbTotalCollected
            RoomList={RoomList}
       
            SelectedBranchId={SelectedBranchId}
          />
          <DashbPastPayments
        
            RoomList={RoomList}
            roomPaymentInfoApi={roomPaymentInfoApi}
            SelectedBranchId={SelectedBranchId}
            setChangeMade={setChangeMade}
            updateRoomPropertyLocal={updateRoomPropertyLocal}
            updateRoomProperty={updateRoomProperty}
            SelectedUserId={SelectedUserId}
          />
          <div>
            <DashbRevenuePerSquareFoot RoomList={RoomList} />
            <TopPerformingUnits
              RoomList={RoomList}
           
              BrokerList={BrokerList}
              PastTenantReviews={PastTenantReviews}
              BrokerRecommendationList={BrokerRecommendationList}
              SelectedBranchId={SelectedBranchId}
            />
            <TenantGrowthWidget/>
          </div>
          <DashbOverAllTax
            RoomList={RoomList}
           
            SelectedBranchId={SelectedBranchId}
          />
          <UpcomingAgreements
            RoomList={RoomList}
            SelectedBranchId={SelectedBranchId}
          />
        </div>
      ) : DashboardSelectedPage === 'Email History' ? (
        <>
          <DashbEmailHistory
            SelectedUserId={SelectedUserId}
            RoomList={RoomList}
       
          ></DashbEmailHistory>
        </>
      ) : DashboardSelectedPage === 'Action History' ? (
        <DashbActionHistoryDashboard SelectedBranchId={SelectedBranchId} />
      ) : DashboardSelectedPage === 'Expenses' ? (
        <div
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
          <DashbNetProfitTotalCollected
            RoomList={RoomList}
         
          
            SelectedBranchId={SelectedBranchId}
          ></DashbNetProfitTotalCollected>
          <DashbMonthlyExpenseTrendWidget
          
            SelectedBranchId={SelectedBranchId}
          />
          <DashbExpenseHistory/>
          <DashbUpcomingExpensesWidget/>

          {/* {<DashbExpenseDistribution expenses={expenses} />} */}
        </div>
      ) : DashboardSelectedPage === 'SMS Details' ? (
        <>
          <DashbSmsDetails
            SelectedUserId={SelectedUserId}
            RoomList={RoomList}
          
          />
        </>
      ) : DashboardSelectedPage === 'Basic Rental income report' ? (
        <>
          <DashRentalIncomeReport
            RoomList={RoomList}
         
            SelectedBranchId={SelectedBranchId}
          />
        </>
      ) : (
        <></>
      )}
    </>
  );
};

export default React.memo(DashboardPage);
