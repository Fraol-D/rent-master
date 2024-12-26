import { storageManager } from '../../../storeManager';
import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { LineChart } from '@mui/x-charts/LineChart';
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
  isSameMonth,
} from 'date-fns';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { subDays, differenceInDays, addMonths, addYears } from 'date-fns';
import CurrencySign, {
  formatNumberWithSuffix,
  getRateByDate,
} from '../Helpers/CurrencySign';
import { useGlobal } from 'renderer/components/GlobalContext';
interface MonthlyExpenseTrendWidgetProps {

  SelectedBranchId: any;
}

const DashbMonthlyExpenseTrendWidget: React.FC<
  MonthlyExpenseTrendWidgetProps
> = ({ SelectedBranchId }) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  
  const screenWidth = window.innerWidth;
    let scaleFactor;
    if (screenWidth <= 1280) {
      scaleFactor = 1280 / 1920;
    } else if (screenWidth <= 1366) {
      scaleFactor = 1366 / 1920;
    } else if (screenWidth <= 1920) {
      scaleFactor = 1920 / 1920;
    } else {
      scaleFactor = 2560 / 2560;
    }
    const [leftMargin, setLeftMargin] = useState(0);

  const [expensesData, setExpensesData] = useState<expenses[]>([]);
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >('ALL_ETB');
  const {
    AllExpenses,
    setAllExpenses,
  } = useGlobal();
  const processValueByCurrency = (
    value: number,
    currency: string,
    date: number
  ) => {
    const { rate } = getRateByDate(date); // Assume this function fetches the exchange rate based on the date

    if (!rate) return value; // Fallback if no rate is available

    switch (currencyDisplay) {
      case 'ETB_ONLY':
        return currency === 'ETB' ? value : 0;
      case 'USD_ONLY':
        return currency === 'USD' ? value : 0;
      case 'ALL_ETB':
        return currency === 'USD' ? value * rate : value;
      case 'ALL_USD':
        return currency === 'ETB' ? value / rate : value;
      default:
        return value;
    }
  };
  useEffect(() => {
    const fetchExpenses = async () => {
      const expensesData = AllExpenses;
      setExpensesData(expensesData);
    };
    fetchExpenses();
  }, []);

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
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));

    const allExpenses = generateRecurringExpenses(
      expensesData,
      yearStart,
      yearEnd
    );
    const maxValue = Math.max(...allExpenses.map(d => 
      Math.max(d.price || 0)
    ));
    const formattedMaxValue = formatChartValue(maxValue);
    const leftMargin = 40 + formattedMaxValue.length * 5 * scaleFactor;
  
    setLeftMargin(leftMargin);
    return d3.range(0, 12).map((month: number) => {
      const monthStart = startOfMonth(new Date(selectedYear, month, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, month, 1));
      const totalExpense = allExpenses
        .filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce(
          (sum, e) => sum + processValueByCurrency(e.price, e.Currency, e.date),
          0
        );

      return {
        date: format(new Date(selectedYear, month, 1), 'MMM'),
        expense: totalExpense,
      };
    });
  }, [selectedDate, expensesData, currencyDisplay]);
  
  const aggregateYearlyData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({length: 5}, (_, i) => currentYear - 4 + i);
    const maxValue = Math.max(...expensesData.map(d => 
      Math.max(d.price || 0)
    ));
    const formattedMaxValue = formatChartValue(maxValue);
    const leftMargin = 40 + formattedMaxValue.length * 5 * scaleFactor;
  
    setLeftMargin(leftMargin);
    return years.map(year => {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 11, 31));
      
      const allExpenses = generateRecurringExpenses(
        expensesData,
        yearStart,
        yearEnd
      );

      const totalExpense = allExpenses.reduce(
        (sum, e) => sum + processValueByCurrency(e.price, e.Currency, e.date),
        0
      );

      return {
        date: year.toString(),
        expense: totalExpense
      };
    });
  }, [expensesData, currencyDisplay]);

  const dataset = showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const expenseStats = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));

    const allExpenses = generateRecurringExpenses(
      expensesData,
      yearStart,
      yearEnd
    );

    const filteredExpenses = allExpenses
      .filter((e) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= yearStart && expenseDate <= yearEnd;
      })
      .map((e) => ({
        ...e,
        price: processValueByCurrency(e.price, e.Currency, e.date),
      }));

    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.price, 0);

    const monthlyExpenses = d3.rollup(
      filteredExpenses,
      (v) =>
        processValueByCurrency(
          d3.sum(v, (d) => d.price),
          v[0].Currency,
          v[0].date
        ),
      (d) => format(new Date(d.date), 'MMM')
    );

    const highestMonthlyExpense = Math.max(...monthlyExpenses.values());
    const averageMonthlyExpense = totalExpense / 12;
    const totalExpenseCount = filteredExpenses.length;

    return {
      totalExpense,
      highestMonthlyExpense,
      averageMonthlyExpense,
      totalExpenseCount,
    };
  }, [expensesData, selectedDate]);

  // Add debug logging
  useEffect(() => {
    console.log('Component mounted with branch ID:', SelectedBranchId);
  }, []);

  useEffect(() => {
    console.log('Expenses data updated:', {
      count: expensesData?.length,
      firstExpense: expensesData?.[0],
      lastExpense: expensesData?.[expensesData.length - 1],
    });
  }, [expensesData]);

  // Add error boundary around the chart
  const renderChart = () => {
    try {
      return (
        <LineChart
          xAxis={[
            {
              dataKey: 'date',
              scaleType: 'point',
              valueFormatter: (value) => value.toLocaleString(),
              tickLabelStyle: {
                angle: 0,
                textAnchor: 'middle',
                fill: 'var(--Text-Color)',
                fontSize: 'var(--12px-V)',
              },
            },
          ]}
          series={[
            {
              dataKey: 'expense',
              label: 'Total Expenses',
              area: true,

              valueFormatter: (value) =>
                `${formatNumberWithSuffix(
                  value?.toLocaleString()
                )}${CurrencySign(
                  currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                )}`,
            },
          ]}
          slotProps={{
            legend: {
              hidden: true,
            },
          }}
          yAxis={[
            {
              colorMap: {
                type: 'piecewise',
                thresholds: [0, 1000000],
                colors: ['red', 'red', 'red'],
              },
              tickLabelStyle: {
                fill: 'var(--Text-Color)',
                fontSize: 'var(--12px-V)',
              },
              valueFormatter: (value) =>
                `${formatNumberWithSuffix(
                  value?.toLocaleString()
                )}${CurrencySign(
                  currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                )}`,
            },
          ]}
          dataset={dataset}
          onError={(error) => {
            console.error('Chart error:', error);
          }}
          grid={{ vertical: true, horizontal: true }}
          margin={{
            left: leftMargin,
            right: 30,
            top: 10,
            bottom: 60,
          }}
          sx={{
            '.MuiLineElement-root': {
              stroke: 'red',
              strokeWidth: 2,
            },
            '.MuiAreaElement-root': {
              fillOpacity: 0.1,
            },
            [`.${axisClasses.left} .${axisClasses.label}`]: {
              transform: 'translate(var(---35px-V), 0)',
              color: 'red',
            },
            [`.${axisClasses.root}`]: {
              [`.${axisClasses.tick}, .${axisClasses.line}`]: {
                stroke: 'red',
                strokeWidth: 1,
              },
              [`.${axisClasses.tickLabel}`]: {
                fill: 'var(--Text-Color)',
              },
            },
          }}
        />
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return <div>Error rendering expense chart</div>;
    }
  };
  const getCurrentExchangeRate = () => {
    const storedRates = storageManager.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };
  return (
    <div
      className="DashboardWigetMainContainer"
      id="DashbMonthlyExpenseTrendWidget"
      style={{ width: 'var(--800px-V)', height: 'var(--510px-V)' }}
    >
      <p className="DashboardWigetPieChartTextHeader">Expense Trend</p>
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
      {renderChart()}
      <div
        className="ExpenseStatsContainer"
        style={{
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          top: 'var(---31px-V)',
          height: 'var(--16px-V)',
        }}
      >
        <p className="ExpenseStatItem">
          Total Expense This Year:{' '}
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(expenseStats.totalExpense.toLocaleString())}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Highest Monthly Expense:{' '}
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(
              expenseStats.highestMonthlyExpense.toLocaleString()
            )}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Average Monthly Expense:{' '}
          <em className="ExpenseStatValue">
            {formatNumberWithSuffix(
              expenseStats.averageMonthlyExpense.toLocaleString()
            )}
            {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Total Number of Expenses:{' '}
          <em className="ExpenseStatValue">{expenseStats.totalExpenseCount}</em>
        </p>
      </div>
    </div>
  );
};

export default React.memo(DashbMonthlyExpenseTrendWidget);
