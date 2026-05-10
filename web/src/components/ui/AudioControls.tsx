// AudioControls — compact volume + SFX toggle for the drawing screen.
// Lives in the toolbar row; hidden when audio isn't configured (no tracks and
// SFX are silent placeholders), but always shown so the user can mute.

import './AudioControls.css';

interface AudioControlsProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  sfxEnabled: boolean;
  onSfxToggle: () => void;
  isPlaying: boolean;
}

export default function AudioControls({
  volume,
  onVolumeChange,
  sfxEnabled,
  onSfxToggle,
  isPlaying,
}: AudioControlsProps) {
  return (
    <div className="audio-controls" aria-label="Audio controls">
      <button
        type="button"
        className={`audio-controls__music-btn ${isPlaying ? 'audio-controls__music-btn--active' : ''}`}
        aria-label={isPlaying ? 'Music playing' : 'Music paused'}
        title={isPlaying ? 'Ambient music on' : 'Ambient music off'}
        disabled
        aria-disabled
      >
        ♪
      </button>

      <input
        type="range"
        className="audio-controls__slider"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
        aria-label="Music volume"
        title={`Volume: ${Math.round(volume * 100)}%`}
      />

      <button
        type="button"
        className={`audio-controls__sfx-btn ${sfxEnabled ? '' : 'audio-controls__sfx-btn--muted'}`}
        onClick={onSfxToggle}
        aria-label={sfxEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        title={sfxEnabled ? 'SFX on' : 'SFX off'}
      >
        {sfxEnabled ? '🔔' : '🔕'}
      </button>
    </div>
  );
}
