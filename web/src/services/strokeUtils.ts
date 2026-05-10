// Stroke utilities: perfect-freehand wrapper + SVG serialization.
//
// `viewBox` for the canvas is 0 0 1000 1000 — all coordinates are in this
// logical space. The brush size is in the same units.

import { getStroke } from 'perfect-freehand';
import type { Stroke, StrokePoint, StrokePointerType } from '../shared/types';

export const VIEWBOX_SIZE = 1000;
export const BRUSH_SIZE = 9;

// Pressure-aware stroke options.
// thinning: 0.5 means the stroke ranges from ~50% to 100% of `size` based on pressure.
const BASE_OPTIONS = {
  size: BRUSH_SIZE,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
};

// Different pointer sources need different pressure handling:
// - Pen / Apple Pencil report real pressure → use it directly.
// - Touch input on capable hardware reports real pressure → use it.
// - Mouse / most Mac trackpads report a constant 0.5 → derive pressure from
//   stroke velocity (perfect-freehand simulates pressure when this flag is on).
const OPTIONS_BY_TYPE: Record<StrokePointerType, ReturnType<typeof getOptions>> = {
  pen: getOptions(false),
  touch: getOptions(false),
  mouse: getOptions(true),
};

function getOptions(simulate: boolean) {
  return { ...BASE_OPTIONS, simulatePressure: simulate };
}

/** Convert a list of stroke points into an SVG `d` attribute. */
export function pointsToPath(
  points: StrokePoint[],
  pointerType: StrokePointerType = 'mouse',
): string {
  if (points.length === 0) return '';
  const inputs = points.map(
    (p) => [p.x, p.y, p.pressure] as [number, number, number],
  );
  const outline = getStroke(inputs, OPTIONS_BY_TYPE[pointerType]);
  return outlineToPath(outline);
}

function outlineToPath(stroke: number[][]): string {
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[],
  );
  d.push('Z');
  return d.join(' ');
}

/** Build an SVG document from a list of strokes (used for autosave + portfolio). */
export function strokesToSvg(strokes: Stroke[]): string {
  const paths = strokes.map((s) => `<path d="${s.pathD}" fill="black"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}">${paths}</svg>`;
}

/** Generate a uuid-ish id without pulling in a dep. Good enough for in-memory + IDB. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
