/**
 * Configuration Template (Production)
 *
 * Reference for deploying with a real AWS backend.
 * The committed config.js is set up for demo mode.
 */

export const config = {
  // API Gateway endpoint
  apiEndpoint: 'https://your-api-id.execute-api.us-east-1.amazonaws.com/prod',

  // Streaming API endpoint (separate subdomain for SSE streaming)
  streamingApiEndpoint: 'https://stream-api.your-domain.com',

  // AWS Region
  region: 'us-east-1',

  // Cognito User Pool
  userPoolId: 'us-east-1_XXXXXXXXX',
  userPoolClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',

  // Feature flags
  features: {
    aiNarratives: true,
    offlineMode: false,
    debugMode: false
  },

  // Mock mode (set to true during development without backend)
  useMockAPI: true,

  // Hybrid mode: use real AI for narrative generation while keeping mock data
  // Requires demoAIEndpoint to be set. Only used when useMockAPI is true.
  useRealAI: false,

  // Demo AI endpoint (Cloudflare Worker or similar proxy to Anthropic API)
  // Only used when useRealAI is true. Example: 'https://narrative.your-domain.workers.dev'
  demoAIEndpoint: undefined,

  // Override mock user role for testing ('sysadmin' | 'admin' | 'supervisor')
  // Only used when useMockAPI is true. Leave undefined to use mockData.user.role default.
  mockRole: undefined,

  // Test role for local backend testing ('sysadmin' | 'admin' | 'supervisor')
  // Only used when useMockAPI is false. Adds X-Test-Role header to API requests.
  // Backend must be running locally (SAM) for this to work.
  // Leave undefined for default behavior (admin).
  testRole: undefined
};

// Expose to window for Alpine template access
window.config = config;
