# ADR-002: User Info Storage in localStorage

## Status

Accepted

## Context

After authentication, various pages need access to user information (email, name, role, groups) for:
1. Displaying the user's name in the navigation drawer
2. Role-based UI visibility (e.g., "User Management" menu item for admins)
3. Profile display on settings page

The JWT token contains authentication proof but extracting user info from it requires either:
- Decoding the JWT on the client (adds complexity, token structure may vary)
- Making an API call on every page load (adds latency, network dependency)

The backend returns user info during successful authentication (MFA verification, MFA setup completion).

## Decision

Store user info in localStorage during the login flow, alongside the auth token:

```javascript
localStorage.setItem('authToken', token);
localStorage.setItem('userInfo', JSON.stringify({
    email: user.email,
    name: user.name,
    role: user.role,
    groups: user.groups,
    license: user.license
}));
```

`AuthGuard.loadUserInfo()` reads from localStorage in production mode.

Logout clears both `authToken` and `userInfo`.

## Consequences

**Positive:**
- User info available immediately on all pages
- No additional API calls needed
- Works offline after login
- Simple implementation

**Negative:**
- User info could become stale if changed server-side (mitigated: users rarely change their own role)
- Data duplication (info may also be in JWT)
- localStorage is synchronous and limited to ~5MB (not a concern for small user object)

**Security considerations:**
- localStorage is accessible to JavaScript on the same origin
- No more sensitive than the JWT token already stored there
- Cleared on logout
