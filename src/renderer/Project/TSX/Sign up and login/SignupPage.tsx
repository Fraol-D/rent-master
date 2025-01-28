import { storageManager } from '../../../storeManager';
import { useEffect, useState } from 'react';
import { Input } from '../Helpers/CustomReactComponents';
import {
  AddUserOnline,
  addValueOnline,
  checkIfCompanyNameExists,
  getValuesWithSql_Online,
  sendEmailAPIForVerify,
  sendEmailAPIForWebsite,
} from '../../../../Backend/OnlineServerApis';
import CryptoJS from 'crypto-js';
import {
  addValue,
  addValueWithOutOfflineChange,
  deleteValue,
  getValuesWithSql,
} from '../../../../Backend/localServerApis';
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
  const [subscriptionType, setSubscriptionType] = useState('fullpackage');
  const [RepeatPassword, setRepeatPassword] = useState('');
  const [formStage, setFormStage] = useState('initial'); // New state to track form stage

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
     const users = await getValuesWithSql_Online(
      'users',
      `WHERE email = '${email}'`
    );if (users.length >= 1) {
      setErrorMessage('Email already exists, please Login.');
      setLoading(false);
      return;
    }
   if (!isValidEmail(email.toLowerCase())) {
      setErrorMessage('The email is not valid.');
      setLoading(false);
      return false;
    }  if (password.length <= 6) {
      setErrorMessage('Password has to be 6 or more letters.');
      setLoading(false);
      return;
    }
    if (RepeatPassword != password) {
      setErrorMessage('Passwords do not match.');
      setLoading(false);
      return;
    } // Check online database if email exists
   
    
    function isValidEmail(email: string) {
      // Regular expression for a simple email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      // Test the email against the regular expression
      return emailRegex.test(email);
    }

  

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setCodeSent(true);
    setCodeExpired(false);
    setErrorMessage('Verification code sent to your email.');
  sendEmailAPIForVerify(email, code);
    setLoading(false);
    setTimeout(() => {
      setCodeExpired(true);
    }, 360000); // 3 minutes
    setFormStage('verification'); // Move to verification stage
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

  const handleBack = () => {
    setFormStage('initial'); // Go back to initial stage
    setCodeSent(false); // Reset code sent state
    setVerificationSuccess(false); // Reset verification success state
  };

  function getEmailTemplates2(userId: string | null) {
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

  const handleSignUp = async () => {
    setLoading(true);

    if (!fullName || !companyName || !phoneNumber) {
      setErrorMessage('Please fill out all fields.');
      setLoading(false);
      return;
    }
    const checkIfExists = await checkIfCompanyNameExists(companyName);
    console.log(checkIfExists.valid);
    if (!checkIfExists.valid) {
      setErrorMessage('Company name already exists.');
      setLoading(false);
      return;
    }
    const userID = uuidv4();
    storageManager.set('abbreviationDecimals', 2);
    storageManager.set('abbreiviateBigNumbers', true);
    if (subscriptionType === '7daytrial') {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days later
      const currentDate = new Date();
      const daysUntilEnd = Math.ceil(
        (endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      storageManager.set('useLiveExchangeRates', true);
      await sendEmailAPIForWebsite(
        'rentmaster.et@gmail.com',
        `A new user has signed up with the following details:
Email: ${email}
Full Name: ${fullName} 
Company Name: ${companyName}
Phone Number: ${phoneNumber}
Package Type: 7 day trial`,
        'New User Signed up'
      );
      // Hash the new password
      const hashedPassword = CryptoJS.SHA256(password).toString();
      await AddUserOnline(
        JSON.stringify({
          id: userID,
          Allowed: 0,
          email: email,
          password: hashedPassword,
          phoneNumber: phoneNumber,
          fullName: fullName,
          companyName: companyName,
          maxNumberOfBranches: 1,
          packageType: '7daytrial',
          TrailEndDate: endDate.getTime(),
        })
      );

      storageManager.set('users', [
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
      await sendEmailAPIForWebsite(
        'rentmaster.et@gmail.com',
        `A new user has signed up with the following details:
id: ${userID}
Email: ${email}
Full Name: ${fullName} 
Company Name: ${companyName}
Phone Number: ${phoneNumber}
Package Type: ${!window.electron
  ? window.location.pathname.split('/signup/')[1]
  : ''}`,
        'New User Signed up'
      );await AddUserOnline(
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
          PackageSelected: !window.electron
            ? window.location.pathname.split('/signup/')[1]
            : '',
          TrailEndDate: 0,
        })
      );

      storageManager.set('users', [
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
      if (window.electron)
        await addValueWithOutOfflineChange('email_templates', element);
    }

    for (let i = 0; i < getSmsTemplates(userID).length; i++) {
      const element = getSmsTemplates(userID)[i];
      await addValueOnline('sms_templates', element);
      if (window.electron)
        await addValueWithOutOfflineChange('sms_templates', element);
    }
    if (!window.electron) window.location.pathname = '/app';
    setisSignedIn(true);
    setErrorMessage('Sign up successful!');
    setLoading(false);
  };

  const handleOrLoginButtonClick = () => {
    if (window.electron) setisSignUpMode(false);
    else window.location.pathname = '/login';
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
            zIndex: 1000,
          }}
        >
          <img
            src={loadingGif}
            style={{ width: 'var(--80px-V)', height: 'var(--80px-V)' }}
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
            marginBottom: 'var(--15px-V)',
          }}
        >
          <h1
            style={{
              marginRight: 'var(--10px-V)',
              marginTop: 'var(--0px-V)',
              marginBottom: 'var(--0px-V)',
              fontSize: 'var(--65px-V)',
            }}
          >
            Sign up
          </h1>
        </div>
        <p
          style={{
            color: 'var(--Text-Color-Grey)',
            marginBottom: 'var(--25px-V)',
          }}
        >
          Sign up with your Email and Password
        </p>
        <input
          type="email"
          value={email}
          onChange={handleEmailChange}
          placeholder="Email"
          className="userName-input"
          disabled={formStage !== 'initial'}
          style={{
            color: formStage !== 'initial' ? 'var(--Text-Color-Grey)' : '',
          }}
        />
        <input
          type="password"
          value={password}
          onChange={handlePasswordChange}
          className="userName-input"
          placeholder="Password"
          disabled={formStage !== 'initial'}
          style={{
            color: formStage !== 'initial' ? 'var(--Text-Color-Grey)' : '',
          }}
        />
        <input
          type="password"
          value={RepeatPassword}
          onChange={(e) => {
            setRepeatPassword(e.target.value);
          }}
          className="userName-input"
          placeholder="Repeat password"
          disabled={formStage !== 'initial'}
          style={{
            color: formStage !== 'initial' ? 'var(--Text-Color-Grey)' : '',
          }}
        />
        {errorMessage && <p className="errorMessage">{errorMessage}</p>}

        <br />

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '90%',
            gap: 'var(--10px-V)',
          }}
        >
          {formStage === 'initial' && (
            <button
              onClick={handleSubmit}
              className="LoginButton"
              style={{
                background: 'var(--Primary-Color)',
                color: 'black',
                marginLeft: 'auto',
                marginRight: 'auto',
              }}
            >
              Submit
            </button>
          )}

          {formStage === 'verification' && (
            <>
              <button
                onClick={handleBack}
                className="LoginButton"
                style={{
                
                  border: 'none',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                Back
              </button>
              {!verificationSuccess && (
                <>
                  <hr style={{ width: '100%', marginBottom: 'var(--10px-V)' }} />
                  <p
                    style={{
                      color: 'var(--Text-Color-Grey)',
                      marginBottom: 'var(--5px-V)',
                      marginTop: 'var(--5px-V)',
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
                      style={{
                        width: 'var(--80px-V)',
                        marginBottom: 'var(--0px-V)',
                      }}
                    />
                    <button
                      onClick={handleVerify}
                      className="LoginButton"
                      style={{
                        background: 'var(--Primary-Color)',
                        color: 'black',
                      }}
                    >
                      Verify
                    </button>
                  </div>
                  <button
                    onClick={handleSubmit}
                    style={{
                     
                    }}
                  >
                    Resend code
                  </button>
                </>
              )}
              {verificationSuccess && (
                <>
                  <p
                    style={{
                      color: 'var(--Text-Color-Grey)',
                      marginBottom: 'var(--5px-V)',
                      marginTop: 'var(--5px-V)',
                      textAlign: 'center',
                    }}
                  >
                    Verification successful! <br />
                    Now enter your info
                  </p>
                  <input
                    type="text"
                    value={fullName}
                    onChange={handleFullNameChange}
                    placeholder="Full Name"
                    className="userName-input"
                  />
                  <div
                    style={{
                      width: '92%',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <input
                      type="text"
                      value={companyName}
                      onChange={handleCompanyNameChange}
                      placeholder="Company Name"
                      style={{ width: '55%', marginBottom: '0px' }}
                      className="userName-input"
                    />
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={handlePhoneNumberChange}
                      style={{ width: '38%', marginBottom: '0px' }}
                      placeholder="Phone Number"
                      className="userName-input"
                    />
                  </div>

                  <br />
                  <button
                    onClick={handleSignUp}
                    className="LoginButton"
                    style={{
                      background: 'var(--Primary-Color)',
                      color: 'black',
                      marginLeft: 'auto',
                      marginRight: 'auto',
                    }}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
      <br />
      <a
        href="#"
        style={{ color: 'var(--Text-Color-Grey)', cursor: 'pointer' }}
        onClick={handleOrLoginButtonClick}
      >
        Already have an account? Login
      </a>
    </>
  );
};

export default React.memo(SignupPage);
