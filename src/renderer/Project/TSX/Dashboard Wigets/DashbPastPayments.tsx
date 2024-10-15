import React, { useState, useEffect } from 'react';
import { getValuesWithSql } from 'Backend/localServerApis';
import { addDays, addMonths, startOfYear, endOfYear } from 'date-fns';
import PaymentProgressBarGUI from '../Helpers/GUIs/PaymentProgressBarGUI';

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
  roomPaymentInfoApi,setChangeMade
}: {
  tenantList: tenant[];
  RoomList: RoomType[];
  roomPaymentInfoApi: any;
  setChangeMade:any;
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
      const yearStart = startOfYear(new Date(currentYear, 0, 1));
      const yearEnd = endOfYear(new Date(currentYear, 11, 31));

      // Get all actual payments for the current year
      const actualPayments = await getValuesWithSql('room_pay_info', `WHERE Day >= ${yearStart.getTime()} AND Day <= ${yearEnd.getTime()}`);

      for (const room of RoomList) {
        let startDate = new Date(tenantList.find((tenant) => tenant.id === room.tenantId)?.startTime || Date.now()).getTime();
        if (room.selectedAgreementId) {
          const agreements = await getValuesWithSql(
            'agreements',
            `WHERE id = '${room.selectedAgreementId}'`
          );
          if (agreements.length > 0) startDate = agreements[0].startTime;
        }

        let currentDate = new Date(Math.max(startDate, yearStart.getTime()));

        while (currentDate <= yearEnd) {
          const paymentId = `${room.id}-${currentDate.getTime()}`;
          const actualPayment = actualPayments.find((p: any) => p.id === paymentId);

          allPayments.push({
            id: paymentId,
            Day: currentDate.getTime(),
            Value: room.AgreedPrice,
            Paid: actualPayment ? actualPayment.Paid === 1 : false,
            roomId: room.id
          });

          // Calculate next payment date based on payment cycle
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
              currentDate = addDays(currentDate, room.PaymentCycleCustomeDays || 30);
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
    const pastPayments = predictedPayments.filter(payment => 
      payment.Day < currentDate.getTime() && !payment.Paid
    );

    const newPastPaymentList = pastPayments.reduce((acc, payment) => {
      const tenant = tenantList.find(t => 
        t.id === RoomList.find(r => r.id === payment.roomId)?.tenantId
      );
      if (tenant) {
        const existingTenant = acc.find(item => item.tenant.id === tenant.id);
        if (existingTenant) {
          existingTenant.NumOfPayments++;
        } else {
          acc.push({
            tenant,
            NumOfPayments: 1,
            PastBy: Math.floor((currentDate.getTime() - payment.Day) / (1000 * 3600 * 24))
          });
        }
      }
      return acc;
    }, [] as { tenant: tenant; NumOfPayments: number; PastBy: number }[]);

    setPastPaymentList(newPastPaymentList);

    const tenDaysFromNow = new Date(currentDate.getTime() + 10 * 24 * 60 * 60 * 1000);
    const upcomingPayments = predictedPayments.filter(payment => 
      payment.Day >= currentDate.getTime() && payment.Day <= tenDaysFromNow.getTime() && !payment.Paid
    );

    const newUpcomingPaymentList = upcomingPayments.map(payment => {
      const tenant = tenantList.find(t => 
        t.id === RoomList.find(r => r.id === payment.roomId)?.tenantId
      );
      return {
        tenant,
        DueDate: new Date(payment.Day),
        Amount: payment.Value
      };
    });

    setUpcomingPaymentList(newUpcomingPaymentList);
  }, [predictedPayments, RoomList, tenantList]);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: '400px',
        alignItems: 'flex-start',
        height: '500px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div style={{ display: 'flex', width: '100%', marginBottom: '10px' }}>
        <button
          onClick={() => setActiveTab('past')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor:
              activeTab === 'past'
                ? 'var(--Secondary-Color)'
                : 'var(--Background-Color)',
            cursor: 'pointer',
          }}
        >
          Past Payments
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          style={{
            flex: 1,
            padding: '10px',
            backgroundColor:
              activeTab === 'upcoming'
                ? 'var(--Secondary-Color)'
                : 'var(--Background-Color)',
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
            style={{ width: '400px' }}
          >
            Past Payments
          </p>
          <table className="InfoTable" style={{ width: '100%' }}>
            <thead className="InfoTableThead">
              <tr className="InfoTableHeadTR">
                <th className="InfoTableHeadTh">Tenants</th>
                <th className="InfoTableHeadTh" style={{ width: '40px' }}>
                  Num of <br />
                  payment
                </th>
                <th className="InfoTableHeadTh" style={{ width: '50px' }}>
                  Past By
                </th>
                <th className="InfoTableHeadTh" style={{ width: '40px' }}>
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
                          style={{ fontSize: '16px', overflowX: 'auto' }}
                          title={tenant.tenant.name}
                        >
                          {tenant.tenant.name.slice(0, 20)}
                        </span>{' '}
                        <br />{' '}
                        <span style={{ fontSize: '12px' }}>
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
                      <td className="InfoTableBodyTD">{tenant.PastBy}</td>
                      <td
                        className="InfoTableBodyTD"
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          width: '46px',
                        }}
                      >
                        <button
                          onClick={() => {
                            setSelectedTenantViewShow(tenant.tenant.id);
                          }}
                        >
                          View
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
                    style={{ textAlign: 'center', padding: '10px' }}
                  >
                    No unpaid payments available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      ) : (
        <>
          <p
            className="DashboardWigetPieChartTextHeader"
            style={{ width: '400px' }}
          >
            Upcoming Payments (Next 10 Days)
          </p>
          <table className="InfoTable" style={{ width: '100%' }}>
            <thead className="InfoTableThead">
              <tr className="InfoTableHeadTR">
                <th className="InfoTableHeadTh">Tenants</th>
                <th className="InfoTableHeadTh" style={{ width: '80px' }}>
                  Due Date
                </th>
                <th className="InfoTableHeadTh" style={{ width: '70px' }}>
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
                        style={{ fontSize: '16px', overflowX: 'auto' }}
                        title={payment.tenant.name}
                      >
                        {payment.tenant.name.slice(0, 20)}
                      </span>{' '}
                      <br />{' '}
                      <span style={{ fontSize: '12px' }}>
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

                      <span style={{ fontSize: '11px' }}>
                        {payment.DueDate.toDateString()}
                      </span>
                    </td>
                    <td className="InfoTableBodyTD">
                      {payment.Amount.toLocaleString()}$
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    style={{ textAlign: 'center', padding: '10px' }}
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
              fontSize: '20px',
              marginTop: '30px',
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
              width: '390px',
              background: 'var(--Background-Color)',
              padding: '5px',
              borderRadius: '5px',
              border: '1px solid grey',
            }}
          >
            <PaymentProgressBarGUI
              refresh={() => {}}
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
              roomType={RoomList.find(
                (r: RoomType) =>
                  r.tenantId ===
                  tenantList.find((t: tenant) => t.id == SelectedTenantViewShow)
                    ?.id
              )}
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
              extendPaymentSchedule={() => {}}
              tenant={tenantList.find(
                (t: tenant) => t.id == SelectedTenantViewShow
              )}
              roomId={
                RoomList.find(
                  (r: RoomType) =>
                    r.tenantId ===
                    tenantList.find(
                      (t: tenant) => t.id == SelectedTenantViewShow
                    )?.id
                )?.id || ''
              }
              setChangeMade={setChangeMade}
              setSelectedTenantViewShow={setSelectedTenantViewShow}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default React.memo(DashbPastPayments);
