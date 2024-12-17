import React, { useState } from 'react';

const CornerSupport = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<'tutorial' | 'support' | null>(null);
  const [isClosing, setIsClosing] = useState(false);

  const toggleOpen = () => {
    if (isOpen && selectedOption) {
      setIsClosing(true);
      setTimeout(() => {
        setSelectedOption(null);
        setIsClosing(false);
      }, 300); // Match animation duration
    } 
  

    setIsOpen(!isOpen);
  };

  return (
    <div style={{ position: 'fixed', bottom: 'var(--20px-V)', right: 'var(--20px-V)', zIndex: 1000 }}>
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
          color: 'var(--Text-Color)'
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
            paddingRight: 'var(--120px-V)',
            borderRadius: 'var(--10px-V)',
            transformOrigin: 'right center',
         
            animation: isClosing 
              ? '0.3s ease-out slideOutBar' 
              : '0.3s ease-out slideInBar'
          }}
        >
          <button 
            onClick={() => setSelectedOption('tutorial')}
            style={{
              padding: 'var(--5px-V) var(--15px-V)',
              borderRadius: 'var(--5px-V)',
              border: 'var(--1px-V) solid var(--Secondary-Color)',
              background: 'var(--Background-Color)',
              color: 'var(--Text-Color)',
              cursor: 'pointer'
            }}
          >
            Tutorial
          </button>

          <button 
            onClick={() => setSelectedOption('support')}
            style={{
                padding: 'var(--5px-V) var(--15px-V)',
                borderRadius: 'var(--5px-V)',
              border: 'var(--1px-V) solid var(--Secondary-Color)',
              background: 'var(--Background-Color)',
              color: 'var(--Text-Color)',
              cursor: 'pointer'
            }}
          >
            Support
          </button>
        </div>
      )}

      {selectedOption && (
        <div
          style={{
            position: 'fixed',
            right: 'var(--47px-V)',
            bottom: 'var(--65px-V)',
            width: 'var(--270px-V)',
            height: '75vh',
            backgroundColor: 'var(--Background-Color)',
            boxShadow: '0px 0px var(--10px-V) var(--Secondary-Color)',
            borderRadius: 'var(--10px-V)',
            padding: 'var(--20px-V)',
            display: 'flex',
            flexDirection: 'column',
            transformOrigin: 'right bottom',
         
            animation: isClosing 
              ? '0.3s ease-out slideOutPanel' 
              : '0.3s ease-out slideInPanel'
          }}
        >
          {selectedOption === 'tutorial' ? (
            <div style={{ fontSize: 'var(--24px-V)', textAlign: 'center' }}>
              TUTORIALLLLLLLL
            </div>
          ) : (
            <div style={{ fontSize: 'var(--24px-V)', textAlign: 'center' }}>
              SUPPPOOOORT
            </div>
          )}
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
  );
};

export default CornerSupport;