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
  eraseAll: () => void;
  resumeStatus: ResumeStatus;
  resume: () => Promise<void>;
  startFresh: () => Promise<void>;
  /** Pull a snapshot SVG of the current canvas. */
  serializeSvg: () => string;
}

export function useDrawing(slug: string): UseDrawingResult {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [resumeStatus, setResumeStatus] = useState<ResumeStatus>('loading');
  // Tracks whether the user has made changes since the last successful save,
  // so we don't redundantly write the empty initial state.
  const hasUserChangedRef = useRef(false);

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
      } catch {
        setStrokes([]);
      }
    }
    setResumeStatus('no-resume');
    hasUserChangedRef.current = false;
  }, [slug]);

  const startFresh = useCallback(async () => {
    await clearInProgress(slug);
    setStrokes([]);
    setResumeStatus('no-resume');
    hasUserChangedRef.current = false;
  }, [slug]);

  const addStroke = useCallback((stroke: Stroke) => {
    setStrokes((prev) => [...prev, stroke]);
    hasUserChangedRef.current = true;
  }, []);

  const undo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
    hasUserChangedRef.current = true;
  }, []);

  const eraseAll = useCallback(() => {
    setStrokes([]);
    hasUserChangedRef.current = true;
  }, []);

  const serializeSvg = useCallback(() => strokesToSvg(strokes), [strokes]);

  // Debounced autosave: every change resets a 5s timer; on timeout, write to IDB.
  useEffect(() => {
    if (!hasUserChangedRef.current) return;
    if (resumeStatus !== 'no-resume') return; // don't save while still loading or asking
    const timer = window.setTimeout(() => {
      saveInProgress({
        slug,
        svg: strokesToSvg(strokes),
        strokesJson: JSON.stringify(strokes),
        updatedAt: Date.now(),
      }).catch((err) => console.warn('autosave failed', err));
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [strokes, slug, resumeStatus]);

  return {
    strokes,
    addStroke,
    undo,
    eraseAll,
    resumeStatus,
    resume,
    startFresh,
    serializeSvg,
  };
}
