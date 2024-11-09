import React, { useEffect, useState } from 'react';
import SignUpPage from './SignupPage';
import { getValuesWithSql, updateValue } from 'Backend/localServerApis';
import LoginPage from './LoginPage';
import TrialExpiredPage from './TrialExpiredPage';
import { Input } from '../Helpers/CustomReactComponents';
const { v4: uuidv4 } = require('uuid');
import {
  addValueOnline,
  deleteValueOnline,
  getAllUsers,
  getValuesFromOnlineDatabase,
  getValuesWithSql_Online,
  syncOnlineToLocalBranch,
  syncOnlineToLocalBranchWithBool,
  updateValueOnline,
  verifyCredentials,
} from 'Backend/OnlineServerApis';
import NotAllowedScreen from './NotAllowedScreen';
import TrialEndedText from './TrialEndedText';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import DashboardPage from '../Pages/DashboardPage';

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
  ViewBranchManagementPage: boolean;
  setViewBranchManagementPage: (newval: boolean) => void;
  SelectedBranchId: string;
  setSelectedBranchId: (newval: string) => void;
  ViewBranchManagementPageNONAdm: boolean;
  setViewBranchManagementPageNONAdm: (newval: boolean) => void;
  fetchBranches: () => void;
  Branches: BranchTypeWithData[];
  setBranches: (newval: BranchTypeWithData[]) => void;
  setBranchName: (newval: string) => void;
}

const timeoutPromise = (ms: number) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timed out'));
    }, ms);
  });
};

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
  setViewBranchManagementPage,
  ViewBranchManagementPage,
  SelectedBranchId,
  setSelectedBranchId,
  ViewBranchManagementPageNONAdm,
  setViewBranchManagementPageNONAdm,
  fetchBranches,
  Branches,
  setBranches,
  setBranchName,
}: any) => {
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
    const allUsers = window.electron.store.get('users') || [];

    if (allUsers.length > 0) {
      try {
        const userCheck = async () => {
          const userONLINE = await getValuesWithSql_Online(
            'users',
            `WHERE id = '${allUsers[0].id}' AND password = '${allUsers[0].password}'`
          );
          return userONLINE;
        };

        const userONLINE = await Promise.race([
          userCheck(),
          timeoutPromise(10000),
        ]).catch((error) => {
          console.log('Online check failed or timed out:', error);
          return null;
        });

        if (!userONLINE && allUsers[0].Allowed) {
          console.log('Falling back to local data');
          setisSignedIn(true);
          setIsAllowedState(allUsers[0].Allowed);
          setSelectedUserId(allUsers[0].id);

          if (!window.electron.store.get('SelectedAppUserId')) {
            setAppUserManagerShow(true);
          }
          await handleFetchBranches();
          await appUsersManagement();
          setInitialLoading(false);
          return;
        }

        if (userONLINE?.length === 1 || !navigator.onLine) {
          setisSignedIn(true);

          const check = async () => {
            const userRaw = allUsers[0];

            if (userRaw.packageType === '7daytrial') {
              if (userRaw.TrailEndDate < Date.now()) {
                setTrialExpiredState(true);
                console.log('Trial expired');
              }

              if (userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
                setTrialExpiredState(true);
                console.log('Trial Has expired bc invalid date input');
              }

              if (
                userRaw.TrailEndDate > Date.now() &&
                userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 < Date.now()
              ) {
                setTrialExpiredState(false);
                console.log('Trial is still active');
              }
            }

            if (navigator.onLine) {
              try {
                const OnlineUser = await getValuesWithSql_Online(
                  'users',
                  `WHERE id = '${userRaw.id}'`
                );
                setIsAllowedState(OnlineUser[0].Allowed);

                const updatedUsers = allUsers.map((user: any) =>
                  user.id === userRaw.id
                    ? { ...user, Allowed: OnlineUser[0].Allowed }
                    : user
                );
                window.electron.store.set('users', updatedUsers);
                setChangeMade(true);
              } catch (error) {
                console.log('Error fetching online user data:', error);
                setIsAllowedState(userRaw.Allowed);
              }
            } else {
              setIsAllowedState(userRaw.Allowed);
            }
          };

          await check();
          setSelectedUserId(allUsers[0].id);

          if (!window.electron.store.get('SelectedAppUserId')) {
            setAppUserManagerShow(true);
          }
          await handleFetchBranches();
          await appUsersManagement();
          if (
            navigator.onLine &&
            window.electron.store.get('users')[0].Allowed &&
            !ViewBranchManagementPage &&
            window.electron.store.get('SelectedBranchId') !== ''
          ) {
            //syncWithOnline(allUsers[0].id);
          }
        }
      } catch (error) {
        console.error('Error in checkIfSignedIn:', error);
        if (allUsers[0].Allowed) {
          setisSignedIn(true);
          setIsAllowedState(allUsers[0].Allowed);
          setSelectedUserId(allUsers[0].id);

          if (!window.electron.store.get('SelectedAppUserId')) {
            setAppUserManagerShow(true);
          }
          await handleFetchBranches();
          await appUsersManagement();
        }
      }
    } else {
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
              AllowedBranches: 'ALL',
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
            AllowedBranches: 'ALL',
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
      const existingUsers = appUsers.filter((user: any) =>
        user.roleName.startsWith('New User')
      );

      let newUserName = 'New User';
      if (existingUsers.length > 0) {
        const numbers = existingUsers.map((user: any) => {
          const match = user.roleName.match(/New User \((\d+)\)/);
          return match ? parseInt(match[1]) : 0;
        });
        const maxNum = Math.max(...numbers, 0);
        newUserName = `New User (${maxNum + 1})`;
      }
      const accountId = uuidv4();
      const newAppUser = {
        id: accountId,
        roleName: newUserName,
        privileges: privileges.join(','),
        userId: window.electron.store.get('users')[0].id,
        addedDate: Date.now(),
        AllowedBranches: Branches.map((branch) => branch.id).join(','),
      };

      try {
        await addValueOnline('app_users', newAppUser);
        await appUsersManagement();
        setTimeout(() => {
          // Wait for the next render cycle
          requestAnimationFrame(() => {
            // Find the container and the new element
            const container = document.querySelector('.abcScroll');
            const newUserElement = document.getElementById(
              `app-user-${accountId}`
            );
            console.log(container);
            console.log(newUserElement);
            if (container && newUserElement) {
              // Scroll the container
              container.scrollTo({
                left:
                  (newUserElement as HTMLElement).offsetLeft -
                  (container as HTMLElement).offsetLeft,
                behavior: 'smooth',
              });

              // Add highlight effect
              newUserElement.style.transition = 'background-color 0.3s ease';
              newUserElement.style.backgroundColor = 'var(--Highlight-Color)';
              setTimeout(() => {
                newUserElement.style.backgroundColor = '';
              }, 1500);
            }
          });
        }, 500);
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
  const syncWithOnline = async (selectedUserId: string) => {
    setIsSyncing(true);
    syncOnlineToLocalBranchWithBool(
      selectedUserId,
      window.electron.store.get('SelectedBranchId'),
      setIsSyncing,
      setSyncProgress,
      RefreshDataFromSqlite
    );
  };
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
  const [username, setUsername] = useState('');
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
        <div style={{ padding: 'var(--10px-V)', margin: 'var(--0px-V)' }}>
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
  const handleSubmitAdminPasswordTrueAdmin = async () => {
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
          setIsTrueAdmin(true);
          setCheckIfTureAdmin(false);
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
        setCheckIfTureAdmin(false);
      }
    } else {
      setPasswordError(
        'No internet connection. Please check your network and try again.'
      );
    }
    setPasswordCheckInput('');
  };
  const handleSubmitAdminPasswordBranch = async () => {
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
          setViewBranchManagementPageNONAdm(false);
          window.electron.store.set('LockBranchToPc', false);
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
    'add a branch',
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
    {
      name: 'add a branch',
    }
  ];
  const [IsTrueAdmin, setIsTrueAdmin] = useState(false);
  const [CheckIfTureAdmin, setCheckIfTureAdmin] = useState(false);
  const [ChangingPasswordId, setChangingPasswordId] = useState('false');
  const [NewAdminPassword, setNewAdminPassword] = useState('');
  const [ShowPassword, setShowPassword] = useState(false);
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
              style={{
                width: 'var(--20px-V)',
                height: 'var(--20px-V)',
                marginLeft: 'var(--5px-V)',
              }}
            />
          )}
        </div>
        {isChecked && privilege.children && (
          <div style={{ marginLeft: 'var(--20px-V)' }}>
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
  const handleApplyPASSWORD = async () => {
    if (navigator.onLine) {
      await updateValueOnline(
        'app_users',
        ChangingPasswordId,
        'password',
        NewAdminPassword
      );
      setChangingPasswordId('');
      setNewAdminPassword('');
      await appUsersManagement();
    }
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

  useEffect(() => {
    handleFetchBranches();
  }, [ViewBranchManagementPage]);

  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchData, setNewBranchData] = useState<BranchType>({
    id: '',
    name: '',
    location: '',
    description: '',
    googleMapPinPoint: '',
    userId: '',
  });

  const handleAddBranch = async () => {
    try {
      setIsAddingBranch(true);

      // Validate required fields
      if (!newBranchData.name?.trim()) {
        alert('Branch name is required');
        return;
      }

      // Check if a branch with the same name already exists
      const existingBranch = Branches.find(
        (branch) => branch.name === newBranchData.name.trim()
      );
      if (existingBranch) {
        alert('A branch with the same name already exists');
        return;
      }

      // Log the data being sent
      console.log('Adding branch with data:', {
        id: uuidv4(),
        name: newBranchData.name,
        location: newBranchData.location || null,
        description: newBranchData.description || null,
        googleMapPinPoint: newBranchData.googleMapPinPoint || null,
        userId: SelectedUserId,
      });

      // First, check if we have a valid SelectedUserId
      if (!SelectedUserId) {
        throw new Error('No user ID selected');
      }

      const branchToAdd = {
        id: uuidv4(),
        name: newBranchData.name.trim(),
        location: newBranchData.location?.trim() || null,
        description: newBranchData.description?.trim() || null,
        googleMapPinPoint: newBranchData.googleMapPinPoint?.trim() || null,
        userId: SelectedUserId,
      };

      // Add to online database
      const result = await addValueOnline('branches', branchToAdd);
      console.log('Add branch result:', result); // Log the result

      // If successful, refresh the branches list
      await handleFetchBranches();

      // Reset form
      setNewBranchData({
        id: '',
        name: '',
        location: '',
        description: '',
        googleMapPinPoint: '',
        userId: '',
      });

      // Close modal
      setShowAddBranchModal(false);

      // Show success message
      alert('Branch added successfully!');
    } catch (error) {
      console.error('Detailed error adding branch:', error);
      alert(`Failed to add branch: ${error.message}`);
    } finally {
      setIsAddingBranch(false);
    }
  };

  const [editingBranch, setEditingBranch] = useState<BranchTypeWithData | null>(
    null
  );
  const handleSelectBranch = (branchId: string) => {
    setSelectedBranchId(branchId);
    setBranchName(
      Branches.find((branch) => branch.id === branchId)?.name || ''
    );
    window.electron.store.set(
      'BranchName',
      Branches.find((branch) => branch.id === branchId)?.name || ''
    );
    window.electron.store.set('SelectedBranchId', branchId);
    if (Branches.find((branch) => branch.id === branchId)?.lock)
      window.electron.store.set('LockBranchToPc', true);
    else window.electron.store.set('LockBranchToPc', false);

    setViewBranchManagementPage(false);
    RefreshDataFromSqlite();
    syncWithOnline(SelectedUserId);
  };
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const handleEditBranch = async () => {
    if (!editingBranch?.id) return;

    try {
      setIsEditingBranch(true);

      // Validate required fields
      if (!editingBranch.name?.trim()) {
        alert('Branch name is required');
        return;
      }

      const updates = {
        name: editingBranch.name,
        location: editingBranch.location || null,
        description: editingBranch.description || null,
        googleMapPinPoint: editingBranch.googleMapPinPoint || null,
      };

      // Update in database
      const updatePromises = Object.entries(updates).map(([field, value]) =>
        updateValueOnline('branches', editingBranch.id, field, value)
      );

      await Promise.all(updatePromises);
      await handleFetchBranches(); // Refresh the branches list

      setShowEditBranchModal(false);
      setEditingBranch(null);
    } catch (error) {
      console.error('Error updating branch:', error);
      alert('Failed to update branch. Please try again.');
    } finally {
      setIsEditingBranch(false);
    }
  };
  const handleDeleteBranch = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await deleteValueOnline('branches', branchId);

      handleFetchBranches();
    } catch (error) {
      alert(
        'Failed to delete branch. Please check your connection and try again.'
      );
    }
  };
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);

  const handleFetchBranches = async () => {
    setIsBranchesLoading(true);
    try {
      await fetchBranches();
    } finally {
      setIsBranchesLoading(false);
    }
  };
  const handleShowBranches = async () => {
    setViewBranchManagementPage(true);
    setIsBranchesLoading(true);
    try {
      await fetchBranches();
    } finally {
      setIsBranchesLoading(false);
    }
  };

  // Add this helper function to handle branch selection for editing
  const handleStartEdit = (branch: BranchTypeWithData) => {
    setEditingBranch(branch);
    setShowEditBranchModal(true);
  };
  const [SelectedBranchIdADD, setSelectedBranchIdADD] = useState('');
  const [AddBranchToUserIsAdding, setAddBranchToUserIsAdding] = useState(false);
  const handleAddBranchToUser = async (appUser: appUser) => {
    if (
      !AddBranchToUserIsAdding &&
      SelectedBranchIdADD !== 'Select NON SELECTED PLEASE SELECT OKOK'
    ) {
      setAddBranchToUserIsAdding(true);
      const cleanedBranches = appUser.AllowedBranches.split(',')
        .filter((branch) => branch.length === 36)
        .join(',');
      const updatedBranches = cleanedBranches + ',' + SelectedBranchIdADD;
      await updateValueOnline(
        'app_users',
        appUser.id,
        'AllowedBranches',
        updatedBranches
      );
      await appUsersManagement();
      setSelectedBranchIdADD('Select NON SELECTED PLEASE SELECT OKOK');
      setAddBranchToUserIsAdding(false);
    }
  };
  const handleRemoveBranchFromUser = async (
    appUser: appUser,
    branchId: string
  ) => {
    const cleanedBranches = appUser.AllowedBranches.split(',')
      .filter((branch) => branch.length === 36)
      .join(',')
      .split(',')
      .filter((branch) => branch !== branchId)
      .join(',');
    await updateValueOnline(
      'app_users',
      appUser.id,
      'AllowedBranches',
      cleanedBranches
    );
    await appUsersManagement();
  }; // Add this with other state declarations
  const RefreshComponent = () => {
    setCount(count + 1);
  };
  const [count, setCount] = useState(0);
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
            style={{ width: 'var(--80px-V)', height: 'var(--80px-V)' }}
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
                    CheckIfTureAdmin ? (
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
                            maxWidth: 'var(--400px-V)',
                            height: 'auto',
                            margin: 'auto',
                            background: 'var(--Secondary-Color20)',
                            borderRadius: 'var(--8px-V)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow:
                              'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                            padding: 'var(--20px-V)',
                          }}
                        >
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
                                fontSize: 'var(--45px-V)',
                              }}
                            >
                              Security Check Extra
                            </h1>
                            <button
                              onClick={() => {
                                setCheckIfTureAdmin(false);
                                setIsTrueAdmin(false);
                              }}
                            >
                              Back
                            </button>
                          </div>
                          <p
                            style={{
                              color: 'var(--Text-Color)',
                              marginBottom: 'var(--25px-V)',
                            }}
                          >
                            Please enter the account password to see App user
                            passwords
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
                            <p
                              style={{
                                color: 'red',
                                marginBottom: 'var(--10px-V)',
                              }}
                            >
                              {passwordError}
                            </p>
                          )}
                          <button
                            className="LoginButton"
                            onClick={handleSubmitAdminPasswordTrueAdmin}
                            disabled={isCheckingPassword}
                          >
                            {isCheckingPassword ? (
                              <img
                                src={loadingGif}
                                alt="Loading..."
                                style={{
                                  width: 'var(--20px-V)',
                                  height: 'var(--20px-V)',
                                }}
                              />
                            ) : (
                              <>Submit {' ▶'}</>
                            )}
                          </button>
                        </div>{' '}
                      </div>
                    ) : AppUserManagerPromptPassword ? (
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
                            maxWidth: 'var(--400px-V)',
                            height: 'auto',
                            margin: 'auto',
                            background: 'var(--Secondary-Color20)',
                            borderRadius: 'var(--8px-V)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            boxShadow:
                              'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                            padding: 'var(--20px-V)',
                          }}
                        >
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
                                fontSize: 'var(--45px-V)',
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
                              marginBottom: 'var(--25px-V)',
                            }}
                          >
                            Please enter the account password to open appusers
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
                            <p
                              style={{
                                color: 'red',
                                marginBottom: 'var(--10px-V)',
                              }}
                            >
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
                                style={{
                                  width: 'var(--20px-V)',
                                  height: 'var(--20px-V)',
                                }}
                              />
                            ) : (
                              <>Submit {' ▶'}</>
                            )}
                          </button>
                        </div>{' '}
                      </div>
                    ) : (
                      <>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--20px-V)',
                            padding: 'var(--20px-V)',
                          }}
                        >
                          <div>
                            <h1 style={{ margin: 0 }}>User Management</h1>
                            <p
                              style={{
                                margin: 'var(--10px-V) 0 0 0',
                                color: 'var(--Text-Color-60)',
                              }}
                            >
                              Select the user this PC will be assigned to
                            </p>
                          </div>
                          <div>
                            <button
                              onClick={() => {
                                handleFetchBranches();
                                appUsersManagement();
                              }}
                            >
                              Refresh
                            </button>
                            {window.electron.store.get('SelectedAppUserId') ===
                            '' ? (
                              <></>
                            ) : (
                              <button
                                className="appUserButtons"
                                onClick={() => setAppUserManagerShow(false)}
                                style={{ marginRight: 'var(--10px-V)' }}
                              >
                                Back
                              </button>
                            )}
                            <button
                              className="appUserButtons"
                              onClick={handleAddNewAppUser}
                            >
                              Add New User
                            </button>
                          </div>
                        </div>
                        <div
                          style={{
                            height: 'calc(100% - var(--105px-V))',
                            overflowY: 'auto',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'row',
                              overflowX: 'auto',
                            }}
                            className="appUserItemContainer"
                          >
                            <div
                              style={{ display: 'flex' }}
                              className="abcScroll"
                            >
                              <div className="appUserItemM appUserItem">
                                <div>
                                  <div className="appUserHeader">
                                    <span style={{ fontSize: 'var(--25px-V)' }}>
                                      Admin
                                    </span>
                                    <button
                                      className="appUserButtons"
                                      onClick={() =>
                                        handleSelectUser({
                                          id: 'admin',
                                          roleName: 'admin',
                                          privileges: '',
                                          userId:
                                            window.electron.store.get(
                                              'users'
                                            )[0].id,
                                          addedDate: Date.now(),
                                          AllowedBranches: 'ALL',
                                        })
                                      }
                                    >
                                      Select
                                    </button>
                                  </div>
                                  <p
                                    style={{
                                      margin: 'var(--5px-V) 0',
                                      color: 'var(--Text-Color-60)',
                                    }}
                                  >
                                    Full system access with all privileges
                                    enabled.
                                  </p>
                                  <p
                                    style={{
                                      margin: 'var(--5px-V) 0',
                                      color: 'var(--Text-Color-60)',
                                    }}
                                  >
                                    Full access to all branches.
                                  </p>
                                </div>
                              </div>
                              {appUsers
                                .sort((a, b) =>
                                  a.roleName.localeCompare(b.roleName)
                                )
                                .map((appUser) => (
                                  <div
                                    id={`app-user-${appUser.id}`}
                                    className="appUserItem"
                                  >
                                    <div>
                                      <div className="appUserHeader">
                                        {editingUserId === appUser.id ? (
                                          <>
                                            <input
                                              type="text"
                                              value={editingUserName}
                                              onChange={(e) =>
                                                setEditingUserName(
                                                  e.target.value
                                                )
                                              }
                                              style={{
                                                fontSize: 'var(--20px-V)',
                                                marginRight: 'var(--10px-V)',
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
                                            <span
                                              style={{
                                                fontSize: 'var(--25px-V)',
                                              }}
                                            >
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
                                            loadingPrivileges={
                                              loadingPrivileges
                                            }
                                          />
                                        ))}
                                      </div>
                                      <div className="privilege-actions">
                                        <button
                                          onClick={() =>
                                            handleCheckAll(appUser)
                                          }
                                          disabled={isCheckingAll}
                                        >
                                          {isCheckingAll ? (
                                            <img
                                              src={loadingGif}
                                              alt="Loading..."
                                              style={{
                                                width: 'var(--20px-V)',
                                                height: 'var(--20px-V)',
                                              }}
                                            />
                                          ) : (
                                            'Check All'
                                          )}
                                        </button>
                                        <button
                                          onClick={() =>
                                            handleUncheckAll(appUser)
                                          }
                                          disabled={isUncheckingAll}
                                        >
                                          {isUncheckingAll ? (
                                            <img
                                              src={loadingGif}
                                              alt="Loading..."
                                              style={{
                                                width: 'var(--20px-V)',
                                                height: 'var(--20px-V)',
                                              }}
                                            />
                                          ) : (
                                            'Uncheck All'
                                          )}
                                        </button>
                                      </div>
                                      <hr />
                                    </div>
                                    <div>
                                      <h2
                                        style={{
                                          textAlign: 'center',
                                          width: '100%',
                                          marginBottom: 'var(--10px-V)',
                                        }}
                                      >
                                        Allowed branchs{' '}
                                        <select
                                          name=""
                                          id=""
                                          onChange={(e) => {
                                            setSelectedBranchIdADD(
                                              e.target.value
                                            );
                                          }}
                                          value={SelectedBranchIdADD}
                                        >
                                          <option
                                            value={
                                              'Select NON SELECTED PLEASE SELECT OKOK'
                                            }
                                          >
                                            Select
                                          </option>
                                          {Branches.filter(
                                            (branch: any) =>
                                              !appUser.AllowedBranches.includes(
                                                branch.id
                                              )
                                          ).map((branch: any) => (
                                            <>
                                              <option value={branch.id}>
                                                {branch.name}
                                              </option>
                                            </>
                                          ))}
                                        </select>
                                        <button
                                          onClick={() => {
                                            handleAddBranchToUser(appUser);
                                          }}
                                        >
                                          {!AddBranchToUserIsAdding && 'Add'}
                                        </button>
                                      </h2>
                                      <div
                                        style={{
                                          display: 'flex',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        {AddBranchToUserIsAdding ? (
                                          <img
                                            src={loadingGif}
                                            alt="Loading..."
                                            style={{
                                              width: 'var(--30px-V)',
                                              height: 'var(--30px-V)',
                                            }}
                                          />
                                        ) : (
                                          ''
                                        )}
                                      </div>

                                      {appUser.AllowedBranches.split(',').map(
                                        (branchId: string) => (
                                          <span
                                            key={branchId}
                                            style={{
                                              display: 'flex',
                                              justifyContent: 'space-between',
                                              alignItems: 'center',
                                              width: '60%',
                                              backgroundColor:
                                                'var(--Secondary-Color60)',
                                              marginTop: 'auto',
                                              marginRight: 'auto',
                                              marginBottom: 'var(--5px-V)',
                                              marginLeft: 'auto',
                                              paddingLeft: 'var(--5px-V)',
                                              borderRadius: 'var(--5px-V)',
                                            }}
                                          >
                                            {Branches.find(
                                              (branch: any) =>
                                                branch.id === branchId
                                            )?.name || 'Unknown'}{' '}
                                            <button
                                              onClick={() => {
                                                handleRemoveBranchFromUser(
                                                  appUser,
                                                  branchId
                                                );
                                              }}
                                            >
                                              x
                                            </button>
                                          </span>
                                        )
                                      )}
                                      <hr />
                                      {window.electron.store.get(
                                        'SelectedAppUserId'
                                      ) === 'admin' && (
                                        <div>
                                          <button
                                            onClick={() => {
                                              if (IsTrueAdmin) {
                                                setIsTrueAdmin(false);
                                              } else {
                                                setCheckIfTureAdmin(true);
                                              }
                                            }}
                                            style={{
                                              marginRight: 'var(--10px-V)',
                                            }}
                                          >
                                            {IsTrueAdmin ? 'Hide' : 'Show'}
                                          </button>
                                          User password:{' '}
                                          {IsTrueAdmin
                                            ? appUser.password
                                            : '********'}
                                          <div style={{ display: 'flex' }}>
                                            {IsTrueAdmin &&
                                              ChangingPasswordId !==
                                                appUser.id && (
                                                <button
                                                  onClick={() =>
                                                    setChangingPasswordId(
                                                      appUser.id
                                                    )
                                                  }
                                                >
                                                  Change Password
                                                </button>
                                              )}
                                            {ChangingPasswordId ===
                                              appUser.id && (
                                              <>
                                                <input
                                                  type={'text'}
                                                  placeholder="New Password"
                                                  style={{
                                                    width: 'var(--180px-V)',
                                                  }}
                                                  value={NewAdminPassword}
                                                  onChange={(e) =>
                                                    setNewAdminPassword(
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                                <button
                                                  onClick={() => {
                                                    handleApplyPASSWORD();
                                                  }}
                                                  style={{
                                                    marginRight:
                                                      'var(--10px-V)',
                                                  }}
                                                >
                                                  Done
                                                </button>
                                                <button
                                                  onClick={() => {
                                                    setChangingPasswordId('');
                                                  }}
                                                >
                                                  Cancel
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                            </div>
                          </div>
                          {privilegeError && (
                            <div
                              style={{
                                color: 'red',
                                marginTop: 'var(--10px-V)',
                              }}
                            >
                              {privilegeError}
                            </div>
                          )}
                        </div>
                      </>
                    )
                  ) : ViewBranchManagementPage ? (
                    ViewBranchManagementPageNONAdm ? (
                      <>
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
                              maxWidth: 'var(--400px-V)',
                              height: 'auto',
                              margin: 'auto',
                              background: 'var(--Secondary-Color20)',
                              borderRadius: 'var(--8px-V)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              boxShadow:
                                'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                              padding: 'var(--20px-V)',
                            }}
                          >
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
                                  fontSize: 'var(--45px-V)',
                                }}
                              >
                                Security Check
                              </h1>
                              <button
                                onClick={() =>
                                  setViewBranchManagementPage(false)
                                }
                              >
                                Back
                              </button>
                            </div>
                            <p
                              style={{
                                color: 'var(--Text-Color)',
                                marginBottom: 'var(--25px-V)',
                              }}
                            >
                              Please enter the account password to see the
                              branch list as admin
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
                              <p
                                style={{
                                  color: 'red',
                                  marginBottom: 'var(--10px-V)',
                                }}
                              >
                                {passwordError}
                              </p>
                            )}
                            <button
                              className="LoginButton"
                              onClick={handleSubmitAdminPasswordBranch}
                              disabled={isCheckingPassword}
                            >
                              {isCheckingPassword ? (
                                <img
                                  src={loadingGif}
                                  alt="Loading..."
                                  style={{
                                    width: 'var(--20px-V)',
                                    height: 'var(--20px-V)',
                                  }}
                                />
                              ) : (
                                <>Submit {' ▶'}</>
                              )}
                            </button>
                          </div>{' '}
                        </div>
                      </>
                    ) : (
                      <div
                        className="branch-management-container"
                        style={{
                          padding: 'var(--20px-V)',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 'var(--20px-V)',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 'var(--5px-V)',
                            }}
                          >
                            {' '}
                            <h1 style={{ margin: 0 }}>Branch Management</h1>
                            <p style={{ margin: 0 }}>{appUsers.find(appUser => appUser.id === window.electron.store.get('SelectedAppUserId'))?.roleName}</p>
                          </div>
                          <p style={{ width: '40%' }}>
                            {window.electron.store.get('SelectedAppUserId') !==
                              'admin' && (
                              <>
                                You are only able to view the branches selected
                                for your user account. If this is incorrect,
                                please contact the administrator to enable
                                access to more branches.
                              </>
                            )}
                          </p>{' '}
                          <div>
                            <button
                              className="appUserButtons"
                              style={{ marginRight: 'var(--20px-V)' }}
                              onClick={() => {
                                handleFetchBranches();
                              }}
                            >
                              Refresh
                            </button>
                            {appUsers.find(appUser => appUser.id === 'admin' || appUser.id === window.electron.store.get('SelectedAppUserId'))?.privileges.includes('add a branch') && (
                              <button
                                className="appUserButtons"
                                style={{ marginRight: 'var(--20px-V)' }}
                                onClick={() => setShowAddBranchModal(true)}
                            >
                                Add New Branch
                              </button>
                            )}
                            {Branches.length > 0 &&
                              window.electron.store.get('SelectedBranchId') !==
                                '' &&
                              window.electron.store.get('SelectedBranchId') && (
                                <button
                                  onClick={() =>
                                    setViewBranchManagementPage(false)
                                  }
                                >
                                  Back
                                </button>
                              )}
                          </div>
                        </div>

                        {isBranchesLoading ? (
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              minHeight: '200px',
                            }}
                          >
                            <img
                              src={loadingGif}
                              style={{
                                width: 'var(--50px-V)',
                                height: 'var(--50px-V)',
                              }}
                              alt="Loading branches..."
                            />
                          </div>
                        ) : (
                          <div
                            className="branch-list"
                            style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: 'var(--20px-V)',
                              overflowY: 'auto',
                            }}
                          >
                            {(window.electron.store.get('SelectedAppUserId') ===
                            'admin'
                              ? Branches
                              : Branches.filter((branch: any) =>
                                  appUsers
                                    .find(
                                      (appUser) =>
                                        appUser.id ===
                                        window.electron.store.get(
                                          'SelectedAppUserId'
                                        )
                                    )
                                    ?.AllowedBranches.includes(branch.id)
                                )
                            ).map((branch: any) => (
                              <div
                                key={branch.id}
                                className="branch-card"
                                style={{
                                  backgroundColor: 'var(--Secondary-Color20)',
                                  borderRadius: 'var(--12px-V)',
                                  padding: 'var(--25px-V)',
                                  width: 'var(--390px-V)',
                                  boxShadow:
                                    '0 var(--2px-V) var(--15px-V) rgba(0, 0, 0, 0.08)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: 'var(--20px-V)',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  cursor: 'default',
                                  border: '1px solid var(--Border-Color)',
                                  position: 'relative',
                                }}
                              >
                                {/* Header Section */}
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    borderBottom:
                                      '1px solid var(--Border-Color)',
                                    paddingBottom: 'var(--15px-V)',
                                  }}
                                >
                                  <h3
                                    style={{
                                      margin: 0,
                                      fontSize: 'var(--24px-V)',
                                      fontWeight: '600',
                                      color: 'var(--Text-Color)',
                                    }}
                                  >
                                    {branch.name}
                                  </h3>
                                  <div
                                    style={{
                                      display: 'flex',
                                      gap: 'var(--8px-V)',
                                    }}
                                  >
                                    <button
                                      className="appUserButtons"
                                      onClick={() => handleStartEdit(branch)}
                                      style={{
                                        padding: 'var(--8px-V) var(--12px-V)',
                                        fontSize: 'var(--14px-V)',
                                      }}
                                    >
                                      Edit
                                    </button>
                                    <button
                                      className="appUserButtons"
                                      onClick={() =>
                                        handleDeleteBranch(branch.id)
                                      }
                                      style={{
                                        padding: 'var(--8px-V) var(--12px-V)',
                                        fontSize: 'var(--14px-V)',
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </div>

                                {/* Info Sections */}
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--20px-V)',
                                  }}
                                >
                                  {/* Location Section */}
                                  <div
                                    style={{
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 'var(--5px-V)',
                                    }}
                                  >
                                    <h4
                                      style={{
                                        margin: 0,
                                        fontSize: 'var(--16px-V)',
                                        color: 'var(--Text-Color-80)',
                                        fontWeight: '600',
                                      }}
                                    >
                                      Location
                                    </h4>
                                    <p
                                      style={{
                                        margin: 0,
                                        fontSize: 'var(--15px-V)',
                                        color: 'var(--Text-Color-60)',
                                        lineHeight: '1.4',
                                      }}
                                    >
                                      {branch.location}
                                    </p>
                                  </div>

                                  {/* Building Stats Section */}
                                  <div
                                    style={{
                                      display: 'grid',
                                      gridTemplateColumns: 'repeat(2, 1fr)',
                                      gap: 'var(--15px-V)',
                                      backgroundColor:
                                        'var(--Background-Color)',
                                      padding: 'var(--15px-V)',
                                      borderRadius: 'var(--8px-V)',
                                      border: '1px solid var(--Border-Color)',
                                    }}
                                  >
                                    <StatItem
                                      label="Total Floors"
                                      value={branch.totalFloors || 0}
                                    />
                                    <StatItem
                                      label="Total Rooms"
                                      value={branch.totalRooms || 0}
                                    />
                                    <StatItem
                                      label="Total Tenants"
                                      value={branch.totalTenants || 0}
                                    />
                                    <StatItem
                                      label="Occupied Rooms"
                                      value={branch.occupiedRooms || 0}
                                    />
                                    <StatItem
                                      label="Vacant Rooms"
                                      value={branch.vacantRooms || 0}
                                    />
                                  </div>

                                  {/* Financial Section */}
                                  <div
                                    style={{
                                      backgroundColor:
                                        'var(--Background-Color)',
                                      padding: 'var(--15px-V)',
                                      borderRadius: 'var(--8px-V)',
                                      border: '1px solid var(--Border-Color)',
                                    }}
                                  >
                                    <h4
                                      style={{
                                        margin: 0,
                                        marginBottom: 'var(--10px-V)',
                                        fontSize: 'var(--16px-V)',
                                        color: 'var(--Text-Color-80)',
                                        fontWeight: '600',
                                      }}
                                    >
                                      Financial Overview
                                    </h4>
                                    <div
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                      }}
                                    >
                                      <FinancialItem
                                        label="This Month Revenue"
                                        value={
                                          branch.monthlyRevenue?.toLocaleString() ||
                                          0
                                        }
                                      />
                                      <FinancialItem
                                        label="This Month Expenses"
                                        value={
                                          branch.monthlyExpenses?.toLocaleString() ||
                                          0
                                        }
                                      />
                                      <FinancialItem
                                        label="This Month Profit"
                                        value={
                                          branch.monthlyProfit?.toLocaleString() ||
                                          0
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Actions Section */}
                                <div
                                  style={{
                                    marginTop: 'auto',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 'var(--10px-V)',
                                    borderTop: '1px solid var(--Border-Color)',
                                    paddingTop: 'var(--15px-V)',
                                  }}
                                >
                                  <button
                                    className="appUserButtons"
                                    onClick={() =>
                                      handleSelectBranch(branch.id)
                                    }
                                    style={{
                                      width: '100%',
                                      padding: 'var(--12px-V)',
                                      fontSize: 'var(--16px-V)',
                                      fontWeight: '500',
                                      background: 'var(--Primary-Color)',
                                      color: 'var(--Text-Color-Reverse)',
                                    }}
                                  >
                                    Select Branch
                                  </button>

                                  <label
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 'var(--8px-V)',
                                      fontSize: 'var(--14px-V)',
                                      color: 'var(--Text-Color-60)',
                                      justifyContent: 'center',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={branch?.lock || false}
                                      onChange={(e) => {
                                        setBranches((prev) =>
                                          prev.map((brancha) =>
                                            brancha.id === branch.id
                                              ? {
                                                  ...brancha,
                                                  lock: e.target.checked,
                                                }
                                              : brancha
                                          )
                                        );
                                      }}
                                      style={{ margin: 0 }}
                                    />
                                    Lock this PC to this branch
                                  </label>
                                </div>
                              </div>
                            ))}

                            {Branches.length === 0 && (
                              <div
                                style={{
                                  width: '100%',
                                  textAlign: 'center',
                                  padding: 'var(--20px-V)',
                                  color: 'var(--Text-Color-60)',
                                }}
                              >
                                No branches found. Click "Add New Branch" to
                                create one.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
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
                  username={username}
                  setUsername={setUsername}
                  setPassword={setPassword}
                  setSelectedAppUser={setSelectedAppUser}
                  setAppUserManagerShow={setAppUserManagerShow}
                  fetchBranches={handleShowBranches}
                  RefreshComponent={RefreshComponent}
                  setViewBranchManagementPage={setViewBranchManagementPage}
                />
              </div>
            )}
          </>
        )}
      </div>
      {showAddBranchModal && (
        <>
          {' '}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--Background-Color)',
                padding: 'var(--20px-V)',
                borderRadius: 'var(--8px-V)',
                width: 'var(--400px-V)',
                maxWidth: '90%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--20px-V)',
                }}
              >
                <h2 style={{ margin: 0 }}>Add New Branch</h2>
                <button
                  className="appUserButtons"
                  onClick={() => setShowAddBranchModal(false)}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 'var(--15px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Branch Name:
                </label>
                <input
                  type="text"
                  value={newBranchData.name}
                  onChange={(e) =>
                    setNewBranchData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Enter Branch Name"
                  style={{
                    width: '95%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--15px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Location:
                </label>
                <input
                  type="text"
                  value={newBranchData.location}
                  onChange={(e) =>
                    setNewBranchData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  placeholder="Enter Branch Location"
                  style={{
                    width: '95%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--15px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Description:
                </label>
                <textarea
                  value={newBranchData.description}
                  onChange={(e) =>
                    setNewBranchData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter Branch Description"
                  style={{
                    width: '95%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                    minHeight: '100px',
                    resize: 'none',
                  }}
                />
              </div>
              {/** <div style={{ marginBottom: 'var(--20px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Google Map Pin Point:
                </label>
                <iframe
                  width="100%"
                  height="450"
                  style={{
                    border: '1px solid var(--Text-Color-30)',
                    borderRadius: 'var(--4px-V)',
                  }}
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY
                    &q=Space+Needle,Seattle+WA`}
                  allowFullScreen
                  loading="lazy"
                ></iframe>
              </div> */}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--10px-V)',
                }}
              >
                <button
                  className="appUserButtons"
                  onClick={() => setShowAddBranchModal(false)}
                >
                  Cancel
                </button>
                <button
                  className="appUserButtons"
                  onClick={handleAddBranch}
                  disabled={isAddingBranch || !newBranchData.name.trim()}
                >
                  {isAddingBranch ? (
                    <img
                      src={loadingGif}
                      alt="Loading..."
                      style={{ width: '20px', height: '20px' }}
                    />
                  ) : (
                    'Add Branch'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
      {showEditBranchModal && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 9999,
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--Background-Color)',
                padding: 'var(--20px-V)',
                borderRadius: 'var(--8px-V)',
                width: 'var(--510px-V)',
                maxWidth: '90%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--20px-V)',
                }}
              >
                <h2 style={{ margin: 0 }}>Edit Branch</h2>
                <button
                  className="appUserButtons"
                  onClick={() => {
                    setShowEditBranchModal(false);
                    setEditingBranch(null);
                  }}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginBottom: 'var(--15px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Branch Name:
                </label>
                <input
                  type="text"
                  value={editingBranch?.name || ''}
                  onChange={(e) =>
                    setEditingBranch((prev) =>
                      prev
                        ? {
                            ...prev,
                            name: e.target.value,
                          }
                        : null
                    )
                  }
                  style={{
                    width: '100%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--15px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Location:
                </label>
                <input
                  type="text"
                  value={editingBranch?.location || ''}
                  onChange={(e) =>
                    setEditingBranch((prev) =>
                      prev
                        ? {
                            ...prev,
                            location: e.target.value,
                          }
                        : null
                    )
                  }
                  style={{
                    width: '100%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--15px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Description:
                </label>
                <textarea
                  value={editingBranch?.description || ''}
                  onChange={(e) =>
                    setEditingBranch((prev) =>
                      prev
                        ? {
                            ...prev,
                            description: e.target.value,
                          }
                        : null
                    )
                  }
                  style={{
                    width: '100%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                    minHeight: '100px',
                  }}
                />
              </div>

              {/** <div style={{ marginBottom: 'var(--20px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Google Map Pin Point:
                </label>
                <input
                  type="text"
                  value={editingBranch?.googleMapPinPoint || ''}
                  onChange={(e) =>
                    setEditingBranch((prev) =>
                      prev
                        ? {
                            ...prev,
                            googleMapPinPoint: e.target.value,
                          }
                        : null
                    )
                  }
                  style={{
                    width: '100%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                  }}
                />
              </div>*/}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 'var(--10px-V)',
                }}
              >
                <button
                  className="appUserButtons"
                  onClick={() => {
                    setShowEditBranchModal(false);
                    setEditingBranch(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="appUserButtons"
                  onClick={handleEditBranch}
                  disabled={isEditingBranch || !editingBranch?.name.trim()}
                >
                  {isEditingBranch ? (
                    <img
                      src={loadingGif}
                      alt="Loading..."
                      style={{ width: '20px', height: '20px' }}
                    />
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
});

export default React.memo(AccountManager);
// Helper components for consistent styling
const StatItem = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--2px-V)',
    }}
  >
    <span
      style={{
        fontSize: 'var(--13px-V)',
        color: 'var(--Text-Color-60)',
        fontWeight: '500',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 'var(--15px-V)',
        color: 'var(--Text-Color)',
        fontWeight: '600',
      }}
    >
      {value}
    </span>
  </div>
);

const FinancialItem = ({ label, value }) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--2px-V)',
    }}
  >
    <span
      style={{
        fontSize: 'var(--13px-V)',
        color: 'var(--Text-Color-60)',
        fontWeight: '500',
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: 'var(--16px-V)',
        color: 'var(--Text-Color)',
        fontWeight: '600',
      }}
    >
      ${value}
    </span>
  </div>
);
