/**
 * Default Prompts for AI Narrative Generation
 *
 * Single source of truth for the system prompt and user prompt template
 * used by the narrative generation feature. Both app.js (generation) and
 * settings.js (editing/reset) reference these defaults.
 */

export const NarrativeDefaults = {
    /**
     * System prompt - defines the AI's role and behavior
     */
    systemPrompt: `You are a clinical documentation assistant helping a psychotherapist write concise progress note narratives.

Your role:
- Write professional, HIPAA-compliant clinical psychotherapy documentation
- Use third person, past tense throughout
- Produce concise documentation appropriate for medical records

Abbreviation requirements:
- Use "Clt" for client and "Th" for therapist in individual sessions
- Use "Cpl" for couples
- Use "Fmy" for families
- Only use actual client names when distinguishing between individuals in couple/family sessions
- Never use client names or initials when "Clt", "Cpl", or "Fmy" suffices

Output requirements:
- Write a single-paragraph narrative (~150-200 words)
- Follow the clinical formula: presentation → risk assessment (if applicable) → approach/purpose → interventions → client response
- Keep the tone professional and concise`,

    /**
     * Meta-template structure (fixed, not user-editable)
     * Contains placeholders for user-editable sections
     *
     * Available placeholders for custom templates:
     *   {{date}} - Session date
     *   {{duration}} - Session duration in minutes
     *   {{clientName}} - Client's name
     *   {{clientType}} - Individual, Couple, Family, etc.
     *   {{clientLocation}} - Where the session took place
     *   {{sessionPurpose}} - Purpose of the session
     *   {{mseEntries}} - Mental status observations (formatted)
     *   {{therapeuticApproaches}} - Therapeutic approaches used (formatted)
     *   {{interventions}} - Interventions (formatted)
     *   {{responseToInterventions}} - General response to interventions
     *   {{futureNotes}} - Plans for future sessions
     *   {{includeFutureNotes}} - Whether to include the plans for future sessions in the generated narrative
     *   {{diagnosis}} - Current diagnosis on file
     *   {{treatmentGoals}} - Treatment plan goals (bullet list)
     *   {{targetSymptoms}} - Target symptoms from treatment plan
     *   {{treatmentNotes}} - Clinician notes from treatment plan
     *   {{lastSessionDate}} - Date of previous session
     *   {{lastSessionNarrative}} - Narrative from previous session
     *   {{riskLevel}} - Current risk level (standard/elevated/high)
     *   {{totalSessions}} - Total number of sessions with client
     *   {{treatmentStartDate}} - When therapy began
     *   {{sessionBasis}} - Session frequency (weekly/biweekly/as-needed)
     */
    metaTemplate: `<context>
You are assisting a licensed therapist in creating clinical documentation for their client sessions. Your narratives will be reviewed and edited by the clinician before being entered into the medical record. These notes serve both clinical and legal purposes, documenting the therapeutic work and supporting continuity of care.
</context>

{{progressNoteData}}

<instructions>
{{instructions}}
</instructions>

<examples>
{{examples}}
</examples>

<output_format>
<thinking>
{{thinkingOutputFormat}}
</thinking>

<narrative>
{{narrativeOutputFormat}}
</narrative>
</output_format>`,

    /**
     * User-editable sections (defaults)
     */
    sections: {
        progressNoteData: `<session_information>
- Date: {{date}}
- Duration: {{duration}} minutes
- Client: {{clientName}}
- Client type: {{clientType}}
- Location: {{clientLocation}}
</session_information>

<session_purpose>
{{sessionPurpose}}
</session_purpose>

<mental_status_examination>
{{mseEntries}}
</mental_status_examination>

<therapeutic_approaches>
{{therapeuticApproaches}}
</therapeutic_approaches>

<interventions>
{{interventions}}
</interventions>

<response_to_interventions>
{{responseToInterventions}}
</response_to_interventions>

<plans_for_future_sessions>
{{futureNotes}}
</plans_for_future_sessions>

<include_plans_for_future_sessions_in_narrative>
{{includeFutureNotes}}
</include_plans_for_future_sessions_in_narrative>`,

        instructions: `1. Write a single-paragraph narrative following this formula:
   a. Opening: "Clt/Cpl/Fmy with [mood from MSE(s)] presented [at location]."
   b. Risk assessment (if risk data present): "Th assessed for SI; clt/cpl/fmy reported [risk details]."
   c. Approach and purpose: "Th used [therapeutic approach(es)] to [session purpose/focus]."
   d. Interventions: Series of "Th [intervention action]..." sentences describing the therapeutic work
   e. Response: Final sentence summarizing client's general response from the response_to_interventions field
   f. Future plans (if <include_plans_for_future_sessions_in_narrative> is TRUE): Include plans as final sentence(s)

2. Abbreviation rules:
   - Use "Th" (therapist) throughout
   - Individual sessions: Use "Clt" (client) throughout
   - Couple sessions: Use "Cpl" (couple); use names when needed to distinguish between partners
   - Family sessions: Use "Fmy" (family) for the family unit; use names (and roles in parentheses) when needed to distinguish family members

3. MSE integration:
   - Always start with mood from MSE (e.g., "Clt with depressed mood...")
   - Include risk assessment sentence when risk factors are documented
   - Other MSE fields (perception, thought content, etc.) can be woven in if present and clinically relevant

4. Intervention documentation:
   - Each intervention becomes a "Th [action]..." sentence
   - Include any additional notes/details the therapist provided for that intervention
   - Language should come directly from intervention labels and notes

5. Keep it concise:
   - Target ~150-200 words (soft limit)
   - Single paragraph format
   - Professional but not verbose
   - Clinical terminology is appropriate`,

        thinkingOutputFormat: `(Brief planning:
- Client type: individual/couple/family → abbreviation choice
- MSE mood to open with
- Risk data present? → include risk sentence
- Approaches and purpose connection
- Intervention sequence
- Response summary
- Include future plans? → check <include_plans_for_future_sessions_in_narrative>)`,

        narrativeOutputFormat: `(Single paragraph following the formula:
1. "Clt/Cpl/Fmy with [mood] presented [at location]."
2. "Th assessed for SI; clt/cpl/fmy reported [risk details]." (if risk present)
3. "Th used [approach] to [purpose]."
4. Multiple "Th [intervention]..." sentences
5. "[Client response summary]."
6. Future notes (if <include_plans_for_future_sessions_in_narrative> true)`
    },

    /**
     * Default examples for narrative generation
     *
     * Key Learning Point: All examples include client names in the input data,
     * but the outputs use "Clt"/"Cpl" instead. This teaches the LLM that even
     * when names are provided, it should use abbreviations unless distinguishing
     * between individuals (as in the couple example where names are used when
     * describing partner-specific dynamics).
     */
    defaultExamples: [
        {
            id: 'example-individual-minimal',
            description: 'Individual session with mood and risk assessment',
            input: `<session_information>
- Date: 01/15/2025
- Duration: 50 minutes
- Client: MaSa
- Client type: Individual
- Location: Client's home
</session_information>

<session_purpose>
Address feelings of hopelessness and instability; explore emotional logic underlying these experiences
</session_purpose>

<mental_status_examination>
Mood: depressed
Risk Factors: suicidal-ideation (passive ideation with no plan or means)
</mental_status_examination>

<therapeutic_approaches>
Coherence Therapy
</therapeutic_approaches>

<interventions>
Intervention: Assessed current stressors and areas of impaired functioning
Notes: Related to chronic illness

Intervention: Facilitated inquiry into emotional learning
Notes: Explored clt's story about illness and fear of deterioration ("losing their mind")

Intervention: Validated how fears support psychological protection

Intervention: Normalized the fear response as coherent

Intervention: Supported meaning-making around fears

Intervention: Helped identify emerging alternative experiences
Notes: Grounded in safety and internal support
</interventions>

<response_to_interventions>
Clt engaged openly, expressed relief through validation, and gained insight into the emotional coherence behind their distress.
</response_to_interventions>

<plans_for_future_sessions>
Continue exploring emotional learning; monitor mood and SI
</plans_for_future_sessions>

<include_plans_for_future_sessions_in_narrative>TRUE</include_plans_for_future_sessions_in_narrative>`,
            output: `<thinking>
Client type: individual → use "Clt"
MSE: depressed mood, SI with passive ideation/no plan/means
Approach: Coherence Therapy → connect to purpose about hopelessness/emotional logic
Interventions: 6 items, several with notes to incorporate
Response: engaged openly, relief, insight
</thinking>
<narrative>
Clt with depressed mood presented at home. Th assessed for SI; clt reported passive ideation with no plan or means. Th used Coherence Therapy to address feelings of hopelessness and instability and explore emotional logic underlying these experiences. Th assessed current stressors and areas of impaired functioning related to chronic illness. Th facilitated inquiry into the emotional learning of clt's story about illness and fear of deterioration ("losing their mind"). Th validated how these fears support psychological protection. Th normalized the fear response as coherent. Th supported meaning-making around clt's fears. Th helped identify emerging alternative experiences grounded in safety and internal support. Clt engaged openly, expressed relief through validation, and gained insight into the emotional coherence behind their distress. Continue exploring emotional learning; monitor mood and SI.
</narrative>`
        },
        {
            id: 'example-individual-detailed-mse',
            description: 'Individual session with detailed MSE, no risk',
            input: `<session_information>
- Date: 01/20/2025
- Duration: 50 minutes
- Client: DaCh
- Client type: Individual
- Location: Office
</session_information>

<session_purpose>
Process grief related to recent loss; develop coping strategies for intrusive memories
</session_purpose>

<mental_status_examination>
Mood: dysphoric, anxious
Perception: depersonalization
Thought Process: circumstantial
Risk Factors: None identified
</mental_status_examination>

<therapeutic_approaches>
Somatic Therapy, Grief Therapy
</therapeutic_approaches>

<interventions>
Intervention: Grounded clt using somatic awareness techniques
Notes: Guided attention to breath and physical sensations to address depersonalization

Intervention: Validated grief as a natural response to loss

Intervention: Explored meaning of the lost relationship

Intervention: Introduced container visualization for intrusive memories
Notes: Clt practiced placing distressing images in imagined container for later processing
</interventions>

<response_to_interventions>
Clt reported feeling more present after grounding work; tearful but engaged when exploring loss; found container technique helpful for managing intrusive images.
</response_to_interventions>

<plans_for_future_sessions>
Continue grief processing; practice container technique between sessions; reassess depersonalization symptoms
</plans_for_future_sessions>

<include_plans_for_future_sessions_in_narrative>FALSE</include_plans_for_future_sessions_in_narrative>`,
            output: `<thinking>
Client type: individual → use "Clt"
MSE: dysphoric/anxious mood, depersonalization, circumstantial thought process, no risk (skip risk sentence)
Approaches: Somatic + Grief Therapy
Interventions: 4 items with some detailed notes
Response: more present, tearful but engaged, found technique helpful
</thinking>
<narrative>
Clt with dysphoric and anxious mood presented at office, reporting episodes of depersonalization and some circumstantial thinking. Th used Somatic Therapy and Grief Therapy to process grief related to recent loss and develop coping strategies for intrusive memories. Th grounded clt using somatic awareness techniques, guiding attention to breath and physical sensations to address the depersonalization. Th validated grief as a natural response to loss. Th explored meaning of the lost relationship. Th introduced container visualization for intrusive memories, with clt practicing placing distressing images in an imagined container for later processing. Clt reported feeling more present after grounding work; tearful but engaged when exploring loss; found container technique helpful for managing intrusive images.
</narrative>`
        },
        {
            id: 'example-couple',
            description: 'Couple session with relational focus',
            input: `<session_information>
- Date: 01/22/2025
- Duration: 60 minutes
- Client: SaRi & JoRi
- Client type: Couple
- Location: Office
</session_information>

<session_purpose>
Address communication breakdown; identify pursue-withdraw cycle; practice reflective listening
</session_purpose>

<mental_status_examination>
Partner A (SaRi):
Mood: frustrated, anxious
Risk Factors: None identified

Partner B (JoRi):
Mood: withdrawn, sad
Risk Factors: None identified
</mental_status_examination>

<therapeutic_approaches>
Emotion-Focused Therapy (EFT)
</therapeutic_approaches>

<interventions>
Intervention: Mapped the couple's negative interaction cycle
Notes: SaRi's pursuit (criticism) triggers JoRi's withdrawal (stonewalling)

Intervention: Provided psychoeducation about attachment needs
Notes: How secondary emotions (anger) protect primary emotions (fear, loneliness)

Intervention: Facilitated reflective listening exercise
Notes: Each partner practiced reflecting the other's experience without defending

Intervention: Helped SaRi express primary emotion beneath criticism

Intervention: Supported JoRi in recognizing withdrawal as protective response
</interventions>

<response_to_interventions>
Cpl engaged in cycle mapping with recognition; both became tearful during reflective listening exercise; reported feeling more understood by end of session.
</response_to_interventions>

<plans_for_future_sessions>
Practice "pause and reflect" technique at home; continue deepening emotional expression
</plans_for_future_sessions>

<include_plans_for_future_sessions_in_narrative>TRUE</include_plans_for_future_sessions_in_narrative>`,
            output: `<thinking>
Client type: couple → use "Cpl" for the couple, name values (SaRi/JoRi) when distinguishing
MSE: SaRi frustrated/anxious, JoRi withdrawn/sad, no risk for either
Approaches: EFT + Communication Skills Training
Interventions: 5 items with notes about the cycle
Response: engaged, both tearful, felt more understood
</thinking>
<narrative>
Cpl presented at office, SaRi with frustrated and anxious mood; JoRi with withdrawn and sad mood. Th used Emotion-Focused Therapy to address communication breakdown and identify the pursue-withdraw cycle. Th mapped the couple's negative interaction cycle, noting SaRi's pursuit through criticism triggers JoRi's withdrawal and stonewalling. Th provided psychoeducation about attachment needs and how secondary emotions like anger protect primary emotions such as fear and loneliness. Th facilitated reflective listening exercise where each partner practiced reflecting the other's experience without defending. Th helped SaRi express the primary emotion beneath the criticism. Th supported JoRi in recognizing withdrawal as a protective response. Cpl engaged in cycle mapping with recognition; both became tearful during reflective listening exercise; reported feeling more understood by end of session. Practice "pause and reflect" technique at home; continue deepening emotional expression.
</narrative>`
        }
    ]
};
