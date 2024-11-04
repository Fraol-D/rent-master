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
  ViewBranchManagementPage: boolean;
  setViewBranchManagementPage: (newval: boolean) => void;
  SelectedBranchId: string;
  setSelectedBranchId: (newval: string) => void;
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

          await appUsersManagement();
          if (
            navigator.onLine &&
            window.electron.store.get('users')[0].Allowed
          ) {
            // setIsSyncing(true);
            // syncOnlineToLocalWithBool(
            //   allUsers[0].id,
            //   setIsSyncing,
            //   setSyncProgress,
            //   RefreshDataFromSqlite
            // );
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

  const [Branches, setBranches] = useState<BranchTypeWithData[]>([]);
  useEffect(() => {
    fetchBranches();
  }, [ViewBranchManagementPage]);
  const fetchBranches = async () => {
    if (ViewBranchManagementPage) {
      const branches = await getValuesWithSql_Online(
        'branches',
        `WHERE userId = '${SelectedUserId}'`
      );
      const branchesWithData = await Promise.all(
        branches.map(async (branch: BranchType) => {
          const allRooms = await getValuesWithSql_Online(
            'rooms',
            `WHERE branchId = '${branch.id}'`
          );
          const allTenants = await getValuesWithSql_Online(
            'tenants',
            `WHERE branchId = '${branch.id}'`
          );
          const totalRooms = allRooms.length;
          const totalFloors =
            Math.max(...allRooms.map((room: { floor: any }) => room.floor)) ===
            -Infinity
              ? 0
              : Math.max(...allRooms.map((room: { floor: any }) => room.floor));
          const totalTenants = allTenants.length;
          const occupiedRooms = allRooms.filter(
            (room: { tenantId: string }) => room.tenantId !== ''
          ).length;
          const vacantRooms = totalRooms - occupiedRooms;
          const unpaidPastPayments = 1000;
          const userAccountsWhichHaveAccess = ['user1', 'user2'];
          let monthlyRevenue = 0;
          const today = new Date();
          const currentMonth = today.getMonth();
          const currentYear = today.getFullYear();
          allTenants.forEach((tenant: tenant) => {
            const tenantStart = new Date(tenant.startTime * 1000);
            const room = allRooms.find(
              (room: RoomType) => room.tenantId === tenant.id
            );
            if (room && tenantStart <= today) {
              let paymentsThisMonth = 0;
              switch (room.PaymentCycleType) {
                case '30':
                  paymentsThisMonth =
                    Math.floor((today.getDate() - tenantStart.getDate()) / 30) +
                    1;
                  break;
                case '15':
                  paymentsThisMonth =
                    Math.floor((today.getDate() - tenantStart.getDate()) / 15) +
                    1;
                  break;
                case '7':
                  paymentsThisMonth =
                    Math.floor((today.getDate() - tenantStart.getDate()) / 7) +
                    1;
                  break;
                case 'daily':
                  paymentsThisMonth =
                    today.getDate() - tenantStart.getDate() + 1;
                  break;
                case 'monthly':
                  paymentsThisMonth = currentMonth - tenantStart.getMonth() + 1;
                  break;
                case 'weekly':
                  paymentsThisMonth =
                    Math.floor((today.getDate() - tenantStart.getDate()) / 7) +
                    1;
                  break;
                case 'custom':
                  paymentsThisMonth =
                    Math.floor(
                      (today.getDate() - tenantStart.getDate()) /
                        room.PaymentCycleCustomeDays
                    ) + 1;
                  break;
                case 'Annually':
                  paymentsThisMonth = currentYear - tenantStart.getFullYear();
                  break;
                default:
                  paymentsThisMonth = currentMonth - tenantStart.getMonth() + 1;
              }
              monthlyRevenue +=
                paymentsThisMonth * parseFloat(tenant.agreedPrice);
            }
          });
          return {
            ...branch,
            totalRooms,
            totalFloors,
            totalTenants,
            occupiedRooms,
            vacantRooms,
            monthlyRevenue,
            unpaidPastPayments,
            userAccountsWhichHaveAccess,
          };
        })
      );
      console.log(branchesWithData);
      setBranches(branchesWithData);
    }
  };
  const [showAddBranchModal, setShowAddBranchModal] = useState(false);
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [newBranchData, setNewBranchData] = useState<BranchType>({
    id: '',
    userId: '',
    name: '',
    location: '',
    description: '',
    googleMapPinPoint: '',
  });

  const handleAddBranch = async () => {
    try {
      setIsAddingBranch(true);

      const branchToAdd: BranchType = {
        ...newBranchData,
        id: uuidv4(),
        userId: SelectedUserId,
      };

      const result = await addValueOnline('branches', branchToAdd);

      if (result.success) {
        fetchBranches();
        // Reset form and close modal
        setNewBranchData({
          id: '',
          userId: '',
          name: '',
          location: '',
          description: '',
          googleMapPinPoint: '',
        });
        setShowAddBranchModal(false);
      } else {
        alert('Failed to add branch');
      }
    } catch (error) {
      console.error('Error adding branch:', error);
      alert('Error adding branch. Please check your connection.');
    } finally {
      setIsAddingBranch(false);
    }
  };

  const [editingBranch, setEditingBranch] = useState<BranchTypeWithData | null>(
    null
  );
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const handleEditBranch = async () => {
    if (!editingBranch) return;

    try {
      setIsEditingBranch(true);

      const originalBranch = Branches.find(
        (branch) => branch.id === editingBranch.id
      );
      if (!originalBranch) {
        throw new Error('Branch not found');
      }

      const updates = {
        name: editingBranch.name,
        location: editingBranch.location,
        description: editingBranch.description,
        googleMapPinPoint: editingBranch.googleMapPinPoint,
      };
      console.log('branches', editingBranch.id, 'name', updates.name);
      console.log('branches', editingBranch.id, 'location', updates.location);
      console.log('branches', editingBranch.id, 'description', updates.description);
      console.log('branches', editingBranch.id, 'googleMapPinPoint', updates.googleMapPinPoint);
      
      // Only update if values have changed
      if (originalBranch.name !== updates.name) {
        const result = await updateValueOnline(
          'branches',
          editingBranch.id,
          'name',
          updates.name
        );
        if (!result.success) throw new Error('Failed to update branch name');
      }

      if (originalBranch.location !== updates.location) {
        const result = await updateValueOnline(
          'branches',
          editingBranch.id,
          'location',
          updates.location
        );

        if (!result.success)
          throw new Error('Failed to update branch location');
      }

      if (originalBranch.description !== updates.description) {
        const result = await updateValueOnline(
          'branches',
          editingBranch.id,
          'description',
          updates.description
        );
        if (!result.success)
          throw new Error('Failed to update branch description');
      }

      if (originalBranch.googleMapPinPoint !== updates.googleMapPinPoint) {
        const result = await updateValueOnline(
          'branches',
          editingBranch.id,
          'googleMapPinPoint',
          updates.googleMapPinPoint
        );
        if (!result.success)
          throw new Error('Failed to update branch googleMapPinPoint');
      }

      // Update local state
      setBranches(
        Branches.map((branch) =>
          branch.id === editingBranch.id ? { ...branch, ...updates } : branch
        )
      );

      setShowEditBranchModal(false);
      setEditingBranch(null);
    } catch (error) {
      console.error('Error updating branch:', error);
      alert(
        'Error updating branch. Please check your connection and try again.'
      );
    } finally {
      setIsEditingBranch(false);
    }
  };
  const handleDeleteBranch = async (branchId: string) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    try {
      await deleteValueOnline('branches', branchId);

      fetchBranches();
    } catch (error) {
      alert(
        'Failed to delete branch. Please check your connection and try again.'
      );
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
                              className="appUserButtons"
                              onClick={() => setAppUserManagerShow(false)}
                              style={{ marginRight: 'var(--10px-V)' }}
                            >
                              Back
                            </button>
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
                            display: 'flex',
                            flexDirection: 'row',
                            overflowX: 'auto',
                          }}
                          className="appUserItemContainer"
                        >
                          <div style={{ display: 'flex' }}>
                            <div className="appUserItemM appUserItem">
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
                                        window.electron.store.get('users')[0]
                                          .id,
                                      addedDate: Date.now(),
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
                                Full system access with all privileges enabled
                              </p>
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
                                        style={{ fontSize: 'var(--25px-V)' }}
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
                                          width: 'var(--20px-V)',
                                          height: 'var(--20px-V)',
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
                                          width: 'var(--20px-V)',
                                          height: 'var(--20px-V)',
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
                          <div
                            style={{ color: 'red', marginTop: 'var(--10px-V)' }}
                          >
                            {privilegeError}
                          </div>
                        )}
                      </>
                    )
                  ) : ViewBranchManagementPage ? (
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
                        <h1 style={{ margin: 0 }}>Branch Management</h1>
                        <div>
                          <button
                            className="appUserButtons"
                            style={{ marginRight: 'var(--20px-V)' }}
                            onClick={() => setShowAddBranchModal(true)}
                          >
                            Add New Branch
                          </button>
                          <button
                            onClick={() => setViewBranchManagementPage(false)}
                          >
                            Back
                          </button>
                        </div>
                      </div>

                      <div
                        className="branch-list"
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: 'var(--20px-V)',
                          overflowY: 'auto',
                        }}
                      >
                        {Branches.map((branch) => (
                          <div
                            key={branch.id}
                            className="branch-card"
                            style={{
                              backgroundColor: 'var(--Secondary-Color20)',
                              borderRadius: 'var(--8px-V)',
                              padding: 'var(--20px-V)',
                              width: 'var(--321px-V)',
                              boxShadow:
                                'var(--0px-V) var(--4px-V) var(--4px-V) rgba(0, 0, 0, 0.1)',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                
                                marginBottom: 'var(--15px-V)',
                              }}
                            >
                              <h3
                                style={{ margin: 0, fontSize: 'var(--24px-V)' }}
                              >
                                {branch.name}
                              </h3>
                              <div>
                                <button
                                  className="appUserButtons"
                                  style={{ marginRight: 'var(--10px-V)' }}
                                  onClick={() => {
                                    setEditingBranch(branch);
                                    setShowEditBranchModal(true);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="appUserButtons"
                                  onClick={() => {
                                    handleDeleteBranch(branch.id);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                
                                marginBottom: 'var(--20px-V)',
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--18px-V)',
                                  
                                }}
                              >
                                Location
                              </h4>
                              <p
                                style={{
                                  fontSize: 'var(--16px-V)',
                                  color: 'var(--Text-Color-60)',
                                }}
                              >
                                {branch.location}
                              </p>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                
                                marginBottom: 'var(--20px-V)',
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--18px-V)',
                           
                                }}
                              >
                                Description
                              </h4>
                              <p
                                style={{
                                  fontSize: 'var(--16px-V)',
                                  color: 'var(--Text-Color-60)',
                                }}
                              >
                                {branch.description}
                              </p>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                
                                marginBottom: 'var(--20px-V)',
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--18px-V)',
                                 
                                }}
                              >
                                Building Statistics
                              </h4>
                              <ul
                                style={{
                                  margin: 'var(--5px-V) 0',
                                  listStyle: 'none',
                                  padding: 0,
                            
                                }}
                              >
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Total Floors: {branch.totalFloors || 0}
                                </li>
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Total Rooms: {branch.totalRooms || 0}
                                </li>
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Total Tenants: {branch.totalTenants || 0}
                                </li>
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Occupied Rooms: {branch.occupiedRooms || 0}
                                </li>
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Vacant Rooms: {branch.vacantRooms || 0}
                                </li>
                              </ul>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                
                                marginBottom: 'var(--20px-V)',
                              }}
                            >
                              <h4
                                style={{
                                  margin: 0,
                                  fontSize: 'var(--18px-V)',
                              
                                }}
                              >
                                Financial Overview
                              </h4>
                              <ul
                                style={{
                                  margin: 'var(--5px-V) 0',
                                  listStyle: 'none',
                                  padding: 0,
                 
                                }}
                              >
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Monthly Revenue: $
                                  {branch.monthlyRevenue?.toLocaleString() || 0}
                                </li>
                                <li
                                  style={{
                                    fontSize: 'var(--16px-V)',
                                    color: 'var(--Text-Color-60)',
                                  }}
                                >
                                  Unpaid Payments: $
                                  {branch.unpaidPastPayments?.toLocaleString() ||
                                    0}
                                </li>
                              </ul>
                            </div>

                            {branch.userAccountsWhichHaveAccess &&
                              branch.userAccountsWhichHaveAccess.length > 0 && (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    
                                    marginBottom: 'var(--20px-V)',
                                  }}
                                >
                                  <h4
                                    style={{
                                      margin: 0,
                                      fontSize: 'var(--18px-V)',
                                      
                                    }}
                                  >
                                    Shared Access
                                  </h4>
                                  <p
                                    style={{
                                      fontSize: 'var(--16px-V)',
                                      color: 'var(--Text-Color-60)',
                                    }}
                                  >
                                    {branch.userAccountsWhichHaveAccess.length}{' '}
                                    user(s) have access
                                  </p>
                                </div>
                              )}

                            <button
                              className="appUserButtons"
                              style={{ width: '100%' }}
                              onClick={() => {
                                setSelectedBranchId(branch.id);
                              }}
                            >
                              Select Branch
                            </button>
                           <div style={{display:"flex", justifyContent:"center", marginTop:"10px"}}> <input type="checkbox" name="Lock to branch" id="" checked={branch?.lock || false}  onChange={(e)=>{
                            setBranches((prev)=>prev.map((branch)=>branch.id===branch.id?{...branch, lock: e.target.checked}:branch))
                           }} /> Lock this pc to this branch</div>
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
                            No branches found. Click "Add New Branch" to create
                            one.
                          </div>
                        )}
                      </div>
                    </div>
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
                backgroundColor: 'var(--Secondary-Color20)',
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
                  value={newBranchData.location}
                  onChange={(e) =>
                    setNewBranchData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
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
                  value={newBranchData.description}
                  onChange={(e) =>
                    setNewBranchData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
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

              <div style={{ marginBottom: 'var(--20px-V)' }}>
                <label
                  style={{ display: 'block', marginBottom: 'var(--5px-V)' }}
                >
                  Google Map Pin Point:
                </label>
                <input
                  type="text"
                  value={newBranchData.googleMapPinPoint}
                  onChange={(e) =>
                    setNewBranchData((prev) => ({
                      ...prev,
                      googleMapPinPoint: e.target.value,
                    }))
                  }
                  style={{
                    width: '100%',
                    padding: 'var(--8px-V)',
                    borderRadius: 'var(--4px-V)',
                    border: '1px solid var(--Text-Color-30)',
                  }}
                />
              </div>

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

              <div style={{ marginBottom: 'var(--20px-V)' }}>
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
              </div>

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
