import React, { useState, useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Input } from '../Helpers/CustomReactComponents';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { useGlobal } from 'renderer/components/GlobalContext';

const TenantGrowthWidget = () => {
  const [viewBy, setViewBy] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const { AllTenants } = useGlobal();
  const tenantGrowthData = useMemo(() => {
    const dateMap = new Map();
    AllTenants.forEach((tenant) => {
      const addedDate = new Date(tenant.AddedTime);
      const key =
        viewBy === 'month'
          ? addedDate.toISOString().slice(0, 7)
          : addedDate.getFullYear().toString();
      dateMap.set(key, (dateMap.get(key) || 0) + 1);
    });

    const sortedData = Array.from(dateMap.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    let filteredData = sortedData;
    if (viewBy === 'month') {
      const selectedYear = selectedDate;
      filteredData = sortedData.filter(([date]) =>
        date.startsWith(selectedYear)
      );
    } else {
      const selectedYear = parseInt(selectedDate);

      filteredData = sortedData.filter(([date]) => {
        const year = parseInt(date);
        return year >= selectedYear - 2 && year <= selectedYear + 2;
      });
    }

    if (viewBy === 'month') {
      const monthNames = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'May',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Oct',
        'Nov',
        'Dec',
      ];
      const allMonths = Array.from({ length: 12 }, (_, i) => {
        const month = (i + 1).toString().padStart(2, '0');
        return `${selectedDate}-${month}`;
      });

      return allMonths.map((month, index) => ({
        date: monthNames[index],
        count: dateMap.get(month) || 0,
      }));
    } else {
      const currentYear = parseInt(selectedDate);
      const years = Array.from({ length: 5 }, (_, i) =>
        (currentYear - 3 + i).toString()
      );
      return years.map((year) => ({
        date: year,
        count: dateMap.get(year) || 0,
      }));
    }
  }, [AllTenants, viewBy, selectedDate]);

  const hasNewTenants = tenantGrowthData.some(({ count }) => count > 0);

  return (
    <div
      className="DashboardWigetMainContainer"
      id="TenantGrowthWidget"
      style={{ width: 'var(--400px-V)', height: 'var(--165px-V)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <p
          className="DashboardWigetPieChartTextHeader"
          style={{ width: 'var(--209px-V)' }}
        >
          Tenant Growth
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <select
            value={viewBy}
            onChange={(e) => setViewBy(e.target.value as 'month' | 'year')}
          >
            <option value="month">Monthly</option>
            <option value="year">Yearly</option>
          </select>
          <input
            type="number"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min="1900"
            max={new Date().getFullYear().toString()}
          />
        </div>
      </div>
      {hasNewTenants ? (
        <LineChart
          grid={{ vertical: true, horizontal: true }}
          xAxis={[
            {
              data:
                viewBy === 'month'
                  ? [
                      'Jan',
                      'Feb',
                      'Mar',
                      'Apr',
                      'May',
                      'Jun',
                      'Jul',
                      'Aug',
                      'Sep',
                      'Oct',
                      'Nov',
                      'Dec',
                    ]
                  : tenantGrowthData.map((item) => item.date),
              scaleType: 'point',
              tickLabelStyle: { fill: 'var(--Text-Color)' },
              axisLine: { stroke: 'var(--Text-Color)' },
              tick: { stroke: 'var(--Text-Color)' },
            },
          ]}
          yAxis={[
            {
              tickLabelStyle: { fill: 'var(--Text-Color)' },
              axisLine: { stroke: 'var(--Text-Color)' },
              tick: { stroke: 'var(--Text-Color)' },
            },
          ]}
          series={[{ data: tenantGrowthData.map((item) => item.count) }]}
          width={480}
          height={160}
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
      ) : (
        <p>No new tenants</p>
      )}
    </div>
  );
};

export default React.memo(TenantGrowthWidget);
