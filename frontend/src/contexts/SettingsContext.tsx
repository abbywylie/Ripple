import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SettingsContextType {
  darkMode: boolean;
  animationsEnabled: boolean;
  efficientLoading: boolean;
  setDarkMode: (enabled: boolean) => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setEfficientLoading: (enabled: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const SETTINGS_STORAGE_KEY = 'ripple_ui_settings';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [darkMode, setDarkModeState] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return settings.darkMode ?? false;
      } catch {
        return false;
      }
    }
    return false;
  });

  const [animationsEnabled, setAnimationsEnabledState] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return settings.animationsEnabled ?? true;
      } catch {
        return true;
      }
    }
    return true;
  });

  const [efficientLoading, setEfficientLoadingState] = useState(() => {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (saved) {
      try {
        const settings = JSON.parse(saved);
        return settings.efficientLoading ?? true;
      } catch {
        return true;
      }
    }
    return true;
  });

  // Apply dark mode to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Apply animation preference
  useEffect(() => {
    if (!animationsEnabled) {
      document.documentElement.style.setProperty('--animation-duration', '0s');
      document.documentElement.classList.add('no-animations');
    } else {
      document.documentElement.style.removeProperty('--animation-duration');
      document.documentElement.classList.remove('no-animations');
    }
  }, [animationsEnabled]);

  const setDarkMode = (enabled: boolean) => {
    setDarkModeState(enabled);
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = saved ? JSON.parse(saved) : {};
    settings.darkMode = enabled;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  };

  const setAnimationsEnabled = (enabled: boolean) => {
    setAnimationsEnabledState(enabled);
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = saved ? JSON.parse(saved) : {};
    settings.animationsEnabled = enabled;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  };

  const setEfficientLoading = (enabled: boolean) => {
    setEfficientLoadingState(enabled);
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
    const settings = saved ? JSON.parse(saved) : {};
    settings.efficientLoading = enabled;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  };

  return (
    <SettingsContext.Provider
      value={{
        darkMode,
        animationsEnabled,
        efficientLoading,
        setDarkMode,
        setAnimationsEnabled,
        setEfficientLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

