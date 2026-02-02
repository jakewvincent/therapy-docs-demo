/**
 * Login Page Alpine.js Application
 *
 * Handles authentication flow: login, MFA verification, and MFA setup.
 * Redirects to documents.html upon successful authentication.
 */

import { config } from './config.js';
import { Logger } from './logger.js';
import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { CacheManager, CacheTTL } from './cacheManager.js';

export function createLoginAppData() {
    return {
        // ========================================
        // AUTHENTICATION STATE
        // ========================================
        credentials: {
            // Pre-fill demo credentials in mock mode (when not auto-skipping via debugMode)
            email: (config.useMockAPI && !config.features?.debugMode) ? 'drkhorney@contextmatterstherapy.com' : '',
            password: (config.useMockAPI && !config.features?.debugMode) ? 'SecureDemo123!' : ''
        },
        showMFA: false,
        mfaCode: (config.useMockAPI && !config.features?.debugMode) ? '123456' : '',
        mfaSession: '',           // Session token for MFA verification

        // User info (populated during MFA setup flow)
        userEmail: '',
        userName: '',
        userRole: '',
        userGroups: [],

        // ========================================
        // NEW PASSWORD STATE (first-time login)
        // ========================================
        newPasswordRequired: false,
        newPasswordSession: '',
        newPasswordData: {
            password: '',
            confirmPassword: ''
        },
        newPasswordError: '',
        newPasswordLoading: false,

        // Password validation getters
        get hasMinLength() {
            return this.newPasswordData.password.length >= 12;
        },
        get hasUpperAndLower() {
            return /[a-z]/.test(this.newPasswordData.password) &&
                   /[A-Z]/.test(this.newPasswordData.password);
        },
        get hasNumber() {
            return /[0-9]/.test(this.newPasswordData.password);
        },
        get hasSpecialChar() {
            return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.newPasswordData.password);
        },
        get passwordsMatch() {
            return this.newPasswordData.password.length > 0 &&
                   this.newPasswordData.confirmPassword.length > 0 &&
                   this.newPasswordData.password === this.newPasswordData.confirmPassword;
        },

        // ========================================
        // MFA SETUP STATE
        // ========================================
        mfaSetupRequired: false,
        mfaSetupStep: 'download', // 'download' | 'qr' | 'verify' | 'complete'
        mfaSetupSession: '',      // Cognito session for MFA_SETUP challenge flow
        mfaSetupData: {
            secretCode: '',
            qrCodeUrl: '',
            verificationCode: (config.useMockAPI && !config.features?.debugMode) ? '123456' : ''
        },
        mfaSetupError: '',
        mfaSetupLoading: false,

        // ========================================
        // UI STATE
        // ========================================
        loading: false,
        errorMessage: '',
        keepSignedIn: true,       // Keep signed in checkbox (default checked)

        // ========================================
        // INITIALIZATION
        // ========================================
        init() {
            // Safety check: prevent dangerous config combination
            AuthGuard.validateConfig();

            Logger.log('Login page initialized');

            // Check if already logged in
            const token = localStorage.getItem('authToken');
            if (token) {
                // Already authenticated - redirect to forms
                window.location.href = 'documents.html';
                return;
            }

            // In debug mode, redirect to documents.html (autoLogin will handle it there)
            if (config.features && config.features.debugMode) {
                window.location.href = 'documents.html';
                return;
            }
        },

        // ========================================
        // AUTHENTICATION METHODS
        // ========================================

        /**
         * Handle login form submission
         */
        async login() {
            this.loading = true;
            this.errorMessage = '';

            try {
                const result = await API.login(this.credentials.email, this.credentials.password);

                if (result.requiresNewPassword) {
                    // First-time user with temporary password - needs to set new password
                    this.newPasswordSession = result.session;
                    this.userEmail = this.credentials.email;
                    this.newPasswordRequired = true;
                } else if (result.requiresMFASetup) {
                    // User needs to set up MFA - go directly to setup flow
                    this.mfaSetupSession = result.session;
                    this.userEmail = this.credentials.email;

                    if (result.user) {
                        this.userName = result.user.name || '';
                        this.userRole = result.user.role || 'supervisor';
                        this.userGroups = result.user.groups || [];
                    }

                    this.mfaSetupRequired = true;
                    await this.initiateMFASetup();
                } else if (result.requiresMFA) {
                    // User has MFA configured - show verification code input
                    this.mfaSession = result.session;
                    this.userEmail = this.credentials.email;
                    this.showMFA = true;
                } else {
                    // No MFA at all - complete login
                    this.completeLogin(result.token, result.user, result.accessToken);
                }
            } catch (error) {
                this.errorMessage = error.message || 'Login failed. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        /**
         * Complete MFA verification
         */
        async completeMFA() {
            this.loading = true;
            this.errorMessage = '';

            try {
                const result = await API.completeMFA(this.mfaSession || 'mock-session', this.mfaCode, this.userEmail);
                this.completeLogin(result.token, result.user, result.accessToken, result.refreshToken);
            } catch (error) {
                this.errorMessage = error.message || 'Invalid MFA code. Please try again.';
            } finally {
                this.loading = false;
            }
        },

        /**
         * Complete login and redirect to forms page
         * @param {string} token - JWT ID token (for API Gateway authorizer)
         * @param {object} userInfo - User info object { email, name, role, groups, license }
         * @param {string} accessToken - Cognito access token (for profile updates)
         * @param {string} refreshToken - Cognito refresh token (for staying signed in)
         */
        completeLogin(token, userInfo = null, accessToken = null, refreshToken = null) {
            localStorage.setItem('authToken', token);
            if (accessToken) {
                localStorage.setItem('accessToken', accessToken);
            }
            // Only store refresh token if "Keep me signed in" is checked
            if (refreshToken && this.keepSignedIn) {
                localStorage.setItem('refreshToken', refreshToken);
            } else {
                // Clear any existing refresh token if not keeping signed in
                localStorage.removeItem('refreshToken');
            }
            if (userInfo) {
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
            }

            // Prefetch commonly-used settings before redirect (with timeout)
            this.prefetchSettings().finally(() => {
                window.location.href = 'documents.html';
            });
        },

        /**
         * Prefetch settings to cache before navigating to main app
         * Runs with a timeout to avoid blocking navigation if slow
         */
        async prefetchSettings() {
            const settingsToFetch = [
                'interventions',
                'documentTypeVisibility',
                'editMode',
                'dashboard',
                'clientDetailsTabVisibility'
            ];

            // Set a 2-second timeout for prefetch
            const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));

            const fetchPromise = Promise.allSettled(
                settingsToFetch.map(async (settingType) => {
                    try {
                        const data = await API.getSettings(settingType);
                        // API.getSettings already caches the result
                        Logger.log(`Prefetched settings: ${settingType}`);
                        return data;
                    } catch (e) {
                        // Non-critical - silently fail
                        Logger.log(`Prefetch failed for ${settingType}:`, e);
                        return null;
                    }
                })
            );

            // Race between fetch completion and timeout
            await Promise.race([fetchPromise, timeoutPromise]);
        },

        // ========================================
        // NEW PASSWORD METHODS
        // ========================================

        /**
         * Submit new password (first-time users)
         */
        async submitNewPassword() {
            this.newPasswordError = '';

            // Validate passwords match
            if (this.newPasswordData.password !== this.newPasswordData.confirmPassword) {
                this.newPasswordError = 'Passwords do not match.';
                return;
            }

            // Validate password requirements
            const password = this.newPasswordData.password;
            if (password.length < 12) {
                this.newPasswordError = 'Password must be at least 12 characters.';
                return;
            }
            if (!/[A-Z]/.test(password)) {
                this.newPasswordError = 'Password must contain an uppercase letter.';
                return;
            }
            if (!/[a-z]/.test(password)) {
                this.newPasswordError = 'Password must contain a lowercase letter.';
                return;
            }
            if (!/[0-9]/.test(password)) {
                this.newPasswordError = 'Password must contain a number.';
                return;
            }
            if (!/[^A-Za-z0-9]/.test(password)) {
                this.newPasswordError = 'Password must contain a special character.';
                return;
            }

            this.newPasswordLoading = true;

            try {
                const result = await API.setNewPassword(this.newPasswordSession, this.userEmail, password);

                // Password set successfully - proceed to MFA setup
                if (result.requiresMFASetup) {
                    this.mfaSetupSession = result.session;
                    this.newPasswordRequired = false;
                    this.mfaSetupRequired = true;
                    await this.initiateMFASetup();
                } else {
                    // Unexpected - no MFA setup required, complete login
                    this.completeLogin(result.token);
                }
            } catch (error) {
                this.newPasswordError = error.message || 'Failed to set new password.';
            } finally {
                this.newPasswordLoading = false;
            }
        },

        // ========================================
        // MFA SETUP METHODS
        // ========================================

        /**
         * Initiate MFA setup - show download step first
         */
        async initiateMFASetup() {
            this.mfaSetupError = '';
            this.mfaSetupStep = 'download';
        },

        /**
         * Advance from download step to QR step - fetch QR code
         */
        async advanceToQRStep() {
            this.mfaSetupLoading = true;
            this.mfaSetupError = '';

            try {
                const result = await API.setupMFA(this.mfaSetupSession, this.userEmail);
                this.mfaSetupData.secretCode = result.secretCode;
                this.mfaSetupData.qrCodeUrl = result.qrCodeUrl;

                if (result.session) {
                    this.mfaSetupSession = result.session;
                }

                this.mfaSetupStep = 'qr';
            } catch (error) {
                this.mfaSetupError = error.message || 'Failed to initiate MFA setup.';
            } finally {
                this.mfaSetupLoading = false;
            }
        },

        /**
         * Verify MFA setup code and enable MFA
         */
        async verifyMFASetup() {
            this.mfaSetupLoading = true;
            this.mfaSetupError = '';

            try {
                const result = await API.verifyMFASetup(
                    this.mfaSetupData.verificationCode,
                    this.mfaSetupSession,
                    this.userEmail
                );

                if (result.success) {
                    // Store the JWT ID token
                    if (result.token) {
                        localStorage.setItem('authToken', result.token);
                    }

                    // Store the access token for profile updates
                    if (result.accessToken) {
                        localStorage.setItem('accessToken', result.accessToken);
                    }

                    // Store refresh token if "Keep me signed in" is checked
                    // Note: For first-time setup, keepSignedIn defaults to true
                    if (result.refreshToken && this.keepSignedIn) {
                        localStorage.setItem('refreshToken', result.refreshToken);
                    } else {
                        localStorage.removeItem('refreshToken');
                    }

                    // Store user info for other pages to use
                    if (result.user) {
                        localStorage.setItem('userInfo', JSON.stringify(result.user));
                    }

                    // Clear the MFA setup session
                    this.mfaSetupSession = '';

                    this.mfaSetupStep = 'complete';
                }
            } catch (error) {
                this.mfaSetupError = error.message || 'Invalid verification code. Please try again.';
            } finally {
                this.mfaSetupLoading = false;
            }
        },

        /**
         * Complete MFA setup and redirect to forms page
         */
        completeMFASetup() {
            // Reset MFA setup state
            this.mfaSetupRequired = false;
            this.mfaSetupStep = 'download';
            this.mfaSetupSession = '';
            this.mfaSetupData = { secretCode: '', qrCodeUrl: '', verificationCode: '' };
            this.mfaSetupError = '';

            // Prefetch settings before redirect (JWT already stored in verifyMFASetup)
            this.prefetchSettings().finally(() => {
                window.location.href = 'documents.html';
            });
        },

        // ========================================
        // UTILITY METHODS
        // ========================================

        /**
         * Format secret code with spaces every 4 characters for readability
         */
        formatSecretCode(code) {
            if (!code) return '';
            return code.replace(/(.{4})/g, '$1 ').trim();
        },

        /**
         * Copy secret code to clipboard
         */
        secretCodeCopied: false,
        async copySecretCode() {
            try {
                await navigator.clipboard.writeText(this.mfaSetupData.secretCode);
                this.secretCodeCopied = true;
                setTimeout(() => {
                    this.secretCodeCopied = false;
                }, 2000);
            } catch (err) {
                Logger.error('Failed to copy:', err);
            }
        },

        /**
         * Generate QR code client-side (no external requests)
         * Uses qrcodejs library
         */
        _qrcodeInstance: null,
        generateQRCode(container, data) {
            if (!container || !data) return;

            // Clear previous QR code
            container.innerHTML = '';

            // Generate new QR code
            this._qrcodeInstance = new QRCode(container, {
                text: data,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }
    };
}
