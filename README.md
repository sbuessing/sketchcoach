# Sketch Coach

An AI-powered drawing tutor that guides you from your first line to confident sketching. Pick a project, open the canvas, and a friendly coach checks in on your work every so often — noticing what's going well, offering a gentle nudge when something could improve, and celebrating when things click.

Built with React + Vite + TypeScript, deployed on Firebase Hosting, powered by Claude.

**Live at [sketchcoach.web.app](https://sketchcoach.web.app/)**

---

## Features

### Drawing canvas
- SVG-based canvas with smooth, pressure-aware strokes via [perfect-freehand](https://github.com/steveruizok/perfect-freehand)
- **Pencil mode** — lighter gray strokes for rough sketching and guidelines
- **Pen mode** — full ink strokes for final lines
- **Per-stroke eraser** — click any stroke to remove it, mode-aware (pencil eraser only removes pencil strokes)
- Undo, erase all, and autosave to IndexedDB (resume where you left off)

### AI coach
- Powered by **Claude** (Anthropic) with a Bob Ross / Mr. Rogers / Yo Gabba Gabba personality — warm, specific, genuinely excited
- Checks your drawing after 3 seconds of idle time, no more than once every 20 seconds
- Sends a 1024 × 1024 PNG snapshot of your canvas; returns 1–3 sentences focused on one thing
- Each session has a **focus principle** that shapes the coach's attention
- Final summary on completion: what you did well, what to try next time

### Projects & progression
- 10 curated line-art projects from beginner to intermediate (bird, turtle, teapot, bicycle, and more)
- Three tiers — **Beginner / Developing / Intermediate** — unlocked as you complete projects
- Each project has step-by-step instructions and a set of drawing principles the coach can draw on

### Sketching Tips
- A reference page listing all 20+ drawing principles
- Split into **techniques you've encountered** (from completed projects) and **still to discover**
- Each card shows the principle title, full description, and the coach cues used during sessions

### Portfolio
- Every completed drawing is saved locally with Claude's final feedback attached
- Browse your work in a thumbnail gallery; click to see the full drawing and notes

### Bring your own key (BYOK)
- Add your own [Anthropic API key](https://console.anthropic.com/settings/keys) via the settings modal on the home screen
- Key is stored in your browser's localStorage — never sent anywhere except directly to Anthropic
- A `VITE_ANTHROPIC_API_KEY` env var works as a fallback for local dev

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 (strict) |
| Build | Vite 7 |
| Routing | React Router DOM v7 (lazy-loaded screens) |
| Drawing | SVG + perfect-freehand |
| Animation | Framer Motion |
| AI | Anthropic Claude via `@anthropic-ai/sdk` |
| Storage | localStorage (prefs + API key) + IndexedDB (portfolio + autosave) |
| Hosting | Firebase Hosting (`sketchcoach-fae4f`) |
| Fonts | Caveat (display) + DM Sans (body) via Google Fonts |
| Styling | Pure CSS with CSS variables — no Tailwind, no CSS modules |

---

## Getting started

### Prerequisites

- Node.js 18+
- An Anthropic API key — [get one here](https://console.anthropic.com/settings/keys)

### Install

```bash
cd web
npm install
```

### Configure your API key

Create `web/.env` (gitignored):

```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

Or skip this and enter your key in the app's settings modal after starting the dev server.

### Run locally

```bash
cd web
npm run dev
```

Opens at [http://localhost:5173](http://localhost:5173).

### Other commands

```bash
npm run typecheck   # TypeScript type check (no emit)
npm run build       # Production build → web/dist/
npm run preview     # Preview the production build locally
npm run publish     # Build + deploy to Firebase Hosting
```

---

## Deploying

The app deploys to Firebase Hosting. Make sure you have `firebase-tools` installed and are logged in:

```bash
npm install -g firebase-tools
firebase login
```

Then from the `web/` directory:

```bash
npm run publish
```

This runs `tsc -b && vite build` then `firebase deploy --only hosting`. The site deploys to the `sketchcoach` hosting site on the `sketchcoach-fae4f` Firebase project.

---

## Project structure

```
sketchcoach/
├── docs/                  # Proposal, technical spec, ideas, TODO, prompt log
└── web/                   # The entire app
    ├── public/
    │   └── data/          # projects.json, guidelines.json, per-project step files
    │   └── audio/         # Chillhop backing tracks + sound effects
    ├── src/
    │   ├── components/
    │   │   ├── canvas/    # SketchCanvas, ToolModeSelector, Toolbar
    │   │   ├── coach/     # CoachPanel, CoachMessage
    │   │   ├── screens/   # HomeScreen, DrawScreen, DoneScreen, PortfolioScreen, TipsScreen
    │   │   ├── settings/  # ApiKeyModal
    │   │   └── steps/     # StepList
    │   ├── contexts/      # AppContext (projects, guidelines, portfolio, audio)
    │   ├── hooks/         # useDrawing, useCoach, useAmbientAudio
    │   ├── services/      # claudeClient, dataService, portfolioStore, prefsStore, snapshot
    │   └── shared/        # TypeScript types
    ├── firebase.json
    ├── .firebaserc
    └── package.json
```

---

## Data files

All content ships as static JSON in `web/public/data/`:

| File | Contents |
|------|----------|
| `projects.json` | 10 project definitions (slug, title, tier, estimated time, focus guidelines) |
| `guidelines.json` | 23 drawing principles with descriptions and coach cues |
| `<slug>.json` | Step-by-step instructions for each project |

User data (portfolio entries, drawings in progress, preferences) stays in the browser — no account or server required.

---

## Future plans

See [`docs/ideas.md`](docs/ideas.md) for the full list. Top candidates:

- Remove the pre-draw intro screen (go straight to canvas)
- Pencil/pen layer separation for rough sketching vs. final lines
- Directed prompts with creative constraints (AI Leads mode)
- Skill assessment from drawing history to personalise project recommendations
- Firebase Cloud Functions proxy for managed API key in production

---

## License

See [LICENSE](LICENSE).
