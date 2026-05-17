import { useEffect, useState } from 'react';
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
  /** 'toast' shows only the latest message as a floating overlay. Default is the full panel. */
  variant?: 'panel' | 'toast';
}

export default function CoachPanel({
  messages,
  isFetching,
  focusGuideline,
  error,
  disabled,
  disabledReason,
  variant = 'panel',
}: CoachPanelProps) {
  if (variant === 'toast') {
    return <CoachToast
      messages={messages}
      isFetching={isFetching}
      focusGuideline={focusGuideline}
      error={error}
      disabled={disabled}
      disabledReason={disabledReason}
    />;
  }

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

        {!disabled && messages.length === 0 && !isFetching && !error && (
          <p className="coach-panel__empty">
            Start drawing — the coach will check in as you work.
          </p>
        )}
      </div>
    </div>
  );
}

function CoachToast({
  messages,
  isFetching,
  error,
  disabled,
}: Omit<CoachPanelProps, 'variant'>) {
  const latestMessage = messages[0] ?? null;
  const [dismissedId, setDismissedId] = useState<string | null>(null);

  // Reset dismissal when a new message arrives
  useEffect(() => {
    if (latestMessage && latestMessage.id !== dismissedId) {
      setDismissedId(null);
    }
  }, [latestMessage?.id]);

  if (disabled) {
    return null;
  }

  const isDismissed = latestMessage ? latestMessage.id === dismissedId : false;
  const hasContent =
    (error && !latestMessage) ||
    (isFetching && !latestMessage) ||
    (latestMessage && !isDismissed);

  if (!hasContent) return null;

  return (
    <div className="coach-toast" aria-live="polite">
      {error && !latestMessage && (
        <p className="coach-toast__text coach-toast__text--error">
          Coach hiccup: {error}
        </p>
      )}

      {isFetching && !latestMessage && (
        <p className="coach-toast__loading">
          <span className="dot" />
          <span className="dot" />
          <span className="dot" />
          <span>Looking at your sketch…</span>
        </p>
      )}

      {latestMessage && !isDismissed && (
        <p key={latestMessage.id} className={`coach-toast__text coach-toast__text--${latestMessage.encouragement}`}>
          {latestMessage.text}
          <button
            className="coach-toast__dismiss"
            onClick={() => setDismissedId(latestMessage.id)}
            aria-label="Dismiss"
          >×</button>
        </p>
      )}
    </div>
  );
}
