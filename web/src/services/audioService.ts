// audioService — synthesizes UI sound effects via the Web Audio API.
//
// No files required. Each sound is generated procedurally so it works
// immediately without any network requests or missing-file errors.
//
// Usage:
//   sfx.play('stroke-end');
//   sfx.play('button');
//   sfx.play('complete');
//   sfx.play('coach');

export type SfxName = 'stroke-end' | 'button' | 'complete' | 'coach';

class AudioService {
  private ctx: AudioContext | null = null;

  private getCtx(): AudioContext | null {
    if (this.ctx && this.ctx.state !== 'closed') return this.ctx;
    try {
      this.ctx = new AudioContext();
      return this.ctx;
    } catch {
      return null;
    }
  }

  /** Resume the context after a user gesture (browsers suspend it until then). */
  private async resumeCtx(ctx: AudioContext): Promise<boolean> {
    if (ctx.state === 'suspended') {
      try { await ctx.resume(); } catch { return false; }
    }
    return ctx.state === 'running';
  }

  play(name: SfxName, enabled = true, volume = 1): void {
    if (!enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    const v = Math.max(0, Math.min(1, volume));
    void this.resumeCtx(ctx).then((ok) => {
      if (!ok) return;
      switch (name) {
        case 'stroke-end': this.playStrokeEnd(ctx, v); break;
        case 'button':     this.playButton(ctx, v);    break;
        case 'complete':   this.playComplete(ctx, v);  break;
        case 'coach':      this.playCoach(ctx, v);     break;
      }
    });
  }

  // ── Soft pencil tap ──────────────────────────────────────────────────────
  // Short bandpass-filtered noise burst — like a pencil touching paper.
  private playStrokeEnd(ctx: AudioContext, volume: number): void {
    const t = ctx.currentTime;
    const duration = 0.055;

    // White noise buffer
    const bufSize = Math.ceil(ctx.sampleRate * duration);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src = ctx.createBufferSource();
    src.buffer = buf;

    // Bandpass — gives it a papery "tap" character
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 3000;
    bp.Q.value = 0.8;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    src.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);
    src.start(t);
    src.stop(t + duration);
  }

  // ── Crisp UI click ───────────────────────────────────────────────────────
  // Very short sine pulse — snappy and neutral.
  private playButton(ctx: AudioContext, volume: number): void {
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22 * volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.045);
  }

  // ── Gentle completion chime ──────────────────────────────────────────────
  // Three rising sine tones — C5 → E5 → G5, staggered, soft bell quality.
  private playComplete(ctx: AudioContext, volume: number): void {
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.13;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;

      // Add a gentle overtone for bell character
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.value = freq * 2.756; // inharmonic partial

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.18 * volume, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0, t);
      gain2.gain.linearRampToValueAtTime(0.06 * volume, t + 0.01);
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc.start(t); osc.stop(t + 0.6);
      osc2.start(t); osc2.stop(t + 0.4);
    });
  }

  // ── Coach ping ───────────────────────────────────────────────────────────
  // Single soft bell tone — unobtrusive but audible.
  private playCoach(ctx: AudioContext, volume: number): void {
    const t = ctx.currentTime;
    const freq = 740; // F#5 — bright but warm

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = freq * 3.0;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2 * volume, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.05 * volume, t + 0.008);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);

    osc.connect(gain);
    osc2.connect(gain2);
    gain.connect(ctx.destination);
    gain2.connect(ctx.destination);

    osc.start(t); osc.stop(t + 0.55);
    osc2.start(t); osc2.stop(t + 0.3);
  }
}

export const sfx = new AudioService();
