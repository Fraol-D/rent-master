import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { addDays, addMonths, addYears, startOfYear, endOfYear } from 'date-fns';
import { Input } from '../Helpers/CustomReactComponents';
import {
  formatNumberWithSuffix,
  GetDefaultCurrency,
  CurrencySign,
  getRateByDate,
} from '../Helpers/CurrencySign';

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const DashbOverAllTax = ({
  RoomList,
  tenantList,
  SelectedBranchId,
}: {
  RoomList: RoomType[];
  tenantList: tenant[];
  SelectedBranchId: any;
}) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >(GetDefaultCurrency() === 'ETB' ? 'ALL_ETB' : 'ALL_USD');

  const processValueByCurrency = (
    value: number,
    currency: string,
    date: number
  ) => {
    const { rate, direction } = getRateByDate(date);

    if (!rate) {
      console.warn(
        'No rate available for tax calculation, using original value'
      );
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
    return value;
  };

  useEffect(() => {
    const calculatePayments = async () => {
      const allPayments: Payment[] = [];
      const selectedYear = parseInt(selectedDate);
      let yearStart = startOfYear(new Date(selectedYear - 2, 0, 1));
      let yearEnd = endOfYear(new Date(selectedYear + 2, 11, 31));

      // Get all actual payments for the selected year range
      const actualPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      // Get historical payments
      const historicalPayments = await getValuesWithSql(
        'room_pay_info_history',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      // Map all payments (including unpaid ones for tax calculation)
      const combinedPayments = [...actualPayments, ...historicalPayments].map(
        (payment) => ({
          id: payment.id,
          Day: payment.Day,
          Value: payment.Value,
          Paid: payment.Paid === 1,
          roomId: payment.roomId,
        })
      );

      // Add all payments to allPayments
      allPayments.push(...combinedPayments);

      // Generate predictions for all rooms with tenants
      for (const room of RoomList) {
        if (!room.tenantId) continue;

        const tenant = tenantList.find((t) => t.id === room.tenantId) || null;
        if (!tenant) continue;

        let startDate = new Date(tenant.startTime || Date.now()).getTime();
        let endDate = yearEnd.getTime();

        if (room.selectedAgreementId) {
          const agreements = await getValuesWithSql(
            'agreements',
            `WHERE id = '${room.selectedAgreementId}'`
          );
          if (agreements.length > 0) {
            startDate = Math.max(agreements[0].startTime, yearStart.getTime());
            if (
              tenant.SelectedAgreement === 'Fixed-Term' &&
              agreements[0].endTime
            ) {
              endDate = Math.min(agreements[0].endTime, yearEnd.getTime());
            }
          }
        }

        let currentDate = new Date(startDate);

        while (currentDate.getTime() <= endDate) {
          const paymentId = `${room.id}-${currentDate.getTime()}`;

          if (!allPayments.some((p) => p.id === paymentId)) {
            allPayments.push({
              id: paymentId,
              Day: currentDate.getTime(),
              Value: room.AgreedPrice,
              Paid: false,
              roomId: room.id,
            });
          }

          currentDate = calculateNextPaymentDate(currentDate, room);
        }
      }

      setPredictedPayments(allPayments);
    };

    calculatePayments();
  }, [RoomList, tenantList, selectedDate, showBy]);

  const calculateNextPaymentDate = (currentDate: Date, room: any) => {
    switch (room.PaymentCycleType) {
      case '30':
        return addDays(currentDate, 30);
      case '15':
        return addDays(currentDate, 15);
      case '7':
        return addDays(currentDate, 7);
      case 'daily':
        return addDays(currentDate, 1);
      case 'monthly':
        return addMonths(currentDate, 1);
      case 'weekly':
        return addDays(currentDate, 7);
      case 'Annually':
        return addYears(currentDate, 1);
      case 'custom':
        return addDays(currentDate, room.PaymentCycleCustomeDays || 30);
      default:
        return addMonths(currentDate, 1);
    }
  };

  const calculateTax = (value: number) =>
    value * (storageManager.get('taxPercentage') / 100 || 0.15);

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = predictedPayments.filter(
      (d) => new Date(d.Day).getFullYear() === selectedYear
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v) => ({
        expectedValue: d3.sum(v, (d) =>
          processValueByCurrency(
            d.Value,
            RoomList.find((r) => r.id === d.roomId)?.Currency || 'ETB',
            d.Day
          )
        ),
      }),
      (d) => new Date(d.Day).getMonth()
    );

    const allMonths = d3.range(0, 12).map((month) => ({
      month: d3.timeFormat('%b')(new Date(0, month)),
      expectedValue: 0,
      tax: 0,
    }));

    monthlyData.forEach(([month, values]) => {
      allMonths[month].expectedValue = values.expectedValue;
      allMonths[month].tax = calculateTax(values.expectedValue);
    });

    return allMonths;
  }, [selectedDate, predictedPayments, currencyDisplay]);
  // Add this to display current exchange rate
  const getCurrentExchangeRate = () => {
    const storedRates = storageManager.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };
  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      predictedPayments,
      (v) => ({
        expectedValue: d3.sum(v, (d) => d.Value),
      }),
      (d) => new Date(d.Day).getFullYear()
    );
    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year) => ({
        year: year,
        expectedValue: 0,
        tax: 0,
      }));
    yearlyData.forEach(([year, values]) => {
      const index = yearRange.findIndex((y) => y.year === year);
      if (index !== -1) {
        yearRange[index].expectedValue = values.expectedValue;
        yearRange[index].tax = calculateTax(values.expectedValue);
      }
    });
    return yearRange;
  }, [selectedDate, predictedPayments]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear)
      .reduce((sum, item) => sum + item.Value, 0);
  }, [selectedDate, predictedPayments]);

  const totalTax = calculateTax(totalExpected);

  // Add this before the return statement to calculate stats
  const taxStats = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearData = dataset.map((item) => ({
      tax: showBy === 'Monthly' ? item.tax : item.tax,
      month: showBy === 'Monthly' ? item.month : item.year,
    }));

    const totalTaxAmount = yearData.reduce((sum, item) => sum + item.tax, 0);
    const highestTax = Math.max(...yearData.map((item) => item.tax));
    const averageTax = totalTaxAmount / yearData.length;
    const totalTransactions = predictedPayments.filter(
      (payment) => new Date(payment.Day).getFullYear() === selectedYear
    ).length;

    return {
      totalTaxAmount,
      highestTax,
      averageTax,
      totalTransactions,
    };
  }, [dataset, selectedDate, showBy, predictedPayments]);

  // Modify the return statement to add the stats container
  return (
    <div
      className="DashboardWigetMainContainer"
      style={{ width: 'var(--710px-V)', height: 'var(--500px-V)' }}
    >
      <p className="DashboardWigetPieChartTextHeader">
        Overall Tax ({storageManager.get('taxPercentage') || 0.15}%)
      </p>
      <div
        className="DashboardTotalCollectedTopPart"
        style={{ marginBottom: '0' }}
      >
        <div className="ShowByContainer">
          <span className="ShowByLabel">Show by</span>
          <select
            className="ShowBySelect"
            value={showBy}
            onChange={(e) => setShowBy(e.target.value as 'Monthly' | 'Yearly')}
          >
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div className="YearInputContainer">
          <div className="ShowByContainer">
            {' '}
            <span className="YearLabel">Year</span>
            <input
              className="YearInput"
              type="number"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min="1900"
              max="2100"
              step="1"
            />
          </div>
          <span className="TotalLabel">
            Total Tax:{' '}
            <span className="TotalValue">
              {formatNumberWithSuffix(taxStats.totalTaxAmount)}
              {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
            </span>
          </span>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {' '}
            <select
              value={currencyDisplay}
              onChange={(e) =>
                setCurrencyDisplay(e.target.value as typeof currencyDisplay)
              }
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--Border-Color)',
                backgroundColor: 'var(--Secondary-Color)',
                color: 'var(--Text-Color)',
                marginLeft: 'var(--10px-V)',
              }}
            >
              <option value="ETB_ONLY">Show Only Birr</option>
              <option value="USD_ONLY">Show Only Dollar</option>
              <option value="ALL_ETB">Show All in Birr</option>
              <option value="ALL_USD">Show All in Dollar</option>
            </select>
            <span
              style={{
                fontSize: 'var(--12px-V)',
                color: 'var(--Text-Color-Grey)',
                marginLeft: 'var(--10px-V)',
              }}
            >
              Rate: 1 USD = {getCurrentExchangeRate()?.toFixed(2) || 'N/A'} ETB
            </span>
          </div>
        </div>
      </div>
      <BarChart
        dataset={dataset}
        slotProps={{
          legend: {
            hidden: true,
          },
        }}
        xAxis={[
          {
            scaleType: 'band',
            tickLabelStyle: {
              fill: 'var(--Text-Color)',
              fontSize: 'var(--12px-V)',
            },
            dataKey: showBy === 'Monthly' ? 'month' : 'year',
          },
        ]}
        yAxis={[
          {
            fill: 'var(--Text-Color)',
            tickLabelStyle: {
              fill: 'var(--Text-Color)',
              fontSize: 'var(--12px-V)',
            },
            valueFormatter: (value: any) =>
              `${formatNumberWithSuffix(value)}${CurrencySign(
                currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
              )}`,
          },
        ]}
        series={[
          {
            dataKey: 'tax',
            label: `Tax (${storageManager.get('taxPercentage') || 0.15}%)`,
            valueFormatter: (value: any) =>
              `${formatNumberWithSuffix(value)}${CurrencySign(
                currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
              )}`,

            color: 'var(--Accent-Color50)',
          },
        ]}
        margin={{
          left:
            40 +
            (storageManager.get('abbreiviateBigNumbers')
              ? 30
              : Math.max(...dataset.map((d) => d.tax.toString().length * 6))),
          right: 30,
          top: 10,
          bottom: 55,
        }}
        grid={{ vertical: true, horizontal: true }}
        sx={(theme) => ({
          [`.${axisClasses.root}`]: {
            [`.${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: 'var(--Text-Color)',
              strokeWidth: 1,
            },
            [`.${axisClasses.tickLabel}`]: {
              fill: 'var(--Text-Color)',
            },
          },
        })}
      />

      {/* Add this new stats container */}
      <div
        className="ExpenseStatsContainer"
        style={{
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          top: 'var(---31px-V)',
          height: 'var(--16px-V)',
          textAlign: 'center',
        }}
      >
        <p className="ExpenseStatItem">
          Total Tax {showBy === 'Monthly' ? 'This Year' : 'Selected Period'}:{' '}
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(taxStats.totalTaxAmount.toLocaleString())}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Highest {showBy === 'Monthly' ? 'Monthly' : 'Yearly'} Tax:{' '}
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(taxStats.highestTax.toLocaleString())}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Average {showBy === 'Monthly' ? 'Monthly' : 'Yearly'} Tax:{' '}
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(taxStats.averageTax.toLocaleString())}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Total Number of Transactions:{' '}
          <em className="ExpenseStatValue">{taxStats.totalTransactions}</em>
        </p>
      </div>
    </div>
  );
};

export default React.memo(DashbOverAllTax);
