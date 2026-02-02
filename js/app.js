/**
 * Alpine.js Application Logic
 *
 * Main application state and behavior.
 * This function is called from documents.html via x-data="app()"
 */

import { config } from './config.js';
import { Logger } from './logger.js';
import { DateUtils } from './dateUtils.js';
import { DraftStorage } from './draftStorage.js';
import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { mockData } from './mockData.js';
import { NavDrawer } from './components/drawer.js';
import { NewClientModal } from './components/newClientModal.js';
import { InterventionLibrary } from './interventionLibrary.js';
import { TherapeuticApproaches } from './constants.js';
import { NarrativeDefaults } from './narrativeDefaults.js';
import { PromptTemplates } from './promptTemplates.js';
import { FeatureStatus } from './featureStatus.js';
import { CacheManager, CacheKeys, CacheTTL } from './cacheManager.js';

/**
 * StreamingTagParser - Handles real-time parsing of <thinking> and <narrative> tags
 * from SSE streaming responses, routing content to appropriate callbacks.
 *
 * Handles the case where tags may be split across multiple chunks.
 */
class StreamingTagParser {
    constructor(prefill, onThinking, onNarrative) {
        this.phase = 'thinking'; // 'thinking' or 'narrative'
        this.buffer = '';
        this.onThinking = onThinking;
        this.onNarrative = onNarrative;
        this.thinkingEmitted = false;
        this.narrativeEmitted = false;  // Track if we've emitted any narrative content
        this.narrativeOpenTagStripped = false;  // Track if we've stripped <narrative> tag

        // Process prefill to establish starting state
        // Prefill is like '<thinking>\nThis is a' - we're already in thinking phase
        if (prefill) {
            // Strip the opening <thinking> tag if present
            let content = prefill;
            const openTagMatch = content.match(/^<thinking>\s*/i);
            if (openTagMatch) {
                content = content.substring(openTagMatch[0].length);
            }
            // Emit the prefill content as thinking
            if (content) {
                this.onThinking(content);
                this.thinkingEmitted = true;
            }
        }
    }

    processChunk(chunk) {
        this.buffer += chunk;

        if (this.phase === 'thinking') {
            this._processThinkingPhase();
        } else {
            this._processNarrativePhase();
        }
    }

    _processThinkingPhase() {
        // Case-insensitive search for </thinking>
        const closeMatch = this.buffer.match(/<\/thinking>/i);

        if (closeMatch) {
            const closeIdx = closeMatch.index;
            // Found the closing tag - emit remaining thinking content
            const thinkingContent = this.buffer.substring(0, closeIdx);
            if (thinkingContent) {
                this.onThinking(thinkingContent);
            }

            // Switch to narrative phase
            this.phase = 'narrative';

            // Get content after </thinking>
            let remainder = this.buffer.substring(closeIdx + closeMatch[0].length);

            // Strip <narrative> opening tag if present
            const narrativeOpenMatch = remainder.match(/^\s*<narrative>\s*/i);
            if (narrativeOpenMatch) {
                remainder = remainder.substring(narrativeOpenMatch[0].length);
                this.narrativeOpenTagStripped = true;
            }

            this.buffer = remainder;

            // Emit any initial narrative content safely
            if (this.buffer) {
                this._emitNarrativeSafe();
            }
        } else {
            // No closing tag yet - emit what's safe (keep enough buffer for tag detection)
            this._emitThinkingSafe();
        }
    }

    _processNarrativePhase() {
        this._emitNarrativeSafe();
    }

    _emitThinkingSafe() {
        // Keep last 11 characters in buffer (length of "</thinking>")
        const safeLength = Math.max(0, this.buffer.length - 11);
        if (safeLength > 0) {
            const safe = this.buffer.substring(0, safeLength);
            this.buffer = this.buffer.substring(safeLength);
            this.onThinking(safe);
        }
    }

    _emitNarrativeSafe() {
        // If we haven't stripped the opening <narrative> tag yet, check for it
        // This handles cases where the tag arrives in a later chunk or is split across chunks
        if (!this.narrativeOpenTagStripped) {
            // Check for complete <narrative> tag with optional leading whitespace
            const openTagMatch = this.buffer.match(/^\s*<narrative>\s*/i);
            if (openTagMatch) {
                this.buffer = this.buffer.substring(openTagMatch[0].length);
                this.narrativeOpenTagStripped = true;
            } else {
                // Check if we might have a partial tag at the start
                // Keep enough buffer to detect "<narrative>" (11 chars) + whitespace
                // Only emit content once we're past the potential tag area
                const trimmedBuffer = this.buffer.trimStart();
                if (trimmedBuffer.length > 0 && !trimmedBuffer.startsWith('<')) {
                    // Buffer doesn't start with '<', so no tag incoming
                    // Strip leading whitespace and mark as ready
                    this.buffer = trimmedBuffer;
                    this.narrativeOpenTagStripped = true;
                } else if (trimmedBuffer.length < 12) {
                    // Could be partial "<narrative>" - wait for more data
                    return;
                } else if (trimmedBuffer.startsWith('<') && !trimmedBuffer.match(/^<narrative>/i)) {
                    // Starts with '<' but not "<narrative>" - might be malformed, proceed anyway
                    this.narrativeOpenTagStripped = true;
                }
            }
        }

        // Keep last 12 characters in buffer (length of "</narrative>")
        const safeLength = Math.max(0, this.buffer.length - 12);
        if (safeLength > 0) {
            let safe = this.buffer.substring(0, safeLength);
            this.buffer = this.buffer.substring(safeLength);

            // Trim leading whitespace from first narrative emission
            if (!this.narrativeEmitted) {
                safe = safe.trimStart();
                if (safe) {
                    this.narrativeEmitted = true;
                    this.onNarrative(safe);
                }
            } else {
                this.onNarrative(safe);
            }
        }
    }

    flush() {
        // Called when stream ends - emit everything remaining
        let final = this.buffer;

        // Strip closing tag if present
        if (this.phase === 'narrative') {
            // Strip opening tag if not already stripped
            if (!this.narrativeOpenTagStripped) {
                final = final.replace(/^\s*<narrative>\s*/i, '');
            }
            // Strip closing tag
            final = final.replace(/<\/narrative>\s*$/i, '');
        } else {
            // If we're still in thinking phase at end, strip closing thinking tag
            // and look for narrative content (case-insensitive)
            const closeMatch = final.match(/<\/thinking>/i);
            if (closeMatch) {
                const closeIdx = closeMatch.index;
                const thinkingPart = final.substring(0, closeIdx);
                if (thinkingPart) {
                    this.onThinking(thinkingPart);
                }
                let narrativePart = final.substring(closeIdx + closeMatch[0].length);
                // Strip <narrative> tags
                narrativePart = narrativePart.replace(/^\s*<narrative>\s*/i, '');
                narrativePart = narrativePart.replace(/<\/narrative>\s*$/i, '');
                if (narrativePart.trim()) {
                    this.onNarrative(narrativePart);
                }
                return;
            }
        }

        if (final) {
            if (this.phase === 'thinking') {
                this.onThinking(final);
            } else {
                // Trim leading whitespace if this is first narrative emission
                if (!this.narrativeEmitted) {
                    final = final.trimStart();
                }
                if (final) {
                    this.onNarrative(final);
                }
            }
        }
    }
}

export function createAppData() {
  return {
    // ========================================
    // USER STATE (populated after auth check)
    // ========================================
    userEmail: '',
    userName: '',
    userRole: '',           // 'sysadmin' | 'admin' | 'supervisor'
    userLicense: '',        // e.g., 'AMFT', 'LMFT', 'PhD', 'MD'
    userGroups: [],         // Array of Cognito groups

    // ========================================
    // THERAPEUTIC APPROACHES (loaded from API or defaults)
    // ========================================
    // Shorthand for therapeutic approaches (used in filter tabs)
    // Returns built-in + custom approaches, excluding hidden ones
    get therapeuticApproachOptions() {
      return this.getAllTherapeuticApproaches();
    },

    // ========================================
    // APPLICATION DATA
    // ========================================
    clients: [],
    justAddedClientIds: [],  // Track clients created this session (for "Just Added" section)
    selectedClient: '',
    clientType: '',
    formType: 'Progress Note',
    formTypeExpanded: false,
    formTypeSliderStyle: '',
    delivery: 'In Person',
    deliveryOther: '',
    clientLocation: 'Office',
    clientLocationOther: '',
    clientContext: {
      diagnosis: null,
      treatmentPlan: null,
      lastSession: null
    },
    clientContextCacheAge: null,  // Minutes since context was fetched (null = fresh)

    // Unified documents for selected client (used for completedFormTypes computation)
    clientDocuments: [],

    // Timestamp of last successful save (for display)
    noteLastSaved: null,

    // Client confirmation modal state
    showClientConfirmModal: false,
    pendingClientConfirmation: null, // { clientId, client, context }

    // ========================================
    // ENTRY FLOW STATE (Two-Step Entry Pattern)
    // ========================================
    entryView: 'client-select',       // 'client-select' | 'form-select' | 'workspace'
    clientSearchQuery: '',            // Search input for client selection
    showAllClients: false,            // Toggle to show all clients vs just recent
    showClientDetails: false,         // Expandable client context in workspace
    showExitConfirmModal: false,      // Exit confirmation when leaving workspace with unsaved changes
    clientDraftsForSelection: [],     // All drafts for selected client (across all form types)

    // ========================================
    // DIAGNOSIS MANAGEMENT STATE
    // ========================================
    clientDiagnoses: [],
    loadingDiagnoses: false,
    editingDiagnosisId: null,
    savingDiagnosis: false,
    newDiagnosis: {
      icd10Code: '',
      description: '',
      dateOfDiagnosis: DateUtils.getTodayDateString(),
      status: 'provisional',
      isPrincipal: false,
      severity: null,
      clinicalNotes: '',
      dateResolved: null
    },
    // Master-detail selection state
    selectedDiagnosisId: null,      // ID of diagnosis being edited (null = none)
    isAddingNewDiagnosis: false,    // True when adding new diagnosis
    showResolvedDiagnoses: false,   // Toggle for resolved section in list

    currentNote: {
      date: DateUtils.getTodayDateString(),
      duration: 50,

      // Section 1: Purpose of Session
      purpose: '',

      // Section 2: Mental Status Exams (dynamic array)
      mseEntries: [],

      // Section 3: Therapeutic Approaches
      therapeuticApproaches: [],
      therapeuticApproachesOther: '',

      // Section 4: Interventions (array of objects)
      // Each: { label, theme, description, notes, showNotes }
      interventions: [],

      // Section 4b: General Response to Interventions
      responseToInterventions: '',

      // Section 5: Additional Notes
      additionalNotes: '',

      // Section 6: Future
      futureNotes: '',

      // Section 7: Narrative Format
      narrativeFormat: ''
    },

    // ========================================
    // NARRATIVE GENERATION STATE
    // ========================================
    generatingNarrative: false,
    narrativeError: '',
    lastNarrativeThinking: '',  // Session-only: AI's reasoning for most recent generation
    showNarrativeThinking: false,  // UI toggle for collapsible thinking section
    narrativeStreamController: null,  // Abort controller for streaming generation
    isThinkingPhase: false,  // True while AI is in thinking phase, false once narrative starts

    // ========================================
    // DRAFT AUTO-SAVE STATE
    // ========================================
    draftStatus: 'idle',              // 'idle' | 'saving' | 'saved'
    draftLastSaved: null,             // ISO timestamp of last save
    draftSaveTimer: null,             // Debounce timer reference
    currentDraftUUID: null,           // UUID of the active draft
    showDraftSwitchModal: false,      // Client switch modal
    showDraftSelectionModal: false,   // Draft picker modal
    availableDrafts: [],              // Drafts for current client (UUID-based)
    selectedDraftUUID: null,          // Currently selected draft UUID in picker
    pendingClientId: null,            // Client we're switching TO
    previousClientId: null,           // Client we're switching FROM (for draft saving)

    // ========================================
    // DUPLICATE DETECTION STATE
    // ========================================
    duplicateWarnings: {
      hasBackendDocument: false,      // A saved document exists for this client+date
      hasOtherDraft: false,           // Another local draft exists for this client+date
      predatesClient: false,          // Session date is before client creation
      tooSoonForBasis: false,         // Session is sooner than expected interval
      orphanedDrafts: []              // Drafts >24h old not saved to backend
    },
    showDuplicateModal: false,        // Show critical duplicate warning modal
    showOrphanBanner: false,          // Show dismissible orphan/timing banner

    // ========================================
    // EDIT/AMEND WORKFLOW STATE
    // ========================================
    progressNoteEditMode: 'direct-edit',  // 'direct-edit' | 'amendment-required'
    isEditingExisting: false,             // Whether we're editing an existing document
    editingDocumentId: null,              // ID of document being edited directly
    documentBeingAmended: null,           // Document to create amendment for
    showAmendmentReasonModal: false,      // Amendment reason input modal
    amendmentOf: null,                    // Parent document ID (for amendment)
    amendmentReason: '',                  // Reason for the amendment

    // ========================================
    // INTERVENTION SELECTOR STATE
    // ========================================
    interventionSelector: {
      searchQuery: '',
      searchResults: [],
      showBrowse: false,
      activeFilter: 'all',
      expandedChip: null,
      isWritingCustom: false,
      customInterventionLabel: ''
    },

    // Intervention preferences (loaded from settings API)
    interventionPreferences: {
      favorites: [],
      hidden: [],
      customInterventions: [],
      hiddenApproaches: [],
      customApproaches: [],
      // Usage tracking settings
      usageMode: 'global',           // 'global' | 'per-client'
      fillWithGlobal: true,          // When per-client, fill remaining slots with global frequent
      maxFrequentInterventions: 10,  // 1-20 range
      // Favorites display settings
      limitFavoritesInQuickAdd: false,  // false = show all favorites
      maxFavoritesInQuickAdd: 10,       // max favorites when limit is ON
      sortFavoritesByUsage: true        // true = sort by usage, false = array order
    },

    // Intervention usage tracking
    interventionUsage: {},          // { interventionId: count } - current mode (client or global)
    globalInterventionUsage: {},    // { interventionId: count } - always global (for fill feature)
    sortByUsage: true,              // Default ON - sort by favorites + usage

    // Document type visibility settings (loaded from settings API)
    documentTypeVisibility: {
      // Category toggles (default false = hidden)
      showBeta: false,
      showUndeveloped: false,
      // Individual document type toggles
      intakeEnabled: true,
      diagnosisEnabled: true,
      treatmentPlanEnabled: true,
      consultationEnabled: true,
      dischargeEnabled: true
    },

    // ========================================
    // INTAKE FORM STATE (Beta)
    // ========================================
    currentIntake: {
      date: DateUtils.getTodayDateString(),
      duration: 90,
      delivery: 'In Person',
      demographicInfo: { age: '', occupation: '' },
      presentingProblems: [],
      presentingProblemsOther: '',
      riskAssessment: {
        riskLevel: 'standard',
        suicidalIdeation: false,
        homicidalIdeation: false,
        selfHarm: false,
        notes: ''
      },
      mentalHealthHistory: '',
      medicalHistory: '',
      substanceUse: '',
      socialHistory: '',
      conceptualization: { coherence: '', attachment: '', somatic: '' },
      treatmentRecommendations: ''
    },
    existingIntakeId: null,
    intakeStatus: 'draft',  // 'draft' | 'complete'
    savingIntake: false,
    intakeActiveSection: 'session-details',

    // ========================================
    // TREATMENT PLAN FORM STATE (Beta)
    // ========================================
    currentTreatmentPlan: {
      dateCreated: DateUtils.getTodayDateString(),
      reviewDate: '',
      presentingProblems: [],
      presentingProblemsSource: 'manual',  // 'intake' | 'manual'
      linkedIntakeId: null,
      goals: [{ id: 'goal-1', text: '', targetDate: '', interventions: [] }],
      reviewedWithClient: false,
      clientAgrees: false,
      notes: ''
    },
    existingTreatmentPlanId: null,
    treatmentPlanStatus: 'draft',  // 'draft' | 'active' | 'superseded'
    savingTreatmentPlan: false,
    activeGoalIndex: 0,
    linkedIntakeForPlan: null,
    linkedIntakeDateForPlan: null,

    // Clinical reference data (for Intake & Treatment Plan)
    allPresentingIssues: [],
    allInterventions: [],
    allApproaches: [],

    // Clinical reference drawer state (for Treatment Plan)
    showReferenceDrawer: false,
    referenceFilter: 'all',
    customIntervention: { name: '', approach: '' },

    // ========================================
    // UI STATE
    // ========================================

    // Shared drawer state
    ...NavDrawer.alpineData,

    submitting: false,
    loading: true,  // Start true, set false after init() completes
    loadingClientContext: false,
    showSuccessToast: false,
    showErrorToast: false,
    errorMessage: '',

    // Form validation errors
    formErrors: {
        client: '',
        date: '',
        duration: '',
        deliveryOther: '',
        clientLocation: '',
        clientLocationOther: ''
    },
    // Date warning (not an error - just advisory)
    dateWarning: '',
    // Duplicate session warning
    duplicateSessionWarning: false,
    // Client selection attention warning (shown when user taps form without selecting client)
    showClientSelectionWarning: false,
    // Undo toast state
    undoToast: {
        visible: false,
        message: '',
        callback: null
    },
    undoToastTimer: null,
    // MSE Quick Mode - shows simplified view with just Note and Mood
    mseQuickMode: true,
    // Include Future Plans in Narrative - controls whether plans for future sessions appear in generated narrative
    includeFutureNotes: true,
    // Quick Intervention Mode - simplified 2-click intervention adding (loaded from settings)
    quickInterventionMode: false,
    diagnosisErrors: {
        icd10Code: '',
        description: '',
        dateOfDiagnosis: '',
        dateResolved: ''
    },

    // Shared new client modal state
    ...NewClientModal.alpineData,

    showAdminPanel: false,
    confirmDeleteClientId: null,
    deletingClientId: null,

    // ========================================
    // URL STATE MANAGEMENT
    // ========================================

    /**
     * Update URL parameters to reflect current form state (for refresh persistence)
     */
    updateURLParams() {
      const url = new URL(window.location);

      // Update client parameter
      if (this.selectedClient) {
        url.searchParams.set('client', this.selectedClient);
      } else {
        url.searchParams.delete('client');
      }

      // Update form type parameter
      if (this.formType && this.formType !== 'Progress Note') {
        url.searchParams.set('form', this.formType);
      } else {
        url.searchParams.delete('form');
      }

      history.replaceState({}, '', url);
    },

    /**
     * Read URL parameters and return initial state values
     */
    getURLParams() {
      const urlParams = new URLSearchParams(window.location.search);
      return {
        clientId: urlParams.get('client'),
        formType: urlParams.get('form')
      };
    },

    // ========================================
    // INITIALIZATION
    // ========================================
    async init() {
      // Safety check: prevent dangerous config combination
      AuthGuard.validateConfig();

      Logger.log('Therapy Docs App initialized');
      Logger.log('Mock API mode:', config.useMockAPI);

      // Auth check (unless in debug mode where autoLogin handles it)
      if (!config.features.debugMode) {
        if (!AuthGuard.checkAuth()) return;

        // Load user info
        const userInfo = AuthGuard.loadUserInfo();
        if (userInfo) {
          this.userEmail = userInfo.email;
          this.userName = userInfo.name;
          this.userRole = userInfo.role;
          this.userLicense = userInfo.license || '';
          this.userGroups = userInfo.groups;
        }
      }

      // Start loading data in parallel (don't await yet)
      const preferencesPromise = this.loadInterventionPreferences();
      const visibilityPromise = this.loadDocumentTypeVisibility();
      const editModePromise = this.loadEditModeSettings();
      const clientsPromise = config.features.debugMode
        ? null  // debugMode uses autoLogin which loads clients
        : this.loadClients();

      // Start real-time clock
      this.startClock();

      // Initialize clinical reference data for Intake & Treatment Plan forms
      if (window.getPresentingIssues) {
        this.allPresentingIssues = window.getPresentingIssues();
      }
      if (window.getAllInterventions) {
        this.allInterventions = window.getAllInterventions();
      }
      if (window.getApproaches) {
        this.allApproaches = window.getApproaches();
      }

      // Set up auto-save watcher for draft functionality
      // Watch the entire currentNote object for changes
      this.$watch('currentNote', () => {
        this.scheduleDraftSave();
      }, { deep: true });

      // Watch for date changes to check for duplicates
      this.$watch('currentNote.date', (newDate, oldDate) => {
        if (newDate && newDate !== oldDate) {
          this.checkForDuplicates();
        }
      });

      // Also watch formType changes (for form type switching)
      this.$watch('formType', async (newType, oldType) => {
        if (oldType && newType !== oldType) {
          this.handleFormTypeChange(oldType, newType);
        }
        // Update URL to reflect form type change
        this.updateURLParams();

        // Load diagnoses when switching to Diagnosis form type
        if (newType === 'Diagnosis' && this.selectedClient) {
          await this.loadClientDiagnoses();
        }

        // Load intake when switching to Intake form type
        if (newType === 'Intake' && this.selectedClient) {
          await this.loadExistingIntake();
        }

        // Load treatment plan and intake data when switching to Treatment Plan
        if (newType === 'Treatment Plan' && this.selectedClient) {
          await Promise.all([
            this.loadExistingTreatmentPlan(),
            this.loadIntakeForTreatmentPlan()
          ]);
        }

        // Update form type slider position
        this.updateFormTypeSlider();
      });

      // Update form type slider when client changes (affects visible options)
      this.$watch('selectedClient', () => {
        // Reset to Progress Note if current formType would be hidden
        this.$nextTick(() => {
          const visibleIds = this.visibleFormTypes.map(ft => ft.id);
          if (!visibleIds.includes(this.formType)) {
            this.formType = 'Progress Note';
          }
          this.updateFormTypeSlider();
        });
      });

      // Initialize form type slider and handle resize
      window.addEventListener('resize', () => this.updateFormTypeSlider());

      // Update slider after fonts load (button widths depend on text rendering)
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => this.updateFormTypeSlider());
      }
      // Also use timeout as fallback for browsers without font loading API
      setTimeout(() => this.updateFormTypeSlider(), 100);
      // Additional delayed call for slow-loading scenarios
      setTimeout(() => this.updateFormTypeSlider(), 500);

      // Watch delivery changes and auto-fill client location
      this.$watch('delivery', (newDelivery) => {
        // Auto-select most common location for each delivery method
        if (newDelivery === 'In Person') {
          this.clientLocation = 'Office';
          this.clientLocationOther = '';
        } else if (newDelivery === 'Video' || newDelivery === 'Phone') {
          this.clientLocation = "Client's home";
          this.clientLocationOther = "Client's home address on file";
        } else if (newDelivery === 'Other') {
          this.clientLocation = '';
          this.clientLocationOther = '';
        }

        this.clearFormError('clientLocation');
        this.clearFormError('clientLocationOther');
      });

      // Warn user before leaving page with unsaved changes
      window.addEventListener('beforeunload', (e) => {
        if (this.hasUnsavedChanges()) {
          e.preventDefault();
          e.returnValue = '';
        }
      });

      // For development: auto-login to skip auth flow (loads clients internally)
      if (config.features.debugMode) {
        await Promise.all([preferencesPromise, visibilityPromise, editModePromise]);
        await this.autoLogin();
      } else {
        // Wait for all parallel data loading to complete
        await Promise.all([preferencesPromise, visibilityPromise, editModePromise, clientsPromise]);
      }

      // Load intervention usage data (after preferences are loaded for usageMode)
      await this.loadInterventionUsage();

      // Check URL for client/form parameters (for refresh persistence or direct navigation)
      const urlParams = this.getURLParams();
      if (urlParams.clientId) {
        const client = this.clients.find(c => c.id === urlParams.clientId);
        if (client) {
          // Set flag to skip interactive modals during URL restoration
          // User explicitly navigated here - no confirmation needed
          this._restoringFromURL = true;

          // Set form type from URL if provided (before selecting client)
          // Use flag to prevent loadClientContextInternal from overwriting
          if (urlParams.formType) {
            this.formType = urlParams.formType;
            this._preserveFormType = true;
          }

          // Directly restore state without going through interactive flows
          this.selectedClient = urlParams.clientId;
          this.previousClientId = urlParams.clientId;
          this.clientType = client.clientType || 'Individual';
          document.title = `${client.name} - Forms`;

          // Load context directly (skip confirmation modal)
          await this.loadClientContextForEntry(urlParams.clientId);

          // Set entry view based on URL params
          if (urlParams.formType) {
            // Both client and form specified → go directly to workspace
            this.entryView = 'workspace';

            // Load diagnoses if on Diagnosis form
            if (this.formType === 'Diagnosis') {
              await this.loadClientDiagnoses();
            }
          } else {
            // Only client specified → go to form selection
            this.entryView = 'form-select';
          }

          this._preserveFormType = false;
          this._restoringFromURL = false;
        } else {
          // Client not found - clear invalid URL parameters and start at client selection
          const url = new URL(window.location);
          url.searchParams.delete('client');
          url.searchParams.delete('form');
          history.replaceState({}, '', url);
          this.entryView = 'client-select';
        }
      } else {
        // No URL params - start at client selection
        this.entryView = 'client-select';
      }

      // Initial loading complete
      this.loading = false;
    },

    /**
     * Auto-login for development (bypasses auth flow)
     */
    async autoLogin() {
      const role = config.mockRole || mockData.user.role || 'admin';
      this.userEmail = mockData.user.email;
      this.userName = mockData.user.name;
      this.userRole = role;
      this.userLicense = mockData.user.license || '';
      this.userGroups = [role];

      // Store a dev token for API calls
      localStorage.setItem('authToken', 'dev-token-' + Date.now());

      // Load clients
      try {
        this.clients = await API.getClients();
        Logger.log('Loaded clients:', this.clients.length);
      } catch (error) {
        Logger.error('Failed to load clients:', error);
      }
    },

    /**
     * Start real-time clock
     */
    startClock() {
      this.updateClock();
      setInterval(() => this.updateClock(), 1000);
    },

    /**
     * Update clock display
     */
    updateClock() {
      const now = new Date();
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const day = days[now.getDay()];
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const date = String(now.getDate()).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);

      // Convert to 12-hour format with AM/PM
      let hours = now.getHours();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const hoursStr = String(hours).padStart(2, '0');

      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      this.currentTime = `${day} - ${month}/${date}/${year} - ${hoursStr}:${minutes}:${seconds} ${ampm}`;
    },

    // ========================================
    // ROLE HELPER METHODS
    // ========================================

    /**
     * Check if current user has a specific role or higher
     * Role hierarchy: supervisor < admin < sysadmin
     */
    hasRole(requiredRole) {
      const roleHierarchy = ['supervisor', 'admin', 'sysadmin'];
      const userRoleIndex = roleHierarchy.indexOf(this.userRole);
      const requiredIndex = roleHierarchy.indexOf(requiredRole);
      return userRoleIndex >= requiredIndex;
    },

    /**
     * Check if user is admin or higher
     * Note: Using method instead of getter for Alpine.js compatibility with drawer
     */
    isAdmin() {
      return this.hasRole('admin');
    },

    /**
     * Check if user is sysadmin
     * Note: Using method instead of getter for Alpine.js consistency
     */
    isSysAdmin() {
      return this.hasRole('sysadmin');
    },

    /**
     * Check if user is supervisor (view-only)
     */
    get isSupervisor() {
      return this.userRole === 'supervisor';
    },

    /**
     * Check if future notes toggle should be enabled (only when futureNotes has content)
     */
    get canToggleFutureNotes() {
      return this.currentNote.futureNotes?.trim().length > 0;
    },

    /**
     * Effective value for including future notes in narrative
     * Always false if futureNotes field is empty, otherwise uses toggle state
     */
    get effectiveIncludeFutureNotes() {
      return this.canToggleFutureNotes && this.includeFutureNotes;
    },

    /**
     * Logout user and redirect to login page
     */
    async logout() {
      await AuthGuard.logout();
    },

    // ========================================
    // CLIENT/SESSION METHODS
    // ========================================

    /**
     * Load all clients
     */
    async loadClients() {
      try {
        this.loading = true;
        this.clients = await API.getClients();
      } catch (error) {
        this.errorMessage = 'Failed to load clients';
        this.showToast('error');
      } finally {
        this.loading = false;
      }
    },

    /**
     * Open new client modal with settings defaults
     */
    async openNewClientModal() {
      // Load settings to get defaults
      try {
        const settings = await API.getSettings('dashboard');
        this.newClient = NewClientModal.getDefaultNewClient(settings);
      } catch (error) {
        // If settings fail to load, use built-in defaults
        this.newClient = NewClientModal.getDefaultNewClient();
      }
      this.showNewClientModal = true;
    },

    /**
     * Close new client modal
     */
    closeNewClientModal() {
      this.showNewClientModal = false;
      this.creatingClient = false;
    },

    /**
     * Open admin panel (triggered by Ctrl+Shift+A)
     */
    openAdminPanel() {
      this.showAdminPanel = true;
      this.confirmDeleteClientId = null;
    },

    /**
     * Close admin panel
     */
    closeAdminPanel() {
      this.showAdminPanel = false;
      this.confirmDeleteClientId = null;
      this.deletingClientId = null;
    },

    /**
     * Show delete confirmation for a client
     */
    confirmDeleteClient(clientId) {
      this.confirmDeleteClientId = clientId;
    },

    /**
     * Cancel delete operation
     */
    cancelDelete() {
      this.confirmDeleteClientId = null;
    },

    /**
     * Delete client after confirmation
     */
    async deleteClient(clientId) {
      this.deletingClientId = clientId;

      try {
        await API.deleteClient(clientId);

        // Refresh clients list
        this.clients = await API.getClients();

        // If deleted client was selected, clear selection
        if (this.selectedClient === clientId) {
          this.selectedClient = '';
          this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
        }

        // Close admin panel and show success
        this.closeAdminPanel();
        this.showToast('success');
      } catch (error) {
        this.errorMessage = error.message || 'Failed to delete client';
        this.showToast('error');
      } finally {
        this.deletingClientId = null;
      }
    },

    /**
     * Create new client
     */
    async createClient() {
      if (!this.newClient.name.trim()) return;

      try {
        this.creatingClient = true;
        const createdClient = await API.createClient({
          name: this.newClient.name.trim(),
          clientType: this.newClient.clientType,
          paymentType: this.newClient.paymentType,
          sessionBasis: this.newClient.sessionBasis || null,
          referralSource: this.newClient.referralSource.trim() || null
        });

        // Invalidate clients cache so all pages get fresh data
        CacheManager.invalidate(CacheKeys.CLIENTS);

        // Refresh clients list
        this.clients = await API.getClients();

        // Track as "just added" for easy selection
        this.justAddedClientIds.unshift(createdClient.id);

        // Select the newly created client
        this.selectedClient = createdClient.id;
        this.clientType = createdClient.clientType;
        this.formType = createdClient.lastFormType || 'Progress Note';

        this.closeNewClientModal();
        this.showToast('success', 'Client added successfully!');
      } catch (error) {
        this.errorMessage = error.message || 'Failed to create client';
        this.showToast('error');
      } finally {
        this.creatingClient = false;
      }
    },

    /**
     * Handle client selection change
     * Intercepts to check for unsaved content and show appropriate modals
     */
    async loadClientContext() {
      const newClientId = this.selectedClient;
      const oldClientId = this.previousClientId;

      // Handle "New client" option selection
      if (newClientId === '__new__') {
        // Reset selection to previous (or empty)
        this.selectedClient = oldClientId || '';
        // Open the new client modal
        this.openNewClientModal();
        return;
      }

      // Case 1: Deselecting (no new client)
      if (!newClientId) {
        // Check if there's content to warn about
        if (oldClientId && this.hasFormContent()) {
          // Store pending state and show modal
          this.pendingClientId = null; // Deselecting
          this.previousClientId = oldClientId;
          this.showDraftSwitchModal = true;
          // Revert selection until modal decision
          this.selectedClient = oldClientId;
          return;
        }

        // No content, just clear
        this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
        this.loadingClientContext = false;
        this.clientType = '';
        this.formType = 'Progress Note';
        this.delivery = 'In Person';
        this.currentDraftUUID = null;  // Clear draft when no client selected
        this.resetFormToFresh();
        this.previousClientId = null;
        // Update URL to reflect deselected client
        this.updateURLParams();
        return;
      }

      // Case 2: Switching from one client to another
      if (oldClientId && oldClientId !== newClientId && this.hasFormContent()) {
        // Store pending state and show modal
        this.pendingClientId = newClientId;
        this.previousClientId = oldClientId;
        this.showDraftSwitchModal = true;
        // Revert selection until modal decision
        this.selectedClient = oldClientId;
        return;
      }

      // Track new client as previous for next change
      this.previousClientId = newClientId;

      // Case 3: No content or first selection - show client confirmation modal
      // Fetch context first so we can display it in the modal
      const client = this.clients.find(c => c.id === newClientId);
      if (!client) {
        Logger.error('Client not found:', newClientId);
        return;
      }

      // Pre-fetch client context for confirmation modal
      this.loadingClientContext = true;
      let prefetchedContext = { diagnosis: null, treatmentPlan: null, lastSession: null };

      try {
        const fetchPromises = [];

        if (client.currentDiagnosisId) {
          fetchPromises.push(
            API.getCurrentDiagnosis(newClientId)
              .catch(err => { Logger.error('Diagnosis fetch failed:', err); return null; })
          );
        } else {
          fetchPromises.push(Promise.resolve(null));
        }

        if (client.currentTreatmentPlanId) {
          fetchPromises.push(
            API.getCurrentTreatmentPlan(newClientId)
              .catch(err => { Logger.error('Treatment plan fetch failed:', err); return null; })
          );
        } else {
          fetchPromises.push(Promise.resolve(null));
        }

        fetchPromises.push(
          API.getLastSession(newClientId)
            .catch(err => { Logger.error('Last session fetch failed:', err); return null; })
        );

        const [diagnosis, treatmentPlan, lastSession] = await Promise.all(fetchPromises);
        prefetchedContext = { diagnosis, treatmentPlan, lastSession };
      } catch (error) {
        Logger.error('Failed to pre-fetch client context:', error);
      } finally {
        this.loadingClientContext = false;
      }

      // Store pending confirmation data and show modal
      this.pendingClientConfirmation = {
        clientId: newClientId,
        client: client,
        context: prefetchedContext
      };
      this.showClientConfirmModal = true;
    },

    /**
     * Confirm client selection from confirmation modal
     * Proceeds with loading the form for the selected client
     */
    async confirmClientSelection() {
      if (!this.pendingClientConfirmation) return;

      const { clientId, client, context } = this.pendingClientConfirmation;

      // Close modal and clear attention warning
      this.showClientConfirmModal = false;
      this.showClientSelectionWarning = false;

      // Set client context from pre-fetched data
      this.clientContext = context;

      // Set client type and form defaults
      this.clientType = client.clientType || 'Individual';
      if (!this._preserveFormType) {
        this.formType = client.lastFormType || 'Progress Note';
      }
      this.delivery = client.lastDelivery || 'In Person';
      document.title = `${client.name} - Forms`;

      // Reset form for new client
      this.resetFormToFresh();

      // Check for existing drafts
      this.availableDrafts = DraftStorage.getDraftsForClient(clientId);
      if (this.availableDrafts.length > 0) {
        this.selectedDraftUUID = this.availableDrafts[0].uuid;
        this.showDraftSelectionModal = true;
      } else {
        // No existing drafts - initialize a new one
        const sessionDate = DateUtils.getTodayDateString();
        this.currentDraftUUID = DraftStorage.initializeDraft(
          clientId,
          this.formType,
          sessionDate
        );
        // Check for duplicates with today's date
        this.checkForDuplicates();
      }

      // Update URL
      this.updateURLParams();

      // Clear pending confirmation
      this.pendingClientConfirmation = null;
    },

    /**
     * Cancel client selection from confirmation modal
     * Reverts to the previously selected client
     */
    cancelClientSelection() {
      if (!this.pendingClientConfirmation) return;

      // Close modal
      this.showClientConfirmModal = false;

      // Revert to previous client
      this.selectedClient = this.previousClientId || '';

      // Clear pending confirmation
      this.pendingClientConfirmation = null;
    },

    /**
     * Internal method to load client context (diagnosis, treatment plan, last session)
     * Also fetches all documents for the client to compute completedFormTypes
     * Called after draft/switch modals are handled
     */
    async loadClientContextInternal() {
      if (!this.selectedClient) {
        this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
        this.clientContextCacheAge = null;
        this.clientDocuments = [];
        this.loadingClientContext = false;
        this.clientType = '';
        this.formType = 'Progress Note';
        this.delivery = 'In Person';
        // Reset page title when no client selected
        document.title = 'Forms - Therapy Docs';
        return;
      }

      // Check cache first for client context
      const cacheKey = CacheManager.getClientContextKey(this.selectedClient);
      const cached = CacheManager.get(cacheKey);

      this.loadingClientContext = true;

      try {
        // Get client data for form defaults
        const client = this.clients.find(c => c.id === this.selectedClient);
        if (client) {
          this.clientType = client.clientType || 'Individual';
          // Don't override formType if it was set from URL params
          if (!this._preserveFormType) {
            this.formType = client.lastFormType || 'Progress Note';
          }
          this.delivery = client.lastDelivery || 'In Person';
          // Update page title with client name for easy tab identification
          document.title = `${client.name} - Forms`;
        }

        // If cached context exists, use it and fetch documents separately
        if (cached) {
          Logger.log('Client context cache hit:', this.selectedClient);
          this.clientContext = cached.data;
          this.clientContextCacheAge = CacheManager.getAgeMinutes(cacheKey);

          // Still need to fetch documents for completedFormTypes
          try {
            this.clientDocuments = await API.getClientDocuments(this.selectedClient) || [];
          } catch (err) {
            Logger.error('Documents fetch failed:', err);
            this.clientDocuments = [];
          }
        } else {
          // No cache - fetch all data in parallel
          const fetchPromises = [
            // Fetch all documents for this client (for completedFormTypes computation)
            API.getClientDocuments(this.selectedClient)
              .catch(err => { Logger.error('Documents fetch failed:', err); return []; }),
            // Fetch current diagnosis
            API.getCurrentDiagnosis(this.selectedClient)
              .catch(err => { Logger.error('Diagnosis fetch failed:', err); return null; }),
            // Fetch current treatment plan
            API.getCurrentTreatmentPlan(this.selectedClient)
              .catch(err => { Logger.error('Treatment plan fetch failed:', err); return null; }),
            // Fetch last session
            API.getLastSession(this.selectedClient)
              .catch(err => { Logger.error('Last session fetch failed:', err); return null; })
          ];

          // Execute all fetches in parallel
          const [documents, diagnosis, treatmentPlan, lastSession] = await Promise.all(fetchPromises);

          // Store documents for completedFormTypes computation
          this.clientDocuments = documents || [];

          this.clientContext = { diagnosis, treatmentPlan, lastSession };
          this.clientContextCacheAge = null;  // Fresh data

          // Cache the context (not documents - they're used for computed properties)
          CacheManager.set(cacheKey, this.clientContext, CacheTTL.CLIENT_CONTEXT);
          Logger.log('Client context cached:', this.selectedClient);
        }
      } catch (error) {
        Logger.error('Failed to load client context:', error);
        // Don't show error toast - missing context is normal for new clients
        this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
        this.clientContextCacheAge = null;
        this.clientDocuments = [];
      } finally {
        this.loadingClientContext = false;
        // Update URL to reflect selected client and form type
        this.updateURLParams();

        // Reload usage data if in per-client mode
        if (this.interventionPreferences.usageMode === 'per-client') {
          this.loadInterventionUsage();
        }
      }
    },

    /**
     * Manually refresh client context (clears cache and reloads)
     */
    async refreshClientContext() {
      if (!this.selectedClient) return;

      // Invalidate the cache
      CacheManager.invalidate(CacheManager.getClientContextKey(this.selectedClient));
      this.clientContextCacheAge = null;

      // Reload
      await this.loadClientContextInternal();
    },

    // ========================================
    // FORM VALIDATION
    // ========================================

    /**
     * Validate a single Progress Note field
     * @param {string} field - Field name to validate
     * @returns {string} Error message or empty string if valid
     */
    validateProgressNoteField(field) {
        switch (field) {
            case 'client':
                return !this.selectedClient ? 'Please select a client' : '';
            case 'date':
                return !this.currentNote.date ? 'Session date is required' : '';
            case 'duration':
                const d = this.currentNote.duration;
                if (!d && d !== 0) return 'Duration is required';
                if (d < 15) return 'Duration must be at least 15 minutes';
                if (d > 100) return 'Duration cannot exceed 100 minutes';
                return '';
            case 'deliveryOther':
                if (this.delivery === 'Other' && !this.deliveryOther?.trim()) {
                    return 'Please describe the delivery method';
                }
                return '';
            case 'clientLocation':
                // For standard delivery types, must select from dropdown
                if (this.delivery !== 'Other' && !this.clientLocation) {
                    return 'Please select a location';
                }
                // For "Other" delivery, must enter freeform location
                if (this.delivery === 'Other' && !this.clientLocation?.trim()) {
                    return 'Please describe the location';
                }
                return '';
            case 'clientLocationOther':
                if (this.clientLocation === "Client's workplace" && !this.clientLocationOther?.trim()) {
                    return 'Please enter the workplace address';
                }
                if (this.clientLocation === 'Other' && !this.clientLocationOther?.trim()) {
                    return 'Please describe the location and provide address';
                }
                return '';
            default:
                return '';
        }
    },

    /**
     * Validate all Progress Note required fields
     * @returns {boolean} True if form is valid
     */
    validateProgressNote() {
        const fields = ['client', 'date', 'duration', 'deliveryOther', 'clientLocation', 'clientLocationOther'];
        let valid = true;
        fields.forEach(f => {
            this.formErrors[f] = this.validateProgressNoteField(f);
            if (this.formErrors[f]) valid = false;
        });

        // Validate MSE names for couple sessions
        const client = this.clients.find(c => c.id === this.selectedClient);
        if (client?.clientType === 'Couple' && this.currentNote.mseEntries.length > 0) {
            const emptyMSENames = this.currentNote.mseEntries.filter(mse => !mse.name?.trim());
            if (emptyMSENames.length > 0) {
                this.formErrors.mseNames = 'Please provide names for all MSE entries (required for couple sessions)';
                valid = false;
            } else {
                this.formErrors.mseNames = '';
            }
        } else {
            this.formErrors.mseNames = '';
        }

        return valid;
    },

    /**
     * Check if the session date is unusual and set warning
     * Also checks for duplicate sessions on the same date
     * Called when date is changed
     */
    checkDateWarning() {
        const dateStr = this.currentNote.date;
        if (!dateStr) {
            this.dateWarning = '';
            this.duplicateSessionWarning = false;
            return;
        }

        const sessionDate = new Date(dateStr + 'T00:00:00'); // Parse as local time
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normalize to midnight

        const diffTime = today - sessionDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            // Future date
            this.dateWarning = 'This date is in the future. Did you mean today?';
        } else if (diffDays > 3) {
            // More than 3 days ago
            this.dateWarning = `This session was ${diffDays} days ago. Documenting a past session?`;
        } else {
            this.dateWarning = '';
        }

        // Check for duplicate session (same client + same date as last session)
        const lastSessionDate = this.clientContext.lastSession?.date;
        if (lastSessionDate && dateStr === lastSessionDate) {
            this.duplicateSessionWarning = true;
        } else {
            this.duplicateSessionWarning = false;
        }
    },

    /**
     * Clear a specific field error (called on input)
     * @param {string} field - Field name to clear error for
     */
    clearFormError(field) {
        this.formErrors[field] = '';
    },

    /**
     * Show attention border on client dropdown if no client selected
     * Called when user taps/clicks in the form area
     */
    warnIfNoClient() {
        if (!this.selectedClient) {
            this.showClientSelectionWarning = true;
        }
    },

    /**
     * Handle client location change for Video/Phone delivery
     * Auto-fills or clears the address field based on selection
     */
    handleClientLocationChange() {
        this.clearFormError('clientLocation');
        const HOME_DEFAULT = "Client's home address on file";

        if (this.clientLocation === "Client's home") {
            this.clientLocationOther = HOME_DEFAULT;
        } else if (this.clientLocationOther === HOME_DEFAULT) {
            // Only clear if user hasn't modified the default value
            this.clientLocationOther = '';
        }
        // Otherwise keep user's custom value

        this.clearFormError('clientLocationOther');
    },

    /**
     * Get placeholder text for client location address field
     */
    getClientLocationPlaceholder() {
        if (this.clientLocation === "Client's home") {
            return 'Client physical address (optional)';
        } else if (this.clientLocation === "Client's workplace") {
            return 'Enter workplace address...';
        }
        return 'Describe location and provide address...';
    },

    /**
     * Validate a single Diagnosis form field
     * @param {string} field - Field name to validate
     * @returns {string} Error message or empty string if valid
     */
    validateDiagnosisField(field) {
        switch (field) {
            case 'icd10Code':
                return !this.newDiagnosis.icd10Code?.trim() ? 'ICD-10 code is required' : '';
            case 'description':
                return !this.newDiagnosis.description?.trim() ? 'Diagnosis description is required' : '';
            case 'dateOfDiagnosis':
                return !this.newDiagnosis.dateOfDiagnosis ? 'Date of diagnosis is required' : '';
            case 'dateResolved':
                if (this.newDiagnosis.status === 'resolved' && !this.newDiagnosis.dateResolved) {
                    return 'Date resolved is required when status is resolved';
                }
                return '';
            default:
                return '';
        }
    },

    /**
     * Validate all Diagnosis form required fields
     * @returns {boolean} True if form is valid
     */
    validateDiagnosis() {
        const fields = ['icd10Code', 'description', 'dateOfDiagnosis', 'dateResolved'];
        let valid = true;
        fields.forEach(f => {
            this.diagnosisErrors[f] = this.validateDiagnosisField(f);
            if (this.diagnosisErrors[f]) valid = false;
        });
        return valid;
    },

    /**
     * Clear a specific diagnosis field error
     * @param {string} field - Field name to clear error for
     */
    clearDiagnosisError(field) {
        this.diagnosisErrors[field] = '';
    },

    /**
     * Submit session note (new, edit, or amendment).
     */
    async submitNote() {
      // Validate form before submitting
      if (!this.validateProgressNote()) {
        this.errorMessage = 'Please fix the errors above';
        this.showToast('error');
        return;
      }

      this.submitting = true;

      try {
        const noteContent = {
          ...this.currentNote,
          formType: this.formType,
          delivery: this.delivery,
          deliveryOther: this.delivery === 'Other' ? this.deliveryOther : '',
          clientLocation: this.clientLocation,
          clientLocationOther: this.clientLocation === 'Other' ? this.clientLocationOther : ''
        };

        if (this.isEditingExisting) {
          // DIRECT EDIT: Update existing document via PATCH
          await API.updateDocument(
            this.selectedClient,
            this.editingDocumentId,
            {
              content: noteContent,
              status: 'complete'
            }
          );
          Logger.log('Updated existing document:', this.editingDocumentId);

        } else if (this.amendmentOf) {
          // AMENDMENT: Create new document with amendment metadata
          const amendmentContent = {
            ...noteContent,
            amendmentOf: this.amendmentOf,
            amendmentReason: this.amendmentReason,
            amendmentDate: new Date().toISOString()
          };

          await API.saveNote(
            this.selectedClient,
            amendmentContent,
            this.currentDraftUUID  // Pass UUID for consistent document identity
          );
          Logger.log('Created amendment of:', this.amendmentOf, 'with UUID:', this.currentDraftUUID);

          // Mark draft as saved to backend
          if (this.currentDraftUUID) {
            DraftStorage.markSavedToBackend(this.currentDraftUUID);
          }

        } else {
          // NEW DOCUMENT: Standard creation
          await API.saveNote(
            this.selectedClient,
            noteContent,
            this.currentDraftUUID  // Pass UUID for consistent document identity
          );

          // Mark draft as saved to backend before deleting
          if (this.currentDraftUUID) {
            DraftStorage.markSavedToBackend(this.currentDraftUUID);
          }
        }

        // Show success
        this.showToast('success');

        // Record save timestamp for display
        this.noteLastSaved = new Date();

        // Record intervention usage (fire-and-forget, before clearing form)
        this.recordInterventionUsageForNote();

        // Clear draft from localStorage (it's been submitted)
        this.clearCurrentDraft();

        // Clear editing/amendment state
        this.clearEditingState();

        // Clear form completely so hasFormContent() returns false
        this.resetFormToFresh();

        // Invalidate client context cache so refresh gets fresh data
        CacheManager.invalidate(CacheManager.getClientContextKey(this.selectedClient));

        // Refresh client context and documents for this client
        await this.loadClientContextInternal();

      } catch (error) {
        this.errorMessage = error.message || 'Failed to save note. Please try again.';
        this.showToast('error');
      } finally {
        this.submitting = false;
      }
    },

    /**
     * Clear note form
     */
    clearForm() {
      if (confirm('Are you sure you want to clear the form? This will also delete any saved draft for today.')) {
        // Clear draft from localStorage
        this.clearCurrentDraft();

        // Reset form using shared method
        this.resetFormToFresh();
      }
    },

    // ========================================
    // EDIT/AMEND WORKFLOW
    // ========================================

    /**
     * Load a progress note document for editing.
     * Routes to direct edit or amendment workflow based on settings.
     *
     * @param {object} doc - The progress note document to edit
     */
    loadDocumentForEditing(doc) {
      if (!doc || doc.documentType !== 'progress_note') {
        Logger.warn('loadDocumentForEditing: Invalid document', doc);
        return;
      }

      if (this.progressNoteEditMode === 'amendment-required') {
        // Show amendment reason modal
        this.documentBeingAmended = doc;
        this.amendmentReason = '';
        this.showAmendmentReasonModal = true;
      } else {
        // Direct edit - load into form
        this.loadDocumentForDirectEdit(doc);
      }
    },

    /**
     * Load a document for direct in-place editing.
     *
     * @param {object} doc - The document to edit
     */
    loadDocumentForDirectEdit(doc) {
      this.isEditingExisting = true;
      this.editingDocumentId = doc.id;

      // Load document content into currentNote
      // Date comes from top-level doc.date, not content
      this.currentNote.date = doc.date;
      this.currentNote.duration = doc.content.duration || 50;
      this.currentNote.purpose = doc.content.purpose || '';
      this.currentNote.mseEntries = doc.content.mseEntries || [];
      this.currentNote.therapeuticApproaches = doc.content.therapeuticApproaches || [];
      this.currentNote.therapeuticApproachesOther = doc.content.therapeuticApproachesOther || '';
      this.currentNote.interventions = doc.content.interventions || [];
      this.currentNote.responseToInterventions = doc.content.responseToInterventions || '';
      this.currentNote.additionalNotes = doc.content.additionalNotes || '';
      this.currentNote.futureNotes = doc.content.futureNotes || '';
      this.currentNote.narrativeFormat = doc.content.narrativeFormat || '';

      // Load delivery and location if available
      this.delivery = doc.content.delivery || 'In Person';
      this.deliveryOther = doc.content.deliveryOther || '';
      this.clientLocation = doc.content.clientLocation || 'Office';
      this.clientLocationOther = doc.content.clientLocationOther || '';
      this.formType = doc.content.formType || 'Progress Note';

      // Clear any existing draft - we're editing from backend
      this.clearCurrentDraft();
      this.currentDraftUUID = null;

      Logger.log('Loaded document for direct editing:', doc.id);
    },

    /**
     * Start the amendment workflow after user provides reason.
     * Called when user confirms in amendment reason modal.
     */
    startAmendment() {
      if (!this.documentBeingAmended || !this.amendmentReason.trim()) {
        Logger.warn('startAmendment: Missing document or reason');
        return;
      }

      const doc = this.documentBeingAmended;

      // Generate new UUID for the amendment
      const uuid = DraftStorage.initializeDraft(
        this.selectedClient,
        this.formType,
        doc.date
      );

      if (!uuid) {
        Logger.error('startAmendment: Failed to initialize draft');
        return;
      }

      this.currentDraftUUID = uuid;
      this.amendmentOf = doc.id;

      // Load original content into form
      this.currentNote.date = doc.date;  // Keep same date as original
      this.currentNote.duration = doc.content.duration || 50;
      this.currentNote.purpose = doc.content.purpose || '';
      this.currentNote.mseEntries = doc.content.mseEntries || [];
      this.currentNote.therapeuticApproaches = doc.content.therapeuticApproaches || [];
      this.currentNote.therapeuticApproachesOther = doc.content.therapeuticApproachesOther || '';
      this.currentNote.interventions = doc.content.interventions || [];
      this.currentNote.responseToInterventions = doc.content.responseToInterventions || '';
      this.currentNote.additionalNotes = doc.content.additionalNotes || '';
      this.currentNote.futureNotes = doc.content.futureNotes || '';
      this.currentNote.narrativeFormat = doc.content.narrativeFormat || '';

      // Load delivery and location
      this.delivery = doc.content.delivery || 'In Person';
      this.deliveryOther = doc.content.deliveryOther || '';
      this.clientLocation = doc.content.clientLocation || 'Office';
      this.clientLocationOther = doc.content.clientLocationOther || '';
      this.formType = doc.content.formType || 'Progress Note';

      // Close modal and clear temporary state
      this.showAmendmentReasonModal = false;
      this.documentBeingAmended = null;

      Logger.log('Started amendment for document:', doc.id, 'New UUID:', uuid);
    },

    /**
     * Cancel the amendment workflow.
     */
    cancelAmendment() {
      this.showAmendmentReasonModal = false;
      this.documentBeingAmended = null;
      this.amendmentReason = '';
    },

    /**
     * Clear editing/amendment state (used after successful save or cancel).
     */
    clearEditingState() {
      this.isEditingExisting = false;
      this.editingDocumentId = null;
      this.amendmentOf = null;
      this.amendmentReason = '';
      this.documentBeingAmended = null;
      this.showAmendmentReasonModal = false;
    },

    // ========================================
    // NARRATIVE GENERATION
    // ========================================

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
     * Format MSE entries into readable text for the prompt
     */
    formatMSEForPrompt() {
      if (!this.currentNote.mseEntries || this.currentNote.mseEntries.length === 0) {
        return 'No MSE observations recorded.';
      }

      return this.currentNote.mseEntries.map((entry, index) => {
        const parts = [];

        if (entry.note && entry.note.trim()) {
          parts.push(`Notes: ${entry.note}`);
        }
        if (entry.mood && entry.mood.length > 0) {
          const moodItems = entry.mood.map(m => m === 'other' && entry.moodOther ? entry.moodOther : m);
          parts.push(`Mood: ${moodItems.join(', ')}`);
        }
        if (entry.disturbance && entry.disturbance.length > 0) {
          const distItems = entry.disturbance.map(d => d === 'other' && entry.disturbanceOther ? entry.disturbanceOther : d);
          parts.push(`Disturbances: ${distItems.join(', ')}`);
        }
        if (entry.perception && entry.perception.length > 0) {
          const percItems = entry.perception.map(p => p === 'other' && entry.perceptionOther ? entry.perceptionOther : p);
          parts.push(`Perception: ${percItems.join(', ')}`);
        }
        if (entry.thoughtContent && entry.thoughtContent.length > 0) {
          const tcItems = entry.thoughtContent.map(t => t === 'other' && entry.thoughtContentOther ? entry.thoughtContentOther : t);
          parts.push(`Thought Content: ${tcItems.join(', ')}`);
        }
        if (entry.thoughtProcess && entry.thoughtProcess.length > 0) {
          const tpItems = entry.thoughtProcess.map(t => t === 'other' && entry.thoughtProcessOther ? entry.thoughtProcessOther : t);
          parts.push(`Thought Process: ${tpItems.join(', ')}`);
        }
        if (entry.risk && entry.risk.length > 0) {
          if (entry.risk.includes('none')) {
            parts.push('Risk Factors: None identified');
          } else {
            const riskItems = entry.risk.map(r => r === 'other' && entry.riskOther ? entry.riskOther : r);
            let riskText = `Risk Factors: ${riskItems.join(', ')}`;
            if (entry.riskDetails && entry.riskDetails.trim()) {
              riskText += ` (${entry.riskDetails.trim()})`;
            }
            parts.push(riskText);
          }
        }

        // Determine header: use name if available, otherwise "Observation N" for multiple entries
        const hasMultiple = this.currentNote.mseEntries.length > 1;
        const identifier = entry.name?.trim()
          ? entry.name.trim()
          : (hasMultiple ? `Observation ${index + 1}` : '');

        if (parts.length === 0) {
          return identifier
            ? `${identifier}: No specific findings noted.`
            : 'No specific findings noted.';
        }

        const header = identifier ? `${identifier}:\n` : '';
        return header + parts.join('\n');
      }).join('\n\n');
    },

    /**
     * Format therapeutic approaches into readable text for the prompt
     */
    formatTherapeuticApproachesForPrompt() {
      const approaches = this.currentNote.therapeuticApproaches || [];
      const other = this.currentNote.therapeuticApproachesOther;

      if (approaches.length === 0 && !other) {
        return 'No therapeutic approaches specified.';
      }

      // Get human-readable names from lexicon if available
      const approachNames = approaches.map(value => {
        if (this.lexicon && this.lexicon.therapeuticApproaches) {
          const found = this.lexicon.therapeuticApproaches.find(a => a.value === value);
          return found ? found.name : value;
        }
        // Fallback: convert value to readable format
        return value.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      });

      if (other && other.trim()) {
        approachNames.push(other);
      }

      return approachNames.join(', ');
    },

    /**
     * Format interventions into readable text for the prompt
     */
    formatInterventionsForPrompt() {
      if (!this.currentNote.interventions || this.currentNote.interventions.length === 0) {
        return 'No interventions recorded.';
      }

      return this.currentNote.interventions.map((intervention, index) => {
        const parts = [`Intervention: ${intervention.label}`];

        if (intervention.notes && intervention.notes.trim()) {
          parts.push(`Notes: ${intervention.notes}`);
        }

        return parts.join('\n');
      }).join('\n\n');
    },

    /**
     * Get formatted client location for narrative prompt
     */
    getFormattedClientLocation() {
      if (this.clientLocation === 'Other' && this.clientLocationOther) {
        return this.clientLocationOther;
      }
      return this.clientLocation || 'Not specified';
    },

    /**
     * Interpolate placeholders in the prompt template with actual values.
     *
     * Core placeholders (used in default template):
     *   {{date}}, {{duration}}, {{clientName}}, {{clientType}},
     *   {{sessionPurpose}}, {{mseEntries}}, {{therapeuticApproaches}},
     *   {{interventions}}, {{additionalNotes}}, {{futureNotes}}
     *
     * Additional placeholders (available for custom templates):
     *   {{diagnosis}}, {{treatmentGoals}}, {{targetSymptoms}}, {{treatmentNotes}},
     *   {{lastSessionDate}}, {{lastSessionNarrative}}, {{riskLevel}},
     *   {{totalSessions}}, {{treatmentStartDate}}, {{sessionBasis}}
     */
    interpolatePromptTemplate(template) {
      const client = this.clients.find(c => c.id === this.selectedClient);
      const clientName = client ? client.name : 'Client';
      const clientType = client?.clientType || 'Individual';

      // Extract data from clientContext (diagnosis, treatmentPlan, lastSession)
      const diagnosis = this.clientContext?.diagnosis;
      const treatmentPlan = this.clientContext?.treatmentPlan;
      const lastSession = this.clientContext?.lastSession;

      // Format treatment goals as bullet list
      const treatmentGoals = treatmentPlan?.goals?.length
        ? treatmentPlan.goals.map(g => `- ${g}`).join('\n')
        : 'No treatment goals on file';

      // Format target symptoms as comma-separated list
      const targetSymptoms = treatmentPlan?.targetSymptoms?.length
        ? treatmentPlan.targetSymptoms.join(', ')
        : 'None specified';

      // Core replacements (used in default template)
      const replacements = {
        '{{date}}': this.currentNote.date || 'Not specified',
        '{{duration}}': this.currentNote.duration || 'Not specified',
        '{{clientName}}': clientName,
        '{{clientType}}': clientType,
        '{{clientLocation}}': this.getFormattedClientLocation(),
        '{{sessionPurpose}}': this.currentNote.purpose?.trim() || 'Not specified',
        '{{mseEntries}}': this.formatMSEForPrompt(),
        '{{therapeuticApproaches}}': this.formatTherapeuticApproachesForPrompt(),
        '{{interventions}}': this.formatInterventionsForPrompt(),
        '{{responseToInterventions}}': this.currentNote.responseToInterventions?.trim() || 'Not documented',
        '{{additionalNotes}}': this.currentNote.additionalNotes?.trim() || 'None noted',
        '{{futureNotes}}': this.currentNote.futureNotes?.trim() || 'None noted',
        '{{includeFutureNotes}}': this.effectiveIncludeFutureNotes ? 'TRUE' : 'FALSE',

        // Additional replacements (available for custom templates)
        '{{diagnosis}}': diagnosis?.text || 'No diagnosis on file',
        '{{treatmentGoals}}': treatmentGoals,
        '{{targetSymptoms}}': targetSymptoms,
        '{{treatmentNotes}}': treatmentPlan?.notes?.trim() || 'No treatment plan notes',
        '{{lastSessionDate}}': lastSession?.date || 'No previous session',
        '{{lastSessionNarrative}}': lastSession?.narrative?.trim() || 'No previous narrative available',
        '{{riskLevel}}': client?.riskLevel || 'Not assessed',
        '{{totalSessions}}': client?.totalSessions?.toString() || 'Unknown',
        '{{treatmentStartDate}}': client?.startDate || 'Unknown',
        '{{sessionBasis}}': client?.sessionBasis || 'Not specified'
      };

      let result = template;
      for (const [placeholder, value] of Object.entries(replacements)) {
        result = result.split(placeholder).join(value);
      }

      return result;
    },

    /**
     * Parse AI response to extract thinking and narrative content from XML tags
     * Handles various edge cases:
     * - Both tags present: extract each
     * - Only thinking tags: extract thinking, remainder is narrative
     * - Only narrative tags: extract narrative, remainder is thinking
     * - No tags: entire response is narrative
     *
     * @param {string} response - Raw AI response (may include prefill)
     * @returns {object} { thinking: string, narrative: string }
     */
    parseNarrativeResponse(response) {
      if (!response) {
        return { thinking: '', narrative: '' };
      }

      let thinking = '';
      let narrative = '';

      // Try to extract thinking content
      const thinkingMatch = response.match(/<thinking>([\s\S]*?)<\/thinking>/i);
      // Try to extract narrative content
      const narrativeMatch = response.match(/<narrative>([\s\S]*?)<\/narrative>/i);

      if (thinkingMatch && narrativeMatch) {
        // Both tags present - extract each
        thinking = thinkingMatch[1].trim();
        narrative = narrativeMatch[1].trim();
      } else if (thinkingMatch && !narrativeMatch) {
        // Only thinking tags - extract thinking, remainder is narrative
        thinking = thinkingMatch[1].trim();
        // Remove the thinking tags and their content, remainder is narrative
        narrative = response
          .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
          .trim();
      } else if (!thinkingMatch && narrativeMatch) {
        // Only narrative tags - extract narrative, remainder is thinking
        narrative = narrativeMatch[1].trim();
        // Remove the narrative tags and their content, remainder is thinking
        thinking = response
          .replace(/<narrative>[\s\S]*?<\/narrative>/gi, '')
          .trim();
      } else {
        // No tags - entire response is narrative
        narrative = response.trim();
      }

      return { thinking, narrative };
    },

    /**
     * Generate narrative from the current note using AI (streaming version)
     * Flow: Get prompts → Interpolate → Stream AI response → Route to UI in real-time
     * Note: Uses in-memory form data, does not require note to be saved first
     */
    async generateNarrative() {
      // Validate: must have a selected client
      if (!this.selectedClient) {
        this.narrativeError = 'Please select a client first.';
        return;
      }

      this.generatingNarrative = true;
      this.narrativeError = '';

      // Store the original narrative content for separator handling
      const hadExistingContent = this.currentNote.narrativeFormat && this.currentNote.narrativeFormat.trim();
      let narrativeStarted = false;

      try {
        // Step 1: Get all narrative settings (or use defaults)
        let systemPrompt = this.getDefaultSystemPrompt();
        let userTemplate = this.getDefaultPromptTemplate();
        let temperature = 0.5;
        let maxTokens = 2048;
        let prefill = '<thinking>\nThis is a';
        let modelId = 'global.anthropic.claude-sonnet-4-5-20250929-v1:0';

        try {
          const settings = await API.getSettings('narrative');
          if (settings) {
            if (settings.systemPrompt) {
              systemPrompt = settings.systemPrompt;
            }

            // Check for new sections-based format
            if (settings.sections) {
              // Assemble the prompt from sections and examples
              userTemplate = PromptTemplates.assemblePrompt(
                NarrativeDefaults.metaTemplate,
                settings.sections,
                settings.examples || NarrativeDefaults.defaultExamples
              );
            } else if (settings.promptTemplate) {
              // Legacy format: use monolithic template
              userTemplate = settings.promptTemplate;
            }

            if (settings.temperature !== undefined) {
              temperature = settings.temperature;
            }
            if (settings.maxTokens !== undefined) {
              maxTokens = settings.maxTokens;
            }
            if (settings.prefill !== undefined) {
              prefill = settings.prefill;
            }
            if (settings.modelId) {
              modelId = settings.modelId;
            }
          }
        } catch (e) {
          // Use defaults if settings fail to load
          Logger.warn('Failed to load narrative settings, using defaults:', e);
        }

        // Step 3: Interpolate the user template with current note data
        const interpolatedPrompt = this.interpolatePromptTemplate(userTemplate);

        // Step 4: Initialize streaming state
        this.lastNarrativeThinking = '';
        this.isThinkingPhase = true;  // Start in thinking phase

        // Step 5: Create streaming tag parser with callbacks
        const parser = new StreamingTagParser(
          prefill,
          // onThinking callback - append to thinking display
          (text) => {
            this.lastNarrativeThinking += text;
          },
          // onNarrative callback - append to narrative textarea
          (text) => {
            // Add separator before first narrative content if there was existing content
            if (!narrativeStarted) {
              narrativeStarted = true;
              this.isThinkingPhase = false;  // Thinking complete, now generating narrative
              if (hadExistingContent) {
                this.currentNote.narrativeFormat += '\n\n---\n\n';
              }
            }
            this.currentNote.narrativeFormat += text;
          }
        );

        // Step 6: Start streaming and store controller for stop functionality
        await new Promise((resolve, reject) => {
          this.narrativeStreamController = API.streamNarrative(
            interpolatedPrompt,
            { systemPrompt, temperature, maxTokens, prefill, modelId },
            // onChunk
            (text) => {
              parser.processChunk(text);
            },
            // onComplete
            (stopReason) => {
              parser.flush();
              this.narrativeStreamController = null;
              this.generatingNarrative = false;
              this.isThinkingPhase = false;
              Logger.log('Narrative streaming complete:', stopReason);
              resolve();
            },
            // onError
            (error) => {
              this.narrativeStreamController = null;
              this.generatingNarrative = false;
              this.isThinkingPhase = false;
              reject(error);
            }
          );
        });

      } catch (error) {
        Logger.error('Narrative generation failed:', error);
        this.narrativeError = error.message || 'Failed to generate narrative. Please try again.';
        this.generatingNarrative = false;
        this.isThinkingPhase = false;
        this.narrativeStreamController = null;
      }
    },

    /**
     * Stop an in-progress narrative generation
     */
    stopNarrativeGeneration() {
      if (this.narrativeStreamController) {
        this.narrativeStreamController.abort();
        this.narrativeStreamController = null;
        // Note: generatingNarrative will be set to false by the onComplete callback
      }
    },

    /**
     * Reset narrative and thinking content with undo option
     */
    resetNarrative() {
      // Store current state for undo
      const previousNarrative = this.currentNote.narrativeFormat;
      const previousThinking = this.lastNarrativeThinking;

      // Clear content
      this.currentNote.narrativeFormat = '';
      this.lastNarrativeThinking = '';
      this.showNarrativeThinking = false;

      // Show undo toast
      this.showUndoToast('Narrative cleared', () => {
        this.currentNote.narrativeFormat = previousNarrative;
        this.lastNarrativeThinking = previousThinking;
        if (previousThinking) {
          this.showNarrativeThinking = true;
        }
      });
    },

    // ========================================
    // DRAFT AUTO-SAVE METHODS
    // ========================================

    /**
     * Check if the form has any content worth saving
     * Similar to hasUnsavedChanges() but doesn't check auth/client
     * @returns {boolean} True if form has content
     */
    hasFormContent() {
      const note = this.currentNote;

      // Check purpose field
      if (note.purpose?.trim()) return true;

      // Check MSE entries
      if (note.mseEntries && note.mseEntries.length > 0) {
        for (const mse of note.mseEntries) {
          if (mse.note?.trim()) return true;
          if (mse.disturbance?.length > 0) return true;
          if (mse.mood?.length > 0) return true;
          if (mse.perception?.length > 0) return true;
          if (mse.thoughtContent?.length > 0) return true;
          if (mse.thoughtProcess?.length > 0) return true;
          if (mse.risk?.length > 0) return true;
        }
      }

      // Check therapeutic approaches
      if (note.therapeuticApproaches && note.therapeuticApproaches.length > 0) return true;
      if (note.therapeuticApproachesOther?.trim()) return true;

      // Check interventions
      if (note.interventions && note.interventions.length > 0) return true;

      // Check additional notes
      if (note.additionalNotes?.trim()) return true;

      // Check future notes
      if (note.futureNotes?.trim()) return true;

      // Check narrative
      if (note.narrativeFormat?.trim()) return true;

      return false;
    },

    /**
     * Schedule a draft save with debouncing
     * Called whenever form content changes
     */
    scheduleDraftSave() {
      // Clear any existing timer
      if (this.draftSaveTimer) {
        clearTimeout(this.draftSaveTimer);
      }

      // Don't schedule if no client or draft selected
      if (!this.selectedClient || !this.currentDraftUUID) {
        return;
      }

      // Don't schedule if form is empty
      if (!this.hasFormContent()) {
        return;
      }

      // Set status to show we're waiting to save
      this.draftStatus = 'saving';

      // Schedule save after 2 seconds
      this.draftSaveTimer = setTimeout(() => {
        this.saveDraft();
      }, 2000);
    },

    /**
     * Save the current form as a draft
     * @returns {boolean} True if save succeeded
     */
    saveDraft() {
      if (!this.currentDraftUUID || !this.hasFormContent()) {
        this.draftStatus = 'idle';
        return false;
      }

      const formData = this.getFormDataSnapshot();

      // Also update session date in draft metadata if it changed
      const draft = DraftStorage.getDraft(this.currentDraftUUID);
      if (draft && draft.sessionDate !== this.currentNote.date) {
        DraftStorage.updateSessionDate(this.currentDraftUUID, this.currentNote.date);
      }

      const success = DraftStorage.saveDraft(this.currentDraftUUID, formData);

      if (success) {
        this.draftStatus = 'saved';
        this.draftLastSaved = new Date().toISOString();
      } else {
        this.draftStatus = 'idle';
        Logger.error('Failed to save draft');
      }

      return success;
    },

    /**
     * Load a draft into the current form
     * @param {string} uuid - The UUID of the draft to load
     */
    loadDraft(uuid) {
      const draft = DraftStorage.getDraft(uuid);
      if (!draft || !draft.data) {
        Logger.error('Draft not found:', uuid);
        return;
      }

      // Set the current draft UUID
      this.currentDraftUUID = uuid;

      // Load draft data into currentNote
      this.currentNote = {
        date: draft.data.date || draft.sessionDate || DateUtils.getTodayDateString(),
        duration: draft.data.duration || 50,
        purpose: draft.data.purpose || '',
        mseEntries: draft.data.mseEntries || [],
        therapeuticApproaches: draft.data.therapeuticApproaches || [],
        therapeuticApproachesOther: draft.data.therapeuticApproachesOther || '',
        interventions: draft.data.interventions || [],
        responseToInterventions: draft.data.responseToInterventions || '',
        additionalNotes: draft.data.additionalNotes || '',
        futureNotes: draft.data.futureNotes || '',
        narrativeFormat: draft.data.narrativeFormat || ''
      };

      // Update draft status to reflect loaded draft
      this.draftStatus = 'saved';
      this.draftLastSaved = draft.savedAt;

      // Check for duplicates with the loaded draft's date
      this.checkForDuplicates();
    },

    /**
     * Clear the current draft from storage (after successful submit)
     */
    clearCurrentDraft() {
      if (this.currentDraftUUID) {
        DraftStorage.deleteDraft(this.currentDraftUUID);
        this.currentDraftUUID = null;
      }

      this.draftStatus = 'idle';
      this.draftLastSaved = null;
    },

    /**
     * Delete a specific draft (from the draft selection modal)
     * @param {string} uuid - The UUID of the draft to delete
     */
    deleteSelectedDraft(uuid) {
      if (!uuid) return;

      DraftStorage.deleteDraft(uuid);

      // Update available drafts list
      this.availableDrafts = DraftStorage.getDraftsForClient(this.selectedClient);

      // If no more drafts, close the modal
      if (this.availableDrafts.length === 0) {
        this.showDraftSelectionModal = false;
        this.selectedDraftUUID = null;
      } else if (this.selectedDraftUUID === uuid) {
        // If the deleted draft was selected, select the first remaining
        this.selectedDraftUUID = this.availableDrafts[0].uuid;
      }
    },

    /**
     * Format the draft last saved time for display
     * @returns {string} Human-readable relative time
     */
    formatDraftTime() {
      if (!this.draftLastSaved) return '';
      return DraftStorage.formatSavedAt(this.draftLastSaved);
    },

    /**
     * Format the last saved note timestamp for display
     */
    formatNoteSavedTime() {
      if (!this.noteLastSaved) return '';
      return DraftStorage.formatSavedAt(this.noteLastSaved);
    },

    // ========================================
    // DUPLICATE DETECTION
    // ========================================

    /**
     * Check for potential duplicates and update warning state.
     * Called when client or date changes.
     */
    checkForDuplicates() {
      if (!this.selectedClient || !this.currentNote.date) {
        this.resetDuplicateWarnings();
        return;
      }

      const warnings = {
        hasBackendDocument: false,
        hasOtherDraft: false,
        predatesClient: false,
        tooSoonForBasis: false,
        orphanedDrafts: []
      };

      const client = this.clients.find(c => c.id === this.selectedClient);
      const sessionDate = this.currentNote.date;

      // 1. Check if backend document exists for this date (same form type)
      // Only warn for document types where same-date duplicates are unusual.
      // Diagnoses are excluded - multiple diagnoses per date is normal (comorbid conditions).
      const WARN_ON_DUPLICATE_DATE = ['progress_note', 'intake', 'treatment_plan', 'consultation', 'discharge'];
      const currentDocType = this._formTypeToDocType(this.formType);

      // Defensive: ensure clientDocuments is an array
      const docs = Array.isArray(this.clientDocuments) ? this.clientDocuments : [];
      const existingDoc = WARN_ON_DUPLICATE_DATE.includes(currentDocType)
        ? docs.find(doc => doc.documentType === currentDocType && doc.date === sessionDate)
        : null;
      warnings.hasBackendDocument = !!existingDoc;

      // 2. Check if another local draft exists for this date (different UUID, same form type)
      const otherDrafts = DraftStorage.getDraftsForDate(this.selectedClient, sessionDate)
        .filter(d => d.uuid !== this.currentDraftUUID && d.formType === this.formType);
      warnings.hasOtherDraft = otherDrafts.length > 0;

      // 3. Check if date predates client creation
      if (client && client.createdAt) {
        const clientCreatedDate = client.createdAt.split('T')[0]; // Extract date portion
        warnings.predatesClient = sessionDate < clientCreatedDate;
      }

      // 4. Check if session is too soon based on sessionBasis
      const lastSessionDate = this.clientContext?.lastSession?.date;
      if (client?.sessionBasis && lastSessionDate && sessionDate !== lastSessionDate) {
        const daysSinceLast = DateUtils.daysBetween(lastSessionDate, sessionDate);
        const minDays = this._getMinDaysForBasis(client.sessionBasis);

        if (minDays !== null && daysSinceLast !== null && daysSinceLast < minDays) {
          warnings.tooSoonForBasis = true;
        }
      }

      // 5. Check for orphaned drafts (>24h old, not saved to backend)
      warnings.orphanedDrafts = DraftStorage.findOrphanedDrafts(this.selectedClient, 24);

      this.duplicateWarnings = warnings;

      // Show critical modal if needed
      const hasCritical = warnings.hasBackendDocument ||
                          warnings.hasOtherDraft ||
                          warnings.predatesClient;

      if (hasCritical) {
        this.showDuplicateModal = true;
      }

      // Show dismissible banner for info warnings (only if no critical)
      const hasInfo = warnings.tooSoonForBasis || warnings.orphanedDrafts.length > 0;
      if (hasInfo && !hasCritical) {
        this.showOrphanBanner = true;
      }
    },

    /**
     * Reset duplicate warning state
     */
    resetDuplicateWarnings() {
      this.duplicateWarnings = {
        hasBackendDocument: false,
        hasOtherDraft: false,
        predatesClient: false,
        tooSoonForBasis: false,
        orphanedDrafts: []
      };
      this.showDuplicateModal = false;
      this.showOrphanBanner = false;
    },

    /**
     * Get minimum days for sessionBasis warning (50% tolerance)
     * @param {string} basis - Session basis value
     * @returns {number|null} Minimum days or null if no warning needed
     */
    _getMinDaysForBasis(basis) {
      const thresholds = {
        'weekly': 3.5,      // 7 days * 0.5
        'biweekly': 7,      // 14 days * 0.5
        'as-needed': null,  // No warning
        'other': null       // No warning
      };
      return thresholds[basis] ?? null;
    },

    /**
     * Dismiss the duplicate warning modal
     */
    dismissDuplicateModal() {
      this.showDuplicateModal = false;
    },

    /**
     * Dismiss the orphan/timing warning banner
     */
    dismissOrphanBanner() {
      this.showOrphanBanner = false;
    },

    /**
     * Reset the form to a fresh state
     */
    resetFormToFresh() {
      this.currentNote = {
        date: DateUtils.getTodayDateString(),
        duration: 50,
        purpose: '',
        mseEntries: [],
        therapeuticApproaches: [],
        therapeuticApproachesOther: '',
        interventions: [],
        responseToInterventions: '',
        additionalNotes: '',
        futureNotes: '',
        narrativeFormat: ''
      };

      // Reset delivery and location fields
      this.deliveryOther = '';
      this.clientLocation = 'Office';
      this.clientLocationOther = '';

      // Clear validation errors and warnings
      this.formErrors = { client: '', date: '', duration: '', deliveryOther: '', clientLocation: '', clientLocationOther: '' };
      this.diagnosisErrors = { icd10Code: '', description: '', dateOfDiagnosis: '', dateResolved: '' };
      this.dateWarning = '';
      this.duplicateSessionWarning = false;

      // Reset narrative state
      this.narrativeError = '';
      this.lastNarrativeThinking = '';
      this.showNarrativeThinking = false;
      this.includeFutureNotes = true;

      // Reset draft state
      this.draftStatus = 'idle';
      this.draftLastSaved = null;

      // Clear saved note timestamp (starting fresh)
      this.noteLastSaved = null;

      // Reset intervention selector
      this.resetInterventionSelector();
    },

    /**
     * Handle form type change (e.g., Progress Note → Intake)
     * Saves current draft and checks for drafts of the new type
     * @param {string} oldType - Previous form type
     * @param {string} newType - New form type
     */
    handleFormTypeChange(oldType, newType) {
      // Don't do anything if no client selected
      if (!this.selectedClient) return;

      // Skip interactive flows when restoring from URL parameters
      if (this._restoringFromURL) return;

      // Save draft for old form type if there's content
      if (this.hasFormContent()) {
        // Temporarily set formType back to save under old type
        const tempType = this.formType;
        this.formType = oldType;
        this.saveDraft();
        this.formType = tempType;
      }

      // Check for drafts of the new form type
      const allDrafts = DraftStorage.getDraftsForClient(this.selectedClient);
      this.availableDrafts = allDrafts.filter(d => d.formType === newType);

      if (this.availableDrafts.length > 0) {
        // Show draft selection modal
        this.selectedDraftUUID = this.availableDrafts[0].uuid;
        this.showDraftSelectionModal = true;
      } else {
        // No drafts for new type - initialize new draft and reset form
        const sessionDate = DateUtils.getTodayDateString();
        this.currentDraftUUID = DraftStorage.initializeDraft(
          this.selectedClient,
          newType,
          sessionDate
        );
        this.resetFormToFresh();
      }
    },

    // ========================================
    // CLIENT SWITCH MODAL HANDLERS
    // ========================================

    /**
     * Get the display name for the previous client (for modal text)
     * @returns {string} Client name or 'the client'
     */
    getPreviousClientName() {
      if (!this.previousClientId) return 'the client';
      const client = this.clients.find(c => c.id === this.previousClientId);
      return client ? client.name : 'the client';
    },

    /**
     * Get the display name for the pending client (for modal text)
     * @returns {string} Client name or 'the new client'
     */
    getPendingClientName() {
      if (!this.pendingClientId) return 'the new client';
      const client = this.clients.find(c => c.id === this.pendingClientId);
      return client ? client.name : 'the new client';
    },

    /**
     * Cancel the client switch and revert selection
     */
    cancelClientSwitch() {
      this.showDraftSwitchModal = false;
      // Revert to previous client without triggering change handler
      this.selectedClient = this.previousClientId;
      this.pendingClientId = null;
      this.previousClientId = null;
    },

    /**
     * Save draft for previous client, then continue with switch
     */
    handleDraftSave() {
      // Save draft for the previous client
      if (this.previousClientId && this.hasFormContent()) {
        const currentClientId = this.selectedClient;
        // Temporarily set selectedClient to previous for saving
        this.selectedClient = this.previousClientId;
        this.saveDraft();
        this.selectedClient = currentClientId;
      }

      // Close modal and continue switch
      this.showDraftSwitchModal = false;
      this.continueClientSwitch();
    },

    /**
     * Keep form content and move it to the new client
     */
    handleDraftMove() {
      // Form content stays as-is, just continue the switch
      // The form is now associated with the new client
      this.showDraftSwitchModal = false;

      // Don't reset form, just update client context
      // Clear draft state since this is "moved" content, not a saved draft
      this.draftStatus = 'idle';
      this.draftLastSaved = null;

      // Complete the switch but skip form reset
      this.finishClientSwitch(false);
    },

    /**
     * Discard form content and switch to new client
     */
    handleDraftDiscard() {
      this.showDraftSwitchModal = false;
      // Reset form and continue
      this.resetFormToFresh();
      this.finishClientSwitch(true);
    },

    /**
     * Continue client switch after modal decision
     * Checks for drafts of new client
     */
    continueClientSwitch() {
      // Reset form first
      this.resetFormToFresh();
      this.finishClientSwitch(true);
    },

    /**
     * Complete the client switch
     * @param {boolean} checkDrafts - Whether to check for existing drafts
     */
    async finishClientSwitch(checkDrafts) {
      const newClientId = this.pendingClientId || this.selectedClient;

      // Clear pending state
      this.pendingClientId = null;
      this.previousClientId = null;

      // Update selectedClient if needed
      if (this.selectedClient !== newClientId) {
        this.selectedClient = newClientId;
      }

      // If switching to no client, just reset
      if (!newClientId) {
        this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
        this.clientType = '';
        this.formType = 'Progress Note';
        this.delivery = 'In Person';
        return;
      }

      // Check for drafts if requested
      if (checkDrafts) {
        this.availableDrafts = DraftStorage.getDraftsForClient(newClientId);
        if (this.availableDrafts.length > 0) {
          this.selectedDraftUUID = this.availableDrafts[0].uuid;
          this.showDraftSelectionModal = true;
          // Don't load client context yet - wait for draft decision
          return;
        }
      }

      // Load client context normally
      await this.loadClientContextInternal();
    },

    /**
     * Continue with selected draft from the selection modal
     */
    continueSelectedDraft() {
      if (!this.selectedDraftUUID) return;

      // Load the selected draft
      this.loadDraft(this.selectedDraftUUID);

      // Close modal
      this.showDraftSelectionModal = false;
      this.selectedDraftUUID = null;

      // Load client context
      this.loadClientContextInternal();
    },

    /**
     * Start with a fresh form (from draft selection modal)
     */
    startFreshForm() {
      // Initialize a new draft with UUID
      const sessionDate = DateUtils.getTodayDateString();
      this.currentDraftUUID = DraftStorage.initializeDraft(
        this.selectedClient,
        this.formType,
        sessionDate
      );

      // Reset form
      this.resetFormToFresh();

      // Close modal
      this.showDraftSelectionModal = false;
      this.selectedDraftUUID = null;

      // Load client context
      this.loadClientContextInternal();
    },

    // ========================================
    // NAVIGATION
    // ========================================

    /**
     * Check if there are unsaved changes in the document form
     * Returns false if no content, or if content matches a saved draft
     */
    hasUnsavedChanges() {
      // No unsaved changes if no client selected
      if (!this.selectedClient) {
        return false;
      }

      // No unsaved changes if form has no content
      if (!this.hasFormContent()) {
        return false;
      }

      // Form has content - check if it matches a saved draft
      const savedDraft = this.currentDraftUUID
        ? DraftStorage.getDraft(this.currentDraftUUID)
        : null;

      if (savedDraft) {
        // Compare current form data to saved draft
        const currentData = this.getFormDataSnapshot();
        const savedData = savedDraft.data;

        // Use JSON comparison (handles nested objects/arrays)
        if (JSON.stringify(currentData) === JSON.stringify(savedData)) {
          return false; // Content matches saved draft
        }
      }

      // Form has content that differs from saved draft (or no draft exists)
      return true;
    },

    /**
     * Get a snapshot of current form data for comparison/saving
     * @returns {object} Form data snapshot
     */
    getFormDataSnapshot() {
      return {
        date: this.currentNote.date,
        duration: this.currentNote.duration,
        purpose: this.currentNote.purpose,
        mseEntries: JSON.parse(JSON.stringify(this.currentNote.mseEntries)),
        therapeuticApproaches: [...this.currentNote.therapeuticApproaches],
        therapeuticApproachesOther: this.currentNote.therapeuticApproachesOther,
        interventions: JSON.parse(JSON.stringify(this.currentNote.interventions)),
        additionalNotes: this.currentNote.additionalNotes,
        futureNotes: this.currentNote.futureNotes,
        narrativeFormat: this.currentNote.narrativeFormat
      };
    },

    // ========================================
    // MSE MANAGEMENT
    // ========================================

    /**
     * Create empty MSE entry object
     */
    createEmptyMSE() {
      return {
        id: Date.now(),
        name: '',  // Individual's name for this MSE (especially for couple sessions)
        note: '',
        disturbance: [],
        disturbanceOther: '',
        mood: [],
        moodOther: '',
        perception: [],
        perceptionOther: '',
        thoughtContent: [],
        thoughtContentOther: '',
        thoughtProcess: [],
        thoughtProcessOther: '',
        risk: [],
        riskOther: '',
        riskDetails: ''
      };
    },

    /**
     * Add new MSE entry
     * Auto-fills name with client name for non-couple clients
     */
    addMSE() {
      const newMSE = this.createEmptyMSE();

      // Auto-fill name for non-couple clients
      const client = this.clients.find(c => c.id === this.selectedClient);
      if (client && client.clientType !== 'Couple') {
        newMSE.name = client.name;
      }

      this.currentNote.mseEntries.push(newMSE);
    },

    /**
     * Remove MSE entry by ID with undo option
     */
    removeMSE(id) {
      const entry = this.currentNote.mseEntries.find(e => e.id === id);
      const index = this.currentNote.mseEntries.findIndex(e => e.id === id);
      if (index === -1) return;

      // Remove the entry
      this.currentNote.mseEntries.splice(index, 1);

      // Show undo toast
      this.showUndoToast('MSE entry deleted', () => {
        // Restore at original position
        this.currentNote.mseEntries.splice(index, 0, entry);
      });
    },

    // ========================================
    // DIAGNOSIS MANAGEMENT METHODS
    // ========================================

    /**
     * Load all diagnoses for the current client
     * Called when Diagnosis form type is selected
     */
    async loadClientDiagnoses() {
      if (!this.selectedClient) {
        this.clientDiagnoses = [];
        return;
      }

      this.loadingDiagnoses = true;
      try {
        this.clientDiagnoses = await API.getDiagnoses(this.selectedClient);
      } catch (error) {
        Logger.error('Failed to load diagnoses:', error);
        this.clientDiagnoses = [];
        this.errorMessage = 'Failed to load diagnoses';
        this.showToast('error');
      } finally {
        this.loadingDiagnoses = false;
      }
    },

    /**
     * Get active diagnoses (provisional or active, not resolved)
     */
    get activeDiagnoses() {
      return this.clientDiagnoses.filter(d => d.status !== 'resolved');
    },

    /**
     * Get resolved diagnoses (for history section)
     */
    get resolvedDiagnoses() {
      return this.clientDiagnoses.filter(d => d.status === 'resolved');
    },

    // ========================================
    // FORM TYPE SELECTOR (Collapsible)
    // ========================================

    /**
     * All form types in conventional clinical order with icons.
     * Status flags (isBeta, isNotImplemented) derived from centralized FeatureStatus config.
     */
    get allFormTypes() {
      const types = [
        { id: 'Consultation', label: 'Consultation', icon: 'form-consultation' },
        { id: 'Intake', label: 'Intake', icon: 'form-intake' },
        { id: 'Diagnosis', label: 'Diagnosis', icon: 'form-diagnosis' },
        { id: 'Treatment Plan', label: 'Treatment Plan', icon: 'form-treatment-plan' },
        { id: 'Progress Note', label: 'Progress Note', icon: 'form-progress-note' },
        { id: 'Discharge', label: 'Discharge', icon: 'form-discharge' }
      ];
      return types.map(t => ({
        ...t,
        isBeta: FeatureStatus.isBeta('documentTypes', t.id),
        isNotImplemented: FeatureStatus.isNotImplemented('documentTypes', t.id)
      }));
    },

    /**
     * Helper method to convert internal document type to display name
     * @param {string} documentType - Internal type (e.g., 'progress_note')
     * @returns {string} Display name (e.g., 'Progress Note')
     */
    _documentTypeToDisplayName(documentType) {
      const map = {
        'progress_note': 'Progress Note',
        'diagnosis': 'Diagnosis',
        'treatment_plan': 'Treatment Plan',
        'intake': 'Intake',
        'consultation': 'Consultation',
        'discharge': 'Discharge'
      };
      return map[documentType] || documentType;
    },

    /**
     * Helper method to convert form type ID to internal document type
     * @param {string} formType - Form type ID (e.g., 'Progress Note')
     * @returns {string} Internal document type (e.g., 'progress_note')
     */
    _formTypeToDocType(formType) {
      const map = {
        'Progress Note': 'progress_note',
        'Diagnosis': 'diagnosis',
        'Treatment Plan': 'treatment_plan',
        'Intake': 'intake',
        'Consultation': 'consultation',
        'Discharge': 'discharge'
      };
      return map[formType] || formType.toLowerCase().replace(/ /g, '_');
    },

    // ========================================
    // ENTRY FLOW COMPUTED PROPERTIES
    // ========================================

    /**
     * Get clients with appointments scheduled for today (for "Today's Sessions" section)
     * Appointments are stored as UTC datetimes; we convert to local date for comparison.
     * Returns empty array if no matches, which auto-hides the section in UI.
     * Sorted by appointment time (earliest first).
     */
    get todaysSessions() {
      const today = DateUtils.getTodayDateString(); // Local date YYYY-MM-DD
      return this.clients
        .filter(c => {
          if (!c.nextAppointment?.datetime) return false;
          // Convert UTC datetime to local date for comparison
          const apptDate = new Date(c.nextAppointment.datetime);
          const localDate = `${apptDate.getFullYear()}-${String(apptDate.getMonth() + 1).padStart(2, '0')}-${String(apptDate.getDate()).padStart(2, '0')}`;
          return localDate === today;
        })
        .map(c => ({
          clientId: c.id,
          clientName: c.name,
          clientInitials: c.initials || c.name.split(' ').map(n => n[0]).join(''),
          clientType: c.clientType || 'Individual',
          appointmentDatetime: c.nextAppointment.datetime, // Full UTC datetime for display
          appointmentDuration: c.nextAppointment.duration || 50
        }))
        .sort((a, b) => a.appointmentDatetime.localeCompare(b.appointmentDatetime));
    },

    /**
     * Get clients filtered by search query
     * Returns all clients if search is empty
     */
    get filteredClients() {
      const query = this.clientSearchQuery.toLowerCase().trim();
      if (!query) return this.clients;
      return this.clients.filter(c => c.name.toLowerCase().includes(query));
    },

    /**
     * Get clients that were just added this session
     * Used in client selection view for immediate access after creation
     */
    get justAddedClients() {
      return this.justAddedClientIds
        .map(id => this.clients.find(c => c.id === id))
        .filter(Boolean);
    },

    /**
     * Get recent clients (last 4 with sessions, excluding today's)
     * Used in client selection view for quick access
     */
    get recentClients() {
      const today = DateUtils.getTodayDateString();
      return this.clients
        .filter(c => c.lastSessionDate && c.lastSessionDate !== today)
        .sort((a, b) => new Date(b.lastSessionDate) - new Date(a.lastSessionDate))
        .slice(0, 4);
    },

    // ========================================
    // ENTRY FLOW HELPER METHODS
    // ========================================

    /**
     * Get client initials by ID (for avatar display)
     */
    getClientInitials(clientId) {
      const client = this.clients.find(c => c.id === clientId);
      if (!client) return '?';
      return client.initials || client.name?.split(' ').map(n => n[0]).join('') || '?';
    },

    /**
     * Get client name by ID
     */
    getClientName(clientId) {
      return this.clients.find(c => c.id === clientId)?.name || '';
    },

    /**
     * Get description for a form type (used in form type selection cards)
     */
    getFormTypeDescription(formTypeId) {
      const descriptions = {
        'Progress Note': 'Session documentation with interventions and narrative',
        'Diagnosis': 'Add or update clinical diagnosis (ICD-10)',
        'Treatment Plan': 'Goals, objectives, and intervention strategies',
        'Intake': 'Initial client assessment and history',
        'Consultation': 'Initial consultation notes',
        'Discharge': 'Termination documentation and recommendations'
      };
      return descriptions[formTypeId] || '';
    },

    /**
     * Get total session count for selected client
     */
    getSelectedClientSessionCount() {
      const client = this.clients.find(c => c.id === this.selectedClient);
      return client?.totalSessions || 0;
    },

    /**
     * Handle back button press based on current view
     */
    handleBackButton() {
      if (this.entryView === 'form-select') {
        this.goBackFromFormSelect();
      } else if (this.entryView === 'workspace') {
        this.goBackFromWorkspace();
      }
    },

    // ========================================
    // ENTRY FLOW NAVIGATION METHODS
    // ========================================

    /**
     * Select a client and move to form type selection view
     * @param {string} clientId - The client ID to select
     */
    async selectClientForEntry(clientId) {
      // Set client
      this.selectedClient = clientId;
      this.previousClientId = clientId;

      // Get client type for display
      const client = this.clients.find(c => c.id === clientId);
      if (client) {
        this.clientType = client.clientType || 'Individual';
        document.title = `${client.name} - Forms`;
      }

      // Pre-fetch client context (don't await, let it load in background)
      this.loadClientContextForEntry(clientId);

      // Check for drafts across all form types for this client
      this.clientDraftsForSelection = this.getAllClientDrafts(clientId);

      // Move to form selection view
      this.entryView = 'form-select';
    },

    /**
     * Load client context without showing confirmation modal
     * Used by entry flow where client selection is already confirmed
     * @param {string} clientId - The client ID to load context for
     */
    async loadClientContextForEntry(clientId) {
      const client = this.clients.find(c => c.id === clientId);
      if (!client) return;

      this.loadingClientContext = true;

      try {
        // Fetch all context data in parallel
        const fetchPromises = [
          API.getClientDocuments(clientId),
          API.getCurrentDiagnosis(clientId),
          API.getCurrentTreatmentPlan?.(clientId) || Promise.resolve(null),
          API.getLastSession(clientId)
        ];

        const [documents, diagnosis, treatmentPlan, lastSession] = await Promise.all(fetchPromises);

        // Store documents for completedFormTypes computation
        this.clientDocuments = documents || [];

        // Store context
        this.clientContext = { diagnosis, treatmentPlan, lastSession };
      } catch (error) {
        Logger.error('Error loading client context:', error);
        this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
      } finally {
        this.loadingClientContext = false;
      }
    },

    /**
     * Select a form type and enter the workspace
     * @param {string} formTypeId - The form type to select
     */
    selectFormTypeAndEnter(formTypeId) {
      const oldType = this.formType;
      this.formType = formTypeId;

      // The existing $watch('formType', ...) will handle:
      // - handleFormTypeChange(oldType, newType) for draft warnings
      // - URL updates via updateURLParams()
      // - Loading diagnoses if switching to Diagnosis

      // Enter workspace view
      this.entryView = 'workspace';

      // Check for existing drafts of this form type
      const allDrafts = DraftStorage.getDraftsForClient(this.selectedClient);
      this.availableDrafts = allDrafts.filter(d => d.formType === formTypeId);
      if (this.availableDrafts.length > 0) {
        this.selectedDraftUUID = this.availableDrafts[0].uuid;
        this.showDraftSelectionModal = true;
      } else {
        // No existing drafts - initialize a new draft
        const sessionDate = DateUtils.getTodayDateString();
        this.currentDraftUUID = DraftStorage.initializeDraft(
          this.selectedClient,
          formTypeId,
          sessionDate
        );
      }
    },

    /**
     * Go back from form selection to client selection
     */
    goBackFromFormSelect() {
      // Clear client selection
      this.selectedClient = '';
      this.previousClientId = '';
      this.clientType = '';
      this.clientContext = { diagnosis: null, treatmentPlan: null, lastSession: null };
      this.clientDocuments = [];
      this.clientDraftsForSelection = [];
      this.clientSearchQuery = '';
      this.showAllClients = false;

      // Reset page title
      document.title = 'Documents - Therapy Docs';

      // Go back to client selection
      this.entryView = 'client-select';
    },

    /**
     * Go back from workspace to form selection
     * Shows confirmation modal if there are unsaved changes
     */
    goBackFromWorkspace() {
      if (this.hasFormContent()) {
        this.showExitConfirmModal = true;
      } else {
        this.exitToFormSelect();
      }
    },

    /**
     * Exit workspace and return to form selection
     * Resets form to fresh state
     */
    exitToFormSelect() {
      this.resetFormToFresh();
      this.showExitConfirmModal = false;
      this.showClientDetails = false;
      this.entryView = 'form-select';
    },

    /**
     * Save current form and exit to form selection
     */
    async saveAndExitWorkspace() {
      try {
        // Save the current draft
        this.saveDraft();
        this.exitToFormSelect();
      } catch (error) {
        Logger.error('Error saving draft:', error);
        this.showToast('error', 'Failed to save draft');
      }
    },

    /**
     * Discard changes and exit to form selection
     */
    discardAndExitWorkspace() {
      // Just exit without saving
      this.exitToFormSelect();
    },

    /**
     * Get all drafts for a client across all form types
     * @param {string} clientId - The client ID
     * @returns {Array} Array of draft objects with formType info
     */
    getAllClientDrafts(clientId) {
      const drafts = DraftStorage.getDraftsForClient(clientId);
      // Enhance with formType display info
      return drafts.map(d => {
        const ft = this.allFormTypes.find(f => f.id === d.formType);
        return {
          ...d,
          formTypeLabel: ft?.label || d.formType,
          formTypeIcon: ft?.icon || 'file-text'
        };
      });
    },

    /**
     * Get completed form types for selected client
     * Uses server-provided completedDocumentTypes when available
     */
    get selectedClientCompletedForms() {
      if (!this.selectedClient) return [];

      const client = this.clients.find(c => c.id === this.selectedClient);
      if (!client) return [];

      // Primary: use completedDocumentTypes from server (unified documents API)
      if (client.completedDocumentTypes && Array.isArray(client.completedDocumentTypes)) {
        return client.completedDocumentTypes;
      }

      // Fallback: compute from clientDocuments if available
      if (this.clientDocuments && this.clientDocuments.length > 0) {
        const types = new Set();
        this.clientDocuments.forEach(doc => {
          const displayName = this._documentTypeToDisplayName(doc.documentType);
          if (displayName) {
            types.add(displayName);
          }
        });
        return Array.from(types);
      }

      // Final fallback: infer from existing client data
      const completed = [];
      if (client.totalSessions > 0) completed.push('Progress Note');
      if (this.clientContext.diagnosis) completed.push('Diagnosis');
      if (this.clientContext.treatmentPlan) completed.push('Treatment Plan');
      return completed;
    },

    /**
     * Get progress notes organized with amendment chains.
     * Groups original documents with their amendments for display.
     *
     * @returns {Array} Array of progress notes with amendments nested
     */
    get displayProgressNotes() {
      const progressNotes = this.clientDocuments.filter(d => d.documentType === 'progress_note');

      // Find originals (notes without amendmentOf)
      const originals = progressNotes.filter(d => !d.content?.amendmentOf);

      // Map originals with their amendments
      return originals.map(doc => ({
        ...doc,
        amendments: progressNotes
          .filter(d => d.content?.amendmentOf === doc.id)
          .sort((a, b) => {
            // Sort by amendment date, newest first
            const dateA = a.content?.amendmentDate || a.updatedAt || '';
            const dateB = b.content?.amendmentDate || b.updatedAt || '';
            return dateB.localeCompare(dateA);
          })
      })).sort((a, b) => {
        // Sort originals by date, newest first
        return (b.date || '').localeCompare(a.date || '');
      });
    },

    /**
     * Get the last session as a full document (for editing).
     * Uses clientDocuments if available, falls back to lastSession ID lookup.
     *
     * @returns {object|null} The last session document or null
     */
    get lastSessionDocument() {
      if (!this.clientContext.lastSession?.id) return null;

      // Try to find in clientDocuments first (has proper structure)
      const doc = this.clientDocuments.find(d =>
        d.id === this.clientContext.lastSession.id &&
        d.documentType === 'progress_note'
      );

      return doc || null;
    },

    /**
     * Determine which form types should be collapsible based on client state
     * Returns form types with collapsible flag
     */
    get formTypeOptions() {
      const completed = this.selectedClientCompletedForms;
      const hasDischarge = completed.includes('Discharge');
      const hasProgressNote = completed.includes('Progress Note');
      const hasIntake = completed.includes('Intake');
      const hasConsultation = completed.includes('Consultation');
      const noForms = completed.length === 0;

      // Determine which forms should be collapsed (hidden by default)
      let collapsedForms = [];

      if (hasDischarge) {
        // Has Discharge → only show Discharge
        collapsedForms = ['Consultation', 'Intake', 'Diagnosis', 'Treatment Plan', 'Progress Note'];
      } else if (hasProgressNote || hasIntake) {
        // Has Intake or Progress Note → show Diagnosis, Treatment Plan, Progress Note
        collapsedForms = ['Consultation', 'Intake', 'Discharge'];
      } else if (hasConsultation) {
        // Has Consultation → show Intake, Progress Note
        collapsedForms = ['Consultation', 'Diagnosis', 'Treatment Plan', 'Discharge'];
      } else if (noForms || !this.selectedClient) {
        // No forms (or no client) → show Consultation, Intake, Progress Note
        collapsedForms = ['Diagnosis', 'Treatment Plan', 'Discharge'];
      }

      // Filter based on document type visibility settings
      const visibilityFiltered = this.allFormTypes.filter(ft => {
        // Progress Note is always visible
        if (ft.id === 'Progress Note') return true;

        const vis = this.documentTypeVisibility;

        // Undeveloped types require showUndeveloped toggle + individual toggle
        if (ft.isNotImplemented) {
          if (!vis.showUndeveloped) return false;
          if (ft.id === 'Consultation') return vis.consultationEnabled;
          if (ft.id === 'Discharge') return vis.dischargeEnabled;
          return false;
        }

        // Beta types require showBeta toggle + individual toggle
        if (ft.isBeta) {
          if (!vis.showBeta) return false;
          if (ft.id === 'Intake') return vis.intakeEnabled;
          if (ft.id === 'Diagnosis') return vis.diagnosisEnabled;
          if (ft.id === 'Treatment Plan') return vis.treatmentPlanEnabled;
          return false;
        }

        return true;
      });

      return visibilityFiltered.map(ft => ({
        ...ft,
        collapsible: collapsedForms.includes(ft.id)
      }));
    },

    /**
     * Get visible form types based on expanded state
     */
    get visibleFormTypes() {
      return this.formTypeExpanded
        ? this.formTypeOptions
        : this.formTypeOptions.filter(ft => !ft.collapsible);
    },

    /**
     * Update the sliding indicator position for form type selector
     * @param {number} retryCount - Internal retry counter
     */
    updateFormTypeSlider(retryCount = 0) {
      this.$nextTick(() => {
        const container = this.$refs.formTypeControl;
        const selectedBtn = container?.querySelector(`[data-formtype-id='${this.formType}']`);

        if (container && selectedBtn) {
          const containerRect = container.getBoundingClientRect();
          const btnRect = selectedBtn.getBoundingClientRect();

          // Ensure we have valid dimensions (not zero)
          if (btnRect.width > 0) {
            const offsetLeft = btnRect.left - containerRect.left - 4; // 4px = container padding
            this.formTypeSliderStyle = `width: ${btnRect.width}px; transform: translateX(${offsetLeft}px)`;
            return;
          }
        }

        // Elements not ready or dimensions invalid - retry a few times
        if (retryCount < 5) {
          setTimeout(() => this.updateFormTypeSlider(retryCount + 1), 100);
        }
      });
    },

    /**
     * Toggle form type expanded state
     */
    toggleFormTypeExpand() {
      this.formTypeExpanded = !this.formTypeExpanded;
      // If collapsing and current selection will be hidden, switch to Progress Note
      if (!this.formTypeExpanded) {
        const currentOption = this.formTypeOptions.find(ft => ft.id === this.formType);
        if (currentOption?.collapsible) {
          this.formType = 'Progress Note';
        }
      }
      this.updateFormTypeSlider();
    },

    /**
     * Select a form type
     */
    selectFormType(formTypeId) {
      this.formType = formTypeId;
      this.updateFormTypeSlider();
    },

    /**
     * Check if the diagnosis form can be saved
     */
    get canSaveDiagnosis() {
      // Must have at least ICD-10 code and description
      return this.newDiagnosis.icd10Code.trim() && this.newDiagnosis.description.trim();
    },

    /**
     * Reset the diagnosis form to empty state
     */
    resetDiagnosisForm() {
      this.newDiagnosis = {
        icd10Code: '',
        description: '',
        dateOfDiagnosis: DateUtils.getTodayDateString(),
        status: 'provisional',
        isPrincipal: false,
        severity: null,
        clinicalNotes: '',
        dateResolved: null
      };
      this.editingDiagnosisId = null;
    },

    /**
     * Select a diagnosis for editing in master-detail view
     * @param {Object} diagnosis - The diagnosis object to edit
     */
    selectDiagnosisForEdit(diagnosis) {
      this.selectedDiagnosisId = diagnosis.id;
      this.isAddingNewDiagnosis = false;
      this.editingDiagnosisId = diagnosis.id;

      // Populate form with selected diagnosis data
      this.newDiagnosis = {
        icd10Code: diagnosis.icd10Code || '',
        description: diagnosis.description || '',
        dateOfDiagnosis: diagnosis.dateOfDiagnosis || DateUtils.getTodayDateString(),
        status: diagnosis.status || 'provisional',
        isPrincipal: diagnosis.isPrincipal || false,
        severity: diagnosis.severity || null,
        clinicalNotes: diagnosis.clinicalNotes || '',
        dateResolved: diagnosis.dateResolved || null
      };
    },

    /**
     * Start adding a new diagnosis in master-detail view
     */
    startAddNewDiagnosis() {
      this.selectedDiagnosisId = null;
      this.isAddingNewDiagnosis = true;
      this.editingDiagnosisId = null;
      this.resetDiagnosisForm();
    },

    /**
     * Clear diagnosis selection (return to empty state)
     */
    clearDiagnosisSelection() {
      this.selectedDiagnosisId = null;
      this.isAddingNewDiagnosis = false;
      this.editingDiagnosisId = null;
      this.resetDiagnosisForm();
    },

    /**
     * Start editing a diagnosis
     * @param {string} diagnosisId - ID of diagnosis to edit
     */
    editDiagnosis(diagnosisId) {
      const diagnosis = this.clientDiagnoses.find(d => d.id === diagnosisId);
      if (!diagnosis) return;

      this.editingDiagnosisId = diagnosisId;
      this.newDiagnosis = {
        icd10Code: diagnosis.icd10Code || '',
        description: diagnosis.description || '',
        dateOfDiagnosis: diagnosis.dateOfDiagnosis || DateUtils.getTodayDateString(),
        status: diagnosis.status || 'provisional',
        isPrincipal: diagnosis.isPrincipal || false,
        severity: diagnosis.severity || null,
        clinicalNotes: diagnosis.clinicalNotes || '',
        dateResolved: diagnosis.dateResolved || null
      };

      // Flash and scroll to the edit form
      this.$nextTick(() => {
        const card = this.$refs.diagnosisFormCard;
        if (card) {
          // Scroll card to just below sticky header (approx 70px)
          const headerOffset = 70;
          const cardTop = card.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({
            top: cardTop - headerOffset,
            behavior: 'smooth'
          });

          // Flash the card outline
          card.classList.remove('highlight-flash');
          // Force reflow to restart animation if already applied
          void card.offsetWidth;
          card.classList.add('highlight-flash');

          // Remove class after animation completes
          card.addEventListener('animationend', () => {
            card.classList.remove('highlight-flash');
          }, { once: true });
        }
      });
    },

    /**
     * Cancel editing and reset form
     */
    cancelDiagnosisEdit() {
      this.clearDiagnosisSelection();
    },

    /**
     * Save the diagnosis (create or update)
     */
    async saveDiagnosis() {
      // Validate form before saving
      if (!this.validateDiagnosis()) {
        this.errorMessage = 'Please fix the errors above';
        this.showToast('error');
        return;
      }
      if (!this.selectedClient) return;

      this.savingDiagnosis = true;

      try {
        const diagnosisData = {
          icd10Code: this.newDiagnosis.icd10Code.trim(),
          description: this.newDiagnosis.description.trim(),
          dateOfDiagnosis: this.newDiagnosis.dateOfDiagnosis,
          status: this.newDiagnosis.status,
          isPrincipal: this.newDiagnosis.isPrincipal,
          severity: this.newDiagnosis.severity,
          clinicalNotes: this.newDiagnosis.clinicalNotes.trim(),
          dateResolved: this.newDiagnosis.status === 'resolved' ? this.newDiagnosis.dateResolved : null
        };

        if (this.editingDiagnosisId) {
          // Update existing diagnosis
          await API.updateDiagnosis(this.selectedClient, this.editingDiagnosisId, diagnosisData);
          this.showToast('success', 'Diagnosis updated');
        } else {
          // Create new diagnosis
          await API.createDiagnosis(this.selectedClient, diagnosisData);
          this.showToast('success', 'Diagnosis added');
        }

        // Reload diagnoses and clear selection
        await this.loadClientDiagnoses();
        this.clearDiagnosisSelection();

        // Invalidate client context cache so refresh gets fresh data
        CacheManager.invalidate(CacheManager.getClientContextKey(this.selectedClient));

        // Also refresh client context to update the current diagnosis display
        await this.loadClientContextInternal();

      } catch (error) {
        Logger.error('Failed to save diagnosis:', error);
        this.errorMessage = error.message || 'Failed to save diagnosis';
        this.showToast('error');
      } finally {
        this.savingDiagnosis = false;
      }
    },

    /**
     * Quick resolve a diagnosis (set status to resolved with today's date)
     * @param {string} diagnosisId - ID of diagnosis to resolve
     */
    async resolveDiagnosis(diagnosisId) {
      if (!this.selectedClient) return;

      try {
        await API.updateDiagnosis(this.selectedClient, diagnosisId, {
          status: 'resolved',
          dateResolved: DateUtils.getTodayDateString()
        });

        // Reload diagnoses and clear selection
        await this.loadClientDiagnoses();

        // Invalidate client context cache so refresh gets fresh data
        CacheManager.invalidate(CacheManager.getClientContextKey(this.selectedClient));

        await this.loadClientContextInternal();
        this.clearDiagnosisSelection();
        this.showToast('success', 'Diagnosis resolved');
      } catch (error) {
        Logger.error('Failed to resolve diagnosis:', error);
        this.errorMessage = error.message || 'Failed to resolve diagnosis';
        this.showToast('error');
      }
    },

    // ========================================
    // INTAKE FORM METHODS (Beta)
    // ========================================

    /**
     * Reset intake form to fresh state
     */
    resetIntakeForm() {
      this.currentIntake = {
        date: DateUtils.getTodayDateString(),
        duration: 90,
        delivery: 'In Person',
        demographicInfo: { age: '', occupation: '' },
        presentingProblems: [],
        presentingProblemsOther: '',
        riskAssessment: {
          riskLevel: 'standard',
          suicidalIdeation: false,
          homicidalIdeation: false,
          selfHarm: false,
          notes: ''
        },
        mentalHealthHistory: '',
        medicalHistory: '',
        substanceUse: '',
        socialHistory: '',
        conceptualization: { coherence: '', attachment: '', somatic: '' },
        treatmentRecommendations: ''
      };
      this.existingIntakeId = null;
      this.intakeStatus = 'draft';
      this.intakeActiveSection = 'session-details';
    },

    /**
     * Load existing intake for selected client
     */
    async loadExistingIntake() {
      if (!this.selectedClient) return;

      try {
        const intake = await API.getClientIntake(this.selectedClient);
        if (intake) {
          this.existingIntakeId = intake.id;
          this.intakeStatus = intake.status;
          // Merge content into form, preserving structure
          this.currentIntake = {
            ...this.currentIntake,
            ...intake.content
          };
          Logger.log('Loaded existing intake:', intake.id);
        } else {
          this.resetIntakeForm();
        }
      } catch (error) {
        Logger.error('Failed to load existing intake:', error);
        this.resetIntakeForm();
      }
    },

    /**
     * Toggle a presenting problem selection in intake
     */
    toggleIntakePresentingProblem(issueId) {
      const index = this.currentIntake.presentingProblems.indexOf(issueId);
      if (index === -1) {
        this.currentIntake.presentingProblems.push(issueId);
      } else {
        this.currentIntake.presentingProblems.splice(index, 1);
      }
    },

    /**
     * Check if presenting problem is selected in intake
     */
    isIntakePresentingProblemSelected(issueId) {
      return this.currentIntake.presentingProblems.includes(issueId);
    },

    /**
     * Auto-calculate risk level based on flags
     */
    updateIntakeRiskLevel() {
      if (this.currentIntake.riskAssessment.suicidalIdeation ||
          this.currentIntake.riskAssessment.homicidalIdeation) {
        this.currentIntake.riskAssessment.riskLevel = 'high';
      } else if (this.currentIntake.riskAssessment.selfHarm) {
        this.currentIntake.riskAssessment.riskLevel = 'elevated';
      }
      // Note: Don't auto-downgrade - clinician may have elevated manually
    },

    /**
     * Get CSS class for risk level badge
     */
    get intakeRiskLevelClass() {
      switch (this.currentIntake.riskAssessment.riskLevel) {
        case 'elevated': return 'badge-warning';
        case 'high': return 'badge-danger';
        default: return 'badge-success';
      }
    },

    /**
     * Check if intake has risk factors flagged
     */
    get intakeHasRiskFactors() {
      const ra = this.currentIntake.riskAssessment;
      return ra.suicidalIdeation || ra.homicidalIdeation || ra.selfHarm;
    },

    /**
     * Save intake to API
     */
    async saveIntake(status = 'draft') {
      if (!this.selectedClient) {
        this.errorMessage = 'Please select a client first';
        this.showToast('error');
        return;
      }

      this.savingIntake = true;
      this.errorMessage = '';

      try {
        const content = { ...this.currentIntake };

        if (this.existingIntakeId) {
          await API.updateDocument(
            this.selectedClient,
            this.existingIntakeId,
            { content, status }
          );
          Logger.log('Updated intake:', this.existingIntakeId);
        } else {
          const doc = await API.createDocument(
            this.selectedClient,
            'intake',
            content,
            status
          );
          this.existingIntakeId = doc.id;
          Logger.log('Created intake:', doc.id);
        }

        this.intakeStatus = status;

        // Invalidate client context cache so other views get fresh data
        CacheManager.invalidate(CacheManager.getClientContextKey(this.selectedClient));

        this.showToast('success', status === 'complete' ? 'Intake completed' : 'Draft saved');

      } catch (error) {
        Logger.error('Failed to save intake:', error);
        this.errorMessage = 'Failed to save intake';
        this.showToast('error');
      } finally {
        this.savingIntake = false;
      }
    },

    /**
     * Submit intake as complete
     */
    async submitIntake() {
      await this.saveIntake('complete');
    },

    // ========================================
    // TREATMENT PLAN FORM METHODS (Beta)
    // ========================================

    /**
     * Reset treatment plan form to fresh state
     */
    resetTreatmentPlanForm() {
      const reviewDate = new Date();
      reviewDate.setMonth(reviewDate.getMonth() + 3);

      this.currentTreatmentPlan = {
        dateCreated: DateUtils.getTodayDateString(),
        reviewDate: reviewDate.toISOString().split('T')[0],
        presentingProblems: this.linkedIntakeForPlan?.content?.presentingProblems || [],
        presentingProblemsSource: this.linkedIntakeForPlan ? 'intake' : 'manual',
        linkedIntakeId: this.linkedIntakeForPlan?.id || null,
        goals: [{ id: 'goal-1', text: '', targetDate: '', interventions: [] }],
        reviewedWithClient: false,
        clientAgrees: false,
        notes: ''
      };
      this.existingTreatmentPlanId = null;
      this.treatmentPlanStatus = 'draft';
      this.activeGoalIndex = 0;
    },

    /**
     * Load intake data for treatment plan (pre-populates presenting problems)
     */
    async loadIntakeForTreatmentPlan() {
      if (!this.selectedClient) return;

      try {
        const intake = await API.getClientIntake(this.selectedClient);
        if (intake) {
          this.linkedIntakeForPlan = intake;
          this.linkedIntakeDateForPlan = intake.content?.date || intake.createdAt?.split('T')[0];

          // Pre-populate presenting problems if no existing plan
          if (!this.existingTreatmentPlanId && intake.content?.presentingProblems?.length > 0) {
            this.currentTreatmentPlan.presentingProblems = [...intake.content.presentingProblems];
            this.currentTreatmentPlan.presentingProblemsSource = 'intake';
            this.currentTreatmentPlan.linkedIntakeId = intake.id;
          }

          Logger.log('Loaded intake for treatment plan:', intake.id);
        } else {
          this.linkedIntakeForPlan = null;
          this.linkedIntakeDateForPlan = null;
        }
      } catch (error) {
        Logger.error('Failed to load intake for treatment plan:', error);
      }
    },

    /**
     * Load existing treatment plan for selected client
     */
    async loadExistingTreatmentPlan() {
      if (!this.selectedClient) return;

      try {
        const plan = await API.getActiveTreatmentPlan(this.selectedClient);
        if (plan) {
          this.existingTreatmentPlanId = plan.id;
          this.treatmentPlanStatus = plan.status;

          // Load content into form
          this.currentTreatmentPlan = {
            dateCreated: plan.dateCreated || plan.date || this.currentTreatmentPlan.dateCreated,
            reviewDate: plan.reviewDate || this.currentTreatmentPlan.reviewDate,
            presentingProblems: plan.presentingProblems || [],
            presentingProblemsSource: plan.presentingProblemsSource || 'manual',
            linkedIntakeId: plan.linkedIntakeId || null,
            goals: plan.goals || [{ id: 'goal-1', text: '', targetDate: '', interventions: [] }],
            reviewedWithClient: plan.reviewedWithClient || false,
            clientAgrees: plan.clientAgrees || false,
            notes: plan.notes || ''
          };

          Logger.log('Loaded existing treatment plan:', plan.id);
        } else {
          this.resetTreatmentPlanForm();
        }
      } catch (error) {
        Logger.error('Failed to load treatment plan:', error);
        this.resetTreatmentPlanForm();
      }
    },

    /**
     * Get current active goal
     */
    get currentGoal() {
      return this.currentTreatmentPlan.goals[this.activeGoalIndex];
    },

    /**
     * Check if can add more goals (max 4)
     */
    get canAddGoal() {
      return this.currentTreatmentPlan.goals.length < 4;
    },

    /**
     * Select a goal tab
     */
    selectGoal(index) {
      this.activeGoalIndex = index;
    },

    /**
     * Add a new goal
     */
    addGoal() {
      if (!this.canAddGoal) return;

      const newGoal = {
        id: `goal-${Date.now()}`,
        text: '',
        targetDate: '',
        interventions: []
      };

      this.currentTreatmentPlan.goals.push(newGoal);
      this.activeGoalIndex = this.currentTreatmentPlan.goals.length - 1;
    },

    /**
     * Remove a goal
     */
    removeGoal(index) {
      if (this.currentTreatmentPlan.goals.length <= 1) return;

      this.currentTreatmentPlan.goals.splice(index, 1);
      if (this.activeGoalIndex >= this.currentTreatmentPlan.goals.length) {
        this.activeGoalIndex = this.currentTreatmentPlan.goals.length - 1;
      }
    },

    /**
     * Toggle a presenting problem in treatment plan
     */
    toggleTreatmentPlanPresentingProblem(issueId) {
      const index = this.currentTreatmentPlan.presentingProblems.indexOf(issueId);
      if (index === -1) {
        this.currentTreatmentPlan.presentingProblems.push(issueId);
      } else {
        this.currentTreatmentPlan.presentingProblems.splice(index, 1);
      }
      // Mark as manual if editing after intake load
      if (this.currentTreatmentPlan.presentingProblemsSource === 'intake') {
        this.currentTreatmentPlan.presentingProblemsSource = 'manual';
      }
    },

    /**
     * Check if presenting problem is selected in treatment plan
     */
    isTreatmentPlanPresentingProblemSelected(issueId) {
      return this.currentTreatmentPlan.presentingProblems.includes(issueId);
    },

    /**
     * Add intervention from library to current goal
     */
    addInterventionToCurrentGoal(intervention) {
      const goal = this.currentGoal;
      if (!goal) return;

      // Check if already added
      if (goal.interventions.some(i => i.id === intervention.id)) {
        return;
      }

      goal.interventions.push({
        id: intervention.id,
        name: intervention.name,
        approach: intervention.approach,
        fromLibrary: true
      });
    },

    /**
     * Add custom intervention to current goal
     */
    addCustomInterventionToGoal() {
      if (!this.customIntervention.name.trim()) return;

      const goal = this.currentGoal;
      if (!goal) return;

      goal.interventions.push({
        id: `custom-${Date.now()}`,
        name: this.customIntervention.name.trim(),
        approach: this.customIntervention.approach || 'Custom',
        fromLibrary: false
      });

      // Clear input
      this.customIntervention = { name: '', approach: '' };
    },

    /**
     * Remove intervention from a goal
     */
    removeInterventionFromGoal(goalIndex, interventionIndex) {
      this.currentTreatmentPlan.goals[goalIndex].interventions.splice(interventionIndex, 1);
    },

    /**
     * Check if intervention can be added to current goal
     */
    canAddInterventionToGoal(interventionId) {
      const goal = this.currentGoal;
      if (!goal) return false;
      return !goal.interventions.some(i => i.id === interventionId);
    },

    /**
     * Toggle reference drawer
     */
    toggleReferenceDrawer() {
      this.showReferenceDrawer = !this.showReferenceDrawer;
    },

    /**
     * Close reference drawer
     */
    closeReferenceDrawer() {
      this.showReferenceDrawer = false;
    },

    /**
     * Set reference filter
     */
    setReferenceFilter(filter) {
      this.referenceFilter = filter;
    },

    /**
     * Get filtered interventions for reference drawer
     */
    get filteredReferenceInterventions() {
      if (this.referenceFilter === 'all') {
        return this.allInterventions;
      }
      return this.allInterventions.filter(i => i.approach === this.referenceFilter);
    },

    /**
     * Save treatment plan to API
     */
    async saveTreatmentPlan(status = 'draft') {
      if (!this.selectedClient) {
        this.errorMessage = 'Please select a client first';
        this.showToast('error');
        return;
      }

      this.savingTreatmentPlan = true;
      this.errorMessage = '';

      try {
        const content = { ...this.currentTreatmentPlan };

        if (this.existingTreatmentPlanId) {
          await API.updateDocument(
            this.selectedClient,
            this.existingTreatmentPlanId,
            { content, status }
          );
          Logger.log('Updated treatment plan:', this.existingTreatmentPlanId);
        } else {
          const doc = await API.createDocument(
            this.selectedClient,
            'treatment_plan',
            content,
            status
          );
          this.existingTreatmentPlanId = doc.id;
          Logger.log('Created treatment plan:', doc.id);
        }

        this.treatmentPlanStatus = status;
        this.showToast('success', status === 'active' ? 'Treatment plan activated' : 'Draft saved');

        // Invalidate client context cache so refresh gets fresh data
        CacheManager.invalidate(CacheManager.getClientContextKey(this.selectedClient));

        // Refresh client context to update treatment plan info
        await this.loadClientContextInternal();

      } catch (error) {
        Logger.error('Failed to save treatment plan:', error);
        this.errorMessage = 'Failed to save treatment plan';
        this.showToast('error');
      } finally {
        this.savingTreatmentPlan = false;
      }
    },

    /**
     * Activate treatment plan (mark as active)
     */
    async activateTreatmentPlan() {
      await this.saveTreatmentPlan('active');
    },

    // ========================================
    // INTERVENTION SELECTOR METHODS
    // ========================================

    /**
     * Get the full intervention library (static + user custom)
     */
    getInterventionLibrary() {
      // Combine static library with user's custom interventions
      const library = [...InterventionLibrary];

      // Add custom interventions from user preferences
      if (this.interventionPreferences.customInterventions) {
        library.push(...this.interventionPreferences.customInterventions);
      }

      // Filter out hidden interventions
      const hidden = new Set(this.interventionPreferences.hidden || []);
      return library.filter(i => !hidden.has(i.id));
    },

    /**
     * Search interventions with theme-prioritized results
     */
    searchInterventions() {
      const query = this.interventionSelector.searchQuery.toLowerCase().trim();
      if (!query) {
        this.interventionSelector.searchResults = [];
        return;
      }

      const library = this.getInterventionLibrary();

      this.interventionSelector.searchResults = library
        .filter(intervention => {
          const labelMatch = intervention.label.toLowerCase().includes(query);
          const themeMatch = intervention.theme.toLowerCase().includes(query);
          return labelMatch || themeMatch;
        })
        .sort((a, b) => {
          // Prioritize theme matches (developer's insight!)
          const aThemeMatch = a.theme.toLowerCase().includes(query);
          const bThemeMatch = b.theme.toLowerCase().includes(query);

          if (aThemeMatch && !bThemeMatch) return -1;
          if (!aThemeMatch && bThemeMatch) return 1;

          // Secondary: prioritize matches at start of label
          const aStartMatch = a.label.toLowerCase().startsWith(query);
          const bStartMatch = b.label.toLowerCase().startsWith(query);

          if (aStartMatch && !bStartMatch) return -1;
          if (!aStartMatch && bStartMatch) return 1;

          // Tertiary: alphabetical
          return a.label.localeCompare(b.label);
        });
    },

    /**
     * Get filtered search results (applies approach filter)
     */
    getFilteredSearchResults() {
      let results = this.interventionSelector.searchResults;
      if (this.interventionSelector.activeFilter !== 'all') {
        results = results.filter(i =>
          i.approaches.includes(this.interventionSelector.activeFilter)
        );
      }
      return results.slice(0, 20); // Limit for performance
    },

    /**
     * Get filtered browse results (all interventions with approach filter)
     */
    getFilteredBrowseResults() {
      let results = this.getInterventionLibrary();
      if (this.interventionSelector.activeFilter !== 'all') {
        results = results.filter(i =>
          i.approaches.includes(this.interventionSelector.activeFilter)
        );
      }
      return results.sort((a, b) => a.label.localeCompare(b.label));
    },

    /**
     * Get sorted browse results - by usage (descending) or alphabetical
     */
    getSortedBrowseResults() {
      const results = this.getFilteredBrowseResults();

      // If sort by usage is off, return alphabetical (existing behavior)
      if (!this.sortByUsage) {
        return results;
      }

      // Sort by usage count (descending), then alphabetically for ties
      return [...results].sort((a, b) => {
        const countA = this.getUsageCount(a.id);
        const countB = this.getUsageCount(b.id);
        if (countB !== countA) {
          return countB - countA;
        }
        return a.label.localeCompare(b.label);
      });
    },

    /**
     * Get favorite interventions for quick-add
     */
    getFavoriteInterventions() {
      const favoriteIds = this.interventionPreferences.favorites || [];

      // If user has set favorites, use those
      if (favoriteIds.length > 0) {
        const library = this.getInterventionLibrary();
        return favoriteIds
          .map(id => library.find(i => i.id === id))
          .filter(Boolean);
      }

      // Default favorites if none set
      const defaultFavorites = [
        "rapport",
        "present-moment",
        "psychoeducation",
        "validation",
        "normalization",
        "breathing",
        "strengths"
      ];

      return defaultFavorites
        .map(id => InterventionLibrary.find(i => i.id === id))
        .filter(Boolean);
    },

    /**
     * Get interventions for quick-add section: favorites + frequently used non-favorites
     * Favorites come first (optionally sorted by usage and/or limited), then top N frequent non-favorites (by usage)
     *
     * In per-client mode with fillWithGlobal enabled:
     * - Client-specific frequent interventions are shown first (with _frequencySource: 'client')
     * - If fewer than maxFrequent, remaining slots are filled with global frequent (with _frequencySource: 'global')
     */
    getQuickAddInterventions() {
      const favorites = this.getFavoriteInterventions();
      const favoriteIds = new Set(favorites.map(f => f.id));
      const maxFrequent = this.interventionPreferences.maxFrequentInterventions || 10;

      // Read favorites display settings
      const limitFavorites = this.interventionPreferences.limitFavoritesInQuickAdd;
      const maxFavorites = this.interventionPreferences.maxFavoritesInQuickAdd || 10;
      const sortByUsage = this.interventionPreferences.sortFavoritesByUsage !== false; // default true

      // Process favorites based on settings
      let processedFavorites = favorites.map(f => ({ ...f, _usageCount: this.getUsageCount(f.id) }));

      if (sortByUsage) {
        // Sort by usage count (descending)
        processedFavorites.sort((a, b) => b._usageCount - a._usageCount);
      }
      // else: preserve array order (order user added them as favorites)

      // Apply limit if enabled
      if (limitFavorites) {
        processedFavorites = processedFavorites.slice(0, maxFavorites);
      }

      // Get frequently used non-favorites
      const library = this.getInterventionLibrary();
      const usageMode = this.interventionPreferences.usageMode || 'global';
      const fillWithGlobal = this.interventionPreferences.fillWithGlobal !== false; // default true

      let frequentNonFavorites = [];

      if (usageMode === 'per-client') {
        // Per-client mode: get client-specific frequent interventions
        const clientFrequent = library
          .filter(i => !favoriteIds.has(i.id) && this.getUsageCount(i.id) > 0)
          .map(i => ({ ...i, _usageCount: this.getUsageCount(i.id), _frequencySource: 'client' }))
          .sort((a, b) => b._usageCount - a._usageCount)
          .slice(0, maxFrequent);

        frequentNonFavorites = clientFrequent;

        // Fill with global frequent interventions if enabled and we haven't reached max
        if (fillWithGlobal && clientFrequent.length < maxFrequent) {
          const clientFrequentIds = new Set(clientFrequent.map(i => i.id));
          const remainingSlots = maxFrequent - clientFrequent.length;

          const globalFill = library
            .filter(i =>
              !favoriteIds.has(i.id) &&
              !clientFrequentIds.has(i.id) &&
              this.getGlobalUsageCount(i.id) > 0
            )
            .map(i => ({ ...i, _usageCount: this.getGlobalUsageCount(i.id), _frequencySource: 'global' }))
            .sort((a, b) => b._usageCount - a._usageCount)
            .slice(0, remainingSlots);

          frequentNonFavorites = [...clientFrequent, ...globalFill];
        }
      } else {
        // Global mode: all frequent interventions are global
        frequentNonFavorites = library
          .filter(i => !favoriteIds.has(i.id) && this.getUsageCount(i.id) > 0)
          .map(i => ({ ...i, _usageCount: this.getUsageCount(i.id), _frequencySource: 'global' }))
          .sort((a, b) => b._usageCount - a._usageCount)
          .slice(0, maxFrequent);
      }

      return [...processedFavorites, ...frequentNonFavorites];
    },

    /**
     * Add an intervention from the library to the note
     */
    addIntervention(intervention) {
      if (this.isInterventionSelected(intervention)) return;

      this.currentNote.interventions.push({
        label: intervention.label,
        theme: intervention.theme,
        description: '',
        notes: '',
        showNotes: false
      });

      // Clear search after adding
      this.interventionSelector.searchQuery = '';
      this.interventionSelector.searchResults = [];
    },

    /**
     * Remove an intervention by index
     */
    removeIntervention(index) {
      const intervention = this.currentNote.interventions[index];
      if (!intervention) return;

      // Close expanded chip if removing it
      if (this.interventionSelector.expandedChip === index) {
        this.interventionSelector.expandedChip = null;
      } else if (this.interventionSelector.expandedChip > index) {
        this.interventionSelector.expandedChip--;
      }

      // Remove the intervention
      this.currentNote.interventions.splice(index, 1);

      // Show undo toast
      this.showUndoToast('Intervention deleted', () => {
        // Restore at original position
        this.currentNote.interventions.splice(index, 0, intervention);
      });
    },

    /**
     * Check if an intervention is already selected
     */
    isInterventionSelected(intervention) {
      return this.currentNote.interventions.some(i => i.label === intervention.label);
    },

    /**
     * Toggle expansion of an intervention chip
     */
    toggleInterventionChipExpand(index) {
      if (this.interventionSelector.expandedChip === index) {
        this.interventionSelector.expandedChip = null;
      } else {
        this.interventionSelector.expandedChip = index;
      }
    },

    /**
     * Highlight search match in intervention label
     */
    highlightInterventionMatch(label, query) {
      if (!query) return label;

      const lowerLabel = label.toLowerCase();
      const lowerQuery = query.toLowerCase();
      const index = lowerLabel.indexOf(lowerQuery);

      if (index === -1) return label;

      const before = label.substring(0, index);
      const match = label.substring(index, index + query.length);
      const after = label.substring(index + query.length);

      return `${before}<mark>${match}</mark>${after}`;
    },

    /**
     * Start writing a custom intervention (show inline input)
     */
    startCustomIntervention() {
      this.interventionSelector.isWritingCustom = true;
      this.interventionSelector.customInterventionLabel = '';
      // Focus input after Alpine renders it
      this.$nextTick(() => {
        const input = this.$refs.customInterventionInput;
        if (input) input.focus();
      });
    },

    /**
     * Add the custom intervention to the note
     */
    addCustomIntervention() {
      const label = this.interventionSelector.customInterventionLabel.trim();
      if (!label) return;

      // Check for duplicate (case-insensitive)
      const isDuplicate = this.currentNote.interventions.some(
        i => i.label.toLowerCase() === label.toLowerCase()
      );
      if (isDuplicate) {
        return;
      }

      // Add to interventions with isCustom flag
      this.currentNote.interventions.push({
        label: label,
        theme: 'custom',
        description: '',
        notes: '',
        showNotes: false,
        isCustom: true
      });

      // Clear input and re-focus for rapid-add
      this.interventionSelector.customInterventionLabel = '';
      this.$nextTick(() => {
        const input = this.$refs.customInterventionInput;
        if (input) input.focus();
      });
    },

    /**
     * Cancel custom intervention writing mode
     */
    cancelCustomIntervention() {
      this.interventionSelector.isWritingCustom = false;
      this.interventionSelector.customInterventionLabel = '';
    },

    /**
     * Reset intervention selector to initial state
     */
    resetInterventionSelector() {
      this.interventionSelector = {
        searchQuery: '',
        searchResults: [],
        showBrowse: false,
        activeFilter: 'all',
        expandedChip: null,
        isWritingCustom: false,
        customInterventionLabel: ''
      };
    },

    /**
     * Load intervention preferences from Settings API
     */
    async loadInterventionPreferences() {
      try {
        const prefs = await API.getSettings('interventions');
        if (prefs) {
          this.interventionPreferences = {
            favorites: prefs.favorites || [],
            hidden: prefs.hidden || [],
            customInterventions: prefs.customInterventions || [],
            hiddenApproaches: prefs.hiddenApproaches || [],
            customApproaches: prefs.customApproaches || [],
            // Usage tracking settings (with defaults)
            usageMode: prefs.usageMode || 'global',
            fillWithGlobal: prefs.fillWithGlobal ?? true,
            maxFrequentInterventions: prefs.maxFrequentInterventions ?? 10
          };
          console.log('Loaded intervention preferences');
        }
      } catch (error) {
        console.warn('Failed to load intervention preferences:', error);
        // Keep defaults
      }
    },

    /**
     * Load intervention usage data based on current settings
     */
    async loadInterventionUsage() {
      try {
        // Determine scope based on settings
        const usageMode = this.interventionPreferences.usageMode || 'global';
        const clientId = usageMode === 'per-client' ? this.selectedClient : null;

        this.interventionUsage = await API.getInterventionUsage(clientId);
        console.log('Loaded intervention usage:', Object.keys(this.interventionUsage).length, 'interventions');

        // In per-client mode, also load global usage for the "fill with global" feature
        if (usageMode === 'per-client') {
          this.globalInterventionUsage = await API.getInterventionUsage(null);
          console.log('Loaded global intervention usage:', Object.keys(this.globalInterventionUsage).length, 'interventions');
        } else {
          // In global mode, global usage IS the primary usage
          this.globalInterventionUsage = this.interventionUsage;
        }
      } catch (error) {
        console.warn('Failed to load intervention usage:', error);
        this.interventionUsage = {};
        this.globalInterventionUsage = {};
      }
    },

    /**
     * Check if we have any usage data
     */
    get hasUsageData() {
      return Object.keys(this.interventionUsage).length > 0;
    },

    /**
     * Get usage count for a specific intervention (current mode - client or global)
     */
    getUsageCount(interventionId) {
      return this.interventionUsage[interventionId] || 0;
    },

    /**
     * Get global usage count for a specific intervention (always global)
     */
    getGlobalUsageCount(interventionId) {
      return this.globalInterventionUsage[interventionId] || 0;
    },

    /**
     * Record intervention usage when saving a note (fire-and-forget)
     */
    recordInterventionUsageForNote() {
      const interventions = this.currentNote.interventions || [];
      if (interventions.length === 0 || !this.selectedClient) {
        return;
      }

      // Get intervention IDs - for library interventions, find by label
      const interventionIds = interventions
        .map(i => {
          if (i.id) return i.id;
          // Find ID by label in the library
          const library = this.getInterventionLibrary();
          const found = library.find(lib => lib.label === i.label);
          return found ? found.id : null;
        })
        .filter(Boolean);

      if (interventionIds.length === 0) {
        return;
      }

      // Fire and forget - don't await, don't fail note save
      API.recordInterventionUsage(interventionIds, this.selectedClient)
        .catch(err => console.warn('Usage tracking failed:', err));
    },

    /**
     * Load document type visibility settings from Settings API
     */
    async loadDocumentTypeVisibility() {
      try {
        const settings = await API.getSettings('documentTypeVisibility');
        if (settings) {
          // Migrate from old settings format if needed
          let showBeta = settings.showBeta;
          let showUndeveloped = settings.showUndeveloped;

          // Migrate clinicalFormsEnabled -> showBeta
          if (showBeta === undefined && settings.clinicalFormsEnabled !== undefined) {
            showBeta = settings.clinicalFormsEnabled;
          }
          // Migrate hideNotImplemented -> showUndeveloped (inverted)
          if (showUndeveloped === undefined && settings.hideNotImplemented !== undefined) {
            showUndeveloped = !settings.hideNotImplemented;
          }

          this.documentTypeVisibility = {
            showBeta: showBeta ?? false,
            showUndeveloped: showUndeveloped ?? false,
            intakeEnabled: settings.intakeEnabled ?? true,
            diagnosisEnabled: settings.diagnosisEnabled ?? true,
            treatmentPlanEnabled: settings.treatmentPlanEnabled ?? true,
            consultationEnabled: settings.consultationEnabled ?? true,
            dischargeEnabled: settings.dischargeEnabled ?? true
          };
          Logger.log('Loaded document type visibility settings');
        }
      } catch (error) {
        Logger.warn('Failed to load document type visibility settings:', error);
        // Keep defaults (categories hidden, individual types enabled)
      }
    },

    /**
     * Load edit mode settings from Settings API
     */
    async loadEditModeSettings() {
      try {
        const settings = await API.getSettings('editMode');
        if (settings && settings.progressNoteEditMode) {
          this.progressNoteEditMode = settings.progressNoteEditMode;
          Logger.log('Loaded edit mode settings:', this.progressNoteEditMode);
        }
      } catch (error) {
        Logger.warn('Failed to load edit mode settings:', error);
        // Keep default (direct-edit)
      }
    },

    /**
     * Save intervention preferences to Settings API
     */
    async saveInterventionPreferences() {
      try {
        await API.saveSettings('interventions', this.interventionPreferences);
        console.log('Saved intervention preferences');
      } catch (error) {
        console.error('Failed to save intervention preferences:', error);
        this.errorMessage = 'Failed to save intervention preferences';
        this.showToast('error');
      }
    },

    // ========================================
    // UTILITY METHODS
    // ========================================

    /**
     * Format a date string for display.
     * Uses DateUtils to handle date-only vs timestamp formats correctly.
     */
    formatDate(dateString) {
      return DateUtils.formatAuto(dateString);
    },

    /**
     * Format an ISO datetime string to local time display format.
     * Converts UTC to local timezone and displays in 12-hour format.
     * @param {string} isoDatetime - ISO 8601 datetime (e.g., "2025-12-24T19:00:00Z")
     * @returns {string} Formatted local time (e.g., "2:00 PM")
     */
    formatTime(isoDatetime) {
      if (!isoDatetime) return '';
      try {
        const date = new Date(isoDatetime);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        });
      } catch (error) {
        Logger.warn('formatTime: Failed to parse datetime', isoDatetime, error);
        return '';
      }
    },

    /**
     * Toggle checkbox value in array
     */
    toggleCheckbox(array, value) {
      const index = array.indexOf(value);
      if (index === -1) {
        array.push(value);
      } else {
        array.splice(index, 1);
      }
    },

    /**
     * Toggle risk checkbox with mutual exclusivity for "none"
     * Selecting "none" clears all other risks; selecting any risk clears "none"
     */
    toggleRiskCheckbox(mse, value) {
      if (value === 'none') {
        // Selecting "none" clears everything and sets only "none"
        if (mse.risk.includes('none')) {
          mse.risk = [];
        } else {
          mse.risk = ['none'];
          mse.riskDetails = '';
        }
      } else {
        // Selecting any other risk clears "none" first
        const noneIndex = mse.risk.indexOf('none');
        if (noneIndex > -1) {
          mse.risk.splice(noneIndex, 1);
        }
        // Then toggle the selected value
        this.toggleCheckbox(mse.risk, value);
      }
    },

    /**
     * Get all therapeutic approaches (built-in + custom, excluding hidden)
     * Used for filter tabs and approach selectors
     *
     * Note: "general" is excluded because it's not a therapeutic approach/modality —
     * it represents foundational interventions that transcend modalities.
     * The "General" tag still displays on interventions via getApproachName().
     */
    getAllTherapeuticApproaches() {
      // Start with built-in approaches, excluding "general"
      // (General is not a therapeutic modality, it's a category for universal interventions)
      const approaches = TherapeuticApproaches.filter(a => a.value !== 'general');

      // Add custom approaches
      const customApproaches = this.interventionPreferences.customApproaches || [];
      approaches.push(...customApproaches);

      // Filter out hidden approaches
      const hiddenSet = new Set(this.interventionPreferences.hiddenApproaches || []);
      return approaches.filter(a => !hiddenSet.has(a.value));
    },

    /**
     * Get visible approaches for an intervention (excludes hidden approaches)
     * Used when displaying approach tags on interventions
     */
    getVisibleApproachesForIntervention(approaches) {
      if (!approaches) return [];
      const hiddenSet = new Set(this.interventionPreferences.hiddenApproaches || []);
      return approaches.filter(a => !hiddenSet.has(a));
    },

    /**
     * Get display name for an approach value
     */
    getApproachName(value) {
      // Check custom approaches first (allows user-defined display names)
      const custom = (this.interventionPreferences.customApproaches || [])
        .find(a => a.value === value);
      if (custom) return custom.name;

      // Fall back to built-in approaches
      const builtin = TherapeuticApproaches.find(a => a.value === value);
      return builtin ? builtin.name : value;
    },

    /**
     * Get approaches from all added interventions
     * Returns a Set of approach values that are associated with current interventions
     */
    getRecommendedApproaches() {
      const recommended = new Set();
      const library = this.getInterventionLibrary();

      for (const intervention of this.currentNote.interventions) {
        // Look up intervention in library to get its approaches
        const libraryIntervention = library.find(i => i.label === intervention.label);
        if (libraryIntervention && libraryIntervention.approaches) {
          for (const approach of libraryIntervention.approaches) {
            recommended.add(approach);
          }
        }
      }
      return recommended;
    },

    /**
     * Check if an approach is recommended based on current interventions
     */
    isApproachRecommended(value) {
      return this.getRecommendedApproaches().has(value);
    },

    /**
     * Get therapeutic approaches ordered with recommended ones first
     */
    getOrderedApproaches() {
      const recommended = this.getRecommendedApproaches();
      // Sort: recommended first, then alphabetically by name
      return [...this.getAllTherapeuticApproaches()].sort((a, b) => {
        const aRec = recommended.has(a.value);
        const bRec = recommended.has(b.value);
        if (aRec && !bRec) return -1;
        if (!aRec && bRec) return 1;
        return a.name.localeCompare(b.name);
      });
    },

    /**
     * Show toast notification
     */
    showToast(type, message) {
      if (type === 'success') {
        this.showSuccessToast = true;
        setTimeout(() => this.showSuccessToast = false, 3000);
      } else if (type === 'error') {
        if (message) {
          this.errorMessage = message;
        }
        this.showErrorToast = true;
        setTimeout(() => this.showErrorToast = false, 5000);
      }
    },

    /**
     * Show an undo toast with a callback to restore the deleted item
     * @param {string} message - Message to display
     * @param {function} undoCallback - Function to call if user clicks Undo
     */
    showUndoToast(message, undoCallback) {
      // Clear any existing timer
      if (this.undoToastTimer) {
        clearTimeout(this.undoToastTimer);
      }

      this.undoToast = {
        visible: true,
        message: message,
        callback: undoCallback
      };

      // Auto-hide after 5 seconds
      this.undoToastTimer = setTimeout(() => {
        if (this.undoToast.visible) {
          this.undoToast = { visible: false, message: '', callback: null };
        }
      }, 5000);
    },

    /**
     * Handle undo action from undo toast
     */
    handleUndo() {
      if (this.undoToast.callback) {
        this.undoToast.callback();
      }

      // Clear timer and hide toast
      if (this.undoToastTimer) {
        clearTimeout(this.undoToastTimer);
      }
      this.undoToast = { visible: false, message: '', callback: null };
    },

    /**
     * Dismiss undo toast without undoing
     */
    dismissUndoToast() {
      if (this.undoToastTimer) {
        clearTimeout(this.undoToastTimer);
      }
      this.undoToast = { visible: false, message: '', callback: null };
    }
  };
}
