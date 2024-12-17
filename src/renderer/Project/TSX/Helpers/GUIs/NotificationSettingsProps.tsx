import React, { useEffect, useState } from 'react';
import { Input } from '../CustomReactComponents';
import {
  addValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
import { useGlobal } from 'renderer/components/GlobalContext';

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

// Bit settings explanation:
// For each notification type (index), we use 4 bits:
// bit 0 (index * 4): email enabled
// bit 1 (index * 4 + 1): sms enabled  
// bit 2 (index * 4 + 2): email self enabled
// bit 3 (index * 4 + 3): sms self enabled

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
    Record<string, { email?: string; sms?: string; emailSelf?: string; smsSelf?: string }>
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
  const {
    AllEmailTemplates,
    setAllEmailTemplates,
    AllSmsTemplates,
    setAllSmsTemplates,
    AllNotificationTemplateSelections,
    setAllNotificationTemplateSelections,
  } = useGlobal();
  useEffect(() => {
    const fetchEmailTemplates = async () => {
      const templates = AllEmailTemplates;
      setEmailTemplates(templates);
    };
    const fetchSmsTemplates = async () => {
      const templates = AllSmsTemplates;
      setSmsTemplates(templates);
    };
    const fetchSelectedTemplates = async () => {
      const selections = AllNotificationTemplateSelections;
      const selectionsMap = selections.reduce((acc, selection) => {
        const expectedId = `${roomId}_${selection.notification_type}`;
        if (selection.id === expectedId) {
          acc[selection.notification_type] = {
            email: selection.email_template_id,
            sms: selection.sms_template_id,
            emailSelf: selection.email_self_template_id,
            smsSelf: selection.sms_self_template_id
          };
        }
        return acc;
      }, {} as Record<string, { email?: string; sms?: string; emailSelf?: string; smsSelf?: string }>);
      setSelectedTemplates(selectionsMap);
    };

    fetchEmailTemplates();
    fetchSmsTemplates();
    fetchSelectedTemplates();
  }, [userId, roomId]);

  const toggleSetting = (index: number, type: string, settingType: 'email' | 'emailSelf') => {
    const bitOffset = settingType === 'email' ? 0 : 2;
    const newSettings = notificationSettings ^ (1 << (index * 4 + bitOffset));
    setNotificationSettings(newSettings);

    const isEnabled = (newSettings & (1 << (index * 4 + bitOffset))) !== 0;
    if (isEnabled && !selectedTemplates[type]) {
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

  const toggleSmsSetting = (index: number, isSelf: boolean) => {
    const bitOffset = isSelf ? 3 : 1;
    setNotificationSettings(notificationSettings ^ (1 << (index * 4 + bitOffset)));
  };

  const handleTemplateChange = async (
    notificationType: string,
    templateId: string,
    type: 'email' | 'sms' | 'emailSelf' | 'smsSelf'
  ) => {
    setSelectedTemplates((prev) => ({
      ...prev,
      [notificationType]: {
        ...prev[notificationType],
        [type]: templateId,
      },
    }));

    const dbFieldMap = {
      email: 'email_template_id',
      sms: 'sms_template_id',
      emailSelf: 'email_self_template_id',
      smsSelf: 'sms_self_template_id'
    };

    const NotificationSettingsSelectionRaw = AllNotificationTemplateSelections.filter(
      (selection) => selection.id === `${roomId}_${notificationType}` && selection.notification_type === notificationType
    );

    if (NotificationSettingsSelectionRaw.length === 0) {
      await addValue(
        'notification_template_selections',
        {
          id: `${roomId}_${notificationType}`,
          notification_type: notificationType,
          [dbFieldMap[type]]: templateId,
          userId: userId,
          branchId: SelectedBranchId,
        },
        setChangeMade
      );
      setAllNotificationTemplateSelections([...AllNotificationTemplateSelections, {
        id: `${roomId}_${notificationType}`,
        notification_type: notificationType,
        [dbFieldMap[type]]: templateId,
        userId: userId,
        branchId: SelectedBranchId,
      },]);
    } else {
      await updateValue(
        'notification_template_selections',
        `${roomId}_${notificationType}`,
        dbFieldMap[type],
        templateId,
        setChangeMade,
        selectedTemplates[notificationType]
      );
      setAllNotificationTemplateSelections(AllNotificationTemplateSelections.map(selection =>
        selection.id === `${roomId}_${notificationType}`
          ? { ...selection, [dbFieldMap[type]]: templateId }
          : selection
      ));
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
              (notificationSettings & (1 << (index * 4))) !== 0 ||
              (notificationSettings & (1 << (index * 4 + 1))) !== 0 ||
              (notificationSettings & (1 << (index * 4 + 2))) !== 0 ||
              (notificationSettings & (1 << (index * 4 + 3))) !== 0
                ? 'var(--Secondary-Color60)'
                : 'var(--Secondary-Color30)',
            borderRadius: 'var(--5px-V)',
          }}
        >
          <div style={{ width: 'var(--150px-V)' }}>{type}</div>

          <div>
            {/* Client notifications */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 4))) !== 0}
                onChange={() => toggleSetting(index, type, 'email')}
                style={{ marginRight: 'var(--5px-V)' }}
              />
              <label style={{ marginRight: 'var(--5px-V)' }}>Email Tenant</label>
              {(notificationSettings & (1 << (index * 4))) !== 0 && (
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
                checked={(notificationSettings & (1 << (index * 4 + 1))) !== 0}
                onChange={() => toggleSmsSetting(index, false)}
                style={{ marginRight: 'var(--5px-V)' }}
              />
              <label style={{ marginRight: 'var(--10px-V)' }}>SMS Tenant</label>
              {(notificationSettings & (1 << (index * 4 + 1))) !== 0 && (
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

            {/* Self notifications */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
              }}
              title='You can select representative email in the email templates settings'
            >
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 4 + 2))) !== 0}
                onChange={() => toggleSetting(index, type, 'emailSelf')}
                style={{ marginRight: 'var(--5px-V)' }}
              />
              <label style={{ marginRight: 'var(--5px-V)' }}>Email Representative</label>
              
            </div>

            <div style={{ display: 'flex', alignItems: 'center' }} 
              title='You can select representative phonenumber in the sms templates settings'
            >
              <input
                type="checkbox"
                checked={(notificationSettings & (1 << (index * 4 + 3))) !== 0}
                onChange={() => toggleSmsSetting(index, true)}
                style={{ marginRight: 'var(--5px-V)' }}
              />
              <label style={{ marginRight: 'var(--10px-V)' }}>SMS Representative</label>
             
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default React.memo(NotificationSettingsTable);
