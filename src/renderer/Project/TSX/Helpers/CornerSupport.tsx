import React, { useEffect, useState } from 'react';
import loadingGif from '../../../assets/assets/Loading/Rolling-1s-200px.gif';
import {
  getValuesWithSql_Online,
  sendEmailAPI,
} from 'Backend/OnlineServerApis';
import { storageManager } from 'renderer/storeManager';
import {
  tutorialData,
  TutorialSystem,
} from '../Tutorial Components/tutorialData';
import TutorialManager from '../Tutorial Components/TutorialManager';
import { getUserPrivileges } from 'renderer/App';

const CornerSupport = ({
  SelectedUserId,
  SelectedPage,
  SelectedAppUser,
  setSelectedPage,
  setViewBranchManagementPage,
  setViewBranchManagementPageNONAdm,
  setAppUserManagerPromptPassword,
  setAppUserManagerShow,
}: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<
    'tutorial' | 'support' | 'Subscription' | null
  >(null);
  const [isClosing, setIsClosing] = useState(false);
  const [featureSuggestion, setFeatureSuggestion] = useState('');
  const [isSendingFeatureSuggestion, setIsSendingFeatureSuggestion] =
    useState(false);
  const [isTutorialActive, setIsTutorialActive] = useState(false);
  const [selectedTutorial, setSelectedTutorial] =
    useState<TutorialSystem | null>(null);
  const [selectedTutorialIndex, setSelectedTutorialIndex] = useState<number>(0);

  const [showTutorialPrompt, setShowTutorialPrompt] = useState(false);
  const [tutorialPromptPage, setTutorialPromptPage] = useState('');

  useEffect(() => {
    const checkTutorialPrompt = () => {
      const tutorialPreferences =
        storageManager.get('tutorialPreferences') || {};

      const pageTutorial = tutorialData.pages.find(
        (page) => page.hasToBeIn.toLowerCase() === SelectedPage.toLowerCase()
      );

      if (pageTutorial && !tutorialPreferences[SelectedPage.toLowerCase()]) {
        setTutorialPromptPage(pageTutorial.pageTitle);
        setShowTutorialPrompt(true);
      }
    };

   // checkTutorialPrompt();
  }, [SelectedPage]);

  const handleTutorialPromptResponse = (accepted: boolean) => {
    const tutorialPreferences = storageManager.get('tutorialPreferences') || {};
    tutorialPreferences[SelectedPage.toLowerCase()] = true;
    storageManager.set('tutorialPreferences', tutorialPreferences);

    setShowTutorialPrompt(false);

    if (accepted) {
      const pageIndex = tutorialData.pages.findIndex(
        (page) => page.hasToBeIn.toLowerCase() === SelectedPage.toLowerCase()
      );
      if (pageIndex !== -1) {
        handleTutorialStart(pageIndex);
      }
    }
  };

  const toggleOpen = () => {
    if (isOpen && selectedOption) {
      setIsClosing(true);
      setTimeout(() => {
        setSelectedOption(null);
        setIsClosing(false);
      }, 300);
    }
    setIsOpen(!isOpen);
  };
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchSmsHistory = async () => {
      setIsLoading(true);
      const user = await getValuesWithSql_Online(
        'users',
        `WHERE id = '${SelectedUserId}'`
      );

      const smsHistoryRaw = await getValuesWithSql_Online(
        'sms_history',
        `WHERE userId = '${SelectedUserId}'`
      );
      const RoomRaw = await getValuesWithSql_Online(
        'rooms',
        `WHERE userId = '${SelectedUserId}'`
      );

      // Calculate total SMS sent in the current month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const totalSms = smsHistoryRaw
        .filter((sms: any) => {
          const smsDate = new Date(sms.sentDate);
          return smsDate >= monthStart && smsDate <= monthEnd;
        })
        .reduce((acc: number, sms: any) => acc + (sms.countsAs || 1), 0);

      const package2 = user[0].PackageSelected || 'Canot get';
      setCurrentPlanInfo({
        name: package2,
        roomsUsed: RoomRaw.length || 0,
        roomsLimit: user[0].MaxAmountOfRooms,
        smsUsed: totalSms || 0,
        smsLimit: user[0].SMSMonthlyLimit,
      });
    };
    if (navigator.onLine) fetchSmsHistory();
  }, [SelectedUserId, isOpen]);

  const [getCurrentPlanInfo, setCurrentPlanInfo] = useState({
    name: 'Starter Plan',
    roomsUsed: 25,
    roomsLimit: 30,
    smsUsed: 1200,
    smsLimit: 1500,
  });

  const [reviewForm, setReviewForm] = useState('');
  const [reviewFormMEssage, setreviewFormMEssage] = useState('');

  const [isSendingReview, setIsSendingReview] = useState(false);
  const [IsSendingReviewMessage, setIsSendingReviewMessage] = useState(false);
  const [ReplayingEmail, setReplayingEmail] = useState('');
  const handleSubmitmessage = async () => {
    setIsSendingReviewMessage(true);
    const review = reviewFormMEssage;
    const subject = 'Review';
    const body = review;
    const userDATA = await storageManager.get('users');
    const userEmail = userDATA[0].email;
    const userPass = userDATA[0].password;

    await sendEmailAPI(
      'rentmaster.et@gmail.com',
      'Message From App From  ' + userEmail,
      review,
      userDATA[0].id
    );

    setreviewFormMEssage('');
    setInterval(() => {
      setIsSendingReviewMessage(false);
    }, 2000);
  };
  const handleSubmit = async () => {
    setIsSendingReview(true);
    const review = reviewForm;
    const subject = 'Review';
    const body = review;
    const userDATA = await storageManager.get('users');
    const userEmail = userDATA[0].email;
    const userPass = userDATA[0].password;

    await sendEmailAPI(
      'rentmaster.et@gmail.com',
      'Review From ' + userEmail,
      review,
      userDATA[0].id
    );

    setReviewForm('');
    setInterval(() => {
      setIsSendingReview(false);
    }, 2000);
  };
  const handleSubmitFeatureSuggestion = async () => {
    setIsSendingFeatureSuggestion(true);
    const feature = featureSuggestion;
    const subject = 'Feature Suggestion';
    const body = feature;
    const userDATA = await storageManager.get('users');
    const userEmail = userDATA[0].email;
    const userPass = userDATA[0].password;

    await sendEmailAPI(
      'rentmaster.et@gmail.com',
      'Feature Suggestion From ' + userEmail,
      feature,
      userDATA[0].id
    );

    setFeatureSuggestion('');

    setInterval(() => {
      setIsSendingFeatureSuggestion(false);
    }, 2000);
  };
  const plans = [
    {
      name: 'Starter Plan',
      price: 'Br. 7,200',
      period: 'Monthly',
      rooms: '1 to 30 rooms',
      sms: '1,500 SMS',
    },
    {
      name: 'Growth Plan',
      price: 'Br. 14,000',
      period: 'Monthly',
      rooms: '30 to 90 rooms',
      sms: '2,200 SMS',
    },
    {
      name: 'Pro Plan',
      price: 'Br. 26,000',
      period: 'Monthly',
      rooms: '90 to 200 rooms',
      sms: '3,000 SMS',
    },
  ];

  const handleTutorialStart = (index: number) => {
    setSelectedTutorialIndex(index);
    setSelectedTutorial(tutorialData);
    setIsTutorialActive(true);
    setSelectedOption(null);
    setIsOpen(false);
  };

  const renderTutorialList = () => (
    <div style={{ padding: 'var(--5px-V)' }}>
      <h2 style={{ marginTop: '0' }}>Available Tutorials</h2>
      <div
        style={{
          marginTop: 'var(--10px-V)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--10px-V)',
        }}
      >
        {tutorialData.pages.map((page, index) => (
          <div
            key={index}
            style={{
              padding: 'var(--10px-V)',
              backgroundColor: 'var(--Secondary-Color20)',
              borderRadius: 'var(--5px-V)',
            }}
          >
            <h3 style={{ margin: '0 0 var(--5px-V) 0' }}>{page.pageTitle}</h3>
            <p style={{ margin: '0 0 var(--10px-V) 0' }}>
              {page.overview.description}
            </p>
            {page.hasToBeIn === SelectedPage ? (
              <>
                <button
                  onClick={() => {
                    handleTutorialStart(index);
                  }}
                  style={{
                    padding: 'var(--5px-V) var(--10px-V)',
                    backgroundColor: 'var(--Primary-Color)',
                    color: 'var(--Text-Color-Reverse)',
                    border: 'none',
                    borderRadius: 'var(--3px-V)',
                    cursor: 'pointer',
                  }}
                >
                  Start Tutorial
                </button>
              </>
            ) : (
              <>
                Wrong page,{' '}
                <button
                  onClick={() => {
                    handleTutorialStart(index);
                  }}
                  style={{
                    padding: 'var(--5px-V) var(--10px-V)',
                    backgroundColor: 'var(--Primary-Color)',
                    color: 'var(--Text-Color-Reverse)',
                    border: 'none',
                    borderRadius: 'var(--3px-V)',
                    cursor: 'pointer',
                  }}
                >
                  Go to page
                </button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (selectedOption) {
      case 'tutorial':
        return renderTutorialList();

      case 'support':
        return (
          <div style={{ padding: 'var(--5px-V)' }}>
            <h2 style={{ marginTop: '0' }}>Support</h2>
            <div style={{ marginTop: 'var(--10px-V)' }}>
              <div
                style={{
                  marginTop: 'var(--20px-V)',
                  padding: 'var(--10px-V)',
                  borderRadius: 'var(--10px-V)',
                  backgroundColor: 'var(--Secondary-Color20)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--10px-V)',
                    alignItems: 'center',
                  }}
                >
                  <span>Phone Number:</span>
                  <span>094450-9999</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--10px-V)',
                    alignItems: 'center',
                  }}
                >
                  <span>Email:</span>
                  <span>rentmaster.et@gmail.com</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 'var(--10px-V)',
                    alignItems: 'center',
                  }}
                >
                  <span>Telegram:</span>
                  <span>@Rent_Master</span>
                </div>
              </div>

              <div
                style={{
                  marginTop: 'var(--20px-V)',
                  padding: 'var(--10px-V)',
                  borderRadius: 'var(--10px-V)',
                  backgroundColor: 'var(--Secondary-Color20)',
                }}
              >
                <label>Send a message</label>
                <textarea
                  value={reviewFormMEssage}
                  onChange={(e) => setreviewFormMEssage(e.target.value)}
                  id="message"
                  name="message"
                  placeholder="Send us a message"
                  style={{
                    height: 'var(--100px-V)',
                    width: '97%',
                    resize: 'vertical',
                  }}
                ></textarea>
                <button onClick={handleSubmitmessage}>
                  {IsSendingReviewMessage ? (
                    <>
                      <img
                        src={loadingGif}
                        alt="Loading..."
                        style={{
                          width: 'var(--20px-V)',
                          height: 'var(--20px-V)',
                        }}
                      />
                      Sending...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>

              <div
                style={{
                  marginTop: 'var(--20px-V)',
                  padding: 'var(--10px-V)',
                  borderRadius: 'var(--10px-V)',
                  backgroundColor: 'var(--Secondary-Color20)',
                }}
              >
                <label>Suggest a feature</label>
                <textarea
                  value={featureSuggestion}
                  onChange={(e) => setFeatureSuggestion(e.target.value)}
                  id="featureSuggestion"
                  name="featureSuggestion"
                  placeholder="Tell us what features you would like to see in RentMaster..."
                  style={{
                    height: 'var(--100px-V)',
                    width: '97%',
                    resize: 'vertical',
                  }}
                ></textarea>
                <button onClick={handleSubmitFeatureSuggestion}>
                  {isSendingFeatureSuggestion ? (
                    <>
                      <img
                        src={loadingGif}
                        alt="Loading..."
                        style={{
                          width: 'var(--20px-V)',
                          height: 'var(--20px-V)',
                        }}
                      />
                      Sending...
                    </>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 'Subscription':
        return (
          <div style={{ padding: 'var(--5px-V)' }}>
            <h2 style={{ marginTop: '0' }}>Current Plan</h2>
            <div
              style={{
                marginTop: 'var(--20px-V)',
                padding: 'var(--10px-V)',
                borderRadius: 'var(--10px-V)',
                backgroundColor: 'var(--Secondary-Color20)',
              }}
            >
              <h3 style={{ margin: '0 0 var(--10px-V) 0' }}>
                {getCurrentPlanInfo.name}
              </h3>

              {/* Room Usage */}
              <div style={{ marginBottom: 'var(--10px-V)' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  <span>Rooms:</span>
                  <span>
                    {getCurrentPlanInfo.roomsUsed}/
                    {getCurrentPlanInfo.roomsLimit}
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: 'var(--5px-V)',
                    backgroundColor: 'var(--Background-Color)',
                    borderRadius: 'var(--5px-V)',
                    marginTop: 'var(--5px-V)',
                  }}
                >
                  <div
                    style={{
                      width: `${
                        (getCurrentPlanInfo.roomsUsed /
                          getCurrentPlanInfo.roomsLimit) *
                        100
                      }%`,
                      height: '100%',
                      backgroundColor: 'var(--Secondary-Color)',
                      borderRadius: 'var(--5px-V)',
                    }}
                  />
                </div>
              </div>

              {/* SMS Usage */}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Monthly / SMS:</span>
                <span>
                  {getCurrentPlanInfo.smsUsed}/{getCurrentPlanInfo.smsLimit}
                </span>
              </div>
              <div
                style={{
                  width: '100%',
                  height: 'var(--5px-V)',
                  backgroundColor: 'var(--Background-Color)',
                  borderRadius: 'var(--5px-V)',
                  marginTop: 'var(--5px-V)',
                }}
              >
                <div
                  style={{
                    width: `${
                      (getCurrentPlanInfo.smsUsed /
                        getCurrentPlanInfo.smsLimit) *
                      100
                    }%`,
                    height: '100%',
                    backgroundColor: 'var(--Secondary-Color)',
                    borderRadius: 'var(--5px-V)',
                  }}
                />
              </div>
              {getCurrentPlanInfo.smsUsed >= getCurrentPlanInfo.smsLimit && (
                <div
                  style={{
                    marginTop: 'var(--10px-V)',
                    textAlign: 'center',
                    color: 'var(--Error-Color)', // Optional: Add a color variable for emphasis
                    fontWeight: 'bold',
                  }}
                >
                  Upgrade your plan to send more SMS
                </div>
              )}
            </div>

            {/* Upgrade Section */}
            <div
              style={{
                marginTop: 'var(--20px-V)',
                padding: 'var(--10px-V)',
                borderRadius: 'var(--10px-V)',
                backgroundColor: 'var(--Secondary-Color20)',
              }}
            >
              <h3 style={{ margin: '0 0 var(--10px-V) 0' }}>Need More?</h3>
              <p style={{ margin: '0 0 var(--10px-V) 0' }}>Upgrade to get:</p>
              <ul
                style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: '0 0 var(--10px-V) 0',
                }}
              >
                <li>• More rooms</li>
                <li>• Additional SMS</li>
              </ul>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: 'var(--5px-V)',
                  background: 'var(--Secondary-Color30)',
                  border: 'none',
                  borderRadius: 'var(--5px-V)',

                  marginBottom: 'var(--5px-V)',
                }}
              >
                Contact: 0944509999
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handlePageNavigation = (page: string) => {
    // Close the tutorial panel
    setIsOpen(false);
    setSelectedOption(null);
    const privileges = getUserPrivileges(SelectedAppUser);
    // Navigate based on page
    switch (page.toLowerCase()) {
      case 'app user':
        setAppUserManagerShow(true);
        setViewBranchManagementPage(false);
        setAppUserManagerPromptPassword(SelectedAppUser.id !== 'admin');
        break;
      case 'property':
        setAppUserManagerShow(false);

        setViewBranchManagementPage(true);

        break;
      case 'dashboard':
        if (SelectedAppUser.id === 'admin' || privileges.viewDashboard)
          setSelectedPage('Dashboard');
        else console.log('Access denied');
        break;
      case 'people':
        if (SelectedAppUser.id === 'admin' || privileges.viewPeoplesPage)
          setSelectedPage('People');
        else console.log('Access denied');
        break;
      case 'calendar':
        if (SelectedAppUser.id === 'admin' || privileges.viewCalendar)
          setSelectedPage('Calendar');
        else console.log('Access denied');
        break;
      case 'database':
        if (SelectedAppUser.id === 'admin' || privileges.viewDatabase)
          setSelectedPage('Database');
        else console.log('Access denied');
        break;
      case 'tools':
        if (SelectedAppUser.id === 'admin' || privileges.viewToolsPage)
          setSelectedPage('Tools');
        else console.log('Access denied');
        break;
    }
  };

  return (
    <>
      {isTutorialActive && selectedTutorial && (
        <TutorialManager
          tutorialData={selectedTutorial}
          SelectedPage={SelectedPage}
          onClose={() => {
            setIsTutorialActive(false);
            setSelectedTutorial(null);
          }}
          currentPageInital={selectedTutorialIndex}
          onNavigate={handlePageNavigation}
          selectedAppUserId={SelectedAppUser.id}
          userPrivileges={getUserPrivileges(SelectedAppUser)}
        />
      )}

      {showTutorialPrompt && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'var(--Background-Color)',
            padding: 'var(--20px-V)',
            borderRadius: 'var(--10px-V)',
            boxShadow: '0 0 var(--10px-V) var(--Secondary-Color50)',
            zIndex: 1000,
            width: 'var(--400px-V)',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
        >
          <h2 style={{ margin: '0 0 var(--15px-V) 0' }}>Tutorial Available</h2>
          <p style={{ margin: '0 0 var(--20px-V) 0' }}>
            Would you like to view the tutorial for the {tutorialPromptPage}{' '}
            page?
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 'var(--10px-V)',
            }}
          >
            <button
              onClick={() => handleTutorialPromptResponse(true)}
              style={{
                backgroundColor: 'var(--Primary-Color)',
                color: 'var(--Text-Color-Reverse)',
                padding: 'var(--10px-V) var(--20px-V)',
                border: 'none',
                borderRadius: 'var(--5px-V)',
                cursor: 'pointer',
              }}
            >
              Yes, show tutorial
            </button>
            <button
              onClick={() => handleTutorialPromptResponse(false)}
              style={{
                backgroundColor: 'var(--Secondary-Color20)',
                color: 'var(--Text-Color)',
                padding: 'var(--10px-V) var(--20px-V)',
                border: 'none',
                borderRadius: 'var(--5px-V)',
                cursor: 'pointer',
              }}
            >
              No, thanks
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'fixed',
          bottom: 'var(--20px-V)',
          right: 'var(--20px-V)',
          zIndex: 600,
        }}
      >
        <button
          onClick={toggleOpen}
          style={{
            width: 'var(--50px-V)',
            height: 'var(--50px-V)',
            borderRadius: '50%',
            zIndex: '4',
            fontSize: 'var(--24px-V)',
            position: 'relative',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--Background-Color)',
            border: 'var(--2px-V) solid var(--Secondary-Color)',
            color: 'var(--Text-Color)',
          }}
          title="Help"
        >
          H
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              bottom: 'var(--3px-V)',
              right: 'var(--28px-V)',
              display: 'flex',
              flexDirection: 'row',
              background: 'var(--Background-Color)',
              boxShadow: '0px 0px var(--10px-V) var(--Secondary-Color)',
              gap: 'var(--10px-V)',
              zIndex: '3',
              padding: 'var(--7px-V)',
              paddingRight: 'var(--30px-V)',
              borderRadius: 'var(--10px-V)',
              transformOrigin: 'right center',
              animation: isClosing
                ? '0.3s ease-out slideOutBar'
                : '0.3s ease-out slideInBar',
            }}
          >
            {['tutorial', 'support', 'Subscription'].map((option) => (
              <button
                key={option}
                onClick={() => setSelectedOption(option as any)}
                style={{
                  padding: 'var(--5px-V) var(--15px-V)',
                  borderRadius: 'var(--5px-V)',
                  border: 'var(--1px-V) solid var(--Secondary-Color)',
                  background:
                    selectedOption === option
                      ? 'var(--Secondary-Color)'
                      : 'var(--Background-Color)',
                  color: 'var(--Text-Color)',
                  cursor: 'pointer',
                }}
              >
                {option.charAt(0).toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
        )}

        {selectedOption && (
          <div
            style={{
              position: 'fixed',
              right: 'var(--47px-V)',
              bottom: 'var(--65px-V)',
              width: 'var(--320px-V)',
              height: '75vh',
              backgroundColor: 'var(--Background-Color)',
              boxShadow: '0px 0px var(--10px-V) var(--Secondary-Color)',
              borderRadius: 'var(--10px-V)',
              padding: 'var(--20px-V)',
              display: 'flex',
              flexDirection: 'column',
              transformOrigin: 'right bottom',
              overflow: 'auto',
              transition: '.2s all',
              animation: isClosing
                ? '0.3s ease-out slideOutBar'
                : '0.3s ease-out slideInBar',
            }}
          >
            {renderContent()}
          </div>
        )}

        <style>
          {`
            @keyframes slideInBar {
              from {
                transform: scaleX(0);
                opacity: 0;
              }
              to {
                transform: scaleX(1);
                opacity: 1;
              }
            }

            @keyframes slideOutBar {
              from {
                transform: scaleX(1);
                opacity: 1;
              }
              to {
                transform: scaleX(0);
                opacity: 0;
              }
            }

            @keyframes slideInPanel {
              from {
                transform: translateY(var(--70px-V)) scale(1);
                opacity: 0;
              }
              to {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
            }

            @keyframes slideOutPanel {
              from {
                transform: translateY(0) scale(1);
                opacity: 1;
              }
              to {
                transform: translateY(var(--70px-V)) scale(1);
                opacity: 0;
              }
            }
          `}
        </style>
      </div>
    </>
  );
};

export default CornerSupport;
