import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type { Response } from 'express';
import { ZodError } from 'zod';
import { plannerRequestSchema, questionsSchema, synthesisSchema, evaluationsSchema,
  budgetCategorySchema, taskStatusSchema, schedulePhaseSchema, summarySchema,
  outreachSchema, crisisSchema } from '../src/validation/plannerContracts';

interface PlannerRequest {
  method?: string;
  body?: unknown;
  headers: Record<string, string | string[] | undefined>;
}
type PlannerResponse = Pick<Response, 'status' | 'json' | 'setHeader' | 'end'>;
import {
  ClarifyingQuestion,
  FestIntakeConfig,
  FestMasterPlan,
  VendorQuote,
  VolunteerTask,
} from '../src/types';
import { INITIAL_FEST_MASTER_PLAN } from '../src/data/seedFestData';
import {
  buildCoordinatorOutreachFromTask,
  buildCrisisSimulationFromIntake,
  buildExecutiveOpsSummaryFromPlan,
  buildPlanFromUserIntake,
  buildTailoredClarifyingQuestionsFromIntake,
  getEffectiveFestCategory,
} from '../src/utils/festEngine';

const MODEL_NAME = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

function getServerGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey === 'your_google_ai_studio_api_key_here' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      timeout: 18_000,
      retryOptions: { attempts: 1 },
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export const CLARIFYING_QUESTIONS_SCHEMA: Schema = {
  type: Type.ARRAY,
  description:
    '3 to 4 targeted clarifying questions for a university tech-fest before generating the master execution plan.',
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      category: {
        type: Type.STRING,
        description:
          'One of: Campus Permissions, Multi-Track Room Clashes, Sponsor Timelines, Overnight Logistics',
      },
      question: { type: Type.STRING },
      whyItMatters: { type: Type.STRING },
      suggestedOptions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      answer: { type: Type.STRING },
    },
    required: [
      'id',
      'category',
      'question',
      'whyItMatters',
      'suggestedOptions',
      'answer',
    ],
  },
};

export const MASTER_PLAN_SYNTHESIS_SCHEMA: Schema = {
  type: Type.OBJECT,
  description:
    'Synthesized schedule adjustments and budget allocations based on intake and clarifying answers.',
  properties: {
    schedule: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          code: { type: Type.STRING },
          title: { type: Type.STRING },
          track: { type: Type.STRING },
          phase: { type: Type.STRING, enum: schedulePhaseSchema.options },
          tier: { type: Type.STRING, enum: ['Critical-Path Approval', 'Downstream Vendor/Volunteer'] },
          daySlot: { type: Type.STRING },
          venue: { type: Type.STRING },
          ownerCoordinator: { type: Type.STRING },
          department: { type: Type.STRING },
          dependsOnIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          status: { type: Type.STRING, enum: taskStatusSchema.options },
          blockedIfDelayedWarning: { type: Type.STRING },
          blockerNote: { type: Type.STRING },
        },
        required: [
          'id',
          'code',
          'title',
          'track',
          'phase',
          'tier',
          'daySlot',
          'venue',
          'ownerCoordinator',
          'department',
          'dependsOnIds',
          'status',
          'blockedIfDelayedWarning',
        ],
      },
    },
    budget: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          category: { type: Type.STRING, enum: budgetCategorySchema.options },
          itemTitle: { type: Type.STRING },
          track: { type: Type.STRING },
          priority: { type: Type.STRING, enum: ['Must-Have', 'Flexible', 'Nice-to-Have'] },
          aiEstimateINR: { type: Type.NUMBER },
          confirmedQuoteINR: { type: Type.NUMBER, nullable: true },
          quoteStatus: { type: Type.STRING, enum: ['AI Estimate'] },
          lockedVendorName: { type: Type.STRING },
          sponsorBackedINR: { type: Type.NUMBER },
          notes: { type: Type.STRING },
        },
        required: [
          'id',
          'category',
          'itemTitle',
          'track',
          'priority',
          'aiEstimateINR',
          'confirmedQuoteINR',
          'quoteStatus',
          'sponsorBackedINR',
          'notes',
        ],
      },
    },
  },
  required: ['schedule', 'budget'],
};

export const EXECUTIVE_OPS_SUMMARY_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    generatedAt: { type: Type.STRING },
    readinessScoreLabel: { type: Type.STRING },
    executiveProgressSnapshot: { type: Type.STRING },
    headlineBottleneck: { type: Type.STRING },
    criticalRisks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    immediateNextActions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          owner: { type: Type.STRING },
          squad: { type: Type.STRING },
          action: { type: Type.STRING },
          timeframe: { type: Type.STRING },
        },
        required: ['owner', 'squad', 'action', 'timeframe'],
      },
    },
    broadcasts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          audience: {
            type: Type.STRING,
            enum: [
              'Volunteer Leads',
              "University Faculty Advisors / Dean's Office",
              'Pending Vendors / Sponsors',
            ],
          },
          channel: {
            type: Type.STRING,
            enum: [
              'WhatsApp Squad Broadcast',
              'Official Dean/Faculty Email',
              'Vendor SLA Escalation',
            ],
          },
          subjectLine: { type: Type.STRING },
          messageBody: { type: Type.STRING },
        },
        required: ['audience', 'channel', 'subjectLine', 'messageBody'],
      },
    },
  },
  required: [
    'generatedAt',
    'readinessScoreLabel',
    'executiveProgressSnapshot',
    'headlineBottleneck',
    'criticalRisks',
    'immediateNextActions',
    'broadcasts',
  ],
};

export const OUTREACH_DRAFT_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    recipientName: { type: Type.STRING },
    recipientRole: { type: Type.STRING },
    channel: {
      type: Type.STRING,
      enum: [
        'WhatsApp Squad Broadcast',
        'Official Dean/Faculty Email',
        'Vendor SLA Escalation',
      ],
    },
    subjectLine: { type: Type.STRING },
    messageBody: { type: Type.STRING },
    actionChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
  },
  required: [
    'recipientName',
    'recipientRole',
    'channel',
    'subjectLine',
    'messageBody',
    'actionChecklist',
  ],
};

export const CRISIS_SIMULATION_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    scenarioId: { type: Type.STRING },
    scenarioTitle: { type: Type.STRING },
    rippleAnalysis: { type: Type.STRING },
    impactedCategories: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
        enum: budgetCategorySchema.options,
      },
    },
    impactedVenueTracks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    impactedSquads: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    beforeFootfall: { type: Type.NUMBER },
    afterFootfall: { type: Type.NUMBER },
    ProjectedUnmitigatedOverrunINR: { type: Type.NUMBER },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          optionLabel: { type: Type.STRING },
          strategyTitle: { type: Type.STRING },
          summary: { type: Type.STRING },
          budgetDeltaINR: { type: Type.NUMBER },
          targetBudgetCategory: {
            type: Type.STRING,
            enum: budgetCategorySchema.options,
          },
          scheduleAdjustment: { type: Type.STRING },
          affectedScheduleId: { type: Type.STRING },
          volunteerReallocation: { type: Type.STRING },
          affectedTaskId: { type: Type.STRING },
          riskTradeOff: { type: Type.STRING },
          recommended: { type: Type.BOOLEAN },
        },
        required: [
          'id',
          'optionLabel',
          'strategyTitle',
          'summary',
          'budgetDeltaINR',
          'targetBudgetCategory',
          'scheduleAdjustment',
          'volunteerReallocation',
          'riskTradeOff',
        ],
      },
    },
  },
  required: [
    'scenarioId',
    'scenarioTitle',
    'rippleAnalysis',
    'impactedCategories',
    'impactedVenueTracks',
    'impactedSquads',
    'beforeFootfall',
    'afterFootfall',
    'ProjectedUnmitigatedOverrunINR',
    'options',
  ],
};

export const VENDOR_QUOTE_COMPARISON_SCHEMA: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING },
      budgetFitScore: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      campusReliabilityScore: { type: Type.NUMBER, minimum: 0, maximum: 100 },
      hiddenCostRisk: { type: Type.STRING, enum: ['Low', 'Moderate', 'High'] },
      negotiationTip: { type: Type.STRING },
      aiRecommendationNote: { type: Type.STRING },
    },
    required: [
      'id',
      'budgetFitScore',
      'campusReliabilityScore',
      'hiddenCostRisk',
      'negotiationTip',
      'aiRecommendationNote',
    ],
  },
};

export const VENDOR_QUOTES_EVALUATION_SCHEMA: Schema =
  VENDOR_QUOTE_COMPARISON_SCHEMA;

export async function handlePlannerApiRequest(
  req: PlannerRequest,
  res: PlannerResponse
) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!/^application\/json(?:\s*;|$)/i.test(String(req.headers['content-type'] ?? ''))) {
    return res.status(415).json({ error: 'Content-Type must be application/json' });
  }
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (!raw) return res.status(400).json({ error: 'Request body is required' });
    if (Buffer.byteLength(raw, 'utf8') > 128 * 1024) {
      return res.status(413).json({ error: 'Request body is too large' });
    }
    const { action, payload } = plannerRequestSchema.parse(JSON.parse(raw));
    const ai = getServerGenAI();
    if (action === 'generateClarifyingQuestions') {
      const intake: FestIntakeConfig =
        payload?.intake ?? INITIAL_FEST_MASTER_PLAN.intake;
      const effectiveCat = getEffectiveFestCategory(intake);
      const venuesText =
        (intake.concurrentVenueTracks ?? []).join(', ') ||
        intake.primaryVenues ||
        'Main Venue';

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `You are CampusPulse AI, a university & community event execution engine. Generate 4 targeted clarifying questions tailored specifically to this event brief before building the master plan:
- Event Name: "${intake.festName}"
- Category: ${effectiveCat}
- Venue Setting: ${intake.venueType || 'College Campus'}
- Location / Locality: ${intake.eventLocality || 'Campus'}
- Date(s) & Timings: ${intake.dates} (${intake.startTime || '09:00 AM'} to ${intake.endTime || '06:00 PM'})
- Expected Footfall: ${intake.expectedFootfall} attendees
- Total Budget: ₹${intake.totalBudgetINR}
- Weeks Until Event: ${intake.weeksUntilFest}
- Active Volunteer Coordinators: ${intake.activeVolunteerCoordinators}
- Concurrent Venues: ${venuesText}
- Additional Custom Context from Organizer: "${intake.additionalContextNotes || 'None'}"

Cover these 4 categories in order: "Campus Permissions", "Multi-Track Room Clashes", "Sponsor Timelines", "Overnight Logistics". Make every question and its 3 suggestedOptions explicitly reference "${intake.festName}", "${intake.eventLocality || 'the venue'}", "${intake.startTime || '09:00 AM'}–${intake.endTime || '06:00 PM'}", and ₹${intake.totalBudgetINR}.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: CLARIFYING_QUESTIONS_SCHEMA,
            },
          });
          if (response.text) {
            const parsed = questionsSchema.parse(JSON.parse(response.text));
            if (Array.isArray(parsed) && parsed.length > 0) {
              return res.json({ data: parsed, source: MODEL_NAME });
            }
          }
        } catch {
          // Fall through to dynamic intake-calibrated questions
        }
      }

      const tailoredQuestions =
        buildTailoredClarifyingQuestionsFromIntake(intake);

      return res.json({ data: tailoredQuestions, source: 'deterministic' });
    }

    if (
      action === 'synthesizeMasterPlan' ||
      action === 'generateMasterFestPlan'
    ) {
      const intake: FestIntakeConfig =
        payload?.intake ?? INITIAL_FEST_MASTER_PLAN.intake;
      const questions: ClarifyingQuestion[] =
        payload?.clarifyingQuestions ??
        buildTailoredClarifyingQuestionsFromIntake(intake);

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Synthesize a 4-phase dependency-sequenced schedule and dual-track budget in INR (₹) for "${intake.festName}" (${getEffectiveFestCategory(intake)}) at ${intake.eventLocality || 'Campus'} (${intake.venueType || 'College Campus'}) on ${intake.dates} (${intake.startTime || '09:00 AM'}–${intake.endTime || '06:00 PM'}) with total budget ₹${intake.totalBudgetINR} and expected footfall ${intake.expectedFootfall}. Clarifying answers: ${JSON.stringify(questions.map((q) => ({ category: q.category, answer: q.answer })))}. Additional organizer instructions: "${intake.additionalContextNotes || 'None'}".`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: MASTER_PLAN_SYNTHESIS_SCHEMA,
            },
          });
          if (response.text) {
            const parsed = synthesisSchema.parse(JSON.parse(response.text));
            if (parsed.budget.reduce((sum, item) => sum + item.aiEstimateINR, 0) > intake.totalBudgetINR) {
              throw new Error('Generated budget exceeds the intake cap');
            }
            return res.json({ data: parsed, source: MODEL_NAME });
          }
        } catch {
          // Fall through to dynamic intake-calibrated synthesis
        }
      }

      const generated = buildPlanFromUserIntake(intake, questions);

      return res.json({
        data: { schedule: generated.schedule, budget: generated.budget },
        source: 'deterministic',
      });
    }

    if (
      action === 'generateExecutiveOpsSummary' ||
      action === 'generateOpsSummary'
    ) {
      const plan: FestMasterPlan = payload?.plan ?? INITIAL_FEST_MASTER_PLAN;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Generate an executive operational summary for fest "${plan.intake.festName}" (${plan.intake.dates}, ₹${plan.intake.totalBudgetINR} budget, ${plan.intake.expectedFootfall} attendees). Current schedule milestones: ${plan.schedule.length}, budget items: ${plan.budget.length}, tasks: ${plan.volunteerTasks.length}, logs: ${plan.coordinatorLogs.length}. Synthesize readiness label, executive progress snapshot, headline bottleneck, critical risks, immediate next actions, and 3 broadcasts.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: EXECUTIVE_OPS_SUMMARY_SCHEMA,
            },
          });
          if (response.text) {
            const parsed = summarySchema.parse(JSON.parse(response.text));
            return res.json({ data: parsed, source: MODEL_NAME });
          }
        } catch {
          // Fall through to deterministic engine
        }
      }

      const dynamicSummary = buildExecutiveOpsSummaryFromPlan(plan);
      return res.json({ data: dynamicSummary, source: 'deterministic' });
    }

    if (
      action === 'draftOutreachMessage' ||
      action === 'draft-coordinator-outreach'
    ) {
      const task: VolunteerTask =
        payload?.task ?? INITIAL_FEST_MASTER_PLAN.volunteerTasks[0];
      const festName: string =
        payload?.festName ?? INITIAL_FEST_MASTER_PLAN.intake.festName;
      const intake: FestIntakeConfig = payload?.intake ?? {
        ...INITIAL_FEST_MASTER_PLAN.intake,
        festName,
      };

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Draft an urgent coordinator outreach message for "${intake.festName}" on ${intake.dates} at ${intake.eventLocality || 'Campus'}. Task Code: ${task.taskCode}, Title: "${task.title}", Lead: ${task.coordinatorName} (${task.coordinatorRole || task.department}), Status: ${task.status}, Assigned Crew: ${task.assignedVolunteersCount}, Window: ${task.deadlineWindow}, Bottleneck Note: ${task.bottleneckReason || 'Nominal'}. Generate channel, subjectLine, messageBody, and actionChecklist.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: OUTREACH_DRAFT_SCHEMA,
            },
          });
          if (response.text) {
            const parsed = outreachSchema.parse(JSON.parse(response.text));
            return res.json({ data: parsed, source: MODEL_NAME });
          }
        } catch {
          // Fall through to deterministic engine
        }
      }

      const draft = buildCoordinatorOutreachFromTask(task, intake);
      return res.json({ data: draft, source: 'deterministic' });
    }

    if (
      action === 'simulateCrisisRipple' ||
      action === 'simulateConstraintShock'
    ) {
      const scenarioId: string = payload?.scenarioId ?? 'crisis-reg-surge';
      const customPrompt: string | undefined =
        payload?.customShockDescription ?? payload?.customDescription;
      const plan: FestMasterPlan = payload?.plan ?? INITIAL_FEST_MASTER_PLAN;

      if (ai) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Simulate a real-time crisis constraint shock for "${plan.intake.festName}" (Scenario ID: "${scenarioId}", Custom Prompt: "${customPrompt || 'None'}"). Total budget: ₹${plan.intake.totalBudgetINR}, Footfall: ${plan.intake.expectedFootfall}, Venues: ${plan.intake.concurrentVenueTracks.join(', ')}. Return rippleAnalysis, impactedCategories, impactedVenueTracks, impactedSquads, beforeFootfall, afterFootfall, ProjectedUnmitigatedOverrunINR, and exactly 3 concrete trade-off options.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: CRISIS_SIMULATION_SCHEMA,
            },
          });
          if (response.text) {
            const parsed = crisisSchema.parse(JSON.parse(response.text));
            return res.json({ data: parsed, source: MODEL_NAME });
          }
        } catch {
          // Fall through to deterministic engine
        }
      }

      const dynamicResult = buildCrisisSimulationFromIntake(
        scenarioId,
        plan,
        customPrompt
      );
      return res.json({ data: dynamicResult, source: 'deterministic' });
    }

    if (action === 'evaluateVendorQuotes') {
      const quotes: VendorQuote[] = payload?.quotes ?? [];
      const category: string = payload?.category ?? 'Catering';
      const aiEstimateINR: number = payload?.aiEstimateINR ?? 100000;

      if (ai && quotes.length > 0) {
        try {
          const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: `Evaluate these competing university fest vendor quotes for category "${category}" (AI Estimate Baseline: ₹${aiEstimateINR}): ${JSON.stringify(quotes)}. Score each vendor on budgetFitScore (0-100), campusReliabilityScore (0-100), hiddenCostRisk ('Low' | 'Moderate' | 'High'), negotiationTip, and aiRecommendationNote.`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: VENDOR_QUOTES_EVALUATION_SCHEMA,
            },
          });
          if (response.text) {
            const evals = evaluationsSchema.parse(JSON.parse(response.text));
            const allowedIds = new Set(quotes.map(q => q.id));
            if (evals.length !== quotes.length || new Set(evals.map(e => e.id)).size !== quotes.length ||
                evals.some(e => !allowedIds.has(e.id))) throw new Error('Mismatched quote IDs');
            const byId = new Map(evals.map(e => [e.id, e]));
            const merged = quotes.map((q) => {
              const match = byId.get(q.id);
              return match ? { ...q, ...match } : q;
            });
            return res.json({ data: merged, source: MODEL_NAME });
          }
        } catch {
          // Fall through to deterministic engine-calibrated quote scoring
        }
      }

      // Deterministic AI scoring calibration
      const calibrated = quotes.map((q) => {
        const delta = q.totalQuoteINR - aiEstimateINR;
        const budgetFitScore =
          delta <= 0
            ? Math.min(99, 92 + Math.round(Math.abs(delta) / 2500))
            : Math.max(55, 85 - Math.round(delta / 1500));
        return {
          ...q,
          budgetFitScore,
        };
      });

      return res.json({ data: calibrated, source: 'engine-calibrated' });
    }

    return res.status(400).json({ error: `Unknown planner action: ${action}` });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof ZodError) {
      return res.status(400).json({ error: 'Invalid planner request' });
    }
    console.error('Planner request failed');
    return res.status(500).json({ error: 'Unable to process planner request' });
  }
}

export default handlePlannerApiRequest;
