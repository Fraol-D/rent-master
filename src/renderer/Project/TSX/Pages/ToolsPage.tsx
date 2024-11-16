import { Input } from '../Helpers/CustomReactComponents';
import {
  addValue,
  getValuesWithSql,
  updateValue,
  deleteValue,
} from 'Backend/localServerApis';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import '../../CSS/ToolsPage.css';
import {
  addValueOnline,
  getValuesWithSql_Online,
} from 'Backend/OnlineServerApis';
import EmailTemplates from '../Tools page components/EmailTemplates';
import SMSTemplates from '../Tools page components/SMSTemplates';
import { getUserPrivileges } from 'renderer/App';
import { addDays } from 'date-fns';
const { v4: uuidv4 } = require('uuid');
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  Type: string;
}
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import {
  AllCurrencies,
  CurrencySign,
  formatNumberWithSuffix,
  GetCurrencyAsOptionsOnSelect,
  GetDefaultCurrency,
} from '../Helpers/CurrencySign';

interface SMSTemplate {
  id: string;
  name: string;
  body: string;
  Type: string;
}

const ToolsPage = ({
  setToolsSelectedPage,
  ToolsSelectedPage,
  setChangeMade,
  SelectedUserId,
  SelectedAppUser,
  SelectedBranchId,
}: any) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSMSTemplates] = useState<SMSTemplate[]>([]);
  const [expenses, setExpenses] = useState<expenses[]>([]);
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [editedTemplate, setEditedTemplate] = useState<
    EmailTemplate | SMSTemplate | null
  >(null);
  const [originalTemplate, setOriginalTemplate] = useState<
    EmailTemplate | SMSTemplate | expenses | null
  >(null);
  const [selectedInput, setSelectedInput] = useState<'subject' | 'body' | null>(
    null
  );
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const [tryOutMode, setTryOutMode] = useState<string | null>(null);
  const [variableValues, setVariableValues] = useState<Record<string, string>>(
    {}
  );

  const variables = [
    'tenant_name',
    'landlord_name',

    'due_amount',
    'due_date',
    'due_duration',

    'landlord_Email',
    'landlord_Telephone',

    'currency',
  ];

  const insertVariable = (variable: string) => {
    const variableText = `{{${variable}}}`;
    if (selectedInput === 'subject' && subjectInputRef.current) {
      const input = subjectInputRef.current;
      const start = input.selectionStart;
      const newValue =
        input.value.substring(0, start) +
        variableText +
        input.value.substring(start);
      handleEditChange('subject', newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(
          start + variableText.length,
          start + variableText.length
        );
      }, 0);
    } else if (selectedInput === 'body' && bodyTextareaRef.current) {
      const textarea = bodyTextareaRef.current;
      const start = textarea.selectionStart;
      const newValue =
        textarea.value.substring(0, start) +
        variableText +
        textarea.value.substring(start);
      handleEditChange('body', newValue);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(
          start + variableText.length,
          start + variableText.length
        );
      }, 0);
    }
  };
  // Start Generation Here
  const [sendEmail, setSendEmail] = useState(false);
  const [emailDaysBefore, setEmailDaysBefore] = useState('');
  const [sendSms, setSendSms] = useState(false);
  const [smsDaysBefore, setSmsDaysBefore] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [smsTo, setSmsTo] = useState('');
  const [isApplyingNotifications, setIsApplyingNotifications] = useState(false);

  const [
    ShowDefaultNotificationsSettings,
    setShowDefaultNotificationsSettings,
  ] = useState(false);

  const applyDefaultNotifications = async () => {
    if (sendEmail) {
      if (!emailDaysBefore || emailDaysBefore === '') {
        alert('Please enter days before for email notification');
        return;
      }
    }
    if (sendSms) {
      if (!validatePhoneNumber(smsTo)) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }

      if (!smsDaysBefore || smsDaysBefore === '') {
        alert('Please enter days before for SMS notification');
        return;
      }
    }
    try {
      setEditingExpenseId(null);
      setEditedExpense(null);
      setIsApplyingNotifications(true);
      // Create the notification settings object
      const notificationSettings = {
        sendEmail,

        emailDaysBefore: parseInt(emailDaysBefore) || 0,
        sendSms,

        smsDaysBefore: parseInt(smsDaysBefore) || 0,
        emailTo,
        smsTo,
      };

      // Update all expenses with the new notification settings
      for (const expense of expenses) {
        // Update local database
        for (const [key, value] of Object.entries(notificationSettings)) {
          await updateValue('expenses', expense.id, key, value, setChangeMade);
        }
      }

      // Refresh the expenses list
      await getExpenses();
      setShowDefaultNotificationsSettings(false);
      alert('Default notifications applied to all expenses successfully!');
    } catch (error) {
      console.error('Error applying default notifications:', error);
      alert('Failed to apply default notifications. Please try again.');
    } finally {
      setIsApplyingNotifications(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
  };
  const fetchEmailTemplates = async () => {
    const templates = await getValuesWithSql('email_templates', 'WHERE 1');
    setEmailTemplates(templates);
  };
  const getSMSTemplates = async () => {
    const templates = await getValuesWithSql('sms_templates', 'WHERE 1');
    setSMSTemplates(templates);
  };
  useEffect(() => {
    if (ToolsSelectedPage === 'EmailTemplates') {
      fetchEmailTemplates();
    } else if (ToolsSelectedPage === 'SMSTemplates') {
      getSMSTemplates();
    } else if (ToolsSelectedPage === 'Expense Manager') {
      getExpenses();
    }
  }, [ToolsSelectedPage]);
  const getExpenses = async () => {
    const rawExpenses = await getValuesWithSql(
      'expenses',
      `WHERE 1 AND branchId = '${SelectedBranchId}'`
    );

    const mappedExpenses = rawExpenses.map((expense: any) => ({
      id: expense.id,
      name: expense.name,
      description: expense.description,
      price: Number(expense.price),
      fullBuilding: Boolean(expense.fullBuilding),
      floor: Number(expense.floor),
      room: Number(expense.room),
      doesReoccur: Boolean(expense.doesReoccur),
      recurringCycle: Number(expense.recurringCycle),
      date: Number(expense.date),
      recurringType: expense.recurringType as 'Day' | 'Monthly' | 'Yearly',
      HasEndDate: Boolean(expense.HasEndDate),
      EndDate: expense.EndDate ? Number(expense.EndDate) : null,
      sendEmail: Boolean(expense.sendEmail),
      emailTemplate: expense.emailTemplate,
      emailDaysBefore: Number(expense.emailDaysBefore),
      sendSms: Boolean(expense.sendSms),
      smsTemplate: expense.smsTemplate,
      smsDaysBefore: Number(expense.smsDaysBefore),
      emailTo: expense.emailTo,
      smsTo: expense.smsTo,
      Currency: expense.Currency,
      userId: expense.userId,
      branchId: expense.branchId,
      showNotifySettings: Boolean(expense.showNotifySettings),
    }));

    setExpenses(mappedExpenses);
  };
  const ChangeEmailTemplateValues = async (
    id: string,
    name: string,
    subject: string,
    body: string,
    Type: string
  ) => {
    const updatedTemplates = emailTemplates.map((template) =>
      template.id === id ? { ...template, name, subject, body, Type } : template
    );
    setEmailTemplates(updatedTemplates);

    await updateValue(
      'email_templates',
      id,
      'body',
      body,
      setChangeMade,
      originalTemplate?.body
    );
    await updateValue(
      'email_templates',
      id,
      'subject',
      subject,
      setChangeMade,
      originalTemplate?.subject
    );

    await updateValue(
      'email_templates',
      id,
      'name',
      name,
      setChangeMade,
      originalTemplate?.name
    );
    setEditingTemplateId(null);
    setEditedTemplate(null);
  };

  const ChangeSMSTemplateValues = async (
    id: string,
    name: string,
    body: string
  ) => {
    const updatedTemplates = smsTemplates.map((template) =>
      template.id === id ? { ...template, name, body } : template
    );
    setSMSTemplates(updatedTemplates);

    await updateValue(
      'sms_templates',
      id,
      'body',
      body,
      setChangeMade,
      originalTemplate?.body
    );
    await updateValue(
      'sms_templates',
      id,
      'name',
      name,
      setChangeMade,
      originalTemplate?.name
    );
    setEditingTemplateId(null);
    setEditedTemplate(null);
  };

  const deleteEmailTemplate = async (id: string) => {
    await deleteValue('email_templates', id, setChangeMade);
    setEmailTemplates(emailTemplates.filter((template) => template.id !== id));
  };

  const deleteSMSTemplate = async (id: string) => {
    await deleteValue('sms_templates', id, setChangeMade);
    setSMSTemplates(smsTemplates.filter((template) => template.id !== id));
  };

  const formatEmailBody = (body: string) => {
    const parts = body.split(/(\{\{.*?\}\}|\n)/);
    return parts.map((part, index) => {
      if (part.match(/^\{\{.*?\}\}$/)) {
        return (
          <span key={index} className="variable-highlight">
            {part}
          </span>
        );
      } else if (part === '\n') {
        return <br key={index} />;
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };
  const validateEmailTo = (email: string) => {
    const emails = email.split(',').map((e) => e.trim());
    return emails.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  };

  const validatePhoneNumberTo = (phone: string) => {
    const phones = phone.split(',').map((p) => p.trim());
    return phones.every((p) => /^\+?[\d\s-]{10,}$/.test(p));
  };
  const toggleTemplate = (id: string) => {
    setOpenTemplateId(openTemplateId === id ? null : id);
  };

  const extractVariables = (body: string) => {
    const regex = /\{\{(.*?)\}\}/g;
    const matches = body.match(regex);
    return matches ? [...new Set(matches)] : [];
  };

  const startEditing = (template: EmailTemplate | SMSTemplate) => {
    setEditingTemplateId(template.id);
    setEditedTemplate({ ...template });
    setOriginalTemplate({ ...template });
  };

  const cancelEditing = () => {
    setEditingTemplateId(null);
    setEditedTemplate(null);
  };

  const handleEditChange = (
    field: keyof EmailTemplate | keyof SMSTemplate,
    value: string
  ) => {
    if (editedTemplate) {
      setEditedTemplate({ ...editedTemplate, [field]: value });
    }
  };

  const saveChanges = () => {
    if (editedTemplate) {
      if (ToolsSelectedPage === 'EmailTemplates') {
        ChangeEmailTemplateValues(
          editedTemplate.id,
          editedTemplate.name,
          (editedTemplate as EmailTemplate).subject,
          editedTemplate.body,
          editedTemplate.Type
        );
      } else if (ToolsSelectedPage === 'SMSTemplates') {
        ChangeSMSTemplateValues(
          editedTemplate.id,
          editedTemplate.name,
          editedTemplate.body
        );
      }
    }
  };

  const handleTryOut = (templateId: string) => {
    setTryOutMode(templateId);
    const template =
      ToolsSelectedPage === 'EmailTemplates'
        ? emailTemplates.find((t) => t.id === templateId)
        : smsTemplates.find((t) => t.id === templateId);
    if (template) {
      const usedVariables = [
        ...new Set([
          ...extractVariables((template as EmailTemplate).subject || ''),
          ...extractVariables(template.body),
        ]),
      ];
      const initialValues = usedVariables.reduce((acc, variable) => {
        acc[variable.replace(/[{}]/g, '')] = '';
        return acc as Record<string, string>;
      }, {} as Record<string, string>);
      setVariableValues(initialValues);
    }
  };

  const handleVariableValueChange = (variable: string, value: string) => {
    setVariableValues((prev) => ({ ...prev, [variable]: value }));
  };

  const replaceVariables = (text: string) => {
    return text.replace(/\{\{(.*?)\}\}/g, (match, variable) => {
      return variableValues[variable] || match;
    });
  };
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSentSuccess, setEmailSentSuccess] = useState(false);
  const [emailSentSuccessstring, setEmailSentSuccessstring] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendEmail = async () => {
    setIsSending(true);
    setEmailSentSuccessstring('');
    if (navigator.onLine) {
      const template = emailTemplates.find((t) => t.id === tryOutMode);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (recipientEmail && emailRegex.test(recipientEmail)) {
        if (template) {
          const subject = replaceVariables(template.subject);
          const body = replaceVariables(template.body);
          const userDATA = await window.electron.store.get('users');
          const userEmail = userDATA[0].email;
          const userPass = userDATA[0].password;
          console.log(userEmail, userPass);
          if (navigator.onLine) {
            window.electron.ipcRenderer.send('SendCustomEmail', {
              to: recipientEmail,
              subject: subject,
              body: body,
              userEmail: userEmail,
              userPassword: userPass,
              SelectedUserId: SelectedUserId,
              branchId: SelectedBranchId,
              templateId: template.id,
            });

            window.electron.ipcRenderer.once(
              'SendCustomEmailResponse',
              (response) => {
                if (response.success) {
                  setEmailSentSuccessstring('Email sent successfully');
                  setEmailSentSuccessstring('Sent');
                  setIsSending(false);
                  setEmailSentSuccess(true);
                } else {
                  setEmailSentSuccessstring('Failed to send email');
                  setEmailSentSuccessstring('Failed');
                  setIsSending(false);
                  setEmailSentSuccess(false);
                }
              }
            );
          }
        }
      } else {
        setEmailSentSuccessstring('Invalid email address');
        setEmailSentSuccess(false);
        setIsSending(false);
      }

      setRecipientEmail('');
    }
  };

  const handleSendSMS = async () => {
    const template = smsTemplates.find((t) => t.id === tryOutMode);
    if (template) {
      const body = replaceVariables(template.body);
      const userDATA = await window.electron.store.get('users');
      const userPhone = userDATA[0].phone;
      const userPass = userDATA[0].password;
      console.log(userPhone, userPass);
      if (navigator.onLine) {
        window.electron.ipcRenderer.send('SendCustomSMS', {
          to: recipientEmail,
          body: body,
          userPhone: userPhone,
          userPassword: userPass,
        });

        window.electron.ipcRenderer.once(
          'SendCustomSMSResponse',
          (response) => {
            if (response.success) {
              console.log('SMS sent successfully');
            } else {
              console.error('Failed to send SMS:', response.error);
            }
          }
        );
      }
    }

    setRecipientEmail('');
  };

  const handleAddEmailTemplate = async () => {
    const newTemplate: email_templates = {
      id: uuidv4(),
      name: 'New Template',
      subject: 'New Template',
      body: 'New Template',
      created_at: Date.now(),
      updated_at: Date.now(),
      userId: SelectedUserId,
    };
    await addValue(
      'email_templates',
      {
        id: newTemplate.id,
        name: newTemplate.name,
        subject: newTemplate.subject,
        body: newTemplate.body,
        created_at: newTemplate.created_at,
        updated_at: newTemplate.updated_at,
        userId: newTemplate.userId,
      },
      setChangeMade
    );
    setEmailTemplates([...emailTemplates, newTemplate]);
    setEditingTemplateId(newTemplate.id);
    setEditedTemplate(newTemplate);
    setOriginalTemplate(newTemplate);
  };
  // Add this at the top of your component
  const handleReplaceWithDefault = async () => {
    try {
      const choice = window.confirm(
        'Are you sure you want to delete all existing email templates and replace with defaults? This action cannot be undone.'
      );

      if (choice) {
        // User clicked "Yes, Replace All"
        for (const template of emailTemplates) {
          await deleteValue('email_templates', template.id, setChangeMade);
        }
        // Get default templates and insert them
        const userId = window.electron.store.get('SelectedUserId');
        const defaultTemplates = getEmailTemplates(userId);

        for (const template of defaultTemplates) {
          await addValue('email_templates', template, setChangeMade);
        }

        fetchEmailTemplates();
      }
    } catch (error) {
      console.error('Error replacing templates:', error);
    }
  };
  const handleReplaceWithDefaultSms = async () => {
    try {
      const choice = window.confirm(
        'Are you sure you want to delete all existing sms templates and replace with defaults? This action cannot be undone.'
      );

      if (choice) {
        // User clicked "Yes, Replace All"
        for (const template of smsTemplates) {
          await deleteValue('sms_templates', template.id, setChangeMade);
        }
        // Get default templates and insert them
        const userId = window.electron.store.get('SelectedUserId');
        const defaultTemplates = getSmsTemplates(userId);

        for (const template of defaultTemplates) {
          await addValue('sms_templates', template, setChangeMade);
        }

        getSMSTemplates();
      }
    } catch (error) {
      console.error('Error replacing templates:', error);
    }
  };
  function getEmailTemplates(userId: string | null) {
    return [
      {
        id: uuidv4(),
        name: '5 days before due',
        subject: 'Rent Payment Reminder: Due in 5 Days',
        body: `Dear {{tenant_name}},
  
  This is a friendly reminder that your rent payment of {{currency}}{{due_amount}} is due in 5 days ({{due_duration}}) on {{due_date}}.
  
  If you have any questions, please contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}}.
  
  Best regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '3 days before due',
        subject: 'Rent Payment Reminder: Due in 3 Days',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{currency}}{{due_amount}} is due in 3 days ({{due_duration}}) on {{due_date}}. Please ensure timely payment.
  
  For any inquiries, contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}}.
  
  Thank you,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '1 day before due',
        subject: 'Urgent: Rent Payment Due Tomorrow',
        body: `Dear {{tenant_name}},
  
  This is an urgent reminder that your rent payment of {{currency}}{{due_amount}} is due tomorrow ({{due_duration}}), {{due_date}}.
  
  If you have any concerns, please contact {{landlord_name}} immediately at {{landlord_Email}} or {{landlord_Telephone}}.
  
  Best regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'On due date',
        subject: 'Rent Payment Due Today',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{currency}}{{due_amount}} is due today ({{due_duration}}), {{due_date}}. Please make the payment as soon as possible.
  
  For any questions, contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}}.
  
  Thank you for your prompt attention to this matter.
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '1 day after due',
        subject: 'Overdue Rent Payment Notice',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{currency}}{{due_amount}} was due yesterday ({{due_duration}}), {{due_date}}. If you have already made the payment, please disregard this notice.
  
  If not, please make the payment immediately or contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}} to discuss the situation.
  
  Regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '3 days after due',
        subject: 'Urgent: Rent Payment 3 Days Overdue',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{currency}}{{due_amount}} is now 3 days overdue ({{due_duration}}). The due date was {{due_date}}.
  
  Please make the payment immediately or contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}} to discuss any issues you may be facing.
  
  Sincerely,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '5 days after due',
        subject: 'Critical Notice: Rent Payment 5 Days Overdue',
        body: `Dear {{tenant_name}},
  
  This is a critical notice regarding your rent payment of {{currency}}{{due_amount}}, which is now 5 days overdue ({{due_duration}}). The original due date was {{due_date}}.
  
  Immediate action is required. Please make the payment or contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}} to discuss this urgent matter.
  
  Regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '7 days after due',
        subject: 'Final Notice: Rent Payment 7 Days Overdue',
        body: `Dear {{tenant_name}},
  
  This is a final notice regarding your rent payment of {{currency}}{{due_amount}}, which is now 7 days overdue ({{due_duration}}). The original due date was {{due_date}}.
  
  Failure to address this matter may result in further action. Please make the payment immediately or contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}} to resolve this issue.
  
  Sincerely,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በ5 ቀናት ውስጥ የሚከፈል',
        subject: 'የኪራይ ክፍያ ማሳሰቢያ፡ በ5 ቀናት ውስጥ የሚከፈል',
        body: `ውድ {{tenant_name}},
  
  ይህ ደብዳቤ የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ በ5 ቀናት ውስጥ ({{due_duration}}) በ{{due_date}} እንደሚከፈል የሚያሳስብ ደብዳቤ ነው።
  
  ማንኛውም ጥያቄ ካለዎት፣ እባክዎን {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ከሰላምታ ጋር፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በ3 ቀናት ውስጥ የሚከፈል',
        subject: 'የኪራይ ክፍያ ማሳሰቢያ፡ በ3 ቀናት ውስጥ የሚከፈል',
        body: `ውድ {{tenant_name}},
  
  የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ በ3 ቀናት ውስጥ ({{due_duration}}) በ{{due_date}} ይከፈላል። እባክዎን በጊዜው እንዲከፍሉ።
  
  ለማንኛውም ጥያቄ፣ {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  እናመሰግናለን፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በ1 ቀን ውስጥ የሚከፈል',
        subject: 'አስቸኳይ፡ የኪራይ ክፍያ ነገ የሚከፈል',
        body: `ውድ {{tenant_name}},
  
  ይህ የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ ነገ ({{due_duration}})፣ {{due_date}} እንደሚከፈል የሚያሳስብ አስቸኳይ ማሳሰቢያ ነው።
  
  ማንኛውም ችግር ካለ፣ እባክዎን {{landlord_name}}ን በአስቸኳይ በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ከሰላምታ ጋር፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በመክፈያ ቀን',
        subject: 'የኪራይ ክፍያ ዛሬ የሚከፈል',
        body: `ውድ {{tenant_name}},
  
  የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ ዛሬ ({{due_duration}})፣ {{due_date}} መከፈል አለበት። እባክዎን በተቻለ ፍጥነት ይክፈሉ።
  
  ለማንኛውም ጥያቄ፣ {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ለፈጣን ምላሽዎ እናመሰግናለን።
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 1 ቀን',
        subject: 'የዘገየ የኪራይ ክፍያ ማሳሰቢያ',
        body: `ውድ {{tenant_name}},
  
  የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ ትላንት ({{due_duration}})፣ {{due_date}} መከፈል ነበረበት። ክፍያውን ከፍለው ከሆነ፣ እባክዎን ይህንን ማሳሰቢያ ይተዉት።
  
  ካልከፈሉ፣ እባክዎን በአስቸኳይ ይክፈሉ ወይም ሁኔታውን ለመወያየት {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ከሰላምታ ጋር፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 3 ቀናት',
        subject: 'አስቸኳይ፡ የኪራይ ክፍያ በ3 ቀናት ዘግይቷል',
        body: `ውድ {{tenant_name}},
  
  የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ አሁን በ3 ቀናት ዘግይቷል ({{due_duration}})። የመክፈያ ቀኑ {{due_date}} ነበር።
  
  እባክዎን በአስቸኳይ ይክፈሉ ወይም ማንኛውም ችግር ካለ {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ከሰላምታ ጋር፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 5 ቀናት',
        subject: 'አስቸኳይ ማሳሰቢያ፡ የኪራይ ክፍያ በ5 ቀናት ዘግይቷል',
        body: `ውድ {{tenant_name}},
  
  ይህ የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ አሁን በ5 ቀናት መዘግየቱን ({{due_duration}}) የሚያሳውቅ አስቸኳይ ማሳሰቢያ ነው። የመጀመሪያው የመክፈያ ቀን {{due_date}} ነበር።
  
  አስቸኳይ እርምጃ ያስፈልጋል። እባክዎን ይክፈሉ ወይም ይህንን አስቸኳይ ጉዳይ ለመወያየት {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ከሰላምታ ጋር፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 7 ቀናት',
        subject: 'የመጨረሻ ማሳሰቢያ፡ የኪራይ ክፍያ በ7 ቀናት ዘግይቷል',
        body: `ውድ {{tenant_name}},
  
  ይህ የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ አሁን በ7 ቀናት መዘግየቱን ({{due_duration}}) የሚያሳውቅ የመጨረሻ ማሳሰቢያ ነው። የመጀመሪያው የመክፈያ ቀን {{due_date}} ነበር።
  
  ይህንን ጉዳይ ካልፈቱት ተጨማሪ እርምጃ ሊወሰድ ይችላል። እባክዎን በአስቸኳይ ይክፈሉ ወይም ይህንን ጉዳይ ለመፍታት {{landlord_name}}ን በ{{landlord_Email}} ወይም በ{{landlord_Telephone}} ያግኙ።
  
  ከሰላምታ ጋር፣
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
    ];
  }
  function getSmsTemplates(userId: string | null) {
    return [
      // English templates
      {
        id: uuidv4(),
        name: '5 days before due',
        body: `Rent of {{currency}}{{due_amount}} due in 5 days on {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '3 days before due',
        body: `Rent of {{currency}}{{due_amount}} due in 3 days on {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '1 day before due',
        body: `Rent of {{currency}}{{due_amount}} due tomorrow, {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'On due date',
        body: `Rent of {{currency}}{{due_amount}} due today, {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '1 day after due',
        body: `Rent of {{currency}}{{due_amount}} was due yesterday, {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '3 days after due',
        body: `Rent of {{currency}}{{due_amount}} is 3 days overdue. Due date was {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '7 days after due',
        body: `Rent of {{currency}}{{due_amount}} is 7 days overdue. Due date was {{due_date}}.
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      // Amharic versions
      {
        id: uuidv4(),
        name: 'በ5 ቀናት ውስጥ የሚከፈል',
        body: `የ{{currency}}{{due_amount}} ኪራይ በ5 ቀናት በ{{due_date}} ይከፈላል።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በ3 ቀናት ውስጥ የሚከፈል',
        body: `የ{{currency}}{{due_amount}} ኪራይ በ3 ቀናት በ{{due_date}} ይከፈላል።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በ1 ቀን ውስጥ የሚከፈል',
        body: `የ{{currency}}{{due_amount}} ኪራይ ነገ በ{{due_date}} ይከፈላል።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'በመክፈያ ቀን',
        body: `የ{{currency}}{{due_amount}} ኪራይ ዛሬ በ{{due_date}} ይከፈላል።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 1 ቀን',
        body: `የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ ትላንት በ{{due_date}} መከፈል ነበረበት።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 3 ቀናት',
        body: `የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ አሁን በ3 ቀናት ዘግይቷል። የመክፈያ ቀኑ {{due_date}} ነበር።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'ከቀኑ በኋላ 7 ቀናት',
        body: `የ{{currency}}{{due_amount}} የኪራይ ክፍያዎ አሁን በ7 ቀናት ዘግይቷል። የመክፈያ ቀኑ {{due_date}} ነበር።
{{landlord_name}}, {{landlord_Telephone}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
    ];
  }
  const handleAddSMSTemplate = async () => {
    const newTemplate: sms_templates = {
      id: uuidv4(),
      name: 'New Template',
      body: 'New Template',
      created_at: Date.now(),
      updated_at: Date.now(),
      userId: SelectedUserId,
    };
    await addValue(
      'sms_templates',
      {
        id: newTemplate.id,
        name: newTemplate.name,
        body: newTemplate.body,
        created_at: newTemplate.created_at,
        updated_at: newTemplate.updated_at,
        userId: newTemplate.userId,
      },
      setChangeMade
    );
    setSMSTemplates([...smsTemplates, newTemplate]);
    setEditingTemplateId(newTemplate.id);
    setEditedTemplate(newTemplate);
    setOriginalTemplate(newTemplate);
  };

  const handleAddExpense = async () => {
    const newExpense: expenses = {
      id: uuidv4(),
      name: 'New Expense',
      description: 'New Expense Description',
      price: 0,
      date: Date.now(),
      userId: SelectedUserId,
      fullBuilding: false,
      floor: 0,
      room: 0,
      doesReoccur: false,
      recurringCycle: 0,
      recurringType: 'Day',
      HasEndDate: false,
      EndDate: 0,
      branchId: SelectedBranchId,
      // New notification fields
      sendEmail: false,
      emailDaysBefore: 0,
      sendSms: false,
      smsDaysBefore: 0,
      emailTo: null,
      smsTo: null,
      Currency: 'ETB',
    };

    setEditingExpenseId(newExpense.id);
    setEditedExpense(newExpense);
    await addValue('expenses', newExpense, setChangeMade);
    setExpenses([...expenses, newExpense]);
  };

  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editedExpense, setEditedExpense] = useState<expenses | null>(null);

  const handleEditExpenseChange = (
    field: keyof expenses,
    value: string | number | boolean
  ) => {
    // Add to handleEditExpenseChange

    if (editedExpense) {
      setEditedExpense({ ...editedExpense, [field]: value });
    }
  };

  const saveExpenseChanges = async () => {
    if (editedExpense) {
      await handleEditExpense(
        editedExpense.id,
        editedExpense.name,
        editedExpense.description,
        editedExpense.price || 0,
        editedExpense.fullBuilding || false,
        editedExpense.floor,
        editedExpense.room,
        editedExpense.doesReoccur || false,
        editedExpense.recurringCycle || 0,
        editedExpense.date || Date.now(),
        editedExpense.recurringType || 'Day',
        editedExpense.HasEndDate || false,
        editedExpense.EndDate || null,
        // Add notification fields
        editedExpense.sendEmail || false,
        editedExpense.emailDaysBefore || 0,
        editedExpense.sendSms || false,
        editedExpense.smsDaysBefore || 0,
        editedExpense.emailTo || null,
        editedExpense.smsTo || null,
        editedExpense.Currency || 'ETB'
      );
      setEditingExpenseId(null);
      setEditedExpense(null);
    }
  };

  const handleEditExpenseClick = (expense: expenses) => {
    if (editingExpenseId === expense.id) {
      saveExpenseChanges();
    } else {
      setEditingExpenseId(expense.id);
      setEditedExpense({ ...expense });
    }
  };

  const handleEditExpense = async (
    id: string,
    name: string,
    description: string,
    price: number,
    fullBuilding: boolean,
    floor: string,
    room: string,
    doesReoccur: boolean,
    recurringCycle: number,
    date: number,
    recurringType: 'Day' | 'Monthly' | 'Yearly',
    HasEndDate: boolean,
    EndDate: number | null,
    sendEmail: boolean = false,
    emailDaysBefore: number = 0,
    sendSms: boolean = false,
    smsDaysBefore: number = 0,
    emailTo: string | null = null,
    smsTo: string | null = null,
    Currency: string = 'ETB'
  ) => {
    const originalExpense = expenses.find((e) => e.id === id);
    if (!originalExpense) return;

    const updatedFields = {
      name,
      description,
      price,
      fullBuilding,
      floor: parseInt(floor) || 0,
      room: parseInt(room) || 0,
      doesReoccur,
      recurringCycle,
      date,
      recurringType,
      HasEndDate,
      EndDate,
      sendEmail,
      emailDaysBefore,
      sendSms,
      smsDaysBefore,
      emailTo,
      smsTo,
      Currency,
    };

    // Update only changed fields
    const changedFields = Object.entries(updatedFields).filter(
      ([key, value]) =>
        originalExpense[key as keyof typeof originalExpense] !== value
    );

    // Update state with all changes
    const updatedExpenses = expenses.map((expense) =>
      expense.id === id ? { ...expense, ...updatedFields } : expense
    );
    setExpenses(updatedExpenses);

    // Save only changed fields to database
    for (const [field, value] of changedFields) {
      await updateValue(
        'expenses',
        id,
        field,
        value,
        setChangeMade,
        originalExpense[field as keyof typeof originalExpense]
      );
    }

    setEditingExpenseId(null);
    setEditedExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      await deleteValue('expenses', id, setChangeMade);
      setEditingExpenseId(null);
      setEditedExpense(null);
      setExpenses(expenses.filter((expense) => expense.id !== id));
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // New filter states
  const [roomSearch, setRoomSearch] = useState('');
  const [floorSearch, setFloorSearch] = useState('');
  const [fullBuildingFilter, setFullBuildingFilter] = useState<
    'yes' | 'no' | ''
  >('');
  const [doesReoccurFilter, setDoesReoccurFilter] = useState<'yes' | 'no' | ''>(
    ''
  );
  const [reoccurDays, setReoccurDays] = useState('');
  const [minPrice, setMinPrice] = useState<number | ''>('');
  const [maxPrice, setMaxPrice] = useState<number | ''>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);

  const resetFilters = () => {
    setSearchTerm('');
    setRoomSearch('');
    setFloorSearch('');
    setFullBuildingFilter('');
    setDoesReoccurFilter('');
    setReoccurDays('');
    setMinPrice('');
    setMaxPrice('');
    setDateFilter('');
  };

  const filteredExpenses = expenses
    .filter((expense) => {
      const matchesName = expense.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesRoom = roomSearch
        ? expense.room.toString().includes(roomSearch)
        : true;
      const matchesFloor = floorSearch
        ? expense.floor.toString().includes(floorSearch)
        : true;
      const matchesFullBuilding = fullBuildingFilter
        ? fullBuildingFilter === 'yes'
          ? expense.fullBuilding
          : !expense.fullBuilding
        : true;
      const matchesDoesReoccur = doesReoccurFilter
        ? doesReoccurFilter === 'yes'
          ? expense.doesReoccur
          : !expense.doesReoccur
        : true;
      const matchesReoccurDays = reoccurDays
        ? expense.recurringCycle.toString() === reoccurDays
        : true;
      const matchesPrice =
        (minPrice === '' || expense.price >= minPrice) &&
        (maxPrice === '' || expense.price <= maxPrice);
      const matchesDate = dateFilter
        ? new Date(expense.date).toISOString().split('T')[0] === dateFilter
        : true;

      return (
        matchesName &&
        matchesRoom &&
        matchesFloor &&
        matchesFullBuilding &&
        matchesDoesReoccur &&
        matchesReoccurDays &&
        matchesPrice &&
        matchesDate
      );
    })
    .sort((a, b) => {
      if (sortOrder === 'asc') {
        return a[sortField] > b[sortField] ? 1 : -1;
      } else {
        return a[sortField] < b[sortField] ? 1 : -1;
      }
    });

  const [emailSendingwith, setEmailSendingwith] = useState('');
  useEffect(() => {
    const a = async () => {
      const emaiSendingwith = await getValuesWithSql_Online('users', `WHERE 1`);
      const selectedEmail = emaiSendingwith.find(
        (a: any) => a.id === SelectedUserId
      )?.selectedEmailToSendWith;
      console.log('Selected email to send with:', selectedEmail);
      setEmailSendingwith(selectedEmail || '');
    };
    if (navigator.onLine) a();
  }, []);
  const privileges = useMemo(
    () => getUserPrivileges(SelectedAppUser),
    [SelectedAppUser]
  );

  const [showNotifySettings, setShowNotifySettings] = useState<{
    [key: string]: boolean;
  }>({});

  // Add this function to toggle notification settings visibility
  const toggleNotifySettings = (expenseId: string) => {
    setShowNotifySettings((prev) => ({
      ...prev,
      [expenseId]: !prev[expenseId],
    }));
  };
  const calculateNextPayment = (expense: expenses) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    const todayTime = today.getTime();

    const StartExpenseDate = new Date(expense.date);
    StartExpenseDate.setHours(0, 0, 0, 0); // Reset time to start of day
    const startTime = StartExpenseDate.getTime();

    const cycle = expense.recurringCycle;
    const cycleType = expense.recurringType;
    const endTime = expense.EndDate;
    const hasEndDate = expense.HasEndDate;
    let nextPayment: number;
    const msPerDay = 86400000; // milliseconds in a day
    let payments = [];

    // First, count the start date payment
    for (let i = 0; i < 30; i++) {
      if (cycleType === 'Day') {
        nextPayment = startTime + i * cycle * msPerDay;
        if (hasEndDate && nextPayment > endTime) {
          break;
        }
        payments.push(nextPayment);
      } else if (cycleType === 'Monthly') {
        const nextDate = new Date(startTime);
        nextDate.setMonth(nextDate.getMonth() + i);
        nextPayment = nextDate.getTime();
        if (hasEndDate && nextPayment > endTime) {
          break;
        }
        payments.push(nextPayment);
      } else if (cycleType === 'Yearly') {
        const nextYearDate = new Date(startTime);
        nextYearDate.setFullYear(nextYearDate.getFullYear() + i);
        nextPayment = nextYearDate.getTime();
        if (hasEndDate && nextPayment > endTime) {
          break;
        }
        payments.push(nextPayment);
      }
    }

    // Find today's or next payment
    const todayPayment = payments.find((payment) => payment === todayTime);
    if (todayPayment) {
      return 'today'; // Return 'today' instead of 0
    }

    const nextPayment2 = payments.find((payment) => payment > todayTime);
    if (!nextPayment2) {
      return null;
    }

    return Math.ceil((nextPayment2 - todayTime) / msPerDay);
  };
  const [exchangeRates, setExchangeRates] = useState<
    Array<{
      id: number;
      rates: number;
    }>
  >([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const ratesPerPage = 50;
  // Add useEffect to refetch when page changes
  // Add these new states at the top with your other states
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Add this state near your other states
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [showRecentRates, setShowRecentRates] = useState(false);

  // Modify your fetchExchangeRates function
  const fetchExchangeRates = async () => {
    try {
      if(navigator.onLine) {
      setIsLoadingRates(true);
      let whereClause = 'WHERE 1';
      if (startDate) {
        whereClause += ` AND id >= ${new Date(startDate).getTime() / 1000}`;
      }
      if (endDate) {
        whereClause += ` AND id <= ${new Date(endDate).getTime() / 1000}`;
      }

      // First get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM Exchange_RatesUSDtoETB ${whereClause}`;
      const totalResult = await getValuesWithSql_Online(
        'Exchange_RatesUSDtoETB',
        whereClause
      );
     
        const total = totalResult.length;
        const calculatedTotalPages = Math.ceil(total / ratesPerPage);
        setTotalPages(calculatedTotalPages);

        // Then get paginated data
        const offset = (currentPage - 1) * ratesPerPage;
        const paginatedQuery = `${whereClause} ORDER BY id DESC LIMIT ${ratesPerPage} OFFSET ${offset}`;
        const rates = await getValuesWithSql_Online(
          'Exchange_RatesUSDtoETB',
          paginatedQuery
        );
        setExchangeRates(rates);
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
    } finally {
      setIsLoadingRates(false);
    }
  };

  // Add this useEffect to handle pagination changes
  useEffect(() => {
    fetchExchangeRates();
  }, [currentPage, startDate, endDate]);

  // Add this useEffect to reset page when date filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate]);

  // Simplified update function that just stores the latest rate
  const updateExchangeRates = async () => {
    if (navigator.onLine) {
      const exchangeRates2 = await getValuesWithSql_Online(
        'Exchange_RatesUSDtoETB',
        'WHERE 1'
      );
      if (exchangeRates2.length > 0) {
        const latestRate = exchangeRates2;
        window.electron.store.set('exchangeRate', latestRate);
        window.electron.store.set(
          'lastExchangeRateUpdate',
          latestRate[latestRate.length - 1].id * 1000
        );
        setRefresh(refresh + 1);
      }
    }
  };
  const [GetExchangeRateDate, setGetExchangeRateDate] = useState('');
  const [GetExchangeRate, setGetExchangeRate] = useState(0);
  const fetchExchangeRateOfThatDate = async () => {
    try {
      if(navigator.onLine) {
        // First try to get the exact date's rate
        const targetDate = new Date(GetExchangeRateDate).getTime();
        if (!isNaN(targetDate) && targetDate > 0) {
          let rates = await getValuesWithSql_Online(
            'Exchange_RatesUSDtoETB',
            `WHERE id <= ${targetDate} ORDER BY id DESC LIMIT 1`
          );

          // If we found a rate, use it
          if (rates.length > 0) {
            console.log('Found rate:', rates[0]);
            setGetExchangeRate(rates[0].rates);
            // Optionally show when this rate is from if it's not the exact date
            if (rates[0].id !== targetDate) {
              console.log(
                `Using rate from ${new Date(rates[0].id).toLocaleDateString()}`
              );
            }
          } else {
            console.log('No historical rates found for this date');
            setGetExchangeRate(0);
          }
        }
      } else {
        // Get from local store if offline
        const localRates = window.electron.store.get('exchangeRate');
        if (localRates && localRates.length > 0) {
          const targetDate = new Date(GetExchangeRateDate).getTime();
          // Find closest rate that's not after target date
          const closestRate = localRates
            .filter(rate => rate.id <= targetDate)
            .sort((a, b) => b.id - a.id)[0];
            
          if (closestRate) {
            setGetExchangeRate(closestRate.rates);
          } else {
            setGetExchangeRate(0);
          }
        } else {
          setGetExchangeRate(0);
        }
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setGetExchangeRate(null);
    }
  };
  // Add these states

  const [refresh, setRefresh] = useState(0);
  return (
    <>
      <></>
      {privileges.editExpenses ||
      privileges.editEmailTemplates ||
      privileges.editSmsTemplates ? (
        <>
          {ToolsSelectedPage === 'EmailTemplates' && (
            <EmailTemplates
              emailTemplates={emailTemplates}
              handleReplaceWithDefault={handleReplaceWithDefault}
              openTemplateId={openTemplateId}
              editingTemplateId={editingTemplateId}
              editedTemplate={editedTemplate}
              variables={variables}
              variableValues={variableValues}
              recipientEmail={recipientEmail}
              emailSendingwith={emailSendingwith}
              handleAddEmailTemplate={handleAddEmailTemplate}
              toggleTemplate={toggleTemplate}
              startEditing={startEditing}
              saveChanges={saveChanges}
              cancelEditing={cancelEditing}
              deleteEmailTemplate={deleteEmailTemplate}
              handleEditChange={handleEditChange}
              insertVariable={insertVariable}
              extractVariables={extractVariables}
              handleTryOut={handleTryOut}
              tryOutMode={tryOutMode}
              setTryOutMode={setTryOutMode}
              formatEmailBody={formatEmailBody}
              replaceVariables={replaceVariables}
              handleVariableValueChange={handleVariableValueChange}
              setRecipientEmail={setRecipientEmail}
              handleSendEmail={handleSendEmail}
              subjectInputRef={subjectInputRef}
              bodyTextareaRef={bodyTextareaRef}
              isSending={isSending}
              setSelectedInput={setSelectedInput}
              emailSentSuccessstring={emailSentSuccessstring}
            />
          )}

          {ToolsSelectedPage === 'SMSTemplates' && (
            <SMSTemplates
              smsTemplates={smsTemplates}
              openTemplateId={openTemplateId}
              handleReplaceWithDefaultSms={handleReplaceWithDefaultSms}
              editingTemplateId={editingTemplateId}
              editedTemplate={editedTemplate}
              variables={variables}
              variableValues={variableValues}
              recipientEmail={recipientEmail}
              handleAddSMSTemplate={handleAddSMSTemplate}
              toggleTemplate={toggleTemplate}
              startEditing={startEditing}
              saveChanges={saveChanges}
              cancelEditing={cancelEditing}
              deleteSMSTemplate={deleteSMSTemplate}
              handleEditChange={handleEditChange}
              insertVariable={insertVariable}
              extractVariables={extractVariables}
              handleTryOut={handleTryOut}
              tryOutMode={tryOutMode}
              setTryOutMode={setTryOutMode}
              formatEmailBody={formatEmailBody}
              replaceVariables={replaceVariables}
              handleVariableValueChange={handleVariableValueChange}
              setRecipientEmail={setRecipientEmail}
              handleSendSMS={handleSendSMS}
              bodyTextareaRef={bodyTextareaRef}
              setSelectedInput={setSelectedInput}
            />
          )}
          {ToolsSelectedPage === 'Expense Manager' && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                flexDirection: 'column',
                width: '100%',
                maxWidth: 'var(--1200px-V)',
                margin: '0 auto',
                height: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '500%',
                  maxWidth: 'var(--800px-V)',
                  margin: '0 auto',
                }}
              >
                <h2>Expense Manager</h2>
                <button
                  onClick={() => {
                    setShowFilters(!showFilters);
                    if (showFilters) {
                      resetFilters();
                    }
                  }}
                  style={{}}
                >
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    setShowDefaultNotificationsSettings(
                      !ShowDefaultNotificationsSettings
                    );
                  }}
                  style={{}}
                >
                  {ShowDefaultNotificationsSettings
                    ? 'Hide Default Expenses Notifications'
                    : 'Show Default Expenses Notifications'}
                </button>
                <button onClick={handleAddExpense}>Add Expense</button>
              </div>
              <div
                style={{
                  marginBottom: 'var(--20px-V)',
                  width: '90%',
                  display: 'flex',
                  gap: 'var(--10px-V)',
                }}
              ></div>
              {showFilters && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--10px-V)',
                    marginBottom: 'var(--20px-V)',
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', flex: '1' }}
                  ></div>
                </div>
              )}
              {ShowDefaultNotificationsSettings && (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div>
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                    />
                    Send email{' '}
                    {sendEmail ? (
                      <>
                        {' '}
                        <input
                          type="text"
                          placeholder="example@gmail.com"
                          value={emailTo}
                          onChange={(e) => setEmailTo(e.target.value)}
                        />
                        {emailTo && (
                          <>
                            <>
                              <input
                                type="number"
                                value={emailDaysBefore}
                                onChange={(e) =>
                                  setEmailDaysBefore(
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                placeholder="2"
                                style={{ width: 'var(--40px-V)' }}
                              />
                              <span> days before expense.</span>
                            </>
                          </>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </div>
                  <div>
                    <input
                      type="checkbox"
                      checked={sendSms}
                      onChange={(e) => setSendSms(e.target.checked)}
                    />
                    Send SMS{' '}
                    {sendSms ? (
                      <>
                        {' '}
                        to{' '}
                        <input
                          type="text"
                          placeholder="09123456789"
                          value={smsTo}
                          onChange={(e) => setSmsTo(e.target.value)}
                        />
                        {smsTo && (
                          <>
                            <>
                              <input
                                type="number"
                                value={smsDaysBefore}
                                onChange={(e) =>
                                  setSmsDaysBefore(parseInt(e.target.value, 10))
                                }
                                placeholder="2"
                                style={{ width: 'var(--40px-V)' }}
                              />
                              <span> days before expense.</span>
                            </>
                          </>
                        )}
                      </>
                    ) : (
                      <></>
                    )}
                  </div>

                  <button
                    style={{
                      width: 'var(--180px-V)',
                      marginTop: 'var(--10px-V)',
                    }}
                    onClick={applyDefaultNotifications}
                  >
                    Apply To All
                  </button>
                </div>
              )}
              <div
                style={{
                  overflowX: 'auto',
                  width: '100%',
                  height: 'calc(100% - 150px)',
                }}
              >
                <table className="expense-cards">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}></th>
                      <th style={{ width: '30%' }}>
                        {' '}
                        {showFilters && (
                          <input
                            type="text"
                            placeholder="Search expenses"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ padding: 'var(--5px-V)', width: '60%' }}
                          />
                        )}
                      </th>
                      <th style={{ width: '10%' }}>
                        {' '}
                        {showFilters && (
                          <>
                            <input
                              type="number"
                              placeholder="Max Price"
                              value={maxPrice}
                              onChange={(e) =>
                                setMaxPrice(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : ''
                                )
                              }
                              style={{
                                flex: '1',
                                padding: 'var(--5px-V)',
                                width: 'var(--80px-V)',
                              }}
                            />
                            <input
                              type="number"
                              placeholder="Min Price"
                              value={minPrice}
                              onChange={(e) =>
                                setMinPrice(
                                  e.target.value
                                    ? parseFloat(e.target.value)
                                    : ''
                                )
                              }
                              style={{
                                flex: '1',
                                padding: 'var(--5px-V)',
                                width: 'var(--80px-V)',
                              }}
                            />
                          </>
                        )}
                      </th>
                      <th style={{ textAlign: 'center' }}>
                        {showFilters && (
                          <>
                            <select
                              value={fullBuildingFilter}
                              onChange={(e) =>
                                setFullBuildingFilter(
                                  e.target.value as 'yes' | 'no' | ''
                                )
                              }
                              style={{ flex: '1', padding: 'var(--5px-V)' }}
                            >
                              <option value="">Full Building</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                            <br />
                            <input
                              type="text"
                              placeholder="Floor"
                              value={floorSearch}
                              onChange={(e) => setFloorSearch(e.target.value)}
                              style={{
                                flex: '1',
                                padding: 'var(--5px-V)',
                                width: 'var(--40px-V)',
                              }}
                            />{' '}
                            <input
                              type="text"
                              placeholder="Room"
                              value={roomSearch}
                              onChange={(e) => setRoomSearch(e.target.value)}
                              style={{
                                flex: '1',
                                padding: 'var(--5px-V)',
                                width: 'var(--40px-V)',
                              }}
                            />
                          </>
                        )}
                      </th>
                      <th>
                        {' '}
                        {showFilters && (
                          <>
                            <select
                              value={doesReoccurFilter}
                              onChange={(e) =>
                                setDoesReoccurFilter(
                                  e.target.value as 'yes' | 'no' | ''
                                )
                              }
                              style={{ flex: '1', padding: 'var(--5px-V)' }}
                            >
                              <option value="">Does Reoccur</option>
                              <option value="yes">Yes</option>
                              <option value="no">No</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Reoccur every X days"
                              value={reoccurDays}
                              onChange={(e) => setReoccurDays(e.target.value)}
                              style={{
                                flex: '1',
                                padding: 'var(--5px-V)',
                                width: 'var(--150px-V)',
                              }}
                            />
                          </>
                        )}
                      </th>
                      <th>
                        {showFilters && (
                          <div
                            style={{ display: 'flex', flexDirection: 'row' }}
                          >
                            <input
                              type="date"
                              value={dateFilter}
                              onChange={(e) => setDateFilter(e.target.value)}
                              style={{ flex: '1', padding: 'var(--5px-V)' }}
                            />
                            <button
                              onClick={() => setDateFilter('')}
                              style={{
                                padding: 'var(--5px-V)',

                                color: 'white',
                                border: 'none',
                                borderRadius: 'var(--5px-V)',
                                cursor: 'pointer',
                                marginLeft: 'var(--5px-V)',
                              }}
                            >
                              X
                            </button>
                          </div>
                        )}
                      </th>
                    </tr>
                    <tr>
                      <th style={{ width: '7%' }}>No.</th>
                      <th style={{ width: '30%' }}>Expense</th>
                      <th style={{ width: '10%' }}>Price</th>
                      <th>Room</th>
                      <th>Reoccur</th>
                      {editingExpenseId !== null && <th>Date</th>}
                      <th>Notify</th>
                      {editingExpenseId !== null && <th>Actions</th>}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredExpenses.length === 0 ? (
                      <tr>
                        <td
                          colSpan={editingExpenseId !== null ? 7 : 6}
                          style={{ textAlign: 'center' }}
                        >
                          There are currently no expenses to display. Please add
                          an expense or adjust your filters to see results.
                        </td>
                      </tr>
                    ) : (
                      filteredExpenses.map((expense, index) => (
                        <>
                          <tr key={expense.id} className="expense-card">
                            <td
                              style={{
                                borderRadius:
                                  'var(--10px-V) var(--0px-V) var(--0px-V) var(--10px-V)',
                                textAlign: 'center',
                              }}
                            >
                              {index + 1}.
                              <button
                                className="email-template-buttons-button"
                                onClick={() => handleEditExpenseClick(expense)}
                              >
                                {editingExpenseId === expense.id
                                  ? 'Save'
                                  : 'Edit'}
                              </button>
                            </td>
                            <td>
                              {editingExpenseId === expense.id ? (
                                <textarea
                                  value={editedExpense?.name || ''}
                                  onChange={(e) =>
                                    handleEditExpenseChange(
                                      'name',
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    width: '95%',
                                    padding: 'var(--5px-V)',
                                    border:
                                      'var(--1px-V) solid var(--Secondary-Color)',
                                    backgroundColor: 'var(--Background-Color)',
                                    color: 'var(--Text-Color)',
                                    resize: 'vertical',
                                    maxHeight: 'var(--100px-V)',
                                  }}
                                />
                              ) : (
                                expense.name
                              )}
                            </td>
                            <td style={{}}>
                              {editingExpenseId === expense.id ? (
                                <>
                                  <select
                                    value={editedExpense?.Currency}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'Currency',
                                        e.target.value
                                      )
                                    }
                                    className="AddANewRoomSelectMid"
                                  >
                                    {GetCurrencyAsOptionsOnSelect()}
                                  </select>
                                  <input
                                    type="number"
                                    value={editedExpense?.price || 0}
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'price',
                                        parseFloat(e.target.value)
                                      )
                                    }
                                    style={{ width: '70%' }}
                                  />
                                </>
                              ) : (
                                `${
                                  formatNumberWithSuffix(
                                    expense.price.toLocaleString()
                                  ) || 0
                                } ${CurrencySign(expense.Currency || 'ETB')}`
                              )}
                            </td>
                            <td>
                              {editingExpenseId === expense.id ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                  }}
                                >
                                  <label>
                                    Full building:
                                    <input
                                      type="checkbox"
                                      checked={
                                        editedExpense?.fullBuilding || false
                                      }
                                      onChange={(e) =>
                                        handleEditExpenseChange(
                                          'fullBuilding',
                                          e.target.checked
                                        )
                                      }
                                    />
                                  </label>
                                  {!editedExpense?.fullBuilding && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                      }}
                                    >
                                      <label>
                                        Floor:
                                        <input
                                          type="text"
                                          value={editedExpense?.floor || ''}
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'floor',
                                              parseInt(e.target.value, 10)
                                            )
                                          }
                                          style={{
                                            width: 'var(--35px-V)',
                                            marginRight: 'var(--10px-V)',
                                          }}
                                        />
                                      </label>
                                      <label>
                                        Room:
                                        <input
                                          type="text"
                                          value={editedExpense?.room || ''}
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'room',
                                              parseInt(e.target.value)
                                            )
                                          }
                                          style={{ width: 'var(--35px-V)' }}
                                        />
                                      </label>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                  }}
                                >
                                  <div>
                                    Full building:{' '}
                                    <em>
                                      {expense.fullBuilding ? 'Yes' : 'No'}
                                    </em>
                                  </div>
                                  {!expense.fullBuilding && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                      }}
                                    >
                                      {' '}
                                      <div
                                        style={{ marginRight: 'var(--10px-V)' }}
                                      >
                                        Floor. <em>{expense.floor || 'N/A'}</em>
                                      </div>
                                      <div>
                                        Room. <em>{expense.room || 'N/A'}</em>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              {editingExpenseId === expense.id ? (
                                <>
                                  Does reoccur:{' '}
                                  <input
                                    type="checkbox"
                                    checked={
                                      editedExpense?.doesReoccur || false
                                    }
                                    name=""
                                    id=""
                                    onChange={(e) =>
                                      handleEditExpenseChange(
                                        'doesReoccur',
                                        e.target.checked
                                      )
                                    }
                                  />
                                  {editedExpense?.doesReoccur ? (
                                    <>
                                      <select
                                        value={
                                          editedExpense?.recurringType || 'Day'
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'recurringType',
                                            e.target.value
                                          )
                                        }
                                      >
                                        <option value="Day">
                                          By day count
                                        </option>
                                        <option value="Monthly">Monthly</option>
                                        <option value="Yearly">Yearly</option>
                                      </select>
                                      <br />
                                      {editedExpense?.recurringType ===
                                      'Day' ? (
                                        <>
                                          Every{' '}
                                          <input
                                            type="text"
                                            value={
                                              editedExpense?.recurringCycle ||
                                              ''
                                            }
                                            onChange={(e) =>
                                              handleEditExpenseChange(
                                                'recurringCycle',
                                                e.target.value
                                              )
                                            }
                                            style={{ width: 'var(--40px-V)' }}
                                          />
                                        </>
                                      ) : (
                                        <></>
                                      )}
                                    </>
                                  ) : (
                                    <></>
                                  )}
                                </>
                              ) : expense.doesReoccur ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--5px-V)',
                                  }}
                                >
                                  <div>
                                    {expense.recurringType === 'Day'
                                      ? `Every ${expense.recurringCycle} Day${
                                          expense.recurringCycle !== 1
                                            ? 's'
                                            : ''
                                        }`
                                      : `Recurring: ${expense.recurringType}`}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 'var(--13px-V)',
                                      color: 'var(--Text-Color-60)',
                                    }}
                                  >
                                    Start:{' '}
                                    {new Date(
                                      expense.date
                                    ).toLocaleDateString()}
                                    {expense.HasEndDate && (
                                      <>
                                        <br />
                                        End:{' '}
                                        {new Date(
                                          expense.EndDate
                                        ).toLocaleDateString()}
                                      </>
                                    )}
                                  </div>
                                </div>
                              ) : (
                                <div>
                                  One Time
                                  <div
                                    style={{
                                      fontSize: 'var(--13px-V)',
                                      color: 'var(--Text-Color-60)',
                                    }}
                                  >
                                    Date:{' '}
                                    {new Date(
                                      expense.date
                                    ).toLocaleDateString()}
                                  </div>
                                </div>
                              )}
                            </td>
                            {editingExpenseId !== null && (
                              <td
                                style={{
                                  borderRadius:
                                    'var(--0px-V) var(--0px-V) var(--0px-V) var(--0px-V)',
                                }}
                              >
                                {editingExpenseId === expense.id ? (
                                  <>
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'row',
                                      }}
                                    >
                                      Start:{' '}
                                      <input
                                        type="date"
                                        value={
                                          new Date(
                                            editedExpense?.date || Date.now()
                                          )
                                            .toISOString()
                                            .split('T')[0]
                                        }
                                        onChange={(e) =>
                                          handleEditExpenseChange(
                                            'date',
                                            new Date(e.target.value).getTime()
                                          )
                                        }
                                        style={{ width: '100%' }}
                                      />
                                    </div>
                                    {editedExpense?.doesReoccur ? (
                                      <div
                                        style={{
                                          display: 'flex',
                                          flexDirection: 'row',
                                        }}
                                      >
                                        <input
                                          type="checkbox"
                                          name=""
                                          id=""
                                          checked={
                                            editedExpense?.HasEndDate || false
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'HasEndDate',
                                              e.target.checked
                                            )
                                          }
                                        />
                                        {editedExpense?.HasEndDate ? (
                                          <>
                                            End:
                                            <input
                                              type="date"
                                              value={
                                                new Date(
                                                  editedExpense?.EndDate ||
                                                    Date.now()
                                                )
                                                  .toISOString()
                                                  .split('T')[0]
                                              }
                                              onChange={(e) =>
                                                handleEditExpenseChange(
                                                  'EndDate',
                                                  new Date(
                                                    e.target.value
                                                  ).getTime()
                                                )
                                              }
                                              style={{ width: '100%' }}
                                            />
                                          </>
                                        ) : (
                                          <>:Enter End date</>
                                        )}
                                      </div>
                                    ) : (
                                      <></>
                                    )}
                                  </>
                                ) : (
                                  new Date(expense.date).toDateString()
                                )}
                              </td>
                            )}
                            <td
                              style={{
                                borderRadius:
                                  editingExpenseId === expense.id
                                    ? 'var(--0px-V) var(--0px-V) var(--0px-V) var(--0px-V)'
                                    : 'var(--0px-V) var(--10px-V) var(--10px-V) var(--0px-V)',
                              }}
                            >
                              {editingExpenseId === expense.id ? (
                                <button
                                  onClick={() =>
                                    toggleNotifySettings(expense.id)
                                  }
                                  style={{}}
                                >
                                  {showNotifySettings[expense.id]
                                    ? 'Hide Notifications'
                                    : 'Show Notifications'}
                                </button>
                              ) : (
                                <></>
                              )}
                              {showNotifySettings[expense.id] &&
                              expense.id === editingExpenseId ? (
                                <div style={{ width: '0', height: '0' }}>
                                  <div
                                    style={{
                                      background: 'var(--Background-Color)',
                                      zIndex: '1',
                                      border:
                                        'var(--1px-V) solid var(--Secondary-Color)',
                                      padding: 'var(--10px-V)',
                                      borderRadius: 'var(--5px-V)',
                                      width: 'var(--250px-V)',
                                      position: 'relative',
                                      right: 'var(--160px-V)',
                                    }}
                                  >
                                    {isLoadingRates && (
                                      <div
                                        style={{
                                          position: 'absolute',
                                          top: 0,
                                          left: 0,
                                          right: 0,
                                          bottom: 0,
                                          backgroundColor:
                                            'rgba(255, 255, 255, 0.8)',
                                          display: 'flex',
                                          justifyContent: 'center',
                                          alignItems: 'center',
                                          zIndex: 1000,
                                        }}
                                      >
                                        <img
                                          src={loadingGif}
                                          alt="Loading..."
                                          style={{
                                            width: '50px',
                                            height: '50px',
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                      }}
                                    >
                                      <div>
                                        <input
                                          type="checkbox"
                                          checked={
                                            editedExpense?.sendEmail || false
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'sendEmail',
                                              e.target.checked
                                            )
                                          }
                                        />
                                        Send Email
                                        <br />
                                        Days Before:
                                        <input
                                          type="number"
                                          value={
                                            editedExpense?.emailDaysBefore || ''
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'emailDaysBefore',
                                              parseInt(e.target.value, 10)
                                            )
                                          }
                                          style={{ width: 'var(--40px-V)' }}
                                        />
                                      </div>
                                      <br />
                                      <div style={{ width: 'var(--140px-V)' }}>
                                        <input
                                          type="checkbox"
                                          checked={
                                            editedExpense?.sendSms || false
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'sendSms',
                                              e.target.checked
                                            )
                                          }
                                        />
                                        Send SMS
                                        <br />
                                        Days Before:
                                        <input
                                          type="number"
                                          value={
                                            editedExpense?.smsDaysBefore || ''
                                          }
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'smsDaysBefore',
                                              parseInt(e.target.value, 10)
                                            )
                                          }
                                          style={{ width: 'var(--40px-V)' }}
                                        />
                                      </div>

                                      <span
                                        style={{
                                          fontSize: 'var(--13px-V)',
                                          color: 'var(--Text-Color-Grey)',
                                        }}
                                      >
                                        you can send this expense email or sms
                                        to multiple people make it be comma
                                        seppereted emails and phone numbers.
                                      </span>
                                      <div>
                                        Email To:
                                        <textarea
                                          value={editedExpense?.emailTo || ''}
                                          placeholder="comma separated emails"
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'emailTo',
                                              e.target.value
                                            )
                                          }
                                          style={{ width: '100%' }}
                                        />
                                      </div>
                                      <div>
                                        SMS To:
                                        <textarea
                                          value={editedExpense?.smsTo || ''}
                                          placeholder="comma separated phone numbers"
                                          onChange={(e) =>
                                            handleEditExpenseChange(
                                              'smsTo',
                                              e.target.value
                                            )
                                          }
                                          style={{ width: '100%' }}
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : editingExpenseId === expense.id ? (
                                <></>
                              ) : calculateNextPayment(expense) === null ? (
                                <>No payments into the future</>
                              ) : (
                                <>
                                  {calculateNextPayment(expense) === 'today' ? (
                                    <div
                                      style={{
                                        color: 'var(--Accent-Color)',
                                        fontWeight: 'bold',
                                      }}
                                    >
                                      Payment Due TODAY!
                                    </div>
                                  ) : (
                                    <>
                                      Next payment in:{' '}
                                      {calculateNextPayment(expense)} days
                                      <br />
                                      On{' '}
                                      {addDays(
                                        new Date(),
                                        calculateNextPayment(expense) || 0
                                      ).toLocaleDateString()}
                                    </>
                                  )}
                                </>
                              )}
                            </td>

                            {editingExpenseId === expense.id && (
                              <td
                                style={{
                                  borderRadius:
                                    'var(--0px-V) var(--10px-V) var(--10px-V) var(--0px-V)',
                                }}
                              >
                                <button
                                  style={{
                                    backgroundColor: 'red',
                                    color: 'white',
                                  }}
                                  onClick={() =>
                                    handleDeleteExpense(expense.id)
                                  }
                                >
                                  Delete
                                </button>
                              </td>
                            )}
                          </tr>
                          <tr style={{ height: 'var(--10px-V)' }}></tr>
                        </>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {isApplyingNotifications && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              }}
            >
              <img
                src={loadingGif}
                alt="Loading..."
                style={{ width: '50px', height: '50px' }}
              />
              <p
                style={{
                  color: 'white',
                  marginTop: '20px',
                  fontSize: 'var(--16px-V)',
                  fontWeight: '500',
                }}
              >
                Applying notification settings to all expenses...
              </p>
            </div>
          )}
          {ToolsSelectedPage === 'Settings' && (
            <div style={{ margin: '10px' }}>
              <h1 style={{ fontSize: 'var(--35px-V)' }}>Settings</h1>
              <div style={{ margin: 'var(--10px-V)' }}>
                {' '}
                <h2 style={{ fontSize: 'var(--25px-V)' }}>
                  -- Tax percentages --
                </h2>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  Tax percentage:{' '}
                  <input
                    type="number"
                    min="0"
                    max="100"
                    style={{ width: 'var(--60px-V)' }}
                    value={window.electron.store.get('taxPercentage')}
                    onChange={(e) => {
                      window.electron.store.set(
                        'taxPercentage',
                        parseFloat(e.target.value)
                      );
                      setRefresh(refresh + 1);
                    }}
                  />
                  %
                </div>
              </div>

              <div style={{ margin: 'var(--10px-V)', borderRadius: 'var(--8px-V)' }}>
                <h2 style={{ marginBottom: 'var(--15px-V)', fontSize: 'var(--25px-V)' }}>
                  -- Currency Settings --
                </h2>

                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  <label style={{ fontWeight: 500 }}>Default Currency: </label>
                  <select
                    onChange={(e) => {
                      window.electron.store.set(
                        'defaultCurrency',
                        e.target.value
                      );
                      setRefresh(refresh + 1);
                    }}
                    value={GetDefaultCurrency()}
                  >
                    {GetCurrencyAsOptionsOnSelect()}
                  </select>
                </div>

                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--10px-V)',
                    }}
                  >
                    <span>
                      Exchange rates
                    
                    </span>
                    <button onClick={updateExchangeRates}>Update</button>
                    <p style={{ fontSize: 'var(--13px-V)' }}>
                      Current latest rate using (
                      {window.electron.store.get('lastExchangeRateUpdate')
                        ? new Date(
                            window.electron.store.get('lastExchangeRateUpdate')
                          ).toDateString({
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })
                        : "Haven't updated yet"}{' '}
                      :{' '}
                      {
                        GetDefaultCurrency() === 'USD' ? 
                          (1 / window.electron.store.get('exchangeRate')[
                            window.electron.store.get('exchangeRate').length - 1
                          ].rates).toFixed(5) :
                          window.electron.store.get('exchangeRate')[
                            window.electron.store.get('exchangeRate').length - 1
                          ].rates.toFixed(5)
                      }
                      {CurrencySign(GetDefaultCurrency())})
                    </p>
                  </div>
                  {navigator.onLine ? (
                    <>
                      {' '}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--10px-V)',
                        }}
                      >
                        <span>Check rate on: </span>
                        <input
                          type="date"
                          onChange={(e) => {
                            const selectedDate =
                              new Date(e.target.value).getTime() / 1000;

                            // Check if date is after 2015
                            if (
                              selectedDate <
                              new Date('2015-01-01').getTime() / 1000
                            ) {
                              alert('Please select a date after 2015');
                              return;
                            }

                            
                              setGetExchangeRateDate(selectedDate);
                            
                          }}
                        />
                        <button onClick={() => fetchExchangeRateOfThatDate()}>
                          Get Rate
                        </button>
                        {GetExchangeRate != 0 ? (
                          <>
                            {new Date(
                              new Date(GetExchangeRateDate).getTime() * 1000
                            ).toDateString()}
                            : {GetExchangeRate}
                          </>
                        ) : (
                          ''
                        )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--10px-V)',
                          marginBottom: 'var(--10px-V)',
                        }}
                      >
                        <h3 style={{ margin: 0 }}>
                          Recent Exchange Rates (USD to ETB)
                        </h3>
                        <button
                          onClick={() => setShowRecentRates(!showRecentRates)}
                          style={{
                            padding: 'var(--3px-V) var(--8px-V)',
                          }}
                        >
                          {showRecentRates ? '▼ Hide' : '▶ Show'}
                        </button>
                      </div>
                      {showRecentRates && (
                        <div
                          style={{
                            backgroundColor: 'var(--Secondary-Color60)',
                            marginLeft: 'var(--20px-V)',
                            width: 'var(--500px-V)',
                            borderRadius: 'var(--5px-V)',
                            padding: 'var(--10px-V)',
                          }}
                        >
                          {' '}
                          <>
                            <div
                              style={{
                                fontSize: 'var(--13px-V)',
                                color: 'var(--Text-Color-Grey)',
                                fontStyle: 'italic',
                              }}
                            >
                              * Future rates provided by exchangerates-api *
                              Past rates provided by investing.com
                            </div>
                            <div
                              style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: 'var(--10px-V)',
                                padding: 'var(--5px-V)',
                                borderTop: 'var(--1px-V) solid var(--Border-Color)',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 'var(--10px-V)',
                                }}
                              >
                                <div>
                                  <span style={{ marginRight: 'var(--5px-V)' }}>
                                    From:
                                  </span>
                                  <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                      setStartDate(e.target.value)
                                    }
                                    style={{
                                      padding: 'var(--5px-V) var(--10px-V)',
                                      borderRadius: 'var(--4px-V)',
                                      border: 'var(--1px-V) solid var(--Border-Color)',
                                    }}
                                  />
                                </div>
                                <div>
                                  <span style={{ marginRight: 'var(--5px-V)' }}>
                                    To:
                                  </span>
                                  <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    style={{
                                      padding: 'var(--5px-V) var(--10px-V)',
                                      borderRadius: 'var(--4px-V)',
                                      border: 'var(--1px-V) solid var(--Border-Color)',
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                  }}
                                  style={{
                                    padding: 'var(--5px-V) var(--10px-V)',
                                    borderRadius: 'var(--4px-V)',
                                    border: 'var(--1px-V) solid var(--Border-Color)',
                                    backgroundColor: 'var(--Background-Color)',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Clear
                                </button>
                              </div>{' '}
                            </div>
                            {exchangeRates.map((rate, index) => {
                              const nextRate =
                                index < exchangeRates.length - 1
                                  ? exchangeRates[index + 1].rates
                                  : rate.rates;
                              const difference = rate.rates - nextRate;
                              const differenceText =
                                difference !== 0
                                  ? `(${
                                      difference > 0 ? '+' : ''
                                    }${difference.toFixed(2)})`
                                  : '';

                              return (
                                <div
                                  key={rate.id}
                                  style={{
                                    padding: 'var(--8px-V) var(--15px-V)',
                                    borderBottom: 'var(--1px-V) solid #eee',
                                    width: 'var(--350px-V)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                  }}
                                >
                                  <span>
                                    {new Date(
                                      rate.id * 1000
                                    ).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                    })}
                                  </span>
                                  <span
                                    style={{
                                      fontWeight: 500,
                                      color:
                                        index < exchangeRates.length - 1
                                          ? rate.rates > nextRate
                                            ? 'green'
                                            : rate.rates < nextRate
                                            ? 'red'
                                            : 'inherit'
                                          : 'inherit',
                                    }}
                                  >
                                    {rate.rates} ETB {differenceText}
                                  </span>
                                </div>
                              );
                            })}
                            <div
                              style={{
                                display: 'flex',

                                alignItems: 'center',
                                gap: 'var(--10px-V)',
                                padding: 'var(--5px-V)',
                                borderTop: 'var(--1px-V) solid var(--Border-Color)',
                              }}
                            >
                              <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1 || isLoadingRates}
                                style={{
                                  padding: 'var(--5px-V) var(--10px-V)',
                                  cursor:
                                    currentPage === 1 || isLoadingRates
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    currentPage === 1 || isLoadingRates
                                      ? 0.5
                                      : 1,
                                }}
                              >
                                First
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.max(1, prev - 1)
                                  )
                                }
                                disabled={currentPage === 1 || isLoadingRates}
                                style={{
                                  padding: 'var(--5px-V) var(--10px-V)',
                                  cursor:
                                    currentPage === 1 || isLoadingRates
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    currentPage === 1 || isLoadingRates
                                      ? 0.5
                                      : 1,
                                }}
                              >
                                Previous
                              </button>
                              <span
                                style={{
                                  color: 'var(--Text-Color)',
                                  padding: '0 var(--10px-V)',
                                  minWidth: 'var(--100px-V)',
                                  textAlign: 'center',
                                }}
                              >
                                Page {currentPage} of {totalPages || 1}
                              </span>
                              <button
                                onClick={() =>
                                  setCurrentPage((prev) =>
                                    Math.min(totalPages, prev + 1)
                                  )
                                }
                                disabled={
                                  currentPage >= totalPages || isLoadingRates
                                }
                                style={{
                                  padding: 'var(--5px-V) var(--10px-V)',
                                  cursor:
                                    currentPage >= totalPages || isLoadingRates
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    currentPage >= totalPages || isLoadingRates
                                      ? 0.5
                                      : 1,
                                }}
                              >
                                Next
                              </button>
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={
                                  currentPage >= totalPages || isLoadingRates
                                }
                                style={{
                                  padding: 'var(--5px-V) var(--10px-V)',
                                  cursor:
                                    currentPage >= totalPages || isLoadingRates
                                      ? 'not-allowed'
                                      : 'pointer',
                                  opacity:
                                    currentPage >= totalPages || isLoadingRates
                                      ? 0.5
                                      : 1,
                                }}
                              >
                                Last
                              </button>
                            </div>
                          </>
                        </div>
                      )}
                    </>
                  ) : (
                    <>Please connect to internet to see exchange rates</>
                  )}
                </div>

                {/* <div
                      style={{
                        marginTop: 'var(--15px-V)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'var(--10px-V)',
                      }}
                    >
                      <span>Check rate on: </span>
                      <input
                        type="date"
                        style={{
                          padding: 'var(--5px-V) var(--10px-V)',
                          borderRadius: 'var(--4px-V)',
                          border: 'var(--1px-V) solid #ddd',
                        }}
                        onChange={(e) => {
                          const selectedDate =
                            new Date(e.target.value).getTime() / 1000;
                          const rate = exchangeRates.find((r) => {
                            const rateDate = new Date(r.id * 1000);
                            return (
                              rateDate.toDateString() ===
                              new Date(selectedDate * 1000).toDateString()
                            );
                          });
                          if (rate) {
                            setGetExchangeRateDate(selectedDate);
                          } else {
                            alert(
                              'No exchange rate data available for this date'
                            );
                          }
                        }}
                      />
                      <button
                       
                        onClick={() => fetchExchangeRateOfThatDate()}
                      >
                        Get Rate
                      </button>
                      {GetExchangeRate != 0 ? (
                        <>
                          {new Date(new Date(GetExchangeRateDate).getTime()*1000).toDateString()}:{' '}
                          {GetExchangeRate}
                        </>
                      ) : (
                        ''
                      )}
                    </div>*-Use live exchange Rates{' '}
                <input
                  type="checkbox"
                  onChange={(e) => {
                    window.electron.store.set(
                      'useLiveExchangeRates',
                      e.target.checked
                    );
                    setRefresh(refresh + 1);
                  }}
                  value={window.electron.store.get('useLiveExchangeRates')}
                />{' '}
                <br /> */}
                {/** <>
                  -Exchange rates in {GetDefaultCurrency()}
                  {AllCurrencies.filter(
                    (currency) => currency !== GetDefaultCurrency()
                  ).map((currency) => (
                    <div
                      style={{ margin: 'var(--10px-V)', marginLeft: 'var(--15px-V)' }}
                    >
                      {currency} =
                      <input
                        style={{ width: 'var(--80px-V)' }}
                        type="number"
                        value={window.electron.store.get(
                          `exchangeRateFrom${GetDefaultCurrency()}To${currency}`
                        )}
                        onChange={(e) => {
                          window.electron.store.set(
                            `exchangeRateFrom${GetDefaultCurrency()}To${currency}`,
                            parseFloat(e.target.value)
                          );
                        }}
                      />
                      {CurrencySign(GetDefaultCurrency())}
                    </div>
                  ))}
                </>*/}
              </div>
              <div style={{ margin: 'var(--10px-V)' }}>
                {' '}
                <h2 style={{ fontSize: 'var(--25px-V)' }}>
                  -- Formating numbers --
                </h2>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  Make big numbers like 100,000, 1,000,000 or 10,000,000 to
                  100k, 1M or 10M:{' '}
                  <input
                    type="checkbox"
                    name=""
                    id=""
                    checked={window.electron.store.get('abbreiviateBigNumbers')}
                    onChange={(e) => {
                      window.electron.store.set(
                        'abbreiviateBigNumbers',
                        e.target.checked
                      );
                      if (e.target.checked) {
                        window.electron.store.set('abbreviationDecimals', 2);
                      }
                      setRefresh(refresh + 1);
                    }}
                  />
                  <br />
                  Number of decimal places to show:{' '}
                  <input
                    type="number"
                    min="0"
                    max="4"
                    style={{ width: 'var(--60px-V)' }}
                    value={window.electron.store.get('abbreviationDecimals')}
                    onChange={(e) => {
                      window.electron.store.set(
                        'abbreviationDecimals',
                        parseInt(e.target.value)
                      );
                      setRefresh(refresh + 1);
                    }}
                  />
                  <br />
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>Non of the pages are allowed</>
      )}
    </>
  );
};

export default React.memo(ToolsPage);
