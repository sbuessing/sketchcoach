# Sketch Coach — Assembled Scene Spec

Each completed drawing populates a shared scene canvas. The scene starts as a beautiful, evocative background and fills in drawing by drawing until it becomes a fully realised composition. Every project is still a standalone drawing exercise with coaching — the scene layer is the reward.

---

## Design Principles

- **Delightful from zero.** The background alone — before any drawings are added — should feel like a complete, charming illustration.
- **Progressive delight.** Each new drawing snapping into place should feel like a meaningful moment, not just a checkbox.
- **No transparency complexity.** Objects may intentionally overlap (a ring hung on a post, a boat beside a dock) but only where the front object fully covers the back. No glass, no translucency, no "see-through" situations.
- **Scene ≠ grid.** Objects occupy different depths (sky, mid-ground, foreground) with clear z-ordering. The scene should feel like a place, not a poster.
- **Each object teaches something.** Every project is a great standalone drawing exercise; the scene context adds meaning but doesn't drive the curriculum.

---

## Three Scene Options

### Option A — Harbor at Golden Hour ⭐ Recommended

A fishing dock at late afternoon, looking out over calm water toward a distant headland and lighthouse. The dock planks recede in perspective. You can smell the sea.

```
┌──────────────────────────────────────────────────────┐
│  ☁️  SKY (golden, ambient)         🔦 lighthouse    │
│     🐦 seagull                                       │
├──────────────────────────────────────────────────────┤
│  WATER (calm, horizontal ripple lines)               │
│                    ⛵ sailboat                        │
├──────────────────────────────────────────────────────┤
│  DOCK (perspective planks, vanishing to center-right)│
│  🪝 bollard  🏮 lantern  🧺 creel  🦤 pelican       │
│  🪢 rope   ⚓ anchor   🕸 net  🎣 rod  🛶 rowboat   │
├──────────────────────────────────────────────────────┤
│  FOREGROUND EDGE                                     │
│  🦀 crab    ⭐ starfish      🪣 bucket w/ fish       │
└──────────────────────────────────────────────────────┘
```

**Why it works:**
- The dock in perspective gives instant spatial depth before a single object is added
- Objects naturally live at three distances (sky, mid-dock, foreground) with no ambiguous overlapping
- Huge range of drawing challenges — from the simple seagull M-shape to the rigging of a sailboat
- The assembled scene is the most visually impressive and most "shareable" of the three options

**Background treatment:** Warm cream-to-amber sky with a few loose cloud marks. Water as horizontal pencil lines, slightly denser near the horizon. Dock planks as a one-point perspective grid converging center-right, drawn in pen with warm brown ink weight. Distant headland: a single soft curve line at the horizon.

---

### Option B — Morning Windowsill

A wide kitchen or studio windowsill in morning light. A double-hung window looks out onto a soft garden. Objects sit on the sill and counter below.

```
┌──────────────────────────────────────────────────────┐
│  WINDOW FRAME                                        │
│  [ garden shapes, impressionistic, outside ]         │
├──────────────────────────────────────────────────────┤
│  WINDOWSILL                                          │
│  🌿 herb pot   🪴 succulent   🍶 jar   💐 bottle    │
├──────────────────────────────────────────────────────┤
│  COUNTER                                             │
│  🍋 lemon  🍎 apple  🍐 pear  🍞 bread  🫙 honey   │
│  ☕ mug   🫖 teapot  🪵 board   🍯 butter dish      │
└──────────────────────────────────────────────────────┘
```

**Why it works:**
- Perfect alignment with existing projects (apple, mug, teapot, leaf already exist)
- Classic still-life format — a recognized art tradition
- Warm, domestic, aspirational

**Why it's the second choice:**
- The horizontal arrangement is less spatially interesting — everything is on one or two shelves
- Objects feel like a catalogue rather than a place
- Less depth layering opportunity

---

### Option C — Garden Courtyard

A walled Mediterranean courtyard in afternoon light, viewed from a slightly elevated angle. Terracotta tiles in perspective, a tree trunk, a low stone wall, and a scatter of garden objects.

```
┌──────────────────────────────────────────────────────┐
│  BACK WALL (stone, climbing vines)                   │
│  🚪 gate                     🌸 rose trellis         │
├──────────────────────────────────────────────────────┤
│  MID GROUND                                          │
│  🌳 tree trunk   🏺 large pot   🐦 bird bath         │
├──────────────────────────────────────────────────────┤
│  TILES (terracotta, perspective)                     │
│  🌻 sunflower  💧 watering can  🧤 gloves  🌼 daisy  │
│  🐌 snail   🦋 butterfly   🐸 frog   🐞 ladybug      │
└──────────────────────────────────────────────────────┘
```

**Why it works:**
- Most charming and whimsical character
- Great mix of architectural, botanical, and animal subjects
- The perspective tile floor gives immediate spatial depth

**Why it's third:**
- Small animals (snail, ladybug, bee, butterfly) are fun but don't teach as much
- The gate and trellis are complex to draw well at any tier
- Harder to see individual contributions clearly in the assembled scene

---

## Recommended Scene: Harbor at Golden Hour

### Background SVG

The background is a static SVG layer, always present, drawn in the same pen-line style as the user drawings. It should feel like it was made by the same hand.

**Components:**
- **Sky:** Warm cream (the paper color). Three or four wispy horizontal cloud marks in pencil weight (gray, 40% opacity). Light amber wash suggested with a broad soft path at low opacity.
- **Headland:** A single gentle curve near the horizon, left side, in pencil weight — just a suggestion of land across the water.
- **Water:** 8–12 horizontal pencil-weight lines, spaced more closely near the horizon (atmospheric perspective), loosening toward the dock edge. Very slight waviness.
- **Dock planks:** 6–8 planks in one-point perspective, all converging to a vanishing point at approximately (620, 480) in the 1000×1000 SVG space. Plank lines drawn in pen weight, warm dark ink. Cross-members every few planks. The dock occupies roughly y: 500–1000, narrowing toward the horizon.
- **Dock edge:** A heavier horizontal line at the near edge of the dock (y ≈ 950) where dock meets water.

The background alone, before any drawings are placed, should read as: *a sun-warmed dock on a still afternoon, looking out to sea.* A place worth visiting.

---

### Object Catalog

16 objects, listed in z-order (1 = farthest back, 4 = nearest viewer). Within each tier, objects are listed roughly left-to-right in the scene.

All positions are approximate centers in the 1000×1000 scene canvas. Each slot has a bounding box; the user's 1000×1000 drawing is scaled into this box when placed.

#### Z-Layer 1 — Sky and distant water

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 1 | Seagull in flight | Beginner | 140, 110 | 160 × 80 | `confident-lines`, `find-the-gesture` |
| 2 | Distant lighthouse | Developing | 830, 100 | 100 × 260 | `simple-shapes-first`, `find-the-axis` |
| 3 | Moored sailboat | Developing | 480, 340 | 240 × 200 | `find-the-gesture`, `compare-as-you-go`, `block-big-then-small` |

#### Z-Layer 2 — Mid-dock (standing distance)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 4 | Mooring bollard | Beginner | 120, 550 | 100 × 200 | `simple-shapes-first`, `mind-the-curves` |
| 5 | Life preserver ring | Beginner | 240, 490 | 160 × 160 | `find-the-axis`, `confident-lines` |
| 6 | Fisherman's lantern | Developing | 420, 520 | 120 × 200 | `clean-junctions`, `block-big-then-small` |
| 7 | Pelican perched | Intermediate | 640, 490 | 180 × 220 | `find-the-gesture`, `block-big-then-small`, `suggest-dont-render` |
| 8 | Wicker creel | Developing | 790, 530 | 180 × 160 | `suggest-dont-render`, `mind-the-curves` |

#### Z-Layer 3 — Foreground dock surface

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 9  | Rope coil | Beginner | 100, 720 | 180 × 130 | `embrace-imperfection`, `line-follows-form` |
| 10 | Anchor | Developing | 300, 700 | 160 × 240 | `find-the-axis`, `clean-junctions`, `draw-through` |
| 11 | Fishing net (draped) | Intermediate | 490, 730 | 240 × 180 | `suggest-dont-render`, `balance-detail`, `edit-with-restraint` |
| 12 | Fishing rod (leaning) | Developing | 680, 650 | 60 × 320 | `confident-lines`, `draw-from-the-shoulder` |
| 13 | Rowboat (alongside dock) | Intermediate | 850, 700 | 220 × 200 | `show-overlap`, `compare-as-you-go`, `notice-the-angles` |

#### Z-Layer 4 — Foreground edge (closest to viewer)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 14 | Crab | Beginner | 80, 890 | 160 × 110 | `simple-shapes-first`, `block-big-then-small` |
| 15 | Starfish | Beginner | 300, 880 | 140 × 140 | `find-the-axis`, `embrace-imperfection` |
| 16 | Bucket with catch | Advanced | 570, 860 | 160 × 200 | `cast-shadow`, `show-overlap`, `balance-detail`, `vary-line-weight` |

---

### Scene Composition Map

Rough spatial layout at 1000×1000. Each slot shown as `[  label  ]`.

```
y=0   ┌────────────────────────────────────────────────────────┐
      │  [seagull]                              [lighthouse]   │ ← z:1
y=200 │          WATER                                         │
      │                    [sailboat]                          │ ← z:1
y=450 ├────────────────────────────────────────────────────────┤ ← horizon/dock start
      │  [bollard] [ring]   [lantern]    [pelican]  [creel]   │ ← z:2
y=650 │  [rope]   [anchor]   [net]      [rod]   [rowboat]     │ ← z:3
y=820 │  [crab]   [starfish]              [bucket]            │ ← z:4
y=1000└────────────────────────────────────────────────────────┘
```

#### Intentional overlaps (handled by z-order, no transparency needed):

- **Life preserver on bollard** — ring rendered in z:2 in front of bollard in z:2; bollard is drawn first, ring drawn after partially covering its upper portion
- **Rowboat alongside dock** — hull slightly overlaps dock edge; boat's near side covers dock planks cleanly
- **Bucket bottom** — sits on dock surface; shadow anchor suggested with a cast shadow ellipse underneath (teaches `cast-shadow`)
- **Fishing rod** — long thin element leans against dock; top extends into mid-ground area, handled by z:3 render order

---

### Tier Distribution and Unlock Flow

| Tier | Count | Objects |
|------|-------|---------|
| Beginner | 6 | Seagull, bollard, life preserver, rope coil, crab, starfish |
| Developing | 5 | Lighthouse, sailboat, lantern, creel, anchor, fishing rod |
| Intermediate | 3 | Pelican, fishing net, rowboat |
| Advanced | 1 | Bucket with catch |

*Note: developing count is 5 if fishing rod stays there; adjust based on implementation difficulty.*

The six beginner objects are distributed across the scene so early completions populate all three depth layers — a seagull in the sky, a bollard on the dock, a crab at the waterline. The scene feels alive at every stage, not just "filling in from one corner."

---

## Data Model Changes

### Project additions

Each project entry in `projects.json` gets a `sceneSlot` field:

```json
{
  "slug": "seagull",
  "title": "Seagull in Flight",
  "tier": "beginner",
  "estimatedMinutes": 8,
  "description": "...",
  "focusGuidelines": ["confident-lines", "find-the-gesture"],
  "sceneSlot": {
    "x": 60,
    "y": 50,
    "width": 160,
    "height": 80,
    "z": 1
  }
}
```

Projects without `sceneSlot` continue to work as standalone exercises (backwards compatible).

### Scene background

A new static asset: `web/public/data/scene-harbor-bg.svg` — the baked background described above. Loaded once and rendered beneath all slot drawings.

### Portfolio entries

No change needed — `PortfolioEntry` already stores the completed SVG and project slug. The assembled scene renders by looking up all completed slugs, finding their slots, and compositing.

---

## UX Integration Points

**Home screen:**
- A thumbnail of the assembling scene replaces or supplements the plain portfolio count
- Shows the background + all completed drawings composited, scaled to fit a card
- Visually communicates "you're building something" rather than "you completed N items"

**Done screen:**
- After finishing a project, animate the drawing "flying" into its scene position
- Show the assembled scene with the new piece highlighted/glowing briefly
- "Your [object] has joined the harbor" moment

**Draw screen:**
- Consider showing a small scene preview in the coach panel — "here's where this will live" — so the user knows the context they're drawing for

**Scene view (new screen?):**
- A full-screen view of the assembled scene, pannable/zoomable
- Accessible from home screen
- Doubles as a portfolio showcase

---

## Open Questions

1. **Replace or alongside?** Do the 16 scene projects *replace* the current 16 projects, or exist as a parallel "Scene" track? Replacing is cleaner but loses the existing work. Alongside adds content but complicates the home screen.

2. **Scaling fidelity.** When a 1000×1000 drawing is scaled into a 160×80 slot, fine detail is lost. Does that matter? The seagull in its slot will be quite small. Should some objects (seagull, crab) be drawn at a lower viewbox resolution — or should users be told "draw big and simple, it'll be small in the scene"?

3. **Step files.** All 16 objects need step-by-step instruction files written. That's roughly 80–100 steps total. Worth doing properly before implementing.

4. **Background as SVG vs. drawn.** Should the background be a hand-crafted SVG file (precise control, ships static) or generated via the same drawing primitives the user uses (consistent art style, more work)? Recommendation: hand-crafted SVG using the same stroke style, shipped as a static asset.

5. **Scene reveal order.** Should the user be able to do projects in any order (within tier), or should there be a recommended sequence that builds the scene in a visually satisfying way? (E.g., draw the dock before the objects that sit on it.) Recommendation: free order within tier, but the scene always renders correctly regardless.

6. **What happens to the bucket?** The bucket with catch is the only advanced object. If a user never unlocks advanced tier, is the scene "complete" without it? The composition should read as complete at intermediate too — the bucket is a bonus detail, not a structural element.
