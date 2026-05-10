import type { CoachMessage, Guideline } from '../../shared/types';
import './CoachPanel.css';

interface CoachPanelProps {
  messages: CoachMessage[];
  isFetching: boolean;
  focusGuideline?: Guideline;
  error?: string | null;
  /** True if the coach can't run (no API key configured). */
  disabled?: boolean;
}

export default function CoachPanel({
  messages,
  isFetching,
  focusGuideline,
  error,
  disabled,
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
            Coach is offline. Add <code>VITE_ANTHROPIC_API_KEY</code> to <code>web/.env</code> to enable it.
          </p>
        )}

        {!disabled && error && (
          <p className="coach-panel__error">
            <strong>Coach hiccup:</strong> {error}
          </p>
        )}

        {!disabled && messages.length === 0 && !isFetching && !error && (
          <p className="coach-panel__empty">
            Start drawing — the coach will check in occasionally.
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
      </div>
    </div>
  );
}
