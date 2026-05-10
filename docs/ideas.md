# Sketch Coach — Future Ideas

Things we could add but aren't in the initial build. Kept here for reference as the project grows.

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
