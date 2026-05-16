import { useCallback, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { DrawMode, Stroke, StrokePoint, StrokePointerType, ToolMode } from '../../shared/types';
import { VIEWBOX_SIZE, getStrokeStyle, hasSafariPressure, makeId, pointsToPath } from '../../services/strokeUtils';
import './SketchCanvas.css';

function normalizePointerType(t: string): StrokePointerType {
  return t === 'pen' || t === 'touch' ? t : 'mouse';
}

interface SketchCanvasProps {
  strokes: Stroke[];
  onStrokeComplete: (stroke: Stroke) => void;
  /** Called immediately when a stroke is finalized, before onStrokeComplete. */
  onStrokeEnd?: () => void;
  /** Called when the user clicks a stroke in erase mode. */
  onEraseStroke?: (id: string) => void;
  drawMode?: DrawMode;
  toolMode?: ToolMode;
}

const CURSOR: Record<ToolMode, Record<DrawMode, string>> = {
  draw:  { pen: 'crosshair', pencil: 'crosshair' },
  erase: { pen: 'cell',      pencil: 'cell'       },
};

// On Safari+Mac, pointer events from a Force Touch trackpad carry real pressure
// data even though pointerType is 'mouse'. We pass it through raw so the stroke
// engine can use it (simulatePressure will be false for that path).
// On every other browser/device, 0 pressure means the button isn't held — coerce
// to 0.5 so the simulated path has something sensible to work with.
function capturePressure(e: RPointerEvent<SVGSVGElement>): number {
  return hasSafariPressure ? e.pressure : (e.pressure || 0.5);
}

export default function SketchCanvas({
  strokes,
  onStrokeComplete,
  onStrokeEnd,
  onEraseStroke,
  drawMode = 'pen',
  toolMode = 'draw',
}: SketchCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const livePointsRef = useRef<StrokePoint[]>([]);
  const livePointerIdRef = useRef<number | null>(null);
  const livePointerTypeRef = useRef<StrokePointerType>('mouse');
  const strokeStartRef = useRef<number>(0);
  const [livePathD, setLivePathD] = useState<string>('');

  // Erase mode hover state.
  const [hoveredStrokeId, setHoveredStrokeId] = useState<string | null>(null);

  const screenToSvg = useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const t = pt.matrixTransform(ctm.inverse());
    return { x: t.x, y: t.y };
  }, []);

  // ── Erase mode handlers ────────────────────────────────────────────────

  const handleEraseMove = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      const target = e.target as SVGElement;
      const id = target.dataset['strokeId'] ?? null;
      if (!id) { setHoveredStrokeId(null); return; }
      // Only highlight strokes matching the current drawMode.
      const stroke = strokes.find((s) => s.id === id);
      const modeMatch = (stroke?.drawMode ?? 'pen') === drawMode;
      setHoveredStrokeId(modeMatch ? id : null);
    },
    [strokes, drawMode],
  );

  const handleEraseDown = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      const target = e.target as SVGElement;
      const id = target.dataset['strokeId'];
      if (!id) return;
      const stroke = strokes.find((s) => s.id === id);
      const modeMatch = (stroke?.drawMode ?? 'pen') === drawMode;
      if (modeMatch) onEraseStroke?.(id);
    },
    [strokes, drawMode, onEraseStroke],
  );

  // ── Draw mode handlers ─────────────────────────────────────────────────

  const handlePointerDown = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (toolMode === 'erase') { handleEraseDown(e); return; }
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (livePointerIdRef.current !== null) return;

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      livePointerIdRef.current = e.pointerId;
      livePointerTypeRef.current = normalizePointerType(e.pointerType);
      strokeStartRef.current = performance.now();

      const { x, y } = screenToSvg(e.clientX, e.clientY);
      livePointsRef.current = [{ x, y, pressure: capturePressure(e), t: 0 }];
      setLivePathD(pointsToPath(livePointsRef.current, livePointerTypeRef.current, drawMode));
    },
    [toolMode, handleEraseDown, screenToSvg, drawMode],
  );

  const handlePointerMove = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (toolMode === 'erase') { handleEraseMove(e); return; }
      if (livePointerIdRef.current !== e.pointerId) return;

      const { x, y } = screenToSvg(e.clientX, e.clientY);
      livePointsRef.current = [
        ...livePointsRef.current,
        { x, y, pressure: capturePressure(e), t: performance.now() - strokeStartRef.current },
      ];
      setLivePathD(pointsToPath(livePointsRef.current, livePointerTypeRef.current, drawMode));
    },
    [toolMode, handleEraseMove, screenToSvg, drawMode],
  );

  const finalize = useCallback(() => {
    const points = livePointsRef.current;
    const pointerType = livePointerTypeRef.current;
    if (points.length > 0) {
      onStrokeEnd?.();
      const stroke: Stroke = {
        id: makeId(),
        points,
        pathD: pointsToPath(points, pointerType, drawMode),
        pointerType,
        drawMode,
      };
      onStrokeComplete(stroke);
    }
    livePointsRef.current = [];
    livePointerIdRef.current = null;
    setLivePathD('');
  }, [onStrokeComplete, onStrokeEnd, drawMode]);

  const handlePointerUp = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (toolMode === 'erase') return;
      if (livePointerIdRef.current !== e.pointerId) return;
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* already released */ }
      finalize();
    },
    [toolMode, finalize],
  );

  const handlePointerCancel = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (toolMode === 'erase') return;
      if (livePointerIdRef.current !== e.pointerId) return;
      finalize();
    },
    [toolMode, finalize],
  );

  const handlePointerLeave = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (toolMode === 'erase') { setHoveredStrokeId(null); return; }
      if (livePointerIdRef.current !== e.pointerId) return;
      finalize();
    },
    [toolMode, finalize],
  );

  const cursor = CURSOR[toolMode][drawMode];
  const liveStyle = getStrokeStyle(drawMode);

  return (
    <div className="sketch-canvas">
      <svg
        ref={svgRef}
        className="sketch-canvas__svg"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{ cursor }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerLeave}
      >
        <g>
          {strokes.map((s) => {
            const style = getStrokeStyle(s.drawMode);
            const isHovered = s.id === hoveredStrokeId;
            const erasable = toolMode === 'erase' && (s.drawMode ?? 'pen') === drawMode;
            return (
              <path
                key={s.id}
                d={s.pathD}
                fill={isHovered ? '#c04444' : style.fill}
                opacity={
                  isHovered
                    ? '0.75'
                    : toolMode === 'erase' && !erasable
                    ? '0.25'       // dim strokes the eraser can't touch
                    : style.opacity
                }
                data-stroke-id={s.id}
                pointerEvents={toolMode === 'erase' ? 'all' : 'none'}
                style={erasable ? { cursor: 'pointer' } : undefined}
              />
            );
          })}
        </g>
        {livePathD && toolMode === 'draw' && (
          <path
            d={livePathD}
            fill={liveStyle.fill}
            opacity={liveStyle.opacity}
            pointerEvents="none"
          />
        )}
      </svg>
    </div>
  );
}
