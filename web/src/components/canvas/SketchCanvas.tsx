import { useCallback, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import type { Stroke, StrokePoint, StrokePointerType } from '../../shared/types';
import { VIEWBOX_SIZE, makeId, pointsToPath } from '../../services/strokeUtils';
import './SketchCanvas.css';

function normalizePointerType(t: string): StrokePointerType {
  return t === 'pen' || t === 'touch' ? t : 'mouse';
}

interface SketchCanvasProps {
  strokes: Stroke[];
  onStrokeComplete: (stroke: Stroke) => void;
  /** Called immediately when a stroke is finalized, before onStrokeComplete. */
  onStrokeEnd?: () => void;
}

/**
 * SVG-based drawing surface. Captures pointer events (incl. pressure where
 * supported) and produces smoothed perfect-freehand strokes.
 *
 * Coordinate space: viewBox 0..VIEWBOX_SIZE on both axes; strokes are stored
 * in this logical space so the rendering scales cleanly with display size.
 */
export default function SketchCanvas({ strokes, onStrokeComplete, onStrokeEnd }: SketchCanvasProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // In-progress stroke state. We hold points in a ref to avoid re-rendering
  // the entire SVG on every pointermove; only the live path's `d` re-renders.
  const livePointsRef = useRef<StrokePoint[]>([]);
  const livePointerIdRef = useRef<number | null>(null);
  const livePointerTypeRef = useRef<StrokePointerType>('mouse');
  const strokeStartRef = useRef<number>(0);
  const [livePathD, setLivePathD] = useState<string>('');

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

  const handlePointerDown = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      // Only start drawing for primary buttons / first contact
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      if (livePointerIdRef.current !== null) return; // already drawing

      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      livePointerIdRef.current = e.pointerId;
      livePointerTypeRef.current = normalizePointerType(e.pointerType);
      strokeStartRef.current = performance.now();

      const { x, y } = screenToSvg(e.clientX, e.clientY);
      const point: StrokePoint = {
        x,
        y,
        pressure: e.pressure || 0.5,
        t: 0,
      };
      livePointsRef.current = [point];
      setLivePathD(pointsToPath(livePointsRef.current, livePointerTypeRef.current));
    },
    [screenToSvg],
  );

  const handlePointerMove = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (livePointerIdRef.current !== e.pointerId) return;

      const { x, y } = screenToSvg(e.clientX, e.clientY);
      const point: StrokePoint = {
        x,
        y,
        pressure: e.pressure || 0.5,
        t: performance.now() - strokeStartRef.current,
      };
      livePointsRef.current = [...livePointsRef.current, point];
      setLivePathD(pointsToPath(livePointsRef.current, livePointerTypeRef.current));
    },
    [screenToSvg],
  );

  const finalize = useCallback(() => {
    const points = livePointsRef.current;
    const pointerType = livePointerTypeRef.current;
    if (points.length > 0) {
      onStrokeEnd?.();
      const stroke: Stroke = {
        id: makeId(),
        points,
        pathD: pointsToPath(points, pointerType),
        pointerType,
      };
      onStrokeComplete(stroke);
    }
    livePointsRef.current = [];
    livePointerIdRef.current = null;
    setLivePathD('');
  }, [onStrokeComplete, onStrokeEnd]);

  const handlePointerUp = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (livePointerIdRef.current !== e.pointerId) return;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // pointer may already be released
      }
      finalize();
    },
    [finalize],
  );

  const handlePointerCancel = useCallback(
    (e: RPointerEvent<SVGSVGElement>) => {
      if (livePointerIdRef.current !== e.pointerId) return;
      finalize();
    },
    [finalize],
  );

  return (
    <div className="sketch-canvas">
      <svg
        ref={svgRef}
        className="sketch-canvas__svg"
        viewBox={`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`}
        xmlns="http://www.w3.org/2000/svg"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
      >
        <g>
          {strokes.map((s) => (
            <path key={s.id} d={s.pathD} fill="black" />
          ))}
        </g>
        {livePathD && <path d={livePathD} fill="black" pointerEvents="none" />}
      </svg>
    </div>
  );
}
