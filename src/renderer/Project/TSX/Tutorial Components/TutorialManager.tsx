import React, { useEffect, useState } from 'react';
import { TutorialSystem } from './tutorialData';

interface TutorialManagerProps {
  tutorialData: TutorialSystem;
  onClose: () => void;
}

const TutorialManager = ({ tutorialData, onClose }: TutorialManagerProps) => {
  // Add error checking
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

  // Replace the hardcoded tutorialSystem with the prop
  const tutorialSystem = tutorialData;

  // Add close button to the UI
  const handleClose = () => {
    onClose();
  };

  // State to track current position in tutorial
  const [currentPage, setCurrentPage] = useState(0);
  const [currentSection, setCurrentSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Add state for error message
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get current tutorial content
  const currentPageData = tutorialSystem.pages[currentPage];
  const currentSectionData =
    currentSection === 0
      ? currentPageData.overview
      : currentPageData.sections[currentSection - 1];
  const currentStepData = currentSectionData.steps[currentStep];

  // Function to position the tutorial card relative to target element
  const positionCard = (elementId: string | undefined, position: string) => {
    if (!elementId) return {};

    const element = document.getElementById(elementId);
    if (!element) return {};
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
    const offset = 20 * scaleFactor; // Scale the offset
    const cardWidth = 400 * scaleFactor; // Width of tutorial card
    const cardHeight = 250 * scaleFactor; // Height of tutorial card
    const adjustmentOffset = 40 * scaleFactor; // Scale the adjustment offset

    let style: { [key: string]: string } = {};

    switch (position) {
      case 'left':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          right: `${window.innerWidth - rect.left + offset}px`,
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
        break;

      case 'right':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + offset}px`,
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
          bottom: `${window.innerHeight - rect.top + offset}px`,
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
          top: `${rect.bottom + offset}px`,
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
  const positionCard2 = (elementId: string | undefined, position: string) => {
    if (!elementId) return {};

    const element = document.getElementById(elementId);
    if (!element) return {};

    const rect = element.getBoundingClientRect();
    const screenWidth = window.innerWidth;
    // Calculate scale factor based on screen width
    const scaleFactor =
      screenWidth <= 1920 ? screenWidth / 1920 : screenWidth / 2560;

    // Scale dimensions
    const offset = 20 * scaleFactor;
    const cardWidth = 300 * scaleFactor;
    const cardHeight = 150 * scaleFactor;

    console.log(window.innerWidth - rect.left + offset + rect.width);
    let style: { [key: string]: string } = {};

    switch (position) {
      case 'left':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          right: `${window.innerWidth - rect.left + offset + rect.width}px`,
          transform: 'translateY(-50%)',
        };
        // Adjust if clipping top/bottom
        if (rect.top + rect.height / 2 - cardHeight / 2 < 0) {
          style.top = `${cardHeight / 2}px`;
        } else if (
          rect.top + rect.height / 2 + cardHeight / 2 >
          window.innerHeight
        ) {
          style.top = `${window.innerHeight - cardHeight / 2}px`;
        }
        break;

      case 'right':
        style = {
          top: `${rect.top + rect.height / 2}px`,
          left: `${rect.right + rect.width}px`,
          transform: 'translateY(-50%)',
        };
        // Adjust if clipping top/bottom or right
        if (rect.top + rect.height / 2 - cardHeight / 2 < 0) {
          style.top = `${cardHeight / 2}px`;
        } else if (
          rect.top + rect.height / 2 + cardHeight / 2 >
          window.innerHeight
        ) {
          style.top = `${window.innerHeight - cardHeight / 2}px`;
        }
        if (rect.right + offset + cardWidth > window.innerWidth) {
          style.left = `${window.innerWidth - cardWidth - offset}px`;
        }
        break;

      case 'up':
        style = {
          bottom: `${window.innerHeight - rect.top + offset}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
        // Adjust if clipping left/right
        if (rect.left + rect.width / 2 - cardWidth / 2 < 0) {
          style.left = `${cardWidth / 2}px`;
        } else if (
          rect.left + rect.width / 2 + cardWidth / 2 >
          window.innerWidth
        ) {
          style.left = `${window.innerWidth - cardWidth / 2}px`;
        }
        break;

      case 'down':
        style = {
          top: `${rect.bottom + offset}px`,
          left: `${rect.left + rect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
        // Adjust if clipping left/right or bottom
        if (rect.left + rect.width / 2 - cardWidth / 2 < 0) {
          style.left = `${cardWidth / 2}px`;
        } else if (
          rect.left + rect.width / 2 + cardWidth / 2 >
          window.innerWidth
        ) {
          style.left = `${window.innerWidth - cardWidth / 2}px`;
        }
        if (rect.bottom + offset + cardHeight > window.innerHeight) {
          style.top = `${window.innerHeight - cardHeight - offset}px`;
        }
        break;

      default:
        return {};
    }

    // Apply scale factor to all pixel values in style
    Object.keys(style).forEach((key) => {
      if (style[key].endsWith('px')) {
        const value = parseFloat(style[key]);
        style[key] = `${value * scaleFactor}px`;
      }
    });

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

  // Effect to highlight target element and additional elements
  useEffect(() => {
    const elementsToUpdate = [
      currentStepData.targetElementId,
      ...(currentStepData.additionalZIndexElements || []),
    ];

    const updatedElements = elementsToUpdate
      .map((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.setAttribute('data-tutorial-target', 'true');
          element.style.zIndex = '501';
          return element;
        }
        return null;
      })
      .filter(Boolean);

    return () => {
      updatedElements.forEach((element) => {
        if (element) {
          element.removeAttribute('data-tutorial-target');
          element.style.zIndex = '';
        }
      });
    };
  }, [
    currentStepData.targetElementId,
    currentStepData.additionalZIndexElements,
  ]);

  // Effect to handle element interaction and blocking
  useEffect(() => {
    if (currentStepData.targetElementId) {
      const element = document.getElementById(currentStepData.targetElementId);
      if (element) {
        element.setAttribute('data-tutorial-target', 'true');
        element.style.zIndex = '1001';

        if (currentStepData.dontInteract) {
          const blockingHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Show error message in the card
            setErrorMessage('Please finish the tutorial first');
            
            // Clear message after 2 seconds
            setTimeout(() => {
              setErrorMessage(null);
            }, 2000);
            
            return false;
          };

          element.addEventListener('click', blockingHandler, true);
          element.style.pointerEvents = 'none';

          return () => {
            element.removeEventListener('click', blockingHandler, true);
            element.style.pointerEvents = '';
            element.removeAttribute('data-tutorial-target');
            element.style.zIndex = '';
            setErrorMessage(null);
          };
        } else if (currentStepData.requiresInteraction) {
          const handleInteraction = () => {
            setHasInteracted(true);
          };
          element.addEventListener('click', handleInteraction);
          return () => {
            element.removeEventListener('click', handleInteraction);
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
  }, [currentStepData]);

  const canProgress = !currentStepData.requiresInteraction || hasInteracted;

  const handleNext = () => {
    if (!canProgress) return;

    setHasInteracted(false);
    if (currentStep < currentSectionData.steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentSection < currentPageData.sections.length) {
      setCurrentSection((prev) => prev + 1);
      setCurrentStep(0);
    } else if (currentPage < tutorialSystem.pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
      setCurrentSection(0);
      setCurrentStep(0);
    }
  };

  const handleBack = () => {
    if (!currentStepData.allowBack) return;

    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else if (currentSection > 0) {
      setCurrentSection((prev) => prev - 1);
      setCurrentStep(currentSectionData.steps.length - 1);
    } else if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      const prevPage = tutorialSystem.pages[currentPage - 1];
      setCurrentSection(prevPage.sections.length);
      setCurrentStep(
        prevPage.sections[prevPage.sections.length - 1].steps.length - 1
      );
    }
  };

  return (
    <div className="tutorial-manager">
      {/* Semi-transparent overlay */}
      <div className="tutorial-overlay" />

      <div
        className="tutorial-card"
        style={positionCard(
          currentStepData.targetElementId,
          currentStepData.position
        )}
      >
        <div className="tutorial-header">
          <span className="tutorial-small-title">
            {currentPageData.pageTitle}
          </span>
          <h2 className="tutorial-main-title">
            {currentSectionData.mainTitle}
          </h2>
        </div>

        <p className="tutorial-description">{currentStepData.description}</p>

        {/* Add error message display */}
        {errorMessage && (
          <div className="tutorial-error-message">
            {errorMessage}
          </div>
        )}

        <div className="tutorial-controls">
          <div className="tutorial-progress">
            Step {currentStep + 1} of {currentSectionData.steps.length}
          </div>
          <div className="tutorial-buttons">
            {currentStepData.allowBack && currentStep !== 0 && (
              <button className="tutorial-btn back-btn" onClick={handleBack}>
                Back
              </button>
            )}
            {currentStepData.requiresInteraction && !hasInteracted ? (
              <div className="tutorial-interaction-prompt">
                Click element to continue
              </div>
            ) : (
              <button className="tutorial-btn next-btn" onClick={handleNext}>
                Next
              </button>
            )}
          </div>
        </div>

        {/* Add close button */}
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
      </div>
    </div>
  );
};

export default TutorialManager;
