import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart, barElementClasses } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { Input } from '../Helpers/CustomReactComponents';
import {
  addDays,
  addMonths,
  format,
  startOfYear,
  endOfYear,
  addYears,
} from 'date-fns';
import CurrencySign, {
  formatNumberWithSuffix,
  getRateByDate,
} from '../Helpers/CurrencySign';
import { convertCurrency } from '../Helpers/CurrencySign';

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const DashbTotalCollected = ({
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
  const [visibleSeries, setVisibleSeries] = useState({
    collected: true,
    expected: true,
  });
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >('ALL_ETB');

  const handleSeriesToggle = (series: 'collected' | 'expected') => {
    setVisibleSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
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

      // Add ALL payments (both paid and unpaid) from actual and historical
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

      // Only generate predictions if we have payment history
      for (const room of RoomList) {
        // Skip rooms without tenants
        if (!room.tenantId) continue;

        const tenant = tenantList.find((t) => t.id === room.tenantId);
        if (!tenant) continue;

        let startDate = new Date(tenant.startTime || Date.now()).getTime();
        let endDate = yearEnd.getTime();

        // Get agreement details if exists
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

          // Only add if payment doesn't already exist
          if (!allPayments.some((p) => p.id === paymentId)) {
            // Add as unpaid prediction
            allPayments.push({
              id: paymentId,
              Day: currentDate.getTime(),
              Value: room.AgreedPrice,
              Paid: false,
              roomId: room.id,
            });
          }

          // Calculate next payment date
          currentDate = calculateNextPaymentDate(currentDate, room);
        }
      }

      setPredictedPayments(allPayments);
    };

    calculatePayments();
  }, [RoomList, tenantList, selectedDate, showBy]);

  // Helper function to calculate next payment date
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

  // Add this to display current exchange rate
  const getCurrentExchangeRate = () => {
    const storedRates = window.electron.store.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };

  // Replace processValueByCurrency function with this updated version
  const processValueByCurrency = (
    value: number,
    currency: string,
    date: number
  ) => {
    const { rate, direction } = getRateByDate(date);

    if (!rate) {
      console.warn('No rate available, using current rate as fallback');
      return value; // Return original value if no rate found
    }

    if (
      (currencyDisplay === 'ETB_ONLY' && currency === 'ETB') ||
      (currencyDisplay === 'USD_ONLY' && currency === 'USD')
    ) {
      return value;
    } else if (currencyDisplay === 'ALL_ETB') {
      if (currency === 'USD') {
        const convertedValue = value * rate;
        return convertedValue;
      }
      return value;
    } else if (currencyDisplay === 'ALL_USD') {
      if (currency === 'ETB') {
        const convertedValue = value / rate;
        return convertedValue;
      }
      return value;
    }
    return 0;
  };

  // Modify the aggregateMonthlyData to use currency filtering
  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = predictedPayments.filter(
      (d) => new Date(d.Day).getFullYear() === selectedYear
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v) => ({
        value: d3.sum(v, (d) =>
          d.Paid
            ? processValueByCurrency(
                d.Value,
                RoomList.find((r) => r.id === d.roomId)?.Currency || 'ETB',
                d.Day
              )
            : 0
        ),
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
      value: 0,
      expectedValue: 0,
    }));

    monthlyData.forEach(([month, values]) => {
      allMonths[month].value = values.value;
      allMonths[month].expectedValue = values.expectedValue;
    });

    return allMonths;
  }, [selectedDate, predictedPayments, showBy, currencyDisplay]); // Add currencyDisplay to dependencies

  // Similarly modify aggregateYearlyData
  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      predictedPayments,
      (v) => ({
        value: d3.sum(v, (d) =>
          d.Paid
            ? processValueByCurrency(
                d.Value,
                RoomList.find((r) => r.id === d.roomId)?.Currency || 'ETB',
                d.Day
              )
            : 0
        ),
        expectedValue: d3.sum(v, (d) =>
          processValueByCurrency(
            d.Value,
            RoomList.find((r) => r.id === d.roomId)?.Currency || 'ETB',
            d.Day
          )
        ),
      }),
      (d) => new Date(d.Day).getFullYear()
    );

    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year) => ({
        year: year,
        value: 0,
        expectedValue: 0,
      }));

    yearlyData.forEach(([year, values]) => {
      const index = yearRange.findIndex((y) => y.year === year);
      if (index !== -1) {
        yearRange[index].value = values.value;
        yearRange[index].expectedValue = values.expectedValue;
      }
    });

    return yearRange;
  }, [selectedDate, predictedPayments, showBy, currencyDisplay]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalCollected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear && d.Paid)
      .reduce(
        (sum, item) =>
          sum +
          processValueByCurrency(
            item.Value,
            RoomList.find((r) => r.id === item.roomId)?.Currency || 'ETB',
            item.Day
          ),
        0
      );
  }, [selectedDate, predictedPayments, showBy, currencyDisplay]);

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear)
      .reduce(
        (sum, item) =>
          sum +
          processValueByCurrency(
            item.Value,
            RoomList.find((r) => r.id === item.roomId)?.Currency || 'ETB',
            item.Day
          ),
        0
      );
  }, [selectedDate, predictedPayments, showBy, currencyDisplay]);

  const lastYearTotalCollected = useMemo(() => {
    const previousYear = parseInt(selectedDate) - 1;
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === previousYear && d.Paid)
      .reduce(
        (sum, item) =>
          sum +
          processValueByCurrency(
            item.Value,
            RoomList.find((r) => r.id === item.roomId)?.Currency || 'ETB',
            item.Day
          ),
        0
      );
  }, [selectedDate, predictedPayments, showBy, currencyDisplay]);

  const difference = totalCollected - lastYearTotalCollected;
  const percentageChange =
    lastYearTotalCollected !== 0
      ? ((difference / lastYearTotalCollected) * 100).toFixed(2)
      : 'N/A';

  const formatChartValue = (value: number) => {
    if (currencyDisplay === 'ETB_ONLY' || currencyDisplay === 'ALL_ETB') {
      const formatted = `${formatNumberWithSuffix(value)} ${CurrencySign(
        'ETB'
      )}`;
      return formatted;
    } else {
      const formatted = `${formatNumberWithSuffix(value)}${CurrencySign(
        'USD'
      )}`;
      return formatted;
    }
  };

  // Add this useMemo hook to calculate the statistics
  const collectedStats = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearData = dataset.map((item) => ({
      collected: item.value,
      month: item.month,
    }));

    const totalCollectedAmount = yearData.reduce(
      (sum, item) => sum + item.collected,
      0
    );
    const highestCollection = Math.max(
      ...yearData.map((item) => item.collected)
    );
    const averageCollection = totalCollectedAmount / yearData.length;
    const totalTransactions = predictedPayments.filter(
      (payment) =>
        new Date(payment.Day).getFullYear() === selectedYear && payment.Paid
    ).length;

    return {
      totalCollectedAmount,
      highestCollection,
      averageCollection,
      totalTransactions,
    };
  }, [dataset, selectedDate, predictedPayments]);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: 'var(--710px-V)',
        height: 'var(--510px-V)',
      }}
    >
      <p className="DashboardWigetPieChartTextHeader">Total Collected</p>

      <div className="DashboardTotalCollectedTopPart">
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
          <span className="TotalLabel">Total:</span>
          <span className="TotalValue">
            {formatChartValue(totalCollected)} /{' '}
            {formatChartValue(totalExpected)}
          </span>
          <span className="DifferenceLabel">
            <span
              className={
                difference > 0 ? 'DifferenceValue' : 'DifferenceValueNegative'
              }
            >
              {difference > 0 ? '+' : ''}
              {formatChartValue(difference)} ({percentageChange}%)
            </span>{' '}
            in {parseInt(selectedDate) - 1}
          </span>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 'var(--20px-V)',
          justifyContent: 'center',
          marginBottom: 'var(--10px-V)',
          alignItems: 'center',
        }}
      >
        <div
          onClick={() => handleSeriesToggle('collected')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--8px-V)',
            cursor: 'pointer',
            opacity: visibleSeries.collected ? 1 : 0.5,
          }}
        >
          <div
            style={{
              width: 'var(--16px-V)',
              height: 'var(--16px-V)',
              backgroundColor: 'var(--Primary-Color)',
              borderRadius: 'var(--4px-V)',
            }}
          />
          <span>Collected</span>
        </div>
        <div
          onClick={() => handleSeriesToggle('expected')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--8px-V)',
            cursor: 'pointer',
            opacity: visibleSeries.expected ? 1 : 0.5,
          }}
        >
          <div
            style={{
              width: 'var(--16px-V)',
              height: 'var(--16px-V)',
              backgroundColor: 'var(--Accent-Color50)',
              borderRadius: 'var(--4px-V)',
            }}
          />
          <span>Expected</span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
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
              cursor: 'pointer',
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
            Current Rate: 1 USD ={' '}
            {getCurrentExchangeRate()?.toFixed(2) || 'N/A'} ETB
          </span>
        </div>
      </div>

      <BarChart
        dataset={dataset}
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
        slotProps={{
          legend: {
            hidden: true,
          },
        }}
        yAxis={[
          {
            fill: 'var(--Text-Color)',
            tickLabelStyle: {
              fill: 'var(--Text-Color)',
              fontSize: 'var(--12px-V)',
            },
            valueFormatter: (value: any) => formatChartValue(value),
          },
        ]}
        series={[
          ...(visibleSeries.collected
            ? [
                {
                  dataKey: 'value',
                  label: 'Collected',
                  color: 'var(--Primary-Color)',
                  valueFormatter: (value: number | null) =>
                    value ? formatChartValue(value) : '',
                },
              ]
            : []),
          ...(visibleSeries.expected
            ? [
                {
                  dataKey: 'expectedValue',
                  label: 'Expected',
                  color: 'var(--Accent-Color50)',
                  valueFormatter: (value: number | null) =>
                    value ? formatChartValue(value) : '',
                },
              ]
            : []),
        ]}
        grid={{ vertical: true, horizontal: true }}
        margin={{
          left:
            40 +
            (window.electron.store.get('abbreiviateBigNumbers')
              ? 30
              : Math.max(
                  ...dataset.map((d) =>
                    Math.max(
                      visibleSeries.collected ? d.value || 0 : 0,
                      visibleSeries.expected ? d.expectedValue || 0 : 0
                    )
                  )
                ).toString().length * 6),
          right: 30,
          top: 5,
          bottom: 55,
        }}
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
          '.MuiChartsLegend-label': {},
          '.MuiBarElement-root': {},
        })}
      />
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
          Total Collected{' '}
          {showBy === 'Monthly' ? 'This Year' : 'Selected Period'}:
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(
              collectedStats.totalCollectedAmount.toLocaleString()
            )}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Highest {showBy === 'Monthly' ? 'Monthly' : 'Yearly'} Collection:
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(
              collectedStats.highestCollection.toLocaleString()
            )}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Average {showBy === 'Monthly' ? 'Monthly' : 'Yearly'} Collection:
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(
              collectedStats.averageCollection.toLocaleString()
            )}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Total Number of Transactions:
          <em className="ExpenseStatValue">
            {collectedStats.totalTransactions}
          </em>
        </p>
      </div>
    </div>
  );
};

export default React.memo(DashbTotalCollected);
