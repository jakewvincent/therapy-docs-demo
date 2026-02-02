# Component Quick Reference

> **Keep in sync:** This file must stay synchronized with `component-library.html`. When adding or modifying components, update both files. See the interactive examples in `component-library.html` for visual previews and copy-to-clipboard code.

This file lists all available UI components for quick scanning. Use this before implementing new UI to avoid reinventing existing patterns.

---

## Icons

Icons use Tabler SVG sprites. **Never use icon CDNs** - all icons come from local sprite files.

| Class | Use For |
|-------|---------|
| `icon` | Base icon class (24px, inherits color) |
| `icon-xs` | Extra small (12px) |
| `icon-sm` | Small (16px) |
| `icon-md` | Medium (24px) - explicit sizing |
| `icon-lg` | Large (32px) |
| `icon-xl` | Extra large (40px) |
| `icon-2xl` | 2X large (48px) |

### Example
```html
<svg class="icon"><use href="./assets/icons/custom-sprites.svg#action-save"></use></svg>
<svg class="icon icon-sm text-primary-500"><use href="./assets/icons/tabler-sprites.svg#clients"></use></svg>
```

### Adding New Icons
Request new icons from Tabler Icons to be added to `assets/icons/tabler-sprites.svg`. See CLAUDE.md for the icon naming convention.

---

## Buttons

Always use the `btn` base class with a variant class.

| Class | Use For |
|-------|---------|
| `btn btn-primary` | Primary actions (Save, Submit, Confirm) |
| `btn btn-secondary` | Secondary actions (Cancel, Back, Close) |
| `btn btn-danger` | Destructive actions (Delete, Remove, Archive) |
| `btn btn-success` | Success confirmations (Approve, Complete) |
| `btn btn-ghost` | Tertiary/subtle actions (Edit, View, minor links) |

### Button Modifiers

| Class | Use For |
|-------|---------|
| `btn-sm` | Compact buttons (smaller padding and font) |
| `btn-lg` | Large buttons (more emphasis) |
| `btn-icon` | Icon-only buttons (40x40px square) |
| `btn-fab` | Floating action button (56×56px circle) |

### Buttons with Icons + Text
When a button contains both an icon and text, **always wrap the content** in `<span class="flex items-center">` for proper vertical alignment:

```html
<button class="btn btn-primary">
  <span class="flex items-center">
    <svg class="icon icon-sm mr-2"><use href="./assets/icons/tabler-sprites.svg#action-add"></use></svg>
    Add Item
  </span>
</button>
```

Use `icon-sm` for icons inside buttons and `mr-2` for spacing between icon and text.

### Icon-Only Buttons
Use `btn-icon` for buttons containing only an icon (no wrapper needed):

```html
<button class="btn btn-icon btn-ghost">
  <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#action-edit"></use></svg>
</button>
```

### Floating Action Button (FAB)
Use `btn-fab` for floating action buttons (56×56px circle). Position with utility classes like `fixed bottom-6 right-6`. Use `icon icon-md` for the icon inside.

| Class | Use For |
|-------|---------|
| `btn-fab` | Circular floating action button (56×56px) |

```html
<!-- Basic FAB -->
<button class="btn-fab fixed bottom-6 right-6" title="Add new item">
  <svg class="icon icon-md"><use href="./assets/icons/tabler-sprites.svg#action-add"></use></svg>
</button>
```

### Example
```html
<!-- Text only -->
<button class="btn btn-primary">Save Changes</button>
<button class="btn btn-secondary btn-sm">Cancel</button>

<!-- Icon + text (always use wrapper) -->
<button class="btn btn-primary">
  <span class="flex items-center">
    <svg class="icon icon-sm mr-2"><use href="./assets/icons/custom-sprites.svg#action-save"></use></svg>
    Save Changes
  </span>
</button>

<!-- Icon only -->
<button class="btn btn-icon btn-ghost">
  <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#action-edit"></use></svg>
</button>
```

---

## Form Controls

All form controls are optimized for tablet use with 48px minimum height.

| Class | Use For |
|-------|---------|
| `form-input` | Single-line text inputs |
| `form-textarea` | Multi-line text (1.6 line-height for handwriting) |
| `form-select` | Dropdown selects |
| `form-label` | Form field labels |
| `form-checkbox` | Traditional checkbox inputs |
| `form-radio` | Traditional radio inputs |
| `form-error` | Error message text (red) |
| `form-helper` | Helper text below inputs |
| `form-group` | Wrapper for label + input + helper |
| `title-select` | Select styled like a page title |

### Example
```html
<div class="form-group">
  <label class="form-label">Client Name</label>
  <input type="text" class="form-input" placeholder="Enter name">
  <span class="form-helper">Required field</span>
</div>
```

---

## Button-Style Selections (Tablet-Optimized)

**Use these instead of dropdowns or traditional checkboxes/radios.** They're optimized for stylus/touch input with 48px touch targets.

| Class | Use For |
|-------|---------|
| `btn-checkbox-group` | Container for multiple-selection buttons |
| `btn-checkbox` | Individual selectable button (multi-select) |
| `btn-radio-group` | Container for single-selection buttons |
| `btn-radio` | Individual selectable button (single-select) |

### When to Use
- **btn-checkbox**: Selecting multiple symptoms, treatments, interventions
- **btn-radio**: Selecting mood level, severity, single option from list

### Example (Multi-Select)
```html
<div class="btn-checkbox-group">
  <button class="btn-checkbox" :class="{ 'checked': symptoms.includes('anxiety') }"
          @click="toggleSymptom('anxiety')">
    Anxiety
  </button>
  <button class="btn-checkbox" :class="{ 'checked': symptoms.includes('depression') }"
          @click="toggleSymptom('depression')">
    Depression
  </button>
</div>
```

### Example (Single-Select)
```html
<div class="btn-radio-group">
  <button class="btn-radio" :class="{ 'checked': mood === 'low' }"
          @click="mood = 'low'">
    Low
  </button>
  <button class="btn-radio" :class="{ 'checked': mood === 'moderate' }"
          @click="mood = 'moderate'">
    Moderate
  </button>
  <button class="btn-radio" :class="{ 'checked': mood === 'high' }"
          @click="mood = 'high'">
    High
  </button>
</div>
```

---

## Segmented Control

Use for binary or ternary toggles (Edit/Preview, Yes/No, View modes).

| Class | Use For |
|-------|---------|
| `segmented-control` | Container for the toggle |
| `segmented-control-option` | Individual option button |

### Example
```html
<div class="segmented-control">
  <button class="segmented-control-option" :class="{ 'active': mode === 'edit' }"
          @click="mode = 'edit'">
    <svg class="icon icon-sm"><use href="./assets/icons/tabler-sprites.svg#action-edit"></use></svg> Edit
  </button>
  <button class="segmented-control-option" :class="{ 'active': mode === 'preview' }"
          @click="mode = 'preview'">
    <svg class="icon icon-sm"><use href="./assets/icons/tabler-sprites.svg#preview"></use></svg> Preview
  </button>
</div>
```

---

## Settings Toggles

Toggle switches for settings pages using SVG icons. 48px touch targets for tablet use.

| Class | Use For |
|-------|---------|
| `p-3 bg-neutral-50 rounded-lg` | Setting row container |
| `cursor-pointer hover:bg-neutral-100` | Interactive hover (for toggle rows) |
| `icon icon-xl text-primary-500` | Toggle ON state icon |
| `icon icon-xl text-neutral-400` | Toggle OFF state icon |
| `ml-8 border-l-2 border-neutral-200 pl-4` | Sub-settings indentation with left border |

### Basic Setting Toggle
```html
<label class="flex items-center justify-between p-3 bg-neutral-50 rounded-lg cursor-pointer hover:bg-neutral-100 transition-colors">
  <div class="flex items-center gap-3">
    <svg class="icon text-neutral-400 w-5"><use href="...#icon-name"></use></svg>
    <div>
      <span class="font-medium text-neutral-900">Setting Label</span>
      <p class="text-xs text-neutral-500">Description text</p>
    </div>
  </div>
  <input type="checkbox" x-model="enabled" class="sr-only peer">
  <svg x-show="enabled" class="icon icon-xl text-primary-500"><use href="...#setting-toggle-on"></use></svg>
  <svg x-show="!enabled" x-cloak class="icon icon-xl text-neutral-400"><use href="...#setting-toggle-off"></use></svg>
</label>
```

### Sub-settings (Nested/Conditional)
When a parent toggle reveals child settings, wrap them with indentation and left border:
```html
<template x-if="parentEnabled">
  <div class="ml-8 space-y-3 border-l-2 border-neutral-200 pl-4">
    <!-- Child settings here -->
  </div>
</template>
```

---

## Cards & Containers

| Class | Use For |
|-------|---------|
| `card` | Standard container (white bg, shadow, rounded, 1.5rem padding) |
| `card-compact` | Tighter padding variant (1rem padding) |
| `card-header` | Card header section with bottom border |
| `card-body` | Card content section |
| `card-footer` | Card footer section with top border |

### Example
```html
<div class="card">
  <div class="card-header">
    <h3>Section Title</h3>
  </div>
  <div class="card-body">
    <p>Card content here</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Save</button>
  </div>
</div>
```

---

## Alerts & Feedback

| Class | Use For |
|-------|---------|
| `alert-success` | Success messages (green) |
| `alert-error` | Error messages (red) |
| `alert-warning` | Warning messages (amber) |
| `alert-info` | Informational messages (blue) |

### Example
```html
<div class="alert-success">Changes saved successfully!</div>
<div class="alert-error">Please fix the errors below.</div>
```

---

## Badges

Small pill-shaped labels for status, counts, or categories.

| Class | Use For |
|-------|---------|
| `badge` | Base badge class |
| `badge-primary` | Primary color badge |
| `badge-secondary` | Secondary/neutral badge |
| `badge-success` | Success/active status |
| `badge-danger` | Danger/error status |
| `badge-neutral` | Neutral/inactive status |
| `badge-beta` | Beta/experimental features (warning color) |
| `badge-not-implemented` | Not-yet-implemented features (gray) |

### Example
```html
<span class="badge badge-success">Active</span>
<span class="badge badge-danger">Overdue</span>
<span class="badge badge-neutral">Draft</span>
<span class="badge badge-beta">Beta</span>
<span class="badge badge-not-implemented">Not implemented</span>
```

---

## Navigation

| Class | Use For |
|-------|---------|
| `drawer` | Slide-out navigation drawer container |
| `menu-item` | Navigation menu item (56px height) |
| `menu-item.active` | Currently active page indicator |
| `menu-item.disabled` | Disabled/inaccessible menu item |
| `menu-divider` | Horizontal divider between menu sections |
| `menu-label` | Section label in menu (uppercase, small) |
| `hamburger-btn` | Menu toggle button (48x48px) |
| `modal-close-btn` | Close button for modals/panels (48x48px) |

### Example
```html
<button class="hamburger-btn" @click="drawerOpen = true">
  <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#menu-hamburger"></use></svg>
</button>

<nav class="drawer">
  <a href="/documents" class="menu-item active">
    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#documents"></use></svg>
    <span>Documents</span>
  </a>
  <a href="/clients" class="menu-item">
    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#clients"></use></svg>
    <span>Clients</span>
  </a>
  <div class="menu-divider"></div>
  <span class="menu-label">Admin</span>
  <a href="/users" class="menu-item">
    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#admin-users"></use></svg>
    <span>Users</span>
  </a>
</nav>
```

---

## Layout

| Class | Use For |
|-------|---------|
| `container` | Standard max-width container (80rem) |
| `container-narrow` | Narrow container for forms (56rem) |
| `section` | Section with vertical padding (2rem) |

---

## Utilities

| Class/Element | Use For |
|---------------|---------|
| `<blob-spinner>` | Animated blob spinner (custom element, requires `Spinner.init()`) |
| `loading-spinner` | CSS-only loading indicator (primary color) |
| `divider` | Horizontal separator line |
| `highlight-flash` | Temporary attention animation (0.6s) |
| `attention-border` | Persistent attention border (stays until removed) |

### Blob Spinner
The `<blob-spinner>` custom element provides an animated SMIL spinner. Size with icon classes.

```html
<!-- Initialize in your entry file -->
import { Spinner } from '../components/spinner.js';
Spinner.init();

<!-- Then use anywhere -->
<blob-spinner></blob-spinner>
<blob-spinner class="icon-sm"></blob-spinner>
<blob-spinner class="icon-lg text-primary-500"></blob-spinner>
```

### Other Utilities
```html
<div class="loading-spinner"></div>

<div class="divider"></div>

<div class="card highlight-flash">
  <!-- This element was just updated -->
</div>
```

---

## Heading Classes

Semantic heading styles independent of HTML element.

| Class | Use For |
|-------|---------|
| `page-title` | Top-level page headings |
| `section-title` | Major section headings |
| `subsection-title` | Subsection headings within cards |
| `card-title` | Compact headers in panels |

---

## Common Patterns

### Instead of a custom toggle, use segmented-control:
```html
<!-- Don't do this -->
<div class="flex gap-2">
  <button class="px-4 py-2 rounded" :class="mode === 'a' ? 'bg-primary-600' : 'bg-neutral-200'">A</button>
  <button class="px-4 py-2 rounded" :class="mode === 'b' ? 'bg-primary-600' : 'bg-neutral-200'">B</button>
</div>

<!-- Do this -->
<div class="segmented-control">
  <button class="segmented-control-option" :class="{ 'active': mode === 'a' }">A</button>
  <button class="segmented-control-option" :class="{ 'active': mode === 'b' }">B</button>
</div>
```

### Instead of dropdown multi-select, use btn-checkbox:
```html
<!-- Don't do this -->
<select multiple>
  <option>Option 1</option>
  <option>Option 2</option>
</select>

<!-- Do this -->
<div class="btn-checkbox-group">
  <button class="btn-checkbox" :class="{ 'checked': selected.includes('opt1') }">Option 1</button>
  <button class="btn-checkbox" :class="{ 'checked': selected.includes('opt2') }">Option 2</button>
</div>
```

### Instead of radio buttons for single selection, use btn-radio:
```html
<!-- Don't do this -->
<input type="radio" name="choice" value="a"> A
<input type="radio" name="choice" value="b"> B

<!-- Do this -->
<div class="btn-radio-group">
  <button class="btn-radio" :class="{ 'checked': choice === 'a' }">A</button>
  <button class="btn-radio" :class="{ 'checked': choice === 'b' }">B</button>
</div>
```

---

## Keeping Documentation in Sync

When modifying the component library:

1. **Update `styles/input.css`** - Add/modify CSS classes
2. **Update `component-library.html`** - Add interactive examples with code snippets
3. **Update this file (`docs/COMPONENTS.md`)** - Update the quick reference tables
4. **Update CSS index** - If adding new categories, update the index at top of `input.css`

All four files should reflect the same component inventory.
