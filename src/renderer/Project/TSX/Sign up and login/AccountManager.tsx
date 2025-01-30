import { storageManager } from '../../../storeManager';
import React, { useEffect, useState } from 'react';
import SignUpPage from './SignupPage';
import LoginPage from './LoginPage';
import TrialExpiredPage from './TrialExpiredPage';
import { Input } from '../Helpers/CustomReactComponents';
import { v4 as uuidv4 } from 'uuid';
import {
  addValueOnline,
  deleteValueOnline,
  getAllUsers,
  getValuesFromOnlineDatabase,
  getValuesWithSql_Online,
  resetPassword,
  syncOnlineToLocalBranch,
  syncOnlineToLocalBranchWithBool,
  updateValueOnline,
  verifyCredentials,
} from '../../../../Backend/OnlineServerApis';
import NotAllowedScreen from './NotAllowedScreen';
import TrialEndedText from './TrialEndedText';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import DashboardPage from '../Pages/DashboardPage';
import { formatNumberWithSuffix } from '../Helpers/CurrencySign';
import { useAlert } from '../../../components/useAlert';
import { useConfirm } from '../../../components/useConfirm';
import { useGlobal } from 'renderer/components/GlobalContext';

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
  getBranchData: boolean;
  setGetBranchData: (newval: boolean) => void;
  SelectedAppUser: appUser;
  ProvidedInitialUsername: string;
  ForceSignUp: string;
  setSelectedPage: (newval: string) => void;
  isTryout: boolean;
  setInitialLoading: (newval: boolean) => void;
  initialLoading: boolean;
  IsAllowedState: boolean;
  setIsAllowedState: (newval: boolean) => void;
  setHasNotPaid: (newval: boolean) => void;
  hasNotPaid: boolean;
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
  setGetBranchData,
  getBranchData,
  hasNotPaid,
  SelectedAppUser,
  setHasNotPaid,
  ProvidedInitialUsername,
  setIsAllowedState,
  ForceSignUp,
  IsAllowedState,
  setSelectedPage,
  isTryout,
  initialLoading,
  setInitialLoading,
}: any) => {
  const [TrialExpiredState, setTrialExpiredState] = useState(false);
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

      'Edit expenses',
      'View tools page',
      'View rooms page',
    ];
    return mainTabs.some((tab) => privileges.includes(tab));
  };

  const [providedUserNameErrorMessage, setProvidedUserNameErrorMessage] =
    useState('');
  // Function to check if a user is signed in
  const checkIfSignedIn = async () => {
    const startTime = Date.now();
    const getSeconds = () => ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`[${getSeconds()}s] Starting checkIfSignedIn...`);
    setInitialLoading(true);

    if (isTryout) {
      setisSignedIn(true);
      setSelectedUserId('tryout');
      setIsAllowedState(true);
      setHasNotPaid(true);

      setAppUsers([
        {
          id: 'admin',
          roleName: 'admin',
          privileges: '',
          userId: 'tryout',
          addedDate: Date.now(),
          password: '',
          EnterWithPassword: false,
          AllowedBranches: 'ALL',
        },
      ]);
      setSelectedAppUser({
        id: 'admin',
        roleName: 'admin',
        privileges: '',
        userId: 'tryout',
        addedDate: Date.now(),
        AllowedBranches: 'ALL',
      });
      handleFetchBranches();
      setInitialLoading(false);

      return;
    }

    if (ProvidedInitialUsername === 'login') {
    } else if (ProvidedInitialUsername === 'signup') {
    }

    const allUsers = storageManager.get('users') || [];
    console.log(
      `[${getSeconds()}s] Got users from store:`,
      allUsers.length > 0
    );

    if (allUsers.length > 0) {
      try {
        console.log(`[${getSeconds()}s] Attempting online user check...`);
        const userCheck = async () => {
          console.log(`[${getSeconds()}s] Making online SQL query...`);
          const userONLINE = await getValuesWithSql_Online(
            'users',
            `WHERE id = '${allUsers[0].id}' AND password = '${allUsers[0].password}'`
          );
          console.log(`[${getSeconds()}s] Online SQL query complete`);
          return userONLINE;
        };

        console.log(
          `[${getSeconds()}s] Starting race between userCheck and timeout...`
        );
        const userONLINE = await Promise.race([
          userCheck(),
          timeoutPromise(25000),
        ]).catch((error) => {
          console.log(
            `[${getSeconds()}s] Online check failed or timed out:`,
            error
          );
          return null;
        });
        console.log(
          `[${getSeconds()}s] Race complete, userONLINE:`,
          !!userONLINE
        );

        if (!userONLINE && allUsers[0].Allowed) {
          console.log(`[${getSeconds()}s] Falling back to local data...`);
          setisSignedIn(true);
          setIsAllowedState(allUsers[0].Allowed);
          setHasNotPaid(true);
          setSelectedUserId(allUsers[0].id);

          if (!storageManager.get('SelectedAppUserId')) {
            console.log(`[${getSeconds()}s] Setting app user manager show`);
            setAppUserManagerShow(true);
          }
          console.log(`[${getSeconds()}s] Fetching branches...`);
          await handleFetchBranches();
          console.log(`[${getSeconds()}s] Managing app users...`);
          await appUsersManagement();
          setInitialLoading(false);
          console.log(`[${getSeconds()}s] Local fallback complete`);
          return;
        }

        if (userONLINE?.length === 1 || !navigator.onLine) {
          console.log(
            `[${getSeconds()}s] User verified online or offline mode`
          );
          setisSignedIn(true);

          const check = async () => {
            console.log(`[${getSeconds()}s] Starting user check...`);
            const userRaw = allUsers[0];

            if (userRaw.packageType === '7daytrial') {
              console.log(`[${getSeconds()}s] Checking trial status...`);
              if (userRaw.TrailEndDate < Date.now()) {
                setTrialExpiredState(true);
                console.log(`[${getSeconds()}s] Trial expired`);
              }

              if (userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 > Date.now()) {
                setTrialExpiredState(true);
                console.log(
                  `[${getSeconds()}s] Trial Has expired bc invalid date input`
                );
              }

              if (
                userRaw.TrailEndDate > Date.now() &&
                userRaw.TrailEndDate - 7 * 24 * 60 * 60 * 1000 < Date.now()
              ) {
                setTrialExpiredState(false);
                console.log(`[${getSeconds()}s] Trial is still active`);
              }
            }

            if (navigator.onLine) {
              console.log(
                `[${getSeconds()}s] Online mode - fetching latest user data...`
              );
              try {
                console.log(`[${getSeconds()}s] Got online user data`);
                setIsAllowedState(userONLINE[0].Allowed);
                setHasNotPaid(userONLINE[0].LockBcNotPaid || false);

                const updatedUsers = allUsers.map((user: any) =>
                  user.id === userRaw.id
                    ? {
                        ...user,
                        Allowed: userONLINE[0].Allowed,
                        LockBcNotPaid: userONLINE[0].LockBcNotPaid,
                      }
                    : user
                );
                storageManager.set('users', updatedUsers);
                setChangeMade(true);
                console.log(`[${getSeconds()}s] Updated local user data`);
              } catch (error) {
                console.log(
                  `[${getSeconds()}s] Error fetching online user data:`,
                  error
                );
                setIsAllowedState(userRaw.Allowed);
                setHasNotPaid(userRaw.LockBcNotPaid || false);
              }
            } else {
              console.log(
                `[${getSeconds()}s] Offline mode - using local allowed state`
              );
              setIsAllowedState(userRaw.Allowed);
              setHasNotPaid(userRaw.LockBcNotPaid || false);
            }
          };

          console.log(`[${getSeconds()}s] Running user check...`);
          await check();
          setSelectedUserId(allUsers[0].id);

          if (!storageManager.get('SelectedAppUserId')) {
            console.log(`[${getSeconds()}s] Setting app user manager show`);
            setAppUserManagerShow(true);
          }
          console.log(`[${getSeconds()}s] Fetching branches...`);
          await handleFetchBranches();
          console.log(`[${getSeconds()}s] Managing app users...`);
          await appUsersManagement();
          document.title = userONLINE[0].companyName + ' - RentMaster';

          if (
            navigator.onLine &&
            storageManager.get('users')[0].Allowed &&
            !ViewBranchManagementPage &&
            storageManager.get('SelectedBranchId') !== ''
          ) {
            console.log(
              `[${getSeconds()}s] Sync conditions met but sync disabled`
            );
            syncWithOnline(allUsers[0].id);
          }
        }
      } catch (error) {
        console.error(`[${getSeconds()}s] Error in checkIfSignedIn:`, error);
        if (allUsers[0].Allowed) {
          console.log(
            `[${getSeconds()}s] Error fallback - proceeding with local data`
          );
          setisSignedIn(true);
          setIsAllowedState(allUsers[0].Allowed);
          setHasNotPaid(allUsers[0].LockBcNotPaid || false);
          setSelectedUserId(allUsers[0].id);

          if (!storageManager.get('SelectedAppUserId')) {
            console.log(`[${getSeconds()}s] Setting app user manager show`);
            setAppUserManagerShow(true);
          }
          console.log(`[${getSeconds()}s] Fetching branches...`);
          await handleFetchBranches();
          console.log(`[${getSeconds()}s] Managing app users...`);
          await appUsersManagement();
        }
      }
    } else {
      console.log(`[${getSeconds()}s] No users found, setting signed in false`);
      setisSignedIn(false);
    }

    console.log(`[${getSeconds()}s] Setting initial loading false`);
    setInitialLoading(false);
  };
  const appUsersManagement = async () => {
    const startTime = Date.now();
    const getSeconds = () => ((Date.now() - startTime) / 1000).toFixed(2);

    if (navigator.onLine) {
      console.log(`[${getSeconds()}s] Online mode - fetching app users...`);
      const appUsers = await getValuesWithSql_Online(
        'app_users',
        `WHERE userId = '${storageManager.get('users')[0].id}'`
      );
      if (appUsers) {
        console.log(
          `[${getSeconds()}s] Got app users, updating local store...`
        );
        await storageManager.set('app_users', appUsers);
        setAppUsers(appUsers);
        if (storageManager.get('SelectedAppUserId')) {
          console.log(`[${getSeconds()}s] Setting selected app user...`);
          if (storageManager.get('SelectedAppUserId') == 'admin') {
            setSelectedAppUser({
              id: 'admin',
              roleName: 'admin',
              privileges: '',
              userId: storageManager.get('users')[0].id,
              addedDate: Date.now(),
              AllowedBranches: 'ALL',
            });
          } else {
            setSelectedAppUser(
              appUsers.find(
                async (user: any) =>
                  (await user.id) === storageManager.get('SelectedAppUserId')
              )
            );
          }
        }
      }
    } else {
      console.log(`[${getSeconds()}s] Offline mode - using local app users`);
      const appUsers = storageManager.get('app_users');

      setAppUsers(appUsers);
      if (storageManager.get('SelectedAppUserId')) {
        console.log(
          `[${getSeconds()}s] Setting selected app user from local data...`
        );
        if (storageManager.get('SelectedAppUserId') == 'admin') {
          setSelectedAppUser({
            id: 'admin',
            roleName: 'admin',
            privileges: '',
            userId: storageManager.get('users')[0].id,
            addedDate: Date.now(),
            AllowedBranches: 'ALL',
          });
        } else {
          setSelectedAppUser(
            appUsers.find(
              async (user: any) =>
                (await user.id) === storageManager.get('SelectedAppUserId')
            )
          );
        }
      }
    }
    console.log(`[${getSeconds()}s] App users management complete`);
  };
  const { isOnTutorial, setTutorialNewAppUserId, isMobileState } = useGlobal();
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
        userId: storageManager.get('users')[0].id,
        addedDate: Date.now(),
        AllowedBranches: Branches.map((branch) => branch.id).join(','),
      };
      handleEditUser(newAppUser);
      try {
        await addValueOnline('app_users', newAppUser);
        await appUsersManagement();
        if (isOnTutorial) setTutorialNewAppUserId(accountId);
        // Wait for the next render cycle and DOM update
        setTimeout(() => {
          const container = document.querySelector('.appUserItemContainer');
          const newUserElement = document.getElementById(`${accountId}`);

          if (container && newUserElement) {
            // Calculate scroll position to center the new element
            const containerWidth = container.clientWidth;
            const elementLeft = newUserElement.offsetLeft;
            const elementWidth = newUserElement.clientWidth;
            const scrollPosition =
              elementLeft - containerWidth / 2 + elementWidth / 2;

            // Smooth scroll to the new element
            container.scrollTo({
              left: scrollPosition,
              behavior: 'smooth',
            });

            // Add highlight effect
            newUserElement.style.transition = 'background-color 0.3s ease';
            newUserElement.style.backgroundColor = 'var(--Accent-Color50)';
            setTimeout(() => {
              newUserElement.style.backgroundColor = '';
            }, 1500);
          }
        }, 100); // Increased timeout to ensure DOM is updated
      } catch (error) {
        console.error('Error adding new user:', error);
        showAlert(
          'Failed to add new user. Please check your internet connection and try again.'
        );
      }
    } else {
      showAlert(
        'No internet connection. Please check your network and try again.'
      );
    }
  };

  // Effect to check sign in status when isSignedIn or Refresh changes
  useEffect(() => {
    checkIfSignedIn();
  }, [isSignedIn, Refresh]);
  const syncWithOnline = async (selectedUserId: string) => {
    if (window.electron) {
      if (navigator.onLine) {
        setIsSyncing(true);
        syncOnlineToLocalBranchWithBool(
          selectedUserId,
          storageManager.get('SelectedBranchId'),
          setIsSyncing,
          setSyncProgress,
          RefreshDataFromSqlite
        );
      }
    }
  };
  // Effect to check trial status when signed in
  useEffect(() => {
    if (isSignedIn === true && !isTryout) {
      const check = async () => {
        const users = storageManager.get('users') || [];
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
    const choice = await confirm('Are you sure you want to sign out.', {
      title: 'Delete Property',
      confirmText: 'Sign out',
      cancelText: 'Cancel',
      type: 'warning',
    });
    if (choice) {
      const usersId = await storageManager.get('users')[0].id;

      // await deleteValueOnline('users', usersId);

      signOutUserAndRestart();
    }
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
      <div className="signup-success-message-outer">
        {' '}
        <div className="signup-success-message">
          <div style={{ padding: 'var(--10px-V)', margin: 'var(--0px-V)' }}>
            <h2>
              Your account has been created. Please contact us to{' '}
              <strong>activate</strong> your account.
            </h2>{' '}
            Please contact the sales team to activate your account: <br />
            <br />
            <span className="activation-number">
              -{'>'} Call <strong> +2519 44 50 9999</strong>
            </span>
            <br />{' '}
            <span className="activation-number">
              -{'>'} Telegram <strong> @rent_master</strong>
            </span>
            <br />{' '}
            <span className="activation-number">
              -{'>'} Email: <strong> rentmaster.et@gmail.com</strong>
            </span>
            <br />
            <br />
            Try Refreshing{' '}
            <button
              onClick={() => {
                setLoading(true);
                checkIfSignedIn().finally(() => setLoading(false));
              }}
            >
              <p>Retry</p>{' '}
            </button>
            <div style={{ display: 'flex' }}></div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <p className="signOutAndIfNot">
            Signed into:{' '}
            <strong>{storageManager.get('users')[0].email || ''}</strong>
            ?
            <br />{' '}
            <a
              onClick={handleFullSignOutAndDeleteUser}
              style={{
                color: 'var(--Text-Color-Grey)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Sign out?
            </a>
          </p>
        </div>
        <br />
      </div>
    );
  };
  const AccountLockedBcNotPaid = ({
    TextBackgroundColorText,
    ThemeMode,
    handleSignOut,
    b454959BackgroundColor454959,
    ISallowedToUseAppStatus,
    LoadingGif,
    SignOut,
  }: any) => {
    return (
      <div className="signup-success-message-outer">
        {' '}
        <div className="signup-success-message">
          <div style={{ padding: 'var(--10px-V)', margin: 'var(--0px-V)' }}>
            <h2>Your account has been locked due to payment issues</h2> Please
            contact us to resolve this payment issue: <br />
            <br />
            <span className="activation-number">
              -{'>'} Call <strong> +2519 44 50 9999</strong>
            </span>
            <br />{' '}
            <span className="activation-number">
              -{'>'} Telegram <strong> @rent_master</strong>
            </span>
            <br />{' '}
            <span className="activation-number">
              -{'>'} Email: <strong> rentmaster.et@gmail.com</strong>
            </span>
            <br />
            <br />
            Once payment is confirmed, please retry signing in while connected
            to the internet. It's possible you're seeing this message due to a
            lack of internet connection.
            <button
              onClick={() => {
                setLoading(true);
                checkIfSignedIn().finally(() => setLoading(false));
              }}
            >
              <p>Retry</p>{' '}
            </button>
            <div style={{ display: 'flex' }}></div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px',
            textAlign: 'center',
          }}
        >
          <p className="signOutAndIfNot">
            Signed into:{' '}
            <strong>{storageManager.get('users')[0].email || ''}</strong>
            ?
            <br />{' '}
            <a
              onClick={handleFullSignOutAndDeleteUser}
              style={{
                color: 'var(--Text-Color-Grey)',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Sign out?
            </a>
          </p>
        </div>
        <br />
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
      const localUser = storageManager.get('users')[0];

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
      const localUser = storageManager.get('users')[0];

      try {
        const isValid = await verifyCredentials(
          localUser.email,
          PasswordCheckInput
        );

        if (isValid) {
          setIsTrueAdmin(true);
          setCheckIfTureAdmin(false);
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
      const localUser = storageManager.get('users')[0];

      try {
        const isValid = await verifyCredentials(
          localUser.email,
          PasswordCheckInput
        );

        if (isValid) {
          setViewBranchManagementPageNONAdm(false);
          storageManager.set('LockBranchToPc', false);
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
        if (
          !appUsers.some(
            (user) =>
              user.id !== userId &&
              user.roleName.toUpperCase() === editingUserName.toUpperCase()
          )
        ) {
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
          storageManager.set('app_users', updatedAppUsers);

          setEditingUserId(null);
          setEditingUserName('');
        } else {
          showAlert('You can not set the same username for another user.');
        }
      } catch (error) {
        console.error('Error updating user name:', error);
        showAlert(
          'Failed to update user name. Please check your internet connection and try again.'
        );
      }
    } else {
      showAlert(
        'No internet connection. Please check your network and try again.'
      );
    }
  };

  const handleCancelEdit = () => {
    setEditingUserId(null);
    setEditingUserName('');
  };
  const [deletingUser, setDeletingUser] = useState(false);
  const handleDeleteUser = async (userId: string) => {
    if (deletingUser) {
      if (navigator.onLine) {
        try {
          await deleteValueOnline('app_users', userId);
          await appUsersManagement();
        } catch (error) {
          console.error('Error deleting user:', error);
          showAlert(
            'Failed to delete user. Please check your internet connection and try again.'
          );
        }
      } else {
        showAlert(
          'No internet connection. Please check your network and try again.'
        );
      }
    } else {
      setDeletingUser(true);
    }
  };
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserName, setEditingUserName] = useState('');

  const handleSelectUser = (user: appUser) => {
    setSelectedAppUser(user);
    storageManager.set('SelectedAppUserId', user.id);
    setAppUserManagerShow(false);
    storageManager.set('SelectedBranchId', '');
    storageManager.set('BranchName', 'not selected');
    storageManager.set('LockBranchToPc', false);
    setViewBranchManagementPage(true);
  };

  const handleSavePrivileges = async () => {
    if (editingUser) {
      if (navigator.onLine) {
        try {
          const updatedAppUsers = appUsers.map((user) =>
            user.id === editingUser.id ? editingUser : user
          );
          storageManager.set('app_users', updatedAppUsers);
          await addValueOnline('app_users', editingUser);
          await appUsersManagement();
          setEditingUser(null);
        } catch (error) {
          console.error('Error saving privileges:', error);
          showAlert(
            'Failed to save privileges. Please check your internet connection and try again.'
          );
        }
      } else {
        showAlert(
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
        storageManager.set('app_users', updatedAppUsers);
      } catch (error) {
        console.error('Error updating privilege:', error);
        showAlert(
          'Failed to update privilege. Please check your internet connection and try again.'
        );
      } finally {
        setLoadingPrivileges((prev) => ({ ...prev, [loadingKey]: false }));
      }
    } else {
      showAlert(
        'No internet connection. Please check your network and try again.'
      );
    }
  };

  const privileges = [
    'View dashboard page', //
    'Edit expenses',
    'View tools page',
    'edit email templates',
    'edit sms templates',
    'view database', //
    'edit settings',
    'View rooms page',
    'View database', //
    'Add a room', //
    'Add a tenant',
    'edit room data', //
    'edit rent payments', //
    'edit utility payments', //
    'edit tenant room tenant info',
    'edit tenant room tenant portal',
    'edit tenant room agreement info',
    'edit tenant room utility settings',
    'edit tenant room attachments',
    'edit tenant room notification settings',
    'edit tenant room tenant stay',
    'manage properties',
  ];
  interface PrivilegeNode {
    name: string;
    children?: PrivilegeNode[];
  }

  const privilegeHierarchy: PrivilegeNode[] = [
    {
      name: 'View dashboard page',
    },

    { name: 'Edit expenses' },

    {
      name: 'View tools page',
      children: [
        { name: 'edit email templates' },
        { name: 'edit sms templates' },
        { name: 'view database' },
        { name: 'edit settings' },
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
        { name: 'edit tenant room tenant portal' },
        { name: 'edit tenant room agreement info' },
        { name: 'edit tenant room utility settings' },
        { name: 'edit tenant room attachments' },
        { name: 'edit tenant room notification settings' },
        { name: 'edit tenant room tenant stay' },
      ],
    },
    {
      name: 'manage properties',
    },
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
        <div style={{ display: 'flex', alignItems: 'center' }}>
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
      setAppUsers(
        appUsers.map((u) =>
          u.id === ChangingPasswordId ? { ...u, password: NewAdminPassword } : u
        )
      );
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
        storageManager.set('app_users', updatedAppUsers);
        await appUsersManagement();
      } catch (error) {
        console.error('Error updating privileges:', error);
        showAlert(
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
      showAlert(
        'No internet connection. Please check your network and try again.'
      );
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
        storageManager.set('app_users', updatedAppUsers);
        await appUsersManagement();
        setPrivilegeError('');
      } catch (error) {
        console.error('Error updating privileges:', error);
        showAlert(
          'Failed to update privileges. Please check your internet connection and try again.'
        );
      } finally {
        setIsUncheckingAll(false);
      }
    } else {
      showAlert(
        'No internet connection. Please check your network and try again.'
      );
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
        showAlert('Property name is required');
        return;
      }

      // Check if a branch with the same name already exists
      const existingBranch = Branches.find(
        (branch: any) => branch.name === newBranchData.name.trim()
      );
      if (existingBranch) {
        showAlert('A property with the same name already exists');
        return;
      }

      // First, check if we have a valid SelectedUserId
      if (!SelectedUserId) {
        throw new Error('No user ID selected');
      }

      const branchId = uuidv4();
      const branchToAdd = {
        id: branchId,
        name: newBranchData.name.trim(),
        location: newBranchData.location?.trim() || null,
        description: newBranchData.description?.trim() || null,
        googleMapPinPoint: newBranchData.googleMapPinPoint?.trim() || null,
        userId: SelectedUserId,
      };

      // Add to online database
      if (!isTryout) {
        const result = await addValueOnline('branches', branchToAdd);
        console.log('Add property result:', result);
      } else {
        if (Branches.length < 3) {
          await storageManager.set('Branches', [...Branches, branchToAdd]);
        } else {
          showAlert('You have reached the tryout limit of 3 properties');
          return;
        }
      }

      // If user is not admin, add branch to their allowed branches
      const currentUser = storageManager.get('SelectedAppUserId');
      if (currentUser !== 'admin') {
        const appUser = appUsers.find((user) => user.id === currentUser);
        if (appUser) {
          const cleanedBranches = appUser.AllowedBranches.split(',')
            .filter((branch) => branch.length === 36)
            .join(',');
          const updatedBranches = cleanedBranches + ',' + branchId;
          await updateValueOnline(
            'app_users',
            appUser.id,
            'AllowedBranches',
            updatedBranches
          );
          await appUsersManagement();
        }
      }

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
      showAlert('Property added successfully!', 'success');
    } catch (error: any) {
      console.error('Detailed error adding property:', error);
      showAlert(`Failed to add property: ${error.message}`);
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
    storageManager.set(
      'BranchName',
      Branches.find((branch) => branch.id === branchId)?.name || ''
    );
    storageManager.set('SelectedBranchId', branchId);
    if (Branches.find((branch) => branch.id === branchId)?.lock)
      storageManager.set('LockBranchToPc', true);
    else storageManager.set('LockBranchToPc', false);
    const tutorialPreferences = storageManager.get('tutorialPreferences') || {};
    if (!tutorialPreferences['rooms']) {
      setSelectedPage('Rooms');
    }
    setViewBranchManagementPage(false);
    if (!window.electron)  RefreshDataFromSqlite();
    if (window.electron) {
      if (navigator.onLine) {
        syncWithOnline(SelectedUserId);
      } else {
        RefreshDataFromSqlite();
      }
    } 
    
     
  };
  const [isEditingBranch, setIsEditingBranch] = useState(false);
  const [showEditBranchModal, setShowEditBranchModal] = useState(false);
  const handleEditBranch = async () => {
    if (!editingBranch?.id) return;

    try {
      setIsEditingBranch(true);

      // Validate required fields
      if (!editingBranch.name?.trim()) {
        showAlert('Property name is required');
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
      showAlert('Failed to update branch. Please try again.');
    } finally {
      setIsEditingBranch(false);
    }
  };
  const { confirm } = useConfirm();
  const handleDeleteBranch = async (branchId: string) => {
    const choice = await confirm(
      'Are you sure you want to delete this branch? This action is Irreversible.',
      {
        title: 'Delete Property',
        confirmText: 'Delete',
        cancelText: 'Cancel',
        type: 'danger',
      }
    );
    if (!choice) return;
    try {
      await deleteValueOnline('branches', branchId);
      setShowEditBranchModal(false);
      setEditingBranch(null);
      handleFetchBranches();
    } catch (error) {
      showAlert(
        'Failed to delete branch. Please check your connection and try again.'
      );
    }
  };
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);

  const handleFetchBranches = async () => {
    setIsBranchesLoading(true);
    const { maxBranches, currentBranches } = await getBranchLimitInfo();
    setBranchLimit(maxBranches);
    try {
      await fetchBranches();
    } finally {
      setIsBranchesLoading(false);
    }
  };
  const handleShowBranches = async () => {
    setViewBranchManagementPage(true);
    const { maxBranches, currentBranches } = await getBranchLimitInfo();
    setBranchLimit(maxBranches);
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
  const [BranchLimit, setBranchLimit] = useState(0);
  const getBranchLimitInfo = async () => {
    // Default response for offline/error cases
    const defaultResponse = {
      maxBranches: 0,
      currentBranches: 0,
    };

    // Check if online
    if (!navigator.onLine) {
      return defaultResponse;
    }

    // Get users from storage
    const users = storageManager.get('users');
    const currentUser = users?.[0];

    if (!currentUser) {
      return defaultResponse;
    }

    // Handle tryout mode
    if (isTryout) {
      return {
        maxBranches: 3,
        currentBranches: 1,
      };
    }

    try {
      // Get user branch limits and current branches
      const [userMaxBranches, AllBranches] = await Promise.all([
        getValuesWithSql_Online('users', `WHERE id = '${currentUser.id}'`),
        getValuesWithSql_Online(
          'branches',
          `WHERE userId = '${currentUser.id}'`
        ),
      ]);

      // If no user data found, return default
      if (!userMaxBranches?.length) {
        return defaultResponse;
      }

      // Return branch limits
      return {
        maxBranches: userMaxBranches[0].maxNumberOfBranches || 0,
        currentBranches: AllBranches?.length || 0,
      };
    } catch (error) {
      console.error('Error getting branch limits:', error);
      return defaultResponse;
    }
  };
  const { showAlert } = useAlert();

  const handleAddBranchFunction = async () => {
    try {
      const { maxBranches, currentBranches } = await getBranchLimitInfo();
      setBranchLimit(maxBranches);

      if (maxBranches <= currentBranches) {
        if (window.location.href.includes('tryout')) {
          showAlert(
            'You have reached the maximum number of properties allowed for now. Please sign up to add more properties.'
          );
          return;
        } else {
          showAlert(
            'You have reached the maximum number of properties allowed for now. Please contact support to increase your limit. +2519 4450 9999, or email rentmaster.et@gmail.com This is in case of data abuse',
            'error'
          );

          return;
        }
      }
      setShowAddBranchModal(true);
    } catch (error) {
      showAlert(
        'Failed to get user property limit. Please check your internet connection and try again.',
        'error'
      );
    }
  };
  const handleAllowEnterWithPassword = async (appUser: appUser) => {
    await updateValueOnline('app_users', appUser.id, 'EnterWithPassword', true);
    await appUsersManagement();
  };
  const handleDisallowEnterWithPassword = async (appUser: appUser) => {
    await updateValueOnline(
      'app_users',
      appUser.id,
      'EnterWithPassword',
      false
    );
    await appUsersManagement();
  };
  const [ShowAppUserSignInPanel, setShowAppUserSignInPanel] = useState(false);
  const [PasswordCheckInputAPPUSER, setPasswordCheckInputAPPUSER] =
    useState('');
  const [usernameCheckInputAPPUSER, setUsernameCheckInputAPPUSER] =
    useState('');
  const [isCheckingPasswordAPPUSER, setIsCheckingPasswordAPPUSER] =
    useState(false);
  const [SelectedToLoginWith, setSelectedToLoginWith] = useState('App User');

  const [passwordErrorAPPUSER, setPasswordErrorAPPUSER] = useState<
    string | null
  >(null);
  const handleSwitchUserInBranchManagement = async () => {
    if (storageManager.get('SelectedAppUserId') === 'admin') {
      setAppUserManagerShow(true);
    } else {
      setShowAppUserSignInPanel(true);
    }
  };
  useEffect(() => {
    setPasswordErrorAPPUSER(null);
  }, [SelectedToLoginWith]);
  const handleSwitchUserFromBranchManagement = async () => {
    setIsCheckingPasswordAPPUSER(true);
    try {
      const userId = storageManager.get('users')[0].id;
      const localUser = storageManager.get('users')[0];
      if (SelectedToLoginWith === 'Admin') {
        const isValid = await verifyCredentials(
          localUser.email,
          PasswordCheckInputAPPUSER
        );

        if (isValid) {
          handleSelectUser({
            id: 'admin',
            roleName: 'admin',
            privileges: '',
            userId: storageManager.get('users')[0].id,
            addedDate: Date.now(),
            AllowedBranches: 'ALL',
          });
          setShowAppUserSignInPanel(false);
          setViewBranchManagementPageNONAdm(false);
          storageManager.set('LockBranchToPc', false);
          showAlert('Admin login successful.', 'success');
        } else {
          setPasswordErrorAPPUSER('Incorrect password. Please try again.');
          showAlert('Incorrect password. Please try again.', 'error');
        }
      } else {
        const rolenameCurrent = appUsers.find(
          (appUser) => appUser.id === storageManager.get('SelectedAppUserId')
        )?.roleName;
        if (
          rolenameCurrent?.toLocaleLowerCase() ===
          usernameCheckInputAPPUSER.toLocaleLowerCase()
        ) {
          setPasswordErrorAPPUSER('You are currently signed in as this user.');
          setIsCheckingPasswordAPPUSER(false);
          return;
        }
        // Fetch user data if credentials are valid
        const getAppUser = await getValuesWithSql_Online(
          'app_users',
          `WHERE roleName = "${usernameCheckInputAPPUSER}" AND password = "${PasswordCheckInputAPPUSER}" AND userId = '${userId}'`
        );

        if (getAppUser.length > 0) {
          if (getAppUser[0].EnterWithPassword) {
            setSelectedAppUser(getAppUser[0]);
            storageManager.set('SelectedAppUserId', getAppUser[0].id);

            await appUsersManagement();
            setShowAppUserSignInPanel(false);
            showAlert('AppUser login successful.', 'success');
          } else {
            setPasswordErrorAPPUSER(
              'This AppUser is not allowed to enter with password. Please contact Administrator.'
            );
            showAlert(
              'This AppUser is not allowed to enter with password. Please contact Administrator.',
              'error'
            );
          }
        } else {
          setPasswordErrorAPPUSER('Invalid Username or password');
          showAlert('Invalid Username or password', 'error');
        }
      }
    } finally {
      setIsCheckingPasswordAPPUSER(false);
      setPasswordCheckInputAPPUSER('');
    }
  };
  const [ForgotPasswordScreen, setForgotPasswordScreen] = useState(false);
  const ForgotPassword = () => {
    setForgotPasswordScreen(true);
  };
  const [ForgotPasswordLoading, setForgotPasswordLoading] = useState(false);
  const [resetPasswordEmailSent, setResetPasswordEmailSent] = useState(false);
  const handleForgotPassword = async () => {
    console.log('submit', email);
    setForgotPasswordLoading(true);
    const response = await resetPassword(email);
    console.log(response);
    setForgotPasswordLoading(false);
    setResetPasswordEmailSent(true);
  };
  const handleSwitchUserFromMainAPP = async () => {
    setIsCheckingPasswordAPPUSER(true);

    try {
      const userId = storageManager.get('users')[0].id;
      const localUser = storageManager.get('users')[0];
      if (SelectedToLoginWith === 'Admin') {
        const isValid = await verifyCredentials(
          localUser.email,
          PasswordCheckInputAPPUSER
        );

        if (isValid) {
          handleSelectUser({
            id: 'admin',
            roleName: 'admin',
            privileges: '',
            userId: storageManager.get('users')[0].id,
            addedDate: Date.now(),
            AllowedBranches: 'ALL',
          });
          //setShowAppUserSignInPanel(false);
          setAppUserManagerShow(false);
          setViewBranchManagementPageNONAdm(false);
          setViewBranchManagementPage(false);

          storageManager.set('LockBranchToPc', false);
          showAlert('Admin login successful.', 'success');
        } else {
          setPasswordErrorAPPUSER('Incorrect password. Please try again.');
          showAlert('Incorrect password. Please try again.', 'error');
        }
      } else {
        const rolenameCurrent = appUsers.find(
          (appUser) => appUser.id === storageManager.get('SelectedAppUserId')
        )?.roleName;
        if (
          rolenameCurrent?.toLocaleLowerCase() ===
          usernameCheckInputAPPUSER.toLocaleLowerCase()
        ) {
          setPasswordErrorAPPUSER('You are currently signed in as this user.');
          setIsCheckingPasswordAPPUSER(false);
          return;
        }
        // Fetch user data if credentials are valid
        const getAppUser = await getValuesWithSql_Online(
          'app_users',
          `WHERE roleName = "${usernameCheckInputAPPUSER}" AND password = "${PasswordCheckInputAPPUSER}" AND userId = '${userId}'`
        );

        if (getAppUser.length > 0) {
          if (getAppUser[0].EnterWithPassword) {
            setSelectedAppUser(getAppUser[0]);
            storageManager.set('SelectedAppUserId', getAppUser[0].id);

            await appUsersManagement();
            //setShowAppUserSignInPanel(false);
            setAppUserManagerShow(false);
            showAlert('AppUser login successful.', 'success');
          } else {
            setPasswordErrorAPPUSER(
              'This AppUser is not allowed to enter with password. Please contact Administrator.'
            );
            showAlert(
              'This AppUser is not allowed to enter with password. Please contact Administrator.',
              'error'
            );
          }
        } else {
          setPasswordErrorAPPUSER('Invalid Username or password');
          showAlert('Invalid Username or password', 'error');
        }
      }
    } finally {
    }
    setIsCheckingPasswordAPPUSER(false);
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
      <div style={{ height: '100%' }}>
        {!initialLoading && (
          <>
            {ForceSignUp === '' ? (
              isSignedIn ? (
                TrialExpiredState ? (
                  <TrialEndedText />
                ) : IsAllowedState ? (
                  !hasNotPaid ? (
                    <AccountLockedBcNotPaid />
                  ) : (
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
                                Please enter the account password to see App
                                user passwords
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
                              position: 'fixed',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.5)',
                              zIndex: 100,
                            }}
                          >
                            <div
                              style={{
                                position: 'absolute',
                                top: '50%',
                                display: 'flex',
                                width: 'var(--330px-V)',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                backgroundColor: 'var(--Background-Color)',
                                padding: 'var(--20px-V)',
                                borderRadius: 'var(--10px-V)',
                                transition: 'transform 0.2s ease 0s',
                              }}
                            >
                              <h1
                                style={{
                                  marginBottom: 'var(--10px-V)',
                                  marginTop: '0px',
                                }}
                              >
                                Switch App User
                              </h1>
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
                                  onClick={() =>
                                    setSelectedToLoginWith('Admin')
                                  }
                                >
                                  Admin
                                </button>
                                <button
                                  style={{
                                    border:
                                      SelectedToLoginWith === 'App User'
                                        ? 'var(--3px-V) solid var(--Accent-Color)'
                                        : 'none',
                                  }}
                                  onClick={() =>
                                    setSelectedToLoginWith('App User')
                                  }
                                >
                                  App user
                                </button>
                              </div>
                              {SelectedToLoginWith !== 'Admin' && (
                                <input
                                  type="text"
                                  placeholder="Username"
                                  value={usernameCheckInputAPPUSER}
                                  onChange={(e) =>
                                    setUsernameCheckInputAPPUSER(e.target.value)
                                  }
                                  className="userName-input"
                                  style={{ marginBottom: 'var(--10px-V)' }}
                                />
                              )}
                              <input
                                type="password"
                                placeholder={
                                  SelectedToLoginWith === 'Admin'
                                    ? 'Enter Admin Password'
                                    : 'Password'
                                }
                                value={PasswordCheckInputAPPUSER}
                                onChange={(e) =>
                                  setPasswordCheckInputAPPUSER(e.target.value)
                                }
                                className="userName-input"
                                style={{ marginBottom: 'var(--20px-V)' }}
                              />{' '}
                              {passwordErrorAPPUSER && (
                                <p
                                  style={{
                                    color: 'red',
                                    marginBottom: 'var(--10px-V)',
                                  }}
                                >
                                  {passwordErrorAPPUSER}
                                </p>
                              )}
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  justifyContent: 'space-around',
                                  width: '100%',
                                }}
                              >
                                <button
                                  style={{
                                    width: 'var(--150px-V)',
                                    marginRight: 'var(--10px-V)',
                                  }}
                                  onClick={() => setAppUserManagerShow(false)}
                                >
                                  Cancel
                                </button>
                                <button
                                  style={{
                                    width: 'var(--150px-V)',
                                    display: 'flex',
                                    justifyContent: 'center',
                                  }}
                                  onClick={() => {
                                    handleSwitchUserFromMainAPP();
                                    setPasswordCheckInput('');
                                    setPasswordCheckInputAPPUSER('');
                                  }}
                                >
                                  Sign in{' '}
                                  {isCheckingPasswordAPPUSER && (
                                    <img
                                      src={loadingGif}
                                      alt="Loading..."
                                      style={{ width: '20px', height: '20px' }}
                                    />
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{
                              height: '100%',
                              width: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-start',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',

                                padding: 'var(--20px-V)',
                              }}
                            >
                              <div>
                                <h1
                                  style={{ margin: 0 }}
                                  id="App-User-Manager-Title"
                                >
                                  User Management
                                </h1>
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

                                <button
                                  className="appUserButtons"
                                  onClick={handleAddNewAppUser}
                                  id="app-user-buttons"
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
                              <div
                                style={{ display: 'flex' }}
                                className="abcScroll"
                                id="app-user-list"
                              >
                                <div className="appUserItemM appUserItem">
                                  <div>
                                    <div className="appUserHeader">
                                      <span
                                        style={{ fontSize: 'var(--25px-V)' }}
                                      >
                                        Admin
                                      </span>
                                      <button
                                        className="appUserButtons"
                                        style={{
                                          backgroundColor:
                                            'var(--Primary-Color)',
                                          color: 'var(--Text-Color-Reverse)',
                                        }}
                                        onClick={() =>
                                          handleSelectUser({
                                            id: 'admin',
                                            roleName: 'admin',
                                            privileges: '',
                                            userId:
                                              storageManager.get('users')[0].id,
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
                                      Full access to all properties.
                                    </p>
                                  </div>
                                </div>
                                {appUsers
                                  .sort((a, b) =>
                                    a.roleName.localeCompare(b.roleName)
                                  )
                                  .map((appUser) => (
                                    <div
                                      id={`${appUser.id}`}
                                      className="appUserItem"
                                    >
                                      <div>
                                        <div
                                          className="appUserHeader"
                                          style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'flex-start',
                                            flexDirection:
                                              editingUserId === appUser.id
                                                ? 'column'
                                                : 'row',
                                          }}
                                        >
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
                                                  width: '99%',
                                                  marginBottom: '10px',
                                                }}
                                                id={
                                                  appUser.id +
                                                  ' app-user-edit-name-input'
                                                }
                                              />

                                              <div>
                                                <button
                                                  className="appUserButtons"
                                                  onClick={() =>
                                                    handleSaveEdit(appUser.id)
                                                  }
                                                  id={
                                                    appUser.id +
                                                    ' app-user-edit-name-save'
                                                  }
                                                >
                                                  Save
                                                </button>
                                                <button
                                                  className="appUserButtons"
                                                  onClick={() =>
                                                    handleDeleteUser(appUser.id)
                                                  }
                                                >
                                                  {deletingUser
                                                    ? 'Confirm Delete'
                                                    : 'Delete'}
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
                                              <div
                                                id={
                                                  appUser.id +
                                                  ' app-user-edit-select'
                                                }
                                              >
                                                <button
                                                  className="appUserButtons"
                                                  onClick={() =>
                                                    handleSelectUser(appUser)
                                                  }
                                                  style={{
                                                    marginLeft: '0px',
                                                    backgroundColor:
                                                      'var(--Primary-Color)',
                                                    color:
                                                      'var(--Text-Color-Reverse)',
                                                  }}
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
                                              </div>
                                            </>
                                          )}
                                        </div>
                                        <div
                                          className="privileges-list"
                                          id={appUser.id + ' privileges-list'}
                                        >
                                          {privilegeHierarchy.map(
                                            (privilege) => (
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
                                            )
                                          )}
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
                                      <div
                                        id={
                                          appUser.id +
                                          ' appuser-properties-list'
                                        }
                                      >
                                        <h2
                                          style={{
                                            textAlign: 'left',
                                            width: '100%',
                                            marginBottom: 'var(--10px-V)',
                                          }}
                                        >
                                          Allowed Properties{' '}
                                          <div>
                                            <select
                                              name=""
                                              key={`select-${appUser.id}`}
                                              id=""
                                              onChange={(e) => {
                                                setSelectedBranchIdADD(
                                                  e.target.value
                                                );
                                              }}
                                              value={SelectedBranchIdADD}
                                              style={{
                                                marginRight: 'var(--10px-V)',
                                                padding: 'var(--5px-V)',
                                              }}
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
                                                  <option
                                                    value={branch.id}
                                                    key={branch.id}
                                                  >
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
                                              {!AddBranchToUserIsAdding &&
                                                'Add'}
                                            </button>
                                          </div>
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

                                        {appUser.AllowedBranches.match(
                                          /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g
                                        )?.map((branchId: string) => (
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

                                              marginBottom: 'var(--5px-V)',

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
                                        ))}
                                      </div>
                                      <hr
                                        style={{
                                          width: '100%',
                                          marginBottom: '0px',
                                        }}
                                      />
                                      <div
                                        id={
                                          appUser.id +
                                          ' appuser-account-password'
                                        }
                                      >
                                        <h2
                                          style={{
                                            textAlign: 'left',
                                            width: '100%',
                                            marginBottom: 'var(--10px-V)',
                                            marginTop: 'var(--10px-V)',
                                          }}
                                        >
                                          Password Settings
                                        </h2>

                                        {appUser.EnterWithPassword ? (
                                          <div>
                                            <div
                                              style={{
                                                marginBottom: 'var(--10px-V)',
                                              }}
                                            >
                                              <button
                                                onClick={() =>
                                                  setIsTrueAdmin(!IsTrueAdmin)
                                                }
                                                style={{
                                                  marginRight: 'var(--10px-V)',
                                                }}
                                              >
                                                {IsTrueAdmin
                                                  ? 'Hide Password'
                                                  : 'Show Password'}
                                              </button>
                                              <span>
                                                Current Password:{' '}
                                                {IsTrueAdmin
                                                  ? appUser.password
                                                  : '********'}
                                              </span>
                                            </div>

                                            <div
                                              style={{
                                                display: 'flex',
                                                gap: 'var(--10px-V)',
                                              }}
                                            >
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

                                              {ChangingPasswordId !==
                                                appUser.id && (
                                                <button
                                                  onClick={() =>
                                                    handleDisallowEnterWithPassword(
                                                      appUser
                                                    )
                                                  }
                                                >
                                                  Disable Password Login
                                                </button>
                                              )}

                                              {ChangingPasswordId ===
                                                appUser.id && (
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    gap: 'var(--10px-V)',
                                                  }}
                                                >
                                                  <input
                                                    type="text"
                                                    placeholder="Enter new password"
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
                                                    onClick={
                                                      handleApplyPASSWORD
                                                    }
                                                  >
                                                    Save
                                                  </button>
                                                  <button
                                                    onClick={() =>
                                                      setChangingPasswordId('')
                                                    }
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ) : (
                                          <div>
                                            <span>
                                              Password login is currently
                                              disabled
                                            </span>
                                            <button
                                              onClick={() => {
                                                if (!IsTrueAdmin) {
                                                  setCheckIfTureAdmin(true);
                                                }
                                                if (IsTrueAdmin) {
                                                  handleAllowEnterWithPassword(
                                                    appUser
                                                  );
                                                  if (!appUser.password) {
                                                    setChangingPasswordId(
                                                      appUser.id
                                                    );
                                                  }
                                                }
                                              }}
                                            >
                                              Enable Password Login
                                            </button>
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
                                <h1
                                  id="Property-Management-Title"
                                  style={{ margin: 0 }}
                                >
                                  Property Management
                                </h1>
                                <p
                                  id="Property-Management-switchUser"
                                  style={{ width: 'max-content' }}
                                >
                                  {' '}
                                  {!isTryout &&
                                    (storageManager.get('SelectedAppUserId') ===
                                    'admin' ? (
                                      <>
                                        Admin -{' '}
                                        <button
                                          onClick={
                                            handleSwitchUserInBranchManagement
                                          }
                                        >
                                          Go to App Users
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        {
                                          appUsers.find(
                                            (appUser) =>
                                              appUser.id ===
                                              storageManager.get(
                                                'SelectedAppUserId'
                                              )
                                          )?.roleName
                                        }{' '}
                                        -{' '}
                                        <button
                                          onClick={
                                            handleSwitchUserInBranchManagement
                                          }
                                        >
                                          Switch user
                                        </button>
                                      </>
                                    ))}
                                </p>
                              </div>
                              {isMobileState ? (
                                <></>
                              ) : (
                                <p style={{ width: '40%' }}>
                                  {storageManager.get('SelectedAppUserId') !==
                                    'admin' && (
                                    <>
                                      You are only able to view the properties
                                      selected for your user account. If this is
                                      incorrect, please contact the
                                      administrator to enable access to more
                                      properties.
                                    </>
                                  )}
                                </p>
                              )}{' '}
                              <div
                                id="Property-Management-Buttons"
                                style={{
                                  display: 'flex',
                                  gap: 'var(--15px-V)',
                                  alignItems: 'center',
                                  padding: 'var(--10px-V)',
                                  flexDirection: isMobileState
                                    ? 'column-reverse'
                                    : 'row',
                                }}
                              >
                                {/* {(storageManager.get('SelectedAppUserId') ===
                                  'admin' ||
                                  appUsers
                                    .find(
                                      (appUser) =>
                                        appUser.id ===
                                        storageManager.get('SelectedAppUserId')
                                    )
                                    ?.privileges.includes('manage properties')) && (
                                  <>
                                    Limit {Branches.length}/{BranchLimit}
                                  </>
                                )} */}
                                <button
                                  onClick={() => {
                                    handleFetchBranches();
                                  }}
                                  id="property-refresh-btn"
                                >
                                  Refresh
                                </button>
                                {storageManager.get('SelectedAppUserId') ===
                                  'admin' ||
                                appUsers
                                  .find(
                                    (appUser) =>
                                      appUser.id === 'admin' ||
                                      appUser.id ===
                                        storageManager.get('SelectedAppUserId')
                                  )
                                  ?.privileges.includes('manage properties') ? (
                                  <button
                                    style={{ margin: 'none' }}
                                    onClick={() => handleAddBranchFunction()}
                                    id="property-add-btn"
                                  >
                                    Add New Property
                                  </button>
                                ) : (
                                  <></>
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
                                  zIndex: '1000',
                                }}
                              >
                                <img
                                  src={loadingGif}
                                  style={{
                                    width: 'var(--50px-V)',
                                    height: 'var(--50px-V)',
                                  }}
                                  alt="Loading properties..."
                                />
                              </div>
                            ) : (
                              <div
                                className="branch-list"
                                id="Property-Management-List"
                                style={{
                                  display: 'flex',
                                  flexWrap: 'wrap',
                                  gap: 'var(--20px-V)',
                                  overflowY: 'auto',
                                  justifyContent: isMobileState
                                    ? 'center'
                                    : 'flex-start',
                                }}
                              >
                                {!Array.isArray(Branches) ? (
                                  <div>Loading properties...</div>
                                ) : Branches.length === 0 ? (
                                  <div>No properties available</div>
                                ) : Branches.filter(
                                    (branch: any) =>
                                      storageManager.get(
                                        'SelectedAppUserId'
                                      ) === 'admin' ||
                                      appUsers
                                        .find(
                                          (appUser) =>
                                            appUser.id ===
                                            storageManager.get(
                                              'SelectedAppUserId'
                                            )
                                        )
                                        ?.AllowedBranches.includes(branch.id)
                                  ).length === 0 ? (
                                  <div>
                                    Could not find any properties. Please try
                                    clicking refresh.
                                  </div>
                                ) : (
                                  Branches.filter(
                                    (branch: any) =>
                                      storageManager.get(
                                        'SelectedAppUserId'
                                      ) === 'admin' ||
                                      appUsers
                                        .find(
                                          (appUser) =>
                                            appUser.id ===
                                            storageManager.get(
                                              'SelectedAppUserId'
                                            )
                                        )
                                        ?.AllowedBranches.includes(branch.id)
                                  ).map((branch: any) => (
                                    <div
                                      key={branch.id}
                                      className="branch-card"
                                      style={{
                                        backgroundColor:
                                          'var(--Secondary-Color20)',
                                        borderRadius: 'var(--12px-V)',
                                        padding: 'var(--25px-V)',
                                        width: 'var(--390px-V)',
                                        boxShadow:
                                          '0 var(--2px-V) var(--15px-V) rgba(0, 0, 0, 0.08)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: 'var(--20px-V)',
                                        transition:
                                          'transform 0.2s, box-shadow 0.2s',
                                        cursor: 'default',
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
                                            onClick={() =>
                                              handleStartEdit(branch)
                                            }
                                            style={{
                                              padding:
                                                'var(--8px-V) var(--12px-V)',
                                              fontSize: 'var(--14px-V)',
                                            }}
                                          >
                                            Edit
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
                                        {getBranchData && (
                                          <>
                                            <div
                                              style={{
                                                display: 'grid',
                                                gridTemplateColumns:
                                                  'repeat(2, 1fr)',
                                                gap: 'var(--15px-V)',
                                                backgroundColor:
                                                  'var(--Background-Color)',
                                                padding: 'var(--15px-V)',
                                                borderRadius: 'var(--8px-V)',
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
                                                value={
                                                  branch.occupiedRooms || 0
                                                }
                                              />
                                              <StatItem
                                                label="Vacant Rooms"
                                                value={branch.vacantRooms || 0}
                                              />
                                            </div>

                                            {/* Financial Section */}
                                            {storageManager.get(
                                              'SelectedAppUserId'
                                            ) === 'admin' ||
                                            appUsers
                                              .find(
                                                (appUser) =>
                                                  appUser.id ===
                                                  storageManager.get(
                                                    'SelectedAppUserId'
                                                  )
                                              )
                                              ?.privileges.includes(
                                                'View dashboard page'
                                              ) ? (
                                              <div
                                                style={{
                                                  backgroundColor:
                                                    'var(--Background-Color)',
                                                  padding: 'var(--15px-V)',
                                                  borderRadius: 'var(--8px-V)',
                                                }}
                                              >
                                                <h4
                                                  style={{
                                                    margin: 0,
                                                    marginBottom:
                                                      'var(--10px-V)',
                                                    fontSize: 'var(--16px-V)',
                                                    color:
                                                      'var(--Text-Color-80)',
                                                    fontWeight: '600',
                                                  }}
                                                >
                                                  Financial Overview
                                                </h4>
                                                <div
                                                  style={{
                                                    display: 'flex',
                                                    justifyContent:
                                                      'space-between',
                                                  }}
                                                >
                                                  <FinancialItem
                                                    label="This Month Revenue"
                                                    value={
                                                      formatNumberWithSuffix(
                                                        branch.monthlyRevenue?.toLocaleString()
                                                      ) || 0
                                                    }
                                                  />
                                                  <FinancialItem
                                                    label="This Month Expenses"
                                                    value={
                                                      formatNumberWithSuffix(
                                                        branch.monthlyExpenses?.toLocaleString()
                                                      ) || 0
                                                    }
                                                  />
                                                  <FinancialItem
                                                    label="This Month Profit"
                                                    value={
                                                      formatNumberWithSuffix(
                                                        branch.monthlyProfit?.toLocaleString()
                                                      ) || 0
                                                    }
                                                  />
                                                </div>
                                              </div>
                                            ) : (
                                              <></>
                                            )}
                                          </>
                                        )}
                                      </div>

                                      {/* Actions Section */}
                                      <div
                                        style={{
                                          marginTop: 'auto',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: 'var(--10px-V)',
                                          borderTop:
                                            '1px solid var(--Border-Color)',
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
                                          Manage Property
                                        </button>
                                      </div>
                                    </div>
                                  ))
                                )}
                                {!isMobileState ? (
                                  <></>
                                ) : (
                                  <p style={{ width: '80%' }}>
                                    {storageManager.get('SelectedAppUserId') !==
                                      'admin' && (
                                      <p
                                        style={{
                                          color: 'var(--Text-Color-Grey)',
                                        }}
                                      >
                                        You are only able to view the properties
                                        selected for your user account.
                                      </p>
                                    )}
                                  </p>
                                )}
                                {Math.abs(
                                  Branches &&
                                    Branches.length > 0 &&
                                    Branches.filter(
                                      (branch: any) =>
                                        storageManager.get(
                                          'SelectedAppUserId'
                                        ) === 'admin' ||
                                        appUsers
                                          .find(
                                            (appUser) =>
                                              appUser.id ===
                                              storageManager.get(
                                                'SelectedAppUserId'
                                              )
                                          )
                                          ?.AllowedBranches.includes(branch.id)
                                    ).length - Branches.length
                                ) === 0
                                  ? ''
                                  : Math.abs(
                                      Branches &&
                                        Branches.length > 0 &&
                                        Branches.filter(
                                          (branch: any) =>
                                            storageManager.get(
                                              'SelectedAppUserId'
                                            ) === 'admin' ||
                                            appUsers
                                              .find(
                                                (appUser) =>
                                                  appUser.id ===
                                                  storageManager.get(
                                                    'SelectedAppUserId'
                                                  )
                                              )
                                              ?.AllowedBranches.includes(
                                                branch.id
                                              )
                                        ).length - Branches.length
                                    ) + ' Hidden'}

                                {Branches && Branches.length === 0 && (
                                  <div
                                    style={{
                                      width: '100%',
                                      textAlign: 'center',
                                      padding: 'var(--20px-V)',
                                      color: 'var(--Text-Color-60)',
                                    }}
                                  >
                                    No Property found. Click "Add New Property"
                                    to create one.
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
                  )
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
                    flexDirection: 'column',
                  }}
                >
                  {isSignedIn && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: 'var(--10px-V)',
                        marginTop: 'var(--10px-V)',
                        background: 'var(--Secondary-Color20)',
                        padding: 'var(--7px-V)',
                        borderRadius: 'var(--5px-V)',
                        boxShadow:
                          'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                      }}
                    >
                      Found an account:{' '}
                      {storageManager.get('users')[0].companyName}{' '}
                      <button
                        style={{ marginLeft: 'var(--10px-V)' }}
                        onClick={() => {
                          window.location.pathname = '/app';
                        }}
                      >
                        Open
                      </button>
                    </div>
                  )}
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
                    flexDirection: 'column',
                  }}
                >
                  {ForgotPasswordScreen ? (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--10px-V)',
                        padding: 'var(--20px-V)',
                        background: 'var(--Secondary-Color20)',
                        borderRadius: 'var(--8px-V)',
                      }}
                    >
                      <h2>Forgot Password</h2>
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={{
                          padding: 'var(--8px-V)',
                          borderRadius: 'var(--4px-V)',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: 'var(--10px-V)',
                        }}
                      >
                        <button
                          style={{ width: '50%' }}
                          onClick={() => setForgotPasswordScreen(false)}
                        >
                          Back
                        </button>
                        <button
                          style={{ width: '50%' }}
                          onClick={handleForgotPassword}
                        >
                          Submit
                        </button>
                      </div>
                      {ForgotPasswordLoading && (
                        <img
                          src={loadingGif}
                          style={{ width: '30px', height: '30px' }}
                          alt="Loading..."
                        />
                      )}
                      {resetPasswordEmailSent && (
                        <p>
                          Reset password email sent. <br /> Check your email for
                          the link to reset your password.
                        </p>
                      )}
                    </div>
                  ) : (
                    <>
                      {isSignedIn && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: 'var(--10px-V)',
                            marginTop: 'var(--10px-V)',
                            background: 'var(--Secondary-Color20)',
                            padding: 'var(--7px-V)',
                            borderRadius: 'var(--5px-V)',
                            boxShadow:
                              'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                          }}
                        >
                          Found an account:{' '}
                          {storageManager.get('users')[0].companyName}{' '}
                          <button
                            style={{ marginLeft: 'var(--10px-V)' }}
                            onClick={() => {
                              window.location.pathname = '/app';
                            }}
                          >
                            Open
                          </button>
                        </div>
                      )}
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
                        ForgotPassword={ForgotPassword}
                        RefreshComponent={RefreshComponent}
                        setViewBranchManagementPage={
                          setViewBranchManagementPage
                        }
                      />
                    </>
                  )}
                </div>
              )
            ) : (
              <>
                {ForceSignUp === 'in' && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      flexDirection: 'column',
                    }}
                  >
                    {isSignedIn && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 'var(--10px-V)',
                          marginTop: 'var(--10px-V)',
                          background: 'var(--Secondary-Color20)',
                          padding: 'var(--7px-V)',
                          borderRadius: 'var(--5px-V)',
                          boxShadow:
                            'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                        }}
                      >
                        Found an account:{' '}
                        {storageManager.get('users')[0].companyName}{' '}
                        <button
                          style={{ marginLeft: 'var(--10px-V)' }}
                          onClick={() => {
                            window.location.pathname = '/app';
                          }}
                        >
                          Open
                        </button>
                      </div>
                    )}
                    {ForgotPasswordScreen ? (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 'var(--10px-V)',
                          padding: 'var(--20px-V)',
                          background: 'var(--Secondary-Color20)',
                          borderRadius: 'var(--8px-V)',
                        }}
                      >
                        <h2>Forgot Password</h2>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{
                            padding: 'var(--8px-V)',
                            borderRadius: 'var(--4px-V)',
                          }}
                        />
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 'var(--10px-V)',
                          }}
                        >
                          <button
                            style={{ width: '50%' }}
                            onClick={() => setForgotPasswordScreen(false)}
                          >
                            Back
                          </button>
                          <button
                            style={{ width: '50%' }}
                            onClick={handleForgotPassword}
                          >
                            Submit
                          </button>
                        </div>
                        {ForgotPasswordLoading && (
                          <img
                            src={loadingGif}
                            style={{ width: '30px', height: '30px' }}
                            alt="Loading..."
                          />
                        )}
                        {resetPasswordEmailSent && (
                          <p>
                            Reset password email sent. <br /> Check your email
                            for the link to reset your password.
                          </p>
                        )}
                      </div>
                    ) : (
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
                        setViewBranchManagementPage={
                          setViewBranchManagementPage
                        }
                        ForgotPassword={ForgotPassword}
                      />
                    )}
                  </div>
                )}
                {ForceSignUp === 'up' && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '100%',
                      flexDirection: 'column',
                    }}
                  >
                    {isSignedIn && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 'var(--10px-V)',
                          marginTop: 'var(--10px-V)',
                          background: 'var(--Secondary-Color20)',
                          padding: 'var(--7px-V)',
                          borderRadius: 'var(--5px-V)',
                          boxShadow:
                            'var(--0px-V) var(--4px-V) var(--4px-V) var(--0px-V) rgba(0, 0, 0, 0.25)',
                        }}
                      >
                        Found an account:{' '}
                        {storageManager.get('users')[0].companyName}{' '}
                        <button
                          style={{ marginLeft: 'var(--10px-V)' }}
                          onClick={() => {
                            window.location.pathname = '/app';
                          }}
                        >
                          Open
                        </button>
                      </div>
                    )}
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
                )}
              </>
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
            }}
          ></div>{' '}
          <div
            id="add-new-property-panel"
            style={{
              backgroundColor: 'var(--Background-Color)',
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
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
              <h2 style={{ margin: 0 }}>Add New Property</h2>
              <button
                className="appUserButtons"
                onClick={() => setShowAddBranchModal(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 'var(--15px-V)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--5px-V)' }}>
                Property Name:
              </label>
              <input
                type="text"
                id="add-property-name"
                value={newBranchData.name}
                onChange={(e) =>
                  setNewBranchData((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="Enter Property Name"
                style={{
                  width: '95%',
                  padding: 'var(--8px-V)',
                  borderRadius: 'var(--4px-V)',
                  position: 'relative',
                }}
              />
            </div>

            <div style={{ marginBottom: 'var(--15px-V)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--5px-V)' }}>
                Location:
              </label>
              <input
                type="text"
                id="add-property-location"
                value={newBranchData.location}
                onChange={(e) =>
                  setNewBranchData((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                placeholder="Enter Property Location"
                style={{
                  width: '95%',
                  padding: 'var(--8px-V)',
                  borderRadius: 'var(--4px-V)',
                }}
              />
            </div>

            <div style={{ marginBottom: 'var(--15px-V)' }}>
              <label style={{ display: 'block', marginBottom: 'var(--5px-V)' }}>
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
                id="add-property-description"
                placeholder="Enter Property Description"
                style={{
                  width: '95%',
                  padding: 'var(--8px-V)',
                  borderRadius: 'var(--4px-V)',
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
                id="add-property-final-btn"
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
                  'Add Property'
                )}
              </button>
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
            }}
          >
            <div
              style={{
                backgroundColor: 'var(--Background-Color)',
                padding: 'var(--20px-V)',
                borderRadius: 'var(--8px-V)',
                width: 'var(--510px-V)',
                maxWidth: '90%',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--20px-V)',
                  borderBottom: '1px solid var(--Text-Color-10)',
                  paddingBottom: 'var(--10px-V)',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  Editing{' '}
                  {Branches.find((b: BranchType) => b.id === editingBranch?.id)
                    .name || ''}{' '}
                  Property
                </h2>
                <button
                  className="appUserButtons"
                  onClick={() => {
                    setShowEditBranchModal(false);
                    setEditingBranch(null);
                  }}
                >
                  X
                </button>
              </div>

              <div style={{ marginBottom: 'var(--20px-V)' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--8px-V)',
                    fontSize: 'var(--14px-V)',
                    fontWeight: 500,
                    color: 'var(--Text-Color-80)',
                  }}
                >
                  Property Name
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
                    width: 'var(--440px-V)',
                    padding: 'var(--12px-V)',
                    borderRadius: 'var(--6px-V)',

                    fontSize: 'var(--14px-V)',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--20px-V)' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--8px-V)',
                    fontSize: 'var(--14px-V)',
                    fontWeight: 500,
                    color: 'var(--Text-Color-80)',
                  }}
                >
                  Location
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
                    width: 'var(--440px-V)',
                    padding: 'var(--12px-V)',
                    borderRadius: 'var(--6px-V)',

                    fontSize: 'var(--14px-V)',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--20px-V)' }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--8px-V)',
                    fontSize: 'var(--14px-V)',
                    fontWeight: 500,
                    color: 'var(--Text-Color-80)',
                  }}
                >
                  Description
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
                    width: 'var(--440px-V)',
                    padding: 'var(--12px-V)',
                    borderRadius: 'var(--6px-V)',

                    fontSize: 'var(--14px-V)',
                    minHeight: '120px',
                    resize: 'vertical',
                    transition: 'border-color 0.2s',
                    outline: 'none',
                    lineHeight: '1.5',
                  }}
                />
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 'var(--12px-V)',
                  borderTop: '1px solid var(--Text-Color-10)',
                  paddingTop: 'var(--20px-V)',
                  marginTop: 'var(--20px-V)',
                }}
              >
                <button
                  className="appUserButtons"
                  onClick={() => handleDeleteBranch(editingBranch?.id)}
                  style={{
                    marginLeft: '0px',
                  }}
                >
                  Delete
                </button>
                <div>
                  {' '}
                  <button
                    className="appUserButtons"
                    onClick={() => {
                      setShowEditBranchModal(false);
                      setEditingBranch(null);
                    }}
                    style={{}}
                  >
                    Cancel
                  </button>
                  <button
                    className="appUserButtons"
                    onClick={handleEditBranch}
                    disabled={isEditingBranch || !editingBranch?.name.trim()}
                    style={{}}
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
          </div>
        </>
      )}
      {ShowAppUserSignInPanel && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 100,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '50%',
                display: 'flex',
                width: 'var(--330px-V)',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'var(--Background-Color)',
                padding: 'var(--20px-V)',
                borderRadius: 'var(--10px-V)',
                transition: 'transform 0.2s ease 0s',
              }}
            >
              <h1
                style={{
                  marginBottom: 'var(--0px-V)',
                  marginTop: 'var(--10px-V)',
                }}
              >
                Switch App User
              </h1>
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
                  Admin
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
                  App user
                </button>
              </div>
              {SelectedToLoginWith !== 'Admin' && (
                <input
                  type="text"
                  placeholder="Username"
                  value={usernameCheckInputAPPUSER}
                  onChange={(e) => setUsernameCheckInputAPPUSER(e.target.value)}
                  className="userName-input"
                  style={{ marginBottom: 'var(--10px-V)' }}
                />
              )}
              <input
                type="password"
                placeholder={
                  SelectedToLoginWith === 'Admin'
                    ? 'Enter Admin Password'
                    : 'Password'
                }
                value={PasswordCheckInputAPPUSER}
                onChange={(e) => setPasswordCheckInputAPPUSER(e.target.value)}
                className="userName-input"
                style={{ marginBottom: 'var(--20px-V)' }}
              />{' '}
              {passwordErrorAPPUSER && (
                <p
                  style={{
                    color: 'red',
                    marginBottom: 'var(--10px-V)',
                  }}
                >
                  {passwordErrorAPPUSER}
                </p>
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-around',
                  width: '100%',
                }}
              >
                <button
                  style={{
                    width: 'var(--150px-V)',
                    marginRight: 'var(--10px-V)',
                  }}
                  onClick={() => setShowAppUserSignInPanel(false)}
                >
                  Cancel
                </button>
                <button
                  style={{
                    width: 'var(--150px-V)',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                  onClick={handleSwitchUserFromBranchManagement}
                >
                  Sign in{' '}
                  {isCheckingPasswordAPPUSER && (
                    <img
                      src={loadingGif}
                      alt="Loading..."
                      style={{ width: '20px', height: '20px' }}
                    />
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
