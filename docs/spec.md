# Sketch Coach — Technical Spec

This document describes the current architecture and implementation of Sketch Coach. It is kept up to date after major feature additions.

The app follows the patterns established in the reference project at `/Users/shawn/Documents/GitHub/anotterlanguage/travel` (deployed at https://travelsimulator.web.app).

---

## 1. Architecture

### Current (beta)

```
Browser (React + SVG canvas)
   │
   │  HTTPS — dangerouslyAllowBrowser: true
   ▼
Claude API (Anthropic)
   └── key: user's own key in localStorage (BYOK)
            OR VITE_ANTHROPIC_API_KEY env var (local dev fallback)
```

### Future production path

```
Browser (React + SVG canvas)
   │
   │  HTTPS (Firebase callable function)
   ▼
Firebase Cloud Functions  ─── holds ANTHROPIC_API_KEY secret
   │
   │  HTTPS
   ▼
Claude API (Anthropic)
```

**Runtime:**
- The React app is the entire product surface.
- Static content (3 scenes × ~14 projects each = 40 projects total, 40 step files, 25+ guidelines) ships in `web/public/data/` as JSON.
- User data (portfolio, preferences, drawings-in-progress, active scene) lives in the user's browser (`localStorage` + `IndexedDB`).
- **API key strategy:** users provide their own Anthropic key via a settings modal (BYOK). Key saved to `localStorage`, passed to Anthropic SDK with `dangerouslyAllowBrowser: true`. `VITE_ANTHROPIC_API_KEY` env var is the local dev fallback. Key priority: localStorage BYOK → env var.
- **Future:** a Firebase Cloud Functions proxy replaces the direct call for managed production deploys.

**No backend database, no auth, no server pipeline.**

---

## 2. Project Layout

```
sketchcoach/
├── .claude/
│   ├── CLAUDE.md                          # Claude instructions (this kind of file)
│   ├── hooks/log_prompt.py                # Logs every prompt to docs/prompts.md
│   └── settings.json                      # Hook config
├── docs/                                  # proposal, spec, ideas, prompts, content-guidelines
└── web/                                   # React/Vite frontend
    ├── src/
    │   ├── main.tsx                       # Entry: Router + AppProvider
    │   ├── App.tsx                        # Routes (lazy-loaded screens)
    │   ├── index.css                      # Global CSS variables (Garden Studio palette)
    │   ├── contexts/
    │   │   └── AppContext.tsx             # Session-wide state (projects, scenes, guidelines, audio, portfolio)
    │   ├── components/
    │   │   ├── screens/
    │   │   │   ├── HomeScreen.tsx         # Scene selector + project grid
    │   │   │   ├── DrawScreen.tsx         # Canvas + steps + coach + toolbar
    │   │   │   ├── DoneScreen.tsx         # Final feedback + save → scene view
    │   │   │   ├── SceneScreen.tsx        # Assembled scene canvas (composited SVGs)
    │   │   │   ├── PortfolioScreen.tsx    # All completed drawings grid + detail modal
    │   │   │   ├── TipsScreen.tsx         # Drawing guidelines, encountered vs. not yet seen
    │   │   │   └── AboutScreen.tsx        # Design philosophy page
    │   │   ├── canvas/
    │   │   │   ├── SketchCanvas.tsx       # SVG drawing surface
    │   │   │   ├── ToolModeSelector.tsx   # Pencil / Pen / Erase toggle
    │   │   │   └── Toolbar.tsx            # Undo, Finish; leftSlot / centerSlot / rightSlot
    │   │   ├── coach/                     # CoachPanel, CoachMessage
    │   │   ├── steps/                     # StepList, StepItem
    │   │   ├── settings/                  # ApiKeyModal (BYOK)
    │   │   └── ui/                        # AudioControls, SaveIndicator
    │   ├── hooks/
    │   │   ├── useDrawing.ts              # Stroke state, undo, per-stroke erase, autosave
    │   │   ├── useCoach.ts                # Coach trigger logic + Claude calls
    │   │   └── useAmbientAudio.ts         # Backing track (skip, fade) + isPlaying / trackName
    │   ├── services/
    │   │   ├── claudeClient.ts            # Anthropic SDK wrapper (BYOK key resolution)
    │   │   ├── dataService.ts             # Loads projects, scenes, guidelines, step files
    │   │   ├── portfolioStore.ts          # IndexedDB CRUD (portfolio + in-progress)
    │   │   ├── prefsStore.ts              # localStorage (prefs, BYOK key, data_version)
    │   │   ├── audioService.ts            # Web Audio API SFX synthesizer
    │   │   ├── snapshot.ts                # SVG → PNG rasterizer
    │   │   └── strokeUtils.ts             # Stroke smoothing, SVG serialization, style helpers
    │   └── shared/
    │       └── types.ts                   # All TypeScript types
    ├── public/
    │   ├── data/
    │   │   ├── scenes.json                # 3 scene metadata records
    │   │   ├── projects.json              # 40 project records (sceneId + sceneSlot)
    │   │   ├── guidelines.json            # 25+ drawing principles
    │   │   └── <slug>.json × 40          # Per-project step lists
    │   └── audio/
    │       ├── tracks/                    # 3 chillhop loops (Pixabay royalty-free)
    │       ├── ATTRIBUTION.md             # Track source notes
    │       └── tracks.json                # Ordered track list
    ├── index.html
    ├── vite.config.ts
    ├── tsconfig.json
    ├── firebase.json                      # Hosting config
    └── .firebaserc                        # Firebase project: sketchcoach-fae4f
```

---

## 3. Tech Stack

**Frontend:**
- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** with `@vitejs/plugin-react`
- **React Router DOM v7** (lazy-loaded screens)
- **perfect-freehand** (stroke smoothing — pointer points + pressure → smooth SVG fill paths)
- **Pure CSS with CSS variables** — no Tailwind, no CSS modules; co-located `.css` per component

**Tooling:**
- ESLint + Prettier
- `tsc --noEmit` typecheck + `vite build` as the CI gate
- No e2e tests for v1

---

## 4. Data Layer

### 4.1 Static data (ships with the app)

Files in `web/public/data/`, fetched on demand and cached:

- `scenes.json` — 3 scene metadata records
- `projects.json` — 40 project records, each with `sceneId` and `sceneSlot`
- `guidelines.json` — 25+ drawing principles (novice → advanced)
- `<slug>.json` × 40 — per-project step lists (5–8 steps each)

`dataService.ts` exports:
- `loadScenes(): Promise<Scene[]>`
- `loadProjects(): Promise<Project[]>`
- `loadGuidelines(): Promise<Guideline[]>`
- `loadProjectSteps(slug): Promise<ProjectSteps>`
- `findScene(scenes, id): Scene | undefined`
- `findProject(projects, slug): Project | undefined`
- `projectsInScene(projects, sceneId): Project[]`

### 4.2 User data (browser-local)

**`localStorage` (`prefsStore.ts`):**
| Key | Type | Purpose |
|-----|------|---------|
| `sketchcoach_audio_volume` | number 0–1 | Backing track volume |
| `sketchcoach_sfx_enabled` | boolean | Sound effects toggle |
| `sketchcoach_last_track` | string | Last-played track filename |
| `sketchcoach_byok_key` | string | User's Anthropic API key |
| `sketchcoach_active_scene` | string | Last selected scene ID |
| `sketchcoach_data_version` | number | Schema version; mismatch wipes IndexedDB |

**`IndexedDB` (`portfolioStore.ts`):** database `sketchcoach`, schema version 1.

Object store `portfolioEntries`:
```ts
{
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
```

Object store `drawingsInProgress` (keyed by slug): working SVG + strokes JSON, so a page refresh doesn't lose progress.

**Data version wipe:** `AppContext` checks `data_version` in localStorage on mount. If the stored version is below the current app version, it calls `clearPortfolio()` + `clearAllInProgress()` once before loading. This handles the v1→v2 transition when old project slugs were retired.

### 4.3 Types (`shared/types.ts`)

```ts
type Tier = 'beginner' | 'developing' | 'intermediate' | 'advanced';
type Level = 'novice' | 'developing' | 'intermediate' | 'advanced';
type DrawMode = 'pen' | 'pencil';
type ToolMode = 'draw' | 'erase';

interface Scene {
  id: string;
  title: string;
  tagline: string;
}

interface SceneSlot {
  x: number;    // top-left in 1000×1000 scene canvas
  y: number;
  width: number;
  height: number;
  z: number;    // render order; higher = closer to viewer
}

interface Project {
  slug: string;
  title: string;
  sceneId: string;
  tier: Tier;
  estimatedMinutes: number;
  description: string;
  focusGuidelines: string[];
  sceneSlot: SceneSlot;
}

interface Guideline {
  id: string;
  title: string;
  level: Level;
  category: GuidelineCategory;
  description: string;
  coachCues: string[];
}

interface Stroke {
  id: string;
  points: StrokePoint[];
  pathD: string;
  pointerType?: StrokePointerType;
  drawMode?: DrawMode;    // persisted; undefined = 'pen' (backwards compat)
}

interface CoachMessage {
  id: string;
  text: string;
  highlightedGuidelineId?: string;
  encouragement: 'gentle-praise' | 'gentle-nudge' | 'celebrate';
  createdAt: number;
}

interface PortfolioEntry { /* see §4.2 */ }
```

---

## 5. The Drawing Canvas

### 5.1 Component

`<SketchCanvas>` owns an `<svg viewBox="0 0 1000 1000">` with:
- A `<g>` of finalized stroke `<path>`s (one per stroke).
- A separate in-progress `<path>` re-rendered on every pointer move.
- Pointer event handlers on the SVG; `setPointerCapture` keeps events flowing if the cursor leaves mid-stroke.

Coordinate transforms: client → SVG user space via `svg.getScreenCTM().inverse()`.

### 5.2 Drawing modes

| Mode | Fill | Opacity | Size | Notes |
|------|------|---------|------|-------|
| Pen | `#2d3f2a` | 1.0 | 9 | Pressure/velocity-responsive width |
| Pencil | `#808080` | 0.55 | 6 | Fixed width; light construction marks |

Both use `perfect-freehand` with mode-appropriate options (`thinning`, `smoothing`, `streamline`). `Stroke.drawMode` is stored so pencil vs pen is preserved on resume.

### 5.3 Erase mode

`ToolMode = 'erase'` turns on per-stroke pointer events. Each `<path>` gets `data-stroke-id`; pointer events bubble up and `event.target.dataset.strokeId` identifies the hovered/clicked stroke. The eraser is mode-aware: pencil eraser only removes pencil strokes; pen eraser only removes pen strokes. Non-erasable strokes dim to 0.25 opacity. Hoverable erasable strokes turn red (`#c04444`).

### 5.4 Tools

`<ToolModeSelector>` (three-button pill in toolbar center slot):
- **✏ Pencil** — `drawMode='pencil'`, `toolMode='draw'`
- **🖊 Pen** — `drawMode='pen'`, `toolMode='draw'`
- **🧹 Erase** — `toolMode='erase'`, drawMode preserved (determines which strokes are erasable)

`<Toolbar>` layout: `leftSlot` (audio controls) | `centerSlot` (ToolModeSelector + SaveIndicator) | right (Undo, Finish).

**Undo** pops the last stroke. No separate undo stack — the strokes array is the history.

### 5.5 Persistence

`useDrawing(slug)` autosaves strokes to IndexedDB every 5 s when changed. On `DrawScreen` mount, if a saved drawing exists, the user is offered "Resume" or "Start fresh."

`<SaveIndicator>` watches `savedAt` (updated after each successful save) and shows "Saved ✓" for 2 s.

---

## 6. The Coach Loop

### 6.1 Trigger logic (`useCoach`)

```
every 1s tick:
  skip if isFetching
  skip if strokes.length === strokesAtLastFetch   (nothing new)
  skip if (now - lastStrokeAt) < 3000             (user still drawing)
  skip if (now - lastFetchAt)  < 20000            (rate limit floor)
  → trigger coach fetch
```

### 6.2 What gets sent to Claude

1. **System prompt** (prompt-cached) — voice, audience, output schema.
2. **Project + focus guideline + steps** (prompt-cached per session).
3. **Recent advice** (last 3 messages, plain text, not cached).
4. **Snapshot** — 1024×1024 PNG rasterized from the current SVG.

### 6.3 What Claude returns

Forced tool-use call to `provide_coaching`:
```ts
{
  message: string;
  highlightedGuidelineId?: string;
  encouragement: 'gentle-praise' | 'gentle-nudge' | 'celebrate';
}
```

### 6.4 Coach panel UX

The panel is a floating toast anchored below the canvas. Only the most recent message is shown (not a scroll log). Before any messages arrive, a welcome card shows the focus guideline's description and first sample cue.

### 6.5 Final summary

Called once on `DoneScreen` mount. Same snapshot + different system prompt → `{ summary: string, tryNext: string[] }`. Persisted to `PortfolioEntry`.

---

## 7. Claude API Integration

### 7.1 Key resolution (`claudeClient.ts`)

```
localStorage BYOK key  →  VITE_ANTHROPIC_API_KEY  →  null (coach disabled)
```

Exports: `resolveApiKey()`, `isCoachConfigured()`, `isByokMode()`, `requestCoachAdvice()`, `requestFinalSummary()`.

### 7.2 SDK call shape

```ts
const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
await client.messages.create({
  model: 'claude-sonnet-4-7',
  max_tokens: 400,
  system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
  tools: [{ name: 'provide_coaching', input_schema: SCHEMA }],
  tool_choice: { type: 'tool', name: 'provide_coaching' },
  messages: [{
    role: 'user',
    content: [
      { type: 'text', text: projectContext, cache_control: { type: 'ephemeral' } },
      { type: 'text', text: recentAdviceSummary },
      { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
      { type: 'text', text: 'What would you say to the user right now?' },
    ],
  }],
});
```

Prompt caching is required — system prompt + project context are reused on every coach call within a session. Cache lifetime aligns with a typical drawing session (~5 min).

### 7.3 Coach persona

Bob Ross warmth + Mr. Rogers sincerity + Yo Gabba Gabba enthusiasm. 80% delight, 20% gentle nudge. Never grades, never scores.

---

## 8. UI Flow & Screens

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `HomeScreen` | Scene picker + project grid per scene |
| `/draw/:slug` | `DrawScreen` | Canvas + steps + coach + toolbar |
| `/done/:slug` | `DoneScreen` | Final feedback + save → assembled scene |
| `/scene/:sceneId` | `SceneScreen` | Assembled scene canvas (composited drawings) |
| `/portfolio` | `PortfolioScreen` | All completed drawings across all scenes |
| `/tips` | `TipsScreen` | Drawing guidelines (encountered vs. not yet seen) |
| `/about` | `AboutScreen` | Design philosophy page |

All routes lazy-loaded via `React.lazy`.

### 8.1 HomeScreen

- **Scene selector** — horizontal row of scene cards above the project grid. Each card shows title, tagline, and N/M progress. Selecting a scene stores the choice in `localStorage` and filters the project grid below.
- **"View assembled scene →"** link navigates to `/scene/:activeSceneId`.
- **Project grid** — filtered to the active scene, sorted by tier (beginner → advanced). Tiers are display labels only — no locking. Each card shows title, est. minutes, ✓ if complete.
- **Header actions** — API key button (green/amber status dot), Sketching Tips link, Portfolio count, About (ⓘ) icon.
- **API key banner** — shown when no key is configured.

### 8.2 DrawScreen

Three-pane layout (steps | canvas | coach):

- **Steps pane (left):** step list; current step highlighted. User advances manually.
- **Canvas (center):** `<SketchCanvas>` with `drawMode` and `toolMode` from local state.
- **Coach panel (right/bottom):** floating toast below canvas; most recent message only; welcome card before first message.
- **Toolbar:** audio controls (volume, skip track, SFX toggle) | ToolModeSelector + SaveIndicator | Undo + Finish.
- Music starts on first "Start fresh" (not on "Resume" or if already playing).

### 8.3 DoneScreen

- Renders final SVG.
- Calls `requestFinalSummary` on mount; shows loading state.
- Displays summary + "Try next time" bullets.
- **Save:** creates `PortfolioEntry`, navigates to `/scene/:sceneId` with `{ state: { newSlug } }` so the scene animates the new piece in.
- **Discard:** returns home.

### 8.4 SceneScreen

- Renders a 1000×1000 SVG canvas.
- All projects sorted by `sceneSlot.z` then `sceneSlot.y` (back-to-front render order).
- Completed drawings embedded as `<g transform="translate(x,y) scale(...)">` with the saved SVG's inner content (outer `<svg>` wrapper stripped).
- Incomplete slots: faint dashed rectangle + project title. Clicking navigates to `/draw/:slug`.
- Newly-placed piece animates with a bounce (driven by `navState.newSlug`).

### 8.5 TipsScreen

Two sections: **Principles you've encountered** (guidelines from projects the user has started or completed) and **Coming up** (the rest). Each guideline is a card with title, category badge, full description, and sample coach cue. Encountered section has a warm background; coming-up section is dimmer.

### 8.6 PortfolioScreen

Grid of thumbnails, newest-first. Click opens a modal with full SVG, final feedback, completion date, duration, "Try next time" list, "Draw again" link, and Delete. "Clear all" button in header when portfolio is non-empty.

### 8.7 AboutScreen

Static content page. Design philosophy: safe/non-judged practice space, contextual learning, adjustable difficulty, no scores. Accessible via ⓘ icon in HomeScreen header.

---

## 9. State Management

### 9.1 AppContext

```ts
interface AppContextValue {
  projects: Project[];
  scenes: Scene[];
  guidelines: Guideline[];
  activeSceneId: string;
  setActiveSceneId: (id: string) => void;
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (b: boolean) => void;
  portfolio: PortfolioEntry[];
  refreshPortfolio: () => Promise<void>;
  isReady: boolean;
}
```

`isReady` is false until static data and portfolio have loaded. `App.tsx` gates all routes behind it.

### 9.2 Drawing-session state

Lives in `DrawScreen` and its hooks, not in AppContext (stroke arrays update many times per second):
- `useDrawing(slug)` — strokes, drawMode, toolMode, undo, eraseStroke, savedAt, autosave.
- `useCoach(project, focusGuideline, getSnapshot, ...)` — fires Claude calls per §6.
- `useAmbientAudio()` — play/pause/skip, `isPlaying`, `trackName`.

---

## 10. Audio

### 10.1 Backing tracks

`web/public/audio/tracks/` holds 3 royalty-free chillhop loops sourced from Pixabay (royalty-free license). Track list in `tracks.json`. `ATTRIBUTION.md` notes the source.

`useAmbientAudio` hook:
- Loads track list from `tracks.json` on mount.
- HTML5 `<audio>` element with JavaScript fade-in/fade-out (20ms interval gain ramp).
- `skipTrack()` fades out → loads next track → fades in.
- Music volume is halved automatically relative to the master volume slider so SFX are clearly audible.
- `trackName` and `isPlaying` are reactive state (shown in `AudioControls`).

### 10.2 Sound effects

`audioService.ts` — all SFX are **synthesized via the Web Audio API** (no audio files):
- `stroke-end` — bandpass noise burst (55 ms)
- `button` — sine 820→300 Hz sweep (40 ms)
- `complete` — C5+E5+G5 arpeggiated chime with overtones
- `coach` — F#5 bell ping (500 ms)

All gated by `sfxEnabled`. `AudioContext` is created on first user gesture (browser autoplay policy).

---

## 11. Visual Design

**Garden Studio** — cozy, botanical, lo-fi.

```css
:root {
  --color-paper:             #fbfaf4;
  --color-paper-warm:        #ece6d8;
  --color-ink:               #2d3f2a;
  --color-ink-soft:          #5a6b57;
  --color-ink-faint:         #b8c4a8;
  --color-accent:            #6b8e5a;
  --color-accent-soft:       #c7d5ba;
  --color-accent-strong:     #547348;

  --color-tier-beginner:     #8ba876;
  --color-tier-developing:   #c5a85e;
  --color-tier-intermediate: #a87b6a;
  --color-tier-advanced:     #7a6aa8;

  --font-display: 'Caveat', 'Bradley Hand', cursive;
  --font-body:    'DM Sans', -apple-system, sans-serif;
}
```

Google Fonts: **Caveat** (handwritten display) + **DM Sans** (body). Tier accent colors appear as a vertical bar beside each tier heading.

---

## 12. Scenes

### 12.1 The three scenes

| Scene | ID | Projects | Vibe |
|-------|----|----------|------|
| Harbor at Golden Hour | `harbor` | 18 (6/6/4/2) | Adventurous, atmospheric |
| Morning Windowsill | `windowsill` | 11 (4/4/2/1) | Cozy, contemplative |
| Garden Courtyard | `garden` | 11 (4/4/2/1) | Whimsical, alive |

Each project has a `sceneSlot` with pixel position and z-layer in the 1000×1000 scene canvas.

### 12.2 Scene data model

`scenes.json` — id, title, tagline. Each project in `projects.json` carries `sceneId` and `sceneSlot`. No per-scene project sub-directories; all step files sit flat in `public/data/`, namespaced by slug (e.g. `harbor-seagull.json`).

### 12.3 Assembled scene view

`SceneScreen` composites all completed drawings onto a shared canvas by embedding each portfolio entry's SVG at its slot position/scale, rendered in z-order so front objects cover back objects. Incomplete slots show faint placeholders. The assembled scene is the reward for completing projects.

### 12.4 Deferred scene features (in `ideas.md`)

- Hand-drawn background per scene
- Scene completion ceremony (16/16 moment)
- AI-composed final scene using user's drawings as source material

---

## 13. Build & Deploy

```json
// web/package.json scripts
"dev":       "vite",
"build":     "tsc -b && vite build",
"typecheck": "tsc --noEmit",
"publish":   "npm run build && firebase deploy --only hosting"
```

**Firebase:** project `sketchcoach-fae4f`, hosting site `sketchcoach`, public at https://sketchcoach.web.app/.

Deploy: `npm run publish` from `web/`. Requires `firebase-tools` globally installed + `firebase login`.

---

## 14. Open Questions

1. **Claude model.** Currently `claude-sonnet-4-7`. Haiku would be cheaper/faster — worth A/B testing once usage data exists.
2. **Snapshot resolution.** Default 1024px. May step down to 768 or 512 if cost/latency is an issue; no data yet.
3. **Trigger timing.** 3s idle / 20s floor are educated guesses — tune from real use.
4. **iOS/Apple Pencil.** Drawing code is structured for it; needs real-device testing on iPad Safari.
5. **Cross-device portfolio.** No accounts = local only. Firebase Auth + Firestore is the obvious extension if users actually want it.
