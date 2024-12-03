import React, { useState, useMemo, useCallback } from 'react';
import { format, addMonths, isBefore, isAfter, addDays } from 'date-fns';
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
  isUtility: boolean;
}

interface UpcomingExpensesWidgetProps {
  expenses: Expense[];
}

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

const DashbUpcomingExpensesWidget: React.FC<UpcomingExpensesWidgetProps> = ({
  expenses,
}) => {
  const [expandedMonths, setExpandedMonths] = useState<string[]>([]);
  const [filterFullBuilding, setFilterFullBuilding] = useState<boolean | null>(
    null
  );
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD' | 'ALL_ETB_USD'
  >('ALL_ETB');

  // Add currency conversion function
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
  const [filterFloor, setFilterFloor] = useState<number | ''>('');
  const [filterRoom, setFilterRoom] = useState<number | ''>('');
  const [filterPriceLimit, setFilterPriceLimit] = useState<number | ''>('');
  const [monthsToShow, setMonthsToShow] = useState<number>(6);
  const [limit, setLimit] = useState<number>(500);
  const getCurrentExchangeRate = () => {
    const storedRates = storageManager.get('exchangeRate');
    if (!storedRates || storedRates.length === 0) return null;
    return storedRates[storedRates.length - 1].rates;
  };
  const upcomingExpenses = useMemo(() => {
    const today = new Date();
    const futureDate = addMonths(today, monthsToShow);

    const expandedExpenses = generateRecurringExpenses(
      expenses,
      today,
      futureDate
    );

    return expandedExpenses
      .filter((expense) => {
        if (
          filterFullBuilding !== null &&
          expense.fullBuilding !== filterFullBuilding
        )
          return false;
        if (!expense.fullBuilding) {
          if (filterFloor !== '' && expense.floor !== Number(filterFloor))
            return false;
          if (filterRoom !== '' && expense.room !== Number(filterRoom))
            return false;
        }
        // Update price filter to use converted value
        if (filterPriceLimit !== '') {
          const convertedPrice = processValueByCurrency(
            expense.price,
            expense.Currency || 'ETB',
            expense.date
          );
          if (convertedPrice > Number(filterPriceLimit)) return false;
        }
        return true;
      })
      .sort((a, b) => a.date - b.date);
  }, [
    expenses,
    filterFullBuilding,
    filterFloor,
    filterRoom,
    filterPriceLimit,
    monthsToShow,
    limit,
    currencyDisplay, // Add currencyDisplay to dependencies
  ]);

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
    setExpandedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month]
    );
  }, []);

  return (
    <div
      style={{
        width: 'var(--650px-V)',
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
        Upcoming Expenses
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
          <label style={{ marginRight: 'var(--10px-V)' }}>Building:</label>
          <select
            value={
              filterFullBuilding === null ? '' : filterFullBuilding.toString()
            }
            onChange={(e) =>
              setFilterFullBuilding(
                e.target.value === '' ? null : e.target.value === 'true'
              )
            }
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
                style={{ width: 'var(--50px-V)' }}
                onChange={(e) => setFilterFloor(e.target.value as number | '')}
                placeholder="Floor"
              />
            </div>
            <div>
              <label style={{ marginRight: 'var(--10px-V)' }}>Room:</label>
              <input
                type="number"
                value={filterRoom}
                style={{ width: 'var(--50px-V)' }}
                onChange={(e) => setFilterRoom(e.target.value as number | '')}
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
            onChange={(e) => setFilterPriceLimit(e.target.value as number | '')}
            placeholder="Max Price"
          />
        </div>
        <div>
          <label style={{ marginRight: 'var(--10px-V)' }}>
            Months to show:
          </label>
          <select
            value={monthsToShow}
            onChange={(e) => setMonthsToShow(Number(e.target.value))}
          >
            <option value={3}>3 Months</option>
            <option value={6}>6 Months</option>
            <option value={12}>1 Year</option>
          </select>
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
        {groupedExpenses.length > 0 ? (
          groupedExpenses.map(([month, monthExpenses]) => (
            <li key={month} style={{ marginBottom: 'var(--20px-V)' }}>
              <h3
                onClick={() => toggleMonth(month)}
                style={{
                  cursor: 'pointer',
                  color: 'var(--Text-Color)',
                  marginBottom: 'var(--10px-V)',
                }}
              >
                {expandedMonths.includes(month) ? ' ▼' : ' ▶'}{' '}
                {format(new Date(month), 'MMMM yyyy')}
              </h3>
              {expandedMonths.includes(month) && (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {monthExpenses
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
                          borderBottom:
                            'var(--1px-V) solid var(--Secondary-Color)',
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
                          {expense.name}
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
                          {expense.isUtility
                            ? 'Utility'
                            : expense.doesReoccur
                            ? 'Recurring'
                            : ''}
                        </div>
                      </div>
                    ))}
                </ul>
              )}
            </li>
          ))
        ) : (
          <li
            style={{
              textAlign: 'center',
              padding: 'var(--20px-V)',
              color: 'var(--Text-Color)',
            }}
          >
            There are currently no upcoming expenses to display. This could be
            due to your current filter settings or a lack of recorded expenses
            for the specified time period.
          </li>
        )}
      </ul>
    </div>
  );
};

export default React.memo(DashbUpcomingExpensesWidget);
