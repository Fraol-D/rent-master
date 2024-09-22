import {
  addValue,
  getValuesWithSql,
  updateValue,
} from 'Backend/localServerApis';
import React, { useEffect, useState, useRef } from 'react';
import '../../CSS/ToolsPage.css';
const { v4: uuidv4 } = require('uuid');
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

const ToolsPage = ({
  setToolsSelectedPage,
  ToolsSelectedPage,
  setChangeMade,
  SelectedUserId,
}: any) => {
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(
    null
  );
  const [editedTemplate, setEditedTemplate] = useState<EmailTemplate | null>(
    null
  );
  const [originalTemplate, setOriginalTemplate] =
    useState<EmailTemplate | null>(null);
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

  const startEditing = (template: EmailTemplate) => {
    setEditingTemplateId(template.id);
    setEditedTemplate({ ...template });
    setOriginalTemplate({ ...template });
  };

  const cancelEditing = () => {
    setEditingTemplateId(null);
    setEditedTemplate(null);
  };

  const handleEditChange = (field: keyof EmailTemplate, value: string) => {
    if (editedTemplate) {
      setEditedTemplate({ ...editedTemplate, [field]: value });
    }
  };

  const saveChanges = () => {
    if (editedTemplate) {
      ChangeEmailTemplateValues(
        editedTemplate.id,
        editedTemplate.name,
        editedTemplate.subject,
        editedTemplate.body
      );
    }
  };

  const handleTryOut = (templateId: string) => {
    setTryOutMode(templateId);
    const template = emailTemplates.find((t) => t.id === templateId);
    if (template) {
      const usedVariables = [
        ...new Set([
          ...extractVariables(template.subject),
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

  const handleSendEmail = () => {
    const template = emailTemplates.find((t) => t.id === tryOutMode);
    if (template) {
      const subject = replaceVariables(template.subject);
      const body = replaceVariables(template.body);
      if (navigator.onLine) {
        window.electron.ipcRenderer.send('SendCustomEmail', {
          to: recipientEmail,
          subject: subject,
          body: body,
        });

        window.electron.ipcRenderer.once(
          'SendCustomEmailResponse',
          (response) => {
            if (response.success) {
              console.log('Email sent successfully');
            } else {
              console.error('Failed to send email:', response.error);
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
  return (
    <div className="tools-page">
      {ToolsSelectedPage === 'EmailTemplates' && (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {' '}
            <h2>Your Email Templates</h2>
            <button
              onClick={() => {
                handleAddEmailTemplate();
              }}
            >
              Add a email template
            </button>
          </div>
          {emailTemplates.map((template) => (
            <div
              key={template.id}
              className="email-template-container"
              style={{
                minHeight: openTemplateId === template.id ? '181px' : '',
              }}
            >
              <div
                className="email-template-header"
                style={{
                  padding: editingTemplateId === template.id ? '10px' : '15px',
                }}
              >
                {editingTemplateId === template.id ? (
                  <input
                    value={editedTemplate?.name || ''}
                    onChange={(e) => handleEditChange('name', e.target.value)}
                  />
                ) : (
                  <h3>{template.name}</h3>
                )}
                <div className="email-template-buttons">
                  <button onClick={() => toggleTemplate(template.id)}>
                    {openTemplateId === template.id ? 'Close' : 'Open'}
                  </button>
                  {editingTemplateId === template.id ? (
                    <>
                      <button onClick={saveChanges}>Save</button>
                      <button onClick={cancelEditing}>Cancel</button>
                    </>
                  ) : (
                    <button onClick={() => startEditing(template)}>Edit</button>
                  )}
                </div>
              </div>
              {openTemplateId === template.id && (
                <div className="email-template-content">
                  <div className="email-template-body">
                    <h4
                      style={{
                        margin: editingTemplateId === template.id ? '0px,' : '',
                        marginTop:
                          editingTemplateId === template.id ? '12px' : '',
                        marginBottom:
                          editingTemplateId === template.id ? '14px' : '',
                        width: editingTemplateId === template.id ? '100%' : '',
                        fontSize: '20px',
                      }}
                    >
                      {editingTemplateId === template.id ? (
                        <>
                          Subject:
                          <input
                            ref={subjectInputRef}
                            value={editedTemplate?.subject || ''}
                            onChange={(e) =>
                              handleEditChange('subject', e.target.value)
                            }
                            onFocus={() => setSelectedInput('subject')}
                          />
                        </>
                      ) : (
                        <p>Subject:{formatEmailBody(template.subject)}</p>
                      )}
                    </h4>
                    {editingTemplateId === template.id ? (
                      <textarea
                        ref={bodyTextareaRef}
                        value={editedTemplate?.body || ''}
                        onChange={(e) =>
                          handleEditChange('body', e.target.value)
                        }
                        onFocus={() => setSelectedInput('body')}
                      />
                    ) : (
                      <p>{formatEmailBody(template.body)}</p>
                    )}
                  </div>
                  <div className="email-template-variables">
                    <h4>
                      {editingTemplateId === template.id
                        ? 'Variables:'
                        : 'Variables Used:'}
                    </h4>
                    {editingTemplateId === template.id ? (
                      <div className="variable-buttons">
                        {variables.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => insertVariable(variable)}
                          >
                            {variable}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          height: '89%',
                          justifyContent: 'space-between',
                        }}
                      >
                        <ul>
                          {extractVariables(template.body).map(
                            (variable, index) => (
                              <li key={index}>
                                {variable
                                  .replaceAll('{', '')
                                  .replaceAll('}', '')}
                              </li>
                            )
                          )}
                        </ul>
                        <button onClick={() => handleTryOut(template.id)}>
                          Send / Try Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              {tryOutMode === template.id && (
                <>
                  <div
                    className="try-out-container-Opacity"
                    onClick={() => setTryOutMode(null)}
                  ></div>{' '}
                  <div className="try-out-container">
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <h2>Send / Try Out</h2>{' '}
                      <button onClick={() => setTryOutMode(null)}>
                        Close Try Out
                      </button>
                    </div>
                    <div className="try-out-preview">
                      <h3>
                        Subject:{' '}
                        {formatEmailBody(replaceVariables(template.subject))}
                      </h3>
                      <p>{formatEmailBody(replaceVariables(template.body))}</p>
                    </div>
                    <hr />
                    <h3>Fill in to see email preview above </h3>
                    <div className="try-out-inputs">
                      {Object.keys(variableValues).map((variable) => (
                        <div key={variable} className="variable-input">
                          <label>{variable}:</label>
                          <input
                            type="text"
                            value={variableValues[variable]}
                            className="try-out-container-input"
                            onChange={(e) =>
                              handleVariableValueChange(
                                variable,
                                e.target.value
                              )
                            }
                          />
                        </div>
                      ))}
                    </div>{' '}
                    <hr />
                    <h3>Send Email</h3>
                    <p>
                      You will now send the above email to the email address
                      specified below
                    </p>
                    <input
                      type="text"
                      placeholder="Enter Email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                    <button onClick={handleSendEmail}>Send</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default ToolsPage;
