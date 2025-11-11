'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface BalanceVisibilityContextType {
  isVisible: boolean;
  toggleVisibility: () => void;
}

const BalanceVisibilityContext = createContext<BalanceVisibilityContextType | undefined>(undefined);

export function BalanceVisibilityProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(prev => !prev);
  };

  return (
    <BalanceVisibilityContext.Provider value={{ isVisible, toggleVisibility }}>
      {children}
    </BalanceVisibilityContext.Provider>
  );
}

export function useBalanceVisibility() {
  const context = useContext(BalanceVisibilityContext);
  if (context === undefined) {
    throw new Error('useBalanceVisibility must be used within a BalanceVisibilityProvider');
  }
  return context;
}
