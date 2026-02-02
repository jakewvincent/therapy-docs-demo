/**
 * Entry point for interventions.html
 */

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import collapse from 'https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/module.esm.js';
import { NavDrawer } from '../components/drawer.js';
import { Spinner } from '../components/spinner.js';
import { CacheManager, CacheKeys, CacheTTL } from '../cacheManager.js';
import { createMyInterventionsData } from '../myInterventions.js';

// Make cache manager available globally
window.CacheManager = CacheManager;
window.CacheKeys = CacheKeys;
window.CacheTTL = CacheTTL;

// Initialize components
NavDrawer.init({ activePage: 'interventions', showUserInfo: true });
Spinner.init();

// Setup Alpine
window.Alpine = Alpine;
Alpine.plugin(collapse);
Alpine.data('myInterventions', createMyInterventionsData);
Alpine.start();
