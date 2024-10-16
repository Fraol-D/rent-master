import React, { useEffect, useState } from 'react';
import SignUpPage from './SignupPage';
import { getValuesWithSql, updateValue } from 'Backend/localServerApis';
import LoginPage from './LoginPage';
import TrialExpiredPage from './TrialExpiredPage';
import {
  deleteValueOnline,
  getValuesFromOnlineDatabase,
  getValuesWithSql_Online,
  syncOnlineToLocal,
  syncOnlineToLocalWithBool,
} from 'Backend/OnlineServerApis';
import NotAllowedScreen from './NotAllowedScreen';
import TrialEndedText from './TrialEndedText';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';

interface MyComponentProps {
  children: React.ReactNode;
  Refresh: number;
  isSignedIn: boolean;
  setisSignedIn: (newval: boolean) => void;
  setChangeMade: any;
  setSelectedUserId: (newval: string) => void;
  SelectedUserId: string;
  isSyncing: boolean;
  setIsSyncing: (newval: boolean) => void;
  setSyncProgress: (newval: number) => void;
  RefreshDataFromSqlite: () => void;
  signOutUserAndRestart: () => void;
}
const AccountManager = (React.FC<MyComponentProps> = ({
  children,
  Refresh,
  isSignedIn,
  setisSignedIn,
  setChangeMade,
  setSelectedUserId,
  SelectedUserId,
  setIsSyncing,
  setSyncProgress,
  RefreshDataFromSqlite,signOutUserAndRestart
}) => {
  const [TrialExpiredState, setTrialExpiredState] = useState(false);
  const [IsAllowedState, setIsAllowedState] = useState(false);
  const [isSignUpMode, setisSignUpMode] = useState(true);
  const [loading, setLoading] = useState(false);

  const checkIfSignedIn = async () => {
    const allUsers = window.electron.store.get('users') || [];
    if (allUsers.length > 0) {
      const userONLINE = await getValuesWithSql_Online(
        'users',
        `WHERE id = '${allUsers[0].id}' AND password = '${allUsers[0].password}'`
      );

      if (userONLINE.length !== 1 && navigator.onLine) {
        return;
      } else {
        setisSignedIn(true);
        const check = async () => {
          const userRaw = allUsers[0];
        

          if (userRaw.packageType === '7daytrial') {

            if (userRaw.TrailEndDate < Date.now()) {
              setTrialExpiredState(true);
              console.log('Trial expired');
            }

            //Also make the trial expired true if the trialenddate - 7days is bigger than date.now
            if (userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
              setTrialExpiredState(true);
              console.log('Tiral Has expired bc invalid date input');
            }

            if (
              userRaw.TrailEndDate > Date.now() &&
              userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 < Date.now()
            ) {
              setTrialExpiredState(false);
              console.log('Trial is still active'); // Added console.log for debugging
            }
          }

          if (navigator.onLine) {
            const OnlineUser = await getValuesWithSql_Online(
              'users',
              `WHERE id = '${userRaw.id}'`
            );
            setIsAllowedState(OnlineUser[0].Allowed);
            const updatedUsers = allUsers.map((user) =>
              user.id === userRaw.id ? { ...user, Allowed: OnlineUser[0].Allowed } : user
            );
            window.electron.store.set('users', updatedUsers);
            setChangeMade(true);
          } else {
            setIsAllowedState(userRaw.Allowed);
          }
        };

        check();
        setSelectedUserId(allUsers[0].id);
        console.log('Signed in', SelectedUserId);
        if (navigator.onLine) {
          //  setIsSyncing(true);
          //  syncOnlineToLocalWithBool(
          //    allUsers[0].id,
          //    setIsSyncing,
          //    setSyncProgress,
          //    RefreshDataFromSqlite
          //  );
        }
      }
    } else {
      setisSignedIn(false);
    }
  };
  
  useEffect(() => {
    checkIfSignedIn();
    
  }, [isSignedIn, Refresh]);
  // use effect to check if the signin is true and to check trial shit
  useEffect(() => {
    if (isSignedIn == true) {
      const check = async () => {
        const users = window.electron.store.get('users') || [];
        const userRaw = users[0];

        if (userRaw.packageType === '7daytrial') {
          if (userRaw.trialEndDate < Date.now()) {
            setTrialExpiredState(true);
            console.log('Trial expired');
          }

          //Also make the trial expired true if the trialenddate - 7days is bigger than date.now
          if (userRaw.trialEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
            setTrialExpiredState(true);
            console.log('Trial Has expired bc invalid date input');
          }

          if (
            userRaw.trialEndDate > Date.now() &&
            userRaw.trialEndDate - 7 * 24 * 60 * 60 * 1000 < Date.now()
          ) {
            setTrialExpiredState(false);
          }
        }
      };

      check();
    }
  }, [isSignedIn, Refresh]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const handleFullSignOutAndDeleteUser = async()=> {
    const usersId = await window.electron.store.get('users')[0].id;
    console.log(usersId)
    await deleteValueOnline('users', usersId);
    
    signOutUserAndRestart();
  }
  const AccountCheck = ({
    TextBackgroundColorText,
    ThemeMode,
    handleSignOut,
    b454959BackgroundColor454959,
    ISallowedToUseAppStatus,
    LoadingGif,
    SignOut,
  }: any) => {
    return (
      <div className="signup-success-message">
        <div style={{ padding: '10px', margin: '0px' }}>
          <h2>Congratulations! Your account has been successfully created.</h2>{' '}
          <p className="signOutAndIfNot">
            Is this your email:{' '}
            <strong>{window.electron.store.get('users')[0].email || ''}</strong>
            ?
            <br />
            If not,{' '}
            <button onClick={handleFullSignOutAndDeleteUser} className="SignUpSignOutTryAgain">
              <p>Sign out</p>{' '}
            </button>
          </p>
          You are not approved. Please call this number to activate your
          account: <br />
          <span className="activation-number">-{'>'} 09 44 50 9999</span>
          <br />
          <span className="activation-number">-{'>'} 09 44 50 8888</span>
          <br />
          <br />
          If this is your first time signing in please be connected to the internet. It's possible you're seeing this message due to a lack of internet
          connection.
          <br />
          <div style={{ display: 'flex' }}>
            <button onClick={() => {setLoading(true); checkIfSignedIn().finally(() => setLoading(false));}} className="SignUpSignOutTryAgain">
              <p>Retry</p>{' '}
            </button>
          
          </div>
        </div>
      </div>
    );
  };

  return (
    <> {loading && (
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
    )}<></><div style={{ height: '100%' }}>
      {isSignedIn ? (
        TrialExpiredState ? (
          <>
            <TrialEndedText></TrialEndedText>
          </>
        ) : IsAllowedState ? (
          <>{children}</>
        ) : (
          <AccountCheck></AccountCheck>
        )
      ) : isSignUpMode ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <SignUpPage
            setisSignUpMode={setisSignUpMode}
            setisSignedIn={setisSignedIn}
            setChangeMade={setChangeMade}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
          ></SignUpPage>
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}
        >
          <LoginPage
            setisSignUpMode={setisSignUpMode}
            setisSignedIn={setisSignedIn}
            setChangeMade={setChangeMade}
            email={email}
            password={password}
            setEmail={setEmail}
            setPassword={setPassword}
          ></LoginPage>
        </div>
      )}
    </div></>
  );
});

export default React.memo(AccountManager);
