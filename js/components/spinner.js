/**
 * Spinner Component
 *
 * Provides a SMIL-animated blob spinner as a Web Component.
 * Must be initialized before spinners are rendered.
 *
 * Usage:
 *   1. Import and call Spinner.init() in your entry file
 *   2. Use <blob-spinner></blob-spinner> or <blob-spinner class="icon-lg"></blob-spinner>
 *
 * The component automatically:
 *   - Injects required SVG definitions into the document
 *   - Registers the <blob-spinner> custom element
 *   - Adds 'icon' class for base sizing and alignment
 *   - Size modifiers (icon-sm, icon-lg) work directly on the element
 *   - Inherits currentColor for theming
 */

/**
 * Custom element for the blob spinner
 */
class BlobSpinner extends HTMLElement {
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
        use.setAttribute('href', '#blob-spinner');
        svg.appendChild(use);

        this.appendChild(svg);
    }
}

export const Spinner = {
    /**
     * Initialize by injecting SVG definitions and registering the custom element
     */
    init() {
        // Register custom element if not already registered
        if (!customElements.get('blob-spinner')) {
            customElements.define('blob-spinner', BlobSpinner);
        }

        // Only inject SVG defs once
        if (document.getElementById('spinner-defs')) {
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
        svg.id = 'spinner-defs';
        svg.setAttribute('width', '0');
        svg.setAttribute('height', '0');
        svg.style.position = 'absolute';
        svg.innerHTML = `
            <defs>
                <filter id="blob-goo">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="1" result="blur"/>
                    <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo"/>
                    <feBlend in="SourceGraphic" in2="goo"/>
                </filter>
            </defs>
            <symbol id="blob-spinner" viewBox="0 0 24 24">
                <g fill="currentColor" filter="url(#blob-goo)">
                    <circle cx="5" cy="12" r="4">
                        <animate attributeName="cx" calcMode="spline" dur="2s" values="5;8;5" keySplines=".36,.62,.43,.99;.79,0,.58,.57" repeatCount="indefinite"/>
                    </circle>
                    <circle cx="19" cy="12" r="4">
                        <animate attributeName="cx" calcMode="spline" dur="2s" values="19;16;19" keySplines=".36,.62,.43,.99;.79,0,.58,.57" repeatCount="indefinite"/>
                    </circle>
                    <animateTransform attributeName="transform" type="rotate" dur="0.75s" values="0 12 12;360 12 12" repeatCount="indefinite"/>
                </g>
            </symbol>
        `;

        // Insert at the beginning of body
        document.body.insertBefore(svg, document.body.firstChild);
    }
};
