# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Application name: Therapy Docs

A psychotherapy document management application for mental health professionals. Frontend-only application built with Alpine.js + Tailwind CSS v4, designed for tablet use during therapy sessions with stylus/handwriting input. Features AI-powered narrative generation for progress notes via AWS Bedrock.

**Primary Use Case:** Therapist uses tablet in portrait mode during sessions to select clients, review previous session notes, fill out structured forms, and take handwritten notes.

**Multi-user Support:** Role-based access control with three roles:
- `sysadmin` - Full system access, can manage all users
- `admin` - Can manage supervisors, full app access
- `supervisor` - View-only access for clinical supervisors

## Code Style

- Use four spaces for indentation, except in yaml files

## Development Commands

### CSS Build
```bash
# Development - watches for changes
npm run dev

# Production build - minified
npm run build
```

### Local Server
```bash
# Python
python -m http.server 8080

# Node
npx http-server -p 8080
```

Then open `http://localhost:8080`

### Development Workflow
1. Terminal 1: `npm run dev` (watches Tailwind CSS)
2. Terminal 2: Local server
3. Browser: Hard refresh (Cmd+Shift+R) for CSS changes

## Architecture

### Mock API System

**Critical Architecture Decision:** The entire application works with OR without a real backend.

```javascript
// config.js
const config = {
  useMockAPI: true  // Toggle between mock and real AWS
};
```

**How it works:**
- `api.js` contains BOTH mock and real implementations for every endpoint
- `mockData.js` provides realistic test data (7 clients with unified documents)
- All clinical data uses unified documents model (see "Unified Documents Architecture" below)
- Mock functions simulate network delays (600-1200ms)
- No code changes needed to switch - just flip `config.useMockAPI`

**When to use:**
- Development: `useMockAPI: true` - no AWS infrastructure needed
- Production: `useMockAPI: false` - calls real AWS Lambda endpoints

### Testing Different User Roles

Two config options exist for testing role-based behavior:

**`mockRole`** - For mock API testing (frontend-only)
```javascript
// js/config.js
const config = {
  useMockAPI: true,
  mockRole: 'supervisor'  // 'sysadmin' | 'admin' | 'supervisor'
};
```
This only affects frontend UI/permissions. The mock API returns the same data regardless of role.

**`testRole`** - For local backend testing (real API)
```javascript
// js/config.js
const config = {
  useMockAPI: false,
  testRole: 'supervisor'  // 'sysadmin' | 'admin' | 'supervisor'
};
```
This adds an `X-Test-Role` header to all API requests. The local backend (SAM) uses this to simulate role-based authorization, including data filtering/redaction.

| Role | Backend Behavior |
|------|-----------------|
| `admin` | Full access (default) |
| `supervisor` | Full clinical access, no user management |
| `sysadmin` | PHI redacted, writes blocked |

**Note:** Auth token handling in development mode (how `autoLogin()` interacts with API calls) is actively evolving. If you encounter auth-related issues (e.g., `Bearer null`, 403 errors), check with the backend team or consult recent changes to `app.js` and `api.js`.

### ES Modules Architecture

The codebase uses ES modules with explicit imports/exports. Each HTML page loads a single entry point module that imports its dependencies.

**Entry Point Pattern:**
```html
<!-- Alpine.js Plugins (if needed) -->
<script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
<!-- Alpine.js -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
<!-- Application Entry Point (ES Module) -->
<script type="module" src="js/entries/{page}.entry.js"></script>
```

**Entry Point Files** (`js/entries/`):
| HTML Page | Entry Point | Alpine Data |
|-----------|-------------|-------------|
| `index.html` | `login.entry.js` | `loginApp` |
| `documents.html` | `documents.entry.js` | `app` |
| `clients.html` | `clients.entry.js` | `clientsDashboard` |
| `clients-archived.html` | `clients-archived.entry.js` | `clientsArchived` |
| `users.html` | `users.entry.js` | `usersApp` |
| `settings.html` | `settings.entry.js` | `settingsApp` |
| `interventions.html` | `interventions.entry.js` | `myInterventions` |

**Module Dependency Layers:**
1. **Foundation** - `config.js`, `constants.js`, `narrativeDefaults.js` (no dependencies)
2. **Logger** - `logger.js` (imports config)
3. **Utilities** - `dateUtils.js`, `mockData.js` (imports logger/config)
4. **Storage** - `draftStorage.js`, `interventionLibrary.js`
5. **API** - `api.js` (imports config, logger, mockData)
6. **Auth** - `authGuard.js` (imports config, logger, API, mockData)
7. **Components** - `js/components/*.js` (import logger)
8. **Page Apps** - `app.js`, `clientsDashboard.js`, etc. (import everything needed)

**Window Assignments for Alpine Templates:**
Some modules assign to `window` so Alpine templates can reference them:
- `window.config` - Feature flags in templates
- `window.Logger` - Debug logging
- `window.DateUtils` - Date formatting in `x-text`
- `window.DraftStorage` - Draft management
- `window.API` - API calls from templates
- `window.AuthGuard` - Logout buttons, auth checks

### Page Architecture

The application uses a separate login page pattern:

- **`index.html`** - Login page (unauthenticated entry point)
  - Uses `js/login.js` for authentication flow
  - Redirects to `documents.html` after successful login
  - In debug mode, redirects immediately to `documents.html`

- **`documents.html`** - Main documents page (authenticated)
  - Uses `js/app.js` for application logic
  - Auth check via `AuthGuard.checkAuth()` on init
  - Redirects to `index.html` if not authenticated

- **Secondary pages** (clients.html, settings.html, etc.)
  - Each has its own Alpine app
  - Uses `AuthGuard.checkAuth()` on init
  - All use `AuthGuard.logout()` for sign out

### Data Flow

```
User Action (Alpine.js directive)
  ↓
app.js method (async function)
  ↓
API.method() (routes to mock or real based on config)
  ↓
If mock: mockData.js → simulate delay → return data
If real: fetch() to AWS → return JSON
  ↓
app.js updates reactive state
  ↓
UI automatically updates (Alpine reactivity)
```

### State Management

Alpine.js handles all state. Page apps export factory functions that are registered via `Alpine.data()`:

```javascript
// js/app.js - Export factory function
export function createAppData() {
    return {
        // STATE (reactive)
        authenticated: false,
        userRole: '',              // 'sysadmin' | 'admin' | 'supervisor'
        clients: [],
        selectedClient: '',
        currentNote: { date, duration, notes },

        // METHODS (bound to state)
        async submitNote() {
            const result = await API.saveNote(...);
            this.showToast('success');  // State update triggers UI update
        }
    }
}

// js/entries/documents.entry.js - Register with Alpine
document.addEventListener('alpine:init', () => {
    Alpine.data('app', createAppData);
});
```

**Key pattern:** Factory functions exported from page modules, registered via `Alpine.data()` in entry points. HTML uses `x-data="app"` (without parentheses) to bind to registered data.

### Unified Documents Architecture

All clinical documentation uses a unified documents model. Instead of separate collections for sessions, diagnoses, treatment plans, etc., everything is stored in a single `documents` collection indexed by client ID.

**Document Types:**
- `progress_note` - Session notes (formerly "sessions")
- `diagnosis` - Clinical diagnoses
- `treatment_plan` - Treatment plans
- `intake` - Intake assessments
- `consultation` - Initial consultations
- `discharge` - Discharge summaries

**Document Structure:**
```javascript
{
  id: 'doc-{type}-{timestamp}-{uniqueId}',
  documentType: 'progress_note',  // One of the types above
  clientId: 'client-001',
  date: '2025-01-10',             // Document date (top-level, NOT in content)
  status: 'complete',             // Type-specific (draft/complete/amended, provisional/active/resolved, etc.)
  content: { ... },               // Type-specific clinical fields ONLY
  createdAt: '2025-01-10T15:30:00Z',
  updatedAt: '2025-01-10T15:30:00Z'
}
```

**Important:** `date` and `status` are always top-level fields. The `content` object contains only type-specific clinical data (e.g., `icd10Code` for diagnoses, `notes` for progress notes). See `API_CONTRACT.md` for complete field specifications.

**Key Methods in mockData.js:**
- `getDocuments(clientId, type?, status?)` - Get all documents, optionally filtered
- `getDocument(clientId, documentId)` - Get single document
- `createDocument(clientId, documentType, content, status?)` - Create new document
- `updateDocument(clientId, documentId, updates)` - Update document
- `deleteDocument(clientId, documentId)` - Delete document
- `getCompletedFormTypes(clientId)` - Compute form types from documents

**Key Methods in api.js:**
- `API.getClientDocuments(clientId, type?, status?)` - Fetch documents
- `API.createDocument(clientId, documentType, content)` - Create document
- `API.updateDocument(clientId, documentId, updates)` - Update document
- `API.deleteDocument(clientId, documentId)` - Delete document
- `API.getCompletedFormTypes(clientId)` - Get completed form types

**app.js Integration:**
- `clientDocuments` state holds all documents for selected client
- `selectedClientCompletedForms` getter computes form types from `clientDocuments`
- `loadClientContextInternal()` fetches documents along with context data

## Design System

### IMPORTANT: Check Existing Components First

**Before implementing ANY UI element, check if it already exists:**

1. **Quick reference:** `docs/COMPONENTS.md` - scannable list of all available components
2. **Interactive examples:** `component-library.html` - open in browser for visual examples with copy-to-clipboard code
3. **CSS index:** Top of `styles/input.css` - complete component index with categories

**If a component doesn't exist**, add it to the component system rather than using one-off Tailwind classes. This ensures consistency and reusability.

### Component Classes (Never use raw Tailwind for common patterns)

**Buttons:** (always use `btn` base class + variant)
- `btn btn-primary` - Burnt orange, main actions (Save, Submit)
- `btn btn-secondary` - Neutral gray, secondary actions (Cancel)
- `btn btn-danger` - Warm red, destructive actions (Delete)
- `btn btn-success` - Warm green, confirmations
- `btn btn-ghost` - Transparent, tertiary actions
- `btn-sm` / `btn-lg` - Size modifiers
- `btn-icon` - Icon-only buttons (40x40px)
- **Buttons with icons + text:** Wrap content in `<span class="flex items-center">` for vertical alignment

**Cards:**
- `card` - Standard container (white bg, shadow, border)
- `card-compact` - Tighter padding variant
- `card-header` / `card-body` / `card-footer` - Sectioned cards

**Forms:**
- `form-input` - Text inputs (48px height, tablet-optimized)
- `form-textarea` - Textareas (optimized for handwriting recognition)
- `form-select` - Dropdowns
- `form-label` - Labels
- `form-checkbox` / `form-radio` - Traditional checkboxes/radios
- `btn-checkbox` / `btn-checkbox-group` - **Button-style checkboxes for multiple selection (tablet-optimized)**
- `btn-radio` / `btn-radio-group` - **Button-style radios for single selection (tablet-optimized)**
- `segmented-control` - **Binary/ternary toggles (Edit/Preview, Yes/No)**

**Alerts:**
- `alert-success` / `alert-error` / `alert-warning` / `alert-info`

**Navigation:**
- `menu-item` - Navigation menu items (56px height)
- `hamburger-btn` - Menu toggle button (48x48px)
- `modal-close-btn` - Close button for modals/panels
- `drawer` - Slide-out navigation drawer

**Utilities:**
- `<blob-spinner>` - SMIL-animated loading spinner (Web Component, see Icons section)
- `divider` - Horizontal separator
- `highlight-flash` - Attention animation

### Color Palette

**NOT using Tailwind defaults.** All colors custom-defined for a professional healthcare aesthetic:

- **Primary:** Burnt orange (`#d4967d`) - Main action buttons
- **Secondary:** Sage green (`#495a58`) - Secondary actions
- **Neutral:** White (`#ffffff`) + Cream (`#dcd9d0`) - Backgrounds
- **Text:** Dark sage (`#3f4a49`) - Primary text (warm, not harsh black)

**Semantic colors** (success/danger/warning) use warm earth tones to harmonize with brand.

See `docs/COLOR_PALETTE.md` for complete palette with rationale.

### Tablet Optimization

**Critical Context:** App designed for tablet portrait mode during therapy sessions.

**Touch targets:** Minimum 48x48px for all interactive elements:
- Buttons: 48px min-height
- Form inputs: 48px min-height
- Checkboxes/radios: 20x20px (1.25rem)
- Button checkboxes/radios: 48px min-height (optimized for stylus)

**Better UX than dropdowns:**
- Use `btn-checkbox` for multiple selections (symptoms, treatments)
- Use `btn-radio` for single selections (mood, severity level)
- Shows all options inline - no need to open dropdown menus
- Easier to tap with stylus than small dropdown arrows

**Layout features:**
- Sticky client selector (always visible at top)
- Collapsible previous session summary (save vertical space)
- Container expands to 95% width in tablet portrait (768-1024px)
- Handwriting recognition support (1.6 line-height, 16px min font size)

**CSS media queries:**
```css
/* Primary use case */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .container-narrow { max-width: 95%; }
}

/* Secondary use case */
@media (orientation: landscape) { ... }
```

See `docs/TABLET_USAGE.md` for complete tablet UX considerations.

## Backend Integration

### Switching from Mock to Real AWS

1. Update `js/config.js`:
   ```javascript
   const config = {
     apiEndpoint: 'https://your-api-gateway.amazonaws.com/prod',
     region: 'us-east-1',
     userPoolId: 'us-east-1_XXXXXXXXX',
     userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
     features: { ... },
     useMockAPI: false  // <-- Change this
   };
   ```

2. No code changes needed - API layer automatically switches.

### Expected AWS Endpoints

Backend must implement these endpoints (see `api.js` for full interface):

```
Authentication:
  POST /auth/login              → { requiresMFA, requiresMFASetup, session }
  POST /auth/mfa                → { token, user }
  POST /auth/logout             → { success }

MFA Setup (session-based for first login, JWT for existing users):
  GET  /auth/mfa/status         → { mfaEnabled }
  POST /auth/mfa/setup          → { secretCode, qrCodeUrl, session }
  POST /auth/mfa/verify-setup   → { success, token, user }

Admin User Management (admin+ only):
  GET    /admin/users                   → { users: [...] }
  POST   /admin/users/invite            → { success, user }
  PUT    /admin/users/{id}/role         → { success }
  DELETE /admin/users/{id}              → { success }
  POST   /admin/users/{id}/reset-mfa    → { success }

Clients:
  GET    /clients           → [{ id, name, initials, status, ... }]
  GET    /clients/{id}      → { id, name, ... }
  POST   /clients           → { id, name, ... }

Unified Documents:
  GET    /clients/{id}/documents              → [{ id, documentType, content, ... }]
  GET    /clients/{id}/documents/{docId}      → { id, documentType, content, ... }
  POST   /clients/{id}/documents              → { id, documentType, content, ... }
  PATCH  /clients/{id}/documents/{docId}      → { id, documentType, content, ... }
  DELETE /clients/{id}/documents/{docId}      → { success: true }

Legacy Session Endpoints (use unified documents internally):
  GET /clients/{id}/sessions      → [{ id, date, notes, narrative, ... }]
  GET /clients/{id}/sessions/last → { id, date, narrative, ... } or null

Diagnoses (use unified documents internally):
  GET  /clients/{id}/diagnoses         → [{ id, icd10Code, description, ... }]
  GET  /clients/{id}/diagnoses/current → { id, icd10Code, ... } or null
  POST /clients/{id}/diagnoses         → { id, icd10Code, ... }
  PATCH /clients/{id}/diagnoses/{id}   → { id, icd10Code, ... }

Notes:
  POST   /notes    → { note: {...} }
  PUT    /notes/{id}
  DELETE /notes/{id}

AI:
  POST /ai/narrative → { narrative: "..." }  (generates prose from structured note)
```

**Authorization:** All requests include `Authorization: Bearer ${token}` header (except MFA setup during first login, which uses session in request body).

## Common Modifications

### Adding New Form Fields

1. Add to `mockData.js` unified documents (in the `content` object of relevant document type)
2. Update `api.js` mock implementation if needed
3. Update `app.js` state (`currentNote` object for progress notes)
4. Add form fields to `documents.html` with `x-model` binding
5. Style with `form-input`, `form-select`, etc. component classes

### Adding New API Endpoints

1. Add mock implementation to `api.js`:
   ```javascript
   // api.js already imports: config, Logger, mockData
   async newMethod() {
       if (config.useMockAPI) {
           await this._mockDelay(400);
           return mockData.someData;
       }
       // Real implementation
       const response = await fetch(`${config.apiEndpoint}/new-endpoint`, {
           headers: { 'Authorization': `Bearer ${token}` }
       });
       return response.json();
   }
   ```

2. Call from page app (API is already imported via entry point chain):
   ```javascript
   // In app.js, users.js, etc. - API is available via import
   async handleAction() {
       try {
           const result = await API.newMethod();
           this.stateProperty = result;
       } catch (error) {
           this.errorMessage = error.message;
           this.showToast('error');
       }
   }
   ```

### Adding New Components

1. Add to `styles/input.css` under `@layer components`:
   ```css
   .component-name {
     /* Styles using Tailwind utilities or custom CSS */
   }
   ```

2. Document in `docs/DESIGN_SYSTEM.md` with usage examples

3. Add example to `component-library.html` for reference

### Adding New Pages

1. Create page app in `js/newpage.js`:
   ```javascript
   import { API } from './api.js';
   import { AuthGuard } from './authGuard.js';
   // ... other imports

   export function createNewPageData() {
       return {
           // Spread component data
           ...NavDrawer.alpineData,

           // Page state
           loading: true,

           // Methods
           async init() {
               await AuthGuard.checkAuth();
               // ...
           }
       };
   }
   ```

2. Create entry point in `js/entries/newpage.entry.js`:
   ```javascript
   import { NavDrawer } from '../components/drawer.js';
   import { createNewPageData } from '../newpage.js';

   NavDrawer.init({ activePage: 'newpage', showUserInfo: true });

   document.addEventListener('alpine:init', () => {
       Alpine.data('newPage', createNewPageData);
   });
   ```

3. Create HTML file with module script:
   ```html
   <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
   <script type="module" src="js/entries/newpage.entry.js"></script>
   ...
   <body x-data="newPage" x-init="init()">
   ```

## Important Files

### Must Read Before Changes

- `docs/DESIGN_SYSTEM.md` - Complete design guidelines, component usage, color palette
- `docs/COLOR_PALETTE.md` - Exact brand colors with hex codes
- `docs/TABLET_USAGE.md` - Tablet UX requirements and optimizations
- `docs/API_CONTRACT.md` - **Symlink to backend repo** (canonical version in backend)
- `README.md` - Setup instructions, mock/real API toggle

### Configuration

- `js/config.js` - **Gitignored** - Active configuration (update this for environment)
- `js/config.example.js` - Template for configuration

### Core Application

- `index.html` - Login page (unauthenticated entry point)
- `documents.html` - Main documents page, Alpine.js directives
- `js/entries/*.entry.js` - **ES module entry points** (one per HTML page)
- `js/login.js` - Login page authentication logic
- `js/app.js` - Main application state and business logic
- `js/authGuard.js` - Shared authentication utilities
- `js/api.js` - API abstraction layer (mock + real)
- `js/mockData.js` - Development test data (unified documents model)
- `js/components/*.js` - Shared UI components (drawer, modals, toast)

### Additional Pages

- `users.html` + `js/users.js` - Admin user management (invite, roles, MFA reset)
- `settings.html` + `js/settings.js` - User preferences
- `clients.html` + `js/clientsDashboard.js` - Client list/dashboard
- `interventions.html` + `js/myInterventions.js` - Intervention & approach management (favorites, hidden, custom)

### Deployment

- `notes/deployment_notes/` - AWS deployment documentation (initial user setup, etc.)

### Styling

- `styles/input.css` - Tailwind v4 config + component classes
- `dist/output.css` - Compiled CSS (generated, don't edit)

### Documentation/Reference

- `component-library.html` - Interactive component showcase

## Git Workflow

### Gitignored Files

- `dist/` - Generated CSS (though currently committed)
- `js/config.js` - Environment-specific configuration
- `node_modules/` - NPM dependencies

### Key Branches

- `dev` - Primary development branch
- `main` - Production branch

### Staging and Committing

- Never do `git add -A` without first confirming that all the changes you are about to stage are what you also intend to commit.
- Always make logically contained commits as you complete your work, unless:
    - Something is highly experimental
    - The user has asked you not to commit anything in your upcoming work
    - You need user input or feedback on an implementation before choosing a development path to go down
    - All file(s) with changes are gitignored
- **Never use `git checkout <ref> -- <file>` to separate commits** - it discards working directory changes. Instead use `git add -p` for selective staging, or `git show <ref>:<file>` to view clean versions without overwriting.

### Commit Messages

- Never include "Generated with Claude Code" or similar AI attribution
- Never include "Co-Authored-By" headers for AI assistants
- Write clear, conventional commit messages focused on the change itself
- Always use conventional commit tagging

### Release Process

**Tags only on main branch.** Work on `dev`, release from `main`.

**Current workflow (no CI tests yet):**
1. Complete work on `dev` branch
2. Merge to main: `git checkout main && git merge dev`
3. Run: `npm run release`
4. Push with tags: `git push --follow-tags`
5. Switch back to dev: `git checkout dev && git merge main`

**Future workflow (when CI tests exist):**
Once GitHub Actions runs tests before deploy, switch to PR-based merges:
1. Create PR: `dev` → `main`
2. CI runs tests - merge blocked if tests fail
3. Merge PR
4. On main: `npm run release && git push --follow-tags`

**Claude reminder:** When CI tests are added to this repo, remind the user to update this section to use the PR workflow instead of direct merge.

**What `npm run release` does automatically:**
- Bumps version in `package.json` based on commit types
- Generates/updates `CHANGELOG.md`
- Creates git commit and tag (e.g., `v0.2.0`)

**Version bump rules:**
- `fix:` → patch (0.1.0 → 0.1.1)
- `feat:` → minor (0.1.0 → 0.2.0)
- `BREAKING CHANGE:` in commit footer → major (0.1.0 → 1.0.0)

**API Contract versioning:**
- Bump `API_CONTRACT.md` version manually for breaking API changes
- This is rare and intentional; coordinate with backend team

**Backward compatibility:**
- Prefer additive changes (new optional fields, new endpoints)
- Frontend should handle old + new data formats gracefully
- Only write migration scripts when unavoidable

**Claude reminder:** When the user merges to `main` or mentions releasing/deploying, remind them: "Ready to release? On main: `npm run release`, then `git push --follow-tags`"

## Architecture Decision Records (ADRs)

ADRs document important architectural decisions. See `docs/adr/README.md` for full guidance.

**When to write an ADR:**
- Security implications (auth, data exposure, encryption)
- Trade-offs where you chose one approach over another
- Hard-to-reverse decisions
- Anything an auditor might question

**Creating an ADR:**
1. Copy template from `docs/adr/README.md`
2. Create `docs/adr/NNN-title-with-dashes.md`
3. Update the index in the README
4. Commit: `docs: Add ADR-NNN <title>`

## Icons

**IMPORTANT:** Never add icon library CDN links (Font Awesome, Phosphor, etc.). All icons use local SVG sprites.

### Icon System

Icons use SVG sprites from `assets/icons/tabler-sprites.svg`:

```html
<svg class="icon"><use href="./assets/icons/tabler-sprites.svg#icon-id"></use></svg>
<svg class="icon icon-lg"><use href="./assets/icons/tabler-sprites.svg#icon-id"></use></svg>
```

Size classes: `icon-xs`, `icon-sm`, `icon` (default), `icon-lg`, `icon-xl`, `icon-2xl`

### Adding New Icons

The sprite file contains a curated subset of [Tabler Icons](https://tabler.io/icons). If you need an icon that isn't in the sprite file:

1. Ask the user to add it: "Could you add the `icon-name` icon from Tabler to tabler-sprites.svg?"
2. Do NOT add CDN links or inline SVGs as a workaround
3. Wait for confirmation before using the new icon

### Loading Spinner

The `<blob-spinner>` Web Component provides an animated spinner:

```html
<blob-spinner></blob-spinner>
<blob-spinner class="icon-lg text-primary-600"></blob-spinner>
```

Requires `Spinner.init()` in the entry file (already configured for all pages).

## External Dependencies

- **Alpine.js 3.x** - Via CDN (`https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js`)
- **Tailwind CSS v4** - Via CLI (`@tailwindcss/cli`)
- **Tabler Icons** - Local SVG sprites (`assets/icons/tabler-sprites.svg`)
- **Atkinson Hyperlegible font** - Via Google Fonts

**Note:** Minimal dependencies by design. No bundler, no complex build process.

## Common Pitfalls

1. **Don't modify `dist/output.css` directly** - Edit `styles/input.css` and rebuild
2. **Don't use raw Tailwind classes for buttons/cards** - Use component classes
3. **Use `x-data="app"` not `x-data="app()"`** - With `Alpine.data()` registration, no parentheses needed
4. **Don't use `x-init="init()"` with `Alpine.data()` components** - Alpine automatically calls `init()` when a component registered via `Alpine.data()` is initialized. Adding `x-init="init()"` causes the init method to run twice, resulting in duplicate API calls and degraded performance.
5. **Don't forget `await` on API calls** - All API methods are async
6. **Don't hardcode colors** - Use semantic color tokens (`primary-*`, `neutral-*`, etc.)
7. **Don't forget window assignments** - If Alpine templates reference a module (e.g., `DateUtils.format()`), ensure it's assigned to `window`
8. **Don't forget touch target minimums** - 48px for tablet use
9. **Don't add new page scripts without entry points** - All JS loads through `js/entries/*.entry.js`
10. **Use `x-cloak` for initially-hidden elements, not inline styles** - Elements with `x-show="false"` initially will flash briefly before Alpine processes them (FOUC). Add `x-cloak` attribute to hide them immediately. The `[x-cloak] { display: none !important; }` rule **must be in an inline `<style>` tag** in the `<head>`, not in external CSS, so it's parsed before the page renders.
11. **Wrap button icon+text content in flex container** - Buttons containing both icons and text need `<span class="flex items-center">` wrapper for proper vertical alignment. Without it, icons may appear misaligned with the text.

## When to Use Web Search

Use web search when encountering issues that are likely caused by framework-specific behavior, browser quirks, or tool configuration that isn't documented in the codebase:

- **Alpine.js edge cases** - Reactivity gotchas, directive behavior, lifecycle timing issues
- **Tailwind CSS v4 specifics** - New v4 syntax, migration issues from v3, utility edge cases
- **Browser APIs and compatibility** - Fetch, SSE/streaming, IndexedDB, Web Crypto, touch events
- **CSS/styling issues** - Cross-browser rendering, Safari-specific bugs, viewport units on mobile
- **Build tool problems** - npm/node version issues, Tailwind CLI configuration
- **When a fix doesn't work as expected** - If documentation or intuition says something should work but it doesn't, search for known issues

**Key insight:** If you've tried the obvious fix and it's not working, there's likely a framework-specific gotcha or known issue. Web search often finds the answer faster than continued debugging.

## Backend Repository Integration

Backend repository exists at `../TherapyDocsBackend` with:
- AWS SAM (Serverless Application Model)
- Python Lambda functions
- DynamoDB for storage
- Cognito for authentication
- API Gateway HTTP API
- Bedrock integration for AI summaries
- LocalStack for local development

**Scope:** This agent is responsible for the **frontend repository only**. A separate agent handles the backend repo. You may write notes to the backend team (see Communication Between Repos), but never commit to or modify backend files directly.

### API Contract (Symlinked)

**Important:** `API_CONTRACT.md` in this repo is a **symlink** to the backend version:
- Canonical file: `../TherapyDocsBackend/API_CONTRACT.md`
- Frontend symlink: `./API_CONTRACT.md`
- Always in sync - no need to copy/paste
- Backend makes API changes, frontend automatically sees them

### Switching from Mock to Real API

1. Backend deploys to LocalStack or AWS
2. Get API endpoint URL from backend team
3. Update `js/config.js`:
   ```javascript
   const config = {
     useMockAPI: false,  // Switch to real backend
     apiEndpoint: 'http://localhost:4566/restapis/{API_ID}/dev/_user_request_'
   };
   ```
4. Test integration

This frontend is ready to connect - just flip the config switch.

### Communication Between Repos

**How it works:**
- `API_CONTRACT.md` - Shared API specification (symlinked)
- `notes/NOTES_FROM_BACKEND.md` - Backend team writes messages to frontend here (in this repo)
- `../TherapyDocsBackend/notes/NOTES_FROM_FRONTEND.md` - Frontend team (YOU) writes messages to backend there (in backend repo)

#### Communication Policy

**Simple Rules:**
1. **Always read lines 1-35 of notes/NOTES_FROM_FRONTEND.md before writing to it** - These lines tell you exactly what you need to know about the structure of the file and where to write your message
    1. These lines will instruct you to **add new messages after the comment that says "ADD NEW MESSAGES IMMEDIATELY BELOW THIS COMMENT"** - Most recent first
2. **Use date headers with a brief note about message type and topic** - `## December 14, 2025 (Request - ...)` or `## December 14, 2025 (Update - ...)`
3. **Maintain a clear hierarchy** - Use a level 2 heading for the message date; do not use level 2 headings anywhere else in your message
4. **Respond in the other team's file** - Frontend responds in notes/NOTES_FROM_FRONTEND.md, backend responds in notes/NOTES_FROM_BACKEND.md
5. **Be conversational** - No formal templates other than the high-level template specified in the notes file, just communicate clearly
6. **Be purposeful and relevant** - Only share information that is relevant for the backend team; do not add irrelevant content or context
7. **Archive when it gets long** - If file exceeds 300 lines, move old stuff to archive section at bottom

**Example:**
```markdown
## December 15, 2025 (Update - Client Search)

### Backend: Client Search Endpoint Ready

Implemented GET /clients/search?q=name
- Case-insensitive partial matching
- Returns array of client objects

Let me know if you need any changes!

---

## December 14, 2025 (Request - Client Search)

### Frontend: Request for Client Search

Would be helpful to have a search endpoint for clients. Can you add one?

Use case: Therapist has 50+ clients, dropdown is getting unwieldy.
```
