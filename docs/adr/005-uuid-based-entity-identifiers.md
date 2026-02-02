# ADR-005: UUID-Based Entity Identifiers

## Status

Accepted

## Context

The application generates identifiers for documents (progress notes, diagnoses, etc.) and clients. These identifiers are stored in the database, referenced in URLs, logged, and may appear in exports or audit trails.

**Previous approach:**
- **Documents**: Generated as `doc-{type}-{timestamp}-{random3digits}` (e.g., `doc-progress_note-1704067200000-847`)
- **Clients**: Generated as `{name}-{date}` (e.g., `john-smith-20260105`)

**Problems identified:**

1. **PHI in client identifiers**: Client IDs contained the client's name, which is Protected Health Information (PHI). This meant PHI appeared in:
   - Database keys
   - API URLs (`/clients/john-smith-20260105/documents`)
   - Log files
   - Browser history

2. **No draft-to-document continuity**: Documents created from drafts received new IDs upon save. If a network retry occurred, duplicate documents could be created with different IDs.

3. **Predictable/enumerable**: Both formats were somewhat predictable, potentially enabling enumeration attacks.

4. **Inconsistent patterns**: Different ID formats for different entity types made the system harder to reason about.

## Decision

Use UUIDs (`crypto.randomUUID()`) for all entity identifiers:

**Documents:**
- Frontend generates UUID when a draft is initialized
- Same UUID is passed to backend when saving
- Backend uses the provided UUID as the document ID
- Backend returns 409 Conflict if UUID already exists (idempotent saves)

**Clients:**
- Frontend generates UUID when creating a client
- UUID is passed to backend in the request body
- Backend uses the provided UUID as the client ID
- Backend returns 409 Conflict if UUID already exists

**Storage structure:**
- Drafts: `draft_{uuid}` in localStorage
- Draft index: `draft_index_{clientId}` contains array of UUIDs
- Documents and clients: UUID as primary key in DynamoDB

## Consequences

**Positive:**
- **No PHI in identifiers**: UUIDs are random and contain no client information
- **Idempotent operations**: Network retries won't create duplicates (same UUID = same document)
- **Draft continuity**: Documents retain their draft UUID, enabling tracking through the full lifecycle
- **Consistent pattern**: All entities use the same ID format
- **Unguessable**: 128-bit entropy makes enumeration infeasible
- **Amendment support**: Stable IDs enable `amendmentOf` references between documents

**Negative:**
- **Less readable in logs**: `550e8400-e29b-41d4-a716-446655440000` vs `john-smith-20260105`
- **Longer IDs**: 36 characters vs ~20 characters (minimal storage impact)
- **Client-generated IDs**: Requires trust that client generates valid UUIDs (mitigated by server-side validation)

**Neutral:**
- No migration needed (no production data exists)
- Backend changes required to accept optional `id` field
