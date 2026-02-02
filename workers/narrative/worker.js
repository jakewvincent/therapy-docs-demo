/**
 * Cloudflare Worker for AI Narrative Generation
 *
 * Proxies requests to Anthropic API for the demo/portfolio version.
 * Transforms Anthropic's SSE format to match the frontend's expected format.
 * Includes rate limiting to prevent abuse.
 */

// Rate limit configuration
const RATE_LIMIT_REQUESTS = 15;  // Max requests
const RATE_LIMIT_WINDOW_MS = 60 * 1000;  // Per minute

/**
 * Simple rate limiter using Cloudflare Cache API
 * Tracks requests per IP within a sliding window
 */
async function checkRateLimit(request, env) {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const cacheKey = `rate-limit:${ip}`;

    // Use the Cache API to store rate limit data
    const cache = caches.default;
    const cacheUrl = new URL(request.url);
    cacheUrl.pathname = `/__rate_limit/${ip}`;

    const cached = await cache.match(cacheUrl);

    let requestCount = 0;
    let windowStart = Date.now();

    if (cached) {
        try {
            const data = await cached.json();
            // Check if we're still in the same window
            if (Date.now() - data.windowStart < RATE_LIMIT_WINDOW_MS) {
                requestCount = data.count;
                windowStart = data.windowStart;
            }
            // Otherwise, window expired - start fresh
        } catch (e) {
            // Invalid cache data, start fresh
        }
    }

    // Check if rate limited
    if (requestCount >= RATE_LIMIT_REQUESTS) {
        const resetTime = Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS - Date.now()) / 1000);
        return {
            limited: true,
            resetIn: resetTime,
            remaining: 0
        };
    }

    // Increment counter and store
    requestCount++;
    const newData = JSON.stringify({ count: requestCount, windowStart });
    const cacheResponse = new Response(newData, {
        headers: {
            'Cache-Control': `max-age=${Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)}`,
            'Content-Type': 'application/json'
        }
    });
    await cache.put(cacheUrl, cacheResponse);

    return {
        limited: false,
        remaining: RATE_LIMIT_REQUESTS - requestCount,
        resetIn: Math.ceil((windowStart + RATE_LIMIT_WINDOW_MS - Date.now()) / 1000)
    };
}

export default {
    async fetch(request, env) {
        // CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type',
                }
            });
        }

        if (request.method !== 'POST') {
            return new Response(JSON.stringify({ error: 'Method not allowed' }), {
                status: 405,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Check rate limit
        const rateLimit = await checkRateLimit(request, env);
        if (rateLimit.limited) {
            return new Response(JSON.stringify({
                error: 'Rate limit exceeded',
                message: `Too many requests. Please wait ${rateLimit.resetIn} seconds.`,
                retryAfter: rateLimit.resetIn
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Retry-After': String(rateLimit.resetIn),
                    'X-RateLimit-Limit': String(RATE_LIMIT_REQUESTS),
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': String(rateLimit.resetIn)
                }
            });
        }

        // Parse request body
        let body;
        try {
            body = await request.json();
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }

        const {
            prompt,
            systemPrompt = 'You are a clinical documentation assistant helping a psychotherapist write concise progress note narratives.',
            temperature = 0.7,
            maxTokens = 2048,
            prefill = ''
        } = body;

        if (!prompt) {
            return new Response(JSON.stringify({ error: 'prompt is required' }), {
                status: 400,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }

        // Build messages array
        const messages = [
            { role: 'user', content: prompt }
        ];

        // Add prefill as assistant message if provided
        if (prefill) {
            messages.push({ role: 'assistant', content: prefill });
        }

        // Call Anthropic API with streaming
        let anthropicResponse;
        try {
            anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': env.ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: maxTokens,
                    temperature: temperature,
                    system: systemPrompt,
                    messages: messages,
                    stream: true
                })
            });
        } catch (e) {
            return new Response(JSON.stringify({ error: 'Failed to connect to Anthropic API' }), {
                status: 502,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }

        if (!anthropicResponse.ok) {
            const errorText = await anthropicResponse.text();
            return new Response(JSON.stringify({
                error: `Anthropic API error: ${anthropicResponse.status}`,
                details: errorText
            }), {
                status: anthropicResponse.status,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                }
            });
        }

        // Transform Anthropic SSE to our SSE format
        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        // Process stream in background
        (async () => {
            const reader = anthropicResponse.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6).trim();

                            // Skip empty data
                            if (!data) continue;

                            try {
                                const parsed = JSON.parse(data);

                                // Handle content delta (text chunks)
                                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                    const text = parsed.delta.text;
                                    // Escape for JSON
                                    const escaped = text
                                        .replace(/\\/g, '\\\\')
                                        .replace(/"/g, '\\"')
                                        .replace(/\n/g, '\\n')
                                        .replace(/\r/g, '\\r')
                                        .replace(/\t/g, '\\t');
                                    await writer.write(encoder.encode(`data: {"text":"${escaped}"}\n\n`));
                                }

                                // Handle message stop
                                if (parsed.type === 'message_stop') {
                                    await writer.write(encoder.encode('data: {"done":true,"stopReason":"end_turn"}\n\n'));
                                }

                                // Handle message delta (for stop reason)
                                if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                                    await writer.write(encoder.encode(`data: {"done":true,"stopReason":"${parsed.delta.stop_reason}"}\n\n`));
                                }

                            } catch (parseError) {
                                // Ignore parse errors for non-JSON lines
                            }
                        }
                    }
                }

                // Process any remaining buffer
                if (buffer.startsWith('data: ')) {
                    const data = buffer.slice(6).trim();
                    if (data) {
                        try {
                            const parsed = JSON.parse(data);
                            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                                const text = parsed.delta.text;
                                const escaped = text
                                    .replace(/\\/g, '\\\\')
                                    .replace(/"/g, '\\"')
                                    .replace(/\n/g, '\\n')
                                    .replace(/\r/g, '\\r')
                                    .replace(/\t/g, '\\t');
                                await writer.write(encoder.encode(`data: {"text":"${escaped}"}\n\n`));
                            }
                        } catch (e) { /* ignore */ }
                    }
                }

            } catch (streamError) {
                await writer.write(encoder.encode(`data: {"error":"Stream error: ${streamError.message}"}\n\n`));
            } finally {
                await writer.close();
            }
        })();

        return new Response(readable, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'X-RateLimit-Limit': String(RATE_LIMIT_REQUESTS),
                'X-RateLimit-Remaining': String(rateLimit.remaining),
                'X-RateLimit-Reset': String(rateLimit.resetIn)
            }
        });
    }
};
