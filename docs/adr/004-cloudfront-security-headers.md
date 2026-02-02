# ADR-004: CloudFront Security Headers

## Status

Accepted

## Context

The application is deployed as static files on AWS S3 behind CloudFront. Modern web security best practices require HTTP security headers to mitigate various attack vectors:

- **Content Security Policy (CSP)** - Prevents XSS by controlling which resources can load
- **X-Content-Type-Options** - Prevents MIME-type sniffing
- **X-Frame-Options** - Prevents clickjacking
- **Referrer-Policy** - Controls referrer information leakage
- **Strict-Transport-Security (HSTS)** - Enforces HTTPS connections

Since this is a therapy notes application handling Protected Health Information (PHI), security headers are particularly important for HIPAA compliance.

### Alpine.js Constraint

Alpine.js (v3.x) uses `new Function()` internally for expression evaluation. This requires `'unsafe-eval'` in the CSP `script-src` directive. Options considered:

1. **Allow `'unsafe-eval'`** - Required for Alpine.js to function
2. **Switch to a different framework** - Significant rewrite, not justified
3. **Use Alpine.js CSP build** - Experimental, requires build step, limited feature support

## Decision

Configure CloudFront Response Headers Policy with the following security headers:

```
Content-Security-Policy:
    default-src 'self';
    script-src 'self' 'unsafe-eval' https://cdn.jsdelivr.net https://kit.fontawesome.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://kit.fontawesome.com;
    font-src 'self' https://fonts.gstatic.com https://ka-f.fontawesome.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.execute-api.us-east-1.amazonaws.com https://cognito-idp.us-east-1.amazonaws.com https://*.your-domain.com https://ka-f.fontawesome.com;
    frame-ancestors 'none';

X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### CSP Directive Rationale

| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src` | `'self'` | Restrictive baseline |
| `script-src` | `'self' 'unsafe-eval'` + CDNs | Alpine.js requires eval; CDNs for Alpine.js and Font Awesome |
| `style-src` | `'self' 'unsafe-inline'` + Google Fonts | Tailwind generates inline styles; Google Fonts for Atkinson Hyperlegible |
| `font-src` | `'self'` + font CDNs | Google Fonts and Font Awesome icon fonts |
| `img-src` | `'self' data: https:` | Allow data URIs (for QR codes) and secure external images |
| `connect-src` | `'self'` + AWS + Font Awesome | API Gateway, Cognito, custom domain endpoints, Font Awesome Kit (loads CSS via fetch/XHR) |
| `frame-ancestors` | `'none'` | Prevent embedding in iframes (clickjacking protection) |

### Implementation via AWS Console

1. Navigate to CloudFront → Policies → Response headers policies
2. Create custom policy with the headers above
3. Attach policy to the CloudFront distribution behavior

Alternatively, define in CloudFormation/Terraform as infrastructure-as-code.

## Consequences

**Positive:**
- XSS mitigation through CSP (even with `'unsafe-eval'`, other protections apply)
- Clickjacking prevention via `frame-ancestors 'none'` and `X-Frame-Options: DENY`
- MIME-sniffing attacks prevented
- Referrer information controlled
- HTTPS enforced via HSTS
- Demonstrates security due diligence for HIPAA audits

**Negative:**
- `'unsafe-eval'` in CSP is not ideal (required by Alpine.js)
- `'unsafe-inline'` for styles reduces CSS injection protection
- CSP may need updates when adding new external dependencies
- Headers add small overhead to responses (negligible)

**Risk Mitigation for `'unsafe-eval'`:**
- No user-generated content is ever executed as code
- All Alpine.js expressions are developer-authored in HTML templates
- Input sanitization prevents injection into Alpine expressions
- The application does not use `eval()` or `Function()` outside of Alpine.js internals

**Inline Script Removal:**
- All inline `<script>` blocks have been extracted to external files (js/initForms.js, js/initUsers.js, etc.)
- This allows `script-src` to omit `'unsafe-inline'`, strengthening XSS protection
- Only external scripts are loaded; no inline JavaScript exists in HTML files
