/**
 * User Management Page Alpine.js Application
 *
 * Admin interface for managing users, roles, and MFA.
 * Only accessible to admin+ roles.
 */

import { Logger } from './logger.js';
import { API } from './api.js';
import { AuthGuard } from './authGuard.js';
import { NavDrawer } from './components/drawer.js';

export function createUsersAppData() {
    return {
        // ============ STATE ============

        // Shared drawer state
        ...NavDrawer.alpineData,

        // User info (for permission checks)
        userEmail: '',
        userName: '',
        userRole: '',
        userLicense: '',
        userGroups: [],

        // Loading states
        loading: true,
        actionLoading: false,

        // Users list
        users: [],

        // Toast notifications
        showSuccessToast: false,
        showErrorToast: false,
        successMessage: '',
        errorMessage: '',

        // Invite user modal
        showInviteModal: false,
        inviting: false,
        newUser: {
            email: '',
            name: '',
            role: 'supervisor'
        },

        // Edit role modal
        showEditRoleModal: false,
        editingUser: null,
        newRole: '',

        // Delete confirmation modal
        showDeleteModal: false,
        deletingUser: null,

        // Reset MFA confirmation
        showResetMFAModal: false,
        resettingMFAUser: null,

        // ============ COMPUTED ============

        /**
         * Check if current user is admin or higher
         * Note: Using method instead of getter for Alpine.js compatibility with drawer
         */
        isAdmin() {
            return this.hasRole('admin');
        },

        /**
         * Check if current user is sysadmin
         * Note: Using method instead of getter for Alpine.js consistency
         */
        isSysAdmin() {
            return this.hasRole('sysadmin');
        },

        /**
         * Get current user ID
         */
        get currentUserId() {
            // Find user by email in the users list
            const currentUser = this.users.find(u => u.email === this.userEmail);
            return currentUser?.id;
        },

        // ============ INITIALIZATION ============

        async init() {
            // Safety check: prevent dangerous config combination
            AuthGuard.validateConfig();

            Logger.log('User Management initialized');

            // Auth check - redirect to login if not authenticated
            if (!AuthGuard.checkAuth()) return;

            // Load user info
            const userInfo = AuthGuard.loadUserInfo();
            if (userInfo) {
                this.userEmail = userInfo.email;
                this.userName = userInfo.name;
                this.userRole = userInfo.role;
                this.userLicense = userInfo.license || '';
                this.userGroups = userInfo.groups || [];
            }

            // Check admin permissions
            if (!this.isAdmin()) {
                Logger.warn('User does not have admin permissions');
                window.location.href = 'documents.html';
                return;
            }

            // Load users
            await this.loadUsers();
        },

        /**
         * Logout user and redirect to login page
         */
        async logout() {
            await AuthGuard.logout();
        },

        /**
         * Check if user has a specific role or higher
         */
        hasRole(requiredRole) {
            const roleHierarchy = ['supervisor', 'admin', 'sysadmin'];
            const userRoleIndex = roleHierarchy.indexOf(this.userRole);
            const requiredIndex = roleHierarchy.indexOf(requiredRole);
            return userRoleIndex >= requiredIndex;
        },

        // ============ DATA LOADING ============

        /**
         * Load all users
         */
        async loadUsers() {
            this.loading = true;
            try {
                const result = await API.getUsers();
                this.users = result.users || [];
            } catch (error) {
                Logger.error('Failed to load users:', error);
                this.showToast('error', 'Failed to load users');
            } finally {
                this.loading = false;
            }
        },

        // ============ INVITE USER ============

        /**
         * Open invite modal
         */
        openInviteModal() {
            this.newUser = { email: '', name: '', role: 'supervisor' };
            this.showInviteModal = true;
        },

        /**
         * Close invite modal
         */
        closeInviteModal() {
            this.showInviteModal = false;
            this.newUser = { email: '', name: '', role: 'supervisor' };
        },

        /**
         * Send invitation to new user
         */
        async inviteUser() {
            if (!this.newUser.email || !this.newUser.name) {
                this.showToast('error', 'Please fill in all fields');
                return;
            }

            // Check if admin is trying to create another admin (only sysadmin can)
            if (this.newUser.role === 'admin' && !this.isSysAdmin) {
                this.showToast('error', 'Only sysadmins can create admin users');
                return;
            }

            this.inviting = true;
            try {
                const invitedEmail = this.newUser.email;
                await API.inviteUser(this.newUser);
                await this.loadUsers();
                this.closeInviteModal();
                this.showToast('success', `Invitation sent to ${invitedEmail}`);
            } catch (error) {
                Logger.error('Failed to invite user:', error);
                this.showToast('error', error.message || 'Failed to send invitation');
            } finally {
                this.inviting = false;
            }
        },

        // ============ EDIT ROLE ============

        /**
         * Open edit role modal
         */
        openEditRoleModal(user) {
            this.editingUser = user;
            this.newRole = user.role;
            this.showEditRoleModal = true;
        },

        /**
         * Close edit role modal
         */
        closeEditRoleModal() {
            this.showEditRoleModal = false;
            this.editingUser = null;
            this.newRole = '';
        },

        /**
         * Update user's role
         */
        async updateRole() {
            if (!this.editingUser || !this.newRole) return;

            // Check permissions
            if (this.newRole === 'admin' && !this.isSysAdmin) {
                this.showToast('error', 'Only sysadmins can promote users to admin');
                return;
            }

            if (this.editingUser.role === 'admin' && !this.isSysAdmin) {
                this.showToast('error', 'Only sysadmins can modify admin users');
                return;
            }

            this.actionLoading = true;
            try {
                await API.updateUserRole(this.editingUser.id, this.newRole);
                await this.loadUsers();
                this.closeEditRoleModal();
                this.showToast('success', `Role updated for ${this.editingUser.name}`);
            } catch (error) {
                Logger.error('Failed to update role:', error);
                this.showToast('error', error.message || 'Failed to update role');
            } finally {
                this.actionLoading = false;
            }
        },

        // ============ DELETE USER ============

        /**
         * Open delete confirmation modal
         */
        openDeleteModal(user) {
            this.deletingUser = user;
            this.showDeleteModal = true;
        },

        /**
         * Close delete modal
         */
        closeDeleteModal() {
            this.showDeleteModal = false;
            this.deletingUser = null;
        },

        /**
         * Delete user
         */
        async deleteUser() {
            if (!this.deletingUser) return;

            // Check permissions
            if (this.deletingUser.role === 'admin' && !this.isSysAdmin) {
                this.showToast('error', 'Only sysadmins can delete admin users');
                return;
            }

            // Can't delete yourself
            if (this.deletingUser.id === this.currentUserId) {
                this.showToast('error', 'You cannot delete your own account');
                return;
            }

            this.actionLoading = true;
            try {
                await API.deleteUser(this.deletingUser.id);
                await this.loadUsers();
                this.closeDeleteModal();
                this.showToast('success', `User ${this.deletingUser.name} has been removed`);
            } catch (error) {
                Logger.error('Failed to delete user:', error);
                this.showToast('error', error.message || 'Failed to delete user');
            } finally {
                this.actionLoading = false;
            }
        },

        // ============ RESET MFA ============

        /**
         * Open reset MFA confirmation modal
         */
        openResetMFAModal(user) {
            this.resettingMFAUser = user;
            this.showResetMFAModal = true;
        },

        /**
         * Close reset MFA modal
         */
        closeResetMFAModal() {
            this.showResetMFAModal = false;
            this.resettingMFAUser = null;
        },

        /**
         * Reset user's MFA
         */
        async resetMFA() {
            if (!this.resettingMFAUser) return;

            this.actionLoading = true;
            try {
                await API.resetUserMFA(this.resettingMFAUser.id);
                await this.loadUsers();
                this.closeResetMFAModal();
                this.showToast('success', `MFA reset for ${this.resettingMFAUser.name}. They will set up MFA on next login.`);
            } catch (error) {
                Logger.error('Failed to reset MFA:', error);
                this.showToast('error', error.message || 'Failed to reset MFA');
            } finally {
                this.actionLoading = false;
            }
        },

        // ============ HELPERS ============

        /**
         * Check if current user can edit a specific user
         */
        canEditUser(user) {
            // Sysadmins can edit anyone
            if (this.isSysAdmin) return true;
            // Admins can only edit supervisors
            if (this.isAdmin && user.role === 'supervisor') return true;
            return false;
        },

        /**
         * Check if current user can delete a specific user
         */
        canDeleteUser(user) {
            // Can't delete yourself
            if (user.id === this.currentUserId) return false;
            return this.canEditUser(user);
        },

        /**
         * Get role badge class
         */
        getRoleBadgeClass(role) {
            switch (role) {
                case 'sysadmin':
                    return 'badge-danger';
                case 'admin':
                    return 'badge-primary';
                case 'supervisor':
                    return 'badge-secondary';
                default:
                    return 'badge-neutral';
            }
        },

        /**
         * Get status badge class
         */
        getStatusBadgeClass(status) {
            switch (status) {
                case 'CONFIRMED':
                    return 'badge-success';
                case 'FORCE_CHANGE_PASSWORD':
                    return 'badge-warning';
                default:
                    return 'badge-neutral';
            }
        },

        /**
         * Format status for display
         */
        formatStatus(status) {
            switch (status) {
                case 'CONFIRMED':
                    return 'Active';
                case 'FORCE_CHANGE_PASSWORD':
                    return 'Pending';
                case 'UNCONFIRMED':
                    return 'Unconfirmed';
                default:
                    return status;
            }
        },

        /**
         * Format date for display.
         * Uses DateUtils to handle date-only vs timestamp formats correctly.
         */
        formatDate(dateString) {
            if (!dateString) return 'N/A';
            return DateUtils.formatAuto(dateString);
        },

        /**
         * Show toast notification
         */
        showToast(type, message) {
            if (type === 'success') {
                this.successMessage = message;
                this.showSuccessToast = true;
                setTimeout(() => this.showSuccessToast = false, 3000);
            } else if (type === 'error') {
                this.errorMessage = message;
                this.showErrorToast = true;
                setTimeout(() => this.showErrorToast = false, 5000);
            }
        }
    };
}
