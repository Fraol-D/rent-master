import { getValuesWithSql } from 'Backend/localServerApis';
import React, { useEffect, useState } from 'react';

const UpcomingAgreements = ({
  RoomList,
  TenantList,
}: {
  RoomList: RoomType[];
  TenantList: tenant[];
}) => {
  const [upcomingAgreements, setUpcomingAgreements] = useState<agreements[]>([]);
  const [daysThreshold, setDaysThreshold] = useState(30);

  useEffect(() => {
    const fetchUpcomingAgreements = async () => {
      const currentTime = new Date().getTime();
      const thresholdTime = currentTime + daysThreshold * 24 * 60 * 60 * 1000;

      const agreementsData = await getValuesWithSql(
        'agreements',
        `WHERE endTime > ${currentTime} AND endTime <= ${thresholdTime}`
      );

      setUpcomingAgreements(agreementsData);
    };

    fetchUpcomingAgreements();
  }, [daysThreshold]);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: '400px',
        alignItems: 'flex-start',
        color: 'white',
        height: '500px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <p className="DashboardWigetPieChartTextHeader" style={{ width: '400px' }}>
        Upcoming Agreement Expirations
      </p>
      <div style={{ marginBottom: '10px' }}>
        <label htmlFor="daysThreshold">Show agreements ending within: </label>
        <select
          id="daysThreshold"
          value={daysThreshold}
          onChange={(e) => setDaysThreshold(Number(e.target.value))}
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={60}>60 days</option>
          <option value={90}>90 days</option>
          <option value={120}>120 days</option>
          <option value={150}>150 days</option>
          <option value={180}>180 days</option>
          <option value={360}>360 days</option>
        </select>
      </div>
      <table className="InfoTable" style={{ width: '100%' }}>
        <thead className="InfoTableThead">
          <tr className="InfoTableHeadTR">
            <th className="InfoTableHeadTh">Tenants</th>
            
            <th className="InfoTableHeadTh" style={{ width: '90px' }}>
              Days Left
            </th>
          </tr>
        </thead>
        <tbody>
          {upcomingAgreements.length > 0 ? (
            upcomingAgreements.map((agreement, index) => {
              const tenant = TenantList.find((t) => t.id === agreement.tenantId);
              const room = RoomList.find((r) => r.id === agreement.roomId);
              const daysLeft = Math.ceil((agreement.endTime - new Date().getTime()) / (1000 * 60 * 60 * 24));

              return (
                <tr
                  key={index}
                  className="InfoTableBodyTr"
                  style={{ backgroundColor: '#FFFFFF1C' }}
                >
                  <td className="InfoTableBodyTD">
                    <span
                      style={{ fontSize: '16px', overflowX: 'auto' }}
                      title={tenant?.name}
                    >
                      {tenant?.name.slice(0, 20)}
                    </span>{' '}
                    <br />{' '}
                    <span style={{ fontSize: '12px' }}>
                      Flr: {room?.floor} Rm: {room?.roomIndex}
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
                    <span>In {daysLeft} days</span>
                    <span style={{ fontSize: '11px' }}>
                      {new Date(agreement.endTime).toDateString()}
                    </span>
                  </td>                </tr>
              );
            })
          ) : (
            <tr>
              <td
                colSpan={3}
                style={{ textAlign: 'center', padding: '10px' }}
              >
                No upcoming agreement expirations within {daysThreshold} days
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UpcomingAgreements;
