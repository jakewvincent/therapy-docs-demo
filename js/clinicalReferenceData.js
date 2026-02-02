/**
 * Clinical Reference Data
 * ES module version of clinical-reference-data.js
 * Contains 13 presenting issues and 44 interventions across 5 therapeutic approaches
 */

// ============================================================================
// INTERVENTION INDEX
// All 44 interventions across 5 therapeutic approaches
// ============================================================================

export const interventionIndex = {
    // Somatic Experiencing (SE) - 14 interventions
    "SE-1": {
        id: "SE-1",
        name: "Resourcing",
        approach: "Somatic Experiencing",
        description: "Identifying internal/external sources of safety, calm, or neutral sensations",
        requiresTraining: true
    },
    "SE-2": {
        id: "SE-2",
        name: "Pendulation",
        approach: "Somatic Experiencing",
        description: "Oscillating attention between activation/distress and resource/calm",
        requiresTraining: true
    },
    "SE-3": {
        id: "SE-3",
        name: "Titration",
        approach: "Somatic Experiencing",
        description: "Working with activation in small, tolerable doses to prevent overwhelm",
        requiresTraining: true
    },
    "SE-4": {
        id: "SE-4",
        name: "Grounding",
        approach: "Somatic Experiencing",
        description: "Present-moment sensory anchoring (feet on floor, body weight, breath)",
        requiresTraining: true
    },
    "SE-5": {
        id: "SE-5",
        name: "Tracking sensations",
        approach: "Somatic Experiencing",
        description: "Noticing body sensations, impulses, shifts without judgment",
        requiresTraining: true
    },
    "SE-6": {
        id: "SE-6",
        name: "Completing defensive responses",
        approach: "Somatic Experiencing",
        description: "Allowing thwarted fight/flight responses to discharge safely",
        requiresTraining: true
    },
    "SE-7": {
        id: "SE-7",
        name: "Interoceptive awareness",
        approach: "Somatic Experiencing",
        description: "Building awareness of internal body signals (hunger, fatigue, emotions)",
        requiresTraining: true
    },
    "SE-8": {
        id: "SE-8",
        name: "Orienting",
        approach: "Somatic Experiencing",
        description: "Using eyes/senses to scan environment for safety cues",
        requiresTraining: true
    },
    "SE-9": {
        id: "SE-9",
        name: "Co-regulation",
        approach: "Somatic Experiencing",
        description: "Using therapist's regulated nervous system as anchor",
        requiresTraining: true
    },
    "SE-10": {
        id: "SE-10",
        name: "Discharge",
        approach: "Somatic Experiencing",
        description: "Allowing tremoring, shaking, movement to complete stress cycle",
        requiresTraining: true
    },
    "SE-11": {
        id: "SE-11",
        name: "Neuroception work",
        approach: "Somatic Experiencing",
        description: "Training nervous system to recognize safety vs threat cues",
        requiresTraining: true
    },
    "SE-12": {
        id: "SE-12",
        name: "Window of tolerance education",
        approach: "Somatic Experiencing",
        description: "Teaching about nervous system states and capacity",
        requiresTraining: true
    },
    "SE-13": {
        id: "SE-13",
        name: "Gentle mobilization",
        approach: "Somatic Experiencing",
        description: "Inviting movement without pressure (respecting low energy states)",
        requiresTraining: true
    },
    "SE-14": {
        id: "SE-14",
        name: "Container work",
        approach: "Somatic Experiencing",
        description: "Creating time/place boundaries for processing (not constant flooding)",
        requiresTraining: true
    },

    // Coherence Therapy (CT) - 5 interventions
    "CT-1": {
        id: "CT-1",
        name: "Pro-symptom exploration",
        approach: "Coherence Therapy",
        description: "Understanding what symptom accomplishes/prevents (adaptive function)",
        requiresTraining: false
    },
    "CT-2": {
        id: "CT-2",
        name: "Emotional learning identification",
        approach: "Coherence Therapy",
        description: "Surfacing implicit beliefs and schemas driving symptoms",
        requiresTraining: false
    },
    "CT-3": {
        id: "CT-3",
        name: "Memory reconsolidation",
        approach: "Coherence Therapy",
        description: "Updating implicit emotional learnings through juxtaposition experiences",
        requiresTraining: false
    },
    "CT-4": {
        id: "CT-4",
        name: "Transformational experience creation",
        approach: "Coherence Therapy",
        description: "Facilitating disconfirming emotional experiences",
        requiresTraining: false
    },
    "CT-5": {
        id: "CT-5",
        name: "Symptom coherence mapping",
        approach: "Coherence Therapy",
        description: "Tracing how symptom makes sense given emotional learning",
        requiresTraining: false
    },

    // Parts Work (PW) - Internal Family Systems - 7 interventions
    "PW-1": {
        id: "PW-1",
        name: "Parts mapping/identification",
        approach: "Parts Work (IFS)",
        description: "Identifying protective parts, exiles, and firefighters in system",
        requiresTraining: true
    },
    "PW-2": {
        id: "PW-2",
        name: "Protector work",
        approach: "Parts Work (IFS)",
        description: "Building relationship with protective parts, understanding their role",
        requiresTraining: true
    },
    "PW-3": {
        id: "PW-3",
        name: "Exile accessing and unburdening",
        approach: "Parts Work (IFS)",
        description: "Working with wounded parts carrying pain/shame (only from Self)",
        requiresTraining: true
    },
    "PW-4": {
        id: "PW-4",
        name: "Self-energy cultivation",
        approach: "Parts Work (IFS)",
        description: "Strengthening calm, curious, compassionate witness presence",
        requiresTraining: true
    },
    "PW-5": {
        id: "PW-5",
        name: "Parts negotiation",
        approach: "Parts Work (IFS)",
        description: "Dialogue between parts or with parts about their protective strategies",
        requiresTraining: true
    },
    "PW-6": {
        id: "PW-6",
        name: "Unblending",
        approach: "Parts Work (IFS)",
        description: "Separating from parts to observe without being hijacked",
        requiresTraining: true
    },
    "PW-7": {
        id: "PW-7",
        name: "Integration work",
        approach: "Parts Work (IFS)",
        description: "Helping parts work together vs in conflict",
        requiresTraining: true
    },

    // Attachment-Based Therapy (AT) - 8 interventions
    "AT-1": {
        id: "AT-1",
        name: "Secure base provision",
        approach: "Attachment-Based",
        description: "Therapist as consistent, safe, predictable presence",
        requiresTraining: false
    },
    "AT-2": {
        id: "AT-2",
        name: "Rupture/repair work",
        approach: "Attachment-Based",
        description: "Naming and processing breaks in therapeutic alliance",
        requiresTraining: false
    },
    "AT-3": {
        id: "AT-3",
        name: "Relational template exploration",
        approach: "Attachment-Based",
        description: "Identifying implicit relational beliefs and expectations",
        requiresTraining: false
    },
    "AT-4": {
        id: "AT-4",
        name: "Attachment pattern awareness",
        approach: "Attachment-Based",
        description: "Understanding anxious/avoidant/disorganized patterns in relationships",
        requiresTraining: false
    },
    "AT-5": {
        id: "AT-5",
        name: "Therapeutic relationship as laboratory",
        approach: "Attachment-Based",
        description: "Using therapy relationship to practice new relational patterns",
        requiresTraining: false
    },
    "AT-6": {
        id: "AT-6",
        name: "Mentalizing support",
        approach: "Attachment-Based",
        description: "Helping client understand own and others' mental states",
        requiresTraining: false
    },
    "AT-7": {
        id: "AT-7",
        name: "Dependency tolerance",
        approach: "Attachment-Based",
        description: "Allowing appropriate dependency during distress",
        requiresTraining: false
    },
    "AT-8": {
        id: "AT-8",
        name: "Separation/absence work",
        approach: "Attachment-Based",
        description: "Processing therapist absences, building object constancy",
        requiresTraining: false
    },

    // Feminist Therapy (FT) - 10 interventions
    "FT-1": {
        id: "FT-1",
        name: "Power analysis",
        approach: "Feminist Therapy",
        description: "Examining systemic power dynamics and oppression",
        requiresTraining: false
    },
    "FT-2": {
        id: "FT-2",
        name: "Externalization",
        approach: "Feminist Therapy",
        description: "Locating problem in systems/oppression, not individual pathology",
        requiresTraining: false
    },
    "FT-3": {
        id: "FT-3",
        name: "Consciousness raising",
        approach: "Feminist Therapy",
        description: "Developing critical awareness of oppression and its impacts",
        requiresTraining: false
    },
    "FT-4": {
        id: "FT-4",
        name: "Empowerment strategies",
        approach: "Feminist Therapy",
        description: "Building agency, advocacy skills, and collective action",
        requiresTraining: false
    },
    "FT-5": {
        id: "FT-5",
        name: "Sociopolitical context",
        approach: "Feminist Therapy",
        description: "Connecting personal distress to societal/political factors",
        requiresTraining: false
    },
    "FT-6": {
        id: "FT-6",
        name: "Gender analysis",
        approach: "Feminist Therapy",
        description: "Examining how gender norms and expectations shape experience",
        requiresTraining: false
    },
    "FT-7": {
        id: "FT-7",
        name: "Internalized oppression work",
        approach: "Feminist Therapy",
        description: "Identifying and challenging internalized oppressive beliefs",
        requiresTraining: false
    },
    "FT-8": {
        id: "FT-8",
        name: "Validation of systemic harm",
        approach: "Feminist Therapy",
        description: "Affirming that distress is appropriate response to injustice",
        requiresTraining: false
    },
    "FT-9": {
        id: "FT-9",
        name: "Cultural identity affirmation",
        approach: "Feminist Therapy",
        description: "Celebrating and connecting to cultural identity and community",
        requiresTraining: false
    },
    "FT-10": {
        id: "FT-10",
        name: "Collective healing",
        approach: "Feminist Therapy",
        description: "Connecting to community, mutual aid, collective resistance",
        requiresTraining: false
    }
};

// ============================================================================
// PRESENTING ISSUES
// 13 presenting issues for intake forms
// Simplified structure - goals/objectives stored in treatment plan, not here
// ============================================================================

export const presentingIssues = {
    "chronic-illness": {
        id: "chronic-illness",
        name: "Chronic Illness",
        description: "Physical health conditions affecting mental health and daily functioning"
    },
    "anxiety": {
        id: "anxiety",
        name: "Anxiety",
        description: "Excessive worry, fear, or nervousness affecting daily life"
    },
    "depression": {
        id: "depression",
        name: "Depression",
        description: "Persistent sadness, low mood, or loss of interest in activities"
    },
    "cptsd": {
        id: "cptsd",
        name: "Complex PTSD",
        description: "Trauma-related symptoms from prolonged or repeated traumatic experiences"
    },
    "sociopolitical-stress": {
        id: "sociopolitical-stress",
        name: "Sociopolitical Stress",
        description: "Distress related to social, political, or systemic issues"
    },
    "burnout": {
        id: "burnout",
        name: "Burnout",
        description: "Exhaustion and reduced effectiveness from prolonged stress"
    },
    "grief-loss": {
        id: "grief-loss",
        name: "Grief & Loss",
        description: "Processing death, relationship endings, or other significant losses"
    },
    "situational-entrapment": {
        id: "situational-entrapment",
        name: "Situational Entrapment",
        description: "Feeling stuck in difficult life circumstances without clear options"
    },
    "relational-conflict": {
        id: "relational-conflict",
        name: "Relational Conflict",
        description: "Difficulties in relationships with partners, family, or others"
    },
    "adult-adhd": {
        id: "adult-adhd",
        name: "Adult ADHD",
        description: "Attention, focus, and executive function challenges in adulthood"
    },
    "race-based-trauma": {
        id: "race-based-trauma",
        name: "Race-Based Trauma",
        description: "Psychological harm from racism, discrimination, or racial violence"
    },
    "pure-o-ocd": {
        id: "pure-o-ocd",
        name: "Pure-O OCD",
        description: "Obsessive-compulsive disorder primarily with mental rituals"
    },
    "bpd": {
        id: "bpd",
        name: "Borderline Personality",
        description: "Emotional dysregulation, unstable relationships, and identity difficulties"
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get intervention details by ID
 * @param {string} id - Intervention ID (e.g., "SE-1", "CT-3")
 * @returns {Object|null} Intervention object or null if not found
 */
export function getIntervention(id) {
    return interventionIndex[id] || null;
}

/**
 * Get all interventions for a therapeutic approach
 * @param {string} approach - Approach name (e.g., "Somatic Experiencing", "Coherence Therapy")
 * @returns {Array} Array of intervention objects
 */
export function getInterventionsByApproach(approach) {
    return Object.values(interventionIndex).filter(i => i.approach === approach);
}

/**
 * Get all unique therapeutic approaches
 * @returns {Array} Array of approach names
 */
export function getApproaches() {
    const approaches = new Set(Object.values(interventionIndex).map(i => i.approach));
    return Array.from(approaches);
}

/**
 * Get presenting issue by ID
 * @param {string} id - Issue ID (e.g., "anxiety", "depression")
 * @returns {Object|null} Issue object or null if not found
 */
export function getPresentingIssue(id) {
    return presentingIssues[id] || null;
}

/**
 * Get all presenting issue IDs
 * @returns {Array} Array of issue IDs
 */
export function getPresentingIssueIds() {
    return Object.keys(presentingIssues);
}

/**
 * Get all presenting issues as array
 * @returns {Array} Array of presenting issue objects
 */
export function getPresentingIssues() {
    return Object.values(presentingIssues);
}

/**
 * Format intervention for display in forms
 * @param {Object} intervention - Intervention object
 * @returns {string} Formatted string for display
 */
export function formatInterventionForForm(intervention) {
    return `${intervention.id}: ${intervention.name}`;
}

/**
 * Get all interventions as array
 * @returns {Array} Array of all intervention objects
 */
export function getAllInterventions() {
    return Object.values(interventionIndex);
}

// Default export for convenience
export default {
    interventionIndex,
    presentingIssues,
    getIntervention,
    getInterventionsByApproach,
    getApproaches,
    getPresentingIssue,
    getPresentingIssueIds,
    getPresentingIssues,
    formatInterventionForForm,
    getAllInterventions
};
