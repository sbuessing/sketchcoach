# Sketch Coach — Future Ideas

Things we could add but aren't in the initial build. Kept here for reference as the project grows.

---

## UI & Flow

- **More inline help text + a Design Principles page** — the app teaches a specific workflow (pencil first, then ink; sketch lightly, commit confidently; the canonical pattern in `content-guidelines.md`) but right now this only surfaces through the step instructions themselves. Add (1) lightweight inline hints on the draw screen — first-time tooltips on the pencil/pen toggle, the eraser, the undo shortcut; and (2) a dedicated "Design Principles" or "How Sketch Coach Works" page accessible from the home header. The page would explain the pencil → ink workflow, the role of construction lines, why the coach checks in periodically, what each tier of project teaches, and the broader sketching philosophy the app is built around. Goal: a curious user can understand *why* the app is shaped the way it is without needing to draw a single project.

- **Confirm before leaving** — if the user has unsaved strokes and tries to navigate away (back button, closing the tab), prompt "Leave this sketch?" so nothing is accidentally lost. Use the `beforeunload` event for tab closes and a React Router blocker for in-app navigation.

- **Offline graceful degradation** — the app should still load and let you sketch when offline (canvas, steps, and portfolio all live locally). Coach calls should fail quietly with a small "coach unavailable — no internet" note rather than spinning forever.

### Scene Library & AI-Generated Project Packs

Users choose from a set of **scenes** on the home screen — each scene is a themed collection of ~16 projects spanning beginner to advanced (e.g. "Cozy Kitchen", "Forest Creatures", "City Skylines", "Botanicals"). The current flat project list becomes scene-aware.

**On-demand scene generation** — a "Propose your own scene" button lets the user type any theme (e.g. "underwater cave", "90s video game items"). Claude generates a full scene: a name, short description, and a complete set of 16 projects with titles, descriptions, step lists, difficulty tiers, and focus guideline assignments. The generated scene is saved locally alongside the built-in ones and is available immediately.

Implementation sketch:
- `scenes.json` in `/public/data/` lists the bundled scenes (id, name, description, coverImage). Each scene has its own `projects/<scene-id>/index.json` and `steps/<scene-id>/<slug>.json`.
- A `generateScene(theme: string)` Claude call uses a tool `provide_scene` that returns the full structured scene in one shot — model, title, description, and an array of 16 projects each with slug, title, tier, estimatedMinutes, description, focusGuidelines, and a steps array. Max tokens ~4000.
- Generated scenes are stored in `localStorage` under `sketchcoach:scenes:<id>` and merged with built-in scenes at app load via a thin adapter in `dataService`.
- The home screen gets a scene picker (horizontal scroll of cards) above the project grid. Selecting a scene filters the grid. An "Add your own…" card at the end opens a text input + generate button.
- Generation takes ~10–15 seconds; show a progress indicator with a fun message ("Claude is imagining your scene…").

---

## Scenes

- **Scene completion ceremony** — when all of a scene's projects are done, trigger something memorable: a full-screen reveal of the assembled scene, a downloadable poster export, a coach message acknowledging the scene's name ("you finished the harbor"), maybe even a subtle animation that re-traces a few signature lines. The N/N moment should feel like an arrival, not just the disappearance of a "1 left" counter.

- **AI-fleshed-out final scene** — a richer take on the completion ceremony: hand Claude every piece the user has drawn for a scene, along with the scene's identity, and ask it to compose a more elaborated final image that uses those pieces as the foundation. Could mean filling in supporting detail between the user's objects (the dock planks behind their bollard, the rigging connecting their sailboat), or returning a stylized "finished poster" version of the scene with the user's drawings preserved as the hero elements. The user's hands stay on the centerpiece work; the AI handles the connective tissue and atmosphere.

- **Hand-drawn scene backgrounds** — v1 scenes ship with just the canvas color behind the user's drawings. Once scenes prove themselves, add a light pencil-sketch background per scene that drawings sit on top of. Style match: pencil weight (`#808080` at ~30% opacity), same stroke aesthetic as the user's own pencil. Harbor would get a hint of dock perspective and horizon; Windowsill a window frame and garden suggestion; Garden Courtyard tile lines and a wall silhouette. Faint enough to never compete with the actual drawings — scaffolding the user's work is mounted onto, not a rendered illustration.

---

## Canvas & Drawing

- **iOS / Apple Pencil support** — verify `pointerType === 'pen'` and `PointerEvent.pressure` come through correctly on iPad Safari. The drawing code is already structured for this; it just needs real-device testing and any Safari-specific event fixes.

- **Backing track auto-pause** — pause the ambient music when the browser tab loses focus (visibilitychange event), resume when it returns. Polite for users with headphones who switch tabs.

- **"Remove pencil construction on finish" toggle** — when finalizing a project, offer a one-click option to strip out all pencil-mode strokes, leaving only the inked lines. The canonical workflow encourages light pencil construction that gets ink committed on top; many users will want a clean final piece without leftover guides. Implementation is straightforward: filter `strokes` by `drawMode !== 'pencil'` and save that as the finalized version. Original including pencil could be kept in the portfolio entry too for reference. Could be a checkbox on the Done screen ("✓ Hide pencil guides in the final") or even the default behavior with a "Keep pencil layer" opt-out.

- **Smarter eraser modes** — two additional erase gestures beyond the current stroke-level tap-to-erase: (1) **tap erase** already works (removes the whole stroke); (2) **drag erase** — dragging across strokes removes only the segments the eraser path crosses, splitting strokes at the intersection. This mirrors how a physical eraser works and is especially useful for cleaning up a single crossing line without removing the whole stroke.

- **Stylus / tablet pressure sensitivity** — `PointerEvent.pressure` works correctly for hardware styli (`pointerType === 'pen'`, e.g. Apple Pencil on iPad, Wacom tablets) and is already wired up. Investigated macOS trackpad Force Touch via `webkitForce` on `mousemove` / `webkitmouseforcechanged`; `webkitForce` is always 0 on standard laptop trackpads and does not provide continuous pressure during a drag. Force Touch on macOS is essentially a discrete "force click" signal, not continuous drawing pressure. Dead end for now — revisit if Apple or browsers expose a better API.

---

## Engagement

### AI Leads
- **Directed prompts with constraints** — instead of a plain subject, the AI gives a scenario with creative constraints (e.g., "draw a bird about to take off — 8 minutes, 20 strokes max"); the constraint forces intentionality and gives the AI something specific to evaluate against

### AI Guides
- **Live shape recognition narration** — as the user draws, the AI quietly narrates what it sees forming ("that's looking like a good oval for the body"); present-tense observation rather than graded advice, like a coach watching over your shoulder
- **Parallel example sketch** — a faint AI-drawn reference sketch appears alongside the user's canvas, showing a loose interpretation of the same subject; user can toggle it on/off; comparison is implicit, not judgmental
- **"How's it going?" check-in** — the AI periodically asks about the process rather than the drawing ("is this step making sense?", "do you want more time here?"); the user's answer shapes what the AI does next, turning advice into a conversation

### AI Reacts
- **Mistake interception** — the AI watches for specific common errors (overworking an area, tentative lines, drifting proportions) and speaks up when it spots one before it compounds
- **Celebration of specific improvements** — when the AI notices something measurably better than a previous session (smoother curves, better proportion), it calls it out specifically by referencing history, not generic encouragement
- **Drawing-intent questions** — when the AI is uncertain what the user is drawing in a particular area, it asks ("is that the tail or a second leg?"); makes the user the authority on their own drawing
- **Finish-line nudge** — when the AI determines the drawing is essentially complete, it says so and gives the user permission to stop; reinforces "knowing when to stop" as a real sketching skill

---

## Coaching & Progression

- **Leveled principle library** — tag each drawing principle with a skill level (Novice / Developing / Intermediate); only surface principles appropriate to the user's current level, unlocking new ones as they advance
- **Skill-aware AI feedback tone** — beginner feedback is simple and encouraging; intermediate feedback is more technical and specific in vocabulary
- **Skill assessment from drawing history** — after a few projects, infer strengths and weaknesses from past Claude feedback and use them to personalize principle focus and project recommendations
- **Guided warm-up exercises** — short 2–3 minute warm-ups (e.g., draw 10 circles, practice parallel lines) before harder projects, level-appropriate and tied to the session's focus principle
- **Before/after comparison at submission** — show the final drawing alongside the user's oldest similar work; Claude writes a short note on what's visibly improved
- **Adaptive step granularity** — novices get more steps with more detail; intermediate users get fewer, higher-level steps and are expected to make more independent decisions
- **"Challenge mode" for repeat projects** — revisit an earlier project with a harder constraint (draw from memory, draw in under 5 minutes, different composition); Claude's feedback is more demanding

## Canvas & Drawing

- **Eraser for individual strokes** — select and remove specific strokes rather than the whole canvas
- **Tracing paper layer** — semi-transparent reference image to draw over
- **Drawing replay** — play back a session stroke by stroke
- **Move strokes** — reposition individual strokes after drawing
- **Line width and color settings** — let users adjust brush size and color
- **Safari Force Touch pressure fallback** — Mac trackpad pressure (Force Touch) is exposed via Safari's non-standard `webkitForce` property on pointer events; Chrome and Firefox don't pipe it through. Detect `webkitForce > 0`, normalize from 0–3 to 0–1, and route through the real-pressure path (no velocity simulation). Safari-only; other browsers keep velocity-based behavior.
