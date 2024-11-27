import { Input } from '../CustomReactComponents';
import {
  getValuesWithSql,
  updateValue,
  addValue,
} from 'Backend/localServerApis';
import React, { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import CurrencySign, { convertCurrency, formatNumberWithSuffix, GetDefaultCurrency, getRateByDate } from '../CurrencySign';

type PaymentType = {
  id: string;
  ParentDate: number;
  type: string;
  price: number;
  Currency: string;
  custom: boolean;
  paid: boolean;
};

type UtilityDateObject = {
  id: string;
  date: number;
  PaymentTypes: PaymentType[];
  FullComplete: boolean;

  isOpen: boolean;
};

interface props {
  roomType: RoomType;
  TenantList: tenant[];
  setChangeMade: React.Dispatch<React.SetStateAction<number>>;
  selectedUserId: string;
  SelectedBranchId: any;
}

const UtilityPanel: React.FC<props> = ({
  roomType,
  TenantList,
  setChangeMade,
  selectedUserId,
  SelectedBranchId,
}) => {
  const [utilityData, setUtilityData] = useState<UtilityDateObject[]>([]);
  const [visiblePastUtilities, setVisiblePastUtilities] = useState(10);
  const [visibleFutureUtilities, setVisibleFutureUtilities] = useState(10);
  const [tempPrice, setTempPrice] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const SetTheUtilityData = async () => {
      const ListOfUtilities: UtilityDateObject[] = [];

      const paymentDateType =
        roomType.utilityPaymentEvery === 'custom'
          ? roomType.utilityPaymentEveryCustom
          : parseInt(roomType.utilityPaymentEvery);

      const tenant = TenantList.find((t: tenant) => t.id === roomType.tenantId);
      let startDate = new Date(tenant?.startTime || Date.now());
      if (roomType.utilityPaymentUseDifferentStartDate) {
        const utilityPaymentStartDate = new Date(
          roomType.utilityPaymentStartDate
        );
        if (!isNaN(utilityPaymentStartDate.getTime())) {
          startDate = utilityPaymentStartDate;
        }
      }
      console.log(startDate, "TENANT START", tenant?.startTime, "utility payment start", roomType.utilityPaymentStartDate);

      let endDate: Date;
      if (tenant?.SelectedAgreement === 'Open-Ended') {
        endDate = new Date(8640000000000000); // Set to maximum possible date (approximately year 275760)
      } else {
        endDate = new Date(tenant?.endTime || Date.now());
      }

      const today = new Date();
      let currentDate = new Date(startDate);
      let i = 0;

      const utilityDataFromDatabase = await getValuesWithSql(
        'utility_payments',
        `WHERE roomId = '${roomType.id}'`
      );

      // Calculate past utilities from the current date
      while (currentDate >= startDate && i < visiblePastUtilities) {
        const activeUtilities = roomType.utilityPayments.filter(
          (utility) => utility.useThis
        );

        if (activeUtilities.length === 0) {
          break;
        }

        const utilityDateObject: UtilityDateObject = {
          id: uuidv4(),
          date: currentDate.getTime(),
          PaymentTypes: activeUtilities.map((utility) => {
            const existingUtility = utilityDataFromDatabase.find(
              (u: any) =>
                u.type === utility.type &&
                new Date(u.date).toDateString() === currentDate.toDateString()
            );

            const price = existingUtility
              ? existingUtility.custom
                ? existingUtility.price === ''
                  ? parseInt(utility.price)
                  : existingUtility.price
                : parseInt(utility.price)
              : parseInt(utility.price);

            setTempPrice((prev) => ({
              ...prev,
              [existingUtility?.id || uuidv4()]: price.toString(),
            }));

            return {
              id: existingUtility?.id || uuidv4(),
              type: utility.type,
              price: price,
              custom: existingUtility?.custom ? true : utility.alwaysAsk,
              paid: existingUtility?.paid || false,
              Currency:  utility.Currency || GetDefaultCurrency(),
              ParentDate: currentDate.getTime(),
            };
          }),
          FullComplete: activeUtilities.every((utility) => {
            const existingUtility = utilityDataFromDatabase.find(
              (u: any) =>
                u.type === utility.type &&
                new Date(u.date).toDateString() === currentDate.toDateString()
            );
            return existingUtility?.paid || false;
          }),
          isOpen: false,
        };

        ListOfUtilities.unshift(utilityDateObject); // Add to the start of the list

        if (roomType.utilityPaymentEvery === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() - 1);
        } else {
          currentDate.setDate(currentDate.getDate() - paymentDateType);
        }
        i++;
      }

      // Reset currentDate to today for future utilities
      currentDate = new Date(today);
      i = 0;

      while (currentDate <= endDate && i < visibleFutureUtilities) {
        const activeUtilities = roomType.utilityPayments.filter(
          (utility) => utility.useThis
        );

        if (activeUtilities.length === 0) {
          break;
        }

        const utilityDateObject: UtilityDateObject = {
          id: uuidv4(),
          date: currentDate.getTime(),
          PaymentTypes: activeUtilities.map((utility) => {
            const existingUtility = utilityDataFromDatabase.find(
              (u: any) =>
                u.type === utility.type &&
                new Date(u.date).toDateString() === currentDate.toDateString()
            );

            const price = existingUtility
              ? existingUtility.custom
                ? existingUtility.price === ''
                  ? parseInt(utility.price)
                  : existingUtility.price
                : parseInt(utility.price)
              : parseInt(utility.price);

            setTempPrice((prev) => ({
              ...prev,
              [existingUtility?.id || uuidv4()]: price.toString(),
            }));

            return {
              id: existingUtility?.id || uuidv4(),
              type: utility.type,
              price: price,
              custom: existingUtility?.custom ? true : utility.alwaysAsk,
              paid: existingUtility?.paid || false,    Currency:  utility.Currency || GetDefaultCurrency(),
              ParentDate: currentDate.getTime(),
            };
          }),
          FullComplete: activeUtilities.every((utility) => {
            const existingUtility = utilityDataFromDatabase.find(
              (u: any) =>
                u.type === utility.type &&
                new Date(u.date).toDateString() === currentDate.toDateString()
            );
            return existingUtility?.paid || false;
          }),
          isOpen: false,
        };

        ListOfUtilities.push(utilityDateObject);

        if (roomType.utilityPaymentEvery === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + paymentDateType);
        }
        i++;
      }
      const uniqueUtilities = ListOfUtilities.filter(
        (utility, index, self) =>
          index ===
          self.findIndex(
            (u) =>
              new Date(u.date).toDateString() ===
              new Date(utility.date).toDateString()
          )
      );
      ListOfUtilities.length = 0;
      ListOfUtilities.push(...uniqueUtilities);
      console.log(ListOfUtilities);
      setUtilityData(ListOfUtilities);

      // Scroll to the current date
      const currentUtilityIndex = ListOfUtilities.findIndex(
        (utility) =>
          new Date(utility.date).toDateString() === today.toDateString()
      );
      if (currentUtilityIndex !== -1) {
        const element = document.getElementById(
          `utility-${ListOfUtilities[currentUtilityIndex].id}`
        );
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    };

    SetTheUtilityData();
  }, [roomType, TenantList, visiblePastUtilities, visibleFutureUtilities]);

  const handleShowMorePast = () => {
    setVisiblePastUtilities((prevVisible) => prevVisible + 10);
  };

  const handleShowMoreFuture = () => {
    setVisibleFutureUtilities((prevVisible) => prevVisible + 10);
  };

  const toggleUtility = (utilityId: string) => {
    setUtilityData((prevData) =>
      prevData.map((item) =>
        item.id === utilityId ? { ...item, isOpen: !item.isOpen } : item
      )
    );
  };

  const handlePaidChange = async (utilityId: string, paymentId: string) => {
    console.log('handlePaidChange called with:', { utilityId, paymentId });

    let updatedPayment: PaymentType | undefined;
    let changeTo = false;
    setUtilityData((prevData) => {
      console.log('Previous utility data:', prevData);
      const newData = prevData.map((utility) => {
        if (utility.id === utilityId) {
          console.log('Updating utility:', utility);
          const updatedPaymentTypes = utility.PaymentTypes.map((payment) => {
            if (payment.id === paymentId) {
              console.log('Updating payment:', payment);
              changeTo = !payment.paid;
              updatedPayment = { ...payment, paid: !payment.paid };
              return updatedPayment;
            }
            return payment;
          });
          return { ...utility, PaymentTypes: updatedPaymentTypes };
        }
        return utility;
      });
      console.log('New utility data:', newData);
      return newData;
    });

    // Wait for state update to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    setUtilityData((prevData) => {
      return prevData.map((utility) => {
        if (utility.id === utilityId) {
          if (changeTo && utility.PaymentTypes.every((p) => p.paid)) {
            return { ...utility, FullComplete: true };
          } else {
            return { ...utility, FullComplete: false };
          }
        }
        return utility;
      });
    });
    console.log('Fetching existing payment from database');
    const existingPayment = await getValuesWithSql(
      'utility_payments',
      `WHERE id = '${paymentId}'`
    );
    console.log('Existing payment:', existingPayment);

    console.log('Updated payment:', updatedPayment);

    if (updatedPayment) {
      if (existingPayment.length > 0) {
        console.log('Updating existing payment in database');
        await updateValue(
          'utility_payments',
          paymentId,
          'paid',
          updatedPayment.paid ? 1 : 0,
          setChangeMade,
          !updatedPayment.paid ? 1 : 0
        );
      } else {
        console.log('Adding new payment to database');
        await addValue(
          'utility_payments',
          {
            id: paymentId,
            type: updatedPayment.type,
            price: updatedPayment.price || 0,
            custom: updatedPayment.custom ? 1 : 0,
            paid: updatedPayment.paid ? 1 : 0,
            date: updatedPayment.ParentDate,
            Currency: updatedPayment.Currency,
            roomId: roomType.id,
            userId: selectedUserId,
            branchId: SelectedBranchId,
          },
          setChangeMade
        );
      }
    }
    console.log('handlePaidChange completed');
  };

  const handlePaidChangeWithValue = async (
    utilityId: string,
    paymentId: string,
    value: boolean
  ) => {
    console.log('handlePaidChangeWithValue called with:', {
      utilityId,
      paymentId,
      value,
    });

    let updatedPayment: PaymentType | undefined;
    setUtilityData((prevData) => {
      console.log('Previous utility data:', prevData);
      const newData = prevData.map((utility) => {
        if (utility.id === utilityId) {
          console.log('Updating utility:', utility);
          const updatedPaymentTypes = utility.PaymentTypes.map((payment) => {
            if (payment.id === paymentId) {
              console.log('Updating payment:', payment);
              updatedPayment = { ...payment, paid: value };
              return updatedPayment;
            }
            return payment;
          });
          return { ...utility, PaymentTypes: updatedPaymentTypes };
        }
        return utility;
      });
      console.log('New utility data:', newData);
      return newData;
    });

    // Wait for state update to complete
    await new Promise((resolve) => setTimeout(resolve, 0));
    setUtilityData((prevData) => {
      return prevData.map((utility) => {
        if (utility.id === utilityId) {
          if (value && utility.PaymentTypes.every((p) => p.paid)) {
            return { ...utility, FullComplete: true };
          } else {
            return { ...utility, FullComplete: false };
          }
        }
        return utility;
      });
    });
    console.log('Fetching existing payment from database');
    const existingPayment = await getValuesWithSql(
      'utility_payments',
      `WHERE id = '${paymentId}'`
    );
    console.log('Existing payment:', existingPayment);

    console.log('Updated payment:', updatedPayment);

    if (updatedPayment) {
      if (existingPayment.length > 0) {
        console.log('Updating existing payment in database');
        await updateValue(
          'utility_payments',
          paymentId,
          'paid',
          updatedPayment.paid ? 1 : 0,
          setChangeMade,
          !updatedPayment.paid ? 1 : 0
        );
      } else {
        console.log('Adding new payment to database');
        await addValue(
          'utility_payments',
          {
            id: paymentId,
            type: updatedPayment.type,
            price: updatedPayment.price || 0,
            custom: updatedPayment.custom ? 1 : 0,
            paid: updatedPayment.paid ? 1 : 0,
            date: updatedPayment.ParentDate,
            Currency: updatedPayment.Currency,
            roomId: roomType.id,
            userId: selectedUserId,
            branchId: SelectedBranchId,
          },
          setChangeMade
        );
      }
    }
    console.log('handlePaidChangeWithValue completed');
  };

  const handleCustomChange = async (utilityId: string, paymentId: string) => {
    console.log('handleCustomChange called with:', { utilityId, paymentId });

    let updatedPayment: PaymentType | undefined;

    setUtilityData((prevData) => {
      console.log('Previous utility data:', prevData);
      const newData = prevData.map((utility) => {
        if (utility.id === utilityId) {
          console.log('Updating utility:', utility);
          const updatedPaymentTypes = utility.PaymentTypes.map((payment) => {
            if (payment.id === paymentId) {
              console.log('Updating payment:', payment);
              updatedPayment = { ...payment, custom: !payment.custom };
              if (!updatedPayment.custom) {
                const defaultUtility = roomType.utilityPayments.find(
                  (u) => u.type === updatedPayment?.type
                );
                if (defaultUtility) {
                  updatedPayment.price = parseInt(defaultUtility.price);
                }
              }
              return updatedPayment;
            }
            return payment;
          });
          return { ...utility, PaymentTypes: updatedPaymentTypes };
        }
        return utility;
      });
      console.log('New utility data:', newData);
      return newData;
    });

    // Wait for state update to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    console.log('Fetching existing payment from database');
    const existingPayment = await getValuesWithSql(
      'utility_payments',
      `WHERE id = '${paymentId}'`
    );
    console.log('Existing payment:', existingPayment);

    console.log('Updated payment:', updatedPayment);

    if (updatedPayment) {
      if (existingPayment.length > 0) {
        console.log('Updating existing payment in database');
        await updateValue(
          'utility_payments',
          paymentId,
          'custom',
          updatedPayment.custom ? 1 : 0,
          setChangeMade,
          !updatedPayment.custom ? 1 : 0
        );
        if (!updatedPayment.custom) {
          await updateValue(
            'utility_payments',
            paymentId,
            'price',
            updatedPayment.price,
            setChangeMade,
            existingPayment[0].price
          );
        }
      } else {
        console.log('Adding new payment to database');
        await addValue(
          'utility_payments',
          {
            id: paymentId,
            type: updatedPayment.type,
            price: updatedPayment.price || 0,
            custom: updatedPayment.custom ? 1 : 0,
            paid: updatedPayment.paid ? 1 : 0,
            date: updatedPayment.ParentDate,
            Currency: updatedPayment.Currency,
            roomId: roomType.id,
            branchId: SelectedBranchId,
            userId: selectedUserId,
          },
          setChangeMade
        );
      }
    }
    console.log('handleCustomChange completed');
  };

  const handlePriceChange = async (
    utilityId: string,
    paymentId: string,
    newPrice: number
  ) => {
    console.log('handlePriceChange called with:', {
      utilityId,
      paymentId,
      newPrice,
    });

    let updatedPayment: PaymentType | undefined;

    setUtilityData((prevData) => {
      console.log('Previous utility data:', prevData);
      const newData = prevData.map((utility) => {
        if (utility.id === utilityId) {
          console.log('Updating utility:', utility);
          const updatedPaymentTypes = utility.PaymentTypes.map((payment) => {
            if (payment.id === paymentId) {
              console.log('Updating payment:', payment);
              updatedPayment = { ...payment, price: newPrice };
              return updatedPayment;
            }
            return payment;
          });
          return { ...utility, PaymentTypes: updatedPaymentTypes };
        }
        return utility;
      });
      console.log('New utility data:', newData);
      return newData;
    });

    // Wait for state update to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    console.log('Fetching existing payment from database');
    const existingPayment = await getValuesWithSql(
      'utility_payments',
      `WHERE id = '${paymentId}'`
    );
    console.log('Existing payment:', existingPayment);

    console.log('Updated payment:', updatedPayment);

    if (updatedPayment) {
      if (existingPayment.length > 0) {
        console.log('Updating existing payment in database');
        await updateValue(
          'utility_payments',
          paymentId,
          'price',
          newPrice,
          setChangeMade,
          existingPayment[0].price
        );
      } else {
        console.log('Adding new payment to database');
        await addValue(
          'utility_payments',
          {
            id: paymentId,
            type: updatedPayment.type,
            price: newPrice || 0,
            custom: updatedPayment.custom ? 1 : 0,
            paid: updatedPayment.paid ? 1 : 0,
            date: updatedPayment.ParentDate,
            roomId: roomType.id,
            branchId: SelectedBranchId,
            Currency: updatedPayment.Currency,
            userId: selectedUserId,
          },
          setChangeMade
        );
      }
    }
    console.log('handlePriceChange completed');
  };

  const handleFullCompleteChange = async (utilityId: string) => {
    console.log('handleFullCompleteChange called with utilityId:', utilityId);
    let allPaid2 = false;
    let updatedUtilityData;

    setUtilityData((prevData) => {
      console.log('Updating utility data state');
      updatedUtilityData = prevData.map((element) => {
        if (element.id === utilityId) {
          console.log('Found matching utilityId:', utilityId);
          const allPaid = element.PaymentTypes.every((payment) => payment.paid);
          console.log('All payments paid:', allPaid);

          if (allPaid) {
            console.log('Setting all payments to unpaid');
            element.PaymentTypes = element.PaymentTypes.map((payment) => ({
              ...payment,
              paid: false,
            }));
          } else {
            console.log('Setting all payments to paid');
            element.PaymentTypes = element.PaymentTypes.map((payment) => ({
              ...payment,
              paid: true,
            }));
          }
          allPaid2 = !allPaid;
          element.FullComplete = !allPaid;
          console.log('Updated FullComplete status to:', element.FullComplete);
        }
        return element;
      });
      return updatedUtilityData;
    });

    // Wait for state update to complete
    await new Promise((resolve) => setTimeout(resolve, 0));

    updatedUtilityData.forEach((utility) => {
      if (utility.id === utilityId) {
        utility.PaymentTypes.forEach((payment) => {
          console.log(payment.paid, allPaid2);
          handlePaidChangeWithValue(utilityId, payment.id, allPaid2);
        });
      }
    });

    // Sync the state change with the database
    const updatedUtility = updatedUtilityData.find(
      (utility) => utility.id === utilityId
    );
    if (updatedUtility) {
      updatedUtility.PaymentTypes.forEach(async (payment) => {
        await updateValue(
          'utility_payments',
          payment.id,
          'paid',
          payment.paid,
          setChangeMade
        );
      });
    }
  };

  const handleTempPriceChange = (paymentId: string, value: string) => {
    setTempPrice((prev) => ({ ...prev, [paymentId]: value }));
  };

  const handlePriceUpdate = async (utilityId: string, paymentId: string) => {
    const newPrice = parseInt(tempPrice[paymentId] || '0');
    if (!isNaN(newPrice)) {
      await handlePriceChange(utilityId, paymentId, newPrice);
    }
    setTempPrice((prev) => ({ ...prev, [paymentId]: newPrice.toString() }));
  };
  function convertUnixToDateString(unixTimestamp) {
    const date = new Date(unixTimestamp);
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    };
    return date.toLocaleDateString('en-US', options).replace(/,/g, '');
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: 'var(--2px-V)',
        right: 'var(---845px-V)',
        width: 'var(--310px-V)',
        height: '96%',
        backgroundColor: 'var(--Background-Color)',
        boxShadow: 'rgba(0, 0, 0, 0.1) var(---2px-V) var(--0px-V) var(--5px-V)',
        zIndex: '1000',
        padding: 'var(--5px-V)',
        borderRadius: 'var(--5px-V)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'center',
        border: 'var(--1px-V) solid grey',
      }}
    >
      <h2 style={{ margin: '0', width: '100%', textAlign: 'center' }}>
        Utility Panel
      </h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          width: '100%',
        }}
      >
        {visiblePastUtilities >= 10 && (
          <button
            onClick={handleShowMorePast}
            style={{
              marginBottom: 'var(--10px-V)',
              padding: 'var(--5px-V) var(--10px-V)',
              backgroundColor: 'var(--Secondary-Color)',
              color: 'var(--Text-Color)',
              border: 'none',
              borderRadius: 'var(--5px-V)',
              cursor: 'pointer',
            }}
          >
            Show More Past
          </button>
        )}
        {utilityData && utilityData.length > 0 ? (
          utilityData.map((utility: UtilityDateObject, index: number) => (
            <React.Fragment key={utility.id}>
              {(() => {
                const previousUtility = utilityData[index - 1];
                const currentDate = new Date();

                if (
                  (!previousUtility && new Date(utility.date) > currentDate) ||
                  (previousUtility &&
                    new Date(previousUtility.date) < currentDate &&
                    new Date(utility.date) > currentDate)
                ) {
                  return (
                    <>
                      <hr
                        style={{
                          width: '100%',
                          margin: 'var(--5px-V)',
                          border: 'var(--1px-V) solid orange',
                        }}
                      />
                      Current Date: {convertUnixToDateString(Date.now())}
                      <hr
                        style={{
                          width: '100%',
                          margin: 'var(--5px-V)',
                          border: 'var(--1px-V) solid orange',
                        }}
                      />
                    </>
                  );
                } else {
                  return null;
                }
              })()}
              <div
                id={`utility-${utility.id}`}
                style={{
                  width: '96%',
                  background:
                    utility.PaymentTypes.filter((p) => p.paid).length !==
                      utility.PaymentTypes.length &&
                    new Date() > new Date(utility.date)
                      ? 'rgb(255 0 0 / 30%)'
                      : utility.PaymentTypes.filter((p) => p.paid).length ===
                        utility.PaymentTypes.length
                      ? 'var(--Accent-Color50)'
                      : 'var(--Secondary-Color30)',
                  padding: 'var(--5px-V)',
                  marginTop: 'var(--5px-V)',
                  marginBottom: 'var(--5px-V)',
                  borderRadius: 'var(--5px-V)',
                }}
              >
                <p
                  style={{
                    fontSize: 'var(--16px-V)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => toggleUtility(utility.id)}
                >
                  <span>
                    {utility.isOpen ? '▼' : '▶'}{' '}
                    {new Date(utility.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  {utility.PaymentTypes.filter((p) => p.paid).length} /{' '}
                  {utility.PaymentTypes.length}
                </p>
                {utility.isOpen && (
                  <>
                    <table
                      style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: 'var(--14px-V)',
                        paddingLeft: 'var(--10px-V)',
                      }}
                    >
                      <thead
                        style={{
                          height: 'var(--10px-V)',
                        }}
                      >
                        <tr
                          style={{
                            fontSize: 'var(--11px-V)',
                            borderTop:
                              'var(--1px-V) solid var(--Text-Color-Grey)',
                            height: 'var(--10px-V)',
                          }}
                        >
                          <th style={{ textAlign: 'center' }}></th>

                          <th style={{ textAlign: 'center' }}>Custom price</th>
                          <th style={{ textAlign: 'center' }}>Paid</th>
                        </tr>
                      </thead>
                      <tbody>
                        {utility.PaymentTypes.map(
                          (paymentType: PaymentType) => (
                            <tr key={paymentType.id}>
                              <td style={{}}>
                                {'  - '} {paymentType.type}
                              </td>

                              <td style={{ textAlign: 'left' }}>
                                <input
                                  type="checkbox"
                                  checked={paymentType.custom}
                                  title="Custom"
                                  onChange={() =>
                                    handleCustomChange(
                                      utility.id,
                                      paymentType.id
                                    )
                                  }
                                />
                                <input
                                  type="number"
                                  value={
                                    tempPrice[paymentType.id] !== undefined
                                      ? tempPrice[paymentType.id].toString() ===
                                        ''
                                        ? 0
                                        : tempPrice[paymentType.id]
                                      : paymentType.price.toString() === ''
                                      ? 0
                                      : paymentType.price
                                  }
                                  style={{ width: 'var(--70px-V)' }}
                                  onChange={(e) =>
                                    handleTempPriceChange(
                                      paymentType.id,
                                      e.target.value
                                    )
                                  }
                                  onBlur={() =>
                                    handlePriceUpdate(
                                      utility.id,
                                      paymentType.id
                                    )
                                  }
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handlePriceUpdate(
                                        utility.id,
                                        paymentType.id
                                      );
                                    }
                                  }}
                                  disabled={!paymentType.custom}
                                  className={
                                    paymentType.custom
                                      ? 'UtilityPriceInput'
                                      : 'UtilityPriceInputDisabled'
                                  }
                                  />
                                {CurrencySign(paymentType.Currency)}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="checkbox"
                                  checked={paymentType.paid}
                                  onChange={() =>
                                    handlePaidChange(utility.id, paymentType.id)
                                  }
                                />
                              </td>
                            </tr>
                          )
                        )}
                      </tbody>
                    </table>
                    <p
                      style={{
                        marginTop: 'var(--5px-V)',
                        borderTop: 'var(--1px-V) solid var(--Text-Color-Grey)',
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>
                        Total:{' '}
                        {(() => {
  const defaultCurrency = GetDefaultCurrency();
  
  // Convert all amounts to the default currency using date-specific rates
  const total = utility.PaymentTypes.reduce((total, paymentType) => {
    let amount = isNaN(paymentType.price) ? 0 : paymentType.price;
    
    // Only convert if currencies don't match
    if (paymentType.Currency !== defaultCurrency) {
      const { rate, direction } = getRateByDate(paymentType.ParentDate);
      console.log(`Converting ${amount} ${paymentType.Currency} from ${new Date(paymentType.ParentDate).toLocaleDateString()}`);
      console.log(`Using rate: ${rate} (${direction})`);
      
      if (rate) {
        if (paymentType.Currency === 'USD') {
          amount = amount * rate; // Convert USD to ETB
          console.log(`Converted USD to ETB: ${amount}`);
        } else {
          amount = amount / rate; // Convert ETB to USD
          console.log(`Converted ETB to USD: ${amount}`);
        }
      } else {
        console.warn('No rate found for date, using original amount');
      }
    }
    
    return total + amount;
  }, 0);

  return `${formatNumberWithSuffix(total.toLocaleString())} ${CurrencySign(defaultCurrency)}`;
})()}
                        
                      </span>{' '}
                      <span>
                        Done{' '}
                        <input
                          type="checkbox"
                          checked={utility.FullComplete}
                          onChange={() => handleFullCompleteChange(utility.id)}
                        />
                      </span>
                    </p>
                  </>
                )}
              </div>
            </React.Fragment>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--Text-Color-Grey)' }}>
            You can edit utility settings in View Agreement
          </p>
        )}
        {visibleFutureUtilities <= utilityData.length && (
          <button
            onClick={handleShowMoreFuture}
            style={{
              marginTop: 'var(--10px-V)',
              padding: 'var(--5px-V) var(--10px-V)',
              backgroundColor: 'var(--Secondary-Color)',
              color: 'var(--Text-Color)',
              border: 'none',
              borderRadius: 'var(--5px-V)',
              cursor: 'pointer',
            }}
          >
            Show More Future
          </button>
        )}
      </div>
    </div>
  );
};

export default UtilityPanel;
