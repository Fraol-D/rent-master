import React, { createContext, useContext, useState } from 'react';

interface GlobalContextType {
  AllRoomPayInfo: RoomPayInfo[];
  setAllRoomPayInfo: React.Dispatch<React.SetStateAction<RoomPayInfo[]>>;
  AllAgreements: agreements[];
  setAllAgreements: React.Dispatch<React.SetStateAction<agreements[]>>;
  AllTenants: tenant[];
  setAllTenants: React.Dispatch<React.SetStateAction<tenant[]>>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [AllRoomPayInfo, setAllRoomPayInfo] = useState<RoomPayInfo[]>([]);
  const [AllAgreements, setAllAgreements] = useState<agreements[]>([]);
  const [AllTenants, setAllTenants] = useState<tenant[]>([]);

  return (
    <GlobalContext.Provider 
      value={{
        AllRoomPayInfo,
        setAllRoomPayInfo,
        AllAgreements,
        setAllAgreements,
        AllTenants,
        setAllTenants
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