import React, { useState, useMemo, useCallback } from 'react';
import { format, addMonths, isBefore, isAfter, addDays } from 'date-fns';

interface Expense {
  id: string;
  fullBuilding: boolean;
  floor: number;
  room: number;
  name: string;
  description: string;
  doesReoccur: boolean;
  recurringCycle: number;
  price: number;
  date: number;
  userId: string;
  isUtility: boolean;
}

interface UpcomingExpensesWidgetProps {
  expenses: Expense[];
}

const DashbUpcomingExpensesWidget: React.FC<UpcomingExpensesWidgetProps> = ({ expenses }) => {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [filterFullBuilding, setFilterFullBuilding] = useState<boolean | null>(null);
  const [filterFloor, setFilterFloor] = useState<number | ''>('');
  const [filterRoom, setFilterRoom] = useState<number | ''>('');
  const [filterPriceLimit, setFilterPriceLimit] = useState<number | ''>('');
  const [monthsToShow, setMonthsToShow] = useState<number>(3);
  const [limit, setLimit] = useState<number>(
    200);

  const upcomingExpenses = useMemo(() => {
    const today = new Date();
    const futureDate = addMonths(today, monthsToShow);

    const expandedExpenses = expenses.flatMap(expense => {
      if (!expense.doesReoccur && !expense.isUtility) {
        return isAfter(new Date(expense.date), today) && isBefore(new Date(expense.date), futureDate) ? [expense] : [];
      }

      const occurrences = [];
      let currentDate = new Date(expense.date);
      let count = 0;
      while (isBefore(currentDate, futureDate) && count < limit) {
        if (isAfter(currentDate, today)) {
          occurrences.push({
            ...expense,
            date: currentDate.getTime(),
          });
          count++;
        }
        if (expense.isUtility) {
          currentDate = addMonths(currentDate, 1); // Utilities typically recur monthly
        } else {
          currentDate = addDays(currentDate, expense.recurringCycle);
        }
      }
      return occurrences;
    });

    return expandedExpenses
      .filter(expense => {
        if (filterFullBuilding !== null && expense.fullBuilding !== filterFullBuilding) return false;
        if (!expense.fullBuilding) {
          if (filterFloor !== '' && expense.floor !== Number(filterFloor)) return false;
          if (filterRoom !== '' && expense.room !== Number(filterRoom)) return false;
        }
        if (filterPriceLimit !== '' && expense.price > Number(filterPriceLimit)) return false;
        return true;
      })
      .sort((a, b) => a.date - b.date);
  }, [expenses, filterFullBuilding, filterFloor, filterRoom, filterPriceLimit, monthsToShow, limit]);

  const groupedExpenses = useMemo(() => {
    const grouped = upcomingExpenses.reduce((acc, expense) => {
      const monthKey = format(new Date(expense.date), 'yyyy-MM');
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(expense);
      return acc;
    }, {} as Record<string, Expense[]>);

    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
  }, [upcomingExpenses]);

  const toggleMonth = useCallback((month: string) => {
    setExpandedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  }, []);

  return (
    <div style={{
      width: 'var(--650px-V)',
      padding: 'var(--20px-V)',
      borderRadius: 'var(--8px-V)',
      boxShadow: '0 var(--2px-V) var(--4px-V) rgba(0,0,0,0.1)',
      backgroundColor: 'var(--Secondary-Color30)',
      margin: 'var(--10px-V)',
      height: 'var(--600px-V)',
      overflowY: 'auto',
    }}>
      <h2 style={{
        fontSize: 'var(--24px-V)',
        marginBottom: 'var(--20px-V)',
        color: 'var(--Text-Color)',
        marginTop: 'var(--0px-V)',
      }}>
        Upcoming Expenses
      </h2>
      <div className='DashboardTotalCollectedTopPart' style={{ marginBottom: 'var(--20px-V)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Building:</label>
          <select 
            value={filterFullBuilding === null ? '' : filterFullBuilding.toString()} 
            onChange={e => setFilterFullBuilding(e.target.value === '' ? null : e.target.value === 'true')}
          >
            <option value="">All</option>
            <option value="true">Full Building</option>
            <option value="false">Specific Room</option>
          </select>
        </div>
        {filterFullBuilding === false && (
          <>
            <div>
              <label style={{ marginRight: 'var(--10px-V)' }}>Floor:</label>
              <input 
                type="number" 
                value={filterFloor} 
                style={{width: 'var(--50px-V)'}}
                onChange={e => setFilterFloor(e.target.value as number | '')} 
                placeholder="Floor"
              />
            </div>
            <div>
              <label style={{ marginRight: 'var(--10px-V)' }}>Room:</label>
              <input 
                type="number" 
                value={filterRoom} 
                style={{width: 'var(--50px-V)'}}
                onChange={e => setFilterRoom(e.target.value as number | '')} 
                placeholder="Room"
              />
            </div>
          </>
        )}
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Max Price:</label>
          <input 
            type="number" 
            value={filterPriceLimit} 
            onChange={e => setFilterPriceLimit(e.target.value as number | '')} 
            placeholder="Max Price"
          />
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Months to show:</label>
          <select 
            value={monthsToShow} 
            onChange={e => setMonthsToShow(Number(e.target.value))}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>1 Year</option>
          </select>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {groupedExpenses.length > 0 ? (
          groupedExpenses.map(([month, monthExpenses]) => (
            <li key={month} style={{ marginBottom: 'var(--20px-V)' }}>
              <h3 
                onClick={() => toggleMonth(month)} 
                style={{ 
                  cursor: 'pointer', 
                  color: 'var(--Text-Color)',
                  marginBottom: 'var(--10px-V)'
                }}
              >
                {expandedMonths.includes(month) ? ' ▼' : ' ▶'}{" "}
                {format(new Date(month), 'MMMM yyyy')}
              </h3>
              {expandedMonths.includes(month) && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {monthExpenses.map((expense, index) => (
                    <li
                      key={`${expense.id}-${index}`}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: 'var(--10px-V)',
                        marginBottom: 'var(--10px-V)',
                        borderBottom: 'var(--1px-V) solid var(--Secondary-Color)',
                        backgroundColor: 'var(--Secondary-Color60)',
                        borderRadius: 'var(--10px-V)',
                        marginLeft: 'var(--10px-V)',
                      }}
                    >
                      <div style={{
                        flex: '0 0 var(--120px-V)',
                        fontSize: 'var(--14px-V)',
                        color: 'var(--Text-Color)',
                      }}>
                        {format(new Date(expense.date), 'MMM dd, yyyy')}
                      </div>
                      <div style={{
                        flex: '1',
                        fontSize: 'var(--16px-V)',
                        fontWeight: 'bold',
                        color: 'var(--Text-Color)',
                        marginLeft: 'var(--20px-V)',
                      }}>
                        {expense.name}
                      </div>
                      <div style={{
                        flex: '0 0 var(--100px-V)',
                        fontSize: 'var(--16px-V)',
                        fontWeight: 'bold',
                        color: 'var(--Text-Color-Grey)',
                        textAlign: 'right',
                      }}>
                        ${expense.price.toLocaleString()}
                      </div>
                      <div style={{
                        flex: '0 0 var(--120px-V)',
                        fontSize: 'var(--14px-V)',
                        color: 'var(--Text-Color)',
                        textAlign: 'center',
                      }}>
                        {expense.fullBuilding ? (
                          <strong>Full Building</strong>
                        ) : (
                          <em>{`Room ${expense.room}, Floor ${expense.floor}`}</em>
                        )}
                      </div>
                      <div style={{
                        flex: '0 0 var(--80px-V)',
                        fontSize: 'var(--12px-V)',
                        color: 'var(--Accent-Color)',
                        textAlign: 'right',
                        marginLeft: 'var(--20px-V)',
                      }}>
                        {expense.isUtility ? 'Utility' : (expense.doesReoccur ? 'Recurring' : '')}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))
        ) : (
          <li style={{ textAlign: 'center', padding: 'var(--20px-V)', color: 'var(--Text-Color)' }}>
            There are currently no upcoming expenses to display. This could be due to your current filter settings or a lack of recorded expenses for the specified time period.
          </li>
        )}
      </ul>
    </div>
  );
};

export default React.memo(DashbUpcomingExpensesWidget);