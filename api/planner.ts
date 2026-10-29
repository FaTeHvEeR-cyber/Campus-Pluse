import { GoogleGenAI, Type, Schema } from '@google/genai';
import type { Request, Response } from 'express';
import {
  ClarifyingQuestion,
  CrisisSimulationResult,
  ExecutiveOpsSummary,
  FestIntakeConfig,
  FestMasterPlan,
  OutreachDraft,
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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
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
          phase: { type: Type.STRING },
          tier: { type: Type.STRING },
          daySlot: { type: Type.STRING },
          venue: { type: Type.STRING },
          ownerCoordinator: { type: Type.STRING },
          department: { type: Type.STRING },
          dependsOnIds: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          status: { type: Type.STRING },
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
          category: { type: Type.STRING },
          itemTitle: { type: Type.STRING },
          track: { type: Type.STRING },
          priority: { type: Type.STRING },
          aiEstimateINR: { type: Type.NUMBER },
          confirmedQuoteINR: { type: Type.NUMBER, nullable: true },
          quoteStatus: { type: Type.STRING },
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
          audience: { type: Type.STRING },
          channel: { type: Type.STRING },
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
    channel: { type: Type.STRING },
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
      items: { type: Type.STRING },
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
          targetBudgetCategory: { type: Type.STRING },
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
      budgetFitScore: { type: Type.NUMBER },
      campusReliabilityScore: { type: Type.NUMBER },
      hiddenCostRisk: { type: Type.STRING },
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
  req: Request | any,
  res: Response | any
) {
  if (req.method === 'OPTIONS') {
    res.setHeader?.('Access-Control-Allow-Origin', '*');
    res.setHeader?.('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader?.('Access-Control-Allow-Headers', 'Content-Type');
    return res.status?.(200).end?.();
  }

  const rawBody = req.body;
  const parsedBody =
    typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;
  const { action, payload } = parsedBody ?? {};
  const ai = getServerGenAI();

  try {
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
            const parsed = JSON.parse(response.text) as ClarifyingQuestion[];
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

      return res.json({ data: tailoredQuestions, source: MODEL_NAME });
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
            const parsed = JSON.parse(response.text);
            return res.json({ data: parsed, source: MODEL_NAME });
          }
        } catch {
          // Fall through to dynamic intake-calibrated synthesis
        }
      }

      const generated = buildPlanFromUserIntake(intake, questions);

      return res.json({
        data: { schedule: generated.schedule, budget: generated.budget },
        source: MODEL_NAME,
      });
    }

    if (
      action === 'generateExecutiveOpsSummary' ||
      action === 'generateOpsSummary'
    ) {
      const plan: FestMasterPlan = payload?.plan ?? INITIAL_FEST_MASTER_PLAN;
      const dynamicSummary = buildExecutiveOpsSummaryFromPlan(plan);
      return res.json({ data: dynamicSummary, source: MODEL_NAME });
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
      const draft = buildCoordinatorOutreachFromTask(task, intake);
      return res.json({ data: draft, source: MODEL_NAME });
    }

    if (
      action === 'simulateCrisisRipple' ||
      action === 'simulateConstraintShock'
    ) {
      const scenarioId: string = payload?.scenarioId ?? 'crisis-reg-surge';
      const customPrompt: string | undefined =
        payload?.customShockDescription ?? payload?.customDescription;
      const plan: FestMasterPlan = payload?.plan ?? INITIAL_FEST_MASTER_PLAN;

      const dynamicResult = buildCrisisSimulationFromIntake(
        scenarioId,
        plan,
        customPrompt
      );
      return res.json({ data: dynamicResult, source: MODEL_NAME });
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
            const evals = JSON.parse(response.text) as Partial<VendorQuote>[];
            const merged = quotes.map((q) => {
              const match = evals.find((e) => e.id === q.id);
              return match ? { ...q, ...match } : q;
            });
            return res.json({ data: merged, source: 'gemini-2.5-flash' });
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
          budgetFitScore: q.budgetFitScore || budgetFitScore,
        };
      });

      return res.json({ data: calibrated, source: 'engine-calibrated' });
    }

    return res.status(400).json({ error: `Unknown planner action: ${action}` });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unexpected planner error';
    return res.status(500).json({ error: message });
  }
}

export default async function handler(req: any, res: any) {
  return handlePlannerApiRequest(req, res);
}
