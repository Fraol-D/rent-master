import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { LineChart } from '@mui/x-charts/LineChart';
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
import { axisClasses } from '@mui/x-charts/ChartsAxis';

interface MonthlyExpenseTrendWidgetProps {
  expenses: expenses[];
}

const DashbMonthlyExpenseTrendWidget: React.FC<
  MonthlyExpenseTrendWidgetProps
> = () => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [expensesData, setExpensesData] = useState<Expense[]>([]);

  useEffect(() => {
    const fetchExpenses = async () => {
      const expensesData = await getValuesWithSql('expenses', 'WHERE 1');
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
    const yearStart = startOfYear(new Date(selectedYear, 0, 1));
    const yearEnd = endOfYear(new Date(selectedYear, 11, 31));

    const allExpenses = generateRecurringExpenses(
      expensesData,
      yearStart,
      yearEnd
    );

    const allMonths = d3.range(0, 12).map((month: number) => {
      const monthStart = startOfMonth(new Date(selectedYear, month, 1));
      const monthEnd = endOfMonth(new Date(selectedYear, month, 1));
      const totalExpense = allExpenses
        .filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        })
        .reduce((sum, e) => sum + e.price, 0);

      return {
        date: format(new Date(selectedYear, month, 1), 'MMM'),
        expense: totalExpense,
      };
    });

    return allMonths;
  }, [selectedDate, expensesData]);

  const aggregateYearlyData = useMemo(() => {
    const yearRange = d3.range(
      parseInt(selectedDate) - 2,
      parseInt(selectedDate) + 3
    );

    return yearRange.map((year: number) => {
      const yearStart = startOfYear(new Date(year, 0, 1));
      const yearEnd = endOfYear(new Date(year, 11, 31));

      const allExpenses = generateRecurringExpenses(
        expensesData,
        yearStart,
        yearEnd
      );

      const totalExpense = allExpenses
        .filter((e) => {
          const expenseDate = new Date(e.date);
          return expenseDate >= yearStart && expenseDate <= yearEnd;
        })
        .reduce((sum, e) => sum + e.price, 0);

      return {
        date: year.toString(),
        expense: totalExpense,
      };
    });
  }, [selectedDate, expensesData]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const expenseStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));

    const allExpenses = generateRecurringExpenses(
      expensesData,
      yearStart,
      yearEnd
    );

    const filteredExpenses = allExpenses.filter((e) => {
      const expenseDate = new Date(e.date);
      return expenseDate >= yearStart && expenseDate <= yearEnd;
    });

    const totalExpense = filteredExpenses.reduce((sum, e) => sum + e.price, 0);

    const monthlyExpenses = d3.rollup(
      filteredExpenses,
      (v) => d3.sum(v, (d) => d.price),
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
  }, [expensesData]);

  return (
    <div className="DashboardWigetMainContainer" style={{width: '800px'}}>
      <p className="DashboardWigetPieChartTextHeader">Expense Trend</p>
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
        </div>
      </div>
      <LineChart
        xAxis={[
          {
            dataKey: 'date',
            scaleType: 'point',
            valueFormatter: (value) => value.toLocaleString(),
            tickLabelStyle: {
              angle: 0,
              textAnchor: 'middle',
              
            },
          },
        ]}
        series={[
          {
            dataKey: 'expense',
            label: 'Total Expenses',
            area: true,
            
            valueFormatter: (value) => `$${value?.toLocaleString()}`,
          },
        ]}
        yAxis={[
          {
            colorMap: {
              type: 'piecewise',
              thresholds: [0, 1000000],
              colors: ['red', 'red', 'red'],
            },
          },
        ]}
        dataset={dataset}
        width={810}
        grid={{ vertical: true, horizontal: true }}
        height={400}
        margin={{ left: 70, right: 30, top: 30, bottom: 60 }}
        sx={{
          '.MuiLineElement-root': {
            stroke: 'red',
            strokeWidth: 2,
          },
          '.MuiAreaElement-root': {
      
            fillOpacity: 0.1,
          },
          [`.${axisClasses.left} .${axisClasses.label}`]: {
            transform: 'translate(-35px, 0)',
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
      <div
        className="ExpenseStatsContainer"
        style={{
          display: 'flex',
          flexDirection: 'row',
          position: 'relative',
          top: '-31px',
          height: '16px',
        }}
      >
        <p className="ExpenseStatItem">
          Total Expense This Year:{' '}
          <em className="ExpenseStatValue">
            ${expenseStats.totalExpense.toLocaleString()}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Highest Monthly Expense:{' '}
          <em className="ExpenseStatValue">
            ${expenseStats.highestMonthlyExpense.toLocaleString()}
          </em>
        </p>
        <p className="ExpenseStatItem">
          Average Monthly Expense:{' '}
          <em className="ExpenseStatValue">
            ${expenseStats.averageMonthlyExpense.toLocaleString()}
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
