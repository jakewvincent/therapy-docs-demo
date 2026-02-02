# Tablet Usage Guide

## Primary Use Case

This application is designed for tablet use during therapy sessions, supporting:
- **Stylus input** for tapping/selecting
- **Handwriting recognition** for text entry
- **Portrait mode** primarily (easier to hold during sessions), landscape occasionally

---

## Optimizations for Tablet Use

### 1. Touch Targets (48x48px minimum)

All interactive elements meet the recommended minimum size for comfortable stylus tapping:

- ✅ All buttons: 48px min-height
- ✅ Form inputs: 48px min-height
- ✅ Dropdowns: 48px min-height
- ✅ Checkboxes/radios: 20x20px (easier to tap)

### 2. Sticky Navigation

**Client selector remains visible at top** - No need to scroll back up to see which client you're working with.

```html
<div class="sticky top-0 z-10 bg-white shadow-md">
  <!-- Client selector always visible -->
</div>
```

### 3. Collapsible Previous Session

**Previous session summary can be collapsed** to provide more room for current note-taking:

- Tap chevron icon to expand/collapse
- Starts expanded by default
- Collapse when you need more screen space

### 4. Portrait Layout Optimization

**Container width maximized for portrait mode** (768-1024px) at 95% of screen:

- Optimized for primary portrait orientation
- Maximizes usable width in portrait
- Minimizes horizontal whitespace
- Landscape mode also supported (90% width)

### 5. Handwriting Recognition Support

**Optimized for stylus and handwriting input:**

- Font size: 16px minimum (prevents iOS auto-zoom)
- Line height: 1.6 (better spacing for recognized text)
- Larger padding: More comfortable writing area
- Focus retention: Textareas stay focused during input

---

## Typical Session Flow

1. **Select client** (sticky at top)
2. **Review previous session** (previous session narrative)
3. **Collapse previous session** if needed (tap chevron)
4. **Fill out forms** using dropdowns and checkboxes
5. **Add notes** using handwriting recognition in textarea
6. **Save** (button always accessible via scroll)

---

## Form-Based Note Taking

Since most note-taking uses **forms and dropdowns** rather than free-form writing:

- All dropdown menus have larger touch targets
- Checkboxes are sized for easy tapping
- Forms can be expanded later with more structured fields
- Combination of structured + freeform works well

---

## Testing on Tablet

### Recommended Testing
- **Device:** iPad (10.2" or larger recommended)
- **Orientation:** Primarily portrait (easier to hold during sessions)
- **Input:** Apple Pencil or compatible stylus
- **Browser:** Safari (for handwriting recognition)

### What to Test
- Can easily tap all buttons with stylus
- Dropdowns open properly
- Checkboxes are easy to select
- Handwriting recognition inserts into active field
- Client selector stays visible when scrolling
- Previous session collapses smoothly
- Layout feels spacious in portrait
- Not too much scrolling required in portrait orientation

---

## Future Enhancements for Tablet

Potential additions based on usage:

- [ ] Quick timestamp insertion button
- [ ] Voice memo attachment
- [ ] Drawing/diagram support
- [ ] Session templates with pre-filled forms
- [ ] Client photo for quick visual identification
- [ ] Split-screen mode (previous session on left, current notes on right)

---

**Last Updated:** December 2025
