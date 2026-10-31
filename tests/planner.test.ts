import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { handlePlannerApiRequest } from '../api/planner';
import { CLEAN_INITIAL_MASTER_PLAN, INITIAL_FEST_MASTER_PLAN } from '../src/data/seedFestData';
import { buildPlanFromUserIntake, buildTailoredClarifyingQuestionsFromIntake } from '../src/utils/festEngine';

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));
vi.mock('@google/genai', async importOriginal => {
  const actual = await importOriginal<typeof import('@google/genai')>();
  return { ...actual, GoogleGenAI: class {
    models = { generateContent };
  } };
});
beforeEach(() => { vi.stubEnv('GEMINI_API_KEY', ''); generateContent.mockReset(); });
afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

async function request(body: unknown, method = 'POST', contentType = 'application/json') {
  const output = { status: 200, body: null as unknown, headers: {} as Record<string, unknown> };
  const res = {
    status(code: number) { output.status = code; return this; },
    json(value: unknown) { output.body = value; return this; },
    setHeader(key: string, value: unknown) { output.headers[key] = value; return this; },
    end() { return this; },
  };
  await handlePlannerApiRequest({ method, body, headers: { 'content-type': contentType } },
    res as unknown as Parameters<typeof handlePlannerApiRequest>[1]);
  return output;
}
const intake = CLEAN_INITIAL_MASTER_PLAN.intake;
const questions = buildTailoredClarifyingQuestionsFromIntake(intake);
const clarification = { action: 'generateClarifyingQuestions', payload: { intake } };
const synthesis = { action: 'generateMasterFestPlan', payload: { intake, clarifyingQuestions: questions } };

test.each(['GET', 'PUT', 'DELETE', 'OPTIONS'])('rejects %s before using Gemini', async method => {
  const result = await request(clarification, method);
  expect(result.status).toBe(405);
  expect(result.headers.Allow).toBe('POST');
  expect(generateContent).not.toHaveBeenCalled();
});
test.each(['{', undefined, null, [], {}, { action: 'invalid', payload: {} },
  { action: 'generateClarifyingQuestions', payload: { intake: {} } }])('rejects malformed envelope %#', async body => {
  expect((await request(body)).status).toBe(400);
  expect(generateContent).not.toHaveBeenCalled();
});
test('enforces JSON media type and body byte limit', async () => {
  expect((await request(clarification, 'POST', 'text/plain')).status).toBe(415);
  expect((await request('x'.repeat(128 * 1024 + 1))).status).toBe(413);
});
test.each([-1, '250000', null, 1e12])('rejects invalid numeric budget %s', async totalBudgetINR => {
  expect((await request({ ...clarification, payload: { intake: { ...intake, totalBudgetINR } } })).status).toBe(400);
});
test('rejects unknown fields and oversized arrays', async () => {
  expect((await request({ ...clarification, secret: 'do-not-echo' })).status).toBe(400);
  expect((await request({ ...clarification, payload: { intake: { ...intake, tracks: Array(51).fill('Track') } } })).status).toBe(400);
});
test('labels fallback honestly and does not cache planner data', async () => {
  const result = await request(clarification);
  expect(result.body).toEqual({ data: questions, source: 'deterministic' });
  expect(result.headers['Cache-Control']).toBe('no-store');
});
test('accepts structured clarification and requests a responseSchema', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  generateContent.mockResolvedValue({ text: JSON.stringify(questions) });
  expect((await request(clarification)).body).toMatchObject({ data: questions, source: 'gemini-2.5-flash' });
  expect(generateContent.mock.calls[0][0].config).toMatchObject({ responseMimeType: 'application/json', responseSchema: { type: 'ARRAY' } });
});
test.each(['{', '[]', '[{"id":"q"}]', '{"error":"internal-secret"}'])('falls back from malformed model response %#', async text => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  generateContent.mockResolvedValue({ text });
  expect((await request(clarification)).body).toEqual({ data: questions, source: 'deterministic' });
});
test('provider errors cannot leak to clients', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  generateContent.mockRejectedValue(new Error('private-token-and-provider-body'));
  const result = await request(clarification);
  expect(result.status).toBe(200);
  expect(JSON.stringify(result.body)).not.toContain('private-token');
});
test('rejects synthesized cycles and invented confirmed quotes', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const generated = buildPlanFromUserIntake(intake, questions);
  generated.schedule[0].dependsOnIds = [generated.schedule[4].id];
  generated.budget[0].quoteStatus = 'Confirmed Quote';
  generated.budget[0].confirmedQuoteINR = 1;
  generateContent.mockResolvedValue({ text: JSON.stringify({ schedule: generated.schedule, budget: generated.budget }) });
  expect((await request(synthesis)).body).toMatchObject({ source: 'deterministic' });
});
test('rejects model fields that would overwrite a submitted quotation', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const quote = INITIAL_FEST_MASTER_PLAN.vendorQuotes[0];
  generateContent.mockResolvedValue({ text: JSON.stringify([{ id: quote.id, totalQuoteINR: 1,
    budgetFitScore: 99, campusReliabilityScore: 99, hiddenCostRisk: 'Low', negotiationTip: '', aiRecommendationNote: '' }]) });
  const result = await request({ action: 'evaluateVendorQuotes', payload: {
    category: quote.category, quotes: [quote], aiEstimateINR: 100_000,
  } });
  expect(result.body).toMatchObject({ source: 'engine-calibrated', data: [{ totalQuoteINR: quote.totalQuoteINR }] });
});
test.each(['generateOpsSummary', 'generateExecutiveOpsSummary'])('validates the complete plan for %s', async action => {
  const result = await request({ action, payload: { plan: CLEAN_INITIAL_MASTER_PLAN } });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ source: 'deterministic' });
});

test('valid synthesis returns validated model data', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const generated = buildPlanFromUserIntake(intake, questions);
  const data = { schedule: generated.schedule, budget: generated.budget };
  generateContent.mockResolvedValue({ text: JSON.stringify(data) });
  expect((await request(synthesis)).body).toEqual({ data, source: 'gemini-2.5-flash' });
});

test('model budget over the cap and a missing dependency both fall back', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const generated = buildPlanFromUserIntake(intake, questions);
  generated.budget[0].aiEstimateINR = intake.totalBudgetINR + 1;
  generateContent.mockResolvedValue({ text: JSON.stringify({ schedule: generated.schedule, budget: generated.budget }) });
  expect((await request(synthesis)).body).toMatchObject({ source: 'deterministic' });
  generated.schedule[0].dependsOnIds = ['missing'];
  generateContent.mockResolvedValue({ text: JSON.stringify({ schedule: generated.schedule, budget: generated.budget }) });
  expect((await request(synthesis)).body).toMatchObject({ source: 'deterministic' });
});

test.each(['draftOutreachMessage', 'draft-coordinator-outreach'])('%s preserves the actual task recipient', async action => {
  const task = INITIAL_FEST_MASTER_PLAN.volunteerTasks[0];
  const result = await request({ action, payload: { task, festName: intake.festName, intake } });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ source: 'deterministic', data: { recipientName: expect.stringContaining(task.coordinatorName) } });
});
test.each(['simulateConstraintShock', 'simulateCrisisRipple'])('%s handles a validated custom request', async action => {
  const result = await request({ action, payload: { scenarioId: 'crisis-venue-clash',
    plan: CLEAN_INITIAL_MASTER_PLAN, customShockDescription: 'Rain in the main venue' } });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ source: 'deterministic', data: { scenarioId: 'custom-shock' } });
});
test('valid scoring updates only the allowed evaluation fields', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const quote = INITIAL_FEST_MASTER_PLAN.vendorQuotes[0];
  const evaluation = { id: quote.id, budgetFitScore: 0, campusReliabilityScore: 70,
    hiddenCostRisk: 'High', negotiationTip: 'Confirm overtime fees', aiRecommendationNote: 'Check the contract' };
  generateContent.mockResolvedValue({ text: JSON.stringify([evaluation]) });
  const result = await request({ action: 'evaluateVendorQuotes', payload: {
    category: quote.category, quotes: [quote], aiEstimateINR: 1,
  } });
  expect(result.body).toMatchObject({ source: 'gemini-2.5-flash', data: [{ ...quote, ...evaluation }] });
});
test('scoring rejects unknown or repeated IDs', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const quote = INITIAL_FEST_MASTER_PLAN.vendorQuotes[0];
  const evaluation = { id: 'wrong-quote', budgetFitScore: 10, campusReliabilityScore: 70,
    hiddenCostRisk: 'High', negotiationTip: '', aiRecommendationNote: '' };
  generateContent.mockResolvedValue({ text: JSON.stringify([evaluation]) });
  expect((await request({ action: 'evaluateVendorQuotes', payload: {
    category: quote.category, quotes: [quote], aiEstimateINR: 1,
  } })).body).toMatchObject({ source: 'engine-calibrated', data: [{ id: quote.id }] });
});

test('valid executive ops summary returns validated model data when ai is available', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const mockSummary = {
    generatedAt: '10:00 AM IST',
    readinessScoreLabel: '85% Readiness',
    executiveProgressSnapshot: 'On track across all core deliverables',
    headlineBottleneck: 'Estate Office NOC pending',
    criticalRisks: ['Power load sanction delay'],
    immediateNextActions: [
      { owner: 'Aarav Lead', squad: 'Core Executive', action: 'Sign MoU', timeframe: 'Next 24h' },
    ],
    broadcasts: [
      {
        audience: 'Volunteer Leads',
        channel: 'WhatsApp Squad Broadcast',
        subjectLine: 'Shift Roster Briefing',
        messageBody: 'Report to Main Gate at 08:00 AM',
      },
    ],
  };
  generateContent.mockResolvedValue({ text: JSON.stringify(mockSummary) });
  const result = await request({
    action: 'generateExecutiveOpsSummary',
    payload: { plan: CLEAN_INITIAL_MASTER_PLAN },
  });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ source: 'gemini-2.5-flash', data: mockSummary });
});

test('valid outreach message returns validated model data when ai is available', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const mockDraft = {
    recipientName: 'Vikram Mehta',
    recipientRole: 'Stage Lead · OPS-01',
    channel: 'WhatsApp Squad Broadcast',
    subjectLine: 'Stage AV Rigging Soundcheck',
    messageBody: 'Please confirm line-array delivery by 14:00 IST',
    actionChecklist: ['Verify 3-phase earthing', 'Test wireless mics'],
  };
  generateContent.mockResolvedValue({ text: JSON.stringify(mockDraft) });
  const task = INITIAL_FEST_MASTER_PLAN.volunteerTasks[0];
  const result = await request({
    action: 'draftOutreachMessage',
    payload: { task, festName: intake.festName, intake },
  });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ source: 'gemini-2.5-flash', data: mockDraft });
});

test('valid crisis simulation returns validated model data when ai is available', async () => {
  vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
  const mockCrisis = {
    scenarioId: 'crisis-reg-surge',
    scenarioTitle: 'Registration Surge: +150 Participants',
    rippleAnalysis: 'Increases catering and power loads',
    impactedCategories: ['Catering, Stalls & Midnight Refreshments'],
    impactedVenueTracks: ['Main Auditorium'],
    impactedSquads: ['Logistics & Food Committee'],
    beforeFootfall: 500,
    afterFootfall: 650,
    ProjectedUnmitigatedOverrunINR: 31000,
    options: [
      {
        id: 'opt-live-1',
        optionLabel: 'Strategy A',
        strategyTitle: 'Absorb Within Buffer',
        summary: 'Top up meal plates',
        budgetDeltaINR: 14500,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment: 'Extend catering window',
        affectedScheduleId: 'sched-ops-2',
        volunteerReallocation: 'Reassign 3 volunteers',
        affectedTaskId: 'vt-4',
        riskTradeOff: 'Draws from buffer',
        recommended: true,
      },
      {
        id: 'opt-live-2',
        optionLabel: 'Strategy B',
        strategyTitle: 'Cap Registrations',
        summary: 'Cap at 500',
        budgetDeltaINR: 0,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment: 'No delay',
        affectedScheduleId: 'sched-ops-2',
        volunteerReallocation: 'No change',
        affectedTaskId: 'vt-4',
        riskTradeOff: 'Zero cost',
      },
      {
        id: 'opt-live-3',
        optionLabel: 'Strategy C',
        strategyTitle: 'Full Expansion',
        summary: 'Order extra meals',
        budgetDeltaINR: 25000,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment: 'Add extra stall',
        affectedScheduleId: 'sched-ops-2',
        volunteerReallocation: 'Deploy extra crew',
        affectedTaskId: 'vt-4',
        riskTradeOff: 'High cost',
      },
    ],
  };
  generateContent.mockResolvedValue({ text: JSON.stringify(mockCrisis) });
  const result = await request({
    action: 'simulateCrisisRipple',
    payload: { scenarioId: 'crisis-reg-surge', plan: CLEAN_INITIAL_MASTER_PLAN },
  });
  expect(result.status).toBe(200);
  expect(result.body).toMatchObject({ source: 'gemini-2.5-flash', data: mockCrisis });
});

test.each(['generateExecutiveOpsSummary', 'draftOutreachMessage', 'simulateCrisisRipple'])(
  '%s gracefully falls back to deterministic when model output fails validation',
  async (action) => {
    vi.stubEnv('GEMINI_API_KEY', 'test-only-key');
    generateContent.mockResolvedValue({ text: '{"malformed": true}' });
    const payload =
      action === 'generateExecutiveOpsSummary'
        ? { plan: CLEAN_INITIAL_MASTER_PLAN }
        : action === 'draftOutreachMessage'
          ? {
              task: INITIAL_FEST_MASTER_PLAN.volunteerTasks[0],
              festName: intake.festName,
              intake,
            }
          : { scenarioId: 'crisis-reg-surge', plan: CLEAN_INITIAL_MASTER_PLAN };
    const result = await request({ action, payload });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ source: 'deterministic' });
  }
);
