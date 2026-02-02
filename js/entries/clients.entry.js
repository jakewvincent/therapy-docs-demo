/**
 * Entry point for clients.html (client dashboard)
 */

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import collapse from 'https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/module.esm.js';
import { NavDrawer } from '../components/drawer.js';
import { Spinner } from '../components/spinner.js';
import { NewClientModal } from '../components/newClientModal.js';
import { CacheManager, CacheKeys, CacheTTL } from '../cacheManager.js';
import { createClientsDashboardData } from '../clientsDashboard.js';

// Make cache manager available globally
window.CacheManager = CacheManager;
window.CacheKeys = CacheKeys;
window.CacheTTL = CacheTTL;

// Initialize components
NavDrawer.init({ activePage: 'clients', showUserInfo: true });
Spinner.init();
NewClientModal.init();

// Setup Alpine
window.Alpine = Alpine;
Alpine.plugin(collapse);
Alpine.data('clientsDashboard', createClientsDashboardData);
Alpine.start();
