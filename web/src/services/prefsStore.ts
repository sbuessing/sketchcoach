// Thin wrapper around localStorage for user preferences.
// Keys are namespaced; values are JSON-encoded.

const NS = 'sketchcoach_';

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw == null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch {
    // Quota exceeded or storage disabled — silently no-op.
  }
}

export const prefs = {
  getAudioVolume: () => read<number>('audio_volume', 0.3),
  setAudioVolume: (v: number) => write('audio_volume', v),

  getSfxEnabled: () => read<boolean>('sfx_enabled', true),
  setSfxEnabled: (b: boolean) => write('sfx_enabled', b),

  getLastTrack: () => read<string | null>('last_track', null),
  setLastTrack: (filename: string) => write('last_track', filename),
};
