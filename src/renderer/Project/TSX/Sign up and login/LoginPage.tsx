import { getAllUsers } from 'Backend/OnlineServerApis';
import { addValue } from 'Backend/localServerApis';
import React, { useState } from 'react';

const LoginPage = ({ setisSignUpMode, setisSignedIn,setChangeMade }: any) => {
  const [errorMessage, setErrorMessage] = useState('');

  const [EmailInput, setEmailInput] = useState('');
  const [PasswordInput, setPasswordInput] = useState('');
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmailInput(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordInput(e.target.value);
  };
  const SubmitEmailAndPassword = async () => {
    if (!EmailInput || !PasswordInput) {
      setErrorMessage('Please fill in your email and password.');
      return;
    }
    const usersRaw = await getAllUsers();
    const user = usersRaw.find((user: any) => user.email === EmailInput);
    if (user) {
      if (user.password === PasswordInput) {
        handleLogin(user);
      } else {
        setErrorMessage('Wrong password');
      }
    } else {
      setErrorMessage('Email does not exist');
    }

    //if it is add a row to offline tables and change the states
  };
  const handleLogin = async (user: any) => {
    setErrorMessage('Login successful!');
    await addValue('users', {
      id: user.id,
      Allowed: user.Allowed,
      email: user.email,
      password: user.password,
      phoneNumber: user.phoneNumber,
      fullName: user.fullName,
      companyName: user.companyName,
      maxNumberOfBranches: 1,
      packageType: user.packageType,
      TrailEndDate: user.TrailEndDate,
    },setChangeMade);
    setisSignedIn(true);
  };
  const handleOrLoginButtonClick = () => {
    setisSignUpMode(true);
  };
  return (
    <div>
      <div>
        <div></div>
        <h1>Login Page</h1>
        <button onClick={handleOrLoginButtonClick}>Or Signup</button>
      </div>
      <input
        type="email"
        placeholder="Email"
        value={EmailInput}
        onChange={handleEmailChange}
      />
      <input
        type="password"
        placeholder="Password"
        value={PasswordInput}
        onChange={handlePasswordChange}
      />
      <button onClick={SubmitEmailAndPassword}>Submit</button>
      {errorMessage && <p>{errorMessage}</p>}
    </div>
  );
};

export default LoginPage;
