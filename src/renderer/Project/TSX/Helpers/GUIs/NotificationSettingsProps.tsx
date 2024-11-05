import React, { useEffect, useState } from 'react';
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
  roomId: string;SelectedBranchId:any
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
  roomId,SelectedBranchId
}) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<
    Record<string, string>
  >({});
  const [templateValidation, setTemplateValidation] = useState<ValidationState>({});

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

    const fetchSelectedTemplates = async () => {
      const selections = await getValuesWithSql(
        'notification_template_selections',
        `WHERE userId = '${userId}' AND branchId = '${SelectedBranchId}'`
      );
      const selectionsMap = selections.reduce((acc, selection) => {
        const expectedId = `${roomId}_${selection.notification_type}`;
        if (selection.id === expectedId) {
          acc[selection.notification_type] = selection.email_template_id;
        }
        return acc;
      }, {} as Record<string, string>);
      setSelectedTemplates(selectionsMap);
    };

    fetchEmailTemplates();
    fetchSelectedTemplates();
  }, [userId, roomId]);

  const toggleSetting = (index: number, type: string) => {
    const newSettings = notificationSettings ^ (1 << (index * 2));
    setNotificationSettings(newSettings);
    
    const isEmailEnabled = (newSettings & (1 << (index * 2))) !== 0;
    if (isEmailEnabled && !selectedTemplates[type]) {
      setTemplateValidation(prev => ({
        ...prev,
        [type]: true
      }));
    } else {
      setTemplateValidation(prev => ({
        ...prev,
        [type]: false
      }));
    }
  };

  const toggleSmsSetting = (index: number) => {
    setNotificationSettings(notificationSettings ^ (1 << (index * 2 + 1)));
  };

  const handleTemplateChange = async (
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
          email_template_id: templateId,
          userId: userId, branchId: SelectedBranchId,
        },
        setChangeMade
      );
    } else {
      // Update the selection in the database
      await updateValue(
        'notification_template_selections',
        `${roomId}_${notificationType}`,
        'email_template_id',
        templateId,
        setChangeMade, // You can add a callback function here if needed
        selectedTemplates[notificationType]
      );
    }
  };

  const getSelectStyle = (type: string) => ({
    border: templateValidation[type] ? 'var(--2px-V) solid red' : 'var(--1px-V) solid var(--Border-Color)',
    borderRadius: 'var(--4px-V)',
    padding: 'var(--4px-V)'
  });

  return (
    <table style={{ fontSize: 'var(--14px-V)', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'left' }}>Notification</th>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>Email</th>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>SMS</th>
          <th style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
            Email Template
          </th>
        </tr>
      </thead>
      <tbody>
        {notificationTypes.map((type, index) => (
          <tr key={index}>
            <td style={{ padding: 'var(--5px-V)' }}>{type}</td>
            <td style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 2))) !== 0}
                onChange={() => toggleSetting(index, type)}
              />
            </td>
            <td style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 2 + 1))) !== 0}
                onChange={() => toggleSmsSetting(index)}
              />
            </td>
            <td style={{ padding: 'var(--5px-V)', textAlign: 'center' }}>
              <select
                value={selectedTemplates[type] || ''}
                onChange={(e) => {
                  handleTemplateChange(type, e.target.value);
                  setTemplateValidation(prev => ({
                    ...prev,
                    [type]: false
                  }));
                }}
                style={getSelectStyle(type)}
              >
                <option value="">Select a template</option>
                {emailTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
              {templateValidation[type] && (
                <div style={{ 
                  color: 'red', 
                  fontSize: 'var(--12px-V)', 
                  position: 'absolute',
                  marginTop: 'var(--2px-V)' 
                }}>
                  Template required
                </div>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default React.memo(NotificationSettingsTable);
