/**
 * Draft Switch Modal Component
 *
 * Displays options when switching clients with unsaved form content:
 * - Save Draft: Save current form as draft for previous client
 * - Move to Client: Keep form content, associate with new client
 * - Discard: Clear form and switch to new client
 *
 * Must be loaded before Alpine.js initializes.
 */

import { Logger } from '../logger.js';

export const DraftSwitchModal = {
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
        const container = document.getElementById('draft-switch-modal');
        if (!container) {
            Logger.warn('DraftSwitchModal: No #draft-switch-modal element found');
            return;
        }
        container.innerHTML = this._getHTML();
    },

    /**
     * Generate the modal HTML
     * Uses Alpine data bindings for dynamic client names
     */
    _getHTML() {
        return `
        <!-- Draft Switch Modal Overlay -->
        <div
            x-cloak
            x-show="showDraftSwitchModal"
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition ease-in duration-150"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="modal-overlay"
            @keydown.escape.window="showDraftSwitchModal && cancelClientSwitch()"
        >
            <div class="card w-full max-w-md bg-white relative">
                <!-- Close button (X) -->
                <button
                    @click="cancelClientSwitch()"
                    class="modal-close-btn absolute top-4 right-4"
                    aria-label="Close"
                >
                    <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#close"></use></svg>
                </button>

                <!-- Icon and message -->
                <div class="text-center mb-6 pr-8">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                        <svg class="icon icon-xl"><use href="./assets/icons/custom-sprites.svg#action-save"></use></svg>
                    </div>
                    <h2 class="text-xl font-bold text-neutral-900 mb-2">Unsaved Form Content</h2>
                    <p class="text-neutral-600">
                        You have unsaved content in this form. What would you like to do?
                    </p>
                </div>

                <!-- Action buttons - stacked for tablet -->
                <div class="flex flex-col gap-3">
                    <!-- Save Draft Option -->
                    <button
                        @click="handleDraftSave()"
                        class="btn btn-primary w-full text-left"
                    >
                        <div class="flex items-center">
                            <svg class="icon mr-3"><use href="./assets/icons/custom-sprites.svg#action-save"></use></svg>
                            <div>
                                <div class="font-medium">Save Draft</div>
                                <div class="text-xs opacity-80">
                                    Save for <span x-text="getPreviousClientName()"></span>
                                </div>
                            </div>
                        </div>
                    </button>

                    <!-- Move to New Client Option (only if switching TO a client, not deselecting) -->
                    <button
                        x-show="pendingClientId"
                        @click="handleDraftMove()"
                        class="btn btn-secondary w-full text-left"
                    >
                        <div class="flex items-center">
                            <svg class="icon mr-3"><use href="./assets/icons/tabler-sprites.svg#switch-client"></use></svg>
                            <div>
                                <div class="font-medium">Move to New Client</div>
                                <div class="text-xs opacity-80">
                                    Transfer to <span x-text="getPendingClientName()"></span>
                                </div>
                            </div>
                        </div>
                    </button>

                    <!-- Discard Option -->
                    <button
                        @click="handleDraftDiscard()"
                        class="btn btn-ghost w-full text-danger-600 hover:bg-danger-50"
                    >
                        <svg class="icon mr-2"><use href="./assets/icons/tabler-sprites.svg#action-delete"></use></svg>
                        Discard Changes
                    </button>
                </div>
            </div>
        </div>
        `;
    }
};
