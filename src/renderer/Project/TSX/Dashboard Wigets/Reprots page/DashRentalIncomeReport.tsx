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

interface RoomPaymentInfo {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
  tenantId?: string;
}

interface ExpenseCategory {
  preTax: number;
  postTax: number;
}

interface ReportData {
  totalRentalIncome: number;
  preTaxExpenses: number;
  uncollectedPayments: number;
  postTaxExpenses: number;
  totalExpenses: number;
  taxableIncome: number;
  totalTax: number;
  netIncome: number;
  occupiedRooms: number;
  totalRooms: number;
  occupancyRate: number;
  averageMonthlyIncome: number;
  averageMonthlyExpense: number;
  averageRentPerUnit: number;
  expensesByCategory: Record<string, ExpenseCategory>;
  monthsInPeriod: number;
  paymentStats: {
    totalPayments: number;
    totalAmount: number;
  };
}

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
 
  const formatWithOrWIthoutSuffic = (num:any)=>{
    return formatNumberWithSuffix(num);
  
    if(num === 0 || num === '0' ) return 0;
    else return parseFloat(num).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
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
  ): number => {
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
  

  const reportData = useMemo((): ReportData | null => {
    if (!showReport) return null;

    const payments = [...AllRoomPayInfo, ...AllRoomPayInfoHistory].filter(
      (payment) =>
        payment.Day >= startDate.getTime() &&
        payment.Day <= endDate.getTime() &&
        payment.Paid
    );
    const unPaidPayments = [...AllRoomPayInfo, ...AllRoomPayInfoHistory].filter(
      (payment) =>
        payment.Day >= startDate.getTime() &&
        payment.Day <= endDate.getTime() &&
        !payment.Paid
    );

    // Calculate total rental income with currency conversion
    const totalRentalIncome = payments.reduce((sum, payment) => {
      const room = RoomList.find((r) => r.id === payment.roomId);
      return (
        parseFloat(sum) +
        parseFloat(processValueByCurrency(
          payment.Value,
          room?.Currency || 'ETB',
          payment.Day
        )) 
      );
    }, 0);
    console.log(unPaidPayments)
    const uncollectedPayments = unPaidPayments
    .reduce((sum, payment) => {
      const room = RoomList.find((r) => r.id === payment.roomId);
      return (
        parseFloat(sum) +
        parseFloat(processValueByCurrency(
          payment.Value,
          room?.Currency || 'ETB',
          payment.Day
        ))
      );
    }, 0);
    // Calculate vacancy loss
    const vacantRooms = RoomList.filter((r) => !r.tenantId);
    const vacancyLoss = vacantRooms.reduce((total, room) => {
      let currentDate = new Date(startDate);
      let lossForRoom = 0;

      while (currentDate <= endDate) {
        lossForRoom += processValueByCurrency(
          room.price || 0,
          room.Currency || (currencyDisplay.includes('ETB') ? 'ETB' : 'USD'),
          currentDate.getTime()
        );

        // Calculate next payment date based on payment cycle
        switch (room.PaymentCycleType) {
          case '30':
            currentDate = addDays(currentDate, 30);
            break;
          case '15':
            currentDate = addDays(currentDate, 15);
            break;
          case '7':
          case 'weekly':
            currentDate = addDays(currentDate, 7);
            break;
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'Annually':
            currentDate = addYears(currentDate, 1);
            break;
          case 'custom':
            currentDate = addDays(
              currentDate,
              room.PaymentCycleCustomeDays || 30
            );
            break;
          default:
            currentDate = addMonths(currentDate, 1);
        }
      }

      return total + lossForRoom;
    }, 0);

    const avgRoomPrice =
      RoomList.reduce((sum, r) => sum + (r.AgreedPrice || 0), 0) /
      RoomList.length;

    // Calculate total expenses with recurring expenses
    let totalExpenses = 0;
    let totalPreTaxExpenses = 0;
    let totalPostTaxExpenses = 0;

    AllExpenses.forEach((expense) => {
      if (expense.branchId === SelectedBranchId) {
        let expenseAmount = 0;

        if (expense.doesReoccur) {
          // Handle recurring expenses
          let currentDate = new Date(expense.date);
          const endDateForExpense = expense.HasEndDate
            ? new Date(expense.EndDate)
            : endDate;

          while (currentDate <= endDateForExpense && currentDate <= endDate) {
            if (currentDate >= startDate) {
              expenseAmount += processValueByCurrency(
                expense.price,
                expense.Currency || 'ETB',
                currentDate.getTime()
              );
            }

            // Increment date based on recurring type
            if (expense.recurringType === 'Day') {
              currentDate = addDays(currentDate, expense.recurringCycle);
            } else if (expense.recurringType === 'Monthly') {
              currentDate = addMonths(currentDate, expense.recurringCycle);
            } else if (expense.recurringType === 'Yearly') {
              currentDate = addYears(currentDate, expense.recurringCycle);
            }
          }
        } else {
          // Handle one-time expenses
          const expenseDate = new Date(expense.date);
          if (expenseDate >= startDate && expenseDate <= endDate) {
            expenseAmount = processValueByCurrency(
              expense.price,
              expense.Currency || 'ETB',
              expense.date
            );
          }
        }

        if (expense.beforeTax) {
          totalPreTaxExpenses += expenseAmount;
        } else {
          totalPostTaxExpenses += expenseAmount;
        }
        totalExpenses += expenseAmount;
      }
    });

    const taxRate = storageManager.get('taxPercentage') / 100 || 0.15;
    const taxableIncome = totalRentalIncome - totalPreTaxExpenses;
    const totalTax = taxableIncome < 0 ? 0 : taxableIncome * taxRate;
    const netIncome = taxableIncome - totalTax - totalPostTaxExpenses;
    console.log(`Taxable Income: ${taxableIncome}, Total Rental Income: ${totalRentalIncome}, Total Pre-Tax Expenses: ${totalPreTaxExpenses}, Total Tax: ${totalTax}, Net Income: ${netIncome}, Tax Rate: ${taxRate}`);
    // Calculate occupancy metrics
    const occupiedRooms = RoomList.filter((room) => room.tenantId).length;
    const totalRooms = RoomList.length;
    const occupancyRate = (occupiedRooms / totalRooms) * 100;

    // Calculate averages
    const monthsInPeriod = differenceInMonths(endDate, startDate) || 1;
    const averageMonthlyIncome = totalRentalIncome / monthsInPeriod;
    const averageMonthlyExpense = totalExpenses / monthsInPeriod;
    const averageRentPerUnit = occupiedRooms
      ? totalRentalIncome / occupiedRooms / monthsInPeriod
      : 0;

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
      uncollectedPayments: uncollectedPayments,
      totalRentalIncome,
      preTaxExpenses: totalPreTaxExpenses,
      postTaxExpenses: totalPostTaxExpenses,
      totalExpenses,
      taxableIncome,
      totalTax,
      vacancyLoss,
      netIncome,
      occupiedRooms,
      totalRooms,
      occupancyRate,
      averageMonthlyIncome,
      averageMonthlyExpense,
      averageRentPerUnit,
      expensesByCategory: {},
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
    RoomList,
    SelectedBranchId,
  ]);

  const handleGenerateReport = () => {
    setShowReport(true);
  };

  const handlePrint = () => {
    const printContents = document.getElementById('rental-report')?.innerHTML;

    if (printContents) {
      // Create a new hidden iframe
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';

      document.body.appendChild(printFrame);

      // Write the print contents to the iframe
      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(`
                <html>
                    <head>
                        <title>Print Report</title>
                        <style>
                            /* Add any print-specific styles here */
                            body {
                                font-family: Arial, sans-serif;
                            }
                            .DarkTheme {
                                background: white;
                                color: black;
                            }
                        </style>
                    </head>
                    <body>
                        <div id="print-container" class="DarkTheme">
                            ${printContents}
                        </div>
                    </body>
                </html>
            `);
        frameDoc.close();

        // Wait for the content to load before printing
        printFrame.onload = () => {
          try {
            printFrame.contentWindow?.print();
          } catch (error) {
            console.error('Print failed:', error);
          } finally {
            // Remove the iframe after printing
            document.body.removeChild(printFrame);
          }
        };
      }
    }
  };

  const processExpenses = (expenses: expenses[]) => {
    const categories = {
      maintenance: ['Repairs', 'Maintenance', 'Renovation'],
      utilities: ['Electricity', 'Water', 'Gas', 'Internet'],
      services: ['Cleaning', 'Security', 'Management'],
      insurance: ['Property Insurance', 'Liability Insurance'],
      administrative: ['Office Supplies', 'Legal', 'Accounting'],
      marketing: ['Advertising', 'Promotions'],
      other: ['Miscellaneous', 'Other'],
    };

    return Object.entries(categories).reduce(
      (acc, [mainCategory, subCategories]) => {
        acc[mainCategory] = {
          total: 0,
          items: {} as Record<string, number>,
        };

        expenses.forEach((expense) => {
          if (
            subCategories.some((cat) =>
              expense.category?.toLowerCase().includes(cat.toLowerCase())
            )
          ) {
            acc[mainCategory].total += expense.price;
            acc[mainCategory].items[expense.category] =
              (acc[mainCategory].items[expense.category] || 0) + expense.price;
          }
        });

        return acc;
      },
      {} as Record<string, { total: number; items: Record<string, number> }>
    );
  };

  return (
    <div
      className="rental-report-container"
      style={{ background: 'var(--Background-Color)' }}
    >
      <div className="DashboardTotalCollectedTopPart">
        <div className="ShowByContainer">
          <span className="ShowByLabel">Start Date</span>
          <input
            type="date"
            value={format(startDate, 'yyyy-MM-dd')}
            onChange={(e) => setStartDate(new Date(e.target.value))}
            className="YearInput"
            style={{ width: 'var(--120px-V)' }}
          />
        </div>
        <div className="ShowByContainer">
          <span className="ShowByLabel">End Date</span>
          <input
            type="date"
            value={format(endDate, 'yyyy-MM-dd')}
            onChange={(e) => setEndDate(new Date(e.target.value))}
            className="YearInput"
            style={{ width: 'var(--120px-V)' }}
          />
        </div>
        
        <div className="ShowByContainer">
          <span className="ShowByLabel">Currency</span>
          <select
            value={currencyDisplay}
            onChange={(e) =>
              setCurrencyDisplay(e.target.value as typeof currencyDisplay)
            }
            className="ShowBySelect"
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--Border-Color)',
              backgroundColor: 'var(--Secondary-Color)',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}
          >
            <option value="ETB_ONLY">Show Only Birr</option>
            <option value="USD_ONLY">Show Only Dollar</option>
            <option value="ALL_ETB">Show All in Birr</option>
            <option value="ALL_USD">Show All in Dollar</option>
          </select>
        </div>
        <div style={{ display: 'flex', gap: 'var(--10px-V)' }}>
          <button
            onClick={handleGenerateReport}
            className="ShowBySelect"
            style={{
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--Border-Color)',
              backgroundColor: 'var(--Secondary-Color)',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}
          >
            Generate Report
          </button>
          {showReport && (
            <button
              onClick={handlePrint}
              className="ShowBySelect"
              style={{
                padding: '3px 8px',
                borderRadius: '4px',
                border: '1px solid var(--Border-Color)',
                backgroundColor: 'var(--Secondary-Color)',
                color: 'var(--Text-Color)',
                cursor: 'pointer',
              }}
            >
              Print Report
            </button>
          )}
        </div>
      </div>

      {showReport && reportData && (
        <div id="rental-report">
          <div className="report-header">
            <h1>Financial Report</h1>
            <div className="company-info">
              {storageManager
                .get('Branches')
                .find((branch: any) => branch.id === SelectedBranchId)?.name ||
                'Unnamed Building'}
              <br />
              {
                storageManager
                  .get('Branches')
                  .find((branch: any) => branch.id === SelectedBranchId)
                  ?.address
              }
            </div>
            <div className="report-period">
              Reporting Period: {format(startDate, 'MMMM d, yyyy')} -{' '}
              {format(endDate, 'MMMM d, yyyy')}
            </div>
          </div>

          <div className="report-section">
            <h2>1. Overview</h2>
            <ul className="overview-list">
              <li>
                Building Name:{" "}
                {
                  storageManager
                    .get('Branches')
                    .find((branch: any) => branch.id === SelectedBranchId)
                    ?.name
                }
              </li>
              <li>
                Total Units:{" "}
                {reportData.totalRooms}
              </li>
              <li>
                Occupied Units:{" "}
                {reportData.occupiedRooms}
              </li>
              <li>
                Occupancy Rate:{" "}
                {reportData.occupancyRate.toFixed(1)}%
              </li>
            </ul>
          </div>

          <div className="report-section">
            <h2>2. Income</h2>
            <ul className="income-list">
              <li>
                Total Rental Income:{' '}
                {formatWithOrWIthoutSuffic(reportData.totalRentalIncome)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li>
              <li className="sub-item">
                Monthly Average:{' '}
                {formatWithOrWIthoutSuffic(reportData.averageMonthlyIncome)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li>
              <li className="sub-item">
                Vacancy Loss: {formatWithOrWIthoutSuffic(reportData.vacancyLoss)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                {' (due to unoccupied units)'}
              </li>
              {/* <li className="sub-item">
                Uncollected past payments:{' '}
                {formatWithOrWIthoutSuffic(reportData.uncollectedPayments)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li> */}
            </ul>
          </div>

          <div className="report-section">
            <h2>3. Expenses</h2>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                gap: '50px',
              }}
            >
              {/* Before Tax Expenses Column */}
              <ul
                style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'disc',
                  paddingLeft: 'var(--0px-V)',
                }}
                className="expenses-list"
              >
                <li style={{ fontSize: 'var(--15px-V)' }}>
                Before Tax Expenses
                </li>
                {(() => {
                  const expensesArray = Array.isArray(AllExpenses)
                    ? AllExpenses
                    : [];
                  let beforeTaxTotal = 0;

                  const beforeTaxExpenses = expensesArray.reduce(
                    (acc: { [key: string]: number }, expense) => {
                      if (
                        expense.branchId !== SelectedBranchId ||
                        !expense.beforeTax
                      )
                        return acc;

                      let totalAmount = 0;

                      if (expense.doesReoccur) {
                        // Handle recurring expenses
                        let currentDate = new Date(expense.date);
                        const endDateForExpense = expense.HasEndDate
                          ? new Date(expense.EndDate)
                          : endDate;

                        while (
                          currentDate <= endDateForExpense &&
                          currentDate <= endDate
                        ) {
                          if (currentDate >= startDate) {
                            totalAmount += processValueByCurrency(
                              expense.price,
                              expense.Currency || 'ETB',
                              currentDate.getTime()
                            );
                          }

                          // Increment date based on recurring type
                          if (expense.recurringType === 'Day') {
                            currentDate = addDays(
                              currentDate,
                              expense.recurringCycle
                            );
                          } else if (expense.recurringType === 'Monthly') {
                            currentDate = addMonths(
                              currentDate,
                              expense.recurringCycle
                            );
                          } else if (expense.recurringType === 'Yearly') {
                            currentDate = addYears(
                              currentDate,
                              expense.recurringCycle
                            );
                          }
                        }
                      } else {
                        // Handle one-time expenses
                        const expenseDate = new Date(expense.date);
                        if (
                          expenseDate >= startDate &&
                          expenseDate <= endDate
                        ) {
                          totalAmount = processValueByCurrency(
                            expense.price,
                            expense.Currency || 'ETB',
                            expenseDate.getTime()
                          );
                        }
                      }

                      if (totalAmount > 0) {
                        const category = expense.category || 'Uncategorized';
                        acc[category] = (acc[category] || 0) + totalAmount;
                        beforeTaxTotal += totalAmount;
                      }
                      return acc;
                    },
                    {}
                  );

                  return (
                    <>
                      {Object.entries(beforeTaxExpenses).map(
                        ([categoryName, total]) =>
                          total > 0 && (
                            <li
                              key={`before-tax-${categoryName}`}
                              className="expense-category"
                            >
                              <span>{categoryName}: </span>
                              <span>
                                {formatWithOrWIthoutSuffic(total)}{' '}
                                {CurrencySign(
                                  currencyDisplay.includes('ETB')
                                    ? 'ETB'
                                    : 'USD'
                                )}
                              </span>
                            </li>
                          )
                      )}
                      <li className="total-expenses">
                        <strong>Total Before Tax:</strong>{' '}
                        {formatWithOrWIthoutSuffic(beforeTaxTotal)}{' '}
                        {CurrencySign(
                          currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                        )}
                      </li>
                    </>
                  );
                })()}
              </ul>

              {/* After Tax Expenses Column */}
              <ul className="expenses-list" style={{ margin: 0, padding: 0 }}>
                <li style={{ fontSize: 'var(--15px-V)' }}>
                 After Tax Expenses
                </li>
                {(() => {
                  const expensesArray = Array.isArray(AllExpenses)
                    ? AllExpenses
                    : [];
                  let afterTaxTotal = 0;

                  const afterTaxExpenses = expensesArray.reduce(
                    (acc: { [key: string]: number }, expense) => {
                      if (
                        expense.branchId !== SelectedBranchId ||
                        expense.beforeTax
                      )
                        return acc;

                      let totalAmount = 0;

                      if (expense.doesReoccur) {
                        // Handle recurring expenses
                        let currentDate = new Date(expense.date);
                        const endDateForExpense = expense.HasEndDate
                          ? new Date(expense.EndDate)
                          : endDate;

                        while (
                          currentDate <= endDateForExpense &&
                          currentDate <= endDate
                        ) {
                          if (currentDate >= startDate) {
                            totalAmount += processValueByCurrency(
                              expense.price,
                              expense.Currency || 'ETB',
                              currentDate.getTime()
                            );
                          }

                          // Increment date based on recurring type
                          if (expense.recurringType === 'Day') {
                            currentDate = addDays(
                              currentDate,
                              expense.recurringCycle
                            );
                          } else if (expense.recurringType === 'Monthly') {
                            currentDate = addMonths(
                              currentDate,
                              expense.recurringCycle
                            );
                          } else if (expense.recurringType === 'Yearly') {
                            currentDate = addYears(
                              currentDate,
                              expense.recurringCycle
                            );
                          }
                        }
                      } else {
                        // Handle one-time expenses
                        const expenseDate = new Date(expense.date);
                        if (
                          expenseDate >= startDate &&
                          expenseDate <= endDate
                        ) {
                          totalAmount = processValueByCurrency(
                            expense.price,
                            expense.Currency || 'ETB',
                            expenseDate.getTime()
                          );
                        }
                      }

                      if (totalAmount > 0) {
                        const category = expense.category || 'Uncategorized';
                        acc[category] = (acc[category] || 0) + totalAmount;
                        afterTaxTotal += totalAmount;
                      }
                      return acc;
                    },
                    {}
                  );

                  return (
                    <>
                      {Object.entries(afterTaxExpenses).map(
                        ([categoryName, total]) =>
                          total > 0 && (
                            <li
                              key={`after-tax-${categoryName}`}
                              className="expense-category"
                            >
                              <span>{categoryName}: </span>
                              <span>
                                {formatWithOrWIthoutSuffic(total)}{' '}
                                {CurrencySign(
                                  currencyDisplay.includes('ETB')
                                    ? 'ETB'
                                    : 'USD'
                                )}
                              </span>
                            </li>
                          )
                      )}
                      <li className="total-expenses">
                        <strong>Total After Tax:</strong>{' '}
                        {formatWithOrWIthoutSuffic(afterTaxTotal)}{' '}
                        {CurrencySign(
                          currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                        )}
                      </li>
                    </>
                  );
                })()}
              </ul>
            </div>
          </div>

          <div className="report-section">
            <h2>4. Gross and Net Profit</h2>
           
              {/* Net Profit Column */}
              <ul className="profit-list" style={{ margin: 0, padding: 0 }}>
              
                <li>
                  Rental Income:{' '}
                  {formatWithOrWIthoutSuffic(reportData.totalRentalIncome)} {" "} {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </li>
                <li>
                  Before Tax Expenses: -
                  {formatWithOrWIthoutSuffic(reportData.preTaxExpenses)}{" "} {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </li>
                <li>
                  Taxable Income:{' '}
                  {formatWithOrWIthoutSuffic(reportData.taxableIncome)}{" "} {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </li>
                <li>
                  Tax ({storageManager.get('taxPercentage') || 15}%): -
                  {formatWithOrWIthoutSuffic(reportData.totalTax)}{" "} {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </li>
                <li>
                  After Tax Expenses: -
                  {formatWithOrWIthoutSuffic(reportData.postTaxExpenses)} {" "} {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
                </li>
                <li>
                  Net Profit (Taxed income({formatWithOrWIthoutSuffic(reportData.taxableIncome-reportData.totalTax)}) - After tax expenses({formatWithOrWIthoutSuffic(reportData.postTaxExpenses)})):{' '}
                  {formatWithOrWIthoutSuffic(reportData.netIncome)}{' '}
                  {CurrencySign(
                    currencyDisplay.includes('ETB') ? 'ETB' : 'USD'
                  )}
                </li>
              </ul>
          
          </div>

          <div className="report-section summary">
            <h2>5. Summary</h2>
            <ul className="summary-list">
              <li style={{display:"flex", justifyContent:"flex-start"}}>
                <strong style={{marginRight:"5px"}}>Gross Income:</strong>{' '}
                {formatWithOrWIthoutSuffic(reportData.totalRentalIncome)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li>
              <li style={{display:"flex", justifyContent:"flex-start"}}>
                <strong style={{marginRight:"5px"}}>Total Expenses:</strong>{' '}
                {formatWithOrWIthoutSuffic(reportData.totalExpenses)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li>
              <li style={{display:"flex", justifyContent:"flex-start"}}>
                <strong style={{marginRight:"5px"}}>Total Taxes:</strong>{' '}
                {formatWithOrWIthoutSuffic(reportData.totalTax)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li>
              <li style={{display:"flex", justifyContent:"flex-start"}}>
                <strong style={{marginRight:"5px"}}>Net Profit:</strong>{' '}
                {formatWithOrWIthoutSuffic(reportData.netIncome)}{' '}
                {CurrencySign(currencyDisplay.includes('ETB') ? 'ETB' : 'USD')}
              </li>
            </ul>
          </div>

          <div className="report-footer">
            <div className="generated-info">
              Generated on: {format(new Date(), 'MMMM d, yyyy HH:mm')}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashRentalIncomeReport;
