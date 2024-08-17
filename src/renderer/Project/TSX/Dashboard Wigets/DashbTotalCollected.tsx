import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart } from '@mui/x-charts/BarChart';
import { getValuesWithSql } from 'Backend/localServerApis';
import { Console } from 'console';

const DashbTotalCollected = ({ RoomList }: { RoomList: RoomType[] }) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [DataRoomPayInfo, setDataRoomPayInfo] = useState<
    { date: any; value: any; expectedValue: any }[]
  >([]);

  useEffect(() => {
    const getDataRoomPayInfo = async () => {
      const data = await getValuesWithSql('room_pay_info', 'WHERE 1');
      const CorretData = data.map((d: any) => ({
        date: d.Day,
        value: d.Paid === 1 ? d.Value : 0,
        expectedValue: RoomList.find((r: RoomType) => r.id === d.roomId)
          ?.AgreedPrice,
      }));
      console.log(CorretData);
      setDataRoomPayInfo(CorretData);
    };
    getDataRoomPayInfo();
  }, []);

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = DataRoomPayInfo.filter(
      (d) => new Date(d.date).getFullYear() === selectedYear
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v: any) => ({
        value: d3.sum(v, (d: any) => d.value),
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => new Date(d.date).getMonth()
    );

    const allMonths = d3.range(0, 12).map((month: any) => ({
      month: d3.timeFormat('%b')(new Date(0, month)),
      value: 0,
      expectedValue: 0,
    }));

    monthlyData.forEach(([month, values]: any) => {
      allMonths[month].value = values.value;
      allMonths[month].expectedValue = values.expectedValue;
    });

    return allMonths;
  }, [selectedDate, DataRoomPayInfo]);

  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      DataRoomPayInfo,
      (v: any) => ({
        value: d3.sum(v, (d: any) => d.value),
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => new Date(d.date).getFullYear()
    );

    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year: any) => ({
        year: year,
        value: 0,
        expectedValue: 0,
      }));

    yearlyData.forEach(([year, values]: any) => {
      const index = yearRange.findIndex((y: any) => y.year === year);
      if (index !== -1) {
        yearRange[index].value = values.value;
        yearRange[index].expectedValue = values.expectedValue;
      }
    });

    return yearRange;
  }, [selectedDate, DataRoomPayInfo]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalCollected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return DataRoomPayInfo.filter(
      (d) => new Date(d.date).getFullYear() === selectedYear
    ).reduce((sum, item) => sum + item.value, 0);
  }, [selectedDate, DataRoomPayInfo]);

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return DataRoomPayInfo.filter(
      (d) => new Date(d.date).getFullYear() === selectedYear
    ).reduce((sum, item) => sum + item.expectedValue, 0);
  }, [selectedDate, DataRoomPayInfo]);

  const lastYearTotalCollected = useMemo(() => {
    const previousYear = parseInt(selectedDate) - 1;
    return DataRoomPayInfo.filter(
      (d) => new Date(d.date).getFullYear() === previousYear
    ).reduce((sum, item) => sum + item.value, 0);
  }, [selectedDate, DataRoomPayInfo]);

  const difference = totalCollected - lastYearTotalCollected;
  const percentageChange =
    lastYearTotalCollected !== 0
      ? ((difference / lastYearTotalCollected) * 100).toFixed(2)
      : 'N/A';

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{ width: '710px', alignItems: 'flex-start', color: 'white' }}
    >
      <p
        className="DashboardWigetPieChartTextHeader"
        style={{ width: '710px', color: 'white' }}
      >
        Total Collected
      </p>

      <div
        className="DashboardTotalCollectedTopPart"
        style={{
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}
      >
        <div
          style={{
            marginRight: '20px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>
            Show by:
          </span>
          <select
            value={showBy}
            onChange={(e) => setShowBy(e.target.value as 'Monthly' | 'Yearly')}
            style={{
              color: 'white',
              backgroundColor: 'rgba(105, 105, 106)',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', color: 'white' }}>
          <span style={{ marginRight: '10px', fontWeight: 'bold' }}>Year:</span>
          <input
            type="number"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min="1900"
            max="2100"
            step="1"
            style={{
              color: 'white',
              backgroundColor: 'rgba(105, 105, 106)',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              marginRight: '20px',
              width: '80px',
            }}
          />
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
            Total:
          </span>
          <span style={{ marginRight: '20px' }}>
            {totalCollected.toLocaleString()}$ /{' '}
            {totalExpected.toLocaleString()}$
          </span>
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>
            <span style={{ color: difference > 0 ? '#4CAF50' : '#F44336' }}>
              {difference > 0 ? '+' : ''}
              {difference.toLocaleString()}$ ({percentageChange}%)
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
            // Optional: change label color
            fill: 'white', // Optional: change label color
          },
        ]}
        series={[
          {
            dataKey: 'value',
            label: 'Collected',
            color: '#02B2AF',
          },
          {
            dataKey: 'expectedValue',
            label: 'Expected',

            color: '#0043426b',
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
      /></div>
      
  
  );
};

export default DashbTotalCollected;
