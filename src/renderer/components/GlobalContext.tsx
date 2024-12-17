import React, { createContext, useContext, useState } from 'react';

interface GlobalContextType {
  AllRoomPayInfo: RoomPayInfo[];
  setAllRoomPayInfo: React.Dispatch<React.SetStateAction<RoomPayInfo[]>>;
  AllExpenses: expenses[];
  setAllExpenses: React.Dispatch<React.SetStateAction<expenses[]>>;
  AllAgreements: agreements[];
  setAllAgreements: React.Dispatch<React.SetStateAction<agreements[]>>;
  AllTenants: tenant[];
  setAllTenants: React.Dispatch<React.SetStateAction<tenant[]>>;
  AllUtilityPayments: UtilityPayment[];
  setAllUtilityPayments: React.Dispatch<React.SetStateAction<UtilityPayment[]>>;
  AllUtilityPaymentsSettings: UtilityPaymentSettings[];
  setAllUtilityPaymentsSettings: React.Dispatch<React.SetStateAction<UtilityPaymentSettings[]>>;
  AllEmailTemplates: EmailTemplate[];
  setAllEmailTemplates: React.Dispatch<React.SetStateAction<EmailTemplate[]>>;
  AllSmsTemplates: SMSTemplate[];
  setAllSmsTemplates: React.Dispatch<React.SetStateAction<SMSTemplate[]>>;
  AllNotificationTemplateSelections: notification_template_selections[];
  setAllNotificationTemplateSelections: React.Dispatch<React.SetStateAction<notification_template_selections[]>>;
  AllRoomSpecifications: RoomSpecificationType[];
  setAllRoomSpecifications: React.Dispatch<React.SetStateAction<RoomSpecificationType[]>>;
  AllRoomPayInfoHistory: AllRoomPayInfoHistory[];
  setAllRoomPayInfoHistory: React.Dispatch<React.SetStateAction<AllRoomPayInfoHistory[]>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [AllRoomPayInfo, setAllRoomPayInfo] = useState<RoomPayInfo[]>([]);
  const [AllExpenses, setAllExpenses] = useState<expenses[]>([]);
  const [AllAgreements, setAllAgreements] = useState<agreements[]>([]);
  const [AllTenants, setAllTenants] = useState<tenant[]>([]);
  const [AllUtilityPayments, setAllUtilityPayments] = useState<UtilityPayment[]>([]);
const [AllUtilityPaymentsSettings, setAllUtilityPaymentsSettings] = useState<UtilityPaymentSettings[]>([]);
const [AllEmailTemplates, setAllEmailTemplates] = useState<EmailTemplate[]>([]);
const [AllSmsTemplates, setAllSmsTemplates] = useState<SMSTemplate[]>([]);
const [AllNotificationTemplateSelections, setAllNotificationTemplateSelections] = useState<notification_template_selections[]>([]);
const [AllRoomSpecifications, setAllRoomSpecifications] = useState<RoomSpecificationType[]>([]);
const [AllRoomPayInfoHistory, setAllRoomPayInfoHistory] = useState<AllRoomPayInfoHistory[]>([]);
return (
    <GlobalContext.Provider 
      value={{
        AllRoomPayInfo,
        setAllRoomPayInfo,
        AllExpenses,
        setAllExpenses,
        AllAgreements,
        setAllAgreements,
        AllTenants,
        setAllTenants,
        AllUtilityPayments,
        setAllUtilityPayments,
        AllUtilityPaymentsSettings,
        setAllUtilityPaymentsSettings,
        AllEmailTemplates,
        setAllEmailTemplates,
        AllSmsTemplates,
        setAllSmsTemplates,
        AllNotificationTemplateSelections,
        setAllNotificationTemplateSelections,
        AllRoomSpecifications,
        setAllRoomSpecifications,
        AllRoomPayInfoHistory,
        setAllRoomPayInfoHistory,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

// Custom hook to use the global context
export const useGlobal = () => {
  const context = useContext(GlobalContext);
  if (context === undefined) {
    throw new Error('useGlobal must be used within a GlobalProvider');
  }
  return context;
};