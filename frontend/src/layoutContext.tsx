import React, { createContext, useContext } from 'react';

interface LayoutProbeState {
  mainWidth: number;
}

interface LayoutContextValue {
  collapsed: boolean;
  sidebarWidth: number;
  testProbe: LayoutProbeState;
  setCollapsed: (value: boolean) => void;
  setTestProbe: React.Dispatch<React.SetStateAction<LayoutProbeState>>;
}

const LayoutContext = createContext<LayoutContextValue | undefined>(undefined);

export const LayoutProvider: React.FC<{ value: LayoutContextValue; children: React.ReactNode }> = ({
  value,
  children
}) => {
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
};

export const useLayout = (): LayoutContextValue => {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error('useLayout must be used within LayoutProvider');
  }
  return ctx;
};
