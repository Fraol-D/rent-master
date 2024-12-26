import React, { useEffect, useState } from 'react';
import { useGlobal } from 'renderer/components/GlobalContext';

const UpcomingAgreements = ({
  RoomList,

  SelectedBranchId,
}: {
  RoomList: RoomType[];

  SelectedBranchId: any;
}) => {
  const [upcomingAgreements, setUpcomingAgreements] = useState<agreements[]>(
    []
  );
  const [expiredAgreements, setExpiredAgreements] = useState<agreements[]>([]);
  const [daysThreshold, setDaysThreshold] = useState(30);
  const [activeTab, setActiveTab] = useState('upcoming');
  const { AllAgreements, setAllAgreements,AllTenants } = useGlobal();
  useEffect(() => {
    const fetchAgreements = async () => {
      const currentTime = new Date().getTime();
      const thresholdTime = currentTime + daysThreshold * 24 * 60 * 60 * 1000;

      // Fetch upcoming agreements
      const upcomingData = AllAgreements.filter(
        (agreement) =>
          agreement.endTime > currentTime &&
          agreement.endTime <= thresholdTime &&
          agreement.branchId === SelectedBranchId
      );

      // Fetch expired agreements
      const expiredData = AllAgreements.filter(
        (agreement) =>
          agreement.endTime <= currentTime &&
          agreement.branchId === SelectedBranchId
      );

      // Filter agreements that are currently selected for rooms
      const filteredUpcoming = upcomingData.filter((agreement) => {
        return RoomList.some(
          (room) => room.selectedAgreementId === agreement.id
        );
      });

      const filteredExpired = expiredData.filter((agreement) => {
        return RoomList.some(
          (room) => room.selectedAgreementId === agreement.id
        );
      });

      setUpcomingAgreements(filteredUpcoming);
      setExpiredAgreements(filteredExpired);
    };

    fetchAgreements();
  }, [daysThreshold, RoomList, SelectedBranchId]);

  return (
    <div
      className="DashboardWigetMainContainer"
      id="UpcomingAgreements"
      style={{
        width: 'var(--400px-V)',
        alignItems: 'flex-start',
        height: 'var(--500px-V)',
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
          Upcoming Expirations
        </button>
        <button
          onClick={() => setActiveTab('expired')}
          style={{
            flex: 1,
            padding: 'var(--10px-V)',
            backgroundColor:
              activeTab === 'expired'
                ? 'var(--Secondary-Color)'
                : 'var(--Secondary-Color30)',
            cursor: 'pointer',
          }}
        >
          Expired Agreements
        </button>
      </div>

      {activeTab === 'upcoming' ? (
        <>
          <p
            className="DashboardWigetPieChartTextHeader"
            style={{ width: 'var(--400px-V)' }}
          >
            Upcoming Agreement Expirations
          </p>
          <div style={{ marginBottom: 'var(--10px-V)' }}>
            <label htmlFor="daysThreshold">
              Show agreements ending within:{' '}
            </label>
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
              <option value={365}>365 days</option>
            </select>
          </div>
          <table className="InfoTable" style={{ width: '100%', margin: '0px' }}>
            <thead className="InfoTableThead">
              <tr className="InfoTableHeadTR">
                <th className="InfoTableHeadTh">Tenants</th>
                <th
                  className="InfoTableHeadTh"
                  style={{ width: 'var(--90px-V)' }}
                >
                  Days Left
                </th>
              </tr>
            </thead>
            <tbody>
              {upcomingAgreements.length > 0 ? (
                upcomingAgreements.map((agreement, index) => {
                  const tenant = AllTenants.find(
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
                          style={{
                            fontSize: 'var(--16px-V)',
                            overflowX: 'auto',
                          }}
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
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    style={{ textAlign: 'center', padding: 'var(--10px-V)' }}
                  >
                    No upcoming agreement expirations within {daysThreshold}{' '}
                    days
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
            style={{ width: 'var(--400px-V)' }}
          >
            Expired Agreements
          </p>
          <table className="InfoTable" style={{ width: '100%',margin: '0px' }}>
            <thead className="InfoTableThead">
              <tr className="InfoTableHeadTR">
                <th className="InfoTableHeadTh">Tenants</th>
                <th
                  className="InfoTableHeadTh"
                  style={{ width: 'var(--90px-V)' }}
                >
                  Expired By
                </th>
              </tr>
            </thead>
            <tbody>
              {expiredAgreements.length > 0 ? (
                expiredAgreements.map((agreement, index) => {
                  const tenant = AllTenants.find(
                    (t) => t.id === agreement.tenantId
                  );
                  const room = RoomList.find((r) => r.id === agreement.roomId);
                  const daysExpired = Math.ceil(
                    (new Date().getTime() - agreement.endTime) /
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
                          style={{
                            fontSize: 'var(--16px-V)',
                            overflowX: 'auto',
                          }}
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
                        <span>{daysExpired} days</span>
                        <span style={{ fontSize: 'var(--11px-V)' }}>
                          {new Date(agreement.endTime).toDateString()}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={2}
                    style={{ textAlign: 'center', padding: 'var(--10px-V)' }}
                  >
                    No expired agreements
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default React.memo(UpcomingAgreements);
