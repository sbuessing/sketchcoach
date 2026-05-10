# Sketch Coach — Technical Spec

This document specifies the architecture and implementation plan for Sketch Coach v1. It builds on `docs/proposal.md` and follows the patterns established in the reference project at `/Users/shawn/Documents/GitHub/anotterlanguage/travel` (deployed at https://travelsimulator.web.app).

The major difference from the reference project: Sketch Coach has **no offline content-generation pipeline**. There is one runtime — the React web app — which calls Claude directly from the browser.

---

## 1. Architecture

### Beta (current)

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
- Static project data (10 projects, 10 step files, 23 guidelines) ships in `web/public/data/` as JSON.
- User data (portfolio, preferences, drawings-in-progress) lives in the user's browser (`localStorage` + `IndexedDB`).
- **Beta API key strategy:** users provide their own Anthropic key via a settings modal (BYOK). Key is saved to `localStorage` and passed to the Anthropic SDK with `dangerouslyAllowBrowser: true`. `VITE_ANTHROPIC_API_KEY` env var is the local dev fallback. Key priority: localStorage BYOK key → env var.
- **Future:** a Firebase Cloud Functions proxy replaces the direct call for managed production deploys.

**No backend database, no auth, no server pipeline.**

---

## 2. Project Layout

Mirror the travel project's `web/` folder structure. No `functions/` directory exists yet — the Cloud Functions proxy is a future production path.

```
sketchcoach/
├── docs/                              # proposal, spec, ideas, TODO, prompts
├── web/                               # React/Vite frontend
│   ├── src/
│   │   ├── main.tsx                   # Entry: Router + AppProvider
│   │   ├── App.tsx                    # Routes
│   │   ├── index.css                  # Global CSS variables (Garden Studio palette)
│   │   ├── contexts/
│   │   │   └── AppContext.tsx         # Session-wide state (projects, guidelines, audio, portfolio)
│   │   ├── components/
│   │   │   ├── screens/               # HomeScreen, DrawScreen, DoneScreen, PortfolioScreen
│   │   │   ├── canvas/                # SketchCanvas, ToolModeSelector, Toolbar
│   │   │   ├── coach/                 # CoachPanel, CoachMessage
│   │   │   ├── steps/                 # StepList, StepItem
│   │   │   └── settings/              # ApiKeyModal (BYOK key management)
│   │   ├── hooks/
│   │   │   ├── useDrawing.ts          # Stroke state, undo, erase
│   │   │   ├── useCoach.ts            # Coach trigger logic + Claude calls
│   │   │   └── useAmbientAudio.ts     # Backing track + SFX
│   │   ├── services/
│   │   │   ├── claudeClient.ts        # Anthropic SDK wrapper (direct browser calls)
│   │   │   ├── dataService.ts         # Loads projects.json, guidelines.json, step files
│   │   │   ├── portfolioStore.ts      # IndexedDB schema + CRUD
│   │   │   ├── prefsStore.ts          # localStorage wrapper (prefs + BYOK key)
│   │   │   ├── snapshot.ts            # SVG → PNG rasterizer
│   │   │   └── strokeUtils.ts         # Stroke helpers
│   │   ├── shared/
│   │   │   └── types.ts               # All TypeScript types
│   │   └── vite-env.d.ts
│   ├── public/
│   │   ├── data/                      # projects.json, guidelines.json, <slug>.json × 10
│   │   └── audio/
│   │       ├── tracks/                # chillhop loops
│   │       └── sfx/                   # button clicks, completion chime, etc.
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── firebase.json                  # Hosting config (in web/ dir)
│   ├── .firebaserc                    # Firebase project: sketchcoach-fae4f
│   └── package.json
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
  if (now - lastFetchAt) < 20000                   → skip   (rate limit floor)
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

### 7.1 API key strategy

**Beta (current):** BYOK — users paste their own Anthropic API key into the settings modal on HomeScreen. Key is stored in `localStorage` via `prefsStore.getApiKey()` / `setApiKey()`. The `claudeClient.ts` module resolves the key at call time (localStorage key takes precedence over `VITE_ANTHROPIC_API_KEY`). The Anthropic SDK is called with `dangerouslyAllowBrowser: true`.

**Future production:** move calls behind a Firebase Cloud Functions proxy. The proxy holds `ANTHROPIC_API_KEY` as a Firebase secret, adds rate limiting and App Check verification, and the browser never touches the key. The `claudeClient.ts` module is the only file that changes — the rest of the app is proxy-agnostic.

**`claudeClient.ts` exported API:**
- `resolveApiKey(): string | null` — localStorage key → env var → null
- `isCoachConfigured(): boolean` — true if any key source is available
- `isByokMode(): boolean` — true if a personal key is saved
- `requestCoachAdvice(args): Promise<CoachAdviceResult>`
- `requestFinalSummary(args): Promise<FinalSummaryResult>`

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

### 7.3 System prompt persona

The coach personality is a blend of **Bob Ross** (every mark is a happy little accident), **Mr. Rogers** (genuine warmth, proud of you for showing up), and **Yo Gabba Gabba** (unabashedly excited, learning is fun). The 80/20 rule: 80% delight, 20% gentle nudge.

In-session calls use `provide_coaching` tool (forced tool use). Final summary uses `provide_final_summary`. Both system prompts are marked `cache_control: ephemeral` and reused across all calls in a session for prompt caching.

### 7.4 Cost / budget guardrails

- Sonnet at 1024px image + ~1.5K cached tokens + ~400 output tokens ≈ a few cents per coaching call.
- 20s minimum gap → max 3 calls/min while drawing.
- A 30-min session ≈ ~20–45 calls in the worst case.
- Final summary is 1 extra call per finished drawing.
- With BYOK, cost is borne by the user on their own account. Set Anthropic budget alerts as a safeguard.
- When the Functions proxy is added: in-memory rate limit + App Check cover the realistic abuse cases.

---

## 8. UI Flow & Screens

Four routes, all lazy-loaded:

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `HomeScreen` | Project picker + portfolio peek |
| `/draw/:slug` | `DrawScreen` | Canvas + step list + coach panel |
| `/done/:slug` | `DoneScreen` | Final feedback + save to portfolio |
| `/portfolio` | `PortfolioScreen` | All completed work |

> **Removed:** `/coach/:slug` (`CoachingScreen`) — the pre-draw intro screen was removed to reduce friction. The focus guideline (title, description, sample cue) now appears as the coach panel's welcome card on `DrawScreen`. Clicking a project card goes directly to the canvas.

### 8.1 HomeScreen

- Header: "Sketch Coach" + **API key button** (green dot = key active, amber dot = missing) + portfolio count
- If no key is configured, an amber banner prompts the user to add one
- API key modal: password input, show/hide toggle, save/remove, `sk-ant-` validation hint, link to console.anthropic.com
- Four horizontal rows: Beginner / Developing / Intermediate / Advanced
- Tier locking: Developing locked until ≥2 Beginner complete; Intermediate locked until ≥2 Developing; Advanced locked until ≥2 Intermediate
- Each project card: title, est. minutes, completion state (✓ once done)
- Soft chillhop track auto-plays at low volume on first interaction (browsers block autoplay before user gesture)

### 8.2 DrawScreen

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
- **Coach panel:** stack of recent `CoachMessage`s, newest at top. When `highlightedGuidelineId` is set, briefly pulse a small "principle" badge. Before any messages arrive, the panel shows the focus guideline description and a sample cue as a welcome card.
- **Loading state:** a soft "Looking at your sketch…" indicator while a coach fetch is in flight. Keep it small — it should not be the most visible thing on screen.
- **Toolbar:** lives below the canvas. Left slot: audio controls (volume slider, skip track, SFX toggle). Center slot: `ToolModeSelector` + autosave indicator. Right slot: Undo, Erase All, Finish.

#### Drawing tools

The toolbar contains a compact three-button `ToolModeSelector`:

| Button | Mode | Visual |
|--------|------|--------|
| ✏ Pencil | `drawMode='pencil'`, `toolMode='draw'` | Gray `#808080` strokes at 0.55 opacity, finer size (6 vs 9) |
| 🖊 Pen | `drawMode='pen'`, `toolMode='draw'` | Full ink `#2d3f2a` at size 9 |
| ◌ Erase | `toolMode='erase'` (drawMode preserved) | Click any stroke to remove it; mode-aware (pencil eraser only removes pencil strokes, pen eraser only pen strokes); non-erasable strokes dim to 0.25 opacity; hovering an erasable stroke turns it red |

Both pencil and pen modes use the same pressure/velocity handling as before; only the `size`, `thinning`, and fill colour differ. `Stroke.drawMode` is persisted in IndexedDB so pencil vs pen is preserved on resume.

Mobile/narrow viewports: panes collapse into tabs above the canvas.

### 8.3 DoneScreen

- Renders the final SVG.
- Plays a soft completion chime.
- Calls `coachFinalSummary` once on mount, shows a loading state.
- When the summary returns, displays:
  - Claude's 4–6 sentence summary
  - "Try next time" bullet(s)
  - **Save to portfolio** button (creates the IndexedDB entry, navigates to `/portfolio`)
  - **Discard** button (returns home without saving)

### 8.4 PortfolioScreen

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

**Garden Studio** — cozy, botanical, lo-fi. Forest greens with cream paper. Animal-Crossing-adjacent without being literal about it.

CSS variable palette (in `index.css`):

```css
:root {
  --color-paper:         #fbfaf4;   /* cream paper */
  --color-paper-warm:    #ece6d8;   /* linen */
  --color-ink:           #2d3f2a;   /* forest */
  --color-ink-soft:      #5a6b57;   /* mid-tone forest */
  --color-ink-faint:     #b8c4a8;   /* sage */
  --color-accent:        #6b8e5a;   /* moss */
  --color-accent-soft:   #c7d5ba;   /* pale moss */
  --color-accent-strong: #547348;   /* hover/active moss */
  --color-shadow:        rgba(45, 63, 42, 0.10);
  --color-shadow-strong: rgba(45, 63, 42, 0.18);

  --color-tier-beginner:     #8ba876;
  --color-tier-developing:   #c5a85e;
  --color-tier-intermediate: #a87b6a;

  --font-display: 'Caveat', 'Bradley Hand', cursive;
  --font-body:    'DM Sans', -apple-system, sans-serif;
}
```

Google Fonts: **Caveat** (handwritten display, weight 400–700) + **DM Sans** (body, weight 400–700). Headings use Caveat at larger sizes (h1: 3.2rem, h2: 2.4rem, h3: 1.7rem) to compensate for the font's natural compactness.

---

## 12. Build & Deploy

`web/package.json` scripts:
```json
{
  "scripts": {
    "dev":       "vite",
    "build":     "tsc -b && vite build",
    "preview":   "vite preview",
    "typecheck": "tsc --noEmit",
    "publish":   "npm run build && firebase deploy --only hosting"
  }
}
```

**`web/firebase.json`:**
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
}
```

**`web/.firebaserc`:** Firebase project ID is `sketchcoach-fae4f`, hosting site name is `sketchcoach`.

To deploy: `npm run publish` from the `web/` directory. Requires `firebase-tools` globally installed and `firebase login`.

CI/CD is out of scope for v1; manual publish from a clean working tree is fine.

---

## 13. Open Questions / Risks

Surfaced now so we can decide before/during build, not after.

1. **Claude model choice.** Spec assumes Sonnet 4.x. Haiku would be cheaper and faster but with lower vision fidelity. Worth A/B testing once the rest is wired up.
2. **Snapshot resolution.** Default is 1024px. Likely overkill for many cases; test stepping down to 768 or 512 once the loop is working. Tracked in `TODO.md`.
3. **Trigger sensitivity.** 3s idle / 20s rate limit floor are educated guesses. May feel chatty or sleepy in practice — tune from real use.
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
