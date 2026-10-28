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
  fallback: () => T
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3500);
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
    const json = (await response.json()) as { data?: T };
    return json.data ?? fallback();
  } catch {
    return fallback();
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function generateClarifyingQuestions(
  intake: FestIntakeConfig
): Promise<ClarifyingQuestion[]> {
  return callPlannerEndpoint<ClarifyingQuestion[]>(
    'generateClarifyingQuestions',
    { intake },
    () => buildTailoredClarifyingQuestionsFromIntake(intake)
  );
}

export async function generateMasterFestPlan(
  intake: FestIntakeConfig,
  clarifyingQuestions: ClarifyingQuestion[]
): Promise<{ schedule: ScheduleNode[]; budget: BudgetLineItem[] }> {
  return callPlannerEndpoint<{
    schedule: ScheduleNode[];
    budget: BudgetLineItem[];
  }>('generateMasterFestPlan', { intake, clarifyingQuestions }, () => {
    const generated = buildPlanFromUserIntake(intake, clarifyingQuestions);
    return {
      schedule: generated.schedule,
      budget: generated.budget,
    };
  });
}

export const synthesizeMasterPlanFromIntake = generateMasterFestPlan;

export async function generateOpsSummary(
  plan: FestMasterPlan
): Promise<ExecutiveOpsSummary> {
  return callPlannerEndpoint<ExecutiveOpsSummary>(
    'generateOpsSummary',
    { plan },
    () => buildExecutiveOpsSummaryFromPlan(plan)
  );
}

export const generateExecutiveOpsSummary = generateOpsSummary;

export async function draftCoordinatorOutreach(
  task: VolunteerTask,
  festName: string,
  intake?: FestIntakeConfig
): Promise<OutreachDraft> {
  const effectiveIntake: FestIntakeConfig = intake ?? {
    ...INITIAL_FEST_MASTER_PLAN.intake,
    festName,
  };
  return callPlannerEndpoint<OutreachDraft>(
    'draftOutreachMessage',
    { task, festName, intake: effectiveIntake },
    () => buildCoordinatorOutreachFromTask(task, effectiveIntake)
  );
}

export async function simulateConstraintShock(
  scenarioId: string,
  plan: FestMasterPlan,
  customShockDescription?: string
): Promise<CrisisSimulationResult> {
  return callPlannerEndpoint<CrisisSimulationResult>(
    'simulateConstraintShock',
    { scenarioId, plan, customShockDescription },
    () =>
      buildCrisisSimulationFromIntake(scenarioId, plan, customShockDescription)
  );
}

export const simulateFestCrisisRipple = simulateConstraintShock;

export async function evaluateVendorQuotes(
  category: string,
  quotes: VendorQuote[],
  aiEstimateINR: number
): Promise<VendorQuote[]> {
  return callPlannerEndpoint<VendorQuote[]>(
    'evaluateVendorQuotes',
    { category, quotes, aiEstimateINR },
    () => quotes
  );
}

