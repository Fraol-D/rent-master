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
  roomId: string;
}

interface EmailTemplate {
  id: string;
  name: string;
}

const NotificationSettingsTable: React.FC<NotificationSettingsProps> = ({
  notificationSettings,
  setNotificationSettings,
  userId,
  setChangeMade,
  roomId,
}) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<
    Record<string, string>
  >({});

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
        `WHERE userId = '${userId}'`
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

  const toggleSetting = (index: number) => {
    setNotificationSettings(notificationSettings ^ (1 << (index * 2)));
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
          userId: userId,
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

  return (
    <table style={{ fontSize: '14px', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: '5px', textAlign: 'left' }}>Notification</th>
          <th style={{ padding: '5px', textAlign: 'center' }}>Email</th>
          <th style={{ padding: '5px', textAlign: 'center' }}>SMS</th>
          <th style={{ padding: '5px', textAlign: 'center' }}>
            Email Template
          </th>
        </tr>
      </thead>
      <tbody>
        {notificationTypes.map((type, index) => (
          <tr key={index}>
            <td style={{ padding: '5px' }}>{type}</td>
            <td style={{ padding: '5px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 2))) !== 0}
                onChange={() => toggleSetting(index)}
              />
            </td>
            <td style={{ padding: '5px', textAlign: 'center' }}>
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 2 + 1))) !== 0}
                onChange={() => toggleSmsSetting(index)}
              />
            </td>
            <td style={{ padding: '5px', textAlign: 'center' }}>
              <select
                value={selectedTemplates[type] || ''}
                onChange={(e) => handleTemplateChange(type, e.target.value)}
              >
                <option value="">Select a template</option>
                {emailTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default React.memo(NotificationSettingsTable);
