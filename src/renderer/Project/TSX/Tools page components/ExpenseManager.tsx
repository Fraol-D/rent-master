import { addValue, deleteValue, updateValue } from 'Backend/localServerApis';
import React, { useState, useEffect, useRef } from 'react';
import { useAlert } from 'renderer/components/useAlert';
import { useGlobal } from 'renderer/components/GlobalContext';
import { useConfirm } from 'renderer/components/useConfirm';
import { v4 as uuidv4 } from 'uuid';
import {
  CurrencySign,
  GetCurrencyAsOptionsOnSelect,
} from '../Helpers/CurrencySign';
import { formatNumberWithSuffix } from '../Helpers/CurrencySign';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import { addDays } from 'date-fns';
import ExpenseCalendar from './ExpenseCalendar';
interface ExpenseManagerContainerProps {
  setChangeMade: (changeMade: boolean) => void;
  SelectedUserId: string;
  SelectedBranchId: string;
  searchTerm?: string;
  selectedCategory?: string[] | [];
  selectedCurrency?: string;
  minPrice?: number | '';
  maxPrice?: number | '';
  fullBuildingFilter: 'yes' | 'no' | 'all';
  floorFilter: string;
  roomFilter: string;
  beforeTaxFilter: 'yes' | 'no' | 'all';
  reoccurringFilter: 'yes' | 'no' | 'all';
  reoccurringTypeFilter: 'Day' | 'Monthly' | 'Yearly' | 'all';
  startDateFilter: string;
  expenses: expenses[];
  setExpenses: (expenses: expenses[]) => void;
  setEditingExpenseId: (id: string | null) => void;
  setEditedExpense: (expense: expenses | null) => void;
  editingExpenseId: string | null;
  editedExpense: expenses | null;
  reoccurringDayCount: number;
  setReoccurringDayCount: (count: number) => void;
  showExpenseCalendar: boolean;
  setShowExpenseCalendar: (show: boolean) => void;
}

const ExpenseManager = ({
  setChangeMade,
  SelectedUserId,
  SelectedBranchId,
  searchTerm,
  selectedCategory,
  selectedCurrency,
  minPrice,
  maxPrice,
  fullBuildingFilter,
  floorFilter,
  roomFilter,
  beforeTaxFilter,
  reoccurringFilter,
  reoccurringTypeFilter,
  startDateFilter,
  expenses,
  setExpenses,
  setEditingExpenseId,
  setEditedExpense,
  editingExpenseId,
  editedExpense,
  reoccurringDayCount,
  setReoccurringDayCount,
  showExpenseCalendar,
  setShowExpenseCalendar,
}: ExpenseManagerContainerProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const expenseTableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getExpenses();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editingExpenseId &&
        expenseTableRef.current &&
        !expenseTableRef.current.contains(event.target as Node) &&
        !isOnTutorial
      ) {
        saveExpenseChanges();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [editingExpenseId]);

  const getExpenses = async () => {
    const rawExpenses = AllExpenses;

    const mappedExpenses = rawExpenses.map((expense: any) => ({
      id: expense.id,
      name: expense.name,
      description: expense.description,
      price: Number(expense.price),
      fullBuilding: Boolean(expense.fullBuilding),
      floor: Number(expense.floor),
      room: Number(expense.room),
      doesReoccur: Boolean(expense.doesReoccur),
      recurringCycle: Number(expense.recurringCycle),
      date: Number(expense.date),
      recurringType: expense.recurringType as 'Day' | 'Monthly' | 'Yearly',
      HasEndDate: Boolean(expense.HasEndDate),
      EndDate: expense.EndDate ? Number(expense.EndDate) : null,
      sendEmail: Boolean(expense.sendEmail),
      emailTemplate: expense.emailTemplate,
      emailDaysBefore: Number(expense.emailDaysBefore),
      sendSms: Boolean(expense.sendSms),
      smsTemplate: expense.smsTemplate,
      smsDaysBefore: Number(expense.smsDaysBefore),
      emailTo: expense.emailTo,
      smsTo: expense.smsTo,
      Currency: expense.Currency,
      userId: expense.userId,
      branchId: expense.branchId,
      showNotifySettings: Boolean(expense.showNotifySettings),
      beforeTax: Boolean(expense.beforeTax),
      category: expense.category,
    }));

    setExpenses(mappedExpenses);
  };

  const handleEditExpenseChange = (
    field: keyof expenses,
    value: string | number | boolean
  ) => {
    // Add to handleEditExpenseChange

    if (editedExpense) {
      setEditedExpense({ ...editedExpense, [field]: value });
    }
  };

  const saveExpenseChanges = async () => {
    if (editedExpense) {
      setIsSaving(true);
      try {
        await handleEditExpense(
          editedExpense.id,
          editedExpense.name,
          editedExpense.description,
          editedExpense.price || 0,
          editedExpense.fullBuilding || false,
          editedExpense.floor,
          editedExpense.room,
          editedExpense.doesReoccur || false,
          editedExpense.recurringCycle || 10,
          editedExpense.date || Date.now(),
          editedExpense.recurringType || 'Day',
          editedExpense.HasEndDate || false,
          editedExpense.EndDate || null,
          // Add notification fields
          editedExpense.sendEmail || false,
          editedExpense.emailDaysBefore || 0,
          editedExpense.sendSms || false,
          editedExpense.smsDaysBefore || 0,
          editedExpense.emailTo || null,
          editedExpense.smsTo || null,
          editedExpense.Currency || 'ETB',
          editedExpense.category || 'Other',
          editedExpense.beforeTax || false
        );
      } finally {
        setIsSaving(false);
        setEditingExpenseId(null);
        setEditedExpense(null);
      }
    }
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
  };
  const handleEditExpenseClick = (expense: expenses) => {
    if (editingExpenseId === expense.id) {
      saveExpenseChanges();
    } else {
      setEditingExpenseId(expense.id);
      if (isOnTutorial) {
        setTutorialNewExpenseId(expense.id);
      }
      setEditedExpense({ ...expense });
    }
  };
  const { confirm } = useConfirm();

  const [
    ShowDefaultNotificationsSettings,
    setShowDefaultNotificationsSettings,
  ] = useState(false);

  const { showAlert } = useAlert();
  const applyDefaultNotifications = async () => {
    if (sendEmail) {
      if (!emailDaysBefore || emailDaysBefore === '') {
        showAlert('Please enter days before for email notification');
        return;
      }
    }
    if (sendSms) {
      if (!validatePhoneNumber(smsTo)) {
        showAlert('Please enter a valid 10-digit phone number');
        return;
      }

      if (!smsDaysBefore || smsDaysBefore === '') {
        showAlert('Please enter days before for SMS notification');
        return;
      }
    }
    try {
      setEditingExpenseId(null);
      setEditedExpense(null);
      setIsApplyingNotifications(true);
      // Create the notification settings object
      const notificationSettings = {
        sendEmail,

        emailDaysBefore: parseInt(emailDaysBefore) || 0,
        sendSms,

        smsDaysBefore: parseInt(smsDaysBefore) || 0,
        emailTo,
        smsTo,
      };

      // Update all expenses with the new notification settings
      for (const expense of expenses) {
        // Update local database
        for (const [key, value] of Object.entries(notificationSettings)) {
          await updateValue('expenses', expense.id, key, value, setChangeMade);
          setAllExpenses(
            AllExpenses.map((expense) =>
              expense.id === expense.id ? { ...expense, [key]: value } : expense
            )
          );
        }
      }

      // Refresh the expenses list
      await getExpenses();
      setShowDefaultNotificationsSettings(false);
      showAlert(
        'Default notifications applied to all expenses successfully!',
        'success'
      );
    } catch (error) {
      console.error('Error applying default notifications:', error);
      showAlert('Failed to apply default notifications. Please try again.');
    } finally {
      setIsApplyingNotifications(false);
    }
  };
  // Start Generation Here
  const [sendEmail, setSendEmail] = useState(false);
  const [emailDaysBefore, setEmailDaysBefore] = useState(0);
  const [sendSms, setSendSms] = useState(false);
  const [smsDaysBefore, setSmsDaysBefore] = useState(0);
  const [emailTo, setEmailTo] = useState('');
  const [smsTo, setSmsTo] = useState('');
  const [isApplyingNotifications, setIsApplyingNotifications] = useState(false);
  const [isResetingTemplates, setIsResetingTemplates] = useState(false);

  const {
    AllEmailTemplates,
    setAllEmailTemplates,
    AllSmsTemplates,
    setAllSmsTemplates,
    AllExpenses,
    setAllExpenses,
    AllRoomSpecifications,
    setAllRoomSpecifications,
    isOnTutorial,
    setTutorialNewExpenseId,
  } = useGlobal();
  const [showNotifySettings, setShowNotifySettings] = useState<{
    [key: string]: boolean;
  }>({});

  // Add this function to toggle notification settings visibility
  const toggleNotifySettings = (expenseId: string) => {
    setShowNotifySettings((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };
  const calculateNextPayment = (expense: expenses) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const todayTime = today.getTime();

    const StartExpenseDate = new Date(expense.date);
    StartExpenseDate.setHours(0, 0, 0, 0); // Reset time to start of day
    const startTime = StartExpenseDate.getTime();

    const cycle = expense.recurringCycle;
    const cycleType = expense.recurringType;
    const endTime = expense.EndDate;
    const hasEndDate = expense.HasEndDate;
    let nextPayment: number;
    const msPerDay = 86400000; // milliseconds in a day
    let payments = [];

    // First, count the start date payment
    for (let i = 0; i < 30; i++) {
      if (cycleType === 'Day') {
        nextPayment = startTime + i * cycle * msPerDay;
        if (hasEndDate && nextPayment > endTime) {
          break;
        }
        payments.push(nextPayment);
      } else if (cycleType === 'Monthly') {
        const nextDate = new Date(startTime);
        nextDate.setMonth(nextDate.getMonth() + i);
        nextPayment = nextDate.getTime();
        if (hasEndDate && nextPayment > endTime) {
          break;
        }
        payments.push(nextPayment);
      } else if (cycleType === 'Yearly') {
        const nextYearDate = new Date(startTime);
        nextYearDate.setFullYear(nextYearDate.getFullYear() + i);
        nextPayment = nextYearDate.getTime();
        if (hasEndDate && nextPayment > endTime) {
          break;
        }
        payments.push(nextPayment);
      }
    }

    // Find today's or next payment
    const todayPayment = payments.find((payment) => payment === todayTime);
    if (todayPayment) {
      return 'today'; // Return 'today' instead of 0
    }

    const nextPayment2 = payments.find((payment) => payment > todayTime);
    if (!nextPayment2) {
      return null;
    }

    return Math.ceil((nextPayment2 - todayTime) / msPerDay);
  };
  const [exchangeRates, setExchangeRates] = useState<
    Array<{
      id: number;
      rates: number;
    }>
  >([]);
  const handleEditExpense = async (
    id: string,
    name: string,
    description: string,
    price: number,
    fullBuilding: boolean,
    floor: string,
    room: string,
    doesReoccur: boolean,
    recurringCycle: number,
    date: number,
    recurringType: 'Day' | 'Monthly' | 'Yearly',
    HasEndDate: boolean,
    EndDate: number | null,
    sendEmail: boolean = false,
    emailDaysBefore: number = 0,
    sendSms: boolean = false,
    smsDaysBefore: number = 0,
    emailTo: string | null = null,
    smsTo: string | null = null,
    Currency: string = 'ETB',
    category: string = 'Other',
    beforeTax: boolean = false
  ) => {
    const originalExpense = expenses.find((e: { id: string }) => e.id === id);
    if (!originalExpense) return;

    const updatedFields = {
      name,
      description,
      price,
      fullBuilding,
      floor: parseInt(floor) || 0,
      room: parseInt(room) || 0,
      doesReoccur,
      recurringCycle,
      date,
      recurringType,
      HasEndDate,
      EndDate,
      sendEmail,
      emailDaysBefore,
      sendSms,
      smsDaysBefore,
      emailTo,
      smsTo,
      Currency,
      category,
      beforeTax,
    };

    // Update only changed fields
    const changedFields = Object.entries(updatedFields).filter(
      ([key, value]) =>
        originalExpense[key as keyof typeof originalExpense] !== value
    );

    // Update state with all changes
    const updatedExpenses = expenses.map((expense: { id: string }) =>
      expense.id === id ? { ...expense, ...updatedFields } : expense
    );
    setExpenses(updatedExpenses);

    // Save only changed fields to database
    for (const [field, value] of changedFields) {
      await updateValue(
        'expenses',
        id,
        field,
        value,
        setChangeMade,
        originalExpense[field as keyof typeof originalExpense]
      );
      setAllExpenses(updatedExpenses);
    }

    setEditingExpenseId(null);
    setEditedExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    const choice = await confirm(
      'Are you sure you want to delete this expense?',
      {
        title: 'Delete Expense',
        confirmText: 'Delete',
        cancelText: 'Keep',
        type: 'danger',
      }
    );
    if (choice) {
      await deleteValue('expenses', id, setChangeMade);
      setEditingExpenseId(null);
      setEditedExpense(null);
      setExpenses(
        expenses.filter((expense: { id: string }) => expense.id !== id)
      );
    }
  };

  const [sortField, setSortField] = useState<'name' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesSearch = expense.name
        .toLowerCase()
        .includes((searchTerm || '').toLowerCase());

      const matchesCategory =
        selectedCategory.length === 0 || // If no categories selected, show all
        (expense.category && selectedCategory.includes(expense.category));

      const matchesCurrency =
        !selectedCurrency ||
        selectedCurrency === 'all' ||
        expense.Currency === selectedCurrency;

      const matchesPrice =
        (!minPrice || expense.price >= minPrice) &&
        (!maxPrice || expense.price <= maxPrice);

      const matchesBuilding =
        fullBuildingFilter === 'all'
          ? true
          : fullBuildingFilter === 'yes'
          ? expense.fullBuilding
          : !expense.fullBuilding;

      const matchesFloor =
        !floorFilter || expense.floor.toString() === floorFilter;
      const matchesRoom = !roomFilter || expense.room.toString() === roomFilter;

      const matchesBeforeTax =
        beforeTaxFilter === 'all'
          ? true
          : beforeTaxFilter === 'yes'
          ? expense.beforeTax
          : !expense.beforeTax;

      const matchesReoccurring =
        reoccurringFilter === 'all'
          ? true
          : reoccurringFilter === 'yes'
          ? expense.doesReoccur
          : !expense.doesReoccur;

      const matchesReoccurringType =
        reoccurringTypeFilter === 'all'
          ? true
          : expense.recurringType === reoccurringTypeFilter;

      const matchesReoccurringDayCount =
        reoccurringTypeFilter !== 'Day' || !reoccurringDayCount
          ? true
          : expense.recurringCycle ===
            parseInt(reoccurringDayCount.toString(), 10);

      const matchesStartDate =
        !startDateFilter ||
        new Date(expense.date).toISOString().split('T')[0] === startDateFilter;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesCurrency &&
        matchesPrice &&
        matchesBuilding &&
        matchesFloor &&
        matchesRoom &&
        matchesBeforeTax &&
        matchesReoccurring &&
        matchesReoccurringType &&
        matchesReoccurringDayCount &&
        matchesStartDate
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });

  return (
    <>
      {isSaving && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <img
            src={loadingGif}
            style={{
              width: '40px',
              height: '40px',
            }}
          />
        </div>
      )}
      <div
        ref={expenseTableRef}
        style={{
          display: 'flex',
          justifyContent: 'flex-start',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%',
          maxWidth: '95%',
          margin: '0 auto',
          height: '100%',
          position: 'relative',
        }}
        id="expenses-container"
      >
        {/* <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '500%',
            maxWidth: 'var(--800px-V)',
            margin: '0 auto',
            marginTop: 'var(--30px-V)',
          }}
        >
          {/* <h2 style={{fontSize: 'var(--25px-V)'}}>Expense Manager</h2> */}
        {/* <button
            onClick={() => {
              setShowFilters(!showFilters);
              if (showFilters) {
                resetFilters();
              }
            }}
            style={{}}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button> */}
        {/* <button
            onClick={() => {
              // setShowFilters(false);
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
        </div>
        <div
          style={{
            marginBottom: 'var(--20px-V)',
            width: '90%',
            display: 'flex',
            gap: 'var(--10px-V)',
          }}
        ></div> */}
        {/* {showFilters && (
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
        )} */}
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
                      (email: string, index: React.Key | null | undefined) =>
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
                      (sms: string, index: React.Key | null | undefined) =>
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

        {showExpenseCalendar ? (
          <div style={{ marginTop: 'var(--10px-V)' }}>
            <ExpenseCalendar
              expenses={expenses}
              initialMonths={3}
              initialMonthsPast={1}
            />
          </div>
        ) : (
          <>
            {' '}
            <div
              style={{
                width: '100%',
                height: 'calc(100% - var(--60px-V))',
              }}
            >
              <h3
                style={{ margin: 'var(--40px-V) 0 var(--10px-V) 0' }}
                id="recurring-expenses-title"
              >
                Recurring Expenses
              </h3>
              {filteredExpenses.some((expense) => expense.doesReoccur) ? (
                <table className="expense-cards" id="recurring-expenses-table">
                  <thead>
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
                    {filteredExpenses
                      .filter((expense) => expense.doesReoccur)
                      .map(
                        (
                          expense: {
                            id: any;
                            name: any;
                            category?: any;
                            price: any;
                            Currency: any;
                            fullBuilding: any;
                            floor: any;
                            room: any;
                            doesReoccur: any;
                            recurringType: any;
                            recurringCycle: any;
                            date: any;
                            HasEndDate: any;
                            EndDate: any;
                            branchId?: string;
                            description?: string;
                            showNotifySettings?: boolean;
                            userId?: string;
                            sendEmail?: boolean;
                            emailDaysBefore?: number;
                            sendSms?: boolean;
                            smsDaysBefore?: number;
                            emailTo?: string | null;
                            smsTo?: string | null;
                          },
                          index: number
                        ) => (
                          <>
                            <tr
                              key={`${expense.id}-${index}`}
                              id={`${expense.id}-expense-row`}
                              className="expense-card"
                              style={{
                                backgroundColor:
                                  editingExpenseId === expense.id
                                    ? 'var(--Accent-Color20)'
                                    : '',
                              }}
                            >
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
                                  onClick={() =>
                                    handleEditExpenseClick(expense)
                                  }
                                  style={{ marginLeft: 'var(--5px-V)' }}
                                >
                                  {editingExpenseId === expense.id
                                    ? 'Save'
                                    : 'Edit'}
                                </button>
                              </td>

                              <td>
                                {editingExpenseId === expense.id ? (
                                  <>
                                    <textarea
                                      id={`${expense.id}-expense-row-name-input`}
                                      value={editedExpense?.name || ''}
                                      onChange={(e) =>
                                        handleEditExpenseChange(
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      title="Expense Name"
                                      placeholder="Expense Name"
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
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                      }}
                                      id={`${expense.id}-expense-row-category-select`}
                                    >
                                      Category:{' '}
                                      <select
                                        id={`${expense.id}-expense-category-select`}
                                        value={
                                          editedExpense?.category || 'Other'
                                        }
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
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'left',
                                      }}
                                      title="Check this if the expense amount is before tax calculation."
                                      id={`${expense.id}-expense-tax-checkbox`}
                                    >
                                      Before Tax:{' '}
                                      <input
                                        type="checkbox"
                                        checked={
                                          editedExpense?.beforeTax || false
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'beforeTax',
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <span
                                        style={{
                                          fontSize: 'var(--12px-V)',
                                          color: 'var(--Text-Color-Grey)',
                                          width: '50%',
                                          marginLeft: 'var(--5px-V)',
                                        }}
                                      >
                                        Is the expense amount is before tax
                                        calculation.{' '}
                                      </span>
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
                                      {expense.beforeTax
                                        ? 'Before Tax'
                                        : 'After Tax'}{' '}
                                      {expense.category}
                                    </span>
                                  </>
                                )}
                              </td>
                              <td
                                style={{}}
                                id={`${expense.id}-expense-row-currencyPrice-select`}
                              >
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
                                    id={`${expense.id}-expense-location-select`}
                                  >
                                    <label>
                                      Full building:
                                      <input
                                        type="checkbox"
                                        checked={
                                          editedExpense?.fullBuilding || false
                                        }
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
                                                parseInt(e.target.value, 10)
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
                                      <em>
                                        {expense.fullBuilding ? 'Yes' : 'No'}
                                      </em>
                                    </div>
                                    {!expense.fullBuilding && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'row',
                                        }}
                                      >
                                        {' '}
                                        <div
                                          style={{
                                            marginRight: 'var(--10px-V)',
                                          }}
                                        >
                                          Floor.{' '}
                                          <em>{expense.floor || 'N/A'}</em>
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
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}
                                    id={`${expense.id}-expense-recurring-options`}
                                  >
                                    <label style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'left'}}>
                                      Reoccur:
                                      <input
                                        type="checkbox"
                                        checked={
                                          editedExpense?.doesReoccur || false
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'doesReoccur',
                                            e.target.checked
                                          )
                                        }
                                      />
                                    </label>
                                    {editedExpense?.doesReoccur && (
                                      <>
                                        <select
                                          value={
                                            editedExpense?.recurringType ||
                                            'Day'
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'recurringType',
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            padding: 'var(--5px-V)',
                                            marginTop: 'var(--5px-V)',
                                          }}
                                        >
                                          <option value="Day">
                                            By day count
                                          </option>
                                          <option value="Monthly">
                                            Monthly
                                          </option>
                                          <option value="Yearly">Yearly</option>
                                        </select>
                                        {editedExpense?.recurringType ===
                                          'Day' && (
                                          <div
                                            style={{
                                              marginTop: 'var(--5px-V)',
                                            }}
                                          >
                                            Every{' '}
                                            <input
                                              type="number"
                                              value={
                                                editedExpense?.recurringCycle ||
                                                10
                                              }
                                              onChange={(e) =>
                                                handleEditExpenseChange(
                                                  'recurringCycle',
                                                  parseInt(e.target.value, 10)
                                                )
                                              }
                                              style={{
                                                width: 'var(--60px-V)',
                                                padding: 'var(--5px-V)',
                                              }}
                                            />{' '}
                                            days
                                          </div>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}
                                  >
                                    {expense.doesReoccur ? (
                                      <>
                                        <div>
                                          {expense.recurringType === 'Day'
                                            ? `Every ${
                                                expense.recurringCycle
                                              } Day${
                                                expense.recurringCycle !== 1
                                                  ? 's'
                                                  : ''
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
                                          {new Date(
                                            expense.date
                                          ).toLocaleDateString()}
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
                                      </>
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
                                          {new Date(
                                            expense.date
                                          ).toLocaleDateString()}
                                        </div>
                                      </div>
                                    )}
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
                                  <div id={`${expense.id}-expense-dates`}>
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
                                            new Date(
                                              editedExpense?.date || Date.now()
                                            )
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
                                            alignItems:'center',
                                            justifyContent:'left'
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            name=""
                                            id=""
                                            checked={
                                              editedExpense?.HasEndDate || false
                                            }
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
                                                    editedExpense?.EndDate ||
                                                      Date.now()
                                                  )
                                                    .toISOString()
                                                    .split('T')[0]
                                                }
                                                onChange={(e) =>
                                                  handleEditExpenseChange(
                                                    'EndDate',
                                                    new Date(
                                                      e.target.value
                                                    ).getTime()
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
                                  )}</div>
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
                                <div id={`${expense.id}-expense-notifications-button`}>
                                {editingExpenseId === expense.id ? (
                                  <button
                                    onClick={() =>
                                      toggleNotifySettings(expense.id)
                                      }
                                 
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
                                      id={`${expense.id}-expense-notifications-container`}
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
                                            checked={
                                              editedExpense?.sendEmail || false
                                            }
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
                                                  editedExpense?.emailDaysBefore ||
                                                  ''
                                                }
                                                onChange={(e) =>
                                                  handleEditExpenseChange(
                                                    'emailDaysBefore',
                                                    parseInt(e.target.value, 10)
                                                  )
                                                }
                                                style={{
                                                  width: 'var(--30px-V)',
                                                }}
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
                                                      [
                                                        'Enter',
                                                        ' ',
                                                        ',',
                                                      ].includes(e.key)
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
                                                        e.currentTarget.value =
                                                          '';
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
                                                            alignItems:
                                                              'center',
                                                            gap: 'var(--15px-V)',
                                                          }}
                                                        >
                                                          <span>
                                                            {email.trim()}
                                                          </span>
                                                          <button
                                                            onClick={() => {
                                                              const emails = (
                                                                editedExpense?.emailTo ||
                                                                ''
                                                              ).split(',');
                                                              emails.splice(
                                                                index,
                                                                1
                                                              );
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
                                            checked={
                                              editedExpense?.sendSms || false
                                            }
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
                                                  editedExpense?.smsDaysBefore ||
                                                  ''
                                                }
                                                onChange={(e) =>
                                                  handleEditExpenseChange(
                                                    'smsDaysBefore',
                                                    parseInt(e.target.value, 10)
                                                  )
                                                }
                                                style={{
                                                  width: 'var(--30px-V)',
                                                }}
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
                                                    [
                                                      'Enter',
                                                      ' ',
                                                      ',',
                                                    ].includes(e.key)
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
                                                      e.currentTarget.value =
                                                        '';
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
                                                    index:
                                                      | React.Key
                                                      | null
                                                      | undefined
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
                                                          borderRadius:
                                                            'var(--5px-V)',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 'var(--15px-V)',
                                                        }}
                                                      >
                                                        <span>
                                                          {phone.trim()}
                                                        </span>
                                                        <button
                                                          onClick={() => {
                                                            const phones = (
                                                              editedExpense?.smsTo ||
                                                              ''
                                                            ).split(',');
                                                            phones.splice(
                                                              index,
                                                              1
                                                            );
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
                                    {calculateNextPayment(expense) ===
                                    'today' ? (
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
                                        Next payment in:{' '}
                                        {calculateNextPayment(expense)} days
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
                              </div>
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
                                    onClick={() =>
                                      handleDeleteExpense(expense.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </tr>
                            <tr style={{ height: 'var(--10px-V)' }}></tr>
                          </>
                        )
                      )}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    padding: 'var(--20px-V)',
                    textAlign: 'center',
                    color: 'var(--Text-Color-Grey)',
                    fontStyle: 'italic',
                  }}
                >
                  {searchTerm ||
                selectedCategory.length > 0 ||
                selectedCurrency !== 'all' ||
                minPrice ||
                maxPrice ||
                fullBuildingFilter !== 'all' ||
                floorFilter ||
                roomFilter ||
                beforeTaxFilter !== 'all' ||
                reoccurringFilter !== 'all' ||
                reoccurringTypeFilter !== 'all' ||
                reoccurringDayCount ||
                startDateFilter ? 
                    'No recurring expenses found with the current filters' :
                    'Click "Add Expense" to start managing expenses'}
                </div>
              )}

              <hr
                style={{
                  margin: 'var(--30px-V) 0',
                  border: 'none',
                  borderTop: '1px solid var(--Text-Color-20)',
                  width: '100%',
                }}
              />

              <h3
                style={{ margin: 'var(--20px-V) 0 var(--10px-V) 0' }}
                id="one-time-expenses-title"
              >
                One-time Expenses
              </h3>
              {filteredExpenses.some((expense) => !expense.doesReoccur) ? (
                <table className="expense-cards" id="one-time-expenses-table">
                  <thead>
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
                    {filteredExpenses
                      .filter((expense) => !expense.doesReoccur)
                      .map(
                        (
                          expense: {
                            id: any;
                            name: any;
                            category?: any;
                            price: any;
                            Currency: any;
                            fullBuilding: any;
                            floor: any;
                            room: any;
                            doesReoccur: any;
                            recurringType: any;
                            recurringCycle: any;
                            date: any;
                            HasEndDate: any;
                            EndDate: any;
                            branchId?: string;
                            description?: string;
                            showNotifySettings?: boolean;
                            userId?: string;
                            sendEmail?: boolean;
                            emailDaysBefore?: number;
                            sendSms?: boolean;
                            smsDaysBefore?: number;
                            emailTo?: string | null;
                            smsTo?: string | null;
                            beforeTax?: boolean;
                          },
                          index: number
                        ) => (
                          <>
                            <tr
                              key={`${expense.id}-${index}`}
                              id={`${expense.id}-expense-row`}
                              className="expense-card"
                              style={{
                                backgroundColor:
                                  editingExpenseId === expense.id
                                    ? 'var(--Accent-Color20)'
                                    : '',
                              }}
                            >
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
                                  id={`${expense.id}-expense-row-edit-button`}
                                  onClick={() =>
                                    handleEditExpenseClick(expense)
                                  }
                                  style={{ marginLeft: 'var(--5px-V)' }}
                                >
                                  {editingExpenseId === expense.id
                                    ? 'Save'
                                    : 'Edit'}
                                </button>
                              </td>

                              <td>
                                {editingExpenseId === expense.id ? (
                                  <>
                                    <textarea
                                      id={`${expense.id}-expense-row-name-input`}
                                      value={editedExpense?.name || ''}
                                      onChange={(e) =>
                                        handleEditExpenseChange(
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      title="Expense Name"
                                      placeholder="Expense Name"
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
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                      }}
                                      id={`${expense.id}-expense-row-category-select`}
                                    >
                                      Category:{' '}
                                      <select
                                        id={`${expense.id}-expense-category-select`}
                                        value={
                                          editedExpense?.category || 'Other'
                                        }
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
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'left',
                                      }}
                                      title="Check this if the expense amount is before tax calculation."
                                      id={`${expense.id}-expense-tax-checkbox`}
                                    >
                                      Before Tax:{' '}
                                      <input
                                        type="checkbox"
                                        checked={
                                          editedExpense?.beforeTax || false
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'beforeTax',
                                            e.target.checked
                                          )
                                        }
                                      />
                                      <span
                                        style={{
                                          fontSize: 'var(--12px-V)',
                                          color: 'var(--Text-Color-Grey)',
                                          width: '50%',
                                          marginLeft: 'var(--5px-V)',
                                        }}
                                      >
                                        Is the expense amount is before tax
                                        calculation.{' '}
                                      </span>
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
                                      {expense.beforeTax
                                        ? 'Before Tax'
                                        : 'After Tax'}{' '}
                                      {expense.category}
                                    </span>
                                  </>
                                )}
                              </td>
                              <td style={{}} id={`${expense.id}-expense-row-currencyPrice-select`}>
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
                                    }}  id={`${expense.id}-expense-location-select`}
                                  >
                                    <label>
                                      Full building:
                                      <input
                                        type="checkbox"
                                        checked={
                                          editedExpense?.fullBuilding || false
                                        }
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
                                                parseInt(e.target.value, 10)
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
                                      <em>
                                        {expense.fullBuilding ? 'Yes' : 'No'}
                                      </em>
                                    </div>
                                    {!expense.fullBuilding && (
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'row',
                                        }}
                                      >
                                        {' '}
                                        <div
                                          style={{
                                            marginRight: 'var(--10px-V)',
                                          }}
                                        >
                                          Floor.{' '}
                                          <em>{expense.floor || 'N/A'}</em>
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
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}    id={`${expense.id}-expense-recurring-options`}
                                  >
                                    <label style={{display:'flex',flexDirection:'row',alignItems:'center',justifyContent:'left'}}>
                                      Reoccur:
                                      <input
                                        type="checkbox"
                                        checked={
                                          editedExpense?.doesReoccur || false
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'doesReoccur',
                                            e.target.checked
                                          )
                                        }
                                      />
                                    </label>
                                    {editedExpense?.doesReoccur && (
                                      <>
                                        <select
                                          value={
                                            editedExpense?.recurringType ||
                                            'Day'
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'recurringType',
                                              e.target.value
                                            )
                                          }
                                          style={{
                                            padding: 'var(--5px-V)',
                                            marginTop: 'var(--5px-V)',
                                          }}
                                        >
                                          <option value="Day">
                                            By day count
                                          </option>
                                          <option value="Monthly">
                                            Monthly
                                          </option>
                                          <option value="Yearly">Yearly</option>
                                        </select>
                                        {editedExpense?.recurringType ===
                                          'Day' && (
                                          <div
                                            style={{
                                              marginTop: 'var(--5px-V)',
                                            }}
                                          >
                                            Every{' '}
                                            <input
                                              type="number"
                                              value={
                                                editedExpense?.recurringCycle ||
                                                10
                                              }
                                              onChange={(e) =>
                                                handleEditExpenseChange(
                                                  'recurringCycle',
                                                  parseInt(e.target.value, 10)
                                                )
                                              }
                                              style={{
                                                width: 'var(--60px-V)',
                                                padding: 'var(--5px-V)',
                                              }}
                                            />{' '}
                                            days
                                          </div>
                                        )}
                                      </>
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
                                      One Time
                                      <div
                                        style={{
                                          fontSize: 'var(--13px-V)',
                                          color: 'var(--Text-Color-60)',
                                        }}
                                      >
                                        Date:{' '}
                                        {new Date(
                                          expense.date
                                        ).toLocaleDateString()}
                                      </div>
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
                                  <div id={`${expense.id}-expense-dates`}>
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
                                            new Date(
                                              editedExpense?.date || Date.now()
                                            )
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
                                            alignItems:'center',
                                            justifyContent:'left'
                                          }}
                                        >
                                          <input
                                            type="checkbox"
                                            name=""
                                            id=""
                                            checked={
                                              editedExpense?.HasEndDate || false
                                            }
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
                                                    editedExpense?.EndDate ||
                                                      Date.now()
                                                  )
                                                    .toISOString()
                                                    .split('T')[0]
                                                }
                                                onChange={(e) =>
                                                  handleEditExpenseChange(
                                                    'EndDate',
                                                    new Date(
                                                      e.target.value
                                                    ).getTime()
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
                                  </div>
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
                                <div id={`${expense.id}-expense-notifications-button`}>
                                {editingExpenseId === expense.id ? (
                                  <button
                                    onClick={() =>
                                      toggleNotifySettings(expense.id)
                                    }
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
                                      }}   id={`${expense.id}-expense-notifications-container`}
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
                                            checked={
                                              editedExpense?.sendEmail || false
                                            }
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
                                                  editedExpense?.emailDaysBefore ||
                                                  ''
                                                }
                                                onChange={(e) =>
                                                  handleEditExpenseChange(
                                                    'emailDaysBefore',
                                                    parseInt(e.target.value, 10)
                                                  )
                                                }
                                                style={{
                                                  width: 'var(--30px-V)',
                                                }}
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
                                                      [
                                                        'Enter',
                                                        ' ',
                                                        ',',
                                                      ].includes(e.key)
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
                                                        e.currentTarget.value =
                                                          '';
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
                                                            alignItems:
                                                              'center',
                                                            gap: 'var(--15px-V)',
                                                          }}
                                                        >
                                                          <span>
                                                            {email.trim()}
                                                          </span>
                                                          <button
                                                            onClick={() => {
                                                              const emails = (
                                                                editedExpense?.emailTo ||
                                                                ''
                                                              ).split(',');
                                                              emails.splice(
                                                                index,
                                                                1
                                                              );
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
                                            checked={
                                              editedExpense?.sendSms || false
                                            }
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
                                                  editedExpense?.smsDaysBefore ||
                                                  ''
                                                }
                                                onChange={(e) =>
                                                  handleEditExpenseChange(
                                                    'smsDaysBefore',
                                                    parseInt(e.target.value, 10)
                                                  )
                                                }
                                                style={{
                                                  width: 'var(--30px-V)',
                                                }}
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
                                                    [
                                                      'Enter',
                                                      ' ',
                                                      ',',
                                                    ].includes(e.key)
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
                                                      e.currentTarget.value =
                                                        '';
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
                                                    index:
                                                      | React.Key
                                                      | null
                                                      | undefined
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
                                                          borderRadius:
                                                            'var(--5px-V)',
                                                          display: 'flex',
                                                          alignItems: 'center',
                                                          gap: 'var(--15px-V)',
                                                        }}
                                                      >
                                                        <span>
                                                          {phone.trim()}
                                                        </span>
                                                        <button
                                                          onClick={() => {
                                                            const phones = (
                                                              editedExpense?.smsTo ||
                                                              ''
                                                            ).split(',');
                                                            phones.splice(
                                                              index,
                                                              1
                                                            );
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
                                    {calculateNextPayment(expense) ===
                                    'today' ? (
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
                                        Next payment in:{' '}
                                        {calculateNextPayment(expense)} days
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
                              </div>
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
                                    onClick={() =>
                                      handleDeleteExpense(expense.id)
                                    }
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </tr>
                            <tr style={{ height: 'var(--10px-V)' }}></tr>
                          </>
                        )
                      )}
                  </tbody>
                </table>
              ) : (
                <div
                  style={{
                    padding: 'var(--20px-V)',
                    textAlign: 'center',
                    color: 'var(--Text-Color-Grey)',
                    fontStyle: 'italic',
                  }}
                >
                    {searchTerm ||
                selectedCategory.length > 0 ||
                selectedCurrency !== 'all' ||
                minPrice ||
                maxPrice ||
                fullBuildingFilter !== 'all' ||
                floorFilter ||
                roomFilter ||
                beforeTaxFilter !== 'all' ||
                reoccurringFilter !== 'all' ||
                reoccurringTypeFilter !== 'all' ||
                reoccurringDayCount ||
                startDateFilter ? 
                    'No one-time expenses found with the current filters' :
                    'Click "Add Expense" to start managing expenses'}
                </div>
              )}
            </div>
          </>
        )}
      </div>{' '}
      {isApplyingNotifications && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <img
            src={loadingGif}
            alt="Loading..."
            style={{ width: '50px', height: '50px' }}
          />
          <p
            style={{
              color: 'white',
              marginTop: '20px',
              fontSize: 'var(--16px-V)',
              fontWeight: '500',
            }}
          >
            Applying notification settings to all expenses...
          </p>
        </div>
      )}
    </>
  );
};

export default ExpenseManager;
