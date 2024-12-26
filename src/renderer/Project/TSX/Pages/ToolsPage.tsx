import { storageManager } from '../../../storeManager';
import { Input } from '../Helpers/CustomReactComponents';
import {
  addValue,
  getValuesWithSql,
  updateValue,
  deleteValue,
} from '../../../../Backend/localServerApis';
import React, { useEffect, useState, useRef, useMemo } from 'react';

import {
  addValueOnline,
  getValuesWithSql_Online,
  sendEmailAPI,
  sendSMS,
  sendSMSWithUserId,
  updateValueOnline,
} from '../../../../Backend/OnlineServerApis';
import EmailTemplates from '../Tools page components/EmailTemplates';
import SMSTemplates from '../Tools page components/SMSTemplates';
import { getUserPrivileges } from '../../../App';
import { addDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import {
  AllCurrencies,
  CurrencySign,
  formatNumberWithSuffix,
  GetCurrencyAsOptionsOnSelect,
  GetDefaultCurrency,
} from '../Helpers/CurrencySign';
import ExpenseManager from '../Tools page components/ExpenseManager';
import { useAlert } from 'renderer/components/useAlert';
import { useConfirm } from 'renderer/components/useConfirm';
import { useGlobal } from 'renderer/components/GlobalContext';
import DatabasePage from './DatabasePage';

const ToolsPage = ({
  setToolsSelectedPage,
  ToolsSelectedPage,
  setChangeMade,
  SelectedUserId,
  SelectedAppUser,
  SelectedBranchId,
  signOutUserAndRestart,
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
  const [emailDaysBefore, setEmailDaysBefore] = useState(0);
  const [sendSms, setSendSms] = useState(false);
  const [smsDaysBefore, setSmsDaysBefore] = useState(0);
  const [emailTo, setEmailTo] = useState('');
  const [smsTo, setSmsTo] = useState('');
  const [isApplyingNotifications, setIsApplyingNotifications] = useState(false);
  const [isResetingTemplates, setIsResetingTemplates] = useState(false);

  const [
    ShowDefaultNotificationsSettings,
    setShowDefaultNotificationsSettings,
  ] = useState(false);
  const { showAlert } = useAlert();
  const applyDefaultNotifications = async () => {
    if (sendEmail) {
      if (!emailDaysBefore || emailDaysBefore === '') {
        showAlert('Please enter days before for email notification');
        return;
      }
    }
    if (sendSms) {
      if (!validatePhoneNumber(smsTo)) {
        showAlert('Please enter a valid 10-digit phone number');
        return;
      }

      if (!smsDaysBefore || smsDaysBefore === '') {
        showAlert('Please enter days before for SMS notification');
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
          setAllExpenses(
            AllExpenses.map((expense) =>
              expense.id === expense.id ? { ...expense, [key]: value } : expense
            )
          );
        }
      }

      // Refresh the expenses list
      await getExpenses();
      setShowDefaultNotificationsSettings(false);
      showAlert('Default notifications applied to all expenses successfully!');
    } catch (error) {
      console.error('Error applying default notifications:', error);
      showAlert('Failed to apply default notifications. Please try again.');
    } finally {
      setIsApplyingNotifications(false);
    }
  };
  const {
    AllEmailTemplates,
    setAllEmailTemplates,
    AllSmsTemplates,
    setAllSmsTemplates,
    AllExpenses,
    setAllExpenses,
    AllRoomSpecifications,
    setAllRoomSpecifications,
  } = useGlobal();
  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhoneNumber = (phoneNumber: string) => {
    const phoneNumberRegex = /^\d{10}$/;
    return phoneNumberRegex.test(phoneNumber);
  };
  const fetchEmailTemplates = async () => {
    const templates = AllEmailTemplates;
    setEmailTemplates(templates);
  };
  const getSMSTemplates = async () => {
    const templates = AllSmsTemplates;
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
    const rawExpenses = AllExpenses;

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
    setAllEmailTemplates(
      AllEmailTemplates.map((template) =>
        template.id === id
          ? { ...template, name, subject, body, Type }
          : template
      )
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
    setAllSmsTemplates(
      AllSmsTemplates.map((template) =>
        template.id === id ? { ...template, name, body } : template
      )
    );
    setEditingTemplateId(null);
    setEditedTemplate(null);
  };

  const deleteEmailTemplate = async (id: string) => {
    await deleteValue('email_templates', id, setChangeMade);
    setAllEmailTemplates(
      AllEmailTemplates.filter((template) => template.id !== id)
    );
    setEmailTemplates(emailTemplates.filter((template) => template.id !== id));
  };

  const deleteSMSTemplate = async (id: string) => {
    await deleteValue('sms_templates', id, setChangeMade);
    setAllSmsTemplates(
      AllSmsTemplates.filter((template) => template.id !== id)
    );
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
          const userDATA = await storageManager.get('users');
          const userEmail = userDATA[0].email;
          const userPass = userDATA[0].password;
          if (navigator.onLine) {
            try {
              await sendEmailAPI(recipientEmail, subject, body, SelectedUserId);

              setEmailSentSuccessstring('Email sent successfully');
              setEmailSentSuccessstring('Sent');
              setIsSending(false);
              setEmailSentSuccess(true);
            } catch (error) {
              console.error('Error sending email:', error);
              setEmailSentSuccessstring(
                error.message || 'Failed to send email'
              );
              setEmailSentSuccessstring('Failed');
              setIsSending(false);
              setEmailSentSuccess(false);
            }
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
      const userDATA = await storageManager.get('users');

      if (navigator.onLine) {
        if (recipientEmail.length === 10 && recipientEmail.startsWith('0')) {
          // Call the sendSMS function from OnlineServerApis.js
          const response = await sendSMSWithUserId(
            recipientEmail,
            body,
            userDATA[0].id
          );

          if (response.success) {
            console.log('SMS sent successfully');
          } else {
            showAlert('Failed to send SMS: ' + response.error, 'error');
            console.error('Failed to send SMS:', response.error);
          }
        } else {
          showAlert(
            'Invalid phone number format. Please enter a 10-digit number starting with 0.'
          );
        }
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
      userId: storageManager.get('users')[0].id,
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
    setAllEmailTemplates([
      ...AllEmailTemplates,
      {
        id: newTemplate.id,
        name: newTemplate.name,
        subject: newTemplate.subject,
        body: newTemplate.body,
        created_at: newTemplate.created_at,
        updated_at: newTemplate.updated_at,
        userId: newTemplate.userId,
      },
    ]);
    setEmailTemplates([...emailTemplates, newTemplate]);
    setEditingTemplateId(newTemplate.id);
    setEditedTemplate(newTemplate);
    setOriginalTemplate(newTemplate);
  };
  const { confirm } = useConfirm();
  // Add this at the top of your component
  const handleReplaceWithDefault = async () => {
    try {
      const choice = await confirm(
        'Are you sure you want to delete all existing email templates and replace with defaults? This action cannot be undone.',
        {
          title: 'Replace Email Templates',
          confirmText: 'Replace',
          cancelText: 'Keep',
          type: 'danger',
        }
      );

      if (choice) {
        setIsResetingTemplates(true);
        // User clicked "Yes, Replace All"
        for (const template of emailTemplates) {
          await deleteValue('email_templates', template.id, setChangeMade);
          setAllEmailTemplates(
            AllEmailTemplates.filter((t) => t.id !== template.id)
          );
        }
        // Get default templates and insert them
        const userId = storageManager.get('users')[0].id;
        const defaultTemplates = getEmailTemplates(userId);

        for (const template of defaultTemplates) {
          await addValue('email_templates', template, setChangeMade);
          setAllEmailTemplates([...AllEmailTemplates, template]);
        }

        fetchEmailTemplates();
        setIsResetingTemplates(false);
      }
    } catch (error) {
      console.error('Error replacing templates:', error);
    }
  };
  const { isMobileState } = useGlobal();
  const handleReplaceWithDefaultSms = async () => {
    try {
      const choice = await confirm(
        'Are you sure you want to delete all existing sms templates and replace with defaults? This action cannot be undone.',
        {
          title: 'Replace SMS Templates',
          confirmText: 'Replace',
          cancelText: 'Keep',
          type: 'danger',
        }
      );

      if (choice) {
        setIsResetingTemplates(true);
        // User clicked "Yes, Replace All"
        for (const template of smsTemplates) {
          await deleteValue('sms_templates', template.id, setChangeMade);
          setAllSmsTemplates(
            AllSmsTemplates.filter((t) => t.id !== template.id)
          );
        }
        // Get default templates and insert them
        const userId = storageManager.get('users')[0].id;
        const defaultTemplates = getSmsTemplates(userId);

        for (const template of defaultTemplates) {
          await addValue('sms_templates', template, setChangeMade);
          setAllSmsTemplates([...AllSmsTemplates, template]);
        }

        await getSMSTemplates();
        setIsResetingTemplates(false);
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
        subject: 'የመጨረሻ ማሳሰቢያ፡ የኪራይ ክፍ�� በ7 ቀናት ዘግ��ቷል',
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
    setAllSmsTemplates([
      ...AllSmsTemplates,
      {
        id: newTemplate.id,
        name: newTemplate.name,
        body: newTemplate.body,
        created_at: newTemplate.created_at,
        updated_at: newTemplate.updated_at,
        userId: newTemplate.userId,
      },
    ]);
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
    setAllExpenses([...AllExpenses, newExpense]);
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
        editedExpense.Currency || 'ETB',
        editedExpense.category || 'Other',
        editedExpense.beforeTax || false
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
  const handleSignOut = async () => {
    const choice = await confirm('Are you sure you want to sign out?', {
      title: 'Sign Out',
      confirmText: 'Sign Out',
      cancelText: 'Cancel',
      type: 'warning',
    });

    if (choice) {
      signOutUserAndRestart();
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
    Currency: string = 'ETB',
    category: string = 'Other',
    beforeTax: boolean = false
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
      category,
      beforeTax,
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
      setAllExpenses(updatedExpenses);
    }

    setEditingExpenseId(null);
    setEditedExpense(null);
  };

  const handleDeleteExpense = async (id: string) => {
    const choice = await confirm(
      'Are you sure you want to delete this expense?',
      {
        title: 'Delete Expense',
        confirmText: 'Delete',
        cancelText: 'Keep',
        type: 'danger',
      }
    );
    if (choice) {
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
    const getUserSettings = async () => {
      if (!navigator.onLine) return;

      try {
        setLoading(true);
        const user = await getValuesWithSql_Online(
          'users',
          `WHERE id = '${SelectedUserId}'`
        );
        if (!user || !user[0]) return;

        // Get email sending settings
        const selectedEmail = user[0].selectedEmailToSendWith;
        setEmailSendingwith(selectedEmail || '');

        // Get tax percentage
        const taxPercentage = user[0].taxPercentage;
        setTaxPercentage(taxPercentage || storageManager.get('taxPercentage'));

        // Get email settings
        const {
          RepresentativeEmails,
          RepresentativePhoneNumbers,
          LandlordName,
          LandlordEmail,
          LandlordTelephone,
        } = user[0];

        // Update all states
        setRepresentativeEmails(RepresentativeEmails);
        setRepresentativePhoneNumbers(RepresentativePhoneNumbers);
        setLandlordDisplayName(LandlordName);
        setLandlordEmail(LandlordEmail);
        setLandlordTelephone(LandlordTelephone);

        setOriginalValues({
          representativeEmails: RepresentativeEmails,
          representativePhoneNumbers: RepresentativePhoneNumbers,
          landlordDisplayName: LandlordName,
          landlordEmail: LandlordEmail,
          landlordTelephone: LandlordTelephone,
        });
      } catch (error) {
        console.error('Failed to fetch user settings:', error);
        // Fallback to stored tax percentage if online fetch fails
        setTaxPercentage(storageManager.get('taxPercentage'));
      } finally {
        setLoading(false);
      }
    };

    getUserSettings();
  }, [SelectedUserId]);
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
      if (navigator.onLine) {
        setIsLoadingRates(true);
        let whereClause = 'WHERE 1';
        if (startDate) {
          whereClause += ` AND id >= ${new Date(startDate).getTime() / 1000}`;
        }
        if (endDate) {
          whereClause += ` AND id <= ${new Date(endDate).getTime() / 1000}`;
        }

        // Add pagination params directly to the where clause
        const offset = (currentPage - 1) * ratesPerPage;
        whereClause += ` ORDER BY id DESC LIMIT ${ratesPerPage} OFFSET ${offset}`;

        // Single query to get the data
        const rates = await getValuesWithSql_Online(
          'Exchange_RatesUSDtoETB',
          whereClause
        );

        setExchangeRates(rates);
        setTotalPages(Math.ceil(rates.length / ratesPerPage));
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
        storageManager.set('exchangeRate', latestRate);
        storageManager.set(
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
      if (navigator.onLine) {
        // First try to get the exact date's rate
        const targetDate = new Date(GetExchangeRateDate).getTime();
        if (!isNaN(targetDate) && targetDate > 0) {
          let rates = await getValuesWithSql_Online(
            'Exchange_RatesUSDtoETB',
            `WHERE id <= ${targetDate} ORDER BY id DESC LIMIT 1`
          );

          // If we found a rate, use it
          if (rates.length > 0) {
            setGetExchangeRate(rates[0].rates);
            // Optionally show when this rate is from if it's not the exact date
            if (rates[0].id !== targetDate) {
            }
          } else {
            setGetExchangeRate(0);
          }
        }
      } else {
        // Get from local store if offline
        const localRates = storageManager.get('exchangeRate');
        if (localRates && localRates.length > 0) {
          const targetDate = new Date(GetExchangeRateDate).getTime();
          // Find closest rate that's not after target date
          const closestRate = localRates
            .filter((rate) => rate.id <= targetDate)
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
  const [representativeEmails, setRepresentativeEmails] = useState<string>('');
  const [representativePhoneNumbers, setRepresentativePhoneNumbers] =
    useState<string>('');
  const [landlordDisplayName, setLandlordDisplayName] = useState<string>('');
  const [landlordEmail, setLandlordEmail] = useState<string>('');
  const [landlordTelephone, setLandlordTelephone] = useState<string>('');
  const [originalValues, setOriginalValues] = useState({
    representativeEmails: '',
    representativePhoneNumbers: '',
    landlordDisplayName: '',
    landlordEmail: '',
    landlordTelephone: '',
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasAnyChanges =
      representativeEmails !== originalValues.representativeEmails ||
      representativePhoneNumbers !==
        originalValues.representativePhoneNumbers ||
      landlordDisplayName !== originalValues.landlordDisplayName ||
      landlordEmail !== originalValues.landlordEmail ||
      landlordTelephone !== originalValues.landlordTelephone;

    setHasChanges(hasAnyChanges);
  }, [
    representativeEmails,
    representativePhoneNumbers,
    landlordDisplayName,
    landlordEmail,
    landlordTelephone,
    originalValues,
  ]);

  const handleSaveEmailSettings = async () => {
    if (navigator.onLine) {
      try {
        const userId = await storageManager.get('users')[0].id;
        if (!userId) {
          showAlert('ISSUES user data');
          return;
        }
        // Assuming there's an API call to save the values
        if (representativeEmails && hasChanges) {
          await updateValueOnline(
            'users',
            userId,
            'RepresentativeEmails',
            representativeEmails
          );
        }
        if (representativePhoneNumbers && hasChanges) {
          await updateValueOnline(
            'users',
            userId,
            'RepresentativePhoneNumbers',
            representativePhoneNumbers
          );
        }
        if (landlordDisplayName && hasChanges) {
          await updateValueOnline(
            'users',
            userId,
            'LandlordName',
            landlordDisplayName
          );
        }
        if (landlordEmail && hasChanges) {
          await updateValueOnline(
            'users',
            userId,
            'LandlordEmail',
            landlordEmail
          );
        }
        if (landlordTelephone && hasChanges) {
          await updateValueOnline(
            'users',
            userId,
            'LandlordTelephone',
            landlordTelephone
          );
        }
        setOriginalValues({
          representativeEmails,
          representativePhoneNumbers,
          landlordDisplayName,
          landlordEmail,
          landlordTelephone,
        });
        setHasChanges(false);
      } catch (error) {
        console.error('Failed to save email settings:', error);
      }
    } else {
      showAlert('You are offline, cannot save settings');
    }
  };

  const handleCancel = () => {
    setRepresentativeEmails(originalValues.representativeEmails);
    setRepresentativePhoneNumbers(originalValues.representativePhoneNumbers);
    setLandlordDisplayName(originalValues.landlordDisplayName);
    setLandlordEmail(originalValues.landlordEmail);
    setLandlordTelephone(originalValues.landlordTelephone);
    setHasChanges(false);
  };
  const [reviewForm, setReviewForm] = useState('');
  const [featureSuggestion, setFeatureSuggestion] = useState('');
  const [isSendingReview, setIsSendingReview] = useState(false);
  const [isSendingFeatureSuggestion, setIsSendingFeatureSuggestion] =
    useState(false);
  const handleSubmit = async () => {
    setIsSendingReview(true);
    const review = reviewForm;
    const subject = 'Review';
    const body = review;
    const userDATA = await storageManager.get('users');
    const userEmail = userDATA[0].email;
    const userPass = userDATA[0].password;

    await sendEmailAPI(
      'rentmaster.et@gmail.com',
      'Review From ' + userEmail,
      review,
      SelectedUserId
    );

    setReviewForm('');
    setInterval(() => {
      setIsSendingReview(false);
    }, 2000);
  };
  const handleSubmitFeatureSuggestion = async () => {
    setIsSendingFeatureSuggestion(true);
    const feature = featureSuggestion;
    const subject = 'Feature Suggestion';
    const body = feature;
    const userDATA = await storageManager.get('users');
    const userEmail = userDATA[0].email;
    const userPass = userDATA[0].password;

    await sendEmailAPI(
      'rentmaster.et@gmail.com',
      'Feature Suggestion From ' + userEmail,
      feature,
      SelectedUserId
    );

    setFeatureSuggestion('');

    setInterval(() => {
      setIsSendingFeatureSuggestion(false);
    }, 2000);
  };
  const [refresh, setRefresh] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  useEffect(() => {
    setIsOnline(navigator.onLine);
  }, [navigator.onLine]);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [hasChangedTaxPercentage, setHasChangedTaxPercentage] = useState(false);
  const [isApplyingTaxPercentage, setIsApplyingTaxPercentage] = useState(false);
  const changeTaxPercentage = async (value: number) => {
    try {
      storageManager.set('taxPercentage', value);
      await updateValueOnline('users', SelectedUserId, 'taxPercentage', value);
    } catch (error) {
      console.error('Failed to change tax percentage:', error);
    }
  };
  const saveTaxPercentage = async () => {
    setIsApplyingTaxPercentage(true);
    await changeTaxPercentage(taxPercentage);
    setHasChangedTaxPercentage(false);
    setIsApplyingTaxPercentage(false);
  };
  const CancelTaxPercentage = async () => {
    setTaxPercentage(storageManager.get('taxPercentage'));
    setHasChangedTaxPercentage(false);
  };
  const [specifications, setSpecifications] = useState<RoomSpecificationType[]>(
    []
  );
  const [hasChangedSpecs, setHasChangedSpecs] = useState(false);
  const [isApplyingSpecs, setIsApplyingSpecs] = useState(false);

  // Load initial specifications from global context
  useEffect(() => {
    const defaultSpecs = AllRoomSpecifications.filter(
      (spec) => spec.roomId === 'DEFAULT'
    );
    setSpecifications(defaultSpecs);
  }, [AllRoomSpecifications]);

  // Track pending changes
  const [pendingChanges, setPendingChanges] = useState<{
    added: RoomSpecificationType[];
    updated: { id: string; changes: Partial<RoomSpecificationType> }[];
    deleted: string[];
  }>({
    added: [],
    updated: [],
    deleted: [],
  });

  const addSpecification = () => {
    const newSpec = {
      id: uuidv4(),
      type: 'bool',
      Detail: '',
      Boolean: false,
      Number: 0,
      branchId: SelectedBranchId,
      roomId: 'DEFAULT',
      userId: SelectedUserId,
    };
    setSpecifications((prevSpecs) => [...prevSpecs, newSpec]);
    setPendingChanges((prev) => ({
      ...prev,
      added: [...prev.added, newSpec],
    }));
    setHasChangedSpecs(true);
  };

  const removeSpecification = (index: number) => {
    const specToRemove = specifications[index];
    setSpecifications((prevSpecs) => prevSpecs.filter((_, i) => i !== index));

    // If it was a newly added spec, remove from added list
    if (pendingChanges.added.find((s) => s.id === specToRemove.id)) {
      setPendingChanges((prev) => ({
        ...prev,
        added: prev.added.filter((s) => s.id !== specToRemove.id),
      }));
    } else {
      // Otherwise add to deleted list
      setPendingChanges((prev) => ({
        ...prev,
        deleted: [...prev.deleted, specToRemove.id],
      }));
    }
    setHasChangedSpecs(true);
  };

  const handleSpecificationChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const spec = specifications[index];
    setSpecifications((prevSpecs) =>
      prevSpecs.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );

    // Don't track changes for newly added specs
    if (!pendingChanges.added.find((s) => s.id === spec.id)) {
      const existingChange = pendingChanges.updated.find(
        (u) => u.id === spec.id
      );
      if (existingChange) {
        setPendingChanges((prev) => ({
          ...prev,
          updated: prev.updated.map((u) =>
            u.id === spec.id
              ? { ...u, changes: { ...u.changes, [field]: value } }
              : u
          ),
        }));
      } else {
        setPendingChanges((prev) => ({
          ...prev,
          updated: [
            ...prev.updated,
            {
              id: spec.id,
              changes: { [field]: value },
            },
          ],
        }));
      }
    }
    setHasChangedSpecs(true);
  };

  const saveSpecs = async () => {
    setIsApplyingSpecs(true);
    try {
      // Handle deletions
      for (const id of pendingChanges.deleted) {
        await deleteValue('room_specifications', id);
      }

      // Handle additions
      for (const spec of pendingChanges.added) {
        await addValue('room_specifications', spec);
      }

      // Handle updates
      for (const { id, changes } of pendingChanges.updated) {
        for (const [field, value] of Object.entries(changes)) {
          await updateValue('room_specifications', id, field, value);
        }
      }

      // Update global context with current specifications
      const updatedSpecs = [
        ...AllRoomSpecifications.filter((spec) => spec.roomId !== 'DEFAULT'),
        ...specifications,
      ];
      setAllRoomSpecifications(updatedSpecs);

      // Reset pending changes
      setPendingChanges({
        added: [],
        updated: [],
        deleted: [],
      });
      setHasChangedSpecs(false);
    } catch (error) {
      console.error('Failed to save specifications:', error);
    }
    setIsApplyingSpecs(false);
  };

  const cancelSpecs = async () => {
    // Reset to original specifications from global context
    const defaultSpecs = AllRoomSpecifications.filter(
      (spec) => spec.roomId === 'DEFAULT'
    );
    setSpecifications(defaultSpecs);
    setHasChangedSpecs(false);
  };
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
          {ToolsSelectedPage === 'Database' && (
            <>
              {/* <ExpenseManager
                // Header controls
                showFilters={showFilters}
                setShowFilters={setShowFilters}
                ShowDefaultNotificationsSettings={
                  ShowDefaultNotificationsSettings
                }
                setShowDefaultNotificationsSettings={
                  setShowDefaultNotificationsSettings
                }
                handleAddExpense={handleAddExpense}
                resetFilters={resetFilters}
                // Filter controls
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                fullBuildingFilter={fullBuildingFilter}
                setFullBuildingFilter={setFullBuildingFilter}
                floorSearch={floorSearch}
                setFloorSearch={setFloorSearch}
                roomSearch={roomSearch}
                setRoomSearch={setRoomSearch}
                doesReoccurFilter={doesReoccurFilter}
                setDoesReoccurFilter={setDoesReoccurFilter}
                reoccurDays={reoccurDays}
                setReoccurDays={setReoccurDays}
                dateFilter={dateFilter}
                setDateFilter={setDateFilter}
                // Notification settings
                sendEmail={sendEmail}
                setSendEmail={setSendEmail}
                emailTo={emailTo}
                setEmailTo={setEmailTo}
                emailDaysBefore={emailDaysBefore}
                setEmailDaysBefore={setEmailDaysBefore}
                sendSms={sendSms}
                setSendSms={setSendSms}
                smsTo={smsTo}
                setSmsTo={setSmsTo}
                smsDaysBefore={smsDaysBefore}
                setSmsDaysBefore={setSmsDaysBefore}
                applyDefaultNotifications={applyDefaultNotifications}
                // Expense data and handlers
                filteredExpenses={filteredExpenses}
                editingExpenseId={editingExpenseId}
                editedExpense={editedExpense}
                showNotifySettings={showNotifySettings}
                handleEditExpenseClick={handleEditExpenseClick}
                handleEditExpenseChange={handleEditExpenseChange}
                toggleNotifySettings={toggleNotifySettings}
                handleDeleteExpense={handleDeleteExpense}
                calculateNextPayment={calculateNextPayment}
                // Utility functions
                GetCurrencyAsOptionsOnSelect={GetCurrencyAsOptionsOnSelect}
                CurrencySign={CurrencySign}
                formatNumberWithSuffix={formatNumberWithSuffix}
                addDays={addDays}
              /> */}
              <DatabasePage
                setChangeMade={setChangeMade}
                SelectedAppUser={SelectedAppUser}
                SelectedBranchId={SelectedBranchId}
              />
            </>
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
                zIndex: 1000,
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
          {isResetingTemplates && (
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
                zIndex: 100,
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
                Reseting Templates...
              </p>
            </div>
          )}
          {ToolsSelectedPage === 'Settings' && (
            <div className="settings-main-container">
              <div
               style={{
                display: 'flex',
                alignItems: isMobileState ? 'flex-start' : 'center',
                paddingLeft: isMobileState ? 'var(--20px-V)' : '0',
                justifyContent: 'space-between',
                flexDirection: isMobileState ? 'column' : 'row',
              }}
              >
                <h1>Settings</h1>{' '}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--10px-V)',
                  }}
                >
                  {storageManager.get('users')?.[0]?.email || ""} -{' '}
                  {storageManager.get('users')?.[0]?.companyName || ""}
                  <button onClick={handleSignOut}>Sign Out</button>{' '}
                </div>
              </div>
              <div className="settings-container">
                {' '}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--10px-V)',
                  }}
                >
                  <h2>Tax percentages</h2>
                  {hasChangedTaxPercentage ? (
                    <>
                      {isApplyingTaxPercentage ? (
                        <img
                          src={loadingGif}
                          alt="Loading..."
                          style={{
                            width: 'var(--20px-V)',
                            height: 'var(--20px-V)',
                          }}
                        />
                      ) : (
                        <>
                          <button
                            id="tax-percentage-save"
                            onClick={saveTaxPercentage}
                          >
                            Save
                          </button>
                          <button onClick={CancelTaxPercentage}>Cancel</button>
                        </>
                      )}
                    </>
                  ) : (
                    <></>
                  )}
                </div>
                {isOnline ? (
                  <div className="settings-inner-container">
                    Tax percentage:{' '}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      style={{ width: 'var(--60px-V)' }}
                      value={taxPercentage}
                      id="tax-percentage-input"
                      onChange={(e) => {
                        setHasChangedTaxPercentage(true);
                        setTaxPercentage(parseInt(e.target.value, 10));
                      }}
                    />
                    %
                  </div>
                ) : (
                  <div className="settings-inner-container">
                    Please connect to the internet to change tax percentage
                  </div>
                )}
              </div>
              <div className="settings-container" id="room-specs-section">
                {' '}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--10px-V)',
                  }}
                >
                  <h2 style={{ fontSize: 'var(--25px-V)' }}>
                    Default Room Specifications
                  </h2>
                  <button id="add-room-spec-button" onClick={addSpecification}>
                    Add
                  </button>
                  {hasChangedSpecs ? (
                    <>
                      {isApplyingSpecs ? (
                        <img
                          src={loadingGif}
                          alt="Loading..."
                          style={{
                            width: 'var(--20px-V)',
                            height: 'var(--20px-V)',
                          }}
                        />
                      ) : (
                        <>
                          <button
                            id="room-spec-save-button"
                            onClick={saveSpecs}
                          >
                            Save
                          </button>
                          <button onClick={cancelSpecs}>Cancel</button>
                        </>
                      )}
                    </>
                  ) : (
                    <></>
                  )}
                </div>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  <span
                    style={{
                      color: 'var(--Text-Color-Grey)',
                      marginBottom: 'var(--10px-V)',
                      fontStyle: 'italic',
                    }}
                  >
                    These specifications will be shown when adding a new room,
                    so you don't have to enter them repeatedly.
                  </span>

                  {specifications.length === 0 ? (
                    <div
                      style={{
                        color: 'var(--Text-Color-Grey)',
                        fontStyle: 'italic',
                      }}
                    >
                      <div>Click "Add" above to add specifications</div>
                      Example specifications:
                      <div>• Bedrooms: 3</div>
                      <div>• Balcony: Yes</div>
                    </div>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        overflowX: 'auto',
                        gap: 'var(--10px-V)',
                      }}
                    >
                      {specifications.map((spec, index) => (
                        <div
                          key={index}
                          className="AddANewRoomSpecObjectMainContainer"
                          style={{ minWidth: 'var(--240px-V)' }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              gap: 'var(--5px-V)',
                            }}
                          >
                            Name:
                            <input
                              id="room-spec-name-input"
                              className="AddANewRoomInputsMid"
                              value={spec.Detail}
                              placeholder="Enter name"
                              onChange={(e) => {
                                setHasChangedSpecs(true);
                                handleSpecificationChange(
                                  index,
                                  'Detail',
                                  e.target.value
                                );
                              }}
                            />
                            <div id="room-spec-input">
                              {spec.type === 'bool' ? (
                                <>
                                  <input
                                    type="checkbox"
                                    checked={spec.Boolean}
                                    onChange={(e) => {
                                      setHasChangedSpecs(true);
                                      handleSpecificationChange(
                                        index,
                                        'Boolean',
                                        e.target.checked
                                      );
                                    }}
                                  />{' '}
                                  {spec.Boolean ? 'Yes' : 'No'}
                                </>
                              ) : (
                                <input
                                  type="number"
                                  className="AddANewRoomInputsSmall"
                                  value={spec.Number}
                                  onChange={(e) => {
                                    setHasChangedSpecs(true);
                                    handleSpecificationChange(
                                      index,
                                      'Number',
                                      e.target.value
                                    );
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          <div
                            style={{
                              marginTop: 'var(--5px-V)',
                              display: 'flex',
                              flexDirection: 'row',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                            }}
                          >
                            <div
                              id="room-spec-type-radio"
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`spec-${index}`}
                                  value="bool"
                                  checked={spec.type === 'bool'}
                                  onChange={() => {
                                    setHasChangedSpecs(true);
                                    handleSpecificationChange(
                                      index,
                                      'type',
                                      'bool'
                                    );
                                  }}
                                />{' '}
                                Yes/No
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}
                              >
                                <input
                                  type="radio"
                                  name={`spec-${index}`}
                                  value="number"
                                  checked={spec.type === 'number'}
                                  onChange={() => {
                                    setHasChangedSpecs(true);
                                    handleSpecificationChange(
                                      index,
                                      'type',
                                      'number'
                                    );
                                  }}
                                />{' '}
                                Number
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                setHasChangedSpecs(true);
                                removeSpecification(index);
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="settings-container">
                <h2>Currency Settings</h2>

                {/* Default Currency Selection */}

                {/* Exchange Rate Section */}
                <div className="settings-inner-container">
                  <div>
                    <label style={{ fontWeight: 500 }}>
                      Default Currency:{' '}
                    </label>
                    <select
                      id="default-currency-select"
                      onChange={(e) => {
                        storageManager.set('defaultCurrency', e.target.value);
                        setRefresh(refresh + 1);
                      }}
                      value={GetDefaultCurrency()}
                    >
                      {GetCurrencyAsOptionsOnSelect()}
                    </select>
                  </div>
                  {isOnline ? (
                    <div>
                      {/* Current Exchange Rate */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--10px-V)',
                        }}
                      >
                        <span>Current Exchange Rate:</span>
                        <button
                          id="update-exchange-rate-button"
                          onClick={updateExchangeRates}
                        >
                          Update Now
                        </button>
                        <p style={{ fontSize: 'var(--13px-V)' }}>
                          Last Updated:{' '}
                          {storageManager.get('lastExchangeRateUpdate')
                            ? new Date(
                                storageManager.get('lastExchangeRateUpdate')
                              ).toDateString()
                            : 'Not updated yet'}
                          <br />
                          Rate:{' '}
                          {GetDefaultCurrency() === 'USD'
                            ? (
                                1 /
                                storageManager.get('exchangeRate')[
                                  storageManager.get('exchangeRate').length - 1
                                ].rates
                              ).toFixed(5)
                            : storageManager
                                .get('exchangeRate')
                                [
                                  storageManager.get('exchangeRate').length - 1
                                ].rates.toFixed(5)}
                          {CurrencySign(GetDefaultCurrency())}
                        </p>
                      </div>

                      {/* Check Historical Rate */}
                      <div style={{ marginBottom: 'var(--15px-V)' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--10px-V)',
                          }}
                        >
                          <span>Check Historical Rate: </span>
                          <input
                            id="historical-rate-date-input"
                            type="date"
                            onChange={(e) => {
                              const selectedDate =
                                new Date(e.target.value).getTime() / 1000;
                              if (
                                selectedDate <
                                new Date('2015-01-01').getTime() / 1000
                              ) {
                                showAlert('Please select a date after 2015');
                                return;
                              }
                              setGetExchangeRateDate(selectedDate);
                            }}
                          />
                          <button onClick={() => fetchExchangeRateOfThatDate()}>
                            Get Rate
                          </button>
                        </div>
                        {GetExchangeRate !== 0 && (
                          <div style={{ marginTop: 'var(--5px-V)' }}>
                            Rate on{' '}
                            {new Date(
                              GetExchangeRateDate * 1000
                            ).toDateString()}
                            : {GetExchangeRate}
                          </div>
                        )}
                      </div>

                      {/* Recent Rates Section */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--10px-V)',
                            marginBottom: 'var(--10px-V)',
                          }}
                        >
                          <h3 style={{ margin: 0 }}>Recent Exchange Rates</h3>
                          <button
                            id="show-recent-rates-button"
                            onClick={() => setShowRecentRates(!showRecentRates)}
                          >
                            {showRecentRates ? 'Hide' : 'Show'}
                          </button>
                        </div>

                        {showRecentRates && (
                          <div
                            style={{
                              backgroundColor: 'var(--Secondary-Color60)',
                              padding: 'var(--10px-V)',
                              borderRadius: 'var(--5px-V)',
                            }}
                          >
                            {/* Date Range Selection */}
                            <div style={{ marginBottom: 'var(--10px-V)' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 'var(--10px-V)',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <span>From: </span>
                                  <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                      setStartDate(e.target.value)
                                    }
                                  />
                                </div>
                                <div>
                                  <span>To: </span>
                                  <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                  }}
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {/* Rates List */}
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
                                    padding: 'var(--8px-V)',
                                    borderBottom: 'var(--1px-V) solid #eee',
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
                                      color:
                                        difference > 0
                                          ? 'green'
                                          : difference < 0
                                          ? 'red'
                                          : 'inherit',
                                    }}
                                  >
                                    {rate.rates} ETB {differenceText}
                                  </span>
                                </div>
                              );
                            })}

                            {/* Pagination */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 'var(--10px-V)',
                                marginTop: 'var(--10px-V)',
                              }}
                            >
                              <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                First
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                              <span>
                                Page {currentPage} of {totalPages || 1}
                              </span>
                              <button
                                onClick={() =>
                                  setCurrentPage((p) =>
                                    Math.min(totalPages, p + 1)
                                  )
                                }
                                disabled={currentPage >= totalPages}
                              >
                                Next
                              </button>
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage >= totalPages}
                              >
                                Last
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>Please connect to internet to see exchange rates</div>
                  )}
                </div>
              </div>
              <div className="settings-container">
                {' '}
                <h2 style={{ fontSize: 'var(--25px-V)' }}>Formating numbers</h2>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  Make long numbers like 100,000, 1,000,000 or 10,000,000 to
                  100k, 1M or 10M:{' '}
                  <input
                    id="abbreviate-numbers-checkbox"
                    type="checkbox"
                    name=""
                    checked={storageManager.get('abbreiviateBigNumbers')}
                    onChange={(e) => {
                      storageManager.set(
                        'abbreiviateBigNumbers',
                        e.target.checked
                      );
                      if (e.target.checked) {
                        storageManager.set('abbreviationDecimals', 2);
                      }
                      setRefresh(refresh + 1);
                    }}
                  />
                  <br />
                  Number of decimal places to show:{' '}
                  <input
                    id="decimal-places-input"
                    type="number"
                    min="0"
                    max="4"
                    style={{ width: 'var(--60px-V)' }}
                    value={storageManager.get('abbreviationDecimals')}
                    onChange={(e) => {
                      storageManager.set(
                        'abbreviationDecimals',
                        parseInt(e.target.value)
                      );
                      setRefresh(refresh + 1);
                    }}
                  />
                  <br />
                </div>
              </div>
              <div className="settings-container">
                <h2
                  style={{
                    fontSize: 'var(--25px-V)',
                    display: 'flex',
                    gap: 'var(--10px-V)',
                  }}
                >
                  Email Settings{' '}
                  {hasChanges && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--10px-V)',
                      }}
                    >
                      <button
                        style={{
                          backgroundColor: 'var(--Primary-Color)',
                          color: 'var(--Text-Color-Reverse)',
                        }}
                        onClick={handleSaveEmailSettings}
                      >
                        Save
                      </button>
                      <button onClick={handleCancel}>Cancel</button>
                    </div>
                  )}
                </h2>
                {isOnline ? (
                  <>
                    {' '}
                    <div style={{ marginLeft: 'var(--20px-V)' }}>
                      {loading ? (
                        <img
                          src={loadingGif}
                          alt="Loading..."
                          style={{
                            width: 'var(--20px-V)',
                            height: 'var(--20px-V)',
                          }}
                        />
                      ) : (
                        <>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              marginTop: 'var(--15px-V)',
                            }}
                          >
                            Representative Emails:{' '}
                            <div
                              style={{
                                width: 'var(--150px-V)',
                                paddingLeft: 'var(--5px-V)',

                                display: 'flex',
                                flexDirection: 'column',
                                flexWrap: 'wrap',
                                gap: 'var(--5px-V)',
                              }}
                              id="representativeEmails"
                            >
                              {representativeEmails.split(',').map(
                                (email, index) =>
                                  email.trim() && (
                                    <div
                                      key={index}
                                      style={{
                                        backgroundColor:
                                          'var(--Secondary-Color30)',
                                        justifyContent: 'space-between',
                                        padding: 'var(--4px-V) var(--8px-V)',
                                        borderRadius: 'var(--5px-V)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--15px-V)',
                                      }}
                                    >
                                      <span>{email.trim()}</span>
                                      <button
                                        onClick={() => {
                                          const emails =
                                            representativeEmails.split(',');
                                          emails.splice(index, 1);
                                          setRepresentativeEmails(
                                            emails.join(',')
                                          );
                                        }}
                                        style={{
                                          border: 'none',

                                          cursor: 'pointer',
                                          padding: '0 4px',
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )
                              )}
                              <input
                                type="text"
                                placeholder="Enter email and press Space, Enter or Comma"
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  height: 'var(--25px-V)',
                                }}
                                onKeyDown={(e) => {
                                  if (['Enter', ' ', ','].includes(e.key)) {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value) {
                                      const emails = representativeEmails
                                        ? representativeEmails.split(',')
                                        : [];
                                      emails.push(value);
                                      setRepresentativeEmails(emails.join(','));
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              alignItems: 'flex-start',
                              marginTop: 'var(--15px-V)',
                            }}
                          >
                            Representative Phone Numbers:{' '}
                            <div
                              style={{
                                width: 'var(--150px-V)',
                                paddingLeft: 'var(--5px-V)',

                                display: 'flex',
                                flexDirection: 'column',
                                flexWrap: 'wrap',
                                gap: 'var(--5px-V)',
                              }}
                              id="representativePhoneNumbers"
                            >
                              {representativePhoneNumbers.split(',').map(
                                (phone, index) =>
                                  phone.trim() && (
                                    <div
                                      key={index}
                                      style={{
                                        backgroundColor:
                                          'var(--Secondary-Color30)',
                                        justifyContent: 'space-between',
                                        padding: 'var(--4px-V) var(--8px-V)',
                                        borderRadius: 'var(--5px-V)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 'var(--4px-V)',
                                      }}
                                    >
                                      <span>{phone.trim()}</span>
                                      <button
                                        onClick={() => {
                                          const phones =
                                            representativePhoneNumbers.split(
                                              ','
                                            );
                                          phones.splice(index, 1);
                                          setRepresentativePhoneNumbers(
                                            phones.join(',')
                                          );
                                        }}
                                        style={{
                                          border: 'none',

                                          cursor: 'pointer',
                                          padding: '0 var(--4px-V)',
                                        }}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  )
                              )}
                              <input
                                type="text"
                                placeholder="Enter phone number and press Space, Enter or Comma"
                                style={{
                                  border: 'none',
                                  outline: 'none',
                                  height: 'var(--25px-V)',
                                }}
                                onKeyDown={(e) => {
                                  if (['Enter', ' ', ','].includes(e.key)) {
                                    e.preventDefault();
                                    const value = e.currentTarget.value.trim();
                                    if (value && value.length >= 10) {
                                      const phones = representativePhoneNumbers
                                        ? representativePhoneNumbers.split(',')
                                        : [];
                                      phones.push(value);
                                      setRepresentativePhoneNumbers(
                                        phones.join(',')
                                      );
                                      e.currentTarget.value = '';
                                    }
                                  }
                                }}
                              />
                              {document.activeElement?.tagName === 'INPUT' &&
                                document.activeElement.value.trim() &&
                                document.activeElement.value.trim().length <
                                  10 && (
                                  <p
                                    style={{
                                      fontSize: 'var(--13px-V)',
                                      color: 'var(--Text-Color-Grey)',
                                      marginBottom: 'var(--10px-V)',
                                    }}
                                  >
                                    Phone numbers must be at least 10 digits
                                  </p>
                                )}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--10px-V)',
                              marginTop: 'var(--15px-V)',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 'var(--10px-V)',
                              }}
                            >
                              <label>Landlord Display Name:</label>
                              <input
                                type="text"
                                value={landlordDisplayName}
                                onChange={(e) =>
                                  setLandlordDisplayName(e.target.value)
                                }
                                placeholder="Name shown in emails"
                                style={{ width: 'var(--300px-V)' }}
                                id="landlordDisplayName"
                              />
                              :{' '}
                              <span style={{ color: 'var(--Text-Color-Grey)' }}>
                                The name that is visible in emails and sms sent
                                to the tenant
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 'var(--10px-V)',
                              }}
                            >
                              <label>Landlord Email:</label>
                              <input
                                type="email"
                                value={landlordEmail}
                                onChange={(e) =>
                                  setLandlordEmail(e.target.value)
                                }
                                placeholder="Email address shown in emails"
                                style={{ width: 'var(--300px-V)' }}
                                id="landlordEmail"
                              />
                              :{' '}
                              <span style={{ color: 'var(--Text-Color-Grey)' }}>
                                The email address that is visible in emails and
                                sms sent to the tenant
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 'var(--10px-V)',
                              }}
                            >
                              <label>Landlord Telephone:</label>
                              <input
                                type="tel"
                                value={landlordTelephone}
                                onChange={(e) =>
                                  setLandlordTelephone(e.target.value)
                                }
                                placeholder="Phone number shown in emails"
                                style={{ width: 'var(--300px-V)' }}
                                id="landlordTelephone"
                              />
                              :{' '}
                              <span style={{ color: 'var(--Text-Color-Grey)' }}>
                                The phone number that is visible in emails and
                                sms sent to the tenant
                              </span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ marginLeft: 'var(--20px-V)' }}>
                    Please connect to internet to cahnge these settings
                  </div>
                )}
              </div>
            </div>
          )}
          {ToolsSelectedPage === 'Support' && (
            <div className="settings-main-container">
              <h1>Support</h1>
              <div className="settings-container">
                <h2 style={{ fontSize: 'var(--25px-V)' }}>Contact</h2>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--10px-V)',
                      alignItems: 'center',
                    }}
                  >
                    <span>Phone Number:</span>
                    <span>094450-9999</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--10px-V)',
                      alignItems: 'center',
                    }}
                  >
                    <span>Email:</span>
                    <span>rentmaster.et@gmail.com</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--10px-V)',
                      alignItems: 'center',
                    }}
                  >
                    <span>Telegram:</span>
                    <span>@Rent_Master</span>
                  </div>
                </div>
              </div>
              <div className="settings-container">
                <h2 style={{ fontSize: 'var(--25px-V)' }}>Feedback</h2>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      marginLeft: 'var(--20px-V)',
                      width: 'var(--300px-V)',
                      flexDirection: 'column',
                      gap: 'var(--10px-V)',
                      display: 'flex',
                    }}
                  >
                    <label>Leave a review</label>
                    <textarea
                      value={reviewForm}
                      onChange={(e) => setReviewForm(e.target.value)}
                      id="review"
                      name="review"
                      placeholder="Tell us what you think about RentMaster..."
                      style={{ height: 'var(--100px-V)', resize: 'vertical' }}
                    ></textarea>
                    <button onClick={handleSubmit}>
                      {isSendingReview ? (
                        <>
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: 'var(--20px-V)',
                              height: 'var(--20px-V)',
                            }}
                          />
                          Sending...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                  <div
                    style={{
                      marginLeft: 'var(--20px-V)',
                      width: 'var(--300px-V)',
                      flexDirection: 'column',
                      gap: 'var(--10px-V)',
                      display: 'flex',
                    }}
                  >
                    <label>Suggest a feature</label>
                    <textarea
                      value={featureSuggestion}
                      onChange={(e) => setFeatureSuggestion(e.target.value)}
                      id="featureSuggestion"
                      name="featureSuggestion"
                      placeholder="Tell us what features you would like to see in RentMaster..."
                      style={{ height: 'var(--100px-V)', resize: 'vertical' }}
                    ></textarea>
                    <button onClick={handleSubmitFeatureSuggestion}>
                      {isSendingFeatureSuggestion ? (
                        <>
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: 'var(--20px-V)',
                              height: 'var(--20px-V)',
                            }}
                          />
                          Sending...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {' '}
          {ToolsSelectedPage === 'Settings' && (
            <div className="settings-main-container">
              <div
                style={{
                  display: 'flex',
                  alignItems: isMobileState ? 'flex-start' : 'center',
                  paddingLeft: isMobileState ? 'var(--20px-V)' : '0',
                  justifyContent: 'space-between',
                  flexDirection: isMobileState ? 'column' : 'row',
                }}
              >
                <h1>Settings</h1>{' '}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--10px-V)',
                  }}
                >
                  {storageManager.get('users')?.[0]?.email || ""} -{' '}
                  {storageManager.get('users')?.[0]?.companyName || ""}
                  <button onClick={handleSignOut}>Sign Out</button>{' '}
                </div>
              </div>

              <div className="settings-container">
                <h2>Currency Settings</h2>

                {/* Default Currency Selection */}

                {/* Exchange Rate Section */}
                <div className="settings-inner-container">
                  <div>
                    <label style={{ fontWeight: 500 }}>
                      Default Currency:{' '}
                    </label>
                    <select
                      id="default-currency-select"
                      onChange={(e) => {
                        storageManager.set('defaultCurrency', e.target.value);
                        setRefresh(refresh + 1);
                      }}
                      value={GetDefaultCurrency()}
                    >
                      {GetCurrencyAsOptionsOnSelect()}
                    </select>
                  </div>
                  {isOnline ? (
                    <div>
                      {/* Current Exchange Rate */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 'var(--10px-V)',
                        }}
                      >
                        <span>Current Exchange Rate:</span>
                        <button
                          id="update-exchange-rate-button"
                          onClick={updateExchangeRates}
                        >
                          Update Now
                        </button>
                        <p style={{ fontSize: 'var(--13px-V)' }}>
                          Last Updated:{' '}
                          {storageManager.get('lastExchangeRateUpdate')
                            ? new Date(
                                storageManager.get('lastExchangeRateUpdate')
                              ).toDateString()
                            : 'Not updated yet'}
                          <br />
                          Rate:{' '}
                          {GetDefaultCurrency() === 'USD'
                            ? (
                                1 /
                                storageManager.get('exchangeRate')[
                                  storageManager.get('exchangeRate').length - 1
                                ].rates
                              ).toFixed(5)
                            : storageManager
                                .get('exchangeRate')
                                [
                                  storageManager.get('exchangeRate').length - 1
                                ].rates.toFixed(5)}
                          {CurrencySign(GetDefaultCurrency())}
                        </p>
                      </div>

                      {/* Check Historical Rate */}
                      <div style={{ marginBottom: 'var(--15px-V)' }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--10px-V)',
                          }}
                        >
                          <span>Check Historical Rate: </span>
                          <input
                            id="historical-rate-date-input"
                            type="date"
                            onChange={(e) => {
                              const selectedDate =
                                new Date(e.target.value).getTime() / 1000;
                              if (
                                selectedDate <
                                new Date('2015-01-01').getTime() / 1000
                              ) {
                                showAlert('Please select a date after 2015');
                                return;
                              }
                              setGetExchangeRateDate(selectedDate);
                            }}
                          />
                          <button onClick={() => fetchExchangeRateOfThatDate()}>
                            Get Rate
                          </button>
                        </div>
                        {GetExchangeRate !== 0 && (
                          <div style={{ marginTop: 'var(--5px-V)' }}>
                            Rate on{' '}
                            {new Date(
                              GetExchangeRateDate * 1000
                            ).toDateString()}
                            : {GetExchangeRate}
                          </div>
                        )}
                      </div>

                      {/* Recent Rates Section */}
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--10px-V)',
                            marginBottom: 'var(--10px-V)',
                          }}
                        >
                          <h3 style={{ margin: 0 }}>Recent Exchange Rates</h3>
                          <button
                            id="show-recent-rates-button"
                            onClick={() => setShowRecentRates(!showRecentRates)}
                          >
                            {showRecentRates ? 'Hide' : 'Show'}
                          </button>
                        </div>

                        {showRecentRates && (
                          <div
                            style={{
                              backgroundColor: 'var(--Secondary-Color60)',
                              padding: 'var(--10px-V)',
                              borderRadius: 'var(--5px-V)',
                            }}
                          >
                            {/* Date Range Selection */}
                            <div style={{ marginBottom: 'var(--10px-V)' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 'var(--10px-V)',
                                  alignItems: 'center',
                                }}
                              >
                                <div>
                                  <span>From: </span>
                                  <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                      setStartDate(e.target.value)
                                    }
                                  />
                                </div>
                                <div>
                                  <span>To: </span>
                                  <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                  />
                                </div>
                                <button
                                  onClick={() => {
                                    setStartDate('');
                                    setEndDate('');
                                  }}
                                >
                                  Clear
                                </button>
                              </div>
                            </div>

                            {/* Rates List */}
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
                                    padding: 'var(--8px-V)',
                                    borderBottom: 'var(--1px-V) solid #eee',
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
                                      color:
                                        difference > 0
                                          ? 'green'
                                          : difference < 0
                                          ? 'red'
                                          : 'inherit',
                                    }}
                                  >
                                    {rate.rates} ETB {differenceText}
                                  </span>
                                </div>
                              );
                            })}

                            {/* Pagination */}
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'center',
                                gap: 'var(--10px-V)',
                                marginTop: 'var(--10px-V)',
                              }}
                            >
                              <button
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                              >
                                First
                              </button>
                              <button
                                onClick={() =>
                                  setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                              >
                                Previous
                              </button>
                              <span>
                                Page {currentPage} of {totalPages || 1}
                              </span>
                              <button
                                onClick={() =>
                                  setCurrentPage((p) =>
                                    Math.min(totalPages, p + 1)
                                  )
                                }
                                disabled={currentPage >= totalPages}
                              >
                                Next
                              </button>
                              <button
                                onClick={() => setCurrentPage(totalPages)}
                                disabled={currentPage >= totalPages}
                              >
                                Last
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>Please connect to internet to see exchange rates</div>
                  )}
                </div>
              </div>
              <div className="settings-container">
                {' '}
                <h2 style={{ fontSize: 'var(--25px-V)' }}>Formating numbers</h2>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  Make long numbers like 100,000, 1,000,000 or 10,000,000 to
                  100k, 1M or 10M:{' '}
                  <input
                    id="abbreviate-numbers-checkbox"
                    type="checkbox"
                    name=""
                    checked={storageManager.get('abbreiviateBigNumbers')}
                    onChange={(e) => {
                      storageManager.set(
                        'abbreiviateBigNumbers',
                        e.target.checked
                      );
                      if (e.target.checked) {
                        storageManager.set('abbreviationDecimals', 2);
                      }
                      setRefresh(refresh + 1);
                    }}
                  />
                  <br />
                  Number of decimal places to show:{' '}
                  <input
                    id="decimal-places-input"
                    type="number"
                    min="0"
                    max="4"
                    style={{ width: 'var(--60px-V)' }}
                    value={storageManager.get('abbreviationDecimals')}
                    onChange={(e) => {
                      storageManager.set(
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
          {ToolsSelectedPage === 'Support' && (
            <div className="settings-main-container">
              <h1>Support</h1>
              <div className="settings-container">
                <h2 style={{ fontSize: 'var(--25px-V)' }}>Contact</h2>
                <div style={{ marginLeft: 'var(--20px-V)' }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--10px-V)',
                      alignItems: 'center',
                    }}
                  >
                    <span>Phone Number:</span>
                    <span>094450-9999</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--10px-V)',
                      alignItems: 'center',
                    }}
                  >
                    <span>Email:</span>
                    <span>rentmaster.et@gmail.com</span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      gap: 'var(--10px-V)',
                      alignItems: 'center',
                    }}
                  >
                    <span>Telegram:</span>
                    <span>@Rent_Master</span>
                  </div>
                </div>
              </div>
              <div className="settings-container">
                <h2 style={{ fontSize: 'var(--25px-V)' }}>Feedback</h2>
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div
                    style={{
                      marginLeft: 'var(--20px-V)',
                      width: 'var(--300px-V)',
                      flexDirection: 'column',
                      gap: 'var(--10px-V)',
                      display: 'flex',
                    }}
                  >
                    <label>Leave a review</label>
                    <textarea
                      value={reviewForm}
                      onChange={(e) => setReviewForm(e.target.value)}
                      id="review"
                      name="review"
                      placeholder="Tell us what you think about RentMaster..."
                      style={{ height: 'var(--100px-V)', resize: 'vertical' }}
                    ></textarea>
                    <button onClick={handleSubmit}>
                      {isSendingReview ? (
                        <>
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: 'var(--20px-V)',
                              height: 'var(--20px-V)',
                            }}
                          />
                          Sending...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                  <div
                    style={{
                      marginLeft: 'var(--20px-V)',
                      width: 'var(--300px-V)',
                      flexDirection: 'column',
                      gap: 'var(--10px-V)',
                      display: 'flex',
                    }}
                  >
                    <label>Suggest a feature</label>
                    <textarea
                      value={featureSuggestion}
                      onChange={(e) => setFeatureSuggestion(e.target.value)}
                      id="featureSuggestion"
                      name="featureSuggestion"
                      placeholder="Tell us what features you would like to see in RentMaster..."
                      style={{ height: 'var(--100px-V)', resize: 'vertical' }}
                    ></textarea>
                    <button onClick={handleSubmitFeatureSuggestion}>
                      {isSendingFeatureSuggestion ? (
                        <>
                          <img
                            src={loadingGif}
                            alt="Loading..."
                            style={{
                              width: 'var(--20px-V)',
                              height: 'var(--20px-V)',
                            }}
                          />
                          Sending...
                        </>
                      ) : (
                        'Submit'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default React.memo(ToolsPage);
