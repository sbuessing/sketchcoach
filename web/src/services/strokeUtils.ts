// Stroke utilities: perfect-freehand wrapper + SVG serialization.
//
// `viewBox` for the canvas is 0 0 1000 1000 — all coordinates are in this
// logical space. The brush size is in the same units.

import { getStroke } from 'perfect-freehand';
import type { DrawMode, Stroke, StrokePoint, StrokePointerType } from '../shared/types';

export const VIEWBOX_SIZE = 1000;
export const BRUSH_SIZE = 12;
export const PENCIL_SIZE = 5;

// Safari on macOS is the only browser that exposes Force Touch trackpad pressure
// through pointer events. We detect it once at module load so callers can pass
// raw e.pressure without coercing 0 → 0.5.
export const hasSafariPressure: boolean = (() => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /Safari/.test(ua) && !/Chrome/.test(ua) && !/Android/.test(ua) && /Mac OS X/.test(ua);
})();

// Expressive inking pen — noticeable width swing with pressure, tapered ends.
// With real pressure (stylus or Safari Force Touch) the contrast between a
// hard press and a whisper stroke is dramatic and calligraphic.
const BASE_PEN = {
  size: BRUSH_SIZE,
  thinning: 0.75,
  smoothing: 0.5,
  streamline: 0.4,
  easing: (t: number) => t,
  start: { taper: 20, easing: (t: number) => t * t * t },
  end:   { taper: 20, easing: (t: number) => { const u = t - 1; return u * u * u + 1; } },
};

// Pencil for loose construction sketching — fine, consistent, no tapers.
// Deliberately plain so it reads as a disposable under-drawing layer.
const BASE_PENCIL = {
  size: PENCIL_SIZE,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.55,
};

// Builds the full options object for a pointer type × draw mode combo.
function buildOptions(simulate: boolean, drawMode: DrawMode) {
  return { ...(drawMode === 'pencil' ? BASE_PENCIL : BASE_PEN), simulatePressure: simulate };
}

const OPTIONS: Record<DrawMode, Record<StrokePointerType, ReturnType<typeof buildOptions>>> = {
  pen: {
    pen:   buildOptions(false, 'pen'),
    touch: buildOptions(false, 'pen'),
    // Mouse without real pressure: simulate so the stroke still tapers nicely.
    // Overridden at runtime for Safari Force Touch (see pointsToPath).
    mouse: buildOptions(true,  'pen'),
  },
  pencil: {
    pen:   buildOptions(false, 'pencil'),
    touch: buildOptions(false, 'pencil'),
    mouse: buildOptions(true,  'pencil'),
  },
};

// Pen options used for Safari mouse events where Force Touch gives real pressure.
const SAFARI_PEN_MOUSE = buildOptions(false, 'pen');

/** SVG fill colour and opacity for a given draw mode. */
export function getStrokeStyle(drawMode?: DrawMode): { fill: string; opacity: string } {
  // Pencil is intentionally light and ghostly — it's a disposable under-drawing.
  if (drawMode === 'pencil') return { fill: '#808080', opacity: '0.4' };
  return { fill: '#2d3f2a', opacity: '1' };
}

/** Convert a list of stroke points into an SVG `d` attribute. */
export function pointsToPath(
  points: StrokePoint[],
  pointerType: StrokePointerType = 'mouse',
  drawMode: DrawMode = 'pen',
): string {
  if (points.length === 0) return '';
  const inputs = points.map(
    (p) => [p.x, p.y, p.pressure] as [number, number, number],
  );
  // On Safari+Mac, mouse events carry real Force Touch pressure — use it for
  // the pen (not pencil; pencil intentionally ignores pressure).
  const opts =
    hasSafariPressure && pointerType === 'mouse' && drawMode === 'pen'
      ? SAFARI_PEN_MOUSE
      : OPTIONS[drawMode][pointerType];
  const outline = getStroke(inputs, opts);
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
  const paths = strokes.map((s) => {
    const { fill, opacity } = getStrokeStyle(s.drawMode);
    const opacityAttr = opacity !== '1' ? ` opacity="${opacity}"` : '';
    return `<path d="${s.pathD}" fill="${fill}"${opacityAttr}/>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}">${paths}</svg>`;
}

/** Generate a uuid-ish id without pulling in a dep. Good enough for in-memory + IDB. */
export function makeId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
