import React, { useEffect, useState } from 'react';
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
import DashbNetProfitTotalCollected from '../Dashboard Wigets/DashbNetProfitTotalCollected';
import DashbMonthlyExpenseTrendWidget from '../Dashboard Wigets/DashbMonthlyExpenseTrendWidget';
import { getValuesWithSql } from 'Backend/localServerApis';
import DashbExpenseHistory from '../Dashboard Wigets/DashbExpenseHistory';
import DashbUpcomingExpensesWidget from '../Dashboard Wigets/DashbUpcomingExpensesWidget';
import DashbActionHistoryDashboard from '../Dashboard Wigets/DashbActionHistoryDashboard';
import DashbSmsDetails from '../Dashboard Wigets/DashbSmsDetails';
interface props {
  RoomList: RoomType[];
  tenantList: tenant[];
  roomPaymentInfoApi: any;
  BrokerList: BrokerType[];
  PastTenantReviews: PastTenantReviewType[];
  BrokerRecommendationList: BrokerRecommendationType[];
  DashboardSelectedPage: string;
  SelectedUserId: string;
  setChangeMade: any;updateRoomPropertyLocal:any;updateRoomProperty:any;SelectedBranchId:any;
}
const DashboardPage: React.FC<props> = ({
  RoomList,
  tenantList,
  roomPaymentInfoApi,
  PastTenantReviews,
  BrokerList,
  BrokerRecommendationList,
  DashboardSelectedPage,
  SelectedUserId,
  setChangeMade,updateRoomPropertyLocal,updateRoomProperty,SelectedBranchId
}) => {
  const [expenses, setExpenses] = useState<expenses[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const expensesData = await getValuesWithSql('expenses', `WHERE 1 AND branchId = '${SelectedBranchId}'`);
      setExpenses(expensesData);
    };
    fetchExpenses();
  }, []);

  return (
    <>
      {DashboardSelectedPage === 'Overview' ? (
        <div
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
          <DashbRoomSummary RoomList={RoomList} />
          <DashbTotalCollected RoomList={RoomList} tenantList={tenantList}SelectedBranchId={SelectedBranchId}/>
          <DashbPastPayments
            tenantList={tenantList}
            RoomList={RoomList}
            roomPaymentInfoApi={roomPaymentInfoApi}SelectedBranchId={SelectedBranchId}
            setChangeMade={setChangeMade}updateRoomPropertyLocal={updateRoomPropertyLocal}
            updateRoomProperty={updateRoomProperty}SelectedUserId={SelectedUserId}
          />
          <div>
            <DashbRevenuePerSquareFoot RoomList={RoomList} />
            <TopPerformingUnits
              RoomList={RoomList}
              TenantList={tenantList}
              BrokerList={BrokerList}
              PastTenantReviews={PastTenantReviews}
              BrokerRecommendationList={BrokerRecommendationList}SelectedBranchId={SelectedBranchId}
            />
            <TenantGrowthWidget TenantList={tenantList} />
          </div>
          <DashbOverAllTax RoomList={RoomList} tenantList={tenantList}SelectedBranchId={SelectedBranchId}/>
          <UpcomingAgreements RoomList={RoomList} TenantList={tenantList}SelectedBranchId={SelectedBranchId}/>
        </div>
      ) : DashboardSelectedPage === 'Email History' ? (
        <>
          <DashbEmailHistory
            SelectedUserId={SelectedUserId}
            RoomList={RoomList}
            tenantList={tenantList}
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
            expenses2={expenses}
            tenantList={tenantList}SelectedBranchId={SelectedBranchId}
          ></DashbNetProfitTotalCollected>
          <DashbMonthlyExpenseTrendWidget expenses={expenses} SelectedBranchId={SelectedBranchId}/>
          <DashbExpenseHistory expenses={expenses} />
          <DashbUpcomingExpensesWidget expenses={expenses} />
        </div>
      ) : DashboardSelectedPage === 'SMS Details' ? (
        <><DashbSmsDetails
        SelectedUserId={SelectedUserId}
        RoomList={RoomList}
        tenantList={tenantList}
      /></>
      ) : (
        <></>
      )}
    </>
  );
};

export default React.memo(DashboardPage);
