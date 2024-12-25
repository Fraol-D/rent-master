import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from 'date-fns';
import { CurrencySign, formatNumberWithSuffix } from '../Helpers/CurrencySign';

interface ExpenseCalendarProps {
  expenses: expenses[];
}

const ExpenseCalendar: React.FC<ExpenseCalendarProps> = ({ expenses }) => {
  const ref = useRef<SVGSVGElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToPreviousMonth = () => {
    setCurrentDate(addMonths(currentDate, -1));
  };

  const calculateRecurringExpenses = (expense: expenses, targetDate: Date) => {
    if (!expense.doesReoccur) return null;

    const StartExpenseDate = new Date(expense.date);
    StartExpenseDate.setHours(0, 0, 0, 0);

    // Get the actual start date
    const effectiveStartDate = new Date(StartExpenseDate.getTime());

    // Calculate end date based on expense settings
    const finalEndDate = expense.HasEndDate
      ? new Date(expense.EndDate)
      : targetDate;

    if (targetDate > finalEndDate) return null;

    let currentDate = effectiveStartDate;
    let expenseCount = 0;

    while (currentDate <= finalEndDate && expenseCount < 100) {
      if (
        currentDate.getDate() === targetDate.getDate() &&
        currentDate.getMonth() === targetDate.getMonth() &&
        currentDate.getFullYear() === targetDate.getFullYear()
      ) {
        return expense;
      }

      // Calculate next expense date based on recurring type
      switch (expense.recurringType) {
        case 'Day':
          currentDate = addDays(currentDate, expense.recurringCycle);
          break;
        case 'Monthly':
          const nextMonthDate = new Date(currentDate);
          nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
          currentDate = nextMonthDate;
          break;
        case 'Yearly':
          const nextYearDate = new Date(currentDate);
          const originalMonth = nextYearDate.getMonth();
          const originalDay = nextYearDate.getDate();
          nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
          nextYearDate.setMonth(originalMonth);
          nextYearDate.setDate(originalDay);
          currentDate = nextYearDate;
          break;
        default:
          const defaultNextDate = new Date(currentDate);
          defaultNextDate.setMonth(defaultNextDate.getMonth() + 1);
          currentDate = defaultNextDate;
      }

      expenseCount++;
    }

    return null;
  };

  useEffect(() => {
    if (!ref.current) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const margin = { top: 50, right: 20, bottom: 50, left: 50 };
    const width = Math.max(
      800,
      window.innerWidth - margin.left - margin.right - 400
    ); // Adjust for sidebar
    let height = 1000; // Reduced base height since we'll scale bars dynamically
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const expensesInMonth = daysInMonth.map((day) => {
      return expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        if (
          expenseDate.getDate() === day.getDate() &&
          expenseDate.getMonth() === day.getMonth() &&
          expenseDate.getFullYear() === day.getFullYear()
        ) {
          return true;
        }
        return calculateRecurringExpenses(expense, day) !== null;
      });
    });
    height = height + (Math.max(...expensesInMonth.map(e => e.length)) * 15)
    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
  
    // Create day columns
    const dayWidth = width / daysInMonth.length;
    const dayHeight = height - margin.top - margin.bottom;

    // Create day columns
    const dayGroups = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`)
      .selectAll('.day-column')
      .data(daysInMonth)
      .enter()
      .append('g')
      .attr('class', 'day-column')
      .attr('transform', (d, i) => `translate(${i * dayWidth}, 0)`);

    // Add day backgrounds
    dayGroups
      .append('rect')
      .attr('width', dayWidth - 1)
      .attr('height', dayHeight)
      .attr('fill', (d) => {
        const isToday = d.getDate() === new Date().getDate() && 
                       d.getMonth() === new Date().getMonth() &&
                       d.getFullYear() === new Date().getFullYear();
        if (isToday) return 'var(--Secondary-Color60)';
        return d.getDay() === 0 || d.getDay() === 6 ? 'var(--Secondary-Color20)' : 'var(--Secondary-Color20)';
      });

    // Add day numbers
    dayGroups
      .append('text')
      .attr('x', dayWidth / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('fill', 'var(--Text-Color)')
      .text((d) => d.getDate());

    // Calculate and add expenses for each day
    daysInMonth.forEach((day, dayIndex) => {
      const dayExpenses = expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        if (
          expenseDate.getDate() === day.getDate() &&
          expenseDate.getMonth() === day.getMonth() &&
          expenseDate.getFullYear() === day.getFullYear()
        ) {
          return true;
        }
        return calculateRecurringExpenses(expense, day) !== null;
      });

      if (dayExpenses.length > 0) {
        const expenseGroup = dayGroups
          .filter((d, i) => i === dayIndex)
          .append('g')
          .attr('transform', `translate(0, 30)`);

        dayExpenses.forEach((expense, i) => {
          expenseGroup
            .append('circle')
            .attr('cx', dayWidth / 2)
            .attr('cy', i * 25+10)
            .attr('r', 12)
            .attr('fill', expense.doesReoccur ? 'var(--Accent-Color)' : 'var(--Accent-Color50)')
            .attr('opacity', 0.7)
            .on('mouseover', (event) => {
              const tooltip = d3.select('.tooltip');
              tooltip.style('visibility', 'visible')
                .html(`
                  <div id="expense-calendar" style="color: var(--Text-Color);font-family: Arial, sans-serif; line-height: 1.6;">
                    <h3 style="color: var(--Text-Color); margin-bottom: var(--5px-V);margin-top: var(--5px-V);">Expense Details</h3>
                    <p><strong style="font-size: 1.1em;">${expense.name}</strong></p>
                    <p><em style="font-style: italic;">Amount:</em> <span style="font-weight: bold; color: var(--Text-Color);">${formatNumberWithSuffix(expense.price)} ${CurrencySign(expense.Currency)}</span></p>
                    <p><strong>Type:</strong> <span style="background-color: var(--Accent-Color50); padding: var(--2px-V) var(--5px-V); border-radius: var(--3px-V);">
                      ${expense.doesReoccur ? `Recurring (${expense.recurringType})` : 'One-time'}
                    </span></p>
                    ${expense.recurringType === "Day" && expense.doesReoccur ? 
                      `<p><i>Frequency:</i> Every ${expense.recurringCycle} days</p>` 
                      : ''
                    }
                    <p><em>Category:</em> <span style="text-decoration: underline;">${expense.category || 'N/A'}</span></p>
                  </div>
                `)
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 10 + 'px');
            })
            .on('mousemove', (event) => {
              d3.select('.tooltip')
                .style('left', event.pageX + 10 + 'px')
                .style('top', event.pageY - 10 + 'px');
            })
            .on('mouseout', () => {
              d3.select('.tooltip').style('visibility', 'hidden');
            });
        });
      }
    });

    // Add tooltip div if it doesn't exist
    if (!d3.select('body').select('.tooltip').size()) {
      d3.select('body')
        .append('div')
        .attr('class', 'tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'var(--Secondary-Color)')
        .style('padding', 'var(--5px-V)')
        .style('border-radius', 'var(--3px-V)')
        .style('color', 'var(--Text-Color)');
    }
  }, [expenses, searchTerm, currentDate]);

  return (
    <div className="CalendarMainContainer" id="expense-calendar">
      <div className="calendar-navigation" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--10px-V)', marginTop: 'var(--10px-V)' }}>
       <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 'var(--10px-V)', marginTop: 'var(--10px-V)' }}id="expense-calendar-navigation"><button onClick={goToPreviousMonth} style={{ cursor: 'pointer', border: 'none', color: 'var(--Text-Color)', fontSize: 'var(--18px-V)' }}>←</button>
        <span style={{ fontSize: 'var(--18px-V)', color: 'var(--Text-Color)' }}>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={goToNextMonth} style={{ cursor: 'pointer',  border: 'none', color: 'var(--Text-Color)', fontSize: 'var(--18px-V)' }}>→</button>
    </div>   </div>
      <div style={{ overflowX: 'auto', height: 'calc(100% - var(--44px-V))' }}>
        <svg ref={ref}></svg>
      </div>
    </div>
  );
};

export default ExpenseCalendar;
