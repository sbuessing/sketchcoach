# Sketch Coach — Project Proposal

## Overview

A tutor that helps users get better at sketching. The app presents a series of drawing tasks from simple to advanced, guided by drawing principles that Claude teaches and coaches on.

---

## Tech Stack

Simple React website using SVG canvas, deployed to Firebase Hosting, with live calls to the Claude API.

**Canvas & Input**
- SVG-based drawing so Claude can read and generate strokes directly
- Pencil mode (light gray) and pen mode (full ink) strokes — no shading
- Pressure-sensitive input on Mac via the PointerEvent API
- Stroke history with undo; per-stroke erase in pen/pencil mode

**AI Integration**
- The coach occasionally checks the user's work and gives advice — triggered after 3 seconds of idle, provided no advice has been fetched in the last 20 seconds
- Each check sends a 1024px PNG snapshot of the canvas to Claude

**API Key**
- Beta: users provide their own Anthropic API key via a settings modal (BYOK); key stored in browser localStorage
- Future production path: Firebase Cloud Functions proxy with a managed key

**Data & History**
- All user data stored in local browser storage (localStorage / IndexedDB)
- History of the user's drawing projects and AI feedback

---

## UI Flow

| Screen | Description |
|--------|-------------|
| **Home** | Browse and select a drawing project; API key management |
| **Draw** | Main drawing area with steps, coach panel, and toolbar |
| **Done** | Complete the project and receive a final summary from Claude |
| **Portfolio** | Gallery of all completed drawings with saved feedback |

**Draw screen affordances:**
- Step-by-step instructions panel (left)
- SVG canvas (center)
- Coach feedback panel — updates occasionally as you draw (right)
- Toolbar: pencil/pen/erase mode selector, undo, erase all, finish

---

## Data

Three JSON datasets, shipped with the app in `web/public/data/`.

### 1. Sketching Projects (10 total)
Beginner to intermediate projects, each taking 5–30 minutes. All are line art suitable for black and white — no shading required.

*Examples: draw a bird, a ball, a turtle.*

### 2. Step-by-Step Instructions
Higher-level instructions for each project.

*Examples: Draw guides → Outline features → Add details*

### 3. Drawing Principles
20+ guidelines from beginner to intermediate, used to evaluate and coach the user's drawings during a session.

---

## Progression System

### Project Difficulty Progression with Unlocks
Projects are grouped into tiers (Beginner / Developing / Intermediate). Completing a tier's projects unlocks the next. Locked tiers are visible but not selectable.

### Focus Principle per Session
Before each drawing session, one principle is selected as the session's coaching focus — either user-chosen or system-suggested. Claude's feedback during the session prioritizes that principle rather than giving scattered advice.

### Portfolio
A portfolio view shows completed drawings with Claude's final feedback attached. At skill milestones (e.g., 10 projects completed), a short celebration screen acknowledges the leveling up.

---

## Vibes

Friendly and cozy — aimed at people who enjoy Animal Crossing and lo-fi / chillhop aesthetics.

- **Garden Studio palette** — forest green ink (`#2D3F2A`), moss accent (`#6B8E5A`), sage highlights, linen and cream paper tones
- **Caveat** (handwritten display font) + **DM Sans** (body)
- Sound effects and a backing chillhop soundtrack
- Coach personality: Bob Ross warmth + Mr. Rogers sincerity + Yo Gabba Gabba enthusiasm
