import { useEffect, useState } from 'react';
import {
  AddUserOnline,
  addValueOnline,
  getValuesWithSql_Online,
} from 'Backend/OnlineServerApis';
import '../../CSS/SignUpAndLogin.css';
import {
  addValue,
  addValueWithOutOfflineChange,
  deleteValue,
  getValuesWithSql,
} from 'Backend/localServerApis';
import { v4 as uuidv4 } from 'uuid';
import React from 'react';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
const SignupPage = ({
  setisSignUpMode,
  setisSignedIn,
  setChangeMade,
  email,
  password,
  setEmail,
  setPassword,
}: any) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [verificationCode, setVerificationCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState('');
  const [RepeatPassword, setRepeatPassword] = useState('');
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFullName(e.target.value);
  };

  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value);
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhoneNumber(e.target.value);
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    setLoading(true);
    //Check online database if email existes
    const users = await getValuesWithSql_Online(
      'users',
      `WHERE email = '${email}'`
    );
    console.log(users, email);
    function isValidEmail(email: string) {
      // Regular expression for a simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Test the email against the regular expression
      return emailRegex.test(email);
    }
    if (!isValidEmail(email.toLowerCase())) {
      setErrorMessage('The email is not valid.');
      setLoading(false);
      return false;
    }
    if (users.length >= 1) {
      setErrorMessage('Email already exists, please Login.');
      setLoading(false);
      return;
    }
    if (password.length <= 6) {
      setErrorMessage('Password has to be 6 or more letters.');
      setLoading(false);
      return;
    }
    if (RepeatPassword != password) {
      setErrorMessage('Passwords do not match.');
      setLoading(false);
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setCodeSent(true);
    setCodeExpired(false);
    setErrorMessage('Verification code sent to your email.');
    console.log(code)
    window.electron.ipcRenderer.send('SendVerificationCode', {
      to: email,
      code: code,
    });
    setTimeout(() => {
      setCodeExpired(true);
    }, 360000); // 3 minutes
    setLoading(false);
  };

  const handleVerify = async () => {
    setLoading(true);
    if (codeExpired) {
      setErrorMessage('Verification code has expired.');
      setLoading(false);
      return;
    }

    if (userCode === verificationCode) {
      setVerificationSuccess(true);
      setErrorMessage(
        'Verification successful! Please enter additional details.'
      );
    } else {
      setErrorMessage('Verification code is incorrect.');
    }
    setLoading(false);
  };
  function getEmailTemplates2(userId: string | null) {
    return [
      {
        id: uuidv4(),
        name: '5 days before due',
        subject: 'Rent Payment Reminder: Due in 5 Days',
        body: `Dear {{tenant_name}},
  
  This is a friendly reminder that your rent payment of {{due_amount}} is due in 5 days ({{due_duration}}) on {{due_date}}.
  
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
  
  Your rent payment of {{due_amount}} is due in 3 days ({{due_duration}}) on {{due_date}}. Please ensure timely payment.
  
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
  
  This is an urgent reminder that your rent payment of {{due_amount}} is due tomorrow ({{due_duration}}), {{due_date}}.
  
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
  
  Your rent payment of {{due_amount}} is due today ({{due_duration}}), {{due_date}}. Please make the payment as soon as possible.
  
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
  
  Your rent payment of {{due_amount}} was due yesterday ({{due_duration}}), {{due_date}}. If you have already made the payment, please disregard this notice.
  
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
  
  Your rent payment of {{due_amount}} is now 3 days overdue ({{due_duration}}). The due date was {{due_date}}.
  
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
  
  This is a critical notice regarding your rent payment of {{due_amount}}, which is now 5 days overdue ({{due_duration}}). The original due date was {{due_date}}.
  
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
  
  This is a final notice regarding your rent payment of {{due_amount}}, which is now 7 days overdue ({{due_duration}}). The original due date was {{due_date}}.
  
  Failure to address this matter may result in further action. Please make the payment immediately or contact {{landlord_name}} at {{landlord_Email}} or {{landlord_Telephone}} to resolve this issue.
  
  Sincerely,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
    ];
  }

  function getSmsTemplates(userId: string | null) {
    return [
      {
        id: uuidv4(),
        name: '5 days before due',
        body: `Dear {{tenant_name}},
  
  This is a friendly reminder that your rent payment of {{due_amount}} is due in 5 days ({{due_duration}}) on {{due_date}}.
  
  If you have any questions, please contact {{landlord_name}} at {{landlord_Telephone}}.
  
  Best regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '3 days before due',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{due_amount}} is due in 3 days ({{due_duration}}) on {{due_date}}. Please ensure timely payment.
  
  For any inquiries, contact {{landlord_name}} at {{landlord_Telephone}}.
  
  Thank you,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '1 day before due',
        body: `Dear {{tenant_name}},
  
  This is an urgent reminder that your rent payment of {{due_amount}} is due tomorrow ({{due_duration}}), {{due_date}}.
  
  If you have any concerns, please contact {{landlord_name}} immediately at {{landlord_Telephone}}.
  
  Best regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: 'On due date',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{due_amount}} is due today ({{due_duration}}), {{due_date}}. Please make the payment as soon as possible.
  
  For any questions, contact {{landlord_name}} at {{landlord_Telephone}}.
  
  Thank you for your prompt attention to this matter.
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '1 day after due',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{due_amount}} was due yesterday ({{due_duration}}), {{due_date}}. If you have already made the payment, please disregard this notice.
  
  If not, please make the payment immediately or contact {{landlord_name}} at {{landlord_Telephone}} to discuss the situation.
  
  Regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '3 days after due',
        body: `Dear {{tenant_name}},
  
  Your rent payment of {{due_amount}} is now 3 days overdue ({{due_duration}}). The due date was {{due_date}}.
  
  Please make the payment immediately or contact {{landlord_name}} at {{landlord_Telephone}} to discuss any issues you may be facing.
  
  Sincerely,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '5 days after due',
        body: `Dear {{tenant_name}},
  
  This is a critical notice regarding your rent payment of {{due_amount}}, which is now 5 days overdue ({{due_duration}}). The original due date was {{due_date}}.
  
  Immediate action is required. Please make the payment or contact {{landlord_name}} at {{landlord_Telephone}} to discuss this urgent matter.
  
  Regards,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
      {
        id: uuidv4(),
        name: '7 days after due',
        body: `Dear {{tenant_name}},
  
  This is a final notice regarding your rent payment of {{due_amount}}, which is now 7 days overdue ({{due_duration}}). The original due date was {{due_date}}.
  
  Failure to address this matter may result in further action. Please make the payment immediately or contact {{landlord_name}} at {{landlord_Telephone}} to resolve this issue.
  
  Sincerely,
  {{landlord_name}}`,
        created_at: Date.now(),
        updated_at: Date.now(),
        userId: userId,
      },
    ];
  }

  const handleSignUp = async () => {
    setLoading(true);
    if (!fullName || !companyName || !phoneNumber) {
      setErrorMessage('Please fill out all fields.');
      setLoading(false);
      return;
    }

    const userID = uuidv4();

    if (subscriptionType === '7daytrial') {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      const currentDate = new Date();
      const daysUntilEnd = Math.ceil(
        (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      await AddUserOnline(
        JSON.stringify({
          id: userID,
          Allowed: 0,
          email: email,
          password: password,
          phoneNumber: phoneNumber,
          fullName: fullName,
          companyName: companyName,
          maxNumberOfBranches: 1,
          packageType: '7daytrial',
          TrailEndDate: endDate.getTime(),
        })
      );

      window.electron.store.set('users', [
        {
          id: userID,
          Allowed: 0,
          email: email,
          password: password,
          phoneNumber: phoneNumber,
          fullName: fullName,
          companyName: companyName,
          maxNumberOfBranches: 1,
          packageType: '7daytrial',
          TrailEndDate: endDate.getTime(),
        },
      ]);
      console.log('Start Date:', startDate);
      console.log('End Date:', endDate);
      console.log('Current Date:', currentDate);
      console.log('Days until end of trial:', daysUntilEnd);
    }
    if (subscriptionType === 'fullpackage') {
      await AddUserOnline(
        JSON.stringify({
          id: userID,
          Allowed: 0,
          email: email,
          password: password,
          phoneNumber: phoneNumber,
          fullName: fullName,
          companyName: companyName,
          maxNumberOfBranches: 1,
          packageType: 'fullpackage',
          TrailEndDate: 0,
        })
      );

      window.electron.store.set('users', [
        {
          id: userID,
          Allowed: 0,
          email: email,
          password: password,
          phoneNumber: phoneNumber,
          fullName: fullName,
          companyName: companyName,
          maxNumberOfBranches: 1,
          packageType: 'fullpackage',
          TrailEndDate: 0,
        },
      ]);
    }
    for (let i = 0; i < getEmailTemplates2(userID).length; i++) {
      const element = getEmailTemplates2(userID)[i];
      await addValueOnline('email_templates', element);
      await addValueWithOutOfflineChange('email_templates', element);
    }

    for (let i = 0; i < getSmsTemplates(userID).length; i++) {
      const element = getSmsTemplates(userID)[i];
      await addValueOnline('sms_templates', element);
      await addValueWithOutOfflineChange('sms_templates', element);
    }

    setisSignedIn(true);
    setErrorMessage('Sign up successful!');
    setLoading(false);
  };

  const handleOrLoginButtonClick = () => {
    setisSignUpMode(false);
  };

  return (
    <>
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <img
            src={loadingGif}
            style={{ width: '80px', height: '80px' }}
            alt="Loading..."
          />
        </div>
      )}
      <div className="SignUpMainContainer">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center',
            height: 'auto',
            marginBottom: '15px',
          }}
        >
          <h1
            style={{
              marginRight: '10px',
              marginTop: '0px',
              marginBottom: '0px',
              fontSize: '65px',
            }}
          >
            Sign up
          </h1>{' '}
          <button onClick={handleOrLoginButtonClick}>Or login</button>
        </div>
        <p style={{ color: 'var(--Text-Color-Grey)', marginBottom: '25px' }}>
          Sign up with your Email and Password
        </p>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Email"
          className="userName-input"
        />
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          className="userName-input"
          placeholder="Password"
        />
        <input
          type="password"
          value={RepeatPassword}
          onChange={(e) => {
            setRepeatPassword(e.target.value);
          }}
          className="userName-input"
          placeholder="Repeat password"
        />

        {!verificationSuccess && (
          <>
            {!codeSent && (
              <button onClick={handleSubmit} className="LoginButton">
                Submit {' ▶'}
              </button>
            )}

            {codeSent && (
              <>
                <hr style={{ width: '100%', marginBottom: '10px' }} />
                <p
                  style={{
                    color: 'var(--Text-Color-Grey)',
                    marginBottom: '5px',
                    marginTop: '5px',
                  }}
                >
                  Verification code sent to your email
                </p>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                  }}
                >
                  <input
                    type="text"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    placeholder="Enter Code"
                    className="userName-input"
                    style={{ width: '80px', marginBottom: '0px' }}
                  />{' '}
                  <button onClick={handleVerify} className="LoginButton">
                    Verify
                  </button>
                </div>
                <button onClick={handleSubmit} style={{ width: 'auto' }}>
                  Resend code
                </button>
              </>
            )}
          </>
        )}
        {verificationSuccess && (
          <>
            <p
              style={{
                color: 'var(--Text-Color-Grey)',
                marginBottom: '5px',
                marginTop: '5px',
                textAlign: 'center',
              }}
            >
              Verification successful! <br />
              Now enter your info.
            </p>
            <input
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
              placeholder="Full Name"
              className="userName-input"
            />
            <input
              type="text"
              value={companyName}
              onChange={handleCompanyNameChange}
              placeholder="Company Name"
              className="userName-input"
            />
            <input
              type="text"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="Phone Number"
              className="userName-input"
            />
            <p
              style={{
                color: 'var(--Text-Color-Grey)',
                marginBottom: '5px',
                marginTop: '5px',
                textAlign: 'center',
              }}
            >
              Now select your subscription type.
            </p>
            <div style={{ display: 'flex' }}>
              {' '}
              <label>
                <input
                  type="radio"
                  name="subscriptionType"
                  value="7daytrial"
                  onChange={() => setSubscriptionType('7daytrial')}
                />
                7-Day Trial
              </label>
              <label>
                <input
                  type="radio"
                  name="subscriptionType"
                  value="fullpackage"
                  onChange={() => setSubscriptionType('fullpackage')}
                />
                Full package
              </label>
            </div>
            <br />
            <button onClick={handleSignUp} className="LoginButton">
              Sign Up ▶
            </button>
          </>
        )}

        {errorMessage && (
          <>
            <br />
            <p className="errorMessage">{errorMessage}</p>
          </>
        )}
      </div>
    </>
  );
};

export default React.memo(SignupPage);
