/**
 * Thinking Spinner Component
 *
 * Provides a SMIL-animated thinking spinner as a Web Component.
 * Must be initialized before spinners are rendered.
 *
 * Usage:
 *   1. Import and call ThinkingSpinner.init() in your entry file
 *   2. Use <thinking-spinner></thinking-spinner> or <thinking-spinner class="icon-lg"></thinking-spinner>
 *
 * The component automatically:
 *   - Injects required SVG definitions into the document
 *   - Registers the <thinking-spinner> custom element
 *   - Adds 'icon' class for base sizing and alignment
 *   - Size modifiers (icon-sm, icon-lg) work directly on the element
 *   - Inherits currentColor for theming
 */

/**
 * Custom element for the thinking spinner
 */
class ThinkingSpinnerElement extends HTMLElement {
    connectedCallback() {
        // Make the custom element the layout box with icon sizing
        // This ensures proper alignment with text
        this.classList.add('icon');

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('fill', 'currentColor');

        const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        use.setAttribute('href', '#thinking-spinner');
        svg.appendChild(use);

        this.appendChild(svg);
    }
}

export const ThinkingSpinner = {
    /**
     * Initialize by injecting SVG definitions and registering the custom element
     */
    init() {
        // Register custom element if not already registered
        if (!customElements.get('thinking-spinner')) {
            customElements.define('thinking-spinner', ThinkingSpinnerElement);
        }

        // Only inject SVG defs once
        if (document.getElementById('thinking-spinner-defs')) {
            return;
        }

        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._inject());
        } else {
            this._inject();
        }
    },

    /**
     * Inject SVG definitions into the document
     */
    _inject() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.id = 'thinking-spinner-defs';
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';
        svg.innerHTML = `
            <symbol id="thinking-spinner" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="6" cy="6" r="5">
                    <animate id="A1" begin="0;C4.end" attributeName="cx" dur="0.3s" values="6;18" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="A2" begin="C1.end" attributeName="cy" dur="0.3s" values="6;18" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="A3" begin="C2.end" attributeName="cx" dur="0.3s" values="18;6" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="A4" begin="C3.end" attributeName="cy" dur="0.3s" values="18;6" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                </circle>
                <circle cx="6" cy="18" r="5">
                    <animate id="B1" begin="A1.end" attributeName="cy" dur="0.3s" values="18;6" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="B2" begin="A2.end" attributeName="cx" dur="0.3s" values="6;18" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="B3" begin="A3.end" attributeName="cy" dur="0.3s" values="6;18" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="B4" begin="A4.end" attributeName="cx" dur="0.3s" values="18;6" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                </circle>
                <circle cx="18" cy="18" r="5">
                    <animate id="C1" begin="B1.end" attributeName="cx" dur="0.3s" values="18;6" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="C2" begin="B2.end" attributeName="cy" dur="0.3s" values="18;6" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="C3" begin="B3.end" attributeName="cx" dur="0.3s" values="6;18" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                    <animate id="C4" begin="B4.end" attributeName="cy" dur="0.3s" values="6;18" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.42 0 0.58 1"/>
                </circle>
            </symbol>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(svg, document.body.firstChild);
    }
};
