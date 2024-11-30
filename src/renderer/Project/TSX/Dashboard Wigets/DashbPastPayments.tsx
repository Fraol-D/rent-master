import React, { useState, useEffect } from 'react';
import { getValuesWithSql } from 'Backend/localServerApis';
import { addDays, addMonths, startOfYear, endOfYear, addYears } from 'date-fns';
import PaymentProgressBarGUI from '../Helpers/GUIs/PaymentProgressBarGUI';
import { formatNumberWithSuffix, GetDefaultCurrency } from '../Helpers/CurrencySign';

interface Payment {
  id: string;
  Day: number;
  Value: number;
  Paid: boolean;
  roomId: string;
}

const DashbPastPayments = ({
  tenantList,
  RoomList,
  roomPaymentInfoApi,
  setChangeMade,
  updateRoomPropertyLocal,
  updateRoomProperty,
  SelectedUserId,
  SelectedBranchId,
}: {
  tenantList: tenant[];
  RoomList: RoomType[];
  roomPaymentInfoApi: any;
  SelectedBranchId: any;
  setChangeMade: any;
  updateRoomPropertyLocal: any;
  updateRoomProperty: any;
  SelectedUserId: string;
}) => {
  const [PastPaymentList, setPastPaymentList] = useState<
    { tenant: tenant; NumOfPayments: number; PastBy: number }[]
  >([]);
  const [UpcomingPaymentList, setUpcomingPaymentList] = useState<
    { tenant: tenant; DueDate: Date; Amount: number }[]
  >([]);
  const [SelectedTenantViewShow, setSelectedTenantViewShow] = useState('');
  const [activeTab, setActiveTab] = useState('past');
  const [predictedPayments, setPredictedPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const calculatePayments = async () => {
      const allPayments: Payment[] = [];
      const currentYear = new Date().getFullYear();
      const yearStart = startOfYear(addYears(new Date(currentYear, 0, 1), -3));
      const yearEnd = endOfYear(addYears(new Date(currentYear, 11, 31), 3));

      // Get all actual payments for the current year
      const actualPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()} AND branchId = '${SelectedBranchId}'`
      );

      for (const room of RoomList) {
        // Get tenant and agreement details
        const tenant = tenantList.find((t) => t.id === room.tenantId);
        let startDate = tenant?.startTime || Date.now();
        let endDate = null;

        // Handle fixed-term agreements
        if (room.selectedAgreementId) {
          const agreements = await getValuesWithSql(
            'agreements',
            `WHERE id = '${room.selectedAgreementId}'`
          );
          if (agreements.length > 0) {
            startDate = agreements[0].startTime;
            // Set endDate for fixed-term agreements
            if (tenant?.SelectedAgreement === 'Fixed-Term') {
              endDate = agreements[0].endTime;
            }
          }
        }

        let currentDate = new Date(Math.max(startDate, yearStart.getTime()));
        const finalEndDate = endDate
          ? new Date(Math.min(endDate, yearEnd.getTime()))
          : yearEnd;

        while (currentDate <= finalEndDate) {
          const paymentId = `${room.id}-${currentDate.getTime()}`;
          const actualPayment = actualPayments.find(
            (p: any) => p.id === paymentId
          );

          allPayments.push({
            id: paymentId,
            Day: currentDate.getTime(),
            Value: room.AgreedPrice,
            Paid: actualPayment ? actualPayment.Paid === 1 : false,
            roomId: room.id,
          });

          // Calculate next payment date using the same logic as PaymentProgressBarGUI
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
      }

      setPredictedPayments(allPayments);
    };

    calculatePayments();
  }, [RoomList, tenantList]);

  useEffect(() => {
    const currentDate = new Date();

    // Filter past unpaid payments
    const pastPayments = predictedPayments.filter((payment) => {
      const paymentDate = new Date(payment.Day);
      return paymentDate < currentDate && !payment.Paid;
    });

    // Group by tenant with corrected counting
    const newPastPaymentList = pastPayments.reduce((acc, payment) => {
      const room = RoomList.find((r) => r.id === payment.roomId);
      const tenant = tenantList.find((t) => t.id === room?.tenantId);

      if (tenant) {
        const existingTenant = acc.find((item) => item.tenant.id === tenant.id);
        if (existingTenant) {
          // Update existing tenant's data
          existingTenant.NumOfPayments++;
          // Keep the earliest past due date for PastBy calculation
          const paymentDays = Math.floor(
            (currentDate.getTime() - payment.Day) / (1000 * 3600 * 24)
          );
          existingTenant.PastBy = Math.min(existingTenant.PastBy, paymentDays);
        } else {
          // Add new tenant
          acc.push({
            tenant,
            NumOfPayments: 1,
            PastBy: Math.floor(
              (currentDate.getTime() - payment.Day) / (1000 * 3600 * 24)
            ),
          });
        }
      }
      return acc;
    }, [] as { tenant: tenant; NumOfPayments: number; PastBy: number }[]);

    // Filter out tenants with all payments paid
    const filteredPastPaymentList = newPastPaymentList
      .filter((tenantData) => {
        const room = RoomList.find((r) => r.tenantId === tenantData.tenant.id);
        if (!room) return false;

        const tenantPayments = predictedPayments.filter(
          (p) => p.roomId === room.id
        );
        return tenantPayments.some((payment) => !payment.Paid);
      })
      .sort((a, b) => b.PastBy - a.PastBy); // Sort by most overdue first

    setPastPaymentList(filteredPastPaymentList);

    // Update upcoming payments calculation
    const tenDaysFromNow = new Date(
      currentDate.getTime() + 10 * 24 * 60 * 60 * 1000
    );
    const upcomingPayments = predictedPayments.filter((payment) => {
      const paymentDate = new Date(payment.Day);
      return (
        paymentDate >= currentDate &&
        paymentDate <= tenDaysFromNow &&
        !payment.Paid
      );
    });

    const newUpcomingPaymentList = upcomingPayments
      .map((payment) => {
        const room = RoomList.find((r) => r.id === payment.roomId);
        const tenant = tenantList.find((t) => t.id === room?.tenantId);
        if (tenant) {
          return {
            tenant,
            DueDate: new Date(payment.Day),
            Amount: payment.Value,
          };
        }
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.DueDate.getTime() - b!.DueDate.getTime()); // Sort by earliest due date

    setUpcomingPaymentList(newUpcomingPaymentList);
  }, [predictedPayments, RoomList, tenantList]);
  const [ShowReceipt, setShowReceipt] = useState(false);
  const handlePaymentRefresh = async () => {
    const roomType = RoomList.find(
      (room) => room.tenantId === SelectedTenantViewShow
    );

    if (roomType) {
      const listOfPayments = await getValuesWithSql(
        'room_pay_info',
        `WHERE roomId = '${roomType.id}'`
      );

      const updatedRoomPayInfo: RoomPayInfo[] = listOfPayments.map(
        (payment: any) => ({
          id: payment.id,
          roomId: payment.roomId,
          Day: payment.Day,
          Paid: payment.Paid,
          Value: payment.Value,
        })
      );

      const updatedAllRoomPayInfo: AllRoomPayInfo = {
        RoomPayInfo: updatedRoomPayInfo,
      };

      updateRoomPropertyLocal(
        roomType.id,
        'AllRoomPayInfo',
        updatedAllRoomPayInfo
      );
      console.log(updatedAllRoomPayInfo, roomType.AllRoomPayInfo);
    }
  };
  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: 'var(--400px-V)',
        alignItems: 'flex-start',
       
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          width: '100%',
          marginBottom: 'var(--10px-V)',
        }}
      >
        <button
          onClick={() => setActiveTab('past')}
          style={{
            flex: 1,
            padding: 'var(--10px-V)',
            backgroundColor:
              activeTab === 'past'
                ? 'var(--Secondary-Color)'
                : 'var(--Secondary-Color30)',
            cursor: 'pointer',
          }}
        >
          Past Payments
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            flex: 1,
            padding: 'var(--10px-V)',
            backgroundColor:
              activeTab === 'upcoming'
                ? 'var(--Secondary-Color)'
                : 'var(--Secondary-Color30)',
            cursor: 'pointer',
          }}
        >
          Upcoming Payments
        </button>
      </div>
      {activeTab === 'past' ? (
        <>
          <p
            className="DashboardWigetPieChartTextHeader"
            style={{ width: 'var(--400px-V)' }}
          >
            Past Payments
          </p>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table className="InfoTable" style={{ width: '100%',margin:"0px" }}>
              <thead className="InfoTableThead">
                <tr className="InfoTableHeadTR">
                  <th className="InfoTableHeadTh">Tenants</th>
                  <th
                    className="InfoTableHeadTh"
                    style={{ width: 'var(--40px-V)' }}
                  >
                    Num of <br />
                    payment
                  </th>
                  <th
                    className="InfoTableHeadTh"
                    style={{ width: 'var(--50px-V)' }}
                  >
                    Past By
                  </th>
                  <th
                    className="InfoTableHeadTh"
                    style={{ width: 'var(--40px-V)' }}
                  >
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {PastPaymentList.length > 0 ? (
                  PastPaymentList.map((tenant, index) =>
                    tenant.tenant.RentingOrOut ? (
                      <tr
                        key={index}
                        className="InfoTableBodyTr"
                        style={{ backgroundColor: '#FFFFFF1C' }}
                      >
                        <td className="InfoTableBodyTD">
                          <span
                            style={{
                              fontSize: 'var(--16px-V)',
                              overflowX: 'auto',
                            }}
                            title={tenant.tenant.name}
                          >
                            {tenant.tenant.name.slice(0, 20)}
                          </span>{' '}
                          <br />{' '}
                          <span style={{ fontSize: 'var(--12px-V)' }}>
                            Flr:
                            {
                              RoomList.find(
                                (r: RoomType) => r.tenantId === tenant.tenant.id
                              )?.floor
                            }{' '}
                            Rm:
                            {
                              RoomList.find(
                                (r: RoomType) => r.tenantId === tenant.tenant.id
                              )?.roomIndex
                            }
                          </span>
                        </td>
                        <td className="InfoTableBodyTD">
                          {tenant.NumOfPayments} 
                        </td>
                        <td className="InfoTableBodyTD">{tenant.PastBy === 0 ? 'Today' : tenant.PastBy === 1 ? 'Yesterday' : `${tenant.PastBy} days`}</td>
                        <td
                          className="InfoTableBodyTD"
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            width: 'var(--46px-V)',
                          }}
                        >
                          <button
                            onClick={() => {
                              setSelectedTenantViewShow(
                                tenant.tenant.id === SelectedTenantViewShow
                                  ? ''
                                  : tenant.tenant.id
                              );
                            }}
                          >
                            {tenant.tenant.id === SelectedTenantViewShow
                              ? 'Cancel'
                              : 'View'}
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <></>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ textAlign: 'center', padding: 'var(--10px-V)' }}
                    >
                      No unpaid payments available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <p
            className="DashboardWigetPieChartTextHeader"
            style={{ width: 'var(--400px-V)' }}
          >
            Upcoming Payments (Next 10 Days)
          </p>
          <table className="InfoTable" style={{ width: '100%' }}>
            <thead className="InfoTableThead">
              <tr className="InfoTableHeadTR">
                <th className="InfoTableHeadTh">Tenants</th>
                <th
                  className="InfoTableHeadTh"
                  style={{ width: 'var(--80px-V)' }}
                >
                  Due Date
                </th>
                <th
                  className="InfoTableHeadTh"
                  style={{ width: 'var(--70px-V)' }}
                >
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {UpcomingPaymentList.length > 0 ? (
                UpcomingPaymentList.map((payment, index) => (
                  <tr
                    key={index}
                    className="InfoTableBodyTr"
                    style={{ backgroundColor: '#FFFFFF1C' }}
                  >
                    <td className="InfoTableBodyTD">
                      <span
                        style={{ fontSize: 'var(--16px-V)', overflowX: 'auto' }}
                        title={payment.tenant.name}
                      >
                        {payment.tenant.name.slice(0, 20)}
                      </span>{' '}
                      <br />{' '}
                      <span style={{ fontSize: 'var(--12px-V)' }}>
                        Flr:
                        {
                          RoomList.find(
                            (r: RoomType) => r.tenantId === payment.tenant.id
                          )?.floor
                        }{' '}
                        Rm:
                        {
                          RoomList.find(
                            (r: RoomType) => r.tenantId === payment.tenant.id
                          )?.roomIndex
                        }
                      </span>
                    </td>
                    <td
                      className="InfoTableBodyTD"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <span>
                        In{' '}
                        {Math.ceil(
                          (payment.DueDate.getTime() - new Date().getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{' '}
                        days
                      </span>

                      <span style={{ fontSize: 'var(--11px-V)' }}>
                        {payment.DueDate.toDateString()}
                      </span>
                    </td>
                    <td className="InfoTableBodyTD">
                      {formatNumberWithSuffix(payment.Amount.toLocaleString())}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    style={{ textAlign: 'center', padding: 'var(--10px-V)' }}
                  >
                    No upcoming payments in the next 10 days
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
      {SelectedTenantViewShow !== '' && (
        <>
          <p
            style={{
              width: '100%',
              textAlign: 'center',
              fontSize: 'var(--20px-V)',
              marginTop: 'var(--10px-V)',
            }}
          >
            {
              tenantList.find((t: tenant) => t.id == SelectedTenantViewShow)
                ?.name
            }
          </p>
          <div
            style={{
              position: 'relative',
              width: 'var(--390px-V)',
              background: 'var(--Background-Color)',
              padding: 'var(--5px-V)',
              borderRadius: 'var(--5px-V)',
              border: 'var(--1px-V) solid grey',
            }}
          >
            <PaymentProgressBarGUI
              SelectedBranchId={SelectedBranchId}
              refresh={handlePaymentRefresh}
              paymentData={
                predictedPayments.filter(
                  (p) =>
                    p.roomId ===
                    RoomList.find(
                      (r: RoomType) =>
                        r.tenantId ===
                        tenantList.find(
                          (t: tenant) => t.id == SelectedTenantViewShow
                        )?.id
                    )?.id
                ) || []
              }
              roomPaymentInfoApi={roomPaymentInfoApi}
              tenantList={tenantList}
              agreedPrice={
                RoomList.find(
                  (r: RoomType) =>
                    r.tenantId ===
                    tenantList.find(
                      (t: tenant) => t.id == SelectedTenantViewShow
                    )?.id
                )?.AgreedPrice || 0
              }
              extendPaymentSchedule={() => {
                const selectedRoom = RoomList.find(
                  (r: RoomType) =>
                    r.tenantId ===
                    tenantList.find(
                      (t: tenant) => t.id == SelectedTenantViewShow
                    )?.id
                );
                if (selectedRoom) {
                  updateRoomProperty(
                    selectedRoom.id,
                    'paymentShowAmount',
                    (selectedRoom.paymentShowAmount ?? 0) + 1
                  );
                }
              }}
              roomType={RoomList.find(
                (r: RoomType) =>
                  r.tenantId ===
                  tenantList.find((t: tenant) => t.id == SelectedTenantViewShow)
                    ?.id
              )}
              tenantId={RoomList.find(
                (r: RoomType) =>
                  r.tenantId ===
                  tenantList.find((t: tenant) => t.id == SelectedTenantViewShow)
                    ?.tenantId
              )}
              ShowReceipt={ShowReceipt}
              setShowReceipt={setShowReceipt}
              setChangeMade={setChangeMade}
              SelectedUserId={SelectedUserId}
              updateRoomPropertyLocal={updateRoomPropertyLocal}
              Currency={
                tenantList.find(
                  (t: tenant) =>
                    t.id ===
                   SelectedTenantViewShow
                    )?.Currency
                 || GetDefaultCurrency()
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(DashbPastPayments);
