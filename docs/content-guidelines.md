# Sketch Coach — Content Guidelines

How to write step instructions and coach cues that work in a digital line-drawing app.
The single most important rule: **every instruction must describe a mark the user makes with their stylus or finger.** If you can't do it with a stroke, it doesn't belong in a step.

---

## The Core Problem: Sculpting Language

A common failure mode is writing instructions borrowed from physical media — clay modelling, oil painting, or woodworking — where you _manipulate_ existing material. In this app, the user can only **add strokes** or **erase strokes**. They cannot push, pull, carve, drag, smear, blend, or fill.

### Words and phrases to avoid

| Bad (physical manipulation) | Good (stroke action) |
|-----------------------------|----------------------|
| Push the top center down | Sketch a small inward curve at the top center |
| Carve the shape | Draw the contour line that defines the shape |
| Pull this edge outward | Extend the line outward to here |
| Round this corner off | Draw this corner as a gentle curve instead of a point |
| Fill in the shadow area | Add closely-spaced parallel lines to suggest shadow |
| Blend the tone | Overlay lighter pencil strokes to soften the transition |
| Mold the form | Redraw this edge to suggest the form you want |
| Shade the right side | Add short hatching strokes on the right side |

### The apple step 2 example

**Bad:** "Carve the top and bottom. Push the top center down slightly to make a small dimple where the stem will sit."

**Good:** "Sketch a small inward curve at the top of the outline — just a gentle dip in the center — to suggest where the stem sits. Mirror a shallower curve at the bottom."

The user is drawing that curve. They are not pushing anything.

---

## The Two-Mode Workflow

The app has **pencil mode** (light, sketchy, gray, fixed thin width, ~40% opacity) and **pen/ink mode** (dark, committed, expressive, pressure/velocity-driven width). The user toggles between them with a tool selector. Instructions should mirror the real-world sketching workflow: **pencil first, ink last.** That sequence — block out loose, then commit to clean lines — *is* the lesson for beginners. Don't bury it; make it the structure of every project.

### Canonical Beginner Lesson Pattern

A beginner project (4–6 steps) follows this shape:

| Phase | Steps | Mode | What the step does |
|-------|-------|------|---------------------|
| **Block** | 1–2 | pencil | Loose gestural guides, big shapes, axes, proportions |
| **Refine** | 1 | pencil | Adjust the construction; erase and redraw if needed |
| **Commit** | 1 | switch to ink | Explicit mode switch. The first ink step is always this one. |
| **Ink the silhouette** | 1 | ink | Trace the main outline as a confident stroke |
| **Ink the details** | 1–2 | ink | Smaller features, junctions, expressive accents |

The app starts every project in pencil mode, so **step 1 never tells the user "switch to pencil"** — they're already there. Just say "Lightly sketch…", "Block in…", etc., and the mode is implicit.

Pencil-construction cleanup happens via a UI toggle on the Done screen ("Hide pencil construction"), so **the step list never asks the user to erase their pencil guides at the end** — that's the toggle's job. The last step of every project should be a real drawing instruction, not housekeeping.

**Why this pattern matters:** The single biggest skill jump for a novice is learning to *commit* to lines after planning them. Many beginners draw every line tentatively because they never made a decision about which line was the "real" one. The pencil-then-ink workflow forces that decision, and the tool change makes it physical and memorable.

### Explicit Mode-Switch Language

Pencil mode is the starting state — never tell the user to switch to it in step 1. Just give the drawing instruction with pencil-language cues ("lightly", "loosely", "block in") and the mode follows naturally.

**At the commit moment (always explicit):**
> "**Switch to ink.** Trace the outline you sketched with a single confident stroke. The pencil guide stays underneath — the Hide Pencil toggle on the Done screen takes care of cleanup."

**At any later "back to pencil" moment** (e.g., to plan a new element):
> "**Switch back to pencil** and sketch a guide for where the handle will attach."

### Mode Cue Vocabulary

Different phrasing makes the workflow feel intentional rather than rote. Use these freely:

| Pencil cues | Ink cues |
|-------------|----------|
| Lightly sketch | Switch to ink and trace |
| Block in | Commit to |
| Loosely mark | Lay down a confident line |
| Rough in | Ink the contour |
| Make a guide for | Draw the final outline |
| Get the proportions with | Anchor the silhouette with |
| Plan the placement of | Finish with |

### What to Avoid

- **Don't mix modes within a single step.** A step should be all pencil or all ink, never both. If you need both, split it.
- **Don't say "draw lightly" in step 5.** By step 5 the user is in ink. Light marks belong in early steps.
- **Don't say "draw a confident line" in step 1.** Confidence comes after planning — that's the whole point. Step 1 is exploratory.
- **Don't forget to call the mode switch.** If you skip "Switch to ink," beginners stay in pencil for the whole drawing and never get the final ink commitment that makes a sketch feel finished.

### Intermediate and Advanced Variations

The pencil-first principle scales up:

- **Developing tier (6–8 steps):** Same shape, but the Block/Refine phase gets 2–3 steps as proportions and structure get more complex. Still one explicit "Switch to ink" moment.
- **Intermediate tier (7–9 steps):** May have **two** ink phases — silhouette ink first, then detail ink later, sometimes with a pencil sub-pass between them (e.g., "switch back to pencil to lightly mark where the shadow falls, then back to ink to render it").
- **Advanced tier (8–10 steps):** Multiple back-and-forth mode switches are fine here. Advanced users are expected to use pencil as a thinking tool throughout, not just at the start.

### Beginner Step Example (5-step apple, fully mode-aware)

```
1. (pencil)         Lightly sketch a slightly squashed circle — wider than tall, a
                    touch asymmetric.
2. (pencil)         Add a small inward dip at the top center and a shallow one at the
                    bottom. These are your placement guides for the stem and base.
3. (switch to ink)  Switch to ink and trace the outline as a single confident stroke,
                    following your pencil guide. Don't worry about matching it exactly
                    — your hand will pick the cleanest path.
4. (ink)            Add a short stem rising from the top dip, tilted slightly to one
                    side, and a small leaf beside it.
5. (ink)            Add a small curved line just inside the top dip to suggest the
                    well where the stem sits. One short stroke is plenty.
```

No "switch to pencil" step at the start; no eraser cleanup step at the end. The user is already in pencil, and the Done screen's Hide Pencil toggle handles the cleanup.

---

## No Off-Canvas Instructions

Digital drawing apps have one canvas. Do not tell users to do anything outside it.

**Bad:** "Before starting, make a tiny thumbnail sketch in the corner to plan your composition." *(implies sketching elsewhere, which doesn't make sense in a tab or fullscreen app)*

**Good:** "Lightly sketch a small composition guide in one corner of your canvas — rough dots or lines for where each object will sit. You can erase these later."

Or simply fold the planning into the first light-sketch step.

---

## "Adjust" Means Erase and Redraw

Users cannot nudge a stroke in place. "Adjust" is ambiguous — say what you actually mean.

**Bad:** "Adjust the finger if it looks too thick."

**Good:** "If a finger looks too thick, erase it and redraw it — use the spaces between fingers as a proportion check."

When you want the user to refine a shape, the instruction is: **erase the guide and lay down a new stroke.**

---

## Shading vs. Line Drawing

Sketch Coach is a **line drawing** app. Avoid shading instructions that imply tonal fills or gradients. When depth or shadow is called for, describe it as mark-making:

**Bad:** "Shade the right side of the bottle."

**Good:** "Add several parallel diagonal strokes on the right side of the bottle to suggest shadow." or "Leave the right side undrawn — the white space reads as the lit side."

An exception: *pencil mode* can be used for hatching and tone, and that is fine — but describe the strokes, not the tonal effect.

---

## Active Verbs That Work

These verbs all describe what a stroke does. Use them freely.

- **Sketch** — light, loose, guides/construction
- **Draw** — the general act
- **Trace** — going over an existing guide with a cleaner stroke
- **Mark** — placing a point or dot
- **Add** — placing a new element
- **Extend** — continuing an existing line
- **Connect** — joining two points or shapes
- **Branch** — splitting off from a parent line
- **Curve** — making a line follow an arc
- **Taper** — narrowing a stroke toward one end
- **Suggest** — using a few marks to imply something rather than fully drawing it
- **Stop** — deliberately ending a line (especially for overlap: "stop the back line where the front shape crosses it")
- **Erase** — removing strokes (valid in our app!)

---

## Step Scope

Each step should ask for **one clear thing**. If a step's description contains more than one sentence of actual drawing instruction, it may need splitting.

**Too much in one step:**
> "Add the stem, a leaf next to it, and a small curved line near the top dimple to suggest depth. Also clean up any stray lines."

**Better split:**
> Step 4: "Add a short stem rising from the top dimple, tilted slightly to one side."
> Step 5: "Sketch a small leaf next to the stem. Two short strokes meeting at a point gives the leaf shape."
> Step 6: "Add a small curved line near the top dimple to suggest the depth where the stem sits."

---

## Observation Cues

Good steps pair a **look** instruction with a **draw** instruction. Noticing the right thing is half the skill.

**Template:** *"Notice [what to observe] — [then draw this]."*

Examples:
- "Notice how the spaces between the spread fingers each have a distinct shape — if those gaps look wrong, the fingers are wrong. Adjust any finger that seems too thick."
- "The spout should grow out of the silhouette rather than sitting on top of it — if you see a gap or seam, redraw where they meet."
- "Most perched birds lean slightly — your gesture line will capture that lean."

---

## Describing 3D With 2D Marks

Explaining a 3D concept without resorting to manipulation language:

| 3D intent | How to describe it as marks |
|-----------|----------------------------|
| "This side is in shadow" | "Add hatching strokes on this side" |
| "This edge is closer to the viewer" | "Use a heavier line on this edge" |
| "This form is round, not flat" | "Curve the strokes so they follow the form rather than lying flat across it" |
| "This object is in front of that one" | "Stop the back object's outline where the front object crosses it — don't draw through" |
| "The surface is curved" | "Draw a gentle highlight ellipse on the upper-left to suggest the curve" |
| "The object is sitting on the ground" | "Add a cast shadow shape beneath it — a flattened ellipse or wedge" |

---

## Current Status of Existing Step Files

The four originally-flagged sculpting/off-canvas/adjust-language issues have all been resolved. The **outstanding issue across every existing step file** is missing explicit pencil → ink mode-switch language: instructions imply the workflow ("lightly sketch…", "draw a confident outline…") but never tell the user to physically switch tools. This needs retrofitting in all 16 existing projects, with the beginner tier as the highest priority since the mode-switch *is* the lesson at that level.

### Retrofit priority

| Tier | Files | What to add |
|------|-------|-------------|
| Beginner | `apple`, `beach-ball`, `mug`, `leaf` | Full canonical pattern: explicit "Switch to ink" step before the final outline; pencil cues in every early step |
| Developing | `bird`, `turtle`, `cat`, `teapot` | One explicit "Switch to ink" step; two ink steps may follow (silhouette, then detail) |
| Intermediate | `mushrooms`, `house`, `tree`, `bicycle` | Mode switches at construction → silhouette → detail transitions |
| Advanced | `fox`, `still-life`, `hands`, `doorway` | Multiple back-and-forth switches acceptable; pencil sub-passes between ink phases |

When writing new step files (e.g., the 48 scene-mode projects), apply the canonical pattern from the start — don't repeat the retrofit work.
