import { storageManager } from '../../../storeManager';
import React, { useEffect, useState } from 'react';
import { Input } from '../Helpers/CustomReactComponents';
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import {
  getValuesWithSql_Online,
  updateValueOnline,
} from 'Backend/OnlineServerApis';
import { useAlert } from 'renderer/components/useAlert';
import { useGlobal } from 'renderer/components/GlobalContext';

interface EmailTemplatesProps {
  emailTemplates: EmailTemplate[];
  handleReplaceWithDefault: () => void;
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
  emailSentSuccessstring: string;
  isSending: boolean;
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
  handleReplaceWithDefault,
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
  emailSentSuccessstring,
  isSending,
}) => {
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
    const fetchEmailSettings = async () => {
      if (navigator.onLine) {
        try {
          setLoading(true);
          const userId = await storageManager.get('users')[0].id;

          // Assuming there's an API call to get the values
          console.log('fetching email settings', userId);
          const user = (
            await getValuesWithSql_Online('users', `WHERE id = '${userId}'`)
          )[0];
          const RepresentativeEmailsONLINE = user.RepresentativeEmails;
          const RepresentativePhoneNumbersONLINE =
            user.RepresentativePhoneNumbers;
          const LandlordNamesONLINE = user.LandlordName;
          const LandlordEmailONLINE = user.LandlordEmail;
          const LandlordTelephoneONLINE = user.LandlordTelephone;
          console.log(
            'fetching email settings',
            RepresentativeEmailsONLINE,
            RepresentativePhoneNumbersONLINE,
            LandlordNamesONLINE,
            LandlordEmailONLINE,
            LandlordTelephoneONLINE
          );

          setRepresentativeEmails(RepresentativeEmailsONLINE);
          setRepresentativePhoneNumbers(RepresentativePhoneNumbersONLINE);
          setLandlordDisplayName(LandlordNamesONLINE);
          setLandlordEmail(LandlordEmailONLINE);
          setLandlordTelephone(LandlordTelephoneONLINE);

          setOriginalValues({
            representativeEmails: RepresentativeEmailsONLINE,
            representativePhoneNumbers: RepresentativePhoneNumbersONLINE,
            landlordDisplayName: LandlordNamesONLINE,
            landlordEmail: LandlordEmailONLINE,
            landlordTelephone: LandlordTelephoneONLINE,
          });
          setLoading(false);
        } catch (error) {
          console.error('Failed to fetch email settings:', error);
        }
      }
    };

    fetchEmailSettings();
  }, []);

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
const {isMobileState} = useGlobal();
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
  const { showAlert } = useAlert();
  return (
    <div className="tools-page">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h2>Your Email Templates</h2>{' '}
        <button
          onClick={() => {
            if (navigator.onLine) handleReplaceWithDefault();
            else showAlert('You are offline, cannot reset to default');
          }}
          style={{
            fontSize: 'var(--10px-V)',
            border: 'var(--1px-V) dashed red',
          }}
        >
          Reset to Default
        </button>
        <button onClick={handleAddEmailTemplate} id="add-email-template-button">Add an email template</button>
      </div>
      {emailTemplates
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((template) => (
          <div
            key={template.id}
            className="email-template-container"
            style={{
              minHeight: openTemplateId === template.id ? 'var(--181px-V)' : '',
            }}
          >
            <div
              className="email-template-header"
              style={{
                padding:
                  editingTemplateId === template.id
                    ? 'var(--10px-V)'
                    : 'var(--15px-V)',
              }}
            >
              {editingTemplateId === template.id ? (
                <input
                  value={editedTemplate?.name || ''}
                  style={{ width: '50%' }}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  id="email-template-name"
                />
              ) : (
                <h3>{template.name}</h3>
              )}
              <div className="email-template-buttons">
                <button onClick={() => toggleTemplate(template.id)} id="email-template-open-button">
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
                  <button onClick={() => startEditing(template)} id="email-template-edit-button">Edit</button>
                )}
              </div>
            </div>
            {openTemplateId === template.id && (
              <div className="email-template-content">
                <div className="email-template-body">
                  <h4
                    style={{
                      margin:
                        editingTemplateId === template.id
                          ? 'var(--0px-V),'
                          : '',
                      marginTop:
                        editingTemplateId === template.id
                          ? 'var(--12px-V)'
                          : '',
                      marginBottom:
                        editingTemplateId === template.id
                          ? 'var(--14px-V)'
                          : '',
                      width: editingTemplateId === template.id ? '100%' : '',
                      fontSize: 'var(--20px-V)',
                    }}
                  >
                    {editingTemplateId === template.id ? (
                      <>
                        Subject:
                        <input
                          ref={subjectInputRef}
                          value={
                            (editedTemplate as EmailTemplate)?.subject || ''
                          }
                          onChange={(e) =>
                            handleEditChange('subject', e.target.value)
                          }
                          onFocus={() => setSelectedInput('subject')}
                          id="email-template-subject"
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
                      id="email-template-body"
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
                    <><div className="variable-buttons" id="email-variables-list">
                      {variables.map((variable) => (
                        <button
                          key={variable}
                          onClick={() => insertVariable(variable)}
                        >
                          {variable}
                        </button>
                      ))}
                    </div><button onClick={() => handleTryOut(template.id)}style={{marginTop: 'var(--10px-V)'}} id="try-out-email">
                        Send / Try Out
                      </button></>
                  ) : (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        height: isMobileState ? '' : '89%',
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
                      <button onClick={() => handleTryOut(template.id)} id="try-out-email">
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
                <div className="try-out-container" style={{width: isMobileState ? '90%' : ''}}>
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
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    style={{ opacity: isSending ? 0.7 : 1 }}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                  {isSending && (
                    <img
                      src={loadingGif}
                      alt="Sending..."
                      style={{
                        width: 'var(--30px-V)',
                        height: 'var(--30px-V)',
                      }}
                    />
                  )}
                  {!isSending && emailSentSuccessstring && (
                    <span style={{ color: 'var(--Success-Color)' }}>
                      {emailSentSuccessstring}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      <p
        style={{
          fontFamily: 'Arial, sans-serif',
          fontSize: 'var(--16px-V)',
          lineHeight: '1.5',
          padding: 'var(--10px-V)',
          borderRadius: 'var(--5px-V)',
          boxShadow: '0 var(--2px-V) var(--4px-V) rgba(0,0,0,0.1)',
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
