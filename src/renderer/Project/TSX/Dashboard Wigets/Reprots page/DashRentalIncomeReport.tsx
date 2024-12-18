import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'renderer/components/GlobalContext';
import {
  startOfYear,
  endOfYear,
  startOfMonth,
  endOfMonth,
  format,
  addMonths,
  subMonths,
  addDays,
  addYears,
  isBefore,
  isAfter,
  differenceInDays,
} from 'date-fns';
import { storageManager } from 'renderer/storeManager';
import {
  CurrencySign,
  formatNumberWithSuffix,
  getRateByDate,
} from '../../Helpers/CurrencySign';

import html2canvas from 'html2canvas';

const DashRentalIncomeReport = ({
  RoomList,

  SelectedBranchId,
}: {
  RoomList: RoomType[];
 
  SelectedBranchId: string;
}) => {
  const [startDate, setStartDate] = useState(subMonths(new Date(), 1));
  const [endDate, setEndDate] = useState(new Date());
  const [currencyDisplay, setCurrencyDisplay] = useState<
    'ETB_ONLY' | 'USD_ONLY' | 'ALL_ETB' | 'ALL_USD'
  >('ALL_ETB');
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);
  const [predictedExpenses, setPredictedExpenses] = useState<expenses[]>([]);

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

  const { AllRoomPayInfo, AllRoomPayInfoHistory, AllExpenses, AllAgreements,AllTenants } =
    useGlobal();

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

  const handlePeriodChange = (months: number) => {
    setStartDate(subMonths(new Date(), months));
    setEndDate(new Date());
  };
  const calculatePredictedPayments = async (room: RoomType) => {
    const allPayments = [];
    const today = new Date();
    const yearEnd = new Date(today.getFullYear() + 1, 11, 31);
    const tenant = AllTenants.find((t) => t.id === room.tenantId);
    let startDate = new Date(tenant?.startTime || Date.now()).getTime();

    let endDate = null;
    if (room.selectedAgreementId) {
      const agreements = AllAgreements.filter(
        (agreement) => agreement.id === room.selectedAgreementId
      );
      if (agreements.length > 0) {
        startDate = agreements[0].startTime;
        if (tenant?.SelectedAgreement === 'Fixed-Term') {
          endDate = agreements[0].endTime;
        }
      }
    }

    let currentDate = new Date(startDate);
    while (
      currentDate <= yearEnd &&
      (endDate == null || currentDate <= new Date(endDate))
    ) {
      const paymentId = `${room.id}-${currentDate.getTime()}`;
      allPayments.push({
        id: paymentId,
        Day: currentDate.getTime(),
        Value: room.AgreedPrice,
        Paid: false,
        roomId: room.id,
      });

      switch (room.PaymentCycleType) {
        case '30':
          currentDate = addDays(currentDate, 30);
          break;
        case '15':
          currentDate = addDays(currentDate, 15);
          break;
        case '7':
          currentDate = addDays(currentDate, 7);
          break;
        case 'daily':
          currentDate = addDays(currentDate, 1);
          break;
        case 'monthly':
          currentDate = addMonths(currentDate, 1);
          break;
        case 'weekly':
          currentDate = addDays(currentDate, 7);
          break;
        case 'custom':
          currentDate = addDays(
            currentDate,
            room.PaymentCycleCustomeDays || 30
          );
          break;
        case 'Annually':
          currentDate = addYears(currentDate, 1);
          break;
        default:
          currentDate = addMonths(currentDate, 1);
      }
    }

    const actualPayments = AllRoomPayInfo.filter(
      (payment) =>
        payment.roomId === room.id && payment.tenantId === room.tenantId
    );

    return allPayments.map((payment) => {
      const actualPayment = actualPayments.find((p) => p.id === payment.id);
      return actualPayment
        ? { ...payment, Paid: actualPayment.Paid === 1 }
        : payment;
    });
  };

  const predictExpenses = (expenses: expenses[]) => {
    const today = new Date();
    const futureDate = addMonths(today, 12);
    const predictedExpenses: expenses[] = [];

    expenses.forEach((expense) => {
      if (expense.doesReoccur) {
        let currentDate = new Date(expense.date);
        while (currentDate <= futureDate) {
          predictedExpenses.push({
            ...expense,
            date: currentDate.getTime(),
            id: `${expense.id}-${currentDate.getTime()}`,
          });
          currentDate = addDays(currentDate, expense.reoccurDays || 30);
        }
      } else {
        predictedExpenses.push(expense);
      }
    });

    return predictedExpenses;
  };

  useEffect(() => {
    const calculateAllPredictions = async () => {
      let allPredictedPayments: Payment[] = [];

      for (const room of RoomList) {
        if (room.tenantId) {
          const roomPredictions = await calculatePredictedPayments(room);
          allPredictedPayments = [...allPredictedPayments, ...roomPredictions];
        }
      }

      setPredictedPayments(allPredictedPayments);
      setPredictedExpenses(predictExpenses(AllExpenses));
    };

    calculateAllPredictions();
  }, [RoomList, AllRoomPayInfo, AllExpenses, startDate, endDate]);

  const renderReportHeader = () => (
    <section className="report-header-section">
      <div className="report-info">
        <h3>Report Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <label>Report Period:</label>
            <span>
              {format(startDate, 'MMM d, yyyy')} -{' '}
              {format(endDate, 'MMM d, yyyy')}
            </span>
          </div>
          <div className="info-item">
            <label>Generated On:</label>
            <span>{format(new Date(), 'MMM d, yyyy HH:mm')}</span>
          </div>
          <div className="info-item">
            <label>Currency Display:</label>
            <span>{currencyDisplay.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      <div className="report-summary">
        <h3>Quick Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <label>Total Rooms:</label>
            <span>{RoomList.length}</span>
          </div>
          <div className="summary-item">
            <label>Occupied Units:</label>
            <span>{RoomList.filter((room) => room.tenantId).length}</span>
          </div>
          <div className="summary-item">
            <label>Active Tenants:</label>
            <span>{AllTenants.length}</span>
          </div>
        </div>
      </div>
    </section>
  );

  const reportData = useMemo(() => {
    const payments = [...AllRoomPayInfo, ...AllRoomPayInfoHistory].filter(
      (payment) =>
        payment.Day >= startDate.getTime() && payment.Day <= endDate.getTime()
    );

    const uncollectedPayments = predictedPayments.filter(
      (payment) =>
        !payment.Paid &&
        payment.Day >= startDate.getTime() &&
        payment.Day <= endDate.getTime()
    );
    console.log(uncollectedPayments);
    const totalUncollectedAmount = uncollectedPayments.reduce(
      (sum, payment) => {
        const room = RoomList.find((r) => r.id === payment.roomId);

        return (
          parseFloat(sum) +
          parseFloat(
            processValueByCurrency(
              payment.Value,
              room?.Currency || 'ETB',
              payment.Day
            )
          )
        );
      },
      0
    );
    console.log(totalUncollectedAmount);

    const totalRentalIncome = payments.reduce((sum, payment) => {
      if (payment.Paid) {
        const room = RoomList.find((r) => r.id === payment.roomId);
        return (
          parseFloat(sum) +
          parseFloat(processValueByCurrency(
            payment.Value,
            room?.Currency || 'ETB',
            payment.Day
          ))
        );
      }
      return sum;
    }, 0);

    const expandedExpenses = generateRecurringExpenses(
      AllExpenses.filter((exp) => exp.branchId === SelectedBranchId),
      startDate,
      endDate
    );

    const expensesByCategory = expandedExpenses.reduce((acc, expense) => {
      const category = expense.category || 'Other';
      if (!acc[category]) {
        acc[category] = {
          preTax: 0,
          postTax: 0,
        };
      }

      const amount = processValueByCurrency(
        expense.price,
        expense.Currency || 'ETB',
        expense.date
      );

      if (expense.beforeTax) {
        acc[category].preTax += amount;
      } else {
        acc[category].postTax += amount;
      }

      return acc;
    }, {} as Record<string, { preTax: number; postTax: number }>);

    const totalPreTaxExpenses = Object.values(expensesByCategory).reduce(
      (sum, { preTax }) => sum + preTax,
      0
    );

    const totalPostTaxExpenses = Object.values(expensesByCategory).reduce(
      (sum, { postTax }) => sum + postTax,
      0
    );
    console.log(totalRentalIncome, totalPreTaxExpenses, "CALCULATED")
    const taxableIncome = totalRentalIncome - totalPreTaxExpenses;
    const taxRate = storageManager.get('taxPercentage') / 100 || 0.15;
    const totalTax = taxableIncome * taxRate;

    const netIncome = taxableIncome - totalTax - totalPostTaxExpenses;

    // Calculate vacancy loss
    const totalPossibleUnits = RoomList.filter(room => room.branchId === SelectedBranchId).length;
    const vacantUnits = RoomList.filter(room => !room.tenantId && room.branchId === SelectedBranchId).length;
    const averageRentPerRoom = totalRentalIncome / RoomList.filter(room => room.tenantId).length;
    const vacancyLoss = vacantUnits * averageRentPerRoom;

    return {
      totalRentalIncome,
      monthlyAverage: totalRentalIncome / 12,
      expensesByCategory,
      totalPreTaxExpenses,
      totalPostTaxExpenses,
      taxableIncome,
      totalTax,
      netIncome,
      unitsManaged: RoomList.length,
      occupiedUnits: RoomList.filter((room) => room.tenantId).length,
      uncollectedAmount: totalUncollectedAmount,
      uncollectedPayments,
      collectionRate:
        (parseFloat(totalRentalIncome) /
          (parseFloat(totalRentalIncome) +
            parseFloat(totalUncollectedAmount))) *
        100,
      totalPossibleUnits,
      vacantUnits,
      vacancyLoss,
    };
  }, [
    startDate,
    endDate,
    predictedPayments,
    AllRoomPayInfo,
    AllRoomPayInfoHistory,
    AllExpenses,
    currencyDisplay,
    SelectedBranchId,
  ]);

  const handleSaveAsImage = async () => {
    const reportElement = document.getElementById('rental-report');
    if (reportElement) {
      const canvas = await html2canvas(reportElement);
      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Rental_Report_${format(
        startDate,
        'yyyy-MM-dd'
      )}_to_${format(endDate, 'yyyy-MM-dd')}.png`;
      link.href = image;
      link.click();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rental-report-wrapper">
      <div className="report-controls-section">
        <div className="date-controls">
          <h2 style={{ margin: '0px', marginBottom: 'var(--10px-V)' }}>
            Report Period
          </h2>
          <div className="report-controls">
            <div className="period-controls">
              <button onClick={() => handlePeriodChange(1)}>1 Month</button>
              <button onClick={() => handlePeriodChange(3)}>3 Months</button>
              <button onClick={() => handlePeriodChange(6)}>6 Months</button>
              <button onClick={() => handlePeriodChange(12)}>1 Year</button>
            </div>

            <div className="date-range">
              <input
                type="date"
                value={format(startDate, 'yyyy-MM-dd')}
                onChange={(e) => setStartDate(new Date(e.target.value))}
              />
              <span>to</span>
              <input
                type="date"
                value={format(endDate, 'yyyy-MM-dd')}
                onChange={(e) => setEndDate(new Date(e.target.value))}
              />
            </div>

            <select
              value={currencyDisplay}
              onChange={(e) =>
                setCurrencyDisplay(e.target.value as typeof currencyDisplay)
              }
              style={{ padding: 'var(--6px-V)' }}
            >
              <option value="ETB_ONLY">Show Only Birr</option>
              <option value="USD_ONLY">Show Only Dollar</option>
              <option value="ALL_ETB">Show All in Birr</option>
              <option value="ALL_USD">Show All in Dollar</option>
            </select>
          </div>
        </div>

        <div className="report-actions">
          <button onClick={handleSaveAsImage} className="action-button">
            Save as Image
          </button>
          <button onClick={handlePrint} className="action-button">
            Print Report
          </button>
        </div>
      </div>

      <div id="rental-report" className="rental-report-container">
        <div className="report-header">
          <h2>Rental Income Report</h2>
        </div>

        {renderReportHeader()}

        <div className="report-sections">
        
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}
          >  <section className="overview-section">
            <h3>Room Summary</h3>
            <div className="overview-stats">
              <div className="stat-item">
                <label>Total Units:</label>
                <span>{reportData.unitsManaged}</span>
              </div>
              <div className="stat-item">
                <label>Occupied Units:</label>
                <span>{reportData.occupiedUnits}</span>
              </div>
              <div className="stat-item">
                <label>Vacancy Rate:</label>
                <span>
                  {(
                    ((reportData.unitsManaged - reportData.occupiedUnits) /
                      reportData.unitsManaged) *
                    100
                  ).toFixed(1)}
                  %
                </span>
              </div>
              <div className="stat-item">
                <label>Average Rent Per Room</label>
                <span>
                  {formatNumberWithSuffix((parseFloat(reportData.totalRentalIncome) / parseFloat(reportData.occupiedUnits)).toFixed(2))}
                  {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                </span>
              </div>
             
            </div>
          </section>
            <section className="income-section">
              <h3>Income Overview</h3>
              <div className="income-stats">
                <div className="stat-item">
                  <label>Total Collected Rental Income:</label>
                  <span className="collected">
                    {formatNumberWithSuffix(reportData.totalRentalIncome)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>
                <div className="stat-item">
                  <label>Uncollected Rental Income:</label>
                  <span className="uncollected">
                    {formatNumberWithSuffix(reportData.uncollectedAmount)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>
                <div className="stat-item">
                  <label>Collection Rate:</label>
                  <span>{reportData.collectionRate.toFixed(1)}%</span>
                </div>
                <div className="stat-item">
                  <label>Monthly Average (Collected):</label>
                  <span>
                    {formatNumberWithSuffix(reportData.monthlyAverage)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>
              </div>
            </section>

            <section className="expenses-section">
              <h3>Expenses Breakdown</h3>
              <div className="expenses-breakdown">
                <h4>Pre-Tax Expenses</h4>
                {Object.entries(reportData.expensesByCategory).map(
                  ([category, amounts]) =>
                    amounts.preTax > 0 && (
                      <div key={`${category}-pre`} className="expense-item">
                        <label>{category}:</label>
                        <span>
                          {formatNumberWithSuffix(amounts.preTax)}
                          {CurrencySign(
                            currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                          )}
                        </span>
                      </div>
                    )
                )}
                <div className="expense-item total">
                  <label>Total Pre-Tax Expenses:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.totalPreTaxExpenses)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>

                <h4>Post-Tax Expenses</h4>
                {Object.entries(reportData.expensesByCategory).map(
                  ([category, amounts]) =>
                    amounts.postTax > 0 && (
                      <div key={`${category}-post`} className="expense-item">
                        <label>{category}:</label>
                        <span>
                          {formatNumberWithSuffix(amounts.postTax)}
                          {CurrencySign(
                            currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                          )}
                        </span>
                      </div>
                    )
                )}
                <div className="expense-item total">
                  <label>Total Post-Tax Expenses:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.totalPostTaxExpenses)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>
              </div>
            </section>
            <section className="overview-section">
  <h3>Room Summary</h3>
  <div className="overview-stats">
    <div className="stat-item">
      <label>Total Units:</label>
      <span>{reportData.unitsManaged}</span>
    </div>
    <div className="stat-item">
      <label>Occupied Units:</label>
      <span>{reportData.occupiedUnits}</span>
    </div>
    <div className="stat-item">
      <label>Vacant Units:</label>
      <span>{reportData.vacantUnits}</span>
    </div>
    <div className="stat-item">
      <label>Occupancy Rate:</label>
      <span>
        {((reportData.occupiedUnits / reportData.unitsManaged) * 100).toFixed(1)}%
      </span>
    </div>
    <div className="stat-item">
      <label>Revenue Per Available Room:</label>
      <span>
        {formatNumberWithSuffix(reportData.totalRentalIncome / reportData.unitsManaged)}
        {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
      </span>
    </div>
    <div className="stat-item">
      <label>Average Rent Per Room:</label>
      <span>
        {formatNumberWithSuffix((reportData.totalRentalIncome / reportData.occupiedUnits).toFixed(2))}
        {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
      </span>
    </div>
    <div className="stat-item">
      <label>Potential Revenue Loss:</label>
      <span>
        {formatNumberWithSuffix(reportData.vacancyLoss)}
        {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
      </span>
    </div>
    <div className="stat-item">
      <label>Room Turnover Rate:</label>
      <span>
        {((reportData.vacantUnits / reportData.unitsManaged) * 100).toFixed(1)}%
      </span>
    </div>
  </div>
</section>
            <section className="summary-section">
              <h3>Financial Summary</h3>
              <div className="summary-stats">
                <div className="stat-item">
                  <label>Gross Income:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.totalRentalIncome)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>

                <div className="stat-item">
                  <label>Pre-Tax Expenses:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.totalPreTaxExpenses)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>

                <div className="stat-item">
                  <label>Taxable Income:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.taxableIncome)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>

                <div className="stat-item">
                  <label>Tax Amount ({storageManager.get("taxPercentage") || 15}%):</label>
                  <span>
                    {formatNumberWithSuffix(reportData.totalTax)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>

                <div className="stat-item">
                  <label>Post-Tax Expenses:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.totalPostTaxExpenses)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>

                <div className="stat-item">
                  <label>Net Income:</label>
                  <span>
                    {formatNumberWithSuffix(reportData.netIncome)}
                    {CurrencySign(
                      currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                    )}
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashRentalIncomeReport;
