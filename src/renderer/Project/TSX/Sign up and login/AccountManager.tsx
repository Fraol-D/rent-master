import React, { useEffect, useState } from 'react';
import SignUpPage from './SignupPage';
import { getValuesWithSql, updateValue } from 'Backend/localServerApis';
import LoginPage from './LoginPage';
import TrialExpiredPage from './TrialExpiredPage';
import {
  getValuesFromOnlineDatabase,
  getValuesWithSql_Online,
  syncOnlineToLocal,
  syncOnlineToLocalWithBool,
} from 'Backend/OnlineServerApis';
import NotAllowedScreen from './NotAllowedScreen';
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
  RefreshDataFromSqlite,
}) => {
  const [TrialExpiredState, setTrialExpiredState] = useState(false);
  const [IsAllowedState, setIsAllowedState] = useState(false);
  const [isSignUpMode, setisSignUpMode] = useState(true);
  useEffect(() => {
    const checkIfSignedIn = async () => {
      const allUsersInTable = await getValuesWithSql('users', 'WHERE 1');
      if (allUsersInTable.length > 0) {
        setisSignedIn(true);

        const check = async () => {
          const usersRaw = await getValuesWithSql('users', 'WHERE 1');
          const userRaw = usersRaw[0];
          console.log('userRaw:', userRaw); // Added console.log for debugging
          if (userRaw.packageType === '7daytrial') {
            console.log('userRawssssssss:', userRaw.TrailEndDate, Date.now()); // Added console.log for debugging

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
            await updateValue('users', userRaw.id, 'Allowed', 1, setChangeMade);
          } else {
            setIsAllowedState(userRaw.Allowed);
          }
        };

        check();
        setSelectedUserId(allUsersInTable[0].id);
        console.log('Signed in', SelectedUserId);
        if (navigator.onLine) {
          /*syncOnlineToLocalWithBool(
            allUsersInTable[0].id,    
            setIsSyncing,
            setSyncProgress,
            RefreshDataFromSqlite
          );*/
        }
      } else {
        setisSignedIn(false);
      }
    };
    checkIfSignedIn();
  }, [isSignedIn, Refresh]);
  // use effect to check if the signin is true and to check trial shit
  useEffect(() => {
    if (isSignedIn == true) {
      const check = async () => {
        const usersRaw = await getValuesWithSql('users', 'WHERE 1');
        const userRaw = usersRaw[0];
        if (userRaw.packageType === '7daytrial') {
          if (userRaw.trialEndDate < Date.now()) {
            setTrialExpiredState(true);
            console.log('Trial expired');
          }
          //Also make the trial expired true if the trialenddate - 7days is bigger than date.now
          if (userRaw.trialEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
            setTrialExpiredState(true);

            console.log('Tiral Has expired bc invalid date input');
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

  return (
    <div style={{ height: '100%' }}>
      {isSignedIn ? (
        TrialExpiredState ? (
          <>
            <TrialExpiredPage></TrialExpiredPage>
          </>
        ) : IsAllowedState ? (
          <>{children}</>
        ) : (
          <NotAllowedScreen></NotAllowedScreen>
        )
      ) : isSignUpMode ? (
        <SignUpPage
          setisSignUpMode={setisSignUpMode}
          setisSignedIn={setisSignedIn}
          setChangeMade={setChangeMade}
        ></SignUpPage>
      ) : (
        <LoginPage
          setisSignUpMode={setisSignUpMode}
          setisSignedIn={setisSignedIn}
          setChangeMade={setChangeMade}
        ></LoginPage>
      )}
    </div>
  );
});

export default AccountManager;
