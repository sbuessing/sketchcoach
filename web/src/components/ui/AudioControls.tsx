import './AudioControls.css';

interface AudioControlsProps {
  volume: number;
  onVolumeChange: (v: number) => void;
  sfxEnabled: boolean;
  onSfxToggle: () => void;
  isPlaying: boolean;
  trackName: string;
  onSkipTrack: () => void;
}

export default function AudioControls({
  volume,
  onVolumeChange,
  sfxEnabled,
  onSfxToggle,
  isPlaying,
  trackName,
  onSkipTrack,
}: AudioControlsProps) {
  return (
    <div className="audio-controls" aria-label="Audio controls">
      {/* Track name + playing indicator */}
      {trackName && (
        <span className={`audio-controls__track-name ${isPlaying ? 'audio-controls__track-name--playing' : ''}`}>
          {isPlaying ? '♪' : '—'} {trackName}
        </span>
      )}

      {/* Volume slider */}
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

      {/* Skip to next track */}
      <button
        type="button"
        className="audio-controls__icon-btn"
        onClick={onSkipTrack}
        aria-label="Next track"
        title="Next track"
      >
        ⏭
      </button>

      {/* SFX toggle */}
      <button
        type="button"
        className={`audio-controls__icon-btn ${sfxEnabled ? '' : 'audio-controls__icon-btn--muted'}`}
        onClick={onSfxToggle}
        aria-label={sfxEnabled ? 'Mute sound effects' : 'Enable sound effects'}
        title={sfxEnabled ? 'SFX on' : 'SFX off'}
      >
        {sfxEnabled ? '🔔' : '🔕'}
      </button>
    </div>
  );
}
