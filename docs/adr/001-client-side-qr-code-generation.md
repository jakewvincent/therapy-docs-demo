# ADR-001: Client-side QR Code Generation

## Status

Accepted

## Context

During MFA setup, users need to scan a QR code containing their TOTP secret (the shared secret used to generate one-time passwords). The initial implementation used a third-party service (qrserver.com) to generate QR codes by passing the TOTP URI as a URL parameter:

```
https://api.qrserver.com/v1/create-qr-code/?data=otpauth://totp/...
```

This approach exposed the TOTP secret to:
1. The third-party service (qrserver.com)
2. Network intermediaries
3. The third party's logs and potential data retention

TOTP secrets are highly sensitive authentication credentials. Anyone with the secret can generate valid authentication codes.

## Decision

Generate QR codes entirely client-side using the qrcodejs library. The TOTP secret never leaves the user's browser.

Implementation:
- Added qrcodejs via CDN (jsdelivr)
- Replaced `<img src="https://api.qrserver.com/...">` with a `<div>` container
- Used Alpine.js `x-effect` to trigger QR code generation when data is available
- QR code is rendered to canvas in the browser

## Consequences

**Positive:**
- TOTP secrets never transmitted to external servers
- No dependency on third-party service availability
- Faster rendering (no network round-trip)
- Works offline once the page is loaded

**Negative:**
- Additional JavaScript library (~10KB)
- Slightly more complex implementation
- Need to handle QR code regeneration on data changes
