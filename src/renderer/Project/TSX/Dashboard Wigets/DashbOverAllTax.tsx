import React, { useState, useMemo, useEffect } from 'react';
import * as d3 from 'd3';
import { BarChart } from '@mui/x-charts/BarChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { getValuesWithSql } from 'Backend/localServerApis';
import { addDays, addMonths, addYears, startOfYear, endOfYear } from 'date-fns';

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const DashbOverAllTax = ({ RoomList, tenantList }: { RoomList: RoomType[], tenantList: tenant[] }) => {
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
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()}`
      );

      // Get historical payments
      const historicalPayments = await getValuesWithSql(
        'room_pay_info_history',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()}`
      );

      // Map all payments (including unpaid ones for tax calculation)
      const combinedPayments = [...actualPayments, ...historicalPayments]
        .map(payment => ({
          id: payment.id,
          Day: payment.Day,
          Value: payment.Value,
          Paid: payment.Paid === 1,
          roomId: payment.roomId,
        }));

      // Add all payments to allPayments
      allPayments.push(...combinedPayments);

      // Generate predictions for all rooms with tenants
      for (const room of RoomList) {
        if (!room.tenantId) continue;

        const tenant = tenantList.find((t) => t.id === room.tenantId) || null;
        if (!tenant) continue;

        let startDate = new Date(tenant.startTime || Date.now()).getTime();
        let endDate = yearEnd.getTime();

        if (room.selectedAgreementId) {
          const agreements = await getValuesWithSql(
            'agreements',
            `WHERE id = '${room.selectedAgreementId}'`
          );
          if (agreements.length > 0) {
            startDate = Math.max(agreements[0].startTime, yearStart.getTime());
            if (tenant.SelectedAgreement === 'Fixed-Term' && agreements[0].endTime) {
              endDate = Math.min(agreements[0].endTime, yearEnd.getTime());
            }
          }
        }

        let currentDate = new Date(startDate);

        while (currentDate.getTime() <= endDate) {
          const paymentId = `${room.id}-${currentDate.getTime()}`;
          
          if (!allPayments.some(p => p.id === paymentId)) {
            allPayments.push({
              id: paymentId,
              Day: currentDate.getTime(),
              Value: room.AgreedPrice,
              Paid: false,
              roomId: room.id,
            });
          }

          currentDate = calculateNextPaymentDate(currentDate, room);
        }
      }

      setPredictedPayments(allPayments);
    };

    calculatePayments();
  }, [RoomList, tenantList, selectedDate, showBy]);

  const calculateNextPaymentDate = (currentDate: Date, room: any) => {
    switch (room.PaymentCycleType) {
      case '30': return addDays(currentDate, 30);
      case '15': return addDays(currentDate, 15);
      case '7': return addDays(currentDate, 7);
      case 'daily': return addDays(currentDate, 1);
      case 'monthly': return addMonths(currentDate, 1);
      case 'weekly': return addDays(currentDate, 7);
      case 'Annually': return addYears(currentDate, 1);
      case 'custom': return addDays(currentDate, room.PaymentCycleCustomeDays || 30);
      default: return addMonths(currentDate, 1);
    }
  };

  const calculateTax = (value: number) => value * 0.15;

  const aggregateMonthlyData = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    const filteredData = predictedPayments.filter(
      (d) => new Date(d.Day).getFullYear() === selectedYear
    );

    const monthlyData = d3.rollups(
      filteredData,
      (v) => ({
        expectedValue: d3.sum(v, (d) => d.Value),
      }),
      (d) => new Date(d.Day).getMonth()
    );

    const allMonths = d3.range(0, 12).map((month) => ({
      month: d3.timeFormat('%b')(new Date(0, month)),
      expectedValue: 0,
      tax: 0,
    }));

    monthlyData.forEach(([month, values]) => {
      allMonths[month].expectedValue = values.expectedValue;
      allMonths[month].tax = calculateTax(values.expectedValue);
    });

    return allMonths;
  }, [selectedDate, predictedPayments]);

  const aggregateYearlyData = useMemo(() => {
    const yearlyData = d3.rollups(
      predictedPayments,
      (v) => ({
        expectedValue: d3.sum(v, (d) => d.Value),
      }),
      (d) => new Date(d.Day).getFullYear()
    );
    const yearRange = d3
      .range(parseInt(selectedDate) - 2, parseInt(selectedDate) + 3)
      .map((year) => ({
        year: year,
        expectedValue: 0,
        tax: 0,
      }));
    yearlyData.forEach(([year, values]) => {
      const index = yearRange.findIndex((y) => y.year === year);
      if (index !== -1) {
        yearRange[index].expectedValue = values.expectedValue;
        yearRange[index].tax = calculateTax(values.expectedValue);
      }
    });
    return yearRange;
  }, [selectedDate, predictedPayments]);

  const dataset = showBy === 'Monthly' ? aggregateMonthlyData : aggregateYearlyData;

  const totalExpected = useMemo(() => {
    const selectedYear = parseInt(selectedDate);
    return predictedPayments.filter(
      (d) => new Date(d.Day).getFullYear() === selectedYear
    ).reduce((sum, item) => sum + item.Value, 0);
  }, [selectedDate, predictedPayments]);

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
          <span className="TotalValue">${totalTax.toLocaleString()}</span>
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
