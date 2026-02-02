/**
 * Shared New Client Modal Component
 *
 * Generates consistent modal HTML across all pages.
 * Must be loaded before Alpine.js initializes.
 *
 * Usage:
 *   1. Include this script in <head> after api.js
 *   2. Add <div id="new-client-modal"></div> inside your Alpine x-data element
 *   3. Call NewClientModal.init() before Alpine loads
 *   4. Merge NewClientModal.alpineData into your Alpine component
 *   5. Implement createClient() in your Alpine component (page-specific behavior)
 */

import { Logger } from '../logger.js';

export const NewClientModal = {
    /**
     * Initialize the modal by injecting HTML into the placeholder
     */
    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._inject());
        } else {
            this._inject();
        }
    },

    /**
     * Inject modal HTML into the placeholder
     */
    _inject() {
        const container = document.getElementById('new-client-modal');
        if (!container) {
            Logger.warn('NewClientModal: No #new-client-modal element found');
            return;
        }
        container.innerHTML = this._getHTML();
    },

    /**
     * Alpine.js data to merge into your component
     * Usage: x-data="{ ...NewClientModal.alpineData, ...yourData }"
     */
    alpineData: {
        showNewClientModal: false,
        creatingClient: false,
        newClient: {
            name: '',
            clientType: 'Individual',
            paymentType: 'private-pay',
            sessionBasis: '',
            referralSource: ''
        }
    },

    /**
     * Get default newClient object with settings applied
     * Call this when opening the modal to apply user's defaults
     * @param {Object} settings - The dashboard settings object
     * @returns {Object} - newClient object with defaults applied
     */
    getDefaultNewClient(settings = {}) {
        const defaults = settings.newClientDefaults || {};
        return {
            name: '',
            clientType: 'Individual',
            paymentType: defaults.paymentType || 'private-pay',
            sessionBasis: defaults.sessionBasis || '',
            referralSource: ''
        };
    },

    /**
     * Generate the modal HTML
     */
    _getHTML() {
        return `
        <!-- New Client Modal Overlay -->
        <div
            x-cloak
            x-show="showNewClientModal"
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition ease-in duration-150"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="modal-overlay"
            @click.self="closeNewClientModal"
            @keydown.escape.window="showNewClientModal && closeNewClientModal()"
        >
            <!-- Modal Card -->
            <div
                class="card w-full max-w-lg bg-white"
                x-transition:enter="transition ease-out duration-200"
                x-transition:enter-start="opacity-0 scale-95"
                x-transition:enter-end="opacity-100 scale-100"
                x-transition:leave="transition ease-in duration-150"
                x-transition:leave-start="opacity-100 scale-100"
                x-transition:leave-end="opacity-0 scale-95"
                @click.stop
            >
                <!-- Header -->
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold text-neutral-900 flex items-center">
                        <svg class="icon icon-lg text-primary-600 mr-2"><use href="./assets/icons/tabler-sprites.svg#action-add-client"></use></svg>
                        Add New Client
                    </h2>
                    <button
                        type="button"
                        @click="closeNewClientModal"
                        class="text-neutral-400 hover:text-neutral-600 p-2 -m-2"
                        :disabled="creatingClient"
                    >
                        <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#close"></use></svg>
                    </button>
                </div>

                <!-- Form -->
                <form @submit.prevent="createClient">
                    <div class="space-y-4">
                        <!-- Row 1: Name and Client Type -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label" for="new-client-name">Name/Initials</label>
                                <input
                                    type="text"
                                    id="new-client-name"
                                    x-model="newClient.name"
                                    class="form-input"
                                    placeholder="e.g., JaDo, JaDo&JoDo, ..."
                                    required
                                    :disabled="creatingClient"
                                >
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="new-client-type">Client Type</label>
                                <select
                                    id="new-client-type"
                                    x-model="newClient.clientType"
                                    class="form-select"
                                    :disabled="creatingClient"
                                >
                                    <option value="Individual">Individual</option>
                                    <option value="Couple">Couple</option>
                                    <option value="Family">Family</option>
                                    <option value="Partner">Partner</option>
                                    <option value="Consultation">Consultation</option>
                                </select>
                            </div>
                        </div>

                        <!-- Row 2: Payment Type and Session Basis -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label" for="new-client-payment">Payment Type</label>
                                <select
                                    id="new-client-payment"
                                    x-model="newClient.paymentType"
                                    class="form-select"
                                    :disabled="creatingClient"
                                >
                                    <option value="private-pay">Private Pay</option>
                                    <option value="insurance">Insurance</option>
                                    <option value="sliding-scale">Sliding Scale</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label class="form-label" for="new-client-session-basis">Session Basis</label>
                                <select
                                    id="new-client-session-basis"
                                    x-model="newClient.sessionBasis"
                                    class="form-select"
                                    :disabled="creatingClient"
                                >
                                    <option value="">Not set</option>
                                    <option value="weekly">Weekly</option>
                                    <option value="biweekly">Biweekly</option>
                                    <option value="as-needed">As Needed</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        <!-- Row 3: Referral Source -->
                        <div class="form-group">
                            <label class="form-label" for="new-client-referral">
                                Referral Source
                                <span class="text-neutral-400 font-normal">(optional)</span>
                            </label>
                            <input
                                type="text"
                                id="new-client-referral"
                                x-model="newClient.referralSource"
                                class="form-input"
                                placeholder="e.g., Psychology Today, Facebook group, ..."
                                :disabled="creatingClient"
                            >
                        </div>
                    </div>

                    <!-- Footer Buttons -->
                    <div class="flex gap-3 justify-end mt-6 pt-4 border-t border-neutral-200">
                        <button
                            type="button"
                            @click="closeNewClientModal"
                            class="btn btn-secondary"
                            :disabled="creatingClient"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="creatingClient || !newClient.name.trim()"
                        >
                            <template x-if="creatingClient">
                                <span class="flex items-center"><blob-spinner class="icon-sm mr-2"></blob-spinner>Adding...</span>
                            </template>
                            <template x-if="!creatingClient">
                                <span class="flex items-center"><svg class="icon icon-sm mr-2"><use href="./assets/icons/tabler-sprites.svg#action-submit-alt-1"></use></svg>Add Client</span>
                            </template>
                        </button>
                    </div>
                </form>
            </div>
        </div>
        `;
    }
};
