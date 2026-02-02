# ADR-003: Multi-page Architecture with Alpine.js

## Status

Accepted

## Context

The application needs to support:
- Session notes form (primary use case)
- Client management
- User management (admin)
- Settings
- Login/authentication

Options considered:
1. **Single-page application (SPA)** with client-side routing (React, Vue, etc.)
2. **Multi-page application (MPA)** with separate HTML files and lightweight JS

The primary user is a therapist using an iPad during sessions. Key requirements:
- Fast initial load
- Works reliably on tablet
- Simple deployment (static files to S3/CloudFront)
- Minimal build complexity

## Decision

Use a multi-page architecture with Alpine.js for interactivity:

- Separate HTML files: `index.html` (login), `documents.html` (notes), `clients.html`, `settings.html`, `users.html`
- Alpine.js for reactive UI within each page
- Tailwind CSS for styling
- No client-side router
- No complex build process (just Tailwind CLI)

Each page has its own Alpine.js app with page-specific logic, plus shared components (drawer, modals) injected via JavaScript.

## Consequences

**Positive:**
- Simple mental model (each page is self-contained)
- Fast initial page load (no large JS bundle)
- Easy deployment (static files)
- No complex build tooling (no Webpack, no bundler)
- Browser back/forward works natively
- Each page can be cached independently

**Negative:**
- Full page reload on navigation (acceptable for this use case)
- Some code duplication across pages (mitigated by shared components)
- No client-side state persistence across pages (mitigated by localStorage)
- Less "app-like" feel compared to SPA

**Trade-off accepted:** The simplicity and reliability benefits outweigh the UX trade-offs for this tablet-focused therapy application.
