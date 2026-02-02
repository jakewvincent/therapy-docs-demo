/**
 * Authentication Guard Utility
 *
 * Provides shared auth checking and user info loading for protected pages.
 * All pages except index.html (login) should use this.
 */

import { config } from './config.js';
import { Logger } from './logger.js';
import { API } from './api.js';
import { mockData } from './mockData.js';

export const AuthGuard = {
    /**
     * Validate that config is safe for the current environment.
     * Prevents dangerous combination of debugMode=true with real API.
     * @throws {Error} if dangerous configuration detected
     * @returns {boolean} true if config is valid
     */
    validateConfig() {
        if (config.features?.debugMode && !config.useMockAPI) {
            const errorMsg = 'FATAL: debugMode=true with useMockAPI=false is not allowed. ' +
                'This would bypass authentication while using the real API.';
            document.body.innerHTML = `
                <div style="padding: 40px; font-family: system-ui, sans-serif; color: #721c24;
                            background: #f8d7da; border: 1px solid #f5c6cb; margin: 20px;
                            border-radius: 8px; max-width: 600px;">
                    <h1 style="margin-top: 0;">Configuration Error</h1>
                    <p>${errorMsg}</p>
                    <p>Please check <code>js/config.js</code> and ensure either:</p>
                    <ul>
                        <li><code>debugMode: false</code> (for production/real API)</li>
                        <li><code>useMockAPI: true</code> (for development with debugMode)</li>
                    </ul>
                </div>
            `;
            throw new Error(errorMsg);
        }
        return true;
    },

    /**
     * Check if user is authenticated. Redirects to login if not.
     * @returns {boolean} true if authenticated, false if redirecting
     */
    checkAuth() {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    /**
     * Load user info from localStorage (set during login) or mockData (dev)
     * @returns {object|null} User info object or null
     */
    loadUserInfo() {
        // Use mock data in mock API mode OR debug mode
        const useDevData = config.useMockAPI || config.features?.debugMode;
        if (useDevData && typeof mockData !== 'undefined' && mockData.user) {
            const role = config.mockRole || config.testRole || mockData.user.role || 'admin';
            return {
                email: mockData.user.email,
                name: mockData.user.name,
                license: mockData.user.license || '',
                role: role,
                groups: [role]
            };
        }

        // In production mode, read user info stored during login
        const userInfoStr = localStorage.getItem('userInfo');
        if (userInfoStr) {
            try {
                const userInfo = JSON.parse(userInfoStr);
                return {
                    email: userInfo.email || '',
                    name: userInfo.name || '',
                    license: userInfo.license || '',
                    role: userInfo.role || (userInfo.groups?.[0]) || 'supervisor',
                    groups: userInfo.groups || []
                };
            } catch (e) {
                Logger.error('Failed to parse userInfo from localStorage:', e);
            }
        }

        return null;
    },

    /**
     * Logout and redirect to login page
     */
    async logout() {
        try {
            await API.logout();
        } catch (error) {
            Logger.error('Logout error:', error);
        }
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'index.html';
    }
};

// Expose to window for Alpine template access
window.AuthGuard = AuthGuard;
