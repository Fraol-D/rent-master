import { getValuesWithSql } from 'Backend/localServerApis';
import React, { useEffect, useMemo, useState } from 'react';
import { formatNumberWithSuffix } from '../Helpers/CurrencySign';
//"search bar for all" where this is make a search bar which is deffrent for each one and that search bar makes it search through to find the one you want , And also make not filter insted jump to that element or scroll to that element, only show the search bar if the show all is on
const TopPerformingUnits = ({
  RoomList,
  TenantList,
  BrokerList,
  PastTenantReviews,
  BrokerRecommendationList,SelectedBranchId
}: {
  RoomList: RoomType[];
  TenantList: tenant[];
  BrokerList: BrokerType[];
  PastTenantReviews: PastTenantReviewType[];
  BrokerRecommendationList: BrokerRecommendationType[];SelectedBranchId:any
}) => {
  const [activeTab, setActiveTab] = useState('brokers');
  const [showAll, setShowAll] = useState(false);

  const topRooms = useMemo(() => {
    return RoomList.map((room) => {
      const annualRevenue = calculateAnnualRevenue(room);
      return { ...room, annualRevenue };
    })
      .sort((a, b) => (b.annualRevenue ?? 0) - (a.annualRevenue ?? 0))
      .slice(0, showAll ? RoomList.length : 5);
  }, [RoomList, showAll]);

  const topTenants = useMemo(() => {
    return TenantList.map((tenant) => {
      const totalPaid = calculateTotalPaid(tenant, RoomList);
      return { ...tenant, totalPaid };
    })
      .sort((a, b) => (b.totalPaid ?? 0) - (a.totalPaid ?? 0))
      .slice(0, showAll ? TenantList.length : 5);
  }, [TenantList, RoomList, showAll]);

  const topBrokers = useMemo(() => {
    return BrokerList.map((broker) => {
      const tenantsCount = BrokerRecommendationList.filter(
        (recommendation: BrokerRecommendationType) =>
          recommendation.brokerId === broker.id
      ).length;

      return { ...broker, tenantsCount };
    })
      .sort((a, b) => (b.tenantsCount ?? 0) - (a.tenantsCount ?? 0))
      .slice(0, showAll ? BrokerList.length : 5);
  }, [BrokerList, showAll]);

  const loyalTenants = useMemo(() => {
    return TenantList.filter((tenant) => tenant.RentingOrOut)
      .map((tenant) => {
        const stayDuration =
          new Date().getTime() - new Date(tenant.startTime).getTime();
        return { ...tenant, stayDuration };
      })
      .sort((a, b) => b.stayDuration - a.stayDuration)
      .slice(0, showAll ? TenantList.length : 5);
  }, [TenantList, showAll]);
  const [RoomPayInfo, setRoomPayInfo] = useState<RoomPayInfo[]>([]);
  useEffect(() => {
    const GetRoomPayment = async () => {
      try {
        const rawPayment = await getValuesWithSql('room_pay_info',`WHERE branchId = '${SelectedBranchId}'`);
        if (rawPayment.length > 0) {
          setRoomPayInfo(rawPayment);
        }
      } catch (error: any) {
        console.log(error);
      }
    };
    GetRoomPayment();
  }, []);
  const topLifetimeRoomIncome = useMemo(() => {
    const roomIncomes = RoomPayInfo.reduce((acc, payment) => {
      if (payment.Paid) {
        acc[payment.roomId] = (acc[payment.roomId] || 0) + payment.Value;
      }
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(roomIncomes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, showAll ? Object.keys(roomIncomes).length : 5)
      .map(([roomId, totalIncome]) => {
        const room = RoomList.find((r) => r.id === roomId);
        return {
          roomId,
          totalIncome,
          floor: room?.floor,
          roomIndex: room?.roomIndex,
        };
      });
  }, [RoomPayInfo, RoomList, showAll]);
  return (
    <div
      className="DashboardWigetMainContainer"
      style={{ width: 'var(--400px-V)', height: 'var(--186px-V)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p
          className="DashboardWigetPieChartTextHeader"
          style={{ width: 'var(--280px-V)' }}
        >
          Top Performing Units
        </p>
        <button
          onClick={() => setShowAll(!showAll)}
          style={{
            padding: 'var(--5px-V)',
            backgroundColor: 'var(--Secondary-Color)',
            cursor: 'pointer',
          }}
        >
          {showAll ? 'Show Top 5' : 'Show All'}
        </button>
      </div>
      <div style={{ flexDirection: 'row', display: 'flex', width: '100%' }}>
        <div style={{ width: '34%', display: 'flex', flexDirection: 'column' }}>
       
          <button
            onClick={() => setActiveTab('brokers')}
            style={{
              width: 'var(--100px-V)',
              padding: 'var(--5px-V)',
              backgroundColor:
                activeTab === 'brokers'
                  ? 'var(--Secondary-Color)'
                  : 'var(--Background-Color)',
              cursor: 'pointer',
            }}
          >
            Brokers
          </button>
          <button
            onClick={() => setActiveTab('loyal')}
            style={{
              width: 'var(--100px-V)',
              padding: 'var(--5px-V)',
              backgroundColor:
                activeTab === 'loyal'
                  ? 'var(--Secondary-Color)'
                  : 'var(--Background-Color)',
              cursor: 'pointer',
            }}
          >
            Loyal
          </button>
          <button
            onClick={() => setActiveTab('lifetime')}
            style={{
              width: 'var(--100px-V)',
              padding: 'var(--5px-V)',
              backgroundColor:
                activeTab === 'lifetime'
                  ? 'var(--Secondary-Color)'
                  : 'var(--Background-Color)',
              cursor: 'pointer',
            }}
          >
            Lifetime
          </button>
        </div>
        <div
          style={{
            width: '85%',
            border: 'var(--1px-V) solid grey',
            borderRadius: 'var(--10px-V)',
            paddingLeft: 'var(--5px-V)',
            overflowY: 'auto',
            height: 'var(--145px-V)',
          }}
        >
          <div>
            {/* search bar for all*/}
            {activeTab === 'rooms' && (
              <TopListRoom
                title="Top Rooms"
                items={topRooms}
                valueKey="annualRevenue"
              />
            )}
            {activeTab === 'tenants' && (
              <TopList
                title="Top Tenants"
                items={topTenants}
                valueKey="totalPaid"
                labelKey="name"
              />
            )}
            {activeTab === 'brokers' && (
              <TopList
                title="Top Brokers"
                items={topBrokers}
                valueKey="tenantsCount"
                labelKey="name"
              />
            )}
            {activeTab === 'loyal' && (
              <TopList
                title="Top Loyal Tenants"
                items={loyalTenants}
                valueKey="stayDuration"
                labelKey="name"
                valueFormatter={(duration: number) =>
                  `${Math.floor(duration / (1000 * 60 * 60 * 24))} day` + (Math.floor(duration / (1000 * 60 * 60 * 24)) > 1 ? "s":'')
                }
              />
            )}
            {activeTab === 'lifetime' && (
              <TopListRoom
                title="Top Lifetime Room Income"
                items={topLifetimeRoomIncome}
                valueKey="totalIncome"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TopList = ({ title, items, valueKey, labelKey, valueFormatter }: any) => (
  <div>
    <ul style={{ listStyleType: 'none', padding: 0 }}>
      {items.map((item: any, index: any) => (
        <li key={index} style={{ marginBottom: 'var(--10px-V)' }}>
          {index + 1}. <strong>{item[labelKey]}</strong>:{' '}
          {valueFormatter
            ? valueFormatter(item[valueKey])
            : formatNumberWithSuffix(item[valueKey]?.toLocaleString())}
          {valueKey === 'annualRevenue' || valueKey === 'totalPaid'
            ? ' '
            : valueKey === 'tenantsCount'
            ? ' tenants'
            : ''}
        </li>
      ))}
    </ul>
  </div>
);

const TopListRoom = ({ title, items, valueKey }: any) => (
  <div>
    <ul style={{ listStyleType: 'none', padding: 0 }}>
      {items.map((item: any, index: any) => (
        <li key={index} style={{ marginBottom: 'var(--10px-V)' }}>
          {index + 1}.{' '}
          <strong>
            Flr: {item.floor}, Rm: {item.roomIndex}
          </strong>
          : {item[valueKey]?.toLocaleString()}
          {valueKey === 'annualRevenue' ||
          valueKey === 'totalPaid' ||
          valueKey === 'totalIncome'
            ? ' '
            : ' tenants'}
        </li>
      ))}
    </ul>
  </div>
);

const calculateAnnualRevenue = (room: RoomType) => {
  let annualRevenue = 0;
  switch (room.PaymentCycleType) {
    case 'daily':
      annualRevenue = room.AgreedPrice * 365;
      break;
    case 'weekly':
      annualRevenue = room.AgreedPrice * 52;
      break;
    case 'monthly':
      annualRevenue = room.AgreedPrice * 12;
      break;
    case 'monthly':
      annualRevenue = room.AgreedPrice;
      break;
    case '30':
    case '30':
      annualRevenue = room.AgreedPrice * 12;
      break;
    case '15':
    case '15':
      annualRevenue = room.AgreedPrice * 24;
      break;
    case '7':
    case '7':
      annualRevenue = room.AgreedPrice * 52;
      break;
    case 'custom':
      annualRevenue = room.AgreedPrice * (365 / room.PaymentCycleCustomeDays);
      break;
    default:
      console.log('  Unknown payment cycle', room.PaymentCycleType);
      return;
  }
  return annualRevenue;
};

const calculateTotalPaid = (tenant: tenant, RoomList: RoomType[]) => {
  const room = RoomList.find((r) => r.tenantId === tenant.id);
  if (!room) return 0;
  return calculateAnnualRevenue(room);
};
export default React.memo(TopPerformingUnits);
