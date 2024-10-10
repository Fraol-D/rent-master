import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';

const DashbOverAllTax = ({ RoomList }: { RoomList: RoomType[] }) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [DataRoomPayInfo, setDataRoomPayInfo] = useState<
    { date: any; expectedValue: any }[]
  >([]);

  useEffect(() => {
    const getDataRoomPayInfo = async () => {
      const data = await getValuesWithSql('room_pay_info', 'WHERE 1');
      const CorretData = data.map((d: any) => ({
        date: d.Day,
        expectedValue: RoomList.find((r: RoomType) => r.id === d.roomId)
          ?.AgreedPrice,
      }));
      setDataRoomPayInfo(CorretData);
    };
    getDataRoomPayInfo();
  }, []);

  const calculateTax = (value: number) => value * 0.15;

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = DataRoomPayInfo.filter(
      (d) => new Date(d.date).getFullYear() === selectedYear
    );
    const monthlyData = d3.rollups(
      filteredData,
      (v: any) => ({
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => new Date(d.date).getMonth()
    );
    const allMonths = d3.range(0, 12).map((month: any) => ({
      month: d3.timeFormat('%b')(new Date(0, month)),
      expectedValue: 0,
      tax: 0,
    }));
    monthlyData.forEach(([month, values]: any) => {
      allMonths[month].expectedValue = values.expectedValue;
      allMonths[month].tax = calculateTax(values.expectedValue);
    });
    return allMonths;
  }, [selectedDate, DataRoomPayInfo]);

  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      DataRoomPayInfo,
      (v: any) => ({
        expectedValue: d3.sum(v, (d: any) => d.expectedValue),
      }),
      (d: any) => new Date(d.date).getFullYear()
    );
    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year: any) => ({
        year: year,
        expectedValue: 0,
        tax: 0,
      }));
    yearlyData.forEach(([year, values]: any) => {
      const index = yearRange.findIndex((y: any) => y.year === year);
      if (index !== -1) {
        yearRange[index].expectedValue = values.expectedValue;
        yearRange[index].tax = calculateTax(values.expectedValue);
      }
    });
    return yearRange;
  }, [selectedDate, DataRoomPayInfo]);

  const dataset = showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return DataRoomPayInfo.filter(
      (d) => new Date(d.date).getFullYear() === selectedYear
    ).reduce((sum, item) => sum + item.expectedValue, 0);
  }, [selectedDate, DataRoomPayInfo]);

  const totalTax = calculateTax(totalExpected);

  return (
    <div className="DashboardWigetMainContainer">
      <p className="DashboardWigetPieChartTextHeader">Overall Tax</p>
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
          <span className="TotalLabel">Total Tax:</span>
          <span className="TotalValue">{totalTax.toLocaleString()}$</span>
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
            dataKey: 'tax',
            label: 'Tax (15%)',
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

export default React.memo(DashbOverAllTax);
