import React, { useEffect, useState } from 'react';
import SignUpPage from './SignupPage';
import { getValuesWithSql, updateValue } from 'Backend/localServerApis';
import LoginPage from './LoginPage';
import TrialExpiredPage from './TrialExpiredPage';
const { v4: uuidv4 } = require('uuid');
import {
  addValueOnline,
  deleteValueOnline,
  getAllUsers,
  getValuesFromOnlineDatabase,
  getValuesWithSql_Online,
  syncOnlineToLocal,
  syncOnlineToLocalWithBool,
  updateValueOnline,
  verifyCredentials,
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
  AppUserManagerShow: boolean;
  setAppUserManagerShow: (newval: boolean) => void;
  AppUserManagerPromptPassword: boolean;
  setAppUserManagerPromptPassword: (newval: boolean) => void;
  setSelectedAppUser: (newval: appUser) => void;
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
  signOutUserAndRestart,
  setAppUserManagerShow,
  AppUserManagerShow,
  AppUserManagerPromptPassword,
  setAppUserManagerPromptPassword,
  setSelectedAppUser,
}) => {
  const [TrialExpiredState, setTrialExpiredState] = useState(false);
  const [IsAllowedState, setIsAllowedState] = useState(false);
  const [isSignUpMode, setisSignUpMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [appUsers, setAppUsers] = useState<appUser[]>([]);
  const [editingUser, setEditingUser] = useState<appUser | null>(null);
  const [loadingPrivileges, setLoadingPrivileges] = useState<{
    [key: string]: boolean;
  }>({});
  const [isCheckingAll, setIsCheckingAll] = useState(false);
  const [isUncheckingAll, setIsUncheckingAll] = useState(false);
  const [privilegeError, setPrivilegeError] = useState('');

  const validatePrivileges = (privileges: string) => {
    const mainTabs = [
      'View dashboard page',
      'View peoples page',
      'View calendar page',
      'View database page',
      'View tools page',
      'View rooms page',
    ];
    return mainTabs.some((tab) => privileges.includes(tab));
  };
  const [initialLoading, setInitialLoading] = useState(true);
  // Function to check if a user is signed in
  const checkIfSignedIn = async () => {
    setInitialLoading(true);
    // Get all users from local storage
    const allUsers = window.electron.store.get('users') || [];

    if (allUsers.length > 0) {
      const userONLINE = await getValuesWithSql_Online(
        'users',
        `WHERE id = '${allUsers[0].id}' AND password = '${allUsers[0].password}'`
      );

      // If user not found online and we have internet connection, return
      if (userONLINE.length !== 1 && navigator.onLine) {
        return;
      } else {
        // Set signed in state to true
        setisSignedIn(true);

        // Function to check user details
        const check = async () => {
          const userRaw = allUsers[0];

          // Check if user has a trial package
          if (userRaw.packageType === '7daytrial') {
            // Check if trial has expired
            if (userRaw.TrailEndDate < Date.now()) {
              setTrialExpiredState(true);
              console.log('Trial expired');
            }

            // Check if trial end date is set incorrectly (more than 7 days in the future)
            if (userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
              setTrialExpiredState(true);
              console.log('Trial Has expired bc invalid date input');
            }

            // Check if trial is still active
            if (
              userRaw.TrailEndDate > Date.now() &&
              userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 < Date.now()
            ) {
              setTrialExpiredState(false);
              console.log('Trial is still active');
            }
          }

          // If online, update user details from online database
          if (navigator.onLine) {
            const OnlineUser = await getValuesWithSql_Online(
              'users',
              `WHERE id = '${userRaw.id}'`
            );
            setIsAllowedState(OnlineUser[0].Allowed);

            // Update local user data
            const updatedUsers = allUsers.map((user: any) =>
              user.id === userRaw.id
                ? { ...user, Allowed: OnlineUser[0].Allowed }
                : user
            );
            window.electron.store.set('users', updatedUsers);
            setChangeMade(true);
          } else {
            // If offline, use local data
            setIsAllowedState(userRaw.Allowed);
          }
        };

        await check();
        setSelectedUserId(allUsers[0].id);
        if (window.electron.store.get('SelectedAppUserId')) {
        } else {
          setAppUserManagerShow(true);
        }
        console.log('Signed in', SelectedUserId);

        await appUsersManagement();
        if (navigator.onLine && window.electron.store.get('users')[0].Allowed) {
          // setIsSyncing(true);
          // syncOnlineToLocalWithBool(
          //   allUsers[0].id,
          //   setIsSyncing,
          //   setSyncProgress,
          //   RefreshDataFromSqlite
          // );
        }
      }
    } else {
      // If no users found, set signed in state to false
      setisSignedIn(false);
    }
    setInitialLoading(false);
  };
  const appUsersManagement = async () => {
    if (navigator.onLine) {
      const appUsers = await getValuesWithSql_Online(
        'app_users',
        `WHERE userId = '${window.electron.store.get('users')[0].id}'`
      );
      if (appUsers) {
        await window.electron.store.set('app_users', appUsers);
        setAppUsers(appUsers);
        if (window.electron.store.get('SelectedAppUserId')) {
          if (window.electron.store.get('SelectedAppUserId') == 'admin') {
            setSelectedAppUser({
              id: 'admin',
              roleName: 'admin',
              privileges: '',
              userId: window.electron.store.get('users')[0].id,
              addedDate: Date.now(),
            });
          } else {
            setSelectedAppUser(
              appUsers.find(
                async (user: any) =>
                  (await user.id) ===
                  window.electron.store.get('SelectedAppUserId')
              )
            );
          }
        }
      }
    } else {
      const appUsers = window.electron.store.get('app_users');

      setAppUsers(appUsers);
      if (window.electron.store.get('SelectedAppUserId')) {
        if (window.electron.store.get('SelectedAppUserId') == 'admin') {
          setSelectedAppUser({
            id: 'admin',
            roleName: 'admin',
            privileges: '',
            userId: window.electron.store.get('users')[0].id,
            addedDate: Date.now(),
          });
        } else {
          setSelectedAppUser(
            appUsers.find(
              async (user: any) =>
                (await user.id) ===
                window.electron.store.get('SelectedAppUserId')
            )
          );
        }
      }
    }
  };
  const handleAddNewAppUser = async () => {
    if (navigator.onLine) {
      const newAppUser = {
        id: uuidv4(),
        roleName: 'New User',
        privileges: privileges.join(','), // Set all privileges by default
        userId: window.electron.store.get('users')[0].id,
        addedDate: Date.now(),
      };
      try {
        await addValueOnline('app_users', newAppUser);
        await appUsersManagement();
      } catch (error) {
        console.error('Error adding new user:', error);
        alert(
          'Failed to add new user. Please check your internet connection and try again.'
        );
      }
    } else {
      alert('No internet connection. Please check your network and try again.');
    }
  };

  // Effect to check sign in status when isSignedIn or Refresh changes
  useEffect(() => {
    checkIfSignedIn();
  }, [isSignedIn, Refresh]);

  // Effect to check trial status when signed in
  useEffect(() => {
    if (isSignedIn === true) {
      const check = async () => {
        const users = window.electron.store.get('users') || [];
        const userRaw = users[0];

        if (userRaw.packageType === '7daytrial') {
          // Check if trial has expired
          if (userRaw.trialEndDate < Date.now()) {
            setTrialExpiredState(true);
            console.log('Trial expired');
          }

          // Check if trial end date is set incorrectly (more than 7 days in the future)
          if (userRaw.trialEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
            setTrialExpiredState(true);
            console.log('Trial Has expired bc invalid date input');
          }

          // Check if trial is still active
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
  const handleFullSignOutAndDeleteUser = async () => {
    const usersId = await window.electron.store.get('users')[0].id;
    console.log(usersId);
    await deleteValueOnline('users', usersId);

    signOutUserAndRestart();
  };
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
            <button
              onClick={handleFullSignOutAndDeleteUser}
              className="SignUpSignOutTryAgain"
            >
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
          If this is your first time signing in please be connected to the
          internet. It's possible you're seeing this message due to a lack of
          internet connection.
          <br />
          <div style={{ display: 'flex' }}>
            <button
              onClick={() => {
                setLoading(true);
                checkIfSignedIn().finally(() => setLoading(false));
              }}
              className="SignUpSignOutTryAgain"
            >
              <p>Retry</p>{' '}
            </button>
          </div>
        </div>
      </div>
    );
  };
  const [PasswordCheckInput, setPasswordCheckInput] = useState('');
  const [isCheckingPassword, setIsCheckingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleSubmitAdminPassword = async () => {
    if (navigator.onLine) {
      setIsCheckingPassword(true);
      setPasswordError('');
      const localUser = window.electron.store.get('users')[0];

      try {
        const isValid = await verifyCredentials(
          localUser.email,
          PasswordCheckInput
        );

        if (isValid) {
          setAppUserManagerPromptPassword(false);
        } else {
          setPasswordError('Incorrect password. Please try again.');
        }
      } catch (error) {
        console.error('Error verifying credentials:', error);
        setPasswordError(
          'An error occurred while verifying credentials. Please try again.'
        );
      } finally {
        setIsCheckingPassword(false);
        setPasswordCheckInput('');
      }
    } else {
      setPasswordError(
        'No internet connection. Please check your network and try again.'
      );
    }
    setPasswordCheckInput('');
  };
  const handleEditUser = (user: appUser) => {
    setEditingUserId(user.id);
    setEditingUserName(user.roleName);
  };

  const handleSaveEdit = async (userId: string) => {
    if (navigator.onLine) {
      try {
        await updateValueOnline(
          'app_users',
          userId,
          'roleName',
          editingUserName
        );

        const updatedAppUsers = appUsers.map((user) =>
          user.id === userId ? { ...user, roleName: editingUserName } : user
        );
        setAppUsers(updatedAppUsers);
        window.electron.store.set('app_users', updatedAppUsers);

        setEditingUserId(null);
        setEditingUserName('');
      } catch (error) {
        console.error('Error updating user name:', error);
        alert(
          'Failed to update user name. Please check your internet connection and try again.'
        );
      }
    } else {
      alert('No internet connection. Please check your network and try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserName('');
  };
  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      if (navigator.onLine) {
        try {
          await deleteValueOnline('app_users', userId);
          await appUsersManagement();
        } catch (error) {
          console.error('Error deleting user:', error);
          alert(
            'Failed to delete user. Please check your internet connection and try again.'
          );
        }
      } else {
        alert(
          'No internet connection. Please check your network and try again.'
        );
      }
    }
  };
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');

  const handleSelectUser = (user: appUser) => {
    setSelectedAppUser(user);
    window.electron.store.set('SelectedAppUserId', user.id);
    setAppUserManagerShow(false);
  };

  const handleSavePrivileges = async () => {
    if (editingUser) {
      if (navigator.onLine) {
        try {
          const updatedAppUsers = appUsers.map((user) =>
            user.id === editingUser.id ? editingUser : user
          );
          window.electron.store.set('app_users', updatedAppUsers);
          await addValueOnline('app_users', editingUser);
          await appUsersManagement();
          setEditingUser(null);
        } catch (error) {
          console.error('Error saving privileges:', error);
          alert(
            'Failed to save privileges. Please check your internet connection and try again.'
          );
        }
      } else {
        alert(
          'No internet connection. Please check your network and try again.'
        );
      }
    }
  };

  const togglePrivilege = (privilege: string) => {
    if (editingUser) {
      const privileges = editingUser.privileges.split(',');
      const index = privileges.indexOf(privilege);
      if (index > -1) {
        privileges.splice(index, 1);
      } else {
        privileges.push(privilege);
      }
      setEditingUser({ ...editingUser, privileges: privileges.join(',') });
    }
  };
  const handleTogglePrivilege = async (user: appUser, privilege: string) => {
    if (navigator.onLine) {
      const loadingKey = `${user.id}-${privilege}`;
      setLoadingPrivileges((prev) => ({ ...prev, [loadingKey]: true }));

      let updatedPrivileges = user.privileges.split(',');
      const index = updatedPrivileges.indexOf(privilege);

      if (index > -1) {
        // Remove the privilege and all its children
        updatedPrivileges = updatedPrivileges.filter((p) => {
          const isChild = privilegeHierarchy.some(
            (parent) =>
              parent.name === privilege &&
              parent.children &&
              parent.children.some((child) => child.name === p)
          );
          return p !== privilege && !isChild;
        });
      } else {
        // Add the privilege and all its parent privileges
        updatedPrivileges.push(privilege);
        privilegeHierarchy.forEach((p) => {
          if (
            p.children &&
            p.children.some((child) => child.name === privilege)
          ) {
            if (!updatedPrivileges.includes(p.name)) {
              updatedPrivileges.push(p.name);
            }
          }
        });
      }

      const updatedPrivilegesString = updatedPrivileges.join(',');

      // Validate privileges
      if (!validatePrivileges(updatedPrivilegesString)) {
        setPrivilegeError('At least one main page must be selected.');
        setLoadingPrivileges((prev) => ({ ...prev, [loadingKey]: false }));
        return;
      }

      setPrivilegeError('');

      try {
        await updateValueOnline(
          'app_users',
          user.id,
          'privileges',
          updatedPrivilegesString
        );

        const updatedUser = { ...user, privileges: updatedPrivilegesString };
        const updatedAppUsers = appUsers.map((u) =>
          u.id === user.id ? updatedUser : u
        );
        setAppUsers(updatedAppUsers);
        window.electron.store.set('app_users', updatedAppUsers);
      } catch (error) {
        console.error('Error updating privilege:', error);
        alert(
          'Failed to update privilege. Please check your internet connection and try again.'
        );
      } finally {
        setLoadingPrivileges((prev) => ({ ...prev, [loadingKey]: false }));
      }
    } else {
      alert('No internet connection. Please check your network and try again.');
    }
  };

  const privileges = [
    'View dashboard page', //
    'View peoples page', //
    'View calendar page', //
    'View database page', //
    'edit database data', //
    'View tools page',
    'edit email templates',
    'edit sms templates',
    'edit expenses',
    'View rooms page',
    'Add a room', //
    'Add a tenant',
    'edit room data', //
    'edit rent payments', //
    'edit utility payments', //
    'edit tenant room tenant info',
    'edit tenant room agreement info',
    'edit tenant room utility settings',
    'edit tenant room attachments',
    'edit tenant room notification settings',
    'edit tenant room tenant stay',
  ];
  interface PrivilegeNode {
    name: string;
    children?: PrivilegeNode[];
  }

  const privilegeHierarchy: PrivilegeNode[] = [
    {
      name: 'View dashboard page',
    },
    {
      name: 'View peoples page',
    },
    { name: 'View calendar page' },
    {
      name: 'View database page',
      children: [{ name: 'edit database data' }],
    },
    {
      name: 'View tools page',
      children: [
        { name: 'edit email templates' },
        { name: 'edit sms templates' },
        { name: 'edit expenses' },
      ],
    },
    {
      name: 'View rooms page',
      children: [
        { name: 'Add a room' },
        { name: 'Add a tenant' },
        { name: 'edit room data' },
        { name: 'edit rent payments' },
        { name: 'edit utility payments' },
        { name: 'edit tenant room tenant info' },
        { name: 'edit tenant room agreement info' },
        { name: 'edit tenant room utility settings' },
        { name: 'edit tenant room attachments' },
        { name: 'edit tenant room notification settings' },
        { name: 'edit tenant room tenant stay' },
      ],
    },
  ];
  const PrivilegeItem: React.FC<{
    privilege: PrivilegeNode;
    appUser: appUser;
    handleTogglePrivilege: (user: appUser, privilege: string) => void;
    loadingPrivileges: { [key: string]: boolean };
  }> = ({ privilege, appUser, handleTogglePrivilege, loadingPrivileges }) => {
    const isChecked = appUser.privileges.includes(privilege.name);

    return (
      <div className="privilege-item">
        <div>
          <input
            type="checkbox"
            id={`${appUser.id}-${privilege.name}`}
            checked={isChecked}
            onChange={() => handleTogglePrivilege(appUser, privilege.name)}
          />
          <label htmlFor={`${appUser.id}-${privilege.name}`}>
            {privilege.name}
          </label>
          {loadingPrivileges[`${appUser.id}-${privilege.name}`] && (
            <img
              src={loadingGif}
              alt="Loading..."
              style={{ width: '20px', height: '20px', marginLeft: '5px' }}
            />
          )}
        </div>
        {isChecked && privilege.children && (
          <div style={{ marginLeft: '20px' }}>
            {privilege.children.map((child) => (
              <PrivilegeItem
                key={child.name}
                privilege={child}
                appUser={appUser}
                handleTogglePrivilege={handleTogglePrivilege}
                loadingPrivileges={loadingPrivileges}
              />
            ))}
          </div>
        )}
      </div>
    );
  };
  const handleCheckAll = async (user: appUser) => {
    if (navigator.onLine) {
      setIsCheckingAll(true);
      const updatedPrivileges = privileges.join(',');
      try {
        await updateValueOnline(
          'app_users',
          user.id,
          'privileges',
          updatedPrivileges
        );
        const updatedUser = { ...user, privileges: updatedPrivileges };
        const updatedAppUsers = appUsers.map((u) =>
          u.id === user.id ? updatedUser : u
        );
        window.electron.store.set('app_users', updatedAppUsers);
        await appUsersManagement();
      } catch (error) {
        console.error('Error updating privileges:', error);
        alert(
          'Failed to update privileges. Please check your internet connection and try again.'
        );
      } finally {
        setIsCheckingAll(false);
      }
      // Add validation here as well
      if (!validatePrivileges(updatedPrivileges)) {
        setPrivilegeError('At least one main page must be selected.');
        setIsCheckingAll(false);
        return;
      }
      setPrivilegeError('');
    } else {
      alert('No internet connection. Please check your network and try again.');
    }
  };

  const handleUncheckAll = async (user: appUser) => {
    if (navigator.onLine) {
      setIsUncheckingAll(true);
      const updatedPrivileges = ['View dashboard page'];
      try {
        await updateValueOnline(
          'app_users',
          user.id,
          'privileges',
          updatedPrivileges.join(',')
        );
        const updatedUser = {
          ...user,
          privileges: updatedPrivileges.join(','),
        };
        const updatedAppUsers = appUsers.map((u) =>
          u.id === user.id ? updatedUser : u
        );
        window.electron.store.set('app_users', updatedAppUsers);
        await appUsersManagement();
        setPrivilegeError('');
      } catch (error) {
        console.error('Error updating privileges:', error);
        alert(
          'Failed to update privileges. Please check your internet connection and try again.'
        );
      } finally {
        setIsUncheckingAll(false);
      }
    } else {
      alert('No internet connection. Please check your network and try again.');
    }
  };

  return (
    <>
      {(loading || initialLoading) && (
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
      <div style={{ height: '100%' }}>
        {!initialLoading && (
          <>
            {isSignedIn ? (
              TrialExpiredState ? (
                <TrialEndedText />
              ) : IsAllowedState ? (
                <>
                  {AppUserManagerShow ? (
                    AppUserManagerPromptPassword ? (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          height: '100%',
                        }}
                      >
                        <div
                          className="SignUpMainContainer"
                          style={{
                            width: 'auto',
                            maxWidth: '400px',
                            height: 'auto',
                            margin: 'auto',
                            background: 'var(--Secondary-Color20)',
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow: '0px 4px 4px 0px rgba(0, 0, 0, 0.25)',
                            padding: '20px',
                          }}
                        >
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
                                fontSize: '45px',
                              }}
                            >
                              Security Check
                            </h1>
                            <button
                              onClick={() => setAppUserManagerShow(false)}
                            >
                              Back
                            </button>
                          </div>
                          <p
                            style={{
                              color: 'var(--Text-Color)',
                              marginBottom: '25px',
                            }}
                          >
                            Please enter the account password to continue
                          </p>
                          <input
                            type="password"
                            placeholder="Admin Password"
                            className="userName-input"
                            value={PasswordCheckInput}
                            onChange={(e) =>
                              setPasswordCheckInput(e.target.value)
                            }
                          />
                          <br />
                          {passwordError && (
                            <p style={{ color: 'red', marginBottom: '10px' }}>
                              {passwordError}
                            </p>
                          )}
                          <button
                            className="LoginButton"
                            onClick={handleSubmitAdminPassword}
                            disabled={isCheckingPassword}
                          >
                            {isCheckingPassword ? (
                              <img
                                src={loadingGif}
                                alt="Loading..."
                                style={{ width: '20px', height: '20px' }}
                              />
                            ) : (
                              <>Submit {' ▶'}</>
                            )}
                          </button>
                        </div>{' '}
                      </div>
                    ) : (
                      <>
                        <h1 style={{ textAlign: 'center' }}>User Selector</h1>
                        <p style={{ textAlign: 'center' }}>
                          Select the user this PC will be assigned to. This step
                          is crucial for proper account management and ensures
                          that the correct user has access to this device.
                        </p>
                        <div
                          style={{ display: 'flex', justifyContent: 'center' }}
                        >
                          <button
                            className="appUserButtons"
                            style={{ marginBottom: 'auto', marginTop: '10px' }}
                            onClick={handleAddNewAppUser}
                          >
                            Add New User
                          </button>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            overflowX: 'auto',
                          }}
                          className="appUserItemContainer"
                        >
                          <div style={{ display: 'flex' }}>
                            <div className="appUserItemM appUserItem">
                              <div className="appUserHeader">
                                <span style={{ fontSize: '25px' }}>Admin</span>
                                <button
                                  className="appUserButtons"
                                  onClick={() =>
                                    handleSelectUser({
                                      id: 'admin',
                                      roleName: 'admin',
                                      privileges: '',
                                      userId:
                                        window.electron.store.get('users')[0]
                                          .id,
                                      addedDate: Date.now(),
                                    })
                                  }
                                >
                                  Select
                                </button>
                              </div>
                              <h3>All Privileges are on</h3>
                            </div>
                            {appUsers.map((appUser) => (
                              <div key={appUser.id} className="appUserItem">
                                <div className="appUserHeader">
                                  {editingUserId === appUser.id ? (
                                    <>
                                      <input
                                        type="text"
                                        value={editingUserName}
                                        onChange={(e) =>
                                          setEditingUserName(e.target.value)
                                        }
                                        style={{
                                          fontSize: '20px',
                                          marginRight: '10px',
                                          width: '50%',
                                        }}
                                      />
                                      <div>
                                        <button
                                          className="appUserButtons"
                                          onClick={() =>
                                            handleSaveEdit(appUser.id)
                                          }
                                        >
                                          Save
                                        </button>
                                        <button
                                          className="appUserButtons"
                                          onClick={handleCancelEdit}
                                        >
                                          Cancel
                                        </button>
                                      </div>
                                    </>
                                  ) : (
                                    <>
                                      <span style={{ fontSize: '25px' }}>
                                        {appUser.roleName}
                                      </span>
                                      <div>
                                        <button
                                          className="appUserButtons"
                                          onClick={() =>
                                            handleSelectUser(appUser)
                                          }
                                        >
                                          Select
                                        </button>
                                        <button
                                          className="appUserButtons"
                                          onClick={() =>
                                            handleEditUser(appUser)
                                          }
                                        >
                                          Edit
                                        </button>
                                        <button
                                          className="appUserButtons"
                                          onClick={() =>
                                            handleDeleteUser(appUser.id)
                                          }
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                                <div className="privileges-list">
                                  {privilegeHierarchy.map((privilege) => (
                                    <PrivilegeItem
                                      key={privilege.name}
                                      privilege={privilege}
                                      appUser={appUser}
                                      handleTogglePrivilege={
                                        handleTogglePrivilege
                                      }
                                      loadingPrivileges={loadingPrivileges}
                                    />
                                  ))}
                                </div>
                                <div className="privilege-actions">
                                  <button
                                    onClick={() => handleCheckAll(appUser)}
                                    disabled={isCheckingAll}
                                  >
                                    {isCheckingAll ? (
                                      <img
                                        src={loadingGif}
                                        alt="Loading..."
                                        style={{
                                          width: '20px',
                                          height: '20px',
                                        }}
                                      />
                                    ) : (
                                      'Check All'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => handleUncheckAll(appUser)}
                                    disabled={isUncheckingAll}
                                  >
                                    {isUncheckingAll ? (
                                      <img
                                        src={loadingGif}
                                        alt="Loading..."
                                        style={{
                                          width: '20px',
                                          height: '20px',
                                        }}
                                      />
                                    ) : (
                                      'Uncheck All'
                                    )}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        {privilegeError && (
                          <div style={{ color: 'red', marginTop: '10px' }}>
                            {privilegeError}
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    children
                  )}
                </>
              ) : (
                <AccountCheck />
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
                />
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
                />
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
});

export default React.memo(AccountManager);
