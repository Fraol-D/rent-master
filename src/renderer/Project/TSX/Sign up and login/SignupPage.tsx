import { useEffect, useState } from 'react';
import { AddUserOnline } from 'Backend/OnlineServerApis';
import {
  addValue,

} from 'Backend/localServerApis';
import { v4 as uuidv4 } from 'uuid';

const SignupPage = ({ setisSignUpMode, setisSignedIn,setChangeMade }: any) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [userCode, setUserCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [subscriptionType, setSubscriptionType] = useState('');

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
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    setCodeSent(true);
    setCodeExpired(false);
    setErrorMessage('Verification code sent to your email.');

    window.electron.sendMessage('SendVerificationCode', {
      to: email,
      code: code,
    });
    setTimeout(() => {
      setCodeExpired(true);
    }, 180000); // 3 minutes
  };

  const handleVerify = async () => {
    if (codeExpired) {
      setErrorMessage('Verification code has expired.');
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
  };

  const handleSignUp = async () => {
    if (!fullName || !companyName || !phoneNumber) {
      setErrorMessage('Please fill out all fields.');
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

      await addValue('users', {
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
      },setChangeMade);
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

      await addValue('users', {
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
      },setChangeMade);
    }
    setisSignedIn(true);
    setErrorMessage('Sign up successful!');
  };

  const handleOrLoginButtonClick = () => {
    setisSignUpMode(false);
  };

  return (
    <div>
      <div>
        <h1>Signup Page</h1>{' '}
        <button onClick={handleOrLoginButtonClick}>Or login</button>
      </div>
      <input
        type="email"
        value={email}
        onChange={handleEmailChange}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={handlePasswordChange}
        placeholder="Password"
      />
      {!verificationSuccess && (
        <>
          <button onClick={handleSubmit} disabled={codeSent}>
            Submit
          </button>
          <br />
          {codeSent && (
            <>
              <input
                type="text"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                placeholder="Enter Verification Code"
              />
              <button onClick={handleVerify}>Verify</button>
              <button onClick={handleSubmit}>Resend code</button>
            </>
          )}
          <br />
        </>
      )}
      {verificationSuccess && (
        <>
          <br />
          <input
            type="text"
            value={fullName}
            onChange={handleFullNameChange}
            placeholder="Full Name"
          />
          <input
            type="text"
            value={companyName}
            onChange={handleCompanyNameChange}
            placeholder="Company Name"
          />
          <input
            type="text"
            value={phoneNumber}
            onChange={handlePhoneNumberChange}
            placeholder="Phone Number"
          />
          <br />
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
            Full Package
          </label>
          <br />
          <button onClick={handleSignUp}>Sign Up</button>
        </>
      )}
      <br />
      {errorMessage}
    </div>
  );
};

export default SignupPage;
