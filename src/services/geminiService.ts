import {
  BudgetLineItem,
  ClarifyingQuestion,
  CrisisSimulationResult,
  ExecutiveOpsSummary,
  FestIntakeConfig,
  FestMasterPlan,
  OutreachDraft,
  ScheduleNode,
  VendorQuote,
  VolunteerTask,
} from '../types';
import type { z } from 'zod';
import { INITIAL_FEST_MASTER_PLAN } from '../data/seedFestData';
import {
  buildCoordinatorOutreachFromTask,
  buildCrisisSimulationFromIntake,
  buildExecutiveOpsSummaryFromPlan,
  buildPlanFromUserIntake,
  buildTailoredClarifyingQuestionsFromIntake,
} from '../utils/festEngine';

async function callPlannerEndpoint<T>(
  action: string,
  payload: Record<string, unknown>,
  fallback: () => T,
  schema: z.ZodType<T>
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch('/api/planner', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
      signal: controller.signal,
    });
    if (!response.ok) {
      return fallback();
    }
    const json: unknown = await response.json();
    if (typeof json !== 'object' || json === null || !('data' in json)) return fallback();
    return schema.parse(json.data);
  } catch {
    return fallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateClarifyingQuestions(
  intake: FestIntakeConfig
): Promise<ClarifyingQuestion[]> {
  const { questionsSchema } = await import('../validation/plannerContracts');
  return callPlannerEndpoint<ClarifyingQuestion[]>(
    'generateClarifyingQuestions',
    { intake },
    () => buildTailoredClarifyingQuestionsFromIntake(intake),
    questionsSchema
  );
}

export async function generateMasterFestPlan(
  intake: FestIntakeConfig,
  clarifyingQuestions: ClarifyingQuestion[]
): Promise<{ schedule: ScheduleNode[]; budget: BudgetLineItem[] }> {
  const { synthesisSchema } = await import('../validation/plannerContracts');
  return callPlannerEndpoint<{
    schedule: ScheduleNode[];
    budget: BudgetLineItem[];
  }>('generateMasterFestPlan', { intake, clarifyingQuestions }, () => {
    const generated = buildPlanFromUserIntake(intake, clarifyingQuestions);
    return {
      schedule: generated.schedule,
      budget: generated.budget,
    };
  }, synthesisSchema);
}

export const synthesizeMasterPlanFromIntake = generateMasterFestPlan;

export async function generateOpsSummary(
  plan: FestMasterPlan
): Promise<ExecutiveOpsSummary> {
  const { summarySchema } = await import('../validation/plannerContracts');
  return callPlannerEndpoint<ExecutiveOpsSummary>(
    'generateOpsSummary',
    { plan },
    () => buildExecutiveOpsSummaryFromPlan(plan),
    summarySchema
  );
}

export const generateExecutiveOpsSummary = generateOpsSummary;

export async function draftCoordinatorOutreach(
  task: VolunteerTask,
  festName: string,
  intake?: FestIntakeConfig
): Promise<OutreachDraft> {
  const { outreachSchema } = await import('../validation/plannerContracts');
  const effectiveIntake: FestIntakeConfig = intake ?? {
    ...INITIAL_FEST_MASTER_PLAN.intake,
    festName,
  };
  return callPlannerEndpoint<OutreachDraft>(
    'draftOutreachMessage',
    { task, festName, intake: effectiveIntake },
    () => buildCoordinatorOutreachFromTask(task, effectiveIntake),
    outreachSchema
  );
}

export async function simulateConstraintShock(
  scenarioId: string,
  plan: FestMasterPlan,
  customShockDescription?: string
): Promise<CrisisSimulationResult> {
  const { crisisSchema } = await import('../validation/plannerContracts');
  return callPlannerEndpoint<CrisisSimulationResult>(
    'simulateConstraintShock',
    { scenarioId, plan, customShockDescription },
    () =>
      buildCrisisSimulationFromIntake(scenarioId, plan, customShockDescription),
    crisisSchema
  );
}

export const simulateFestCrisisRipple = simulateConstraintShock;

export async function evaluateVendorQuotes(
  category: string,
  quotes: VendorQuote[],
  aiEstimateINR: number
): Promise<VendorQuote[]> {
  const { quotesSchema } = await import('../validation/plannerContracts');
  return callPlannerEndpoint<VendorQuote[]>(
    'evaluateVendorQuotes',
    { category, quotes, aiEstimateINR },
    () => quotes,
    quotesSchema
  );
}

