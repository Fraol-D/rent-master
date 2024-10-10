import React from 'react';
interface SMSTemplate {
    id: string;
    name: string;
    body: string;
  }
interface SMSTemplatesProps {
  smsTemplates: SMSTemplate[];
  openTemplateId: string | null;
  editingTemplateId: string | null;
  editedTemplate: SMSTemplate | null;
  variables: string[];
  variableValues: Record<string, string>;
  recipientEmail: string;
  handleAddSMSTemplate: () => void;
  toggleTemplate: (id: string) => void;
  startEditing: (template: SMSTemplate) => void;
  saveChanges: () => void;
  cancelEditing: () => void;
  deleteSMSTemplate: (id: string) => void;
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
  handleSendSMS: () => void;
  bodyTextareaRef: React.RefObject<HTMLTextAreaElement>;
  setSelectedInput: (input: string) => void;
}

const SMSTemplates: React.FC<SMSTemplatesProps> = ({
  smsTemplates,
  openTemplateId,
  editingTemplateId,
  editedTemplate,
  variables,
  variableValues,
  recipientEmail,
  handleAddSMSTemplate,
  toggleTemplate,
  startEditing,
  saveChanges,
  cancelEditing,
  deleteSMSTemplate,
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
  handleSendSMS,
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
        <h2>Your SMS Templates (SMS sending is currently not available)</h2>
        <button onClick={handleAddSMSTemplate}>Add an SMS template</button>
      </div>
      {smsTemplates.map((template) => (
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
                  <button onClick={() => deleteSMSTemplate(template.id)}>
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
                  <p>{formatEmailBody(replaceVariables(template.body))}</p>
                </div>
                <hr />
                <h3>Fill in to see SMS preview above </h3>
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
                <h3>Send SMS</h3>
                <p>
                  You will now send the above SMS to the phone number specified
                  below
                </p>
                <input
                  type="text"
                  placeholder="Enter Phone Number"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
                <button onClick={handleSendSMS}>Send</button>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default SMSTemplates;
