# Architecture Decision Records

This directory contains Architecture Decision Records (ADRs) for the Therapy Docs frontend application.

## What is an ADR?

An ADR is a document that captures an important architectural or design decision along with its context and consequences. ADRs help future developers (and auditors) understand *why* the system was built a certain way.

## When to Write an ADR

**Write an ADR when the decision:**

- **Has security implications** - Authentication methods, data exposure, encryption choices
- **Involves trade-offs** - You chose option A over B, and someone might later ask "why not B?"
- **Is hard to reverse** - Changing it later would require significant rework
- **Affects multiple parts of the system** - Cross-cutting concerns, shared patterns
- **Might be questioned during an audit** - Compliance, data handling, third-party dependencies
- **Deviates from convention** - Doing something unusual that needs explanation
- **Was the subject of debate** - If the team discussed multiple approaches, document why you chose this one

**Do NOT write an ADR for:**

- Routine implementation details (variable names, file organization within established patterns)
- Bug fixes (unless the fix reveals a design flaw that led to a new decision)
- Minor refactoring that doesn't change behavior or architecture
- Following existing patterns already documented elsewhere
- Obvious choices with no realistic alternatives
- Easily reversible decisions (you can just change it if needed)

**Rule of thumb:** If a new developer would look at the code and ask "why did they do it this way instead of the obvious way?" — that's worth an ADR.

## Format

Each ADR follows this structure:

- **Title**: Short noun phrase (e.g., "Client-side QR Code Generation")
- **Status**: Proposed | Accepted | Deprecated | Superseded
- **Context**: What forces are at play? What is the problem?
- **Decision**: What is the change we're making?
- **Consequences**: What are the positive and negative results?

## Index

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [001](001-client-side-qr-code-generation.md) | Client-side QR Code Generation | Accepted | 2025-12-20 |
| [002](002-user-info-storage-in-localstorage.md) | User Info Storage in localStorage | Accepted | 2025-12-20 |
| [003](003-multi-page-architecture.md) | Multi-page Architecture with Alpine.js | Accepted | 2025-12-20 |
| [004](004-cloudfront-security-headers.md) | CloudFront Security Headers | Accepted | 2025-12-23 |
| [005](005-uuid-based-entity-identifiers.md) | UUID-Based Entity Identifiers | Accepted | 2026-01-05 |
| [006](006-progress-note-edit-mode-setting.md) | Progress Note Edit Mode Setting | Accepted | 2026-01-05 |
| [007](007-client-side-caching-with-session-storage.md) | Client-Side Caching with Session Storage | Accepted | 2026-01-05 |

## Creating a New ADR

1. Copy the template below
2. Create a new file: `NNN-title-with-dashes.md`
3. Fill in the sections
4. Add to the index above
5. Commit with message: `docs: Add ADR-NNN <title>`

## Template

```markdown
# ADR-NNN: Title

## Status

Proposed | Accepted | Deprecated | Superseded by [ADR-XXX](XXX-filename.md)

## Context

What is the issue that we're seeing that is motivating this decision or change?

## Decision

What is the change that we're proposing and/or doing?

## Consequences

What becomes easier or more difficult to do because of this change?
```
