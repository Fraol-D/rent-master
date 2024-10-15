import React, { useMemo, useState } from 'react';
import { format, addDays, isBefore, isAfter } from 'date-fns';

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
}

interface DashbExpenseHistoryProps {
  expenses: Expense[];
}

const DashbExpenseHistory: React.FC<DashbExpenseHistoryProps> = ({
  expenses,
}) => {
  const [sortBy, setSortBy] = useState<'date' | 'price'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRecurring, setShowRecurring] = useState<'all' | 'recurring' | 'non-recurring'>('all');
  const [priceFilter, setPriceFilter] = useState<number | ''>('');
  const [monthsToShow, setMonthsToShow] = useState<number>(3);
  const [limit, setLimit] = useState<number>(10);
  const [floorFilter, setFloorFilter] = useState<number | ''>('');
  const [roomFilter, setRoomFilter] = useState<number | ''>('');

  const sortedExpenses = useMemo(() => {
    const today = new Date();
    const pastDate = addDays(today, -monthsToShow * 30); // Approximate months to days

    const expandedExpenses = expenses.flatMap((expense) => {
      if (expense.doesReoccur) {
        const occurrences = [];
        let currentDate = new Date(expense.date);
        while (isBefore(currentDate, today)) {
          if (isAfter(currentDate, pastDate)) {
            occurrences.push({
              ...expense,
              date: currentDate.getTime(),
            });
          }
          currentDate = addDays(currentDate, expense.recurringCycle);
        }
        return occurrences;
      } else {
        return [expense];
      }
    });

    return expandedExpenses
      .filter((expense) => isAfter(new Date(expense.date), pastDate))
      .filter((expense) => {
        if (showRecurring === 'recurring') return expense.doesReoccur;
        if (showRecurring === 'non-recurring') return !expense.doesReoccur;
        return true;
      })
      .filter((expense) => priceFilter === '' || expense.price <= Number(priceFilter))
      .filter((expense) => floorFilter === '' || expense.floor === Number(floorFilter))
      .filter((expense) => roomFilter === '' || expense.room === Number(roomFilter))
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' ? a.date - b.date : b.date - a.date;
        } else {
          return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        }
      })
      .slice(0, limit);
  }, [expenses, sortBy, sortOrder, showRecurring, priceFilter, monthsToShow, limit, floorFilter, roomFilter]);

  return (
    <div
      style={{
        width: '800px',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        backgroundColor: 'var(--Secondary-Color30)',
        margin: '10px',  height: '600px',    overflowY: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: '24px',
          marginBottom: '20px',
          color: 'var(--Text-Color)',
          marginTop: '0px',
        }}
      >
        Recent Expense History
      </h2>
      <div className='DashboardTotalCollectedTopPart' style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <label style={{ marginRight: '10px' }}>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}>
            <option value="date">Date</option>
            <option value="price">Price</option>
          </select>
          <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Show:</label>
          <select value={showRecurring} onChange={(e) => setShowRecurring(e.target.value as 'all' | 'recurring' | 'non-recurring')}>
            <option value="all">All</option>
            <option value="recurring">Recurring Only</option>
            <option value="non-recurring">Non-recurring Only</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Max Price:</label>
          <input
            type="number"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as number | '')}
            placeholder="Enter max price"
          />
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Months to show:</label>
          <input
            type="number"
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            min="1"
            max="12"
          />
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Limit:</label>
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Floor:</label>
          <input
            type="number"
            value={floorFilter}
            style={{width: '50px'}}
            onChange={(e) => setFloorFilter(e.target.value as number | '')}
            placeholder="Enter floor"
          />
        </div>
        <div>
          <label style={{ marginRight: '10px' }}>Room:</label>
          <input
            style={{width: '50px'}}

            type="number"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value as number | '')}
            placeholder="Enter room"
          />
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sortedExpenses.length > 0 ? (
          sortedExpenses.map((expense, index) => (
            <li
              key={`${expense.id}-${index}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px',
                marginBottom: '10px',
                borderBottom: '1px solid var(--Secondary-Color)',
                backgroundColor: 'var(--Secondary-Color60)',
                borderRadius: '10px',
                marginLeft: '10px',
              }}
            >
              <div
                style={{
                  flex: '0 0 120px',
                  fontSize: '14px',
                  color: 'var(--Text-Color)',
                }}
              >
                {format(new Date(expense.date), 'MMM dd, yyyy')}
              </div>
              <div
                style={{
                  flex: '1',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--Text-Color)',
                  marginLeft: '20px',
                }}
              >
                {expense.name}
              </div>
              <div
                style={{
                  flex: '0 0 100px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: 'var(--Text-Color-Grey)',
                  textAlign: 'right',
                }}
              >
                ${expense.price.toLocaleString()}
              </div>
              <div
                style={{
                  flex: '0 0 120px',
                  fontSize: '14px',
                  color: 'var(--Text-Color)',
                  textAlign: 'center',
                }}
              >
                {expense.fullBuilding ? (
                  <strong>Full Building <br />.</strong>
                ) : (
                  <em>{`Room ${expense.room}`}, <br /> {`Floor ${expense.floor}`}</em>
                )}
              </div>
              {expense.doesReoccur ? (
                <div
                  style={{
                    flex: '0 0 80px',
                    fontSize: '12px',
                    color: 'var(--Accent-Color)',
                    textAlign: 'right',
                    marginLeft: '20px',
                  }}
                >
                  Recurring
                </div>
              ) : (
                <div style={{ flex: '0 0 80px',
                  fontSize: '12px',
                  color: 'var(--Accent-Color)',
                  textAlign: 'right',
                  marginLeft: '20px' }}></div>
              )}
            </li>
          ))
        ) : (
          <li style={{ textAlign: 'center', padding: '20px', color: 'var(--Text-Color)' }}>
            There are currently no expenses to display. Please adjust your filters or add new expenses to see them here.
          </li>
        )}
      </ul>
    </div>
  );
};

export default React.memo(DashbExpenseHistory);
