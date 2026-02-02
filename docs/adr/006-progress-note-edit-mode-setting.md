# ADR-006: Progress Note Edit Mode Setting

## Status

Accepted

## Context

Clinical documentation standards vary based on practice setting and regulatory requirements:

- **Personal/Development use**: Direct editing of notes is convenient and acceptable
- **Official clinical records**: HIPAA and clinical best practices often require that original documentation be preserved, with changes tracked as amendments

The application needed to support both workflows without requiring code changes or feature flags.

**Key considerations:**

1. **Clinical compliance**: When maintaining official records, original documentation should never be altered. Changes must be traceable amendments with documented reasons.

2. **Audit trail**: Auditors and supervisors may need to see what was originally documented vs. what was amended and why.

3. **Usability**: During development or for personal use, requiring amendments for every typo fix would be cumbersome.

4. **Simplicity**: Storing edit mode per-document would complicate the data model and UI. A global setting is simpler and matches clinical reality (when you switch to "official records mode," ALL documents should follow that policy).

## Decision

Implement a user-configurable **Edit Mode** setting with two options:

**Direct Edit** (default):
- Progress notes can be edited in place
- Changes overwrite original content
- Suitable for development and personal use

**Amendment Required**:
- Editing creates a new amendment document
- Original document is preserved unchanged
- User must provide an amendment reason
- Amendment includes: `amendmentOf` (parent ID), `amendmentReason`, `amendmentDate`

**Key design choices:**

1. **Setting-based, not per-document**: The edit mode is determined by the current setting at edit time, NOT stored with each document. This means:
   - Switching to "Amendment Required" makes ALL future edits create amendments
   - This matches clinical workflow (when going "official," everything should be official)
   - Simpler data model (no per-document mode flags)

2. **Amendments are complete documents**: Amendments contain a full snapshot of the note, not a diff. This ensures:
   - Each version is independently readable
   - No need to reconstruct state by applying diffs
   - Simpler implementation and data model

3. **Amendment chains via references**: Amendments link to their parent via `amendmentOf`. Multiple amendments create a chain: original → amendment1 → amendment2.

## Consequences

**Positive:**
- **Compliance-ready**: Can satisfy clinical documentation requirements when needed
- **Flexible**: Users can choose the appropriate mode for their situation
- **Simple mental model**: One setting controls all edit behavior
- **Audit-friendly**: Clear amendment trail with reasons and timestamps
- **No data loss**: Original documents are never modified in amendment mode

**Negative:**
- **Storage overhead**: Amendments duplicate content rather than storing diffs
- **UI complexity**: Need to display amendment chains and relationships
- **User education**: Users need to understand when to use which mode

**Trade-offs accepted:**
- Chose complete snapshots over diffs for simplicity and reliability
- Chose global setting over per-document setting for clinical accuracy
- Chose to show amendments as separate documents rather than inline version history
