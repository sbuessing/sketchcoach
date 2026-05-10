import type { CoachMessage, Guideline } from '../../shared/types';
import './CoachPanel.css';

interface CoachPanelProps {
  messages: CoachMessage[];
  isFetching: boolean;
  focusGuideline?: Guideline;
}

export default function CoachPanel({ messages, isFetching, focusGuideline }: CoachPanelProps) {
  return (
    <div className="coach-panel">
      {focusGuideline && (
        <div className="coach-panel__focus">
          <p className="coach-panel__focus-label">Today's focus</p>
          <p className="coach-panel__focus-title">{focusGuideline.title}</p>
        </div>
      )}

      <div className="coach-panel__messages">
        {messages.length === 0 && !isFetching && (
          <p className="coach-panel__empty">
            Start drawing — the coach will check in occasionally.
          </p>
        )}

        {isFetching && (
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
