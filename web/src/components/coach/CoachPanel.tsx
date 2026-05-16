import type { CoachMessage, Guideline } from '../../shared/types';
import './CoachPanel.css';

interface CoachPanelProps {
  messages: CoachMessage[];
  isFetching: boolean;
  focusGuideline?: Guideline;
  error?: string | null;
  /** True if the coach can't run (no API key configured). */
  disabled?: boolean;
  /** Message to show when disabled. Defaults to a generic fallback. */
  disabledReason?: string;
}

export default function CoachPanel({
  messages,
  isFetching,
  focusGuideline,
  error,
  disabled,
  disabledReason,
}: CoachPanelProps) {
  return (
    <div className="coach-panel">
      {focusGuideline && (
        <div className="coach-panel__focus">
          <p className="coach-panel__focus-label">Today's focus</p>
          <p className="coach-panel__focus-title">{focusGuideline.title}</p>
        </div>
      )}

      <div className="coach-panel__messages">
        {disabled && (
          <p className="coach-panel__empty">
            {disabledReason ?? 'The coach needs an API key to give feedback.'}
          </p>
        )}

        {!disabled && error && (
          <p className="coach-panel__error">
            <strong>Coach hiccup:</strong> {error}
          </p>
        )}

        {!disabled && isFetching && (
          <p className="coach-panel__loading">
            <span className="dot" />
            <span className="dot" />
            <span className="dot" />
            <span style={{ marginLeft: 8 }}>Looking at your sketch…</span>
          </p>
        )}

        {messages.map((m) => (
          <div key={m.id} className={`coach-panel__msg coach-panel__msg--${m.encouragement}`}>
            {m.text}
          </div>
        ))}

        {/* Intro card — shown beneath messages (column-reverse, so it's at the bottom visually
            until real messages push it out of view) */}
        {!disabled && focusGuideline && (
          <div className="coach-panel__intro">
            {focusGuideline.description && (
              <p className="coach-panel__intro-desc">{focusGuideline.description}</p>
            )}
            {focusGuideline.coachCues[0] && (
              <p className="coach-panel__intro-cue">"{focusGuideline.coachCues[0]}"</p>
            )}
            <p className="coach-panel__intro-hint">
              Start drawing — the coach will check in as you work.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
