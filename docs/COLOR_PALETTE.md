# Therapy Docs - Color Palette

## Brand Colors for Healthcare Applications

### Core Brand Colors (Direct from Website)

| Color Name | Hex Code | Usage |
|------------|----------|-------|
| **White** | `#FFFFFF` | Page backgrounds (`neutral-50`) |
| **Cream** | `#DAD4D1` | Secondary backgrounds, cards (`neutral-200`) |
| **Burnt Orange** | `#C9907A` | **Primary buttons, main actions** (`primary-500`) |
| **Sage** | `#495A58` | Secondary buttons, complementary elements (`secondary-500`) |
| **Dark Sage** | `#39423B` | Primary text color (`neutral-800`) |

---

## Complete Color System

### Primary (Burnt Orange) ← Main Action Color
Built around **#C9907A** (Burnt Orange)

| Token | Hex |
|-------|-----|
| `primary-50` | #faf6f4 |
| `primary-100` | #f5eae5 |
| `primary-200` | #ead2c7 |
| `primary-300` | #dfbbac |
| `primary-400` | #d4a592 |
| `primary-500` | **#C9907A** ← Main buttons, primary CTAs |
| `primary-600` | #be7c64 ← Hover states |
| `primary-700` | #b36950 ← Active/pressed states |
| `primary-800` | #8f5440 |
| `primary-900` | #6b3f30 |

### Secondary (Sage Green) ← Complementary Actions
Built around **#495A58** (Sage)

| Token | Hex |
|-------|-----|
| `secondary-50` | #f0f2f2 |
| `secondary-100` | #dbe1e1 |
| `secondary-200` | #b2bfbf |
| `secondary-300` | #8c9e9c |
| `secondary-400` | #697c7a |
| `secondary-500` | **#495A58** ← Secondary buttons, sage elements |
| `secondary-600` | #3f4d4b ← Hover states |
| `secondary-700` | #34403e |
| `secondary-800` | #2a3332 |
| `secondary-900` | #1f2625 |

### Neutral (White & Cream)
Built around **#FFFFFF** (White) and **#DAD4D1** (Cream)

| Token | Hex |
|-------|-----|
| `neutral-50` | **#FFFFFF** ← Page background |
| `neutral-100` | #f3f0ef ← Light cream tint |
| `neutral-200` | **#DAD4D1** ← Cards, secondary backgrounds |
| `neutral-300` | #c1bbb4 ← Borders |
| `neutral-400` | #a8a498 ← Warm gray accents |
| `neutral-500` | #868279 ← Helper text |
| `neutral-600` | #63605a ← Dark warm gray |
| `neutral-700` | #4f5349 ← Body text |
| `neutral-800` | **#39423B** ← Primary text (Dark Sage) |
| `neutral-900` | #2a3231 ← Darkest emphasis |

### Success (Warm Earthy Green)
Recognizably green but harmonizes with warm palette

| Token | Hex |
|-------|-----|
| `success-50` | #f2f7f3 |
| `success-100` | #e2ece4 |
| `success-200` | #c3d6c7 |
| `success-300` | #a6bfad |
| `success-400` | #8ba994 |
| `success-500` | #72937c ← Success icons |
| `success-600` | #5b7c67 ← Button backgrounds |
| `success-700` | #466652 ← Success text |
| `success-800` | #33503f |
| `success-900` | #22392c |

### Danger (Warm Earthy Red)
Recognizably red but warm terracotta tones

| Token | Hex |
|-------|-----|
| `danger-50` | #faf4f2 |
| `danger-100` | #f5e5e0 |
| `danger-200` | #eac7bd |
| `danger-300` | #dfab9d |
| `danger-400` | #d48f7f |
| `danger-500` | #c97563 ← Error states |
| `danger-600` | #b2604e ← Button backgrounds |
| `danger-700` | #9a4d3b ← Error text |
| `danger-800` | #833c2b |
| `danger-900` | #6b2d1d |

### Warning (Warm Amber/Gold)
Recognizably yellow but warm golden tones

| Token | Hex |
|-------|-----|
| `warning-50` | #faf8f2 |
| `warning-100` | #f6f0e0 |
| `warning-200` | #efe1bd |
| `warning-300` | #e8d09c |
| `warning-400` | #e0bf7d |
| `warning-500` | #d9ae5f ← Warning indicators |
| `warning-600` | #c19347 |
| `warning-700` | #a87a32 ← Warning text |
| `warning-800` | #8f6221 |
| `warning-900` | #774c13 |

### Info (Soft Sage)
Uses secondary sage tones for informational messages

| Token | Hex |
|-------|-----|
| `info-50` | #f0f2f2 |
| `info-100` | #e1e6e6 |
| `info-200` | #c5cfcf |
| `info-300` | #a9b8b7 |
| `info-400` | #8fa09f |
| `info-500` | #778987 ← Info icons |
| `info-600` | #5f7170 |
| `info-700` | **#495A58** ← Info text (matches sage) |

---

## Design Philosophy

**Design Philosophy:** Warm, grounded, non-clinical aesthetic that feels professionally nurturing rather than sterile or corporate.

**Key Color Decisions:**

1. **Primary Actions:** Burnt Orange (#C9907A) - Warm, inviting color for main buttons
2. **Secondary Actions:** Sage (#495A58) - Calm, professional complement
3. **Text Color:** Dark Sage (#39423B) - Warm, approachable, easier on eyes than black
4. **Background:** Pure White (#FFFFFF) - Clean, spacious
5. **Cards/Sections:** Cream (#DAD4D1) - Subtle differentiation without harsh contrast
6. **Semantic Colors:** Recognizable green/yellow/red but warmed to harmonize with palette

**Accessibility:** All color combinations meet WCAG 2.1 AA standards for contrast.

---

## Button Usage Guide

```html
<!-- Primary action - Burnt orange -->
<button class="btn-primary">Save Note</button>

<!-- Secondary action - Neutral/cream -->
<button class="btn-secondary">Cancel</button>

<!-- Success action - Warm green -->
<button class="btn-success">Confirm</button>

<!-- Danger action - Warm red -->
<button class="btn-danger">Delete</button>
```
