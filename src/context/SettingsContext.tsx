import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { getItem, setItem } from '@services/storage/asyncStorage';
import { STORAGE_KEYS } from '@utils/constants';

interface Settings {
  keepScreenBright: boolean;
  autoRefresh: boolean;
}

interface SettingsContextValue extends Settings {
  setKeepScreenBright: (value: boolean) => void;
  setAutoRefresh: (value: boolean) => void;
  isLoading: boolean;
}

const defaultSettings: Settings = {
  keepScreenBright: false,
  autoRefresh: false,
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from storage on mount
  useEffect(() => {
    const loadSettings = async () => {
      const stored = await getItem<Settings>(STORAGE_KEYS.SETTINGS);
      if (stored) {
        setSettings(stored);
      }
      setIsLoading(false);
    };
    loadSettings();
  }, []);

  // Save settings to storage when they change
  const updateSettings = async (newSettings: Settings) => {
    setSettings(newSettings);
    await setItem(STORAGE_KEYS.SETTINGS, newSettings);
  };

  const setKeepScreenBright = (value: boolean) => {
    updateSettings({ ...settings, keepScreenBright: value });
  };

  const setAutoRefresh = (value: boolean) => {
    updateSettings({ ...settings, autoRefresh: value });
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setKeepScreenBright,
        setAutoRefresh,
        isLoading,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
