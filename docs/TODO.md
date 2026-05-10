# Sketch Coach — TODO / Pre-Production Checklist

Items deferred from the technical spec. Most are "test in real conditions, then decide." Revisit before any public deploy.

---

## Pre-deploy (must do before sharing the URL broadly)

- [ ] **Rotate the dev API key.** The current key was pasted into a chat transcript on 2026-05-10 and should not be used long-term. Generate a new one in the Anthropic console.
- [ ] **Set Anthropic budget alerts** in the Anthropic console (e.g., $5/$10/$25 thresholds) — each BYOK user spends from their own account, but good hygiene regardless.
- [ ] **`.env` is gitignored.** Verify before any commit. The dev API key must never reach git history.
- [ ] **Confirm chillhop track licensing.** Each track in `web/public/audio/tracks/` has a documented source and license in `ATTRIBUTION.md`.

## Future: managed production (when moving beyond BYOK beta)

- [ ] **Move Claude calls behind Firebase Cloud Functions proxy.** Replace direct browser calls with a callable function that holds `ANTHROPIC_API_KEY` as a Firebase secret. Only `claudeClient.ts` needs to change.
- [ ] **Set up Firebase App Check** with reCAPTCHA v3 so random callers can't burn the budget through the Functions endpoint.
- [ ] **In-Functions rate limit** — confirm the simple in-memory limiter is in place and tested (1 request / 10s per caller minimum).

## Tuning (decide after real use, not now)

- [ ] **Snapshot resolution.** Default is 1024px. Try 768 and 512 once the coach loop is working — does Claude give equally useful feedback at lower res? Lower = cheaper and faster.
- [ ] **Coach trigger timing.** Defaults are 3s idle / 20s rate-limit floor. Likely needs adjustment based on how chatty vs sleepy it feels. Consider:
  - Bumping idle to 5s if the coach interrupts mid-thought too often.
  - Lowering 20s floor to 12s for novices who benefit from more frequent feedback.
- [ ] **Model choice: Sonnet vs Haiku.** Spec defaults to Sonnet 4.x. Test Haiku 4.x for the in-session coach calls (final summary likely stays Sonnet for quality):
  - Does Haiku give visually accurate feedback at 1024px?
  - Cost difference is meaningful at scale.
  - Latency difference is noticeable in-session.
- [ ] **Stroke brush width.** Spec uses size 6 (pencil) and 9 (pen) logical units. May need to scale with `viewBox` size or feel of the canvas.
- [ ] **Backing track auto-pause** when the tab loses focus, to be polite about background CPU + audio.

## Browser quirks

- [ ] **Pressure on Mac trackpad.** Test PointerEvent.pressure on Safari, Chrome, Firefox. Add `webkitForce` fallback for Safari. Document what works where. (See ideas.md for the Safari Force Touch note.)
- [ ] **iOS Safari pen events.** If we want iPad/Apple Pencil support, verify `pointerType === 'pen'` and `pressure` come through correctly.
- [ ] **Autoplay policy.** Backing track must start on a user gesture, not on page load. Confirm in Safari.

## Nice-to-have before v1 ships

- [ ] **Offline state.** App should still load from cache and let you sketch; coach calls fail gracefully with a "no internet" message rather than spinning forever.
- [ ] **Save indicator.** Small "saved" tick in the corner when IndexedDB autosave fires, so users know progress is preserved.
- [ ] **Confirm-before-leaving** if you have unsaved strokes and try to navigate away.

## Out of scope for v1 (linked in `ideas.md`)

Tracking here just so they don't leak into v1: stroke-level eraser, tracing layer, replay, stroke move, velocity-based pressure, line width / color settings, leveled principle library, skill assessment, before/after comparison, challenge mode, warm-ups, adaptive step granularity, remove "Start Drawing" screen, directed prompts with constraints, live shape recognition narration, parallel example sketch, "How's it going?" check-ins, mistake interception, celebration of improvements, drawing-intent questions, finish-line nudge.
