// useAmbientAudio — manages the ambient backing track for a drawing session.
//
// Picks a random track from public/audio/tracks.json on first play (avoiding
// the last-played track so there's no immediate repeat). Plays via HTML5
// <audio>, looping with a soft fade-in/out. Volume follows the audioVolume
// pref. skipTrack fades out the current track and fades in the next one.
//
// No track list → silently no-ops so the app works without audio files.

import { useCallback, useEffect, useRef, useState } from 'react';

const TRACKS_URL = '/audio/tracks.json';
const FADE_DURATION_MS = 500;
const FADE_STEPS = 20;

export interface UseAmbientAudioOptions {
  /** The track filename to start from (avoids repeating the last-played track). */
  initialTrack?: string;
  /** Called whenever a new track is loaded so the caller can persist it. */
  onTrackChange?: (trackName: string) => void;
}

export interface UseAmbientAudioResult {
  /** Start (or resume) the backing track. Safe to call multiple times. */
  play: () => void;
  /** Fade out and pause. */
  pause: () => void;
  /** Fade out current track, load next in list, fade in. */
  skipTrack: () => void;
  /** Immediately stop and unload. Called on unmount. */
  stop: () => void;
  /** true while a track is playing */
  isPlaying: boolean;
  /** Display name of current track (filename without extension), or '' if none. */
  trackName: string;
}

export function useAmbientAudio(volume: number, options?: UseAmbientAudioOptions): UseAmbientAudioResult {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const tracksRef = useRef<string[]>([]);
  const currentIndexRef = useRef<number>(0);
  const fadeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPlayingRef = useRef(false);
  const loadedRef = useRef(false);
  const targetVolumeRef = useRef(volume);
  targetVolumeRef.current = volume;

  const onTrackChangeRef = useRef(options?.onTrackChange);
  onTrackChangeRef.current = options?.onTrackChange;

  const initialTrackRef = useRef(options?.initialTrack);

  const [isPlaying, setIsPlaying] = useState(false);
  const [trackName, setTrackName] = useState('');

  // Update volume immediately when pref changes.
  useEffect(() => {
    if (audioRef.current && isPlayingRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume));
    }
  }, [volume]);

  const clearFade = useCallback(() => {
    if (fadeTimerRef.current !== null) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  }, []);

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
  }, [clearFade]);

  // Load the track at the given index into audioRef.
  const loadTrackAt = useCallback((index: number): HTMLAudioElement | null => {
    const tracks = tracksRef.current;
    if (!tracks.length) return null;

    const filename = tracks[index % tracks.length];
    const el = new Audio(`/audio/tracks/${filename}`);
    el.loop = true;
    el.volume = 0;
    el.preload = 'auto';
    el.addEventListener('error', () => {
      if (audioRef.current === el) audioRef.current = null;
    });

    const name = filename.replace(/\.[^.]+$/, '');
    audioRef.current = el;
    currentIndexRef.current = index % tracks.length;
    onTrackChangeRef.current?.(filename);
    setTrackName(name);
    return el;
  }, []);

  // Fetch the track list once and pick a starting track.
  const loadTrackList = useCallback(async () => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    let tracks: string[] = [];
    try {
      const res = await fetch(TRACKS_URL);
      tracks = await res.json() as string[];
    } catch {
      return;
    }
    if (!Array.isArray(tracks) || tracks.length === 0) return;
    tracksRef.current = tracks;

    // Pick a starting track, avoiding the last-played one.
    const last = initialTrackRef.current;
    const candidates = tracks.length > 1 ? tracks.filter((t) => t !== last) : tracks;
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    const startIndex = tracks.indexOf(chosen);
    loadTrackAt(startIndex >= 0 ? startIndex : 0);
  }, [loadTrackAt]);

  const play = useCallback(() => {
    void (async () => {
      await loadTrackList();
      const el = audioRef.current;
      if (!el) return;
      if (isPlayingRef.current) return;

      el.volume = 0;
      try {
        await el.play();
      } catch {
        return; // Autoplay blocked or file missing.
      }
      isPlayingRef.current = true;
      setIsPlaying(true);
      fade(0, Math.max(0, Math.min(1, targetVolumeRef.current)));
    })();
  }, [loadTrackList, fade]);

  const pause = useCallback(() => {
    const el = audioRef.current;
    if (!el || !isPlayingRef.current) return;
    fade(el.volume, 0, () => {
      el.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    });
  }, [fade]);

  const skipTrack = useCallback(() => {
    const tracks = tracksRef.current;
    if (!tracks.length) return;
    const wasPlaying = isPlayingRef.current;
    const nextIndex = (currentIndexRef.current + 1) % tracks.length;

    const doSwitch = () => {
      // Tear down the old element.
      clearFade();
      const old = audioRef.current;
      if (old) { old.pause(); old.src = ''; }
      audioRef.current = null;

      // Load the new track.
      const el = loadTrackAt(nextIndex);
      if (!el || !wasPlaying) return;

      el.volume = 0;
      void el.play().then(() => {
        isPlayingRef.current = true;
        setIsPlaying(true);
        fade(0, Math.max(0, Math.min(1, targetVolumeRef.current)));
      }).catch(() => {/* silently ignore */});
    };

    if (wasPlaying) {
      // Fade out first, then switch.
      const el = audioRef.current;
      if (el) {
        fade(el.volume, 0, doSwitch);
      } else {
        doSwitch();
      }
    } else {
      doSwitch();
    }
  }, [clearFade, loadTrackAt, fade]);

  const stop = useCallback(() => {
    clearFade();
    const el = audioRef.current;
    if (el) { el.pause(); el.src = ''; }
    audioRef.current = null;
    isPlayingRef.current = false;
    setIsPlaying(false);
  }, [clearFade]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { play, pause, skipTrack, stop, isPlaying, trackName };
}
