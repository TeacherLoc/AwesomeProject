/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MUIThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    // Also check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return savedTheme || (prefersDark ? 'dark' : 'light');
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Create MUI theme based on current theme
  const muiTheme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: theme,
          primary: {
            main: '#E0408C',
            50: theme === 'dark' ? 'rgba(224, 64, 140, 0.08)' : '#fce4ec',
            200: theme === 'dark' ? 'rgba(224, 64, 140, 0.3)' : '#f48fb1',
          },
          secondary: {
            main: '#6c5ce7',
          },
          success: {
            main: '#4CAF50',
          },
          error: {
            main: '#EF4444',
          },
          warning: {
            main: '#FF9800',
          },
          info: {
            main: '#2196F3',
          },
          background: {
            default: theme === 'dark' ? '#1a1a1a' : '#f5f5f5',
            paper: theme === 'dark' ? '#2d2d2d' : '#ffffff',
          },
          text: {
            primary: theme === 'dark' ? '#f5f5f5' : '#111827',
            secondary: theme === 'dark' ? '#b0b0b0' : '#6b7280',
          },
          action: {
            hover: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
          divider: theme === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
        },
      }),
    [theme]
  );

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <MUIThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};
