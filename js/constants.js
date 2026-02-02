/**
 * Application Constants
 *
 * Shared constants used across the application.
 */

/**
 * Therapeutic Approaches
 *
 * Used in:
 * - Progress Notes form (therapeutic approaches selection)
 * - Intervention Lexicon (approach tags for interventions)
 *
 * The 'other' option is handled separately in the template
 * since it requires an additional text input field.
 */
export const TherapeuticApproaches = [
    { value: "attachment-based-therapy", name: "Attachment" },
    { value: "coherence-therapy", name: "Coherence" },
    { value: "emotion-focused-therapy", name: "Emotion Focused" },
    { value: "feminist-therapy", name: "Feminist" },
    { value: "humanistic-therapy", name: "Humanistic" },
    { value: "parts-work-therapy", name: "Parts Work" },
    { value: "psychodynamic-therapy", name: "Psychodynamic" },
    { value: "somatic-therapy", name: "Somatic" },
    { value: "general", name: "General" }
];
