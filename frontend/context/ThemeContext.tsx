'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { applyMode, Mode } from '@cloudscape-design/global-styles';

interface ThemeContextType {
  mode: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const savedMode = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedMode === 'dark') {
      setMode('dark');
      applyMode(Mode.Dark);
    } else {
      setMode('light');
      applyMode(Mode.Light);
    }
  }, []);

  const toggleTheme = () => {
    const nextMode = mode === 'light' ? 'dark' : 'light';
    setMode(nextMode);
    localStorage.setItem('theme', nextMode);
    applyMode(nextMode === 'dark' ? Mode.Dark : Mode.Light);
  };

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
