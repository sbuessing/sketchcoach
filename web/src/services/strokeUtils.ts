// Stroke utilities: perfect-freehand wrapper + SVG serialization.
//
// `viewBox` for the canvas is 0 0 1000 1000 — all coordinates are in this
// logical space. The brush size is in the same units.

import { getStroke } from 'perfect-freehand';
import type { Stroke, StrokePoint } from '../shared/types';

export const VIEWBOX_SIZE = 1000;
export const BRUSH_SIZE = 8;

const STROKE_OPTIONS = {
  size: BRUSH_SIZE,
  // Fixed-width for v1. Pressure values are still captured on each point so
  // a future variable-width renderer can use them without data backfill.
  thinning: 0,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: false,
};

/** Convert a list of stroke points into an SVG `d` attribute. */
export function pointsToPath(points: StrokePoint[]): string {
  if (points.length === 0) return '';
  const inputs = points.map((p) => [p.x, p.y, p.pressure] as [number, number, number]);
  const outline = getStroke(inputs, STROKE_OPTIONS);
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
