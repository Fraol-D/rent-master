import React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { formatNumberWithSuffix } from '../Helpers/CurrencySign';

interface DashbExpenseDistributionProps {
  expenses: expenses[];
}

const DashbExpenseDistribution = ({ expenses }: DashbExpenseDistributionProps) => {
  // Calculate totals for each category
  const categoryTotals = expenses.reduce((acc, expense) => {
    const category = expense.category || 'Other';
    acc[category] = (acc[category] || 0) + expense.price;
    return acc;
  }, {} as Record<string, number>);

  // Convert to array format needed for PieChart
  const expenseData = Object.entries(categoryTotals).map(([category, total], index) => ({
    id: index,
    value: total,
    label: category,
    color: `var(--${category === 'Other' ? 'Secondary-Color20' : 'Secondary-Color'})`
  }));

  // Calculate total expenses
  const totalExpenses = expenseData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: 'var(--400px-V)',
        height: 'var(--510px-V)',
      }}
    >
      <p
        className="DashboardWigetPieChartTextHeader"
        style={{
          marginBottom: 'var(--10px-V)',
        }}
      >
        Expense Distribution
      </p>
      <PieChart
        series={[
          {
            data: expenseData,
            arcLabel: (item) => 
              `${item.label} (${((item.value / totalExpenses) * 100).toFixed(1)}%)`,
            arcLabelMinAngle: 45,
          },
        ]}
        height={350}
        colors={expenseData.map((item) => item.color)}
        sx={{
          [`& .${axisClasses.root}`]: {
            [`& .${axisClasses.tick}, .${axisClasses.line}`]: {
              stroke: 'var(--Text-Color)',
              strokeWidth: 1,
              fontSize: 'var(--12px-V)',
            },
            [`& .${axisClasses.tickLabel}`]: {
              fill: 'var(--Text-Color)',
              fontSize: 'var(--12px-V)',
            },
          },
          '& .MuiChartsLegend-label': {
            fill: 'var(--Text-Color)',
            fontSize: 'var(--12px-V)',
          },
          '& .MuiChartsArcLabel-root': {
            fill: 'var(--Text-Color)',
            fontWeight: 'bold',
            fontSize: 'var(--12px-V)',
          },
        }}
      />
      <div style={{ marginTop: 'var(--20px-V)', textAlign: 'center' }}>
        <p className="DashboardWigetPieChartText">
          Total Expenses: ${formatNumberWithSuffix(totalExpenses.toLocaleString())}
        </p>
        <p className="DashboardWigetPieChartText">
          Highest Category: {
            expenseData.reduce((max, item) => 
              item.value > max.value ? item : max
            ).label
          }
        </p>
        <p className="DashboardWigetPieChartText">
          Number of Categories: {expenseData.length}
        </p>
      </div>
    </div>
  );
};

export default React.memo(DashbExpenseDistribution);