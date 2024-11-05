import { getValuesWithSql } from 'Backend/localServerApis';
import React, { useEffect, useState } from 'react';

const UpcomingAgreements = ({
  RoomList,
  TenantList,SelectedBranchId
}: {
  RoomList: RoomType[];
  TenantList: tenant[];SelectedBranchId:any
}) => {
  const [upcomingAgreements, setUpcomingAgreements] = useState<agreements[]>(
    []
  );
  const [daysThreshold, setDaysThreshold] = useState(30);
  useEffect(() => {
    const fetchUpcomingAgreements = async () => {
      const currentTime = new Date().getTime();
      const thresholdTime = currentTime + daysThreshold * 24 * 60 * 60 * 1000;

      const agreementsData = await getValuesWithSql(
        'agreements',
        `WHERE endTime > ${currentTime} AND endTime <= ${thresholdTime} AND branchId = '${SelectedBranchId}'`
      );
      // Filter out agreements that are not currently selected for any room
      const filteredAgreements = agreementsData.filter((agreement) => {
        return RoomList.some((room) => room.selectedAgreementId === agreement.id);
      });
      setUpcomingAgreements(filteredAgreements);
    };

    fetchUpcomingAgreements();
  }, [daysThreshold, RoomList]);

  return (
    <div
      className="DashboardWigetMainContainer"
      style={{
        width: 'var(--400px-V)',
        alignItems: 'flex-start',

        height: 'var(--500px-V)',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <p
        className="DashboardWigetPieChartTextHeader"
        style={{ width: 'var(--400px-V)' }}
      >
        Upcoming Agreement Expirations
      </p>
      <div style={{ marginBottom: 'var(--10px-V)' }}>
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
          <option value={365}>365w days</option>
        </select>
      </div>
      <table className="InfoTable" style={{ width: '100%' }}>
        <thead className="InfoTableThead">
          <tr className="InfoTableHeadTR">
            <th className="InfoTableHeadTh">Tenants</th>

            <th className="InfoTableHeadTh" style={{ width: 'var(--90px-V)' }}>
              Days Left
            </th>
          </tr>
        </thead>
        <tbody>
          {upcomingAgreements.length > 0 ? (
            upcomingAgreements.map((agreement, index) => {
              const tenant = TenantList.find(
                (t) => t.id === agreement.tenantId
              );
              const room = RoomList.find((r) => r.id === agreement.roomId);
              const daysLeft = Math.ceil(
                (agreement.endTime - new Date().getTime()) /
                  (1000 * 60 * 60 * 24)
              );

              return (
                <tr
                  key={index}
                  className="InfoTableBodyTr"
                  style={{ backgroundColor: '#FFFFFF1C' }}
                >
                  <td className="InfoTableBodyTD">
                    <span
                      style={{ fontSize: 'var(--16px-V)', overflowX: 'auto' }}
                      title={tenant?.name}
                    >
                      {tenant?.name.slice(0, 20)}
                    </span>{' '}
                    <br />{' '}
                    <span style={{ fontSize: 'var(--12px-V)' }}>
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
                    <span style={{ fontSize: 'var(--11px-V)' }}>
                      {new Date(agreement.endTime).toDateString()}
                    </span>
                  </td>{' '}
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', padding: 'var(--10px-V)' }}>
                No upcoming agreement expirations within {daysThreshold} days
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default React.memo(UpcomingAgreements);
