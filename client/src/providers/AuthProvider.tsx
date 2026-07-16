import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

interface PinSettings {
  enabled: boolean;
  autoLockMinutes: number;
}

interface AuthContextType {
  locked: boolean;
  lock: () => void;
  unlock: (pin: string) => Promise<boolean>;
  checkPinSettings: () => Promise<void>;
  resetLock: () => void;
  pinSettings: PinSettings;
  setPinSettings: (settings: Partial<PinSettings>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = '/api/settings';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`Auth API error: ${res.status}`);
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [locked, setLocked] = useState(true);
  const [pinSettings, setPinSettingsState] = useState<PinSettings>({ enabled: false, autoLockMinutes: 5 });
  const [lockTimer, setLockTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const resetLockTimer = useCallback(() => {
    if (lockTimer) clearTimeout(lockTimer);
    if (pinSettings.enabled && pinSettings.autoLockMinutes > 0) {
      const timer = setTimeout(() => {
        setLocked(true);
      }, pinSettings.autoLockMinutes * 60 * 1000);
      setLockTimer(timer);
    } else {
      setLockTimer(null);
    }
  }, [lockTimer, pinSettings.enabled, pinSettings.autoLockMinutes]);

  useEffect(() => {
    const handleActivity = () => {
      if (!locked) resetLockTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      if (lockTimer) clearTimeout(lockTimer);
    };
  }, [locked, resetLockTimer]);

  const checkPinSettings = useCallback(async () => {
    try {
      const settings = await request<PinSettings>(`${API_BASE}/pin`);
      setPinSettingsState(settings);
      if (settings.enabled) {
        setLocked(true);
      } else {
        setLocked(false);
      }
    } catch {
      setLocked(false);
      setPinSettingsState({ enabled: false, autoLockMinutes: 5 });
    }
  }, []);

  useEffect(() => {
    checkPinSettings();
  }, [checkPinSettings]);

  const unlock = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const result = await request<{ success: boolean }>(`${API_BASE}/pin/verify`, {
        method: 'POST',
        body: JSON.stringify({ pin }),
      });
      if (result.success) {
        setLocked(false);
        resetLockTimer();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [resetLockTimer]);

  const lock = useCallback(() => {
    setLocked(true);
  }, []);

  const resetLock = useCallback(() => {
    setLocked(false);
    resetLockTimer();
  }, [resetLockTimer]);

  const setPinSettingsAsync = useCallback(async (settings: Partial<PinSettings>) => {
    await request(`${API_BASE}/pin`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    setPinSettingsState((prev) => ({ ...prev, ...settings }));
    resetLockTimer();
  }, [resetLockTimer]);

  return (
    <AuthContext.Provider
      value={{
        locked,
        lock,
        unlock,
        checkPinSettings,
        resetLock,
        pinSettings,
        setPinSettings: setPinSettingsAsync,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}