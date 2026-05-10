import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Guideline, PortfolioEntry, Project } from '../shared/types';
import { loadGuidelines, loadProjects } from '../services/dataService';
import { listPortfolio } from '../services/portfolioStore';
import { prefs } from '../services/prefsStore';

interface AppContextValue {
  // Static data
  projects: Project[];
  guidelines: Guideline[];
  isReady: boolean;

  // Audio prefs
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (b: boolean) => void;

  // Portfolio
  portfolio: PortfolioEntry[];
  refreshPortfolio: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [guidelines, setGuidelines] = useState<Guideline[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [audioVolume, setAudioVolumeState] = useState<number>(() => prefs.getAudioVolume());
  const [sfxEnabled, setSfxEnabledState] = useState<boolean>(() => prefs.getSfxEnabled());

  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);

  // Load static data and portfolio on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [p, g, port] = await Promise.all([
        loadProjects(),
        loadGuidelines(),
        listPortfolio(),
      ]);
      if (cancelled) return;
      setProjects(p);
      setGuidelines(g);
      setPortfolio(port);
      setIsReady(true);
    })().catch((err) => {
      console.error('Failed to load app data', err);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setAudioVolume = useCallback((v: number) => {
    setAudioVolumeState(v);
    prefs.setAudioVolume(v);
  }, []);

  const setSfxEnabled = useCallback((b: boolean) => {
    setSfxEnabledState(b);
    prefs.setSfxEnabled(b);
  }, []);

  const refreshPortfolio = useCallback(async () => {
    const port = await listPortfolio();
    setPortfolio(port);
  }, []);

  const value: AppContextValue = {
    projects,
    guidelines,
    isReady,
    audioVolume,
    setAudioVolume,
    sfxEnabled,
    setSfxEnabled,
    portfolio,
    refreshPortfolio,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return ctx;
}
