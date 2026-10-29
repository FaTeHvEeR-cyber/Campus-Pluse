import { test } from 'vitest';
import assert from 'node:assert/strict';
import type { ScheduleNode } from '../types';
import {
  applyCrisisTradeOffToPlan,
  buildCoordinatorOutreachFromTask,
  buildCrisisSimulationFromIntake,
  buildExecutiveOpsSummaryFromPlan,
  buildPlanFromUserIntake,
  buildSampleVolunteerDataFromIntake,
  buildSuggestedVendorQuotesFromIntake,
  buildTailoredClarifyingQuestionsFromIntake,
  computeDualTrackBudgetMetrics,
  computeExecutionReadinessScore,
  computeTradeOffBudgetPreview,
  computeVolunteerOpsMetrics,
  evaluateScheduleDependencies,
  formatINR,
  formatNumericInputValue,
  getEffectiveFestCategory,
  lockVendorQuoteInPlan,
  sanitizeNumericInput,
} from './festEngine';
import {
  buildPresetMasterPlan,
  CLEAN_INITIAL_MASTER_PLAN,
  DETERMINISTIC_CRISIS_RESULTS,
  INITIAL_FEST_MASTER_PLAN,
} from '../data/seedFestData';

test('formatINR formats Indian currency with commas and sign prefixes', () => {
  assert.equal(formatINR(450000), '₹4,50,000');
  assert.equal(formatINR(14500, true), '+₹14,500');
  assert.equal(formatINR(-20500, true), '-₹20,500');
  assert.equal(formatINR(0, true), '₹0');
});

test('sanitizeNumericInput and formatNumericInputValue strip leading zeros and keep cleared inputs empty without stuck zero', () => {
  assert.deepEqual(sanitizeNumericInput(''), {
    displayValue: '',
    numericValue: 0,
  });
  assert.deepEqual(sanitizeNumericInput('0'), {
    displayValue: '',
    numericValue: 0,
  });
  assert.deepEqual(sanitizeNumericInput('086789'), {
    displayValue: '86789',
    numericValue: 86789,
  });
  assert.deepEqual(sanitizeNumericInput('0565'), {
    displayValue: '565',
    numericValue: 565,
  });
  assert.equal(formatNumericInputValue(0), '');
  assert.equal(formatNumericInputValue(86789), '86789');
});

test('CLEAN_INITIAL_MASTER_PLAN starts with empty downstream schedule, budget, volunteer tasks, coordinator logs, and vendor quotes', () => {
  assert.equal(CLEAN_INITIAL_MASTER_PLAN.schedule.length, 0);
  assert.equal(CLEAN_INITIAL_MASTER_PLAN.budget.length, 0);
  assert.equal(CLEAN_INITIAL_MASTER_PLAN.volunteerTasks.length, 0);
  assert.equal(CLEAN_INITIAL_MASTER_PLAN.coordinatorLogs.length, 0);
  assert.equal(CLEAN_INITIAL_MASTER_PLAN.vendorQuotes.length, 0);
  assert.equal(CLEAN_INITIAL_MASTER_PLAN.appliedShocks.length, 0);
});

test('getEffectiveFestCategory returns customCategory when Custom Category is selected', () => {
  const customIntake = {
    ...CLEAN_INITIAL_MASTER_PLAN.intake,
    festCategory: 'Custom Category' as const,
    customCategory: 'Open-Air Drone & Robotics Expo',
  };
  assert.equal(
    getEffectiveFestCategory(customIntake),
    'Open-Air Drone & Robotics Expo'
  );
});

test('buildTailoredClarifyingQuestionsFromIntake dynamically generates 4 custom questions tailored to the user brief instead of stale preset questions', () => {
  const customIntake = {
    ...CLEAN_INITIAL_MASTER_PLAN.intake,
    festName: 'Nebula AI & Music Conclave',
    festCategory: 'Custom Category' as const,
    customCategory: 'AI & Electronic Music Festival',
    venueType: 'External Convention Center / Hotel' as const,
    eventLocality: 'Whitefield Convention Arena, Bengaluru',
    dates: 'Dec 18, 2026',
    startTime: '11:00 AM',
    endTime: '09:30 PM',
    totalBudgetINR: 380000,
    expectedFootfall: 650,
    activeVolunteerCoordinators: 24,
    concurrentVenueTracks: ['Grand Ballroom A', 'Tech Workshop Studio B'],
    additionalContextNotes: '100% vegetarian & Jain catering required; reserve ₹50,000 for cash prizes',
  };

  const questions = buildTailoredClarifyingQuestionsFromIntake(customIntake);
  assert.equal(questions.length, 4);
  assert.ok(questions[0].question.includes('Nebula AI & Music Conclave'));
  assert.ok(questions[0].question.includes('Whitefield Convention Arena, Bengaluru'));
  assert.ok(questions[1].question.includes('Grand Ballroom A'));
  assert.ok(questions[2].question.includes('₹3,80,000'));
  assert.ok(questions[3].whyItMatters.includes('100% vegetarian & Jain catering required'));
});

test('buildPlanFromUserIntake generates schedule, AI-estimate budget, and starter volunteer tasks strictly from user Intake details and propagates additionalContextNotes', () => {
  const customIntake = {
    ...CLEAN_INITIAL_MASTER_PLAN.intake,
    festName: 'Horizon Tech Summit',
    festCategory: 'Custom Category' as const,
    customCategory: 'AI & Robotics Conclave',
    venueType: 'External Convention Center / Hotel' as const,
    eventLocality: 'BKC Convention Hall, Mumbai',
    startTime: '10:00 AM',
    endTime: '07:00 PM',
    totalBudgetINR: 300000,
    expectedFootfall: 400,
    additionalContextNotes: 'Need 100% vegetarian & Jain catering + backup 65kVA DG set',
  };

  const generated = buildPlanFromUserIntake(
    customIntake,
    CLEAN_INITIAL_MASTER_PLAN.clarifyingQuestions
  );

  assert.equal(generated.schedule.length, 5);
  assert.ok(generated.schedule[0].title.includes('BKC Convention Hall, Mumbai'));
  assert.equal(generated.budget.length, 6);
  assert.ok(generated.budget.every((b) => b.quoteStatus === 'AI Estimate'));
  assert.ok(
    generated.budget.some((b) =>
      b.notes.includes('Need 100% vegetarian & Jain catering')
    )
  );
  assert.equal(generated.volunteerTasks.length, 4);
});

test('buildSuggestedVendorQuotesFromIntake predicts tailored vendor quotes for the user locality, budget, and additionalContextNotes', () => {
  const customIntake = {
    ...CLEAN_INITIAL_MASTER_PLAN.intake,
    eventLocality: 'Koregaon Park, Pune',
    totalBudgetINR: 300000,
    expectedFootfall: 350,
    additionalContextNotes: 'Strict Jain & Vegan counters mandatory',
  };
  const generated = buildPlanFromUserIntake(
    customIntake,
    CLEAN_INITIAL_MASTER_PLAN.clarifyingQuestions
  );
  const quotes = buildSuggestedVendorQuotesFromIntake(
    customIntake,
    generated.budget
  );
  assert.equal(quotes.length, 5);
  assert.ok(quotes.some((q) => q.vendorName.includes('Koregaon Park, Pune')));
  assert.ok(
    quotes.some((q) =>
      q.aiRecommendationNote.includes('Strict Jain & Vegan counters mandatory')
    )
  );
});

test('buildCrisisSimulationFromIntake predicts crisis impact and 3 trade-offs tailored to the user Intake brief and additionalContextNotes', () => {
  const customIntake = {
    ...CLEAN_INITIAL_MASTER_PLAN.intake,
    additionalContextNotes: 'Keep ₹50,000 cash prize pool untouched',
  };
  const generated = buildPlanFromUserIntake(
    customIntake,
    CLEAN_INITIAL_MASTER_PLAN.clarifyingQuestions
  );
  const planWithIntakeBudget = {
    ...CLEAN_INITIAL_MASTER_PLAN,
    intake: customIntake,
    budget: generated.budget,
    schedule: generated.schedule,
  };
  const crisis = buildCrisisSimulationFromIntake(
    'crisis-reg-surge',
    planWithIntakeBudget
  );
  assert.equal(crisis.options.length, 3);
  assert.ok(
    crisis.scenarioTitle.includes(CLEAN_INITIAL_MASTER_PLAN.intake.festName)
  );
  assert.ok(
    crisis.rippleAnalysis.includes('Keep ₹50,000 cash prize pool untouched')
  );
});

test('computeDualTrackBudgetMetrics distinguishes AI Estimates from Confirmed Quotes and computes per-attendee cost', () => {
  const metrics = computeDualTrackBudgetMetrics(
    INITIAL_FEST_MASTER_PLAN.budget,
    INITIAL_FEST_MASTER_PLAN.intake.totalBudgetINR,
    INITIAL_FEST_MASTER_PLAN.intake.expectedFootfall
  );

  assert.equal(metrics.confirmedItemsCount, 3);
  assert.equal(metrics.totalItemsCount, 6);
  assert.equal(metrics.totalConfirmedLockedINR, 198500);
  assert.equal(metrics.unconfirmedEstimateExposureINR, 231000);
  assert.equal(metrics.totalEffectiveSpendINR, 429500);
  assert.equal(metrics.remainingMasterBufferINR, 450000 - 429500);
  assert.equal(metrics.perAttendeeEffectiveINR, Math.round(429500 / 500));
});

test('computeExecutionReadinessScore calculates 0-100 readiness score from schedule and volunteer tasks', () => {
  const score = computeExecutionReadinessScore(
    INITIAL_FEST_MASTER_PLAN.schedule,
    INITIAL_FEST_MASTER_PLAN.volunteerTasks
  );
  assert.ok(score >= 50 && score <= 90);
});

test('evaluateScheduleDependencies separates Critical-Path from Downstream and flags unresolved upstream approvals', () => {
  const analysis = evaluateScheduleDependencies(
    INITIAL_FEST_MASTER_PLAN.schedule
  );

  assert.equal(analysis.criticalPathNodes.length, 4);
  assert.equal(analysis.downstreamNodes.length, 6);

  const cp3Unresolved = analysis.unresolvedDependenciesByNodeId['sched-cp-3'];
  assert.equal(cp3Unresolved.length, 1);
  assert.equal(cp3Unresolved[0].code, 'CP-02');
});

test('lockVendorQuoteInPlan locks a competing quote into the master budget and reduces unconfirmed exposure', () => {
  const beforeMetrics = computeDualTrackBudgetMetrics(
    INITIAL_FEST_MASTER_PLAN.budget,
    INITIAL_FEST_MASTER_PLAN.intake.totalBudgetINR,
    INITIAL_FEST_MASTER_PLAN.intake.expectedFootfall
  );
  assert.equal(beforeMetrics.confirmedItemsCount, 3);

  const updatedPlan = lockVendorQuoteInPlan(
    INITIAL_FEST_MASTER_PLAN,
    'vq-cat-1'
  );
  const afterMetrics = computeDualTrackBudgetMetrics(
    updatedPlan.budget,
    updatedPlan.intake.totalBudgetINR,
    updatedPlan.intake.expectedFootfall
  );

  assert.equal(afterMetrics.confirmedItemsCount, 4);
  assert.equal(
    afterMetrics.totalEffectiveSpendINR,
    beforeMetrics.totalEffectiveSpendINR - 9000
  );
  assert.equal(
    afterMetrics.remainingMasterBufferINR,
    beforeMetrics.remainingMasterBufferINR + 9000
  );
});

test('applyCrisisTradeOffToPlan updates budget, schedule, volunteer task, and appliedShocks without resetting plan', () => {
  const surgeScenario = DETERMINISTIC_CRISIS_RESULTS['crisis-reg-surge'];
  const optionA = surgeScenario.options[0];

  const updatedPlan = applyCrisisTradeOffToPlan(
    INITIAL_FEST_MASTER_PLAN,
    surgeScenario.scenarioTitle,
    optionA
  );

  assert.equal(updatedPlan.appliedShocks.length, 1);
  assert.equal(updatedPlan.appliedShocks[0].budgetDeltaINR, 14500);

  const cateringItem = updatedPlan.budget.find(
    (b) => b.category === 'Catering, Stalls & Midnight Refreshments'
  );
  assert.ok(cateringItem);
  assert.equal(cateringItem.aiEstimateINR, 115000 + 14500);
});

test('computeVolunteerOpsMetrics aggregates department counts and volunteer headcount including custom coordinator roles', () => {
  const ops = computeVolunteerOpsMetrics([
    ...INITIAL_FEST_MASTER_PLAN.volunteerTasks,
    {
      id: 'vt-custom-role',
      taskCode: 'VOL-108',
      title: 'Coordinate Drone Arena Safety & Live Photography',
      coordinatorName: 'Fatehveer',
      coordinatorRole: 'Drone Arena & Media Lead',
      department: 'Drone Arena & Media Lead',
      assignedVolunteersCount: 5,
      status: 'In-Progress',
      priority: 'High',
      deadlineWindow: 'Day 1 · 10:00 IST',
      venueTrack: 'Central Lawn',
      contactChannel: '#drone-media',
    },
  ]);
  assert.equal(ops.totalTasks, 8);
  assert.equal(ops.completedCount, 1);
  assert.equal(ops.inProgressCount, 4);
  assert.equal(ops.pendingCount, 1);
  assert.equal(ops.blockedCount, 2);
  assert.equal(ops.totalVolunteersMobilized, 43);
  assert.ok(
    ops.byDepartment.some((d) => d.department === 'Drone Arena & Media Lead')
  );
});

test('computeTradeOffBudgetPreview classifies green, amber, and red rupee delta badges accurately', () => {
  const surgeOptions = DETERMINISTIC_CRISIS_RESULTS['crisis-reg-surge'].options;
  const previewAmber = computeTradeOffBudgetPreview(
    INITIAL_FEST_MASTER_PLAN.budget,
    450000,
    500,
    surgeOptions[0]
  );
  assert.equal(previewAmber.deltaTone, 'amber');
  assert.equal(previewAmber.currentCategoryAllocationINR, 115000);
  assert.equal(previewAmber.projectedCategoryAllocationINR, 129500);

  const previewGreen = computeTradeOffBudgetPreview(
    INITIAL_FEST_MASTER_PLAN.budget,
    450000,
    500,
    surgeOptions[1]
  );
  assert.equal(previewGreen.deltaTone, 'green');

  const previewRed = computeTradeOffBudgetPreview(
    INITIAL_FEST_MASTER_PLAN.budget,
    450000,
    500,
    surgeOptions[2]
  );
  assert.equal(previewRed.deltaTone, 'red');
  assert.ok(previewRed.projectedBufferINR < 0);
});

test('buildPresetMasterPlan populates all 3 presets and 12 competing campus vendor quotes', () => {
  const synergy = buildPresetMasterPlan('synergy');
  assert.equal(synergy.intake.totalBudgetINR, 800000);
  assert.equal(synergy.intake.expectedFootfall, 1200);
  assert.equal(synergy.vendorQuotes.length, 12);

  const devdays = buildPresetMasterPlan('devdays');
  assert.equal(devdays.intake.totalBudgetINR, 150000);
  assert.equal(devdays.intake.expectedFootfall, 250);
  assert.equal(devdays.vendorQuotes.length, 12);
});

test('buildExecutiveOpsSummaryFromPlan and buildCoordinatorOutreachFromTask reflect custom intake, custom coordinator names, custom roles, and live logs with zero stale sample data', () => {
  const customIntake = {
    ...CLEAN_INITIAL_MASTER_PLAN.intake,
    festName: 'RoboIgnite Summit 2026',
    festCategory: 'Custom Category' as const,
    customCategory: 'National Robotics & Drone Expo',
    venueType: 'External Convention Center / Hotel' as const,
    eventLocality: 'Chandigarh IT Park Convention Hall',
    dates: 'Dec 18–19, 2026',
    startTime: '10:00 AM',
    endTime: '07:30 PM',
    totalBudgetINR: 620000,
    expectedFootfall: 850,
    concurrentVenueTracks: ['Main Drone Arena', 'Workshop Hall B'],
    additionalContextNotes:
      'Dedicated LiPo battery fire-safe charging bunker required.',
  };

  const generated = buildPlanFromUserIntake(
    customIntake,
    CLEAN_INITIAL_MASTER_PLAN.clarifyingQuestions
  );

  // Customize coordinator names and custom roles on the tasks
  const customTasks = generated.volunteerTasks.map((t, idx) =>
    idx === 0
      ? {
        ...t,
        coordinatorName: 'Fatehveer Singh',
        coordinatorRole: 'Drone Safety & Arena Marshall',
        department: 'Drone Safety & Arena Marshall',
      }
      : idx === 1
        ? {
          ...t,
          coordinatorName: 'Simran Kaur',
          coordinatorRole: 'AV & Telemetry Crew',
          department: 'AV & Telemetry Crew',
        }
        : t
  );

  const customPlan = {
    ...CLEAN_INITIAL_MASTER_PLAN,
    intake: customIntake,
    schedule: generated.schedule,
    budget: generated.budget,
    volunteerTasks: customTasks,
    coordinatorLogs: [
      {
        id: 'log-custom-1',
        timestamp: '14:15 IST',
        author: 'Gurpreet Gill',
        squad: 'LiPo Battery & Fire Safety Squad',
        note: 'Installed 4 fire-resistant charging stations at Main Drone Arena.',
      },
    ],
  };

  const summary = buildExecutiveOpsSummaryFromPlan(customPlan);

  // Verify custom Intake details appear in snapshot and broadcasts
  assert.ok(summary.executiveProgressSnapshot.includes('RoboIgnite Summit 2026'));
  assert.ok(
    summary.executiveProgressSnapshot.includes(
      'Chandigarh IT Park Convention Hall'
    )
  );
  assert.ok(
    summary.executiveProgressSnapshot.includes('Gurpreet Gill') &&
    summary.executiveProgressSnapshot.includes(
      'LiPo Battery & Fire Safety Squad'
    )
  );

  // Verify Immediate Coordinator Action Plan has custom names & roles and zero stale TechnoVerse names
  const actionOwners = summary.immediateNextActions.map(
    (a) => `${a.owner} (${a.squad})`
  );
  assert.ok(
    actionOwners.some((o) =>
      o.includes('Gurpreet Gill (LiPo Battery & Fire Safety Squad)')
    )
  );
  assert.ok(
    actionOwners.some((o) =>
      o.includes('Fatehveer Singh (Drone Safety & Arena Marshall)')
    )
  );
  assert.ok(
    actionOwners.some((o) => o.includes('Simran Kaur (AV & Telemetry Crew)'))
  );
  assert.ok(!JSON.stringify(summary).includes('Rohan Kulkarni'));
  assert.ok(!JSON.stringify(summary).includes('Sneha Reddy'));
  assert.ok(!JSON.stringify(summary).includes('Ananya Iyer'));
  assert.ok(!JSON.stringify(summary).includes("TechnoVerse '26"));

  // Verify WhatsApp & Email broadcasts contain the new coordinator handles and intake details
  assert.ok(summary.broadcasts[0].messageBody.includes('@Gurpreet'));
  assert.ok(summary.broadcasts[0].messageBody.includes('@Fatehveer'));
  assert.ok(summary.broadcasts[0].messageBody.includes('RoboIgnite Summit 2026'));
  assert.ok(
    summary.broadcasts[1].subjectLine.includes('RoboIgnite Summit 2026')
  );

  // Verify task outreach uses the updated coordinator name & custom role
  const outreach = buildCoordinatorOutreachFromTask(
    customTasks[0],
    customIntake
  );
  assert.ok(outreach.recipientName.includes('Fatehveer Singh'));
  assert.ok(outreach.recipientName.includes('Drone Safety & Arena Marshall'));
  assert.ok(outreach.messageBody.includes('@Fatehveer'));
  assert.ok(outreach.messageBody.includes('RoboIgnite Summit 2026'));

  // Verify sample volunteer data builder adapts to custom intake
  const sampleFromIntake = buildSampleVolunteerDataFromIntake(
    customIntake,
    CLEAN_INITIAL_MASTER_PLAN.clarifyingQuestions
  );
  assert.ok(
    sampleFromIntake.coordinatorLogs[0].note.includes('RoboIgnite Summit 2026')
  );
  assert.ok(
    sampleFromIntake.coordinatorLogs[0].note.includes(
      'Chandigarh IT Park Convention Hall'
    )
  );
});

test('evaluateScheduleDependencies marks downstream tasks blocked when prerequisites are Pending', () => {
  const scheduleNodes: ScheduleNode[] = [
    {
      id: 'node-approval',
      code: 'APPR-01',
      title: 'Dean Approval Lock',
      track: 'Administration Track',
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: 'Weeks 4-3 Before Fest',
      venue: 'Dean Office',
      ownerCoordinator: 'Aarav Sharma',
      department: 'Core Executive',
      dependsOnIds: [],
      status: 'Pending',
      blockedIfDelayedWarning: 'Dean approval blocks campus entry and venue rigging',
      blockerNote: 'Awaiting final signature',
    },
    {
      id: 'node-av',
      code: 'AV-01',
      title: 'Rigging Stage Sound & Lighting',
      track: 'Main Stage Track',
      phase: 'Phase 2: AV/Network Infrastructure & Vendor Contracts',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'Day -1 Evening',
      venue: 'Main Auditorium',
      ownerCoordinator: 'Vikram Mehta',
      department: 'Stage & PR Squad',
      dependsOnIds: ['node-approval'],
      status: 'Pending',
      blockedIfDelayedWarning: 'AV vendor cannot rig without Dean permission',
      blockerNote: '',
    },
  ];

  const analysis = evaluateScheduleDependencies(scheduleNodes);
  assert.equal(analysis.criticalPathNodes.length, 1);
  assert.equal(analysis.downstreamNodes.length, 1);
  assert.equal(analysis.unresolvedDependenciesByNodeId['node-av']?.length, 1);
  assert.equal(
    analysis.unresolvedDependenciesByNodeId['node-av'][0].title,
    'Dean Approval Lock'
  );
});

test('lockVendorQuoteInPlan updates master budget and recomputes dual-track metrics with locked quote', () => {
  const basePlan = buildPresetMasterPlan('technoverse');
  const cateringQuote = basePlan.vendorQuotes.find(
    (q) => q.category === 'Catering, Stalls & Midnight Refreshments'
  );
  assert.ok(cateringQuote);

  const updatedPlan = lockVendorQuoteInPlan(basePlan, cateringQuote.id);
  const cateringItem = updatedPlan.budget.find(
    (b) => b.category === 'Catering, Stalls & Midnight Refreshments'
  );
  assert.ok(cateringItem);
  assert.equal(cateringItem.quoteStatus, 'Confirmed Quote');
  assert.equal(cateringItem.confirmedQuoteINR, cateringQuote.totalQuoteINR);

  const metrics = computeDualTrackBudgetMetrics(
    updatedPlan.budget,
    updatedPlan.intake.totalBudgetINR,
    updatedPlan.intake.expectedFootfall
  );
  assert.ok(metrics.totalConfirmedLockedINR > 0);
  assert.ok(metrics.confirmedItemsCount >= 1);
});

