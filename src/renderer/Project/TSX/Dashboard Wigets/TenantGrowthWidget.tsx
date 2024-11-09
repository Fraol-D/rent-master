import React, { useState, useMemo } from 'react';
import { LineChart } from '@mui/x-charts/LineChart';
import { Input } from '../Helpers/CustomReactComponents';

const TenantGrowthWidget = ({ TenantList }: { TenantList: tenant[] }) => {
  const [viewBy, setViewBy] = useState<'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );

  const tenantGrowthData = useMemo(() => {
    const dateMap = new Map();
    TenantList.forEach((tenant) => {
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
  }, [TenantList, viewBy, selectedDate]);

  const hasNewTenants = tenantGrowthData.some(({ count }) => count > 0);

  return (
    <div
      className="DashboardWigetMainContainer"
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
            '.MuiChartsAxis-tickLabel': {
              fill: 'var(--Text-Color)',
            },
            '.MuiChartsAxis-label': {
              fill: 'var(--Text-Color)',
            },
            '.MuiChartsAxis-line': {
              stroke: 'var(--Text-Color)',
            },
            '.MuiChartsAxis-tick': {
              stroke: 'var(--Text-Color)',
            },
            '.MuiLineElement-root': {
              stroke: 'var(--Text-Color)',
            },

            '.css-xyaj9i-MuiMarkElement-root': {
              stroke: 'var(--Accent-Color)',
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
