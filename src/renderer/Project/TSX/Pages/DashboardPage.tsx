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
interface props {
  RoomList: RoomType[];
  tenantList: tenant[];
  roomPaymentInfoApi: any;
  BrokerList: BrokerType[];
  PastTenantReviews: PastTenantReviewType[];
  BrokerRecommendationList: BrokerRecommendationType[];
  DashboardSelectedPage: string;
  SelectedUserId: string;
  setChangeMade: any;updateRoomPropertyLocal:any;updateRoomProperty:any;
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
  setChangeMade,updateRoomPropertyLocal,updateRoomProperty
}) => {
  const [expenses, setExpenses] = useState<expenses[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const expensesData = await getValuesWithSql('expenses', 'WHERE 1');
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
          <DashbTotalCollected RoomList={RoomList} tenantList={tenantList} />
          <DashbPastPayments
            tenantList={tenantList}
            RoomList={RoomList}
            roomPaymentInfoApi={roomPaymentInfoApi}
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
              BrokerRecommendationList={BrokerRecommendationList}
            />
            <TenantGrowthWidget TenantList={tenantList} />
          </div>
          <DashbOverAllTax RoomList={RoomList} />
          <UpcomingAgreements RoomList={RoomList} TenantList={tenantList} />
        </div>
      ) : DashboardSelectedPage === 'Email History' ? (
        <>
          <DashbEmailHistory
            SelectedUserId={SelectedUserId}
            RoomList={RoomList}
            tenantList={tenantList}
          ></DashbEmailHistory>
        </>
      ) : DashboardSelectedPage === 'SMS History' ? (
        <></>
      ) : DashboardSelectedPage === 'Action History' ? (
        <DashbActionHistoryDashboard />
      ) : DashboardSelectedPage === 'Expenses' ? (
        <div
          style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap' }}
        >
          <DashbNetProfitTotalCollected
            RoomList={RoomList}
            expenses2={expenses}
            tenantList={tenantList}
          ></DashbNetProfitTotalCollected>
          <DashbMonthlyExpenseTrendWidget expenses={expenses} />
          <DashbExpenseHistory expenses={expenses} />
          <DashbUpcomingExpensesWidget expenses={expenses} />
        </div>
      ) : (
        <></>
      )}
    </>
  );
};

export default React.memo(DashboardPage);
