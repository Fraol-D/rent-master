import { storageManager } from '../../../storeManager';
import React, { useMemo, useState } from 'react';
import {
  formatNumberWithSuffix,
  GetDefaultCurrency,
  CurrencySign,
  getRateByDate,
  convertCurrency,
} from '../Helpers/CurrencySign';

const DashbRevenuePerSquareMeter = ({ RoomList }: { RoomList: RoomType[] }) => {
  const [viewBy, setViewBy] = useState<'month' | 'year'>('month');
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >(GetDefaultCurrency() === 'ETB' ? 'ALL_ETB' : 'ALL_USD');

  // Helper function to process currency values
  const processValueByCurrency = (
    value: number,
    currency: string,
    date: number
  ) => {
    const { rate } = getRateByDate(date);

    if (!rate) {
      console.warn('No rate available, using original value');
      return value;
    }

    if (
      (currencyDisplay === 'ETB_ONLY' && currency === 'ETB') ||
      (currencyDisplay === 'USD_ONLY' && currency === 'USD')
    ) {
      return value;
    } else if (currencyDisplay === 'ALL_ETB') {
      if (currency === 'USD') {
        return value * rate;
      }
      return value;
    } else if (currencyDisplay === 'ALL_USD') {
      if (currency === 'ETB') {
        return value / rate;
      }
      return value;
    }
    return 0;
  };

  const revenuePerSquareMeter = useMemo(() => {
    let totalRevenue = 0;
    let totalSquareMeters = 0;

    RoomList.forEach((room) => {
      if (room.squareMeters && room.squareMeters > 0 && room.tenantId) {
        let annualRevenue = 0;

        // Process room price with currency conversion
        const roomPrice = processValueByCurrency(
          room.AgreedPrice,
          room.Currency || 'ETB',
          Date.now()
        );

        // Calculate annual revenue based on payment cycle
        switch (room.PaymentCycleType) {
          case 'daily':
            annualRevenue = roomPrice * 365;
            break;
          case 'weekly':
          case '7':
            annualRevenue = roomPrice * 52;
            break;
          case 'monthly':
          case '30':
            annualRevenue = roomPrice * 12;
            break;
          case '15':
            annualRevenue = roomPrice * 24;
            break;
          case 'Annually':
            annualRevenue = roomPrice;
            break;
          case 'custom':
            if (room.PaymentCycleCustomeDays) {
              annualRevenue = roomPrice * (365 / room.PaymentCycleCustomeDays);
            }
            break;
          default:
            annualRevenue = roomPrice * 12; // Default to monthly
        }

        const revenueForPeriod =
          viewBy === 'month' ? annualRevenue / 12 : annualRevenue;
        totalRevenue += revenueForPeriod;
        totalSquareMeters += room.squareMeters;
      }
    });

    const result = totalSquareMeters > 0 ? totalRevenue / totalSquareMeters : 0;
    return {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalSquareMeters: parseFloat(totalSquareMeters.toFixed(2)),
      result: parseFloat(result.toFixed(2)),
    };
  }, [RoomList, viewBy, currencyDisplay]);

  // Get current exchange rate for display
  const getCurrentExchangeRate = () => {
    const storedRates = storageManager.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };

  return (
    <div
      className="DashboardWigetMainContainer"
      id="DashbRevenuePerSquareFoot"
      style={{ width: 'var(--400px-V)', height: 'var(--102px-V)' }}
    >
      <p className="DashboardWigetPieChartTextHeader">
        Revenue per Square Meter
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: 'var(--10px-V)',
          gap: 'var(--10px-V)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--10px-V)',
          }}
        >
          <select
            value={viewBy}
            onChange={(e) => setViewBy(e.target.value as 'month' | 'year')}
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
            }}
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontSize: 'var(--12px-V)',
              color: 'var(--Text-Color-Grey)',
            }}
          >
            {formatNumberWithSuffix(revenuePerSquareMeter.totalRevenue)}{' '}
            {currencyDisplay.includes('ETB') ? 'ETB' : 'USD'} /{' '}
            {revenuePerSquareMeter.totalSquareMeters} m²
          </div>
          <div
            style={{ fontSize: 'var(--24px-V)', color: 'var(--Accent-Color)' }}
          >
            {formatNumberWithSuffix(revenuePerSquareMeter.result)}{' '}
            {currencyDisplay.includes('ETB') ? 'ETB' : 'USD'}
          </div>
          <div
            style={{
              fontSize: 'var(--12px-V)',
              color: 'var(--Text-Color-Grey)',
            }}
          >
            Rate: 1 USD = {getCurrentExchangeRate()?.toFixed(2) || 'N/A'} ETB
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashbRevenuePerSquareMeter);
