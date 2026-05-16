# Sketch Coach — Future Ideas

Things we could add but aren't in the current build.

---

## UI & Flow

- **Confirm before leaving** — if the user has unsaved strokes and tries to navigate away (back button, closing the tab), prompt "Leave this sketch?" so nothing is accidentally lost. Use the `beforeunload` event for tab closes and a React Router blocker for in-app navigation.

- **Offline graceful degradation** — the app should still load and let you sketch when offline (canvas, steps, and portfolio all live locally). Coach calls should fail quietly with a small "coach unavailable — no internet" note rather than spinning forever.

- **AI-generated custom scenes** — a "Propose your own scene" button lets the user type any theme. Claude generates a full scene in one structured call: name, tagline, 12–16 projects with slugs, tiers, descriptions, focusGuidelines, sceneSlots, and step arrays. Generated scenes are stored in `localStorage` and merged with built-in scenes at app load. Show a "Claude is imagining your scene…" progress message during the ~10–15 s wait.

---

## Scenes

- **Hand-drawn scene backgrounds** — v1 scenes have no background behind the assembled drawings. Add a light pencil-sketch SVG layer per scene that drawings sit on top of. Harbor: dock planks in perspective and a horizon line. Windowsill: window frame and garden suggestion outside the glass. Garden Courtyard: tile lines and a back wall silhouette. All at pencil weight and ~30% opacity — scaffolding, not illustration.

- **Scene completion ceremony** — when all of a scene's projects are done, trigger something memorable: a full-screen reveal of the assembled scene, a downloadable poster export, a coach message naming the scene ("you finished the harbor"). The N/N moment should feel like an arrival.

- **AI-fleshed-out final scene** — at completion, pass Claude every SVG the user drew for the scene and ask it to compose connective tissue: dock planks behind the bollard, rigging connecting the sailboat, tile lines around the terracotta pot. The user's drawings stay hero; the AI handles the atmosphere. Returns a richer assembled SVG.

---

## Canvas & Drawing

- **"Remove pencil construction on finish" toggle** — on the Done screen, offer a checkbox ("✓ Hide pencil guides") that strips all `drawMode='pencil'` strokes before saving to portfolio. The canonical pencil→ink workflow produces guides that most users want cleaned up for the final piece. Could be opt-out (on by default) since the raw strokes are still in `drawingsInProgress`.

- **Smarter eraser modes** — the current eraser removes whole strokes on tap. Add drag erase: dragging across a stroke removes only the crossed segments, splitting the stroke at the intersection. Mirrors how a physical eraser works; useful for cleaning up a single crossing line without losing the whole stroke.

- **Drawing replay** — play back a session stroke by stroke, compressed to 20–30 seconds. Educational (you can watch your own process), delightful, and shareable. Stroke timestamps are already recorded; this is mostly a rendering loop.

- **iOS / Apple Pencil support** — verify `pointerType === 'pen'` and `PointerEvent.pressure` come through correctly on iPad Safari. The drawing code is already structured for this; it needs real-device testing.

- **Backing track auto-pause** — pause the ambient music when the browser tab loses focus (`visibilitychange` event), resume when it returns.

- **Export drawing** — a "Download" button on the Done screen and portfolio modal that saves the final SVG (or a PNG render) to the user's device.

---

## Immersion & Atmosphere

- **Ambient scene sounds** — optional audio layer underneath the music that matches the active scene. Harbor: gentle waves + distant gulls. Windowsill: morning birds + a light breeze. Garden: insects + rustling leaves. One short looping audio file per scene, faded under the chillhop at ~20% volume. Toggled alongside the music controls.

- **Ink color choices** — 4 curated ink colors for pen mode: Forest (current `#2d3f2a`), Sepia (`#5c3a1e`), Navy (`#1a2e4a`), Charcoal (`#3a3a3a`). Small pill selector in the toolbar. Pencil always stays gray.

---

## Engagement

- **Directed prompts with constraints** — instead of a plain subject, the AI gives a creative constraint scenario ("draw this bird mid-takeoff — 8 minutes, 20 strokes max"). The constraint forces intentionality and gives the AI something specific to evaluate against.

- **Parallel example sketch** — a faint AI-drawn reference sketch appears alongside the canvas, showing a loose interpretation of the same subject. User can toggle it. Comparison is implicit, not judgmental.

- **"How's it going?" check-in** — the AI periodically asks about the process rather than the drawing ("is this step making sense?", "do you want more time here?"). The user's reply shapes what the coach does next, turning advice into a conversation.

- **Finish-line nudge** — when the AI determines the drawing is essentially complete, it says so and gives the user permission to stop. Reinforces "knowing when to stop" as a real sketching skill.

---

## Coaching & Progression

- **Skill-aware AI feedback tone** — beginner feedback is simple and encouraging; intermediate feedback uses more technical vocabulary. The coach already knows the project tier — use it to modulate language.

- **Skill assessment from drawing history** — after a few projects, infer strengths and weaknesses from past coach feedback and use them to personalize project recommendations and principle focus.

- **Before/after comparison at submission** — show the final drawing alongside the user's earliest completed drawing from the same scene. Claude writes a short note on what's visibly different. Motivating without being evaluative.

- **Guided warm-up exercises** — short 2–3 minute warm-ups (draw 10 circles, practice parallel hatching) before harder projects. Level-appropriate and tied to the session's focus principle.

- **"Challenge mode" for repeat projects** — revisit an earlier project with a harder constraint (from memory, in 5 minutes, in a different composition). Claude's feedback is more demanding.
