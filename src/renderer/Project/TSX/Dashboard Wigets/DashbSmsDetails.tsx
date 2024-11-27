import { getValuesWithSql_Online } from 'Backend/OnlineServerApis';
import React, { useEffect, useState, useMemo } from 'react';
import '../../CSS/ToolsPage.css';
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

interface props {
  SelectedUserId: string;
  RoomList: RoomType[];
  tenantList: tenant[];
}

type smsHistoryType = {
  id: string;
  receiver: string;
  body: string;
  sentDate: number;
  templateId: string;
  userId: string;
  mode: string;
};

const DashbSmsDetails = ({ SelectedUserId, RoomList, tenantList }: props) => {
  const [smsHistory, setSmsHistory] = useState<smsHistoryType[]>([]);
  const [expandedSmsId, setExpandedSmsId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substr(0, 7)
  );
  const [searchConfig, setSearchConfig] = useState({
    receiver: '',
    body: '',
    mode: '',
    room: '',
    floor: '',
  });
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);
  const [SMSMonthlyLimit, setSMSMonthlyLimit] = useState(0);
  const [applyFiltersToGraph, setApplyFiltersToGraph] = useState(false);

  useEffect(() => {
    const fetchSmsHistory = async () => {
      const user = await getValuesWithSql_Online(
        'users',
        `WHERE id = '${SelectedUserId}'`
      );
      setSMSMonthlyLimit(await user[0].SMSMonthlyLimit);
      const smsHistoryRaw = await getValuesWithSql_Online(
        'sms_history',
        `WHERE userId = '${SelectedUserId}'`
      );
      const sortedSmsHistory = smsHistoryRaw.sort(
        (a: smsHistoryType, b: smsHistoryType) => b.sentDate - a.sentDate
      );
      setSmsHistory(sortedSmsHistory);
    };
    if(navigator.onLine)fetchSmsHistory();
  }, [SelectedUserId]);

  const toggleExpand = (id: string) => {
    setExpandedSmsId(expandedSmsId === id ? null : id);
  };

  const formatSmsBody = (body: string) => {
    return body.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const filteredSms = smsHistory.filter((sms) => {
    const smsDate = new Date(sms.sentDate);
    const [year, month] = selectedDate.split('-').map(Number);
    const tenant = tenantList.find((t) => t.phoneNumber === sms.receiver);
    const room = RoomList.find((r) => r.tenantId === tenant?.id);

    return (
      smsDate.getMonth() + 1 === month &&
      smsDate.getFullYear() === year &&
      (searchConfig.receiver === '' ||
        sms.receiver
          .toLowerCase()
          .includes(searchConfig.receiver.toLowerCase())) &&
      (searchConfig.body === '' ||
        sms.body.toLowerCase().includes(searchConfig.body.toLowerCase())) &&
      (searchConfig.mode === '' || sms.mode === searchConfig.mode) &&
      (searchConfig.room === '' ||
        room?.roomIndex.toString() === searchConfig.room) &&
      (searchConfig.floor === '' ||
        room?.floor.toString() === searchConfig.floor)
    );
  });

  const handleSearchChange = (field: string, value: string) => {
    setSearchConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const smsStats = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const daysInMonth = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    const smsToCount = applyFiltersToGraph ? filteredSms : smsHistory;

    const dailySmsCounts = daysInMonth.map(day => {
      const daySms = smsToCount.filter(sms => {
        const smsDate = new Date(sms.sentDate);
        return smsDate.getDate() === day.getDate() &&
               smsDate.getMonth() === day.getMonth() &&
               smsDate.getFullYear() === day.getFullYear();
      });
      return {
        date: format(day, 'd'),
        sms: daySms.length
      };
    });

    const totalSms = smsToCount.filter(sms => {
      const smsDate = new Date(sms.sentDate);
      return smsDate >= monthStart && smsDate <= monthEnd;
    }).length;

    const highestDailySms = Math.max(...dailySmsCounts.map(d => d.sms));
    const averageDailySms = totalSms / daysInMonth.length;

    return {
      dailySmsCounts,
      totalSms,
      highestDailySms,
      averageDailySms
    };
  }, [selectedDate, smsHistory, filteredSms, applyFiltersToGraph]);

  const renderChart = () => {
    try {
      return (
        <LineChart
          xAxis={[
            {
              dataKey: 'date',
              scaleType: 'point',
              valueFormatter: (value) => value.toString(),
              tickLabelStyle: {
                angle: 0,
                textAnchor: 'middle',
              },
            },
          ]}
          yAxis={[
            {
              colorMap: {
                type: 'piecewise',
                thresholds: [SMSMonthlyLimit],
                colors: [ 'var(--Primary-Color)','red',],
              },
            },
          ]}
          series={[
            {
              dataKey: 'sms',
              label: 'SMS Sent',
              area: true,
              valueFormatter: (value) => value?.toString() || '0',
            },
          ]}
          dataset={smsStats.dailySmsCounts}
          height={250}
          margin={{ left: 70, right: 30, top: 30, bottom: 30 }}
          sx={{
            '.MuiLineElement-root': {
              stroke: 'var(--Primary-Color)',
              strokeWidth: 2,
            },
            '.MuiAreaElement-root': {
              fillOpacity: 0.1,
            },
            [`.${axisClasses.left} .${axisClasses.label}`]: {
              transform: 'translate(-35px, 0)',
            },
            [`.${axisClasses.root}`]: {
              [`.${axisClasses.tick}, .${axisClasses.line}`]: {
                stroke: 'var(--Text-Color)',
                strokeWidth: 1,
              },
              [`.${axisClasses.tickLabel}`]: {
                fill: 'var(--Text-Color)',
              },
            },
          }}
        />
      );
    } catch (error) {
      console.error('Error rendering chart:', error);
      return <div>Error rendering SMS chart</div>;
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h1 style={{ margin: 'var(--10px-V)' }}>SMS History</h1>

      <div
        style={{
          width: '90%',
          backgroundColor: 'var(--Secondary-Color30)',
          borderRadius: 'var(--8px-V)',
          padding: 'var(--15px-V)',
          marginBottom: 'var(--20px-V)',
        }}
      >
        {renderChart()}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: 'var(--10px-V)',
          }}
        >
          <p>
            Limit: <strong>{SMSMonthlyLimit.toLocaleString()} per month</strong>
          </p>
          <p>
            Total SMS: <strong>{smsStats.totalSms.toLocaleString()}/{SMSMonthlyLimit.toLocaleString()}</strong>
          </p>
          <p>
            Highest Daily: <strong>{smsStats.highestDailySms.toLocaleString()}</strong>
          </p>
          <p>
            Average Daily:{' '}
            <strong>{smsStats.averageDailySms.toFixed(1)}</strong>
          </p>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '90%',
          marginBottom: 'var(--10px-V)',
          gap: 'var(--10px-V)',
        }}
      >
        <input
          type="month"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          style={{ flex: 1 }}
        />
        <button
          onClick={() => setAdvancedSearchVisible(!advancedSearchVisible)}
        >
          {advancedSearchVisible ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {advancedSearchVisible && (
        <div
          style={{
            marginBottom: 'var(--20px-V)',
            padding: 'var(--15px-V)',
            backgroundColor: 'var(--Secondary-Color30)',
            borderRadius: 'var(--8px-V)',
            boxShadow: '0 var(--2px-V) var(--8px-V) rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr 1fr',
              gap: 'var(--10px-V)',
            }}
          >
            <div>
              <label>Phone Number:</label>
              <input
                type="text"
                placeholder="Search phone number..."
                value={searchConfig.receiver}
                onChange={(e) => handleSearchChange('receiver', e.target.value)}
                style={{ marginBottom: 'var(--10px-V)' }}
              />
            </div>
            <div>
              <label>Message Content:</label>
              <input
                type="text"
                placeholder="Search message body..."
                value={searchConfig.body}
                onChange={(e) => handleSearchChange('body', e.target.value)}
                style={{ marginBottom: 'var(--10px-V)' }}
              />
            </div>
            <div>
              <label>Mode:</label>
              <select
                value={searchConfig.mode}
                onChange={(e) => handleSearchChange('mode', e.target.value)}
                style={{ marginBottom: 'var(--10px-V)' }}
              >
                <option value="">All Modes</option>
                <option value="Manually">Manually</option>
                <option value="Automatically">Automatically</option>
                <option value="Expense_Automatic">Expense Automatically</option>
              </select>
            </div>
            <div>
              <label>Room Number:</label>
              <input
                type="number"
                placeholder="Room number..."
                value={searchConfig.room}
                onChange={(e) => handleSearchChange('room', e.target.value)}
              />
            </div>
            <div>
              <label>Floor Number:</label>
              <input
                type="number"
                placeholder="Floor number..."
                value={searchConfig.floor}
                onChange={(e) => handleSearchChange('floor', e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'var(--10px-V)', marginTop: 'var(--10px-V)' }}>
            <button
              onClick={() => setSearchConfig({
                receiver: '',
                body: '',
                mode: '',
                room: '',
                floor: '',
              })}
              style={{
                padding: 'var(--5px-V) var(--10px-V)',
                backgroundColor: 'var(--Danger-Color)',
                color: 'white',
                border: 'none',
                borderRadius: 'var(--4px-V)',
                cursor: 'pointer',
              }}
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setApplyFiltersToGraph(!applyFiltersToGraph)}
              style={{
                padding: 'var(--5px-V) var(--10px-V)',
                backgroundColor: applyFiltersToGraph ? 'var(--Primary-Color)' : 'white',
                color: applyFiltersToGraph ? 'white' : 'black',
                border: 'var(--1px-V) solid var(--Border-Color)',
                borderRadius: 'var(--4px-V)',
                cursor: 'pointer',
              }}
            >
              {applyFiltersToGraph ? 'Remove Filters from Graph' : 'Apply Filters to Graph'}
            </button>
          </div>
        </div>
      )}

      <p>
        {filteredSms.length} SMS sent in{' '}
        {new Date(selectedDate).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}
      </p>

      <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
        {filteredSms.length > 0 ? (
          filteredSms.map((sms) => (
            <div
              key={sms.id}
              onClick={() => toggleExpand(sms.id)}
              className="email-template-container"
              style={{
                cursor: 'pointer',
                width: '95%',
                margin: 'var(--10px-V)',
                padding: 'var(--10px-V)',
                borderRadius: 'var(--5px-V)',
                boxShadow: '0 var(--2px-V) var(--4px-V) rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <p>
                    <strong>To:</strong> (
                    {
                      tenantList.find(
                        (tenant) => tenant.phoneNumber === sms.receiver
                      )?.name
                    }{' '}
                    - Rm.{' '}
                    {
                      RoomList.find(
                        (room) =>
                          room.tenantId ===
                          tenantList.find(
                            (tenant) => tenant.phoneNumber === sms.receiver
                          )?.id
                      )?.roomIndex
                    }{' '}
                    Flr.{' '}
                    {
                      RoomList.find(
                        (room) =>
                          room.tenantId ===
                          tenantList.find(
                            (tenant) => tenant.phoneNumber === sms.receiver
                          )?.id
                      )?.floor
                    }
                    ) {sms.receiver}
                  </p>
                  <p>
                    <strong>Sent:</strong>{' '}
                    {new Date(sms.sentDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(sms.sentDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                  <p>
                    <strong>Mode:</strong> {sms.mode || 'Unknown'}
                  </p>
                </div>
                <div
                  style={{
                    fontSize: 'var(--24px-V)',
                    marginLeft: 'var(--10px-V)',
                  }}
                >
                  {expandedSmsId === sms.id ? '▼' : '▶'}
                </div>
              </div>
              {expandedSmsId === sms.id && (
                <div>
                  <p>
                    <strong>Template ID:</strong> {sms.templateId}
                  </p>
                  <p>
                    <strong>Message:</strong>
                  </p>
                  <pre
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {formatSmsBody(sms.body)}
                  </pre>
                </div>
              )}
            </div>
          ))
        ) : (
          <p style={{ color: 'var(--Text-Color-Grey)', textAlign: 'center' }}>
            No SMS found for the selected criteria.
          </p>
        )}
      </div>
    </div>
  );
};

export default DashbSmsDetails;
