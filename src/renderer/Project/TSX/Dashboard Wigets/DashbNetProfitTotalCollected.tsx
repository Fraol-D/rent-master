import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart, barElementClasses } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  isBefore,
  isAfter,
} from 'date-fns';

const DashbTotalCollected = ({
  RoomList,
  expenses2,
}: {
  RoomList: RoomType[];
  expenses2: expenses[];
}) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [DataRoomPayInfo, setDataRoomPayInfo] = useState<
    { date: any; value: any; expectedValue: any }[]
  >([]);
  const [expenses, setExpenses] = useState<expenses[]>([]);

  useEffect(() => {
    const getDataRoomPayInfo = async () => {
      setExpenses(expenses2);
      const data = await getValuesWithSql('room_pay_info', 'WHERE 1');
      const CorretData = data.map((d: any) => ({
        date: new Date(d.Day),
        value: d.Paid === 1 ? d.Value : 0,
        expectedValue: d.Value,
      }));
      setDataRoomPayInfo(CorretData);
    };
    getDataRoomPayInfo();
  }, []);

  const generateRecurringExpenses = (
    expenses: expenses[],
    startDate: Date,
    endDate: Date
  ): expenses[] => {
    let allExpenses: expenses[] = [];

    expenses.forEach((expense) => {
      if (expense.doesReoccur) {
        let currentDate = new Date(expense.date);
        while (isBefore(currentDate, endDate)) {
          if (isAfter(currentDate, startDate)) {
            allExpenses.push({
              ...expense,
              date: currentDate.getTime(),
            });
          }
          currentDate = addDays(currentDate, expense.recurringCycle);
        }
      } else {
        allExpenses.push(expense);
      }
    });

    return allExpenses;
  };

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const startDate = startOfYear(new Date(selectedYear, 0, 1));
    const endDate = endOfYear(new Date(selectedYear, 11, 31));

    const filteredData = DataRoomPayInfo.filter(
      (d) => d.date >= startDate && d.date <= endDate
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v: any) => ({
        value: d3.sum(v, (d: any) => d.value),
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => d.date.getMonth()
    );

    const allExpenses = generateRecurringExpenses(expenses, startDate, endDate);

    const allMonths = d3.range(0, 12).map((month: any) => {
      const monthStart = startOfMonth(new Date(selectedYear, month, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, month, 1));
      const monthlyExpenses = allExpenses
        .filter(
          (e) => new Date(e.date) >= monthStart && new Date(e.date) <= monthEnd
        )
        .reduce((sum, e) => sum + e.price, 0);

      const monthData = monthlyData.find(([m]) => m === month);
      const income = monthData ? monthData[1].value : 0;
      const expectedIncome = monthData ? monthData[1].expectedValue : 0;

      return {
        month: d3.timeFormat('%b')(new Date(0, month)),
        value: income - monthlyExpenses,
        expectedValue: expectedIncome - monthlyExpenses,
      };
    });

    return allMonths;
  }, [selectedDate, DataRoomPayInfo, expenses]);

  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      DataRoomPayInfo,
      (v: any) => ({
        value: d3.sum(v, (d: any) => d.value),
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => d.date.getFullYear()
    );

    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year: any) => {
        const yearStart = startOfYear(new Date(year, 0, 1));
        const yearEnd = endOfYear(new Date(year, 11, 31));
        const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);
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
  }, [selectedDate, DataRoomPayInfo, expenses]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalCollected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);
    const yearlyExpenses = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === selectedYear)
      .reduce((sum, e) => sum + e.price, 0);
    return (
      DataRoomPayInfo.filter(
        (d) => new Date(d.date).getFullYear() === selectedYear
      ).reduce((sum, item) => sum + item.value, 0) - yearlyExpenses
    );
  }, [selectedDate, DataRoomPayInfo, expenses]);

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));
    const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);
    const yearlyExpenses = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === selectedYear)
      .reduce((sum, e) => sum + e.price, 0);
    return (
      DataRoomPayInfo.filter(
        (d) => new Date(d.date).getFullYear() === selectedYear
      ).reduce((sum, item) => sum + item.expectedValue, 0) - yearlyExpenses
    );
  }, [selectedDate, DataRoomPayInfo, expenses]);

  const lastYearTotalCollected = useMemo(() => {
    const previousYear = parseInt(selectedDate) - 1;
    const yearStart = startOfYear(new Date(previousYear, 0, 1));
    const yearEnd = endOfYear(new Date(previousYear, 11, 31));
    const allExpenses = generateRecurringExpenses(expenses, yearStart, yearEnd);
    const yearlyExpenses = allExpenses
      .filter((e) => new Date(e.date).getFullYear() === previousYear)
      .reduce((sum, e) => sum + e.price, 0);
    return (
      DataRoomPayInfo.filter(
        (d) => new Date(d.date).getFullYear() === previousYear
      ).reduce((sum, item) => sum + item.value, 0) - yearlyExpenses
    );
  }, [selectedDate, DataRoomPayInfo, expenses]);

  const difference = totalCollected - lastYearTotalCollected;
  const percentageChange =
    lastYearTotalCollected !== 0
      ? (
          (difference /
            (lastYearTotalCollected === 0 ? 1 : lastYearTotalCollected)) *
          100
        ).toFixed(2)
      : 'N/A';

  return (
    <div className="DashboardWigetMainContainer">
      <p
        className="DashboardWigetPieChartTextHeader"
        style={{ width: '458px' }}
      >
        Net Profit (Total Collected - Expenses)
      </p>

      <div className="DashboardTotalCollectedTopPart">
        <div className="ShowByContainer">
          <span className="ShowByLabel">Show by:</span>
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
          <span className="YearLabel">Year:</span>
          <input
            className="YearInput"
            type="number"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min="1900"
            max="2100"
            step="1"
          />
          <span className="TotalLabel">Total:</span>
          <span className="TotalValue">
            ${totalCollected.toLocaleString()} / $
            {totalExpected.toLocaleString()}
          </span>
          <span className="DifferenceLabel">
            <span
              className={
                difference > 0 ? 'DifferenceValue' : 'DifferenceValueNegative'
              }
            >
              {difference > 0 ? '+' : ''}${difference.toLocaleString()} (
              {percentageChange}%)
            </span>{' '}
            in {parseInt(selectedDate) - 1}
          </span>
        </div>
      </div>
      <BarChart
        dataset={dataset}
        xAxis={[
          {
            scaleType: 'band',
            dataKey: showBy === 'Monthly' ? 'month' : 'year',
          },
        ]}
        yAxis={[
          {
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
          {
            dataKey: 'value',
            label: 'Collected',
            color: 'var(--Primary-Color)',
          },
          {
            dataKey: 'expectedValue',
            label: 'Expected',
            color: 'var(--Accent-Color50)',
          },
        ]}
        width={710}
        height={400}
        margin={{
          left: 74,
          right: 30,
          top: 40,
          bottom: 35,
        }}
        grid={{ vertical: true, horizontal: true }}
        sx={{
          [`.${axisClasses.left} .${axisClasses.label}`]: {
            transform: 'translate(-35px, 0)',
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
    </div>
  );
};

export default React.memo(DashbTotalCollected);
