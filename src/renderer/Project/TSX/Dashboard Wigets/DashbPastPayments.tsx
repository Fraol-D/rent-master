import { getValuesWithSql } from 'Backend/localServerApis';
import React, { useEffect, useState } from 'react';
import PaymentProgressBarGUI from '../Helpers/GUIs/PaymentProgressBarGUI';

const DashbPastPayments = ({
  tenantList,
  RoomList,
  roomPaymentInfoApi,
}: {
  tenantList: tenant[];
  RoomList: RoomType[];
  roomPaymentInfoApi: any;
}) => {
  const [PastPaymentList, setPastPaymentList] = React.useState<
    { tenant: tenant; NumOfPayments: number; PastBy: number }[]
  >([]);
  const [UpcomingPaymentList, setUpcomingPaymentList] = React.useState<
    { tenant: tenant; DueDate: Date; Amount: number }[]
  >([]);
  const [SelectedTenantViewShow, setSelectedTenantViewShow] = useState('');
  const [activeTab, setActiveTab] = useState('past');

  useEffect(() => {
    const getData = async () => {
      const PaymentData = await getValuesWithSql(
        'room_pay_info',
        `WHERE Paid = 0 AND Day < ${new Date().getTime()}`
      );
      const tenantMap = new Map();
      const newPastPaymentList = PaymentData.reduce(
        (acc: any[], element: any) => {
          const tenant = tenantList.find(
            (t: tenant) =>
              t.id ===
              RoomList.find((r: RoomType) => r.id === element.roomId)?.tenantId
          );
          if (tenant && !tenantMap.has(tenant.id)) {
            const currentDate = new Date();
            const paymentDate = new Date(element.Day);
            const daysPastDue = Math.floor(
              (currentDate.getTime() - paymentDate.getTime()) /
                (1000 * 3600 * 24)
            );
            tenantMap.set(tenant.id, true);
            acc.push({
              tenant,
              NumOfPayments: PaymentData.filter(
                (payment: any) => payment.roomId === element.roomId
              ).length,
              PastBy: daysPastDue,
            });
          }
          return acc;
        },
        []
      );
      setPastPaymentList(newPastPaymentList);

      const tenDaysFromNow = new Date();
      tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
      const UpcomingPaymentData = await getValuesWithSql(
        'room_pay_info',
        `WHERE Paid = 0 AND Day >= ${new Date().getTime()} AND Day <= ${tenDaysFromNow.getTime()}`
      );
      const newUpcomingPaymentList = UpcomingPaymentData.map((element: any) => {
        const tenant = tenantList.find(
          (t: tenant) =>
            t.id ===
            RoomList.find((r: RoomType) => r.id === element.roomId)?.tenantId
        );
        return {
          tenant,
          DueDate: new Date(element.Day),
          Amount: element.Amount,
        };
      });
      setUpcomingPaymentList(newUpcomingPaymentList);
    };
    getData();
  }, []);

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
                      {RoomList.find(
                        (r: RoomType) => r.tenantId === payment.tenant.id
                      )?.AgreedPrice.toLocaleString()}
                      $
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
            refresh={()=>{}}
              paymentData={
                RoomList.find(
                  (r: RoomType) =>
                    r.tenantId ===
                    tenantList.find(
                      (t: tenant) => t.id == SelectedTenantViewShow
                    )?.id
                )?.AllRoomPayInfo.RoomPayInfo || []
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
              setSelectedTenantViewShow={setSelectedTenantViewShow}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default DashbPastPayments;
