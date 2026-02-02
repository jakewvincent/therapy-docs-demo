/**
 * Entry point for users.html (admin user management)
 */

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import collapse from 'https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/module.esm.js';
import { NavDrawer } from '../components/drawer.js';
import { Spinner } from '../components/spinner.js';
import { createUsersAppData } from '../users.js';

// Initialize components
NavDrawer.init({ activePage: 'users', showUserInfo: true });
Spinner.init();

// Setup Alpine
window.Alpine = Alpine;
Alpine.plugin(collapse);
Alpine.data('usersApp', createUsersAppData);
Alpine.start();
