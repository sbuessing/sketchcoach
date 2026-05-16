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

The app has **pencil mode** (light, sketchy, gray) and **pen/ink mode** (dark, committed, black). Instructions should reflect this in sequence:

- **Early steps** = pencil. Use language like: *"Lightly sketch…", "Make a loose guide mark for…", "Block in with light strokes…"*
- **Later steps** = pen/ink. Use language like: *"Trace the outline with a confident ink stroke…", "Commit to this edge with a single dark line…", "Draw the final contour…"*
- Avoid saying "draw lightly" in a late step or "draw confidently" in a step 1. The mode language should match where the user is in the process.

When a step explicitly asks the user to switch modes, say so: *"Switch to ink and draw the final outline…"*

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

## Known Issues in Existing Step Files

These steps need rewrites before the next content update:

| File | Step | Problem |
|------|------|---------|
| `apple.json` | Step 2 ("Carve the top and bottom") | "Push the top center down" and "Carve" are sculpting language |
| `still-life.json` | Step 1 ("Thumbnail the composition") | Implies drawing a separate off-canvas thumbnail |
| `still-life.json` | Step 5 ("Establish a consistent light direction") | "lightly shade" is tonal language — should specify mark type |
| `hands.json` | Step 5 ("Check the negative space") | "gently adjust any finger" — ambiguous, should say erase and redraw |
