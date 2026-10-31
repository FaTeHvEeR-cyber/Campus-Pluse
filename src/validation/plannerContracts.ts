import { z } from 'zod';

const text = z.string().max(8000);
const name = z.string().trim().min(1).max(300);
const id = z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/);
const money = z.number().finite().min(0).max(100_000_000);
const count = z.number().int().min(0).max(100_000);
const score = z.number().min(0).max(100);
const strings = z.array(name).max(50);
export const budgetCategorySchema = z.enum([
  'Stage, Sound & AV Rigging', 'Hackathon Wi-Fi, Power & Lab Setup',
  'Catering, Stalls & Midnight Refreshments', 'Swag, IDs, Certificates & Printing',
  'Judge Travel, Security & Hospitality', 'Prize Pool & Contingency Buffer',
]);
export const taskStatusSchema = z.enum(['Completed', 'In-Progress', 'Pending', 'Blocked']);
export const schedulePhaseSchema = z.enum([
  'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
  'Phase 2: AV/Network Infrastructure & Vendor Contracts',
  'Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster',
  'Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling',
]);
export const intakeSchema = z.strictObject({
  festName: name,
  festCategory: z.enum(['Inter-College Tech Fest & Hackathon',
    'Multi-Department Annual Cultural & Tech Symposium', 'Campus Developer Summit',
    'Community Innovation Fair', 'Custom Category']),
  customCategory: text.optional(), hostInstitution: name,
  venueType: z.enum(['College Campus', 'External Convention Center / Hotel',
    'Community Ground / Open-Air Venue', 'Hybrid (Campus + External)']).optional(),
  eventLocality: text.optional(), dates: name, startTime: text.optional(), endTime: text.optional(),
  weeksUntilFest: z.number().int().min(0).max(104), expectedFootfall: count.min(20),
  totalBudgetINR: money.min(5000), activeVolunteerCoordinators: count,
  tracks: strings, concurrentVenueTracks: strings.min(1), overnightStayRequired: z.boolean(),
  primaryVenues: text, sponsorTargetINR: money,
  priorityWeights: z.strictObject({ techInfraWifi: score, stageAvProduction: score,
    foodNightRefreshments: score, prizesSwag: score, guestJudgeHospitality: score }),
  additionalContextNotes: text.optional(),
});
const questionSchema = z.strictObject({
  id, category: z.enum(['Campus Permissions', 'Multi-Track Room Clashes',
    'Sponsor Timelines', 'Overnight Logistics']),
  question: name, whyItMatters: text, suggestedOptions: z.array(text).min(1).max(6), answer: text,
});
export const questionsSchema = z.array(questionSchema).min(3).max(4)
  .refine(qs => new Set(qs.map(q => q.id)).size === qs.length, 'Duplicate question IDs');
const scheduleNodeSchema = z.strictObject({
  id, code: name, title: text, track: name, phase: schedulePhaseSchema,
  tier: z.enum(['Critical-Path Approval', 'Downstream Vendor/Volunteer']), daySlot: name,
  venue: text, ownerCoordinator: name, department: name, dependsOnIds: z.array(id).max(100),
  status: taskStatusSchema, blockedIfDelayedWarning: text, blockerNote: text.optional(),
});
const budgetItemSchema = z.strictObject({
  id, category: budgetCategorySchema, itemTitle: text, track: name,
  priority: z.enum(['Must-Have', 'Flexible', 'Nice-to-Have']), aiEstimateINR: money,
  confirmedQuoteINR: money.nullable(), quoteStatus: z.enum(['AI Estimate', 'Confirmed Quote', 'Overrun Risk']),
  lockedVendorName: text.optional(), lockedVendorId: id.optional(), sponsorBackedINR: money, notes: text,
});
export const taskSchema = z.strictObject({
  id, taskCode: name, title: text, coordinatorName: name, coordinatorRole: name, department: name,
  assignedVolunteersCount: count, status: taskStatusSchema,
  priority: z.enum(['Critical', 'High', 'Standard']), deadlineWindow: text, venueTrack: text,
  linkedScheduleId: id.optional(), bottleneckReason: text.optional(), contactChannel: text,
});
const logSchema = z.strictObject({ id, timestamp: text, author: name, squad: name, note: text });
const evaluationFields = {
  id, budgetFitScore: score, campusReliabilityScore: score,
  hiddenCostRisk: z.enum(['Low', 'Moderate', 'High']), negotiationTip: text, aiRecommendationNote: text,
};
export const evaluationsSchema = z.array(z.strictObject(evaluationFields)).max(20);
export const quoteSchema = z.strictObject({
  ...evaluationFields, category: budgetCategorySchema, vendorName: name, totalQuoteINR: money,
  gstIncluded: z.boolean(), advancePaymentPercent: score, paymentTerms: text, deliveryLeadTime: text,
  inclusions: z.array(text).max(50), hiddenCostsGeneratorCharges: text,
  slaGuarantee: text, campusPastTrackRecord: text,
});
export const quotesSchema = z.array(quoteSchema).max(100);
export const planSchema = z.strictObject({
  intake: intakeSchema, clarifyingQuestions: z.array(questionSchema).max(4),
  schedule: z.array(scheduleNodeSchema).max(200), budget: z.array(budgetItemSchema).max(100),
  volunteerTasks: z.array(taskSchema).max(300), coordinatorLogs: z.array(logSchema).max(300),
  vendorQuotes: quotesSchema,
  appliedShocks: z.array(z.strictObject({ id, timestamp: text, scenarioTitle: text, chosenStrategy: text,
    budgetDeltaINR: z.number().finite().min(-100_000_000).max(100_000_000),
    scheduleNote: text, volunteerNote: text })).max(100),
  lastUpdatedISO: z.iso.datetime(),
});
export const synthesisSchema = z.strictObject({
  schedule: z.array(scheduleNodeSchema).min(1).max(100),
  budget: z.array(budgetItemSchema).min(1).max(6),
}).superRefine((plan, ctx) => {
  const nodes = new Map(plan.schedule.map(n => [n.id, n]));
  const bad = (message: string) => ctx.addIssue({ code: 'custom', message });
  if (nodes.size !== plan.schedule.length) bad('Duplicate schedule IDs');
  if (new Set(plan.budget.map(b => b.id)).size !== plan.budget.length ||
      new Set(plan.budget.map(b => b.category)).size !== plan.budget.length) bad('Duplicate budget IDs or categories');
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(nodeId: string): boolean {
    if (visiting.has(nodeId)) return false;
    if (visited.has(nodeId)) return true;
    const node = nodes.get(nodeId);
    if (!node) return false;
    visiting.add(nodeId);
    for (const dep of node.dependsOnIds) if (!visit(dep)) return false;
    visiting.delete(nodeId);
    visited.add(nodeId);
    return true;
  }
  for (const node of plan.schedule) {
    if (!visit(node.id)) { bad('Missing or cyclic schedule dependency'); break; }
    if (node.status === 'Completed' && node.dependsOnIds.some(dep => nodes.get(dep)?.status !== 'Completed')) {
      bad('Completed milestone has unresolved prerequisites');
    }
  }
  for (const item of plan.budget) {
    if (item.confirmedQuoteINR !== null || item.quoteStatus !== 'AI Estimate' ||
        item.lockedVendorId || item.lockedVendorName) bad('Generated budgets must remain unconfirmed estimates');
  }
});
const channel = z.enum(['WhatsApp Squad Broadcast', 'Official Dean/Faculty Email', 'Vendor SLA Escalation']);
export const outreachSchema = z.strictObject({ recipientName: text, recipientRole: text, channel,
  subjectLine: text, messageBody: text, actionChecklist: z.array(text).max(20) });
export const summarySchema = z.strictObject({ generatedAt: text, readinessScoreLabel: text,
  executiveProgressSnapshot: text, headlineBottleneck: text, criticalRisks: z.array(text).max(20),
  immediateNextActions: z.array(z.strictObject({ owner: text, squad: text, action: text, timeframe: text })).max(20),
  broadcasts: z.array(z.strictObject({
    audience: z.enum(['Volunteer Leads', "University Faculty Advisors / Dean's Office", 'Pending Vendors / Sponsors']),
    channel, subjectLine: text, messageBody: text })).max(10),
});
export const crisisSchema = z.strictObject({ scenarioId: id, scenarioTitle: text, rippleAnalysis: text,
  impactedCategories: z.array(budgetCategorySchema).max(6), impactedVenueTracks: strings, impactedSquads: strings,
  beforeFootfall: count, afterFootfall: count, ProjectedUnmitigatedOverrunINR: money,
  options: z.array(z.strictObject({ id, optionLabel: text, strategyTitle: text, summary: text,
    budgetDeltaINR: z.number().finite().min(-100_000_000).max(100_000_000),
    targetBudgetCategory: budgetCategorySchema, scheduleAdjustment: text, affectedScheduleId: id.optional(),
    volunteerReallocation: text, affectedTaskId: id.optional(), riskTradeOff: text, recommended: z.boolean().optional(),
  })).length(3),
});
export const plannerRequestSchema = z.discriminatedUnion('action', [
  z.strictObject({ action: z.literal('generateClarifyingQuestions'), payload: z.strictObject({ intake: intakeSchema }) }),
  z.strictObject({ action: z.enum(['synthesizeMasterPlan', 'generateMasterFestPlan']),
    payload: z.strictObject({ intake: intakeSchema, clarifyingQuestions: questionsSchema }) }),
  z.strictObject({ action: z.enum(['generateExecutiveOpsSummary', 'generateOpsSummary']), payload: z.strictObject({ plan: planSchema }) }),
  z.strictObject({ action: z.enum(['draftOutreachMessage', 'draft-coordinator-outreach']),
    payload: z.strictObject({ task: taskSchema, festName: name, intake: intakeSchema }) }),
  z.strictObject({ action: z.enum(['simulateCrisisRipple', 'simulateConstraintShock']),
    payload: z.strictObject({ scenarioId: z.enum(['crisis-reg-surge', 'crisis-sponsor-delay', 'crisis-venue-clash', 'crisis-volunteer-dropout']),
      plan: planSchema, customShockDescription: text.optional(), customDescription: text.optional() }) }),
  z.strictObject({ action: z.literal('evaluateVendorQuotes'), payload: z.strictObject({ category: budgetCategorySchema,
    quotes: z.array(quoteSchema).min(1).max(20), aiEstimateINR: money }) }),
]);
