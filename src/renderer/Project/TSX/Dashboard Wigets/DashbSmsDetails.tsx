import { getValuesWithSql_Online } from 'Backend/OnlineServerApis';
import React, { useEffect, useState, useMemo } from 'react';
import '../../CSS/ToolsPage.css';
import { Input } from '../Helpers/CustomReactComponents';
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getValuesWithSql } from 'Backend/localServerApis';

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
  const [smsTemplates, setSmsTemplates] = useState<smsTemplate[]>([]);
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
      const smsTemplates = await getValuesWithSql('sms_templates', `WHERE 1`);
      setSmsTemplates(smsTemplates);
      const sortedSmsHistory = smsHistoryRaw.sort(
        (a: smsHistoryType, b: smsHistoryType) => b.sentDate - a.sentDate
      );
      setSmsHistory(sortedSmsHistory);
    };
    if (navigator.onLine) fetchSmsHistory();
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

    const dailySmsCounts = daysInMonth.map((day) => {
      const daySms = smsToCount.filter((sms) => {
        const smsDate = new Date(sms.sentDate);
        return (
          smsDate.getDate() === day.getDate() &&
          smsDate.getMonth() === day.getMonth() &&
          smsDate.getFullYear() === day.getFullYear()
        );
      });
      return {
        date: format(day, 'd'),
        sms: daySms.length,
      };
    });

    const totalSms = smsToCount.filter((sms) => {
      const smsDate = new Date(sms.sentDate);
      return smsDate >= monthStart && smsDate <= monthEnd;
    }).length;

    const highestDailySms = Math.max(...dailySmsCounts.map((d) => d.sms));
    const averageDailySms = totalSms / daysInMonth.length;

    return {
      dailySmsCounts,
      totalSms,
      highestDailySms,
      averageDailySms,
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
          paddingBottom: 'var(--15px-V)',
          marginBottom: 'var(--20px-V)',
          paddingTop: 'var(--15px-V)',
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
            Total SMS:{' '}
            <strong>
              {smsStats.totalSms.toLocaleString()}/
              {SMSMonthlyLimit.toLocaleString()}
            </strong>
          </p>
          <p>
            Highest Daily:{' '}
            <strong>{smsStats.highestDailySms.toLocaleString()}</strong>
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
          style={{
            padding: 'var(--5px-V) var(--10px-V)',
            border: 'var(--1px-V) solid var(--Border-Color)',
            borderRadius: 'var(--4px-V)',
            cursor: 'pointer',
          }}
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
          <div
            style={{
              display: 'flex',
              gap: 'var(--10px-V)',
              marginTop: 'var(--10px-V)',
            }}
          >
            <button
              onClick={() =>
                setSearchConfig({
                  receiver: '',
                  body: '',
                  mode: '',
                  room: '',
                  floor: '',
                })
              }
            >
              Clear All Filters
            </button>
            <button
              onClick={() => setApplyFiltersToGraph(!applyFiltersToGraph)}
            >
              {applyFiltersToGraph
                ? 'Remove Filters from Graph'
                : 'Apply Filters to Graph'}
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

      <div style={{ width: '90%', height: '100%' }}>
        {filteredSms.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--10px-V)',
              padding: 'var(--5px-V)',
              width: '100%',
            }}
          >
            {filteredSms.map((sms) => (
              <div
                key={sms.id}
                onClick={() => toggleExpand(sms.id)}
                className="email-template-container"
                style={{
                  cursor: 'pointer',
                  marginBottom: 'var(--5px-V)',
                  backgroundColor: 'var(--Secondary-Color30)',
                  padding: 'var(--10px-V)',
                  borderRadius: 'var(--10px-V)',
                  boxShadow: '0 var(--2px-V) var(--8px-V) rgba(0,0,0,0.15)',
                  transition: 'all 0.3s ease',
                  border: '1px solid var(--Border-Color)',
                  display: 'flex',
                  gap: 'var(--15px-V)',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    backgroundColor: 'var(--Primary-Color20)',
                    padding: 'var(--10px-V)',
                    borderRadius: '50%',
                    color: 'var(--Primary-Color)',
                    fontSize: 'var(--20px-V)',
                    height: 'var(--10px-V)',

                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {(() => {
                    const name =
                      tenantList.find(
                        (tenant) => tenant.phoneNumber === sms.receiver
                      )?.name || '';
                    const words = name.split(' ');
                    return (
                      (words[0]?.charAt(0) || '?') + (words[1]?.charAt(0) || '')
                    );
                  })()}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',

                      alignItems: 'flex-start',
                    }}
                  >
                    <div>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: 'var(--16px-V)',
                         
                          marginBottom: 'var(--3px-V)',
                        }}
                      >
                        {sms.mode === "Representative_Automatic" && 'Rep - '}{tenantList.find(
                          (tenant) => tenant.phoneNumber === sms.receiver
                        )?.name || sms.receiver} 
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: 'var(--10px-V)',
                        
                          fontSize: 'var(--12px-V)',
                        }}
                      >
                        <span>
                          Room{' '}
                          {RoomList.find(
                            (room) =>
                              room.tenantId ===
                              tenantList.find(
                                (tenant) => tenant.phoneNumber === sms.receiver
                              )?.id
                          )?.roomIndex || '?'}
                        </span>
                        <span>•</span>
                        <span>
                          Floor{' '}
                          {RoomList.find(
                            (room) =>
                              room.tenantId ===
                              tenantList.find(
                                (tenant) => tenant.phoneNumber === sms.receiver
                              )?.id
                          )?.floor || '?'}
                        </span>
                          <span>•</span>
                        <span>
                          Number{' '}
                          {sms.receiver || '?'}
                        </span>
                        <span>•</span>
                        <span>{sms.mode || 'Unknown Mode'}</span>
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--14px-V)',
                        color: 'var(--Text-Color)',
                        fontWeight: 'bold',
                        textAlign: 'right',
                      }}
                    >
                      {new Date(sms.sentDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                      <div
                        style={{
                          fontSize: 'var(--12px-V)',
                          color: 'var(--Text-Color-Grey)',
                          fontWeight: 'normal',
                        }}
                      >
                        {new Date(sms.sentDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {expandedSmsId === sms.id && (
                    <div
                      style={{
                        backgroundColor: 'var(--Secondary-Color60)',
                        padding: 'var(--10px-V)',
                        borderRadius: 'var(--8px-V)',
                        marginTop: 'var(--5px-V)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 'var(--12px-V)',
                          color: 'var(--Text-Color-Grey)',
                          marginBottom: 'var(--5px-V)',
                        }}
                      >
                        Template:{' '}
                        {smsTemplates.find(
                          (template) => template.id === sms.templateId
                        )?.name || sms.templateId}
                      </div>
                      <pre
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordWrap: 'break-word',
                          fontSize: 'var(--13px-V)',
                          color: 'var(--Text-Color)',
                          margin: 0,
                        }}
                      >
                        {formatSmsBody(sms.body)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '150px',
              color: 'var(--Text-Color-Grey)',
              fontSize: 'var(--16px-V)',
              fontStyle: 'italic',
              backgroundColor: 'var(--Secondary-Color60)',
              borderRadius: 'var(--10px-V)',
              margin: 'var(--10px-V)',
            }}
          >
            No SMS found for the selected criteria.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashbSmsDetails;
