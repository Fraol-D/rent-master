import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
interface ExpenseManagerContainerProps {
  // Header controls
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  ShowDefaultNotificationsSettings: boolean;
  setShowDefaultNotificationsSettings: (show: boolean) => void;
  handleAddExpense: () => void;
  resetFilters: () => void;

  // Filter controls
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  maxPrice: number | '';
  setMaxPrice: (price: number | '') => void;
  minPrice: number | '';
  setMinPrice: (price: number | '') => void;
  fullBuildingFilter: 'yes' | 'no' | '';
  setFullBuildingFilter: (filter: 'yes' | 'no' | '') => void;
  floorSearch: string;
  setFloorSearch: (floor: string) => void;
  roomSearch: string;
  setRoomSearch: (room: string) => void;
  doesReoccurFilter: 'yes' | 'no' | '';
  setDoesReoccurFilter: (filter: 'yes' | 'no' | '') => void;
  reoccurDays: string;
  setReoccurDays: (days: string) => void;
  dateFilter: string;
  setDateFilter: (date: string) => void;

  // Notification settings
  sendEmail: boolean;
  setSendEmail: (send: boolean) => void;
  emailTo: string;
  setEmailTo: (email: string) => void;
  emailDaysBefore: number;
  setEmailDaysBefore: (days: number) => void;
  sendSms: boolean;
  setSendSms: (send: boolean) => void;
  smsTo: string;
  setSmsTo: (sms: string) => void;
  smsDaysBefore: number;
  setSmsDaysBefore: (days: number) => void;
  applyDefaultNotifications: () => void;

  // Expense data and handlers
  filteredExpenses: Array<expenses>;
  editingExpenseId: string | null;
  editedExpense: expenses | null;
  showNotifySettings: Record<string, boolean>;
  handleEditExpenseClick: (expense: expenses) => void;
  handleEditExpenseChange: (field: keyof expenses, value: any) => void;
  toggleNotifySettings: (id: string) => void;
  handleDeleteExpense: (id: string) => void;
  calculateNextPayment: (expense: expenses) => number | 'today' | null;

  // Utility functions
  GetCurrencyAsOptionsOnSelect: () => JSX.Element[];
  CurrencySign: (currency: string) => string;
  formatNumberWithSuffix: (num: string) => string;
  addDays: (date: Date, days: number) => Date;
}

const ExpenseManager = ({
  // Header control props
  showFilters,
  setShowFilters,
  ShowDefaultNotificationsSettings,
  setShowDefaultNotificationsSettings,
  handleAddExpense,
  resetFilters,

  // Filter control props
  searchTerm,
  setSearchTerm,
  maxPrice,
  setMaxPrice,
  minPrice,
  setMinPrice,
  fullBuildingFilter,
  setFullBuildingFilter,
  floorSearch,
  setFloorSearch,
  roomSearch,
  setRoomSearch,
  doesReoccurFilter,
  setDoesReoccurFilter,
  reoccurDays,
  setReoccurDays,
  dateFilter,
  setDateFilter,

  // Notification setting props
  sendEmail,
  setSendEmail,
  emailTo,
  setEmailTo,
  emailDaysBefore,
  setEmailDaysBefore,
  sendSms,
  setSendSms,
  smsTo,
  setSmsTo,
  smsDaysBefore,
  setSmsDaysBefore,
  applyDefaultNotifications,

  // Expense data and handler props
  filteredExpenses,
  editingExpenseId,
  editedExpense,
  showNotifySettings,
  handleEditExpenseClick,
  handleEditExpenseChange,
  toggleNotifySettings,
  handleDeleteExpense,
  calculateNextPayment,

  // Utility function props
  GetCurrencyAsOptionsOnSelect,
  CurrencySign,
  formatNumberWithSuffix,
  addDays,
}: ExpenseManagerContainerProps) => {
  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 'var(--1200px-V)',
          margin: '0 auto',
          height: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '500%',
            maxWidth: 'var(--800px-V)',
            margin: '0 auto',
          }}
        >
          <h2>Expense Manager</h2>
          <button
            onClick={() => {
              setShowFilters(!showFilters);
              if (showFilters) {
                resetFilters();
              }
            }}
            style={{}}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
          <button
            onClick={() => {
              setShowFilters(false);
              setShowDefaultNotificationsSettings(
                !ShowDefaultNotificationsSettings
              );
            }}
            style={{}}
          >
            {ShowDefaultNotificationsSettings
              ? 'Hide Default Expenses Notifications'
              : 'Show Default Expenses Notifications'}
          </button>
          <button onClick={handleAddExpense}>Add Expense</button>
        </div>
        <div
          style={{
            marginBottom: 'var(--20px-V)',
            width: '90%',
            display: 'flex',
            gap: 'var(--10px-V)',
          }}
        ></div>
        {showFilters && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--10px-V)',
              marginBottom: 'var(--20px-V)',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', flex: '1' }}
            ></div>
          </div>
        )}
        {ShowDefaultNotificationsSettings && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div>
                {' '}
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                Send email
              </div>{' '}
              {sendEmail ? (
                <>
                  {' '}
                  <div
                    style={{
                      paddingLeft: 'var(--5px-V)',
                      display: 'flex',
                      flexDirection: 'column',
                      flexWrap: 'wrap',
                      gap: 'var(--5px-V)',
                    }}
                  >
                    {emailTo.split(',').map(
                      (email, index) =>
                        email.trim() && (
                          <div
                            key={index}
                            style={{
                              backgroundColor: 'var(--Secondary-Color30)',
                              justifyContent: 'space-between',
                              padding: 'var(--4px-V) var(--8px-V)',
                              borderRadius: 'var(--5px-V)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--15px-V)',
                            }}
                          >
                            <span>{email.trim()}</span>
                            <button
                              onClick={() => {
                                const emails = emailTo.split(',');
                                emails.splice(index, 1);
                                setEmailTo(emails.join(','));
                              }}
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0 4px',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )
                    )}
                    <input
                      type="text"
                      placeholder="Enter email and press Space, Enter or Comma"
                      style={{
                        border: 'none',
                        outline: 'none',
                        height: 'var(--25px-V)',
                      }}
                      onKeyDown={(e) => {
                        if (['Enter', ' ', ','].includes(e.key)) {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (
                            value &&
                            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
                          ) {
                            const emails = emailTo ? emailTo.split(',') : [];
                            emails.push(value);
                            setEmailTo(emails.join(','));
                            e.currentTarget.value = '';
                          } else if (value) {
                            e.currentTarget.setCustomValidity(
                              'Please enter a valid email address'
                            );
                            e.currentTarget.reportValidity();
                          }
                        }
                      }}
                    />
                    <div
                      style={{
                        color: 'red',
                        fontSize: 'var(--12px-V)',
                        marginTop: 'var(--2px-V)',
                      }}
                    >
                      {emailTo &&
                        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                          emailTo.split(',').pop() || ''
                        ) &&
                        'Please enter a valid email address'}
                    </div>
                  </div>
                  {emailTo && (
                    <>
                      <>
                        <input
                          type="number"
                          value={emailDaysBefore}
                          onChange={(e) =>
                            setEmailDaysBefore(parseInt(e.target.value, 10))
                          }
                          placeholder="2"
                          style={{ width: 'var(--40px-V)' }}
                        />
                        <span> days before expense.</span>
                      </>
                    </>
                  )}
                </>
              ) : (
                <></>
              )}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                marginTop: 'var(--10px-V)',
              }}
            >
              <div>
                <input
                  type="checkbox"
                  checked={sendSms}
                  onChange={(e) => setSendSms(e.target.checked)}
                />
                Send SMS
              </div>{' '}
              {sendSms ? (
                <>
                  {' '}
                  <div
                    style={{
                      paddingLeft: 'var(--5px-V)',
                      display: 'flex',
                      flexDirection: 'column',
                      flexWrap: 'wrap',
                      gap: 'var(--5px-V)',
                    }}
                  >
                    {smsTo.split(',').map(
                      (sms, index) =>
                        sms.trim() && (
                          <div
                            key={index}
                            style={{
                              backgroundColor: 'var(--Secondary-Color30)',
                              justifyContent: 'space-between',
                              padding: 'var(--4px-V) var(--8px-V)',
                              borderRadius: 'var(--5px-V)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 'var(--15px-V)',
                            }}
                          >
                            <span>{sms.trim()}</span>
                            <button
                              onClick={() => {
                                const smses = smsTo.split(',');
                                smses.splice(index, 1);
                                setSmsTo(smses.join(','));
                              }}
                              style={{
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0 4px',
                              }}
                            >
                              ×
                            </button>
                          </div>
                        )
                    )}
                    <input
                      type="text"
                      placeholder="Enter 10-digit phone number"
                      style={{
                        border: 'none',
                        outline: 'none',
                        height: 'var(--25px-V)',
                      }}
                      onKeyDown={(e) => {
                        if (['Enter', ' ', ','].includes(e.key)) {
                          e.preventDefault();
                          const value = e.currentTarget.value.trim();
                          if (
                            value &&
                            value.length === 10 &&
                            /^\d+$/.test(value)
                          ) {
                            const smses = smsTo ? smsTo.split(',') : [];
                            smses.push(value);
                            setSmsTo(smses.join(','));
                            e.currentTarget.value = '';
                          } else if (value) {
                            e.currentTarget.setCustomValidity(
                              'Please enter a valid 10-digit phone number'
                            );
                            e.currentTarget.reportValidity();
                          }
                        }
                      }}
                    />
                    <div
                      style={{
                        color: 'red',
                        fontSize: 'var(--12px-V)',
                        marginTop: 'var(--2px-V)',
                      }}
                    >
                      {smsTo &&
                        !/^\d{10}$/.test(smsTo.split(',').pop() || '') &&
                        'Please enter a valid 10-digit phone number'}
                    </div>
                  </div>
                  {smsTo && (
                    <>
                      <>
                        <input
                          type="number"
                          value={smsDaysBefore}
                          onChange={(e) =>
                            setSmsDaysBefore(parseInt(e.target.value, 10))
                          }
                          placeholder="2"
                          style={{ width: 'var(--40px-V)' }}
                        />
                        <span> days before expense.</span>
                      </>
                    </>
                  )}
                </>
              ) : (
                <></>
              )}
            </div>

            <button
              style={{
                width: 'var(--180px-V)',
                marginTop: 'var(--10px-V)',
              }}
              onClick={applyDefaultNotifications}
            >
              Apply To All
            </button>
          </div>
        )}
        <div
          style={{
            overflowX: 'auto',
            width: '100%',
            height: 'calc(100% - 150px)',
          }}
        >
          <table className="expense-cards">
            <thead>
              <tr>
                <th style={{ width: '5%' }}></th>
                <th style={{ width: '30%' }}>
                  {' '}
                  {showFilters && (
                    <input
                      type="text"
                      placeholder="Search expenses"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: 'var(--5px-V)', width: '60%' }}
                    />
                  )}
                </th>
                <th style={{ width: '10%' }}>
                  {' '}
                  {showFilters && (
                    <>
                      <input
                        type="number"
                        placeholder="Max Price"
                        value={maxPrice}
                        onChange={(e) =>
                          setMaxPrice(
                            e.target.value ? parseFloat(e.target.value) : ''
                          )
                        }
                        style={{
                          flex: '1',
                          padding: 'var(--5px-V)',
                          width: 'var(--80px-V)',
                        }}
                      />
                      <input
                        type="number"
                        placeholder="Min Price"
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value ? parseFloat(e.target.value) : ''
                          )
                        }
                        style={{
                          flex: '1',
                          padding: 'var(--5px-V)',
                          width: 'var(--80px-V)',
                        }}
                      />
                    </>
                  )}
                </th>
                <th style={{ textAlign: 'center' }}>
                  {showFilters && (
                    <>
                      <select
                        value={fullBuildingFilter}
                        onChange={(e) =>
                          setFullBuildingFilter(
                            e.target.value as 'yes' | 'no' | ''
                          )
                        }
                        style={{ flex: '1', padding: 'var(--5px-V)' }}
                      >
                        <option value="">Full Building</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      <br />
                      <input
                        type="text"
                        placeholder="Floor"
                        value={floorSearch}
                        onChange={(e) => setFloorSearch(e.target.value)}
                        style={{
                          flex: '1',
                          padding: 'var(--5px-V)',
                          width: 'var(--40px-V)',
                        }}
                      />{' '}
                      <input
                        type="text"
                        placeholder="Room"
                        value={roomSearch}
                        onChange={(e) => setRoomSearch(e.target.value)}
                        style={{
                          flex: '1',
                          padding: 'var(--5px-V)',
                          width: 'var(--40px-V)',
                        }}
                      />
                    </>
                  )}
                </th>
                <th>
                  {' '}
                  {showFilters && (
                    <>
                      <select
                        value={doesReoccurFilter}
                        onChange={(e) =>
                          setDoesReoccurFilter(
                            e.target.value as 'yes' | 'no' | ''
                          )
                        }
                        style={{ flex: '1', padding: 'var(--5px-V)' }}
                      >
                        <option value="">Does Reoccur</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      <input
                        type="text"
                        placeholder="Reoccur every X days"
                        value={reoccurDays}
                        onChange={(e) => setReoccurDays(e.target.value)}
                        style={{
                          flex: '1',
                          padding: 'var(--5px-V)',
                          width: 'var(--150px-V)',
                        }}
                      />
                    </>
                  )}
                </th>
                <th>
                  {showFilters && (
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ flex: '1', padding: 'var(--5px-V)' }}
                      />
                      <button
                        onClick={() => setDateFilter('')}
                        style={{
                          padding: 'var(--5px-V)',

                          color: 'white',
                          border: 'none',
                          borderRadius: 'var(--5px-V)',
                          cursor: 'pointer',
                          marginLeft: 'var(--5px-V)',
                        }}
                      >
                        X
                      </button>
                    </div>
                  )}
                </th>
              </tr>
              <tr>
                <th style={{ width: '7%' }}>No.</th>
                <th style={{ width: '30%' }}>Expense</th>
                <th style={{ width: '10%' }}>Price</th>
                <th>Room</th>
                <th>Reoccur</th>
                {editingExpenseId !== null && <th>Date</th>}
                <th>Notify</th>
                {editingExpenseId !== null && <th>Actions</th>}
              </tr>
            </thead>

            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr key={uuidv4()}>
                  <td
                    colSpan={editingExpenseId !== null ? 7 : 6}
                    style={{ textAlign: 'center' }}
                  >
                    There are currently no expenses to display. Please add an
                    expense or adjust your filters to see results.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <>
                    <tr key={`${expense.id}-${index}`} className="expense-card">
                      <td
                        style={{
                          borderRadius:
                            'var(--10px-V) var(--0px-V) var(--0px-V) var(--10px-V)',
                          textAlign: 'center',
                        }}
                      >
                        {index + 1}.
                        <button
                          className="email-template-buttons-button"
                          onClick={() => handleEditExpenseClick(expense)}
                          style={{ marginLeft: 'var(--5px-V)' }}
                        >
                          {editingExpenseId === expense.id ? 'Save' : 'Edit'}
                        </button>
                      </td>

                      <td>
                        {editingExpenseId === expense.id ? (
                          <>
                            <textarea
                              value={editedExpense?.name || ''}
                              onChange={(e) =>
                                handleEditExpenseChange('name', e.target.value)
                              }
                              title='Expense Name'
                              placeholder='Expense Name'
                              style={{
                                width: '95%',
                                height: 'var(--50px-V)',
                                padding: 'var(--5px-V)',
                                color: 'var(--Text-Color)',
                                resize: 'vertical',
                                maxHeight: 'var(--50px-V)',
                              }}
                            />
                            <div
                              style={{ display: 'flex', flexDirection: 'row' }}
                            >
                              Caregory:{' '}
                              <select
                                value={editedExpense?.category || 'Other'}
                                onChange={(e) =>
                                  handleEditExpenseChange(
                                    'category',
                                    e.target.value
                                  )
                                }
                                style={{}}
                              >
                                <option
                                  value="Property Maintenance"
                                  title="Routine maintenance, Emergency repairs, Cleaning services, Pest control, Landscaping/grounds maintenance"
                                >
                                  Property Maintenance & Repairs
                                </option>
                                <option
                                  value="Utilities"
                                  title="Electricity, Water, Gas, Internet/Cable, Garbage collection"
                                >
                                  Utilities
                                </option>
                                <option
                                  value="Administrative"
                                  title="Office supplies, Software subscriptions, Legal fees, Insurance, Accounting services, Marketing/Advertising"
                                >
                                  Administrative Costs
                                </option>
                                <option
                                  value="Staff"
                                  title="Property manager salary, Maintenance staff, Security personnel, Cleaning staff, Administrative staff"
                                >
                                  Staff/Labor
                                </option>
                                <option
                                  value="Taxes"
                                  title="Property taxes, Building insurance, Liability insurance, Workers compensation"
                                >
                                  Property Taxes & Insurance
                                </option>
                                <option
                                  value="Capital"
                                  title="Renovations, Appliance replacements, Infrastructure upgrades, Building improvements"
                                >
                                  Capital Improvements
                                </option>
                                <option
                                  value="Financial"
                                  title="Mortgage payments, Loan interest, Bank fees, Property assessment fees"
                                >
                                  Mortgage & Financial
                                </option>
                                <option
                                  value="Security"
                                  title="Security systems, Surveillance cameras, Access control systems, Security staff"
                                >
                                  Security
                                </option>
                                <option
                                  value="Professional"
                                  title="Legal consultations, Accounting services, Property inspections, Pest control services"
                                >
                                  Professional Services
                                </option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'center',
                              justifyContent: 'left'
                            }}
                            title='Check this if the expense amount is before tax calculation.'>
                              Before Tax:{' '}
                              <input
                                type="checkbox"
                                checked={editedExpense?.beforeTax || false}
                                onChange={(e) =>
                                  handleEditExpenseChange('beforeTax', e.target.checked)
                                }
                              />
                              <span style={{fontSize: 'var(--10px-V)', color: 'var(--Text-Color-Grey)'}}>
                              Is the expense amount is before tax calculation.                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            {expense.name} <br />{' '}
                            <span
                              style={{
                                fontSize: 'var(--12px-V)',
                                color: 'var(--Text-Color-Grey)',
                              }}
                            >
                              {expense.category}
                            </span>
                          </>
                        )}
                      </td>
                      <td style={{}}>
                        {editingExpenseId === expense.id ? (
                          <>
                            <select
                              value={editedExpense?.Currency}
                              onChange={(e) =>
                                handleEditExpenseChange(
                                  'Currency',
                                  e.target.value
                                )
                              }
                              className="AddANewRoomSelectMid"
                            >
                              {GetCurrencyAsOptionsOnSelect()}
                            </select>
                            <input
                              type="number"
                              value={editedExpense?.price || 0}
                              onChange={(e) =>
                                handleEditExpenseChange(
                                  'price',
                                  parseFloat(e.target.value)
                                )
                              }
                              style={{ width: '70%' }}
                            />
                          </>
                        ) : (
                          `${
                            formatNumberWithSuffix(
                              expense.price.toLocaleString()
                            ) || 0
                          } ${CurrencySign(expense.Currency || 'ETB')}`
                        )}
                      </td>
                      <td>
                        {editingExpenseId === expense.id ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <label>
                              Full building:
                              <input
                                type="checkbox"
                                checked={editedExpense?.fullBuilding || false}
                                onChange={(e) =>
                                  handleEditExpenseChange(
                                    'fullBuilding',
                                    e.target.checked
                                  )
                                }
                              />
                            </label>
                            {!editedExpense?.fullBuilding && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                }}
                              >
                                <label>
                                  Floor:
                                  <input
                                    type="text"
                                    value={editedExpense?.floor || ''}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'floor',
                                        parseInt(e.target.value, 10)
                                      )
                                    }
                                    style={{
                                      width: 'var(--35px-V)',
                                      marginRight: 'var(--10px-V)',
                                    }}
                                  />
                                </label>
                                <label>
                                  Room:
                                  <input
                                    type="text"
                                    value={editedExpense?.room || ''}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'room',
                                        parseInt(e.target.value)
                                      )
                                    }
                                    style={{ width: 'var(--35px-V)' }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                            }}
                          >
                            <div>
                              Full building:{' '}
                              <em>{expense.fullBuilding ? 'Yes' : 'No'}</em>
                            </div>
                            {!expense.fullBuilding && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                }}
                              >
                                {' '}
                                <div style={{ marginRight: 'var(--10px-V)' }}>
                                  Floor. <em>{expense.floor || 'N/A'}</em>
                                </div>
                                <div>
                                  Room. <em>{expense.room || 'N/A'}</em>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {editingExpenseId === expense.id ? (
                          <>
                            Does reoccur:{' '}
                            <input
                              type="checkbox"
                              checked={editedExpense?.doesReoccur || false}
                              name=""
                              id=""
                              onChange={(e) =>
                                handleEditExpenseChange(
                                  'doesReoccur',
                                  e.target.checked
                                )
                              }
                            />
                            {editedExpense?.doesReoccur ? (
                              <>
                                <select
                                  value={editedExpense?.recurringType || 'Day'}
                                  onChange={(e) =>
                                    handleEditExpenseChange(
                                      'recurringType',
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="Day">By day count</option>
                                  <option value="Monthly">Monthly</option>
                                  <option value="Yearly">Yearly</option>
                                </select>
                                <br />
                                {editedExpense?.recurringType === 'Day' ? (
                                  <>
                                    Every{' '}
                                    <input
                                      type="text"
                                      value={
                                        editedExpense?.recurringCycle || ''
                                      }
                                      onChange={(e) =>
                                        handleEditExpenseChange(
                                          'recurringCycle',
                                          e.target.value
                                        )
                                      }
                                      style={{ width: 'var(--40px-V)' }}
                                    />
                                  </>
                                ) : (
                                  <></>
                                )}
                              </>
                            ) : (
                              <></>
                            )}
                          </>
                        ) : expense.doesReoccur ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--5px-V)',
                            }}
                          >
                            <div>
                              {expense.recurringType === 'Day'
                                ? `Every ${expense.recurringCycle} Day${
                                    expense.recurringCycle !== 1 ? 's' : ''
                                  }`
                                : `Recurring: ${expense.recurringType}`}
                            </div>
                            <div
                              style={{
                                fontSize: 'var(--13px-V)',
                                color: 'var(--Text-Color-60)',
                              }}
                            >
                              Start:{' '}
                              {new Date(expense.date).toLocaleDateString()}
                              {expense.HasEndDate && (
                                <>
                                  <br />
                                  End:{' '}
                                  {new Date(
                                    expense.EndDate
                                  ).toLocaleDateString()}
                                </>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div>
                            One Time
                            <div
                              style={{
                                fontSize: 'var(--13px-V)',
                                color: 'var(--Text-Color-60)',
                              }}
                            >
                              Date:{' '}
                              {new Date(expense.date).toLocaleDateString()}
                            </div>
                          </div>
                        )}
                      </td>
                      {editingExpenseId !== null && (
                        <td
                          style={{
                            borderRadius:
                              'var(--0px-V) var(--0px-V) var(--0px-V) var(--0px-V)',
                          }}
                        >
                          {editingExpenseId === expense.id ? (
                            <>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                }}
                              >
                                Start:{' '}
                                <input
                                  type="date"
                                  value={
                                    new Date(editedExpense?.date || Date.now())
                                      .toISOString()
                                      .split('T')[0]
                                  }
                                  onChange={(e) =>
                                    handleEditExpenseChange(
                                      'date',
                                      new Date(e.target.value).getTime()
                                    )
                                  }
                                  style={{ width: '100%' }}
                                />
                              </div>
                              {editedExpense?.doesReoccur ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    name=""
                                    id=""
                                    checked={editedExpense?.HasEndDate || false}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'HasEndDate',
                                        e.target.checked
                                      )
                                    }
                                  />
                                  {editedExpense?.HasEndDate ? (
                                    <>
                                      End:
                                      <input
                                        type="date"
                                        value={
                                          new Date(
                                            editedExpense?.EndDate || Date.now()
                                          )
                                            .toISOString()
                                            .split('T')[0]
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'EndDate',
                                            new Date(e.target.value).getTime()
                                          )
                                        }
                                        style={{ width: '100%' }}
                                      />
                                    </>
                                  ) : (
                                    <>:Enter End date</>
                                  )}
                                </div>
                              ) : (
                                <></>
                              )}
                            </>
                          ) : (
                            new Date(expense.date).toDateString()
                          )}
                        </td>
                      )}
                      <td
                        style={{
                          borderRadius:
                            editingExpenseId === expense.id
                              ? 'var(--0px-V) var(--0px-V) var(--0px-V) var(--0px-V)'
                              : 'var(--0px-V) var(--10px-V) var(--10px-V) var(--0px-V)',
                        }}
                      >
                        {editingExpenseId === expense.id ? (
                          <button
                            onClick={() => toggleNotifySettings(expense.id)}
                            style={{}}
                          >
                            {showNotifySettings[expense.id]
                              ? 'Hide Notifications'
                              : 'Show Notifications'}
                          </button>
                        ) : (
                          <></>
                        )}
                        {showNotifySettings[expense.id] &&
                        expense.id === editingExpenseId ? (
                          <div style={{ width: '0', height: '0' }}>
                            <div
                              style={{
                                background: 'var(--Background-Color)',
                                zIndex: '1',
                                border:
                                  'var(--1px-V) solid var(--Secondary-Color)',
                                padding: 'var(--10px-V)',
                                borderRadius: 'var(--5px-V)',
                                width: 'var(--250px-V)',
                                position: 'relative',
                                right: 'var(--160px-V)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                }}
                              >
                                <div>
                                  <input
                                    type="checkbox"
                                    checked={editedExpense?.sendEmail || false}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'sendEmail',
                                        e.target.checked
                                      )
                                    }
                                  />
                                  Send Email
                                  {editedExpense?.sendEmail && (
                                    <>
                                      :
                                      <input
                                        type="number"
                                        value={
                                          editedExpense?.emailDaysBefore || ''
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'emailDaysBefore',
                                            parseInt(e.target.value, 10)
                                          )
                                        }
                                        style={{ width: 'var(--30px-V)' }}
                                      />
                                      :Days Before
                                    </>
                                  )}{' '}
                                  {editedExpense?.sendEmail && (
                                    <div>
                                      <div
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                        }}
                                      >
                                        Email To:
                                        <input
                                          type="text"
                                          title="Enter email and press Space, Enter or Comma"
                                          placeholder="Enter emails"
                                          style={{
                                            border: 'none',
                                            outline: 'none',
                                            height: 'var(--25px-V)',
                                          }}
                                          onKeyDown={(e) => {
                                            if (
                                              ['Enter', ' ', ','].includes(
                                                e.key
                                              )
                                            ) {
                                              e.preventDefault();
                                              const value =
                                                e.currentTarget.value.trim();
                                              if (value) {
                                                const emails =
                                                  editedExpense?.emailTo
                                                    ? editedExpense.emailTo.split(
                                                        ','
                                                      )
                                                    : [];
                                                emails.push(value);
                                                handleEditExpenseChange(
                                                  'emailTo',
                                                  emails.join(',')
                                                );
                                                e.currentTarget.value = '';
                                              }
                                            }
                                          }}
                                        />
                                      </div>
                                      <div
                                        style={{
                                          width: '100%',
                                          paddingLeft: 'var(--5px-V)',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          flexWrap: 'wrap',
                                          gap: 'var(--5px-V)',
                                        }}
                                      >
                                        {(editedExpense?.emailTo || '')
                                          .split(',')
                                          .map(
                                            (
                                              email: string,
                                              index:
                                                | React.Key
                                                | null
                                                | undefined
                                            ) =>
                                              email.trim() && (
                                                <div
                                                  key={index}
                                                  style={{
                                                    backgroundColor:
                                                      'var(--Secondary-Color30)',
                                                    justifyContent:
                                                      'space-between',
                                                    padding:
                                                      'var(--4px-V) var(--8px-V)',
                                                    borderRadius:
                                                      'var(--5px-V)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--15px-V)',
                                                  }}
                                                >
                                                  <span>{email.trim()}</span>
                                                  <button
                                                    onClick={() => {
                                                      const emails = (
                                                        editedExpense?.emailTo ||
                                                        ''
                                                      ).split(',');
                                                      emails.splice(index, 1);
                                                      handleEditExpenseChange(
                                                        'emailTo',
                                                        emails.join(',')
                                                      );
                                                    }}
                                                    style={{
                                                      border: 'none',
                                                      cursor: 'pointer',
                                                      padding: '0 4px',
                                                    }}
                                                  >
                                                    ×
                                                  </button>
                                                </div>
                                              )
                                          )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <br />
                                <div>
                                  <input
                                    type="checkbox"
                                    checked={editedExpense?.sendSms || false}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'sendSms',
                                        e.target.checked
                                      )
                                    }
                                  />
                                  Send SMS
                                  {editedExpense?.sendSms && (
                                    <>
                                      :
                                      <input
                                        type="number"
                                        value={
                                          editedExpense?.smsDaysBefore || ''
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'smsDaysBefore',
                                            parseInt(e.target.value, 10)
                                          )
                                        }
                                        style={{ width: 'var(--30px-V)' }}
                                      />
                                      :Days Before
                                    </>
                                  )}
                                </div>

                                <span
                                  style={{
                                    fontSize: 'var(--13px-V)',
                                    color: 'var(--Text-Color-Grey)',
                                  }}
                                ></span>

                                {editedExpense?.sendSms && (
                                  <div>
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                      }}
                                    >
                                      {' '}
                                      SMS To:
                                      <input
                                        type="text"
                                        title="Enter phone number and press Space, Enter or Comma"
                                        placeholder="Enter phone number"
                                        style={{
                                          border: 'none',
                                          outline: 'none',
                                          height: 'var(--25px-V)',
                                          width: 'var(--165px-V)',
                                        }}
                                        onKeyDown={(e) => {
                                          if (
                                            ['Enter', ' ', ','].includes(e.key)
                                          ) {
                                            e.preventDefault();
                                            const value =
                                              e.currentTarget.value.trim();
                                            if (value) {
                                              const phones =
                                                editedExpense?.smsTo
                                                  ? editedExpense.smsTo.split(
                                                      ','
                                                    )
                                                  : [];
                                              phones.push(value);
                                              handleEditExpenseChange(
                                                'smsTo',
                                                phones.join(',')
                                              );
                                              e.currentTarget.value = '';
                                            }
                                          }
                                        }}
                                      />
                                    </div>
                                    <div
                                      style={{
                                        width: '100%',
                                        paddingLeft: 'var(--5px-V)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        flexWrap: 'wrap',
                                        gap: 'var(--5px-V)',
                                      }}
                                    >
                                      {(editedExpense?.smsTo || '')
                                        .split(',')
                                        .map(
                                          (
                                            phone: string,
                                            index: React.Key | null | undefined
                                          ) =>
                                            phone.trim() && (
                                              <div
                                                key={index}
                                                style={{
                                                  backgroundColor:
                                                    'var(--Secondary-Color30)',
                                                  justifyContent:
                                                    'space-between',
                                                  padding:
                                                    'var(--4px-V) var(--8px-V)',
                                                  borderRadius: 'var(--5px-V)',
                                                  display: 'flex',
                                                  alignItems: 'center',
                                                  gap: 'var(--15px-V)',
                                                }}
                                              >
                                                <span>{phone.trim()}</span>
                                                <button
                                                  onClick={() => {
                                                    const phones = (
                                                      editedExpense?.smsTo || ''
                                                    ).split(',');
                                                    phones.splice(index, 1);
                                                    handleEditExpenseChange(
                                                      'smsTo',
                                                      phones.join(',')
                                                    );
                                                  }}
                                                  style={{
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '0 4px',
                                                  }}
                                                >
                                                  ×
                                                </button>
                                              </div>
                                            )
                                        )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : editingExpenseId === expense.id ? (
                          <></>
                        ) : calculateNextPayment(expense) === null ? (
                          <>No payments into the future</>
                        ) : (
                          <>
                            {calculateNextPayment(expense) === 'today' ? (
                              <div
                                style={{
                                  color: 'var(--Accent-Color)',
                                  fontWeight: 'bold',
                                }}
                              >
                                Payment Due TODAY!
                              </div>
                            ) : (
                              <>
                                Next payment in: {calculateNextPayment(expense)}{' '}
                                days
                                <br />
                                On{' '}
                                {addDays(
                                  new Date(),
                                  calculateNextPayment(expense)
                                ).toLocaleDateString()}
                              </>
                            )}
                          </>
                        )}
                      </td>

                      {editingExpenseId === expense.id && (
                        <td
                          style={{
                            borderRadius:
                              'var(--0px-V) var(--10px-V) var(--10px-V) var(--0px-V)',
                          }}
                        >
                          <button
                            style={{
                              backgroundColor: 'red',
                              color: 'white',
                            }}
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                    <tr style={{ height: 'var(--10px-V)' }}></tr>
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default ExpenseManager;
