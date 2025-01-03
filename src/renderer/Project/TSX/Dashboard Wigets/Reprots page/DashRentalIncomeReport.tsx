import React, { useState, useEffect, useMemo } from 'react';
import { useGlobal } from 'renderer/components/GlobalContext';
import {
  startOfYear,
  endOfYear,
  format,
  addMonths,
  subMonths,
  addDays,
  addYears,
  differenceInMonths,
} from 'date-fns';
import { storageManager } from 'renderer/storeManager';
import {
  CurrencySign,
  formatNumberWithSuffix,
  getRateByDate,
} from '../../Helpers/CurrencySign';

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
  const [showReport, setShowReport] = useState(false);

  const {
    AllRoomPayInfo,
    AllRoomPayInfoHistory,
    AllExpenses,
    AllAgreements,
    AllTenants,
  } = useGlobal();

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
      default:
        return value;
    }
  };

  const reportData = useMemo(() => {
    if (!showReport) return null;

    const payments = [...AllRoomPayInfo, ...AllRoomPayInfoHistory].filter(
      (payment) =>
        payment.Day >= startDate.getTime() &&
        payment.Day <= endDate.getTime() &&
        payment.Paid
    );

    const totalRentalIncome = payments.reduce((sum, payment) => {
      const room = RoomList.find((r) => r.id === payment.roomId);
      return (
        sum +
        processValueByCurrency(
          payment.Value,
          room?.Currency || 'ETB',
          payment.Day
        )
      );
    }, 0);

    const expandedExpenses = AllExpenses.filter(
      (exp) => exp.branchId === SelectedBranchId
    ).filter((exp) => {
      const expDate = new Date(exp.date);
      return expDate >= startDate && expDate <= endDate;
    });

    // Split expenses into pre-tax and post-tax
    const { preTaxExpenses, postTaxExpenses } = expandedExpenses.reduce(
      (acc, expense) => {
        const amount = processValueByCurrency(
          expense.price,
          expense.Currency || 'ETB',
          expense.date
        );
        if (expense.beforeTax) {
          acc.preTaxExpenses += amount;
        } else {
          acc.postTaxExpenses += amount;
        }
        return acc;
      },
      { preTaxExpenses: 0, postTaxExpenses: 0 }
    );

    const totalExpenses = preTaxExpenses + postTaxExpenses;
    const taxRate = storageManager.get('taxPercentage') / 100 || 0.15;
    const taxableIncome = totalRentalIncome - preTaxExpenses;
    const totalTax = taxableIncome * taxRate;
    const netIncome = taxableIncome - totalTax - postTaxExpenses;

    const occupiedRooms = RoomList.filter((room) => room.tenantId).length;
    const totalRooms = RoomList.length;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;
    const monthsInPeriod = differenceInMonths(endDate, startDate) || 1;
    const averageMonthlyIncome = totalRentalIncome / monthsInPeriod;
    const averageMonthlyExpense = totalExpenses / monthsInPeriod;
    const averageRentPerUnit = occupiedRooms
      ? totalRentalIncome / occupiedRooms / monthsInPeriod
      : 0;

    // Calculate expense categories
    const expensesByCategory = expandedExpenses.reduce((acc, expense) => {
      const type = expense.category || 'Other';
      if (!acc[type]) {
        acc[type] = {
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
        acc[type].preTax += amount;
      } else {
        acc[type].postTax += amount;
      }
      return acc;
    }, {} as Record<string, { preTax: number; postTax: number }>);

    // Calculate payment statistics
    const paymentStats = payments.reduce(
      (acc, payment) => {
        const room = RoomList.find((r) => r.id === payment.roomId);
        const amount = processValueByCurrency(
          payment.Value,
          room?.Currency || 'ETB',
          payment.Day
        );
        acc.totalPayments++;
        acc.totalAmount += amount;
        return acc;
      },
      { totalPayments: 0, totalAmount: 0 }
    );

    return {
      totalRentalIncome,
      preTaxExpenses,
      postTaxExpenses,
      totalExpenses,
      taxableIncome,
      totalTax,
      netIncome,
      occupiedRooms,
      totalRooms,
      occupancyRate,
      averageMonthlyIncome,
      averageMonthlyExpense,
      averageRentPerUnit,
      expensesByCategory,
      monthsInPeriod,
      paymentStats,
    };
  }, [
    startDate,
    endDate,
    showReport,
    AllRoomPayInfo,
    AllRoomPayInfoHistory,
    AllExpenses,
    currencyDisplay,
  ]);

  const handleGenerateReport = () => {
    setShowReport(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="rental-report-container">
      <div className="report-controls">
        <div className="date-inputs">
          <label>Start Date:</label>
          <input
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => setStartDate(new Date(e.target.value))}
          />
          <label>End Date:</label>
          <input
            type="date"
            value={format(endDate, 'yyyy-MM-dd')}
            onChange={(e) => setEndDate(new Date(e.target.value))}
          />
        </div>
        <div className="currency-select">
          <label>Currency:</label>
          <select
            value={currencyDisplay}
            onChange={(e) =>
              setCurrencyDisplay(e.target.value as typeof currencyDisplay)
            }
          >
            <option value="ETB_ONLY">Show Only Birr</option>
            <option value="USD_ONLY">Show Only Dollar</option>
            <option value="ALL_ETB">Show All in Birr</option>
            <option value="ALL_USD">Show All in Dollar</option>
          </select>
        </div>
        <button onClick={handleGenerateReport}>Generate Report</button>
        {showReport && <button onClick={handlePrint}>Print Report</button>}
      </div>

      {showReport && reportData && (
        <div id="rental-report">
          <div className="report-header">
            <h2>RENTAL INCOME REPORT</h2>
            <div className="report-period">
              <span className="period-label">REPORTING PERIOD</span>
              <span className="period-dates">
                {format(startDate, 'MMMM d, yyyy')} -{' '}
                {format(endDate, 'MMMM d, yyyy')}
              </span>
              <span className="period-duration">
                ({reportData.monthsInPeriod}{' '}
                {reportData.monthsInPeriod === 1 ? 'month' : 'months'})
              </span>
            </div>
          </div>

          <div className="report-grid">
            <div className="report-section">
              <h3>1. INCOME STATEMENT</h3>
              <table className="report-table">
                <tbody>
                  <tr>
                    <td>A. Total Rental Income</td>
                    <td className="amount">
                      {formatNumberWithSuffix(reportData.totalRentalIncome)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>B. Pre-Tax Expenses</td>
                    <td className="amount negative">
                      {formatNumberWithSuffix(reportData.preTaxExpenses)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>C. Taxable Income (A - B)</td>
                    <td className="amount">
                      {formatNumberWithSuffix(reportData.taxableIncome)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      D. Tax Amount ({storageManager.get('taxPercentage') || 15}
                      % of C)
                    </td>
                    <td className="amount negative">
                      {formatNumberWithSuffix(reportData.totalTax)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>E. Post-Tax Expenses</td>
                    <td className="amount negative">
                      {formatNumberWithSuffix(reportData.postTaxExpenses)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr className="total-row">
                    <td>F. NET INCOME (C - D - E)</td>
                    <td className="amount">
                      {formatNumberWithSuffix(reportData.netIncome)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="report-section">
              <h3>2. MONTHLY AVERAGES</h3>
              <table className="report-table">
                <tbody>
                  <tr>
                    <td>Average Monthly Income</td>
                    <td className="amount">
                      {formatNumberWithSuffix(reportData.averageMonthlyIncome)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Average Monthly Expenses</td>
                    <td className="amount">
                      {formatNumberWithSuffix(reportData.averageMonthlyExpense)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Average Rent per Unit</td>
                    <td className="amount">
                      {formatNumberWithSuffix(reportData.averageRentPerUnit)}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="report-section">
              <h3>3. PROPERTY STATISTICS</h3>
              <table className="report-table">
                <tbody>
                  <tr>
                    <td>A. Total Units</td>
                    <td className="amount">{reportData.totalRooms}</td>
                  </tr>
                  <tr>
                    <td>B. Occupied Units</td>
                    <td className="amount">{reportData.occupiedRooms}</td>
                  </tr>
                  <tr>
                    <td>C. Vacant Units</td>
                    <td className="amount">
                      {reportData.totalRooms - reportData.occupiedRooms}
                    </td>
                  </tr>
                  <tr>
                    <td>D. Occupancy Rate</td>
                    <td className="amount">
                      {reportData.occupancyRate.toFixed(1)}%
                    </td>
                  </tr>
                  <tr>
                    <td>E. Total Payments Received</td>
                    <td className="amount">
                      {reportData.paymentStats.totalPayments}
                    </td>
                  </tr>
                  <tr>
                    <td>F. Average Payment Size</td>
                    <td className="amount">
                      {formatNumberWithSuffix(
                        reportData.paymentStats.totalAmount /
                          reportData.paymentStats.totalPayments
                      )}{' '}
                      {CurrencySign(
                        currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {Object.keys(reportData.expensesByCategory).length > 0 && (
              <div className="report-section">
                <h3>4. EXPENSE BREAKDOWN</h3>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th className="amount">Pre-Tax</th>
                      <th className="amount">Post-Tax</th>
                      <th className="amount">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(reportData.expensesByCategory)
                      .sort(
                        ([, a], [, b]) =>
                          b.preTax + b.postTax - (a.preTax + a.postTax)
                      )
                      .map(([type, amounts]) => (
                        <tr key={type}>
                          <td>{type}</td>
                          <td className="amount">
                            {formatNumberWithSuffix(amounts.preTax)}{' '}
                            {CurrencySign(
                              currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                            )}
                          </td>
                          <td className="amount">
                            {formatNumberWithSuffix(amounts.postTax)}{' '}
                            {CurrencySign(
                              currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                            )}
                          </td>
                          <td className="amount">
                            {formatNumberWithSuffix(
                              amounts.preTax + amounts.postTax
                            )}{' '}
                            {CurrencySign(
                              currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                            )}
                          </td>
                        </tr>
                      ))}
                    <tr className="total-row">
                      <td>TOTAL</td>
                      <td className="amount">
                        {formatNumberWithSuffix(reportData.preTaxExpenses)}{' '}
                        {CurrencySign(
                          currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                        )}
                      </td>
                      <td className="amount">
                        {formatNumberWithSuffix(reportData.postTaxExpenses)}{' '}
                        {CurrencySign(
                          currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                        )}
                      </td>
                      <td className="amount">
                        {formatNumberWithSuffix(reportData.totalExpenses)}{' '}
                        {CurrencySign(
                          currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashRentalIncomeReport;
