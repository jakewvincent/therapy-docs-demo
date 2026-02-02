/**
 * Cache Manager
 * TTL-based caching using sessionStorage for improved UX
 *
 * Cache categories:
 * - Settings: 30 min TTL (user preferences, rarely change)
 * - Clients: 5 min TTL (list data, moderate change frequency)
 * - Client Context: 2 min TTL (clinical data, needs freshness)
 */

export const CacheKeys = {
    SETTINGS_PREFIX: 'cache_settings_',
    CLIENTS: 'cache_clients',
    CLIENT_CONTEXT_PREFIX: 'cache_client_context_'
};

export const CacheTTL = {
    SETTINGS: 30 * 60 * 1000,       // 30 minutes
    CLIENTS: 5 * 60 * 1000,         // 5 minutes
    CLIENT_CONTEXT: 2 * 60 * 1000   // 2 minutes
};

export const CacheManager = {
    /**
     * Get cached value if not expired
     * @param {string} key - Cache key
     * @returns {object|null} - { data, timestamp, ttl } or null if expired/missing
     */
    get(key) {
        try {
            const cached = sessionStorage.getItem(key);
            if (!cached) return null;

            const entry = JSON.parse(cached);
            const { data, timestamp, ttl } = entry;

            // Check if expired
            if (Date.now() - timestamp > ttl) {
                sessionStorage.removeItem(key);
                return null;
            }

            return { data, timestamp, ttl };
        } catch {
            // Invalid cache entry, remove it
            sessionStorage.removeItem(key);
            return null;
        }
    },

    /**
     * Set cache value with TTL
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttl - Time to live in milliseconds
     */
    set(key, data, ttl) {
        try {
            const entry = {
                data,
                timestamp: Date.now(),
                ttl
            };
            sessionStorage.setItem(key, JSON.stringify(entry));
        } catch (e) {
            // sessionStorage might be full or disabled
            console.warn('CacheManager: Failed to cache', key, e);
        }
    },

    /**
     * Invalidate a specific cache key
     * @param {string} key - Cache key to remove
     */
    invalidate(key) {
        sessionStorage.removeItem(key);
    },

    /**
     * Invalidate all caches matching a prefix
     * @param {string} prefix - Key prefix to match
     */
    invalidatePrefix(prefix) {
        const keysToRemove = [];
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(k => sessionStorage.removeItem(k));
    },

    /**
     * Clear all app caches
     */
    clearAll() {
        this.invalidatePrefix('cache_');
    },

    /**
     * Get age of cached data in minutes (for UI display)
     * @param {string} key - Cache key
     * @returns {number|null} - Age in minutes, or null if not cached
     */
    getAgeMinutes(key) {
        const cached = this.get(key);
        if (!cached) return null;
        return Math.floor((Date.now() - cached.timestamp) / 60000);
    },

    /**
     * Check if a cache key exists and is valid
     * @param {string} key - Cache key
     * @returns {boolean}
     */
    has(key) {
        return this.get(key) !== null;
    },

    // ========================================
    // CONVENIENCE METHODS FOR TYPED CACHE KEYS
    // ========================================

    /**
     * Get cache key for a settings type
     * @param {string} settingType - e.g., 'dashboard', 'interventions'
     * @returns {string}
     */
    getSettingsKey(settingType) {
        return CacheKeys.SETTINGS_PREFIX + settingType;
    },

    /**
     * Get cache key for a client's context
     * @param {string} clientId - Client ID
     * @returns {string}
     */
    getClientContextKey(clientId) {
        return CacheKeys.CLIENT_CONTEXT_PREFIX + clientId;
    },

    /**
     * Invalidate all settings caches
     */
    invalidateAllSettings() {
        this.invalidatePrefix(CacheKeys.SETTINGS_PREFIX);
    },

    /**
     * Invalidate all client context caches
     */
    invalidateAllClientContexts() {
        this.invalidatePrefix(CacheKeys.CLIENT_CONTEXT_PREFIX);
    }
};
