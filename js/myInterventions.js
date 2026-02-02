/**
 * My Interventions Page
 *
 * Alpine.js component for managing personal intervention library.
 * Allows users to:
 * - Mark favorites for quick access in session notes
 * - Hide interventions they don't use
 * - Add custom interventions
 */

import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { NavDrawer } from './components/drawer.js';
import { InterventionLibrary } from './interventionLibrary.js';
import { TherapeuticApproaches } from './constants.js';
import { CacheManager } from './cacheManager.js';

export function createMyInterventionsData() {
    return {
        // ========================================
        // STATE
        // ========================================

        // Shared drawer state
        ...NavDrawer.alpineData,

        // User info (for drawer)
        userEmail: '',
        userName: '',
        userRole: '',
        userLicense: '',

        loading: true,
        saveStatus: null, // 'saving' | 'saved' | null

        // Therapeutic approaches for filters
        therapeuticApproaches: TherapeuticApproaches,

        // User preferences (loaded from API)
        preferences: {
            favorites: [],
            hidden: [],
            customInterventions: [],
            hiddenApproaches: [],
            customApproaches: []
        },

        // UI state
        searchQuery: '',
        filterApproach: 'all',
        sections: {
            favorites: true,
            all: true,
            hidden: false,
            approaches: false
        },

        // Add custom intervention form
        showAddForm: false,
        newIntervention: {
            label: '',
            theme: '',
            approaches: []
        },

        // Add custom approach form
        showAddApproachForm: false,
        newApproach: {
            value: '',
            name: ''
        },

        // Edit approach state
        editingApproach: null,
        editApproachForm: {
            value: '',
            name: ''
        },

        // Hide approach modal state
        showHideApproachModal: false,
        pendingHideApproach: null,
        hideApproachAlsoHideInterventions: false,
        affectedInterventionsForHide: [],

        // Delete approach modal state
        showDeleteApproachModal: false,
        pendingDeleteApproach: null,
        affectedInterventionsForDelete: [],

        // ========================================
        // INITIALIZATION
        // ========================================

        async init() {
            console.log('My Interventions page initialized');

            // Auth check - redirect to login if not authenticated
            if (!AuthGuard.checkAuth()) return;

            // Load user info for drawer
            const userInfo = AuthGuard.loadUserInfo();
            if (userInfo) {
                this.userEmail = userInfo.email;
                this.userName = userInfo.name;
                this.userRole = userInfo.role;
                this.userLicense = userInfo.license || '';
            }

            // Load intervention preferences
            await this.loadPreferences();

            this.loading = false;
        },

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

        async loadPreferences() {
            try {
                const prefs = await API.getSettings('interventions');
                if (prefs) {
                    this.preferences = {
                        favorites: prefs.favorites || [],
                        hidden: prefs.hidden || [],
                        customInterventions: prefs.customInterventions || [],
                        hiddenApproaches: prefs.hiddenApproaches || [],
                        customApproaches: prefs.customApproaches || []
                    };
                }
                console.log('Loaded intervention preferences');
            } catch (error) {
                console.warn('Failed to load intervention preferences:', error);
            }
        },

        async savePreferences() {
            this.saveStatus = 'saving';

            try {
                await API.saveSettings('interventions', this.preferences);

                // Invalidate cache so other pages get fresh data
                CacheManager.invalidate(CacheManager.getSettingsKey('interventions'));

                this.saveStatus = 'saved';
                setTimeout(() => {
                    this.saveStatus = null;
                }, 2000);
            } catch (error) {
                console.error('Failed to save intervention preferences:', error);
                this.saveStatus = null;
                alert('Failed to save changes. Please try again.');
            }
        },

        // ========================================
        // COMPUTED LISTS
        // ========================================

        /**
         * Get all interventions (static library + custom)
         */
        getAllInterventions() {
            const all = [...InterventionLibrary];

            // Add custom interventions
            if (this.preferences.customInterventions) {
                all.push(...this.preferences.customInterventions);
            }

            return all;
        },

        /**
         * Get visible interventions (not hidden)
         */
        getVisibleInterventions() {
            const hidden = new Set(this.preferences.hidden);
            return this.getAllInterventions().filter(i => !hidden.has(i.id));
        },

        /**
         * Get filtered interventions (search + approach filter, excludes hidden)
         */
        getFilteredInterventions() {
            let results = this.getVisibleInterventions();

            // Apply search filter
            if (this.searchQuery.trim()) {
                const query = this.searchQuery.toLowerCase();
                results = results.filter(i =>
                    i.label.toLowerCase().includes(query) ||
                    i.theme.toLowerCase().includes(query)
                );
            }

            // Apply approach filter
            if (this.filterApproach !== 'all') {
                results = results.filter(i =>
                    i.approaches.includes(this.filterApproach)
                );
            }

            return results.sort((a, b) => a.label.localeCompare(b.label));
        },

        /**
         * Get favorite interventions
         */
        getFavoriteInterventions() {
            const all = this.getAllInterventions();
            return this.preferences.favorites
                .map(id => all.find(i => i.id === id))
                .filter(Boolean);
        },

        /**
         * Get hidden interventions
         */
        getHiddenInterventions() {
            const all = this.getAllInterventions();
            return this.preferences.hidden
                .map(id => all.find(i => i.id === id))
                .filter(Boolean);
        },

        // ========================================
        // HELPER METHODS
        // ========================================

        isFavorite(id) {
            return this.preferences.favorites.includes(id);
        },

        isHidden(id) {
            return this.preferences.hidden.includes(id);
        },

        isCustom(id) {
            return this.preferences.customInterventions.some(i => i.id === id);
        },

        getApproachName(value) {
            const approach = this.therapeuticApproaches.find(a => a.value === value);
            return approach ? approach.name : value;
        },

        // ========================================
        // ACTIONS
        // ========================================

        toggleFavorite(id) {
            const index = this.preferences.favorites.indexOf(id);
            if (index === -1) {
                this.preferences.favorites.push(id);
            } else {
                this.preferences.favorites.splice(index, 1);
            }
            this.savePreferences();
        },

        toggleHidden(id) {
            const index = this.preferences.hidden.indexOf(id);
            if (index === -1) {
                this.preferences.hidden.push(id);
                // Also remove from favorites if hidden
                const favIndex = this.preferences.favorites.indexOf(id);
                if (favIndex !== -1) {
                    this.preferences.favorites.splice(favIndex, 1);
                }
            } else {
                this.preferences.hidden.splice(index, 1);
            }
            this.savePreferences();
        },

        // ========================================
        // CUSTOM INTERVENTIONS
        // ========================================

        toggleApproach(value) {
            const index = this.newIntervention.approaches.indexOf(value);
            if (index === -1) {
                this.newIntervention.approaches.push(value);
            } else {
                this.newIntervention.approaches.splice(index, 1);
            }
        },

        cancelAddForm() {
            this.showAddForm = false;
            this.newIntervention = {
                label: '',
                theme: '',
                approaches: []
            };
        },

        addCustomIntervention() {
            if (!this.newIntervention.label.trim()) return;

            const intervention = {
                id: 'custom-' + Date.now(),
                label: this.newIntervention.label.trim(),
                theme: this.newIntervention.theme.trim() || this.newIntervention.label.trim().toLowerCase(),
                approaches: this.newIntervention.approaches.length > 0
                    ? [...this.newIntervention.approaches]
                    : ['general'],
                description: ''
            };

            this.preferences.customInterventions.push(intervention);
            this.savePreferences();
            this.cancelAddForm();
        },

        deleteCustomIntervention(id) {
            if (!confirm('Delete this custom intervention? This cannot be undone.')) return;

            // Remove from custom interventions
            const customIndex = this.preferences.customInterventions.findIndex(i => i.id === id);
            if (customIndex !== -1) {
                this.preferences.customInterventions.splice(customIndex, 1);
            }

            // Also remove from favorites and hidden if present
            const favIndex = this.preferences.favorites.indexOf(id);
            if (favIndex !== -1) {
                this.preferences.favorites.splice(favIndex, 1);
            }

            const hiddenIndex = this.preferences.hidden.indexOf(id);
            if (hiddenIndex !== -1) {
                this.preferences.hidden.splice(hiddenIndex, 1);
            }

            this.savePreferences();
        },

        // ========================================
        // THERAPEUTIC APPROACHES COMPUTED
        // ========================================

        /**
         * Get all therapeutic approaches with metadata
         */
        getAllApproaches() {
            const approaches = [];
            const hiddenSet = new Set(this.preferences.hiddenApproaches || []);

            // Add built-in approaches
            for (const approach of this.therapeuticApproaches) {
                approaches.push({
                    ...approach,
                    isBuiltIn: true,
                    isHidden: hiddenSet.has(approach.value),
                    interventionCount: this.getInterventionCountForApproach(approach.value)
                });
            }

            // Add custom approaches
            for (const approach of (this.preferences.customApproaches || [])) {
                approaches.push({
                    ...approach,
                    isBuiltIn: false,
                    isHidden: hiddenSet.has(approach.value),
                    interventionCount: this.getInterventionCountForApproach(approach.value)
                });
            }

            return approaches;
        },

        getVisibleApproaches() {
            return this.getAllApproaches().filter(a => !a.isHidden);
        },

        getHiddenApproaches() {
            return this.getAllApproaches().filter(a => a.isHidden);
        },

        getInterventionCountForApproach(approachValue) {
            return this.getAllInterventions().filter(i =>
                i.approaches && i.approaches.includes(approachValue)
            ).length;
        },

        /**
         * Get interventions tagged ONLY with a specific approach
         * (for hide modal - these would become "orphaned")
         */
        getInterventionsOnlyTaggedWith(approachValue) {
            return this.getAllInterventions().filter(i => {
                if (!i.approaches || i.approaches.length === 0) return false;
                // Get non-general approaches
                const nonGeneralApproaches = i.approaches.filter(a => a !== 'general');
                // If this intervention only has this one specific approach (besides general)
                return nonGeneralApproaches.length === 1 && nonGeneralApproaches[0] === approachValue;
            });
        },

        getInterventionsUsingApproach(approachValue) {
            return this.getAllInterventions().filter(i =>
                i.approaches && i.approaches.includes(approachValue)
            );
        },

        // ========================================
        // THERAPEUTIC APPROACH ACTIONS
        // ========================================

        isBuiltInApproach(value) {
            return this.therapeuticApproaches.some(a => a.value === value);
        },

        isApproachHidden(value) {
            return (this.preferences.hiddenApproaches || []).includes(value);
        },

        // --- HIDE APPROACH ---
        openHideApproachModal(approach) {
            this.pendingHideApproach = approach;
            this.hideApproachAlsoHideInterventions = false;
            this.affectedInterventionsForHide = this.getInterventionsOnlyTaggedWith(approach.value);
            this.showHideApproachModal = true;
        },

        confirmHideApproach() {
            if (!this.pendingHideApproach) return;

            const approachValue = this.pendingHideApproach.value;

            if (!this.preferences.hiddenApproaches) {
                this.preferences.hiddenApproaches = [];
            }
            if (!this.preferences.hiddenApproaches.includes(approachValue)) {
                this.preferences.hiddenApproaches.push(approachValue);
            }

            // Optionally hide single-tagged interventions
            if (this.hideApproachAlsoHideInterventions) {
                for (const intervention of this.affectedInterventionsForHide) {
                    if (!this.preferences.hidden.includes(intervention.id)) {
                        this.preferences.hidden.push(intervention.id);
                        // Remove from favorites
                        const favIndex = this.preferences.favorites.indexOf(intervention.id);
                        if (favIndex !== -1) this.preferences.favorites.splice(favIndex, 1);
                    }
                }
            }

            this.savePreferences();
            this.closeHideApproachModal();
        },

        closeHideApproachModal() {
            this.showHideApproachModal = false;
            this.pendingHideApproach = null;
            this.hideApproachAlsoHideInterventions = false;
            this.affectedInterventionsForHide = [];
        },

        unhideApproach(approachValue) {
            const index = (this.preferences.hiddenApproaches || []).indexOf(approachValue);
            if (index !== -1) {
                this.preferences.hiddenApproaches.splice(index, 1);
                this.savePreferences();
            }
        },

        // --- ADD CUSTOM APPROACH ---
        openAddApproachForm() {
            this.newApproach = { value: '', name: '' };
            this.showAddApproachForm = true;
        },

        cancelAddApproachForm() {
            this.showAddApproachForm = false;
            this.newApproach = { value: '', name: '' };
        },

        generateApproachValue(name) {
            return name.toLowerCase().trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                + '-therapy';
        },

        addCustomApproach() {
            const name = this.newApproach.name.trim();
            if (!name) return;

            let value = this.newApproach.value.trim() || this.generateApproachValue(name);

            if (this.getAllApproaches().some(a => a.value === value)) {
                alert('An approach with this value already exists.');
                return;
            }

            if (!this.preferences.customApproaches) {
                this.preferences.customApproaches = [];
            }
            this.preferences.customApproaches.push({ value, name });

            this.savePreferences();
            this.cancelAddApproachForm();
        },

        // --- EDIT CUSTOM APPROACH ---
        openEditApproach(approach) {
            this.editingApproach = approach;
            this.editApproachForm = { value: approach.value, name: approach.name };
        },

        saveEditedApproach() {
            if (!this.editingApproach) return;

            const originalValue = this.editingApproach.value;
            const newValue = this.editApproachForm.value.trim();
            const newName = this.editApproachForm.name.trim();

            if (!newName) { alert('Name is required.'); return; }

            const index = (this.preferences.customApproaches || [])
                .findIndex(a => a.value === originalValue);
            if (index === -1) return;

            // If value changed, update references
            if (newValue && newValue !== originalValue) {
                if (this.getAllApproaches().some(a => a.value === newValue && a.value !== originalValue)) {
                    alert('An approach with this value already exists.');
                    return;
                }

                // Update custom interventions
                for (const intervention of (this.preferences.customInterventions || [])) {
                    const idx = intervention.approaches.indexOf(originalValue);
                    if (idx !== -1) intervention.approaches[idx] = newValue;
                }

                // Update hidden approaches
                const hiddenIdx = (this.preferences.hiddenApproaches || []).indexOf(originalValue);
                if (hiddenIdx !== -1) this.preferences.hiddenApproaches[hiddenIdx] = newValue;
            }

            this.preferences.customApproaches[index] = { value: newValue || originalValue, name: newName };
            this.savePreferences();
            this.cancelEditApproach();
        },

        cancelEditApproach() {
            this.editingApproach = null;
            this.editApproachForm = { value: '', name: '' };
        },

        // --- DELETE CUSTOM APPROACH ---
        openDeleteApproachModal(approach) {
            this.pendingDeleteApproach = approach;
            this.affectedInterventionsForDelete = this.getInterventionsUsingApproach(approach.value)
                .filter(i => this.isCustom(i.id));
            this.showDeleteApproachModal = true;
        },

        confirmDeleteApproach() {
            if (!this.pendingDeleteApproach) return;

            const approachValue = this.pendingDeleteApproach.value;

            // Remove from custom approaches
            const index = (this.preferences.customApproaches || []).findIndex(a => a.value === approachValue);
            if (index !== -1) this.preferences.customApproaches.splice(index, 1);

            // Remove from hidden
            const hiddenIndex = (this.preferences.hiddenApproaches || []).indexOf(approachValue);
            if (hiddenIndex !== -1) this.preferences.hiddenApproaches.splice(hiddenIndex, 1);

            // Remove from custom interventions
            for (const intervention of (this.preferences.customInterventions || [])) {
                const idx = intervention.approaches.indexOf(approachValue);
                if (idx !== -1) {
                    intervention.approaches.splice(idx, 1);
                    if (intervention.approaches.length === 0) intervention.approaches.push('general');
                }
            }

            this.savePreferences();
            this.closeDeleteApproachModal();
        },

        closeDeleteApproachModal() {
            this.showDeleteApproachModal = false;
            this.pendingDeleteApproach = null;
            this.affectedInterventionsForDelete = [];
        }
    };
}
