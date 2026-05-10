// Shared types — single source of truth for the app.
// Mirrors the schemas of the JSON files in /public/data.

export type Tier = 'beginner' | 'developing' | 'intermediate' | 'advanced';
export type Level = 'novice' | 'developing' | 'intermediate' | 'advanced';

export type GuidelineCategory =
  | 'foundational'
  | 'construction'
  | 'proportion'
  | 'line-quality'
  | 'observation'
  | 'composition'
  | 'style';

export interface Project {
  slug: string;
  title: string;
  tier: Tier;
  estimatedMinutes: number;
  description: string;
  focusGuidelines: string[];
}

export interface Guideline {
  id: string;
  title: string;
  level: Level;
  category: GuidelineCategory;
  description: string;
  coachCues: string[];
}

export interface ProjectStep {
  number: number;
  title: string;
  description: string;
}

export interface ProjectSteps {
  slug: string;
  title: string;
  steps: ProjectStep[];
}

export interface StrokePoint {
  x: number;
  y: number;
  pressure: number;
  t: number; // ms timestamp relative to stroke start
}

export type StrokePointerType = 'mouse' | 'pen' | 'touch';

/** Which drawing instrument is active. */
export type DrawMode = 'pen' | 'pencil';

/** Whether the user is drawing or erasing individual strokes. */
export type ToolMode = 'draw' | 'erase';

export interface Stroke {
  id: string;
  points: StrokePoint[];
  pathD: string; // SVG `d` attribute after smoothing
  /** Pointer source. Optional for backwards compat with strokes saved before this field existed. */
  pointerType?: StrokePointerType;
  /** Drawing instrument. Defaults to 'pen' when absent (backwards compat). */
  drawMode?: DrawMode;
}

export type CoachEncouragement = 'gentle-praise' | 'gentle-nudge' | 'celebrate';

export interface CoachMessage {
  id: string;
  text: string;
  highlightedGuidelineId?: string;
  encouragement: CoachEncouragement;
  createdAt: number;
}

export interface PortfolioEntry {
  id: string;
  projectSlug: string;
  completedAt: number;
  svg: string;
  thumbnailDataUrl: string;
  finalFeedback: string;
  tryNext: string[];
  focusGuidelineId: string;
  durationSeconds: number;
}
