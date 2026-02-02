# Narrative Generation Worker

A Cloudflare Worker that proxies AI narrative generation requests to the Anthropic API.
This enables real AI functionality in the demo/portfolio version without needing the full AWS backend.

## Prerequisites

1. [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier works)
2. [Anthropic API key](https://console.anthropic.com/)
3. [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## Setup

### 1. Install Wrangler

```bash
npm install -g wrangler
```

### 2. Login to Cloudflare

```bash
wrangler login
```

### 3. Add your Anthropic API key as a secret

```bash
cd workers/narrative
wrangler secret put ANTHROPIC_API_KEY
# Paste your API key when prompted
```

### 4. Deploy

```bash
wrangler deploy
```

This will output a URL like `https://therapy-docs-narrative.your-account.workers.dev`

### 5. Configure the frontend

In your `js/config.js`:

```javascript
export const config = {
    useMockAPI: true,
    useRealAI: true,
    demoAIEndpoint: 'https://therapy-docs-narrative.your-account.workers.dev',
    // ... other config
};
```

## Custom Domain (Optional)

To use a custom subdomain like `narrative.jwv.dev`:

1. Add your domain to Cloudflare (if not already)
2. In `wrangler.toml`, uncomment and update the routes section:
   ```toml
   routes = [
     { pattern = "narrative.your-domain.com", custom_domain = true }
   ]
   ```
3. Redeploy: `wrangler deploy`

## Local Development

```bash
wrangler dev
```

This runs the worker locally at `http://localhost:8787`

## API

### POST /

Generate a narrative via streaming SSE.

**Request Body:**
```json
{
  "prompt": "Write a progress note for...",
  "systemPrompt": "You are a clinical documentation assistant...",
  "temperature": 0.7,
  "maxTokens": 2048,
  "prefill": "<thinking>\nThis is a"
}
```

**Response:** Server-Sent Events stream
```
data: {"text":"<thinking>"}
data: {"text":"\nAnalyzing..."}
data: {"text":"</thinking>"}
data: {"text":"\n\n<narrative>"}
data: {"text":"The client..."}
data: {"done":true,"stopReason":"end_turn"}
```

## Cost

- **Cloudflare Worker:** Free tier includes 100,000 requests/day
- **Anthropic API:** ~$0.003/1K input tokens, ~$0.015/1K output tokens
- **Typical narrative:** ~$0.01 per generation

## Rate Limiting

The worker includes built-in rate limiting to prevent abuse:

- **Limit:** 15 requests per minute per IP
- **Response headers:** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- **When exceeded:** Returns HTTP 429 with `Retry-After` header

To adjust the limits, edit these constants in `worker.js`:
```javascript
const RATE_LIMIT_REQUESTS = 15;  // Max requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000;  // Per minute
```

## Security Notes

- API key is stored as a Cloudflare secret (not in code)
- Rate limiting prevents abuse of your Anthropic API quota
- Worker URL is public but protected by rate limits
