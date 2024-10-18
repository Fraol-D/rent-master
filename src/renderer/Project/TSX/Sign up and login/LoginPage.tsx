import { getAllUsers, verifyCredentials } from 'Backend/OnlineServerApis';
import { addValue } from 'Backend/localServerApis';
import React, { useState } from 'react';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';

const LoginPage = ({ setisSignUpMode, setisSignedIn, setChangeMade, email,
  password,
  setEmail,
  setPassword, }: any) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };
  const SubmitEmailAndPassword = async () => {
    setErrorMessage('');
    setLoading(true);
  
    if (!email || !password) {
      setErrorMessage('Please fill in your email and password.');
      setLoading(false);
      return;
    }
  
    try {
      const isValid = await verifyCredentials(email, password);
  
      if (isValid) {
        // Fetch user data if credentials are valid
        const usersRaw = await getAllUsers();
        const user = usersRaw.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
          handleLogin(user);
        } else {
          setErrorMessage('Error retrieving user data. Please try again.');
        }
      } else {
        setErrorMessage('Invalid email or password');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setErrorMessage('An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleLogin = async (user: any) => {
    setErrorMessage('Login successful!');
    window.electron.store.set('users', [{
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
    }]);
    setisSignedIn(true);
  };

  const handleOrLoginButtonClick = () => {
    setisSignUpMode(true);
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
        <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            width: '100%',
            alignItems: 'center',
            height: 'auto',
            marginBottom: '15px' 
        }}>
            <h1 style={{ 
                marginRight: '10px',
                marginTop: '0px',
                marginBottom: '0px',
                fontSize: '65px' 
            }}>
                Login
            </h1> 
            <button onClick={handleOrLoginButtonClick}>Or Sign up</button>
        </div>

        <p style={{ color: 'var(--Text-Color-Grey)', marginBottom: '25px' }}>
            Login with your Email and Password
        </p>

        <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
            className="userName-input" 
        />

        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={handlePasswordChange}
            className="userName-input" 
        />
        {errorMessage && <p className="errorMessage" >{errorMessage}</p>} 

     <br />
        <button onClick={SubmitEmailAndPassword} className="LoginButton">
            Submit {' ▶'}
        </button>

    </div>
    </>
  );
};

export default React.memo(LoginPage);
