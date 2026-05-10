// useCoach — drives the "occasionally check in" coach loop.
//
// Trigger logic (from spec §6.1):
//   every 1s tick:
//     skip if isFetching
//     skip if strokes haven't changed since last fetch
//     skip if (now - lastStrokeAt) < 3s   (user still drawing)
//     skip if (now - lastFetchAt) < 15s   (rate-limit floor)
//     otherwise: fetch

import { useCallback, useEffect, useRef, useState } from 'react';
import { requestCoachAdvice } from '../services/claudeClient';
import { makeId } from '../services/strokeUtils';
import type {
  CoachMessage,
  Guideline,
  Project,
  ProjectStep,
} from '../shared/types';

const TICK_MS = 1000;
const IDLE_THRESHOLD_MS = 3000;
const FETCH_FLOOR_MS = 15000;
const RECENT_HISTORY_SIZE = 3;

export interface UseCoachArgs {
  /** When false, the loop is dormant (no ticks, no fetches). */
  enabled: boolean;
  /** Undefined while the project is loading; we no-op until both project and primaryFocus are ready. */
  project: Project | undefined;
  primaryFocus: Guideline | undefined;
  focusGuidelines: Guideline[];
  steps: ProjectStep[];
  /** How many strokes the user has currently drawn. */
  strokeCount: number;
  /** Wall-clock timestamp (ms) of the most recent stroke completion; 0 if no strokes yet. */
  lastStrokeAt: number;
  /** Returns a PNG data URL of the current canvas. */
  getSnapshot: () => Promise<string>;
}

export interface UseCoachResult {
  messages: CoachMessage[];
  isFetching: boolean;
  error: string | null;
  /** Manually trigger a fetch (e.g., from a "ask the coach" button). */
  fetchNow: () => void;
}

export function useCoach(args: UseCoachArgs): UseCoachResult {
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs let the interval read current values without needing to restart.
  const argsRef = useRef(args);
  argsRef.current = args;

  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const stateRef = useRef({
    lastFetchAt: 0,
    strokesAtLastFetch: 0,
    isFetching: false,
  });

  const triggerFetch = useCallback(async () => {
    const a = argsRef.current;
    if (!a.project || !a.primaryFocus) return;
    if (stateRef.current.isFetching) return;

    stateRef.current.isFetching = true;
    setIsFetching(true);
    setError(null);

    try {
      const dataUrl = await a.getSnapshot();
      const recentAdviceText = messagesRef.current
        .slice(0, RECENT_HISTORY_SIZE)
        .map((m) => `- ${m.text}`)
        .join('\n');

      const result = await requestCoachAdvice({
        project: a.project,
        steps: a.steps,
        primaryFocus: a.primaryFocus,
        focusGuidelines: a.focusGuidelines,
        recentAdviceText,
        imageDataUrl: dataUrl,
      });

      const msg: CoachMessage = {
        id: makeId(),
        text: result.message,
        encouragement: result.encouragement,
        highlightedGuidelineId: result.highlightedGuidelineId,
        createdAt: Date.now(),
      };

      // Newest-first; cap at 10 to avoid unbounded growth in long sessions.
      setMessages((prev) => [msg, ...prev].slice(0, 10));
      stateRef.current.lastFetchAt = Date.now();
      stateRef.current.strokesAtLastFetch = a.strokeCount;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[coach] fetch failed', err);
      setError(err instanceof Error ? err.message : 'The coach is unavailable right now.');
    } finally {
      stateRef.current.isFetching = false;
      setIsFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!args.enabled) return;
    const id = window.setInterval(() => {
      const a = argsRef.current;
      const s = stateRef.current;
      const now = Date.now();
      if (s.isFetching) return;
      if (a.strokeCount === 0) return;
      if (a.strokeCount === s.strokesAtLastFetch) return;
      if (a.lastStrokeAt === 0) return;
      if (now - a.lastStrokeAt < IDLE_THRESHOLD_MS) return;
      if (now - s.lastFetchAt < FETCH_FLOOR_MS) return;
      void triggerFetch();
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [args.enabled, triggerFetch]);

  return {
    messages,
    isFetching,
    error,
    fetchNow: () => void triggerFetch(),
  };
}
