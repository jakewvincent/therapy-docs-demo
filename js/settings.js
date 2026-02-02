/**
 * Settings Page Alpine.js Application
 *
 * Manages user settings including dashboard column visibility
 * and new client defaults.
 */

import { Logger } from './logger.js';
import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { NavDrawer } from './components/drawer.js';
import { NarrativeDefaults } from './narrativeDefaults.js';
import { PromptTemplates } from './promptTemplates.js';
import { CacheManager } from './cacheManager.js';

export function createSettingsAppData() {
    return {
        // ============ STATE ============

        // Shared drawer state
        ...NavDrawer.alpineData,

        // User info (for profile display and drawer)
        userEmail: '',
        userName: '',
        userRole: '',
        userLicense: '',

        loading: true,
        saving: false,
        errorMessage: '',
        showSuccess: false,

        // Card expansion state (all collapsed by default)
        expandedCards: {
            profile: false,
            compliance: false,
            documentTypes: false,
            editMode: false,
            interventions: false,
            dashboard: false,
            newClientDefaults: false,
            aiNarrative: false
        },

        // Compliance & Security
        baaStatus: {
            loading: true,
            signed: false,
            signedAt: null,
            error: null
        },

        // Profile settings
        profileLicense: '',
        originalProfileLicense: '',
        savingProfile: false,
        showProfileSuccess: false,

        // Original settings (for change detection)
        originalSettings: null,

        // Current settings being edited
        settings: {
            visibleColumns: ['name', 'type', 'diagnosis', 'lastSession', 'status'],
            newClientDefaults: {
                paymentType: 'private-pay',
                sessionBasis: '',
                riskLevel: ''
            }
        },

        // Narrative/AI settings (separate from dashboard settings)
        narrativeSettings: {
            systemPrompt: '',
            temperature: 0.7,
            maxTokens: 2048,
            prefill: '<thinking>',
            modelId: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
            // Structured sections (replaces monolithic promptTemplate)
            sections: {
                progressNoteData: '',
                instructions: '',
                thinkingOutputFormat: '',
                narrativeOutputFormat: ''
            },
            // Dynamic examples array
            examples: []
        },
        originalNarrativeSettings: null,
        savingNarrative: false,
        showNarrativeSuccess: false,

        // Example validation state (exampleId -> { valid, missing })
        exampleValidation: {},

        // UI state for examples section
        expandedExampleId: null,

        // Document type visibility settings
        documentTypeSettings: {
            // Category toggles (hide by default, matching tab visibility pattern)
            showBeta: false,
            showUndeveloped: false,
            // Individual document type toggles
            intakeEnabled: true,
            diagnosisEnabled: true,
            treatmentPlanEnabled: true,
            consultationEnabled: true,
            dischargeEnabled: true
        },
        originalDocumentTypeSettings: null,

        // Tab visibility settings (for Client Details slideout)
        tabVisibilitySettings: {
            showBetaTabs: false,
            showUndevelopedTabs: false
        },
        originalTabVisibilitySettings: null,

        // Edit mode settings (for progress note editing behavior)
        editModeSettings: {
            progressNoteEditMode: 'direct-edit'  // 'direct-edit' | 'amendment-required'
        },
        originalEditModeSettings: null,
        savingEditMode: false,
        showEditModeSuccess: false,

        // Intervention display settings (for progress notes intervention browser)
        interventionSettings: {
            usageMode: 'global',           // 'global' | 'per-client'
            fillWithGlobal: true,          // When per-client, fill remaining slots with global frequent
            maxFrequentInterventions: 10,  // 1-20 range
            limitFavoritesInQuickAdd: false,  // false = show all favorites
            maxFavoritesInQuickAdd: 10,       // max favorites when limit is ON
            sortFavoritesByUsage: true        // true = sort by usage, false = array order
        },
        originalInterventionSettings: null,

        // Available AI models for narrative generation
        availableModels: [
            {
                id: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
                name: 'Claude Sonnet 4.5',
                description: 'Latest Sonnet with improved capabilities'
            },
            {
                id: 'global.anthropic.claude-haiku-4-5-20251001-v1:0',
                name: 'Claude Haiku 4.5',
                description: 'Fastest and most cost-effective'
            },
            {
                id: 'global.anthropic.claude-sonnet-4-20250514-v1:0',
                name: 'Claude Sonnet 4',
                description: 'Balanced performance and speed'
            }
        ],

        // Available columns configuration
        availableColumns: [
            {
                id: 'name',
                label: 'Name',
                description: 'Client name (always visible)',
                icon: 'setting-name-column',
                required: true
            },
            {
                id: 'type',
                label: 'Type',
                description: 'Individual, Couple, or Family',
                icon: 'setting-client-type-column',
                required: false
            },
            {
                id: 'diagnosis',
                label: 'Diagnosis',
                description: 'Current diagnosis on file',
                icon: 'setting-diagnosis-column',
                required: false
            },
            {
                id: 'lastSession',
                label: 'Last Session',
                description: 'Days since last session',
                icon: 'setting-last-session-column',
                required: false
            },
            {
                id: 'status',
                label: 'Status',
                description: 'Active or Inactive',
                icon: 'setting-status-column',
                required: false
            },
            {
                id: 'sessionBasis',
                label: 'Session Basis',
                description: 'Weekly, Biweekly, As Needed',
                icon: 'setting-session-basis-column',
                required: false
            },
            {
                id: 'payer',
                label: 'Payer',
                description: 'Insurance or payment source',
                icon: 'setting-payer-column',
                required: false
            },
            {
                id: 'referralSource',
                label: 'Referral Source',
                description: 'How client found you',
                icon: 'setting-referral-column',
                required: false
            }
        ],

        // ============ COMPUTED ============

        /**
         * Check if current user is admin or higher
         * Note: Using method instead of getter for Alpine.js compatibility with drawer
         */
        isAdmin() {
            const roleHierarchy = ['supervisor', 'admin', 'sysadmin'];
            const userRoleIndex = roleHierarchy.indexOf(this.userRole);
            const requiredIndex = roleHierarchy.indexOf('admin');
            return userRoleIndex >= requiredIndex;
        },

        /**
         * Check if settings have changed from original
         */
        get hasChanges() {
            if (!this.originalSettings) return false;
            return JSON.stringify(this.settings) !== JSON.stringify(this.originalSettings);
        },

        /**
         * Check if narrative settings have changed from original
         */
        get hasNarrativeChanges() {
            if (!this.originalNarrativeSettings) return false;
            return JSON.stringify(this.narrativeSettings) !== JSON.stringify(this.originalNarrativeSettings);
        },

        /**
         * Check if document type settings have changed from original
         */
        get hasDocumentTypeChanges() {
            if (!this.originalDocumentTypeSettings) return false;
            return JSON.stringify(this.documentTypeSettings) !== JSON.stringify(this.originalDocumentTypeSettings);
        },

        /**
         * Check if tab visibility settings have changed from original
         */
        get hasTabVisibilityChanges() {
            if (!this.originalTabVisibilitySettings) return false;
            return JSON.stringify(this.tabVisibilitySettings) !== JSON.stringify(this.originalTabVisibilitySettings);
        },

        /**
         * Check if edit mode settings have changed from original
         */
        get hasEditModeChanges() {
            if (!this.originalEditModeSettings) return false;
            return JSON.stringify(this.editModeSettings) !== JSON.stringify(this.originalEditModeSettings);
        },

        /**
         * Check if intervention settings have changed from original
         */
        get hasInterventionSettingsChanges() {
            if (!this.originalInterventionSettings) return false;
            return JSON.stringify(this.interventionSettings) !== JSON.stringify(this.originalInterventionSettings);
        },

        /**
         * Boolean getter/setter for amendment requirement toggle.
         * Maps between UI toggle state and underlying string setting.
         */
        get requireAmendments() {
            return this.editModeSettings.progressNoteEditMode === 'amendment-required';
        },
        set requireAmendments(value) {
            this.editModeSettings.progressNoteEditMode = value ? 'amendment-required' : 'direct-edit';
        },

        /**
         * Check if profile has changed from original
         */
        get hasProfileChanges() {
            return this.profileLicense !== this.originalProfileLicense;
        },

        // ============ LIFECYCLE ============

        /**
         * Initialize the settings page
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
                // Initialize profile editing state
                this.profileLicense = userInfo.license || '';
                this.originalProfileLicense = userInfo.license || '';
            }

            await Promise.all([
                this.loadSettings(),
                this.loadNarrativeSettings(),
                this.loadDocumentTypeSettings(),
                this.loadTabVisibilitySettings(),
                this.loadEditModeSettings(),
                this.loadInterventionSettings(),
                this.loadBaaStatus()
            ]);

            // Warn user before leaving page with unsaved changes
            window.addEventListener('beforeunload', (e) => {
                if (this.hasChanges || this.hasNarrativeChanges || this.hasProfileChanges || this.hasDocumentTypeChanges || this.hasTabVisibilityChanges || this.hasEditModeChanges || this.hasInterventionSettingsChanges) {
                    e.preventDefault();
                    e.returnValue = '';
                }
            });
        },

        /**
         * Logout user and redirect to login page
         */
        async logout() {
            await AuthGuard.logout();
        },

        // ============ COMPLIANCE & SECURITY ============

        /**
         * Load BAA (Business Associate Agreement) status from API
         */
        async loadBaaStatus() {
            this.baaStatus.loading = true;
            this.baaStatus.error = null;

            try {
                const response = await API.getBaaStatus();
                this.baaStatus.signed = response.baaSigned;
                this.baaStatus.signedAt = response.signedAt;
            } catch (error) {
                Logger.error('Failed to load BAA status:', error);
                this.baaStatus.error = 'Unable to verify BAA status';
            } finally {
                this.baaStatus.loading = false;
            }
        },

        /**
         * Format BAA signed date for display
         */
        formatBaaDate() {
            if (!this.baaStatus.signedAt) return '';
            const date = new Date(this.baaStatus.signedAt);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        },

        // ============ DATA METHODS ============

        /**
         * Load settings from API
         */
        async loadSettings() {
            try {
                this.loading = true;
                this.errorMessage = '';

                const settings = await API.getSettings('dashboard');

                if (settings) {
                    // Merge with defaults to ensure all fields exist
                    this.settings = {
                        visibleColumns: settings.visibleColumns || ['name', 'type', 'diagnosis', 'lastSession', 'status'],
                        newClientDefaults: {
                            paymentType: settings.newClientDefaults?.paymentType || 'private-pay',
                            sessionBasis: settings.newClientDefaults?.sessionBasis || '',
                            riskLevel: settings.newClientDefaults?.riskLevel || ''
                        }
                    };
                }

                // Store original for change detection
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));

            } catch (error) {
                Logger.error('Error loading settings:', error);
                this.errorMessage = 'Failed to load settings. Using defaults.';
                // Continue with defaults
                this.originalSettings = JSON.parse(JSON.stringify(this.settings));
            } finally {
                this.loading = false;
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
                this.originalTabVisibilitySettings = JSON.parse(JSON.stringify(this.tabVisibilitySettings));
            } catch (error) {
                Logger.warn('Could not load tab visibility settings, using defaults:', error);
                this.originalTabVisibilitySettings = JSON.parse(JSON.stringify(this.tabVisibilitySettings));
            }
        },

        /**
         * Load edit mode settings from API
         */
        async loadEditModeSettings() {
            try {
                const settings = await API.getSettings('editMode');
                if (settings) {
                    this.editModeSettings = {
                        progressNoteEditMode: settings.progressNoteEditMode || 'direct-edit'
                    };
                }
                this.originalEditModeSettings = JSON.parse(JSON.stringify(this.editModeSettings));
            } catch (error) {
                Logger.warn('Could not load edit mode settings, using defaults:', error);
                this.originalEditModeSettings = JSON.parse(JSON.stringify(this.editModeSettings));
            }
        },

        /**
         * Save edit mode settings to API
         */
        async saveEditModeSettings() {
            if (!this.hasEditModeChanges) return;

            try {
                this.savingEditMode = true;
                this.errorMessage = '';

                await API.saveSettings('editMode', this.editModeSettings);

                // Invalidate cache so other pages get fresh data
                CacheManager.invalidate(CacheManager.getSettingsKey('editMode'));

                // Update original to reflect saved state
                this.originalEditModeSettings = JSON.parse(JSON.stringify(this.editModeSettings));

                // Show success message
                this.showEditModeSuccess = true;
                setTimeout(() => {
                    this.showEditModeSuccess = false;
                }, 3000);

            } catch (error) {
                Logger.error('Error saving edit mode settings:', error);
                this.errorMessage = 'Failed to save edit mode settings. Please try again.';
            } finally {
                this.savingEditMode = false;
            }
        },

        /**
         * Load intervention display settings from API
         */
        async loadInterventionSettings() {
            try {
                const settings = await API.getSettings('interventions');
                if (settings) {
                    this.interventionSettings = {
                        usageMode: settings.usageMode || 'global',
                        fillWithGlobal: settings.fillWithGlobal ?? true,
                        maxFrequentInterventions: settings.maxFrequentInterventions ?? 10,
                        limitFavoritesInQuickAdd: settings.limitFavoritesInQuickAdd ?? false,
                        maxFavoritesInQuickAdd: settings.maxFavoritesInQuickAdd ?? 10,
                        sortFavoritesByUsage: settings.sortFavoritesByUsage ?? true
                    };
                }
                this.originalInterventionSettings = JSON.parse(JSON.stringify(this.interventionSettings));
            } catch (error) {
                Logger.warn('Could not load intervention settings, using defaults:', error);
                this.originalInterventionSettings = JSON.parse(JSON.stringify(this.interventionSettings));
            }
        },

        /**
         * Save settings to API
         */
        async saveSettings() {
            if (!this.hasChanges && !this.hasDocumentTypeChanges && !this.hasTabVisibilityChanges && !this.hasEditModeChanges && !this.hasProfileChanges && !this.hasInterventionSettingsChanges) return;

            try {
                this.saving = true;
                this.errorMessage = '';

                // Save profile settings if changed
                if (this.hasProfileChanges) {
                    await API.updateProfile({ license: this.profileLicense || null });
                    this.userLicense = this.profileLicense;
                    this.originalProfileLicense = this.profileLicense;
                }

                // Save dashboard settings if changed
                if (this.hasChanges) {
                    await API.saveSettings('dashboard', this.settings);
                    CacheManager.invalidate(CacheManager.getSettingsKey('dashboard'));
                    this.originalSettings = JSON.parse(JSON.stringify(this.settings));
                }

                // Save document type settings if changed
                if (this.hasDocumentTypeChanges) {
                    await API.saveSettings('documentTypeVisibility', this.documentTypeSettings);
                    CacheManager.invalidate(CacheManager.getSettingsKey('documentTypeVisibility'));
                    this.originalDocumentTypeSettings = JSON.parse(JSON.stringify(this.documentTypeSettings));
                }

                // Save tab visibility settings if changed
                if (this.hasTabVisibilityChanges) {
                    await API.saveSettings('clientDetailsTabVisibility', this.tabVisibilitySettings);
                    CacheManager.invalidate(CacheManager.getSettingsKey('clientDetailsTabVisibility'));
                    this.originalTabVisibilitySettings = JSON.parse(JSON.stringify(this.tabVisibilitySettings));
                }

                // Save edit mode settings if changed
                if (this.hasEditModeChanges) {
                    await API.saveSettings('editMode', this.editModeSettings);
                    CacheManager.invalidate(CacheManager.getSettingsKey('editMode'));
                    this.originalEditModeSettings = JSON.parse(JSON.stringify(this.editModeSettings));
                }

                // Save intervention settings if changed
                if (this.hasInterventionSettingsChanges) {
                    await API.saveSettings('interventions', this.interventionSettings);
                    CacheManager.invalidate(CacheManager.getSettingsKey('interventions'));
                    this.originalInterventionSettings = JSON.parse(JSON.stringify(this.interventionSettings));
                }

                // Show success message
                this.showSuccess = true;
                setTimeout(() => {
                    this.showSuccess = false;
                }, 3000);

            } catch (error) {
                Logger.error('Error saving settings:', error);
                this.errorMessage = 'Failed to save settings. Please try again.';
            } finally {
                this.saving = false;
            }
        },

        // ============ PROFILE METHODS ============

        /**
         * Save profile (license) to API
         */
        async saveProfile() {
            if (!this.hasProfileChanges) return;

            try {
                this.savingProfile = true;
                this.errorMessage = '';

                const result = await API.updateProfile({
                    license: this.profileLicense || null
                });

                // Update the userLicense for drawer display
                this.userLicense = this.profileLicense;
                // Update original to reflect saved state
                this.originalProfileLicense = this.profileLicense;

                // Show success message
                this.showProfileSuccess = true;
                setTimeout(() => {
                    this.showProfileSuccess = false;
                }, 3000);

            } catch (error) {
                Logger.error('Error saving profile:', error);
                this.errorMessage = 'Failed to save profile. Please try again.';
            } finally {
                this.savingProfile = false;
            }
        },

        // ============ NARRATIVE SETTINGS METHODS ============

        /**
         * Get the default system prompt (from shared NarrativeDefaults)
         */
        getDefaultSystemPrompt() {
            return NarrativeDefaults.systemPrompt;
        },

        /**
         * Get the default user prompt template (assembled from sections)
         */
        getDefaultPromptTemplate() {
            return PromptTemplates.assemblePrompt(
                NarrativeDefaults.metaTemplate,
                NarrativeDefaults.sections,
                NarrativeDefaults.defaultExamples
            );
        },

        /**
         * Get default sections object
         */
        getDefaultSections() {
            return PromptTemplates.cloneSections(NarrativeDefaults.sections);
        },

        /**
         * Get default examples array
         */
        getDefaultExamples() {
            return PromptTemplates.cloneExamples(NarrativeDefaults.defaultExamples);
        },

        /**
         * Load narrative settings from API
         */
        async loadNarrativeSettings() {
            const defaultModelId = 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';

            try {
                const settings = await API.getSettings('narrative');

                if (settings) {
                    // Load system prompt (or use default)
                    this.narrativeSettings.systemPrompt = settings.systemPrompt || this.getDefaultSystemPrompt();
                    // Load temperature (default 0.7)
                    this.narrativeSettings.temperature = settings.temperature ?? 0.7;
                    // Load maxTokens (default 1024)
                    this.narrativeSettings.maxTokens = settings.maxTokens ?? 1024;
                    // Load prefill (default '<thinking>')
                    this.narrativeSettings.prefill = settings.prefill ?? '<thinking>';
                    // Load modelId (default Claude Sonnet 4)
                    this.narrativeSettings.modelId = settings.modelId || defaultModelId;

                    // Load sections (or use defaults)
                    if (settings.sections) {
                        this.narrativeSettings.sections = {
                            progressNoteData: settings.sections.progressNoteData ?? NarrativeDefaults.sections.progressNoteData,
                            instructions: settings.sections.instructions ?? NarrativeDefaults.sections.instructions,
                            thinkingOutputFormat: settings.sections.thinkingOutputFormat ?? NarrativeDefaults.sections.thinkingOutputFormat,
                            narrativeOutputFormat: settings.sections.narrativeOutputFormat ?? NarrativeDefaults.sections.narrativeOutputFormat
                        };
                    } else {
                        this.narrativeSettings.sections = this.getDefaultSections();
                    }

                    // Load examples (or use defaults)
                    if (settings.examples && Array.isArray(settings.examples)) {
                        this.narrativeSettings.examples = settings.examples;
                    } else {
                        this.narrativeSettings.examples = this.getDefaultExamples();
                    }
                } else {
                    // Use defaults if no settings saved
                    this.narrativeSettings.systemPrompt = this.getDefaultSystemPrompt();
                    this.narrativeSettings.temperature = 0.7;
                    this.narrativeSettings.maxTokens = 1024;
                    this.narrativeSettings.prefill = '<thinking>';
                    this.narrativeSettings.modelId = defaultModelId;
                    this.narrativeSettings.sections = this.getDefaultSections();
                    this.narrativeSettings.examples = this.getDefaultExamples();
                }

                // Store original for change detection
                this.originalNarrativeSettings = JSON.parse(JSON.stringify(this.narrativeSettings));

                // Validate all examples
                this.validateAllExamples();

            } catch (error) {
                Logger.error('Error loading narrative settings:', error);
                // Use defaults on error
                this.narrativeSettings.systemPrompt = this.getDefaultSystemPrompt();
                this.narrativeSettings.temperature = 0.7;
                this.narrativeSettings.maxTokens = 1024;
                this.narrativeSettings.prefill = '<thinking>';
                this.narrativeSettings.modelId = defaultModelId;
                this.narrativeSettings.sections = this.getDefaultSections();
                this.narrativeSettings.examples = this.getDefaultExamples();
                this.originalNarrativeSettings = JSON.parse(JSON.stringify(this.narrativeSettings));
                this.validateAllExamples();
            }
        },

        /**
         * Save narrative settings to API
         */
        async saveNarrativeSettings() {
            if (!this.hasNarrativeChanges) return;

            try {
                this.savingNarrative = true;
                this.errorMessage = '';

                await API.saveSettings('narrative', this.narrativeSettings);

                // Invalidate cache so other pages get fresh data
                CacheManager.invalidate(CacheManager.getSettingsKey('narrative'));

                // Update original to reflect saved state
                this.originalNarrativeSettings = JSON.parse(JSON.stringify(this.narrativeSettings));

                // Show success message
                this.showNarrativeSuccess = true;
                setTimeout(() => {
                    this.showNarrativeSuccess = false;
                }, 3000);

            } catch (error) {
                Logger.error('Error saving narrative settings:', error);
                this.errorMessage = 'Failed to save AI settings. Please try again.';
            } finally {
                this.savingNarrative = false;
            }
        },

        /**
         * Load document type visibility settings from API
         */
        async loadDocumentTypeSettings() {
            try {
                const settings = await API.getSettings('documentTypeVisibility');

                if (settings) {
                    // Handle migration from old settings format
                    // Old: clinicalFormsEnabled (show beta), hideNotImplemented (hide undeveloped)
                    // New: showBeta (show beta), showUndeveloped (show undeveloped)
                    let showBeta = settings.showBeta;
                    let showUndeveloped = settings.showUndeveloped;

                    // Migrate old settings if new ones don't exist
                    if (showBeta === undefined && settings.clinicalFormsEnabled !== undefined) {
                        showBeta = settings.clinicalFormsEnabled;
                    }
                    if (showUndeveloped === undefined && settings.hideNotImplemented !== undefined) {
                        showUndeveloped = !settings.hideNotImplemented;  // Invert logic
                    }

                    this.documentTypeSettings = {
                        showBeta: showBeta ?? false,
                        showUndeveloped: showUndeveloped ?? false,
                        intakeEnabled: settings.intakeEnabled ?? true,
                        diagnosisEnabled: settings.diagnosisEnabled ?? true,
                        treatmentPlanEnabled: settings.treatmentPlanEnabled ?? true,
                        consultationEnabled: settings.consultationEnabled ?? true,
                        dischargeEnabled: settings.dischargeEnabled ?? true
                    };
                }

                // Store original for change detection
                this.originalDocumentTypeSettings = JSON.parse(JSON.stringify(this.documentTypeSettings));

            } catch (error) {
                Logger.error('Error loading document type settings:', error);
                this.originalDocumentTypeSettings = JSON.parse(JSON.stringify(this.documentTypeSettings));
            }
        },

        /**
         * Save document type visibility settings to API
         */
        async saveDocumentTypeSettings() {
            if (!this.hasDocumentTypeChanges) return;

            try {
                await API.saveSettings('documentTypeVisibility', this.documentTypeSettings);

                // Invalidate cache so other pages get fresh data
                CacheManager.invalidate(CacheManager.getSettingsKey('documentTypeVisibility'));

                // Update original to reflect saved state
                this.originalDocumentTypeSettings = JSON.parse(JSON.stringify(this.documentTypeSettings));

                Logger.log('Document type settings saved');

            } catch (error) {
                Logger.error('Error saving document type settings:', error);
                this.errorMessage = 'Failed to save document type settings. Please try again.';
            }
        },

        /**
         * Reset system prompt to default
         */
        resetSystemPromptToDefault() {
            if (confirm('Reset the system prompt to its default value? Your custom changes will be lost.')) {
                this.narrativeSettings.systemPrompt = this.getDefaultSystemPrompt();
            }
        },

        /**
         * Reset a specific section to default
         */
        resetSectionToDefault(sectionName) {
            const sectionLabels = {
                progressNoteData: 'Session Data Template',
                instructions: 'Instructions',
                thinkingOutputFormat: 'Thinking Output Format',
                narrativeOutputFormat: 'Narrative Output Format'
            };
            const label = sectionLabels[sectionName] || sectionName;

            if (confirm(`Reset "${label}" to its default value? Your custom changes will be lost.`)) {
                this.narrativeSettings.sections[sectionName] = NarrativeDefaults.sections[sectionName];
                // Re-validate examples if output format changed
                if (sectionName === 'thinkingOutputFormat' || sectionName === 'narrativeOutputFormat') {
                    this.validateAllExamples();
                }
            }
        },

        /**
         * Reset all sections to defaults (but keep examples)
         */
        resetAllSectionsToDefault() {
            if (confirm('Reset all prompt sections to their default values? Your custom changes will be lost.')) {
                this.narrativeSettings.sections = this.getDefaultSections();
                this.validateAllExamples();
            }
        },

        /**
         * Reset examples to defaults
         */
        resetExamplesToDefault() {
            if (confirm('Reset all examples to defaults? Your custom examples will be lost.')) {
                this.narrativeSettings.examples = this.getDefaultExamples();
                this.exampleValidation = {};
                this.expandedExampleId = null;
                this.validateAllExamples();
            }
        },

        /**
         * Reset everything (sections + examples + system prompt)
         */
        resetAllPromptsToDefault() {
            if (confirm('Reset system prompt, all sections, and examples to their default values? Your custom changes will be lost.')) {
                this.narrativeSettings.systemPrompt = this.getDefaultSystemPrompt();
                this.narrativeSettings.sections = this.getDefaultSections();
                this.narrativeSettings.examples = this.getDefaultExamples();
                this.exampleValidation = {};
                this.expandedExampleId = null;
                this.validateAllExamples();
            }
        },

        /**
         * Reset model parameters to defaults
         */
        resetModelParametersToDefault() {
            this.narrativeSettings.temperature = 0.7;
            this.narrativeSettings.maxTokens = 1024;
            this.narrativeSettings.prefill = '<thinking>';
            this.narrativeSettings.modelId = 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';
        },

        // ============ EXAMPLES CRUD ============

        /**
         * Add a new empty example
         */
        addExample() {
            const newExample = PromptTemplates.createExample();
            this.narrativeSettings.examples.push(newExample);
            this.expandedExampleId = newExample.id;
            this.validateExample(newExample.id);
        },

        /**
         * Remove an example by ID
         */
        removeExample(exampleId) {
            if (!confirm('Delete this example? This cannot be undone.')) return;

            const index = this.narrativeSettings.examples.findIndex(e => e.id === exampleId);
            if (index > -1) {
                this.narrativeSettings.examples.splice(index, 1);
                delete this.exampleValidation[exampleId];
                if (this.expandedExampleId === exampleId) {
                    this.expandedExampleId = null;
                }
            }
        },

        /**
         * Move example up in the list
         */
        moveExampleUp(exampleId) {
            const examples = this.narrativeSettings.examples;
            const index = examples.findIndex(e => e.id === exampleId);
            if (index > 0) {
                [examples[index - 1], examples[index]] = [examples[index], examples[index - 1]];
            }
        },

        /**
         * Move example down in the list
         */
        moveExampleDown(exampleId) {
            const examples = this.narrativeSettings.examples;
            const index = examples.findIndex(e => e.id === exampleId);
            if (index < examples.length - 1) {
                [examples[index], examples[index + 1]] = [examples[index + 1], examples[index]];
            }
        },

        /**
         * Toggle example expansion
         */
        toggleExample(exampleId) {
            this.expandedExampleId = this.expandedExampleId === exampleId ? null : exampleId;
        },

        // ============ VALIDATION ============

        /**
         * Validate a single example's output
         */
        validateExample(exampleId) {
            const example = this.narrativeSettings.examples.find(e => e.id === exampleId);
            if (!example) return;

            const requiredTags = PromptTemplates.extractRequiredTags(
                this.narrativeSettings.sections.thinkingOutputFormat,
                this.narrativeSettings.sections.narrativeOutputFormat
            );

            this.exampleValidation[exampleId] = PromptTemplates.validateExampleOutput(
                example.output,
                requiredTags
            );
        },

        /**
         * Validate all examples
         */
        validateAllExamples() {
            this.exampleValidation = {};
            this.narrativeSettings.examples.forEach(ex => this.validateExample(ex.id));
        },

        /**
         * Check if any examples have validation warnings
         */
        hasExampleValidationWarnings() {
            return Object.values(this.exampleValidation).some(v => v?.missing?.length > 0);
        },

        // ============ UI METHODS ============

        /**
         * Toggle a column's visibility
         */
        toggleColumn(columnId) {
            const column = this.availableColumns.find(c => c.id === columnId);
            if (column?.required) return; // Can't toggle required columns

            const index = this.settings.visibleColumns.indexOf(columnId);
            if (index > -1) {
                this.settings.visibleColumns.splice(index, 1);
            } else {
                this.settings.visibleColumns.push(columnId);
            }
        }
    };
}
