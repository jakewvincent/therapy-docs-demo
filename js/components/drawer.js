/**
 * Shared Navigation Drawer Component
 *
 * Generates consistent drawer HTML across all pages.
 * Must be loaded before Alpine.js initializes.
 *
 * Usage:
 *   1. Include this script in <head> after config.js
 *   2. Add <div id="nav-drawer"></div> inside your Alpine x-data element
 *   3. Call NavDrawer.init({ activePage: 'clients' }) before Alpine loads
 *   4. Merge NavDrawer.alpineData into your Alpine component
 */

import { Logger } from '../logger.js';

export const NavDrawer = {
    /**
     * Initialize the drawer by injecting HTML into the placeholder
     * @param {Object} options
     * @param {string} options.activePage - 'documents' | 'clients' | 'interventions' | 'settings' | 'users'
     * @param {boolean} options.showUserInfo - Show user email and logout (default: false)
     */
    init(options = {}) {
        const { activePage = '', showUserInfo = false } = options;

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._inject(activePage, showUserInfo));
        } else {
            this._inject(activePage, showUserInfo);
        }
    },

    /**
     * Inject drawer HTML into the placeholder
     */
    _inject(activePage, showUserInfo) {
        const container = document.getElementById('nav-drawer');
        if (!container) {
            Logger.warn('NavDrawer: No #nav-drawer element found');
            return;
        }
        container.innerHTML = this._getHTML(activePage, showUserInfo);
    },

    /**
     * Alpine.js data to merge into your component
     * Usage: x-data="{ ...NavDrawer.alpineData, ...yourData }"
     */
    alpineData: {
        drawerOpen: false
    },

    /**
     * Get menu item class based on active state
     */
    _menuItemClass(page, activePage, isDisabled = false) {
        const classes = ['menu-item'];
        if (page === activePage) classes.push('active');
        if (isDisabled) classes.push('disabled');
        return classes.join(' ');
    },

    /**
     * Generate the drawer HTML
     */
    _getHTML(activePage, showUserInfo) {
        const isDocuments = activePage === 'documents';
        const isClients = activePage === 'clients';
        const isInterventions = activePage === 'interventions';
        const isSettings = activePage === 'settings';
        const isUsers = activePage === 'users';

        // For the active page, use # href and disable click
        // For other pages, use actual href
        const documentsHref = isDocuments ? '#' : 'documents.html';
        const clientsHref = isClients ? '#' : 'clients.html';
        const interventionsHref = isInterventions ? '#' : 'interventions.html';
        const settingsHref = isSettings ? '#' : 'settings.html';
        const usersHref = isUsers ? '#' : 'users.html';

        // Click handler - close drawer when navigating away
        const navClick = '@click="drawerOpen = false"';

        return `
        <!-- Drawer Overlay -->
        <div
            class="drawer-overlay"
            :class="{ 'open': drawerOpen }"
            @click="drawerOpen = false"
        ></div>

        <!-- Navigation Drawer -->
        <nav class="drawer" :class="{ 'open': drawerOpen }">
            <div class="drawer-header">
                <div class="flex items-center justify-between">
                    <div>
                        <h2 class="font-semibold text-neutral-900">Therapy Docs</h2>
                        <p class="text-sm text-neutral-500" x-text="userLicense ? userName + ', ' + userLicense : userName"></p>
                    </div>
                    <button @click="drawerOpen = false" class="hamburger-btn">
                        <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#close"></use></svg>
                    </button>
                </div>
            </div>

            <div class="drawer-body">
                <div class="menu-label">Main</div>
                <a href="${documentsHref}" class="${this._menuItemClass('documents', activePage, isDocuments)}" ${isDocuments ? '' : navClick}>
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#documents-general"></use></svg>
                    <span>Documents</span>
                </a>
                <a href="${clientsHref}" class="${this._menuItemClass('clients', activePage, isClients)}" ${isClients ? '' : navClick}>
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#clients"></use></svg>
                    <span>Clients</span>
                </a>

                <div class="menu-divider"></div>
                <div class="menu-label">Tools</div>

                <a href="${interventionsHref}" class="${this._menuItemClass('interventions', activePage, isInterventions)}" ${isInterventions ? '' : navClick}>
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#interventions"></use></svg>
                    <span>My Interventions</span>
                </a>
                <a href="#" class="menu-item disabled">
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#action-export"></use></svg>
                    <span>Export Notes</span>
                </a>

                <div class="menu-divider"></div>
                <div class="menu-label">Account</div>

                <a href="${settingsHref}" class="${this._menuItemClass('settings', activePage, isSettings)}" ${isSettings ? '' : navClick}>
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#settings"></use></svg>
                    <span>Settings</span>
                </a>
                <a href="${usersHref}" class="${this._menuItemClass('users', activePage, isUsers)}" x-show="isAdmin()" ${isUsers ? '' : navClick}>
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#admin-users"></use></svg>
                    <span>User Management</span>
                </a>
                <a href="#" class="menu-item disabled">
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#help"></use></svg>
                    <span>Help & Support</span>
                </a>
            </div>

            <div class="drawer-footer">
                ${showUserInfo ? this._getUserInfoFooter() : this._getBackFooter()}
            </div>
        </nav>
        `;
    },

    /**
     * Footer with user email and logout (for Documents page)
     */
    _getUserInfoFooter() {
        return `
                <div class="text-sm text-neutral-600 mb-3" x-text="userEmail"></div>
                <button @click="logout" class="btn btn-ghost w-full text-danger-600 hover:bg-danger-50">
                    <svg class="icon mr-2"><use href="./assets/icons/tabler-sprites.svg#action-logout"></use></svg>
                    <span>Sign Out</span>
                </button>
        `;
    },

    /**
     * Footer with "Back to Documents" link (for other pages)
     */
    _getBackFooter() {
        return `
                <a href="documents.html" class="btn btn-ghost w-full text-primary-600 hover:bg-primary-50">
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#back"></use></svg>
                    <span>Back to Documents</span>
                </a>
        `;
    }
};
