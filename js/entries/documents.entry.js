/**
 * Entry point for documents.html (main documents page)
 */

import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/module.esm.js';
import collapse from 'https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/module.esm.js';
import { NavDrawer } from '../components/drawer.js';
import { Spinner } from '../components/spinner.js';
import { CacheManager, CacheKeys, CacheTTL } from '../cacheManager.js';
import { ThinkingSpinner } from '../components/thinkingSpinner.js';
import { NewClientModal } from '../components/newClientModal.js';
import { DraftSwitchModal } from '../components/draftSwitchModal.js';
import { DraftSelectionModal } from '../components/draftSelectionModal.js';
import { createAppData } from '../app.js';
import { getPresentingIssues, getAllInterventions, getApproaches } from '../clinicalReferenceData.js';

// Make clinical reference data available to Alpine templates
window.getPresentingIssues = getPresentingIssues;
window.getAllInterventions = getAllInterventions;
window.getApproaches = getApproaches;

// Make cache manager available globally
window.CacheManager = CacheManager;
window.CacheKeys = CacheKeys;
window.CacheTTL = CacheTTL;

// Initialize components
NavDrawer.init({ activePage: 'documents', showUserInfo: true });
Spinner.init();
ThinkingSpinner.init();
NewClientModal.init();
DraftSwitchModal.init();
DraftSelectionModal.init();

// Setup Alpine
window.Alpine = Alpine;
Alpine.plugin(collapse);
Alpine.data('app', createAppData);
Alpine.start();
