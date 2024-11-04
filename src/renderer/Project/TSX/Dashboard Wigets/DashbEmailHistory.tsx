import { getValuesWithSql_Online } from 'Backend/OnlineServerApis';
import React, { useEffect, useState } from 'react';
import '../../CSS/ToolsPage.css';

interface props {
  SelectedUserId: string;
  RoomList: RoomType[];
  tenantList: TenantType[];
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
const DashbEmailHistory = ({ SelectedUserId, RoomList, tenantList }: props) => {
  const [emailHistory, setEmailHistory] = useState<emailHistoryType[]>([]);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().substr(0, 7)
  );
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<string>('');
  const [roomSearch, setRoomSearch] = useState<string>('');
  const [floorSearch, setFloorSearch] = useState<string>('');

  useEffect(() => {
    const fetchEmailHistory = async () => {
      const emailHistoryRaw = await getValuesWithSql_Online(
        'email_history',
        `WHERE userId = '${SelectedUserId}'`
      );
      const sortedEmailHistory = emailHistoryRaw.sort(
        (a: emailHistoryType, b: emailHistoryType) => b.sentDate - a.sentDate
      );
      setEmailHistory(sortedEmailHistory);
    };
    fetchEmailHistory();
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
    const tenant = tenantList.find((t) => t.email === email.receiver);
    const room = RoomList.find((r) => r.tenantId === tenant?.id);
    return (
      emailDate.getMonth() + 1 === month &&
      emailDate.getFullYear() === year &&
      (email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        email.receiver.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterMode === '' || email.mode === filterMode) &&
      (roomSearch === '' || room?.roomIndex.toString() === roomSearch) &&
      (floorSearch === '' || room?.floor.toString() === floorSearch)
    );
  });

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
      <h1 style={{ margin: 'var(--10px-V)' }}>Email History</h1>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '90%',
          marginBottom: 'var(--20px-V)',
        }}
      >
        <input
          type="month"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <input
          type="text"
          placeholder="Search emails..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          value={filterMode}
          onChange={(e) => setFilterMode(e.target.value)}
        >
          <option value="">All Modes</option>
          <option value="Manually">Manually</option>
          <option value="Automatically">Automatically</option>
        </select>
        <input
          type="text"
          placeholder="Room number..."
          value={roomSearch}
          onChange={(e) => setRoomSearch(e.target.value)}
          style={{ width: 'var(--100px-V)' }}
        />
        <input
          type="text"
          placeholder="Floor number..."
          style={{ width: 'var(--100px-V)' }}
          value={floorSearch}
          onChange={(e) => setFloorSearch(e.target.value)}
        />
      </div>
      <p>
        {filteredEmails.length} emails sent in{' '}
        {new Date(selectedDate).toLocaleString('default', {
          month: 'long',
          year: 'numeric',
        })}
      </p>
      <div style={{ overflowY: 'auto', width: '100%', height: '100%' }}>
        {filteredEmails.length > 0 ? (
          filteredEmails.map((email) => (
            <div
              key={email.id}
              onClick={() => toggleExpand(email.id)}
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
                        (tenant) => tenant.email === email.receiver
                      )?.name
                    }{' '}
                    - Rm.{' '}
                    {
                      RoomList.find(
                        (room) =>
                          room.tenantId ===
                          tenantList.find(
                            (tenant) => tenant.email === email.receiver
                          )?.id
                      )?.roomIndex
                    }{' '}
                    Flr.{' '}
                    {
                      RoomList.find(
                        (room) =>
                          room.tenantId ===
                          tenantList.find(
                            (tenant) => tenant.email === email.receiver
                          )?.id
                      )?.floor
                    }
                    ) {email.receiver} - sent with {email.from}
                  </p>
                  <p>
                    <strong>Sent:</strong>{' '}
                    {new Date(email.sentDate).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(email.sentDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    })}
                  </p>
                  <p>
                    <strong>Subject:</strong> {email.subject}
                  </p>
                  <p>
                    <strong>Mode:</strong> {email.mode || 'Unknown'}
                  </p>
                </div>
                <div style={{ fontSize: 'var(--24px-V)', marginLeft: 'var(--10px-V)' }}>
                  {expandedEmailId === email.id ? '▼' : '▶'}{' '}
                  {/* Show down arrow if expanded, right arrow if not */}
                </div>
              </div>
              {expandedEmailId === email.id && (
                <div>
                  <p>
                    <strong>Template ID:</strong> {email.templateId}
                  </p>

                  <p>
                    <strong>Body:</strong>
                  </p>
                  <pre
                    style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}
                  >
                    {formatEmailBody(email.body)}
                  </pre>
                </div>
              )}
            </div>
          ))
        ) : (
          <>No emails found for the selected criteria.</>
        )}
      </div>
    </div>
  );
};

export default DashbEmailHistory;
