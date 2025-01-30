import React, { useEffect, useState } from 'react';
import { TutorialSystem } from './tutorialData';
import { useGlobal } from 'renderer/components/GlobalContext';
// Function to resolve dynamic element IDs from tutorial steps into actual DOM element IDs
// Takes the template ID and context object containing necessary IDs/data
const resolveJsId = (id: string, context: any) => {
  let resolvedId;
  
  switch (id) {
    // App User Tutorial IDs
    case 'tutorialNewAppUserId':
      resolvedId = context.tutorialNewAppUserId;
      break;
      
    case 'tutorialNewAppUserId + " app-user-edit-name-input"':
      resolvedId = `${context.tutorialNewAppUserId} app-user-edit-name-input`;
      break;
      
    case 'tutorialNewAppUserId + " app-user-edit-name-save"':
      resolvedId = `${context.tutorialNewAppUserId} app-user-edit-name-save`;
      break;
      
    case 'tutorialNewAppUserId + " app-user-edit-select"':
      resolvedId = `${context.tutorialNewAppUserId} app-user-edit-select`;
      break;
      
    case 'tutorialNewAppUserId + " privileges-list"':
      resolvedId = `${context.tutorialNewAppUserId} privileges-list`;
      break;
      
    case 'tutorialNewAppUserId + " appuser-properties-list"':
      resolvedId = `${context.tutorialNewAppUserId} appuser-properties-list`;
      break;
      
    case 'tutorialNewAppUserId + " appuser-account-password"':
      resolvedId = `${context.tutorialNewAppUserId} appuser-account-password`;
      break;

    // Room Tutorial IDs  
    case "'room-' + tutorialNewRoomId":
      resolvedId = `room-${context.tutorialNewRoomId}`;
      break;

    case "'room-floorRoom-text-' + (RoomList.find(room => room.status === 'Empty')?.id)":
      const emptyRoom = context.RoomList?.find((room: { status: string; }) => room.status === 'Empty');
      resolvedId = emptyRoom ? `room-floorRoom-text-${emptyRoom.id}` : undefined;
      break;

    case "'room-price-payment-cycle' + (RoomList.find(room => room.status === 'Empty')?.id)":
      const emptyRoomForPrice = context.RoomList?.find((room: { status: string; }) => room.status === 'Empty');
      resolvedId = emptyRoomForPrice ? `room-price-payment-cycle${emptyRoomForPrice.id}` : undefined;
      break;

    case "'room-payment-timeline-button' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForTimeline = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForTimeline ? `room-payment-timeline-button${takenRoomForTimeline.id}` : undefined;
      break;

    case "'payment-timeline-container' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForContainer2 = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForContainer2 ? `payment-timeline-container${takenRoomForContainer2.id}` : undefined;
      break;

    case "'payment-timeline-rct-button' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForRct = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForRct ? `payment-timeline-rct-button${takenRoomForRct.id}` : undefined;
      break;

    case "'payment-timeline-current-date' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForDate = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForDate ? `payment-timeline-current-date${takenRoomForDate.id}` : undefined;
      break;

    case "'payment-timeline-extend' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForExtend = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForExtend ? `payment-timeline-extend${takenRoomForExtend.id}` : undefined;
      break;

    case "'room-typeOfRoomMainContainer' + (RoomList.find(room => room.status === 'Empty')?.id)":
      const emptyRoomForType = context.RoomList?.find((room: { status: string; }) => room.status === 'Empty');
      resolvedId = emptyRoomForType ? `room-typeOfRoomMainContainer${emptyRoomForType.id}` : undefined;
      break;

    case "'room-status-Main-container' + (RoomList.find(room => room.status === 'Empty')?.id)":
      const emptyRoomForStatus = context.RoomList?.find((room: { status: string; }) => room.status === 'Empty');
      resolvedId = emptyRoomForStatus ? `room-status-Main-container${emptyRoomForStatus.id}` : undefined;
      break;

    case "'room-status-add-tenant-button' + (RoomList.find(room => room.status === 'Empty')?.id)":
      const emptyRoomForButton = context.RoomList?.find((room: { status: string; }) => room.status === 'Empty');
      resolvedId = emptyRoomForButton ? `room-status-add-tenant-button${emptyRoomForButton.id}` : undefined;
      break;

    case "'room-add-tenant-container' + (RoomList.find(room => room.status === 'Empty')?.id)":
      const emptyRoomForContainer = context.RoomList?.find((room: { status: string; }) => room.status === 'Empty');
      resolvedId = emptyRoomForContainer ? `room-add-tenant-container${emptyRoomForContainer.id}` : undefined;
      break;

    case "'room-view-agreement-button' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoom = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoom ? `room-view-agreement-button${takenRoom.id}` : undefined;
      break;

    case "'room-view-agreement-container' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForContainer = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForContainer ? `room-view-agreement-container${takenRoomForContainer.id}` : undefined;
      break;

    case "'room-view-agreement-tenant-information' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForInfo = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForInfo ? `room-view-agreement-tenant-information${takenRoomForInfo.id}` : undefined;
      break;

    case "'room-view-agreement-information' + (RoomList.find(room => room.status === 'Taken')?.id)":
      const takenRoomForAgreement = context.RoomList?.find((room: { status: string; }) => room.status === 'Taken');
      resolvedId = takenRoomForAgreement ? `room-view-agreement-information${takenRoomForAgreement.id}` : undefined;
      break;

   
    // Expense Tutorial IDs
    case "'recurring-expenses-title'":
      resolvedId = 'recurring-expenses-title';
      break;

    case "'one-time-expenses-title'":
      resolvedId = 'one-time-expenses-title';
      break;

    case "tutorialNewExpenseId + '-expense-row-name-input'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-row-name-input`;
      break;

    case "tutorialNewExpenseId + '-expense-category-select'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-category-select`;
      break;

    case "tutorialNewExpenseId + '-expense-tax-checkbox'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-tax-checkbox`;
      break;

    case "tutorialNewExpenseId + '-expense-row-currencyPrice-select'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-row-currencyPrice-select`;
      break;

    case "tutorialNewExpenseId + '-expense-location-select'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-location-select`;
      break;

    case "tutorialNewExpenseId + '-expense-recurring-options'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-recurring-options`;
      break;

    case "tutorialNewExpenseId + '-expense-dates'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-dates`;
      break;

    case "tutorialNewExpenseId + '-expense-notifications-button'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-notifications-button`;
      break;

    case "tutorialNewExpenseId + '-expense-notifications-container'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-notifications-container`;
      break;

    case "tutorialNewExpenseId + '-expense-row-edit-button'":
      resolvedId = `${context.tutorialNewExpenseId}-expense-row-edit-button`;
      break;


  case "'recurring-expenses-title'":
    resolvedId = 'recurring-expenses-title';
    break;

  case "'one-time-expenses-title'":
    resolvedId = 'one-time-expenses-title';
    break;

  case "tutorialNewExpenseId + '-expense-row-name-input'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-row-name-input`;
    break;

  case "tutorialNewExpenseId + '-expense-category-select'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-category-select`;
    break;

  case "tutorialNewExpenseId + '-expense-tax-checkbox'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-tax-checkbox`;
    break;

  case "tutorialNewExpenseId + '-expense-row-currencyPrice-select'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-row-currencyPrice-select`;
    break;

  case "tutorialNewExpenseId + '-expense-location-select'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-location-select`;
    break;

  case "tutorialNewExpenseId + '-expense-recurring-options'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-recurring-options`;
    break;

  case "tutorialNewExpenseId + '-expense-dates'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-dates`;
    break;

  case "tutorialNewExpenseId + '-expense-notifications-button'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-notifications-button`;
    break;

  case "tutorialNewExpenseId + '-expense-notifications-container'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-notifications-container`;
    break;

  case "tutorialNewExpenseId + '-expense-row-edit-button'":
    resolvedId = `${context.tutorialNewExpenseId}-expense-row-edit-button`;
    break;

  default:
    resolvedId = id;
    break;
}
  if (!resolvedId) {
    console.warn(`Failed to resolve ID for: ${id}`);
  }

  console.log('Resolved ID:', resolvedId);
  return resolvedId;
};







const isElementInViewport = (element: HTMLElement) => {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
};

const scrollParentToElement = (element: HTMLElement) => {
  // Find scrollable parent
  let parent = element.parentElement;
  while (parent) {
    const style = window.getComputedStyle(parent);
    const overflow = style.getPropertyValue('overflow');
    if (overflow === 'auto' || overflow === 'scroll') {
      break;
    }
    parent = parent.parentElement;
  }

  if (parent) {
    // Calculate position to scroll to
    const parentRect = parent.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const scrollTop =
      parent.scrollTop +
      (elementRect.top - parentRect.top) -
      parentRect.height / 2;

    // Smooth scroll to element
    parent.scrollTo({
      top: scrollTop,
      behavior: 'smooth',
    });
  }
};

interface TutorialManagerProps {
  tutorialData: TutorialSystem;
  onClose: () => void;
  SelectedPage: string;
  onNavigate?: (page: string) => void;
  userPrivileges: any;
  selectedAppUserId: string;
  currentPageName: string;
  currentSectionName: string;
  RoomList: RoomType[];
  handleOpenSideBar: () => void;
  handleCloseSideBar: () => void;
}

const TutorialManager = ({
  tutorialData,
  onClose,
  SelectedPage,
  onNavigate,
  selectedAppUserId,
  userPrivileges,
  currentPageName,
  currentSectionName,
  RoomList,
  handleOpenSideBar,
  handleCloseSideBar,
}: TutorialManagerProps) => {
  // Error checking first
  if (!tutorialData || !tutorialData.pages || tutorialData.pages.length === 0) {
    return (
      <div className="tutorial-manager">
        <div className="tutorial-overlay" />
        <div className="tutorial-card">
          <h2>Error: No tutorial data available</h2>
          <button className="tutorial-close-btn" onClick={onClose}>
            ×
          </button>
        </div>
      </div>
    );
  }

  const { isOnTutorial, setIsOnTutorial, langCode } = useGlobal();

  // Initialize currentPage first
  const [currentPage, setCurrentPage] = useState(() => {
    const pageIndex = tutorialData.pages.findIndex(
      (p) => p.pageTitle[langCode] === currentPageName
    );
    return pageIndex >= 0 ? pageIndex : 0;
  });

  // Get currentPageData after currentPage is initialized
  const currentPageData = tutorialData.pages[currentPage];

  // Now we can safely initialize currentSection using currentPageData
  const [currentSection, setCurrentSection] = useState(() => {
    if (currentSectionName === 'overview') return 0;
    const sectionIndex = currentPageData.sections.findIndex(
      (s) => s.mainTitle[langCode] === currentSectionName
    );
    return sectionIndex >= 0 ? sectionIndex + 1 : 0;
  });

  // Rest of the state
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [cardPosition, setCardPosition] = useState({
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get current section data
  const currentSectionData =
    currentSection === 0
      ? currentPageData.overview
      : currentPageData.sections[currentSection - 1];

  // Filter steps
  const isTryoutMode = window.location.href.includes('tryout');
  const filteredSteps = currentSectionData.steps.filter((step) => {
    return !(isTryoutMode && step.dontShowInTryout);
  });

  // Get current step data
  const currentStepData = filteredSteps[currentStep];

  const handleClose = () => {
    onClose();
    if(isMobileState) {
      const sideBarContainer = document.querySelector('.SideBarContainer');
      if(sideBarContainer) {
        sideBarContainer.style.zIndex = 2;
      }
    }
    setIsOnTutorial(false);
  };

  useEffect(() => {
    setIsOnTutorial(true);
  }, []);

  // Function to position the tutorial card relative to target element
  const positionCard = (elementId: string | undefined, position: string) => {
    if (!elementId) {
      // Center the card if no element ID is provided
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const element = document.getElementById(elementId);
    if (!element) {
      // Center the card if element is not found
      return {
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      };
    }

    const screenWidth = window.innerWidth;
    let scaleFactor;
    if (screenWidth <= 1280) {
      scaleFactor = 1280 / 1920;
    } else if (screenWidth <= 1366) {
      scaleFactor = 1366 / 1920;
    } else if (screenWidth <= 1920) {
      scaleFactor = 1920 / 1920;
    } else {
      scaleFactor = 2560 / 2560;
    }
    const rect = element.getBoundingClientRect();
    const offset = 20 * scaleFactor;
    const offset2 = 30 * scaleFactor;
    const cardWidth = 400 * scaleFactor;
    const cardHeight = 250 * scaleFactor;
    const adjustmentOffset = 40 * scaleFactor;
    const marginInDirection = currentStepData.marginInDirection
      ? currentStepData.marginInDirection * scaleFactor
      : 0;
    let style: { [key: string]: string } = {};
    const realPos = isMobileState
      ? position === 'left'
        ? 'up'
        : position === 'right'
        ? 'down'
        : position
      : position;
    switch (realPos) {
      case 'left2':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.left - cardWidth - offset - marginInDirection}px`,
          transform: 'translateY(-50%)',
        };
        if (rect.top + rect.height / 2 - cardHeight / 2 < 0) {
          style.top = `${cardHeight / 2 - adjustmentOffset}px`;
        } else if (
          rect.top + rect.height / 2 + cardHeight / 2 >
          window.innerHeight
        ) {
          style.top = `${
            window.innerHeight - cardHeight / 2 + adjustmentOffset
          }px`;
        }
        if (rect.left - cardWidth - offset < 0) {
          style.left = `${adjustmentOffset}px`;
        }
        break;

      case 'left':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${
            rect.left - cardWidth - offset - offset2 - marginInDirection
          }px`,
          transform: 'translateY(-50%)',
        };
        if (rect.top + rect.height / 2 - cardHeight / 2 < 0) {
          style.top = `${cardHeight / 2 + adjustmentOffset}px`;
        } else if (
          rect.top + rect.height / 2 + cardHeight / 2 >
          window.innerHeight
        ) {
          style.top = `${
            window.innerHeight - cardHeight / 2 - adjustmentOffset
          }px`;
        }
        if (rect.left - offset - cardWidth < 0) {
          style.left = `${offset + adjustmentOffset}px`;
        }
        break;

      case 'right':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + offset - marginInDirection}px`,
          transform: 'translateY(-50%)',
        };
        if (rect.top + rect.height / 2 - cardHeight / 2 < 0) {
          style.top = `${cardHeight / 2 + adjustmentOffset}px`;
        } else if (
          rect.top + rect.height / 2 + cardHeight / 2 >
          window.innerHeight
        ) {
          style.top = `${
            window.innerHeight - cardHeight / 2 - adjustmentOffset
          }px`;
        }
        if (rect.right + offset + cardWidth > window.innerWidth) {
          style.left = `${
            window.innerWidth - cardWidth - offset - adjustmentOffset
          }px`;
        }
        break;

      case 'up':
        style = {
          bottom: `${
            window.innerHeight - rect.top + offset - marginInDirection
          }px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
        if (rect.left + rect.width / 2 - cardWidth / 2 < 0) {
          style.left = `${cardWidth / 2 + adjustmentOffset}px`;
        } else if (
          rect.left + rect.width / 2 + cardWidth / 2 >
          window.innerWidth
        ) {
          style.left = `${
            window.innerWidth - cardWidth / 2 - adjustmentOffset
          }px`;
        }
        break;

      case 'down':
        style = {
          top: `${rect.bottom + offset - marginInDirection}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
        if (rect.left + rect.width / 2 - cardWidth / 2 < 0) {
          style.left = `${cardWidth / 2 + adjustmentOffset}px`;
        } else if (
          rect.left + rect.width / 2 + cardWidth / 2 >
          window.innerWidth
        ) {
          style.left = `${
            window.innerWidth - cardWidth / 2 - adjustmentOffset
          }px`;
        }
        if (rect.bottom + offset + cardHeight > window.innerHeight) {
          style.top = `${
            window.innerHeight - cardHeight - offset - adjustmentOffset
          }px`;
        }
        break;

      default:
        return {};
    }

    return style;
  };

  // Effect to update window width
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const {
    tutorialNewAppUserId,
    tutorialNewExpenseId,
    tutorialNewRoomId,
    isMobileState,
  } = useGlobal();
  // Effect to check and update card position and styles every 2 seconds
  useEffect(() => {
    const checkAndUpdatePosition = () => {
      // Get the target ID, handling JS IDs safely with Function constructor
      const targetId = currentStepData.isJsId
        ? resolveJsId(currentStepData.targetElementId, {
            tutorialNewAppUserId,
            tutorialNewRoomId,
            tutorialNewExpenseId,
            RoomList
          })
        : currentStepData.targetElementId;

      // Check if we need to verify parent element
      let finalTargetId = targetId;
      // if (targetId.includes('-tab') && isMobileState && !hasInteracted) {
      //   handleOpenSideBar();
      //   console.log('Mobile tab interaction needed');
      // }
      if (currentStepData.checkUnderElementId && targetId) {
        const parentElement = document.getElementById(
          currentStepData.checkUnderElementIsJS
            ? resolveJsId(currentStepData.checkUnderElementId, {
                tutorialNewAppUserId,
                tutorialNewRoomId,
                tutorialNewExpenseId,
                RoomList
              })
            : currentStepData.checkUnderElementId
        );
        const targetElement = document.getElementById(targetId);

        // Only use the target ID if it's under the specified parent
        if (
          parentElement &&
          targetElement &&
          parentElement.contains(targetElement)
        ) {
          finalTargetId = targetId;
        } else {
          finalTargetId = ''; // Element not found under parent
        }
      }

      const newPosition = positionCard(finalTargetId, currentStepData.position);

      if (finalTargetId) {
        const element = document.getElementById(finalTargetId);
        if (element) {
          if (!isElementInViewport(element)) {
            scrollParentToElement(element);
          }

          const isCentered =
            cardPosition.top === '50%' && cardPosition.left === '50%';
          const positionChanged =
            JSON.stringify(newPosition) !== JSON.stringify(cardPosition);

          if (isCentered || positionChanged) {
            // Ensure newPosition has all required properties
            const updatedPosition = {
              top: newPosition.top || '50%',
              left: newPosition.left || '50%',
              transform: newPosition.transform || 'translate(-50%, -50%)',
            };
            setCardPosition(updatedPosition);
          }

          // Re-apply styles
          element.setAttribute('data-tutorial-target', 'true');
          element.style.zIndex = '504';

          // Re-apply interaction styles
          if (
            currentStepData.requiresInteraction ||
            currentStepData.requiresInteractionInput
          ) {
            const allChildren = element.getElementsByTagName('*');
            for (let i = 0; i < allChildren.length; i++) {
              (allChildren[i] as HTMLElement).style.pointerEvents = 'auto';
            }
            element.style.pointerEvents = 'auto';
          }

          if (currentStepData.dontInteract) {
            element.style.pointerEvents = 'none';
          }
        } else {
          setCardPosition({
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          });
        }
      }

      // Re-apply styles to additional elements
      const additionalElements = currentStepData.additionalZIndexElements || [];
      additionalElements.forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.setAttribute('data-tutorial-target', 'true');
          element.style.zIndex = '501';

          if (
            currentStepData.requiresInteraction ||
            currentStepData.requiresInteractionInput
          ) {
            const allChildren = element.getElementsByTagName('*');
            for (let i = 0; i < allChildren.length; i++) {
              (allChildren[i] as HTMLElement).style.pointerEvents = 'none';
            }
            element.style.pointerEvents = 'none';
          }
        }
      });

      // Handle blinking element if specified
      if (currentStepData.blinkAsWellId) {
        const blinkElement = document.getElementById(
          currentStepData.blinkAsWellId
        );
        if (blinkElement) {
          blinkElement.setAttribute('data-tutorial-target', 'true');
          blinkElement.style.zIndex = '504';
        }
      }
    };

    const intervalId = setInterval(checkAndUpdatePosition, 1000);

    // Initial position and style check
    checkAndUpdatePosition();

    return () => clearInterval(intervalId);
  }, [
    currentStep,
    currentStepData?.targetElementId,
    currentStepData?.position,
    currentStepData?.isJsId,
    currentStepData?.checkUnderElementId,
    currentStepData?.checkUnderElementIsJS,
    currentStepData?.blinkAsWellId,
    isMobileState,
    handleOpenSideBar,
    handleCloseSideBar,
  ]);
  useEffect(() => {
    if (currentStepData.targetElementId) {
      const targetId = currentStepData.isJsId
        ? resolveJsId(currentStepData.targetElementId, {
            tutorialNewAppUserId,
            tutorialNewRoomId,
            tutorialNewExpenseId,
            RoomList
          })
        : currentStepData.targetElementId;

      const element = document.getElementById(targetId);
      if (element) {
        // Check if the element is inside SideBarContainer
        let parent = element.parentElement;
        let isUnderSidebar = false;
        while (parent) {
          if (parent.classList.contains('SideBarContainer')) {
            isUnderSidebar = true;
            handleOpenSideBar();
            break;
          }
          parent = parent.parentElement;
        }
        if (isMobileState && !isUnderSidebar) {
          handleCloseSideBar();
        }
      }
    }
    // Cleanup function
    return () => {
  
    };
  }, [currentStepData, RoomList, isMobileState, handleOpenSideBar, handleCloseSideBar]); // Dependencies array includes currentStepData, RoomList, isMobileState, handleOpenSideBar, and handleCloseSideBar

  // Effect to highlight target element and additional elements
  useEffect(() => {
    // Handle additional elements
    const additionalElements = currentStepData.additionalZIndexElements || [];
    const updatedElements = additionalElements
      .map((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.setAttribute('data-tutorial-target', 'true');
          element.style.zIndex = '501';

          // Block interactions for element and all its children if requires interaction
          if (
            currentStepData.requiresInteraction ||
            currentStepData.requiresInteractionInput
          ) {
            const allChildren = element.getElementsByTagName('*');
            for (let i = 0; i < allChildren.length; i++) {
              (allChildren[i] as HTMLElement).style.pointerEvents = 'none';
            }
            element.style.pointerEvents = 'none';
          }
          return element;
        }
        return null;
      })
      .filter(Boolean) as HTMLElement[];

    // Get the target ID, handling JS IDs and parent check
    const targetId = currentStepData.isJsId
      ? resolveJsId(currentStepData.targetElementId, {
          tutorialNewAppUserId,
          tutorialNewRoomId,
          tutorialNewExpenseId,
          RoomList
        })
      : currentStepData.targetElementId;
    let finalTargetId = targetId;

    if (currentStepData.checkUnderElementId && targetId) {
      const parentElement = document.getElementById(
        currentStepData.checkUnderElementIsJS
          ? resolveJsId(currentStepData.checkUnderElementId, {
              tutorialNewAppUserId,
              tutorialNewRoomId,
              tutorialNewExpenseId,
              RoomList
            })
          : currentStepData.checkUnderElementId
      );
      const targetElement = document.getElementById(targetId);

      // Only use the target ID if it's under the specified parent
      if (
        parentElement &&
        targetElement &&
        parentElement.contains(targetElement)
      ) {
        finalTargetId = targetId;
      } else {
        finalTargetId = ''; // Element not found under parent
      }
    }

    // Handle main target element
    const mainElement = finalTargetId
      ? document.getElementById(finalTargetId)
      : null;

    // Handle blinking element
    let blinkElement = null;
    if (currentStepData.blinkAsWellId) {
      blinkElement = document.getElementById(currentStepData.blinkAsWellId);
      if (blinkElement) {
        blinkElement.setAttribute('data-tutorial-target', 'true');
        blinkElement.style.zIndex = '504';
      }
    }

    if (mainElement) {
      mainElement.setAttribute('data-tutorial-target', 'true');
      mainElement.style.zIndex = '504';

      // Keep pointer events enabled for main target and its children if interaction required
      if (
        currentStepData.requiresInteraction ||
        currentStepData.requiresInteractionInput
      ) {
        const allChildren = mainElement.getElementsByTagName('*');
        for (let i = 0; i < allChildren.length; i++) {
          (allChildren[i] as HTMLElement).style.pointerEvents = 'auto';
        }
        mainElement.style.pointerEvents = 'auto';
      }
    }

    // Cleanup function
    return () => {
      updatedElements.forEach((element) => {
        const allChildren = element.getElementsByTagName('*');
        for (let i = 0; i < allChildren.length; i++) {
          (allChildren[i] as HTMLElement).style.pointerEvents = '';
        }
        element.removeAttribute('data-tutorial-target');
        element.style.zIndex = '';
        element.style.pointerEvents = '';
      });

      if (mainElement) {
        const allChildren = mainElement.getElementsByTagName('*');
        for (let i = 0; i < allChildren.length; i++) {
          (allChildren[i] as HTMLElement).style.pointerEvents = '';
        }
        mainElement.removeAttribute('data-tutorial-target');
        mainElement.style.zIndex = '';
        mainElement.style.pointerEvents = '';
      }

      if (blinkElement) {
        blinkElement.removeAttribute('data-tutorial-target');
        blinkElement.style.zIndex = '';
      }
    };
  }, [
    currentStep,
    currentStepData?.targetElementId,
    currentStepData?.additionalZIndexElements,
    currentStepData?.requiresInteraction,
    currentStepData?.requiresInteractionInput,
    currentStepData?.checkUnderElementId,
    currentStepData?.isJsId,
    currentStepData?.checkUnderElementIsJS,
    currentStepData?.blinkAsWellId,
    isMobileState,
    handleOpenSideBar,
    handleCloseSideBar,
  ]);

  const handleNext = () => {
    if (!canProgress) return;

    if (currentStepData.targetElementId.includes('-tab') && isMobileState) {
      handleOpenSideBar();
      console.log('Mobile tab interaction needed');
    }

    setHasInteracted(false);
    setErrorMessage(null);

    if (isLastStep()) {
      setShowCompletionMessage(true);
      // Special case for tryout mode - at the end of each section
      const isTryoutMode = window.location.href.includes('tryout');
      const isLastStepInSection =
        currentStep === currentSectionData.steps.length - 1;

      if (isTryoutMode && isLastStepInSection && !showCompletionMessage) {
        // Highlight all navigation tabs
        const navButtons = document.querySelectorAll('#top-nav-button');
        navButtons.forEach((button) => {
          if (button instanceof HTMLElement) {
            button.setAttribute('data-tutorial-target', 'true');
            button.style.zIndex = '504';
          }
        });

        setShowCompletionMessage(true);
        setTimeout(() => {
          navButtons.forEach((button) => {
            if (button instanceof HTMLElement) {
              button.removeAttribute('data-tutorial-target');
              button.style.zIndex = '';
            }
          });
          onClose();
        }, 5000);
        return;
      }
      setTimeout(() => {
        onClose();
      }, 5000);
      return;
    }

    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentSection < currentPageData.sections.length) {
      setCurrentSection((prev) => prev + 1);
      setCurrentStep(0);
    } else if (currentPage < tutorialData.pages.length - 1) {
      if (currentPageData.autoNext) {
        setCurrentPage((prev) => prev + 1);
        setCurrentSection(0);
        setCurrentStep(0);
      } else {
        setShowCompletionMessage(true);
        setTimeout(() => {
          onClose();
        }, 5000);
        return;
      }
    }
  };
  // Effect to handle element interaction and blocking
  useEffect(() => {
    if (currentStepData.targetElementId) {          


      const targetId = currentStepData.isJsId
        ? resolveJsId(currentStepData.targetElementId, {
            tutorialNewAppUserId,
            tutorialNewRoomId,
            tutorialNewExpenseId,
            RoomList
          })
        : currentStepData.targetElementId;
      let finalTargetId = targetId;

      if (currentStepData.checkUnderElementId && targetId) {
        const parentElement = document.getElementById(
          currentStepData.checkUnderElementIsJS
            ? resolveJsId(currentStepData.checkUnderElementId, {
                tutorialNewAppUserId,
                tutorialNewRoomId,
                tutorialNewExpenseId,
                RoomList
              })
            : currentStepData.checkUnderElementId
        );
        const targetElement = document.getElementById(targetId);

        // Only use the target ID if it's under the specified parent
        if (
          parentElement &&
          targetElement &&
          parentElement.contains(targetElement)
        ) {
          finalTargetId = targetId;
        } else {
          finalTargetId = ''; // Element not found under parent
        }
      }

      const element = document.getElementById(finalTargetId);
      if (element) {
        element.setAttribute('data-tutorial-target', 'true');
        element.style.zIndex = '504';

        if (currentStepData.dontInteract) {
          const blockingHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();

            // Show error message in the card
            setErrorMessage('Please finish the tutorial first');

            // Clear message after 2 seconds
            setTimeout(() => {
              setErrorMessage(null);
            }, 5000);

            return false;
          };

          // Add click and mousedown handlers for better blocking
          element.addEventListener('click', blockingHandler, true);
          element.addEventListener('mousedown', blockingHandler, true);
          element.style.pointerEvents = 'none';
          element.style.cursor = 'not-allowed';

          return () => {
            element.removeEventListener('click', blockingHandler, true);
            element.removeEventListener('mousedown', blockingHandler, true);
            element.style.pointerEvents = '';
            element.style.cursor = '';
            element.removeAttribute('data-tutorial-target');
            element.style.zIndex = '';
          };
        } else if (currentStepData.requiresInteraction) {
          const handleInteraction = () => {
           
              setHasInteracted(true);
              if (currentStepData.whenClickedGoNextStep) {
                handleNext();
              }
            
          };
          element.addEventListener('click', handleInteraction);
          return () => {
            element.removeEventListener('click', handleInteraction);
            element.removeAttribute('data-tutorial-target');
            element.style.zIndex = '';
          };
        } else if (currentStepData.requiresInteractionInput) {
          const handleInput = (e: Event) => {
            const inputElement = e.target as HTMLInputElement;
            setHasInteracted(inputElement.value.length > 1);
          };
          element.addEventListener('input', handleInput);
          return () => {
            element.removeEventListener('input', handleInput);
            element.removeAttribute('data-tutorial-target');
            element.style.zIndex = '';
          };
        }

        // Cleanup for non-interactive elements
        return () => {
          element.removeAttribute('data-tutorial-target');
          element.style.zIndex = '';
        };
      }
    }
  }, [currentStepData, handleNext]);

  const canProgress = !currentStepData?.requiresInteraction || hasInteracted;

  const [showCompletionMessage, setShowCompletionMessage] = useState(false);

  // Function to check if it's the last step of the last section
  const isLastStep = () => {
    const isLastPage = currentPage === tutorialData.pages.length - 1;
    const isLastSection = currentSection === currentPageData.sections.length;
    const isLastStepInSection = currentStep === filteredSteps.length - 1;

    return isLastPage && isLastSection && isLastStepInSection;
  };

  // Modify handleNext to handle tutorial completion

  const handleBack = () => {
    if (!currentStepData.allowBack) return;
    setErrorMessage(null);
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      setCurrentStep(currentSectionData.steps.length - 1);
    } else if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      const prevPage = tutorialData.pages[currentPage - 1];
      setCurrentSection(prevPage.sections.length);
      setCurrentStep(
        prevPage.sections[prevPage.sections.length - 1].steps.length - 1
      );
    }
  };

  // Check if user is on the correct page and has privileges
  const canAccessPage = (requiredPage: string): boolean => {
    switch (requiredPage.toLowerCase()) {
      case 'app user':
        return selectedAppUserId == 'admin';
      case 'property':
        return userPrivileges.viewRoomsPage;
      case 'dashboard':
        return userPrivileges.viewDashboard;
      case 'people':
        return userPrivileges.viewPeoplesPage;

      case 'Tools':
        return userPrivileges.viewToolsPage;
      default:
        return true;
    }
  };

  const isOnCorrectPage =
    currentPageData.hasToBeIn.toLowerCase() === SelectedPage.toLowerCase();
  const hasPageAccess = canAccessPage(currentPageData.hasToBeIn);

  if (!isOnCorrectPage) {
    return (
      <div className="tutorial-manager">
        <div className="tutorial-overlay" />

        <div
          className="tutorial-card"
          style={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        >
          <h2>Wrong Page</h2>
          <p>
            This tutorial needs to be viewed on the {currentPageData.hasToBeIn}{' '}
            page
          </p>

          {hasPageAccess ? (
            <button
              className="tutorial-btn next-btn"
              onClick={() => onNavigate?.(currentPageData.hasToBeIn)}
              style={{ marginBottom: 'var(--0px-V)', marginTop: 'auto' }}
            >
              Go to {currentPageData.hasToBeIn}
            </button>
          ) : (
            <p className="tutorial-error-message">
              You don't have access to the {currentPageData.hasToBeIn} page
            </p>
          )}

          <button
            className="tutorial-close-btn"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 'var(--10px-V)',
              right: 'var(--10px-V)',
              background: 'none',
              border: 'none',
              color: 'var(--Text-Color-Grey)',
              cursor: 'pointer',
              fontSize: 'var(--20px-V)',
            }}
          >
            ×
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Semi-transparent overlay */}
      <div className="tutorial-overlay" />

      <div className="tutorial-card" style={cardPosition}>
        {showCompletionMessage ? (
          <div className="tutorial-completion">
            {window.location.href.includes('tryout') ? (
              currentPageData.hasToBeIn == 'property' ? (
                <>
                  <h2>Completed!</h2>
                  <p>
                    If you have a property, you can click manage propery to view
                    your property.
                  </p>
                  <br />
                  <button
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Close
                  </button>
                </>
              ) : currentPageData.hasToBeIn == "app user" ? (
                <>
                <h2>Completed!</h2>
                <p>
                  You can click select to use the app with that user.
                </p>
                <br />
                <button
                  onClick={() => {
                    onClose();
                  }}
                >
                  Continue Exploring
                </button>
              </>
              ) : (
                <>
                  <h2>Completed!</h2>
                  <p>
                    Tutorial completed successfully, you can view any other
                    pages now.
                  </p>
                  <br />
                  <button
                    onClick={() => {
                      onClose();
                    }}
                  >
                    Close
                  </button>
                </>
              )
            ) : (
              <>
                <h2>Tutorial Complete!</h2>
                <p>
                  Great job! You've completed this tutorial section. 
                </p>
                <br />
                <button
                  onClick={() => {
                    onClose();
                  }}
                >
                  Close
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="tutorial-header">
              <span className="tutorial-small-title">
                {currentPageData.pageTitle[langCode]}
              </span>
              <h2 className="tutorial-main-title">
                {currentSectionData.mainTitle[langCode]}
              </h2>
            </div>

            <p className="tutorial-description">
              {currentStepData.description[langCode]}
            </p>

            {errorMessage && (
              <div className="tutorial-error-message">{errorMessage}</div>
            )}

            <div className="tutorial-controls">
              <div className="tutorial-progress">
                Step {currentStep + 1} of {filteredSteps.length}
              </div>
              <div className="tutorial-buttons">
                {currentStepData.allowBack && currentStep !== 0 && (
                  <button
                    className="tutorial-btn back-btn"
                    onClick={handleBack}
                  >
                    Back
                  </button>
                )}
                {currentStepData.requiresInteraction && !hasInteracted ? (
                  <div className="tutorial-interaction-prompt">
                    Click element to continue
                  </div>
                ) : (
                  <button
                    className="tutorial-btn next-btn"
                    onClick={handleNext}
                  >
                    {isLastStep()
                      ? 'Finish Tutorial'
                      : currentStep === currentSectionData.steps.length - 1
                      ? currentSection === currentPageData.sections.length
                        ? 'Finish Tutorial'
                        : 'Next Section'
                      : 'Next'}
                  </button>
                )}
              </div>
            </div>

            <button
              className="tutorial-close-btn"
              onClick={handleClose}
              style={{
                position: 'absolute',
                top: 'var(--10px-V)',
                right: 'var(--10px-V)',
                background: 'none',
                border: 'none',
                color: 'var(--Text-Color-Grey)',
                cursor: 'pointer',
                fontSize: 'var(--20px-V)',
              }}
            >
              ×
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default TutorialManager;
