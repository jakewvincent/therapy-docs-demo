/**
 * API Layer
 *
 * Handles all communication with the AWS backend.
 * Automatically switches between mock and real API based on config.useMockAPI.
 *
 * Mock API: Uses mockData.js for development
 * Real API: Calls AWS Lambda functions via API Gateway
 */

import { config } from './config.js';
import { Logger } from './logger.js';
import { mockData } from './mockData.js';
import { DateUtils } from './dateUtils.js';
import { CacheManager, CacheKeys, CacheTTL } from './cacheManager.js';

export const API = {
  /**
   * Simulates network delay for realistic mock API behavior
   */
  async _mockDelay(ms = 800) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Helper to throw API errors
   */
  _handleError(message, status = 500) {
    const error = new Error(message);
    error.status = status;
    throw error;
  },

  /**
   * Get mock user with optional role override from config
   */
  _getMockUser() {
    const user = { ...mockData.user };
    if (config.mockRole) {
      user.role = config.mockRole;
      user.groups = [config.mockRole];
    }
    return user;
  },

  /**
   * Build headers for API requests
   * Includes auth token and X-Test-Role header for local backend testing
   * @param {boolean} includeContentType - Include Content-Type: application/json
   */
  _getHeaders(includeContentType = false) {
    const token = localStorage.getItem('authToken');
    const headers = {
      'Authorization': `Bearer ${token}`
    };

    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }

    // Add test role header for local backend testing
    if (!config.useMockAPI && config.testRole) {
      headers['X-Test-Role'] = config.testRole;
    }

    return headers;
  },

  /**
   * Check if a JWT token is expired or about to expire
   * @param {string} token - JWT token to check
   * @param {number} bufferSeconds - Consider expired if within this many seconds of expiry
   * @returns {boolean} true if expired or about to expire
   */
  _isTokenExpired(token, bufferSeconds = 300) {
    if (!token) return true;

    try {
      // JWT structure: header.payload.signature
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiryTime = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      const bufferMs = bufferSeconds * 1000;

      return now >= (expiryTime - bufferMs);
    } catch (e) {
      Logger.error('Failed to parse token:', e);
      return true; // Assume expired if we can't parse
    }
  },

  /**
   * Refresh auth tokens using the stored refresh token
   * @returns {Promise<boolean>} true if refresh succeeded, false otherwise
   */
  async refreshTokens() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      Logger.log('No refresh token available');
      return false;
    }

    if (config.useMockAPI) {
      // Mock refresh - just generate new mock tokens
      await this._mockDelay(300);
      localStorage.setItem('authToken', 'mock-jwt-token-refreshed-' + Date.now());
      localStorage.setItem('accessToken', 'mock-access-token-refreshed-' + Date.now());
      Logger.log('Mock tokens refreshed');
      return true;
    }

    try {
      const response = await fetch(`${config.apiEndpoint}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        Logger.error('Token refresh failed:', response.status);
        return false;
      }

      const result = await response.json();

      // Store the new tokens
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      if (result.accessToken) {
        localStorage.setItem('accessToken', result.accessToken);
      }
      // Refresh token typically doesn't change, but update if provided
      if (result.refreshToken) {
        localStorage.setItem('refreshToken', result.refreshToken);
      }

      Logger.log('Tokens refreshed successfully');
      return true;
    } catch (error) {
      Logger.error('Token refresh error:', error);
      return false;
    }
  },

  /**
   * Make an authenticated fetch request with automatic token refresh
   * If the request fails with 401, attempts to refresh tokens and retry once
   * @param {string} url - The URL to fetch
   * @param {object} options - Fetch options (method, headers, body, etc.)
   * @returns {Promise<Response>} The fetch response
   */
  async _fetchWithAuth(url, options = {}) {
    // Check if token is about to expire and proactively refresh
    const token = localStorage.getItem('authToken');
    if (this._isTokenExpired(token)) {
      Logger.log('Token expired or expiring soon, attempting refresh...');
      const refreshed = await this.refreshTokens();
      if (!refreshed) {
        // Refresh failed - redirect to login
        Logger.log('Token refresh failed, redirecting to login');
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'index.html';
        throw new Error('Session expired. Please log in again.');
      }
    }

    // Make the request with current (possibly refreshed) token
    const headers = {
      ...this._getHeaders(options.body ? true : false),
      ...options.headers
    };

    const response = await fetch(url, { ...options, headers });

    // If we get a 401, try to refresh and retry once
    if (response.status === 401) {
      Logger.log('Got 401, attempting token refresh...');
      const refreshed = await this.refreshTokens();
      if (refreshed) {
        // Retry with new token
        const retryHeaders = {
          ...this._getHeaders(options.body ? true : false),
          ...options.headers
        };
        return fetch(url, { ...options, headers: retryHeaders });
      } else {
        // Refresh failed - redirect to login
        localStorage.removeItem('authToken');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userInfo');
        window.location.href = 'index.html';
      }
    }

    return response;
  },

  /**
   * Serialize note data for API transmission
   * Transforms frontend data structures to match API contract
   */
  _serializeNoteData(noteData) {
    const serialized = { ...noteData };

    // Serialize interventions: convert theme object to string
    if (serialized.interventions && Array.isArray(serialized.interventions)) {
      serialized.interventions = serialized.interventions.map(intervention => ({
        label: intervention.label,
        theme: intervention.theme?.string || intervention.theme, // Handle both object and string
        selections: intervention.selections || {},
        notes: intervention.notes || ''
      }));
    }

    // mseEntries and therapeuticApproaches are already in correct format
    return serialized;
  },

  // ========================================
  // AUTHENTICATION
  // ========================================

  /**
   * Login with email and password
   * Returns: { requiresMFA: boolean, requiresMFASetup: boolean, session?: string }
   * - requiresMFA: true if user has MFA configured and needs to verify
   * - requiresMFASetup: true if user needs to set up MFA (no code required first)
   */
  async login(email, password) {
    if (config.useMockAPI) {
      await this._mockDelay(600);

      // Mock authentication - accept any email/password
      if (!email || !password) {
        this._handleError('Email and password required', 400);
      }

      // Check if user has MFA configured
      if (mockData.user.mfaEnabled) {
        // User has MFA - needs to verify with code
        return {
          requiresMFA: true,
          requiresMFASetup: false,
          session: 'mock-session-token'
        };
      } else {
        // User doesn't have MFA - needs to set it up
        return {
          requiresMFA: false,
          requiresMFASetup: true,
          session: 'mock-session-token',
          // Include user info for the setup flow (they're password-authenticated)
          user: this._getMockUser()
        };
      }
    }

    // Real API: Call Cognito authentication
    const response = await fetch(`${config.apiEndpoint}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      this._handleError('Authentication failed', response.status);
    }

    return response.json();
  },

  /**
   * Set new password (for first-time users with temporary password)
   * Returns: { requiresMFASetup: boolean, session: string }
   */
  async setNewPassword(session, email, newPassword) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Mock validation
      if (!newPassword || newPassword.length < 12) {
        this._handleError('Password must be at least 12 characters', 400);
      }

      // Mock success - proceed to MFA setup
      return {
        requiresMFASetup: true,
        session: 'mock-session-after-password-change'
      };
    }

    // Real API: Set new password
    const response = await fetch(`${config.apiEndpoint}/auth/new-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, email, newPassword })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      this._handleError(error.error || 'Failed to set new password', response.status);
    }

    return response.json();
  },

  /**
   * Complete MFA verification
   * Returns: { token: string, user: object }
   */
  async completeMFA(session, code, email) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Mock MFA - accept any 6-digit code
      if (!code || code.length !== 6) {
        this._handleError('Invalid MFA code', 400);
      }

      return {
        token: 'mock-jwt-token-' + Date.now(),
        accessToken: 'mock-access-token-' + Date.now(),
        refreshToken: 'mock-refresh-token-' + Date.now(),
        user: this._getMockUser()
      };
    }

    // Real API: Verify MFA with Cognito
    const response = await fetch(`${config.apiEndpoint}/auth/mfa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session, code, email })
    });

    if (!response.ok) {
      this._handleError('MFA verification failed', response.status);
    }

    return response.json();
  },

  /**
   * Logout current user
   */
  async logout() {
    if (config.useMockAPI) {
      await this._mockDelay(200);
      localStorage.removeItem('authToken');
      localStorage.removeItem('accessToken');
      return { success: true };
    }

    // Real API: Invalidate token
    const response = await fetch(`${config.apiEndpoint}/auth/logout`, {
      method: 'POST',
      headers: this._getHeaders()
    });

    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    return response.json();
  },

  /**
   * Update current user's profile
   * @param {Object} profile - Profile fields to update
   * @param {string} [profile.license] - Professional license (e.g., 'LMFT', 'PhD')
   * @returns {{ success: boolean, user: Object }}
   */
  async updateProfile(profile) {
    if (config.useMockAPI) {
      await this._mockDelay(400);
      // Update mock data
      if (profile.license !== undefined) {
        mockData.user.license = profile.license || null;
      }
      return {
        success: true,
        user: { ...mockData.user }
      };
    }

    // Real API - requires access token for Cognito user attribute updates
    const accessToken = localStorage.getItem('accessToken');
    const extraHeaders = {};

    // Add access token header for profile updates (HIPAA least-privilege)
    if (accessToken) {
      extraHeaders['X-Access-Token'] = accessToken;
    }

    const response = await this._fetchWithAuth(`${config.apiEndpoint}/auth/profile`, {
      method: 'PATCH',
      headers: extraHeaders,
      body: JSON.stringify(profile)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update profile');
    }

    return response.json();
  },

  /**
   * Get MFA status for current user
   * Returns: { mfaEnabled: boolean }
   */
  async getMFAStatus() {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      return { mfaEnabled: mockData.user.mfaEnabled || false };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/auth/mfa/status`);

    if (!response.ok) {
      this._handleError('Failed to get MFA status', response.status);
    }

    return response.json();
  },

  /**
   * Initiate MFA setup - get QR code URL and secret
   *
   * For MFA_SETUP challenge flow (first login with mandatory MFA):
   *   Pass session and email in request body
   *   Returns: { secretCode, qrCodeUrl, session } (new session for verify step)
   *
   * For existing user flow (already has JWT):
   *   Pass nothing, uses Authorization header
   *   Returns: { secretCode, qrCodeUrl }
   *
   * @param {string} session - Cognito session token (for MFA_SETUP challenge flow)
   * @param {string} email - User email (for MFA_SETUP challenge flow)
   */
  async setupMFA(session = null, email = null) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Generate a mock secret and QR URL
      const mockSecret = 'JBSWY3DPEHPK3PXP';
      const mockEmail = email || mockData.user.email;
      const issuer = 'TherapyNotes';
      const qrCodeUrl = `otpauth://totp/${issuer}:${encodeURIComponent(mockEmail)}?secret=${mockSecret}&issuer=${issuer}`;

      return {
        secretCode: mockSecret,
        qrCodeUrl: qrCodeUrl,
        session: 'mock-mfa-setup-session' // Return new session for verify step
      };
    }

    // Real API - use session-based flow if session provided, otherwise JWT header
    const headers = { 'Content-Type': 'application/json' };
    let body = {};

    if (session && email) {
      // MFA_SETUP challenge flow - pass session and email in body
      body = { session, email };
    } else {
      // Existing user flow - use JWT header
      const token = localStorage.getItem('authToken');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${config.apiEndpoint}/auth/mfa/setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      this._handleError('Failed to initiate MFA setup', response.status);
    }

    return response.json();
  },

  /**
   * Verify MFA setup code and enable MFA
   * With Cognito mandatory MFA, this completes the MFA_SETUP auth challenge.
   *
   * For MFA_SETUP challenge flow (first login with mandatory MFA):
   *   Pass session and email in request body along with code
   *   Returns: { success, token, user: { id, email, name, role, groups } }
   *
   * For existing user flow (already has JWT):
   *   Pass only code, uses Authorization header
   *   Returns: { success: true }
   *
   * @param {string} code - 6-digit TOTP code from authenticator app
   * @param {string} session - Cognito session token (for MFA_SETUP challenge flow)
   * @param {string} email - User email (for MFA_SETUP challenge flow)
   */
  async verifyMFASetup(code, session = null, email = null) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Mock verification - accept any 6-digit code
      if (!code || code.length !== 6) {
        this._handleError('Invalid verification code', 400);
      }

      // Enable MFA for the mock user
      mockData.user.mfaEnabled = true;

      // Return success with JWT tokens and user info
      // In real Cognito flow, this is when RespondToAuthChallenge completes
      // and returns the actual JWT tokens
      const mockUser = this._getMockUser();
      return {
        success: true,
        token: 'mock-jwt-token-after-mfa-setup',
        accessToken: 'mock-access-token-after-mfa-setup',
        refreshToken: 'mock-refresh-token-after-mfa-setup',
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
          groups: mockUser.groups
        }
      };
    }

    // Real API - use session-based flow if session provided, otherwise JWT header
    const headers = { 'Content-Type': 'application/json' };
    let body = { code };

    if (session && email) {
      // MFA_SETUP challenge flow - pass session and email in body
      body.session = session;
      body.email = email;
    } else {
      // Existing user flow - use JWT header
      const token = localStorage.getItem('authToken');
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${config.apiEndpoint}/auth/mfa/verify-setup`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      this._handleError('MFA verification failed', response.status);
    }

    return response.json();
  },

  // ========================================
  // CLIENT MANAGEMENT
  // ========================================

  /**
   * Get all active (non-archived) clients for current user
   * Returns: Array of client objects
   */
  async getClients() {
    // Check cache first
    const cached = CacheManager.get(CacheKeys.CLIENTS);
    if (cached) {
      Logger.log('Clients cache hit');
      return cached.data;
    }

    let data = null;

    if (config.useMockAPI) {
      await this._mockDelay(400);
      // Filter out archived clients and add completedDocumentTypes
      data = mockData.clients
        .filter(c => !c.isArchived)
        .map(client => ({
          ...client,
          completedDocumentTypes: mockData.getCompletedFormTypes(client.id)
        }));
    } else {
      // Real API: Fetch from DynamoDB via Lambda
      const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients`);

      if (!response.ok) {
        this._handleError('Failed to fetch clients', response.status);
      }

      data = await response.json();
    }

    // Cache the result
    CacheManager.set(CacheKeys.CLIENTS, data, CacheTTL.CLIENTS);
    Logger.log('Clients cached');

    return data;
  },

  /**
   * Get all archived clients for current user
   * Returns: Array of archived client objects
   */
  async getArchivedClients() {
    if (config.useMockAPI) {
      await this._mockDelay(400);
      return mockData.clients.filter(c => c.isArchived === true);
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients?archived=true`);

    if (!response.ok) {
      this._handleError('Failed to fetch archived clients', response.status);
    }

    return response.json();
  },

  /**
   * Get count of archived clients (lightweight check)
   * Returns: Number
   */
  async getArchivedCount() {
    if (config.useMockAPI) {
      await this._mockDelay(100);
      return mockData.clients.filter(c => c.isArchived === true).length;
    }

    // Real API - could be a dedicated endpoint or derive from getArchivedClients
    const archived = await this.getArchivedClients();
    return archived.length;
  },

  /**
   * Get single client by ID
   */
  async getClient(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      const client = mockData.getClient(clientId);
      if (!client) {
        this._handleError('Client not found', 404);
      }
      return client;
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}`);

    if (!response.ok) {
      this._handleError('Failed to fetch client', response.status);
    }

    return response.json();
  },

  /**
   * Create new client
   * Returns: Created client object
   *
   * @param {object} clientData - Client data (name, clientType, etc.)
   * @param {string} [providedId] - Optional UUID to use as client ID
   */
  async createClient(clientData, providedId = null) {
    // Generate UUID if not provided
    const clientId = providedId || crypto.randomUUID();

    if (config.useMockAPI) {
      await this._mockDelay(600);

      const today = DateUtils.getTodayDateString();
      const newClient = {
        id: clientId,
        name: clientData.name,
        clientType: clientData.clientType || 'Individual',
        lastFormType: 'Progress Note',
        lastDelivery: 'In Person',
        status: 'active',
        isArchived: false,
        archivedAt: null,
        createdAt: today,
        totalSessions: 0,
        lastSessionDate: null,
        // Additional fields
        sessionBasis: clientData.sessionBasis || null,
        paymentType: clientData.paymentType || 'private-pay',
        payer: null,
        authorizationExpiration: null,
        sessionsRemaining: null,
        riskLevel: 'standard',
        lastRiskAssessment: null,
        referralSource: clientData.referralSource || null,
        referralDate: clientData.referralSource ? today : null,
        internalNotes: null
      };

      mockData.clients.push(newClient);
      return newClient;
    }

    // Real API - pass UUID for consistent identity
    const body = {
      name: clientData.name,
      clientType: clientData.clientType,
      id: clientId
    };

    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      // Handle 409 Conflict (UUID already exists)
      if (response.status === 409) {
        this._handleError('Client with this ID already exists', 409);
      }
      this._handleError('Failed to create client', response.status);
    }

    return response.json();
  },

  /**
   * Archive a client (soft delete)
   * Sets isArchived = true, archivedAt = current timestamp
   * Returns: Updated client object
   */
  async archiveClient(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      const client = mockData.clients.find(c => c.id === clientId);
      if (!client) {
        this._handleError('Client not found', 404);
      }

      client.isArchived = true;
      client.archivedAt = new Date().toISOString();
      return client;
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/archive`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      this._handleError('Failed to archive client', response.status);
    }

    return response.json();
  },

  /**
   * Restore an archived client
   * Sets isArchived = false, archivedAt = null
   * Returns: Updated client object
   */
  async restoreClient(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      const client = mockData.clients.find(c => c.id === clientId);
      if (!client) {
        this._handleError('Client not found', 404);
      }

      client.isArchived = false;
      client.archivedAt = null;
      return client;
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/restore`, {
      method: 'PATCH'
    });

    if (!response.ok) {
      this._handleError('Failed to restore client', response.status);
    }

    return response.json();
  },

  /**
   * Permanently delete a client (must be archived first)
   * Backend will backup all data to S3 before deletion
   * Returns: { success: boolean }
   */
  async deleteClient(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      const client = mockData.clients.find(c => c.id === clientId);
      if (!client) {
        this._handleError('Client not found', 404);
      }

      // Only allow deletion of archived clients
      if (!client.isArchived) {
        this._handleError('Client must be archived before deletion', 400);
      }

      // Remove from mock clients array
      const index = mockData.clients.findIndex(c => c.id === clientId);
      if (index > -1) {
        mockData.clients.splice(index, 1);
      }

      // Remove all documents for this client
      delete mockData.documents[clientId];

      return { success: true };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      this._handleError('Failed to delete client', response.status);
    }

    return response.json();
  },

  /**
   * Update client with partial data
   * @param {string} clientId - Client ID
   * @param {Object} updates - Fields to update
   * @returns {Object} Updated client object
   */
  async updateClient(clientId, updates) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      const client = mockData.clients.find(c => c.id === clientId);
      if (!client) {
        this._handleError('Client not found', 404);
      }

      // Apply updates
      Object.assign(client, updates);
      return client;
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      this._handleError('Failed to update client', response.status);
    }

    return response.json();
  },

  // ========================================
  // SESSION MANAGEMENT
  // ========================================

  /**
   * Get all sessions for a client
   * Returns: Array of session objects
   */
  async getSessions(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);
      // Use unified documents
      return mockData.getSessionsFromDocs(clientId);
    }

    // Real API - use unified documents endpoint with progress_note filter
    const result = await this.getClientDocuments(clientId, 'progress_note');

    // Handle both array and { documents: [...] } response formats
    const docs = Array.isArray(result) ? result : (result.documents || []);

    // Transform to session format for backward compatibility
    return docs.map(doc => ({
      id: doc.id,
      clientId: doc.clientId,
      date: doc.date || doc.content?.date,
      ...doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  },

  /**
   * Get last session for a client
   * Returns: Session object or null if no sessions
   */
  async getLastSession(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(350);
      // Use unified documents
      return mockData.getLastSessionFromDocs(clientId);
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents/latest-progress-note`);

    if (!response.ok) {
      // 404 is okay - might not have previous session
      if (response.status === 404) {
        return null;
      }
      this._handleError('Failed to fetch last session', response.status);
    }

    // Backend returns { clientId, session } - extract just the session
    const data = await response.json();
    return data.session || null;
  },

  /**
   * Get current diagnosis for a client
   * Returns the principal active diagnosis, formatted for UI compatibility
   */
  async getCurrentDiagnosis(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(350);
      // Use unified documents - returns formatted diagnosis object
      const doc = mockData.getCurrentDiagnosisFromDocs(clientId);
      if (!doc) return null;

      // Transform document to expected UI format
      return {
        id: doc.id,
        clientId: doc.clientId,
        ...doc.content,
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents/principal-diagnosis`);

    if (!response.ok) {
      // 404 is okay - might not have diagnosis yet
      if (response.status === 404) {
        return null;
      }
      this._handleError('Failed to fetch diagnosis', response.status);
    }

    return response.json();
  },

  /**
   * Get all diagnoses for a client
   * @param {string} clientId - Client ID
   * @param {string} [status] - Optional filter: 'active', 'resolved', 'provisional'
   * Returns: Array of diagnosis objects
   */
  async getDiagnoses(clientId, status = null) {
    if (config.useMockAPI) {
      await this._mockDelay(350);
      // Use unified documents - returns formatted diagnoses
      return mockData.getDiagnosesFromDocs(clientId, status);
    }

    // Real API - unified documents endpoint
    // Use convenience endpoint for active diagnoses, general endpoint for filtered queries
    let url;
    if (!status || status === 'active') {
      url = `${config.apiEndpoint}/clients/${clientId}/documents/active-diagnoses`;
    } else {
      url = `${config.apiEndpoint}/clients/${clientId}/documents?type=diagnosis&status=${status}`;
    }

    const response = await this._fetchWithAuth(url);

    if (!response.ok) {
      // 404 is okay - might not have diagnoses yet
      if (response.status === 404) {
        return [];
      }
      this._handleError('Failed to fetch diagnoses', response.status);
    }

    const data = await response.json();
    // API returns { diagnoses: [...], count: N } per API_CONTRACT.md
    const diagnoses = data.diagnoses || [];

    // Map date to dateOfDiagnosis for UI compatibility
    return diagnoses.map(d => ({
      ...d,
      dateOfDiagnosis: d.date || d.dateOfDiagnosis
    }));
  },

  /**
   * Create a new diagnosis for a client
   * @param {string} clientId - Client ID
   * @param {object} diagnosisData - Diagnosis fields
   * Returns: Created diagnosis object
   */
  async createDiagnosis(clientId, diagnosisData) {
    // Extract date and status for top-level fields (per unified documents API contract)
    const date = diagnosisData.dateOfDiagnosis || DateUtils.getTodayDateString();
    const status = diagnosisData.status || 'provisional';

    // Build content with clinical fields only (no date or status - those go at top level)
    const content = {
      icd10Code: diagnosisData.icd10Code,
      description: diagnosisData.description,
      isPrincipal: diagnosisData.isPrincipal || false,
      severity: diagnosisData.severity || null,
      clinicalNotes: diagnosisData.clinicalNotes || '',
      dateResolved: diagnosisData.dateResolved || null
    };

    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Create document in unified documents collection
      const doc = mockData.createDocument(clientId, 'diagnosis', content, status);
      // Store date at document level for mock
      doc.date = date;

      // Return flattened format with dateOfDiagnosis for UI compatibility
      return {
        id: doc.id,
        clientId: doc.clientId,
        ...doc.content,
        dateOfDiagnosis: date,  // Map date back to dateOfDiagnosis for UI
        status: doc.status,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents`, {
      method: 'POST',
      body: JSON.stringify({
        documentType: 'diagnosis',
        date,      // Top-level date field
        status,    // Top-level status field
        content    // Clinical fields only
      })
    });

    if (!response.ok) {
      this._handleError('Failed to create diagnosis', response.status);
    }

    const result = await response.json();
    // Map date to dateOfDiagnosis for UI compatibility
    return {
      ...result,
      dateOfDiagnosis: result.date || date
    };
  },

  /**
   * Update an existing diagnosis
   * @param {string} clientId - Client ID
   * @param {string} diagnosisId - Diagnosis ID
   * @param {object} updates - Fields to update
   * Returns: Updated diagnosis object
   */
  async updateDiagnosis(clientId, diagnosisId, updates) {
    // Separate top-level fields (date, status) from content fields
    const docUpdates = {};

    // Map dateOfDiagnosis to date for API
    if (updates.dateOfDiagnosis !== undefined) {
      docUpdates.date = updates.dateOfDiagnosis;
    }
    if (updates.status !== undefined) {
      docUpdates.status = updates.status;
    }

    // Build content updates (clinical fields only - no date or status)
    const contentUpdates = { ...updates };
    delete contentUpdates.dateOfDiagnosis;
    delete contentUpdates.status;

    if (Object.keys(contentUpdates).length > 0) {
      docUpdates.content = contentUpdates;
    }

    if (config.useMockAPI) {
      await this._mockDelay(500);

      const updated = mockData.updateDocument(clientId, diagnosisId, docUpdates);
      if (!updated) {
        this._handleError('Diagnosis not found', 404);
      }

      // Return flattened format with dateOfDiagnosis for UI compatibility
      return {
        id: updated.id,
        clientId: updated.clientId,
        ...updated.content,
        dateOfDiagnosis: updated.date || updates.dateOfDiagnosis,
        status: updated.status,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents/${diagnosisId}`, {
      method: 'PATCH',
      body: JSON.stringify(docUpdates)
    });

    if (!response.ok) {
      this._handleError('Failed to update diagnosis', response.status);
    }

    const result = await response.json();
    // Map date to dateOfDiagnosis for UI compatibility
    return {
      ...result,
      dateOfDiagnosis: result.date
    };
  },

  /**
   * Get current treatment plan for a client
   */
  async getCurrentTreatmentPlan(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);
      // Use unified documents
      return mockData.getCurrentTreatmentPlanFromDocs(clientId);
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents/current-treatment-plan`);

    if (!response.ok) {
      // 404 is okay - might not have treatment plan yet
      if (response.status === 404) {
        return null;
      }
      this._handleError('Failed to fetch treatment plan', response.status);
    }

    return response.json();
  },

  // ========================================
  // UNIFIED DOCUMENT OPERATIONS
  // ========================================

  /**
   * Get all documents for a client
   * @param {string} clientId - Client ID
   * @param {string} [type] - Optional document type filter (e.g., 'progress_note', 'diagnosis')
   * @param {string} [status] - Optional status filter (e.g., 'active', 'complete')
   * @returns {Array} Array of documents
   */
  async getClientDocuments(clientId, type = null, status = null) {
    if (config.useMockAPI) {
      await this._mockDelay(400);
      return mockData.getDocuments(clientId, type, status);
    }

    // Real API
    let url = `${config.apiEndpoint}/clients/${clientId}/documents`;
    const params = [];
    if (type) params.push(`type=${type}`);
    if (status) params.push(`status=${status}`);
    if (params.length > 0) url += `?${params.join('&')}`;

    const response = await this._fetchWithAuth(url);

    if (!response.ok) {
      if (response.status === 404) {
        return [];
      }
      this._handleError('Failed to fetch documents', response.status);
    }

    const result = await response.json();

    // Normalize response: handle both array and { documents: [...] } formats
    return Array.isArray(result) ? result : (result.documents || []);
  },

  /**
   * Get a single document by ID
   * @param {string} clientId - Client ID
   * @param {string} documentId - Document ID
   * @returns {Object|null} The document or null if not found
   */
  async getDocument(clientId, documentId) {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      return mockData.getDocument(clientId, documentId);
    }

    // Real API
    const response = await this._fetchWithAuth(
      `${config.apiEndpoint}/clients/${clientId}/documents/${documentId}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      this._handleError('Failed to fetch document', response.status);
    }

    return response.json();
  },

  /**
   * Create a new document
   * @param {string} clientId - Client ID
   * @param {string} documentType - Document type (e.g., 'progress_note', 'diagnosis')
   * @param {Object} content - Document content
   * @param {string} [status] - Initial status (defaults based on type)
   * @param {string} [providedId] - Optional UUID to use as document ID
   * @returns {Object} The created document
   * @throws {Error} With status 409 if providedId already exists
   */
  async createDocument(clientId, documentType, content, status = null, providedId = null) {
    if (config.useMockAPI) {
      await this._mockDelay(500);
      return mockData.createDocument(clientId, documentType, content, status, providedId);
    }

    // Real API - include providedId as 'id' if provided
    const body = { documentType, content, status };
    if (providedId) {
      body.id = providedId;
    }

    const response = await this._fetchWithAuth(
      `${config.apiEndpoint}/clients/${clientId}/documents`,
      {
        method: 'POST',
        body: JSON.stringify(body)
      }
    );

    if (!response.ok) {
      if (response.status === 409) {
        const error = new Error('Document ID already exists');
        error.status = 409;
        throw error;
      }
      this._handleError('Failed to create document', response.status);
    }

    return response.json();
  },

  /**
   * Update an existing document
   * @param {string} clientId - Client ID
   * @param {string} documentId - Document ID
   * @param {Object} updates - Updates to apply (can include status and/or content)
   * @returns {Object} The updated document
   */
  async updateDocument(clientId, documentId, updates) {
    if (config.useMockAPI) {
      await this._mockDelay(500);
      const updated = mockData.updateDocument(clientId, documentId, updates);
      if (!updated) {
        this._handleError('Document not found', 404);
      }
      return updated;
    }

    // Real API
    const response = await this._fetchWithAuth(
      `${config.apiEndpoint}/clients/${clientId}/documents/${documentId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(updates)
      }
    );

    if (!response.ok) {
      this._handleError('Failed to update document', response.status);
    }

    return response.json();
  },

  /**
   * Delete a document
   * @param {string} clientId - Client ID
   * @param {string} documentId - Document ID
   * @returns {Object} { success: boolean }
   */
  async deleteDocument(clientId, documentId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);
      const deleted = mockData.deleteDocument(clientId, documentId);
      if (!deleted) {
        this._handleError('Document not found', 404);
      }
      return { success: true };
    }

    // Real API
    const response = await this._fetchWithAuth(
      `${config.apiEndpoint}/clients/${clientId}/documents/${documentId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      this._handleError('Failed to delete document', response.status);
    }

    return response.json();
  },

  /**
   * Get completed form types for a client (computed from documents)
   * @param {string} clientId - Client ID
   * @returns {Array} Array of display names for completed form types
   */
  async getCompletedFormTypes(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(200);
      return mockData.getCompletedFormTypes(clientId);
    }

    // Real API - computed on backend or we fetch documents and compute
    const docs = await this.getClientDocuments(clientId);
    const types = new Set();

    docs.forEach(doc => {
      const displayName = DOCUMENT_TYPE_DISPLAY_NAMES[doc.documentType];
      if (displayName) {
        types.add(displayName);
      }
    });

    return Array.from(types);
  },

  /**
   * Get the most recent complete intake document for a client
   * @param {string} clientId - Client ID
   * @returns {Object|null} The intake document or null if not found
   */
  async getClientIntake(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      const intakes = mockData.getDocuments(clientId, 'intake', 'complete');
      return intakes.length > 0 ? intakes[0] : null;
    }

    // Real API - fetch intake documents and return most recent
    const intakes = await this.getClientDocuments(clientId, 'intake', 'complete');
    return intakes.length > 0 ? intakes[0] : null;
  },

  /**
   * Get the active treatment plan for a client
   * @param {string} clientId - Client ID
   * @returns {Object|null} The active treatment plan or null if not found
   */
  async getActiveTreatmentPlan(clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      return mockData.getCurrentTreatmentPlanFromDocs(clientId);
    }

    // Real API - fetch active treatment plan
    const plans = await this.getClientDocuments(clientId, 'treatment_plan', 'active');
    if (plans.length === 0) return null;

    // Transform to match expected UI format
    const plan = plans[0];
    return {
      id: plan.id,
      clientId: plan.clientId,
      ...plan.content,
      status: plan.status,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt
    };
  },

  // ========================================
  // NOTE OPERATIONS
  // ========================================

  /**
   * Save session note
   * @param {string} clientId - Client ID
   * @param {Object} noteData - Note data to save
   * @param {string} [providedId] - Optional UUID to use as document ID
   * @returns {{ note: Object }} The saved note wrapped in object
   */
  async saveNote(clientId, noteData, providedId = null) {
    // Serialize note data for API transmission
    const serializedData = this._serializeNoteData(noteData);

    if (config.useMockAPI) {
      await this._mockDelay(800);

      // Build content for unified document
      const content = {
        date: serializedData.date,
        duration: serializedData.duration,
        formType: serializedData.formType || 'Progress Note',
        delivery: serializedData.delivery || 'In Person',
        purpose: serializedData.purpose || '',
        mseEntries: serializedData.mseEntries || [],
        therapeuticApproaches: serializedData.therapeuticApproaches || [],
        therapeuticApproachesOther: serializedData.therapeuticApproachesOther || '',
        interventions: serializedData.interventions || [],
        futureNotes: serializedData.futureNotes || '',
        narrativeFormat: serializedData.narrativeFormat || '',
        notes: serializedData.notes || '',
        narrative: serializedData.narrative || ''
      };

      // Create document in unified documents collection (pass providedId for UUID support)
      const doc = mockData.createDocument(clientId, 'progress_note', content, 'complete', providedId);

      // Update client's last session date, lastFormType, and lastDelivery
      const client = mockData.getClient(clientId);
      if (client) {
        client.lastSessionDate = serializedData.date;
        client.totalSessions = (client.totalSessions || 0) + 1;
        client.lastFormType = serializedData.formType || 'Progress Note';
        client.lastDelivery = serializedData.delivery || 'In Person';
      }

      // Return in expected format (flatten content for backward compat)
      const note = {
        id: doc.id,
        clientId: doc.clientId,
        ...doc.content,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      };

      return { note };
    }

    // Real API - unified documents endpoint
    const body = {
      documentType: 'progress_note',
      content: serializedData,
      status: 'complete'
    };
    if (providedId) {
      body.id = providedId;
    }

    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents`, {
      method: 'POST',
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      if (response.status === 409) {
        const error = new Error('Document ID already exists');
        error.status = 409;
        throw error;
      }
      this._handleError('Failed to save note', response.status);
    }

    return response.json();
  },

  /**
   * Update existing note
   * @param {string} clientId - Client ID
   * @param {string} noteId - Note/document ID
   * @param {object} noteData - Updated note content
   */
  async updateNote(clientId, noteId, noteData) {
    if (config.useMockAPI) {
      await this._mockDelay(800);

      const doc = mockData.getDocument(clientId, noteId);
      if (!doc || doc.documentType !== 'progress_note') {
        this._handleError('Note not found', 404);
      }

      const updated = mockData.updateDocument(clientId, noteId, {
        content: noteData
      });

      // Return flattened format for backward compat
      return {
        id: updated.id,
        clientId: updated.clientId,
        ...updated.content,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt
      };
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify({ content: noteData })
    });

    if (!response.ok) {
      this._handleError('Failed to update note', response.status);
    }

    return response.json();
  },

  /**
   * Delete note
   * @param {string} clientId - Client ID
   * @param {string} noteId - Note/document ID
   */
  async deleteNote(clientId, noteId) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      const doc = mockData.getDocument(clientId, noteId);
      if (!doc || doc.documentType !== 'progress_note') {
        this._handleError('Note not found', 404);
      }

      mockData.deleteDocument(clientId, noteId);
      return { success: true };
    }

    // Real API - unified documents endpoint
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/clients/${clientId}/documents/${noteId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      this._handleError('Failed to delete note', response.status);
    }

    return response.json();
  },

  // ========================================
  // LEXICON CONFIGURATION
  // ========================================

  /**
   * Get current lexicon configuration
   * Returns: { version, updatedAt, updatedBy, interventionLexicon, therapeuticApproaches }
   */
  async getLexicon() {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      return mockData.lexicon;
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/config/lexicon`);

    if (!response.ok) {
      // 404 is okay - no custom lexicon, use default
      if (response.status === 404) {
        return null;
      }
      this._handleError('Failed to fetch lexicon', response.status);
    }

    return response.json();
  },

  /**
   * Save lexicon configuration (creates new version)
   * Returns: { version, updatedAt, updatedBy, message }
   */
  async saveLexicon(lexiconData) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Update mock data
      mockData.lexicon = {
        ...mockData.lexicon,
        ...lexiconData,
        version: mockData.lexicon.version + 1,
        updatedAt: new Date().toISOString(),
        updatedBy: mockData.user.email
      };

      return {
        version: mockData.lexicon.version,
        updatedAt: mockData.lexicon.updatedAt,
        updatedBy: mockData.lexicon.updatedBy,
        message: 'Lexicon saved successfully'
      };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/config/lexicon`, {
      method: 'PUT',
      body: JSON.stringify(lexiconData)
    });

    if (!response.ok) {
      this._handleError('Failed to save lexicon', response.status);
    }

    return response.json();
  },

  /**
   * Get lexicon version history
   * Returns: { versions: [{ version, updatedAt, updatedBy }] }
   */
  async getLexiconVersions() {
    if (config.useMockAPI) {
      await this._mockDelay(300);
      return {
        versions: [
          {
            version: mockData.lexicon.version,
            updatedAt: mockData.lexicon.updatedAt,
            updatedBy: mockData.lexicon.updatedBy
          }
        ]
      };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/config/lexicon/versions`);

    if (!response.ok) {
      this._handleError('Failed to fetch lexicon versions', response.status);
    }

    return response.json();
  },

  /**
   * Rollback to a previous lexicon version
   * Returns: { version, message, updatedAt }
   */
  async rollbackLexicon(version) {
    if (config.useMockAPI) {
      await this._mockDelay(500);

      // Mock rollback - just increment version
      mockData.lexicon.version += 1;
      mockData.lexicon.updatedAt = new Date().toISOString();

      return {
        version: mockData.lexicon.version,
        message: `Rolled back to version ${version} (saved as version ${mockData.lexicon.version})`,
        updatedAt: mockData.lexicon.updatedAt
      };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/config/lexicon/rollback`, {
      method: 'POST',
      body: JSON.stringify({ version })
    });

    if (!response.ok) {
      this._handleError('Failed to rollback lexicon', response.status);
    }

    return response.json();
  },

  // ========================================
  // USER SETTINGS
  // ========================================

  /**
   * Get user settings by type
   * @param {string} settingType - 'dashboard', 'preferences', etc.
   * Returns: { visibleColumns, newClientDefaults, ... } or null if not set
   */
  async getSettings(settingType) {
    // Check cache first
    const cacheKey = CacheManager.getSettingsKey(settingType);
    const cached = CacheManager.get(cacheKey);
    if (cached) {
      Logger.log(`Settings cache hit: ${settingType}`);
      return cached.data;
    }

    let data = null;

    if (config.useMockAPI) {
      await this._mockDelay(300);

      // Return mock settings from localStorage (simulating persistence)
      const stored = localStorage.getItem(`settings_${settingType}`);
      if (stored) {
        try {
          data = JSON.parse(stored);
        } catch (e) {
          data = null;
        }
      }

      // Return default settings if none stored
      if (!data && settingType === 'dashboard') {
        data = {
          visibleColumns: ['name', 'type', 'diagnosis', 'lastSession', 'status'],
          newClientDefaults: {
            paymentType: 'private-pay',
            sessionBasis: '',
            riskLevel: ''
          }
        };
      }

      if (!data && settingType === 'interventions') {
        data = {
          favorites: [],
          hidden: [],
          customInterventions: [],
          hiddenApproaches: [],
          customApproaches: [],
          // Usage tracking settings
          usageMode: 'global',           // 'global' | 'per-client'
          maxFrequentInterventions: 10   // 1-20 range
        };
      }
    } else {
      // Real API
      const response = await this._fetchWithAuth(`${config.apiEndpoint}/settings/${settingType}`);

      if (!response.ok) {
        // 404 is okay - no settings saved yet
        if (response.status === 404) {
          return null;
        }
        this._handleError('Failed to fetch settings', response.status);
      }

      data = await response.json();
    }

    // Cache the result (even null, to avoid repeated lookups)
    if (data !== null) {
      CacheManager.set(cacheKey, data, CacheTTL.SETTINGS);
      Logger.log(`Settings cached: ${settingType}`);
    }

    return data;
  },

  /**
   * Save user settings
   * @param {string} settingType - 'dashboard', 'preferences', etc.
   * @param {object} settings - The settings object to save
   * Returns: { success: true, updatedAt }
   */
  async saveSettings(settingType, settings) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      // Store in localStorage for mock persistence
      localStorage.setItem(`settings_${settingType}`, JSON.stringify(settings));

      return {
        success: true,
        updatedAt: new Date().toISOString()
      };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/settings/${settingType}`, {
      method: 'PUT',
      body: JSON.stringify({ settings })
    });

    if (!response.ok) {
      this._handleError('Failed to save settings', response.status);
    }

    return response.json();
  },

  // ========================================
  // INTERVENTION USAGE TRACKING
  // ========================================

  /**
   * Record intervention usage when a progress note is saved
   * This is fire-and-forget - failures should not affect note saving
   * @param {string[]} interventionIds - Array of intervention IDs used
   * @param {string} clientId - Client the note was saved for
   * @returns {Promise<{ success: boolean }>}
   */
  async recordInterventionUsage(interventionIds, clientId) {
    if (config.useMockAPI) {
      await this._mockDelay(200);

      // Load existing usage from localStorage, or start with seed data
      const stored = localStorage.getItem('intervention_usage');
      const data = stored
        ? JSON.parse(stored)
        : JSON.parse(JSON.stringify(mockData.interventionUsage)); // Deep copy seed data

      // Increment counts for each intervention
      interventionIds.forEach(id => {
        if (!data.usage[id]) {
          data.usage[id] = { total: 0 };
        }
        data.usage[id][clientId] = (data.usage[id][clientId] || 0) + 1;
        data.usage[id].total = (data.usage[id].total || 0) + 1;
      });

      data.lastUpdated = new Date().toISOString();
      localStorage.setItem('intervention_usage', JSON.stringify(data));

      return { success: true };
    }

    // Real API
    try {
      const response = await this._fetchWithAuth(
        `${config.apiEndpoint}/settings/intervention-usage`,
        {
          method: 'POST',
          body: JSON.stringify({ interventionIds, clientId })
        }
      );

      if (!response.ok) {
        // Fire-and-forget: log but don't throw
        Logger.warn('Failed to record intervention usage:', response.status);
        return { success: false };
      }

      return response.json();
    } catch (error) {
      // Fire-and-forget: log but don't throw
      Logger.warn('Failed to record intervention usage:', error);
      return { success: false };
    }
  },

  /**
   * Get intervention usage data
   * @param {string|null} clientId - Filter by client, or null for global aggregation
   * @returns {Promise<{ [interventionId: string]: number }>} Map of intervention ID to usage count
   */
  async getInterventionUsage(clientId = null) {
    if (config.useMockAPI) {
      await this._mockDelay(200);

      // Use localStorage if available, otherwise fall back to seed data
      const stored = localStorage.getItem('intervention_usage');
      const data = stored ? JSON.parse(stored) : mockData.interventionUsage;
      const result = {};

      Object.entries(data.usage).forEach(([interventionId, usageData]) => {
        if (clientId) {
          // Per-client usage
          const count = usageData[clientId] || 0;
          if (count > 0) {
            result[interventionId] = count;
          }
        } else {
          // Global usage
          if (usageData.total > 0) {
            result[interventionId] = usageData.total;
          }
        }
      });

      return result;
    }

    // Real API
    let url = `${config.apiEndpoint}/settings/intervention-usage`;
    if (clientId) {
      url += `?clientId=${encodeURIComponent(clientId)}`;
    }

    const response = await this._fetchWithAuth(url);

    if (!response.ok) {
      if (response.status === 404) {
        return {}; // No usage data yet
      }
      this._handleError('Failed to fetch intervention usage', response.status);
    }

    return response.json();
  },

  // ========================================
  // ACCOUNT / COMPLIANCE
  // ========================================

  /**
   * Get BAA (Business Associate Agreement) status
   * Returns: { baaSigned: boolean, signedAt: string | null }
   */
  async getBaaStatus() {
    if (config.useMockAPI) {
      await this._mockDelay(500);
      return {
        baaSigned: true,
        signedAt: '2025-01-15T10:30:00Z'
      };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/account/baa-status`);

    if (!response.ok) {
      this._handleError('Failed to fetch BAA status', response.status);
    }

    return response.json();
  },

  // ========================================
  // AI NARRATIVE GENERATION
  // ========================================

  /**
   * Generate a narrative progress note from prompts
   * @param {string} userPrompt - The interpolated prompt with session data
   * @param {Object} [options] - Optional generation parameters
   * @param {string} [options.systemPrompt] - System prompt defining AI role/behavior
   * @param {number} [options.temperature] - Model temperature (0.0-1.0)
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @param {string} [options.prefill] - Text to prefill Claude's response with
   * @param {string} [options.modelId] - Bedrock model ID to use
   * Returns: { narrative: "Generated narrative text...", prefill: "..." }
   */
  async generateNarrative(userPrompt, options = {}) {
    // Use mock only if useMockAPI is true AND useRealAI is false
    if (config.useMockAPI && !config.useRealAI) {
      // Simulate AI processing time (1.5-2.5 seconds)
      await this._mockDelay(1500 + Math.random() * 1000);

      // Use mockData's narrative generator
      const narrative = mockData.generateMockNarrative(userPrompt);

      // Return prefill so caller can concatenate if needed
      return {
        narrative,
        prefill: options.prefill || ''
      };
    }

    // Real API (or demo AI endpoint in hybrid mode)
    const requestBody = { prompt: userPrompt };

    // Include optional parameters if provided
    if (options.systemPrompt) {
      requestBody.systemPrompt = options.systemPrompt;
    }
    if (options.temperature !== undefined) {
      requestBody.temperature = options.temperature;
    }
    if (options.maxTokens !== undefined) {
      requestBody.maxTokens = options.maxTokens;
    }
    if (options.prefill !== undefined) {
      requestBody.prefill = options.prefill;  // Send even if empty string (to disable prefill)
    }
    if (options.modelId) {
      requestBody.modelId = options.modelId;
    }

    const response = await this._fetchWithAuth(`${config.apiEndpoint}/ai/narrative`, {
      method: 'POST',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Failed to generate narrative');
    }

    // Backend returns { narrative }, we add prefill for caller to use
    const result = await response.json();
    result.prefill = options.prefill || '';
    return result;
  },

  /**
   * Stream AI narrative generation using SSE
   * Uses a separate streaming API endpoint for real-time token delivery
   *
   * @param {string} userPrompt - The interpolated prompt with session data
   * @param {Object} options - Generation options
   * @param {string} [options.systemPrompt] - System prompt for AI
   * @param {number} [options.temperature] - Temperature (0.0-1.0)
   * @param {number} [options.maxTokens] - Maximum tokens to generate
   * @param {string} [options.prefill] - Prefill text (e.g., '<thinking>\nThis is a')
   * @param {string} [options.modelId] - Bedrock model ID
   * @param {Function} onChunk - Callback for each text chunk: (text) => void
   * @param {Function} onComplete - Callback when stream ends: (stopReason) => void
   * @param {Function} onError - Callback on error: (error) => void
   * @returns {{ abort: Function }} Object with abort function to cancel the stream
   */
  streamNarrative(userPrompt, options = {}, onChunk, onComplete, onError) {
    // Use mock only if useMockAPI is true AND useRealAI is false
    if (config.useMockAPI && !config.useRealAI) {
      return this._mockStreamNarrative(userPrompt, options, onChunk, onComplete, onError);
    }

    const controller = new AbortController();

    // Build request body
    const requestBody = { prompt: userPrompt };
    if (options.systemPrompt) requestBody.systemPrompt = options.systemPrompt;
    if (options.temperature !== undefined) requestBody.temperature = options.temperature;
    if (options.maxTokens !== undefined) requestBody.maxTokens = options.maxTokens;
    if (options.prefill !== undefined) requestBody.prefill = options.prefill;
    if (options.modelId) requestBody.modelId = options.modelId;

    // Determine endpoint and headers based on mode
    const isHybridMode = config.useMockAPI && config.useRealAI && config.demoAIEndpoint;

    let headers;
    let endpoint;

    if (isHybridMode) {
      // Hybrid mode: use demo AI endpoint (no auth required)
      headers = { 'Content-Type': 'application/json' };
      endpoint = config.demoAIEndpoint;
    } else {
      // Normal mode: use real backend with auth
      const token = localStorage.getItem('authToken');
      headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      if (!config.useMockAPI && config.testRole) {
        headers['X-Test-Role'] = config.testRole;
      }
      endpoint = config.streamingApiEndpoint || config.apiEndpoint;
    }

    (async () => {
      try {
        // In hybrid mode, POST directly to endpoint; otherwise append /ai/narrative
        const url = isHybridMode ? endpoint : `${endpoint}/ai/narrative`;
        const response = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Streaming failed: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.text) {
                  onChunk(data.text);
                } else if (data.done) {
                  onComplete(data.stopReason || 'end_turn');
                } else if (data.error) {
                  onError(new Error(data.error));
                }
              } catch (parseError) {
                Logger.warn('Failed to parse SSE data:', line, parseError);
              }
            }
          }
        }

        // Process any remaining buffer content
        if (buffer.startsWith('data: ')) {
          try {
            const data = JSON.parse(buffer.slice(6));
            if (data.text) onChunk(data.text);
            if (data.done) onComplete(data.stopReason || 'end_turn');
          } catch (e) {
            // Ignore incomplete final chunk
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          // User cancelled - not an error
          onComplete('user_cancelled');
        } else {
          onError(error);
        }
      }
    })();

    return { abort: () => controller.abort() };
  },

  /**
   * Mock streaming implementation - simulates streaming by chunking the mock response
   */
  _mockStreamNarrative(userPrompt, options, onChunk, onComplete, onError) {
    let aborted = false;
    const controller = { abort: () => { aborted = true; } };

    (async () => {
      try {
        // Small delay before starting
        await this._mockDelay(300);

        // Generate the full mock narrative
        const fullNarrative = mockData.generateMockNarrative(userPrompt);

        // Stream it word by word with small delays
        const words = fullNarrative.split(/(\s+)/); // Keep whitespace as separate tokens
        for (const word of words) {
          if (aborted) {
            onComplete('user_cancelled');
            return;
          }
          if (word) {
            onChunk(word);
            await this._mockDelay(20 + Math.random() * 30); // 20-50ms per word
          }
        }

        if (!aborted) {
          onComplete('end_turn');
        }
      } catch (error) {
        if (!aborted) {
          onError(error);
        }
      }
    })();

    return controller;
  },

  // ========================================
  // ADMIN USER MANAGEMENT (Admin+ only)
  // ========================================

  /**
   * Get all users (Admin+ only)
   * Returns: { users: [{ id, email, name, role, status, mfaEnabled, createdAt }] }
   */
  async getUsers() {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      // Return mock users list
      return {
        users: mockData.users || [
          {
            ...this._getMockUser(),
            status: 'CONFIRMED',
            createdAt: '2024-01-01T00:00:00Z'
          }
        ]
      };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/admin/users`);

    if (!response.ok) {
      this._handleError('Failed to fetch users', response.status);
    }

    return response.json();
  },

  /**
   * Invite a new user (Admin+ only)
   * @param {object} userData - { email, name, role }
   * Returns: { success: true, user: {...} }
   */
  async inviteUser(userData) {
    if (config.useMockAPI) {
      await this._mockDelay(600);

      // Create mock user
      const newUser = {
        id: `user-${Date.now()}`,
        email: userData.email,
        name: userData.name,
        role: userData.role || 'supervisor',
        groups: [userData.role || 'supervisor'],
        status: 'FORCE_CHANGE_PASSWORD',
        mfaEnabled: false,
        createdAt: new Date().toISOString()
      };

      // Add to mock users list
      if (!mockData.users) {
        mockData.users = [this._getMockUser()];
      }
      mockData.users.push(newUser);

      return { success: true, user: newUser };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/admin/users/invite`, {
      method: 'POST',
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      this._handleError('Failed to invite user', response.status);
    }

    return response.json();
  },

  /**
   * Update a user's role (Admin+ only)
   * @param {string} userId - User ID
   * @param {string} role - New role ('supervisor', 'admin', 'sysadmin')
   * Returns: { success: true }
   */
  async updateUserRole(userId, role) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      // Update mock user
      const user = mockData.users?.find(u => u.id === userId);
      if (user) {
        user.role = role;
        user.groups = [role];
      }

      return { success: true };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    });

    if (!response.ok) {
      this._handleError('Failed to update user role', response.status);
    }

    return response.json();
  },

  /**
   * Delete a user (Admin+ only)
   * @param {string} userId - User ID
   * Returns: { success: true }
   */
  async deleteUser(userId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      // Remove from mock users
      if (mockData.users) {
        mockData.users = mockData.users.filter(u => u.id !== userId);
      }

      return { success: true };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/admin/users/${userId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      this._handleError('Failed to delete user', response.status);
    }

    return response.json();
  },

  /**
   * Reset a user's MFA (Admin+ only)
   * @param {string} userId - User ID
   * Returns: { success: true }
   */
  async resetUserMFA(userId) {
    if (config.useMockAPI) {
      await this._mockDelay(400);

      // Update mock user
      const user = mockData.users?.find(u => u.id === userId);
      if (user) {
        user.mfaEnabled = false;
      }

      return { success: true };
    }

    // Real API
    const response = await this._fetchWithAuth(`${config.apiEndpoint}/admin/users/${userId}/reset-mfa`, {
      method: 'POST'
    });

    if (!response.ok) {
      this._handleError('Failed to reset user MFA', response.status);
    }

    return response.json();
  }
};

// Expose to window for Alpine template access
window.API = API;
