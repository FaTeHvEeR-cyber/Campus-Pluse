import { afterEach, expect, test, vi } from 'vitest';
import { generateClarifyingQuestions, generateMasterFestPlan, generateOpsSummary,
  draftCoordinatorOutreach, simulateConstraintShock, evaluateVendorQuotes } from './geminiService';
import { CLEAN_INITIAL_MASTER_PLAN } from '../data/seedFestData';
import { buildTailoredClarifyingQuestionsFromIntake, buildPlanFromUserIntake,
  buildExecutiveOpsSummaryFromPlan, buildCoordinatorOutreachFromTask,
  buildCrisisSimulationFromIntake } from '../utils/festEngine';

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });
const intake = CLEAN_INITIAL_MASTER_PLAN.intake;
const fallback = () => buildTailoredClarifyingQuestionsFromIntake(intake);
test('accepts a validated response and clears its timer', async () => {
  vi.useFakeTimers();
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ data: fallback() })));
  vi.stubGlobal('fetch', fetchMock);
  expect(await generateClarifyingQuestions(intake)).toEqual(fallback());
  expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  expect(vi.getTimerCount()).toBe(0);
});
test.each([new Response('{}', { status: 500 }), new Response('not json'),
  new Response(JSON.stringify({ data: [{ id: 'missing-required-fields' }] }))])('falls back and clears timers on failure %#', async response => {
  vi.useFakeTimers();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
  expect(await generateClarifyingQuestions(intake)).toEqual(fallback());
  expect(vi.getTimerCount()).toBe(0);
});
test('aborts a stalled request at 25 seconds and clears the timeout', async () => {
  vi.useFakeTimers();
  let signal: AbortSignal | undefined;
  vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => {
    signal = init.signal ?? undefined;
    signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
  })));
  const pending = generateClarifyingQuestions(intake);
  await vi.advanceTimersByTimeAsync(25_000);
  expect(await pending).toEqual(fallback());
  expect(signal?.aborted).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
});

test('all planner actions recover from network errors with usable typed data', async () => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network unavailable')));
  const generated = buildPlanFromUserIntake(intake, fallback());
  expect(await generateMasterFestPlan(intake, fallback())).toEqual({ schedule: generated.schedule, budget: generated.budget });
  expect(await generateOpsSummary(CLEAN_INITIAL_MASTER_PLAN)).toMatchObject({
    readinessScoreLabel: buildExecutiveOpsSummaryFromPlan(CLEAN_INITIAL_MASTER_PLAN).readinessScoreLabel,
  });
  expect(await draftCoordinatorOutreach(generated.volunteerTasks[0], intake.festName, intake))
    .toEqual(buildCoordinatorOutreachFromTask(generated.volunteerTasks[0], intake));
  expect(await simulateConstraintShock('crisis-reg-surge', CLEAN_INITIAL_MASTER_PLAN))
    .toEqual(buildCrisisSimulationFromIntake('crisis-reg-surge', CLEAN_INITIAL_MASTER_PLAN));
  expect(await evaluateVendorQuotes('Catering, Stalls & Midnight Refreshments', [], 1000)).toEqual([]);
});
