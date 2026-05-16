# Sketch Coach — Assembled Scenes Spec

Each completed drawing populates a shared scene canvas. The scene starts as a beautiful, evocative background and fills in drawing by drawing until it becomes a fully realised composition. Every project is still a standalone drawing exercise with coaching — the scene layer is the reward.

**v2 direction:** Ship **three** scenes — Harbor, Windowsill, Garden Courtyard — each a full 16-project set with its own background and slot layout. The home screen gets a **scene selector**; the user picks which scene they're working on and the project grid filters to that scene. Future: AI-generated custom scenes (see `ideas.md`).

---

## Design Principles

- **Delightful from zero.** The background alone — before any drawings are added — should feel like a complete, charming illustration.
- **Progressive delight.** Each new drawing snapping into place should feel like a meaningful moment, not just a checkbox.
- **No transparency complexity.** Objects may intentionally overlap (a ring hung on a post, a boat beside a dock) but only where the front object fully covers the back. No glass, no translucency, no "see-through" situations.
- **Scene ≠ grid.** Objects occupy different depths (sky, mid-ground, foreground) with clear z-ordering. The scene should feel like a place, not a poster.
- **Each object teaches something.** Every project is a great standalone drawing exercise; the scene context adds meaning but doesn't drive the curriculum.

---

## The Three Scenes

### Scene 1 — Harbor at Golden Hour

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

**Identity:** *Adventurous, atmospheric, romantic.* For the user who wants to draw the world outside their window.

---

### Scene 2 — Morning Windowsill

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

**Identity:** *Cozy, domestic, contemplative.* Classic still-life territory — the most beginner-friendly of the three.

---

### Scene 3 — Garden Courtyard

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

**Identity:** *Whimsical, alive, full of small joys.* The scene with the most character and the widest variety of subjects.

---

## Detailed Build Specs

The three sections below give each scene the full treatment: background, 16-object catalog with positions and tiers, and intentional overlaps. This is the content brief — step files are written from this.

---

## Scene 1 — Harbor at Golden Hour

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

## Scene 2 — Morning Windowsill

### Background SVG

A wide, generous windowsill with morning light streaming in from the upper-left. The background carries strong domestic warmth before any object is drawn.

**Components:**
- **Window frame:** A double-hung window occupying the upper two-thirds of the canvas, drawn in pen weight. Vertical sash bar at center, simple sill and apron at the bottom of the window.
- **Outside garden view:** Behind the glass, loose impressionistic plant shapes — soft round bushes, a hint of a tree trunk, a few leaf marks. All in pencil weight, low opacity, suggesting "out there" without competing for attention.
- **Morning light rays:** Two or three faint diagonal pencil strokes coming down from the upper-left, suggesting sun through the window.
- **Windowsill surface:** A horizontal line at the base of the window (y ≈ 600), then a deeper sill running to the bottom edge. Wood grain hinted at with 3–4 long horizontal pencil lines.
- **Wall:** The areas left of the window and right of the window are warm cream (the paper color). A single short shadow line under the window frame suggests it sits on the wall.

Before any object is drawn, the scene reads as *a sunlit kitchen window in the morning, ready for breakfast to assemble.*

### Object Catalog

#### Z-Layer 1 — Behind/on the window

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 1 | Small framed picture | Beginner | 100, 220 | 180 × 160 | `simple-shapes-first`, `confident-lines` |
| 2 | Hanging herb bundle | Beginner | 500, 130 | 160 × 160 | `find-the-gesture`, `embrace-imperfection` |
| 3 | Bird outside window | Developing | 760, 240 | 180 × 140 | `find-the-gesture`, `suggest-dont-render` |

#### Z-Layer 2 — Back of the windowsill (taller items)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 4 | Potted herb (rosemary) | Beginner | 130, 560 | 170 × 220 | `simple-shapes-first`, `find-the-axis` |
| 5 | Glass bottle with single flower | Developing | 320, 480 | 130 × 280 | `find-the-axis`, `clean-junctions` |
| 6 | Ceramic crock | Developing | 480, 540 | 160 × 220 | `find-the-axis`, `mind-the-curves` |
| 7 | Small succulent in pot | Beginner | 640, 580 | 140 × 180 | `simple-shapes-first`, `embrace-imperfection` |
| 8 | Flower vase | Intermediate | 800, 470 | 170 × 290 | `find-the-axis`, `mind-the-curves`, `clean-junctions` |

#### Z-Layer 3 — Counter / front of sill (laid out)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 9  | Lemon | Beginner | 100, 800 | 130 × 100 | `simple-shapes-first`, `embrace-imperfection` |
| 10 | Apple | Beginner | 230, 790 | 140 × 140 | `start-light`, `find-the-axis`, `embrace-imperfection` |
| 11 | Pear | Beginner | 370, 790 | 130 × 150 | `find-the-gesture`, `mind-the-curves` |
| 12 | Bunch of grapes | Developing | 510, 800 | 160 × 150 | `show-overlap`, `mind-the-curves` |
| 13 | Teacup with saucer | Developing | 680, 830 | 160 × 110 | `find-the-axis`, `clean-junctions` |
| 14 | Open book | Developing | 850, 850 | 180 × 110 | `notice-the-angles`, `clean-junctions` |

#### Z-Layer 4 — Near edge of counter

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 15 | Honey jar (with dipper) | Intermediate | 360, 910 | 130 × 170 | `find-the-axis`, `show-overlap` |
| 16 | Folded napkin | Advanced | 580, 920 | 200 × 130 | `notice-the-angles`, `vary-line-weight`, `edit-with-restraint` |

### Scene Composition Map

```
y=0   ┌────────────────────────────────────────────────────────┐
      │  [picture]      WINDOW + GARDEN OUTSIDE                │
      │                 [herbs hanging]      [bird]            │ ← z:1
y=400 │                                                        │
      ├────────────────────────────────────────────────────────┤ ← sill begins
      │  [potted    [bottle+   [crock]  [succulent]  [vase]   │ ← z:2
      │   herb]      flower]                                   │
y=750 ├────────────────────────────────────────────────────────┤ ← counter edge
      │  [lemon] [apple] [pear] [grapes] [teacup] [book]      │ ← z:3
y=880 │             [honey jar]      [folded napkin]           │ ← z:4
y=1000└────────────────────────────────────────────────────────┘
```

#### Intentional overlaps:

- **Herb bundle hangs in front of window frame** — bundle in z:1 drawn after window frame; rope/twine cleanly covers the frame line behind it
- **Vase and grapes** — grapes slightly overlap the base of the vase if their slots touch; grapes (z:3) are drawn after vase (z:2)
- **Honey jar overlaps counter edge** — jar (z:4) is drawn last, sitting on top of the implied edge line
- **Bird outside window** — drawn behind the window glass, so it appears "through" the frame. The frame muntins stay drawn on top.

### Tier Distribution

| Tier | Count | Objects |
|------|-------|---------|
| Beginner | 6 | Framed picture, herb bundle, potted herb, succulent, lemon, apple, pear *(7 listed; drop one)* |
| Developing | 6 | Bird outside, glass bottle, ceramic crock, grapes, teacup, open book |
| Intermediate | 3 | Flower vase, honey jar, hanging herbs *(adjust to 3)* |
| Advanced | 1 | Folded napkin |

*To-resolve: rebalance to exactly 4/5/4/3 or 6/5/3/2 — the table above is over by 1 in beginner.*

---

## Scene 3 — Garden Courtyard

### Background SVG

A walled Mediterranean courtyard in late afternoon. Terracotta tiles run in perspective from foreground to back wall. A low stone wall caps the back; a tree trunk anchors one side. Warm golden light.

**Components:**
- **Sky:** Visible above the back wall, top ~15% of canvas. Pale warm cream, perhaps one or two cloud marks in pencil.
- **Back wall:** A low stone wall at y ≈ 280, drawn in pen weight with irregular brick or stone marks suggested loosely. The wall caps the courtyard's far edge.
- **Tree trunk:** A single tall trunk on the right side, rising from behind the back wall. Just trunk and one or two lower branches — no full canopy. Drawn in pen with a few texture marks for bark.
- **Climbing vines:** Soft tendrils dripping over the back wall in two or three spots, drawn in pencil weight.
- **Terracotta tiles:** Floor of the courtyard, from y ≈ 350 to y = 1000. Square tiles in two-point perspective, vanishing point hidden beyond the back wall. Tile lines in pen, slightly irregular spacing. The tile pattern *is* the depth indicator.
- **Wall shadow:** A faint diagonal pencil wash across the lower-right tiles suggests afternoon shadow from the tree.

Before any object is drawn, the scene reads as *a quiet sun-warmed courtyard waiting for someone to bring it to life.*

### Object Catalog

#### Z-Layer 1 — Back wall and tree (far)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 1 | Garden gate (in back wall) | Intermediate | 180, 220 | 200 × 240 | `notice-the-angles`, `clean-junctions`, `draw-from-the-shoulder` |
| 2 | Tree canopy (upper) | Developing | 800, 100 | 350 × 280 | `find-the-gesture`, `suggest-dont-render` |
| 3 | Climbing rose | Developing | 480, 200 | 180 × 200 | `find-the-gesture`, `embrace-imperfection` |

#### Z-Layer 2 — Mid courtyard (against or near the wall)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 4 | Large terracotta pot (planted) | Beginner | 130, 540 | 200 × 280 | `simple-shapes-first`, `find-the-axis` |
| 5 | Stone birdbath | Developing | 380, 480 | 200 × 280 | `find-the-axis`, `mind-the-curves`, `clean-junctions` |
| 6 | Olive tree in small pot | Developing | 660, 500 | 180 × 320 | `find-the-gesture`, `suggest-dont-render` |
| 7 | Watering can | Beginner | 870, 580 | 180 × 200 | `simple-shapes-first`, `clean-junctions` |

#### Z-Layer 3 — Tile floor (mid-foreground items)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 8 | Sunflower (cut, lying) | Beginner | 100, 800 | 200 × 150 | `find-the-axis`, `embrace-imperfection` |
| 9 | Garden gloves (pair) | Beginner | 290, 820 | 170 × 130 | `notice-the-angles`, `embrace-imperfection` |
| 10 | Wicker basket (with produce) | Developing | 480, 780 | 220 × 190 | `mind-the-curves`, `show-overlap` |
| 11 | Daisy cluster | Beginner | 690, 810 | 170 × 150 | `find-the-axis`, `embrace-imperfection` |
| 12 | Garden trowel | Beginner | 850, 830 | 170 × 100 | `notice-the-angles`, `confident-lines` |

#### Z-Layer 4 — Foreground edge (very near viewer)

| # | Object | Tier | Slot center (x, y) | Slot size | Key guidelines |
|---|--------|------|--------------------|-----------|----------------|
| 13 | Cat sleeping | Intermediate | 130, 920 | 220 × 130 | `find-the-gesture`, `suggest-dont-render`, `balance-detail` |
| 14 | Butterfly | Beginner | 410, 920 | 140 × 110 | `find-the-axis`, `confident-lines` |
| 15 | Snail | Beginner | 580, 950 | 130 × 90 | `simple-shapes-first`, `mind-the-curves` |
| 16 | Frog | Intermediate | 770, 930 | 180 × 130 | `find-the-gesture`, `block-big-then-small`, `balance-detail` |

### Scene Composition Map

```
y=0   ┌────────────────────────────────────────────────────────┐
      │            SKY              [tree canopy]              │
y=200 ├──────────────[gate]──────[climbing rose]───────────────┤ ← z:1 back wall
      │            STONE WALL (with vines)                     │
y=400 ├────────────────────────────────────────────────────────┤
      │  [terracotta  [birdbath]   [olive tree]   [watering   │ ← z:2
      │   pot]                                       can]      │
y=730 ├────────────────────────────────────────────────────────┤
      │  [sunflower]  [gloves]  [basket]  [daisies] [trowel]  │ ← z:3
y=880 ├────────────────────────────────────────────────────────┤
      │   [cat sleeping]   [butterfly] [snail]   [frog]        │ ← z:4
y=1000└────────────────────────────────────────────────────────┘
```

#### Intentional overlaps:

- **Tree canopy and back wall** — canopy (z:1) extends above and to the side; trunk grows from behind the wall and the wall covers its base cleanly
- **Olive tree pot, basket** — anything taller than the foreground line is layered behind it; layered drawing handles this
- **Cat sleeping in the foreground** — cat (z:4) is drawn last, fully on top of any tile lines and over the nearest pot edges if it spills past its slot
- **Climbing rose drapes over wall** — rose vines (z:1) drawn after wall, so vines visibly cap the wall edge

### Tier Distribution

| Tier | Count | Objects |
|------|-------|---------|
| Beginner | 7 | Pot, watering can, sunflower, gloves, daisy, trowel, butterfly, snail *(8 listed; trim)* |
| Developing | 5 | Tree canopy, climbing rose, birdbath, olive tree, wicker basket |
| Intermediate | 3 | Garden gate, cat sleeping, frog |
| Advanced | 1 | *(none allocated — consider promoting one from intermediate)* |

*To-resolve: rebalance to give the advanced tier at least one object — `frog` could move up.*

---

## Data Model

### New file: `scenes.json`

A new top-level data file lists the available scenes:

```json
{
  "scenes": [
    {
      "id": "harbor",
      "title": "Harbor at Golden Hour",
      "tagline": "Adventurous, atmospheric.",
      "backgroundSvg": "/data/scenes/harbor-bg.svg",
      "coverThumbnail": "/data/scenes/harbor-cover.svg"
    },
    {
      "id": "windowsill",
      "title": "Morning Windowsill",
      "tagline": "Cozy, contemplative.",
      "backgroundSvg": "/data/scenes/windowsill-bg.svg",
      "coverThumbnail": "/data/scenes/windowsill-cover.svg"
    },
    {
      "id": "garden",
      "title": "Garden Courtyard",
      "tagline": "Whimsical, alive.",
      "backgroundSvg": "/data/scenes/garden-bg.svg",
      "coverThumbnail": "/data/scenes/garden-cover.svg"
    }
  ]
}
```

### Project schema changes

Each project gains a `sceneId` and a `sceneSlot`:

```json
{
  "slug": "harbor-seagull",
  "title": "Seagull in Flight",
  "sceneId": "harbor",
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

Slugs are namespaced by scene (`harbor-seagull`, `windowsill-apple`, `garden-cat`) so each scene can have its own treatment of the same subject (e.g. an apple drawn for the windowsill is a different exercise from no apple existing in the harbor).

### Static asset layout

```
web/public/data/
  scenes.json
  guidelines.json
  projects.json
  scenes/
    harbor-bg.svg
    harbor-cover.svg
    windowsill-bg.svg
    windowsill-cover.svg
    garden-bg.svg
    garden-cover.svg
  steps/
    harbor-seagull.json
    harbor-bollard.json
    ... (16 per scene = 48 total)
```

The existing `apple.json`, `teapot.json`, etc. step files are either retired or reorganized under one of the scene directories.

### Portfolio entries

`PortfolioEntry` doesn't need a `sceneId` field — it can be derived from the linked `projectSlug → project.sceneId`. The assembled scene view filters portfolio entries by their project's scene.

---

## UX Integration

### Home screen — scene selector

The home screen leads with a **horizontal scene picker** above the project grid. Each scene appears as a card showing:

- The scene's cover thumbnail (the assembled scene-so-far, rendered as a small image)
- Title and tagline
- Progress indicator (e.g. "5/16 complete")
- Selected state visually distinct

Selecting a scene filters the project grid below to that scene's 16 projects. The user can switch scenes freely; per-scene progress is preserved.

The current "Portfolio" link continues to show all completed drawings across all scenes.

### Done screen

After finishing a project, the assembled scene fills the screen with the new piece animating into place ("Your seagull has joined the harbor"). The coach's final summary still appears.

### Draw screen

A small scene-preview ghost in the coach panel sidebar shows the user where their drawing will live. Optional v2 detail.

### Scene view (full screen)

A dedicated screen accessible from each scene card on the home screen. Shows the assembled scene full-bleed at maximum fidelity. Empty slots can show a faint pencil placeholder ("⌗ rope coil — beginner") that the user can tap to start that project.

---

## Resolved Decisions

1. **Retire existing 16 projects.** The three scenes replace the flat list. Strong existing step files (apple, beach-ball, etc.) may be cannibalized as templates but the slugs go away.

2. **Per-scene project count: flexible, 10–20.** Each scene picks the count that fits its composition. Bias toward more beginner projects since they're shorter. Two target shapes:
   - **Small scene:** 4 / 4 / 2 / 1 = 11 projects (beginner / developing / intermediate / advanced)
   - **Large scene:** 6 / 6 / 4 / 2 = 18 projects
   - Each scene independently picks a shape. Harbor likely large (18); Windowsill medium; Garden medium-to-large.

3. **No unlocking — all projects always available.** Drop `isTierUnlocked` from the home screen. An experienced sketcher can start at advanced if they want. Tiers are still labels on the project card (so users know the relative difficulty) but never gate access.

4. **Scenes are local-state navigation.** The active scene is a UI state, not progression. Stored in `localStorage` so it persists between visits but the user can switch scenes freely at any time. No "current scene lock-in." Per-scene progress derives from portfolio entries filtered by scene ID.

## Deferred to `ideas.md`

- Hand-drawn scene backgrounds — v1 ships with no background behind the assembled drawings; just the paper color. Adds simplicity now; rich backgrounds come later.
- Scene completion ceremony — the 16/16 "you finished the harbor" moment.
- Scaling-fidelity polish — slot sizes vary widely; for v1 we just scale and trust the user to draw something readable.

## Remaining Open Question

- **Step file authoring.** Each scene's step files should be written together for consistent voice. Best done with an agent batched per scene using `content-guidelines.md` as the rubric. Estimate 5–7 steps per project.

---

## Implementation Phases

Suggested order of work, dependency-first:

1. **Content foundation** ✅ (in progress)
   - `content-guidelines.md` with canonical pencil→ink pattern ✅
   - `scene.md` with all three scenes detailed ✅
   - Retrofit beginner-tier existing step files as model examples ✅ (apple, beach-ball done)

2. **Bulk content authoring** (next)
   - Write all scene step files following `content-guidelines.md`
   - One agent per scene, batched
   - Counts per scene: flexible 10–20 with bias to early tiers (e.g. 6/6/4/2 = 18 for Harbor, 4/4/2/1 = 11 for the smaller two)

3. **Data model + scene loading**
   - Add `scenes.json`, restructure `projects.json` with scene IDs
   - Update `dataService` to load scene-aware data
   - Retire old portfolio entries (clean break with v1)

4. **Scene selector UI**
   - Horizontal scene picker on home screen with active scene in `localStorage`
   - Per-scene project grid filter (no tier locking — every project always accessible)
   - Per-scene progress indicator (N/M complete)

5. **Assembled scene view**
   - New screen rendering completed drawings composited at their slots over the paper color
   - Empty-slot pencil placeholders ("⌗ rope coil")
   - Linked from each scene card

Items deferred to `ideas.md`: hand-drawn backgrounds, completion ceremony, scaling-fidelity polish.
