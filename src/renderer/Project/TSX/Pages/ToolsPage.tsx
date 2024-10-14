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

const ToolsPage = ({
  setToolsSelectedPage,
  ToolsSelectedPage,
  setChangeMade,
  SelectedUserId,
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
    };
    setEditingExpenseId(newExpense.id);
    setEditedExpense(newExpense);
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
        doesReoccur: newExpense.doesReoccur,
        recurringCycle: newExpense.recurringCycle,
      },
      setChangeMade
    );
    setExpenses([...expenses, newExpense]);
  };
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [editedExpense, setEditedExpense] = useState<expenses | null>(null);

  const handleEditExpenseChange = (
    field: keyof expenses,
    value: string | number | boolean
  ) => {
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
        editedExpense.price,
        editedExpense.fullBuilding,
        editedExpense.floor,
        editedExpense.room,
        editedExpense.doesReoccur,
        editedExpense.recurringCycle,
        editedExpense.date
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
    floor: number,
    room: number,
    doesReoccur: boolean,
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
            floor,
            room,
            doesReoccur,
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
      'room',
      room,
      setChangeMade,
      originalTemplate?.room
    );
    await updateValue(
      'expenses',
      id,
      'floor',
      floor,
      setChangeMade,
      originalTemplate?.floor
    );
    await updateValue(
      'expenses',
      id,
      'doesReoccur',
      doesReoccur,
      setChangeMade,
      originalTemplate?.doesReoccur
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
    setEditingExpenseId(null);
    setEditedExpense(null);
    setExpenses(expenses.filter((expense) => expense.id !== id));
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            flexDirection: 'column',
            width: '100%',
            maxWidth: '1200px',
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
              maxWidth: '800px',
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
            <button onClick={handleAddExpense}>Add Expense</button>
          </div>
          <div
            style={{
              marginBottom: '20px',
              width: '90%',
              display: 'flex',
              gap: '10px',
            }}
          ></div>
          {showFilters && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginBottom: '20px',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', flex: '1' }}
              ></div>
            </div>
          )}

          <table className="expense-cards">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>
                 
                </th>
                <th style={{ width: '30%' }}>
                  {' '}
                  {showFilters && (
                    <input
                      type="text"
                      placeholder="Search expenses"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ padding: '5px', width: '60%' }}
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
                            e.target.value ? parseFloat(e.target.value) : ''
                          )
                        }
                        style={{ flex: '1', padding: '5px', width: '80px' }}
                      />
                      <input
                        type="number"
                        placeholder="Min Price"
                        value={minPrice}
                        onChange={(e) =>
                          setMinPrice(
                            e.target.value ? parseFloat(e.target.value) : ''
                          )
                        }
                        style={{ flex: '1', padding: '5px', width: '80px' }}
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
                        style={{ flex: '1', padding: '5px' }}
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
                        style={{ flex: '1', padding: '5px', width: '40px' }}
                      />{' '}
                      <input
                        type="text"
                        placeholder="Room"
                        value={roomSearch}
                        onChange={(e) => setRoomSearch(e.target.value)}
                        style={{ flex: '1', padding: '5px', width: '40px' }}
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
                        style={{ flex: '1', padding: '5px' }}
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
                        style={{ flex: '1', padding: '5px', width: '150px' }}
                      />
                    </>
                  )}
            
                </th>
                <th>
                  {showFilters && (
                    <div style={{ display: 'flex', flexDirection: 'row' }}>
                      <input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{ flex: '1', padding: '5px' }}
                      />
                      <button
                        onClick={() => setDateFilter('')}
                        style={{
                          padding: '5px',

                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: 'pointer',
                          marginLeft: '5px',
                        }}
                      >
                        X
                      </button>
                    </div>
                  )}
          
                </th>
                {editingExpenseId !== null && <th>Actions</th>}
              </tr>
              <tr>
                <th style={{ width: '5%' }}>No.</th>
                <th style={{ width: '30%' }}>Expense</th>
                <th style={{ width: '10%' }}>
                 Price
                </th>
                <th>
                  
                  Room
                </th>
                <th>
                 Reoccur
                </th>
                <th>
                
                  Date
                </th>
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
                    No expenses found with the current filters.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense, index) => (
                  <>
                    <tr key={expense.id} className="expense-card">
                      <td
                        style={{
                          borderRadius: '10px 0px 0px 10px',
                          textAlign: 'center',
                        }}
                      >
                        {index + 1}.
                        <button
                          className="email-template-buttons-button"
                          onClick={() => handleEditExpenseClick(expense)}
                        >
                          {editingExpenseId === expense.id ? 'Save' : 'Edit'}
                        </button>
                      </td>
                      <td>
                        {editingExpenseId === expense.id ? (
                          <textarea
                            value={editedExpense?.name || ''}
                            onChange={(e) =>
                              handleEditExpenseChange('name', e.target.value)
                            }
                            style={{
                              width: '95%',
                              padding: '5px',
                              border: '1px solid var(--Secondary-Color)',
                              backgroundColor: 'var(--Background-Color)',
                              color: 'var(--Text-Color)',
                              resize: 'vertical',
                              maxHeight: '100px',
                            }}
                          />
                        ) : (
                          expense.name
                        )}
                      </td>
                      <td style={{}}>
                        {editingExpenseId === expense.id ? (
                          <>
                            $
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
                          `$${expense.price.toLocaleString() || 0}`
                        )}
                      </td>
                      <td>
                        {editingExpenseId === expense.id ? (
                          <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                          >
                            <label>
                              Full building:
                              <input
                                type="checkbox"
                                checked={editedExpense?.fullBuilding || false}
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
                                      width: '35px',
                                      marginRight: '10px',
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
                                    style={{ width: '35px' }}
                                  />
                                </label>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            style={{ display: 'flex', flexDirection: 'column' }}
                          >
                            <div>
                              Full building:{' '}
                              <em>{expense.fullBuilding ? 'Yes' : 'No'}</em>
                            </div>
                            {!expense.fullBuilding && (
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                }}
                              >
                                {' '}
                                <div style={{ marginRight: '10px' }}>
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
                              checked={editedExpense?.doesReoccur || false}
                              name=""
                              id=""
                              onChange={(e) =>
                                handleEditExpenseChange(
                                  'doesReoccur',
                                  e.target.checked
                                )
                              }
                            />
                            {editedExpense?.doesReoccur && (
                              <div>
                                Every{' '}
                                <input
                                  type="text"
                                  value={editedExpense?.recurringCycle || ''}
                                  onChange={(e) =>
                                    handleEditExpenseChange(
                                      'recurringCycle',
                                      e.target.value
                                    )
                                  }
                                  style={{ width: '40px' }}
                                />{' '}
                                Day
                                {editedExpense?.recurringCycle !== 1 ? 's' : ''}
                              </div>
                            )}
                          </>
                        ) : expense.doesReoccur ? (
                          `Every ${expense.recurringCycle} Day${
                            expense.recurringCycle !== 1 ? 's' : ''
                          }`
                        ) : (
                          'One Time'
                        )}
                      </td>
                      <td
                        style={{
                          borderRadius:
                            editingExpenseId === expense.id
                              ? '0px 0px 0px 0px'
                              : '0px 10px 10px 0px',
                        }}
                      >
                        {editingExpenseId === expense.id ? (
                          <input
                            type="date"
                            value={
                              new Date(editedExpense?.date || Date.now())
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
                        ) : (
                          new Date(expense.date).toDateString()
                        )}
                      </td>
                      {editingExpenseId === expense.id && (
                        <td style={{ borderRadius: '0px 10px 10px 0px' }}>
                          <button
                            style={{
                              backgroundColor: 'red',
                              color: 'white',
                            }}
                            onClick={() => handleDeleteExpense(expense.id)}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                    <tr style={{ height: '10px' }}></tr>
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default React.memo(ToolsPage);
