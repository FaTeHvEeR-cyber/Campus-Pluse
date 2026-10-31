import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  GitBranch,
  Lock,
  Plus,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Unlock,
} from 'lucide-react';
import type {
  BudgetCategory,
  BudgetLineItem,
  DepartmentName,
  FestMasterPlan,
  ScheduleNode,
  SchedulePhase,
  TaskStatus,
} from '../types';
import {
  computeDualTrackBudgetMetrics,
  computeExecutionReadinessScore,
  computeVolunteerOpsMetrics,
  cycleTaskStatus,
  evaluateScheduleDependencies,
  formatINR,
  getEffectiveFestCategory,
} from '../utils/festEngine';

interface ScheduleBudgetWorkspaceProps {
  plan: FestMasterPlan;
  onToggleScheduleStatus: (scheduleId: string, nextStatus: TaskStatus) => void;
  onAddScheduleNode: (node: ScheduleNode) => void;
  onNavigateToQuoteCategory: (category: BudgetCategory) => void;
  onGenerateFromIntake: () => void;
  onLoadSampleScheduleBudget: () => void;
  onClearScheduleBudget: () => void;
}

const SCHEDULE_PHASES: SchedulePhase[] = [
  'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
  'Phase 2: AV/Network Infrastructure & Vendor Contracts',
  'Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster',
  'Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling',
];

export const ScheduleBudgetWorkspace: React.FC<ScheduleBudgetWorkspaceProps> = ({
  plan,
  onToggleScheduleStatus,
  onAddScheduleNode,
  onNavigateToQuoteCategory,
  onGenerateFromIntake,
  onLoadSampleScheduleBudget,
  onClearScheduleBudget,
}) => {
  const [selectedPhaseFilter, setSelectedPhaseFilter] = useState<string>('ALL');
  const [showAddMilestoneForm, setShowAddMilestoneForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPhase, setNewPhase] = useState<SchedulePhase>(SCHEDULE_PHASES[0]);
  const [newDaySlot, setNewDaySlot] = useState(
    `${plan.intake.dates} · ${plan.intake.startTime ?? '09:00 AM'}`
  );
  const [newVenue] = useState(
    plan.intake.concurrentVenueTracks[0] ?? 'Main Auditorium'
  );
  const [newOwner, setNewOwner] = useState('Event Lead');

  const defaultPrereqId =
    plan.schedule.find((n) => n.tier === 'Critical-Path Approval')?.id ??
    plan.schedule[0]?.id ??
    '';
  const [selectedPrereqId, setSelectedPrereqId] = useState<string>('');

  const budgetMetrics = computeDualTrackBudgetMetrics(
    plan.budget,
    plan.intake.totalBudgetINR,
    plan.intake.expectedFootfall
  );
  const depAnalysis = evaluateScheduleDependencies(plan.schedule);
  const opsMetrics = computeVolunteerOpsMetrics(plan.volunteerTasks);
  const readinessScore = computeExecutionReadinessScore(
    plan.schedule,
    plan.volunteerTasks
  );

  const hasData = plan.schedule.length > 0 || plan.budget.length > 0;

  const visiblePhases =
    selectedPhaseFilter === 'ALL'
      ? SCHEDULE_PHASES
      : SCHEDULE_PHASES.filter((p) => p === selectedPhaseFilter);

  const handleCreateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const isPhase1 =
      newPhase ===
      'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs';
    const nextCode = isPhase1
      ? `CP-0${depAnalysis.criticalPathNodes.length + 1}`
      : `OPS-0${depAnalysis.downstreamNodes.length + 1}`;

    const effectivePrereqId =
      selectedPrereqId !== ''
        ? selectedPrereqId
        : isPhase1
          ? ''
          : defaultPrereqId;
    const dependsOnIds = effectivePrereqId ? [effectivePrereqId] : [];

    const newNode: ScheduleNode = {
      id: `sched-custom-${Date.now()}`,
      code: nextCode,
      title: newTitle.trim(),
      track: plan.intake.tracks[0] ?? 'All Tracks',
      phase: newPhase,
      tier: isPhase1
        ? 'Critical-Path Approval'
        : 'Downstream Vendor/Volunteer',
      daySlot: newDaySlot.trim() || 'Day 1 · TBD',
      venue: newVenue.trim() || 'Main Auditorium',
      ownerCoordinator: newOwner.trim() || 'Core Coordinator',
      department: isPhase1
        ? ('Core Executive' as DepartmentName)
        : ('Technical & Lab Ops' as DepartmentName),
      dependsOnIds,
      status: 'In-Progress',
      blockedIfDelayedWarning:
        'Delays downstream track readiness and volunteer shift handoff.',
    };

    onAddScheduleNode(newNode);
    setNewTitle('');
    setSelectedPrereqId('');
    setShowAddMilestoneForm(false);
  };

  const renderStatusControl = (node: ScheduleNode) => {
    const nextStatus = cycleTaskStatus(node.status);
    const statusStyles: Record<TaskStatus, string> = {
      Completed: 'text-emerald-800 bg-emerald-50 border-emerald-200',
      'In-Progress': 'text-amber-800 bg-amber-50 border-amber-200',
      Pending: 'text-slate-700 bg-slate-100 border-slate-300',
      Blocked: 'text-red-800 bg-red-50 border-red-200',
    };

    return (
      <button
        type="button"
        onClick={() => onToggleScheduleStatus(node.id, nextStatus)}
        aria-label={`Change status for ${node.code} ${node.title} from ${node.status} to ${nextStatus}`}
        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5 ${statusStyles[node.status]}`}
      >
        {node.status === 'Completed' && <CheckCircle2 className="w-3.5 h-3.5" />}
        {(node.status === 'In-Progress' || node.status === 'Pending') && (
          <Clock className="w-3.5 h-3.5" />
        )}
        {node.status === 'Blocked' && <AlertTriangle className="w-3.5 h-3.5" />}
        <span>{node.status}</span>
      </button>
    );
  };

  return (
    <section
      aria-label="Dependency-Gated Schedule and Dual-Track Budget Dashboard"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-indigo-700">
            Module 02 · Dependency-Gated Schedule &amp; Dual-Track Budget
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Dependency-Sequenced Timeline &amp; Dual-Track INR Budget
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Build your schedule and budget from your{' '}
            <strong>Intake Wizard event details</strong> ({plan.intake.festName}{' '}
            · {plan.intake.eventLocality ?? 'Local Venue'} ·{' '}
            {plan.intake.startTime ?? '09:00 AM'} –{' '}
            {plan.intake.endTime ?? '06:00 PM'}), or load sample data to see a
            pre-filled example.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGenerateFromIntake}
            aria-label="Generate Schedule and Budget from Intake Brief"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate from My Intake Brief
          </button>

          <button
            type="button"
            onClick={onLoadSampleScheduleBudget}
            aria-label="Load Sample Schedule and Budget Data"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Load Sample Schedule &amp; Budget
          </button>

          <button
            type="button"
            onClick={() => setShowAddMilestoneForm((prev) => !prev)}
            aria-label="Toggle Add Schedule Milestone Form"
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Phase Milestone
          </button>

          {hasData && (
            <button
              type="button"
              onClick={onClearScheduleBudget}
              aria-label="Clear Schedule and Budget Data"
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* KPI Command Bar (6 High-Contrast Metrics) */}
      <div
        aria-label="KPI Command Bar"
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5"
      >
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Total Budget Cap
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {formatINR(budgetMetrics.masterCapINR)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums whitespace-nowrap">
            {formatINR(budgetMetrics.perAttendeeEffectiveINR)}/attendee
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">
            AI Estimated Spend
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-1">
            {formatINR(budgetMetrics.totalAiEstimateINR)}
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums whitespace-nowrap">
            Unlocked: {formatINR(budgetMetrics.unconfirmedEstimateExposureINR)}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Confirmed Vendor Spend
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1">
            {formatINR(budgetMetrics.totalConfirmedLockedINR)}
          </div>
          <div className="text-xs text-emerald-700 mt-1 font-mono tabular-nums whitespace-nowrap">
            {budgetMetrics.confirmedItemsCount}/{budgetMetrics.totalItemsCount}{' '}
            Locked ({formatINR(budgetMetrics.lockedSavingsVsEstimateINR, true)})
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Remaining Buffer
          </span>
          <div
            className={`text-xl font-bold font-mono tabular-nums mt-1 ${
              budgetMetrics.remainingMasterBufferINR >= 0
                ? 'text-slate-900'
                : 'text-red-700'
            }`}
          >
            {formatINR(budgetMetrics.remainingMasterBufferINR)}
          </div>
          <div
            className={`text-xs font-semibold mt-1 whitespace-nowrap ${
              budgetMetrics.budgetHealthStatus === 'Nominal Buffer'
                ? 'text-emerald-700'
                : budgetMetrics.budgetHealthStatus === 'Tight Allocation'
                  ? 'text-amber-700'
                  : 'text-red-700'
            }`}
          >
            {budgetMetrics.budgetHealthStatus}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Active Volunteers
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1">
            {opsMetrics.totalVolunteersMobilized} Crew
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums whitespace-nowrap">
            {plan.intake.activeVolunteerCoordinators} Lead Coordinators
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <span className="text-xs font-medium text-slate-500 block">
            Execution Readiness
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-indigo-700 mt-1">
            {readinessScore}%
          </div>
          <div className="text-xs text-slate-500 mt-1 font-mono tabular-nums whitespace-nowrap">
            NOCs: {depAnalysis.criticalPathCompletionPercent}% Cleared
          </div>
        </div>
      </div>

      {/* Optional Add Milestone Inline Drawer */}
      {showAddMilestoneForm && (
        <form
          onSubmit={handleCreateMilestone}
          aria-label="Add New Schedule Milestone"
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Add Milestone to 4-Phase Dependency Timeline
            </h3>
            <button
              type="button"
              onClick={() => setShowAddMilestoneForm(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
            <input
              type="text"
              required
              placeholder="Milestone title (e.g., Drone Airspace NOC)"
              aria-label="New milestone title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="lg:col-span-2 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <select
              aria-label="Schedule phase"
              value={newPhase}
              onChange={(e) => setNewPhase(e.target.value as SchedulePhase)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              {SCHEDULE_PHASES.map((phase) => (
                <option key={phase} value={phase}>
                  {phase.split(':')[0]}
                </option>
              ))}
            </select>
            <select
              aria-label="Prerequisite milestone dependency"
              value={
                selectedPrereqId ||
                (newPhase ===
                'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs'
                  ? ''
                  : defaultPrereqId)
              }
              onChange={(e) => setSelectedPrereqId(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            >
              <option value="">Prereq: None (Root)</option>
              {plan.schedule.map((node) => (
                <option key={node.id} value={node.id}>
                  Prereq: {node.code} · {node.title.slice(0, 24)}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Day & Slot (e.g., Day 1 · 16:00 IST)"
              aria-label="New milestone time slot"
              value={newDaySlot}
              onChange={(e) => setNewDaySlot(e.target.value)}
              className="px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coordinator owner"
                aria-label="Coordinator owner"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {!hasData ? (
        <article
          aria-label="Schedule and Budget Empty State"
          className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 max-w-3xl mx-auto"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900">
              No Schedule or Budget Loaded Yet
            </h2>
            <p className="text-xs text-slate-600 max-w-xl mx-auto leading-relaxed">
              To keep this workspace simple and uncluttered for first-time
              organizers, no sample schedule or budget is pre-filled. Choose how
              you want to start:
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 max-w-xl mx-auto text-left space-y-1">
            <div className="font-semibold text-slate-900">
              Current Intake Brief Summary:
            </div>
            <div>
              <strong>Event:</strong> {plan.intake.festName} (
              {getEffectiveFestCategory(plan.intake)})
            </div>
            <div>
              <strong>Location &amp; Setting:</strong>{' '}
              {plan.intake.eventLocality ?? 'Local Venue'} ·{' '}
              {plan.intake.venueType ?? 'College Campus'}
            </div>
            <div>
              <strong>Schedule &amp; Scale:</strong> {plan.intake.dates} (
              {plan.intake.startTime ?? '09:00 AM'} –{' '}
              {plan.intake.endTime ?? '06:00 PM'}) ·{' '}
              {plan.intake.expectedFootfall} Attendees · Budget{' '}
              {formatINR(plan.intake.totalBudgetINR)}
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={onGenerateFromIntake}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Generate Schedule &amp; Budget from My Intake Brief
            </button>
            <button
              type="button"
              onClick={onLoadSampleScheduleBudget}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Load Sample Schedule &amp; Budget (Preview Example)
            </button>
          </div>
        </article>
      ) : (
        <>
          {/* PART 1: Dual-Track Budget Table (with Priority & Per-Attendee Cost) */}
          <article
            aria-label="Dual-Track INR Budget Table"
            className="bg-white border border-slate-200 rounded-xl overflow-hidden"
          >
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  01. Dual-Track Budget Table (AI Estimates vs. Confirmed Quotes in ₹)
                </h2>
                <p className="text-xs text-slate-500">
                  Includes category priority classification, per-attendee cost
                  breakdown ({plan.intake.expectedFootfall} participants), and
                  direct quote locking
                </p>
              </div>
              <div className="text-xs font-mono tabular-nums text-slate-600">
                Effective Spend:{' '}
                <strong className="text-slate-900">
                  {formatINR(budgetMetrics.totalEffectiveSpendINR)}
                </strong>{' '}
                · Sponsor Backed:{' '}
                <strong className="text-emerald-700">
                  {formatINR(budgetMetrics.totalSponsorBackedINR)}
                </strong>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <caption className="sr-only">Budget estimates and confirmed vendor quotes in Indian rupees</caption>
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                    <th scope="col" className="py-3 px-4">Budget Category &amp; Scope</th>
                    <th scope="col" className="py-3 px-4">Priority</th>
                    <th scope="col" className="py-3 px-4">Quote Status</th>
                    <th scope="col" className="py-3 px-4 text-right">AI Estimate (₹)</th>
                    <th scope="col" className="py-3 px-4 text-right">Confirmed Quote (₹)</th>
                    <th scope="col" className="py-3 px-4 text-right">Per-Attendee</th>
                    <th scope="col" className="py-3 px-4 text-right">Vendor Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-xs">
                  {plan.budget.map((item: BudgetLineItem) => {
                    const isConfirmed =
                      item.quoteStatus === 'Confirmed Quote' &&
                      item.confirmedQuoteINR !== null;
                    const effectiveCost =
                      isConfirmed && item.confirmedQuoteINR !== null
                        ? item.confirmedQuoteINR
                        : item.aiEstimateINR;
                    const perAttendee = Math.round(
                      effectiveCost / Math.max(1, plan.intake.expectedFootfall)
                    );
                    const isOverrun =
                      isConfirmed &&
                      (item.confirmedQuoteINR ?? 0) > item.aiEstimateINR;

                    return (
                      <tr
                        key={item.id}
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="font-bold text-slate-900">
                            {item.category}
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            {item.itemTitle}
                          </div>
                          <div className="text-slate-500 mt-1">
                            {item.track}
                            {item.lockedVendorName
                              ? ` · Locked: ${item.lockedVendorName}`
                              : ''}
                          </div>
                          {item.notes && (
                            <div className="text-indigo-700 mt-1 leading-snug">
                              {item.notes}
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700">
                          {item.priority}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isOverrun ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-red-700">
                              <AlertTriangle className="w-3.5 h-3.5" />
                              Overrun Risk
                            </span>
                          ) : isConfirmed ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                              <Lock className="w-3.5 h-3.5" />
                              Confirmed Quote
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
                              <Unlock className="w-3.5 h-3.5" />
                              AI Estimate
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                          {formatINR(item.aiEstimateINR)}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums font-bold whitespace-nowrap">
                          {isConfirmed && item.confirmedQuoteINR !== null ? (
                            <span className="text-slate-900">
                              {formatINR(item.confirmedQuoteINR)}
                            </span>
                          ) : (
                            <span className="text-amber-700 font-normal">
                              Pending Lock
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-700 whitespace-nowrap">
                          {formatINR(perAttendee)}/pax
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onNavigateToQuoteCategory(item.category)}
                            aria-label={`Compare vendor quotes for ${item.category}`}
                            className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>
                              {isConfirmed ? 'Review Quote' : 'Compare & Lock'}
                            </span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </article>

          {/* PART 2: 4-Phase Dependency-Sequenced Multi-Track Timeline */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  02. 4-Phase Dependency-Sequenced Multi-Track Timeline
                </h2>
                <p className="text-xs text-slate-500">
                  Every task displays prerequisite dependencies, assigned squad,
                  venue track, and Blocked-If-Delayed impact
                </p>
              </div>

              {/* Phase Filter Buttons */}
              <div
                role="group"
                aria-label="Filter timeline by execution phase"
                className="flex items-center gap-1.5 flex-wrap"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 mr-1" />
                <button
                  type="button"
                  onClick={() => setSelectedPhaseFilter('ALL')}
                  aria-pressed={selectedPhaseFilter === 'ALL'}
                  className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedPhaseFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  All 4 Phases
                </button>
                {SCHEDULE_PHASES.map((phase, idx) => (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setSelectedPhaseFilter(phase)}
                    aria-pressed={selectedPhaseFilter === phase}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedPhaseFilter === phase
                        ? 'bg-slate-900 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Phase {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {visiblePhases.map((phaseTitle) => {
                const phaseNodes = plan.schedule.filter(
                  (n) => n.phase === phaseTitle
                );
                return (
                  <article
                    key={phaseTitle}
                    aria-label={phaseTitle}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">
                          {phaseTitle}
                        </h3>
                      </div>
                      <span className="text-xs font-mono text-slate-500 tabular-nums shrink-0 ml-2">
                        {phaseNodes.length} Tasks
                      </span>
                    </div>

                    <div className="space-y-3">
                      {phaseNodes.map((node) => {
                        const unresolvedParents =
                          depAnalysis.unresolvedDependenciesByNodeId[node.id] ?? [];
                        return (
                          <div
                            key={node.id}
                            className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/40 space-y-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="font-mono font-bold text-indigo-700">
                                  {node.code}
                                </span>
                                <span>·</span>
                                <span className="font-mono">{node.daySlot}</span>
                                <span>·</span>
                                <span className="font-medium text-slate-700">
                                  {node.venue}
                                </span>
                              </div>
                              {renderStatusControl(node)}
                            </div>

                            <p className="text-sm font-semibold text-slate-900 leading-snug">
                              {node.title}
                            </p>

                            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                              <div>
                                <span className="font-medium text-slate-800">
                                  Squad: {node.department}
                                </span>
                                <span className="mx-1.5">·</span>
                                <span>Lead: {node.ownerCoordinator}</span>
                              </div>

                              <div className="flex items-center gap-1 font-mono text-slate-600">
                                <GitBranch className="w-3.5 h-3.5 text-slate-400" />
                                <span>
                                  Depends On:{' '}
                                  {node.dependsOnIds.length === 0
                                    ? 'Root Gate'
                                    : node.dependsOnIds
                                        .map(
                                          (id) =>
                                            plan.schedule.find((s) => s.id === id)
                                              ?.code ?? id
                                        )
                                        .join(', ')}
                                </span>
                              </div>
                            </div>

                            {/* Blocked If Delayed Warning */}
                            <div className="text-xs text-slate-600 pt-1 border-t border-slate-200/70">
                              <strong className="text-slate-800">
                                Blocked If Delayed:
                              </strong>{' '}
                              {node.blockedIfDelayedWarning}
                            </div>

                            {unresolvedParents.length > 0 && (
                              <div className="text-xs text-red-800 bg-red-50 border border-red-200 rounded px-2.5 py-1.5 flex items-center gap-1.5">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                  Waiting on Prerequisite:{' '}
                                  <strong className="font-mono">
                                    {unresolvedParents
                                      .map((p) => `${p.code} (${p.status})`)
                                      .join(', ')}
                                  </strong>
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
