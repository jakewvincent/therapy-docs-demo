/**
 * Archived Clients Alpine.js Application
 *
 * Manages the archived clients view with restore and permanent delete functionality.
 */

import { Logger } from './logger.js';
import { DateUtils } from './dateUtils.js';
import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { NavDrawer } from './components/drawer.js';
import { CacheManager, CacheKeys } from './cacheManager.js';

export function createClientsArchivedData() {
    return {
        // ============ DATA STATE ============

        clients: [],
        loading: true,
        errorMessage: '',

        // ============ UI STATE ============

        // Shared drawer state
        ...NavDrawer.alpineData,

        // User role (for drawer visibility)
        userRole: '',
        userLicense: '',

        // Modal states
        showRestoreModal: false,
        showDeleteModal: false,
        clientToAction: null,

        // Action states
        restoring: false,
        deleting: false,
        deleteConfirmText: '',

        // ============ COMPUTED PROPERTIES ============

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
         * Check if delete confirmation text matches client initials
         */
        get deleteConfirmMatches() {
            if (!this.clientToAction) return false;
            return this.deleteConfirmText.trim().toUpperCase() === this.clientToAction.name.toUpperCase();
        },

        // ============ LIFECYCLE ============

        /**
         * Initialize the page - called via x-init
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

            await this.loadClients();
        },

        /**
         * Logout user and redirect to login page
         */
        async logout() {
            await AuthGuard.logout();
        },

        // ============ DATA METHODS ============

        /**
         * Load archived clients from API
         */
        async loadClients() {
            try {
                this.loading = true;
                this.errorMessage = '';
                this.clients = await API.getArchivedClients();
            } catch (error) {
                this.errorMessage = 'Failed to load archived clients. Please try again.';
                Logger.error('Error loading archived clients:', error);
            } finally {
                this.loading = false;
            }
        },

        /**
         * Restore an archived client
         */
        async restoreClient() {
            if (!this.clientToAction) return;

            try {
                this.restoring = true;
                await API.restoreClient(this.clientToAction.id);

                // Invalidate clients cache so all pages get fresh data
                CacheManager.invalidate(CacheKeys.CLIENTS);

                // Close modal and reload
                this.showRestoreModal = false;
                this.clientToAction = null;
                await this.loadClients();

                // If no more archived clients, redirect back to clients page
                if (this.clients.length === 0) {
                    window.location.href = 'clients.html';
                }
            } catch (error) {
                Logger.error('Error restoring client:', error);
                this.errorMessage = 'Failed to restore client. Please try again.';
            } finally {
                this.restoring = false;
            }
        },

        /**
         * Permanently delete a client
         */
        async deleteClient() {
            if (!this.clientToAction || !this.deleteConfirmMatches) return;

            try {
                this.deleting = true;
                await API.deleteClient(this.clientToAction.id);

                // Invalidate clients cache so all pages get fresh data
                CacheManager.invalidate(CacheKeys.CLIENTS);

                // Close modal and reload
                this.closeDeleteModal();
                await this.loadClients();

                // If no more archived clients, redirect back to clients page
                if (this.clients.length === 0) {
                    window.location.href = 'clients.html';
                }
            } catch (error) {
                Logger.error('Error deleting client:', error);
                this.errorMessage = 'Failed to delete client. Please try again.';
            } finally {
                this.deleting = false;
            }
        },

        // ============ UI METHODS ============

        /**
         * Open restore confirmation modal
         */
        confirmRestore(client) {
            this.clientToAction = client;
            this.showRestoreModal = true;
        },

        /**
         * Open delete confirmation modal
         */
        confirmDelete(client) {
            this.clientToAction = client;
            this.deleteConfirmText = '';
            this.showDeleteModal = true;
        },

        /**
         * Close delete modal and reset state
         */
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.deleteConfirmText = '';
            // Delay clearing clientToAction for smooth animation
            setTimeout(() => {
                if (!this.showDeleteModal) {
                    this.clientToAction = null;
                }
            }, 200);
        },

        // ============ HELPER METHODS ============

        /**
         * Format a date string for display.
         * Uses DateUtils to handle date-only vs timestamp formats correctly.
         */
        formatDate(dateString) {
            if (!dateString) return 'Unknown date';
            return DateUtils.formatAuto(dateString);
        }
    };
}
