import { useEffect, useRef, useState } from 'react';
import { isByokMode, resolveApiKey } from '../../services/claudeClient';
import { prefs } from '../../services/prefsStore';
import './ApiKeyModal.css';

interface Props {
  onClose: () => void;
}

export default function ApiKeyModal({ onClose }: Props) {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const hasByok = isByokMode();
  const hasEnvKey = !!resolveApiKey() && !hasByok;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on backdrop click or Escape.
  function handleBackdrop(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose();
  }
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return;
    prefs.setApiKey(trimmed);
    setValue('');
    setSaved(true);
    setTimeout(onClose, 900);
  }

  function handleClear() {
    prefs.clearApiKey();
    setValue('');
    setSaved(false);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave();
  }

  const looksValid = value.trim().startsWith('sk-ant-');
  const showWarning = value.trim().length > 4 && !looksValid;

  return (
    <div className="akm-backdrop" onClick={handleBackdrop} role="dialog" aria-modal aria-label="API key settings">
      <div className="akm">
        <button className="akm__close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="akm__title">Your Anthropic API Key</h2>
        <p className="akm__body">
          Sketch Coach calls Claude to power the coach. Add your own key to use
          it in beta — your key is stored only in your browser and never sent
          anywhere except directly to Anthropic.
        </p>

        {hasByok && !saved && (
          <div className="akm__status akm__status--active">
            ✓ Your key is saved and active.
          </div>
        )}

        {hasEnvKey && (
          <div className="akm__status akm__status--env">
            Using a built-in key. You can add your own below to override it.
          </div>
        )}

        {!hasByok && !hasEnvKey && !saved && (
          <div className="akm__status akm__status--missing">
            No key configured — the coach won't work until you add one.
          </div>
        )}

        {saved && (
          <div className="akm__status akm__status--saved">
            ✓ Key saved!
          </div>
        )}

        <div className="akm__field">
          <div className="akm__input-wrap">
            <input
              ref={inputRef}
              className="akm__input"
              type={visible ? 'text' : 'password'}
              placeholder="sk-ant-api03-…"
              value={value}
              onChange={(e) => { setValue(e.target.value); setSaved(false); }}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              className="akm__toggle"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide key' : 'Show key'}
              type="button"
            >
              {visible ? '🙈' : '👁'}
            </button>
          </div>
          {showWarning && (
            <p className="akm__warning">Anthropic keys start with <code>sk-ant-</code></p>
          )}
        </div>

        <div className="akm__actions">
          <button
            className="akm__btn akm__btn--save"
            onClick={handleSave}
            disabled={!value.trim() || saved}
          >
            Save key
          </button>
          {hasByok && (
            <button className="akm__btn akm__btn--clear" onClick={handleClear}>
              Remove key
            </button>
          )}
        </div>

        <a
          className="akm__link"
          href="https://console.anthropic.com/settings/keys"
          target="_blank"
          rel="noopener noreferrer"
        >
          Get a key at console.anthropic.com →
        </a>
      </div>
    </div>
  );
}
