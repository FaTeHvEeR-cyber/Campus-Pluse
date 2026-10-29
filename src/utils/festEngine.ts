import type {
  AppliedShockLog,
  BudgetCategory,
  BudgetLineItem,
  ClarifyingQuestion,
  CoordinatorLogEntry,
  CrisisSimulationResult,
  CrisisTradeOffOption,
  DepartmentName,
  ExecutiveOpsSummary,
  FestIntakeConfig,
  FestMasterPlan,
  OutreachDraft,
  ScheduleNode,
  TaskStatus,
  VendorQuote,
  VolunteerTask,
} from '../types';

export function getEffectiveFestCategory(intake: FestIntakeConfig): string {
  if (
    intake.customCategory &&
    intake.customCategory.trim().length > 0 &&
    (intake.festCategory === 'Custom Category' ||
      intake.customCategory.trim() !== '')
  ) {
    return intake.customCategory.trim();
  }
  return intake.festCategory;
}

export function formatINR(amount: number, showSign = false): string {
  const isNegative = amount < 0;
  const absVal = Math.round(Math.abs(amount));
  const formatted = absVal.toLocaleString('en-IN');
  if (isNegative) {
    return `-₹${formatted}`;
  }
  if (showSign && absVal > 0) {
    return `+₹${formatted}`;
  }
  return `₹${formatted}`;
}

export function sanitizeNumericInput(rawValue: string): {
  displayValue: string;
  numericValue: number;
} {
  const digitsOnly = rawValue.replace(/[^\d]/g, '').replace(/^0+/, '');
  if (!digitsOnly) {
    return { displayValue: '', numericValue: 0 };
  }
  const parsed = Number.parseInt(digitsOnly, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return { displayValue: '', numericValue: 0 };
  }
  return { displayValue: String(parsed), numericValue: parsed };
}

export function formatNumericInputValue(value: number): string {
  return value > 0 ? String(value) : '';
}

export interface DualTrackBudgetMetrics {
  masterCapINR: number;
  totalAiEstimateINR: number;
  totalConfirmedLockedINR: number;
  unconfirmedEstimateExposureINR: number;
  totalEffectiveSpendINR: number;
  remainingMasterBufferINR: number;
  lockedSavingsVsEstimateINR: number;
  confirmedItemsCount: number;
  totalItemsCount: number;
  totalSponsorBackedINR: number;
  utilizationPercent: number;
  perAttendeeEffectiveINR: number;
  budgetHealthStatus: 'Nominal Buffer' | 'Tight Allocation' | 'Overrun Risk';
}

export function computeDualTrackBudgetMetrics(
  budget: BudgetLineItem[],
  masterCapINR: number,
  expectedFootfall = 500
): DualTrackBudgetMetrics {
  let totalAiEstimateINR = 0;
  let totalConfirmedLockedINR = 0;
  let unconfirmedEstimateExposureINR = 0;
  let totalEffectiveSpendINR = 0;
  let lockedSavingsVsEstimateINR = 0;
  let confirmedItemsCount = 0;
  let totalSponsorBackedINR = 0;

  for (const item of budget) {
    totalAiEstimateINR += item.aiEstimateINR;
    totalSponsorBackedINR += item.sponsorBackedINR;

    if (
      item.quoteStatus === 'Confirmed Quote' &&
      item.confirmedQuoteINR !== null
    ) {
      totalConfirmedLockedINR += item.confirmedQuoteINR;
      totalEffectiveSpendINR += item.confirmedQuoteINR;
      lockedSavingsVsEstimateINR += item.aiEstimateINR - item.confirmedQuoteINR;
      confirmedItemsCount += 1;
    } else {
      unconfirmedEstimateExposureINR += item.aiEstimateINR;
      totalEffectiveSpendINR += item.aiEstimateINR;
    }
  }

  const remainingMasterBufferINR = masterCapINR - totalEffectiveSpendINR;
  const utilizationPercent =
    masterCapINR > 0
      ? Math.round((totalEffectiveSpendINR / masterCapINR) * 100)
      : 0;

  const perAttendeeEffectiveINR = Math.round(
    totalEffectiveSpendINR / Math.max(1, expectedFootfall)
  );

  let budgetHealthStatus:
    | 'Nominal Buffer'
    | 'Tight Allocation'
    | 'Overrun Risk' = 'Nominal Buffer';
  if (remainingMasterBufferINR < 0) {
    budgetHealthStatus = 'Overrun Risk';
  } else if (remainingMasterBufferINR < masterCapINR * 0.05) {
    budgetHealthStatus = 'Tight Allocation';
  }

  return {
    masterCapINR,
    totalAiEstimateINR,
    totalConfirmedLockedINR,
    unconfirmedEstimateExposureINR,
    totalEffectiveSpendINR,
    remainingMasterBufferINR,
    lockedSavingsVsEstimateINR,
    confirmedItemsCount,
    totalItemsCount: budget.length,
    totalSponsorBackedINR,
    utilizationPercent,
    perAttendeeEffectiveINR,
    budgetHealthStatus,
  };
}

export function computeExecutionReadinessScore(
  schedule: ScheduleNode[],
  volunteerTasks: VolunteerTask[]
): number {
  const allStatuses: TaskStatus[] = [
    ...schedule.map((s) => s.status),
    ...volunteerTasks.map((t) => t.status),
  ];
  if (allStatuses.length === 0) return 100;

  let weightedPoints = 0;
  for (const st of allStatuses) {
    if (st === 'Completed') weightedPoints += 1.0;
    else if (st === 'In-Progress') weightedPoints += 0.7;
    else if (st === 'Pending') weightedPoints += 0.45;
    else if (st === 'Blocked') weightedPoints += 0.1;
  }

  return Math.min(
    100,
    Math.max(0, Math.round((weightedPoints / allStatuses.length) * 100))
  );
}

export interface ScheduleDependencyAnalysis {
  criticalPathNodes: ScheduleNode[];
  downstreamNodes: ScheduleNode[];
  unresolvedDependenciesByNodeId: Record<string, ScheduleNode[]>;
  criticalPathCompletionPercent: number;
}

export function evaluateScheduleDependencies(
  schedule: ScheduleNode[]
): ScheduleDependencyAnalysis {
  const byId = new Map<string, ScheduleNode>();
  for (const node of schedule) {
    byId.set(node.id, node);
  }

  const criticalPathNodes = schedule.filter(
    (n) => n.tier === 'Critical-Path Approval'
  );
  const downstreamNodes = schedule.filter(
    (n) => n.tier === 'Downstream Vendor/Volunteer'
  );

  const unresolvedDependenciesByNodeId: Record<string, ScheduleNode[]> = {};
  for (const node of schedule) {
    const unresolved: ScheduleNode[] = [];
    for (const depId of node.dependsOnIds) {
      const parent = byId.get(depId);
      if (parent && parent.status !== 'Completed') {
        unresolved.push(parent);
      }
    }
    unresolvedDependenciesByNodeId[node.id] = unresolved;
  }

  const completedCritical = criticalPathNodes.filter(
    (n) => n.status === 'Completed'
  ).length;
  const criticalPathCompletionPercent =
    criticalPathNodes.length > 0
      ? Math.round((completedCritical / criticalPathNodes.length) * 100)
      : 100;

  return {
    criticalPathNodes,
    downstreamNodes,
    unresolvedDependenciesByNodeId,
    criticalPathCompletionPercent,
  };
}

export interface DepartmentSummary {
  department: DepartmentName;
  totalTasks: number;
  completed: number;
  inProgress: number;
  pending: number;
  blocked: number;
  volunteersCount: number;
}

export interface VolunteerOpsMetrics {
  totalTasks: number;
  completedCount: number;
  inProgressCount: number;
  pendingCount: number;
  blockedCount: number;
  totalVolunteersMobilized: number;
  byDepartment: DepartmentSummary[];
}

export function computeVolunteerOpsMetrics(
  tasks: VolunteerTask[]
): VolunteerOpsMetrics {
  let completedCount = 0;
  let inProgressCount = 0;
  let pendingCount = 0;
  let blockedCount = 0;
  let totalVolunteersMobilized = 0;

  const deptMap = new Map<DepartmentName, DepartmentSummary>();

  for (const task of tasks) {
    totalVolunteersMobilized += task.assignedVolunteersCount;
    if (task.status === 'Completed') completedCount += 1;
    else if (task.status === 'In-Progress') inProgressCount += 1;
    else if (task.status === 'Pending') pendingCount += 1;
    else if (task.status === 'Blocked') blockedCount += 1;

    const existing = deptMap.get(task.department) ?? {
      department: task.department,
      totalTasks: 0,
      completed: 0,
      inProgress: 0,
      pending: 0,
      blocked: 0,
      volunteersCount: 0,
    };

    existing.totalTasks += 1;
    existing.volunteersCount += task.assignedVolunteersCount;
    if (task.status === 'Completed') existing.completed += 1;
    else if (task.status === 'In-Progress') existing.inProgress += 1;
    else if (task.status === 'Pending') existing.pending += 1;
    else if (task.status === 'Blocked') existing.blocked += 1;

    deptMap.set(task.department, existing);
  }

  return {
    totalTasks: tasks.length,
    completedCount,
    inProgressCount,
    pendingCount,
    blockedCount,
    totalVolunteersMobilized,
    byDepartment: Array.from(deptMap.values()),
  };
}

export function lockVendorQuoteInPlan(
  plan: FestMasterPlan,
  quoteId: string
): FestMasterPlan {
  const quote = plan.vendorQuotes.find((q) => q.id === quoteId);
  if (!quote) return plan;

  const updatedBudget = plan.budget.map((item) => {
    if (item.category !== quote.category) return item;
    return {
      ...item,
      confirmedQuoteINR: quote.totalQuoteINR,
      quoteStatus: 'Confirmed Quote' as const,
      lockedVendorName: quote.vendorName,
      lockedVendorId: quote.id,
      notes: `Locked quote with ${quote.vendorName} (${
        quote.gstIncluded ? 'GST Incl.' : 'Excl. GST'
      }, ${quote.advancePaymentPercent}% advance). ${quote.slaGuarantee}`,
    };
  });

  return {
    ...plan,
    budget: updatedBudget,
    lastUpdatedISO: new Date().toISOString(),
  };
}

export function applyCrisisTradeOffToPlan(
  plan: FestMasterPlan,
  scenarioTitle: string,
  option: CrisisTradeOffOption
): FestMasterPlan {
  const updatedBudget = plan.budget.map((item) => {
    if (item.category !== option.targetBudgetCategory) return item;

    if (
      item.quoteStatus === 'Confirmed Quote' &&
      item.confirmedQuoteINR !== null
    ) {
      const nextConfirmed = Math.max(
        0,
        item.confirmedQuoteINR + option.budgetDeltaINR
      );
      return {
        ...item,
        confirmedQuoteINR: nextConfirmed,
        notes: `[Crisis Re-Plan: ${option.strategyTitle}] ${item.notes}`,
      };
    }

    const nextEstimate = Math.max(
      0,
      item.aiEstimateINR + option.budgetDeltaINR
    );
    return {
      ...item,
      aiEstimateINR: nextEstimate,
      notes: `[Crisis Re-Plan: ${option.strategyTitle}] ${item.notes}`,
    };
  });

  const updatedSchedule = plan.schedule.map((node) => {
    if (node.id !== option.affectedScheduleId) return node;
    return {
      ...node,
      status:
        node.status === 'Blocked' ? ('In-Progress' as TaskStatus) : node.status,
      blockerNote: option.scheduleAdjustment,
    };
  });

  const updatedTasks = plan.volunteerTasks.map((task) => {
    if (task.id !== option.affectedTaskId) return task;
    return {
      ...task,
      status:
        task.status === 'Blocked' ? ('In-Progress' as TaskStatus) : task.status,
      bottleneckReason: `Mitigated via ${option.optionLabel}: ${option.volunteerReallocation}`,
    };
  });

  const shockEntry: AppliedShockLog = {
    id: `shock-${Date.now()}`,
    timestamp: new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    scenarioTitle,
    chosenStrategy: `${option.optionLabel} — ${option.strategyTitle}`,
    budgetDeltaINR: option.budgetDeltaINR,
    scheduleNote: option.scheduleAdjustment,
    volunteerNote: option.volunteerReallocation,
  };

  return {
    ...plan,
    budget: updatedBudget,
    schedule: updatedSchedule,
    volunteerTasks: updatedTasks,
    appliedShocks: [shockEntry, ...plan.appliedShocks],
    lastUpdatedISO: new Date().toISOString(),
  };
}

export function cycleTaskStatus(current: TaskStatus): TaskStatus {
  if (current === 'Blocked') return 'In-Progress';
  if (current === 'In-Progress') return 'Completed';
  if (current === 'Completed') return 'Pending';
  return 'In-Progress';
}

export function getCategoryBudgetItem(
  budget: BudgetLineItem[],
  category: BudgetCategory
): BudgetLineItem | undefined {
  return budget.find((b) => b.category === category);
}

export interface TradeOffBudgetPreview {
  targetCategory: BudgetCategory;
  currentCategoryAllocationINR: number;
  projectedCategoryAllocationINR: number;
  budgetDeltaINR: number;
  currentTotalSpendINR: number;
  projectedTotalSpendINR: number;
  currentBufferINR: number;
  projectedBufferINR: number;
  deltaTone: 'green' | 'amber' | 'red';
  deltaBadgeText: string;
}

export function computeTradeOffBudgetPreview(
  budget: BudgetLineItem[],
  masterCapINR: number,
  expectedFootfall: number,
  option: CrisisTradeOffOption
): TradeOffBudgetPreview {
  const metrics = computeDualTrackBudgetMetrics(
    budget,
    masterCapINR,
    expectedFootfall
  );
  const targetItem = getCategoryBudgetItem(budget, option.targetBudgetCategory);
  const currentCategoryAllocationINR = targetItem
    ? targetItem.quoteStatus === 'Confirmed Quote' &&
      targetItem.confirmedQuoteINR !== null
      ? targetItem.confirmedQuoteINR
      : targetItem.aiEstimateINR
    : 0;

  const projectedCategoryAllocationINR = Math.max(
    0,
    currentCategoryAllocationINR + option.budgetDeltaINR
  );
  const currentTotalSpendINR = metrics.totalEffectiveSpendINR;
  const projectedTotalSpendINR = currentTotalSpendINR + option.budgetDeltaINR;
  const currentBufferINR = metrics.remainingMasterBufferINR;
  const projectedBufferINR = masterCapINR - projectedTotalSpendINR;

  let deltaTone: 'green' | 'amber' | 'red' = 'green';
  let deltaBadgeText = '₹0 Net Delta';

  if (option.budgetDeltaINR < 0) {
    deltaTone = 'green';
    deltaBadgeText = `${formatINR(option.budgetDeltaINR, true)} Savings`;
  } else if (option.budgetDeltaINR === 0) {
    deltaTone = 'green';
    deltaBadgeText = '₹0 Net Delta';
  } else if (projectedBufferINR < 0 || option.budgetDeltaINR >= 20000) {
    deltaTone = 'red';
    deltaBadgeText =
      projectedBufferINR < 0
        ? `${formatINR(option.budgetDeltaINR, true)} Overrun`
        : `${formatINR(option.budgetDeltaINR, true)} High Spend`;
  } else {
    deltaTone = 'amber';
    deltaBadgeText = `${formatINR(option.budgetDeltaINR, true)} Buffer Draw`;
  }

  return {
    targetCategory: option.targetBudgetCategory,
    currentCategoryAllocationINR,
    projectedCategoryAllocationINR,
    budgetDeltaINR: option.budgetDeltaINR,
    currentTotalSpendINR,
    projectedTotalSpendINR,
    currentBufferINR,
    projectedBufferINR,
    deltaTone,
    deltaBadgeText,
  };
}

export function buildTailoredClarifyingQuestionsFromIntake(
  intake: FestIntakeConfig
): ClarifyingQuestion[] {
  const categoryLabel = getEffectiveFestCategory(intake);
  const locality = intake.eventLocality?.trim() || 'Main Event Locality';
  const venueType = intake.venueType || 'College Campus';
  const startTime = intake.startTime?.trim() || '09:00 AM';
  const endTime = intake.endTime?.trim() || '06:00 PM';
  const mainVenue =
    intake.concurrentVenueTracks[0] || intake.primaryVenues || 'Main Venue Hall';
  const secondVenue = intake.concurrentVenueTracks[1] || 'Secondary Room/Zone';
  const venuesList =
    intake.concurrentVenueTracks.length > 0
      ? intake.concurrentVenueTracks.join(', ')
      : mainVenue;
  const totalBudget = Math.max(5000, intake.totalBudgetINR || 250000);
  const footfall = Math.max(10, intake.expectedFootfall || 300);
  const upfront70 = formatINR(Math.round((totalBudget * 0.7) / 500) * 500);
  const upfront40 = formatINR(Math.round((totalBudget * 0.4) / 500) * 500);
  const remaining60 = formatINR(Math.round((totalBudget * 0.6) / 500) * 500);
  const customNoteSnippet = intake.additionalContextNotes?.trim()
    ? ` (noting your custom brief: "${intake.additionalContextNotes.trim().slice(0, 60)}")`
    : '';

  const isExternalVenue =
    venueType === 'External Convention Center / Hotel' ||
    venueType === 'Community Ground / Open-Air Venue';

  const q1Options = isExternalVenue
    ? [
        `Venue booking & sound permit confirmed at ${locality} (${startTime}–${endTime})`,
        `50% hall deposit paid at ${mainVenue}; local fire/police NOC in progress`,
        `Daytime indoor setup at ${mainVenue} — standard venue agreement only`,
      ]
    : [
        `Dean / Faculty Advisor NOC approved for ${mainVenue} (${startTime}–${endTime})`,
        `Campus hall booking confirmed at ${locality}; security & gate pass list in progress`,
        `Extended evening & external participant entry permit requested for ${intake.festName}`,
      ];

  const q2Options =
    intake.concurrentVenueTracks.length > 1
      ? [
          `Staggered slots: Opening & Keynote at ${mainVenue}, parallel sessions at ${secondVenue}`,
          `Dedicated squad lead from ${intake.activeVolunteerCoordinators} coordinators per venue (${venuesList})`,
          `Run main ${categoryLabel} sessions sequentially at ${mainVenue} with overflow in ${secondVenue}`,
        ]
      : [
          `Single-track sequential schedule at ${mainVenue} (${startTime}–${endTime})`,
          `Split ${mainVenue} into registration/stall zone + main stage area`,
          `Assign ${intake.activeVolunteerCoordinators} coordinators in 2 rotating shifts at ${mainVenue}`,
        ];

  const q3Options = [
    `70% funds (${upfront70}) ready in hand; 30% from sponsors/registrations`,
    `100% self/institution funded (${formatINR(totalBudget)}) — ready for vendor advances`,
    `40% (${upfront40}) available now; remaining ${remaining60} expected 1 week before ${intake.dates}`,
  ];

  const q4Options = [
    `Boxed meals / buffet & hydration counters for ${footfall} pax at ${locality} (${startTime}–${endTime})`,
    `High-tea snacks + VIP/Judge hospitality lounge at ${mainVenue} (${locality})`,
    `Full-day catering + late-evening refreshments & outstation guest desk for ${intake.festName}`,
  ];

  return [
    {
      id: 'cq-1',
      category: 'Campus Permissions',
      question: isExternalVenue
        ? `What venue booking agreements, sound permits, or local authority NOCs are needed for "${intake.festName}" (${categoryLabel}) at ${mainVenue} in ${locality} (${venueType}) on ${intake.dates} from ${startTime} to ${endTime}?`
        : `What campus permissions or Dean/Registrar approvals are required for "${intake.festName}" (${categoryLabel}) at ${mainVenue} (${locality}) on ${intake.dates} (${startTime} – ${endTime}) for ${footfall.toLocaleString('en-IN')} attendees?`,
      whyItMatters: `Securing ${venueType} access and sound/entry clearance at ${locality} prevents last-minute timing or gate restrictions on ${intake.dates}.`,
      suggestedOptions: q1Options,
      answer: q1Options[0],
    },
    {
      id: 'cq-2',
      category: 'Multi-Track Room Clashes',
      question: `How will you coordinate ${categoryLabel} sessions across ${venuesList} between ${startTime} and ${endTime} using your ${intake.activeVolunteerCoordinators} volunteer coordinators so sessions and crowd flow don't clash?`,
      whyItMatters: `Aligning ${intake.concurrentVenueTracks.length} venue track(s) (${venuesList}) avoids AV crew bottlenecks and crowd congestion.`,
      suggestedOptions: q2Options,
      answer: q2Options[0],
    },
    {
      id: 'cq-3',
      category: 'Sponsor Timelines',
      question: `For your ${formatINR(totalBudget)} budget (${intake.weeksUntilFest} weeks until ${intake.dates}), how much cash is immediately available for vendor advances in ${locality} vs. pending sponsorships or ticket collections?`,
      whyItMatters: `Catering and AV vendors in ${locality} typically require 40%–50% advance payment prior to event day (${intake.dates}).`,
      suggestedOptions: q3Options,
      answer: q3Options[0],
    },
    {
      id: 'cq-4',
      category: 'Overnight Logistics',
      question: `What food, refreshment, and guest/security arrangements are needed for ${footfall.toLocaleString('en-IN')} attendees at ${locality} during ${startTime} – ${endTime}${customNoteSnippet}?`,
      whyItMatters: `Directly calibrates per-plate catering quotes, hydration stalls, and volunteer hospitality shifts for ${intake.festName}${customNoteSnippet}.`,
      suggestedOptions: q4Options,
      answer: q4Options[0],
    },
  ];
}

export function buildPlanFromUserIntake(
  intake: FestIntakeConfig,
  clarifyingQuestions: ClarifyingQuestion[]
): {
  schedule: ScheduleNode[];
  budget: BudgetLineItem[];
  volunteerTasks: VolunteerTask[];
} {
  const categoryLabel = getEffectiveFestCategory(intake);
  const locality = intake.eventLocality?.trim() || 'Main Event Locality';
  const venueType = intake.venueType || 'College Campus';
  const startTime = intake.startTime?.trim() || '09:00 AM';
  const endTime = intake.endTime?.trim() || '06:00 PM';
  const mainVenue =
    intake.concurrentVenueTracks[0] || intake.primaryVenues || 'Main Venue Hall';
  const secondVenue = intake.concurrentVenueTracks[1] || mainVenue;
  const mainTrack = intake.tracks[0] || categoryLabel;
  const totalBudget = Math.max(10000, intake.totalBudgetINR);
  const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500);
  const customNotes = intake.additionalContextNotes?.trim() || '';

  const approvalAuthority =
    venueType === 'College Campus'
      ? 'Dean of Student Welfare & Campus Estate Office'
      : venueType === 'External Convention Center / Hotel'
        ? 'Convention Center Facility Manager & Local Fire NOC'
        : 'Local Municipal Ground Authority & Sound Permit Cell';

  const permissionAnswer = clarifyingQuestions[0]?.answer?.trim();
  const clashAnswer = clarifyingQuestions[1]?.answer?.trim();
  const sponsorAnswer = clarifyingQuestions[2]?.answer?.trim();
  const logisticsAnswer = clarifyingQuestions[3]?.answer?.trim();

  const schedule: ScheduleNode[] = [
    {
      id: 'sched-intake-1',
      code: 'CP-01',
      title: `${approvalAuthority} Clearance for ${intake.festName} (${locality})${
        permissionAnswer ? ` — ${permissionAnswer.slice(0, 48)}` : ''
      }`,
      track: mainTrack,
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: `T-${Math.max(1, intake.weeksUntilFest)} Weeks · 11:00 AM`,
      venue: `${mainVenue} (${locality})`,
      ownerCoordinator: 'Event Lead Coordinator',
      department: 'Core Executive',
      dependsOnIds: [],
      status: 'In-Progress',
      blockedIfDelayedWarning: `Blocks venue access at ${mainVenue} (${locality}) for ${intake.expectedFootfall} attendees.`,
    },
    {
      id: 'sched-intake-2',
      code: 'CP-02',
      title: `Power, Wi-Fi & Audio Setup Approval for ${venueType} (${startTime} – ${endTime})`,
      track: mainTrack,
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: `T-${Math.max(1, intake.weeksUntilFest - 1)} Weeks · 02:00 PM`,
      venue: secondVenue,
      ownerCoordinator: 'Technical Ops Lead',
      department: 'Technical & Lab Ops',
      dependsOnIds: ['sched-intake-1'],
      status: 'Pending',
      blockedIfDelayedWarning:
        'Delays stage soundcheck and high-density Wi-Fi router deployment.',
    },
    {
      id: 'sched-intake-3',
      code: 'OPS-01',
      title: `Vendor Advance & Catering Contract Lock in ${locality}${
        sponsorAnswer ? ` (${sponsorAnswer.slice(0, 42)})` : ''
      }`,
      track: mainTrack,
      phase: 'Phase 2: AV/Network Infrastructure & Vendor Contracts',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'T-7 Days · 04:00 PM',
      venue: locality,
      ownerCoordinator: 'Finance & Sponsor Lead',
      department: 'Sponsorship & Finance',
      dependsOnIds: ['sched-intake-1'],
      status: 'Pending',
      blockedIfDelayedWarning:
        'Vendors require advance confirmation before dispatching equipment and meals.',
      blockerNote: customNotes
        ? `Custom Brief Requirement: ${customNotes}`
        : undefined,
    },
    {
      id: 'sched-intake-4',
      code: 'OPS-02',
      title: `Volunteer Shift Briefing (${intake.activeVolunteerCoordinators} Coordinators) & Registration Desk Setup`,
      track: mainTrack,
      phase: 'Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: `T-2 Days · ${startTime}`,
      venue: mainVenue,
      ownerCoordinator: 'Hospitality & Registration Lead',
      department: 'Registration & Hospitality Desk',
      dependsOnIds: ['sched-intake-2'],
      status: 'Pending',
      blockedIfDelayedWarning: `Creates check-in bottlenecks at ${startTime} gate opening.`,
      blockerNote: clashAnswer || undefined,
    },
    {
      id: 'sched-intake-5',
      code: 'OPS-03',
      title: `Event Day Run-of-Show (${startTime} to ${endTime}) across ${intake.concurrentVenueTracks.join(', ')}${
        logisticsAnswer ? ` · ${logisticsAnswer.slice(0, 40)}` : ''
      }`,
      track: mainTrack,
      phase: 'Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: `${intake.dates} · ${startTime} – ${endTime}`,
      venue: intake.concurrentVenueTracks.join(' & '),
      ownerCoordinator: 'Stage & Logistics Lead',
      department: 'Stage & PR Squad',
      dependsOnIds: ['sched-intake-3', 'sched-intake-4'],
      status: 'Pending',
      blockedIfDelayedWarning:
        'Impacts live session transitions and closing ceremony schedule.',
      blockerNote: customNotes
        ? `Custom Event Note: ${customNotes}`
        : undefined,
    },
  ];

  // Allocate ~94% of totalBudget across 6 categories, leaving ~6% contingency buffer
  const allocatable = totalBudget * 0.94;
  const customNoteSuffix = customNotes
    ? ` · Custom Brief: ${customNotes.slice(0, 80)}`
    : '';

  const budget: BudgetLineItem[] = [
    {
      id: 'b-intake-1',
      category: 'Stage, Sound & AV Rigging',
      itemTitle: `Audio, Projection & Stage Setup at ${mainVenue} (${locality})`,
      track: mainTrack,
      priority: 'Must-Have',
      aiEstimateINR: round500(allocatable * 0.22),
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: round500(intake.sponsorTargetINR * 0.2),
      notes: `Estimated for ${venueType} (${startTime} – ${endTime})${customNoteSuffix}.`,
    },
    {
      id: 'b-intake-2',
      category: 'Hackathon Wi-Fi, Power & Lab Setup',
      itemTitle: `Wi-Fi Access Points, Extension Boards & Power Backup (${secondVenue})`,
      track: mainTrack,
      priority: 'Must-Have',
      aiEstimateINR: round500(allocatable * 0.18),
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: round500(intake.sponsorTargetINR * 0.15),
      notes: `Sized for ${intake.expectedFootfall} participants.`,
    },
    {
      id: 'b-intake-3',
      category: 'Catering, Stalls & Midnight Refreshments',
      itemTitle: `Participant Meals, Water & Refreshments (${intake.expectedFootfall} Pax in ${locality})`,
      track: mainTrack,
      priority: 'Must-Have',
      aiEstimateINR: round500(allocatable * 0.26),
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: round500(intake.sponsorTargetINR * 0.25),
      notes: `Covers ${startTime} – ${endTime}${
        intake.overnightStayRequired ? ' + overnight refreshments' : ''
      }${customNoteSuffix}.`,
    },
    {
      id: 'b-intake-4',
      category: 'Swag, IDs, Certificates & Printing',
      itemTitle: `Lanyards, Badges, Standees & Certificates (${intake.expectedFootfall} Attendees)`,
      track: mainTrack,
      priority: 'Flexible',
      aiEstimateINR: round500(allocatable * 0.11),
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: round500(intake.sponsorTargetINR * 0.1),
      notes: 'Includes venue directional signage and registration passes.',
    },
    {
      id: 'b-intake-5',
      category: 'Judge Travel, Security & Hospitality',
      itemTitle: `Guest Speakers, Security & Venue Support at ${locality}`,
      track: mainTrack,
      priority: 'Flexible',
      aiEstimateINR: round500(allocatable * 0.09),
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: round500(intake.sponsorTargetINR * 0.1),
      notes: `Security & guest desk for ${venueType}${customNoteSuffix}.`,
    },
    {
      id: 'b-intake-6',
      category: 'Prize Pool & Contingency Buffer',
      itemTitle: `Event Prizes, Awards & Emergency Reserve`,
      track: mainTrack,
      priority: 'Must-Have',
      aiEstimateINR: round500(allocatable * 0.14),
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: round500(intake.sponsorTargetINR * 0.2),
      notes: `Allocated for ${categoryLabel}${customNoteSuffix}.`,
    },
  ];

  const perSquadCount = Math.max(
    2,
    Math.round(intake.activeVolunteerCoordinators / 4)
  );
  const volunteerTasks: VolunteerTask[] = [
    {
      id: 'vt-intake-1',
      taskCode: 'VOL-101',
      title: `Confirm ${venueType} Permissions & Setup Checklist at ${mainVenue} (${locality})`,
      coordinatorName: 'Event Operations Lead',
      coordinatorRole: 'Core Coordinator',
      department: 'Core Executive',
      assignedVolunteersCount: perSquadCount,
      status: 'In-Progress',
      priority: 'Critical',
      deadlineWindow: `Before ${startTime}`,
      venueTrack: mainVenue,
      linkedScheduleId: 'sched-intake-1',
      contactChannel: '#core-ops',
      bottleneckReason: customNotes
        ? `Custom Brief Note: ${customNotes}`
        : undefined,
    },
    {
      id: 'vt-intake-2',
      taskCode: 'VOL-102',
      title: `Test Wi-Fi, Projectors & Power Backup in ${secondVenue}`,
      coordinatorName: 'Technical Squad Lead',
      coordinatorRole: 'Tech Lead',
      department: 'Technical & Lab Ops',
      assignedVolunteersCount: perSquadCount,
      status: 'Pending',
      priority: 'High',
      deadlineWindow: `1 Hr Before ${startTime}`,
      venueTrack: secondVenue,
      linkedScheduleId: 'sched-intake-2',
      contactChannel: '#tech-ops',
    },
    {
      id: 'vt-intake-3',
      taskCode: 'VOL-103',
      title: `Manage Check-In Desk & Attendee Badges (${intake.expectedFootfall} Pax)`,
      coordinatorName: 'Registration Lead',
      coordinatorRole: 'Hospitality Coordinator',
      department: 'Registration & Hospitality Desk',
      assignedVolunteersCount: perSquadCount,
      status: 'Pending',
      priority: 'High',
      deadlineWindow: `${startTime} Gate Open`,
      venueTrack: mainVenue,
      linkedScheduleId: 'sched-intake-4',
      contactChannel: '#registration-desk',
    },
    {
      id: 'vt-intake-4',
      taskCode: 'VOL-104',
      title: `Coordinate Catering Delivery & Refreshment Counters (${startTime} – ${endTime})`,
      coordinatorName: 'Food & Logistics Lead',
      coordinatorRole: 'Logistics Coordinator',
      department: 'Logistics & Food Committee',
      assignedVolunteersCount: perSquadCount,
      status: 'Pending',
      priority: 'Standard',
      deadlineWindow: `During ${startTime} – ${endTime}`,
      venueTrack: locality,
      linkedScheduleId: 'sched-intake-3',
      contactChannel: '#food-logistics',
    },
  ];

  return { schedule, budget, volunteerTasks };
}

export function buildSuggestedVendorQuotesFromIntake(
  intake: FestIntakeConfig,
  budget: BudgetLineItem[]
): VendorQuote[] {
  const locality = intake.eventLocality?.trim() || 'Local City';
  const venueType = intake.venueType || 'College Campus';
  const startTime = intake.startTime?.trim() || '09:00 AM';
  const endTime = intake.endTime?.trim() || '06:00 PM';
  const customNotes = intake.additionalContextNotes?.trim() || '';
  const round500 = (n: number) => Math.max(1000, Math.round(n / 500) * 500);

  const getEst = (cat: BudgetCategory, fallback: number) =>
    budget.find((b) => b.category === cat)?.aiEstimateINR ?? fallback;

  const cateringEst = getEst(
    'Catering, Stalls & Midnight Refreshments',
    Math.round(intake.totalBudgetINR * 0.25)
  );
  const swagEst = getEst(
    'Swag, IDs, Certificates & Printing',
    Math.round(intake.totalBudgetINR * 0.1)
  );
  const wifiEst = getEst(
    'Hackathon Wi-Fi, Power & Lab Setup',
    Math.round(intake.totalBudgetINR * 0.16)
  );
  const avEst = getEst(
    'Stage, Sound & AV Rigging',
    Math.round(intake.totalBudgetINR * 0.2)
  );

  return [
    {
      id: 'vq-sug-cat-1',
      category: 'Catering, Stalls & Midnight Refreshments',
      vendorName: `${locality} Institutional Caterers & Refreshments`,
      totalQuoteINR: round500(cateringEst * 0.92),
      gstIncluded: true,
      advancePaymentPercent: 40,
      paymentTerms: '40% Advance · 60% Post-Event',
      deliveryLeadTime: `Direct setup at ${locality} (${startTime} – ${endTime})`,
      inclusions: [
        `${intake.expectedFootfall} buffet/boxed meals + hydration counters`,
        `Dedicated serving staff for ${venueType}`,
        ...(customNotes ? [`Custom Brief Covered: ${customNotes.slice(0, 70)}`] : []),
      ],
      hiddenCostsGeneratorCharges: 'Zero transport surcharge within locality.',
      slaGuarantee: `On-site counter ready 45 mins before meal slot`,
      campusPastTrackRecord: `Suggested for ${locality} (${intake.expectedFootfall} attendees)`,
      budgetFitScore: 95,
      campusReliabilityScore: 92,
      hiddenCostRisk: 'Low',
      negotiationTip: 'Ask for 5% extra buffer plates at no extra charge.',
      aiRecommendationNote: `Saves ${formatINR(
        cateringEst - round500(cateringEst * 0.92)
      )} vs. your Intake catering estimate in ${locality}${
        customNotes ? ` and accommodates "${customNotes.slice(0, 50)}"` : ''
      }.`,
    },
    {
      id: 'vq-sug-cat-2',
      category: 'Catering, Stalls & Midnight Refreshments',
      vendorName: `Premier Event Hospitality (${locality})`,
      totalQuoteINR: round500(cateringEst * 1.06),
      gstIncluded: true,
      advancePaymentPercent: 50,
      paymentTerms: '50% Advance · 50% Event Day',
      deliveryLeadTime: `60 mins before ${startTime}`,
      inclusions: [
        `Live snack & beverage counters for ${intake.expectedFootfall} guests`,
        'VIP speaker & judge hospitality platters',
        ...(customNotes ? [`Special Requirement Support: ${customNotes.slice(0, 70)}`] : []),
      ],
      hiddenCostsGeneratorCharges: '₹2,500 extra if service extends past end time.',
      slaGuarantee: 'Full hygiene & warm-food SLA',
      campusPastTrackRecord: `Suggested premium option for ${venueType}`,
      budgetFitScore: 78,
      campusReliabilityScore: 89,
      hiddenCostRisk: 'Moderate',
      negotiationTip: 'Waive overtime transport charge before locking.',
      aiRecommendationNote: 'Higher per-plate cost; choose if VIP hospitality is top priority.',
    },
    {
      id: 'vq-sug-swag-1',
      category: 'Swag, IDs, Certificates & Printing',
      vendorName: `${locality} QuickPrint & Merch Studio`,
      totalQuoteINR: round500(swagEst * 0.9),
      gstIncluded: true,
      advancePaymentPercent: 50,
      paymentTerms: '50% on Artwork Approval · 50% on Delivery',
      deliveryLeadTime: 'T-2 Days Delivery',
      inclusions: [
        `${intake.expectedFootfall} ID cards + lanyards + certificates`,
        `Stage backdrop & welcome standees for ${intake.festName}`,
        ...(customNotes ? [`Custom Branding/Notes: ${customNotes.slice(0, 70)}`] : []),
      ],
      hiddenCostsGeneratorCharges: 'No hidden setup fees.',
      slaGuarantee: '100% pre-counted badge bundles by track',
      campusPastTrackRecord: `Local printer in ${locality}`,
      budgetFitScore: 94,
      campusReliabilityScore: 91,
      hiddenCostRisk: 'Low',
      negotiationTip: 'Bundle stage flex printing to save ₹2,000.',
      aiRecommendationNote: `Best value for ${intake.expectedFootfall} attendee kits.`,
    },
    {
      id: 'vq-sug-wifi-1',
      category: 'Hackathon Wi-Fi, Power & Lab Setup',
      vendorName: `${locality} NetGrid & Power Rentals`,
      totalQuoteINR: round500(wifiEst * 0.94),
      gstIncluded: true,
      advancePaymentPercent: 40,
      paymentTerms: '40% Advance · 60% After Teardown',
      deliveryLeadTime: 'T-1 Day Installation & Load Test',
      inclusions: [
        `High-density Wi-Fi routers & power distribution for ${intake.expectedFootfall} pax`,
        `On-site technician from ${startTime} to ${endTime}`,
        ...(customNotes ? [`Aligned with Custom Notes: ${customNotes.slice(0, 70)}`] : []),
      ],
      hiddenCostsGeneratorCharges: 'Generator diesel billed at actuals if grid fails.',
      slaGuarantee: '99.9% uptime during event hours',
      campusPastTrackRecord: `Recommended for ${venueType} in ${locality}`,
      budgetFitScore: 93,
      campusReliabilityScore: 94,
      hiddenCostRisk: 'Low',
      negotiationTip: 'Include 10 spare spike busters in base rental.',
      aiRecommendationNote: `Tailored to ${intake.concurrentVenueTracks.join(', ')}.`,
    },
    {
      id: 'vq-sug-av-1',
      category: 'Stage, Sound & AV Rigging',
      vendorName: `${locality} ProSound & LED Stage Solutions`,
      totalQuoteINR: round500(avEst * 0.93),
      gstIncluded: true,
      advancePaymentPercent: 50,
      paymentTerms: '50% Advance · 50% Post-Show',
      deliveryLeadTime: `Setup 4 hrs prior to ${startTime}`,
      inclusions: [
        `Line-array audio, wireless mics & projector/LED wall at ${
          intake.concurrentVenueTracks[0] || 'Main Venue'
        }`,
        `Sound engineer on duty (${startTime} – ${endTime})`,
        ...(customNotes ? [`Custom Stage/AV Note: ${customNotes.slice(0, 70)}`] : []),
      ],
      hiddenCostsGeneratorCharges: 'Includes transport & rigging crew.',
      slaGuarantee: 'Soundcheck completed 90 mins before doors open',
      campusPastTrackRecord: `Top-rated AV vendor in ${locality}`,
      budgetFitScore: 95,
      campusReliabilityScore: 93,
      hiddenCostRisk: 'Low',
      negotiationTip: 'Lock early to avoid weekend surge pricing.',
      aiRecommendationNote: `Fits comfortably under your Stage & AV estimate.`,
    },
  ];
}

export function buildCrisisSimulationFromIntake(
  scenarioId: string,
  plan: FestMasterPlan,
  customDescription?: string
): CrisisSimulationResult {
  const { intake } = plan;
  const locality = intake.eventLocality?.trim() || 'Event Locality';
  const venueType = intake.venueType || 'College Campus';
  const startTime = intake.startTime?.trim() || '09:00 AM';
  const endTime = intake.endTime?.trim() || '06:00 PM';
  const customNotes = intake.additionalContextNotes?.trim() || '';
  const customNoteContext = customNotes
    ? ` (Factoring in your custom brief: "${customNotes.slice(0, 80)}")`
    : '';
  const mainVenue =
    intake.concurrentVenueTracks[0] || intake.primaryVenues || 'Main Venue';
  const secondVenue = intake.concurrentVenueTracks[1] || 'Overflow Hall';
  const round500 = (n: number) => Math.max(500, Math.round(n / 500) * 500);

  const surgePax = Math.max(30, Math.round(intake.expectedFootfall * 0.25));
  const moderateCost = round500(intake.totalBudgetINR * 0.035);
  const highCost = round500(intake.totalBudgetINR * 0.075);
  const savingsCost = -round500(intake.totalBudgetINR * 0.03);

  if (customDescription && customDescription.trim().length > 0) {
    return {
      scenarioId: 'custom-shock',
      scenarioTitle: customDescription.trim(),
      rippleAnalysis: `Predicted impact for "${intake.festName}" at ${mainVenue} (${locality}, ${venueType}, ${startTime}–${endTime}): Requires immediate coordination across ${intake.activeVolunteerCoordinators} volunteers and ${formatINR(intake.totalBudgetINR)} budget${customNoteContext}.`,
      impactedCategories: [
        'Stage, Sound & AV Rigging',
        'Catering, Stalls & Midnight Refreshments',
      ],
      impactedVenueTracks: intake.concurrentVenueTracks.slice(0, 2),
      impactedSquads: ['Core Executive', 'Technical & Lab Ops'],
      beforeFootfall: intake.expectedFootfall,
      afterFootfall: intake.expectedFootfall,
      ProjectedUnmitigatedOverrunINR: highCost,
      options: [
        {
          id: 'opt-cust-a',
          optionLabel: 'Strategy A · Buffer-Safe Rebalance (Recommended)',
          strategyTitle: `Absorb Impact Within Contingency Buffer at ${mainVenue}`,
          summary: `Reallocate volunteer leads during ${startTime}–${endTime} and use a modest ${formatINR(moderateCost)} buffer draw in ${locality}.`,
          budgetDeltaINR: moderateCost,
          targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
          scheduleAdjustment: `Adjust ${mainVenue} transition slot by 20 mins`,
          volunteerReallocation: `Assign 4 coordinators from ${secondVenue} to ${mainVenue}`,
          riskTradeOff: 'Minimal schedule shift; keeps master budget healthy.',
          recommended: true,
        },
        {
          id: 'opt-cust-b',
          optionLabel: 'Strategy B · Zero-Cost Schedule Shift',
          strategyTitle: `Consolidate Sessions into ${mainVenue} with ₹0 Extra Spend`,
          summary: `Adjust session timings between ${startTime} and ${endTime} without additional vendor spend.`,
          budgetDeltaINR: 0,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: `Stagger tracks within ${startTime}–${endTime}`,
          volunteerReallocation: 'Rotate existing squad leads across checkpoints',
          riskTradeOff: 'Tighter turnaround between sessions, zero budget hit.',
        },
        {
          id: 'opt-cust-c',
          optionLabel: 'Strategy C · Full Emergency Vendor Backup',
          strategyTitle: `Deploy Express Backup Vendor in ${locality}`,
          summary: `Commission emergency vendor backup in ${locality} to fully insulate ${intake.expectedFootfall} attendees.`,
          budgetDeltaINR: highCost,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: 'Zero schedule delay',
          volunteerReallocation: '2 volunteers assigned to vendor gate entry',
          riskTradeOff: `High cost (${formatINR(highCost, true)}) eating into contingency buffer.`,
        },
      ],
    };
  }

  if (scenarioId === 'crisis-sponsor-delay') {
    const targetSponsorAmount =
      intake.sponsorTargetINR > 0
        ? intake.sponsorTargetINR
        : Math.round(intake.totalBudgetINR * 0.4);
    return {
      scenarioId,
      scenarioTitle: `Sponsor Tranche Delay: ${formatINR(round500(targetSponsorAmount * 0.25))} Delayed Before ${intake.festName}`,
      rippleAnalysis: `A key sponsor for "${intake.festName}" (${locality}) delayed their upfront payout 48 hours before ${startTime}, creating short-term cashflow pressure on AV and Catering advances${customNoteContext}.`,
      impactedCategories: [
        'Stage, Sound & AV Rigging',
        'Catering, Stalls & Midnight Refreshments',
      ],
      impactedVenueTracks: [mainVenue],
      impactedSquads: ['Sponsorship & Finance', 'Core Executive'],
      beforeFootfall: intake.expectedFootfall,
      afterFootfall: intake.expectedFootfall,
      ProjectedUnmitigatedOverrunINR: highCost,
      options: [
        {
          id: 'opt-spon-a',
          optionLabel: 'Strategy A · Trim Non-Essential Swag & Bridge Advance (Recommended)',
          strategyTitle: `Switch to Digital Certificates & Save ${formatINR(Math.abs(savingsCost))}`,
          summary: `Reduce printed swag/flex spend in ${locality} to free up immediate cash for ${mainVenue} AV & Catering advances${customNoteContext}.`,
          budgetDeltaINR: savingsCost,
          targetBudgetCategory: 'Swag, IDs, Certificates & Printing',
          scheduleAdjustment: 'Lock AV & Catering advance on schedule',
          volunteerReallocation: 'Finance squad issues digital QR passes',
          riskTradeOff: 'Digital certificates instead of printed folders; saves cash.',
          recommended: true,
        },
        {
          id: 'opt-spon-b',
          optionLabel: 'Strategy B · Split Payment SLA with Local Vendors',
          strategyTitle: `Negotiate 30% Upfront / 70% Post-Event in ${locality}`,
          summary: `Keep all deliverables intact with a small ${formatINR(moderateCost)} credit-term fee.`,
          budgetDeltaINR: moderateCost,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: `Sign split-payment addendum before ${startTime}`,
          volunteerReallocation: '2 Finance leads coordinate vendor MoU',
          riskTradeOff: `Modest ${formatINR(moderateCost, true)} fee; preserves full scope.`,
        },
        {
          id: 'opt-spon-c',
          optionLabel: 'Strategy C · Emergency Short-Term Vendor Substitution',
          strategyTitle: `Book On-Spot Rental Package in ${locality}`,
          summary: `Switch to last-minute spot vendors requiring zero advance but higher total rate.`,
          budgetDeltaINR: highCost,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: 'Requires re-doing soundcheck slot',
          volunteerReallocation: 'Stage squad supervises new vendor load-in',
          riskTradeOff: `High cost (${formatINR(highCost, true)}).`,
        },
      ],
    };
  }

  if (scenarioId === 'crisis-venue-clash') {
    return {
      scenarioId,
      scenarioTitle: `Venue Timing Clash at ${mainVenue} (${locality}) During ${startTime}–${endTime}`,
      rippleAnalysis: `${mainVenue} (${venueType}) has a 3-hour slot conflict during peak hours (${startTime}–${endTime}) for ${intake.expectedFootfall} attendees${customNoteContext}.`,
      impactedCategories: ['Stage, Sound & AV Rigging'],
      impactedVenueTracks: [mainVenue, secondVenue],
      impactedSquads: ['Stage & PR Squad', 'Technical & Lab Ops'],
      beforeFootfall: intake.expectedFootfall,
      afterFootfall: intake.expectedFootfall,
      ProjectedUnmitigatedOverrunINR: highCost,
      options: [
        {
          id: 'opt-ven-a',
          optionLabel: 'Strategy A · Parallel Track Shift to Secondary Venue (Recommended)',
          strategyTitle: `Route Session to ${secondVenue} with ₹0 Net Budget Delta`,
          summary: `Use ${secondVenue} during the 3-hour window and resume main stage sessions at ${mainVenue} afterward${customNoteContext}.`,
          budgetDeltaINR: 0,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: `Shift 3-hour block to ${secondVenue}`,
          volunteerReallocation: `Deploy 4 ushers to guide attendees between ${mainVenue} & ${secondVenue}`,
          riskTradeOff: 'Zero extra cost; requires clear signage.',
          recommended: true,
        },
        {
          id: 'opt-ven-b',
          optionLabel: 'Strategy B · Add Portable PA & Display in Overflow Zone',
          strategyTitle: `Rent Secondary PA & Screen for ${secondVenue}`,
          summary: `Stream live sessions across both ${mainVenue} and ${secondVenue}.`,
          budgetDeltaINR: moderateCost,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: '1-hour setup before doors open',
          volunteerReallocation: '2 Tech volunteers manage stream relay',
          riskTradeOff: `Draws ${formatINR(moderateCost)} from buffer.`,
        },
        {
          id: 'opt-ven-c',
          optionLabel: 'Strategy C · Book External Annex Hall Nearby',
          strategyTitle: `Rent Short-Notice Hall in ${locality}`,
          summary: `Move the clashing track to an external hall in ${locality}.`,
          budgetDeltaINR: highCost,
          targetBudgetCategory: 'Stage, Sound & AV Rigging',
          scheduleAdjustment: 'Add 30-min transit buffer',
          volunteerReallocation: '6 volunteers manage external venue desk',
          riskTradeOff: `High cost (${formatINR(highCost, true)}).`,
        },
      ],
    };
  }

  // Default: Registration Surge (+25% attendees)
  return {
    scenarioId: 'crisis-reg-surge',
    scenarioTitle: `Registration Surge: +${surgePax} Last-Minute Attendees for ${intake.festName}`,
    rippleAnalysis: `Attendance for "${intake.festName}" at ${mainVenue} (${locality}, ${startTime}–${endTime}) surged from ${intake.expectedFootfall} to ${
      intake.expectedFootfall + surgePax
    }, increasing catering, seating, and Wi-Fi load${customNoteContext}.`,
    impactedCategories: [
      'Catering, Stalls & Midnight Refreshments',
      'Swag, IDs, Certificates & Printing',
    ],
    impactedVenueTracks: [mainVenue, secondVenue],
    impactedSquads: [
      'Logistics & Food Committee',
      'Registration & Hospitality Desk',
    ],
    beforeFootfall: intake.expectedFootfall,
    afterFootfall: intake.expectedFootfall + surgePax,
    ProjectedUnmitigatedOverrunINR: highCost,
    options: [
      {
        id: 'opt-reg-a',
        optionLabel: 'Strategy A · Absorb Within Buffer via Overflow Seating (Recommended)',
        strategyTitle: `Open ${secondVenue} Overflow + Top-Up ${surgePax} Meal Coupons`,
        summary: `Add ${surgePax} meal plates in ${locality} (${formatINR(moderateCost)}) and issue digital QR passes for spot registrants${customNoteContext}.`,
        budgetDeltaINR: moderateCost,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment: `Stagger lunch batch at ${mainVenue} & ${secondVenue}`,
        volunteerReallocation: `Shift 3 volunteers to ${secondVenue} check-in desk`,
        riskTradeOff: 'Keeps total spend safely within contingency buffer.',
        recommended: true,
      },
      {
        id: 'opt-reg-b',
        optionLabel: 'Strategy B · Zero-Budget Cap & Digital-Only Spot Passes',
        strategyTitle: `Cap Main Hall Seating at ${intake.expectedFootfall} + Grant Digital Access`,
        summary: `Admit +${surgePax} spot attendees to standing/overflow sessions with ₹0 net budget increase.`,
        budgetDeltaINR: 0,
        targetBudgetCategory: 'Hackathon Wi-Fi, Power & Lab Setup',
        scheduleAdjustment: `Keep ${startTime}–${endTime} schedule unchanged`,
        volunteerReallocation: '2 Registration leads manage digital QR queue',
        riskTradeOff: 'Zero extra spend; spot registrants do not receive meal kits.',
      },
      {
        id: 'opt-reg-c',
        optionLabel: 'Strategy C · Full Catering & Swag Kit Expansion',
        strategyTitle: `Order +${surgePax} Full Catering Plates & Rush-Print Swag Kits`,
        summary: `Expand catering and rush-print ${surgePax} physical badge kits in ${locality}.`,
        budgetDeltaINR: highCost,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment: 'Extend catering window by 30 mins',
        volunteerReallocation: '4 Logistics volunteers handle extra kits',
        riskTradeOff: `High spend (${formatINR(highCost, true)}) reducing buffer.`,
      },
    ],
  };
}

export function buildCoordinatorOutreachFromTask(
  task: VolunteerTask,
  intake: FestIntakeConfig
): OutreachDraft {
  const locality = intake.eventLocality?.trim() || 'Main Venue';
  const startTime = intake.startTime?.trim() || '09:00 AM';
  const endTime = intake.endTime?.trim() || '06:00 PM';
  const roleLabel = task.department || task.coordinatorRole || 'Operations Squad';
  const firstName =
    task.coordinatorName.trim().split(/\s+/)[0] || task.coordinatorName;

  const statusInstruction =
    task.status === 'Blocked'
      ? `URGENT UNBLOCK REQUIRED: ${
          task.bottleneckReason || 'Immediate escalation needed'
        }. Please resolve and post confirmation in ${
          task.contactChannel || '#ops-war-room'
        }.`
      : task.status === 'Completed'
        ? `Confirmed completed for ${task.venueTrack}. Please keep ${task.assignedVolunteersCount} volunteers on standby for ${startTime}–${endTime}.`
        : `Please coordinate with your ${task.assignedVolunteersCount} volunteers in ${roleLabel} at ${task.venueTrack} (${locality}) and confirm readiness by ${task.deadlineWindow}.`;

  return {
    recipientName: `${task.coordinatorName} (${roleLabel})`,
    recipientRole: `${roleLabel} · ${task.taskCode}`,
    channel: 'WhatsApp Squad Broadcast',
    subjectLine: `[${intake.festName} · ${task.taskCode}] ${task.title} (${task.status})`,
    messageBody: `Hi @${firstName} (${task.coordinatorName} · ${roleLabel}) — Quick check-in for ${intake.festName} (${intake.dates}, ${startTime}–${endTime} at ${locality}) regarding ${task.taskCode}: "${task.title}" at ${task.venueTrack} (Window: ${task.deadlineWindow}). ${statusInstruction}`,
    actionChecklist: [
      `Confirm ${task.assignedVolunteersCount} volunteers in ${roleLabel} at ${task.venueTrack} (${locality})`,
      `Complete ${task.taskCode} milestone by ${task.deadlineWindow}`,
      `Post status update in ${task.contactChannel || '#ops-war-room'}`,
    ],
  };
}

export function buildSampleVolunteerDataFromIntake(
  intake: FestIntakeConfig,
  clarifyingQuestions: ClarifyingQuestion[]
): {
  volunteerTasks: VolunteerTask[];
  coordinatorLogs: CoordinatorLogEntry[];
} {
  const base = buildPlanFromUserIntake(intake, clarifyingQuestions);
  const locality = intake.eventLocality?.trim() || 'Main Campus';
  const mainVenue =
    intake.concurrentVenueTracks[0] || intake.primaryVenues || 'Main Venue Hall';
  const secondVenue = intake.concurrentVenueTracks[1] || mainVenue;
  const startTime = intake.startTime?.trim() || '09:00 AM';

  const coordinatorLogs: CoordinatorLogEntry[] = [
    {
      id: 'log-intake-sample-1',
      timestamp: '10:30 IST',
      author: base.volunteerTasks[0]?.coordinatorName || 'Event Operations Lead',
      squad: base.volunteerTasks[0]?.department || 'Core Executive',
      note: `Venue setup & permissions checklist verified for ${intake.festName} at ${mainVenue} (${locality}) ahead of ${startTime} start.`,
    },
    {
      id: 'log-intake-sample-2',
      timestamp: '11:15 IST',
      author: base.volunteerTasks[1]?.coordinatorName || 'Technical Squad Lead',
      squad: base.volunteerTasks[1]?.department || 'Technical & Lab Ops',
      note: `Tested projector, audio feed, and high-density Wi-Fi routers in ${secondVenue} for ${intake.expectedFootfall} expected attendees.`,
    },
    {
      id: 'log-intake-sample-3',
      timestamp: '11:45 IST',
      author: base.volunteerTasks[2]?.coordinatorName || 'Registration Lead',
      squad:
        base.volunteerTasks[2]?.department || 'Registration & Hospitality Desk',
      note: `Prepared check-in counters and attendee badge kits at ${mainVenue} entrance (${formatINR(
        intake.totalBudgetINR
      )} master budget plan).`,
    },
  ];

  return {
    volunteerTasks: base.volunteerTasks,
    coordinatorLogs,
  };
}

export function buildExecutiveOpsSummaryFromPlan(
  plan: FestMasterPlan
): ExecutiveOpsSummary {
  const { intake } = plan;
  const categoryLabel = getEffectiveFestCategory(intake);
  const locality = intake.eventLocality?.trim() || 'Main Event Locality';
  const venueType = intake.venueType || 'College Campus';
  const startTime = intake.startTime?.trim() || '09:00 AM';
  const endTime = intake.endTime?.trim() || '06:00 PM';
  const mainVenue =
    intake.concurrentVenueTracks[0] || intake.primaryVenues || 'Main Venue Hall';
  const secondVenue = intake.concurrentVenueTracks[1] || mainVenue;
  const venuesList =
    intake.concurrentVenueTracks.length > 0
      ? intake.concurrentVenueTracks.join(', ')
      : mainVenue;
  const customNotes = intake.additionalContextNotes?.trim() || '';

  const fallbackGenerated = buildPlanFromUserIntake(
    intake,
    plan.clarifyingQuestions
  );
  const effectiveTasks =
    plan.volunteerTasks.length > 0
      ? plan.volunteerTasks
      : fallbackGenerated.volunteerTasks;
  const effectiveBudget =
    plan.budget.length > 0 ? plan.budget : fallbackGenerated.budget;
  const budgetMetrics = computeDualTrackBudgetMetrics(
    effectiveBudget,
    intake.totalBudgetINR,
    intake.expectedFootfall
  );

  const completedTasks = effectiveTasks.filter((t) => t.status === 'Completed');
  const inProgressTasks = effectiveTasks.filter(
    (t) => t.status === 'In-Progress'
  );
  const pendingTasks = effectiveTasks.filter((t) => t.status === 'Pending');
  const blockedTasks = effectiveTasks.filter((t) => t.status === 'Blocked');

  const totalCount = Math.max(1, effectiveTasks.length);
  const weightedProgress =
    (completedTasks.length * 1 +
      inProgressTasks.length * 0.65 +
      pendingTasks.length * 0.35) /
    totalCount;
  const readinessPct = Math.min(
    99,
    Math.max(42, Math.round(weightedProgress * 100) - blockedTasks.length * 8)
  );

  const logs = plan.coordinatorLogs;
  const readinessScoreLabel = `${readinessPct}% Execution Readiness · ${
    blockedTasks.length
  } Blocker${blockedTasks.length === 1 ? '' : 's'} · ${
    logs.length
  } Coordinator Log${logs.length === 1 ? '' : 's'} Synced`;

  // Collect unique coordinators & their custom roles from both logs and tasks
  const coordinatorRoster: { name: string; role: string }[] = [];
  const seenNames = new Set<string>();

  for (const log of logs) {
    const cleanName = log.author.trim();
    const key = cleanName.toLowerCase();
    if (cleanName && !seenNames.has(key)) {
      seenNames.add(key);
      coordinatorRoster.push({ name: cleanName, role: log.squad });
    }
  }
  for (const task of effectiveTasks) {
    const cleanName = task.coordinatorName.trim();
    const key = cleanName.toLowerCase();
    if (cleanName && !seenNames.has(key)) {
      seenNames.add(key);
      coordinatorRoster.push({
        name: cleanName,
        role: task.department || task.coordinatorRole,
      });
    }
  }

  const rosterSummary =
    coordinatorRoster.length > 0
      ? coordinatorRoster
          .slice(0, 5)
          .map((c) => `${c.name} (${c.role})`)
          .join(', ')
      : 'Core Event Coordinators';

  const latestLogsSummary =
    logs.length > 0
      ? ` Latest coordinator field logs (${logs.length}): ${logs
          .slice(0, 3)
          .map((l) => `${l.author} [${l.squad}]: "${l.note}"`)
          .join(' | ')}.`
      : '';

  const customNoteSnippet = customNotes
    ? ` Custom Intake Context: "${customNotes}".`
    : '';

  const executiveProgressSnapshot = `Live execution status for "${intake.festName}" (${categoryLabel}) at ${mainVenue} (${locality}, ${venueType}) on ${intake.dates} (${startTime} – ${endTime}) for ${intake.expectedFootfall.toLocaleString('en-IN')} attendees and ${formatINR(intake.totalBudgetINR)} budget: ${completedTasks.length} of ${effectiveTasks.length} squad tasks Completed, ${inProgressTasks.length} In-Progress, ${pendingTasks.length} Pending, and ${blockedTasks.length} Blocked across ${rosterSummary}.${latestLogsSummary}${customNoteSnippet}`;

  // Headline bottleneck derived strictly from current blocked tasks, latest coordinator log, or top active task
  const primaryBlockedTask = blockedTasks[0];
  const latestLog = logs[0];
  const topActiveTask = inProgressTasks[0] || pendingTasks[0] || effectiveTasks[0];

  let headlineBottleneck: string;
  if (primaryBlockedTask) {
    headlineBottleneck = `${primaryBlockedTask.taskCode}: "${primaryBlockedTask.title}" led by ${primaryBlockedTask.coordinatorName} (${primaryBlockedTask.department}) at ${primaryBlockedTask.venueTrack} (${locality}) is currently Blocked${
      primaryBlockedTask.bottleneckReason
        ? ` — ${primaryBlockedTask.bottleneckReason}`
        : ''
    }.${
      latestLog
        ? ` Latest Field Log from ${latestLog.author} (${latestLog.squad}): "${latestLog.note}".`
        : ''
    }`;
  } else if (latestLog) {
    headlineBottleneck = `Active Field Update from ${latestLog.author} (${latestLog.squad}) for ${intake.festName} at ${locality}: "${latestLog.note}" — ${inProgressTasks.length} active and ${pendingTasks.length} pending squad tasks being coordinated across ${venuesList} (${startTime}–${endTime}).`;
  } else if (topActiveTask) {
    headlineBottleneck = `Priority execution focus for ${intake.festName} (${locality}): ${topActiveTask.taskCode} "${topActiveTask.title}" led by ${topActiveTask.coordinatorName} (${topActiveTask.department}) at ${topActiveTask.venueTrack} (Target window: ${topActiveTask.deadlineWindow}).`;
  } else {
    headlineBottleneck = `All ${effectiveTasks.length} squad tasks for ${intake.festName} at ${locality} (${startTime}–${endTime}) are aligned with ${formatINR(budgetMetrics.remainingMasterBufferINR)} remaining budget buffer.`;
  }

  // Critical risks derived strictly from current logs, current tasks, and current intake/budget
  const criticalRisks: string[] = [];

  if (logs.length > 0) {
    logs.slice(0, 2).forEach((l, index) => {
      criticalRisks.push(
        `Coordinator Field Log #${index + 1} (${l.author} · ${l.squad} at ${l.timestamp}): "${l.note}" — requires alignment before ${startTime} at ${locality}.`
      );
    });
  }

  if (blockedTasks.length > 0) {
    blockedTasks.slice(0, 2).forEach((bt) => {
      criticalRisks.push(
        `Blocked Task Alert (${bt.taskCode} · ${bt.coordinatorName} — ${bt.department}): ${bt.title} at ${bt.venueTrack} (${bt.deadlineWindow})${
          bt.bottleneckReason ? ` — ${bt.bottleneckReason}` : ''
        }.`
      );
    });
  } else if (topActiveTask) {
    criticalRisks.push(
      `Venue & Track Readiness (${venuesList} in ${locality}): ${topActiveTask.coordinatorName} (${topActiveTask.department}) is coordinating "${topActiveTask.title}" (${topActiveTask.assignedVolunteersCount} volunteers) for ${intake.expectedFootfall.toLocaleString('en-IN')} attendees.`
    );
  }

  criticalRisks.push(
    `Budget & Vendor SLA Check (${intake.festName}): Effective spend is ${formatINR(
      budgetMetrics.totalEffectiveSpendINR
    )} against ${formatINR(intake.totalBudgetINR)} master cap (${formatINR(
      budgetMetrics.remainingMasterBufferINR
    )} buffer; ${budgetMetrics.confirmedItemsCount}/${budgetMetrics.totalItemsCount} vendor quotes locked in ${locality}).`
  );

  if (customNotes) {
    criticalRisks.push(
      `Custom Intake Requirement (${intake.festName}): "${customNotes}" — factored into ${locality} venue & volunteer deployment.`
    );
  }

  // Immediate Coordinator Action Plan derived directly from current logs and current tasks
  const immediateNextActions: ExecutiveOpsSummary['immediateNextActions'] = [];
  const usedActionKeys = new Set<string>();

  // 1. Include actions directly from the user's Coordinator Logs first so custom log authors & roles always appear!
  for (const log of logs) {
    const key = `${log.author.toLowerCase()}::${log.squad.toLowerCase()}::${log.note.slice(0, 24).toLowerCase()}`;
    if (!usedActionKeys.has(key) && immediateNextActions.length < 5) {
      usedActionKeys.add(key);
      immediateNextActions.push({
        owner: log.author,
        squad: log.squad,
        action: `Follow up on logged field update for ${intake.festName} (${locality}): "${log.note}" and confirm completion across ${venuesList}.`,
        timeframe: `Immediate (${log.timestamp})`,
      });
    }
  }

  // 2. Include actions from current volunteer tasks (using each task's current coordinatorName and custom department/role)
  const prioritizedTasks = [
    ...blockedTasks,
    ...inProgressTasks,
    ...pendingTasks,
    ...completedTasks,
  ];
  for (const task of prioritizedTasks) {
    if (immediateNextActions.length >= 5) break;
    const roleName = task.department || task.coordinatorRole || 'Operations Squad';
    const key = `${task.id}::${task.coordinatorName.toLowerCase()}::${roleName.toLowerCase()}`;
    if (!usedActionKeys.has(key)) {
      usedActionKeys.add(key);
      immediateNextActions.push({
        owner: task.coordinatorName,
        squad: roleName,
        action: `${task.taskCode} — ${task.title} at ${task.venueTrack} (${locality}) with ${task.assignedVolunteersCount} assigned volunteers${
          task.bottleneckReason ? ` (${task.bottleneckReason})` : ''
        }.`,
        timeframe: task.deadlineWindow || `Before ${startTime}`,
      });
    }
  }

  // Ready-to-send broadcasts using the exact coordinator names, custom roles, venues, and intake details
  const handleTags =
    coordinatorRoster.length > 0
      ? coordinatorRoster
          .slice(0, 5)
          .map((c) => `@${c.name.split(/\s+/)[0]}`)
          .join(', ')
      : '@SquadLeads';

  const actionHighlightsForWhatsApp = immediateNextActions
    .slice(0, 3)
    .map(
      (item, idx) =>
        `${idx + 1}) ${item.owner} (${item.squad}): ${item.action} [${item.timeframe}]`
    )
    .join(' ');

  const primaryLead = coordinatorRoster[0] || {
    name: 'Event Lead Coordinator',
    role: 'Core Executive',
  };
  const secondaryLead = coordinatorRoster[1] || primaryLead;

  const broadcasts: ExecutiveOpsSummary['broadcasts'] = [
    {
      audience: 'Volunteer Leads',
      channel: 'WhatsApp Squad Broadcast',
      subjectLine: `[${intake.festName.toUpperCase()} OPS SYNC · ${intake.dates}] Action Plan for ${mainVenue} (${locality})`,
      messageBody: `Squad Leads (${handleTags}): Live operations sync for ${intake.festName} (${categoryLabel}) at ${venuesList} (${locality}, ${startTime}–${endTime}). ${actionHighlightsForWhatsApp}${
        customNotes ? ` Note: ${customNotes}.` : ''
      } Please post status updates as tasks progress.`,
    },
    {
      audience: "University Faculty Advisors / Dean's Office",
      channel: 'Official Dean/Faculty Email',
      subjectLine: `Operations & Readiness Briefing — ${intake.festName} (${intake.dates} · ${locality})`,
      messageBody: `Respected Coordinator / Venue Authority,\n\nStatus update for ${intake.festName} (${categoryLabel}) scheduled on ${intake.dates} (${startTime} – ${endTime}) at ${mainVenue} & ${secondVenue} (${locality}, ${venueType}) for ${intake.expectedFootfall.toLocaleString('en-IN')} attendees:\n• Execution Readiness: ${readinessPct}% (${completedTasks.length}/${effectiveTasks.length} tasks completed, ${inProgressTasks.length} active, ${blockedTasks.length} blocked).\n• Active Coordinator Roster: ${rosterSummary}.\n• Budget Overview: ${formatINR(budgetMetrics.totalEffectiveSpendINR)} allocated within ${formatINR(intake.totalBudgetINR)} master cap (${formatINR(budgetMetrics.remainingMasterBufferINR)} contingency buffer).\n${
        latestLog
          ? `• Latest Field Log (${latestLog.author} · ${latestLog.squad}): "${latestLog.note}".\n`
          : ''
      }\nRegards,\n${primaryLead.name} (${primaryLead.role}) — ${intake.festName} Organizing Team`,
    },
    {
      audience: 'Pending Vendors / Sponsors',
      channel: 'Vendor SLA Escalation',
      subjectLine: `URGENT: Delivery & Setup Confirmation for ${intake.festName} at ${locality} (${intake.dates})`,
      messageBody: `Dear Vendor & Sponsor Partners,\n\nWe are finalizing on-ground setup for ${intake.festName} (${categoryLabel}) at ${mainVenue} (${locality}) on ${intake.dates} (${startTime} – ${endTime}, ${intake.expectedFootfall.toLocaleString('en-IN')} attendees).${
        latestLog
          ? ` Latest operations log note from ${latestLog.author} (${latestLog.squad}): "${latestLog.note}".`
          : ''
      } Please confirm delivery timelines and SLA checkpoints with ${secondaryLead.name} (${secondaryLead.role}) at least 2 hours prior to ${startTime}.`,
    },
  ];

  return {
    generatedAt: `${intake.dates} · Live Sync (${new Date().toLocaleTimeString(
      'en-IN',
      {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }
    )} IST)`,
    readinessScoreLabel,
    executiveProgressSnapshot,
    headlineBottleneck,
    criticalRisks,
    immediateNextActions,
    broadcasts,
  };
}



