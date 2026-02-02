/**
 * Demo Configuration
 *
 * Uses mock data for clients/sessions with real AI for narrative generation.
 */

export const config = {
    // API Gateway endpoint (not used in demo mode)
    apiEndpoint: 'https://api.example.com',

    // AWS Region
    region: 'us-east-1',

    // Cognito User Pool (not used in demo mode)
    userPoolId: 'us-east-1_DEMO',
    userPoolClientId: 'demo-client-id',

    // Feature flags
    features: {
        aiNarratives: true,
        offlineMode: false,
        debugMode: false
    },

    // Mock mode - uses mock data for all API calls
    useMockAPI: true,

    // Hybrid mode: use real AI for narrative generation while keeping mock data
    useRealAI: true,
    demoAIEndpoint: 'https://therapy-docs-narrative.damp-rice-c36c.workers.dev'
};

// Expose to window for Alpine template access
window.config = config;
