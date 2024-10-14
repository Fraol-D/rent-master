import { getValuesWithSql_Online } from 'Backend/OnlineServerApis';
import React, { useEffect, useState } from 'react';
import '../../CSS/ToolsPage.css';

interface props {
  SelectedUserId: string;
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
const DashbEmailHistory = ({ SelectedUserId }: props) => {
  const [emailHistory, setEmailHistory] = useState<emailHistoryType[]>([]);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmailHistory = async () => {
      const emailHistoryRaw = await getValuesWithSql_Online(
        'email_history',
        `WHERE userId = '${SelectedUserId}'`
      );
      const sortedEmailHistory = emailHistoryRaw.sort((a: emailHistoryType, b: emailHistoryType) => b.sentDate - a.sentDate);
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

  return (
    <div style={{width: '100%',
      height: '95%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'}}>
      <h1 style={{ margin: '10px' }}>Email History</h1>
      
      {emailHistory.length > 0 ? emailHistory.map((email) => (
        <div
          key={email.id}
          onClick={() => toggleExpand(email.id)}
          className="email-template-container"
          style={{
            cursor: 'pointer',
            width: '90%',
            margin: '10px',
            padding: '10px',
            
            borderRadius: '5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p>
                <strong>To:</strong> {email.receiver} - sent with {email.from}
              </p>
              <p>
                <strong>Sent:</strong> {new Date(email.sentDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} - {new Date(email.sentDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
              <p>
                <strong>Subject:</strong> {email.subject}
              </p>
              <p>
                <strong>Mode:</strong> {email.mode || 'Unknown'}
              </p>
            </div>
            <div style={{ fontSize: '24px', marginLeft: '10px' }}>
              {expandedEmailId === email.id ? '▼' : '▶'} {/* Show down arrow if expanded, right arrow if not */}
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
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{formatEmailBody(email.body)}</pre>
            </div>
          )}
        </div>
      )): <>Email history needs internet connection to show, or you have not sent any emails yet.</>}
    </div>
  );
};

export default DashbEmailHistory;
