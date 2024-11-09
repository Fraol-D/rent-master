import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart, barElementClasses } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { Input } from '../Helpers/CustomReactComponents';
import {
  addDays,
  addMonths,
  format,
  startOfYear,
  endOfYear,
  addYears,
} from 'date-fns';

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const DashbTotalCollected = ({
  RoomList,
  tenantList,
  SelectedBranchId,
}: {
  RoomList: RoomType[];
  tenantList: tenant[];
  SelectedBranchId: any;
}) => {
  const [showBy, setShowBy] = useState<'Monthly' | 'Yearly'>('Monthly');
  const [selectedDate, setSelectedDate] = useState(
    new Date().getFullYear().toString()
  );
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const calculatePayments = async () => {
      const allPayments: Payment[] = [];
      const selectedYear = parseInt(selectedDate);
      let yearStart = startOfYear(new Date(selectedYear - 2, 0, 1));
      let yearEnd = endOfYear(new Date(selectedYear + 2, 11, 31));

      // Get all actual payments for the selected year range
      const actualPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      // Get historical payments
      const historicalPayments = await getValuesWithSql(
        'room_pay_info_history',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      // Only add paid payments from actual and historical
      const combinedPayments = [...actualPayments, ...historicalPayments]
        .filter((payment) => payment.Paid === 1)
        .map((payment) => ({
          id: payment.id,
          Day: payment.Day,
          Value: payment.Value,
          Paid: true,
          roomId: payment.roomId,
        }));

      // If we have no payment history, don't add predictions
      if (actualPayments.length === 0 && historicalPayments.length === 0) {
        console.log('No payment history found, skipping predictions');
        setPredictedPayments(allPayments);
        return;
      }

      // Add verified payments to allPayments
      allPayments.push(...combinedPayments);

      // Only generate predictions if we have payment history
      for (const room of RoomList) {
        // Skip rooms without tenants
        if (!room.tenantId) continue;

        const tenant = tenantList.find((t) => t.id === room.tenantId);
        if (!tenant) continue;

        let startDate = new Date(tenant.startTime || Date.now()).getTime();
        let endDate = yearEnd.getTime();

        // Get agreement details if exists
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

          // Only add if payment doesn't already exist
          if (!allPayments.some((p) => p.id === paymentId)) {
            // Add as unpaid prediction
            allPayments.push({
              id: paymentId,
              Day: currentDate.getTime(),
              Value: room.AgreedPrice,
              Paid: false,
              roomId: room.id,
            });
          }

          // Calculate next payment date
          currentDate = calculateNextPaymentDate(currentDate, room);
        }
      }

      setPredictedPayments(allPayments);
    };

    calculatePayments();
  }, [RoomList, tenantList, selectedDate, showBy]);

  // Helper function to calculate next payment date
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

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = predictedPayments.filter(
      (d) => new Date(d.Day).getFullYear() === selectedYear
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v) => ({
        value: d3.sum(v, (d) => (d.Paid ? d.Value : 0)),
        expectedValue: d3.sum(v, (d) => d.Value),
      }),
      (d) => new Date(d.Day).getMonth()
    );

    const allMonths = d3.range(0, 12).map((month) => ({
      month: d3.timeFormat('%b')(new Date(0, month)),
      value: 0,
      expectedValue: 0,
    }));

    monthlyData.forEach(([month, values]) => {
      allMonths[month].value = values.value;
      allMonths[month].expectedValue = values.expectedValue;
    });

    return allMonths;
  }, [selectedDate, predictedPayments, showBy]);

  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      predictedPayments,
      (v) => ({
        value: d3.sum(v, (d) => (d.Paid ? d.Value : 0)),
        expectedValue: d3.sum(v, (d) => d.Value),
      }),
      (d) => new Date(d.Day).getFullYear()
    );

    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year) => ({
        year: year,
        value: 0,
        expectedValue: 0,
      }));

    yearlyData.forEach(([year, values]) => {
      const index = yearRange.findIndex((y) => y.year === year);
      if (index !== -1) {
        yearRange[index].value = values.value;
        yearRange[index].expectedValue = values.expectedValue;
      }
    });

    return yearRange;
  }, [selectedDate, predictedPayments, showBy]);

  const dataset =
    showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalCollected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear && d.Paid)
      .reduce((sum, item) => sum + item.Value, 0);
  }, [selectedDate, predictedPayments, showBy]);

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === selectedYear)
      .reduce((sum, item) => sum + item.Value, 0);
  }, [selectedDate, predictedPayments, showBy]);

  const lastYearTotalCollected = useMemo(() => {
    const previousYear = parseInt(selectedDate) - 1;
    return predictedPayments
      .filter((d) => new Date(d.Day).getFullYear() === previousYear && d.Paid)
      .reduce((sum, item) => sum + item.Value, 0);
  }, [selectedDate, predictedPayments, showBy]);

  const difference = totalCollected - lastYearTotalCollected;
  const percentageChange =
    lastYearTotalCollected !== 0
      ? ((difference / lastYearTotalCollected) * 100).toFixed(2)
      : 'N/A';

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: 'var(--710px-V)',
        height: 'var(--510px-V)',
      }}
    >
      <p className="DashboardWigetPieChartTextHeader">Total Collected</p>

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
        grid={{ vertical: true, horizontal: true }}
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
          '.MuiChartsLegend-label': {},
          '.MuiBarElement-root': {},
        })}
      />
    </div>
  );
};

export default React.memo(DashbTotalCollected);
