import { getValuesWithSql_Online } from 'Backend/OnlineServerApis';
import React, { useEffect, useState, useMemo } from 'react';

import { Input } from '../Helpers/CustomReactComponents';
import { LineChart } from '@mui/x-charts/LineChart';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { getValuesWithSql } from 'Backend/localServerApis';
import { useGlobal } from 'renderer/components/GlobalContext';
import loadingGif from "./../../../assets/assets/Loading/Rolling-1s-200px.gif"

interface props {
  SelectedUserId: string;
  RoomList: RoomType[];

}

type emailHistoryType = {
  id: string;
  receiver: string;
  subject: string;
  body: string;
  sentDate: number;
  templateId: string;
  userId: string;
  from: string;
  mode: string;
};

const DashbEmailHistory = ({ SelectedUserId, RoomList }: props) => {
  const [emailHistory, setEmailHistory] = useState<emailHistoryType[]>([]);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substr(0, 7)
  );
  const [searchConfig, setSearchConfig] = useState({
    receiver: '',
    subject: '',
    body: '',
    mode: '',
    room: '',
    floor: '',
  });
  const [advancedSearchVisible, setAdvancedSearchVisible] = useState(false);
  const [applyFiltersToGraph, setApplyFiltersToGraph] = useState(false);
  const [emailTemplates, setEmailTemplates] = useState<emailTemplate[]>([]);
  const {
    AllEmailTemplates,
    setAllEmailTemplates,AllTenants
  } = useGlobal();
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const fetchEmailHistory = async () => {
      setIsLoading(true);
      const emailHistoryRaw = await getValuesWithSql_Online(
        'email_history',
        `WHERE userId = '${SelectedUserId}'`
      );
      const emailTemplates = AllEmailTemplates;
      setEmailTemplates(emailTemplates);
      const sortedEmailHistory = emailHistoryRaw.sort(
        (a: emailHistoryType, b: emailHistoryType) => b.sentDate - a.sentDate
      );
      setEmailHistory(sortedEmailHistory);
      setIsLoading(false);
    };
    if (navigator.onLine) fetchEmailHistory();
  }, [SelectedUserId]);

  const toggleExpand = (id: string) => {
    setExpandedEmailId(expandedEmailId === id ? null : id);
  };

  const formatEmailBody = (body: string) => {
    return body.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  const filteredEmails = emailHistory.filter((email) => {
    const emailDate = new Date(email.sentDate);
    const [year, month] = selectedDate.split('-').map(Number);
    const tenant = AllTenants.find((t) => t.email === email.receiver);
    const room = RoomList.find((r) => r.tenantId === tenant?.id);

    return (
      emailDate.getMonth() + 1 === month &&
      emailDate.getFullYear() === year &&
      (searchConfig.receiver === '' ||
        email.receiver.toLowerCase().includes(searchConfig.receiver.toLowerCase())) &&
      (searchConfig.subject === '' ||
        email.subject.toLowerCase().includes(searchConfig.subject.toLowerCase())) &&
      (searchConfig.body === '' ||
        email.body.toLowerCase().includes(searchConfig.body.toLowerCase())) &&
      (searchConfig.mode === '' || email.mode === searchConfig.mode) &&
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

  const emailStats = useMemo(() => {
    const [year, month] = selectedDate.split('-').map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    const daysInMonth = eachDayOfInterval({
      start: monthStart,
      end: monthEnd,
    });

    const emailsToCount = applyFiltersToGraph ? filteredEmails : emailHistory;

    const dailyEmailCounts = daysInMonth.map((day) => {
      const dayEmails = emailsToCount.filter((email) => {
        const emailDate = new Date(email.sentDate);
        return (
          emailDate.getDate() === day.getDate() &&
          emailDate.getMonth() === day.getMonth() &&
          emailDate.getFullYear() === day.getFullYear()
        );
      });
      return {
        date: format(day, 'd'),
        emails: dayEmails.length,
      };
    });

    const totalEmails = emailsToCount.filter((email) => {
      const emailDate = new Date(email.sentDate);
      return emailDate >= monthStart && emailDate <= monthEnd;
    }).length;

    const highestDailyEmails = Math.max(...dailyEmailCounts.map((d) => d.emails));
    const averageDailyEmails = totalEmails / daysInMonth.length;

    return {
      dailyEmailCounts,
      totalEmails,
      highestDailyEmails,
      averageDailyEmails,
    };
  }, [selectedDate, emailHistory, filteredEmails, applyFiltersToGraph]);

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
              dataKey: 'emails',
              label: 'Emails Sent',
              area: true,
              valueFormatter: (value) => value?.toString() || '0',
            },
          ]}
          dataset={emailStats.dailyEmailCounts}
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
      return <div>Error rendering email chart</div>;
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
        position: 'relative',
      }}
    >
      {isLoading && <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <img src={loadingGif} alt="Loading..." style={{width:'100px',height:'100px'}}/>
        </div>
      </div>}
      <h1 style={{ margin: 'var(--10px-V)' }}>Email History</h1>

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
            Total Emails: <strong>{emailStats.totalEmails}</strong>
          </p>
          <p>
            Highest Daily: <strong>{emailStats.highestDailyEmails}</strong>
          </p>
          <p>
            Average Daily:{' '}
            <strong>{emailStats.averageDailyEmails.toFixed(1)}</strong>
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
              <label>Email Address:</label>
              <input
                type="text"
                placeholder="Search email..."
                value={searchConfig.receiver}
                onChange={(e) => handleSearchChange('receiver', e.target.value)}
                style={{ marginBottom: 'var(--10px-V)' }}
              />
            </div>
            <div>
              <label>Subject:</label>
              <input
                type="text"
                placeholder="Search subject..."
                value={searchConfig.subject}
                onChange={(e) => handleSearchChange('subject', e.target.value)}
                style={{ marginBottom: 'var(--10px-V)' }}
              />
            </div>
            <div>
              <label>Body Content:</label>
              <input
                type="text"
                placeholder="Search email body..."
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
                  subject: '',
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
        {filteredEmails.length} emails sent in{' '}
        {new Date(selectedDate).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}
      </p>

      <div style={{ width: '90%', height: '100%' }}>
        {filteredEmails.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--10px-V)',
              padding: 'var(--5px-V)',
              width: '100%',
            }}
          >
            {filteredEmails.map((email) => (
              <div
                key={email.id}
                onClick={() => toggleExpand(email.id)}
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
  const tenant = AllTenants.find((tenant) => tenant.email === email.receiver);
  if (tenant?.name) {
    const words = tenant.name.split(' ');
    return (words[0]?.charAt(0) || '') + (words[1]?.charAt(0) || '');
  } else {
    // Use email's first letter if no name found
    return email.receiver.charAt(0).toUpperCase();
  }
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
                        {AllTenants.find(
                          (tenant) => tenant.email === email.receiver
                        )?.name || email.receiver}
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
                              AllTenants.find(
                                (tenant) => tenant.email === email.receiver
                              )?.id
                          )?.roomIndex || '?'}
                        </span>
                        <span>•</span>
                        <span>
                          Floor{' '}
                          {RoomList.find(
                            (room) =>
                              room.tenantId ===
                              AllTenants.find(
                                (tenant) => tenant.email === email.receiver
                              )?.id
                          )?.floor || '?'}
                        </span>
                        <span>•</span>
                        <span>{email.from}</span>
                        <span>•</span>
                        <span>{email.mode || 'Unknown Mode'}</span>
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
                      {new Date(email.sentDate).toLocaleDateString('en-US', {
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
                        {new Date(email.sentDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {expandedEmailId === email.id && (
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
                        {emailTemplates.find(
                          (template) => template.id === email.templateId
                        )?.name || email.templateId}
                      </div>
                      <div
                        style={{
                          fontSize: 'var(--14px-V)',
                          fontWeight: 'bold',
                          marginBottom: 'var(--5px-V)',
                        }}
                      >
                        {email.subject}
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
                        {formatEmailBody(email.body)}
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
              height: 'var(--50px-V)',
              color: 'var(--Text-Color-Grey)',
              fontSize: 'var(--16px-V)',
              fontStyle: 'italic',
              backgroundColor: 'var(--Secondary-Color60)',
              borderRadius: 'var(--10px-V)',
              margin: 'var(--10px-V)',
            }}
          >
            No emails found for the selected criteria. Try clearing all Filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default DashbEmailHistory;
