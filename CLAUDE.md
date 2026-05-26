# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RVU SGPA Calculator — a client-side React web app for RV University B.Tech students. Calculates SGPA from CIE + final exam marks, supports a reverse calculator (target GPA → minimum marks needed), and persists data in `localStorage`. No backend; no API calls.

Full requirements are in `RVU_SGPA_Calculator_Spec.md`.

## Commands

```bash
npm install       # Install dependencies
npm run dev       # Vite dev server
npm run build     # Production build
npm run preview   # Preview built output
```

## Stack

- React (functional components + hooks only — no class components)
- Tailwind CSS
- Framer Motion (animations)
- Lucide React (icons)
- Vite (bundler)

## Architecture

Single-page app with no routing. State lives in `useState`/`useCallback`; no Redux or Context needed. Every state change auto-saves to `localStorage` and auto-loads on init.

**Planned component tree:**
```
App
├── Header
├── CourseManager   ← add/edit/delete courses, mark entry
├── Dashboard       ← SGPA display, per-course breakdown
├── ReverseCalculator ← target GPA → minimum marks per course
└── Settings        ← export CSV, shareable URL, reset
```

## Domain Logic (must be exact)

**Grading scale (RVU official):**

| Total | Grade | Points |
|-------|-------|--------|
| 90–100 | O  | 10 |
| 80–89  | A+ | 9  |
| 70–79  | A  | 8  |
| 60–69  | B+ | 7  |
| 50–59  | B  | 6  |
| 45–49  | C  | 5  |
| 40–44  | P  | 4  |
| <40    | F  | 0  |

**SGPA formula:** `Σ(credits × gradePoints) / Σ(credits)`

**Marks ranges:** CIE = 0–100; Final exam = 0–30; Total = CIE + Final.

**Course data shape:**
```js
{
  id, courseCode, courseName, credits,
  cieMarks,        // 0-100 | null
  finalExamMarks,  // 0-30  | null
  totalMarks,      // computed: cieMarks + finalExamMarks
  grade,           // computed from totalMarks
  gradePoint,      // computed from grade
  creditGradeProduct // computed: credits × gradePoint
}
```

**Pre-loaded courses (RVU CSE Sem 2):**

| Code   | Course                              | Credits |
|--------|-------------------------------------|---------|
| CS1807 | Linear Algebra                      | 3 |
| CS1006 | Data Structures                     | 4 |
| CS1211 | Database Management Systems         | 4 |
| CS1103 | Operating Systems                   | 3 |
| CS1102 | Embedded Systems & ARM Microcontrollers | 4 |
| CS1841 | Engineering Explorations            | 3 |
| CS1904 | Entrepreneurial Mindset             | 2 |
| CS1925 | Yoga & Wellbeing                    | 2 |

## Design Constraints

- Dark theme only; background `#0A0E27` (deep navy). No light mode.
- Glassmorphism throughout (backdrop blur + transparency).
- Animated SVG morphing blobs in background (use Framer Motion, 8–12s cycles).
- Only animate `transform` and `opacity` — never layout properties — to stay at 60fps.
- Color system: indigo→violet→pink (primary), teal→emerald (success/O grade), amber→gold (warning/A-B+), red (fail).
