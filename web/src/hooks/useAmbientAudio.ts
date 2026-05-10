// useAmbientAudio — manages the ambient backing track for a drawing session.
//
// Picks a random track from public/audio/tracks.json on mount (avoiding the
// last-played track so there's no immediate repeat). Plays via HTML5 <audio>,
// looping with a soft fade-in/out. Volume follows the audioVolume pref.
//
// No track list → silently no-ops so the app works without audio files.

import { useCallback, useEffect, useRef } from 'react';
import { prefs } from '../services/prefsStore';

const TRACKS_URL = '/audio/tracks.json';
const FADE_DURATION_MS = 600;
const FADE_STEPS = 20;

export interface UseAmbientAudioResult {
  /** Start (or resume) the backing track. Safe to call multiple times. */
  play: () => void;
  /** Fade out and pause. */
  pause: () => void;
  /** Immediately stop and unload. Called on unmount. */
  stop: () => void;
  /** true while a track is playing */
  isPlaying: boolean;
}

// We use a ref-based approach so callers don't need to re-subscribe to state.
// The hook exposes stable callbacks.

export function useAmbientAudio(volume: number): UseAmbientAudioResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);
  const targetVolumeRef = useRef(volume);
  targetVolumeRef.current = volume;

  // Update volume immediately when pref changes.
  useEffect(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  const clearFade = () => {
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };

  // Fade helper — linearly ramps audio.volume from `from` to `to` over FADE_DURATION_MS.
  const fade = useCallback((from: number, to: number, onDone?: () => void) => {
    clearFade();
    const el = audioRef.current;
    if (!el) { onDone?.(); return; }

    const step = (to - from) / FADE_STEPS;
    const interval = FADE_DURATION_MS / FADE_STEPS;
    let current = from;
    el.volume = Math.max(0, Math.min(1, from));

    fadeTimerRef.current = setInterval(() => {
      current += step;
      const clamped = Math.max(0, Math.min(1, current));
      if (el) el.volume = clamped;
      if ((step > 0 && current >= to) || (step < 0 && current <= to)) {
        clearFade();
        if (el) el.volume = Math.max(0, Math.min(1, to));
        onDone?.();
      }
    }, interval);
  }, []);

  // Load and set up the audio element once.
  const initAudio = useCallback(async () => {
    if (audioRef.current) return; // already loaded

    let tracks: string[] = [];
    try {
      const res = await fetch(TRACKS_URL);
      tracks = await res.json() as string[];
    } catch {
      // Network issue or malformed JSON — no audio.
      return;
    }

    if (!Array.isArray(tracks) || tracks.length === 0) return;

    // Pick a random track, avoiding the last-played one.
    const last = prefs.getLastTrack();
    const candidates = tracks.length > 1 ? tracks.filter((t) => t !== last) : tracks;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];

    const el = new Audio(`/audio/tracks/${chosen}`);
    el.loop = true;
    el.volume = 0;
    el.preload = 'auto';

    el.addEventListener('error', () => {
      // File missing or undecodable — silently give up.
      audioRef.current = null;
    });

    audioRef.current = el;
    prefs.setLastTrack(chosen);
  }, []);

  const play = useCallback(() => {
    void (async () => {
      await initAudio();
      const el = audioRef.current;
      if (!el) return;
      if (isPlayingRef.current) return;

      el.volume = 0;
      try {
        await el.play();
      } catch {
        // Autoplay blocked or file missing — no-op.
        return;
      }
      isPlayingRef.current = true;
      fade(0, Math.max(0, Math.min(1, targetVolumeRef.current)));
    })();
  }, [initAudio, fade]);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (!el || !isPlayingRef.current) return;
    fade(el.volume, 0, () => {
      el.pause();
      isPlayingRef.current = false;
    });
  }, [fade]);

  const stop = useCallback(() => {
    clearFade();
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.src = '';
    }
    audioRef.current = null;
    isPlayingRef.current = false;
  }, []);

  // Cleanup on unmount.
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { play, pause, stop, isPlaying: isPlayingRef.current };
}
