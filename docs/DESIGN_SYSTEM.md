# Therapy Docs Design System

## Overview

This application uses a calm, professional aesthetic suitable for healthcare settings. The design prioritizes clarity, accessibility, and a soothing visual experience.

**Theme:** Sage greens, warm cream, and coral accents with generous spacing, clear visual hierarchy, minimal cognitive load. Colors are designed for a professional healthcare aesthetic - grounded, nurturing, and professionally warm without being clinical.

**Core Principles:**
1. **Consistency** - Use defined components exclusively
2. **Clarity** - Clear visual hierarchy and information architecture
3. **Calm** - Generous whitespace, soft colors, unhurried interactions
4. **Accessibility** - WCAG 2.1 AA compliant colors, proper focus states
5. **Simplicity** - No unnecessary decoration or complexity

---

## Color System

### Primary Colors (Burnt Orange)
**Use for:** Primary actions, main buttons, important CTAs
**Brand Note:** Warm burnt orange creates an inviting, professional feel for primary actions.

| Token | Hex | Usage |
|-------|-----|-------|
| `primary-50` | #faf6f4 | Lightest peach tint, subtle backgrounds |
| `primary-100` | #f5eae5 | Light peachy background |
| `primary-200` | #ead2c7 | Light accent backgrounds |
| `primary-300` | #dfbbac | Soft borders, dividers |
| `primary-400` | #d4a592 | Muted accent elements |
| `primary-500` | **#c9907a** | **BURNT ORANGE - Main action color** ✨ |
| `primary-600` | #be7c64 | Hover states, deeper orange |
| `primary-700` | #b36950 | Active/pressed states |
| `primary-800` | #8f5440 | Dark emphasis |
| `primary-900` | #6b3f30 | Darkest for high contrast |

### Neutral Colors (White & Cream)
**Use for:** Backgrounds, text, borders, structural elements
**Brand Note:** Warm cream creates an inviting, non-clinical feel.

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-50` | **#ffffff** | **WHITE - Pure white page background** ✨ |
| `neutral-100` | #f3f0ef | Light cream tint |
| `neutral-200` | **#dad4d1** | **CREAM - Secondary backgrounds, cards** ✨ |
| `neutral-300` | #c1bbb4 | Medium cream for borders |
| `neutral-400` | #a8a498 | Warm gray accents |
| `neutral-500` | #868279 | Mid warm gray, helper text |
| `neutral-600` | #63605a | Dark warm gray |
| `neutral-700` | #4f5349 | Body text (warm greenish gray) |
| `neutral-800` | **#39423b** | **Dark sage - Primary text** ✨ |
| `neutral-900` | #2a3231 | Darkest text for emphasis |

### Secondary Colors (Sage Green)
**Use for:** Secondary actions, subtle buttons, complementary elements
**Brand Note:** Sage green provides a calm, professional secondary option.

| Token | Hex | Usage |
|-------|-----|-------|
| `secondary-50` | #f0f2f2 | Lightest sage tint |
| `secondary-100` | #dbe1e1 | Light sage background |
| `secondary-200` | #b2bfbf | Soft sage accents |
| `secondary-300` | #8c9e9c | Muted sage |
| `secondary-400` | #697c7a | Mid sage |
| `secondary-500` | **#495a58** | **SAGE - Secondary actions** ✨ |
| `secondary-600` | #3f4d4b | Darker sage for hover |
| `secondary-700` | #34403e | Darker sage for emphasis |
| `secondary-800` | #2a3332 | Very dark sage |
| `secondary-900` | #1f2625 | Darkest sage |

### Success (Warm Earthy Green)
**Use for:** Success messages, confirmations, positive status
**Brand Note:** Recognizably green but harmonizes with the warm earth-tone palette.

| Token | Hex | Usage |
|-------|-----|-------|
| `success-50` | #f2f7f3 | Success alert backgrounds |
| `success-100` | #e2ece4 | Light success backgrounds |
| `success-200` | #c3d6c7 | Soft success accents |
| `success-300` | #a6bfad | Muted success |
| `success-400` | #8ba994 | Mid success |
| `success-500` | #72937c | Success icons, clearly green |
| `success-600` | #5b7c67 | Success button backgrounds |
| `success-700` | #466652 | Success text |
| `success-800` | #33503f | Dark success emphasis |
| `success-900` | #22392c | Darkest success |

### Danger (Warm Earthy Red)
**Use for:** Errors, destructive actions, critical warnings
**Brand Note:** Recognizably red but warmer and less harsh than pure red.

| Token | Hex | Usage |
|-------|-----|-------|
| `danger-50` | #faf4f2 | Error alert backgrounds |
| `danger-100` | #f5e5e0 | Light error backgrounds |
| `danger-200` | #eac7bd | Soft error accents |
| `danger-300` | #dfab9d | Muted error |
| `danger-400` | #d48f7f | Mid error |
| `danger-500` | #c97563 | Error states, clearly red/terracotta |
| `danger-600` | #b2604e | Danger button backgrounds |
| `danger-700` | #9a4d3b | Error text |
| `danger-800` | #833c2b | Dark error emphasis |
| `danger-900` | #6b2d1d | Darkest error |

### Warning (Warm Amber/Gold)
**Use for:** Caution messages, important notices
**Brand Note:** Recognizably yellow/amber but warm and harmonious.

| Token | Hex | Usage |
|-------|-----|-------|
| `warning-50` | #faf8f2 | Warning backgrounds |
| `warning-100` | #f6f0e0 | Light warning backgrounds |
| `warning-200` | #efe1bd | Soft warning accents |
| `warning-300` | #e8d09c | Muted warning |
| `warning-400` | #e0bf7d | Mid warning |
| `warning-500` | #d9ae5f | Warning indicators, golden amber |
| `warning-600` | #c19347 | Warning accents |
| `warning-700` | #a87a32 | Warning text |
| `warning-800` | #8f6221 | Dark warning emphasis |
| `warning-900` | #774c13 | Darkest warning |

### Info (Soft Sage)
**Use for:** Informational messages, helpful tips, previous session summaries
**Brand Note:** Uses secondary sage tones for a cohesive look.

| Token | Hex | Usage |
|-------|-----|-------|
| `info-50` | #f0f2f2 | Info alert backgrounds |
| `info-100` | #e1e6e6 | Light info backgrounds |
| `info-200` | #c5cfcf | Soft info accents |
| `info-300` | #a9b8b7 | Muted info |
| `info-400` | #8fa09f | Mid info |
| `info-500` | #778987 | Info icons |
| `info-600` | #5f7170 | Info accents |
| `info-700` | #495a58 | Info text (matches primary sage) |

---

## Typography

### Font Family
- **Primary:** Atkinson Hyperlegible (loaded from Google Fonts)
- **Fallback:** system-ui, -apple-system, sans-serif

### Type Scale

| Element | Class | Size | Weight | Use Case |
|---------|-------|------|--------|----------|
| H1 | `text-3xl font-bold` | 30px | 700 | Page titles |
| H2 | `text-2xl font-semibold` | 24px | 600 | Section titles |
| H3 | `text-xl font-semibold` | 20px | 600 | Card headers, subsections |
| H4 | `text-lg font-semibold` | 18px | 600 | Minor headings |
| Body | `text-base` | 16px | 400 | Default body text |
| Small | `text-sm` | 14px | 400 | Labels, captions, helper text |
| Tiny | `text-xs` | 12px | 400 | Badges, metadata |

### Line Height
- **Headings:** `leading-tight` (1.25)
- **Body:** `leading-normal` (1.5)
- **Relaxed:** `leading-relaxed` (1.75) for long-form content

---

## Spacing System

### Standard Spacing Scale
Use consistent spacing throughout the application:

- `xs` (8px) - Minimal spacing, tight groups
- `sm` (12px) - Related items
- `md` (16px) - Form field spacing
- `lg` (24px) - **Standard component spacing**
- `xl` (32px) - Section spacing
- `2xl` (48px) - Major section breaks

### Common Patterns
- **Card padding:** `p-6` (24px)
- **Compact card padding:** `p-4` (16px)
- **Section spacing:** `space-y-6` (24px between items)
- **Form field spacing:** `space-y-4` (16px between fields)
- **Button padding:** `px-4 py-2` (16px horizontal, 8px vertical)
- **Page margins:** `px-4 sm:px-6 lg:px-8 py-8`

---

## Components

### Buttons

#### Primary Button
**Use for:** Main actions (Save, Submit, Continue)

```html
<button class="btn-primary">Save Note</button>
```

**Variants:**
```html
<button class="btn-primary btn-sm">Small Primary</button>
<button class="btn-primary btn-lg">Large Primary</button>
<button class="btn-primary" disabled>Disabled</button>
```

#### Secondary Button
**Use for:** Less important actions (Cancel, Back, View)

```html
<button class="btn-secondary">Cancel</button>
```

#### Danger Button
**Use for:** Destructive actions (Delete, Remove, Clear)

```html
<button class="btn-danger">Delete Note</button>
```

#### Success Button
**Use for:** Confirmation actions (Approve, Confirm)

```html
<button class="btn-success">Confirm</button>
```

#### Ghost Button
**Use for:** Tertiary actions, inline actions

```html
<button class="btn-ghost">Edit</button>
```

---

### Cards

#### Standard Card
**Use for:** Main content containers

```html
<div class="card">
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</div>
```

#### Card with Header
**Use for:** Sections with distinct title areas

```html
<div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
  <div class="card-header">
    <h3>Session Notes</h3>
  </div>
  <div class="card-body">
    <p>Content here...</p>
  </div>
</div>
```

#### Card with Footer
**Use for:** Cards with actions or metadata

```html
<div class="bg-white rounded-lg shadow-sm border border-neutral-200 overflow-hidden">
  <div class="card-body">
    <p>Content here...</p>
  </div>
  <div class="card-footer">
    <button class="btn-primary">Action</button>
  </div>
</div>
```

#### Compact Card
**Use for:** Dense information displays

```html
<div class="card-compact">
  <p>Compact content...</p>
</div>
```

---

### Forms

#### Text Input
```html
<div class="form-group">
  <label class="form-label" for="field-id">Field Label</label>
  <input type="text" id="field-id" class="form-input" placeholder="Placeholder text">
  <p class="form-helper">Helper text explaining the field</p>
</div>
```

#### Text Input with Error
```html
<div class="form-group">
  <label class="form-label" for="field-id">Field Label</label>
  <input type="text" id="field-id" class="form-input border-danger-500" placeholder="Placeholder text">
  <p class="form-error">This field is required</p>
</div>
```

#### Textarea
```html
<div class="form-group">
  <label class="form-label" for="notes">Session Notes</label>
  <textarea id="notes" class="form-textarea" rows="8" placeholder="Enter notes here..."></textarea>
</div>
```

#### Select Dropdown
```html
<div class="form-group">
  <label class="form-label" for="client">Select Client</label>
  <select id="client" class="form-select">
    <option value="">Select client...</option>
    <option value="1">John Doe</option>
    <option value="2">Jane Smith</option>
  </select>
</div>
```

#### Checkbox
```html
<div class="flex items-center">
  <input type="checkbox" id="remember" class="form-checkbox">
  <label for="remember" class="ml-2 text-sm text-neutral-700">Remember me</label>
</div>
```

#### Radio Button
```html
<div class="space-y-2">
  <div class="flex items-center">
    <input type="radio" id="option1" name="options" class="form-radio">
    <label for="option1" class="ml-2 text-sm text-neutral-700">Option 1</label>
  </div>
  <div class="flex items-center">
    <input type="radio" id="option2" name="options" class="form-radio">
    <label for="option2" class="ml-2 text-sm text-neutral-700">Option 2</label>
  </div>
</div>
```

#### Date Input
```html
<div class="form-group">
  <label class="form-label" for="date">Session Date</label>
  <input type="date" id="date" class="form-input">
</div>
```

#### Button Checkboxes (Multiple Selection)
**Better UX than dropdowns for tablet** - Shows all options inline, easier to tap.

```html
<div x-data="{ selected: ['option1'] }">
  <div class="form-group">
    <label class="form-label">Select Options</label>
    <div class="btn-checkbox-group">
      <button
        type="button"
        class="btn-checkbox"
        :class="{ 'checked': selected.includes('option1') }"
        @click="selected.includes('option1') ? selected = selected.filter(s => s !== 'option1') : selected.push('option1')"
      >
        <i :class="selected.includes('option1') ? 'ph-fill ph-check-square' : 'ph ph-square'"></i>
        Option 1
      </button>
      <button
        type="button"
        class="btn-checkbox"
        :class="{ 'checked': selected.includes('option2') }"
        @click="selected.includes('option2') ? selected = selected.filter(s => s !== 'option2') : selected.push('option2')"
      >
        <i :class="selected.includes('option2') ? 'ph-fill ph-check-square' : 'ph ph-square'"></i>
        Option 2
      </button>
    </div>
  </div>
</div>
```

**Classes:**
- `.btn-checkbox-group` - Container with flex wrap
- `.btn-checkbox` - Individual checkbox button (48px min-height for tablet)
- `.btn-checkbox.checked` - Checked state (primary color border/background)
- Font Awesome icons: `ph ph-square` (unchecked), `ph-fill ph-check-square` (checked)

#### Button Radios (Single Selection)
**Better UX than dropdowns for tablet** - Shows all options inline, easier to tap.

```html
<div x-data="{ selected: 'option1' }">
  <div class="form-group">
    <label class="form-label">Select One</label>
    <div class="btn-radio-group">
      <button
        type="button"
        class="btn-radio"
        :class="{ 'checked': selected === 'option1' }"
        @click="selected = 'option1'"
      >
        <i :class="selected === 'option1' ? 'ph-fill ph-radio-button' : 'ph ph-circle'"></i>
        Option 1
      </button>
      <button
        type="button"
        class="btn-radio"
        :class="{ 'checked': selected === 'option2' }"
        @click="selected = 'option2'"
      >
        <i :class="selected === 'option2' ? 'ph-fill ph-radio-button' : 'ph ph-circle'"></i>
        Option 2
      </button>
    </div>
  </div>
</div>
```

**Classes:**
- `.btn-radio-group` - Container with flex wrap
- `.btn-radio` - Individual radio button (48px min-height for tablet)
- `.btn-radio.checked` - Checked state (primary color border/background)
- Font Awesome icons: `ph ph-circle` (unchecked), `ph-fill ph-radio-button` (checked)

**When to use:**
- Use **button checkboxes** for multiple selections (symptoms, treatments, interventions)
- Use **button radios** for single selections (mood, severity level, session type)
- Prefer over dropdowns when you have 2-8 options
- Optimizes horizontal space on tablet
- All options visible at once - no need to open dropdown
- Easier to tap with stylus than small dropdown arrows

---

### Alerts

#### Success Alert
```html
<div class="alert-success">
  <p>Note saved successfully!</p>
</div>
```

#### Error Alert
```html
<div class="alert-error">
  <p>Failed to save note. Please try again.</p>
</div>
```

#### Warning Alert
```html
<div class="alert-warning">
  <p>You have unsaved changes.</p>
</div>
```

#### Info Alert
```html
<div class="alert-info">
  <p>This is the last session for this client.</p>
</div>
```

---

### Badges

```html
<span class="badge-primary">Active</span>
<span class="badge-success">Completed</span>
<span class="badge-danger">Overdue</span>
<span class="badge-neutral">Draft</span>
```

---

## Layout Patterns

### Application Shell

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Therapy Docs</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="dist/output.css">
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
</head>
<body>
  <!-- App content -->
</body>
</html>
```

### Page Header

```html
<header class="bg-white shadow-sm border-b border-neutral-200">
  <div class="container">
    <div class="py-4 flex justify-between items-center">
      <h1 class="text-2xl font-bold text-neutral-900">Therapy Docs</h1>
      <div class="flex items-center space-x-4">
        <span class="text-sm text-neutral-600">user@example.com</span>
        <button class="btn-secondary btn-sm">Logout</button>
      </div>
    </div>
  </div>
</header>
```

### Main Content Area

```html
<main class="container-narrow section">
  <!-- Page content with consistent spacing -->
  <div class="space-y-6">
    <!-- Components -->
  </div>
</main>
```

### Two-Column Layout (if needed)

```html
<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <div class="card">
    <!-- Left column -->
  </div>
  <div class="card">
    <!-- Right column -->
  </div>
</div>
```

---

## Accessibility Guidelines

### Color Contrast
- All text meets WCAG 2.1 AA standards (4.5:1 for normal text, 3:1 for large text)
- Never rely on color alone to convey information

### Focus States
- All interactive elements have visible focus indicators
- Focus rings use `focus:ring-2 focus:ring-{color}-500 focus:ring-offset-2`

### Form Labels
- Every input has an associated `<label>` with `for` attribute
- Use `aria-label` or `aria-labelledby` when visual labels aren't present

### Semantic HTML
- Use proper heading hierarchy (H1 → H2 → H3)
- Use `<button>` for actions, `<a>` for navigation
- Use semantic elements (`<main>`, `<nav>`, `<header>`, `<section>`)

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Tab order is logical and follows visual flow

---

## Interaction Patterns

### Loading States

```html
<!-- Button loading state -->
<button class="btn-primary" disabled>
  <span class="loading-spinner mr-2"></span>
  Saving...
</button>

<!-- Content loading state -->
<div class="card flex items-center justify-center py-12">
  <div class="loading-spinner"></div>
  <span class="ml-3 text-neutral-600">Loading...</span>
</div>
```

### Empty States

```html
<div class="card text-center py-12">
  <p class="text-neutral-500">No sessions found for this client.</p>
  <button class="btn-primary mt-4">Create First Session</button>
</div>
```

### Disabled States

```html
<!-- Disabled button -->
<button class="btn-primary" disabled>Cannot Save</button>

<!-- Disabled input -->
<input type="text" class="form-input" disabled value="Read-only value">
```

---

## Animation & Transitions

### Transition Timing
- **Fast:** 150ms - Hover states, simple toggles
- **Base:** 200ms - Most UI transitions (default)
- **Slow:** 300ms - Complex animations, modals

### Common Transitions
```html
<!-- Color transitions (buttons, links) -->
<button class="transition-colors duration-200">Button</button>

<!-- All properties -->
<div class="transition-all duration-200">Element</div>

<!-- Opacity fade -->
<div class="transition-opacity duration-300">Fading element</div>
```

### Alpine.js Transitions
```html
<!-- Fade in/out -->
<div x-show="isVisible" x-transition>
  Content
</div>

<!-- Custom transition -->
<div x-show="isVisible"
     x-transition:enter="transition ease-out duration-200"
     x-transition:enter-start="opacity-0 transform scale-95"
     x-transition:enter-end="opacity-100 transform scale-100"
     x-transition:leave="transition ease-in duration-150"
     x-transition:leave-start="opacity-100 transform scale-100"
     x-transition:leave-end="opacity-0 transform scale-95">
  Content
</div>
```

---

## Responsive Design

### Breakpoints (Tailwind defaults)
- `sm`: 640px
- `md`: 768px (tablets)
- `lg`: 1024px
- `xl`: 1280px

### Tablet Optimization (Primary Use Case)

**Context:** This app is primarily used on tablets **in portrait orientation** during therapy sessions with stylus/handwriting input.

#### Touch Target Requirements
- **Minimum size:** 48x48px for all interactive elements
- **Buttons:** Default buttons are 48px min-height with larger padding
- **Form inputs:** All inputs have 48px min-height
- **Checkboxes/radios:** Increased to 20x20px (1.25rem)

#### Layout Considerations
- **Portrait-first design:** Primary orientation is portrait (easier to hold during sessions)
- **Sticky client selector:** Remains at top when scrolling through forms
- **Collapsible previous session:** Can be minimized to maximize vertical space in portrait
- **Portrait optimization:** Container width expands to 95% on tablet portrait (768-1024px)
- **Landscape support:** Also works in landscape with 90% width
- **Larger padding:** All form elements have increased padding for easier tapping

#### Handwriting Recognition Support
- **Line height:** Textareas use 1.6 line-height for better text spacing
- **Font size:** Minimum 16px (1rem) to prevent zoom on iOS
- **Focus retention:** Textareas maintain focus for handwriting input

### Mobile-First Approach
Always design for mobile first, then enhance for larger screens:

```html
<!-- Stack on mobile, side-by-side on desktop -->
<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- Adjust padding -->
<div class="px-4 sm:px-6 lg:px-8">
  Content
</div>

<!-- Responsive text size -->
<h1 class="text-2xl sm:text-3xl lg:text-4xl">Heading</h1>

<!-- Tablet-specific optimization -->
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  /* Primary: Portrait mode - maximize width, optimize for vertical space */
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  /* Secondary: Landscape mode also supported */
}
```

---

## Rules for Development (Instructions for Claude Code)

### When Adding New Features

1. **Always reference this design system first**
2. **Use existing component classes** - Never create ad-hoc utility combinations for common patterns
3. **Maintain spacing conventions:**
   - Card padding: `p-6`
   - Section spacing: `space-y-6`
   - Form spacing: `space-y-4`
4. **Use semantic color classes:**
   - Primary actions: `primary-*`
   - Text/structure: `neutral-*`
   - Success: `success-*`
   - Errors: `danger-*`
5. **Maintain max-width:** Use `container-narrow` (max-w-4xl) for main content
6. **Never skip accessibility features:** labels, focus states, ARIA attributes

### Adding New Components

If you need a new component pattern:

1. **Check if similar pattern exists** in this document
2. **Add to `/styles/input.css`** under `@layer components`
3. **Document in DESIGN_SYSTEM.md** with examples
4. **Use consistent naming:** Component type + variant (e.g., `btn-primary`, `alert-success`)

### Code Review Checklist

Before committing changes, verify:

- [ ] Uses predefined component classes (not ad-hoc Tailwind combinations)
- [ ] Maintains consistent spacing (p-6, space-y-6, etc.)
- [ ] Uses semantic color tokens (primary-*, neutral-*, etc.)
- [ ] Includes proper labels and ARIA attributes
- [ ] Has visible focus states on interactive elements
- [ ] Follows mobile-first responsive patterns
- [ ] Matches existing visual hierarchy

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```html
<!-- Creating one-off button styles -->
<button class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
  Save
</button>

<!-- Inconsistent spacing -->
<div class="space-y-4">
  <div class="mb-8">Item 1</div>
  <div class="mb-4">Item 2</div>
</div>

<!-- Using arbitrary colors -->
<div class="bg-[#3b82f6]">Content</div>

<!-- No label for input -->
<input type="text" placeholder="Name">
```

### ✅ Do This Instead
```html
<!-- Use component class -->
<button class="btn-primary">Save</button>

<!-- Consistent spacing -->
<div class="space-y-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Use semantic color -->
<div class="bg-primary-500">Content</div>

<!-- Proper label -->
<div class="form-group">
  <label class="form-label" for="name">Name</label>
  <input type="text" id="name" class="form-input">
</div>
```

---

## Icons

### Font Awesome
This project uses Font Awesome icons for a consistent, professional icon set.

**Usage:**
```html
<!-- Solid icons -->
<i class="ph-fill ph-heart"></i>
<i class="ph-fill ph-user"></i>
<i class="ph-fill ph-check-fat"></i>

<!-- Regular icons -->
<i class="ph ph-calendar"></i>
<i class="ph ph-clock"></i>

<!-- In buttons -->
<button class="btn-primary">
  <i class="ph-fill ph-floppy-disk mr-2"></i>
  Save Note
</button>
```

**Common icons for therapy notes:**
- `ph-file-plus` - Medical notes
- `ph-user` - Client/patient
- `ph-calendar-dots` - Sessions/dates
- `ph-clock` - Duration/time
- `ph-file-plus` - Documents
- `ph-brain` - Mental health
- `ph-heart-pulse` - Wellness
- `ph-check-circle` - Success/complete
- `ph-warning` - Warning
- `ph-x-circle` - Error/delete

[Font Awesome Icon Gallery](https://fontawesome.com/icons)

---

## Resources

### External References
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/docs)
- [Alpine.js Documentation](https://alpinejs.dev)
- [Font Awesome Icons](https://fontawesome.com/icons)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Inter Font](https://fonts.google.com/specimen/Inter)

### Internal Files
- `/styles/input.css` - Theme configuration and component classes
- `/index.html` - Main application markup (includes inline Alpine.js logic)
- `/component-library.html` - Interactive component showcase

---

**Last Updated:** January 2025  
**Version:** 1.0
