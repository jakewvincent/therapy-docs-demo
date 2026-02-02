/**
 * Client Dashboard Alpine.js Application
 *
 * Manages the client list view with filtering, sorting, and detail panel.
 * Integrates with the existing API layer for data fetching.
 */

import { Logger } from './logger.js';
import { DateUtils } from './dateUtils.js';
import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { NavDrawer } from './components/drawer.js';
import { NewClientModal } from './components/newClientModal.js';
import { FeatureStatus } from './featureStatus.js';
import { CacheManager, CacheKeys } from './cacheManager.js';

export function createClientsDashboardData() {
    return {
        // ============ DATA STATE ============

        clients: [],
        loading: true,
        errorMessage: '',

        // ============ UI STATE ============

        // Shared drawer state
        ...NavDrawer.alpineData,

        // Shared new client modal state
        ...NewClientModal.alpineData,

        // User role (for drawer visibility)
        userRole: '',
        userLicense: '',

        panelOpen: false,
        selectedClient: null,
        activeTab: 'overview',

        // ============ ARCHIVE STATE ============

        showArchiveModal: false,
        archiving: false,
        archivedCount: 0,

        // ============ EDITING STATE ============

        editingField: null,
        editBuffer: {},
        editError: null,
        savingField: false,

        // ============ SELECTED CLIENT DATA ============

        clientSessions: [],
        clientDiagnosis: null,
        clientTreatmentPlan: null,
        loadingClientData: false,

        // ============ FILTER STATE ============

        searchQuery: '',
        statusFilter: 'all',
        sortBy: 'lastSession',

        // ============ DASHBOARD SETTINGS ============

        dashboardSettings: {
            visibleColumns: ['name', 'type', 'diagnosis', 'lastSession', 'status'],
            newClientDefaults: {}
        },

        // ============ TAB CONFIGURATION ============

        /**
         * Tab definitions for client details slideout
         */
        allTabs: [
            { id: 'overview', label: 'Overview' },
            { id: 'notes', label: 'Progress Notes' },
            { id: 'txplan', label: 'Tx Plan' },
            { id: 'intake', label: 'Intake' }
        ],

        /**
         * Tab visibility settings (loaded from API)
         */
        tabVisibilitySettings: {
            showBetaTabs: false,
            showUndevelopedTabs: false
        },

        // ============ DOCUMENT TYPE VISIBILITY ============

        /**
         * Document type visibility settings (loaded from API)
         * Controls visibility of diagnosis column and overview cards
         */
        documentTypeVisibility: {
            showBeta: false,
            showUndeveloped: false,
            diagnosisEnabled: true,
            treatmentPlanEnabled: true,
            intakeEnabled: true,
            consultationEnabled: true,
            dischargeEnabled: true
        },

        // ============ COMPUTED PROPERTIES ============

        /**
         * Check if current user is admin or higher
         * Note: Using a method instead of getter for better Alpine.js compatibility
         * with dynamically injected drawer HTML
         */
        isAdmin() {
            const roleHierarchy = ['supervisor', 'admin', 'sysadmin'];
            const userRoleIndex = roleHierarchy.indexOf(this.userRole);
            const requiredIndex = roleHierarchy.indexOf('admin');
            return userRoleIndex >= requiredIndex;
        },

        /**
         * Get tabs filtered by visibility settings, with status info attached
         */
        get visibleTabs() {
            return this.allTabs.filter(tab => {
                const status = FeatureStatus.getStatus('clientDetailsTabs', tab.id);

                // Released tabs always visible
                if (status === 'released') return true;

                // Beta tabs: check setting
                if (status === 'beta') {
                    return this.tabVisibilitySettings.showBetaTabs;
                }

                // Not implemented tabs: check setting
                if (status === 'notImplemented') {
                    return this.tabVisibilitySettings.showUndevelopedTabs;
                }

                return true;
            }).map(tab => ({
                ...tab,
                status: FeatureStatus.getStatus('clientDetailsTabs', tab.id)
            }));
        },

        /**
         * Check if Diagnosis document type should be visible
         * Diagnosis is beta, so requires showBeta AND diagnosisEnabled
         */
        isDiagnosisVisible() {
            return this.documentTypeVisibility.showBeta &&
                   this.documentTypeVisibility.diagnosisEnabled;
        },

        /**
         * Check if Treatment Plan document type should be visible
         * Treatment Plan is beta, so requires showBeta AND treatmentPlanEnabled
         */
        isTreatmentPlanVisible() {
            return this.documentTypeVisibility.showBeta &&
                   this.documentTypeVisibility.treatmentPlanEnabled;
        },

        /**
         * Returns filtered and sorted clients based on current filter state
         */
        get filteredClients() {
            let result = [...this.clients];

            // Enrich with computed fields
            result = result.map(client => {
                const daysSince = this.calculateDaysSince(client.lastSessionDate);
                return {
                    ...client,
                    daysSinceLastSession: daysSince,
                    // Only mark as overdue if they have sessions and it's been 14+ days
                    isOverdue: daysSince !== null && daysSince > 14
                };
            });

            // Filter by search query
            if (this.searchQuery) {
                const query = this.searchQuery.toLowerCase();
                result = result.filter(c =>
                    c.name.toLowerCase().includes(query) ||
                    (c.diagnosis && c.diagnosis.toLowerCase().includes(query))
                );
            }

            // Filter by status
            if (this.statusFilter !== 'all') {
                result = result.filter(c => c.status === this.statusFilter);
            }

            // Sort
            if (this.sortBy === 'lastSession') {
                // Clients with no sessions (null) sort to the end
                result.sort((a, b) => {
                    if (a.daysSinceLastSession === null && b.daysSinceLastSession === null) return 0;
                    if (a.daysSinceLastSession === null) return 1;
                    if (b.daysSinceLastSession === null) return -1;
                    return a.daysSinceLastSession - b.daysSinceLastSession;
                });
            } else if (this.sortBy === 'name') {
                result.sort((a, b) => a.name.localeCompare(b.name));
            } else if (this.sortBy === 'totalSessions') {
                result.sort((a, b) => b.totalSessions - a.totalSessions);
            }

            return result;
        },

        /**
         * Count of active clients not seen in 14+ days
         * Excludes clients with 0 sessions (they're not "overdue", just new)
         */
        get overdueCount() {
            return this.clients.filter(c => {
                const daysSince = this.calculateDaysSince(c.lastSessionDate);
                return daysSince !== null && daysSince > 14 && c.status === 'active';
            }).length;
        },

        /**
         * Count of clients with risk flags
         */
        get riskFlagCount() {
            return this.clients.filter(c => c.hasRiskFlag).length;
        },

        /**
         * Count of active clients with insurance warnings (auth expiring or low sessions)
         */
        get insuranceWarningCount() {
            return this.clients.filter(c => {
                if (c.status !== 'active') return false;
                if (this.isAuthExpiringSoon(c.authorizationExpiration)) return true;
                if (c.sessionsRemaining !== null && c.sessionsRemaining !== undefined && c.sessionsRemaining <= 3) return true;
                return false;
            }).length;
        },

        // ============ LIFECYCLE ============

        /**
         * Initialize the dashboard - called via x-init
         */
        async init() {
            // Safety check: prevent dangerous config combination
            AuthGuard.validateConfig();

            // Auth check - redirect to login if not authenticated
            if (!AuthGuard.checkAuth()) return;

            // Load user info
            const userInfo = AuthGuard.loadUserInfo();
            if (userInfo) {
                this.userEmail = userInfo.email;
                this.userName = userInfo.name;
                this.userRole = userInfo.role;
                this.userLicense = userInfo.license || '';
            }

            // Load settings, clients, and archived count in parallel
            await Promise.all([
                this.loadSettings(),
                this.loadTabVisibilitySettings(),
                this.loadDocumentTypeVisibility(),
                this.loadClients(),
                this.loadArchivedCount()
            ]);

            // Check URL for client parameter (for refresh persistence)
            const urlParams = new URLSearchParams(window.location.search);
            const clientId = urlParams.get('client');
            if (clientId) {
                const client = this.clients.find(c => c.id === clientId);
                if (client) {
                    this.openPanel(client);
                } else {
                    // Client not found - clear invalid URL parameter
                    const url = new URL(window.location);
                    url.searchParams.delete('client');
                    history.replaceState({}, '', url);
                }
            }
        },

        /**
         * Logout user and redirect to login page
         */
        async logout() {
            await AuthGuard.logout();
        },

        // ============ DATA METHODS ============

        /**
         * Load dashboard settings from API
         */
        async loadSettings() {
            try {
                const settings = await API.getSettings('dashboard');
                if (settings) {
                    this.dashboardSettings = {
                        visibleColumns: settings.visibleColumns || ['name', 'type', 'diagnosis', 'lastSession', 'status'],
                        newClientDefaults: settings.newClientDefaults || {}
                    };
                }
            } catch (error) {
                Logger.warn('Could not load dashboard settings, using defaults:', error);
            }
        },

        /**
         * Load tab visibility settings from API
         */
        async loadTabVisibilitySettings() {
            try {
                const settings = await API.getSettings('clientDetailsTabVisibility');
                if (settings) {
                    // Handle migration from old property name
                    let showUndeveloped = settings.showUndevelopedTabs;
                    if (showUndeveloped === undefined && settings.showNotImplementedTabs !== undefined) {
                        showUndeveloped = settings.showNotImplementedTabs;
                    }

                    this.tabVisibilitySettings = {
                        showBetaTabs: settings.showBetaTabs ?? false,
                        showUndevelopedTabs: showUndeveloped ?? false
                    };
                }
                this.validateActiveTab();
            } catch (error) {
                Logger.warn('Could not load tab visibility settings, using defaults:', error);
            }
        },

        /**
         * Load document type visibility settings from API
         * (mirrors the logic in app.js for consistency)
         */
        async loadDocumentTypeVisibility() {
            try {
                const settings = await API.getSettings('documentTypeVisibility');
                if (settings) {
                    // Handle migration from old property names
                    let showBeta = settings.showBeta;
                    let showUndeveloped = settings.showUndeveloped;

                    if (showBeta === undefined && settings.clinicalFormsEnabled !== undefined) {
                        showBeta = settings.clinicalFormsEnabled;
                    }
                    if (showUndeveloped === undefined && settings.hideNotImplemented !== undefined) {
                        showUndeveloped = !settings.hideNotImplemented;
                    }

                    this.documentTypeVisibility = {
                        showBeta: showBeta ?? false,
                        showUndeveloped: showUndeveloped ?? false,
                        diagnosisEnabled: settings.diagnosisEnabled ?? true,
                        treatmentPlanEnabled: settings.treatmentPlanEnabled ?? true,
                        intakeEnabled: settings.intakeEnabled ?? true,
                        consultationEnabled: settings.consultationEnabled ?? true,
                        dischargeEnabled: settings.dischargeEnabled ?? true
                    };
                }
            } catch (error) {
                Logger.warn('Could not load document type visibility settings, using defaults:', error);
            }
        },

        /**
         * Ensure activeTab is valid after visibility changes.
         * If current tab is hidden, fall back to first visible tab.
         */
        validateActiveTab() {
            const visibleIds = this.visibleTabs.map(t => t.id);
            if (!visibleIds.includes(this.activeTab)) {
                this.activeTab = visibleIds[0] || 'overview';
            }
        },

        /**
         * Load all clients from API
         */
        async loadClients() {
            try {
                this.loading = true;
                this.errorMessage = '';
                const clients = await API.getClients();

                // Enrich clients with diagnosis text for display
                this.clients = await Promise.all(clients.map(async (client) => {
                    let diagnosis = null;
                    let hasRiskFlag = false;

                    // Fetch diagnosis if client has one
                    if (client.currentDiagnosisId) {
                        try {
                            diagnosis = await API.getCurrentDiagnosis(client.id);
                        } catch (e) {
                            Logger.warn(`Could not fetch diagnosis for client ${client.id}`, e);
                        }
                    }

                    // Check for risk flags in last session
                    try {
                        const lastSession = await API.getLastSession(client.id);
                        if (lastSession && lastSession.mseEntries) {
                            hasRiskFlag = this.checkForRiskFlags(lastSession.mseEntries);
                        }
                    } catch (e) {
                        Logger.warn(`Could not fetch last session for client ${client.id}`, e);
                    }

                    return {
                        ...client,
                        diagnosis: diagnosis ? diagnosis.text : null,
                        diagnosisDate: diagnosis ? diagnosis.date : null,
                        hasRiskFlag
                    };
                }));
            } catch (error) {
                this.errorMessage = 'Failed to load clients. Please try again.';
                Logger.error('Error loading clients:', error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Load detailed data for a specific client (sessions, diagnosis, treatment plan)
         */
        async loadClientDetails(client) {
            this.loadingClientData = true;
            try {
                const [sessions, diagnosis, treatmentPlan] = await Promise.all([
                    API.getSessions(client.id),
                    client.currentDiagnosisId ? API.getCurrentDiagnosis(client.id) : Promise.resolve(null),
                    client.currentTreatmentPlanId ? API.getCurrentTreatmentPlan(client.id) : Promise.resolve(null)
                ]);

                // Sort sessions by date (newest first)
                this.clientSessions = (sessions || []).sort((a, b) =>
                    new Date(b.date) - new Date(a.date)
                );
                this.clientDiagnosis = diagnosis;
                this.clientTreatmentPlan = treatmentPlan;

                // Check if treatment plan review is overdue
                if (this.clientTreatmentPlan && this.clientTreatmentPlan.reviewDate) {
                    // Parse as local midnight to avoid timezone issues
                    const reviewDate = new Date(this.clientTreatmentPlan.reviewDate + 'T00:00:00');
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    this.clientTreatmentPlan.isOverdue = reviewDate < today;
                }
            } catch (error) {
                Logger.error('Error loading client details:', error);
            } finally {
                this.loadingClientData = false;
            }
        },

        /**
         * Create a new client
         */
        async createClient() {
            if (!this.newClient.name.trim()) {
                return;
            }

            try {
                this.creatingClient = true;
                const clientData = {
                    name: this.newClient.name.trim(),
                    clientType: this.newClient.clientType,
                    paymentType: this.newClient.paymentType,
                    sessionBasis: this.newClient.sessionBasis || null,
                    referralSource: this.newClient.referralSource.trim() || null,
                    status: 'active'
                };

                await API.createClient(clientData);

                // Invalidate clients cache so all pages get fresh data
                CacheManager.invalidate(CacheKeys.CLIENTS);

                // Reload clients to get the new one
                await this.loadClients();

                // Close modal
                this.closeNewClientModal();
            } catch (error) {
                Logger.error('Error creating client:', error);
                this.errorMessage = 'Failed to create client. Please try again.';
            } finally {
                this.creatingClient = false;
            }
        },

        /**
         * Load the count of archived clients
         */
        async loadArchivedCount() {
            try {
                this.archivedCount = await API.getArchivedCount();
            } catch (error) {
                Logger.warn('Could not load archived count:', error);
                this.archivedCount = 0;
            }
        },

        /**
         * Archive the currently selected client
         */
        async archiveClient() {
            if (!this.selectedClient) return;

            try {
                this.archiving = true;
                await API.archiveClient(this.selectedClient.id);

                // Invalidate clients cache so all pages get fresh data
                CacheManager.invalidate(CacheKeys.CLIENTS);

                // Close modal and panel
                this.showArchiveModal = false;
                this.closePanel();

                // Reload clients (archived client will be filtered out)
                await this.loadClients();

                // Update archived count
                await this.loadArchivedCount();

            } catch (error) {
                Logger.error('Error archiving client:', error);
                this.errorMessage = 'Failed to archive client. Please try again.';
            } finally {
                this.archiving = false;
            }
        },

        // ============ UI METHODS ============

        /**
         * Open the detail panel for a client
         */
        openPanel(client) {
            // Ensure daysSinceLastSession is computed (may be missing if loaded from URL)
            const daysSince = this.calculateDaysSince(client.lastSessionDate);
            this.selectedClient = {
                ...client,
                daysSinceLastSession: daysSince,
                isOverdue: daysSince !== null && daysSince > 14
            };
            this.activeTab = 'overview';
            this.panelOpen = true;
            this.loadClientDetails(client);

            // Update URL to reflect selected client (for refresh persistence)
            const url = new URL(window.location);
            url.searchParams.set('client', client.id);
            history.replaceState({ clientId: client.id }, '', url);
        },

        /**
         * Close the detail panel
         */
        closePanel() {
            this.panelOpen = false;

            // Remove client from URL
            const url = new URL(window.location);
            url.searchParams.delete('client');
            history.replaceState({}, '', url);

            // Wait for animation to complete before clearing data
            setTimeout(() => {
                if (!this.panelOpen) {
                    this.selectedClient = null;
                    this.clientSessions = [];
                    this.clientDiagnosis = null;
                    this.clientTreatmentPlan = null;
                }
            }, 300);
        },

        /**
         * Open new client modal
         */
        openNewClientModal() {
            // Use settings defaults for new client form
            this.newClient = NewClientModal.getDefaultNewClient(this.dashboardSettings);
            this.showNewClientModal = true;
        },

        /**
         * Close new client modal
         */
        closeNewClientModal() {
            this.showNewClientModal = false;
            this.creatingClient = false;
        },

        // ============ EDITING METHODS ============

        /**
         * Start editing a field
         */
        startEditing(fieldName) {
            // Cancel any existing edit
            if (this.editingField && this.editingField !== fieldName) {
                this.cancelEditing();
            }

            // Initialize edit buffer with current value
            this.editBuffer[fieldName] = this.selectedClient[fieldName];
            this.editingField = fieldName;
            this.editError = null;
        },

        /**
         * Cancel editing without saving
         */
        cancelEditing() {
            this.editingField = null;
            this.editBuffer = {};
            this.editError = null;
        },

        /**
         * Save the current edit
         */
        async saveEdit() {
            if (!this.editingField || this.savingField) return;

            const fieldName = this.editingField;
            const newValue = this.editBuffer[fieldName];

            // Validation
            const validationError = this.validateField(fieldName, newValue);
            if (validationError) {
                this.editError = validationError;
                return;
            }

            try {
                this.savingField = true;
                this.editError = null;

                // Call API
                const updates = { [fieldName]: newValue };
                const updatedClient = await API.updateClient(this.selectedClient.id, updates);

                // Invalidate clients cache so all pages get fresh data
                CacheManager.invalidate(CacheKeys.CLIENTS);

                // Update selectedClient
                Object.assign(this.selectedClient, updatedClient);

                // Update client in main list
                const listClient = this.clients.find(c => c.id === this.selectedClient.id);
                if (listClient) {
                    Object.assign(listClient, updatedClient);
                }

                // Exit edit mode
                this.editingField = null;
                this.editBuffer = {};

            } catch (error) {
                this.editError = error.message || 'Failed to save. Please try again.';
            } finally {
                this.savingField = false;
            }
        },

        /**
         * Validate a field value
         */
        validateField(fieldName, value) {
            switch (fieldName) {
                case 'name':
                    if (!value || !value.trim()) return 'Name is required';
                    break;
                case 'sessionsRemaining':
                case 'sessionAdjustment':
                    if (value !== null && value !== '' && (isNaN(value) || value < 0)) {
                        return 'Must be a positive number';
                    }
                    break;
            }
            return null;
        },

        /**
         * Check if a field is currently being edited
         */
        isEditing(fieldName) {
            return this.editingField === fieldName;
        },

        /**
         * Get the computed total sessions display value
         */
        getDisplayTotalSessions() {
            if (!this.selectedClient) return 0;
            const inSystem = this.selectedClient.totalSessions || 0;
            const adjustment = this.selectedClient.sessionAdjustment || 0;
            return inSystem + adjustment;
        },

        /**
         * Format total sessions with breakdown
         */
        formatTotalSessionsDisplay() {
            if (!this.selectedClient) return '0';
            const inSystem = this.selectedClient.totalSessions || 0;
            const adjustment = this.selectedClient.sessionAdjustment || 0;
            const total = inSystem + adjustment;

            if (adjustment > 0) {
                return `${total} (${inSystem} in system + ${adjustment} prior)`;
            }
            return total.toString();
        },

        // ============ HELPER METHODS ============

        /**
         * Calculate days since a given date
         * Returns null if no date provided (e.g., client with 0 sessions)
         */
        calculateDaysSince(dateString) {
            if (!dateString) return null;
            // Parse as local midnight to avoid timezone issues
            const date = new Date(dateString + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffTime = today - date;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            return diffDays;
        },

        /**
         * Check MSE entries for risk flags
         */
        checkForRiskFlags(mseEntries) {
            if (!mseEntries || !Array.isArray(mseEntries)) return false;

            const riskIndicators = ['suicidal-ideation', 'homicidal-ideation', 'self-harm', 'harm-to-others'];

            return mseEntries.some(entry => {
                if (entry.risk && Array.isArray(entry.risk)) {
                    return entry.risk.some(r => riskIndicators.includes(r));
                }
                return false;
            });
        },

        /**
         * Derive session frequency from session history
         */
        deriveSessionFrequency(sessions) {
            if (!sessions || sessions.length < 2) return 'N/A';

            // Calculate average days between sessions
            const sortedSessions = [...sessions].sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );

            let totalDays = 0;
            for (let i = 0; i < Math.min(sortedSessions.length - 1, 5); i++) {
                const current = new Date(sortedSessions[i].date);
                const next = new Date(sortedSessions[i + 1].date);
                totalDays += (current - next) / (1000 * 60 * 60 * 24);
            }

            const avgDays = totalDays / Math.min(sortedSessions.length - 1, 5);

            if (avgDays <= 8) return 'Weekly';
            if (avgDays <= 16) return 'Every 2 weeks';
            if (avgDays <= 35) return 'Monthly';
            return 'Inconsistent';
        },

        /**
         * Format a date string for display.
         * Uses DateUtils to handle date-only vs timestamp formats correctly.
         */
        formatDate(dateString) {
            return DateUtils.formatAuto(dateString);
        },

        /**
         * Get the theme/purpose from a session
         */
        getSessionTheme(session) {
            if (session.purpose?.trim()) {
                return session.purpose;
            }
            if (session.notes) {
                // Return first 50 chars of notes as fallback
                return session.notes.substring(0, 50) + (session.notes.length > 50 ? '...' : '');
            }
            return 'Session notes';
        },

        /**
         * Check if authorization is expiring within 14 days
         */
        isAuthExpiringSoon(dateString) {
            if (!dateString) return false;
            // Parse as local midnight to avoid timezone issues
            const expirationDate = new Date(dateString + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysUntilExpiration = (expirationDate - today) / (1000 * 60 * 60 * 24);
            return daysUntilExpiration <= 14 && daysUntilExpiration >= 0;
        },

        /**
         * Check if client has any warnings (auth expiring, low sessions)
         */
        hasInsuranceWarning(client) {
            if (this.isAuthExpiringSoon(client.authorizationExpiration)) return true;
            if (client.sessionsRemaining !== null && client.sessionsRemaining !== undefined && client.sessionsRemaining <= 3) return true;
            return false;
        },

        /**
         * Check if a column should be visible based on dashboard settings
         */
        isColumnVisible(columnId) {
            // Name is always visible
            if (columnId === 'name') return true;
            return this.dashboardSettings.visibleColumns.includes(columnId);
        }
    };
}
