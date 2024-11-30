import React, { useEffect } from 'react';

interface AlertProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

const CustomAlert: React.FC<AlertProps> = ({
  message,
  type = 'error',
  duration = 20000,
  onClose,
}) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`custom-alert ${type}`}>
      <div className="alert-content">
        <span className="alert-message">{message}</span>
        <button className="close-button" onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  );
};
export default CustomAlert;