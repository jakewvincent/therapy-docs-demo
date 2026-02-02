/**
 * Production-safe Logger
 *
 * Provides logging utilities that automatically disable in production
 * and sanitize sensitive data in development.
 *
 * Production condition: !config.features?.debugMode && !config.useMockAPI
 *
 * Usage:
 *   Logger.log('message');           // Suppressed in production
 *   Logger.warn('warning');          // Suppressed in production
 *   Logger.error('error', err);      // Sanitized in production, still logged
 *   Logger.debug('debug info');      // Only in debugMode
 */

import { config } from './config.js';

export const Logger = {
    /**
     * Sensitive field names that should be redacted from logged objects
     */
    _sensitiveKeys: [
        'password', 'token', 'authToken', 'refreshToken', 'accessToken',
        'secretCode', 'qrCodeUrl', 'session', 'mfaSession', 'Authorization'
    ],

    /**
     * Determine if we're in production mode
     * Production = not using mock API AND not in debug mode
     * @returns {boolean}
     */
    _isProduction() {
        return !config.features?.debugMode && !config.useMockAPI;
    },

    /**
     * Sanitize an object before logging to remove sensitive fields
     * @param {any} obj - Object to sanitize
     * @returns {any} - Sanitized copy (or original if not an object)
     */
    _sanitize(obj) {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj !== 'object') return obj;

        // If it's an Error, extract only safe properties
        if (obj instanceof Error) {
            return {
                name: obj.name,
                message: obj.message,
                ...(obj.status && { status: obj.status })
                // Omit: stack (could expose internal paths)
            };
        }

        // For arrays, sanitize each element
        if (Array.isArray(obj)) {
            return obj.map(item => this._sanitize(item));
        }

        // For regular objects, shallow copy and redact sensitive fields
        const sanitized = { ...obj };
        for (const key of this._sensitiveKeys) {
            if (key in sanitized) {
                sanitized[key] = '[REDACTED]';
            }
        }
        return sanitized;
    },

    /**
     * Log at info level (replaces console.log)
     * Suppressed entirely in production mode
     * @param {...any} args - Arguments to log
     */
    log(...args) {
        if (this._isProduction()) return;
        console.log(...args.map(a => this._sanitize(a)));
    },

    /**
     * Log at warn level (replaces console.warn)
     * Suppressed entirely in production mode
     * @param {...any} args - Arguments to log
     */
    warn(...args) {
        if (this._isProduction()) return;
        console.warn(...args.map(a => this._sanitize(a)));
    },

    /**
     * Log at error level (replaces console.error)
     * Still logged in production, but sanitized to prevent PHI/sensitive data leakage
     * @param {...any} args - Arguments to log
     */
    error(...args) {
        if (this._isProduction()) {
            // In production, only log sanitized error info
            const sanitizedArgs = args.map(a => {
                if (a instanceof Error) {
                    return `Error: ${a.message}`;
                }
                if (typeof a === 'string') {
                    return a;
                }
                return '[Object]';
            });
            console.error(...sanitizedArgs);
        } else {
            // In development, log with sensitive field redaction
            console.error(...args.map(a => this._sanitize(a)));
        }
    },

    /**
     * Log debug information (only when debugMode is explicitly enabled)
     * Extra strict - requires debugMode to be true, not just mock mode
     * @param {...any} args - Arguments to log
     */
    debug(...args) {
        if (this._isProduction()) return;
        if (!config.features?.debugMode) return;
        console.log('[DEBUG]', ...args.map(a => this._sanitize(a)));
    }
};

// Expose to window for console debugging
window.Logger = Logger;
