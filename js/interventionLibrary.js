/**
 * Intervention Library
 *
 * Flat array of pre-built interventions for the hybrid intervention selector.
 * Each intervention has:
 *   - id: Unique identifier (kebab-case)
 *   - label: Full display phrase
 *   - theme: Searchable keyword/category
 *   - approaches: Array of therapeutic approach values (empty = general/all)
 *   - description: Brief clinical description
 *
 * Approach values match TherapeuticApproaches in constants.js:
 *   - "general" (applies to all modalities)
 *   - "attachment-based-therapy"
 *   - "coherence-therapy"
 *   - "emotion-focused-therapy"
 *   - "feminist-therapy"
 *   - "humanistic-therapy"
 *   - "parts-work-therapy"
 *   - "psychodynamic-therapy"
 *   - "somatic-therapy"
 */

export const InterventionLibrary = [
    // ========================================
    // GENERAL / COMMON INTERVENTIONS
    // ========================================
    {
        id: "rapport",
        label: "Built rapport",
        theme: "rapport",
        approaches: ["general"],
        description: "Foundational relationship building"
    },
    {
        id: "therapeutic-alliance",
        label: "Built therapeutic alliance",
        theme: "alliance",
        approaches: ["general"],
        description: "Strengthened collaborative working relationship"
    },
    {
        id: "trust",
        label: "Built trust",
        theme: "trust",
        approaches: ["general"],
        description: "Established safety in therapeutic relationship"
    },
    {
        id: "self-awareness",
        label: "Facilitated self-awareness",
        theme: "self-awareness",
        approaches: ["general", "humanistic-therapy"],
        description: "Supported recognition of patterns and reactions"
    },
    {
        id: "psychoeducation",
        label: "Provided psychoeducation",
        theme: "psychoeducation",
        approaches: ["general"],
        description: "Shared information to increase understanding"
    },
    {
        id: "psychoeducation-anxiety",
        label: "Provided psychoeducation on anxiety",
        theme: "psychoeducation anxiety",
        approaches: ["general"],
        description: "Explained anxiety physiology and patterns"
    },
    {
        id: "psychoeducation-depression",
        label: "Provided psychoeducation on depression",
        theme: "psychoeducation depression",
        approaches: ["general"],
        description: "Discussed depression symptoms and treatment"
    },
    {
        id: "psychoeducation-trauma",
        label: "Provided psychoeducation on trauma",
        theme: "psychoeducation trauma",
        approaches: ["general"],
        description: "Explained trauma responses and healing"
    },
    {
        id: "psychoeducation-attachment",
        label: "Provided psychoeducation on attachment",
        theme: "psychoeducation attachment",
        approaches: ["general", "attachment-based-therapy"],
        description: "Explained attachment styles and patterns"
    },
    {
        id: "psychoeducation-grief",
        label: "Provided psychoeducation on grief",
        theme: "psychoeducation grief",
        approaches: ["general"],
        description: "Discussed grief responses and healing process"
    },
    {
        id: "normalization",
        label: "Normalized client experience",
        theme: "normalization",
        approaches: ["general"],
        description: "Validated that reactions are common"
    },
    {
        id: "normalization-anxiety",
        label: "Normalized anxiety symptoms",
        theme: "normalization anxiety",
        approaches: ["general"],
        description: "Contextualized anxiety as natural response"
    },
    {
        id: "normalization-grief",
        label: "Normalized grief response",
        theme: "normalization grief",
        approaches: ["general"],
        description: "Validated varied grief experience"
    },
    {
        id: "normalization-ambivalence",
        label: "Normalized ambivalence",
        theme: "normalization ambivalence",
        approaches: ["general"],
        description: "Validated mixed feelings as normal"
    },
    {
        id: "validation-emotions",
        label: "Validated client emotions",
        theme: "validation",
        approaches: ["general", "humanistic-therapy"],
        description: "Affirmed legitimacy of emotional experience"
    },
    {
        id: "validation-perspective",
        label: "Validated client perspective",
        theme: "validation perspective",
        approaches: ["general", "humanistic-therapy"],
        description: "Affirmed client's viewpoint as understandable"
    },
    {
        id: "strengths",
        label: "Explored client strengths",
        theme: "strengths",
        approaches: ["general", "humanistic-therapy"],
        description: "Identified existing capabilities"
    },
    {
        id: "safety-planning",
        label: "Facilitated safety planning",
        theme: "safety",
        approaches: ["general"],
        description: "Developed crisis management strategies"
    },
    {
        id: "homework-assigned",
        label: "Assigned homework",
        theme: "homework",
        approaches: ["general"],
        description: "Provided between-session activities"
    },
    {
        id: "homework-reviewed",
        label: "Reviewed homework",
        theme: "homework review",
        approaches: ["general"],
        description: "Discussed practice and learning"
    },
    {
        id: "support",
        label: "Provided support",
        theme: "support",
        approaches: ["general"],
        description: "Offered emotional presence and care"
    },
    {
        id: "self-compassion",
        label: "Encouraged self-compassion",
        theme: "self-compassion",
        approaches: ["general", "humanistic-therapy"],
        description: "Supported kindness toward self"
    },

    // ========================================
    // MINDFULNESS / PRESENT MOMENT
    // ========================================
    {
        id: "present-moment",
        label: "Encouraged present moment awareness",
        theme: "present moment",
        approaches: ["general", "somatic-therapy"],
        description: "Guided attention to current experience"
    },
    {
        id: "present-moment-anchored",
        label: "Anchored to present moment",
        theme: "present moment grounding",
        approaches: ["general", "somatic-therapy"],
        description: "Used grounding to orient to here-and-now"
    },
    {
        id: "mindfulness",
        label: "Facilitated mindfulness exercise",
        theme: "mindfulness",
        approaches: ["general", "somatic-therapy"],
        description: "Led structured mindfulness practice"
    },
    {
        id: "breathing",
        label: "Facilitated breathing exercise",
        theme: "breathing",
        approaches: ["general", "somatic-therapy"],
        description: "Guided diaphragmatic or paced breathing"
    },
    {
        id: "breathing-diaphragmatic",
        label: "Facilitated diaphragmatic breathing",
        theme: "breathing diaphragmatic",
        approaches: ["general", "somatic-therapy"],
        description: "Taught belly breathing technique"
    },
    {
        id: "breathing-box",
        label: "Facilitated box breathing",
        theme: "breathing box",
        approaches: ["general", "somatic-therapy"],
        description: "Guided 4-4-4-4 breathing pattern"
    },
    {
        id: "body-scan",
        label: "Facilitated body scan",
        theme: "body scan",
        approaches: ["somatic-therapy"],
        description: "Led attention through body regions"
    },
    {
        id: "grounding",
        label: "Facilitated grounding exercise",
        theme: "grounding",
        approaches: ["general", "somatic-therapy"],
        description: "Used sensory awareness to manage distress"
    },
    {
        id: "grounding-54321",
        label: "Practiced 5-4-3-2-1 grounding technique",
        theme: "grounding 5-4-3-2-1",
        approaches: ["general", "somatic-therapy"],
        description: "Used sensory inventory to reduce overwhelm"
    },
    {
        id: "relaxation-pmr",
        label: "Facilitated progressive muscle relaxation",
        theme: "relaxation PMR",
        approaches: ["general", "somatic-therapy"],
        description: "Guided tension-release exercise"
    },

    // ========================================
    // SOMATIC / BODY-BASED
    // ========================================
    {
        id: "somatic-tracking",
        label: "Facilitated somatic tracking",
        theme: "somatic tracking",
        approaches: ["somatic-therapy"],
        description: "Guided awareness of bodily sensations without judgment"
    },
    {
        id: "somatic-awareness",
        label: "Explored body sensations",
        theme: "somatic awareness body",
        approaches: ["somatic-therapy"],
        description: "Investigated physical manifestations of emotion"
    },
    {
        id: "pendulation",
        label: "Facilitated pendulation",
        theme: "pendulation",
        approaches: ["somatic-therapy"],
        description: "Alternated between activation and regulation"
    },
    {
        id: "resource-anchoring",
        label: "Facilitated resource anchoring",
        theme: "resource anchoring",
        approaches: ["somatic-therapy"],
        description: "Established somatic connection to safety"
    },
    {
        id: "titration",
        label: "Encouraged titration of difficult material",
        theme: "titration",
        approaches: ["somatic-therapy"],
        description: "Approached trauma in small doses"
    },
    {
        id: "window-of-tolerance",
        label: "Provided window of tolerance psychoeducation",
        theme: "window of tolerance",
        approaches: ["somatic-therapy"],
        description: "Explained nervous system states and capacity for processing"
    },
    {
        id: "nervous-system",
        label: "Facilitated nervous system awareness",
        theme: "nervous system",
        approaches: ["somatic-therapy"],
        description: "Supported awareness of autonomic arousal patterns"
    },
    {
        id: "defensive-responses",
        label: "Facilitated completion of defensive responses",
        theme: "defensive responses fight flight freeze",
        approaches: ["somatic-therapy"],
        description: "Allowed thwarted fight/flight/freeze responses to discharge safely"
    },
    {
        id: "interoceptive-awareness",
        label: "Built interoceptive awareness",
        theme: "interoception interoceptive",
        approaches: ["somatic-therapy"],
        description: "Developed awareness of internal body signals (hunger, fatigue, emotional states)"
    },
    {
        id: "orienting",
        label: "Facilitated orienting",
        theme: "orienting",
        approaches: ["somatic-therapy"],
        description: "Used eyes/senses to scan environment and confirm safety"
    },
    {
        id: "co-regulation",
        label: "Provided co-regulation",
        theme: "co-regulation coregulation",
        approaches: ["somatic-therapy"],
        description: "Offered regulated nervous system presence as anchor for client's regulation"
    },
    {
        id: "discharge",
        label: "Facilitated discharge",
        theme: "discharge tremoring shaking",
        approaches: ["somatic-therapy"],
        description: "Allowed tremoring, shaking, or spontaneous movement to complete stress cycle"
    },
    {
        id: "neuroception",
        label: "Facilitated neuroception work",
        theme: "neuroception safety threat",
        approaches: ["somatic-therapy"],
        description: "Supported nervous system in distinguishing safety from threat cues"
    },
    {
        id: "gentle-mobilization",
        label: "Invited gentle mobilization",
        theme: "mobilization movement",
        approaches: ["somatic-therapy"],
        description: "Offered invitation to movement without pressure, respecting low-energy states"
    },

    // ========================================
    // EMOTION-FOCUSED THERAPY (EFT)
    // ========================================
    {
        id: "emotion-exploration",
        label: "Facilitated emotion exploration",
        theme: "emotion exploration",
        approaches: ["emotion-focused-therapy"],
        description: "Deepened awareness of feelings"
    },
    {
        id: "primary-emotion",
        label: "Explored primary emotions",
        theme: "primary emotion",
        approaches: ["emotion-focused-therapy"],
        description: "Distinguished core from secondary feelings"
    },
    {
        id: "two-chair",
        label: "Facilitated two-chair dialogue",
        theme: "two-chair",
        approaches: ["emotion-focused-therapy"],
        description: "Explored internal conflict through dialogue"
    },
    {
        id: "empty-chair",
        label: "Facilitated empty chair technique",
        theme: "empty chair",
        approaches: ["emotion-focused-therapy"],
        description: "Processed unfinished business"
    },
    {
        id: "emotional-needs",
        label: "Explored emotional needs",
        theme: "emotional needs",
        approaches: ["emotion-focused-therapy"],
        description: "Identified underlying attachment needs"
    },
    {
        id: "emotional-expression",
        label: "Encouraged emotional expression",
        theme: "emotional expression",
        approaches: ["emotion-focused-therapy"],
        description: "Supported authentic sharing"
    },
    {
        id: "shame",
        label: "Explored shame",
        theme: "shame",
        approaches: ["emotion-focused-therapy"],
        description: "Processed shame experiences"
    },
    {
        id: "anger",
        label: "Facilitated anger expression",
        theme: "anger",
        approaches: ["emotion-focused-therapy"],
        description: "Supported healthy anger processing"
    },
    {
        id: "pursuer-distancer",
        label: "Explored pursuer-distancer cycle",
        theme: "pursuer-distancer",
        approaches: ["emotion-focused-therapy"],
        description: "Named demand-withdraw pattern"
    },

    // ========================================
    // ATTACHMENT-BASED
    // ========================================
    {
        id: "attachment-patterns",
        label: "Explored attachment patterns",
        theme: "attachment",
        approaches: ["attachment-based-therapy"],
        description: "Examined relational templates"
    },
    {
        id: "attachment-wounds",
        label: "Explored attachment wounds",
        theme: "attachment wound",
        approaches: ["attachment-based-therapy"],
        description: "Recognized early relational injuries"
    },
    {
        id: "working-models",
        label: "Explored working models of relationships",
        theme: "working models relational templates",
        approaches: ["attachment-based-therapy", "psychodynamic-therapy"],
        description: "Identified implicit relational beliefs and expectations"
    },
    {
        id: "secure-base",
        label: "Facilitated secure base exploration",
        theme: "secure base",
        approaches: ["attachment-based-therapy"],
        description: "Used therapy as platform for growth"
    },
    {
        id: "imago-dialogue",
        label: "Facilitated Imago dialogue",
        theme: "Imago",
        approaches: ["attachment-based-therapy"],
        description: "Guided structured mirroring conversation"
    },
    {
        id: "mentalizing",
        label: "Supported mentalizing",
        theme: "mentalizing mentalization",
        approaches: ["attachment-based-therapy"],
        description: "Helped client understand and reflect on own and others' mental states"
    },
    {
        id: "dependency-tolerance",
        label: "Supported dependency tolerance",
        theme: "dependency reliance",
        approaches: ["attachment-based-therapy"],
        description: "Normalized appropriate reliance on therapist during distress"
    },
    {
        id: "separation-absence",
        label: "Processed separation/absence",
        theme: "separation absence object constancy",
        approaches: ["attachment-based-therapy"],
        description: "Worked with reactions to therapist absences to build object constancy"
    },

    // ========================================
    // PARTS WORK / IFS
    // ========================================
    {
        id: "parts-protective",
        label: "Identified protective parts",
        theme: "parts protective",
        approaches: ["parts-work-therapy"],
        description: "Recognized internal protective strategies"
    },
    {
        id: "parts-dialogue",
        label: "Facilitated parts dialogue",
        theme: "parts dialogue",
        approaches: ["parts-work-therapy"],
        description: "Supported communication between parts"
    },
    {
        id: "exiles",
        label: "Explored exiled parts",
        theme: "exiles",
        approaches: ["parts-work-therapy"],
        description: "Addressed wounded internal aspects"
    },
    {
        id: "self-ifs",
        label: "Encouraged Self-led perspective",
        theme: "Self IFS",
        approaches: ["parts-work-therapy"],
        description: "Accessed calm, compassionate awareness"
    },
    {
        id: "unburdening",
        label: "Facilitated unburdening process",
        theme: "unburdening",
        approaches: ["parts-work-therapy"],
        description: "Released extreme beliefs from parts"
    },
    {
        id: "managers",
        label: "Identified manager parts",
        theme: "managers",
        approaches: ["parts-work-therapy"],
        description: "Recognized proactive protective parts"
    },
    {
        id: "firefighters",
        label: "Identified firefighter parts",
        theme: "firefighters",
        approaches: ["parts-work-therapy"],
        description: "Recognized reactive protective parts"
    },
    {
        id: "parts-mapping",
        label: "Facilitated parts mapping",
        theme: "parts mapping identification",
        approaches: ["parts-work-therapy"],
        description: "Identified protective parts, exiles, and firefighters in the system"
    },
    {
        id: "parts-negotiation",
        label: "Facilitated parts negotiation",
        theme: "parts negotiation conflict",
        approaches: ["parts-work-therapy"],
        description: "Dialogue between parts about protective strategies"
    },
    {
        id: "unblending",
        label: "Facilitated unblending",
        theme: "unblending blended",
        approaches: ["parts-work-therapy"],
        description: "Supported separation from blended part to observe without being hijacked"
    },
    {
        id: "parts-integration",
        label: "Facilitated parts integration",
        theme: "parts integration",
        approaches: ["parts-work-therapy"],
        description: "Supported parts in working together collaboratively rather than in conflict"
    },
    {
        id: "self-leadership",
        label: "Strengthened Self leadership",
        theme: "Self leadership energy",
        approaches: ["parts-work-therapy"],
        description: "Built capacity for Self-led rather than parts-led responses"
    },

    // ========================================
    // PSYCHODYNAMIC
    // ========================================
    {
        id: "unconscious",
        label: "Explored unconscious patterns",
        theme: "unconscious",
        approaches: ["psychodynamic-therapy"],
        description: "Examined automatic patterns"
    },
    {
        id: "defenses",
        label: "Interpreted defense mechanisms",
        theme: "defenses",
        approaches: ["psychodynamic-therapy"],
        description: "Named protective strategies"
    },
    {
        id: "transference",
        label: "Explored transference",
        theme: "transference",
        approaches: ["psychodynamic-therapy"],
        description: "Examined responses to therapist"
    },
    {
        id: "family-of-origin",
        label: "Explored family of origin dynamics",
        theme: "family of origin",
        approaches: ["psychodynamic-therapy", "attachment-based-therapy"],
        description: "Connected patterns to early experiences"
    },
    {
        id: "insight",
        label: "Supported insight and connection-making",
        theme: "insight",
        approaches: ["psychodynamic-therapy"],
        description: "Facilitated recognition of past-present connections"
    },
    {
        id: "resistance",
        label: "Explored resistance",
        theme: "resistance",
        approaches: ["psychodynamic-therapy"],
        description: "Examined barriers to change"
    },

    // ========================================
    // COHERENCE THERAPY
    // ========================================
    {
        id: "coherence",
        label: "Explored symptom coherence",
        theme: "coherence",
        approaches: ["coherence-therapy"],
        description: "Revealed how symptoms make sense"
    },
    {
        id: "pro-symptom",
        label: "Identified pro-symptom position",
        theme: "pro-symptom",
        approaches: ["coherence-therapy"],
        description: "Uncovered emotional truth maintaining symptom"
    },
    {
        id: "transformation",
        label: "Facilitated transformational experience",
        theme: "transformation",
        approaches: ["coherence-therapy"],
        description: "Facilitated disconfirming emotional experience that challenges implicit beliefs"
    },
    {
        id: "emotional-learning",
        label: "Explored emotional learning",
        theme: "emotional learning",
        approaches: ["coherence-therapy"],
        description: "Identified implicit knowledge"
    },
    {
        id: "memory-reconsolidation",
        label: "Facilitated memory reconsolidation",
        theme: "memory reconsolidation juxtaposition",
        approaches: ["coherence-therapy"],
        description: "Updated implicit emotional learning through juxtaposition experiences"
    },
    {
        id: "discovery-process",
        label: "Facilitated discovery process",
        theme: "discovery process",
        approaches: ["coherence-therapy"],
        description: "Used CT interview technique to surface emotional truths"
    },

    // ========================================
    // HUMANISTIC / PERSON-CENTERED
    // ========================================
    {
        id: "positive-regard",
        label: "Provided unconditional positive regard",
        theme: "positive regard",
        approaches: ["humanistic-therapy"],
        description: "Offered non-judgmental acceptance"
    },
    {
        id: "reflection",
        label: "Reflected client feelings",
        theme: "reflection",
        approaches: ["humanistic-therapy"],
        description: "Mirrored emotional content"
    },
    {
        id: "self-actualization",
        label: "Encouraged self-actualization",
        theme: "self-actualization",
        approaches: ["humanistic-therapy"],
        description: "Supported authentic potential"
    },
    {
        id: "meaning",
        label: "Explored meaning-making",
        theme: "meaning",
        approaches: ["humanistic-therapy"],
        description: "Discussed values and purpose"
    },
    {
        id: "values",
        label: "Explored values",
        theme: "values",
        approaches: ["humanistic-therapy"],
        description: "Identified core priorities"
    },

    // ========================================
    // FEMINIST THERAPY
    // ========================================
    {
        id: "power-dynamics",
        label: "Explored power dynamics",
        theme: "power",
        approaches: ["feminist-therapy"],
        description: "Examined relational and systemic power"
    },
    {
        id: "social-context",
        label: "Validated social context of distress",
        theme: "social context",
        approaches: ["feminist-therapy"],
        description: "Named external factors"
    },
    {
        id: "empowerment",
        label: "Encouraged advocacy and empowerment",
        theme: "empowerment",
        approaches: ["feminist-therapy"],
        description: "Supported client agency"
    },
    {
        id: "gender-roles",
        label: "Explored gender role expectations",
        theme: "gender roles",
        approaches: ["feminist-therapy"],
        description: "Examined socialized beliefs"
    },
    {
        id: "cultural-identity",
        label: "Explored cultural identity",
        theme: "cultural identity",
        approaches: ["feminist-therapy"],
        description: "Discussed intersecting identities"
    },
    {
        id: "externalization",
        label: "Externalized problem",
        theme: "externalization systemic",
        approaches: ["feminist-therapy"],
        description: "Located problem in systems/oppression rather than individual pathology"
    },
    {
        id: "consciousness-raising",
        label: "Facilitated consciousness-raising",
        theme: "consciousness raising awareness",
        approaches: ["feminist-therapy"],
        description: "Developed critical awareness of oppression and its impacts on presenting concerns"
    },
    {
        id: "internalized-oppression",
        label: "Explored internalized oppression",
        theme: "internalized oppression",
        approaches: ["feminist-therapy"],
        description: "Identified and challenged internalized oppressive beliefs and self-concepts"
    },
    {
        id: "collective-healing",
        label: "Connected to collective healing",
        theme: "collective healing community mutual aid",
        approaches: ["feminist-therapy"],
        description: "Linked to community, mutual aid, or collective resistance as healing resource"
    },

    // ========================================
    // RELATIONSHIP / COUPLES FOCUSED
    // ========================================
    {
        id: "communication",
        label: "Facilitated communication skills practice",
        theme: "communication",
        approaches: ["general", "emotion-focused-therapy"],
        description: "Coached listening and expression"
    },
    {
        id: "relationship-patterns",
        label: "Explored relationship patterns",
        theme: "relationship patterns",
        approaches: ["general", "attachment-based-therapy"],
        description: "Identified recurring dynamics"
    },
    {
        id: "de-escalation",
        label: "Facilitated conflict de-escalation",
        theme: "de-escalation conflict",
        approaches: ["general", "emotion-focused-therapy"],
        description: "Coached regulation during disagreement"
    },
    {
        id: "conflict-attachment",
        label: "Explored underlying attachment needs in conflict",
        theme: "conflict attachment",
        approaches: ["emotion-focused-therapy", "attachment-based-therapy"],
        description: "Revealed needs driving arguments"
    },
    {
        id: "active-listening",
        label: "Facilitated active listening practice",
        theme: "active listening",
        approaches: ["general"],
        description: "Coached reflective listening"
    },

    // ========================================
    // TRAUMA-INFORMED
    // ========================================
    {
        id: "trauma-narrative",
        label: "Facilitated trauma narrative development",
        theme: "trauma narrative",
        approaches: ["general"],
        description: "Supported coherent story-telling"
    },
    {
        id: "trauma-processing",
        label: "Encouraged trauma processing at tolerable pace",
        theme: "trauma processing",
        approaches: ["general", "somatic-therapy"],
        description: "Titrated exposure to traumatic material"
    },
    {
        id: "triggers",
        label: "Explored trauma triggers",
        theme: "triggers",
        approaches: ["general"],
        description: "Recognized activating cues"
    },
    {
        id: "trauma-responses",
        label: "Explored trauma responses",
        theme: "trauma responses",
        approaches: ["general"],
        description: "Discussed fight/flight/freeze/fawn"
    },
    {
        id: "safe-place",
        label: "Facilitated safe place visualization",
        theme: "safe place",
        approaches: ["general", "somatic-therapy"],
        description: "Guided imagery of internal refuge"
    },
    {
        id: "container",
        label: "Facilitated container exercise",
        theme: "container",
        approaches: ["general", "somatic-therapy"],
        description: "Created imaginal place for distress"
    },

    // ========================================
    // SOLUTION-FOCUSED / ACTION-ORIENTED
    // ========================================
    {
        id: "exceptions",
        label: "Explored exceptions to problem",
        theme: "exceptions",
        approaches: ["general"],
        description: "Identified times problem is less present"
    },
    {
        id: "scaling",
        label: "Scaled progress toward goals",
        theme: "scaling",
        approaches: ["general"],
        description: "Used numerical rating for change"
    },
    {
        id: "goal-setting",
        label: "Facilitated goal-setting",
        theme: "goal-setting goals",
        approaches: ["general"],
        description: "Defined desired outcomes"
    },
    {
        id: "miracle-question",
        label: "Explored miracle question",
        theme: "miracle question",
        approaches: ["general"],
        description: "Imagined life without problem"
    },
    {
        id: "action-steps",
        label: "Identified concrete next steps",
        theme: "action steps",
        approaches: ["general"],
        description: "Developed specific tasks"
    },
    {
        id: "progress-review",
        label: "Reviewed progress toward treatment goals",
        theme: "progress review",
        approaches: ["general"],
        description: "Assessed movement toward goals"
    },

    // ========================================
    // VISUALIZATION / IMAGERY
    // ========================================
    {
        id: "imagery",
        label: "Facilitated guided imagery",
        theme: "imagery visualization",
        approaches: ["general"],
        description: "Led structured visualization"
    },
    {
        id: "future-self",
        label: "Facilitated future self visualization",
        theme: "future self",
        approaches: ["general"],
        description: "Imagined desired future state"
    },
    {
        id: "compassionate-imagery",
        label: "Facilitated compassionate imagery",
        theme: "compassionate imagery",
        approaches: ["general"],
        description: "Developed compassionate internal image"
    },

    // ========================================
    // COGNITIVE INTERVENTIONS
    // ========================================
    {
        id: "cognitive-reframe",
        label: "Facilitated cognitive reframing",
        theme: "reframe cognitive",
        approaches: ["general"],
        description: "Explored alternative perspectives on situation"
    },
    {
        id: "thought-challenging",
        label: "Guided thought challenging",
        theme: "thought challenging",
        approaches: ["general"],
        description: "Examined evidence for and against beliefs"
    },
    {
        id: "thought-patterns",
        label: "Explored thought patterns",
        theme: "thought patterns cognitive",
        approaches: ["general"],
        description: "Identified recurring cognitive themes"
    },
    {
        id: "core-beliefs",
        label: "Explored core beliefs",
        theme: "core beliefs",
        approaches: ["general", "psychodynamic-therapy"],
        description: "Examined fundamental assumptions about self/world"
    },
    {
        id: "cognitive-distortions",
        label: "Identified cognitive distortions",
        theme: "cognitive distortions",
        approaches: ["general"],
        description: "Named unhelpful thinking patterns"
    },
    {
        id: "alternative-perspectives",
        label: "Explored alternative perspectives",
        theme: "perspective-taking",
        approaches: ["general"],
        description: "Considered other ways of viewing situation"
    },
    {
        id: "worry-postponement",
        label: "Practiced worry postponement",
        theme: "worry postponement",
        approaches: ["general"],
        description: "Deferred anxious thoughts to designated time"
    },

    // ========================================
    // SKILL-BUILDING INTERVENTIONS
    // ========================================
    {
        id: "boundary-setting",
        label: "Practiced boundary setting",
        theme: "boundaries",
        approaches: ["general"],
        description: "Rehearsed asserting limits in relationships"
    },
    {
        id: "assertiveness",
        label: "Practiced assertiveness skills",
        theme: "assertiveness",
        approaches: ["general"],
        description: "Coached clear, direct communication"
    },
    {
        id: "distress-tolerance",
        label: "Taught distress tolerance skills",
        theme: "distress tolerance DBT",
        approaches: ["general"],
        description: "Built capacity to withstand difficult emotions"
    },
    {
        id: "coping-skills",
        label: "Developed coping skills",
        theme: "coping skills",
        approaches: ["general"],
        description: "Identified and practiced adaptive strategies"
    },
    {
        id: "emotion-regulation",
        label: "Taught emotion regulation skills",
        theme: "emotion regulation",
        approaches: ["general", "emotion-focused-therapy"],
        description: "Built capacity to modulate emotional intensity"
    },
    {
        id: "self-soothing",
        label: "Practiced self-soothing techniques",
        theme: "self-soothing",
        approaches: ["general", "somatic-therapy"],
        description: "Developed sensory-based calming strategies"
    },
    {
        id: "interpersonal-effectiveness",
        label: "Practiced interpersonal effectiveness",
        theme: "interpersonal effectiveness DEAR MAN",
        approaches: ["general"],
        description: "Rehearsed effective communication strategies"
    },

    // ========================================
    // CRISIS / COORDINATION
    // ========================================
    {
        id: "crisis-intervention",
        label: "Provided crisis intervention",
        theme: "crisis intervention",
        approaches: ["general"],
        description: "Responded to acute distress with stabilization"
    },
    {
        id: "care-coordination",
        label: "Coordinated care with providers",
        theme: "care coordination",
        approaches: ["general"],
        description: "Communicated with treatment team members"
    },
    {
        id: "referral",
        label: "Made referral",
        theme: "referral",
        approaches: ["general"],
        description: "Connected client to additional resources"
    },
    {
        id: "medication-discussion",
        label: "Discussed medication management",
        theme: "medication",
        approaches: ["general"],
        description: "Explored medication questions or concerns"
    },
    {
        id: "resource-connection",
        label: "Connected to community resources",
        theme: "resources community",
        approaches: ["general"],
        description: "Provided information on external supports"
    },

    // ========================================
    // PROCESSING TECHNIQUES
    // ========================================
    {
        id: "narrative-development",
        label: "Facilitated narrative development",
        theme: "narrative",
        approaches: ["general"],
        description: "Helped construct coherent life story"
    },
    {
        id: "meaning-making-event",
        label: "Explored meaning of experience",
        theme: "meaning making",
        approaches: ["general", "humanistic-therapy"],
        description: "Discussed significance of life events"
    },
    {
        id: "grief-processing",
        label: "Facilitated grief processing",
        theme: "grief processing",
        approaches: ["general"],
        description: "Supported mourning and adjustment to loss"
    },
    {
        id: "loss-exploration",
        label: "Explored experience of loss",
        theme: "loss",
        approaches: ["general"],
        description: "Discussed various forms of loss and their impact"
    },
    {
        id: "life-transitions",
        label: "Processed life transitions",
        theme: "transitions life changes",
        approaches: ["general"],
        description: "Navigated significant life changes together"
    },
    {
        id: "identity-exploration",
        label: "Explored identity",
        theme: "identity",
        approaches: ["general", "humanistic-therapy"],
        description: "Discussed sense of self and who client is becoming"
    },

    // ========================================
    // SESSION MANAGEMENT
    // ========================================
    {
        id: "check-in",
        label: "Conducted session check-in",
        theme: "check-in",
        approaches: ["general"],
        description: "Assessed current state at session start"
    },
    {
        id: "agenda-setting",
        label: "Set session agenda collaboratively",
        theme: "agenda",
        approaches: ["general"],
        description: "Identified priorities for session focus"
    },
    {
        id: "session-summary",
        label: "Summarized session themes",
        theme: "summary",
        approaches: ["general"],
        description: "Reviewed key insights and takeaways"
    },
    {
        id: "treatment-planning",
        label: "Collaborated on treatment planning",
        theme: "treatment plan",
        approaches: ["general"],
        description: "Discussed goals and direction of therapy"
    },
    {
        id: "termination-planning",
        label: "Discussed termination planning",
        theme: "termination ending",
        approaches: ["general"],
        description: "Prepared for therapeutic ending"
    },
    {
        id: "pacing",
        label: "Attended to session pacing",
        theme: "pacing",
        approaches: ["general"],
        description: "Managed timing and intensity of session"
    },

    // ========================================
    // HIGH-VALUE ADDITIONS
    // ========================================
    {
        id: "ambivalence-exploration",
        label: "Explored ambivalence",
        theme: "ambivalence",
        approaches: ["general"],
        description: "Examined mixed feelings about change"
    },
    {
        id: "here-and-now",
        label: "Focused on here-and-now process",
        theme: "here-and-now process",
        approaches: ["general", "psychodynamic-therapy"],
        description: "Explored what was happening in the moment"
    },
    {
        id: "therapeutic-rupture",
        label: "Addressed therapeutic rupture",
        theme: "rupture repair alliance",
        approaches: ["general"],
        description: "Repaired strain in therapeutic relationship"
    },
    {
        id: "silence",
        label: "Held therapeutic silence",
        theme: "silence",
        approaches: ["general", "psychodynamic-therapy"],
        description: "Allowed space for reflection and emergence"
    },
    {
        id: "curiosity",
        label: "Encouraged curiosity toward experience",
        theme: "curiosity",
        approaches: ["general", "humanistic-therapy"],
        description: "Fostered open, non-judgmental exploration"
    },
    {
        id: "celebrating-progress",
        label: "Celebrated client progress",
        theme: "celebrating progress",
        approaches: ["general"],
        description: "Acknowledged growth and achievements"
    }
];

/**
 * Search interventions with theme-prioritized results.
 * Theme matches rank higher than label-only matches.
 *
 * @param {string} query - Search query
 * @param {Array} library - Intervention library (defaults to InterventionLibrary)
 * @returns {Array} Sorted array of matching interventions
 */
function searchInterventions(query, library = InterventionLibrary) {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) return [];

    return library
        .filter(intervention => {
            const labelMatch = intervention.label.toLowerCase().includes(lowerQuery);
            const themeMatch = intervention.theme.toLowerCase().includes(lowerQuery);
            return labelMatch || themeMatch;
        })
        .sort((a, b) => {
            // Prioritize theme matches (developer's insight!)
            const aThemeMatch = a.theme.toLowerCase().includes(lowerQuery);
            const bThemeMatch = b.theme.toLowerCase().includes(lowerQuery);

            if (aThemeMatch && !bThemeMatch) return -1;
            if (!aThemeMatch && bThemeMatch) return 1;

            // Secondary: prioritize matches at start of theme
            const aStartMatch = a.theme.toLowerCase().startsWith(lowerQuery);
            const bStartMatch = b.theme.toLowerCase().startsWith(lowerQuery);

            if (aStartMatch && !bStartMatch) return -1;
            if (!aStartMatch && bStartMatch) return 1;

            // Tertiary: alphabetical by label
            return a.label.localeCompare(b.label);
        });
}

/**
 * Filter interventions by therapeutic approach.
 *
 * @param {string} approach - Approach value (e.g., "somatic-therapy") or "all"
 * @param {Array} library - Intervention library
 * @returns {Array} Filtered interventions
 */
function filterByApproach(approach, library = InterventionLibrary) {
    if (approach === 'all') return library;

    return library.filter(intervention =>
        intervention.approaches.includes(approach)
    );
}

/**
 * Get default frequent interventions (for initial quick-add display).
 * In production, this would be based on user's actual usage data.
 *
 * @returns {Array} Array of intervention IDs
 */
function getDefaultFrequentInterventions() {
    return [
        'rapport',
        'present-moment',
        'psychoeducation',
        'validation-emotions',
        'normalization',
        'breathing',
        'strengths'
    ];
}
