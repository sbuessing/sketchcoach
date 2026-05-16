import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Guideline, PortfolioEntry, Project, Scene } from '../shared/types';
import { loadGuidelines, loadProjects, loadScenes } from '../services/dataService';
import { clearAllInProgress, clearPortfolio, listPortfolio } from '../services/portfolioStore';
import { prefs } from '../services/prefsStore';

/**
 * Bump this whenever project slugs change shape and any persisted portfolio /
 * in-progress entries from earlier versions become stranded. On load, if the
 * stored version is lower we wipe IndexedDB once and bring the user back to
 * a clean state. This is a single-developer app — no need for nuanced migration.
 */
const CURRENT_DATA_VERSION = 2;

interface AppContextValue {
  // Static data
  projects: Project[];
  guidelines: Guideline[];
  scenes: Scene[];
  isReady: boolean;

  // Active scene (which scene's grid is shown on the home screen)
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;

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
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [isReady, setIsReady] = useState(false);

  const [activeSceneId, setActiveSceneIdState] = useState<string>(() => prefs.getActiveSceneId());

  const [audioVolume, setAudioVolumeState] = useState<number>(() => prefs.getAudioVolume());
  const [sfxEnabled, setSfxEnabledState] = useState<boolean>(() => prefs.getSfxEnabled());

  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);

  // Load static data and portfolio on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // One-time v1 → v2 wipe: old project slugs are gone, so any cached
      // portfolio entries or in-progress drawings keyed to them are stranded.
      const storedVersion = prefs.getDataVersion();
      if (storedVersion < CURRENT_DATA_VERSION) {
        await Promise.all([clearPortfolio(), clearAllInProgress()]);
        prefs.setDataVersion(CURRENT_DATA_VERSION);
      }

      const [p, g, s, port] = await Promise.all([
        loadProjects(),
        loadGuidelines(),
        loadScenes(),
        listPortfolio(),
      ]);
      if (cancelled) return;
      setProjects(p);
      setGuidelines(g);
      setScenes(s);
      setPortfolio(port);
      setIsReady(true);
    })().catch((err) => {
      console.error('Failed to load app data', err);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setActiveSceneId = useCallback((id: string) => {
    setActiveSceneIdState(id);
    prefs.setActiveSceneId(id);
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
    scenes,
    isReady,
    activeSceneId,
    setActiveSceneId,
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
