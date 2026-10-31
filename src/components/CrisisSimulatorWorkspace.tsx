import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Database,
  Flame,
  History,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  Wallet,
  Zap,
} from 'lucide-react';
import type {
  CrisisScenario,
  CrisisSimulationResult,
  CrisisTradeOffOption,
  FestMasterPlan,
} from '../types';
import { PRESET_CRISIS_SCENARIOS } from '../data/seedFestData';
import {
  computeDualTrackBudgetMetrics,
  computeTradeOffBudgetPreview,
  formatINR,
  getEffectiveFestCategory,
} from '../utils/festEngine';

interface CrisisSimulatorWorkspaceProps {
  plan: FestMasterPlan;
  activeScenarioId: string;
  simulationResult: CrisisSimulationResult | null;
  isSimulating: boolean;
  onSelectScenario: (scenarioId: string) => void;
  onSimulateCustomShock: (customShockDescription: string) => void;
  onApplyTradeOff: (scenarioTitle: string, option: CrisisTradeOffOption) => void;
  onPredictFromIntake: () => void;
  onLoadSampleCrisis: () => void;
  onClearCrisis: () => void;
}

function getDeltaBadgeClasses(tone: 'green' | 'amber' | 'red'): string {
  if (tone === 'green') {
    return 'bg-emerald-50 text-emerald-800 border-emerald-300';
  }
  if (tone === 'amber') {
    return 'bg-amber-50 text-amber-800 border-amber-300';
  }
  return 'bg-red-50 text-red-800 border-red-300';
}

export const CrisisSimulatorWorkspace: React.FC<
  CrisisSimulatorWorkspaceProps
> = ({
  plan,
  activeScenarioId,
  simulationResult,
  isSimulating,
  onSelectScenario,
  onSimulateCustomShock,
  onApplyTradeOff,
  onPredictFromIntake,
  onLoadSampleCrisis,
  onClearCrisis,
}) => {
  const [customShockInput, setCustomShockInput] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    () =>
      simulationResult?.options.find((o) => o.recommended)?.id ??
      simulationResult?.options[0]?.id ??
      ''
  );
  const [recentlyAppliedOptionId, setRecentlyAppliedOptionId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (!simulationResult) {
      setSelectedOptionId('');
      return;
    }
    const defaultOpt =
      simulationResult.options.find((o) => o.recommended) ??
      simulationResult.options[0];
    if (defaultOpt) {
      setSelectedOptionId(defaultOpt.id);
    }
  }, [simulationResult]);

  const budgetMetrics = computeDualTrackBudgetMetrics(
    plan.budget,
    plan.intake.totalBudgetINR,
    plan.intake.expectedFootfall
  );

  const selectedOption = simulationResult
    ? (simulationResult.options.find((o) => o.id === selectedOptionId) ??
      simulationResult.options.find((o) => o.recommended) ??
      simulationResult.options[0])
    : null;

  const selectedPreview =
    simulationResult && selectedOption
      ? computeTradeOffBudgetPreview(
          plan.budget,
          plan.intake.totalBudgetINR,
          plan.intake.expectedFootfall,
          selectedOption
        )
      : null;

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customShockInput.trim()) return;
    onSimulateCustomShock(customShockInput.trim());
  };

  const handleApplyOption = (option: CrisisTradeOffOption) => {
    if (!simulationResult) return;
    setSelectedOptionId(option.id);
    onApplyTradeOff(simulationResult.scenarioTitle, option);
    setRecentlyAppliedOptionId(option.id);
    setTimeout(() => setRecentlyAppliedOptionId(null), 3500);
  };

  return (
    <section
      aria-label="What-If Ripple-Effect and Fest Crisis Simulator"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-indigo-700">
            Module 04 · &ldquo;What-If&rdquo; Ripple-Effect &amp; Fest Crisis
            Simulator
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Dynamic Ripple-Effect &amp; Fest Crisis Rebalancer
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Predict mid-stream disruptions tailored to{' '}
            <strong>{plan.intake.festName}</strong> (
            {getEffectiveFestCategory(plan.intake)} ·{' '}
            {plan.intake.eventLocality || 'Campus'} ·{' '}
            {plan.intake.startTime || '09:00 AM'}–
            {plan.intake.endTime || '09:00 PM'}) or load sample crisis data to
            inspect green/amber/red rupee (₹) delta badges before applying to
            your plan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onPredictFromIntake}
            aria-label="Predict Crisis from My Intake Brief"
            className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Predict Crisis from My Intake Brief
          </button>

          <button
            type="button"
            onClick={onLoadSampleCrisis}
            aria-label="Load Sample Crisis Simulation"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="w-3.5 h-3.5 text-indigo-600" />
            Load Sample Crisis Simulation
          </button>

          {simulationResult && (
            <button
              type="button"
              onClick={onClearCrisis}
              aria-label="Clear Crisis Simulation"
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Live Master Budget Context Strip */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-2 text-slate-600">
          <span className="font-semibold text-slate-900">
            Intake Context:
          </span>
          <span>{plan.intake.festName}</span>
          <span>·</span>
          <span>
            {plan.intake.venueType || 'College Campus'} (
            {plan.intake.eventLocality || 'Campus'})
          </span>
          <span>·</span>
          <span>
            {plan.intake.startTime || '09:00 AM'} –{' '}
            {plan.intake.endTime || '09:00 PM'}
          </span>
        </div>

        <div className="flex items-center gap-4 font-mono tabular-nums">
          <span>
            Before Spend:{' '}
            <strong className="text-slate-900">
              {formatINR(budgetMetrics.totalEffectiveSpendINR)}
            </strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Active Buffer:{' '}
            <strong
              className={
                budgetMetrics.remainingMasterBufferINR >= 0
                  ? 'text-emerald-700'
                  : 'text-red-700'
              }
            >
              {formatINR(budgetMetrics.remainingMasterBufferINR)}
            </strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Shocks Applied:{' '}
            <strong className="text-indigo-700">
              {plan.appliedShocks.length}
            </strong>
          </span>
        </div>
      </div>

      {/* Step 1: 4 One-Click Campus Crisis Presets & Custom Disruption Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            01. Select a Crisis Scenario to Simulate for {plan.intake.festName}{' '}
            or Enter Your Own Disruption
          </h2>
          <span className="text-xs text-slate-500">
            Non-destructive simulation · Existing plan state preserved
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_CRISIS_SCENARIOS.map((scenario: CrisisScenario) => {
            const isSelected =
              Boolean(simulationResult) && activeScenarioId === scenario.id;
            return (
              <button
                key={scenario.id}
                type="button"
                onClick={() => onSelectScenario(scenario.id)}
                aria-label={`Simulate crisis scenario: ${scenario.title}`}
                aria-pressed={isSelected}
                className={`text-left p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-900 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span
                      className={`font-semibold ${
                        isSelected ? 'text-amber-300' : 'text-indigo-700'
                      }`}
                    >
                      {scenario.category}
                    </span>
                    <span
                      className={`font-mono ${
                        isSelected ? 'text-slate-300' : 'text-red-700'
                      }`}
                    >
                      {scenario.severityLabel}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold leading-snug">
                    {scenario.title}
                  </h3>

                  <p
                    className={`text-xs leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    {scenario.impactSummary}
                  </p>
                </div>

                <div
                  className={`text-xs font-semibold flex items-center gap-1 pt-2 border-t ${
                    isSelected
                      ? 'border-slate-800 text-white'
                      : 'border-slate-100 text-indigo-700'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>
                    {isSelected
                      ? 'Loaded in Before/After Delta'
                      : 'Simulate This Shock'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Custom Shock Input Bar */}
        <form
          onSubmit={handleCustomSubmit}
          aria-label="Simulate Custom Festival Crisis Shock"
          className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 shrink-0">
            <Flame className="w-4 h-4 text-amber-600" />
            <label htmlFor="custom-shock-input">Custom Crisis Disruption:</label>
          </div>
          <input
            id="custom-shock-input"
            type="text"
            placeholder={`e.g., Unseasonal rain at ${plan.intake.eventLocality || 'venue'} 2 hours before ${plan.intake.startTime || '09:00 AM'} opening...`}
            value={customShockInput}
            onChange={(e) => setCustomShockInput(e.target.value)}
            className="flex-1 px-3.5 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
          />
          <button
            type="submit"
            disabled={isSimulating || !customShockInput.trim()}
            aria-label="Simulate Ripple Effect and Rebalance"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isSimulating ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Simulating Ripple...
              </>
            ) : (
              <>
                <span>Simulate Ripple Effect &amp; Rebalance</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Step 2: Clean Empty State when no simulation is active vs. Full Before/After Delta Comparison */}
      {!simulationResult || !selectedOption || !selectedPreview ? (
        <div
          aria-label="Empty Crisis Simulation Prompt"
          className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center space-y-4"
        >
          <div className="max-w-xl mx-auto space-y-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-semibold">
              No Crisis Pre-Loaded Yet · Decluttered View
            </span>
            <h2 className="text-base font-bold text-slate-900">
              Simulate a Disruption from Your Intake Brief or Preview Sample
              Data
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              Click any of the 4 crisis scenarios above, type your own custom
              disruption, or use the buttons below to either{' '}
              <strong>
                predict a crisis tailored to {plan.intake.festName}
              </strong>{' '}
              or <strong>load a pre-filled sample simulation</strong> with
              green/amber/red rupee (₹) delta badges.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={onPredictFromIntake}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Predict Crisis from My Intake Brief
            </button>
            <button
              type="button"
              onClick={onLoadSampleCrisis}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Database className="w-4 h-4 text-indigo-600" />
              Load Sample Crisis Simulation (See Example)
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
          <div className="pb-4 border-b border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                02. Before vs. After Delta View &amp; Pre-Commit Rupee (₹) Delta
                Comparison
              </span>
              <span className="text-xs font-mono text-slate-600 flex items-center gap-2">
                <span>Unmitigated Shock Exposure:</span>
                <span className="px-2 py-0.5 rounded border bg-red-50 text-red-800 border-red-300 font-bold tabular-nums">
                  {formatINR(
                    simulationResult.ProjectedUnmitigatedOverrunINR,
                    true
                  )}
                </span>
              </span>
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              {simulationResult.scenarioTitle}
            </h2>

            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-lg">
              {simulationResult.rippleAnalysis}
            </p>

            {/* Pre-Commit Comparison Box for Selected Trade-Off Option with Green/Amber/Red Rupee Delta Badges */}
            <div
              aria-label="Current Budget Allocation vs Selected Trade-Off Comparison"
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs">
                  <span className="font-bold text-slate-900">
                    Selected Trade-Off Preview:{' '}
                  </span>
                  <span className="font-semibold text-indigo-700">
                    {selectedOption.optionLabel} ({selectedOption.strategyTitle})
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                  <span className="text-slate-500">Selected Rupee Delta:</span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md border font-bold ${getDeltaBadgeClasses(
                      selectedPreview.deltaTone
                    )}`}
                  >
                    {selectedPreview.deltaBadgeText}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                {/* Card A: Target Category Allocation Comparison */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 block truncate">
                    {selectedPreview.targetCategory}
                  </span>
                  <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                    {formatINR(selectedPreview.currentCategoryAllocationINR)} →{' '}
                    {formatINR(selectedPreview.projectedCategoryAllocationINR)}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-[11px] font-mono font-semibold tabular-nums ${getDeltaBadgeClasses(
                      selectedPreview.deltaTone
                    )}`}
                  >
                    {selectedPreview.budgetDeltaINR === 0
                      ? '₹0 Category Delta'
                      : `${formatINR(selectedPreview.budgetDeltaINR, true)} vs Current`}
                  </span>
                </div>

                {/* Card B: Total Master Spend Comparison */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">
                    Current vs. Selected Total Spend
                  </span>
                  <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                    {formatINR(selectedPreview.currentTotalSpendINR)} →{' '}
                    {formatINR(selectedPreview.projectedTotalSpendINR)}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-[11px] font-mono font-semibold tabular-nums ${getDeltaBadgeClasses(
                      selectedPreview.deltaTone
                    )}`}
                  >
                    {selectedPreview.deltaBadgeText}
                  </span>
                </div>

                {/* Card C: Remaining Buffer Comparison */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">
                    Current vs. Post-Trade-Off Buffer
                  </span>
                  <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                    {formatINR(selectedPreview.currentBufferINR)} →{' '}
                    {formatINR(selectedPreview.projectedBufferINR)}
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded border text-[11px] font-mono font-semibold tabular-nums ${
                      selectedPreview.projectedBufferINR < 0
                        ? getDeltaBadgeClasses('red')
                        : selectedPreview.budgetDeltaINR > 0
                          ? getDeltaBadgeClasses('amber')
                          : getDeltaBadgeClasses('green')
                    }`}
                  >
                    {selectedPreview.projectedBufferINR >= 0
                      ? `${formatINR(selectedPreview.projectedBufferINR)} Buffer Safe`
                      : `${formatINR(selectedPreview.projectedBufferINR)} Deficit`}
                  </span>
                </div>

                {/* Card D: Footfall & Track Impact */}
                <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                  <span className="text-slate-500 block">
                    Before vs. After Footfall &amp; Squads
                  </span>
                  <div className="font-mono tabular-nums text-sm font-bold text-slate-900">
                    {simulationResult.beforeFootfall} →{' '}
                    {simulationResult.afterFootfall} Pax
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded border bg-slate-100 text-slate-700 border-slate-300 text-[11px] font-mono font-semibold">
                    {simulationResult.impactedVenueTracks.length} Venues ·{' '}
                    {simulationResult.impactedSquads.length} Squads
                  </span>
                </div>
              </div>
            </div>

            {/* Impacted Categories, Venues, Squads Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-600 pt-1">
              <div>
                <strong className="text-slate-900">
                  Impacted Budget Categories:
                </strong>{' '}
                {simulationResult.impactedCategories.join(' · ')}
              </div>
              <div>
                <strong className="text-slate-900">
                  Impacted Venue Tracks:
                </strong>{' '}
                {simulationResult.impactedVenueTracks.join(' · ')}
              </div>
              <div>
                <strong className="text-slate-900">
                  Impacted Volunteer Squads:
                </strong>{' '}
                {simulationResult.impactedSquads.join(' · ')}
              </div>
            </div>
          </div>

          {/* 3 Concrete AI Trade-Off Strategies with Green/Amber/Red Rupee Delta Badges */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {simulationResult.options.map((option) => {
              const isApplied = recentlyAppliedOptionId === option.id;
              const isPreviewSelected = selectedOption.id === option.id;
              const optionPreview = computeTradeOffBudgetPreview(
                plan.budget,
                plan.intake.totalBudgetINR,
                plan.intake.expectedFootfall,
                option
              );

              return (
                <article
                  key={option.id}
                  aria-label={option.optionLabel}
                  className={`rounded-xl border p-5 flex flex-col justify-between gap-5 transition-colors cursor-pointer ${
                    isPreviewSelected
                      ? 'border-indigo-600 bg-indigo-50/15 ring-1 ring-indigo-600'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-indigo-700">
                        {option.optionLabel}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md border text-xs font-mono font-bold tabular-nums shrink-0 ${getDeltaBadgeClasses(
                          optionPreview.deltaTone
                        )}`}
                      >
                        {optionPreview.deltaBadgeText}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {option.strategyTitle}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {option.summary}
                      </p>
                    </div>

                    {/* 3 Concrete Vectors: Budget (with Current vs Option Allocation & Rupee Delta Badge), Schedule, Volunteers */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="font-semibold text-slate-800 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1 truncate">
                            <Wallet className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span className="truncate">
                              {option.targetBudgetCategory}
                            </span>
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded border font-mono text-[11px] font-bold tabular-nums shrink-0 ${getDeltaBadgeClasses(
                              optionPreview.deltaTone
                            )}`}
                          >
                            {option.budgetDeltaINR === 0
                              ? '₹0 Net Delta'
                              : formatINR(option.budgetDeltaINR, true)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-slate-600">
                          <span>
                            Current:{' '}
                            <strong className="text-slate-900">
                              {formatINR(
                                optionPreview.currentCategoryAllocationINR
                              )}
                            </strong>
                          </span>
                          <span>→</span>
                          <span>
                            Option:{' '}
                            <strong className="text-slate-900">
                              {formatINR(
                                optionPreview.projectedCategoryAllocationINR
                              )}
                            </strong>
                          </span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 space-y-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Schedule Rebalance</span>
                        </div>
                        <p className="text-slate-600">
                          {option.scheduleAdjustment}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-50 space-y-1">
                        <div className="font-semibold text-slate-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          <span>Volunteer Reallocation</span>
                        </div>
                        <p className="text-slate-600">
                          {option.volunteerReallocation}
                        </p>
                      </div>

                      <div className="text-slate-500 pt-1">
                        <strong className="text-slate-700">
                          Operational Trade-Off:
                        </strong>{' '}
                        {option.riskTradeOff}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button type="button" onClick={() => setSelectedOptionId(option.id)}
                      aria-pressed={isPreviewSelected}
                      className="w-full rounded-lg border border-indigo-600 p-2 text-xs font-semibold text-indigo-700">
                      Preview {option.strategyTitle}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleApplyOption(option);
                      }}
                      aria-label={`Apply Selected Trade-Off to Master Plan: ${option.optionLabel}`}
                      className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                        isApplied
                          ? 'bg-emerald-700 text-white'
                          : isPreviewSelected
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isApplied ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Applied to Live Master Plan
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Apply Selected Trade-Off to Master Plan
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Applied Crisis Mitigation Audit Log */}
      <article
        aria-label="Applied Crisis Mitigation Audit Trail"
        className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" />
            <h2 className="text-sm font-bold text-slate-900">
              Applied Crisis Re-Plan Ledger ({plan.appliedShocks.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Updates live INR budget, schedule nodes &amp; squad tasks in-place
          </span>
        </div>

        {plan.appliedShocks.length === 0 ? (
          <p className="text-xs text-slate-500 py-2">
            No crisis trade-offs committed yet. Simulate a crisis above and
            click{' '}
            <strong>&ldquo;Apply Selected Trade-Off to Master Plan&rdquo;</strong>{' '}
            to update your schedule and budget.
          </p>
        ) : (
          <div className="space-y-2.5">
            {plan.appliedShocks.map((shock) => (
              <div
                key={shock.id}
                className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
              >
                <div className="space-y-1">
                  <div className="font-bold text-slate-900">
                    {shock.chosenStrategy}
                  </div>
                  <div className="text-slate-600">
                    Trigger: {shock.scenarioTitle} · {shock.scheduleNote}
                  </div>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <span
                    className={`font-bold ${
                      shock.budgetDeltaINR <= 0
                        ? 'text-emerald-700'
                        : 'text-amber-800'
                    }`}
                  >
                    {formatINR(shock.budgetDeltaINR, true)}
                  </span>
                  <div className="text-slate-600">{shock.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </article>
    </section>
  );
};
