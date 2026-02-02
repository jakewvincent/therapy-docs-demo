/**
 * Centralized Feature Status Configuration
 *
 * Single source of truth for development status of features across the application.
 *
 * Status values:
 *   - 'released': Production-ready (default, no badge shown)
 *   - 'beta': In beta testing (amber badge)
 *   - 'notImplemented': Not yet built (gray badge)
 */

export const FeatureStatus = {
    /**
     * Document types (used in documents.html form type selector)
     */
    documentTypes: {
        'Consultation': 'notImplemented',
        'Intake': 'beta',
        'Diagnosis': 'beta',
        'Treatment Plan': 'beta',
        'Progress Note': 'released',
        'Discharge': 'notImplemented'
    },

    /**
     * Client details slideout tabs (used in clients.html)
     */
    clientDetailsTabs: {
        'overview': 'released',
        'notes': 'released',
        'txplan': 'beta',
        'intake': 'notImplemented'
    },

    /**
     * Get the status of a feature
     * @param {string} category - The category (e.g., 'documentTypes', 'clientDetailsTabs')
     * @param {string} featureId - The feature identifier
     * @returns {string} Status: 'released', 'beta', or 'notImplemented'
     */
    getStatus(category, featureId) {
        return this[category]?.[featureId] || 'released';
    },

    /**
     * Check if a feature is in beta
     * @param {string} category - The category
     * @param {string} featureId - The feature identifier
     * @returns {boolean}
     */
    isBeta(category, featureId) {
        return this.getStatus(category, featureId) === 'beta';
    },

    /**
     * Check if a feature is not implemented
     * @param {string} category - The category
     * @param {string} featureId - The feature identifier
     * @returns {boolean}
     */
    isNotImplemented(category, featureId) {
        return this.getStatus(category, featureId) === 'notImplemented';
    },

    /**
     * Check if a feature is released (production-ready)
     * @param {string} category - The category
     * @param {string} featureId - The feature identifier
     * @returns {boolean}
     */
    isReleased(category, featureId) {
        return this.getStatus(category, featureId) === 'released';
    }
};
