import {
  getAllUsers,
  getValuesFromOnlineDatabase,
  getValuesWithSql_Online,
  verifyAppUserCredentials,
  verifyCredentials,
} from 'Backend/OnlineServerApis';
import { addValue } from 'Backend/localServerApis';
import React, { useState } from 'react';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import { Input } from '../Helpers/CustomReactComponents';

const LoginPage = ({
  setisSignUpMode,
  setisSignedIn,
  setChangeMade,
  email,
  password,
  setEmail,
  setPassword,
  setUsername,
  username,
  setSelectedAppUser,
  setAppUserManagerShow,
  fetchBranches,
  RefreshComponent,
  setViewBranchManagementPage,
}: any) => {
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
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
      if (SelectedToLoginWith === 'Admin') {
        const isValid = await verifyCredentials(email, password);
        if (isValid) {
          // Fetch user data if credentials are valid
          const usersRaw = await getAllUsers();
          const user = usersRaw.find(
            (u: any) => u.email.toLowerCase() === email.toLowerCase()
          );

          if (user) {
            handleLogin(user);
          } else {
            setErrorMessage('Error retrieving user data. Please try again.');
          }
        } else {
          setErrorMessage('Invalid email or password');
        }
      } else {
        // Fetch user data if credentials are valid
        const getAppUser = await getValuesWithSql_Online(
          'app_users',
          `WHERE roleName = '${username}' AND password = '${password}'`
        );

        if (getAppUser.length > 0) {
          if (getAppUser[0].EnterWithPassword) {
            const user = await getValuesWithSql_Online(
              'users',
              `WHERE id = '${getAppUser[0].userId}' AND email = '${email}'`
            );
            if (user[0]) {
              handleLogin(user[0]);
              setSelectedAppUser(getAppUser[0]);
              storageManager.set('SelectedAppUserId', getAppUser[0].id);
              setAppUserManagerShow(false);
              setViewBranchManagementPage(true);
              setTimeout(async () => {
                await fetchBranches();
                console.log('branches fetched');
                RefreshComponent();
              }, 600);
            } else {
              setErrorMessage('Error retrieving user data. Please try again.');
            }
          } else {
            setErrorMessage(
              'This AppUser is not allowed to enter with password. Please contact Administrator.'
            );
          }
        } else {
          setErrorMessage('Invalid Username or password');
        }
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
    storageManager.set('users', [
      {
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
      },
    ]);
    setisSignedIn(true);
  };

  const handleOrLoginButtonClick = () => {
    setisSignUpMode(true);
  };
  const [SelectedToLoginWith, setSelectedToLoginWith] = useState('App User');
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
            Login
          </h1>
          <button onClick={handleOrLoginButtonClick}>Or Sign up</button>
        </div>
        <div
          style={{
            margin: 'var(--10px-V)',
            display: 'flex',
            gap: 'var(--20px-V)',
          }}
        >
          <button
            style={{
              border:
                SelectedToLoginWith === 'Admin'
                  ? 'var(--3px-V) solid var(--Accent-Color)'
                  : 'none',
            }}
            onClick={() => setSelectedToLoginWith('Admin')}
          >
            Login to ADMIN
          </button>
          <button
            style={{
              border:
                SelectedToLoginWith === 'App User'
                  ? 'var(--3px-V) solid var(--Accent-Color)'
                  : 'none',
            }}
            onClick={() => setSelectedToLoginWith('App User')}
          >
            Login to App User
          </button>
        </div>
        <p
          style={{
            color: 'var(--Text-Color-Grey)',
            marginBottom: 'var(--25px-V)',
          }}
        >
          {SelectedToLoginWith === 'Admin'
            ? 'Login to ADMIN with account Email and Password'
            : 'Login to App User with Username and Password'}
        </p>

        <input
          type="email"
          placeholder={'Email'}
          value={email}
          onChange={handleEmailChange}
          className="userName-input"
        />
        {SelectedToLoginWith === 'App User' && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={handleUsernameChange}
            className="userName-input"
          />
        )}
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
          className="userName-input"
        />
        {errorMessage && <p className="errorMessage">{errorMessage}</p>}

        <br />
        <button onClick={SubmitEmailAndPassword} className="LoginButton">
          Submit {' ▶'}
        </button>
      </div>
    </>
  );
};

export default React.memo(LoginPage);
