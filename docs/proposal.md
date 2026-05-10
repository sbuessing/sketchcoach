# Sketch Coach — Project Proposal

## Overview

A tutor that helps users get better at sketching. The app presents a series of drawing tasks from simple to advanced, guided by drawing principles that Claude teaches and coaches on.

---

## Tech Stack

Simple React website using Canvas, deployed to Firebase Hosting, with a few calls to the Claude API.

**Canvas & Input**
- SVG-based drawing so Claude can read and generate strokes directly
- Fixed-width black line strokes (line art only, no shading)
- Pressure-sensitive input on Mac via the PointerEvent API or PressureJS
- Stroke history with undo/erase

**AI Integration**
- The coach occasionally checks the user's work and gives advice — triggered after 3 seconds of idle, provided no advice has been fetched in the last 15 seconds

**Data & History**
- All user data stored in local browser storage (localStorage / IndexedDB)
- History of the user's drawing projects and AI feedback

---

## UI Flow

| Screen | Description |
|--------|-------------|
| **Home** | Browse and select a drawing project |
| **Coaching** | One new drawing technique introduced before the session |
| **Canvas** | Main drawing area (see below) |
| **Submission** | Complete the project and receive a final summary from Claude |

**Canvas affordances:**
- Step-by-step instructions panel
- Coach feedback panel — updates occasionally as you draw
- Erase and Finish buttons

---

## Data

Three JSON datasets, stored locally to start.

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
Projects are grouped into tiers (Beginner / Developing / Intermediate). Completing a tier's projects unlocks the next. A visible progress bar gives users a sense of how far they've come and what's ahead.

### Focus Principle per Session
Before each drawing session, one principle is selected as the session's coaching focus — either user-chosen or system-suggested. Claude's feedback during the session prioritizes that principle rather than giving scattered advice.

### Portfolio
A portfolio view shows completed drawings with Claude's final feedback attached. At skill milestones (e.g., 10 projects completed), a short celebration screen acknowledges the leveling up.

---

## Vibes

Friendly and cozy — aimed at people who enjoy Animal Crossing and lo-fi / chillhop aesthetics.

- Soft, warm color palette
- Sound effects
- Backing chillhop soundtrack (10 free, uncopyrighted tracks to be sourced)
