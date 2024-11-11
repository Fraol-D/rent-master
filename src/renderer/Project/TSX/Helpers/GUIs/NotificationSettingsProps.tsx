import React, { useEffect, useState } from 'react';
import { Input } from '../CustomReactComponents';
import {
  addValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';

interface NotificationSettingsProps {
  notificationSettings: number;
  setNotificationSettings: (settings: number) => void;
  userId: string;
  setChangeMade: any;
  roomId: string;
  SelectedBranchId: any;
}

interface EmailTemplate {
  id: string;
  name: string;
}

interface ValidationState {
  [key: string]: boolean;
}

const NotificationSettingsTable: React.FC<NotificationSettingsProps> = ({
  notificationSettings,
  setNotificationSettings,
  userId,
  setChangeMade,
  roomId,
  SelectedBranchId,
}) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<
    Record<string, { email?: string; sms?: string }>
  >({});
  const [templateValidation, setTemplateValidation] = useState<ValidationState>(
    {}
  );

  const notificationTypes = [
    '5 days before due',
    '3 days before due',
    '1 day before due',
    'On due date',
    '1 day after due',
    '3 days after due',
    '5 days after due',
    '7 days after due',
  ];

  useEffect(() => {
    const fetchEmailTemplates = async () => {
      const templates = await getValuesWithSql('email_templates', 'WHERE 1');
      setEmailTemplates(templates);
    };
    const fetchSmsTemplates = async () => {
      const templates = await getValuesWithSql('sms_templates', 'WHERE 1');
      setSmsTemplates(templates);
    };
    const fetchSelectedTemplates = async () => {
      const selections = await getValuesWithSql(
        'notification_template_selections',
        `WHERE userId = '${userId}' AND branchId = '${SelectedBranchId}'`
      );
      const selectionsMap = selections.reduce((acc, selection) => {
        const expectedId = `${roomId}_${selection.notification_type}`;
        if (selection.id === expectedId) {
          acc[selection.notification_type] = {
            email: selection.email_template_id,
            sms: selection.sms_template_id
          };
        }
        return acc;
      }, {} as Record<string, { email?: string; sms?: string }>);
      setSelectedTemplates(selectionsMap);
    };

    fetchEmailTemplates();
    fetchSmsTemplates();
    fetchSelectedTemplates();
  }, [userId, roomId]);

  const toggleSetting = (index: number, type: string) => {
    const newSettings = notificationSettings ^ (1 << (index * 2));
    setNotificationSettings(newSettings);

    const isEmailEnabled = (newSettings & (1 << (index * 2))) !== 0;
    if (isEmailEnabled && !selectedTemplates[type]) {
      setTemplateValidation((prev) => ({
        ...prev,
        [type]: true,
      }));
    } else {
      setTemplateValidation((prev) => ({
        ...prev,
        [type]: false,
      }));
    }
  };

  const toggleSmsSetting = (index: number) => {
    setNotificationSettings(notificationSettings ^ (1 << (index * 2 + 1)));
  };

  const handleTemplateChange = async (
    notificationType: string,
    templateId: string,
    EmailOrSms: 'email' | 'sms'
  ) => {
    setSelectedTemplates((prev) => ({
      ...prev,
      [notificationType]: {
        ...prev[notificationType],
        [EmailOrSms]: templateId,
      },
    }));
    const NotificationSettingsSelectionRaw = await getValuesWithSql(
      'notification_template_selections',
      `WHERE id = '${roomId}_${notificationType}' AND notification_type = '${notificationType}'`
    );
    if (NotificationSettingsSelectionRaw.length === 0) {
      await addValue(
        'notification_template_selections',
        {
          id: `${roomId}_${notificationType}`,
          notification_type: notificationType,
          [EmailOrSms === 'email' ? 'email_template_id' : 'sms_template_id']: templateId,
          userId: userId,
          branchId: SelectedBranchId,
        },
        setChangeMade
      );
    } else {
      await updateValue(
        'notification_template_selections',
        `${roomId}_${notificationType}`,
        EmailOrSms === 'email' ? 'email_template_id' : 'sms_template_id',
        templateId,
        setChangeMade,
        selectedTemplates[notificationType]
      );
    }
  };
  const handleTemplateChangeSms = async (
    notificationType: string,
    templateId: string
  ) => {
    setSelectedTemplates((prev) => ({
      ...prev,
      [notificationType]: templateId,
    }));
    const NotificationSettingsSelectionRaw = await getValuesWithSql(
      'notification_template_selections',
      `WHERE id = '${roomId}_${notificationType}' AND notification_type = '${notificationType}'`
    );
    if (NotificationSettingsSelectionRaw.length === 0) {
      await addValue(
        'notification_template_selections',
        {
          id: `${roomId}_${notificationType}`,
          notification_type: notificationType,
          sms_template_id: templateId,
          userId: userId,
          branchId: SelectedBranchId,
        },
        setChangeMade
      );
    } else {
      await updateValue(
        'notification_template_selections',
        `${roomId}_${notificationType}`,
        'sms_template_id',
        templateId,
        setChangeMade,
        selectedTemplates[notificationType]
      );
    }
  };
  const getSelectStyle = (type: string) => ({
    border: templateValidation[type]
      ? 'var(--2px-V) solid red'
      : 'var(--1px-V) solid var(--Border-Color)',
    borderRadius: 'var(--4px-V)',
    padding: 'var(--4px-V)',
    width: '100%',
  });

  return (
    <div style={{ fontSize: 'var(--14px-V)' }}>
      {notificationTypes.map((type, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 'var(--10px-V)',
            padding: 'var(--5px-V)',
            backgroundColor:
              (notificationSettings & (1 << (index * 2))) !== 0 ||
              (notificationSettings & (1 << (index * 2 + 1))) !== 0
                ? 'var(--Secondary-Color60)'
                : 'var(--Secondary-Color30)',
            borderRadius: 'var(--5px-V)',
          }}
        >
          <div style={{ width: 'var(--150px-V)' }}>{type}</div>

          <div>
            <div
              style={{
                marginBottom: 'var(--5px-V)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 2))) !== 0}
                onChange={() => toggleSetting(index, type)}
                style={{ marginRight: 'var(--5px-V)' }}
              />
              <label style={{ marginRight: 'var(--5px-V)' }}>Email</label>
              {(notificationSettings & (1 << (index * 2))) !== 0 && (
                <div>
                  <select
                    value={selectedTemplates[type]?.email || ''}
                    onChange={(e) => {
                      handleTemplateChange(type, e.target.value, 'email');
                      setTemplateValidation((prev) => ({
                        ...prev,
                        [type]: false,
                      }));
                    }}
                    style={getSelectStyle(type)}
                  >
                    <option value="">Select a template</option>
                    {emailTemplates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}{' '}
                        {template.name === type && 'RECOMMENDED'}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 2 + 1))) !== 0}
                onChange={() => toggleSmsSetting(index)}
                style={{ marginRight: 'var(--5px-V)' }}
              />
              <label style={{ marginRight: 'var(--10px-V)' }}>SMS </label>
              {(notificationSettings & (1 << (index * 2 + 1))) !== 0 && (
                 <select
                  value={selectedTemplates[type]?.sms || ''}
                  onChange={(e) => {
                    handleTemplateChange(type, e.target.value, 'sms');
                    setTemplateValidation((prev) => ({
                     ...prev,
                     [type]: false,
                   }));
                 }}
                 style={getSelectStyle(type)}
               >
                  <option value="">Select a template</option>
                  {smsTemplates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}{' '}
                     {template.name === type && 'RECOMMENDED'}
                   </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(NotificationSettingsTable);
