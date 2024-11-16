import React, { useState } from 'react';

interface NotificationSettings {
  email: {
    paymentDates: boolean;
    expenseReminders: boolean;
    contractEndDates: boolean;
  };
  sms: {
    paymentDates: boolean;
    expenseReminders: boolean;
    contractEndDates: boolean;
  };
}

const NotificationPanel: React.FC = ({ RoomList }: any) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('');
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    email: {
      paymentDates: true,
      expenseReminders: false,
      contractEndDates: true,
    },
    sms: {
      paymentDates: false,
      expenseReminders: false,
      contractEndDates: false,
    },
  });

  const handleSettingChange = (
    method: 'email' | 'sms',
    setting: keyof typeof notificationSettings.email,
    value: boolean
  ) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [method]: {
        ...prev[method],
        [setting]: value,
      },
    }));
  };

  return (
    <div className="notification-panel" style={{
      padding: 'var(--20px-V)',
      backgroundColor: 'var(--Background-Color)',
      borderRadius: 'var(--8px-V)',
    }}>
      <h2 style={{ 
        color: 'var(--Text-Color)',
        marginBottom: 'var(--20px-V)',
      }}>Notification Settings</h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 'var(--20px-V)',
      }}>
        {/* Email Settings */}
        <div style={{
          padding: 'var(--16px-V)',
          backgroundColor: 'var(--Secondary-Color60)',
          borderRadius: 'var(--8px-V)',
        }}>
          <h3 style={{ 
            color: 'var(--Text-Color)',
            marginBottom: 'var(--16px-V)',
          }}>Email Notifications</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--12px-V)' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={notificationSettings.email.paymentDates}
                onChange={(e) => handleSettingChange('email', 'paymentDates', e.target.checked)}
                style={{ marginRight: 'var(--8px-V)' }}
              />
              Payment Dates
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={notificationSettings.email.expenseReminders}
                onChange={(e) => handleSettingChange('email', 'expenseReminders', e.target.checked)}
                style={{ marginRight: 'var(--8px-V)' }}
              />
              Expense Reminders
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={notificationSettings.email.contractEndDates}
                onChange={(e) => handleSettingChange('email', 'contractEndDates', e.target.checked)}
                style={{ marginRight: 'var(--8px-V)' }}
              />
              Contract End Dates
            </label>
          </div>
        </div>

        {/* SMS Settings */}
        <div style={{
          padding: 'var(--16px-V)',
          backgroundColor: 'var(--Secondary-Color60)',
          borderRadius: 'var(--8px-V)',
        }}>
          <h3 style={{ 
            color: 'var(--Text-Color)',
            marginBottom: 'var(--16px-V)',
          }}>SMS Notifications</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--12px-V)' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={notificationSettings.sms.paymentDates}
                onChange={(e) => handleSettingChange('sms', 'paymentDates', e.target.checked)}
                style={{ marginRight: 'var(--8px-V)' }}
              />
              Payment Dates
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={notificationSettings.sms.expenseReminders}
                onChange={(e) => handleSettingChange('sms', 'expenseReminders', e.target.checked)}
                style={{ marginRight: 'var(--8px-V)' }}
              />
              Expense Reminders
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              color: 'var(--Text-Color)',
              cursor: 'pointer',
            }}>
              <input
                type="checkbox"
                checked={notificationSettings.sms.contractEndDates}
                onChange={(e) => handleSettingChange('sms', 'contractEndDates', e.target.checked)}
                style={{ marginRight: 'var(--8px-V)' }}
              />
              Contract End Dates
            </label>
          </div>
        </div>
      </div>

      <div style={{
        marginTop: 'var(--20px-V)',
        display: 'flex',
        justifyContent: 'flex-end',
      }}>
        <button
          onClick={() => {
            // Save notification settings to electron store
            window.electron.store.set('notificationSettings', notificationSettings);
          }}
          style={{
            padding: 'var(--8px-V) var(--16px-V)',
            backgroundColor: 'var(--Primary-Color)',
            color: 'var(--Text-Color)',
            border: 'none',
            borderRadius: 'var(--4px-V)',
            cursor: 'pointer',
          }}
        >
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default React.memo(NotificationPanel);
