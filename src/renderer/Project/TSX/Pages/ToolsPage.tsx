import {
  addValue,
  getValuesWithSql,
  updateValue,
  deleteValue,
} from 'Backend/localServerApis';
import React, { useEffect, useState, useRef } from 'react';
import '../../CSS/ToolsPage.css';
import {
  addValueOnline,
  getValuesWithSql_Online,
} from 'Backend/OnlineServerApis';
import EmailTemplates from '../Tools page components/EmailTemplates';
import SMSTemplates from '../Tools page components/SMSTemplates';
const { v4: uuidv4 } = require('uuid');
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface SMSTemplate {
  id: string;
  name: string;
  body: string;
}

interface Expense {
  id: string;
  name: string;
  description: string;
  price: number;
  date: number;
  userId: string;
  fullBuilding: boolean;
  roomId: string;
  doesRecur: boolean;
  recurringCycle: string;
}

const ToolsPage = ({
  setToolsSelectedPage,
  ToolsSelectedPage,
  setChangeMade,
  SelectedUserId,
}: any) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSMSTemplates] = useState<SMSTemplate[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [editedTemplate, setEditedTemplate] = useState<
    EmailTemplate | SMSTemplate | null
  >(null);
  const [originalTemplate, setOriginalTemplate] = useState<
    EmailTemplate | SMSTemplate | null
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

  useEffect(() => {
    if (ToolsSelectedPage === 'EmailTemplates') {
      const getEmailTemplates = async () => {
        const templates = await getValuesWithSql('email_templates', 'WHERE 1');
        setEmailTemplates(templates);
      };
      getEmailTemplates();
    } else if (ToolsSelectedPage === 'SMSTemplates') {
      const getSMSTemplates = async () => {
        const templates = await getValuesWithSql('sms_templates', 'WHERE 1');
        setSMSTemplates(templates);
      };
      getSMSTemplates();
    } else if (ToolsSelectedPage === 'Expense Manager') {
      const getExpenses = async () => {
        const expenses = await getValuesWithSql('expenses', 'WHERE 1');
        setExpenses(expenses);
      };
      getExpenses();
    }
  }, [ToolsSelectedPage]);

  const ChangeEmailTemplateValues = async (
    id: string,
    name: string,
    subject: string,
    body: string
  ) => {
    const updatedTemplates = emailTemplates.map((template) =>
      template.id === id ? { ...template, name, subject, body } : template
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
          editedTemplate.body
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
        return acc;
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

  const handleSendEmail = async () => {
    if (navigator.onLine) {
      const template = emailTemplates.find((t) => t.id === tryOutMode);
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
            templateId: template.id,
          });

          window.electron.ipcRenderer.once(
            'SendCustomEmailResponse',
            (response) => {
              if (response.success) {
                console.log('Email sent successfully');

                setEmailSentSuccess(true);
              } else {
                console.error('Failed to send email:', response.error);
                setEmailSentSuccess(false);
              }
            }
          );
        }
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
    const newExpense: Expense = {
      id: uuidv4(),
      name: 'New Expense',
      description: 'New Expense Description',
      price: 0,
      date: Date.now(),
      userId: SelectedUserId,
      fullBuilding: false,
      roomId: '',
      doesRecur: false,
      recurringCycle: '',
    };
    await addValue(
      'expenses',
      {
        id: newExpense.id,
        name: newExpense.name,
        description: newExpense.description,
        price: newExpense.price,
        date: newExpense.date,
        userId: newExpense.userId,
        fullBuilding: newExpense.fullBuilding,
        roomId: newExpense.roomId,
        doesRecur: newExpense.doesRecur,
        recurringCycle: newExpense.recurringCycle,
      },
      setChangeMade
    );
    setExpenses([...expenses, newExpense]);
  };

  const handleEditExpense = async (
    id: string,
    name: string,
    description: string,
    price: number,
    fullBuilding: boolean,
    roomId: string,
    doesRecur: boolean,
    recurringCycle: string,
    date: number
  ) => {
    const updatedExpenses = expenses.map((expense) =>
      expense.id === id
        ? {
            ...expense,
            name,
            description,
            price,
            fullBuilding,
            roomId,
            doesRecur,
            recurringCycle,
            date,
          }
        : expense
    );
    setExpenses(updatedExpenses);

    await updateValue(
      'expenses',
      id,
      'name',
      name,
      setChangeMade,
      originalTemplate?.name
    );
    await updateValue(
      'expenses',
      id,
      'description',
      description,
      setChangeMade,
      originalTemplate?.description
    );
    await updateValue(
      'expenses',
      id,
      'price',
      price,
      setChangeMade,
      originalTemplate?.price
    );
    await updateValue(
      'expenses',
      id,
      'fullBuilding',
      fullBuilding,
      setChangeMade,
      originalTemplate?.fullBuilding
    );
    await updateValue(
      'expenses',
      id,
      'roomId',
      roomId,
      setChangeMade,
      originalTemplate?.roomId
    );
    await updateValue(
      'expenses',
      id,
      'doesRecur',
      doesRecur,
      setChangeMade,
      originalTemplate?.doesRecur
    );
    await updateValue(
      'expenses',
      id,
      'recurringCycle',
      recurringCycle,
      setChangeMade,
      originalTemplate?.recurringCycle
    );
    await updateValue(
      'expenses',
      id,
      'date',
      date,
      setChangeMade,
      originalTemplate?.date
    );
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteValue('expenses', id, setChangeMade);
    setExpenses(expenses.filter((expense) => expense.id !== id));
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'name' | 'price' | 'date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const filteredExpenses = expenses
    .filter((expense) =>
      expense.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
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
    a();
  }, []);

  return (
    <>
      <></>

      {ToolsSelectedPage === 'EmailTemplates' && (
        <EmailTemplates
          emailTemplates={emailTemplates}
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
          setSelectedInput={setSelectedInput}
        />
      )}

      {ToolsSelectedPage === 'SMSTemplates' && (
        <SMSTemplates
          smsTemplates={smsTemplates}
          openTemplateId={openTemplateId}
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
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              width: '100%',
              height: '100%',
            }}
          >
            <h2>Expense Manager</h2>
            <button onClick={handleAddExpense}>Add Expense</button>
          </div>
          <div>
            <input
              type="text"
              placeholder="Search expenses"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as 'name' | 'price' | 'date')}
            >
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="date">Date</option>
            </select>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
          <div className="expense-cards">
            {filteredExpenses.map((expense) => (
              <div key={expense.id} className="expense-card">
                <h3>{expense.name}</h3>
                <p>{expense.description}</p>
                <p>Price: ${expense.price}</p>
                <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
                <button onClick={() => handleEditExpense(expense.id, expense.name, expense.description, expense.price)}>Edit</button>
                <button onClick={() => handleDeleteExpense(expense.id)}>Delete</button>
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
};

export default React.memo(ToolsPage);
