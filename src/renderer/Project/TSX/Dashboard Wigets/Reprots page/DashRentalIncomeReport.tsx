import React, { useState, useMemo, useEffect } from 'react';
import { getValuesWithSql } from 'Backend/localServerApis';
import '../../../CSS/Reports.css';
import CurrencySign, {
  formatNumberWithSuffix,
  getRateByDate,
  
  convertCurrency,
} from '../../Helpers/CurrencySign';
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  format,
} from 'date-fns';

const DashRentalIncomeReport = ({
  RoomList,
  tenantList,
  SelectedBranchId,
}: {
  RoomList: RoomType[];
  tenantList: tenant[];
  SelectedBranchId: string;
}) => {
  const [viewType, setViewType] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >('ALL_ETB');
  const getCurrentExchangeRate = () => {
    const storedRates = window.electron.store.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };

  // Fetch payments data
  useEffect(() => {
    const fetchPayments = async () => {
      let startDate, endDate;

      switch (viewType) {
        case 'Monthly':
          startDate = startOfYear(selectedDate);
          endDate = endOfYear(selectedDate);
          break;
        case 'Yearly':
          startDate = startOfYear(new Date(selectedDate.getFullYear() - 2, 0));
          endDate = endOfYear(new Date(selectedDate.getFullYear() + 2, 11));
          break;
      }

      const actualPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE Day >= ${startDate.getTime()} AND Day <= ${endDate.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      const historicalPayments = await getValuesWithSql(
        'room_pay_info_history',
        `WHERE Day >= ${startDate.getTime()} AND Day <= ${endDate.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      setPredictedPayments([...actualPayments, ...historicalPayments]);
    };

    fetchPayments();
  }, [viewType, selectedDate, SelectedBranchId]);

  // Generate table headers based on view type
  const tableHeaders = useMemo(() => {
    switch (viewType) {
      case 'Monthly':
        return Array.from({ length: 12 }, (_, i) =>
          format(new Date(selectedDate.getFullYear(), i), 'MMMM')
        );
      case 'Yearly':
        return Array.from({ length: 5 }, (_, i) =>
          (selectedDate.getFullYear() - 2 + i).toString()
        );
      default:
        return [];
    }
  }, [viewType, selectedDate]);

  // Add currency processing function
  const processAmount = (amount: number, roomId: string, date: number) => {
    const room = RoomList.find(r => r.id === roomId);
    const originalCurrency = room?.Currency || 'ETB';
    
    if (currencyDisplay === 'ETB_ONLY' && originalCurrency === 'ETB') return amount;
    if (currencyDisplay === 'USD_ONLY' && originalCurrency === 'USD') return amount;
    
    const { rate } = getRateByDate(date);
    
    if (currencyDisplay.includes('ETB') && originalCurrency === 'USD') {
      return amount * (rate || getCurrentExchangeRate());
    }
    if (currencyDisplay.includes('USD') && originalCurrency === 'ETB') {
      return amount / (rate || getCurrentExchangeRate());
    }
    
    return amount;
  };

  // Calculate income data
  const incomeData = useMemo(() => {
    const data = tableHeaders.map((header) => {
      let periodStart, periodEnd;

      switch (viewType) {
        case 'Monthly':
          const monthIndex = new Date(
            Date.parse(`1 ${header} 2000`)
          ).getMonth();
          periodStart = new Date(selectedDate.getFullYear(), monthIndex, 1);
          periodEnd = endOfMonth(periodStart);
          break;
        case 'Yearly':
          periodStart = startOfYear(new Date(parseInt(header), 0));
          periodEnd = endOfYear(periodStart);
          break;
      }

      const periodPayments = predictedPayments.filter(
        (payment) =>
          payment.Day >= periodStart.getTime() &&
          payment.Day <= periodEnd.getTime()
      );

      // Calculate total expected income including both paid and not paid
      const totalExpectedIncome = periodPayments
        .reduce((sum, p) => sum + processAmount(p.Value, p.roomId, p.Day), 0);

      return {
        madeIncome: periodPayments
          .filter((p) => p.Paid)
          .reduce((sum, p) => sum + processAmount(p.Value, p.roomId, p.Day), 0),
        expectedIncome: totalExpectedIncome, // Include all payments, both paid and not paid
        remainingIncome: periodPayments
          .filter((p) => !p.Paid)
          .reduce((sum, p) => sum + processAmount(p.Value, p.roomId, p.Day), 0),
      };
    });

    return data;
  }, [predictedPayments, tableHeaders, viewType, selectedDate, currencyDisplay]);

  return (
    <div className="report-container">
      <div className="report-header">
        <h2>Rental Income Report</h2>
        <div className="report-controls">
          <select
            value={viewType}
            onChange={(e) => setViewType(e.target.value as typeof viewType)}
            className="view-type-select"
          >
            <option value="Monthly">Monthly View</option>
            <option value="Yearly">Yearly View</option>
          </select>

          <div className="currency-control">
            <select
              value={currencyDisplay}
              onChange={(e) =>
                setCurrencyDisplay(e.target.value as typeof currencyDisplay)
              }
              className="currency-select"
            >
              <option value="ETB_ONLY">Show Only Birr</option>
              <option value="USD_ONLY">Show Only Dollar</option>
              <option value="ALL_ETB">Show All in Birr</option>
              <option value="ALL_USD">Show All in Dollar</option>
            </select>
            <span className="exchange-rate-info">
              Current Rate: 1 USD = {getCurrentExchangeRate()?.toFixed(2) || 'N/A'} ETB
            </span>
          </div>

          {viewType === 'Monthly' && (
            <input
              type="number"
              value={selectedDate.getFullYear()}
              onChange={(e) =>
                setSelectedDate(new Date(parseInt(e.target.value), 0))
              }
              min="1900"
              max="2100"
              className="year-picker"
            />
          )}
          {viewType === 'Yearly' && (
            <input
              type="number"
              value={selectedDate.getFullYear()}
              onChange={(e) =>
                setSelectedDate(new Date(parseInt(e.target.value), 0))
              }
              min="1900"
              max="2100"
              className="year-picker"
            />
          )}
        </div>
      </div>

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Collected <br />Income</th>
              <th>Expected <br />Income</th>
              <th>Remaining <br />Income</th>
             
            </tr>
          </thead>
          <tbody>
            {tableHeaders.map((header, index) => (
              <tr key={header}>
                <td>{header}</td>
                <td title={incomeData[index].madeIncome.toLocaleString() + CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                  {formatNumberWithSuffix(incomeData[index].madeIncome)}
                  {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </td>
                <td title={incomeData[index].expectedIncome.toLocaleString() + CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                  {formatNumberWithSuffix(incomeData[index].expectedIncome)}
                  {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </td>
                <td title={incomeData[index].remainingIncome.toLocaleString() + CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                  {formatNumberWithSuffix(incomeData[index].remainingIncome)}
                  {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </td>
              
              </tr>
            ))}
            <tr style={{borderTop:"var(--5px-V) solid var(--Text-Color-Grey)"}}>
              <td>Total</td>
              <td title={incomeData.reduce((sum, data) => sum + data.madeIncome, 0).toLocaleString() + CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                {formatNumberWithSuffix(
                  incomeData.reduce((sum, data) => sum + data.madeIncome, 0)
                )}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </td>
              <td title={incomeData.reduce((sum, data) => sum + data.expectedIncome, 0).toLocaleString() + CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                {formatNumberWithSuffix(
                  incomeData.reduce((sum, data) => sum + data.expectedIncome, 0)
                )}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </td>
              <td title={incomeData.reduce((sum, data) => sum + data.remainingIncome, 0).toLocaleString() + CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                {formatNumberWithSuffix(
                  incomeData.reduce((sum, data) => sum + data.remainingIncome, 0)
                )}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </td>
             
            </tr>
            <tr>
              <td>Average</td>
              <td title={incomeData.reduce((sum, data) => sum + data.madeIncome, 0).toLocaleString()+ CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                {formatNumberWithSuffix(
                  incomeData.reduce((sum, data) => sum + data.madeIncome, 0) / incomeData.length
                )}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </td>
              <td title={incomeData.reduce((sum, data) => sum + data.expectedIncome, 0).toLocaleString()+ CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                {formatNumberWithSuffix(
                  incomeData.reduce((sum, data) => sum + data.expectedIncome, 0) / incomeData.length
                )}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </td>
              <td title={incomeData.reduce((sum, data) => sum + data.remainingIncome, 0).toLocaleString()+ CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}>
                {formatNumberWithSuffix(
                  incomeData.reduce((sum, data) => sum + data.remainingIncome, 0) / incomeData.length
                )}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </td>
             
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashRentalIncomeReport;
