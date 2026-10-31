import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Download,
  FileCheck2,
  X,
} from 'lucide-react';
import {
  BudgetCategory,
  ClarifyingQuestion,
  CoordinatorLogEntry,
  CrisisSimulationResult,
  CrisisTradeOffOption,
  ExecutiveOpsSummary,
  FestIntakeConfig,
  FestMasterPlan,
  OutreachDraft,
  ScheduleNode,
  TaskStatus,
  VendorQuote,
  VolunteerTask,
  WorkspaceId,
} from './types';
import {
  buildPresetMasterPlan,
  CLEAN_INITIAL_MASTER_PLAN,
  DETERMINISTIC_CRISIS_RESULTS,
  INITIAL_FEST_MASTER_PLAN,
} from './data/seedFestData';
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
  formatINR,
  getCategoryBudgetItem,
  getEffectiveFestCategory,
  lockVendorQuoteInPlan,
} from './utils/festEngine';
import {
  evaluateVendorQuotes,
  generateClarifyingQuestions,
  generateMasterFestPlan,
  simulateConstraintShock,
} from './services/geminiService';
const IntakeWizardWorkspace = lazy(() => import('./components/IntakeWizardWorkspace').then(m => ({ default: m.IntakeWizardWorkspace })));
const ScheduleBudgetWorkspace = lazy(() => import('./components/ScheduleBudgetWorkspace').then(m => ({ default: m.ScheduleBudgetWorkspace })));
const VolunteerOpsWorkspace = lazy(() => import('./components/VolunteerOpsWorkspace').then(m => ({ default: m.VolunteerOpsWorkspace })));
const CrisisSimulatorWorkspace = lazy(() => import('./components/CrisisSimulatorWorkspace').then(m => ({ default: m.CrisisSimulatorWorkspace })));
const QuoteComparatorWorkspace = lazy(() => import('./components/QuoteComparatorWorkspace').then(m => ({ default: m.QuoteComparatorWorkspace })));

const WORKSPACE_TABS: { id: WorkspaceId; label: string }[] = [
  { id: 'intake', label: 'Intake Wizard' },
  { id: 'schedule-budget', label: 'Schedule & Budget' },
  { id: 'volunteer-ops', label: 'Volunteer Ops' },
  { id: 'crisis-simulator', label: 'Crisis Simulator' },
  { id: 'quote-comparator', label: 'Quote Comparator' },
];

export default function App() {
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>(() => {
    const params = new URLSearchParams(window.location.search);
    const ws = params.get('workspace') as WorkspaceId | null;
    if (ws && WORKSPACE_TABS.some((t) => t.id === ws)) {
      return ws;
    }
    if (params.get('autostart') === '1') {
      return 'schedule-budget';
    }
    return 'intake';
  });

  // Start clean and uncluttered: only Intake Wizard details are populated by default.
  // Downstream tabs start empty until the user generates from their Intake brief or clicks "Load Sample Data".
  const [masterPlan, setMasterPlan] = useState<FestMasterPlan>(
    CLEAN_INITIAL_MASTER_PLAN
  );
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [isSynthesizingPlan, setIsSynthesizingPlan] = useState(false);

  // Module 3: Volunteer Ops & AI Summarizer state (starts empty/null)
  const [opsSummary, setOpsSummary] = useState<ExecutiveOpsSummary | null>(
    null
  );
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [selectedTaskForOutreach, setSelectedTaskForOutreach] =
    useState<VolunteerTask | null>(null);
  const [activeOutreachDraft, setActiveOutreachDraft] =
    useState<OutreachDraft | null>(null);
  const [isDraftingOutreach, setIsDraftingOutreach] = useState(false);

  // Module 4: Crisis Simulator state (starts null until user simulates or loads sample)
  const [activeScenarioId, setActiveScenarioId] =
    useState<string>('crisis-reg-surge');
  const [simulationResult, setSimulationResult] =
    useState<CrisisSimulationResult | null>(null);
  const [isSimulatingCrisis, setIsSimulatingCrisis] = useState(false);

  // Module 5: Quote Comparator state
  const [activeQuoteCategory, setActiveQuoteCategory] =
    useState<BudgetCategory>('Catering, Stalls & Midnight Refreshments');
  const [isEvaluatingQuotes, setIsEvaluatingQuotes] = useState(false);

  // Runbook Export Modal state
  const [showRunbookModal, setShowRunbookModal] = useState(false);
  const [exportFormat, setExportFormat] = useState<'markdown' | 'json'>(
    'markdown'
  );
  const [copiedRunbook, setCopiedRunbook] = useState(false);
  const runbookDialog = useRef<HTMLDialogElement>(null);
  const generationRequest = useRef(0);

  useEffect(() => {
    if (!showRunbookModal) return;
    const returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = runbookDialog.current;
    dialog?.showModal();
    return () => { dialog?.close(); returnFocus?.focus(); };
  }, [showRunbookModal]);

  useEffect(() => {
    document.body.setAttribute('data-workspace', activeWorkspace);
  }, [activeWorkspace]);

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const nextIndex = e.key === 'ArrowRight' ? (index + 1) % WORKSPACE_TABS.length
      : e.key === 'ArrowLeft' ? (index - 1 + WORKSPACE_TABS.length) % WORKSPACE_TABS.length
      : e.key === 'Home' ? 0 : e.key === 'End' ? WORKSPACE_TABS.length - 1 : null;
    if (nextIndex === null) return;
    e.preventDefault();
    const next = WORKSPACE_TABS[nextIndex];
    setActiveWorkspace(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  // Module 1 Handlers (Intake Wizard)
  const handleLoadPresetScenario = (
    presetId: 'technoverse' | 'synergy' | 'devdays'
  ) => {
    const presetPlan = buildPresetMasterPlan(presetId);
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      intake: {
        ...presetPlan.intake,
        concurrentVenueTracks: [...presetPlan.intake.concurrentVenueTracks],
        priorityWeights: { ...presetPlan.intake.priorityWeights },
        additionalContextNotes: presetPlan.intake.additionalContextNotes ?? '',
      },
      clarifyingQuestions: presetPlan.clarifyingQuestions.map((q) => ({ ...q })),
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
  };

  const handleResetToCleanBrief = () => {
    const cleanIntake: FestIntakeConfig = {
      ...CLEAN_INITIAL_MASTER_PLAN.intake,
      festName: 'My Campus Event',
      festCategory: 'Inter-College Tech Fest & Hackathon',
      customCategory: '',
      venueType: 'College Campus',
      eventLocality: 'Main Campus',
      dates: 'Nov 14–15, 2026',
      startTime: '09:00 AM',
      endTime: '08:00 PM',
      totalBudgetINR: 250000,
      expectedFootfall: 300,
      weeksUntilFest: 4,
      activeVolunteerCoordinators: 15,
      concurrentVenueTracks: ['Main Auditorium', 'Seminar Hall 1'],
      additionalContextNotes: '',
    };
    setMasterPlan({
      ...CLEAN_INITIAL_MASTER_PLAN,
      intake: cleanIntake,
      clarifyingQuestions: buildTailoredClarifyingQuestionsFromIntake(cleanIntake),
      lastUpdatedISO: new Date().toISOString(),
    });
    setOpsSummary(null);
    setSelectedTaskForOutreach(null);
    setActiveOutreachDraft(null);
    setSimulationResult(null);
  };

  const handleUpdateIntake = (nextIntake: FestIntakeConfig) => {
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      intake: nextIntake,
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
    if (selectedTaskForOutreach) {
      setActiveOutreachDraft(
        buildCoordinatorOutreachFromTask(selectedTaskForOutreach, nextIntake)
      );
    }
  };

  const handleUpdateQuestionAnswer = (id: string, answer: string) => {
    setMasterPlan((prev) => ({
      ...prev,
      clarifyingQuestions: prev.clarifyingQuestions.map((q) =>
        q.id === id ? { ...q, answer } : q
      ),
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleRegenerateQuestions = async () => {
    const currentIntake = masterPlan.intake;
    const immediateTailored =
      buildTailoredClarifyingQuestionsFromIntake(currentIntake);
    setMasterPlan((prev) => ({
      ...prev,
      clarifyingQuestions: immediateTailored,
      lastUpdatedISO: new Date().toISOString(),
    }));
    setIsGeneratingQuestions(true);
    try {
      const questions: ClarifyingQuestion[] =
        await generateClarifyingQuestions(currentIntake);
      if (Array.isArray(questions) && questions.length > 0) {
        setMasterPlan((prev) => prev.intake !== currentIntake || prev.clarifyingQuestions !== immediateTailored
          ? prev : { ...prev, clarifyingQuestions: questions, lastUpdatedISO: new Date().toISOString() });
      }
    } finally {
      setIsGeneratingQuestions(false);
    }
  };

  const handleSynthesizeMasterPlan = async () => {
    const requestId = ++generationRequest.current;
    setIsSynthesizingPlan(true);
    const currentIntake = masterPlan.intake;
    const currentQuestions = masterPlan.clarifyingQuestions;
    const intakeDriven = buildPlanFromUserIntake(
      currentIntake,
      currentQuestions
    );
    try {
      const generated = await generateMasterFestPlan(currentIntake, currentQuestions);
      if (generationRequest.current !== requestId) return;
      const suggestedQuotes = buildSuggestedVendorQuotesFromIntake(currentIntake, generated.budget);

    setMasterPlan((prev) => {
      if (prev.intake !== currentIntake || prev.clarifyingQuestions !== currentQuestions ||
          prev.schedule !== masterPlan.schedule || prev.budget !== masterPlan.budget) return prev;
      return {
      ...prev,
      schedule: generated.schedule,
      budget: generated.budget,
      volunteerTasks:
        prev.volunteerTasks.length > 0
          ? prev.volunteerTasks
          : intakeDriven.volunteerTasks.map(task => ({ ...task,
              linkedScheduleId: generated.schedule.find(node => node.department === task.department)?.id,
            })),
      vendorQuotes:
        prev.vendorQuotes.length > 0
          ? prev.vendorQuotes
          : suggestedQuotes,
      lastUpdatedISO: new Date().toISOString(),
    };
    });
    setActiveWorkspace('schedule-budget');
    } finally {
      if (generationRequest.current === requestId) setIsSynthesizingPlan(false);
    }
  };

  // Module 2 Handlers (Schedule & Budget)
  const handleGenerateScheduleBudgetFromIntake = () => {
    const generated = buildPlanFromUserIntake(
      masterPlan.intake,
      masterPlan.clarifyingQuestions
    );
    setMasterPlan((prev) => ({
      ...prev,
      schedule: generated.schedule,
      budget: generated.budget,
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleLoadSampleScheduleBudget = () => {
    const scaleFactor =
      masterPlan.intake.totalBudgetINR /
      Math.max(1, INITIAL_FEST_MASTER_PLAN.intake.totalBudgetINR);
    setMasterPlan((prev) => ({
      ...prev,
      schedule: INITIAL_FEST_MASTER_PLAN.schedule.map((s) => ({ ...s })),
      budget: INITIAL_FEST_MASTER_PLAN.budget.map((b) => ({
        ...b,
        aiEstimateINR: Math.round((b.aiEstimateINR * scaleFactor) / 500) * 500,
        confirmedQuoteINR:
          b.confirmedQuoteINR !== null
            ? Math.round((b.confirmedQuoteINR * scaleFactor) / 500) * 500
            : null,
        sponsorBackedINR:
          Math.round((b.sponsorBackedINR * scaleFactor) / 500) * 500,
      })),
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleClearScheduleBudget = () => {
    setMasterPlan((prev) => ({
      ...prev,
      schedule: [],
      budget: [],
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleToggleScheduleStatus = (
    scheduleId: string,
    nextStatus: TaskStatus
  ) => {
    setMasterPlan((prev) => ({
      ...prev,
      schedule: prev.schedule.map((node) =>
        node.id === scheduleId ? { ...node, status: nextStatus } : node
      ),
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleAddScheduleNode = (newNode: ScheduleNode) => {
    setMasterPlan((prev) => ({
      ...prev,
      schedule: [...prev.schedule, newNode],
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleNavigateToQuoteCategory = (category: BudgetCategory) => {
    setActiveQuoteCategory(category);
    setActiveWorkspace('quote-comparator');
  };

  // Module 3 Handlers (Volunteer Ops)
  const handleGenerateTasksFromIntake = () => {
    const generated = buildPlanFromUserIntake(
      masterPlan.intake,
      masterPlan.clarifyingQuestions
    );
    // If user already added coordinator logs with custom coordinator names/roles, carry those onto the starter tasks
    const tasksWithCustomCoordinators = generated.volunteerTasks.map(
      (task, index) => {
        const matchingLog = masterPlan.coordinatorLogs[index];
        if (!matchingLog) return task;
        return {
          ...task,
          coordinatorName: matchingLog.author,
          coordinatorRole: matchingLog.squad,
          department: matchingLog.squad,
        };
      }
    );
    const firstTask = tasksWithCustomCoordinators[0] ?? null;
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      volunteerTasks: tasksWithCustomCoordinators,
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    if (firstTask) {
      setSelectedTaskForOutreach(firstTask);
      setActiveOutreachDraft(
        buildCoordinatorOutreachFromTask(firstTask, nextPlan.intake)
      );
    }
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
  };

  const handleLoadSampleVolunteerData = () => {
    const intakeSample = buildSampleVolunteerDataFromIntake(
      masterPlan.intake,
      masterPlan.clarifyingQuestions
    );
    const nextTasks =
      masterPlan.volunteerTasks.length > 0
        ? masterPlan.volunteerTasks
        : intakeSample.volunteerTasks;
    const nextLogs =
      masterPlan.coordinatorLogs.length > 0
        ? masterPlan.coordinatorLogs
        : intakeSample.coordinatorLogs;
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      volunteerTasks: nextTasks,
      coordinatorLogs: nextLogs,
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    const firstTask = nextTasks[0] ?? null;
    setSelectedTaskForOutreach(firstTask);
    setActiveOutreachDraft(
      firstTask
        ? buildCoordinatorOutreachFromTask(firstTask, nextPlan.intake)
        : null
    );
  };

  const handleClearVolunteerData = () => {
    setMasterPlan((prev) => ({
      ...prev,
      volunteerTasks: [],
      coordinatorLogs: [],
      lastUpdatedISO: new Date().toISOString(),
    }));
    setOpsSummary(null);
    setSelectedTaskForOutreach(null);
    setActiveOutreachDraft(null);
  };

  const handleToggleTaskStatus = (taskId: string, nextStatus: TaskStatus) => {
    const nextTasks = masterPlan.volunteerTasks.map((t) =>
      t.id === taskId ? { ...t, status: nextStatus } : t
    );
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      volunteerTasks: nextTasks,
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
    const updatedSelected = nextTasks.find(
      (t) => t.id === selectedTaskForOutreach?.id
    );
    if (updatedSelected) {
      setSelectedTaskForOutreach(updatedSelected);
      setActiveOutreachDraft(
        buildCoordinatorOutreachFromTask(updatedSelected, nextPlan.intake)
      );
    }
  };

  const handleAddVolunteerTask = (newTask: VolunteerTask) => {
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      volunteerTasks: [newTask, ...masterPlan.volunteerTasks],
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    setSelectedTaskForOutreach(newTask);
    setActiveOutreachDraft(
      buildCoordinatorOutreachFromTask(newTask, nextPlan.intake)
    );
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
  };

  const handleUpdateVolunteerTask = (updatedTask: VolunteerTask) => {
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      volunteerTasks: masterPlan.volunteerTasks.map((t) =>
        t.id === updatedTask.id ? updatedTask : t
      ),
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    setSelectedTaskForOutreach(updatedTask);
    setActiveOutreachDraft(
      buildCoordinatorOutreachFromTask(updatedTask, nextPlan.intake)
    );
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
  };

  const handleAddCoordinatorLog = (newLog: CoordinatorLogEntry) => {
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      coordinatorLogs: [newLog, ...masterPlan.coordinatorLogs],
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
  };

  const handleUpdateCoordinatorLog = (updatedLog: CoordinatorLogEntry) => {
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      coordinatorLogs: masterPlan.coordinatorLogs.map((l) =>
        l.id === updatedLog.id ? updatedLog : l
      ),
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
  };

  const handleDeleteCoordinatorLog = (logId: string) => {
    const nextPlan: FestMasterPlan = {
      ...masterPlan,
      coordinatorLogs: masterPlan.coordinatorLogs.filter((l) => l.id !== logId),
      lastUpdatedISO: new Date().toISOString(),
    };
    setMasterPlan(nextPlan);
    if (opsSummary) {
      setOpsSummary(buildExecutiveOpsSummaryFromPlan(nextPlan));
    }
  };

  const handleRefreshOpsSummary = () => {
    setIsGeneratingSummary(true);
    let activePlan = masterPlan;
    if (activePlan.volunteerTasks.length === 0) {
      const generated = buildPlanFromUserIntake(
        activePlan.intake,
        activePlan.clarifyingQuestions
      );
      const tasksWithCustomCoordinators = generated.volunteerTasks.map(
        (task, index) => {
          const matchingLog = activePlan.coordinatorLogs[index];
          if (!matchingLog) return task;
          return {
            ...task,
            coordinatorName: matchingLog.author,
            coordinatorRole: matchingLog.squad,
            department: matchingLog.squad,
          };
        }
      );
      activePlan = {
        ...activePlan,
        volunteerTasks: tasksWithCustomCoordinators,
        lastUpdatedISO: new Date().toISOString(),
      };
      setMasterPlan(activePlan);
      const firstTask = tasksWithCustomCoordinators[0] ?? null;
      if (firstTask && !selectedTaskForOutreach) {
        setSelectedTaskForOutreach(firstTask);
        setActiveOutreachDraft(
          buildCoordinatorOutreachFromTask(firstTask, activePlan.intake)
        );
      }
    }
    const nextSummary = buildExecutiveOpsSummaryFromPlan(activePlan);
    setOpsSummary(nextSummary);
    setIsGeneratingSummary(false);
  };

  const handleSelectTaskForOutreach = (task: VolunteerTask) => {
    setSelectedTaskForOutreach(task);
    setIsDraftingOutreach(true);
    const draft = buildCoordinatorOutreachFromTask(task, masterPlan.intake);
    setActiveOutreachDraft(draft);
    setIsDraftingOutreach(false);
  };

  // Module 4 Handlers (Crisis Simulator)
  const ensureBudgetForSimulation = (plan: FestMasterPlan): FestMasterPlan => {
    if (plan.budget.length > 0) return plan;
    const generated = buildPlanFromUserIntake(
      plan.intake,
      plan.clarifyingQuestions
    );
    const updated = {
      ...plan,
      budget: generated.budget,
      schedule:
        plan.schedule.length > 0 ? plan.schedule : generated.schedule,
    };
    setMasterPlan(updated);
    return updated;
  };

  const handlePredictCrisisFromIntake = () => {
    const activePlan = ensureBudgetForSimulation(masterPlan);
    const predicted = buildCrisisSimulationFromIntake(
      activeScenarioId,
      activePlan
    );
    setSimulationResult(predicted);
  };

  const handleLoadSampleCrisis = () => {
    ensureBudgetForSimulation(masterPlan);
    setSimulationResult(
      DETERMINISTIC_CRISIS_RESULTS[activeScenarioId] ??
        DETERMINISTIC_CRISIS_RESULTS['crisis-reg-surge']
    );
  };

  const handleClearCrisis = () => {
    setSimulationResult(null);
  };

  const handleSelectScenario = async (scenarioId: string) => {
    setActiveScenarioId(scenarioId);
    const activePlan = ensureBudgetForSimulation(masterPlan);
    setIsSimulatingCrisis(true);
    try {
      const predicted = buildCrisisSimulationFromIntake(scenarioId, activePlan);
      setSimulationResult(predicted);
    } finally {
      setIsSimulatingCrisis(false);
    }
  };

  const handleSimulateCustomShock = async (customDescription: string) => {
    const activePlan = ensureBudgetForSimulation(masterPlan);
    setIsSimulatingCrisis(true);
    try {
      const result = await simulateConstraintShock(
        activeScenarioId,
        activePlan,
        customDescription
      );
      setSimulationResult(result);
    } finally {
      setIsSimulatingCrisis(false);
    }
  };

  const handleApplyTradeOff = (
    scenarioTitle: string,
    option: CrisisTradeOffOption
  ) => {
    setMasterPlan((prev) => {
      const basePlan =
        prev.budget.length > 0
          ? prev
          : {
              ...prev,
              ...buildPlanFromUserIntake(
                prev.intake,
                prev.clarifyingQuestions
              ),
            };
      return applyCrisisTradeOffToPlan(basePlan, scenarioTitle, option);
    });
  };

  // Module 5 Handlers (Quote Comparator)
  const handleSuggestVendorsFromIntake = () => {
    setMasterPlan((prev) => {
      const baseBudget =
        prev.budget.length > 0
          ? prev.budget
          : buildPlanFromUserIntake(prev.intake, prev.clarifyingQuestions)
              .budget;
      const suggestedQuotes = buildSuggestedVendorQuotesFromIntake(
        prev.intake,
        baseBudget
      );
      return {
        ...prev,
        budget: baseBudget,
        vendorQuotes: suggestedQuotes,
        lastUpdatedISO: new Date().toISOString(),
      };
    });
  };

  const handleLoadSampleVendorQuotes = () => {
    const scaleFactor =
      masterPlan.intake.totalBudgetINR /
      Math.max(1, INITIAL_FEST_MASTER_PLAN.intake.totalBudgetINR);
    const scaledSampleQuotes = INITIAL_FEST_MASTER_PLAN.vendorQuotes.map(
      (q) => ({
        ...q,
        totalQuoteINR: Math.round((q.totalQuoteINR * scaleFactor) / 500) * 500,
      })
    );
    setMasterPlan((prev) => {
      const baseBudget =
        prev.budget.length > 0
          ? prev.budget
          : buildPlanFromUserIntake(prev.intake, prev.clarifyingQuestions)
              .budget;
      return {
        ...prev,
        budget: baseBudget,
        vendorQuotes: scaledSampleQuotes,
        lastUpdatedISO: new Date().toISOString(),
      };
    });
  };

  const handleClearVendorQuotes = () => {
    setMasterPlan((prev) => ({
      ...prev,
      vendorQuotes: [],
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleLockVendorQuote = (quoteId: string) => {
    setMasterPlan((prev) => lockVendorQuoteInPlan(prev, quoteId));
  };

  const handleAddCustomVendorQuote = (newQuote: VendorQuote) => {
    setMasterPlan((prev) => ({
      ...prev,
      vendorQuotes: [newQuote, ...prev.vendorQuotes],
      lastUpdatedISO: new Date().toISOString(),
    }));
  };

  const handleEvaluateQuotesWithAI = async () => {
    setIsEvaluatingQuotes(true);
    try {
      const catItem = getCategoryBudgetItem(
        masterPlan.budget,
        activeQuoteCategory
      );
      const categoryQuotes = masterPlan.vendorQuotes.filter(
        (q) => q.category === activeQuoteCategory
      );
      const scored = await evaluateVendorQuotes(
        activeQuoteCategory,
        categoryQuotes,
        catItem?.aiEstimateINR ?? 100000
      );
      setMasterPlan((prev) => ({
        ...prev,
        vendorQuotes: prev.vendorQuotes.map((q) => {
          const match = scored.find((s) => s.id === q.id);
          return match ?? q;
        }),
        lastUpdatedISO: new Date().toISOString(),
      }));
    } finally {
      setIsEvaluatingQuotes(false);
    }
  };

  const budgetMetrics = useMemo(() => computeDualTrackBudgetMetrics(
    masterPlan.budget, masterPlan.intake.totalBudgetINR, masterPlan.intake.expectedFootfall
  ), [masterPlan.budget, masterPlan.intake.totalBudgetINR, masterPlan.intake.expectedFootfall]);

  const generateRunbookOutput = () => {
    if (exportFormat === 'json') {
      return JSON.stringify(masterPlan, null, 2);
    }
    const lines = [
      `# ${masterPlan.intake.festName} — Master Execution Runbook`,
      `Category: ${getEffectiveFestCategory(masterPlan.intake)} | Venue Setting: ${masterPlan.intake.venueType || 'College Campus'} (${masterPlan.intake.eventLocality || 'Campus'})`,
      `Dates: ${masterPlan.intake.dates} | Timings: ${masterPlan.intake.startTime || '09:00 AM'} – ${masterPlan.intake.endTime || '09:00 PM'}`,
      `Footfall: ${masterPlan.intake.expectedFootfall} | Master Cap: ${formatINR(masterPlan.intake.totalBudgetINR)} | Effective Spend: ${formatINR(budgetMetrics.totalEffectiveSpendINR)} (${formatINR(budgetMetrics.perAttendeeEffectiveINR)}/attendee)`,
      '',
      '## 4-Phase Dependency-Sequenced Timeline',
      ...(masterPlan.schedule.length === 0
        ? ['- No schedule nodes generated yet.']
        : masterPlan.schedule.map(
            (s) =>
              `- [${s.status}] ${s.code} (${s.phase.split(':')[0]}): ${s.title} | Venue: ${s.venue} | Squad: ${s.department}`
          )),
      '',
      '## Dual-Track INR Budget Summary',
      ...(masterPlan.budget.length === 0
        ? ['- No budget lines generated yet.']
        : masterPlan.budget.map(
            (b) =>
              `- ${b.category} (${b.priority}): AI Est ${formatINR(b.aiEstimateINR)} | Confirmed: ${
                b.confirmedQuoteINR !== null
                  ? formatINR(b.confirmedQuoteINR)
                  : 'Pending Lock'
              } (${b.quoteStatus})`
          )),
    ];
    return lines.join('\n');
  };

  const handleCopyRunbook = () => {
    const text = generateRunbookOutput();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedRunbook(true);
    setTimeout(() => setCopiedRunbook(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:p-3">Skip to main content</a>
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveWorkspace('intake');
            }}
            className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            CampusPulse AI
          </a>

          {/* Zone 2: 5 concise single-line navigation links */}
          <nav
            aria-label="CampusPulse AI Execution Workspaces"
            className="flex items-center gap-5 overflow-x-auto py-0.5"
          >
            <div role="tablist" aria-label="Execution workspaces" className="flex items-center gap-5">
            {WORKSPACE_TABS.map((tab, index) => {
              const isActive = activeWorkspace === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  tabIndex={isActive ? 0 : -1}
                  aria-controls={`panel-${tab.id}`}
                  id={`tab-${tab.id}`}
                  type="button"
                  onClick={() => setActiveWorkspace(tab.id)}
                  onKeyDown={(e) => handleTabKeyDown(e, index)}
                  className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 cursor-pointer ${
                    isActive
                      ? 'text-indigo-700 border-indigo-600 font-semibold'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
            </div>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowRunbookModal(true)}
              aria-label="Export Fest Master Runbook"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Export Master Runbook
            </button>
          </div>
        </div>
      </header>

      {/* Festival Context Sub-Bar */}
      <div className="bg-slate-900 text-slate-200 px-6 py-2.5 text-xs border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="text-white font-semibold">
              {masterPlan.intake.festName}
            </strong>
            <span className="text-slate-500">·</span>
            <span>{getEffectiveFestCategory(masterPlan.intake)}</span>
            <span className="text-slate-500">·</span>
            <span>
              {masterPlan.intake.venueType || 'College Campus'} (
              {masterPlan.intake.eventLocality || 'Campus'})
            </span>
            <span className="text-slate-500">·</span>
            <span>
              {masterPlan.intake.dates} ({masterPlan.intake.startTime || '09:00 AM'}–
              {masterPlan.intake.endTime || '09:00 PM'})
            </span>
            <span className="text-slate-500">·</span>
            <span className="font-mono tabular-nums">
              {masterPlan.intake.expectedFootfall.toLocaleString('en-IN')}{' '}
              Attendees
            </span>
          </div>

          <div className="flex items-center gap-3 font-mono tabular-nums">
            <span>
              Confirmed Spend:{' '}
              <strong className="text-emerald-400">
                {formatINR(budgetMetrics.totalConfirmedLockedINR)}
              </strong>
            </span>
            <span className="text-slate-600">/</span>
            <span>
              Cap:{' '}
              <strong className="text-white">
                {formatINR(budgetMetrics.masterCapINR)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Main Viewport Landmark */}
      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div id={`panel-${activeWorkspace}`} role="tabpanel" tabIndex={0}
          aria-labelledby={`tab-${activeWorkspace}`}>
        <Suspense fallback={<p role="status">Loading workspace…</p>}>
        {activeWorkspace === 'intake' && (
          <IntakeWizardWorkspace
            intake={masterPlan.intake}
            clarifyingQuestions={masterPlan.clarifyingQuestions}
            isGeneratingQuestions={isGeneratingQuestions}
            isSynthesizingPlan={isSynthesizingPlan}
            onUpdateIntake={handleUpdateIntake}
            onLoadPresetScenario={handleLoadPresetScenario}
            onResetToCleanBrief={handleResetToCleanBrief}
            onUpdateQuestionAnswer={handleUpdateQuestionAnswer}
            onRegenerateQuestions={handleRegenerateQuestions}
            onSynthesizeMasterPlan={handleSynthesizeMasterPlan}
          />
        )}

        {activeWorkspace === 'schedule-budget' && (
          <ScheduleBudgetWorkspace
            plan={masterPlan}
            onToggleScheduleStatus={handleToggleScheduleStatus}
            onAddScheduleNode={handleAddScheduleNode}
            onNavigateToQuoteCategory={handleNavigateToQuoteCategory}
            onGenerateFromIntake={handleGenerateScheduleBudgetFromIntake}
            onLoadSampleScheduleBudget={handleLoadSampleScheduleBudget}
            onClearScheduleBudget={handleClearScheduleBudget}
          />
        )}

        {activeWorkspace === 'volunteer-ops' && (
          <VolunteerOpsWorkspace
            plan={masterPlan}
            opsSummary={opsSummary}
            activeOutreachDraft={activeOutreachDraft}
            selectedTaskForOutreach={selectedTaskForOutreach}
            isGeneratingSummary={isGeneratingSummary}
            isDraftingOutreach={isDraftingOutreach}
            onToggleTaskStatus={handleToggleTaskStatus}
            onAddVolunteerTask={handleAddVolunteerTask}
            onUpdateVolunteerTask={handleUpdateVolunteerTask}
            onAddCoordinatorLog={handleAddCoordinatorLog}
            onUpdateCoordinatorLog={handleUpdateCoordinatorLog}
            onDeleteCoordinatorLog={handleDeleteCoordinatorLog}
            onRefreshOpsSummary={handleRefreshOpsSummary}
            onSelectTaskForOutreach={handleSelectTaskForOutreach}
            onGenerateTasksFromIntake={handleGenerateTasksFromIntake}
            onLoadSampleVolunteerData={handleLoadSampleVolunteerData}
            onClearVolunteerData={handleClearVolunteerData}
          />
        )}

        {activeWorkspace === 'crisis-simulator' && (
          <CrisisSimulatorWorkspace
            plan={masterPlan}
            activeScenarioId={activeScenarioId}
            simulationResult={simulationResult}
            isSimulating={isSimulatingCrisis}
            onSelectScenario={handleSelectScenario}
            onSimulateCustomShock={handleSimulateCustomShock}
            onApplyTradeOff={handleApplyTradeOff}
            onPredictFromIntake={handlePredictCrisisFromIntake}
            onLoadSampleCrisis={handleLoadSampleCrisis}
            onClearCrisis={handleClearCrisis}
          />
        )}

        {activeWorkspace === 'quote-comparator' && (
          <QuoteComparatorWorkspace
            plan={masterPlan}
            activeCategory={activeQuoteCategory}
            isEvaluatingQuotes={isEvaluatingQuotes}
            onSelectCategory={setActiveQuoteCategory}
            onLockVendorQuote={handleLockVendorQuote}
            onAddCustomVendorQuote={handleAddCustomVendorQuote}
            onEvaluateQuotesWithAI={handleEvaluateQuotesWithAI}
            onSuggestVendorsFromIntake={handleSuggestVendorsFromIntake}
            onLoadSampleVendorQuotes={handleLoadSampleVendorQuotes}
            onClearVendorQuotes={handleClearVendorQuotes}
          />
        )}
        </Suspense>
        </div>
      </main>

      {/* Quiet Semantic Footer */}
      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            CampusPulse AI — College Tech-Fest &amp; Community Event Execution
            Engine
          </span>
          <span className="font-mono tabular-nums">
            {masterPlan.schedule.length} Milestones ·{' '}
            {masterPlan.volunteerTasks.length} Squad Tasks ·{' '}
            {budgetMetrics.confirmedItemsCount}/{budgetMetrics.totalItemsCount}{' '}
            Quotes Locked
          </span>
        </div>
      </footer>

      {/* Runbook Export Dialog (JSON & Printable Markdown) */}
      {showRunbookModal && (
        <dialog ref={runbookDialog} onCancel={() => setShowRunbookModal(false)}
          aria-labelledby="runbook-modal-title"
          className="m-auto max-w-2xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto rounded-xl p-0 backdrop:bg-slate-900/60"
        >
          <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-indigo-600" />
                <h2
                  id="runbook-modal-title"
                  className="text-base font-bold text-slate-900"
                >
                  Export Fest Master Runbook (Printable Markdown / JSON)
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowRunbookModal(false)}
                aria-label="Close Runbook Export Dialog"
                className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExportFormat('markdown')}
                aria-pressed={exportFormat === 'markdown'}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                  exportFormat === 'markdown'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                Printable Markdown Runbook
              </button>
              <button
                type="button"
                onClick={() => setExportFormat('json')}
                aria-pressed={exportFormat === 'json'}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                State-Driven JSON Schema
              </button>
            </div>

            <pre className="p-4 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto max-h-80 leading-relaxed">
              {generateRunbookOutput()}
            </pre>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRunbookModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopyRunbook}
                aria-label="Copy Runbook Output"
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 cursor-pointer"
              >
                {copiedRunbook ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    Copied {exportFormat.toUpperCase()} Runbook
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    Copy {exportFormat.toUpperCase()} Runbook
                  </>
                )}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
