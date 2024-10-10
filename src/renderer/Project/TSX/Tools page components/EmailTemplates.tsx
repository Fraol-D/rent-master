import React from 'react';
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailTemplatesProps {
  emailTemplates: EmailTemplate[];
  openTemplateId: string | null;
  editingTemplateId: string | null;
  editedTemplate: EmailTemplate | null;
  variables: string[];
  variableValues: Record<string, string>;
  recipientEmail: string;
  emailSendingwith: string;
  handleAddEmailTemplate: () => void;
  toggleTemplate: (id: string) => void;
  startEditing: (template: EmailTemplate) => void;
  saveChanges: () => void;
  cancelEditing: () => void;
  deleteEmailTemplate: (id: string) => void;
  handleEditChange: (field: string, value: string) => void;
  insertVariable: (variable: string) => void;
  extractVariables: (body: string) => string[];
  handleTryOut: (id: string) => void;
  tryOutMode: string | null;
  setTryOutMode: (id: string | null) => void;
  formatEmailBody: (body: string) => string;
  replaceVariables: (body: string) => string;
  handleVariableValueChange: (variable: string, value: string) => void;
  setRecipientEmail: (email: string) => void;
  handleSendEmail: () => void;
  subjectInputRef: React.RefObject<HTMLInputElement>;
  bodyTextareaRef: React.RefObject<HTMLTextAreaElement>;
  setSelectedInput: (input: string) => void;
}

const EmailTemplates: React.FC<EmailTemplatesProps> = ({
  emailTemplates,
  openTemplateId,
  editingTemplateId,
  editedTemplate,
  variables,
  variableValues,
  recipientEmail,
  emailSendingwith,
  handleAddEmailTemplate,
  toggleTemplate,
  startEditing,
  saveChanges,
  cancelEditing,
  deleteEmailTemplate,
  handleEditChange,
  insertVariable,
  extractVariables,
  handleTryOut,
  tryOutMode,
  setTryOutMode,
  formatEmailBody,
  replaceVariables,
  handleVariableValueChange,
  setRecipientEmail,
  handleSendEmail,
  subjectInputRef,
  bodyTextareaRef,
  setSelectedInput,
}) => {
  return (
    <div className="tools-page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Your Email Templates</h2>
        <button onClick={handleAddEmailTemplate}>Add an email template</button>
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
                  <button onClick={() => deleteEmailTemplate(template.id)}>
                    Delete
                  </button>
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
                    marginTop: editingTemplateId === template.id ? '12px' : '',
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
                        value={(editedTemplate as EmailTemplate)?.subject || ''}
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
                    onChange={(e) => handleEditChange('body', e.target.value)}
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
                            {variable.replaceAll('{', '').replaceAll('}', '')}
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
              ></div>
              <div className="try-out-container">
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h2>Send / Try Out</h2>
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
                          handleVariableValueChange(variable, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
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
      <p
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: '16px',
          lineHeight: '1.5',
          padding: '10px',
          borderRadius: '5px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        Sending emails with:{' '}
        <span style={{ fontWeight: 'bold', color: '#007bff' }}>
          {emailSendingwith}
        </span>
        . If you want to change, contact support.
      </p>
    </div>
  );
};

export default EmailTemplates;
