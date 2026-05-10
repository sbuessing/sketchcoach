// audioService — preloads and plays short SFX clips.
//
// Gated by the sfxEnabled pref. Preloading happens lazily on first call so
// the service can be imported without triggering any network activity until
// the user actually enters a drawing session.
//
// Usage:
//   import { sfx } from '../services/audioService';
//   sfx.play('stroke-end');
//   sfx.play('button');
//   sfx.play('complete');
//   sfx.play('coach');

export type SfxName = 'stroke-end' | 'button' | 'complete' | 'coach';

const SFX_FILES: Record<SfxName, string> = {
  'stroke-end': '/audio/sfx/stroke-end.wav',
  'button':     '/audio/sfx/button.wav',
  'complete':   '/audio/sfx/complete.wav',
  'coach':      '/audio/sfx/coach.wav',
};

class AudioService {
  private pool: Map<SfxName, HTMLAudioElement[]> = new Map();
  private preloaded = false;

  /** Call once when the user enters a session, or lazily on first play. */
  preload(): void {
    if (this.preloaded) return;
    this.preloaded = true;
    for (const [name, path] of Object.entries(SFX_FILES) as [SfxName, string][]) {
      // Small pool of 2 per sound so rapid repeats don't cut each other off.
      const pool: HTMLAudioElement[] = [];
      for (let i = 0; i < 2; i++) {
        const el = new Audio(path);
        el.preload = 'auto';
        pool.push(el);
      }
      this.pool.set(name, pool);
    }
  }

  /**
   * Play an SFX clip.
   * @param name     The SFX clip to play.
   * @param enabled  Whether SFX are enabled (from sfxEnabled pref). Default true.
   * @param volume   0–1 volume multiplier. Default 1.
   */
  play(name: SfxName, enabled = true, volume = 1): void {
    if (!enabled) return;
    this.preload(); // lazy init if not already done

    const pool = this.pool.get(name);
    if (!pool) return;

    // Find an element that's not currently playing (currentTime === 0 or ended).
    const el = pool.find((a) => a.paused) ?? pool[0];
    el.volume = Math.max(0, Math.min(1, volume));
    el.currentTime = 0;
    el.play().catch(() => {
      // File missing, codec unsupported, or autoplay blocked — silent no-op.
    });
  }
}

export const sfx = new AudioService();
