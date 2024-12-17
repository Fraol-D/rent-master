import { storageManager } from '../../../storeManager';
import React, { useMemo, useState } from 'react';
import { format, addDays, isBefore, isAfter, addMonths } from 'date-fns';
import { Input } from '../Helpers/CustomReactComponents';
import CurrencySign, {
  formatNumberWithSuffix,
  getRateByDate,
} from '../Helpers/CurrencySign';

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
  const [showRecurring, setShowRecurring] = useState<
    'all' | 'recurring' | 'non-recurring'
  >('all');
  const [priceFilter, setPriceFilter] = useState<number | ''>('');
  const [monthsToShow, setMonthsToShow] = useState<number>(3);
  const [limit, setLimit] = useState<number>(100);
  const [floorFilter, setFloorFilter] = useState<number | ''>('');
  const [roomFilter, setRoomFilter] = useState<number | ''>('');
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD' | 'ALL_ETB_USD'
  >('ALL_ETB_USD');

  const processValueByCurrency = (
    value: number,
    currency: string,
    date: number
  ) => {
    const { rate } = getRateByDate(date);

    if (!rate) return value;

    switch (currencyDisplay) {
      case 'ETB_ONLY':
        return currency === 'ETB' ? value : 0;
      case 'USD_ONLY':
        return currency === 'USD' ? value : 0;
      case 'ALL_ETB':
        return currency === 'USD' ? value * rate : value;
      case 'ALL_USD':
        return currency === 'ETB' ? value / rate : value;
      case 'ALL_ETB_USD':
        return value;
      default:
        return value;
    }
  };

  const generateRecurringExpenses = (
    expenses: expenses[],
    startDate: Date,
    endDate: Date
  ): expenses[] => {
    let allExpenses: expenses[] = [];

    expenses.forEach((expense) => {
      if (expense.doesReoccur) {
        const StartExpenseDate = new Date(expense.date);
        StartExpenseDate.setHours(0, 0, 0, 0);

        // Get the actual start date (either expense start date or period start date)
        const effectiveStartDate = new Date(StartExpenseDate.getTime());

        let currentDate = effectiveStartDate;
        let expenseCount = 0;

        // Calculate end date based on expense settings
        const finalEndDate = expense.HasEndDate
          ? new Date(Math.min(expense.EndDate, endDate.getTime()))
          : endDate;

        while (currentDate <= finalEndDate && expenseCount < 100) {
          const expenseId = `${expense.id}-${currentDate.getTime()}`;

          // Only add if the expense date falls within our range
          if (
            currentDate >= startDate &&
            (currentDate <= endDate || expense.HasEndDate)
          ) {
            allExpenses.push({
              ...expense,
              id: expenseId,
              date: currentDate.getTime(),
            });
          }

          // Calculate next expense date based on recurring type
          switch (expense.recurringType) {
            case 'Day':
              // Add days based on recurringCycle
              currentDate = addDays(currentDate, expense.recurringCycle);
              break;
            case 'Monthly':
              // Add one month to current date
              const nextMonthDate = new Date(currentDate);
              nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
              currentDate = nextMonthDate;
              break;

            case 'Yearly':
              // Preserve month and day when adding years
              const nextYearDate = new Date(currentDate);
              const originalMonth = nextYearDate.getMonth();
              const originalDay = nextYearDate.getDate();
              nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
              // Ensure we keep the same month and day
              nextYearDate.setMonth(originalMonth);
              nextYearDate.setDate(originalDay);
              currentDate = nextYearDate;
              console.log(currentDate, 'lllllllllll');
              break;

            default:
              console.warn(
                `Unknown recurring type: ${expense.recurringType}, defaulting to monthly`
              );
              const defaultNextDate = new Date(currentDate);
              defaultNextDate.setMonth(defaultNextDate.getMonth() + 1);
          }

          expenseCount++;
        }
      } else {
        // For non-recurring expenses, only include if within date range
        const expenseDate = new Date(expense.date);
        expenseDate.setHours(0, 0, 0, 0);

        if (expenseDate >= startDate && expenseDate <= endDate) {
          allExpenses.push({
            ...expense,
            date: expenseDate.getTime(),
          });
        }
      }
    });

    // Sort expenses by date
    return allExpenses.sort((a, b) => a.date - b.date);
  };

  const sortedExpenses = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const pastDate = addDays(today, -monthsToShow * 30);
    pastDate.setHours(0, 0, 0, 0);

    let expandedExpenses =
      generateRecurringExpenses(expenses as expenses[], pastDate, today) || [];
    if (
      expenses &&
      expenses.length > 0 &&
      expenses !== undefined &&
      expenses !== null
    ) {
      expandedExpenses =
        generateRecurringExpenses(expenses as expenses[], pastDate, today) ||
        [];
    } else {
    }
    return expandedExpenses
      .filter((expense) => {
        if (showRecurring === 'recurring') return expense.doesReoccur;
        if (showRecurring === 'non-recurring') return !expense.doesReoccur;
        return true;
      })
      .filter(
        (expense) => priceFilter === '' || expense.price <= Number(priceFilter)
      )
      .filter(
        (expense) => floorFilter === '' || expense.floor === Number(floorFilter)
      )
      .filter(
        (expense) => roomFilter === '' || expense.room === Number(roomFilter)
      )
      .sort((a, b) => {
        if (sortBy === 'date') {
          return sortOrder === 'asc' ? a.date - b.date : b.date - a.date;
        } else {
          return sortOrder === 'asc' ? a.price - b.price : b.price - a.price;
        }
      })
      .slice(0, limit);
  }, [
    expenses,
    sortBy,
    sortOrder,
    showRecurring,
    priceFilter,
    monthsToShow,
    limit,
    floorFilter,
    roomFilter,
  ]);
  const getCurrentExchangeRate = () => {
    const storedRates = storageManager.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };
  return (
    <div
      style={{
        width: 'var(--800px-V)',
        padding: 'var(--20px-V)',
        borderRadius: 'var(--8px-V)',
        boxShadow: '0 var(--2px-V) var(--4px-V) rgba(0,0,0,0.1)',
        backgroundColor: 'var(--Secondary-Color30)',
        margin: 'var(--10px-V)',
        height: 'var(--600px-V)',
        overflowY: 'auto',
      }}
    >
      <h2
        style={{
          fontSize: 'var(--24px-V)',
          marginBottom: 'var(--20px-V)',
          color: 'var(--Text-Color)',
          marginTop: 'var(--0px-V)',
        }}
      >
        Recent Expense History
      </h2>
      <div
        className="DashboardTotalCollectedTopPart"
        style={{
          marginBottom: 'var(--20px-V)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'price')}
          >
            <option value="date">Date</option>
            <option value="price">Price</option>
          </select>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Show:</label>
          <select
            value={showRecurring}
            onChange={(e) =>
              setShowRecurring(
                e.target.value as 'all' | 'recurring' | 'non-recurring'
              )
            }
          >
            <option value="all">All</option>
            <option value="recurring">Recurring Only</option>
            <option value="non-recurring">Non-recurring Only</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Max Price:</label>
          <input
            type="number"
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value as number | '')}
            placeholder="Enter max price"
          />
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>
            Months to show:
          </label>
          <input
            type="number"
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
            min="1"
            max="12"
          />
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Limit:</label>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
            <option value="500">500</option>
            <option value="1000">1000</option>
          </select>
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Floor:</label>
          <input
            type="number"
            value={floorFilter}
            style={{ width: 'var(--50px-V)' }}
            onChange={(e) => setFloorFilter(e.target.value as number | '')}
            placeholder="Enter floor"
          />
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Room:</label>
          <input
            style={{ width: 'var(--50px-V)' }}
            type="number"
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value as number | '')}
            placeholder="Enter room"
          />
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>Currency:</label>
          <select
            value={currencyDisplay}
            onChange={(e) =>
              setCurrencyDisplay(e.target.value as typeof currencyDisplay)
            }
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--Border-Color)',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}
          >
            <option value="ETB_ONLY">Show Only Birr</option>
            <option value="USD_ONLY">Show Only Dollar</option>
            <option value="ALL_ETB">Show All in Birr</option>
            <option value="ALL_USD">Show All in Dollar</option>
            <option value="ALL_ETB_USD">Show All</option>
          </select>
          <span
            style={{
              fontSize: 'var(--12px-V)',
              color: 'var(--Text-Color-Grey)',
              marginLeft: 'var(--10px-V)',
            }}
          >
            Current Rate: 1 USD ={' '}
            {getCurrentExchangeRate()?.toFixed(2) || 'N/A'} ETB
          </span>
        </div>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {sortedExpenses.length > 0 ? (
          sortedExpenses
            .filter((exp: Expense) =>
              currencyDisplay === 'ETB_ONLY'
                ? exp.Currency === 'ETB'
                : currencyDisplay === 'USD_ONLY'
                ? exp.Currency === 'USD'
                : true
            )
            .map((expense, index) => (
              <div
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
                <div
                  style={{
                    fontSize: 'var(--14px-V)',
                    color: 'var(--Text-Color)',
                    width: 'var(--100px-V)',
                  }}
                >
                  {format(new Date(expense.date), 'MMM dd, yyyy')}
                </div>
                <div
                  style={{
                    flex: '1 1 0%',
                    fontSize: 'var(--16px-V)',
                    fontWeight: 'bold',
                    color: 'var(--Text-Color)',
                  }}
                >
                  {expense.name} <br /> <span style={{fontSize: 'var(--12px-V)', color: 'var(--Text-Color-Grey)'}}>{expense.category}</span>
                </div>
                <div
                  style={{
                    fontSize: 'var(--16px-V)',
                    fontWeight: 'bold',
                    color: 'var(--Text-Color-Grey)',
                    textAlign: 'right',
                  }}
                >
                  {currencyDisplay === 'ALL_ETB_USD' ? (
                    <>
                      {formatNumberWithSuffix(
                        processValueByCurrency(
                          expense.price,
                          expense.Currency || 'ETB',
                          expense.date
                        ).toLocaleString()
                      )}
                      {CurrencySign(expense.Currency)}
                    </>
                  ) : (
                    <>
                      {formatNumberWithSuffix(
                        processValueByCurrency(
                          expense.price,
                          expense.Currency || 'ETB',
                          expense.date
                        ).toLocaleString()
                      )}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 'var(--14px-V)',
                    color: 'var(--Text-Color)',
                    textAlign: 'center',
                    marginLeft: '20px',
                  }}
                >
                  {expense.fullBuilding ? (
                    <strong>Full Building</strong>
                  ) : (
                    <em>{`Room ${expense.room}, Floor ${expense.floor}`}</em>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 'var(--12px-V)',
                    color: 'var(--Accent-Color)',
                    textAlign: 'right',
                    marginLeft: 'var(--20px-V)',
                  }}
                >
                  {expense.doesReoccur ? 'Recurring' : ''}
                </div>
              </div>
            ))
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: 'var(--20px-V)',
              color: 'var(--Text-Color)',
            }}
          >
            There are currently no expenses to display. Please adjust your
            filters or add new expenses to see them here.
          </div>
        )}
      </ul>
    </div>
  );
};

export default React.memo(DashbExpenseHistory);
