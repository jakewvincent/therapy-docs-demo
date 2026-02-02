/**
 * Mock Data for Development
 *
 * SYNTHETIC DATA DISCLAIMER
 * =========================
 * ALL data in this file is ENTIRELY FICTIONAL and was created solely for
 * development and testing purposes. This includes but is not limited to:
 *
 * - User accounts and email addresses
 * - Client names, initials, and identifiers
 * - Session dates, notes, and clinical content
 * - Diagnostic codes and treatment plans
 *
 * NO REAL PATIENT DATA, PROTECTED HEALTH INFORMATION (PHI), OR ACTUAL
 * CLINICAL RECORDS ARE PRESENT IN THIS FILE.
 *
 * This file simulates what the backend API would return when config.useMockAPI
 * is true. The deployment workflow generates production config with
 * useMockAPI: false, so this data is never used in production.
 *
 * Any resemblance to real persons, living or deceased, or actual clinical
 * scenarios is purely coincidental.
 */

import { config } from './config.js';

/**
 * Document Type Constants
 * These match the backend's document type values (snake_case internally)
 */
const DOCUMENT_TYPES = {
    PROGRESS_NOTE: 'progress_note',
    DIAGNOSIS: 'diagnosis',
    TREATMENT_PLAN: 'treatment_plan',
    INTAKE: 'intake',
    CONSULTATION: 'consultation',
    DISCHARGE: 'discharge'
};

/**
 * Maps internal document types to display names
 */
const DOCUMENT_TYPE_DISPLAY_NAMES = {
    'progress_note': 'Progress Note',
    'diagnosis': 'Diagnosis',
    'treatment_plan': 'Treatment Plan',
    'intake': 'Intake',
    'consultation': 'Consultation',
    'discharge': 'Discharge'
};

/**
 * Maps display names to internal document types
 */
const DISPLAY_NAME_TO_DOCUMENT_TYPE = {
    'Progress Note': 'progress_note',
    'Diagnosis': 'diagnosis',
    'Treatment Plan': 'treatment_plan',
    'Intake': 'intake',
    'Consultation': 'consultation',
    'Discharge': 'discharge'
};

export const mockData = {
  // Mock user data
  user: {
    id: 'user-001',
    email: 'drkhorney@contextmatterstherapy.com',
    name: 'Karen Horney',
    license: 'MD',
    role: 'admin',           // 'sysadmin' | 'admin' | 'supervisor'
    groups: ['admin'],       // Cognito groups
    mfaEnabled: true         // Set to false to test MFA setup flow
  },

  // Mock clients
  clients: [
    {
      id: 'client-001',
      name: 'SM',
      clientType: 'Individual',
      lastFormType: 'Progress Note',
      lastDelivery: 'In Person',
      // Note: currentDiagnosisId, currentTreatmentPlanId, completedFormTypes
      // are now computed from the documents collection
      status: 'active',
      isArchived: false,
      archivedAt: null,
      createdAt: '2024-11-15',
      totalSessions: 12,
      lastSessionDate: '2025-01-10',
      // Additional fields
      sessionBasis: 'weekly',
      paymentType: 'insurance',
      payer: 'Blue Cross Blue Shield',
      authorizationExpiration: '2025-03-15',
      sessionsRemaining: 8,
      riskLevel: 'standard',
      lastRiskAssessment: '2025-01-10',
      referralSource: 'PCP: Dr. Martinez',
      referralDate: '2024-11-10',
      internalNotes: 'Prefers morning appointments. Works from home on Fridays.',
      // Historical data fields
      startDate: '2024-08-01',
      sessionAdjustment: 5,
      // Next scheduled appointment (stored as UTC, displayed as local)
      nextAppointment: {
        datetime: '2025-12-24T19:00:00Z',  // 2:00 PM EST stored as UTC
        duration: 50
      }
    },
    {
      id: 'client-002',
      name: 'JK',
      clientType: 'Individual',
      lastFormType: 'Progress Note',
      lastDelivery: 'Video',
      status: 'active',
      isArchived: false,
      archivedAt: null,
      createdAt: '2024-10-22',
      totalSessions: 8,
      lastSessionDate: '2025-01-09',
      // Additional fields
      sessionBasis: 'weekly',
      paymentType: 'private-pay',
      payer: null,
      authorizationExpiration: null,
      sessionsRemaining: null,
      riskLevel: 'elevated',
      lastRiskAssessment: '2025-01-09',
      referralSource: 'Psychology Today',
      referralDate: '2024-10-15',
      internalNotes: 'Video sessions only - lives out of state. Check in about trauma processing pace.',
      // Historical data fields
      startDate: '2024-10-22',
      sessionAdjustment: 0,
      // Next scheduled appointment (stored as UTC, displayed as local)
      nextAppointment: {
        datetime: '2025-12-24T20:30:00Z',  // 3:30 PM EST stored as UTC
        duration: 50
      }
    },
    {
      id: 'client-003',
      name: 'ML',
      clientType: 'Couple',
      lastFormType: 'Progress Note',
      lastDelivery: 'In Person',
      status: 'active',
      isArchived: false,
      archivedAt: null,
      createdAt: '2024-12-01',
      totalSessions: 5,
      lastSessionDate: '2025-01-08',
      // Additional fields
      sessionBasis: 'biweekly',
      paymentType: 'sliding-scale',
      payer: 'Reentry Support Foundation',
      authorizationExpiration: null,
      sessionsRemaining: null,
      riskLevel: null,
      lastRiskAssessment: null,
      referralSource: 'Reentry Support Foundation',
      referralDate: '2024-11-28',
      internalNotes: 'Couple seen through RSF program. Partner recently released. Both committed to process.',
      // Historical data fields
      startDate: '2024-12-01',
      sessionAdjustment: 0,
      // Next scheduled appointment (biweekly - next week, stored as UTC)
      nextAppointment: {
        datetime: '2025-12-31T16:00:00Z',  // 11:00 AM EST stored as UTC
        duration: 75
      }
    },
    {
      id: 'client-004',
      name: 'RP',
      clientType: 'Individual',
      lastFormType: 'Treatment Plan',
      lastDelivery: 'Phone',
      status: 'active',
      isArchived: false,
      archivedAt: null,
      createdAt: '2024-09-10',
      totalSessions: 18,
      lastSessionDate: '2025-01-07',
      // Additional fields
      sessionBasis: 'weekly',
      paymentType: 'insurance',
      payer: 'Aetna',
      authorizationExpiration: '2025-01-20',
      sessionsRemaining: 2,
      riskLevel: 'standard',
      lastRiskAssessment: '2024-12-15',
      referralSource: 'Former client referral',
      referralDate: '2024-09-01',
      internalNotes: 'Auth expiring soon - need to request reauthorization. Psychiatrist: Dr. Wong.',
      // Historical data fields
      startDate: '2024-06-15',
      sessionAdjustment: 10,
      // Next scheduled appointment (tomorrow, stored as UTC)
      nextAppointment: {
        datetime: '2025-12-25T14:00:00Z',  // 9:00 AM EST stored as UTC
        duration: 50
      }
    },
    {
      id: 'client-005',
      name: 'TW',
      clientType: 'Individual',
      lastFormType: 'Consultation',
      lastDelivery: 'Phone',
      status: 'inactive',
      isArchived: false,
      archivedAt: null,
      createdAt: '2024-06-15',
      totalSessions: 0,
      lastSessionDate: null,
      // Additional fields
      sessionBasis: null,
      paymentType: 'private-pay',
      payer: null,
      authorizationExpiration: null,
      sessionsRemaining: null,
      riskLevel: null,
      lastRiskAssessment: null,
      referralSource: 'Self-referred',
      referralDate: '2024-06-10',
      internalNotes: 'Completed intake call but never scheduled first session. Reached out twice, no response.',
      // Historical data fields
      startDate: null,
      sessionAdjustment: 0,
      // No appointment scheduled (inactive client)
      nextAppointment: null
    },
    {
      id: 'client-006',
      name: 'BN',
      clientType: 'Individual',
      lastFormType: 'Discharge',
      lastDelivery: 'In Person',
      status: 'discharged',
      isArchived: true,
      archivedAt: '2024-12-20',
      createdAt: '2024-03-01',
      totalSessions: 24,
      lastSessionDate: '2024-12-15',
      sessionBasis: null,
      paymentType: 'insurance',
      payer: 'United Healthcare',
      authorizationExpiration: null,
      sessionsRemaining: null,
      riskLevel: null,
      lastRiskAssessment: null,
      referralSource: 'Employee Assistance Program',
      referralDate: '2024-02-20',
      internalNotes: 'Successfully completed treatment. Met all goals. Discharged with relapse prevention plan.',
      startDate: '2024-03-01',
      sessionAdjustment: 0,
      // No appointment scheduled (discharged client)
      nextAppointment: null
    },
    {
      id: 'client-007',
      name: 'AK',
      clientType: 'Individual',
      lastFormType: null,
      lastDelivery: null,
      status: 'active',
      isArchived: false,
      archivedAt: null,
      createdAt: '2025-01-15',
      totalSessions: 0,
      lastSessionDate: null,
      sessionBasis: null,
      paymentType: 'private-pay',
      payer: null,
      authorizationExpiration: null,
      sessionsRemaining: null,
      riskLevel: null,
      lastRiskAssessment: null,
      referralSource: 'Website inquiry',
      referralDate: '2025-01-12',
      internalNotes: 'New client - first appointment scheduled.',
      startDate: null,
      sessionAdjustment: 0,
      // First appointment - today! (stored as UTC)
      nextAppointment: {
        datetime: '2025-12-24T15:00:00Z',  // 10:00 AM EST stored as UTC
        duration: 60  // Extended first session
      }
    }
  ],

  /**
   * UNIFIED DOCUMENTS COLLECTION
   * ============================
   * All clinical documentation in a unified structure.
   * Indexed by clientId, each containing an array of documents.
   *
   * Document structure:
   * {
   *   id: string,              // Format: doc-{type}-{timestamp}-{uniqueId}
   *   documentType: string,    // progress_note | diagnosis | treatment_plan | intake | consultation | discharge
   *   clientId: string,
   *   status: string,          // Type-specific: draft/complete/amended (progress_note), provisional/active/resolved (diagnosis), etc.
   *   content: object,         // Type-specific content
   *   createdAt: string,       // ISO timestamp
   *   updatedAt: string        // ISO timestamp
   * }
   */
  documents: {
    'client-001': [
      // Consultation document
      {
        id: 'doc-consultation-2024-11-10T10:00:00Z-001',
        documentType: 'consultation',
        clientId: 'client-001',
        status: 'complete',
        content: {
          date: '2024-11-10',
          duration: 30,
          delivery: 'Phone',
          referralSource: 'PCP: Dr. Martinez',
          presentingConcerns: 'Work-related anxiety, imposter syndrome',
          recommendedServices: 'Individual therapy, CBT approach',
          notes: 'Client sounds motivated for treatment. Discussed logistics and scheduled intake.'
        },
        createdAt: '2024-11-10T10:30:00Z',
        updatedAt: '2024-11-10T10:30:00Z'
      },
      // Intake document (new format with presenting problem IDs)
      {
        id: 'doc-intake-2024-11-15T09:00:00Z-001',
        documentType: 'intake',
        clientId: 'client-001',
        status: 'complete',
        content: {
          date: '2024-11-15',
          duration: 90,
          delivery: 'In Person',
          // Demographics section
          demographicInfo: { age: 32, occupation: 'Software Engineer' },
          // Presenting Problems - using IDs from clinicalReferenceData.js
          presentingProblems: ['anxiety', 'burnout'],
          presentingProblemsOther: 'Work-related imposter syndrome',
          // History sections
          mentalHealthHistory: 'No prior therapy. Some anxiety in college.',
          medicalHistory: 'Generally healthy. No current medications.',
          substanceUse: 'Social alcohol use only',
          socialHistory: 'Lives with partner. Good support system.',
          // Risk Assessment
          riskAssessment: {
            riskLevel: 'standard',
            suicidalIdeation: false,
            homicidalIdeation: false,
            selfHarm: false,
            notes: 'No current or historical risk factors identified.'
          },
          // Clinical Conceptualization (3 lenses)
          conceptualization: {
            coherence: 'Anxiety serves protective function - hypervigilance prevents "being caught off guard" at work. Core learning: "If I relax, I\'ll fail."',
            attachment: 'Secure primary attachment with some anxious features. Seeking reassurance from partner around work stress.',
            somatic: 'Sympathetic activation with work triggers. Reports tension in shoulders and chest. Good capacity for grounding.'
          },
          treatmentRecommendations: 'Weekly individual therapy using CBT and mindfulness approaches. Focus on work-related anxiety and imposter syndrome.'
        },
        createdAt: '2024-11-15T10:30:00Z',
        updatedAt: '2024-11-15T10:30:00Z'
      },
      // Diagnosis documents
      {
        id: 'doc-diagnosis-2024-11-20T10:00:00Z-001',
        documentType: 'diagnosis',
        clientId: 'client-001',
        date: '2024-11-20',  // Top-level date field per unified documents API
        status: 'active',
        content: {
          icd10Code: 'F41.1',
          description: 'Generalized Anxiety Disorder',
          isPrincipal: true,
          severity: 'moderate',
          clinicalNotes: 'Responds well to CBT and mindfulness interventions. Work-related triggers identified.',
          dateResolved: null
        },
        createdAt: '2024-11-20T10:00:00Z',
        updatedAt: '2024-11-20T10:00:00Z'
      },
      {
        id: 'doc-diagnosis-2024-11-20T10:00:00Z-002',
        documentType: 'diagnosis',
        clientId: 'client-001',
        date: '2024-11-20',  // Top-level date field per unified documents API
        status: 'active',
        content: {
          icd10Code: 'F32.0',
          description: 'Major Depressive Disorder, single episode, mild',
          isPrincipal: false,
          severity: 'mild',
          clinicalNotes: 'Secondary to anxiety. Monitoring for changes.',
          dateResolved: null
        },
        createdAt: '2024-11-20T10:00:00Z',
        updatedAt: '2024-11-20T10:00:00Z'
      },
      // Treatment Plan document (new format with structured goals and linked intake)
      {
        id: 'doc-treatment_plan-2024-11-22T10:30:00Z-001',
        documentType: 'treatment_plan',
        clientId: 'client-001',
        status: 'active',
        content: {
          dateCreated: '2024-11-22',
          reviewDate: '2025-02-22',
          // Presenting problems linked from intake
          presentingProblems: ['anxiety', 'burnout'],
          presentingProblemsSource: 'intake',
          linkedIntakeId: 'doc-intake-2024-11-15T09:00:00Z-001',
          // Structured goals with interventions
          goals: [
            {
              id: 'goal-001',
              text: 'Reduce anxiety symptoms to manageable levels',
              targetDate: '2025-02-22',
              interventions: [
                { id: 'SE-4', name: 'Grounding', approach: 'Somatic Experiencing', fromLibrary: true },
                { id: 'CT-1', name: 'Pro-symptom exploration', approach: 'Coherence Therapy', fromLibrary: true },
                { id: 'custom-001', name: 'Cognitive restructuring', approach: 'Coherence Therapy', fromLibrary: false }
              ]
            },
            {
              id: 'goal-002',
              text: 'Develop effective coping strategies for work stress',
              targetDate: '2025-03-22',
              interventions: [
                { id: 'SE-1', name: 'Resourcing', approach: 'Somatic Experiencing', fromLibrary: true },
                { id: 'FT-2', name: 'Externalization', approach: 'Feminist Therapy', fromLibrary: true }
              ]
            },
            {
              id: 'goal-003',
              text: 'Improve sleep quality and establish healthy sleep routine',
              targetDate: '2025-04-22',
              interventions: [
                { id: 'SE-12', name: 'Window of tolerance education', approach: 'Somatic Experiencing', fromLibrary: true },
                { id: 'custom-002', name: 'Sleep hygiene education', approach: 'Coherence Therapy', fromLibrary: false }
              ]
            }
          ],
          // Client acknowledgment
          reviewedWithClient: true,
          clientAgrees: true,
          notes: 'Client responds well to cognitive restructuring. Continue focus on challenging negative thought patterns.'
        },
        createdAt: '2024-11-22T10:30:00Z',
        updatedAt: '2024-11-22T10:30:00Z'
      },
      // Progress Note documents
      {
        id: 'doc-progress_note-2025-01-03T15:30:00Z-001',
        documentType: 'progress_note',
        clientId: 'client-001',
        status: 'complete',
        content: {
          date: '2025-01-03',
          duration: 50,
          formType: 'Progress Note',
          delivery: 'In Person',
          purpose: '',
          mseEntries: [],
          therapeuticApproaches: [],
          therapeuticApproachesOther: '',
          interventions: [''],
          futureNotes: '',
          notes: 'Client reported increased anxiety over holiday period. Discussed family dynamics and boundary-setting challenges. Reviewed coping strategies and adjusted homework assignments for holiday season.',
          narrative: 'Session addressed holiday-related stress and family boundary challenges. Client benefited from reviewing established coping mechanisms. Continued focus on maintaining therapeutic gains during stressful periods.'
        },
        createdAt: '2025-01-03T15:30:00Z',
        updatedAt: '2025-01-03T15:30:00Z'
      },
      {
        id: 'doc-progress_note-2025-01-10T15:30:00Z-001',
        documentType: 'progress_note',
        clientId: 'client-001',
        status: 'complete',
        content: {
          date: '2025-01-10',
          duration: 50,
          formType: 'Progress Note',
          delivery: 'In Person',
          purpose: 'Managing work-related anxiety - Cognitive restructuring for imposter syndrome',
          mseEntries: [
            {
              id: 1704844800000,
              note: 'Client appeared calm, well-groomed',
              disturbance: ['sleep'],
              disturbanceOther: '',
              mood: ['anxious'],
              moodOther: '',
              perception: [],
              perceptionOther: '',
              thoughtContent: [],
              thoughtContentOther: '',
              thoughtProcess: [],
              thoughtProcessOther: '',
              risk: [],
              riskOther: ''
            }
          ],
          therapeuticApproaches: ['psychodynamic', 'somatic'],
          therapeuticApproachesOther: '',
          interventions: ['Grounding techniques', 'Cognitive restructuring', 'Journaling assignment'],
          futureNotes: 'Review journaling homework, continue work on imposter syndrome',
          notes: 'Client discussed continued progress with work-related anxiety. Reported using grounding techniques successfully during a challenging meeting. Explored feelings of imposter syndrome that arose when given new project responsibilities. Practiced cognitive restructuring around negative self-talk. Homework: Continue daily grounding practice and journal about wins at work.',
          narrative: 'Client demonstrated significant progress in managing work-related anxiety through consistent use of grounding techniques. Session focused on addressing imposter syndrome related to new responsibilities. Client shows good insight and engagement with therapeutic interventions. Plan: Continue cognitive-behavioral approach with focus on reframing negative self-perceptions.'
        },
        createdAt: '2025-01-10T15:30:00Z',
        updatedAt: '2025-01-10T15:30:00Z'
      }
    ],
    'client-002': [
      // Intake document (new format with presenting problem IDs)
      {
        id: 'doc-intake-2024-10-22T09:00:00Z-001',
        documentType: 'intake',
        clientId: 'client-002',
        status: 'complete',
        content: {
          date: '2024-10-22',
          duration: 90,
          delivery: 'Video',
          demographicInfo: { age: 28, occupation: 'Teacher' },
          // Presenting Problems - using IDs from clinicalReferenceData.js
          presentingProblems: ['cptsd', 'relational-conflict'],
          presentingProblemsOther: 'Hypervigilance in relationships',
          mentalHealthHistory: 'Prior therapy 5 years ago. Complex trauma history.',
          medicalHistory: 'No significant medical issues.',
          substanceUse: 'None',
          socialHistory: 'Lives out of state. In committed relationship.',
          // Risk Assessment
          riskAssessment: {
            riskLevel: 'elevated',
            suicidalIdeation: false,
            homicidalIdeation: false,
            selfHarm: false,
            notes: 'Complex trauma history. No current SI/HI. Monitoring closely.'
          },
          // Clinical Conceptualization (3 lenses)
          conceptualization: {
            coherence: 'Hypervigilance serves protective function - "staying alert prevents being hurt again." Relational avoidance protects from anticipated rejection.',
            attachment: 'Disorganized attachment from early trauma. Oscillates between approach and avoidance in relationships.',
            somatic: 'Chronic sympathetic activation. Reports muscle tension, startle response. Limited ventral access currently.'
          },
          treatmentRecommendations: 'Weekly trauma-focused therapy. Consider EMDR when ready. Prioritize safety and stabilization.'
        },
        createdAt: '2024-10-22T10:30:00Z',
        updatedAt: '2024-10-22T10:30:00Z'
      },
      // Diagnosis documents
      {
        id: 'doc-diagnosis-2024-10-25T14:00:00Z-001',
        documentType: 'diagnosis',
        clientId: 'client-002',
        date: '2024-10-25',  // Top-level date field per unified documents API
        status: 'active',
        content: {
          icd10Code: 'F43.10',
          description: 'Post-Traumatic Stress Disorder',
          isPrincipal: true,
          severity: 'moderate',
          clinicalNotes: 'Complex trauma history. Strong therapeutic alliance supporting gradual processing.',
          dateResolved: null
        },
        createdAt: '2024-10-25T14:00:00Z',
        updatedAt: '2024-10-25T14:00:00Z'
      },
      {
        id: 'doc-diagnosis-2024-10-25T14:00:00Z-002',
        documentType: 'diagnosis',
        clientId: 'client-002',
        date: '2024-10-25',  // Top-level date field per unified documents API
        status: 'resolved',
        content: {
          icd10Code: 'F41.9',
          description: 'Anxiety Disorder, unspecified',
          isPrincipal: false,
          severity: 'mild',
          clinicalNotes: 'Initial presentation. Reclassified after full assessment.',
          dateResolved: '2024-11-15'
        },
        createdAt: '2024-10-25T14:00:00Z',
        updatedAt: '2024-11-15T10:00:00Z'
      },
      // Treatment Plan document (new format with structured goals and linked intake)
      {
        id: 'doc-treatment_plan-2024-10-28T15:00:00Z-001',
        documentType: 'treatment_plan',
        clientId: 'client-002',
        status: 'active',
        content: {
          dateCreated: '2024-10-28',
          reviewDate: '2025-01-28',
          // Presenting problems linked from intake
          presentingProblems: ['cptsd', 'relational-conflict'],
          presentingProblemsSource: 'intake',
          linkedIntakeId: 'doc-intake-2024-10-22T09:00:00Z-001',
          // Structured goals with interventions
          goals: [
            {
              id: 'goal-001',
              text: 'Process traumatic memories in safe environment',
              targetDate: '2025-04-28',
              interventions: [
                { id: 'SE-1', name: 'Resourcing', approach: 'Somatic Experiencing', fromLibrary: true },
                { id: 'SE-3', name: 'Titration', approach: 'Somatic Experiencing', fromLibrary: true },
                { id: 'SE-14', name: 'Container work', approach: 'Somatic Experiencing', fromLibrary: true },
                { id: 'PW-3', name: 'Exile accessing and unburdening', approach: 'Parts Work (IFS)', fromLibrary: true }
              ]
            },
            {
              id: 'goal-002',
              text: 'Reduce avoidance behaviors',
              targetDate: '2025-03-28',
              interventions: [
                { id: 'CT-1', name: 'Pro-symptom exploration', approach: 'Coherence Therapy', fromLibrary: true },
                { id: 'CT-5', name: 'Symptom coherence mapping', approach: 'Coherence Therapy', fromLibrary: true },
                { id: 'AT-5', name: 'Therapeutic relationship as laboratory', approach: 'Attachment-Based', fromLibrary: true }
              ]
            },
            {
              id: 'goal-003',
              text: 'Strengthen support systems',
              targetDate: '2025-02-28',
              interventions: [
                { id: 'AT-1', name: 'Secure base provision', approach: 'Attachment-Based', fromLibrary: true },
                { id: 'AT-4', name: 'Attachment pattern awareness', approach: 'Attachment-Based', fromLibrary: true }
              ]
            }
          ],
          reviewedWithClient: true,
          clientAgrees: true,
          notes: 'Proceed gradually with trauma processing. Client has strong therapeutic alliance. Prioritize stabilization before deep processing.'
        },
        createdAt: '2024-10-28T15:00:00Z',
        updatedAt: '2024-10-28T15:00:00Z'
      },
      // Progress Note document
      {
        id: 'doc-progress_note-2025-01-09T14:00:00Z-001',
        documentType: 'progress_note',
        clientId: 'client-002',
        status: 'complete',
        content: {
          date: '2025-01-09',
          duration: 50,
          formType: 'Progress Note',
          delivery: 'Video',
          purpose: '',
          mseEntries: [],
          therapeuticApproaches: ['attachment-theory', 'eft'],
          therapeuticApproachesOther: '',
          interventions: ['Communication skills training'],
          futureNotes: '',
          notes: 'Client shared breakthrough regarding relationship patterns. Made connection between childhood experiences and current relationship dynamics. Showed increased emotional awareness. Discussed communication strategies to implement with partner.',
          narrative: 'Client demonstrated significant insight connecting past experiences to present relationship patterns. Strong therapeutic alliance evident. Introduced communication skills training. Plan: Continue trauma-informed approach with focus on healthy relationship building.'
        },
        createdAt: '2025-01-09T14:00:00Z',
        updatedAt: '2025-01-09T14:00:00Z'
      }
    ],
    'client-003': [
      // Intake document
      {
        id: 'doc-intake-2024-12-01T09:00:00Z-001',
        documentType: 'intake',
        clientId: 'client-003',
        status: 'complete',
        content: {
          date: '2024-12-01',
          duration: 90,
          delivery: 'In Person',
          demographicInfo: { coupleType: 'Heterosexual couple' },
          presentingProblems: ['Communication difficulties', 'Reentry adjustment', 'Trust issues'],
          relationshipHistory: 'Together 5 years. Partner recently released from incarceration.',
          mentalHealthHistory: 'No prior couples therapy.',
          socialHistory: 'Both working. Reconnecting after separation.',
          riskAssessment: { domesticViolence: false, safety: true },
          treatmentRecommendations: 'Biweekly couples therapy focusing on communication and rebuilding trust.'
        },
        createdAt: '2024-12-01T10:30:00Z',
        updatedAt: '2024-12-01T10:30:00Z'
      },
      // Diagnosis document
      {
        id: 'doc-diagnosis-2024-12-05T11:00:00Z-001',
        documentType: 'diagnosis',
        clientId: 'client-003',
        date: '2024-12-05',  // Top-level date field per unified documents API
        status: 'provisional',
        content: {
          icd10Code: 'Z63.0',
          description: 'Relationship Distress with spouse or intimate partner',
          isPrincipal: true,
          severity: null,
          clinicalNotes: 'Couple presenting with communication difficulties post-reentry.',
          dateResolved: null
        },
        createdAt: '2024-12-05T11:00:00Z',
        updatedAt: '2024-12-05T11:00:00Z'
      },
      // Progress Note document
      {
        id: 'doc-progress_note-2025-01-08T16:00:00Z-001',
        documentType: 'progress_note',
        clientId: 'client-003',
        status: 'complete',
        content: {
          date: '2025-01-08',
          duration: 50,
          formType: 'Progress Note',
          delivery: 'In Person',
          purpose: '',
          mseEntries: [],
          therapeuticApproaches: [],
          therapeuticApproachesOther: '',
          interventions: [''],
          futureNotes: '',
          notes: 'Client working through grief related to recent loss. Normalized grief responses and discussed importance of self-compassion. Explored support systems and introduced gentle self-care practices.',
          narrative: 'Grief-focused session with emphasis on psychoeducation and normalization of client\'s experience. Client receptive to self-compassion framework. Plan: Continue grief work with attention to self-care and support system activation.'
        },
        createdAt: '2025-01-08T16:00:00Z',
        updatedAt: '2025-01-08T16:00:00Z'
      }
    ],
    'client-004': [
      // Consultation document
      {
        id: 'doc-consultation-2024-09-01T10:00:00Z-001',
        documentType: 'consultation',
        clientId: 'client-004',
        status: 'complete',
        content: {
          date: '2024-09-01',
          duration: 30,
          delivery: 'Phone',
          referralSource: 'Former client referral',
          presentingConcerns: 'Depression, difficulty functioning at work',
          recommendedServices: 'Individual therapy with psychiatric consultation',
          notes: 'Client reports significant depressive symptoms. Coordinating with psychiatrist.'
        },
        createdAt: '2024-09-01T10:30:00Z',
        updatedAt: '2024-09-01T10:30:00Z'
      },
      // Intake document
      {
        id: 'doc-intake-2024-09-10T09:00:00Z-001',
        documentType: 'intake',
        clientId: 'client-004',
        status: 'complete',
        content: {
          date: '2024-09-10',
          duration: 90,
          delivery: 'In Person',
          demographicInfo: { age: 45, occupation: 'On disability leave' },
          presentingProblems: ['Major depression', 'Work disability', 'Low motivation'],
          mentalHealthHistory: 'Previous depressive episodes. Currently on antidepressant.',
          medicalHistory: 'Hypertension, managed with medication.',
          substanceUse: 'None',
          socialHistory: 'Married. Two adult children. On leave from work.',
          riskAssessment: { suicidalIdeation: false, homicidalIdeation: false, selfHarm: false },
          treatmentRecommendations: 'Weekly therapy coordinated with psychiatric care. Behavioral activation focus.'
        },
        createdAt: '2024-09-10T10:30:00Z',
        updatedAt: '2024-09-10T10:30:00Z'
      },
      // Diagnosis document
      {
        id: 'doc-diagnosis-2024-09-15T10:00:00Z-001',
        documentType: 'diagnosis',
        clientId: 'client-004',
        date: '2024-09-15',  // Top-level date field per unified documents API
        status: 'active',
        content: {
          icd10Code: 'F33.1',
          description: 'Major Depressive Disorder, recurrent, moderate',
          isPrincipal: true,
          severity: 'moderate',
          clinicalNotes: 'Recurrent episode. Coordinating with psychiatrist Dr. Wong.',
          dateResolved: null
        },
        createdAt: '2024-09-15T10:00:00Z',
        updatedAt: '2024-09-15T10:00:00Z'
      },
      // Treatment Plan document
      {
        id: 'doc-treatment_plan-2024-09-20T10:00:00Z-001',
        documentType: 'treatment_plan',
        clientId: 'client-004',
        status: 'active',
        content: {
          date: '2024-09-20',
          goals: [
            'Reduce depressive symptoms',
            'Return to work functioning',
            'Establish daily routine'
          ],
          interventions: ['Behavioral activation', 'Mood monitoring', 'Coordination with psychiatry'],
          targetSymptoms: ['Depression', 'Low motivation', 'Sleep disturbance'],
          notes: 'Collaborative care with psychiatrist. Weekly sessions.',
          reviewDate: '2025-01-20'
        },
        createdAt: '2024-09-20T10:00:00Z',
        updatedAt: '2024-09-20T10:00:00Z'
      },
      // Progress Note document (most recent is Treatment Plan review)
      {
        id: 'doc-progress_note-2025-01-07T10:00:00Z-001',
        documentType: 'progress_note',
        clientId: 'client-004',
        status: 'complete',
        content: {
          date: '2025-01-07',
          duration: 50,
          formType: 'Treatment Plan',
          delivery: 'Phone',
          purpose: '',
          mseEntries: [],
          therapeuticApproaches: [],
          therapeuticApproachesOther: '',
          interventions: [''],
          futureNotes: '',
          notes: 'Client reported stable mood and continued progress with depression management. Discussed medication adherence and coordination with psychiatrist. Explored return-to-work planning and activity scheduling.',
          narrative: 'Client showing sustained improvement in mood regulation. Good collaboration with psychiatric care. Focus shifting toward functional goals including work reintegration. Plan: Continue behavioral activation and mood monitoring.'
        },
        createdAt: '2025-01-07T10:00:00Z',
        updatedAt: '2025-01-07T10:00:00Z'
      }
    ],
    'client-005': [
      // Consultation document only (never started treatment)
      {
        id: 'doc-consultation-2024-06-10T10:00:00Z-001',
        documentType: 'consultation',
        clientId: 'client-005',
        status: 'complete',
        content: {
          date: '2024-06-10',
          duration: 20,
          delivery: 'Phone',
          referralSource: 'Self-referred',
          presentingConcerns: 'General stress, considering therapy',
          recommendedServices: 'Individual therapy',
          notes: 'Brief call. Client interested but unsure about scheduling. Will follow up.'
        },
        createdAt: '2024-06-10T10:30:00Z',
        updatedAt: '2024-06-10T10:30:00Z'
      }
    ],
    'client-006': [
      // Intake document
      {
        id: 'doc-intake-2024-03-01T09:00:00Z-001',
        documentType: 'intake',
        clientId: 'client-006',
        status: 'complete',
        content: {
          date: '2024-03-01',
          duration: 90,
          delivery: 'In Person',
          demographicInfo: { age: 38, occupation: 'Accountant' },
          presentingProblems: ['Work burnout', 'Anxiety', 'Work-life balance'],
          mentalHealthHistory: 'First time in therapy.',
          medicalHistory: 'Generally healthy.',
          substanceUse: 'Occasional alcohol',
          socialHistory: 'Single. Close friend group.',
          riskAssessment: { suicidalIdeation: false, homicidalIdeation: false, selfHarm: false },
          treatmentRecommendations: 'Weekly therapy for burnout recovery.'
        },
        createdAt: '2024-03-01T10:30:00Z',
        updatedAt: '2024-03-01T10:30:00Z'
      },
      // Diagnosis document
      {
        id: 'doc-diagnosis-2024-03-05T10:00:00Z-001',
        documentType: 'diagnosis',
        clientId: 'client-006',
        date: '2024-03-05',  // Top-level date field per unified documents API
        status: 'resolved',
        content: {
          icd10Code: 'Z73.0',
          description: 'Burnout, state of vital exhaustion',
          isPrincipal: true,
          severity: 'moderate',
          clinicalNotes: 'Work-related burnout. Good prognosis with lifestyle changes.',
          dateResolved: '2024-12-15'
        },
        createdAt: '2024-03-05T10:00:00Z',
        updatedAt: '2024-12-15T10:00:00Z'
      },
      // Treatment Plan document
      {
        id: 'doc-treatment_plan-2024-03-10T10:00:00Z-001',
        documentType: 'treatment_plan',
        clientId: 'client-006',
        status: 'completed',
        content: {
          date: '2024-03-10',
          goals: [
            'Reduce burnout symptoms',
            'Establish work-life boundaries',
            'Develop stress management skills'
          ],
          interventions: ['Stress management', 'Boundary setting', 'Values clarification'],
          targetSymptoms: ['Exhaustion', 'Cynicism', 'Reduced efficacy'],
          notes: 'Focus on recovery and prevention.',
          reviewDate: '2024-06-10'
        },
        createdAt: '2024-03-10T10:00:00Z',
        updatedAt: '2024-12-15T10:00:00Z'
      },
      // Progress Note documents (sample - would have many more for 24 sessions)
      {
        id: 'doc-progress_note-2024-12-15T10:00:00Z-001',
        documentType: 'progress_note',
        clientId: 'client-006',
        status: 'complete',
        content: {
          date: '2024-12-15',
          duration: 50,
          formType: 'Progress Note',
          delivery: 'In Person',
          purpose: 'Final session - Termination and relapse prevention',
          mseEntries: [],
          therapeuticApproaches: [],
          therapeuticApproachesOther: '',
          interventions: [''],
          futureNotes: '',
          notes: 'Final session. Reviewed progress and discussed relapse prevention strategies. Client met all treatment goals.',
          narrative: 'Termination session. Client successfully completed treatment, meeting all identified goals. Relapse prevention plan established. Client encouraged to return if needed.'
        },
        createdAt: '2024-12-15T10:00:00Z',
        updatedAt: '2024-12-15T10:00:00Z'
      },
      // Discharge document
      {
        id: 'doc-discharge-2024-12-20T10:00:00Z-001',
        documentType: 'discharge',
        clientId: 'client-006',
        status: 'complete',
        content: {
          date: '2024-12-20',
          reasonForDischarge: 'Treatment goals achieved',
          treatmentSummary: 'Client completed 24 sessions over 9 months. Successfully addressed work burnout, established healthy boundaries, and developed sustainable stress management practices.',
          treatmentOutcome: 'Goals met',
          finalDiagnosisStatus: 'Resolved',
          prognosis: 'Good',
          recommendationsForFutureCare: 'Continue practicing stress management techniques. Return for booster sessions if needed.',
          referrals: [],
          clientAcknowledgment: true
        },
        createdAt: '2024-12-20T10:00:00Z',
        updatedAt: '2024-12-20T10:00:00Z'
      }
    ],
    'client-007': [
      // No documents yet - brand new client
    ]
  },

  // Function to get mock client by ID
  getClient(clientId) {
    return this.clients.find(c => c.id === clientId);
  },

  // ========================================
  // UNIFIED DOCUMENT METHODS
  // ========================================

  /**
   * Get all documents for a client, optionally filtered by type and/or status
   * @param {string} clientId - The client ID
   * @param {string|null} type - Optional document type filter (e.g., 'progress_note', 'diagnosis')
   * @param {string|null} status - Optional status filter (e.g., 'active', 'complete')
   * @returns {Array} Array of documents
   */
  getDocuments(clientId, type = null, status = null) {
    let docs = this.documents[clientId] || [];

    if (type) {
      docs = docs.filter(d => d.documentType === type);
    }

    if (status) {
      docs = docs.filter(d => d.status === status);
    }

    // Sort by createdAt descending (most recent first)
    return docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  /**
   * Get a single document by ID
   * @param {string} clientId - The client ID
   * @param {string} documentId - The document ID
   * @returns {Object|null} The document or null if not found
   */
  getDocument(clientId, documentId) {
    const docs = this.documents[clientId] || [];
    return docs.find(d => d.id === documentId) || null;
  },

  /**
   * Check if a string is a valid UUID v4
   * @param {string} str - String to check
   * @returns {boolean} True if valid UUID
   */
  _isValidUUID(str) {
    if (!str || typeof str !== 'string') return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  },

  /**
   * Check if a document ID already exists (across all clients)
   * @param {string} docId - Document ID to check
   * @returns {boolean} True if ID exists
   */
  _documentIdExists(docId) {
    for (const clientId in this.documents) {
      if (this.documents[clientId].some(d => d.id === docId)) {
        return true;
      }
    }
    return false;
  },

  /**
   * Create a new document
   * @param {string} clientId - The client ID
   * @param {string} documentType - The document type (e.g., 'progress_note', 'diagnosis')
   * @param {Object} content - The document content
   * @param {string} status - The initial status (default based on type)
   * @param {string} providedId - Optional UUID to use as document ID (must be valid UUID)
   * @returns {Object} The created document
   * @throws {Error} With status 409 if providedId already exists
   */
  createDocument(clientId, documentType, content, status = null, providedId = null) {
    if (!this.documents[clientId]) {
      this.documents[clientId] = [];
    }

    const now = new Date().toISOString();

    // Determine document ID
    let docId;
    if (providedId && this._isValidUUID(providedId)) {
      // Check if ID already exists (simulate 409 Conflict)
      if (this._documentIdExists(providedId)) {
        const error = new Error('Document ID already exists');
        error.status = 409;
        throw error;
      }
      docId = providedId;
    } else {
      // Generate timestamp-based ID (legacy behavior)
      const uniqueId = String(Date.now()).slice(-3);
      docId = `doc-${documentType}-${now}-${uniqueId}`;
    }

    // Default status based on document type
    const defaultStatus = {
      'progress_note': 'draft',
      'diagnosis': 'provisional',
      'treatment_plan': 'active',
      'intake': 'complete',
      'consultation': 'complete',
      'discharge': 'complete'
    };

    const newDocument = {
      id: docId,
      documentType,
      clientId,
      status: status || defaultStatus[documentType] || 'draft',
      content,
      createdAt: now,
      updatedAt: now
    };

    this.documents[clientId].push(newDocument);
    return newDocument;
  },

  /**
   * Update an existing document
   * @param {string} clientId - The client ID
   * @param {string} documentId - The document ID
   * @param {Object} updates - Updates to apply (can include status and/or content updates)
   * @returns {Object|null} The updated document or null if not found
   */
  updateDocument(clientId, documentId, updates) {
    const docs = this.documents[clientId];
    if (!docs) return null;

    const index = docs.findIndex(d => d.id === documentId);
    if (index === -1) return null;

    const doc = docs[index];
    const updatedDoc = {
      ...doc,
      ...updates,
      // If content updates are provided, merge them
      content: updates.content ? { ...doc.content, ...updates.content } : doc.content,
      updatedAt: new Date().toISOString()
    };

    this.documents[clientId][index] = updatedDoc;
    return updatedDoc;
  },

  /**
   * Delete a document
   * @param {string} clientId - The client ID
   * @param {string} documentId - The document ID
   * @returns {boolean} True if deleted, false if not found
   */
  deleteDocument(clientId, documentId) {
    const docs = this.documents[clientId];
    if (!docs) return false;

    const index = docs.findIndex(d => d.id === documentId);
    if (index === -1) return false;

    this.documents[clientId].splice(index, 1);
    return true;
  },

  /**
   * Compute completed form types from documents
   * @param {string} clientId - The client ID
   * @returns {Array} Array of display names for completed form types
   */
  getCompletedFormTypes(clientId) {
    const docs = this.documents[clientId] || [];
    const types = new Set();

    docs.forEach(doc => {
      // Map internal type to display name
      const displayName = DOCUMENT_TYPE_DISPLAY_NAMES[doc.documentType];
      if (displayName) {
        types.add(displayName);
      }
    });

    return Array.from(types);
  },

  /**
   * Get current (principal active) diagnosis from documents
   * @param {string} clientId - The client ID
   * @returns {Object|null} The current diagnosis document or null
   */
  getCurrentDiagnosisFromDocs(clientId) {
    const diagnoses = this.getDocuments(clientId, 'diagnosis');

    // Find principal active diagnosis
    const principal = diagnoses.find(d =>
      d.content.isPrincipal && d.status !== 'resolved'
    );
    if (principal) return principal;

    // Otherwise return first non-resolved diagnosis
    return diagnoses.find(d => d.status !== 'resolved') || null;
  },

  /**
   * Get all diagnoses from documents (for diagnosis management UI)
   * @param {string} clientId - The client ID
   * @param {string|null} status - Optional status filter
   * @returns {Array} Array of diagnosis documents, formatted for UI compatibility
   */
  getDiagnosesFromDocs(clientId, status = null) {
    let diagnoses = this.getDocuments(clientId, 'diagnosis');

    if (status) {
      diagnoses = diagnoses.filter(d => d.status === status);
    }

    // Transform to match expected UI format (flatten content)
    // Map document-level date to dateOfDiagnosis for UI compatibility
    return diagnoses.map(d => ({
      id: d.id,
      clientId: d.clientId,
      ...d.content,
      dateOfDiagnosis: d.date || d.content?.dateOfDiagnosis,  // Prefer doc-level date
      status: d.status,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt
    }));
  },

  /**
   * Get current (active) treatment plan from documents
   * @param {string} clientId - The client ID
   * @returns {Object|null} The current treatment plan document or null
   */
  getCurrentTreatmentPlanFromDocs(clientId) {
    const plans = this.getDocuments(clientId, 'treatment_plan');

    // Find active treatment plan
    const active = plans.find(d => d.status === 'active');
    if (active) {
      // Transform to match expected UI format
      return {
        id: active.id,
        clientId: active.clientId,
        ...active.content,
        status: active.status,
        createdAt: active.createdAt,
        updatedAt: active.updatedAt
      };
    }

    return null;
  },

  /**
   * Get the last session (most recent progress note) from documents
   * @param {string} clientId - The client ID
   * @returns {Object|null} The most recent progress note or null
   */
  getLastSessionFromDocs(clientId) {
    const progressNotes = this.getDocuments(clientId, 'progress_note');

    if (progressNotes.length === 0) return null;

    // Documents are already sorted by createdAt descending
    const latest = progressNotes[0];

    // Transform to match expected session format
    return {
      id: latest.id,
      clientId: latest.clientId,
      ...latest.content,
      createdAt: latest.createdAt,
      updatedAt: latest.updatedAt
    };
  },

  /**
   * Get all sessions (progress notes) from documents
   * @param {string} clientId - The client ID
   * @returns {Array} Array of session objects
   */
  getSessionsFromDocs(clientId) {
    const progressNotes = this.getDocuments(clientId, 'progress_note');

    // Transform to match expected session format
    return progressNotes.map(doc => ({
      id: doc.id,
      clientId: doc.clientId,
      ...doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }));
  },

  /**
   * Generate a mock narrative progress note based on the interpolated prompt.
   * Analyzes the prompt content to produce contextually relevant text.
   */
  generateMockNarrative(interpolatedPrompt) {
    // Extract context from the prompt to make mock feel realistic
    const promptLower = interpolatedPrompt.toLowerCase();
    const hasAnxiety = promptLower.includes('anxiety') || promptLower.includes('anxious');
    const hasDepression = promptLower.includes('depression') || promptLower.includes('depressed');
    const hasTrauma = promptLower.includes('trauma') || promptLower.includes('ptsd');
    const hasGrief = promptLower.includes('grief') || promptLower.includes('loss');
    const hasCBT = promptLower.includes('cbt') || promptLower.includes('cognitive');
    const hasSomatic = promptLower.includes('somatic') || promptLower.includes('body');
    const hasPsychodynamic = promptLower.includes('psychodynamic');

    // Opening paragraphs
    const openings = [
      'Client presented for their scheduled therapy session, appearing on time and appropriately dressed.',
      'Client arrived punctually for today\'s individual therapy session.',
      'This session focused on continuing therapeutic work with the client in their ongoing treatment.'
    ];

    // MSE descriptions
    const mseDescriptions = [
      'Mental status examination revealed the client to be alert and oriented to person, place, and time. Affect was appropriate to content discussed, with good eye contact maintained throughout the session. Speech was normal in rate, rhythm, and volume. Thought processes appeared linear and goal-directed.',
      'On mental status examination, the client presented with euthymic mood and congruent affect. The client was well-groomed with appropriate hygiene. Cognitive functioning appeared intact, with no evidence of perceptual disturbances.',
      'The client demonstrated appropriate affect throughout the session. Thought content was relevant to presenting concerns, with no evidence of suicidal or homicidal ideation. Judgment and insight were fair to good.'
    ];

    // Build intervention descriptions based on detected content
    const interventionParts = [];

    if (hasCBT) {
      interventionParts.push('Cognitive-behavioral techniques were employed to help the client identify and challenge maladaptive thought patterns. The client demonstrated understanding of the connection between thoughts, feelings, and behaviors.');
    }
    if (hasAnxiety) {
      interventionParts.push('Relaxation techniques and grounding exercises were practiced to address anxiety symptoms. The client reported finding these strategies helpful and expressed willingness to continue practicing between sessions.');
    }
    if (hasDepression) {
      interventionParts.push('Behavioral activation strategies were discussed to increase engagement in pleasurable activities. The client identified several activities they could incorporate into their daily routine.');
    }
    if (hasTrauma) {
      interventionParts.push('Trauma-informed interventions were utilized, with careful attention to pacing and client safety. The client demonstrated appropriate affect regulation during discussion of sensitive material.');
    }
    if (hasGrief) {
      interventionParts.push('Grief processing continued with exploration of the client\'s relationship with the deceased and the meaning of the loss. Normalization of grief responses was provided.');
    }
    if (hasSomatic) {
      interventionParts.push('Somatic awareness exercises were facilitated to help the client connect with bodily sensations and develop greater interoceptive awareness.');
    }
    if (hasPsychodynamic) {
      interventionParts.push('Psychodynamic exploration revealed patterns connecting early experiences to current relational dynamics. The client demonstrated increasing insight into these patterns.');
    }
    if (interventionParts.length === 0) {
      interventionParts.push('Therapeutic interventions focused on building insight and developing adaptive coping strategies. The client was receptive to interventions and actively participated in the therapeutic process.');
    }

    // Closing paragraphs
    const closings = [
      'The client tolerated the session well and demonstrated good engagement throughout. Treatment plan remains appropriate, and the client expressed motivation to continue working on identified goals. Next session scheduled as planned.',
      'Overall, this was a productive session with the client showing continued progress toward treatment goals. The therapeutic alliance remains strong, and the client is responding well to the current treatment approach.',
      'Client was receptive to interventions and demonstrated commitment to the therapeutic process. Will continue current treatment approach with attention to identified themes. Follow-up appointment confirmed.'
    ];

    // Assemble the narrative
    const opening = openings[Math.floor(Math.random() * openings.length)];
    const mse = mseDescriptions[Math.floor(Math.random() * mseDescriptions.length)];
    const interventions = interventionParts.join(' ');
    const closing = closings[Math.floor(Math.random() * closings.length)];

    const narrative = `${opening}\n\n${mse}\n\n${interventions}\n\n${closing}`;

    // Generate mock thinking based on detected content
    const thinkingParts = [
      'I\'ll structure this progress note with a clear opening, MSE observations, intervention details, and a closing summary.'
    ];

    if (hasAnxiety) {
      thinkingParts.push('The session data mentions anxiety, so I\'ll incorporate anxiety-specific interventions and observations.');
    }
    if (hasDepression) {
      thinkingParts.push('Depression is indicated, so I\'ll reference mood-related content and behavioral activation strategies.');
    }
    if (hasTrauma) {
      thinkingParts.push('Given the trauma-related content, I\'ll be careful to use appropriate clinical language and note safety considerations.');
    }
    if (hasCBT) {
      thinkingParts.push('CBT approaches were used, so I\'ll highlight cognitive restructuring and behavioral techniques.');
    }
    if (hasSomatic) {
      thinkingParts.push('Somatic work was done, so I\'ll include references to body awareness and interoceptive exercises.');
    }

    thinkingParts.push('I\'ll maintain a professional yet warm tone throughout, using third person past tense as required.');

    const thinking = thinkingParts.join('\n\n');

    // Return with XML tags as required by the updated prompt format
    return `<thinking>\n${thinking}\n</thinking>\n\n<narrative>\n${narrative}\n</narrative>`;
  },

  // Lexicon configuration data
  lexicon: {
    version: 1,
    updatedAt: "2025-12-16T00:00:00.000Z",
    updatedBy: "drkhorney@contextmatterstherapy.com",

    // Copy of InterventionLexicon data
    interventionLexicon: {
      TH: [
        { string: "rapport", frames: ["[V _]"], approaches: [] },
        { string: "present moment", frames: ["[V _]", "[V P _]"], approaches: [] },
        {
          string: "safety planning",
          frames: ["[_]", "[V _]"],
          approaches: [],
          categoryFilters: { V: { mode: "allow", values: ["encouraged", "facilitated"] } }
        },
        { string: "normalized", frames: ["[_ *]"], approaches: [] },
        {
          string: "psychoeducation",
          frames: ["[V _]", "[V _ *]"],
          approaches: [],
          categoryFilters: { V: { mode: "allow", values: ["provided"] } }
        },
        { string: "visualization exercise", frames: ["[_]", "[_ *]"], approaches: [] },
        {
          string: "somatic tracking exercise",
          frames: ["[V _]"],
          approaches: ["somatic-therapy"],
          categoryFilters: { V: { mode: "allow", values: ["facilitated"] } }
        }
      ],

      V: ["built", "anchored", "encouraged", "provided", "facilitated"],
      P: ["to"],

      categoryMeta: {
        V: { label: "Action" },
        P: { label: "Preposition" }
      }
    },

    // Copy of TherapeuticApproaches data
    therapeuticApproaches: [
      { value: "attachment-based-therapy", name: "Attachment" },
      { value: "coherence-therapy", name: "Coherence" },
      { value: "emotion-focused-therapy", name: "Emotion Focused" },
      { value: "feminist-therapy", name: "Feminist" },
      { value: "humanistic-therapy", name: "Humanistic" },
      { value: "parts-work-therapy", name: "Parts Work" },
      { value: "psychodynamic-therapy", name: "Psychodynamic" },
      { value: "somatic-therapy", name: "Somatic" }
    ]
  },

  // Seed data for intervention usage (simulates historical usage patterns)
  // Structure matches what recordInterventionUsage() creates in localStorage
  interventionUsage: {
    usage: {
      // High frequency - core therapeutic interventions
      'rapport': { total: 47, 'client-001': 8, 'client-002': 12, 'client-003': 9, 'client-004': 6, 'client-005': 7, 'client-007': 5 },
      'validation-emotions': { total: 42, 'client-001': 10, 'client-002': 8, 'client-003': 7, 'client-004': 9, 'client-005': 5, 'client-006': 3 },
      'present-moment': { total: 38, 'client-001': 7, 'client-002': 9, 'client-003': 8, 'client-004': 6, 'client-005': 5, 'client-007': 3 },
      'psychoeducation': { total: 35, 'client-001': 6, 'client-002': 7, 'client-003': 5, 'client-004': 8, 'client-005': 4, 'client-006': 3, 'client-007': 2 },
      'normalization': { total: 31, 'client-001': 5, 'client-002': 6, 'client-003': 7, 'client-004': 5, 'client-005': 4, 'client-006': 4 },

      // Medium frequency - commonly used techniques
      'breathing': { total: 28, 'client-001': 6, 'client-002': 5, 'client-003': 8, 'client-005': 5, 'client-007': 4 },
      'strengths': { total: 25, 'client-001': 4, 'client-002': 5, 'client-003': 4, 'client-004': 6, 'client-005': 3, 'client-006': 3 },
      'reframing': { total: 22, 'client-001': 5, 'client-002': 4, 'client-004': 7, 'client-005': 3, 'client-007': 3 },
      'grounding': { total: 20, 'client-001': 3, 'client-003': 6, 'client-005': 5, 'client-006': 4, 'client-007': 2 },
      'reflective-listening': { total: 18, 'client-002': 5, 'client-003': 4, 'client-004': 4, 'client-006': 3, 'client-007': 2 },

      // Lower frequency - specialized interventions
      'attachment-exploration': { total: 14, 'client-001': 5, 'client-002': 4, 'client-004': 3, 'client-006': 2 },
      'parts-dialogue': { total: 12, 'client-001': 4, 'client-003': 3, 'client-005': 3, 'client-007': 2 },
      'somatic-awareness': { total: 11, 'client-003': 4, 'client-005': 4, 'client-006': 3 },
      'empty-chair': { total: 9, 'client-001': 3, 'client-002': 2, 'client-004': 2, 'client-007': 2 },
      'body-scan': { total: 8, 'client-003': 3, 'client-005': 3, 'client-006': 2 },
      'emotion-tracking': { total: 7, 'client-002': 3, 'client-004': 2, 'client-007': 2 },
      'timeline-work': { total: 5, 'client-001': 2, 'client-004': 2, 'client-006': 1 },
      'visualization': { total: 4, 'client-003': 2, 'client-005': 2 }
    },
    lastUpdated: '2025-01-03T16:30:00Z'
  }
};
