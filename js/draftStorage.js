/**
 * Draft Storage Module
 *
 * Handles localStorage-based draft persistence for therapy session forms.
 * Uses UUID-based storage for unique document identity from draft through backend.
 *
 * Storage structure:
 * - draft_{uuid} → Individual draft object
 * - draft_index_{clientId} → Array of UUIDs for that client
 *
 * Draft lifecycle:
 * 1. initializeDraft() → generates UUID, stores empty draft
 * 2. saveDraft() → updates draft data (autosave)
 * 3. markSavedToBackend() → flags draft as persisted
 * 4. deleteDraft() → removes draft after successful backend save
 */

import { Logger } from './logger.js';
import { DateUtils } from './dateUtils.js';

export const DraftStorage = {
    /**
     * Initialize a new draft with a UUID.
     * Called when user starts a new note.
     *
     * @param {string} clientId - The client ID
     * @param {string} formType - The form type (e.g., 'Progress Note')
     * @param {string} sessionDate - The session date (YYYY-MM-DD)
     * @returns {string} The generated UUID
     */
    initializeDraft(clientId, formType, sessionDate) {
        if (!clientId || !formType || !sessionDate) {
            Logger.error('initializeDraft: Missing required parameters');
            return null;
        }

        const uuid = crypto.randomUUID();
        const draft = {
            uuid,
            clientId,
            sessionDate,
            formType,
            savedAt: new Date().toISOString(),
            savedToBackend: false,
            data: {}
        };

        const saved = this._saveDraftInternal(uuid, draft);
        if (saved) {
            this._addToIndex(clientId, uuid);
            Logger.log('Draft initialized:', uuid);
            return uuid;
        }

        return null;
    },

    /**
     * Save/update draft data by UUID.
     * Called during autosave.
     *
     * @param {string} uuid - The draft UUID
     * @param {object} data - The form data to save
     * @returns {boolean} True if save succeeded
     */
    saveDraft(uuid, data) {
        if (!uuid || !data) {
            Logger.warn('saveDraft: Missing uuid or data');
            return false;
        }

        const draft = this._getDraftInternal(uuid);
        if (!draft) {
            Logger.error('saveDraft: Draft not found:', uuid);
            return false;
        }

        // Deep clone to prevent mutation
        draft.data = JSON.parse(JSON.stringify(data));
        draft.savedAt = new Date().toISOString();

        return this._saveDraftInternal(uuid, draft);
    },

    /**
     * Update the session date for a draft.
     * Called when user changes the date field.
     *
     * @param {string} uuid - The draft UUID
     * @param {string} sessionDate - The new session date (YYYY-MM-DD)
     * @returns {boolean} True if update succeeded
     */
    updateSessionDate(uuid, sessionDate) {
        if (!uuid || !sessionDate) {
            return false;
        }

        const draft = this._getDraftInternal(uuid);
        if (!draft) {
            Logger.error('updateSessionDate: Draft not found:', uuid);
            return false;
        }

        draft.sessionDate = sessionDate;
        draft.savedAt = new Date().toISOString();

        return this._saveDraftInternal(uuid, draft);
    },

    /**
     * Mark a draft as saved to backend.
     * Called after successful API.createDocument().
     *
     * @param {string} uuid - The draft UUID
     */
    markSavedToBackend(uuid) {
        if (!uuid) return;

        const draft = this._getDraftInternal(uuid);
        if (draft) {
            draft.savedToBackend = true;
            draft.savedAt = new Date().toISOString();
            this._saveDraftInternal(uuid, draft);
            Logger.log('Draft marked as saved to backend:', uuid);
        }
    },

    /**
     * Get a draft by UUID.
     *
     * @param {string} uuid - The draft UUID
     * @returns {object|null} The draft object or null if not found
     */
    getDraft(uuid) {
        return this._getDraftInternal(uuid);
    },

    /**
     * Get all drafts for a client.
     * Returns drafts sorted by savedAt (newest first).
     *
     * @param {string} clientId - The client ID
     * @returns {Array} Array of draft objects
     */
    getDraftsForClient(clientId) {
        if (!clientId) return [];

        const index = this._getIndex(clientId);
        const validDrafts = [];
        const invalidUUIDs = [];

        for (const uuid of index) {
            const draft = this._getDraftInternal(uuid);
            if (draft) {
                validDrafts.push(draft);
            } else {
                invalidUUIDs.push(uuid);
            }
        }

        // Self-heal: clean up invalid UUIDs from index
        if (invalidUUIDs.length > 0) {
            Logger.warn('Cleaning up invalid draft references:', invalidUUIDs);
            const cleanIndex = index.filter(uuid => !invalidUUIDs.includes(uuid));
            this._saveIndex(clientId, cleanIndex);
        }

        // Sort by savedAt descending (newest first)
        return validDrafts.sort((a, b) =>
            new Date(b.savedAt) - new Date(a.savedAt)
        );
    },

    /**
     * Check if client has any drafts.
     *
     * @param {string} clientId - The client ID
     * @returns {boolean} True if at least one draft exists
     */
    hasDrafts(clientId) {
        return this.getDraftsForClient(clientId).length > 0;
    },

    /**
     * Find orphaned drafts (not saved to backend, older than threshold).
     *
     * @param {string} clientId - The client ID
     * @param {number} thresholdHours - Age threshold in hours (default 24)
     * @returns {Array} Array of orphaned draft objects
     */
    findOrphanedDrafts(clientId, thresholdHours = 24) {
        const drafts = this.getDraftsForClient(clientId);
        const thresholdMs = thresholdHours * 60 * 60 * 1000;

        return drafts.filter(draft => {
            if (draft.savedToBackend) return false;
            const age = Date.now() - new Date(draft.savedAt);
            return age > thresholdMs;
        });
    },

    /**
     * Find drafts for a specific session date.
     *
     * @param {string} clientId - The client ID
     * @param {string} sessionDate - The session date (YYYY-MM-DD)
     * @returns {Array} Array of draft objects matching the date
     */
    getDraftsForDate(clientId, sessionDate) {
        if (!clientId || !sessionDate) return [];
        const drafts = this.getDraftsForClient(clientId);
        return drafts.filter(d => d.sessionDate === sessionDate);
    },

    /**
     * Delete a draft by UUID.
     *
     * @param {string} uuid - The draft UUID
     * @returns {boolean} True if draft was found and deleted
     */
    deleteDraft(uuid) {
        if (!uuid) return false;

        const draft = this._getDraftInternal(uuid);
        if (!draft) {
            Logger.warn('deleteDraft: Draft not found:', uuid);
            return false;
        }

        // Remove from index
        this._removeFromIndex(draft.clientId, uuid);

        // Remove draft
        try {
            localStorage.removeItem(`draft_${uuid}`);
            Logger.log('Draft deleted:', uuid);
            return true;
        } catch (error) {
            Logger.error('Error deleting draft:', error);
            return false;
        }
    },

    /**
     * Delete all drafts for a client.
     *
     * @param {string} clientId - The client ID
     * @returns {boolean} True if deletion succeeded
     */
    deleteAllDraftsForClient(clientId) {
        if (!clientId) return false;

        try {
            const index = this._getIndex(clientId);

            // Delete each draft
            for (const uuid of index) {
                localStorage.removeItem(`draft_${uuid}`);
            }

            // Delete index
            localStorage.removeItem(`draft_index_${clientId}`);

            Logger.log('All drafts deleted for client:', clientId);
            return true;
        } catch (error) {
            Logger.error('Error deleting all drafts:', error);
            return false;
        }
    },

    /**
     * Cleanup old drafts that have been saved to backend.
     * Called when localStorage quota is exceeded.
     *
     * @param {number} maxAgeDays - Max age in days for saved drafts (default 7)
     * @returns {number} Number of drafts cleaned up
     */
    cleanupOldSavedDrafts(maxAgeDays = 7) {
        const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
        let cleanedCount = 0;

        try {
            // Find all draft keys
            const allKeys = Object.keys(localStorage).filter(k =>
                k.startsWith('draft_') && !k.startsWith('draft_index_')
            );

            for (const key of allKeys) {
                try {
                    const draft = JSON.parse(localStorage.getItem(key));
                    if (draft && draft.savedToBackend) {
                        const age = Date.now() - new Date(draft.savedAt);
                        if (age > maxAgeMs) {
                            this.deleteDraft(draft.uuid);
                            cleanedCount++;
                        }
                    }
                } catch (e) {
                    // Corrupted draft, remove it
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0) {
                Logger.log(`Cleaned up ${cleanedCount} old saved drafts`);
            }
        } catch (error) {
            Logger.error('Error during draft cleanup:', error);
        }

        return cleanedCount;
    },

    // =========================================================================
    // INTERNAL METHODS
    // =========================================================================

    /**
     * Get draft from localStorage.
     * @private
     */
    _getDraftInternal(uuid) {
        try {
            const stored = localStorage.getItem(`draft_${uuid}`);
            if (!stored) return null;

            const draft = JSON.parse(stored);

            // Validate structure
            if (!draft || !draft.uuid || !draft.clientId) {
                Logger.warn('Invalid draft structure:', uuid);
                return null;
            }

            return draft;
        } catch (error) {
            Logger.error('Error reading draft:', error);
            return null;
        }
    },

    /**
     * Save draft to localStorage.
     * @private
     */
    _saveDraftInternal(uuid, draft) {
        try {
            localStorage.setItem(`draft_${uuid}`, JSON.stringify(draft));
            return true;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                Logger.error('localStorage quota exceeded, attempting cleanup');

                // Try cleanup and retry
                this.cleanupOldSavedDrafts();

                try {
                    localStorage.setItem(`draft_${uuid}`, JSON.stringify(draft));
                    return true;
                } catch (retryError) {
                    Logger.error('Still cannot save after cleanup');
                    return false;
                }
            }

            Logger.error('Error saving draft:', error);
            return false;
        }
    },

    /**
     * Get the index array for a client.
     * @private
     */
    _getIndex(clientId) {
        try {
            const stored = localStorage.getItem(`draft_index_${clientId}`);
            if (!stored) return [];

            const index = JSON.parse(stored);
            return Array.isArray(index) ? index : [];
        } catch (error) {
            Logger.error('Error reading draft index:', error);
            return [];
        }
    },

    /**
     * Save the index array for a client.
     * @private
     */
    _saveIndex(clientId, index) {
        try {
            if (index.length === 0) {
                localStorage.removeItem(`draft_index_${clientId}`);
            } else {
                localStorage.setItem(`draft_index_${clientId}`, JSON.stringify(index));
            }
        } catch (error) {
            Logger.error('Error saving draft index:', error);
        }
    },

    /**
     * Add a UUID to a client's index.
     * @private
     */
    _addToIndex(clientId, uuid) {
        const index = this._getIndex(clientId);
        if (!index.includes(uuid)) {
            index.push(uuid);
            this._saveIndex(clientId, index);
        }
    },

    /**
     * Remove a UUID from a client's index.
     * @private
     */
    _removeFromIndex(clientId, uuid) {
        const index = this._getIndex(clientId);
        const filtered = index.filter(id => id !== uuid);
        this._saveIndex(clientId, filtered);
    },

    // =========================================================================
    // FORMATTING HELPERS
    // =========================================================================

    /**
     * Format a savedAt timestamp for display.
     * Returns relative time like "2 minutes ago" or "3 days ago".
     *
     * @param {string} savedAt - ISO timestamp
     * @returns {string} Human-readable relative time
     */
    formatSavedAt(savedAt) {
        if (!savedAt) return '';

        const saved = new Date(savedAt);
        const now = new Date();
        const diffMs = now - saved;
        const diffSec = Math.floor(diffMs / 1000);
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);

        if (diffSec < 5) {
            return 'just now';
        } else if (diffSec < 60) {
            return `${diffSec} seconds ago`;
        } else if (diffMin < 60) {
            return diffMin === 1 ? '1 minute ago' : `${diffMin} minutes ago`;
        } else if (diffHour < 24) {
            return diffHour === 1 ? '1 hour ago' : `${diffHour} hours ago`;
        } else {
            return diffDay === 1 ? '1 day ago' : `${diffDay} days ago`;
        }
    },

    /**
     * Format a session date for display.
     *
     * @param {string} sessionDate - Date in YYYY-MM-DD format
     * @returns {string} Formatted date like "December 18, 2025"
     */
    formatSessionDate(sessionDate) {
        if (!sessionDate) return '';
        return DateUtils.formatDateOnlyLong(sessionDate);
    }
};

// Make available globally
window.DraftStorage = DraftStorage;
