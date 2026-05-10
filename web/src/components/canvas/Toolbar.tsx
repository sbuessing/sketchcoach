import './Toolbar.css';

interface ToolbarProps {
  canUndo: boolean;
  canErase: boolean;
  onUndo: () => void;
  onErase: () => void;
  onFinish: () => void;
}

export default function Toolbar({ canUndo, canErase, onUndo, onErase, onFinish }: ToolbarProps) {
  const handleErase = () => {
    if (!canErase) return;
    if (window.confirm('Erase the whole drawing? This cannot be undone.')) {
      onErase();
    }
  };

  return (
    <div className="toolbar">
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
        disabled={!canErase}
      >
        Finish
      </button>
    </div>
  );
}
