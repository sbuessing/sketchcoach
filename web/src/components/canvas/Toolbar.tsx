import type { ReactNode } from 'react';
import './Toolbar.css';

interface ToolbarProps {
  canUndo: boolean;
  canErase: boolean;
  canFinish: boolean;
  onUndo: () => void;
  onErase: () => void;
  onFinish: () => void | Promise<void>;
  /** Optional slot rendered on the left of the toolbar (e.g. audio controls). */
  leftSlot?: ReactNode;
  /** Optional slot rendered between the left slot and the action buttons. */
  centerSlot?: ReactNode;
}

export default function Toolbar({
  canUndo,
  canErase,
  canFinish,
  onUndo,
  onErase,
  onFinish,
  leftSlot,
  centerSlot,
}: ToolbarProps) {
  const handleErase = () => {
    if (!canErase) return;
    if (window.confirm('Erase the whole drawing? This cannot be undone.')) {
      onErase();
    }
  };

  return (
    <div className="toolbar">
      {leftSlot && <div className="toolbar__left">{leftSlot}</div>}
      {centerSlot && <div className="toolbar__center">{centerSlot}</div>}
      <div className="toolbar__actions">
        <button
          className="toolbar__btn toolbar__btn--secondary"
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last stroke"
        >
          Undo
        </button>
        <button
          className="toolbar__btn toolbar__btn--secondary"
          type="button"
          onClick={handleErase}
          disabled={!canErase}
        >
          Erase all
        </button>
        <button
          className="toolbar__btn toolbar__btn--primary"
          type="button"
          onClick={onFinish}
          disabled={!canFinish}
        >
          Finish
        </button>
      </div>
    </div>
  );
}
