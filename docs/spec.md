# Sketch Coach — Technical Spec

This document specifies the architecture and implementation plan for Sketch Coach v1. It builds on `docs/proposal.md` and follows the patterns established in the reference project at `/Users/shawn/Documents/GitHub/anotterlanguage/travel` (deployed at https://travelsimulator.web.app).

The major difference from the reference project: Sketch Coach has **no offline content-generation pipeline**. There is one runtime — the React web app — plus a thin Firebase Cloud Functions proxy that holds the Claude API key.

---

## 1. Architecture

```
Browser (React + SVG canvas)
   │
   │  HTTPS (callable function)
   ▼
Firebase Cloud Functions  ─── holds ANTHROPIC_API_KEY
   │
   │  HTTPS
   ▼
Claude API (Anthropic)
```

**Runtime:**
- The React app is the entire product surface.
- Static project data (10 projects, 10 step files, 23 guidelines) ships in `web/public/data/` as JSON.
- User data (portfolio, preferences, drawings-in-progress) lives in the user's browser (`localStorage` + `IndexedDB`).
- All Claude API calls go through a Firebase Cloud Function so the API key is never exposed to the browser.

**No backend database, no auth, no server pipeline.**

---

## 2. Project Layout

Mirror the travel project's `web/` folder structure, with `functions/` as a sibling for the API proxy.

```
sketchcoach/
├── docs/                              # Already exists — proposal, spec, data
├── web/                               # React/Vite frontend
│   ├── src/
│   │   ├── main.tsx                   # Entry: Router + AppProvider
│   │   ├── App.tsx                    # Routes
│   │   ├── index.css                  # Global CSS variables (cozy palette)
│   │   ├── contexts/
│   │   │   └── AppContext.tsx         # Session-wide state (focus principle, audio)
│   │   ├── components/
│   │   │   ├── screens/               # HomeScreen, CoachingScreen, DrawScreen, DoneScreen, PortfolioScreen
│   │   │   ├── canvas/                # SketchCanvas, StrokeRenderer, ToolBar
│   │   │   ├── coach/                 # CoachPanel, CoachMessage, FocusPrinciple
│   │   │   ├── steps/                 # StepList, StepItem
│   │   │   └── shared/                # Button, ProgressBar, LoadingDots, ErrorBanner
│   │   ├── hooks/
│   │   │   ├── useDrawing.ts          # Stroke state, undo, erase
│   │   │   ├── usePointerInput.ts     # Pointer/pressure capture
│   │   │   ├── useCoach.ts            # Coach trigger logic + Claude calls
│   │   │   ├── useAmbientAudio.ts     # Backing track + SFX
│   │   │   └── usePortfolio.ts        # IndexedDB read/write
│   │   ├── services/
│   │   │   ├── claudeClient.ts        # Wrapper for the Functions endpoint
│   │   │   ├── dataService.ts         # Loads projects.json, guidelines.json, step files
│   │   │   ├── portfolioStore.ts      # IndexedDB schema + CRUD
│   │   │   ├── prefsStore.ts          # localStorage wrapper
│   │   │   └── snapshot.ts            # SVG → PNG rasterizer
│   │   ├── shared/
│   │   │   └── types.ts               # All TypeScript types
│   │   └── vite-env.d.ts
│   ├── public/
│   │   ├── data/                      # projects.json, guidelines.json, <slug>.json × 10
│   │   └── audio/
│   │       ├── tracks/                # 10 chillhop loops
│   │       └── sfx/                   # button clicks, completion chime, etc.
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .eslintrc.cjs
│   └── package.json
├── functions/                         # Firebase Cloud Functions (Claude proxy)
│   ├── src/
│   │   ├── index.ts                   # Function exports
│   │   └── claude.ts                  # Anthropic SDK wrapper
│   ├── tsconfig.json
│   └── package.json
├── firebase.json                      # Hosting + Functions config (unified)
├── .firebaserc                        # Firebase project alias
└── .gitignore
```

---

## 3. Tech Stack

Follow travel's stack exactly where it applies.

**Frontend:**
- **React 19** + **TypeScript 5.9** (strict mode)
- **Vite 7** with `@vitejs/plugin-react`
- **React Router DOM v7** (lazy-loaded screens)
- **Framer Motion** (entrance animations, page transitions, coach message fade-ins)
- **perfect-freehand** (stroke smoothing — converts pointer points + pressure into smooth SVG paths)
- **Pure CSS with CSS variables** — no Tailwind, no CSS modules; co-located `.css` per component

**Functions:**
- **Node 20** runtime
- **Firebase Functions v2** (HTTPS callable)
- **`@anthropic-ai/sdk`** (the official Claude SDK)

**Tooling:**
- ESLint + Prettier (mirror travel's config)
- Vitest for unit tests on services and hooks
- No e2e tests for v1

**Why perfect-freehand:** the proposal opens the door to pressure-sensitive drawing. Hand-rolled SVG path stitching gets jagged on fast strokes, and writing our own smoothing is a yak shave. perfect-freehand is small, well-maintained, accepts pressure data, and outputs SVG path strings that are easy to render and serialize.

---

## 4. Data Layer

### 4.1 Static data (ships with the app)

Files live in `web/public/data/` and are fetched on-demand:
- `projects.json` — 10 project metadata records
- `guidelines.json` — 23 drawing principles
- `<slug>.json` × 10 — per-project step lists

Loaded by `services/dataService.ts`:
- `loadProjects(): Promise<Project[]>` — caches in module-level Map after first call
- `loadGuidelines(): Promise<Guideline[]>` — same
- `loadProjectSteps(slug: string): Promise<ProjectSteps>` — lazy

The cross-references (project `focusGuidelines[]` → guideline `id`) are validated at load time in dev; in prod we fail soft with a console warning.

### 4.2 User data (browser-local)

**`localStorage` (`prefsStore.ts`):**
| Key | Type | Purpose |
|-----|------|---------|
| `sketchcoach_audio_volume` | number 0–1 | Backing track volume |
| `sketchcoach_sfx_enabled` | boolean | Sound effects toggle |
| `sketchcoach_last_track` | string | Last-played track filename |

**`IndexedDB` (`portfolioStore.ts`):** database `sketchcoach`, schema version 1.

Object store `portfolioEntries`:
```ts
{
  id: string;              // uuid
  projectSlug: string;
  completedAt: number;     // epoch ms
  svg: string;             // final canvas SVG markup
  thumbnailDataUrl: string; // 200x200 PNG for the gallery
  finalFeedback: string;   // Claude's submission summary
  focusGuidelineId: string;
  durationSeconds: number;
}
```

Indexed by `completedAt` (descending) and `projectSlug` (for "completed projects" set).

Object store `drawingsInProgress` (single object per slug, last-writer-wins): keeps the working SVG so a refresh doesn't lose progress.

**Why IndexedDB over localStorage for drawings:** SVG markup for a finished sketch can be 10–100 KB; localStorage's ~5 MB ceiling fills up fast across 10+ portfolio entries. IndexedDB also handles binary thumbnails cleanly.

### 4.3 Types

All in `web/src/shared/types.ts`. Mirror the JSON schemas the data files already use:

```ts
type Tier = 'beginner' | 'developing' | 'intermediate';
type Level = 'novice' | 'developing' | 'intermediate';
type GuidelineCategory =
  | 'foundational' | 'construction' | 'proportion'
  | 'line-quality' | 'observation' | 'composition' | 'style';

interface Project {
  slug: string;
  title: string;
  tier: Tier;
  estimatedMinutes: number;
  description: string;
  focusGuidelines: string[];   // guideline ids
}

interface Guideline {
  id: string;
  title: string;
  level: Level;
  category: GuidelineCategory;
  description: string;
  coachCues: string[];
}

interface ProjectStep {
  number: number;
  title: string;
  description: string;
}

interface ProjectSteps {
  slug: string;
  title: string;
  steps: ProjectStep[];
}

interface Stroke {
  id: string;
  points: Array<{ x: number; y: number; pressure: number; t: number }>;
  pathD: string;        // SVG path data after perfect-freehand smoothing
}

interface CoachMessage {
  id: string;
  text: string;
  highlightedGuidelineId?: string;
  createdAt: number;
}

interface PortfolioEntry { /* see 4.2 above */ }
```

---

## 5. The Drawing Canvas

### 5.1 Component shape

`<SketchCanvas>` owns:
- An `<svg>` element sized to fill its container, with `viewBox="0 0 1000 1000"` (logical coords; CSS scales it).
- A `<g>` of finalized stroke `<path>`s.
- A separate `<path>` for the in-progress stroke (re-renders on every pointer move).
- Pointer event handlers attached to the SVG: `onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`.

**Coordinate handling:** convert client coords to SVG user space using `svg.getScreenCTM().inverse()` so the same `viewBox` works at any display size.

### 5.2 Input pipeline

`usePointerInput` captures `PointerEvent` and emits `{x, y, pressure, t}` per point. Pressure resolution by source:
- **Apple Pencil / stylus on touchpad:** `event.pressure` is real (0–1).
- **Mouse:** `event.pressure` is constant `0.5` while pressed.
- **Trackpad (Force Touch):** `event.webkitForce` on Safari; PointerEvent.pressure may also be populated.

We capture pressure on every event but **render fixed-width strokes in v1**. Pressure is stored on each point so a future variable-width renderer can use it without data backfill.

`pointer-events: none` on the in-progress stroke; capture happens on the SVG itself with `setPointerCapture()` to keep events flowing if the cursor leaves the canvas mid-stroke.

### 5.3 Stroke rendering

Each completed stroke is a `<path>` with:
- `d` = perfect-freehand output, converted to a single `M ... Q ... ` path (filled outline, not stroked, so `stroke-linecap` weirdness disappears)
- `fill="black"`, `stroke="none"`
- Fixed brush width: `8` (logical units), tunable via a constant.

`stroke-linecap: round` and `stroke-linejoin: round` if we ever fall back to plain stroked paths.

### 5.4 Tools

`<Toolbar>` (in `components/canvas/`):
- **Undo** — pops the last stroke off the strokes array. Stroke history is the array itself; no separate undo stack needed for v1.
- **Erase All** — clears with confirm dialog.
- **Finish** — opens the submission flow (see §8).

No multi-stroke eraser, no per-stroke move, no tracing layer — those are in `ideas.md`.

### 5.5 Persistence

The `useDrawing` hook autosaves to IndexedDB (`drawingsInProgress` store) every 5 seconds when strokes have changed. On `<DrawScreen>` mount, if there's a saved drawing for this slug, we offer "Resume" or "Start fresh."

---

## 6. The Coach Loop

This is the central interaction. It must feel **occasional**, not chatty.

### 6.1 Trigger logic

Implemented in `useCoach`:

```
state:
  lastStrokeAt:   number   // ms timestamp of last stroke end
  lastFetchAt:    number   // ms timestamp of last successful coach response
  strokesAtLastFetch: number
  isFetching:     boolean
  messages:       CoachMessage[]

every 1 second tick (setInterval), check:
  if isFetching                                    → skip
  if strokes.length === strokesAtLastFetch         → skip   (nothing new to look at)
  if (now - lastStrokeAt) < 3000                   → skip   (user still drawing)
  if (now - lastFetchAt) < 15000                   → skip   (rate limit floor)
  → trigger coach fetch
```

When a fetch starts, `isFetching = true` so subsequent ticks short-circuit. On response, we set `lastFetchAt = now`, `strokesAtLastFetch = current`, append the message to `messages`.

The 1s tick is acceptable battery-wise; if it becomes a concern we can collapse it into pointer-up + a single trailing timeout.

### 6.2 What gets sent to Claude

Each fetch includes:
1. **System prompt** (cached) — defines voice, audience, output schema.
2. **Project + focus guideline** (cached for the session) — `Project` object, the chosen `Guideline` object, the project's full step list.
3. **Recent advice summary** (last 3 coach messages, plain text).
4. **Snapshot** — a 1024×1024 PNG rasterized from the current SVG (see §6.4).

### 6.3 What Claude returns

A **tool-use response** invoking `provide_coaching` with this schema:

```ts
{
  message: string;                 // 1–3 short sentences, cozy/encouraging tone
  highlightedGuidelineId?: string; // one of the focusGuidelines (for UI highlight)
  encouragement: 'gentle-praise' | 'gentle-nudge' | 'celebrate';
}
```

We use tool-use (not bare JSON) for schema reliability. Anthropic SDK `tool_choice: { type: 'tool', name: 'provide_coaching' }` forces the call.

### 6.4 Snapshot strategy: PNG, not SVG

**Decision:** the canvas snapshot sent to Claude is a **rasterized PNG**, not the SVG markup.

Rationale:
- Claude's vision is reliable; parsing dense SVG path data for visual judgment is not.
- PNG keeps token count predictable (image tokens ~ resolution-dependent, not stroke-count-dependent).
- The SVG remains the canonical data store for portfolio/replay.

`services/snapshot.ts`:
```ts
async function svgToPng(svgEl: SVGElement, size = 1024): Promise<string>
// returns base64 data url. Uses an offscreen <canvas> + serialized SVG → Image → drawImage.
```

Resolution is tunable via constant. **Default is 1024px** — pending real-world testing, we may step down to 768 or 512 if cost/latency becomes an issue. Logged in `TODO.md`.

### 6.5 Final summary (submission)

A separate Functions endpoint, `coachFinalSummary`, is called once on the Done screen. Same payload shape but:
- Same 1024px snapshot.
- Different system prompt asking for a 4–6 sentence summary plus 1–2 things the user could try in their next session.
- Returns `{ summary: string, tryNext: string[] }`.

The result is persisted to IndexedDB as part of the `PortfolioEntry`.

---

## 7. Claude API Integration

### 7.1 Functions proxy

Two callable functions in `functions/src/index.ts`:

```ts
export const coachAdvice = onCall(
  { region: 'us-central1', maxInstances: 10 },
  async (req) => { ... }
);

export const coachFinalSummary = onCall(
  { region: 'us-central1', maxInstances: 5 },
  async (req) => { ... }
);
```

Each receives `{ project, focusGuideline, steps, recentMessages, imageBase64 }` and returns the structured tool result.

**API key:** stored as Firebase Functions secret (`firebase functions:secrets:set ANTHROPIC_API_KEY`), read via `defineSecret`.

**Rate limiting:** simple in-memory map keyed by request `App Check` token (or IP fallback) — max 1 request per 10s per caller. Soft cap; 429 with friendly message if exceeded.

**App Check:** enable so random callers can't burn the API budget. reCAPTCHA v3 provider for the web app.

### 7.2 Anthropic SDK call shape

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() });

const response = await client.messages.create({
  model: 'claude-sonnet-4-7',          // confirm latest at impl time
  max_tokens: 400,
  system: [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
  ],
  tools: [
    {
      name: 'provide_coaching',
      description: '...',
      input_schema: PROVIDE_COACHING_SCHEMA,
    },
  ],
  tool_choice: { type: 'tool', name: 'provide_coaching' },
  messages: [
    {
      role: 'user',
      content: [
        // Cached project context
        { type: 'text', text: projectContextBlock, cache_control: { type: 'ephemeral' } },
        // Per-call, not cached
        { type: 'text', text: `Recent advice you've already given: ${recentSummary}` },
        { type: 'image', source: { type: 'base64', media_type: 'image/png', data: imageBase64 } },
        { type: 'text', text: 'What would you say to the user right now?' },
      ],
    },
  ],
});
```

**Prompt caching is required.** The system prompt + project/guideline/steps block are reused on every coach call within a session. Caching cuts both latency and cost on second-and-later calls. Cache lifetime is 5 minutes — naturally aligned to a typical drawing session.

### 7.3 System prompt sketch

```
You are a friendly, encouraging sketching coach in a cozy app called Sketch Coach.
Your tone is warm, brief, and specific — like a kind teacher walking past a desk
and noticing one thing the student is doing well or could try.

Audience: novice to intermediate hobbyists. They are not pursuing perfection;
they want to enjoy drawing and gradually get better.

For each coaching turn:
- Look at the user's current drawing (image attached).
- Comment on ONE specific thing — never a list.
- Lean on the session's focus guideline when it applies; pick another from the
  project's focus list if a different one is more relevant in the moment.
- Avoid repeating advice you've already given (recent advice provided below).
- 1–3 short sentences. No headers. No emoji unless natural.

You will respond by calling the `provide_coaching` tool.
```

### 7.4 Cost / budget guardrails

- Sonnet at 1024px image + ~1.5K cached tokens + ~400 output tokens ≈ a few cents per coaching call.
- 15s minimum gap → max 4 calls/min while drawing.
- A 30-min session ≈ ~30–60 calls in the worst case.
- Final summary is 1 extra call per finished drawing.
- Functions in-memory rate limit + App Check + budget alerts on the Anthropic dashboard cover the realistic abuse cases.

For a personal-use prototype this is comfortably affordable. Revisit if it ever ships publicly.

### 7.5 Local dev shortcut

For development only, the web app supports a `VITE_ANTHROPIC_API_KEY` env var that, when set, calls Anthropic directly from the browser (bypassing Functions). This is **never** used in production builds — gated by `import.meta.env.DEV`.

This lets you start coding the UX before Functions deploy is wired up. Document clearly in README.

---

## 8. UI Flow & Screens

Five routes, all lazy-loaded:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `HomeScreen` | Project picker + portfolio peek |
| `/coach/:slug` | `CoachingScreen` | Introduce the focus guideline |
| `/draw/:slug` | `DrawScreen` | Canvas + step list + coach panel |
| `/done/:slug` | `DoneScreen` | Final feedback + save to portfolio |
| `/portfolio` | `PortfolioScreen` | All completed work |

### 8.1 HomeScreen

- Header: "Sketch Coach" + a small portfolio-count chip ("3 sketches")
- Three horizontal rows: Beginner / Developing / Intermediate
- Tier locking: Developing locked until ≥2 Beginner projects are completed; Intermediate locked until ≥2 Developing.
- Each project card: title, est. minutes, completion state (✓ once done), focus guideline preview.
- Soft chillhop track auto-plays at low volume on first interaction (browsers block autoplay before user gesture).

### 8.2 CoachingScreen

- One screen, one principle. Large guideline title, 2–3 sentence description, and one example coachCue rendered as a fake "in-the-moment" message card.
- Why a separate screen: gives the principle a moment of focus before it gets lost in the action of drawing.
- The displayed guideline is the **first** of the project's `focusGuidelines[]` (the one most central to that project).
- Single button: "Start drawing" → `/draw/:slug`.

### 8.3 DrawScreen

Three-pane layout (responsive):

```
+-----------+--------------------------+--------------+
| Steps     |      Canvas              |  Coach       |
| (left)    |                          |  Panel       |
| collapsib |   <svg> drawing area     |  (right)     |
| le        |                          |              |
|           +--------------------------+              |
|           |  Toolbar: undo erase finish             |
+-----------+--------------------------+--------------+
```

- **Steps pane:** the project's `steps[]`, with the current step highlighted. The user marks steps as "done" manually — we don't try to detect it.
- **Coach panel:** stack of recent `CoachMessage`s, newest at top. Each message animates in (Framer Motion). When `highlightedGuidelineId` is set, briefly pulse a small "principle" badge.
- **Loading state:** a soft "Looking at your sketch…" indicator while a coach fetch is in flight. Keep it small — it should not be the most visible thing on screen.

Mobile/narrow viewports: panes collapse into tabs above the canvas.

### 8.4 DoneScreen

- Renders the final SVG.
- Plays a soft completion chime.
- Calls `coachFinalSummary` once on mount, shows a loading state.
- When the summary returns, displays:
  - Claude's 4–6 sentence summary
  - "Try next time" bullet(s)
  - **Save to portfolio** button (creates the IndexedDB entry, navigates to `/portfolio`)
  - **Discard** button (returns home without saving)

### 8.5 PortfolioScreen

- Grid of thumbnails sorted newest-first.
- Click a thumbnail: modal with full SVG + saved feedback + project name + completion date.
- Empty state: friendly illustration + "Pick a project to get started" link.

---

## 9. State Management

### 9.1 AppContext

Single React Context provider in `contexts/AppContext.tsx`:

```ts
interface AppContextValue {
  // Static data (loaded once, cached)
  projects: Project[];
  guidelines: Guideline[];

  // Audio
  audioVolume: number;
  setAudioVolume: (v: number) => void;
  sfxEnabled: boolean;
  setSfxEnabled: (b: boolean) => void;

  // Portfolio (read-only here; writes go through usePortfolio)
  portfolio: PortfolioEntry[];
  refreshPortfolio: () => Promise<void>;
}
```

Persisted prefs hydrate on mount; portfolio loads from IndexedDB on mount.

### 9.2 Drawing-session state

**Lives in `<DrawScreen>` and its hooks**, not in AppContext. Reasons:
- It's expensive (stroke arrays update many times per second) and re-rendering global subscribers on each pointer move is wasteful.
- It's scoped to one screen.
- It clears when leaving the screen.

`useDrawing(slug)` — strokes array, undo, erase, persist.
`useCoach(project, focusGuideline, getSnapshot, recentMessages)` — fires Claude calls per §6.

---

## 10. Audio

### 10.1 Backing tracks

`web/public/audio/tracks/` holds 10 royalty-free chillhop loops (sourced from Pixabay Music or Free Music Archive — confirm licensing per track and add an `ATTRIBUTION.md`).

`useAmbientAudio` hook:
- Picks a random track on session start (excluding `prefsStore.lastTrack` to avoid immediate repeat).
- HTML5 `<audio>` element, `loop=true`.
- Volume controlled via `audioVolume` from AppContext.
- Fade in/out on play/pause (200ms linear gain ramp via `AudioContext` or simple JS interval).

### 10.2 Sound effects

`web/public/audio/sfx/`:
- `stroke-end.mp3` — soft pencil tap
- `button.mp3` — UI click
- `complete.mp3` — gentle chime on finish
- `coach.mp3` — quiet ding when a coach message arrives

All gated by `sfxEnabled`. Preloaded at app start so first plays don't lag.

---

## 11. Visual Design

Cozy / lo-fi / Animal-Crossing-adjacent. Warm, low-contrast.

CSS variable palette (in `index.css`):

```css
:root {
  --color-paper:    #F7F1E5;   /* cream paper */
  --color-ink:      #2C2520;   /* warm charcoal */
  --color-ink-soft: #6B5E54;   /* soft body text */
  --color-accent:   #C97B5C;   /* terracotta */
  --color-accent-soft: #E9C9B5;
  --color-cream:    #F2E6D0;
  --color-shadow:   rgba(44, 37, 32, 0.10);

  --radius-sm: 6px;
  --radius-md: 12px;
  --radius-lg: 24px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 16px;
  --space-4: 24px;
  --space-5: 40px;

  --font-display: 'Fraunces', Georgia, serif;
  --font-body:    'Inter', -apple-system, sans-serif;
}
```

Use Google Fonts Fraunces (display) + Inter (body). Subtle paper-texture background image at low opacity on body.

---

## 12. Build & Deploy

Mirror travel's scripts.

`web/package.json`:
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src --ext ts,tsx",
    "format": "prettier --write src/**/*.{ts,tsx,css,json}",
    "typecheck": "tsc --noEmit",
    "deploy": "npm run build && firebase deploy --only hosting"
  }
}
```

`functions/package.json`:
```json
{
  "scripts": {
    "build": "tsc",
    "deploy": "npm run build && firebase deploy --only functions",
    "logs": "firebase functions:log"
  }
}
```

**`firebase.json`** (project root):
```json
{
  "hosting": {
    "public": "web/dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  },
  "functions": [{
    "source": "functions",
    "codebase": "default",
    "ignore": ["node_modules", ".git", "*.log"]
  }]
}
```

CI/CD is out of scope for v1; manual `firebase deploy` from a clean working tree is fine.

---

## 13. Open Questions / Risks

Surfaced now so we can decide before/during build, not after.

1. **Claude model choice.** Spec assumes Sonnet 4.x. Haiku would be cheaper and faster but with lower vision fidelity. Worth A/B testing once the rest is wired up.
2. **Snapshot resolution.** Default is 1024px. Likely overkill for many cases; test stepping down to 768 or 512 once the loop is working. Tracked in `TODO.md`.
3. **Trigger sensitivity.** 3s idle / 15s rate limit floor are educated guesses. May feel chatty or sleepy in practice — tune from real use.
4. **Pressure on Mac trackpad.** PointerEvent.pressure support across Safari/Chrome/Firefox on Mac is uneven. Fallback path uses `webkitForce` on Safari and a constant 0.5 elsewhere.
5. **Track licensing.** "Free uncopyrighted" varies in meaning. Pixabay Music and FMA's CC0 collection are the safest sources. Each track must keep a credit line in `ATTRIBUTION.md` even if not legally required, for hygiene.
6. **App Check provisioning.** First-time setup with reCAPTCHA v3 takes 10–20 min and a domain. If you're testing on `localhost` initially, debug tokens work but remember to remove them before deploying.
7. **No accounts means no cross-device portfolio.** Acknowledged in proposal. If users actually want this later, Firebase Auth + Firestore is the natural extension.

---

## 14. Implementation Order

A reasonable milestone path (each slice is shippable / playable on its own):

1. **Scaffold:** Vite + React + Router, AppContext, data services, project routing. Static screens with placeholder content.
2. **Canvas v1:** SketchCanvas with pointer events, perfect-freehand strokes, undo/erase, IndexedDB autosave.
3. **Local-dev Claude call:** wire `useCoach` against `VITE_ANTHROPIC_API_KEY` (browser-direct), validate the loop end-to-end, tune timing.
4. **Functions proxy:** move Claude call behind `coachAdvice` function. Rate limits. App Check.
5. **Submission flow:** `coachFinalSummary` + portfolio save + PortfolioScreen.
6. **Audio:** ambient loop + SFX.
7. **Polish:** transitions, empty states, mobile layout.
8. **Deploy:** Firebase Hosting + Functions.

Each step ends in a working demo; we don't bottleneck on infra before shipping the fun parts.
