// ToolModeSelector — pencil / pen / erase toggle for the drawing toolbar.

import type { DrawMode, ToolMode } from '../../shared/types';
import './ToolModeSelector.css';

interface ToolModeSelectorProps {
  drawMode: DrawMode;
  toolMode: ToolMode;
  onChange: (drawMode: DrawMode, toolMode: ToolMode) => void;
}

export default function ToolModeSelector({ drawMode, toolMode, onChange }: ToolModeSelectorProps) {
  const isErase = toolMode === 'erase';

  return (
    <div className="tool-selector" role="toolbar" aria-label="Drawing tools">
      <button
        type="button"
        className={`tool-selector__btn ${!isErase && drawMode === 'pencil' ? 'tool-selector__btn--active tool-selector__btn--pencil' : ''}`}
        onClick={() => onChange('pencil', 'draw')}
        aria-pressed={!isErase && drawMode === 'pencil'}
        title="Pencil — soft gray sketch strokes"
      >
        ✏
      </button>

      <button
        type="button"
        className={`tool-selector__btn ${!isErase && drawMode === 'pen' ? 'tool-selector__btn--active tool-selector__btn--pen' : ''}`}
        onClick={() => onChange('pen', 'draw')}
        aria-pressed={!isErase && drawMode === 'pen'}
        title="Pen — solid ink strokes"
      >
        🖊
      </button>

      <div className="tool-selector__divider" />

      <button
        type="button"
        className={`tool-selector__btn tool-selector__btn--erase ${isErase ? 'tool-selector__btn--active tool-selector__btn--erase-active' : ''}`}
        onClick={() => onChange(drawMode, isErase ? 'draw' : 'erase')}
        aria-pressed={isErase}
        title={`Erase — click strokes to remove them (${drawMode} only)`}
      >
        🧽
      </button>
    </div>
  );
}
