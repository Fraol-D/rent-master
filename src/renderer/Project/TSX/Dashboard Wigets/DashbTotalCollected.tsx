import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart, barElementClasses } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
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
        expectedValue: d.Value,
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
    <div className="DashboardWigetMainContainer">
      <p className="DashboardWigetPieChartTextHeader">
        Total Collected
      </p>

      <div className="DashboardTotalCollectedTopPart">
        <div className="ShowByContainer">
          <span className="ShowByLabel">
            Show by:
          </span>
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
          <span className="TotalLabel">
            Total:
          </span>
          <span className="TotalValue">
            {totalCollected.toLocaleString()}$ /{' '}
            {totalExpected.toLocaleString()}$
          </span>
          <span className="DifferenceLabel">
            <span className={difference > 0 ? "DifferenceValue" : "DifferenceValueNegative"}>
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
    </div>
  );
};

export default React.memo(DashbTotalCollected);