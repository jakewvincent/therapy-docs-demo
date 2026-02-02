/**
 * Draft Selection Modal Component
 *
 * Displays available drafts when selecting a client that has saved drafts.
 * Allows user to:
 * - Select and continue a previous draft
 * - Delete individual drafts
 * - Start fresh with an empty form
 *
 * Must be loaded before Alpine.js initializes.
 */

import { Logger } from '../logger.js';

export const DraftSelectionModal = {
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
        const container = document.getElementById('draft-selection-modal');
        if (!container) {
            Logger.warn('DraftSelectionModal: No #draft-selection-modal element found');
            return;
        }
        container.innerHTML = this._getHTML();
    },

    /**
     * Generate the modal HTML
     */
    _getHTML() {
        return `
        <!-- Draft Selection Modal Overlay -->
        <div
            x-cloak
            x-show="showDraftSelectionModal"
            x-transition:enter="transition ease-out duration-200"
            x-transition:enter-start="opacity-0"
            x-transition:enter-end="opacity-100"
            x-transition:leave="transition ease-in duration-150"
            x-transition:leave-start="opacity-100"
            x-transition:leave-end="opacity-0"
            class="modal-overlay"
            @keydown.escape.window="showDraftSelectionModal && startFreshForm()"
        >
            <div class="card w-full max-w-md bg-white">
                <!-- Header -->
                <div class="text-center mb-6">
                    <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-primary-600 mb-4">
                        <svg class="icon icon-xl"><use href="./assets/icons/tabler-sprites.svg#draft-list"></use></svg>
                    </div>
                    <h2 class="text-xl font-bold text-neutral-900 mb-2">Continue a Draft?</h2>
                    <p class="text-neutral-600">
                        You have saved drafts for this client.
                    </p>
                </div>

                <!-- Draft List -->
                <div class="space-y-2 mb-6 max-h-64 overflow-y-auto">
                    <template x-for="draft in availableDrafts" :key="draft.uuid">
                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                class="btn-checkbox-row flex-1"
                                :class="{ 'checked': selectedDraftUUID === draft.uuid }"
                                @click="selectedDraftUUID = draft.uuid"
                            >
                                <svg class="icon icon-md"><use :href="selectedDraftUUID === draft.uuid ? './assets/icons/tabler-sprites.svg#radio-checked' : './assets/icons/tabler-sprites.svg#radio-unchecked'"></use></svg>
                                <div class="btn-checkbox-row-content">
                                    <div class="btn-checkbox-row-title">
                                        Session: <span x-text="DraftStorage.formatSessionDate(draft.sessionDate)"></span>
                                    </div>
                                    <div class="btn-checkbox-row-description">
                                        Saved <span x-text="DraftStorage.formatSavedAt(draft.savedAt)"></span>
                                    </div>
                                </div>
                            </button>
                            <button
                                type="button"
                                @click="deleteSelectedDraft(draft.uuid)"
                                class="btn btn-ghost btn-icon text-neutral-400 hover:text-danger-600 hover:bg-danger-50"
                                title="Delete this draft"
                            >
                                <svg class="icon"><use href="./assets/icons/tabler-sprites.svg#action-delete"></use></svg>
                            </button>
                        </div>
                    </template>
                </div>

                <!-- Action buttons -->
                <div class="flex flex-col gap-3">
                    <button
                        @click="continueSelectedDraft()"
                        class="btn btn-primary w-full"
                        :disabled="!selectedDraftUUID"
                    >
                        <svg class="icon mr-2"><use href="./assets/icons/tabler-sprites.svg#draft-continue"></use></svg>
                        Continue Selected Draft
                    </button>

                    <button
                        @click="startFreshForm()"
                        class="btn btn-secondary w-full"
                    >
                        <svg class="icon mr-2"><use href="./assets/icons/tabler-sprites.svg#document-new"></use></svg>
                        Start Fresh
                    </button>
                </div>
            </div>
        </div>
        `;
    }
};
