# ADR-007: Client-Side Caching with Session Storage

## Status

Accepted

## Context

The Therapy Docs application experienced noticeable latency when navigating between pages. Each page load triggered fresh API calls for settings (~300ms each for interventions, document visibility, edit mode) and client lists (~400ms). When selecting a client, additional calls fetched diagnosis, treatment plan, and last session data (~1150ms total).

For a therapist using the app during sessions, these delays create friction—especially when switching between clients or navigating to check settings. The delays are particularly noticeable with mock API (which simulates realistic latency) but would persist with real API calls.

**Key constraints identified with UX consultant input:**

1. **Single-user workflow** - Only one therapist uses their own data, reducing stale data risk from concurrent edits
2. **Must invalidate on writes** - Users must immediately see their own saved changes
3. **Clinical data needs shorter TTLs** - Client context changes more frequently than settings
4. **Need transparency** - Users should know when they're seeing cached data for clinical information
5. **Escape hatch required** - Manual refresh option for critical situations

## Decision

Implement TTL-based caching using `sessionStorage` with explicit invalidation on writes.

**Cache Manager Module (`js/cacheManager.js`):**
- `CacheManager.get(key)` - Returns cached data if not expired, else null
- `CacheManager.set(key, data, ttl)` - Stores data with timestamp and TTL
- `CacheManager.invalidate(key)` - Removes specific cache entry
- `CacheManager.invalidatePrefix(prefix)` - Removes all entries matching prefix
- `CacheManager.getAgeMinutes(key)` - Returns minutes since cache creation (for UI)

**Cache TTLs:**

| Data Type | TTL | Rationale |
|-----------|-----|-----------|
| Settings (interventions, visibility, edit mode) | 30 minutes | Rarely changes, user-controlled |
| Clients list | 5 minutes | Changes on create/archive/delete |
| Client context (diagnosis, treatment plan, last session) | 2 minutes | Clinical data, shorter for safety |

**Caching Strategy:**

1. **Prefetch on login** - Settings fetched before redirect to documents page
2. **Cache on first fetch** - API methods cache results after successful fetch
3. **Invalidate on write** - Save/create/delete operations clear relevant cache
4. **Visual indicator** - Client context panel shows "Xm ago" when data is from cache
5. **Manual refresh** - Refresh button clears cache and fetches fresh data

**Why sessionStorage over localStorage:**
- Cleared when browser tab closes (no stale data across sessions)
- Scoped to single tab (no cross-tab cache coherence issues)
- Appropriate for "performance optimization" data vs "user preference" data

## Consequences

**Positive:**

- Faster perceived load times after initial fetch
- Settings/clients cached across page navigation (no repeated API calls)
- Users see their own changes immediately (invalidation on write)
- Transparency via cache age indicator for clinical data
- Manual refresh provides escape hatch for edge cases
- Session-scoped: fresh data on each new browser session

**Negative:**

- Added complexity: cache invalidation logic spread across multiple files
- Potential for bugs if invalidation is missed on new write paths
- 2-minute TTL for client context is a trade-off: shorter = more API calls, longer = staler data
- Visual indicator only in slide-out panel (not visible during form entry)

**Files affected:**
- `js/cacheManager.js` (new)
- `js/api.js` - Cache checks in getSettings(), getClients()
- `js/login.js` - Prefetch settings before redirect
- `js/settings.js`, `js/myInterventions.js` - Settings invalidation
- `js/clientsDashboard.js`, `js/clientsArchived.js` - Client list invalidation
- `js/app.js` - Client context caching, invalidation, refresh method
- `documents.html` - Cache age indicator UI
- All entry files - CacheManager global exposure

**Future considerations:**
- If multi-user editing is added, cache strategy would need revision (shorter TTLs or real-time sync)
- Could add cache warming for "likely next" client based on recent patterns
- Consider showing cache indicator more prominently if users report stale data issues
