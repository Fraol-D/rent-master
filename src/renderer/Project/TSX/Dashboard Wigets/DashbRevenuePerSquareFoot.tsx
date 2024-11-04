import React, { useMemo, useState } from 'react';

const DashbRevenuePerSquareMeter = ({ RoomList }: { RoomList: RoomType[] }) => {
  const [viewBy, setViewBy] = useState<'month' | 'year'>('month');

  const revenuePerSquareMeter = useMemo(() => {
    let totalRevenue = 0;
    let totalSquareMeters = 0;

    RoomList.forEach((room, index) => {
      

      if (room.squareMeters && room.squareMeters > 0) {
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
          case 'Annually':
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
            annualRevenue =
              room.AgreedPrice * (365 / room.PaymentCycleCustomeDays);
            break;
          default:
            return;
        }

        const revenueForPeriod =
          viewBy === 'month' ? annualRevenue / 12 : annualRevenue;
        totalRevenue += revenueForPeriod;
        totalSquareMeters += room.squareMeters;
       
        
      } else {
      }
    });

    const result =
      totalSquareMeters > 0
        ? (totalRevenue / totalSquareMeters).toFixed(2)
        : '0';
    return { totalRevenue, totalSquareMeters, result };
  }, [RoomList, viewBy]);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{ width: 'var(--400px-V)', height: 'var(--102px-V)' }}
    >
      <p className="DashboardWigetPieChartTextHeader">
        Revenue per Square Meter
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          height: '70%',
        }}
      >
        <p style={{ fontSize: 'var(--16px-V)', textAlign: 'center' }}>
          Your current{' '}
          <select
            value={viewBy}
            onChange={(e) => setViewBy(e.target.value as 'month' | 'year')}
            style={{ marginBottom: 'var(--10px-V)' }}
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>{' '}
          revenue per square meter is:
          <br />
          <span style={{ fontSize: 'var(--14px-V)', color: 'var(--Text-Color-Grey)' }}>
            (${revenuePerSquareMeter.totalRevenue.toFixed(2)} / {revenuePerSquareMeter.totalSquareMeters.toFixed(2)} m²)
          </span> = {" "}
     
          <strong style={{ color: 'var(--Accent-Color)', fontSize: 'var(--24px-V)' }}>
            ${revenuePerSquareMeter.result}
          </strong>
        </p>
      </div>
    </div>
  );
};

export default React.memo(DashbRevenuePerSquareMeter);