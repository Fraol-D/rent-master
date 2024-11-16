import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart, barElementClasses } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { Input } from '../Helpers/CustomReactComponents';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  isBefore,
  isAfter,
  addMonths,
  addYears,
} from 'date-fns';
import CurrencySign, {
  formatNumberWithSuffix,
  GetDefaultCurrency,
  getRateByDate,
} from '../Helpers/CurrencySign';
import { Payment } from 'electron';

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const DashbNetProfitTotalCollected = ({
  RoomList,
  expenses2,
  tenantList,
  SelectedBranchId,
}: {
  RoomList: RoomType[];
  expenses2: expenses[];
  tenantList: tenant[];
  SelectedBranchId: any;
}) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<expenses[]>([]);
  const [visibleSeries, setVisibleSeries] = useState({
    collected: true,
    expected: true,
  });
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >(GetDefaultCurrency() === 'ETB' ? 'ALL_ETB' : 'ALL_USD');

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

      // Get all actual payments
      const actualPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      // Get historical payments
      const historicalPayments = await getValuesWithSql(
        'room_pay_info_history',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      // Add ALL payments (both paid and unpaid)
      const combinedPayments = [...actualPayments, ...historicalPayments].map(
        (payment) => ({
          id: payment.id,
          Day: payment.Day,
          Value: payment.Value,
          Paid: payment.Paid === 1,
          roomId: payment.roomId,
        })
      );

      allPayments.push(...combinedPayments);

      // Generate future payments
      for (const room of RoomList) {
        if (!room.tenantId) continue;
        const tenant = tenantList.find((t) => t.id === room.tenantId);
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
      setExpenses(expenses2);
    };

    calculatePayments();
  }, [RoomList, tenantList, selectedDate, showBy, expenses2]);

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

  const generateRecurringExpenses = (
    expenses: expenses[],
    startDate: Date,
    endDate: Date
  ): expenses[] => {
    let allExpenses: expenses[] = [];

    expenses.forEach((expense) => {
      if (expense.doesReoccur) {
        const StartExpenseDate = new Date(expense.date);
        StartExpenseDate.setHours(0, 0, 0, 0);

        // Get the actual start date (either expense start date or period start date)
        const effectiveStartDate = new Date(StartExpenseDate.getTime());

        let currentDate = effectiveStartDate;
        let expenseCount = 0;

        // Calculate end date based on expense settings
        const finalEndDate = expense.HasEndDate
          ? new Date(Math.min(expense.EndDate, endDate.getTime()))
          : endDate;

        while (currentDate <= finalEndDate && expenseCount < 100) {
          const expenseId = `${expense.id}-${currentDate.getTime()}`;

          // Only add if the expense date falls within our range
          if (
            currentDate >= startDate &&
            (currentDate <= endDate || expense.HasEndDate)
          ) {
            allExpenses.push({
              ...expense,
              id: expenseId,
              date: currentDate.getTime(),
            });
          }

          // Calculate next expense date based on recurring type
          switch (expense.recurringType) {
            case 'Day':
              // Add days based on recurringCycle
              currentDate = addDays(currentDate, expense.recurringCycle);
              break;
            case 'Monthly':
              // Add one month to current date
              const nextMonthDate = new Date(currentDate);
              nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
              currentDate = nextMonthDate;
              break;

            case 'Yearly':
              // Preserve month and day when adding years
              const nextYearDate = new Date(currentDate);
              const originalMonth = nextYearDate.getMonth();
              const originalDay = nextYearDate.getDate();
              nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
              // Ensure we keep the same month and day
              nextYearDate.setMonth(originalMonth);
              nextYearDate.setDate(originalDay);
              currentDate = nextYearDate;
              console.log(currentDate, 'lllllllllll');
              break;

            default:
              console.warn(
                `Unknown recurring type: ${expense.recurringType}, defaulting to monthly`
              );
              const defaultNextDate = new Date(currentDate);
              defaultNextDate.setMonth(defaultNextDate.getMonth() + 1);
          }

          expenseCount++;
        }
      } else {
        // For non-recurring expenses, only include if within date range
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);

        if (expenseDate >= startDate && expenseDate <= endDate) {
          allExpenses.push({
            ...expense,
            date: expenseDate.getTime(),
          });
        }
      }
    });

    // Sort expenses by date
    return allExpenses.sort((a, b) => a.date - b.date);
  };

  const processValueByCurrency = (value: number, currency: string | undefined, date: number) => {
    const { rate, direction } = getRateByDate(date);
    console.log(value, currency || GetDefaultCurrency(), currencyDisplay);
    if (!rate) {
      console.warn('No rate available, using current rate as fallback');
      return 0; // Return 0 if no rate found to be consistent
    }
  
    // For ETB_ONLY, only show ETB values, return 0 for USD
    if (currencyDisplay === 'ETB_ONLY') {
      return currency === 'ETB' ? value : 0;
    }
    
    // For USD_ONLY, only show USD values, return 0 for ETB
    if (currencyDisplay === 'USD_ONLY') {
      return currency === 'USD' ? value : 0;
    }
    
    // For ALL_ETB, convert USD to ETB
    if (currencyDisplay === 'ALL_ETB') {
      if (currency === 'USD') {
        return value * rate;
      }
      return value;
    }
    
    // For ALL_USD, convert ETB to USD
    if (currencyDisplay === 'ALL_USD') {
      if (currency === 'ETB') {
        return value / rate;
      }
      return value;
    }
  
    return 0;
  };
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

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = predictedPayments.filter(
      (d) => new Date(d.Day).getFullYear() === selectedYear
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v) => ({
        value: d3.sum(v, (d) => {
          const room = RoomList.find((r) => r.id === d.roomId);
          return d.Paid
            ? processValueByCurrency(d.Value, room?.Currency, d.Day)
            : 0;
        }),
        expectedValue: d3.sum(v, (d) => {
          const room = RoomList.find((r) => r.id === d.roomId);
          return processValueByCurrency(
            d.Value,
            room?.Currency ,
            d.Day
          );
        }),
        expenses: d3.sum(
          expenses.filter(
            (e) => new Date(e.date).getMonth() === new Date(v[0].Day).getMonth()
          ),
          (e) => {
            const expense = expenses.find((r) => r.id === e.id);
            console.log("agregated monthly expenses",processValueByCurrency(
              e.price,
              expense?.Currency,
              new Date(e.date).getTime()
            ))
            return processValueByCurrency(
              e.price,
              expense?.Currency,
              new Date(e.date).getTime()
            );
          }
        ),
      }),
      (d) => new Date(d.Day).getMonth()
    );
    const startDate = startOfYear(new Date(selectedYear, 0, 1));
    const endDate = endOfYear(new Date(selectedYear, 11, 31));

    const allExpenses = generateRecurringExpenses(expenses, startDate, endDate);

    const allMonths = d3.range(0, 12).map((month: any) => {
      const monthStart = startOfMonth(new Date(selectedYear, month, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, month, 1));
      const monthlyExpenses = allExpenses
        .filter(
          (e) => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd
        )
        .reduce((sum, e) => sum + processValueByCurrency(
          e.price,
          e.Currency,
          new Date(e.date).getTime()
        ), 0);

      const monthData = monthlyData.find(([m]) => m === month);
      const income = monthData ? monthData[1].value : 0;
      const expectedIncome = monthData ? monthData[1].expectedValue : 0;
      console.log("monthly data", monthlyData, "other one", {
        month: d3.timeFormat('%b')(new Date(0, month)),
        netIncome: income - monthlyExpenses,
        expectedNetIncome: expectedIncome - monthlyExpenses
      })

      return {
        month: d3.timeFormat('%b')(new Date(0, month)),
        value: income - monthlyExpenses,
        expectedValue: expectedIncome - monthlyExpenses,
      };
    });

    return allMonths.map((month) => ({
      ...month,
      value: month.value,
      expectedValue: month.expectedValue,
    }));
  }, [selectedDate, predictedPayments, expenses, RoomList, currencyDisplay]);

  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      predictedPayments,
      (v: any) => ({
        value: d3.sum(v, (d: any) => d.value),
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => new Date(d.Day).getFullYear()
    );

    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year: any) => {
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 11, 31));
        const allExpenses = generateRecurringExpenses(
          expenses,
          yearStart,
          yearEnd
        );
        const yearlyExpenses = allExpenses
          .filter(
            (e) => new Date(e.date) >= yearStart && new Date(e.date) <= yearEnd
          )
          .reduce((sum, e) => sum + e.price, 0);

        const yearData = yearlyData.find(([y]) => y === year);
        const income = yearData ? yearData[1].value : 0;
        const expectedIncome = yearData ? yearData[1].expectedValue : 0;

        return {
          year: year,
          value: income - yearlyExpenses,
          expectedValue: expectedIncome - yearlyExpenses,
        };
      });

    return yearRange;
  }, [selectedDate, predictedPayments, expenses]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;
  // Add this to display current exchange rate
  const getCurrentExchangeRate = () => {
    const storedRates = window.electron.store.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };

  const totalCollected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);

    const yearlyExpenses = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === selectedYear)
      .reduce((sum, e) => {
        const expense = allExpenses.find((r) => r.id === e.id);
        console.log(expense?.Currency)
        return (
          sum +
          processValueByCurrency(
            e.price,
            expense?.Currency ,
            new Date(e.date).getTime()
          )
        );
      }, 0);

    const totalIncome = predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear)
      .reduce((sum, item) => {
        const room = RoomList.find((r) => r.id === item.roomId);
        return (
          sum +
          processValueByCurrency(item.Value, room?.Currency , item.Day)
        );
      }, 0);

    return totalIncome - yearlyExpenses;
  }, [selectedDate, predictedPayments, expenses, RoomList, currencyDisplay]);

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);

    const yearlyExpenses = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === selectedYear)
      .reduce((sum, e) => {
        const expense = allExpenses.find((r) => r.id === e.id);
        console.log( processValueByCurrency(
          e.price,
          expense?.Currency ,
          new Date(e.date).getTime()
        ))
        return (
          sum +
          processValueByCurrency(
            e.price,
            expense?.Currency ,
            new Date(e.date).getTime()
          )
        );
      }, 0);

    const expectedIncome = predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear)
      .reduce((sum, item) => {
        const room = RoomList.find((r) => r.id === item.roomId);
        return (
          sum +
          processValueByCurrency(item.Value, room?.Currency , item.Day)
        );
      }, 0);

    return expectedIncome - yearlyExpenses;
  }, [selectedDate, predictedPayments, expenses, RoomList, currencyDisplay]);

  const lastYearTotalCollected = useMemo(() => {
    const previousYear = parseInt(selectedDate) - 1;
    const yearStart = startOfYear(new Date(previousYear, 0, 1));
    const yearEnd = endOfYear(new Date(previousYear, 11, 31));
    const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);
    const yearlyExpenses = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === previousYear)
      .reduce((sum, e) => sum + e.price, 0);
    return (
      predictedPayments
        .filter((d) => new Date(d.Day).getFullYear() === previousYear)
        .reduce((sum, item) => sum + item.Value, 0) - yearlyExpenses
    );
  }, [selectedDate, predictedPayments, expenses]);

  const difference = totalCollected - lastYearTotalCollected;
  const percentageChange =
    lastYearTotalCollected !== 0
      ? (
          (difference /
            (lastYearTotalCollected === 0 ? 1 : lastYearTotalCollected)) *
          100
        ).toFixed(2)
      : 'N/A';

  // Add this useMemo hook to calculate the statistics
  const netProfitStats = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearData = dataset.map((item) => ({
      netProfit: item.value,
      month: item.month,
    }));

    const totalNetProfitAmount = yearData.reduce((sum, item) => sum + item.netProfit, 0);
    const highestNetProfit = Math.max(...yearData.map((item) => item.netProfit));
    const averageNetProfit = totalNetProfitAmount / yearData.length;
    const totalTransactions = predictedPayments.filter(
      (payment) => new Date(payment.Day).getFullYear() === selectedYear && payment.Paid
    ).length;

    return {
      totalNetProfitAmount,
      highestNetProfit,
      averageNetProfit,
      totalTransactions,
    };
  }, [dataset, selectedDate, predictedPayments]);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
   
        height: 'var(--510px-V)',
      }}
    >
      <p
        className="DashboardWigetPieChartTextHeader"
        style={{ width: 'var(--458px-V)' }}
      >
        Net Profit (Total Collected - Expenses)
      </p>

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
        <div className='ShowByContainer'>  <span className="YearLabel">Year</span>
          <input
            className="YearInput"
            type="number"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min="1900"
            max="2100"
            step="1"
          /></div>
          <span className="TotalLabel">Total:</span>
          <span className="TotalValue">
            ${formatNumberWithSuffix(totalCollected.toLocaleString())} / $
            {formatNumberWithSuffix(totalExpected.toLocaleString())}
          </span>
          <span className="DifferenceLabel">
            <span
              className={
                difference > 0 ? 'DifferenceValue' : 'DifferenceValueNegative'
              }
            >
              {difference > 0 ? '+' : ''}$
              {formatNumberWithSuffix(difference.toLocaleString())} (
              {percentageChange}%)
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
        }}
      >
        <div
          onClick={() => handleSeriesToggle('collected')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--8px-V)',
            cursor: 'pointer',
            opacity: visibleSeries.collected ? 1 : 0.2,
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
            opacity: visibleSeries.expected ? 1 : 0.2,
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
          style={{ display: 'flex', alignItems: 'center', flexDirection: 'column' }}
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
              backgroundColor: 'var(--Background-Color)',
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
            }}
          >
            Current Rate: 1 USD ={' '}
            {getCurrentExchangeRate()?.toFixed(2) || 'N/A'} ETB
          </span>
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
            valueFormatter: (value: any) => formatChartValue(value),
            tickLabelStyle: {
              fill: 'var(--Text-Color)',
              fontSize: 'var(--12px-V)',
            },
            colorMap: {
              type: 'piecewise',
              thresholds: [0, 1000000],
              colors: ['red', 'var(--Primary-Color)'],
            },
          },
          {
            label: 'Amount ($)',
            fill: 'var(--Text-Color)',
          },
        ]}
        series={[
          ...(visibleSeries.collected
            ? [
                {
                  dataKey: 'value',
                  label: 'Collected',
                  color: 'var(--Primary-Color)',
                  valueFormatter: (value: any) => formatChartValue(value),
                },
              ]
            : []),
          ...(visibleSeries.expected
            ? [
                {
                  dataKey: 'expectedValue',
                  label: 'Expected',
                  color: 'var(--Accent-Color50)',
                  valueFormatter: (value: any) => formatChartValue(value),
                },
              ]
            : []),
        ]}
        margin={{
          left: 40 + (window.electron.store.get("abbreiviateBigNumbers") ? 30 : Math.max(
            ...dataset.map(d => Math.max(
              visibleSeries.collected ? d.value || 0 : 0,
              visibleSeries.expected ? d.expectedValue || 0 : 0
            ))
          ).toString().length * 6),
          right: 10,
          top: 10,
          bottom: 55,
        }}
        grid={{ vertical: true, horizontal: true }}
        sx={{
          [`.${axisClasses.left} .${axisClasses.label}`]: {
            transform: 'translate(var(---35px-V), 0)',
            color: 'var(--Text-Color)',
            fill: 'var(--Text-Color)',
          },
          [`.${axisClasses.root}`]: {
            [`.${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: 'var(--Text-Color)',
              strokeWidth: 1,
            },
            [`.${axisClasses.tickLabel}`]: {
              fill: 'var(--Text-Color)',
            },
          },
        }}
      />
      <div
        className="ExpenseStatsContainer"
        style={{
          display: 'flex',
flexDirection: 'row',
position: 'relative',
top: 'var(---31px-V)',
height: 'var(--16px-V)',
textAlign: 'center'
        }}
      >
        <p className="ExpenseStatItem">
          Total Net Profit {showBy === 'Monthly' ? 'This Year' : 'Selected Period'}: 
          <em className="ExpenseStatValue">
            ${formatNumberWithSuffix(netProfitStats.totalNetProfitAmount.toLocaleString())}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Highest {showBy === 'Monthly' ? 'Monthly' : 'Yearly'} Net Profit: 
          <em className="ExpenseStatValue">
            ${formatNumberWithSuffix(netProfitStats.highestNetProfit.toLocaleString())}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Average {showBy === 'Monthly' ? 'Monthly' : 'Yearly'} Net Profit: 
          <em className="ExpenseStatValue">
            ${formatNumberWithSuffix(netProfitStats.averageNetProfit.toLocaleString())}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Total Number of Transactions: 
          <em className="ExpenseStatValue">{netProfitStats.totalTransactions}</em>
        </p>
      </div>
    </div>
  );
};

export default React.memo(DashbNetProfitTotalCollected);
