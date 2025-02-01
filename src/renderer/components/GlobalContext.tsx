import React, { createContext, useContext, useEffect, useState } from 'react';
import { cloneDeep } from 'lodash';
import tl from '../translator';
import { storageManager } from 'renderer/storeManager';

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
  RoomList: RoomType[];
  setRoomList: React.Dispatch<React.SetStateAction<RoomType[]>>;

  tutorialNewAppUserId: string;
  setTutorialNewAppUserId: React.Dispatch<React.SetStateAction<string>>;
  tutorialNewExpenseId: string;
  setTutorialNewExpenseId: React.Dispatch<React.SetStateAction<string>>;
  tutorialNewRoomId: string;
  setTutorialNewRoomId: React.Dispatch<React.SetStateAction<string>>;

  isOnTutorial: boolean;
  setIsOnTutorial: React.Dispatch<React.SetStateAction<boolean>>;
  isMobileState: boolean;

  langCode: number;
  setLangCode: React.Dispatch<React.SetStateAction<number>>;
  text: any;
  langSwitch: Function;
  ChangeLanguage: Function; 
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
const [RoomList, setRoomList] = useState<RoomType[]>([]);


//TUTORIAL DATA
const [isOnTutorial, setIsOnTutorial] = useState<boolean>(false);
const [tutorialNewAppUserId, setTutorialNewAppUserId] = useState<string>("");
const [tutorialNewExpenseId, setTutorialNewExpenseId] = useState<string>("");
const [tutorialNewRoomId, setTutorialNewRoomId] = useState<string>("");
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}
const [langCode, setLangCode] = useState<number>(storageManager.get('LangCode') || 0);

function tl_spreader(obj: Record<string, any>, i: number): any {
  if (!obj) return {};

  return Object.entries(obj).reduce((acc, [key, val]) => {
    if (typeof val === "function") {
      acc[key] = function(...args: any[]) {
        try {
          const testResult = val(...Array(val.length).fill(undefined));
          const paramIndex = val.length > 0 && testResult ? 
            Object.keys(testResult).indexOf("LangCode") : -1;
          
          if (paramIndex !== -1 && args[paramIndex] === undefined) {
            args[paramIndex] = langCode;
          }
          return val(...args);
        } catch (error) {
          console.error('Error in tl_spreader function:', error);
          return val(...args);
        }
      };
    } else if (Array.isArray(val) && typeof val !== "string") {
      acc[key] = val[i] ?? val[0];
    } else if (typeof val === "object" && val !== null && typeof val !== "string") {
      acc[key] = tl_spreader(val, i);
    } else {
      acc[key] = val;
    }
    return acc;
  }, {} as Record<string, any>);
}

useEffect(() => {
  try {
    const text = tl_spreader(cloneDeep(tl(langCode)), langCode);
  } catch (error) {
    console.error('Error in language effect:', error);
  }
}, [langCode]);

const text = tl_spreader(cloneDeep(tl(langCode)), langCode);

const ChangeLanguage = async (lang: number) => {
  try {
    storageManager.set('LangCode', lang);
    setLangCode(lang);
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

const langSwitch = () => {
  ChangeLanguage(langCode === 1 ? 0 : 1);
};

const [isMobileState, setIsMobileState] = useState<boolean>(false);
useEffect(() => {
  setIsMobileState(isMobile());
}, []);


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
        RoomList,
        setRoomList,
        tutorialNewAppUserId,
        setTutorialNewAppUserId,
        tutorialNewExpenseId,
        setTutorialNewExpenseId,
        tutorialNewRoomId,setTutorialNewRoomId,
        isOnTutorial,
        setIsOnTutorial,isMobileState,
        text,
        ChangeLanguage, langSwitch 
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