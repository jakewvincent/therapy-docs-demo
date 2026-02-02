/**
 * Entry point for index.html (login page)
 */

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import { Spinner } from '../components/spinner.js';
import { CacheManager, CacheKeys, CacheTTL } from '../cacheManager.js';
import { createLoginAppData } from '../login.js';

// Make cache manager available globally (needed for prefetching)
window.CacheManager = CacheManager;
window.CacheKeys = CacheKeys;
window.CacheTTL = CacheTTL;

// Initialize components
Spinner.init();

// Setup Alpine
window.Alpine = Alpine;
Alpine.data('loginApp', createLoginAppData);
Alpine.start();
