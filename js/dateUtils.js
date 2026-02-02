/**
 * Centralized Date/Time Utilities
 *
 * IMPORTANT: This module handles the distinction between:
 * - Date-only strings (YYYY-MM-DD): Should NOT be timezone-shifted
 * - ISO 8601 timestamps: Should be converted from UTC to local time
 *
 * Backend always stores/sends UTC. Frontend always displays local time.
 */

import { Logger } from './logger.js';

export const DateUtils = {
    /**
     * Format a date-only string (YYYY-MM-DD) for display.
     *
     * CRITICAL: Date-only strings must be parsed as LOCAL midnight, not UTC.
     * JavaScript's Date constructor treats "2024-08-01" as UTC midnight,
     * which causes off-by-one-day errors for users west of UTC.
     *
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @param {object} options - Intl.DateTimeFormat options (optional)
     * @returns {string} Formatted date string (e.g., "Aug 1, 2024")
     */
    formatDateOnly(dateString, options = {}) {
        if (!dateString) return 'N/A';

        try {
            // Append T00:00:00 (no 'Z') to force LOCAL timezone interpretation
            const date = new Date(dateString + 'T00:00:00');

            if (isNaN(date.getTime())) {
                return dateString; // Return original if parsing fails
            }

            const defaultOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            };

            return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        } catch (error) {
            Logger.warn('DateUtils.formatDateOnly: Failed to parse date', dateString, error);
            return dateString;
        }
    },

    /**
     * Format an ISO 8601 timestamp for display.
     *
     * Timestamps are stored as UTC and should be converted to local time.
     *
     * @param {string} isoString - ISO 8601 timestamp (e.g., "2025-12-14T10:30:00.000000")
     * @param {object} options - Intl.DateTimeFormat options (optional)
     * @returns {string} Formatted date string in local timezone
     */
    formatTimestamp(isoString, options = {}) {
        if (!isoString) return 'N/A';

        try {
            const date = new Date(isoString);

            if (isNaN(date.getTime())) {
                return isoString; // Return original if parsing fails
            }

            const defaultOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            };

            return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
        } catch (error) {
            Logger.warn('DateUtils.formatTimestamp: Failed to parse timestamp', isoString, error);
            return isoString;
        }
    },

    /**
     * Format an ISO 8601 timestamp with time for display.
     *
     * @param {string} isoString - ISO 8601 timestamp
     * @param {object} options - Intl.DateTimeFormat options (optional)
     * @returns {string} Formatted date and time string in local timezone
     */
    formatTimestampWithTime(isoString, options = {}) {
        if (!isoString) return 'N/A';

        try {
            const date = new Date(isoString);

            if (isNaN(date.getTime())) {
                return isoString;
            }

            const defaultOptions = {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            };

            return date.toLocaleString('en-US', { ...defaultOptions, ...options });
        } catch (error) {
            Logger.warn('DateUtils.formatTimestampWithTime: Failed to parse timestamp', isoString, error);
            return isoString;
        }
    },

    /**
     * Format a date-only string in long format (e.g., "December 18, 2025")
     *
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {string} Long formatted date string
     */
    formatDateOnlyLong(dateString) {
        return this.formatDateOnly(dateString, {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    },

    /**
     * Get today's date in YYYY-MM-DD format (local timezone).
     *
     * @returns {string} Today's date as YYYY-MM-DD
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Get current timestamp in ISO 8601 format (UTC).
     *
     * @returns {string} Current UTC timestamp
     */
    getNowTimestamp() {
        return new Date().toISOString();
    },

    /**
     * Check if a date-only string is in the past.
     *
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {boolean} True if date is before today
     */
    isDateInPast(dateString) {
        if (!dateString) return false;

        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date < today;
    },

    /**
     * Check if a date-only string is in the future.
     *
     * @param {string} dateString - Date in YYYY-MM-DD format
     * @returns {boolean} True if date is after today
     */
    isDateInFuture(dateString) {
        if (!dateString) return false;

        const date = new Date(dateString + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return date > today;
    },

    /**
     * Calculate the number of days between two date-only strings.
     * Returns absolute value (always positive).
     *
     * @param {string} date1 - First date in YYYY-MM-DD format
     * @param {string} date2 - Second date in YYYY-MM-DD format
     * @returns {number} Number of days between the dates (or null if invalid)
     */
    daysBetween(date1, date2) {
        if (!date1 || !date2) return null;

        try {
            // Parse as local dates to avoid timezone issues
            const d1 = new Date(date1 + 'T00:00:00');
            const d2 = new Date(date2 + 'T00:00:00');

            if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
                return null;
            }

            const diffMs = Math.abs(d2 - d1);
            return diffMs / (1000 * 60 * 60 * 24);
        } catch (error) {
            Logger.warn('DateUtils.daysBetween: Failed to calculate days', date1, date2, error);
            return null;
        }
    },

    /**
     * Smart format function that auto-detects date-only vs timestamp.
     *
     * Use this when you're not sure which type you have, but prefer
     * explicit formatDateOnly/formatTimestamp when the type is known.
     *
     * @param {string} dateString - Either YYYY-MM-DD or ISO 8601 timestamp
     * @param {object} options - Intl.DateTimeFormat options (optional)
     * @returns {string} Formatted date string
     */
    formatAuto(dateString, options = {}) {
        if (!dateString) return 'N/A';

        // Check if it's a date-only string (YYYY-MM-DD, 10 chars, no 'T')
        if (dateString.length === 10 && !dateString.includes('T')) {
            return this.formatDateOnly(dateString, options);
        }

        // Otherwise treat as timestamp
        return this.formatTimestamp(dateString, options);
    }
};

// Make available globally
window.DateUtils = DateUtils;
