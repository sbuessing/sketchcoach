// useDrawing — central state for the drawing canvas.
//
// Owns the strokes array. Provides addStroke / undo / eraseAll.
// Handles IndexedDB autosave (debounced 5s after last change) and
// resume-vs-fresh prompting on mount.

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Stroke } from '../shared/types';
import {
  clearInProgress,
  getInProgress,
  saveInProgress,
} from '../services/portfolioStore';
import { strokesToSvg } from '../services/strokeUtils';

const AUTOSAVE_DEBOUNCE_MS = 5000;

export type ResumeStatus = 'loading' | 'has-resume' | 'no-resume';

export interface UseDrawingResult {
  strokes: Stroke[];
  addStroke: (stroke: Stroke) => void;
  undo: () => void;
  redo: () => void;
  /** True when there's at least one undone stroke that can be replayed. */
  canRedo: boolean;
  eraseAll: () => void;
  eraseStroke: (id: string) => void;
  resumeStatus: ResumeStatus;
  resume: () => Promise<void>;
  startFresh: () => Promise<void>;
  /** Pull a snapshot SVG of the current canvas. */
  serializeSvg: () => string;
  /** Wall-clock timestamp (ms) when the most recent stroke completed; 0 if none. */
  lastStrokeAt: number;
  /** Wall-clock timestamp (ms) when the session started; 0 if no strokes yet. */
  startedAt: number;
  /** Wall-clock timestamp (ms) of the last successful IndexedDB save; 0 if not yet saved. */
  savedAt: number;
  /** Force-write the current strokes to IndexedDB immediately, bypassing the debounce. */
  flushSave: () => Promise<void>;
}

export function useDrawing(slug: string): UseDrawingResult {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [lastStrokeAt, setLastStrokeAt] = useState<number>(0);
  const [startedAt, setStartedAt] = useState<number>(0);
  const [savedAt, setSavedAt] = useState<number>(0);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus>('loading');
  // Tracks whether the user has made changes since the last successful save,
  // so we don't redundantly write the empty initial state.
  const hasUserChangedRef = useRef(false);

  // Undo/redo: undone strokes live in a side stack so they can be replayed.
  // Any destructive action (new stroke, erase, resume, fresh-start) clears it
  // — once history diverges, the old future is gone.
  const [undoneStack, setUndoneStack] = useState<Stroke[]>([]);

  // Refs shadow state so flushSave can read current values synchronously.
  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const startedAtRef = useRef(startedAt);
  startedAtRef.current = startedAt;
  const undoneStackRef = useRef(undoneStack);
  undoneStackRef.current = undoneStack;

  // On mount, see if there's a saved drawing for this slug.
  useEffect(() => {
    let cancelled = false;
    setResumeStatus('loading');
    getInProgress(slug)
      .then((d) => {
        if (cancelled) return;
        const hasContent = !!d && d.strokesJson && d.strokesJson !== '[]';
        setResumeStatus(hasContent ? 'has-resume' : 'no-resume');
      })
      .catch(() => {
        if (!cancelled) setResumeStatus('no-resume');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const resume = useCallback(async () => {
    const d = await getInProgress(slug);
    if (d) {
      try {
        const parsed: Stroke[] = JSON.parse(d.strokesJson);
        setStrokes(parsed);
        setStartedAt(d.startedAt || d.updatedAt || Date.now());
      } catch {
        setStrokes([]);
        setStartedAt(0);
      }
    }
    setUndoneStack([]);
    setResumeStatus('no-resume');
    hasUserChangedRef.current = false;
  }, [slug]);

  const startFresh = useCallback(async () => {
    await clearInProgress(slug);
    setStrokes([]);
    setStartedAt(0);
    setUndoneStack([]);
    setResumeStatus('no-resume');
    hasUserChangedRef.current = false;
  }, [slug]);

  const addStroke = useCallback((stroke: Stroke) => {
    const now = Date.now();
    setStrokes((prev) => [...prev, stroke]);
    setLastStrokeAt(now);
    setStartedAt((prev) => (prev === 0 ? now : prev));
    setUndoneStack([]);
    hasUserChangedRef.current = true;
  }, []);

  const undo = useCallback(() => {
    if (strokesRef.current.length === 0) return;
    const last = strokesRef.current[strokesRef.current.length - 1];
    setStrokes((prev) => prev.slice(0, -1));
    setUndoneStack((u) => [...u, last]);
    hasUserChangedRef.current = true;
  }, []);

  const redo = useCallback(() => {
    if (undoneStackRef.current.length === 0) return;
    const last = undoneStackRef.current[undoneStackRef.current.length - 1];
    setUndoneStack((u) => u.slice(0, -1));
    setStrokes((prev) => [...prev, last]);
    hasUserChangedRef.current = true;
  }, []);

  const eraseAll = useCallback(() => {
    setStrokes([]);
    setUndoneStack([]);
    hasUserChangedRef.current = true;
  }, []);

  const eraseStroke = useCallback((id: string) => {
    setStrokes((prev) => prev.filter((s) => s.id !== id));
    setUndoneStack([]);
    hasUserChangedRef.current = true;
  }, []);

  const serializeSvg = useCallback(() => strokesToSvg(strokes), [strokes]);

  const flushSave = useCallback(async () => {
    if (!hasUserChangedRef.current) return;
    const now = Date.now();
    await saveInProgress({
      slug,
      svg: strokesToSvg(strokesRef.current),
      strokesJson: JSON.stringify(strokesRef.current),
      startedAt: startedAtRef.current || now,
      updatedAt: now,
    });
  }, [slug]);

  // Debounced autosave: every change resets a 5s timer; on timeout, write to IDB.
  useEffect(() => {
    if (!hasUserChangedRef.current) return;
    if (resumeStatus !== 'no-resume') return; // don't save while still loading or asking
    const timer = window.setTimeout(() => {
      const now = Date.now();
      saveInProgress({
        slug,
        svg: strokesToSvg(strokes),
        strokesJson: JSON.stringify(strokes),
        startedAt: startedAt || now,
        updatedAt: now,
      })
        .then(() => setSavedAt(Date.now()))
        .catch((err) => console.warn('autosave failed', err));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [strokes, slug, resumeStatus, startedAt]);

  return {
    strokes,
    addStroke,
    undo,
    redo,
    canRedo: undoneStack.length > 0,
    eraseAll,
    eraseStroke,
    resumeStatus,
    resume,
    startFresh,
    serializeSvg,
    lastStrokeAt,
    startedAt,
    savedAt,
    flushSave,
  };
}
