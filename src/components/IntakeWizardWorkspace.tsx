import React, { useState } from 'react';
import {
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  HelpCircle,
  MapPin,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import type {
  ClarifyingQuestion,
  FestCategoryType,
  FestIntakeConfig,
  PriorityWeights,
  VenueType,
} from '../types';
import { PRESET_DEMO_SCENARIOS } from '../data/seedFestData';
import {
  formatINR,
  formatNumericInputValue,
  getEffectiveFestCategory,
  sanitizeNumericInput,
} from '../utils/festEngine';

interface IntakeWizardWorkspaceProps {
  intake: FestIntakeConfig;
  clarifyingQuestions: ClarifyingQuestion[];
  isGeneratingQuestions: boolean;
  isSynthesizingPlan: boolean;
  onUpdateIntake: (next: FestIntakeConfig) => void;
  onLoadPresetScenario: (presetId: 'technoverse' | 'synergy' | 'devdays') => void;
  onResetToCleanBrief: () => void;
  onUpdateQuestionAnswer: (id: string, answer: string) => void;
  onRegenerateQuestions: () => Promise<void> | void;
  onSynthesizeMasterPlan: () => void;
}

const FEST_CATEGORIES: FestCategoryType[] = [
  'Inter-College Tech Fest & Hackathon',
  'Multi-Department Annual Cultural & Tech Symposium',
  'Campus Developer Summit',
  'Community Innovation Fair',
  'Custom Category',
];

const VENUE_TYPES: VenueType[] = [
  'College Campus',
  'External Convention Center / Hotel',
  'Community Ground / Open-Air Venue',
  'Hybrid (Campus + External)',
];

const PRIORITY_LABELS: { key: keyof PriorityWeights; label: string }[] = [
  { key: 'techInfraWifi', label: 'Technical Infrastructure & Wi-Fi' },
  { key: 'stageAvProduction', label: 'Stage & AV Production' },
  { key: 'foodNightRefreshments', label: 'Food & Night Refreshments' },
  { key: 'prizesSwag', label: 'Prizes & Swag' },
  { key: 'guestJudgeHospitality', label: 'Guest / Judge Hospitality' },
];

const QUICK_CUSTOM_CONTEXT_SNIPPETS: string[] = [
  '100% vegetarian & Jain catering counters required',
  'Weatherproof backup tent & 65kVA silent DG set required',
  'Reserve ₹50,000 strictly for cash prizes (non-negotiable)',
  'VIP guest parking & security protocol at main gate',
];

export const IntakeWizardWorkspace: React.FC<IntakeWizardWorkspaceProps> = ({
  intake,
  clarifyingQuestions,
  isGeneratingQuestions,
  isSynthesizingPlan,
  onUpdateIntake,
  onLoadPresetScenario,
  onResetToCleanBrief,
  onUpdateQuestionAnswer,
  onRegenerateQuestions,
  onSynthesizeMasterPlan,
}) => {
  const [newVenueInput, setNewVenueInput] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);
  const [presetFeedbackBanner, setPresetFeedbackBanner] = useState<string | null>(
    null
  );
  const [questionsRefreshedBanner, setQuestionsRefreshedBanner] = useState<
    string | null
  >(null);

  const handleAddVenueTrack = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newVenueInput.trim();
    if (!trimmed) return;
    if (intake.concurrentVenueTracks.includes(trimmed)) {
      setNewVenueInput('');
      return;
    }
    const updatedVenues = [...intake.concurrentVenueTracks, trimmed];
    onUpdateIntake({
      ...intake,
      concurrentVenueTracks: updatedVenues,
      primaryVenues: updatedVenues.join(', '),
    });
    setNewVenueInput('');
  };

  const handleRemoveVenueTrack = (venueToRemove: string) => {
    if (intake.concurrentVenueTracks.length <= 1) return;
    const updatedVenues = intake.concurrentVenueTracks.filter(
      (v) => v !== venueToRemove
    );
    onUpdateIntake({
      ...intake,
      concurrentVenueTracks: updatedVenues,
      primaryVenues: updatedVenues.join(', '),
    });
  };

  const handleWeightChange = (key: keyof PriorityWeights, value: number) => {
    onUpdateIntake({
      ...intake,
      priorityWeights: {
        ...intake.priorityWeights,
        [key]: value,
      },
    });
  };

  const handleSelectPresetScenario = (
    scenarioId: 'technoverse' | 'synergy' | 'devdays'
  ) => {
    const found = PRESET_DEMO_SCENARIOS.find((s) => s.id === scenarioId);
    if (!found) return;
    setValidationError(null);
    setActivePresetId(scenarioId);
    setQuestionsRefreshedBanner(null);
    onLoadPresetScenario(scenarioId);
    setPresetFeedbackBanner(
      `Loaded Sample Scenario: ${found.config.festName} · ${formatINR(found.config.totalBudgetINR)} Budget · ${found.config.activeVolunteerCoordinators} Coordinators · Location: ${found.config.eventLocality}`
    );
  };

  const handleResetClick = () => {
    setValidationError(null);
    setActivePresetId(null);
    setQuestionsRefreshedBanner(null);
    onResetToCleanBrief();
    setPresetFeedbackBanner(
      'Reset to Clean Event Brief. Downstream tabs are cleared so you can build strictly from your own event details.'
    );
  };

  const handleRefreshQuestionsClick = async () => {
    setValidationError(null);
    await onRegenerateQuestions();
    const effectiveCategory = getEffectiveFestCategory(intake);
    setQuestionsRefreshedBanner(
      `Refreshed 4 Clarifying Questions with the planner for "${intake.festName || 'Custom Event'}" (${effectiveCategory} · ${intake.venueType || 'College Campus'} at ${intake.eventLocality || 'Campus'} · ${intake.startTime || '09:00 AM'}–${intake.endTime || '06:00 PM'} · ${formatINR(intake.totalBudgetINR)}).`
    );
  };

  const handleAppendCustomSnippet = (snippet: string) => {
    const current = (intake.additionalContextNotes ?? '').trim();
    const nextNotes = current
      ? current.includes(snippet)
        ? current
        : `${current}; ${snippet}`
      : snippet;
    onUpdateIntake({
      ...intake,
      additionalContextNotes: nextNotes,
    });
  };

  const handleSynthesizeClick = () => {
    if (!intake.festName.trim()) {
      setValidationError('Please enter a valid Fest Name before synthesizing.');
      return;
    }
    if (intake.expectedFootfall < 20 || intake.totalBudgetINR < 5000) {
      setValidationError(
        'Expected footfall must be at least 20 and total budget at least ₹5,000.'
      );
      return;
    }
    const unanswered = clarifyingQuestions.find((q) => !q.answer.trim());
    if (unanswered) {
      setValidationError(
        `Please provide an answer for the "${unanswered.category}" clarifying question.`
      );
      return;
    }
    setValidationError(null);
    onSynthesizeMasterPlan();
  };

  const answeredCount = clarifyingQuestions.filter(
    (q) => q.answer.trim().length > 0
  ).length;

  return (
    <section
      aria-label="Two-Step Clarifying Fest Intake Engine"
      className="space-y-6"
    >
      {/* Workspace Header */}
      <div className="pb-5 border-b border-slate-200 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-indigo-700">
              Module 01 · Two-Step Clarifying Fest Intake Engine
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Smart Fest Intake &amp; Clarifying Questions Wizard
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Enter your own event details below (including custom category,
              start/end timings, college vs. external venue, and locality),
              click <strong>&ldquo;Analyze Fest Brief &amp; Refresh Questions&rdquo;</strong>{' '}
              to tailor the AI questions, and add any extra custom context at the
              end of Stage B before generating your master plan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleResetClick}
            aria-label="Reset to Clean Brief and Clear Sample Data"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer self-start"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset to Clean Brief
          </button>
        </div>

        {/* 3 Optional One-Click Sample Scenarios */}
        <div className="space-y-2.5 bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-700">
              Optional: Want to see how a complete pre-filled example looks? Load a 1-click realistic scenario:
            </span>
            <span className="text-xs font-mono text-indigo-700">
              By default, tabs stay uncluttered until you generate or load a sample
            </span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {PRESET_DEMO_SCENARIOS.map((preset) => {
              const isSelected = activePresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPresetScenario(preset.id)}
                  aria-label={`Load realistic scenario: ${preset.buttonLabel}`}
                  aria-pressed={isSelected}
                  className={`p-3 text-left rounded-xl border text-xs transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 font-semibold'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  <div className="leading-snug">{preset.buttonLabel}</div>
                </button>
              );
            })}
          </div>
          {presetFeedbackBanner && (
            <div className="px-3.5 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{presetFeedbackBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setPresetFeedbackBanner(null)}
                className="text-xs font-semibold text-emerald-800 underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </div>

      {validationError && (
        <div
          role="alert"
          className="p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800 flex items-center justify-between"
        >
          <span>{validationError}</span>
          <button
            type="button"
            onClick={() => setValidationError(null)}
            aria-label="Dismiss validation alert"
            className="text-xs font-semibold text-red-900 underline ml-4 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Two-Column Split: Stage A (Left) & Stage B (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Stage A: Initial Fest Brief (5 cols) */}
        <article
          aria-label="Stage A: Initial Fest Brief"
          className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-5"
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Stage A · Your Event Brief
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Event category, timings, location/locality, budget &amp; venues
              </p>
            </div>
            <span className="text-xs font-mono text-slate-600 tabular-nums">
              {intake.weeksUntilFest} Wks Out
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="fest-name-input"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Fest / Event Name
              </label>
              <input
                id="fest-name-input"
                type="text"
                value={intake.festName}
                placeholder="e.g., Horizon Tech & Cultural Fest 2026"
                onChange={(e) =>
                  onUpdateIntake({ ...intake, festName: e.target.value })
                }
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            {/* Category + Custom Category Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="fest-category-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Fest Category
                </label>
                <select
                  id="fest-category-select"
                  value={intake.festCategory}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      festCategory: e.target.value as FestCategoryType,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {FEST_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="custom-category-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Custom Fest Category (Optional)
                </label>
                <input
                  id="custom-category-input"
                  type="text"
                  value={intake.customCategory ?? ''}
                  placeholder="e.g., Inter-Hostel Music Night, AI Bootcamp..."
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      customCategory: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Venue Setting (College vs External) + Location / Locality */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="venue-type-select"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Building2 className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Venue Setting (College / Outside)
                </label>
                <select
                  id="venue-type-select"
                  value={intake.venueType ?? 'College Campus'}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      venueType: e.target.value as VenueType,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {VENUE_TYPES.map((vt) => (
                    <option key={vt} value={vt}>
                      {vt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="event-locality-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Location &amp; Locality / City
                </label>
                <input
                  id="event-locality-input"
                  type="text"
                  value={intake.eventLocality ?? ''}
                  placeholder="e.g., Powai, Mumbai or Sector 62, Noida"
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      eventLocality: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Event Date + Start Time + End Time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label
                  htmlFor="event-dates-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Event Date(s)
                </label>
                <input
                  id="event-dates-input"
                  type="text"
                  value={intake.dates}
                  placeholder="e.g., Nov 20, 2026"
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      dates: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="event-start-time-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Start Time
                </label>
                <input
                  id="event-start-time-input"
                  type="text"
                  value={intake.startTime ?? '09:00 AM'}
                  placeholder="e.g., 09:00 AM"
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      startTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="event-end-time-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Clock className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  End Time
                </label>
                <input
                  id="event-end-time-input"
                  type="text"
                  value={intake.endTime ?? '06:00 PM'}
                  placeholder="e.g., 06:00 PM"
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      endTime: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="total-budget-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Wallet className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Total Budget (₹)
                </label>
                <input
                  id="total-budget-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 250000"
                  value={formatNumericInputValue(intake.totalBudgetINR)}
                  onChange={(e) => {
                    const { numericValue } = sanitizeNumericInput(
                      e.target.value
                    );
                    onUpdateIntake({
                      ...intake,
                      totalBudgetINR: numericValue,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="expected-footfall-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Users className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Expected Footfall
                </label>
                <input
                  id="expected-footfall-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 300"
                  value={formatNumericInputValue(intake.expectedFootfall)}
                  onChange={(e) => {
                    const { numericValue } = sanitizeNumericInput(
                      e.target.value
                    );
                    onUpdateIntake({
                      ...intake,
                      expectedFootfall: numericValue,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="weeks-until-fest-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  <Calendar className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                  Weeks Until Fest
                </label>
                <input
                  id="weeks-until-fest-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 4"
                  value={formatNumericInputValue(intake.weeksUntilFest)}
                  onChange={(e) => {
                    const { numericValue } = sanitizeNumericInput(
                      e.target.value
                    );
                    onUpdateIntake({
                      ...intake,
                      weeksUntilFest: numericValue,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label
                  htmlFor="active-coordinators-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Volunteer Coordinators
                </label>
                <input
                  id="active-coordinators-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="e.g., 16"
                  value={formatNumericInputValue(
                    intake.activeVolunteerCoordinators
                  )}
                  onChange={(e) => {
                    const { numericValue } = sanitizeNumericInput(
                      e.target.value
                    );
                    onUpdateIntake({
                      ...intake,
                      activeVolunteerCoordinators: numericValue,
                    });
                  }}
                  className="w-full px-3 py-2 text-xs font-mono tabular-nums bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            {/* Concurrent Venue Tracks */}
            <div>
              <label
                htmlFor="new-venue-input"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                <MapPin className="w-3.5 h-3.5 inline mr-1 text-slate-500" />
                Concurrent Venue Tracks ({intake.concurrentVenueTracks.length})
              </label>
              <ul className="space-y-1.5 mb-2">
                {intake.concurrentVenueTracks.map((venue, idx) => (
                  <li
                    key={venue}
                    className="flex items-center justify-between px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800"
                  >
                    <span className="truncate pr-2">
                      <span className="font-mono text-slate-600 mr-1.5">
                        V{idx + 1}.
                      </span>
                      {venue}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVenueTrack(venue)}
                      aria-label={`Remove venue ${venue}`}
                      disabled={intake.concurrentVenueTracks.length <= 1}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-30 cursor-pointer shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
              <form onSubmit={handleAddVenueTrack} className="flex gap-2">
                <input
                  id="new-venue-input"
                  type="text"
                  placeholder="Add venue (e.g., Robotics Courtyard)..."
                  value={newVenueInput}
                  onChange={(e) => setNewVenueInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  aria-label="Add concurrent venue track"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 border border-slate-300 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Venue
                </button>
              </form>
            </div>

            {/* Priority Weights */}
            <div className="pt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-slate-500" />
                  Category Priority Weights
                </span>
                <span className="font-mono text-slate-500">0–100 Scale</span>
              </div>

              {PRIORITY_LABELS.map(({ key, label }) => (
                <div key={key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-slate-700">
                    <label htmlFor={`weight-${key}`}>{label}</label>
                    <span className="font-mono tabular-nums font-semibold">
                      {intake.priorityWeights[key]}%
                    </span>
                  </div>
                  <input
                    id={`weight-${key}`}
                    type="range"
                    min={20}
                    max={100}
                    step={5}
                    value={intake.priorityWeights[key]}
                    onChange={(e) =>
                      handleWeightChange(key, Number(e.target.value))
                    }
                    className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleRefreshQuestionsClick}
                disabled={isGeneratingQuestions}
                aria-label="Analyze Fest Brief and Generate Clarifying Questions"
                className="w-full py-2.5 px-4 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isGeneratingQuestions ? 'animate-spin' : ''
                  }`}
                />
                {isGeneratingQuestions
                  ? 'Analyzing Fest Brief with the planner...'
                  : 'Analyze Fest Brief & Refresh Questions'}
              </button>
            </div>
          </div>
        </article>

        {/* Stage B: AI Clarifying Questions (7 cols) */}
        <article
          aria-label="Stage B: AI Clarifying Questions"
          className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3.5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Stage B · AI Clarifying Questions ({answeredCount}/
                {clarifyingQuestions.length} Answered)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select a quick-answer resolution chip or type a custom campus
                protocol before generating the master plan
              </p>
            </div>
            <div className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 shrink-0">
              <ShieldCheck className="w-4 h-4" />
              <span>Structured planning</span>
            </div>
          </div>

          {questionsRefreshedBanner && (
            <div
              role="status"
              className="px-3.5 py-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-950 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-700 shrink-0" />
                <span>{questionsRefreshedBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setQuestionsRefreshedBanner(null)}
                className="text-xs font-semibold text-indigo-800 underline cursor-pointer shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          <div className="space-y-4">
            {clarifyingQuestions.map((q, index) => (
              <div
                key={q.id}
                className="p-4 rounded-lg bg-slate-50/80 border border-slate-200 space-y-3"
              >
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span className="font-semibold text-indigo-700">
                    0{index + 1}. {q.category}
                  </span>
                  <span className="font-mono">
                    {q.answer.trim() ? 'Resolved' : 'Action Needed'}
                  </span>
                </div>

                <p className="text-sm font-semibold text-slate-900 leading-snug">
                  {q.question}
                </p>

                <p className="text-xs text-slate-600 flex items-start gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-medium text-slate-700">
                      Operational Impact:
                    </strong>{' '}
                    {q.whyItMatters}
                  </span>
                </p>

                {/* Quick-Answer Chips */}
                <div className="space-y-1.5">
                  <span className="block text-xs font-medium text-slate-500">
                    Quick-Answer Campus Chips:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {q.suggestedOptions.map((optionText) => {
                      const isSelected = q.answer === optionText;
                      return (
                        <button
                          key={optionText}
                          type="button"
                          onClick={() => onUpdateQuestionAnswer(q.id, optionText)}
                          aria-pressed={isSelected}
                          className={`px-2.5 py-1 text-xs rounded-md border text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-slate-900 text-white border-slate-900 font-medium'
                              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {optionText}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor={`question-input-${q.id}`}
                    className="sr-only"
                  >
                    Coordinator response for {q.category}
                  </label>
                  <input
                    id={`question-input-${q.id}`}
                    type="text"
                    value={q.answer}
                    onChange={(e) =>
                      onUpdateQuestionAnswer(q.id, e.target.value)
                    }
                    placeholder="Or type custom campus resolution..."
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>
            ))}

            {/* 05. Additional Custom Event Context & Special Requirements */}
            <div className="p-4 rounded-lg bg-indigo-50/50 border border-indigo-200 space-y-3">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-indigo-800 flex items-center gap-1.5">
                  <MessageSquarePlus className="w-3.5 h-3.5 text-indigo-700" />
                  05. Additional Custom Event Context &amp; Special Requirements
                  (Optional)
                </span>
                <span className="font-mono text-indigo-700">
                  Shared with Budget · Crisis · Vendors
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                Share any extra clarifications, custom constraints, dietary
                rules, sponsor clauses, or equipment requirements. The planner uses this context directly when refreshing questions,
                allocating your INR budget, predicting crisis trade-offs, and
                evaluating vendor quotes.
              </p>

              <div className="space-y-1.5">
                <span className="block text-xs font-medium text-slate-500">
                  1-Click Quick-Add Context Chips:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_CUSTOM_CONTEXT_SNIPPETS.map((snippet) => (
                    <button
                      key={snippet}
                      type="button"
                      onClick={() => handleAppendCustomSnippet(snippet)}
                      className="px-2.5 py-1 text-xs rounded-md border bg-white text-slate-700 border-slate-300 hover:bg-indigo-50 hover:border-indigo-300 transition-colors cursor-pointer text-left"
                    >
                      + {snippet}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="additional-context-notes-input"
                  className="block text-xs font-semibold text-slate-700 mb-1"
                >
                  Custom Answers / Extra Event Notes for AI Execution Engine
                </label>
                <textarea
                  id="additional-context-notes-input"
                  rows={3}
                  value={intake.additionalContextNotes ?? ''}
                  onChange={(e) =>
                    onUpdateIntake({
                      ...intake,
                      additionalContextNotes: e.target.value,
                    })
                  }
                  placeholder="e.g., Need 100% vegetarian & Jain counters, dedicated 50 Mbps livestream uplink in Seminar Hall 2, and ₹40,000 reserved for cash prizes..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-xs text-slate-600 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Constructs 4-Phase Dependency Timeline &amp;{' '}
                <strong className="font-mono">
                  {formatINR(intake.totalBudgetINR)}
                </strong>{' '}
                Dual-Track Budget ({intake.expectedFootfall} attendees).
              </span>
            </div>

            <button
              type="button"
              onClick={handleSynthesizeClick}
              disabled={isSynthesizingPlan}
              aria-label="Generate Master Fest Plan and Open Schedule Dashboard"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {isSynthesizingPlan ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Generating Master Fest Plan...
                </>
              ) : (
                <>
                  <ClipboardCheck className="w-4 h-4" />
                  Generate Master Fest Plan
                </>
              )}
            </button>
          </div>
        </article>
      </div>
    </section>
  );
};
