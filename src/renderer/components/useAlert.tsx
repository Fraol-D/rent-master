import React, { createContext, useContext, useState } from 'react';
import CustomAlert from './CustomAlert';

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, duration?: number) => void; 
}

export type AlertType = 'success' | 'error' | 'warning' | 'info';

const AlertContext = createContext<AlertContextType | undefined>(undefined);

interface Alert {
  id: number;
  message: string;
  type: AlertType;
  duration: number;
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const showAlert = (
    message: string,
    type: AlertType = 'error',
    duration = 8000
  ) => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      }, duration);
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <div className="alert-container">
        {alerts.map((alert) => (
          <CustomAlert
            key={alert.id}
            message={alert.message}
            type={alert.type}
            onClose={() =>
              setAlerts((prev) => prev.filter((a) => a.id !== alert.id))
            }
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};
