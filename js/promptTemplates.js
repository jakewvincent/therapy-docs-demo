/**
 * Prompt Template Utilities
 *
 * Reusable functions for template handling, validation, and assembly.
 * Designed for extensibility to support future prompt types beyond narratives.
 */

import { Logger } from './logger.js';

export const PromptTemplates = {

    /**
     * Assemble a complete prompt from sections using a meta-template
     * @param {string} metaTemplate - Template with section placeholders like {{progressNoteData}}
     * @param {object} sections - Object with progressNoteData, instructions, etc.
     * @param {array} examples - Array of example objects with id, description, input, output
     * @returns {string} Assembled prompt template ready for placeholder interpolation
     */
    assemblePrompt(metaTemplate, sections, examples) {
        let result = metaTemplate;

        // Replace section placeholders
        result = result.replace('{{progressNoteData}}', sections.progressNoteData || '');
        result = result.replace('{{instructions}}', sections.instructions || '');
        result = result.replace('{{thinkingOutputFormat}}', sections.thinkingOutputFormat || '');
        result = result.replace('{{narrativeOutputFormat}}', sections.narrativeOutputFormat || '');

        // Format and insert examples
        const formattedExamples = this.formatExamples(examples);
        result = result.replace('{{examples}}', formattedExamples);

        return result;
    },

    /**
     * Format examples array into XML structure for the prompt
     * @param {array} examples - Array of example objects
     * @returns {string} Formatted examples as XML
     */
    formatExamples(examples) {
        if (!examples || examples.length === 0) {
            return '<!-- No examples provided -->';
        }

        return examples.map((ex) => {
            // Include description as XML comment if provided
            const descComment = ex.description
                ? `<!-- ${ex.description} -->\n`
                : '';

            return `<example>
${descComment}<input>
${ex.input}
</input>
<output>
${ex.output}
</output>
</example>`;
        }).join('\n\n');
    },

    /**
     * Extract required XML tags from output format specifications
     * Used to validate that example outputs contain the expected structure
     * @param {string} thinkingFormat - Thinking output format description
     * @param {string} narrativeFormat - Narrative output format description
     * @returns {object} { required: ['thinking', 'narrative'], custom: [...] }
     */
    extractRequiredTags(thinkingFormat, narrativeFormat) {
        // Helper to extract tag names from text
        const extractTags = (text) => {
            if (!text) return [];
            const tagPattern = /<([a-zA-Z_][a-zA-Z0-9_-]*)>/g;
            const tags = new Set();
            let match;
            while ((match = tagPattern.exec(text)) !== null) {
                tags.add(match[1].toLowerCase());
            }
            return Array.from(tags);
        };

        // Always require thinking and narrative wrapper tags
        const required = ['thinking', 'narrative'];

        // Extract any additional custom tags from the format descriptions
        const customFromThinking = extractTags(thinkingFormat);
        const customFromNarrative = extractTags(narrativeFormat);
        const custom = [...new Set([...customFromThinking, ...customFromNarrative])]
            .filter(t => !required.includes(t));

        return { required, custom };
    },

    /**
     * Validate that an example output contains required XML tags
     * @param {string} exampleOutput - The output section of an example
     * @param {object} requiredTags - Object from extractRequiredTags() (optional)
     * @returns {object} { valid: boolean, missing: string[] }
     */
    validateExampleOutput(exampleOutput, requiredTags = null) {
        const missing = [];

        if (!exampleOutput) {
            return { valid: false, missing: ['<thinking>', '<narrative>'] };
        }

        const output = exampleOutput.toLowerCase();

        // Check for required wrapper tags (always thinking and narrative)
        if (!output.includes('<thinking>') || !output.includes('</thinking>')) {
            missing.push('<thinking>');
        }
        if (!output.includes('<narrative>') || !output.includes('</narrative>')) {
            missing.push('<narrative>');
        }

        return {
            valid: missing.length === 0,
            missing
        };
    },

    /**
     * Create a new empty example with unique ID
     * @returns {object} New example object with id, description, input, output
     */
    createExample() {
        return {
            id: `example-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            description: '',
            input: '',
            output: ''
        };
    },

    /**
     * Deep clone examples array to avoid reference issues
     * @param {array} examples - Array of example objects
     * @returns {array} Deep cloned array
     */
    cloneExamples(examples) {
        if (!examples) return [];
        return JSON.parse(JSON.stringify(examples));
    },

    /**
     * Deep clone sections object to avoid reference issues
     * @param {object} sections - Sections object
     * @returns {object} Deep cloned object
     */
    cloneSections(sections) {
        if (!sections) return {};
        return JSON.parse(JSON.stringify(sections));
    }
};

// Export for use in Alpine templates
window.PromptTemplates = PromptTemplates;
