# RVU SGPA Calculator - Technical Specification

**Version:** 1.0  
**Platform:** React + Tailwind CSS + Framer Motion  
**Target Audience:** RV University B.Tech students (all branches)  
**Core Functionality:** SGPA calculation, reverse GPA calculator, course management

---

## 1. Executive Overview

A comprehensive, interactive SGPA calculator for RV University students that enables:
- Real-time SGPA calculation based on CIE + Final exam marks
- Reverse GPA optimization (input target GPA → get minimum marks needed)
- Multi-course management with RVU's credit-weighted grading system
- Data persistence via browser localStorage
- Export and shareable results

---

## 2. Grading System Reference (RVU Official)

All calculations follow RV University's undergraduate degree grading scale:

| Total Marks | Letter Grade | Grade Point | Classification |
|-----------|--------------|------------|-----------------|
| 90–100    | O            | 10         | Outstanding     |
| 80–89     | A+           | 9          | Excellent       |
| 70–79     | A            | 8          | Very Good       |
| 60–69     | B+           | 7          | Good            |
| 50–59     | B            | 6          | Above Average   |
| 45–49     | C            | 5          | Average         |
| 40–44     | P            | 4          | Pass            |
| <40       | F            | 0          | Fail            |

**SGPA Formula:**
```
SGPA = (Σ Credits_i × Grade_Points_i) / Σ Credits_i
```

---

## 3. Architecture & Technical Stack

### 3.1 Frontend Framework
- **React** (functional components with hooks)
- **Tailwind CSS** (styling, responsive design)
- **Framer Motion** (smooth animations)
- **Lucide React** (icons)

### 3.2 State Management
- React `useState` and `useCallback` for local state
- Browser `localStorage` for persistence

### 3.3 No External Dependencies for Logic
- All grading rules, SGPA calculations, and reverse-calculation algorithms are hardcoded
- No API calls required

---

## 4. Data Structures

### 4.1 Course Object
```javascript
{
  id: string,                    // unique identifier (UUID)
  courseCode: string,            // e.g., "CS1807"
  courseName: string,            // e.g., "Linear Algebra"
  credits: number,               // 2, 3, 4
  cieMarks: number | null,       // 0-100, nullable
  finalExamMarks: number | null, // 0-30, nullable
  totalMarks: number | null,     // auto-calculated: cieMarks + finalExamMarks
  grade: string | null,          // auto-calculated: "O", "A+", etc.
  gradePoint: number | null,     // auto-calculated: 10, 9, 8, etc.
  creditGradeProduct: number | null // auto-calculated: credits × gradePoint
}
```

### 4.2 App State
```javascript
{
  courses: Course[],
  targetGPA: number | null,      // for reverse calculator
  sgpa: number | null,           // current SGPA
  totalCredits: number,          // sum of all course credits
  totalCreditGradePoints: number // sum of all creditGradeProducts
}
```

---

## 5. Core Features & Requirements

### 5.1 Feature 1: Course Management

#### 5.1.1 Pre-populated RVU CSE Semester 2 Courses
Application loads with the following 8 courses automatically:

| S.No | Course Code | Course Name | Credits | LTP |
|------|------------|-------------|---------|-----|
| 1 | CS1807 | Linear Algebra | 3 | 2-1-0 |
| 2 | CS1006 | Data Structures | 4 | 2-1-2 |
| 3 | CS1211 | Database Management Systems | 4 | 2-1-2 |
| 4 | CS1103 | Operating Systems | 3 | 2-0-2 |
| 5 | CS1102 | Embedded Systems & ARM Microcontrollers | 3 | 2-0-2 |
| 6 | CS1841 | Engineering Explorations | 2 | 1-1-2 |
| 7 | CS1904 | Entrepreneurial Mindset | 2 | 1-0-2 |
| 8 | CS1925 | Yoga & Wellbeing | 2 | 0-1-0 |

#### 5.1.2 Add Custom Course
- Button to add additional course (for students from other branches/semesters)
- Modal/form with fields:
  - Course Code (text input)
  - Course Name (text input)
  - Credits (dropdown: 2, 3, 4)
  - CIE Marks (optional, 0-100)
  - Final Exam Marks (optional, 0-30)
- Validation: Prevent duplicate course codes

#### 5.1.3 Edit Course
- Click on any course row to edit
- Inline editing or modal form
- Real-time SGPA recalculation on save

#### 5.1.4 Remove Course
- Delete button per course
- Confirmation dialog
- Real-time SGPA update

---

### 5.2 Feature 2: Marks Input & Real-time Calculation

#### 5.2.1 Input Fields
- **CIE Marks**: Numeric input, range 0–100
- **Final Exam Marks**: Numeric input, range 0–30
- Both fields optional initially (allow partial data entry)

#### 5.2.2 Auto-calculation Pipeline
On any mark update:
1. Calculate `totalMarks = cieMarks + finalExamMarks`
2. Determine `grade` from totalMarks using the grading table
3. Map grade to `gradePoint`
4. Calculate `creditGradeProduct = credits × gradePoint`
5. Recalculate **SGPA**:
   - `totalCreditGradePoints = Σ (creditGradeProduct for all courses)`
   - `totalCredits = Σ credits`
   - `SGPA = totalCreditGradePoints / totalCredits`
6. Update all dependent UI elements (charts, summaries)

#### 5.2.3 Validation Rules
- CIE: 0–100
- Final Exam: 0–30
- Total: max 130
- Show error toast if invalid input
- Gracefully handle null/empty values

---

### 5.3 Feature 3: Results Dashboard

#### 5.3.1 SGPA Summary Card
Display:
- **Current SGPA** (large, prominent, 2 decimal places)
- **SGPA Trend Indicator** (visual bar: 0–10 scale)
- **Status Badge**: 
  - Green if SGPA ≥ 9.0 ("Excellent")
  - Amber if 8.0–8.99 ("Very Good")
  - Red if < 8.0 ("Good")

#### 5.3.2 Course Breakdown Table
Columns:
- Course Code
- Course Name
- Credits
- CIE Marks (editable)
- Final Exam Marks (editable)
- Total Marks
- Grade
- Grade Points
- Credit × GP

Features:
- Sortable by any column
- Highlight row on hover
- Color-code grades (O = green, A+ = light green, A = blue, etc.)
- Edit button per row (inline or modal)
- Delete button per row (with confirmation)

#### 5.3.3 Grade Distribution Chart
- **Pie chart** showing count of each grade (O, A+, A, B+, etc.)
- **Bar chart** showing credit-weighted distribution
- Use Recharts or similar (or simple SVG)
- Color-coded by grade

#### 5.3.4 Summary Statistics
- Total Credits Completed
- Total Credit-Grade Points
- Average Grade Point (overall)
- Courses with Grade O
- Courses with Grade A+ or below

---

### 5.4 Feature 4: Reverse SGPA Calculator

#### 5.4.1 User Input
- **Target SGPA input** (decimal, 0–10 scale)
- **Button: "Calculate Minimum Marks Required"**

#### 5.4.2 Algorithm: Reverse Optimization
On clicking "Calculate Minimum Marks Required":

1. **Validate Input**
   - Target SGPA ≥ 0 and ≤ 10
   - At least one course must exist

2. **Calculate Required Credit-Grade Points**
   ```
   required_total_CGP = target_SGPA × total_credits
   ```

3. **Tally Already-Locked Courses**
   - Identify courses with **both CIE and Final Exam marks** already entered
   - Their CGP is fixed; add to `locked_CGP`
   - Remaining courses are "variable"

4. **Calculate Remaining Gap**
   ```
   remaining_required_CGP = required_total_CGP - locked_CGP
   ```

5. **Distribute Remaining Points Across Variable Courses**
   - Sort variable courses by **credits (descending)**
   - Greedily assign **grade points 10, 9, 8, ...** to minimize final exam burden
   - For each course, assign the highest possible grade point that doesn't exceed total available
   - If distribution is impossible, flag it ("Unreachable SGPA with given CIE marks")

6. **Convert Grade Points to Required Total Marks**
   - Grade 10 → need total ≥ 90 → `final_exam_needed = max(0, 90 - cie_marks)`
   - Grade 9 → need total ≥ 80 → `final_exam_needed = max(0, 80 - cie_marks)`
   - Grade 8 → need total ≥ 70 → `final_exam_needed = max(0, 70 - cie_marks)`
   - ... and so on
   - **Cap at 30** (max final exam marks): if `final_exam_needed > 30`, mark as **"Impossible"**

7. **Display Results Table**
   - Show each course with:
     - Course Code / Name
     - Current CIE Marks
     - **Target Grade** (calculated)
     - **Minimum Final Exam Marks Required** (or "Impossible")
     - **Total Marks Needed**
   - Highlight impossible courses in red

#### 5.4.3 Edge Cases
- **All courses locked, gap negative**: "Target SGPA already exceeded"
- **Impossible for some courses**: Display clearly; suggest targeting a lower SGPA
- **All A+ or lower needed**: Show as "Achievable without maximum effort"

---

### 5.5 Feature 5: Smart Effort Distribution (Optional Bonus)

#### 5.5.1 Purpose
Suggest which courses the student should prioritize to reach target GPA with minimal effort.

#### 5.5.2 Algorithm
- Given target SGPA and current CIE marks
- Suggest: "Focus on [High-Credit Courses] to achieve [Grade X]"
- Show effort distribution heatmap:
  - Green: Easy to achieve (low final exam mark needed)
  - Yellow: Moderate effort
  - Red: Very challenging (final exam > 25/30)

---

### 5.6 Feature 6: Data Persistence

#### 5.6.1 localStorage Integration
- Key: `rvu_sgpa_calculator`
- Value: JSON-stringified course array + settings
- **Auto-save** on every course/mark change
- **Auto-load** on app initialization

#### 5.6.2 Clear Data
- Button: "Reset All Data"
- Confirmation dialog
- Clears localStorage and resets to default RVU CSE Sem 2 courses

---

### 5.7 Feature 7: Export & Share

#### 5.7.1 Export to CSV
- Button: "Export to CSV"
- Filename: `RVU_SGPA_Report_[DateStamp].csv`
- Columns: Course Code, Course Name, Credits, CIE, Final, Total, Grade, GP, Credit×GP, SGPA

#### 5.7.2 Export as PDF (Optional)
- Button: "Export as PDF"
- Formatted report with logo, student info (optional), course table, SGPA summary

#### 5.7.3 Share as URL Query Params (Advanced)
- Button: "Get Shareable Link"
- Encode current state (courses + marks) into URL query params (compressed JSON)
- Copy to clipboard
- When shared link is opened, pre-populate form with shared data
- **Note**: Keep URL readable; if too long, use shortened URL or sessionStorage fallback

---

## 6. Visual Design & Animation Specifications

### 6.1 Color & Gradient System

#### 6.1.1 Primary Palette (Dark Modern)
- **Background Base**: `#0A0E27` (deep navy)
- **Background Secondary**: `#1A1F3A` (slightly lighter navy)
- **Surface Elevated**: `#252B47` (card/container background)

#### 6.1.2 Gradient Palette
All gradients use smooth, organic transitions:

**Primary Gradient** (used for accent elements, buttons, hero):
```
linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%)
```
(Indigo → Violet → Pink)

**Success Gradient** (Grade O, positive states):
```
linear-gradient(135deg, #10B981 0%, #34D399 100%)
```
(Teal → Emerald Green)

**Warning Gradient** (Grade A-B+, caution states):
```
linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)
```
(Amber → Golden Yellow)

**Error Gradient** (Grade B-, failing states):
```
linear-gradient(135deg, #EF4444 0%, #F87171 100%)
```
(Red → Light Red)

**Accent Gradient** (Cards, highlights):
```
linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)
```
(Cyan → Sky Blue)

#### 6.1.3 Glassmorphism Overlay
- **Glass Background**: `rgba(255, 255, 255, 0.05)` on dark backgrounds
- **Glass Border**: `1px solid rgba(255, 255, 255, 0.1)`
- **Blur Effect**: `backdrop-filter: blur(10px)`
- **Shadow**: `0 8px 32px rgba(0, 0, 0, 0.1)`

**CSS Class Example:**
```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

#### 6.1.4 Text Colors
- **Primary Text**: `#FFFFFF` (white for high contrast)
- **Secondary Text**: `#B0BAC9` (muted gray-blue)
- **Tertiary Text**: `#808FA3` (lighter gray-blue)
- **Accent Text**: Gradient text using `background: gradient; -webkit-background-clip: text`

---

### 6.2 Animated SVG Backgrounds

#### 6.2.1 Hero Section Background
- **Morphing blobs**: 3-4 organic shapes that continuously morph
- **Swirling pattern**: Subtle spiral/vortex animation
- **Floating particles**: Small circles drifting across background
- **Animation duration**: 8-12 seconds (slow, meditative)
- **Implementation**: 
  - Use SVG with `<animate>` or `<animateTransform>` for morph
  - Use Framer Motion for layered animations
  - Opacity fade-in on page load (0-1 over 1s)

**Blob Morphing Example:**
```svg
<path id="blob1" d="M100,200 Q150,100 200,200..." fill="url(#gradient1)">
  <animate attributeName="d" 
    values="M100,200 Q150,100 200,200...;M90,210 Q160,90 210,210...;M100,200 Q150,100 200,200..." 
    dur="8s" 
    repeatCount="indefinite" />
</path>
```

#### 6.2.2 Background Particle System
- **5-10 floating particles** of varying sizes (2px-8px)
- **Opacity**: 0.3-0.7, semi-transparent
- **Movement**: Slow drift animation (15-20s cycles)
- **Colors**: Gradient colors (indigo, violet, pink, cyan)
- **Parallax effect**: Subtle depth using different animation speeds

#### 6.2.3 Animated Grid/Wave Pattern (Optional Subtle Background)
- **Wave distortion**: Subtle sine-wave pattern that flows
- **Animation**: 10-15s cycles
- **Opacity**: Very low (0.05-0.1) so it doesn't distract
- **Used in**: Sections to add visual depth without overwhelming

---

### 6.3 Component-Level Design Specs

#### 6.3.1 SGPA Summary Card (Hero Card)

**Visual Design:**
- **Base**: Glassmorphic card with primary gradient overlay
- **Dimensions**: 100% width on mobile, 320px on desktop
- **Padding**: 32px
- **Border Radius**: 24px
- **Background**: 
  ```
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%),
              rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  ```

**SGPA Number Display:**
- **Font Size**: 48px (desktop), 36px (mobile)
- **Font Weight**: 700 (bold)
- **Color**: Apply gradient text (indigo → pink)
  ```css
  background: linear-gradient(135deg, #6366F1 0%, #EC4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  ```
- **Animation on Update**: 
  - Count-up animation from previous SGPA (1s duration, easing: easeOut)
  - Pulse scale (1 → 1.05 → 1) when value changes (0.5s)
  - Glow effect appears on update (0.5s fade in)

**Status Badge:**
- **Shape**: Pill-shaped with gradient background
- **Animation**: Bounce in on mount (0.4s, easing: easeOut)
- **Examples**:
  - Grade O: Success gradient (green) with badge text "Outstanding"
  - Grade A+: Accent gradient (cyan) with badge text "Excellent"
  - Grade A: Warning gradient (amber) with badge text "Very Good"

**Progress Bar:**
- **Height**: 8px
- **Border Radius**: 4px
- **Background**: `rgba(255, 255, 255, 0.1)`
- **Fill Gradient**: Matches SGPA value (red at 0, green at 10)
- **Animation**: Smooth width transition (0.6s cubic-bezier(0.34, 1.56, 0.64, 1))

---

#### 6.3.2 Course Table

**Row Design:**
- **Background**: Transparent by default
- **Hover State**: 
  - Glassmorphic overlay appears (rgba(255, 255, 255, 0.08))
  - Subtle glow effect (box-shadow: 0 0 20px rgba(99, 102, 241, 0.2))
  - Morph animation: border-radius changes 0% → 8px (0.2s)
  - Scale up: 1 → 1.02 (0.2s)
- **Active/Editing State**:
  - Bright glassmorphic background (rgba(99, 102, 241, 0.15))
  - Border glows with primary gradient
  - Animation: Pulse glow (opacity 0.15 → 0.3 → 0.15, 1.5s cycle)

**Grade Color Cells:**
- **O Grade**: Green gradient background (rgba(16, 185, 129, 0.2))
- **A+ Grade**: Cyan gradient background (rgba(6, 182, 212, 0.2))
- **A Grade**: Blue gradient background (rgba(59, 130, 246, 0.2))
- **B+ Grade**: Amber gradient background (rgba(245, 158, 11, 0.2))
- **Lower Grades**: Red gradient background (rgba(239, 68, 68, 0.2))
- **Animation on Grade Change**: Flash effect (opacity pulse 1 → 0.5 → 1, 0.4s)

**Input Fields (Edit Mode):**
- **Border**: 2px solid rgba(99, 102, 241, 0.5)
- **Background**: rgba(99, 102, 241, 0.08)
- **Focus State**: 
  - Border glow: box-shadow: 0 0 12px rgba(99, 102, 241, 0.6)
  - Background brightens: rgba(99, 102, 241, 0.15)
  - Animation: Glow in (0.2s)
- **Error State**:
  - Border: 2px solid rgba(239, 68, 68, 0.8)
  - Error message fades in below (0.2s)
  - Shake animation: translateX(-2px, 2px, -2px, 0) (0.3s)

---

#### 6.3.3 Buttons

**Primary Button (e.g., "Calculate SGPA")**
- **Background**: Primary gradient (indigo → violet → pink)
- **Padding**: 12px 32px
- **Border Radius**: 12px
- **Font**: 14px, bold, white
- **Cursor**: pointer with custom style

**Hover State:**
- **Scale**: 1 → 1.05 (0.2s)
- **Shadow Glow**: 0 8px 24px rgba(99, 102, 241, 0.4)
- **Brightness**: brightness(1.1)

**Active/Click State:**
- **Scale**: 0.98 (0.1s)
- **Shadow**: Inset shadow effect
- **Ripple animation**: Expanding circle from click point (0.6s, fading)

**Secondary Button (e.g., "Reset")**
- **Background**: rgba(255, 255, 255, 0.1) (glassmorphic)
- **Border**: 2px solid rgba(255, 255, 255, 0.2)
- **Hover**: 
  - Background brightens: rgba(255, 255, 255, 0.2)
  - Border glows: rgba(99, 102, 241, 0.6)

**Icon Buttons (Edit, Delete)**
- **Size**: 40px × 40px
- **Background**: Circular, transparent
- **Hover**: 
  - Background morph to circular glassmorphic (0.2s border-radius transition)
  - Glow appears (box-shadow)
  - Icon rotates slightly (5-10deg, 0.2s)

---

#### 6.3.4 Charts/Visualizations

**Pie Chart (Grade Distribution):**
- **Donut style** (not filled pie) for modern look
- **Segments**: Color-coded by grade
- **Animation on Load**:
  - Segments draw in sequentially (each 0.5s, staggered 0.1s apart)
  - Numbers count up inside donut (1.2s duration)
- **Hover on Segment**:
  - Scale up segment (1 → 1.08)
  - Glow effect around segment
  - Tooltip appears with smooth fade-in (0.2s)

**Bar Chart (Credit-Weighted Distribution):**
- **Bar Design**: Gradient fills (matching grade color)
- **Bar Width**: Proportional to credits
- **Animation on Load**:
  - Bars grow from bottom (0.8s each, staggered 0.1s)
  - Labels fade in as bars complete (0.4s)
- **Hover on Bar**:
  - Bar brightens (opacity/brightness increase)
  - Value tooltip appears above bar
  - Animation: Tooltip scales in (0.9 → 1, 0.2s)

---

#### 6.3.5 Modal/Form Dialogs

**Modal Container:**
- **Background**: Semi-transparent blur (backdrop-filter: blur(5px), background: rgba(0, 0, 0, 0.6))
- **Modal Panel**: Glassmorphic card with primary gradient border
- **Border Radius**: 20px
- **Padding**: 32px

**Animation on Open:**
- **Backdrop**: Fade in (0-1 opacity, 0.3s)
- **Modal**: 
  - Scale from 0.8 → 1 (0.4s)
  - Fade in simultaneously (0-1 opacity, 0.4s)
  - Easing: cubic-bezier(0.34, 1.56, 0.64, 1) (slightly bouncy)

**Animation on Close:**
- Reverse of open (0.3s)
- Both backdrop and modal together

**Form Fields Inside Modal:**
- Same as edit input fields (focus glow, error states)
- Stagger animation on mount: Each field slides in from left + fade in (0.2s each, 0.1s stagger)

---

#### 6.3.6 Toast Notifications

**Design:**
- **Position**: Top-right corner
- **Background**: Glassmorphic (matching message type gradient)
- **Padding**: 16px 20px
- **Border Radius**: 12px
- **Font**: 14px, semi-bold
- **Icon**: Left-aligned (12px size)

**Animation:**
- **Entrance**: Slide in from right (translateX: 500px → 0, 0.3s)
- **Exit**: Slide out to right + fade (0.3s)
- **Auto-dismiss**: After 3s

**Type Variants:**
- **Success**: Green gradient border + green icon
- **Error**: Red gradient border + red icon
- **Warning**: Amber gradient border + amber icon
- **Info**: Cyan gradient border + cyan icon

---

### 6.4 Micro-Interactions & Animation Details

#### 6.4.1 Page Transitions
- **Entrance**: Fade in + subtle slide up (0.4s)
  ```
  opacity: 0 → 1
  transform: translateY(20px) → translateY(0)
  easing: easeOut
  ```
- **Exit**: Fade out + subtle slide down (0.3s)

#### 6.4.2 Loading States
- **Spinner Animation**:
  - Rotating gradient circle (360deg, 2s, linear, infinite)
  - Pulsing opacity (1 → 0.5 → 1, 1.5s cycle)
- **Skeleton Loaders**:
  - Gradient shimmer effect (moving left-to-right, 1.5s cycle)
  - Subtle pulse (opacity breathing)

#### 6.4.3 Number Animations (Counting)
- **Duration**: 0.8s per animation
- **Easing**: easeOut or cubic-bezier(0.34, 1.56, 0.64, 1)
- **Examples**: 
  - SGPA: 8.5 → 9.2 counts up smoothly
  - Total Credits: 20 → 23 counts up smoothly
  - Grade Point totals: Animate in tandem with SGPA

#### 6.4.4 Hover & Focus States
- **Buttons**: Scale + glow (0.2s)
- **Inputs**: Border glow + background brighten (0.2s)
- **Cards**: Subtle lift effect (translateY: 0 → -4px) + shadow increase (0.2s)
- **Links**: Underline grows with gradient (0.3s)

#### 6.4.5 Cursor Behavior
- **Custom cursor** on interactive elements:
  - Hover buttons: Cursor changes to pointer with subtle glow circle around it
  - Hover text: Cursor standard

#### 6.4.6 Scroll Animations (Intersection Observer)
- **Animate on scroll into view**:
  - Cards fade in + slide up (0.5s)
  - Charts animate (bars/segments draw in)
  - Stagger multiple elements (0.1s apart)

---

### 6.5 Typography (Premium Modern)

#### 6.5.1 Font Stack
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
```
(System fonts for performance, can include Google Fonts: Inter, Poppins, or Outfit)

#### 6.5.2 Font Sizes & Weights
- **Display (H1)**: 42px, bold (700), line-height 1.2
- **Heading 2**: 28px, semi-bold (600), line-height 1.3
- **Heading 3**: 20px, semi-bold (600), line-height 1.4
- **Body Large**: 16px, regular (400), line-height 1.6
- **Body Normal**: 14px, regular (400), line-height 1.6
- **Label**: 12px, semi-bold (600), uppercase, letter-spacing 0.5px
- **Small**: 12px, regular (400), line-height 1.5

#### 6.5.3 Gradient Text (Accent Headings)
- Use on main section titles for visual pop
- Gradient: primary gradient (indigo → pink)
- Apply via `background-clip: text` technique

---

### 6.6 Spacing System (8px Grid)
- **XS**: 4px
- **S**: 8px
- **M**: 16px (base unit)
- **L**: 24px
- **XL**: 32px
- **2XL**: 48px
- **3XL**: 64px

**Usage:**
- Padding inside cards: M (16px) or L (24px)
- Margin between sections: L (24px) or XL (32px)
- Gap between elements: S (8px) or M (16px)

---

### 6.7 Responsive Design with Animation Considerations

#### 6.7.1 Mobile (< 640px)
- **Single column** layout
- **Reduced animation duration**: -20% (e.g., 0.4s → 0.32s)
- **Reduced blur effects**: backdrop-filter: blur(5px) instead of 10px
- **Larger touch targets**: 44px minimum for buttons
- **Font sizes**: Slightly smaller (14px body → 13px on very small screens)
- **Animations**: Disable some on low-end devices (prefers-reduced-motion)

#### 6.7.2 Tablet (640px–1024px)
- **2-column** layout where applicable
- **Full animation support**
- **Medium text sizes**

#### 6.7.3 Desktop (> 1024px)
- **3-column** or complex grid layouts
- **Full animation suite** with parallax effects
- **Hover states** fully enabled

#### 6.7.4 Accessibility: Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```
- Disable morphing animations
- Keep essential transitions but faster (0.1s)
- Disable parallax and floating particles

---

### 6.8 Advanced Animation Libraries & Tools

#### 6.8.1 Framer Motion
- Component-level animations
- Gesture handlers (drag, hover, tap)
- Variants system for coordinated animations
- Usage: Buttons, modals, page transitions, number counts

#### 6.8.2 SVG Animations
- Native SVG `<animate>` for blob morphing
- GSAP (optional) for advanced timeline control
- Usage: Background blobs, particle effects, chart animations

#### 6.8.3 Tailwind CSS with Custom Plugins
- Custom animation definitions
- Gradient utilities
- Backdrop blur utilities
- Usage: Gradients, glassmorphism, rapid styling

#### 6.8.4 Three.js (Optional, Phase 2)
- 3D background scene
- Animated 3D shapes instead of 2D blobs
- Parallax depth effect
- Usage: Premium hero section (if desired)

---

### 6.9 Design Tokens (CSS Custom Properties)

```css
:root {
  /* Colors */
  --color-bg-base: #0A0E27;
  --color-bg-secondary: #1A1F3A;
  --color-surface: #252B47;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #B0BAC9;
  --color-text-tertiary: #808FA3;

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
  --gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  --gradient-warning: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
  --gradient-error: linear-gradient(135deg, #EF4444 0%, #F87171 100%);
  --gradient-accent: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);

  /* Animations */
  --animation-duration-fast: 0.2s;
  --animation-duration-normal: 0.4s;
  --animation-duration-slow: 0.8s;
  --animation-easing-out: cubic-bezier(0.34, 1.56, 0.64, 1);
  --animation-easing-ease: ease;

  /* Spacing */
  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
  --spacing-xl: 32px;

  /* Border Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 20px;
  --radius-2xl: 24px;
}
```

---

### 6.10 Visual Hierarchy & Emphasis

**Key Elements (Brightest):**
- SGPA number display (large, gradient, centered)
- Primary CTA buttons
- Important grades (O, A+)
- Success/error messages

**Secondary Elements (Medium):**
- Course names, section headers
- Grade distribution charts
- Form labels

**Tertiary Elements (Subtle):**
- Helper text, hints
- Borders, dividers
- Background patterns (low opacity)

**Navigation & Ancillary:**
- Tab labels, settings, footer
- Secondary buttons
- Disabled states (reduced opacity)

---

## 6.11 Page-Level Visual Design & Layout

#### 6.11.1 Hero Section (Above Fold)
**Background:**
- **Base**: `#0A0E27` with animated SVG blob background
- **Animated Elements**:
  - 3-4 morphing blobs (indigo, violet, pink, cyan colors)
  - Floating particles (2-8px circles, drifting slowly)
  - Subtle grid/wave pattern (ultra-low opacity, 0.05)
  - Overall opacity: Blobs 0.4, particles 0.5, grid 0.05

**Content Positioning:**
- **RVU Logo**: Top-left, 40px × 40px
- **Heading**: "SGPA Calculator for RV University", gradient text, centered
- **Subheading**: "Calculate your semester GPA in seconds", secondary text, centered
- **Quick Stats**: 3-4 cards showing sample SGPA, avg grade, total courses (glassmorphic, animated on load)

**Animation**:
- Page fade-in (0.5s)
- Logo subtle bounce-in (0.4s, easing: easeOut)
- Heading gradient text appears with staggered letter animation (0.6s total)
- Quick stats cards stagger-slide up (0.5s each, 0.1s apart)
- Background blobs morph continuously (8-12s cycles, infinite)
- Particles drift perpetually (15-20s cycles)

#### 6.11.2 Main Dashboard Section
**Layout:**
- **Desktop**: 2-3 column grid (left: course list, center: results, right: reverse calculator)
- **Tablet**: 2-column (stack reverse calculator below)
- **Mobile**: Full single-column stack

**Background:**
- Gradient fade from hero blobs → subtle pattern
- Occasional floating accent blob (opacity 0.1-0.2)

**Section Cards:**
- All major sections wrapped in glassmorphic containers
- Border: Subtle gradient border (bottom-only, using primary gradient)
- Padding: XL (32px)
- Border Radius: 20px

**Dividers Between Sections:**
- Gradient line (primary gradient, opacity 0.3)
- Height: 1px
- Margin: 2XL (48px) above/below

#### 6.11.3 Footer Section
**Design:**
- **Background**: Slightly darker than main (`#0A0E27` with 0.5 opacity overlay)
- **Content**: Links, version, feedback button
- **Text**: Secondary text color
- **Accent**: Small animated gradient divider line above footer

**Animation:**
- Subtle fade-in on scroll into view
- Links have hover glow effect

---

### 6.12 Dark Mode Only (No Light Mode Alternative)

All designs are optimized for **dark theme exclusively**:
- High contrast white text on dark background
- Gradient accents pop against dark
- Glassmorphism looks premium in dark mode
- Reduced eye strain for evening study sessions

**No light mode toggle** — simplifies design, reduces complexity.

---

### 6.13 Micro-Interaction Animation Timeline Examples

#### Example 1: Adding a Course Flow
```
1. User clicks "Add Course" button (0s)
   → Button ripple effect (0.6s)
2. Modal backdrop fades in (0.3s)
3. Modal panel scales in + fades (0.4s)
4. Form fields stagger-slide in (0.2s each, 0.1s stagger)
5. User fills form
6. User clicks "Add" button
   → Button ripple + scale (0.2s)
7. Modal fades out + scales down (0.3s)
8. Backdrop fades out (0.3s)
9. New course row appears in table with slide-in + fade (0.4s)
10. SGPA recalculates and animates up (0.8s count)
```

#### Example 2: Entering Final Exam Marks
```
1. User clicks on "Final Exam Marks" input
   → Input focus glow animates in (0.2s)
2. User types marks
3. User leaves field (blur)
   → Grade calculation happens instantly
   → Grade cell flashes (opacity pulse, 0.4s)
   → Course row glows (box-shadow glow, 0.3s)
4. SGPA recalculates:
   → Old SGPA fades (0.2s)
   → New SGPA counts up from old value (0.8s)
   → Summary card pulses/glows (0.5s)
   → Chart segments re-animate (0.6s)
```

#### Example 3: Reverse Calculator
```
1. User navigates to Reverse Calculator tab
   → Tab button highlights (0.2s)
   → Panel fades in (0.4s)
2. User enters target SGPA
3. User clicks "Calculate"
   → Button ripple (0.6s)
   → Loading spinner appears (rotating, pulsing)
   → Calculation completes (instant, no delay)
   → Loading spinner fades out (0.2s)
4. Results table appears:
   → Table rows stagger-slide in (0.3s each, 0.1s apart)
   → Grade cells animate in (0.4s)
   → "Impossible" cells glow red (0.3s pulse)
5. User can hover over rows:
   → Row background morphs (0.2s)
   → Tooltip appears with smooth fade-in (0.2s)
```

---

### 6.14 Performance Optimization for Animations

- **GPU Acceleration**: Use `transform` and `opacity` only (avoid layout-triggering properties)
- **Debouncing**: Input changes debounced at 300ms to prevent excessive re-renders
- **Lazy Loading**: Animations only trigger when section is in viewport (Intersection Observer)
- **Reduced Motion**: Respect `prefers-reduced-motion` media query
- **Mobile Optimization**: 
  - Reduce particle count on low-end devices
  - Disable morphing blobs on < 1GB RAM
  - Simplify animations on slow networks

---

### 6.15 Visual Design System Summary Table

| Element | Color | Animation | Interaction |
|---------|-------|-----------|-------------|
| Primary Button | Primary Gradient | Glow + Scale (0.2s) | Ripple on click |
| Input Field | Transparent + Border | Border glow (0.2s) | Focus state |
| Card Hover | Glass + Glow | Lift + Glow (0.2s) | Hover reveal |
| SGPA Display | Gradient Text | Count-up (0.8s) + Pulse | Auto-update |
| Modal | Glass + Gradient Border | Scale + Fade (0.4s) | Click close |
| Toast | Type Gradient | Slide + Fade (0.3s) | Auto-dismiss 3s |
| Grade O Cell | Green Gradient | Flash (0.4s) | Hover tooltip |
| Background Blob | Gradient Overlay | Morph (8-12s) | Continuous |

---

## 7. Component Structure

```
RVUGPACalculator (main app)
├── Header
│   ├── Logo
│   └── Nav Tabs
├── Main Container
│   ├── CourseManager
│   │   ├── CourseTable
│   │   │   ├── CourseRow (editable)
│   │   │   └── AddCourseButton
│   │   └── CustomCourseForm (modal)
│   ├── Dashboard
│   │   ├── SGPASummaryCard
│   │   ├── GradeDistributionChart
│   │   ├── StatisticsPanel
│   │   └── CourseBreakdownTable
│   ├── ReverseCalculator
│   │   ├── TargetGPAInput
│   │   ├── CalculateButton
│   │   └── ResultsTable
│   └── Settings
│       ├── ExportButton (CSV)
│       ├── ExportButton (PDF)
│       ├── ShareButton
│       └── ResetButton
└── Footer
```

---

## 8. Functional Requirements & User Flows

### 8.1 Flow 1: Calculate SGPA for Current Semester

**Actor**: RVU Student  
**Goal**: Know current SGPA after entering CIE + Final exam marks

**Steps**:
1. App loads with pre-filled RVU CSE Sem 2 courses
2. Student enters CIE marks in course rows
3. Student enters Final Exam marks (once exams are done)
4. SGPA auto-updates in real-time
5. Student views Dashboard → sees SGPA, grade distribution, course breakdown

**Acceptance Criteria**:
- SGPA calculated correctly per formula
- All 8 courses pre-loaded
- Real-time updates without page refresh
- Grade colors accurate

---

### 8.2 Flow 2: Find Minimum Marks for Target SGPA

**Actor**: RVU Student  
**Goal**: Plan exam preparation; know which courses need how much effort

**Steps**:
1. Student enters some CIE marks (partial data)
2. Navigates to "Reverse Calculator" tab
3. Inputs target SGPA (e.g., 9.5)
4. Clicks "Calculate Minimum Marks Required"
5. App displays table: each course with required final exam marks
6. Student sees which courses are "easy" vs. "hard" to reach target

**Acceptance Criteria**:
- Correct minimum marks calculated per course
- Impossible courses flagged clearly
- Algorithm distributes effort intelligently (prioritizes high-credit courses)

---

### 8.3 Flow 3: Use Custom Courses (Non-CSE Students)

**Actor**: RVU Student from another branch  
**Goal**: Calculate SGPA with their own course list

**Steps**:
1. Click "Reset All Data" (to clear CSE defaults)
2. Click "Add Custom Course"
3. Enter course details (code, name, credits)
4. Add multiple courses
5. Enter marks and calculate SGPA

**Acceptance Criteria**:
- Can add/remove courses freely
- SGPA recalculates correctly
- Data persists in localStorage

---

### 8.4 Flow 4: Share Results

**Actor**: RVU Student  
**Goal**: Share SGPA calculation with friends/adviser

**Steps**:
1. Fill in all course marks
2. Click "Get Shareable Link"
3. Link copied to clipboard
4. Share link with friend
5. Friend opens link → pre-populated with same data

**Acceptance Criteria**:
- Link is shareable and doesn't expire
- Friend sees exact same data
- Privacy: no personal info in URL

---

## 9. Input Validation & Error Handling

### 9.1 Validation Rules

| Input | Rule | Error Message |
|-------|------|--------------|
| CIE Marks | 0 ≤ x ≤ 100 | "CIE marks must be between 0–100" |
| Final Exam | 0 ≤ x ≤ 30 | "Final exam marks must be between 0–30" |
| Total Marks | ≤ 130 | "Total marks exceed 130" |
| Credits | 2, 3, or 4 | "Credits must be 2, 3, or 4" |
| Target SGPA | 0 ≤ x ≤ 10 | "SGPA must be between 0–10" |
| Course Code | Non-empty, unique | "Duplicate course code" |

### 9.2 Error Display
- **Toast notifications** (top-right corner, 3s auto-dismiss)
- **Inline field errors** (red text below input)
- **Modal alerts** for critical errors (e.g., "No courses loaded")

---

## 10. Browser & Responsiveness

### 10.1 Supported Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

### 10.2 Responsive Breakpoints
- **Mobile**: < 640px (single column, touch-friendly buttons)
- **Tablet**: 640px–1024px (2 columns, flexible)
- **Desktop**: > 1024px (full 3-column layout possible)

---

## 11. Performance & Optimization

- **No API calls** → instant calculations
- **Lightweight**: ~200KB bundle (with React + Tailwind)
- **localStorage persistence**: No server dependency
- **Debounce** on input changes to prevent excessive re-renders
- **Memoization** of course calculations for large course lists

---

## 12. Accessibility (A11y)

- **WCAG 2.1 Level AA**
- Proper `<label>` associations for form inputs
- Keyboard navigation (Tab, Enter, Escape)
- ARIA labels for dynamic content
- Color contrast ≥ 4.5:1 for text
- Focus indicators visible on all interactive elements

---

## 13. Testing Scenarios

### 13.1 Unit Test Cases
- SGPA calculation correctness
- Grade mapping accuracy
- Reverse calculator algorithm
- Grade point assignment
- Edge cases (0 credits, all failing, etc.)

### 13.2 Integration Test Cases
- Add/edit/delete course flow
- Real-time SGPA update
- localStorage persistence
- Export to CSV
- Reverse calculator with partial data

### 13.3 User Acceptance Criteria
- CSE Sem 2 students can replicate provided example
- SGPA matches manual calculation
- Reverse calculator is accurate

---

## 14. Optional Enhancements (Phase 2)

1. **Dark Mode**: Toggle theme
2. **Multi-semester**: Track SGPA across semesters, calculate CGPA
3. **Analytics**: Visualize grade trends over time
4. **Comparison**: Compare your SGPA to class average (anonymized)
5. **Notifications**: Remind students when exam dates approach
6. **Multiple Profiles**: Save different "what-if" scenarios

---

## 15. Deliverables

1. ✅ **React Application**: Fully functional, no external APIs
2. ✅ **Documentation**: README with usage instructions
3. ✅ **Test Report**: Sample calculations verified
4. ✅ **Deployment**: Ready for Netlify/Vercel

---

## 16. File Structure with Animation Assets

```
src/
├── components/
│   ├── Header.jsx
│   ├── HeroSection.jsx              # Animated hero with background
│   ├── CourseManager.jsx
│   ├── CourseTable.jsx
│   ├── CourseForm.jsx
│   ├── Dashboard.jsx
│   ├── SGPASummaryCard.jsx          # Animated SGPA display
│   ├── GradeChart.jsx               # Animated charts
│   ├── ReverseCalculator.jsx
│   ├── Settings.jsx
│   ├── Toast.jsx                    # Animated notifications
│   ├── Modal.jsx                    # Animated modals
│   └── Footer.jsx
├── hooks/
│   ├── useAnimation.js              # Reusable animation hooks
│   └── useLocalStorage.js
├── utils/
│   ├── calculations.js              # SGPA, grade mapping, reverse logic
│   ├── constants.js                 # Grading scale, RVU courses, colors, gradients
│   ├── localStorage.js              # Persistence utilities
│   └── formatters.js                # CSV, PDF export utilities
├── assets/
│   ├── svgs/
│   │   ├── blob-morph.svg           # Morphing blob animations
│   │   ├── particle.svg             # Particle shapes
│   │   └── logo.svg                 # RVU logo
│   └── animations/
│       └── animations.css           # Keyframe animations
├── styles/
│   ├── globals.css                  # Tailwind + CSS variables
│   ├── glassmorphism.css            # Glassmorphism utilities
│   ├── gradients.css                # Gradient definitions
│   └── animations.css               # Advanced animation specs
├── App.jsx                          # Main component
└── index.js
```

---

## 17. Code Style & Animation Implementation Examples

### 17.1 Animated SGPA Card Component
```jsx
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const SGPASummaryCard = ({ sgpa, previousSgpa }) => {
  const [displaySgpa, setDisplaySgpa] = useState(previousSgpa || 0);

  // Count-up animation when SGPA changes
  useEffect(() => {
    const target = sgpa || 0;
    const duration = 800; // ms
    const steps = 60;
    const increment = (target - displaySgpa) / steps;
    let current = displaySgpa;

    const timer = setInterval(() => {
      current += increment;
      if ((increment > 0 && current >= target) || (increment < 0 && current <= target)) {
        current = target;
        clearInterval(timer);
      }
      setDisplaySgpa(parseFloat(current.toFixed(2)));
    }, duration / steps);

    return () => clearInterval(timer);
  }, [sgpa, displaySgpa]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="glass-card p-8 rounded-2xl"
    >
      <div className="text-center">
        <motion.p
          className="text-5xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 0.5 }}
        >
          {displaySgpa.toFixed(2)}
        </motion.p>
        <p className="text-gray-400 mt-2">Current SGPA</p>
      </div>

      {/* Animated progress bar */}
      <motion.div
        className="h-2 bg-gray-700 rounded-full mt-6 overflow-hidden"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-pink-500"
          initial={{ width: '0%' }}
          animate={{ width: `${(displaySgpa / 10) * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </motion.div>
    </motion.div>
  );
};
```

### 17.2 SVG Blob Morphing Background
```jsx
export const AnimatedBlobBackground = () => {
  return (
    <svg
      viewBox="0 0 1000 1000"
      className="absolute inset-0 w-full h-full opacity-40"
      style={{ filter: 'blur(40px)' }}
    >
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="50%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      <motion.path
        d="M300,400 Q400,200 600,300 T900,500 Q800,700 600,800 T300,600 Q200,500 300,400"
        fill="url(#grad1)"
        animate={{
          d: [
            "M300,400 Q400,200 600,300 T900,500 Q800,700 600,800 T300,600 Q200,500 300,400",
            "M320,380 Q420,180 620,280 T910,520 Q790,690 580,790 T310,580 Q180,510 320,380",
            "M300,400 Q400,200 600,300 T900,500 Q800,700 600,800 T300,600 Q200,500 300,400",
          ]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
};
```

### 17.3 Staggered Table Rows with Animation
```jsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
};

export const CourseTable = ({ courses }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {courses.map((course) => (
        <motion.div key={course.id} variants={itemVariants} className="course-row">
          {/* Course content */}
        </motion.div>
      ))}
    </motion.div>
  );
};
```

### 17.4 CSS Variables & Glassmorphism Utilities
```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-bg-base: #0A0E27;
  --color-bg-secondary: #1A1F3A;
  --color-surface: #252B47;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #B0BAC9;
  
  --gradient-primary: linear-gradient(135deg, #6366F1 0%, #8B5CF6 50%, #EC4899 100%);
  --gradient-success: linear-gradient(135deg, #10B981 0%, #34D399 100%);
  
  --duration-fast: 0.2s;
  --duration-normal: 0.4s;
  --duration-slow: 0.8s;
  --easing-out: cubic-bezier(0.34, 1.56, 0.64, 1);
}

.glass-card {
  @apply backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.btn-primary {
  @apply px-8 py-3 rounded-xl font-bold text-white transition-all;
  background: var(--gradient-primary);
}

.btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 10px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.6); }
}
```

### 17.5 Custom Animation Hooks
```javascript
// src/hooks/useAnimation.js
import { useEffect, useState } from 'react';

export const useAnimatedNumber = (targetValue, duration = 800) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const steps = 60;
    const increment = (targetValue - displayValue) / steps;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      setDisplayValue((prev) => {
        const next = prev + increment;
        return (increment > 0 && next >= targetValue) ||
               (increment < 0 && next <= targetValue)
          ? targetValue
          : next;
      });
    }, stepDuration);

    return () => clearInterval(timer);
  }, [targetValue, duration]);

  return displayValue;
};

export const useScrollAnimation = (threshold = 0.2) => {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return [ref, isInView];
};
```

### 17.6 DRY Calculation Functions
```javascript
// src/utils/calculations.js
export const getGradeFromMarks = (totalMarks) => {
  if (totalMarks >= 90) return { grade: 'O', point: 10 };
  if (totalMarks >= 80) return { grade: 'A+', point: 9 };
  if (totalMarks >= 70) return { grade: 'A', point: 8 };
  // ... rest of mapping
  return { grade: 'F', point: 0 };
};

export const calculateSGPA = (courses) => {
  const totalCGP = courses.reduce((sum, course) => 
    sum + (course.credits * course.gradePoint || 0), 0
  );
  const totalCredits = courses.reduce((sum, course) => 
    sum + course.credits, 0
  );
  return totalCredits > 0 ? (totalCGP / totalCredits).toFixed(2) : 0;
};

export const calculateMinimumMarksForGPA = (courses, targetGPA) => {
  // Algorithm detailed in Section 5.4.2
  // Returns { courseId, requiredFinalExam, feasible }[]
};
```

### 17.7 Best Practices
- **Functional components** with React hooks only
- **Framer Motion** for all animations (GPU-accelerated)
- **CSS variables** for theming (avoid hardcoded colors)
- **DRY principle**: Reusable calculation & animation utilities
- **Comments**: Complex algorithm explanations
- **Git hygiene**: Atomic commits per feature
- **Accessibility**: WCAG 2.1 Level AA compliance
- **Performance**: Debounced inputs, lazy-loaded animations, memoized components

---

## 18. Animation Testing Checklist

Before deployment:
- ✅ All animations run smoothly at 60fps
- ✅ Animations respect `prefers-reduced-motion`
- ✅ No animation jank on mobile devices
- ✅ Animations use only `transform` & `opacity` (no layout shifts)
- ✅ Loading states animate correctly
- ✅ Toast notifications appear/dismiss properly
- ✅ Modal animations are smooth
- ✅ Number count-ups are accurate
- ✅ Blob morphing loops seamlessly
- ✅ Hover states are responsive

---

## 19. Success Criteria

- ✅ All RVU CSE Sem 2 students can calculate SGPA without errors
- ✅ Reverse calculator provides actionable insights
- ✅ UI is visually stunning with smooth animations
- ✅ Animations run at 60fps without jank
- ✅ Glassmorphic design with gradient overlays throughout
- ✅ Animated SVG blob backgrounds with morphing effects
- ✅ Data persists reliably via localStorage
- ✅ No external API dependencies
- ✅ Shareable and exportable results (CSV, URL)
- ✅ Fully accessible (WCAG 2.1 Level AA)
- ✅ Mobile-responsive with touch-friendly interactions

---

**End of Specification**

---

## 📋 Notes for Claude Code

### 🎨 Visual Design Requirements (CRITICAL)
- **Dark theme only** — no light mode toggle
- **Glassmorphic components** with `backdrop-filter: blur(10px)` + transparency
- **Animated SVG blob backgrounds** with continuous morph effect (8-12s cycles)
- **Gradient text** for key elements (SGPA number, section titles)
- **Smooth Framer Motion animations** on ALL interactive elements
- **60fps performance** — use only `transform` and `opacity` properties
- **Color gradients**:
  - Primary: Indigo → Violet → Pink
  - Success: Teal → Emerald (Grade O)
  - Warning: Amber → Gold (Grade A-B+)
  - Error: Red → Light Red (Grade B below)

### 🚀 Dependencies to Install
```bash
npm install react framer-motion lucide-react recharts
npm install -D tailwindcss postcss autoprefixer
```

### 📝 Critical Implementation Notes
1. **SGPA Calculation**: All logic must be **pure JavaScript** — no API calls
2. **Reverse Calculator**: Implement the algorithm in **Section 5.4.2** step-by-step
3. **SVG Blobs**: Create morphing blobs using SVG `<animate>` + Framer Motion
4. **Animations**: Use **CSS custom properties** (--duration-*, --easing-*) for consistency
5. **Responsive**: Mobile-first approach, test on 375px (iPhone SE)
6. **Accessibility**: Include ARIA labels, keyboard navigation, focus indicators
7. **localStorage**: Test in private/incognito mode
8. **Git**: Commit after each major feature (animations, calculations, UI components)

### 🎯 Recommended Build Priority
1. **Project setup** & folder structure
2. **Core components**: Header, HeroSection, Footer, Layout
3. **Course Management**: CourseForm, CourseTable, CRUD operations
4. **SGPA Calculation**: calculateSGPA function, real-time updates
5. **Dashboard**: SGPASummaryCard, GradeChart, StatisticsPanel
6. **Reverse Calculator**: Algorithm, ResultsTable, error handling
7. **Animations**: Apply Framer Motion to all components (see Section 17)
8. **SVG Background**: AnimatedBlobBackground component with particles
9. **Advanced Polish**: Toast notifications, modals, micro-interactions
10. **Export/Share**: CSV export, shareable URL links

### 📱 Responsive Breakpoints (Test These)
- **Mobile**: 375px (iPhone SE)
- **Small Tablet**: 600px (Galaxy Tab)
- **iPad**: 768px (iPad Mini)
- **Desktop**: 1024px+ (full layout)

### 🧪 Testing Checklist Before Deployment
- ✅ SGPA calculation matches 5+ manual examples
- ✅ Reverse calculator handles edge cases (impossible SGPA, all courses locked)
- ✅ Animations smooth at 60fps on low-end Android device
- ✅ localStorage works in private/incognito mode
- ✅ All buttons/inputs are 44px+ (mobile touch targets)
- ✅ Grade colors match spec (O=green, A+=cyan, A=blue, etc.)
- ✅ Blob morphing loops seamlessly
- ✅ Responsive design works at breakpoints above
- ✅ Lighthouse audit score ≥ 90
- ✅ Keyboard navigation works (Tab, Enter, Escape)

### 🔗 Deployment Instructions (After Building)
1. **Build & Test Locally**: `npm run build && npm run preview`
2. **Deploy to Netlify**: Connect GitHub repo or use CLI
3. **Get Shareable URL**: Copy the Netlify domain
4. **Share with RVU Students**: Send to CSE batch WhatsApp/email
5. **Optional**: Submit to RVU student portal/learning management system

### 🎓 Additional Context for Claude Code
- This calculator is for **RV University CSE B.Tech students**, Semester 2
- **8 pre-loaded courses** with official credits from RVU
- **Credit-weighted SGPA formula** (not simple average)
- **All calculations are hardcoded** — no backend needed
- **Dark theme matches study vibes** (premium feel for late-night exam prep)
- This will become a **widely-used tool** across the entire batch once deployed

---

**You have everything you need. Build something beautiful! 🚀✨**
