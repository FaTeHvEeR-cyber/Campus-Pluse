import React, { useMemo, useState } from 'react';
import {
  AlertOctagon,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import type {
  CoordinatorLogEntry,
  DepartmentName,
  ExecutiveOpsSummary,
  FestMasterPlan,
  OutreachDraft,
  TaskStatus,
  VolunteerTask,
} from '../types';
import {
  computeVolunteerOpsMetrics,
  cycleTaskStatus,
  formatNumericInputValue,
  getEffectiveFestCategory,
  sanitizeNumericInput,
} from '../utils/festEngine';

interface VolunteerOpsWorkspaceProps {
  plan: FestMasterPlan;
  opsSummary: ExecutiveOpsSummary | null;
  activeOutreachDraft: OutreachDraft | null;
  selectedTaskForOutreach: VolunteerTask | null;
  isGeneratingSummary: boolean;
  isDraftingOutreach: boolean;
  onToggleTaskStatus: (taskId: string, nextStatus: TaskStatus) => void;
  onAddVolunteerTask: (task: VolunteerTask) => void;
  onUpdateVolunteerTask: (task: VolunteerTask) => void;
  onAddCoordinatorLog: (log: CoordinatorLogEntry) => void;
  onUpdateCoordinatorLog: (log: CoordinatorLogEntry) => void;
  onDeleteCoordinatorLog: (logId: string) => void;
  onRefreshOpsSummary: () => void;
  onSelectTaskForOutreach: (task: VolunteerTask) => void;
  onGenerateTasksFromIntake: () => void;
  onLoadSampleVolunteerData: () => void;
  onClearVolunteerData: () => void;
}

const DEFAULT_SQUAD_ROLES: DepartmentName[] = [
  'Technical & Lab Ops',
  'Sponsorship & Finance',
  'Logistics & Food Committee',
  'Stage & PR Squad',
  'Registration & Hospitality Desk',
  'Core Executive',
  'Security & Crowd Control',
  'Media, Photography & Design',
  'Hospitality & Guest Escort',
];

const CUSTOM_ROLE_SENTINEL = '__CUSTOM_ROLE__';

export const VolunteerOpsWorkspace: React.FC<VolunteerOpsWorkspaceProps> = ({
  plan,
  opsSummary,
  activeOutreachDraft,
  selectedTaskForOutreach,
  isGeneratingSummary,
  isDraftingOutreach,
  onToggleTaskStatus,
  onAddVolunteerTask,
  onUpdateVolunteerTask,
  onAddCoordinatorLog,
  onUpdateCoordinatorLog,
  onDeleteCoordinatorLog,
  onRefreshOpsSummary,
  onSelectTaskForOutreach,
  onGenerateTasksFromIntake,
  onLoadSampleVolunteerData,
  onClearVolunteerData,
}) => {
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedBroadcastIdx, setCopiedBroadcastIdx] = useState<number | null>(
    null
  );
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // User-defined custom roles saved to the dropdown menu
  const [customRoleOptions, setCustomRoleOptions] = useState<string[]>([]);

  // Combine preset roles + any custom roles present on tasks/logs + user-saved custom roles
  const availableRoleOptions = useMemo(() => {
    const set = new Set<string>(DEFAULT_SQUAD_ROLES);
    for (const r of customRoleOptions) {
      if (r.trim()) set.add(r.trim());
    }
    for (const t of plan.volunteerTasks) {
      if (t.department?.trim()) set.add(t.department.trim());
    }
    for (const l of plan.coordinatorLogs) {
      if (l.squad?.trim()) set.add(l.squad.trim());
    }
    return Array.from(set);
  }, [customRoleOptions, plan.volunteerTasks, plan.coordinatorLogs]);

  // Coordinator Activity Log inputs (Author starts empty so no unrequested name is forced)
  const [logAuthorInput, setLogAuthorInput] = useState('');
  const [logSquadSelect, setLogSquadSelect] = useState<string>(
    'Technical & Lab Ops'
  );
  const [logCustomSquadInput, setLogCustomSquadInput] = useState('');
  const [logNoteInput, setLogNoteInput] = useState('');

  // Inline editing state for existing Coordinator Log Entries
  const [editingLogId, setEditingLogId] = useState<string | null>(null);
  const [editLogAuthor, setEditLogAuthor] = useState('');
  const [editLogSquadSelect, setEditLogSquadSelect] = useState('');
  const [editLogCustomSquad, setEditLogCustomSquad] = useState('');
  const [editLogNote, setEditLogNote] = useState('');

  // New task form fields (Coordinator name starts empty so user can enter their own name)
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newCoordinator, setNewCoordinator] = useState('');
  const [newDepartmentSelect, setNewDepartmentSelect] = useState<string>(
    'Technical & Lab Ops'
  );
  const [newCustomDepartment, setNewCustomDepartment] = useState('');
  const [newVolunteerCount, setNewVolunteerCount] = useState(4);
  const [newDeadline, setNewDeadline] = useState(
    plan.intake.startTime ? `Before ${plan.intake.startTime}` : 'Day 1 · 09:00 AM'
  );

  // Inline editing state for existing Volunteer Tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskCoordinatorName, setEditTaskCoordinatorName] = useState('');
  const [editTaskRoleSelect, setEditTaskRoleSelect] = useState('');
  const [editTaskCustomRole, setEditTaskCustomRole] = useState('');
  const [editTaskVolunteerCount, setEditTaskVolunteerCount] = useState(4);

  const registerCustomRoleIfNeeded = (roleName: string) => {
    const trimmed = roleName.trim();
    if (!trimmed) return;
    if (!availableRoleOptions.includes(trimmed)) {
      setCustomRoleOptions((prev) =>
        prev.includes(trimmed) ? prev : [...prev, trimmed]
      );
    }
  };

  const opsMetrics = computeVolunteerOpsMetrics(plan.volunteerTasks);
  const hasAnyVolunteerData =
    plan.volunteerTasks.length > 0 ||
    plan.coordinatorLogs.length > 0 ||
    opsSummary !== null;

  const filteredTasks = plan.volunteerTasks.filter((task) => {
    if (statusFilter !== 'ALL' && task.status !== statusFilter) return false;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchCoord = task.coordinatorName.toLowerCase().includes(q);
      const matchCode = task.taskCode.toLowerCase().includes(q);
      const matchDept = task.department.toLowerCase().includes(q);
      if (!matchTitle && !matchCoord && !matchCode && !matchDept) return false;
    }
    return true;
  });

  const handleCopyBroadcast = (index: number) => {
    if (!opsSummary) return;
    const item = opsSummary.broadcasts[index];
    if (!item) return;
    const text = `${item.subjectLine}\n\n${item.messageBody}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedBroadcastIdx(index);
    setTimeout(() => setCopiedBroadcastIdx(null), 2000);
  };

  const handleCopyOutreach = () => {
    if (!activeOutreachDraft) return;
    const textToCopy = `${activeOutreachDraft.subjectLine}\n\n${activeOutreachDraft.messageBody}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    const finalDepartment =
      newDepartmentSelect === CUSTOM_ROLE_SENTINEL
        ? newCustomDepartment.trim() || 'Custom Operations Squad'
        : newDepartmentSelect;
    registerCustomRoleIfNeeded(finalDepartment);

    const newTask: VolunteerTask = {
      id: `vt-custom-${Date.now()}`,
      taskCode: `VOL-10${plan.volunteerTasks.length + 1}`,
      title: newTaskTitle.trim(),
      coordinatorName: newCoordinator.trim() || 'Unassigned Coordinator',
      coordinatorRole: finalDepartment,
      department: finalDepartment,
      assignedVolunteersCount: Number(newVolunteerCount) || 4,
      status: 'In-Progress',
      priority: 'High',
      deadlineWindow:
        newDeadline.trim() ||
        (plan.intake.startTime ? `Before ${plan.intake.startTime}` : 'Event Day'),
      venueTrack: plan.intake.concurrentVenueTracks[0] ?? 'Main Venue',
      contactChannel: '#ops-sync',
    };
    onAddVolunteerTask(newTask);
    setNewTaskTitle('');
    setNewCoordinator('');
    setNewCustomDepartment('');
    setShowAddTaskModal(false);
  };

  const handleAppendLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNoteInput.trim()) return;
    const finalSquad =
      logSquadSelect === CUSTOM_ROLE_SENTINEL
        ? logCustomSquadInput.trim() || 'Custom Role'
        : logSquadSelect;
    registerCustomRoleIfNeeded(finalSquad);

    const entry: CoordinatorLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      author: logAuthorInput.trim() || 'Coordinator',
      squad: finalSquad,
      note: logNoteInput.trim(),
    };
    onAddCoordinatorLog(entry);
    setLogNoteInput('');
    if (logSquadSelect === CUSTOM_ROLE_SENTINEL && logCustomSquadInput.trim()) {
      setLogSquadSelect(finalSquad);
      setLogCustomSquadInput('');
    }
  };

  const startEditingLog = (log: CoordinatorLogEntry) => {
    setEditingLogId(log.id);
    setEditLogAuthor(log.author);
    if (availableRoleOptions.includes(log.squad)) {
      setEditLogSquadSelect(log.squad);
      setEditLogCustomSquad('');
    } else {
      setEditLogSquadSelect(CUSTOM_ROLE_SENTINEL);
      setEditLogCustomSquad(log.squad);
    }
    setEditLogNote(log.note);
  };

  const saveEditedLog = (log: CoordinatorLogEntry) => {
    const finalSquad =
      editLogSquadSelect === CUSTOM_ROLE_SENTINEL
        ? editLogCustomSquad.trim() || log.squad
        : editLogSquadSelect;
    registerCustomRoleIfNeeded(finalSquad);
    onUpdateCoordinatorLog({
      ...log,
      author: editLogAuthor.trim() || 'Coordinator',
      squad: finalSquad,
      note: editLogNote.trim() || log.note,
    });
    setEditingLogId(null);
  };

  const startEditingTask = (task: VolunteerTask) => {
    setEditingTaskId(task.id);
    setEditTaskCoordinatorName(task.coordinatorName);
    if (availableRoleOptions.includes(task.department)) {
      setEditTaskRoleSelect(task.department);
      setEditTaskCustomRole('');
    } else {
      setEditTaskRoleSelect(CUSTOM_ROLE_SENTINEL);
      setEditTaskCustomRole(task.department);
    }
    setEditTaskVolunteerCount(task.assignedVolunteersCount);
  };

  const saveEditedTask = (task: VolunteerTask) => {
    const finalRole =
      editTaskRoleSelect === CUSTOM_ROLE_SENTINEL
        ? editTaskCustomRole.trim() || task.department
        : editTaskRoleSelect;
    registerCustomRoleIfNeeded(finalRole);
    onUpdateVolunteerTask({
      ...task,
      coordinatorName:
        editTaskCoordinatorName.trim() || 'Unassigned Coordinator',
      coordinatorRole: finalRole,
      department: finalRole,
      assignedVolunteersCount: Math.max(1, editTaskVolunteerCount || 1),
    });
    setEditingTaskId(null);
  };

  return (
    <section
      aria-label="Volunteer and Coordinator Command Center"
      className="space-y-6"
    >
      {/* Clean, Beginner-Friendly Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <p className="text-xs font-medium text-indigo-700">
            Module 03 · Volunteer &amp; Coordinator Command Center
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
            Volunteer Tasks, Field Log &amp; AI Ops Summarizer
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Assign your own coordinator names and custom roles/squads for{' '}
            <strong>{plan.intake.festName}</strong> (or edit any generated/sample
            names and roles anytime).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onGenerateTasksFromIntake}
            aria-label="Generate Volunteer Tasks from My Intake Brief"
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generate Tasks from Intake
          </button>

          <button
            type="button"
            onClick={onLoadSampleVolunteerData}
            aria-label="Load Sample Volunteer Tasks and Logs"
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Load Sample Volunteer Data
          </button>

          <button
            type="button"
            onClick={() => setShowAddTaskModal((prev) => !prev)}
            aria-label="Assign New Volunteer Squad Task"
            className="px-3.5 py-2 text-xs font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Task
          </button>

          <button
            type="button"
            onClick={onRefreshOpsSummary}
            disabled={isGeneratingSummary}
            aria-label="Generate AI Executive Ops Briefing"
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isGeneratingSummary ? 'animate-spin' : ''
              }`}
            />
            {isGeneratingSummary
              ? 'Generating Briefing...'
              : 'Generate AI Executive Ops Briefing'}
          </button>

          {hasAnyVolunteerData && (
            <button
              type="button"
              onClick={onClearVolunteerData}
              aria-label="Clear Volunteer Tasks and Logs"
              className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Concise 4-Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <span className="text-xs font-medium text-slate-500">
            Assigned Volunteers
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-0.5">
            {opsMetrics.totalVolunteersMobilized} Volunteers
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {plan.volunteerTasks.length} Tasks Tracked
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <span className="text-xs font-medium text-slate-500">
            Blocked Tasks
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-red-700 mt-0.5">
            {opsMetrics.blockedCount} Blocked
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Needs attention
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <span className="text-xs font-medium text-slate-500">
            Active / Pending
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-700 mt-0.5">
            {opsMetrics.inProgressCount} Active · {opsMetrics.pendingCount}{' '}
            Pending
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {plan.intake.startTime ?? '09:00 AM'} –{' '}
            {plan.intake.endTime ?? '06:00 PM'}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5">
          <span className="text-xs font-medium text-slate-500">
            Coordinator Logs
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-0.5">
            {plan.coordinatorLogs.length} Logs
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {opsMetrics.completedCount} Tasks Completed
          </div>
        </div>
      </div>

      {/* Optional Add Task Drawer (Supports Custom Coordinator Name & Custom Role/Squad) */}
      {showAddTaskModal && (
        <form
          onSubmit={handleCreateTask}
          aria-label="Create New Volunteer Task"
          className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Add a Volunteer Task for {plan.intake.festName}
            </h3>
            <button
              type="button"
              onClick={() => setShowAddTaskModal(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
            <input
              type="text"
              required
              placeholder="Task description (e.g., Setup registration desk)..."
              aria-label="Volunteer task title"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="lg:col-span-4 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <input
              type="text"
              placeholder="Coordinator Name (e.g., Arjun, Priya)..."
              aria-label="Coordinator Name"
              value={newCoordinator}
              onChange={(e) => setNewCoordinator(e.target.value)}
              className="lg:col-span-3 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
            />
            <div className="lg:col-span-3 space-y-1.5">
              <select
                aria-label="Department or Role"
                value={newDepartmentSelect}
                onChange={(e) => setNewDepartmentSelect(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg"
              >
                {availableRoleOptions.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value={CUSTOM_ROLE_SENTINEL}>
                  + Custom Role / Squad (Type Your Own)...
                </option>
              </select>
              {newDepartmentSelect === CUSTOM_ROLE_SENTINEL && (
                <input
                  type="text"
                  required
                  placeholder="Type custom role (e.g., Photography Lead)..."
                  aria-label="Custom role or squad for new task"
                  value={newCustomDepartment}
                  onChange={(e) => setNewCustomDepartment(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-indigo-50/40 border border-indigo-300 rounded-lg text-slate-900"
                />
              )}
            </div>
            <div className="lg:col-span-2 flex gap-2 items-start">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="4"
                aria-label="Assigned volunteers count"
                value={formatNumericInputValue(newVolunteerCount)}
                onChange={(e) => {
                  const { numericValue } = sanitizeNumericInput(e.target.value);
                  setNewVolunteerCount(numericValue);
                }}
                className="w-16 px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg"
              />
              <button
                type="submit"
                className="flex-1 px-3 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 cursor-pointer"
              >
                Save Task
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Main Split: Left 7 Cols (Coordinator Log + Volunteer Task List) | Right 5 Cols (AI Live Ops Briefing & Broadcasts) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Add Coordinator Log Entry (Supports Custom Name + Custom Role/Squad + Inline Edit of Existing Logs) */}
          <article
            aria-label="Live Coordinator Activity Log"
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  01. Add Coordinator Log Entry ({plan.coordinatorLogs.length}{' '}
                  Active Logs)
                </h2>
                <p className="text-xs text-slate-500">
                  Enter any coordinator name and choose a role from the menu or
                  type your own custom role — feeds into{' '}
                  <strong>&ldquo;Generate AI Executive Ops Briefing&rdquo;</strong>
                </p>
              </div>
              <span className="text-xs font-mono text-indigo-700">
                Custom Names &amp; Roles Enabled
              </span>
            </div>

            <form onSubmit={handleAppendLog} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label
                    htmlFor="log-author-input"
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                  >
                    Coordinator Name (Custom)
                  </label>
                  <input
                    id="log-author-input"
                    type="text"
                    aria-label="Coordinator Log Author"
                    value={logAuthorInput}
                    onChange={(e) => setLogAuthorInput(e.target.value)}
                    placeholder="Type coordinator name (e.g., Arjun, Priya)..."
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="log-squad-select"
                      className="block text-[11px] font-semibold text-slate-600"
                    >
                      Assigned Role / Squad (Menu or Custom)
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setLogSquadSelect((prev) =>
                          prev === CUSTOM_ROLE_SENTINEL
                            ? availableRoleOptions[0] || 'Technical & Lab Ops'
                            : CUSTOM_ROLE_SENTINEL
                        )
                      }
                      className="text-[11px] font-semibold text-indigo-700 hover:underline cursor-pointer"
                    >
                      {logSquadSelect === CUSTOM_ROLE_SENTINEL
                        ? 'Choose from Menu'
                        : '+ Type Custom Role'}
                    </button>
                  </div>
                  <select
                    id="log-squad-select"
                    aria-label="Coordinator Squad"
                    value={logSquadSelect}
                    onChange={(e) => setLogSquadSelect(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  >
                    {availableRoleOptions.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                    <option value={CUSTOM_ROLE_SENTINEL}>
                      + Custom Role / Squad (Type Your Own)...
                    </option>
                  </select>
                </div>
              </div>

              {logSquadSelect === CUSTOM_ROLE_SENTINEL && (
                <div className="flex flex-col sm:flex-row gap-2 p-2.5 rounded-lg bg-indigo-50/60 border border-indigo-200">
                  <input
                    id="log-custom-role-input"
                    type="text"
                    aria-label="Custom Coordinator Role or Squad"
                    value={logCustomSquadInput}
                    onChange={(e) => setLogCustomSquadInput(e.target.value)}
                    placeholder="Enter custom role or squad (e.g., Drone Arena Safety Lead, Photography Crew, Anchor Team)..."
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-indigo-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = logCustomSquadInput.trim();
                      if (!trimmed) return;
                      registerCustomRoleIfNeeded(trimmed);
                      setLogSquadSelect(trimmed);
                      setLogCustomSquadInput('');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-100 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    + Save Role to Menu
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  aria-label="Add Coordinator Log Entry"
                  placeholder='e.g., "AV vendor asked for 50% advance by Friday" or "CSE Seminar Hall projector repaired"'
                  value={logNoteInput}
                  onChange={(e) => setLogNoteInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
                <button
                  type="submit"
                  aria-label="Add Coordinator Log Entry"
                  className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 whitespace-nowrap shrink-0 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Coordinator Log Entry
                </button>
              </div>

              {/* Quick 1-Click Field Log Examples */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] font-medium text-slate-500">
                  Try an Example Note:
                </span>
                {[
                  'AV vendor asked for 50% advance by Friday',
                  'CSE Seminar Hall 104 projector repaired',
                  'Main Gate check-in desks ready for 09:00 AM',
                ].map((sampleText) => (
                  <button
                    key={sampleText}
                    type="button"
                    onClick={() => setLogNoteInput(sampleText)}
                    className="px-2 py-0.5 text-[11px] rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 cursor-pointer"
                  >
                    + &ldquo;{sampleText}&rdquo;
                  </button>
                ))}
              </div>
            </form>

            {plan.coordinatorLogs.length === 0 ? (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500 text-center">
                No coordinator logs yet. Add a note above with your own
                coordinator name and role (or click{' '}
                <strong>&ldquo;Load Sample Volunteer Data&rdquo;</strong> in the
                header if you want to preview sample logs).
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs max-h-64 overflow-y-auto pr-1">
                {plan.coordinatorLogs.map((log) => {
                  const isEditingThisLog = editingLogId === log.id;
                  return (
                    <div key={log.id} className="py-2.5 space-y-1.5">
                      {isEditingThisLog ? (
                        <div className="p-3 rounded-lg bg-slate-50 border border-indigo-200 space-y-2.5">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                Coordinator Name
                              </label>
                              <input
                                type="text"
                                aria-label="Edit log coordinator name"
                                value={editLogAuthor}
                                onChange={(e) => setEditLogAuthor(e.target.value)}
                                placeholder="Coordinator name..."
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                              />
                            </div>
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                                Role / Squad
                              </label>
                              <select
                                aria-label="Edit log role or squad"
                                value={editLogSquadSelect}
                                onChange={(e) =>
                                  setEditLogSquadSelect(e.target.value)
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                              >
                                {availableRoleOptions.map((dept) => (
                                  <option key={dept} value={dept}>
                                    {dept}
                                  </option>
                                ))}
                                <option value={CUSTOM_ROLE_SENTINEL}>
                                  + Custom Role / Squad...
                                </option>
                              </select>
                            </div>
                          </div>

                          {editLogSquadSelect === CUSTOM_ROLE_SENTINEL && (
                            <input
                              type="text"
                              aria-label="Edit log custom role"
                              value={editLogCustomSquad}
                              onChange={(e) =>
                                setEditLogCustomSquad(e.target.value)
                              }
                              placeholder="Type custom role or squad..."
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded-md"
                            />
                          )}

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                              Log Update Note
                            </label>
                            <input
                              type="text"
                              aria-label="Edit log note"
                              value={editLogNote}
                              onChange={(e) => setEditLogNote(e.target.value)}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                            />
                          </div>

                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingLogId(null)}
                              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveEditedLog(log)}
                              className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 cursor-pointer"
                            >
                              Save Name &amp; Role
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between gap-2 text-slate-500">
                            <span className="font-semibold text-slate-900">
                              {log.author} ·{' '}
                              <span className="text-indigo-700">
                                {log.squad}
                              </span>
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => startEditingLog(log)}
                                aria-label={`Edit coordinator name and role for log by ${log.author}`}
                                className="text-[11px] font-medium text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                                Edit Name/Role
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteCoordinatorLog(log.id)}
                                aria-label={`Delete log entry by ${log.author}`}
                                className="text-slate-400 hover:text-red-600 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <span className="font-mono">{log.timestamp}</span>
                            </div>
                          </div>
                          <p className="text-slate-700">{log.note}</p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          {/* Card 2: Volunteer Task List (With Inline Edit for Coordinator Name & Custom Role/Squad) */}
          <article
            aria-label="Volunteer Task Ownership Matrix"
            className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  02. Volunteer Squad Tasks ({plan.volunteerTasks.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Click <strong>&ldquo;Edit Name &amp; Role&rdquo;</strong> on
                  any task to customize the coordinator&apos;s name or assign a
                  custom role
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddTaskModal(true)}
                className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Task
              </button>
            </div>

            {plan.volunteerTasks.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-800">
                  No Volunteer Tasks Loaded Yet
                </p>
                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                  You can generate starter tasks based on your Intake Wizard
                  details (<strong>{plan.intake.festName}</strong> ·{' '}
                  {getEffectiveFestCategory(plan.intake)} ·{' '}
                  {plan.intake.eventLocality ?? 'Local Venue'}) and customize
                  every coordinator&apos;s name and role, add tasks manually, or
                  load the sample dataset.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={onGenerateTasksFromIntake}
                    className="px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate Tasks from My Intake Brief
                  </button>
                  <button
                    type="button"
                    onClick={onLoadSampleVolunteerData}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Load Sample Volunteer Data (Example)
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Simple Status Filter + Search */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div
                    role="group"
                    aria-label="Filter volunteer tasks by status"
                    className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-fit flex-wrap"
                  >
                    {(
                      [
                        'ALL',
                        'Blocked',
                        'In-Progress',
                        'Pending',
                        'Completed',
                      ] as const
                    ).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusFilter(status)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          statusFilter === status
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {status === 'ALL' ? 'All' : status}
                      </button>
                    ))}
                  </div>

                  <div className="relative flex-1 sm:max-w-xs">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="search"
                      aria-label="Search tasks by coordinator or code"
                      placeholder="Search task, coordinator, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                {/* Task Rows */}
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const nextStatus = cycleTaskStatus(task.status);
                    const isSelectedForOutreach =
                      selectedTaskForOutreach?.id === task.id;
                    const isEditingThisTask = editingTaskId === task.id;

                    return (
                      <div
                        key={task.id}
                        className={`p-4 rounded-lg border transition-colors space-y-2.5 ${
                          isSelectedForOutreach
                            ? 'border-indigo-600 bg-indigo-50/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="font-mono font-bold text-slate-900">
                              {task.taskCode}
                            </span>
                            <span>·</span>
                            <span className="font-medium text-indigo-700">
                              {task.department}
                            </span>
                            <span>·</span>
                            <span>{task.venueTrack}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                isEditingThisTask
                                  ? setEditingTaskId(null)
                                  : startEditingTask(task)
                              }
                              aria-label={`Edit coordinator name and role for ${task.taskCode}`}
                              className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              {isEditingThisTask ? (
                                <>
                                  <X className="w-3.5 h-3.5" />
                                  <span>Close</span>
                                </>
                              ) : (
                                <>
                                  <Pencil className="w-3.5 h-3.5" />
                                  <span>Edit Name &amp; Role</span>
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                onToggleTaskStatus(task.id, nextStatus)
                              }
                              aria-label={`Change status for ${task.taskCode} from ${task.status} to ${nextStatus}`}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer ${
                                task.status === 'Completed'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : task.status === 'In-Progress'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : task.status === 'Pending'
                                      ? 'bg-slate-100 text-slate-700 border-slate-300'
                                      : 'bg-red-50 text-red-800 border-red-200'
                              }`}
                            >
                              {task.status === 'Completed' && (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              {(task.status === 'In-Progress' ||
                                task.status === 'Pending') && (
                                <Clock className="w-3.5 h-3.5" />
                              )}
                              {task.status === 'Blocked' && (
                                <AlertOctagon className="w-3.5 h-3.5" />
                              )}
                              <span>{task.status}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onSelectTaskForOutreach(task)}
                              aria-label={`Draft Outreach Message for ${task.taskCode} ${task.coordinatorName}`}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-800 bg-slate-100 border border-slate-300 rounded-md hover:bg-slate-200 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                              <span>Draft Msg</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-sm font-semibold text-slate-900">
                          {task.title}
                        </p>

                        {isEditingThisTask ? (
                          <div className="p-3 rounded-lg bg-slate-50 border border-indigo-200 space-y-2.5 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Coordinator Name
                                </label>
                                <input
                                  type="text"
                                  aria-label={`Coordinator name for ${task.taskCode}`}
                                  value={editTaskCoordinatorName}
                                  onChange={(e) =>
                                    setEditTaskCoordinatorName(e.target.value)
                                  }
                                  placeholder="Type coordinator name..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                                />
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Role / Squad (Menu or Custom)
                                </label>
                                <select
                                  aria-label={`Role or squad for ${task.taskCode}`}
                                  value={editTaskRoleSelect}
                                  onChange={(e) =>
                                    setEditTaskRoleSelect(e.target.value)
                                  }
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md"
                                >
                                  {availableRoleOptions.map((dept) => (
                                    <option key={dept} value={dept}>
                                      {dept}
                                    </option>
                                  ))}
                                  <option value={CUSTOM_ROLE_SENTINEL}>
                                    + Custom Role / Squad...
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                                  Assigned Volunteers
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  aria-label={`Assigned volunteers for ${task.taskCode}`}
                                  value={formatNumericInputValue(
                                    editTaskVolunteerCount
                                  )}
                                  onChange={(e) => {
                                    const { numericValue } =
                                      sanitizeNumericInput(e.target.value);
                                    setEditTaskVolunteerCount(numericValue);
                                  }}
                                  placeholder="4"
                                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-slate-300 rounded-md"
                                />
                              </div>
                            </div>

                            {editTaskRoleSelect === CUSTOM_ROLE_SENTINEL && (
                              <div>
                                <label className="block text-[11px] font-semibold text-indigo-800 mb-1">
                                  Custom Role / Squad Name
                                </label>
                                <input
                                  type="text"
                                  aria-label={`Custom role for ${task.taskCode}`}
                                  value={editTaskCustomRole}
                                  onChange={(e) =>
                                    setEditTaskCustomRole(e.target.value)
                                  }
                                  placeholder="e.g., Photography & Media Crew, Security Marshall..."
                                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-indigo-300 rounded-md"
                                />
                              </div>
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => setEditingTaskId(null)}
                                className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-100 cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveEditedTask(task)}
                                className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 cursor-pointer"
                              >
                                Save Coordinator &amp; Role
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                            <div>
                              <span className="font-semibold text-slate-800">
                                Lead: {task.coordinatorName}
                              </span>
                              <span className="mx-1.5">·</span>
                              <span className="text-indigo-700 font-medium">
                                Role: {task.department}
                              </span>
                              <span className="mx-1.5">·</span>
                              <span>Window: {task.deadlineWindow}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-mono tabular-nums text-slate-700">
                              <Users className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {task.assignedVolunteersCount} Volunteers
                              </span>
                            </div>
                          </div>
                        )}

                        {task.bottleneckReason && (
                          <div
                            className={`text-xs rounded px-3 py-2 border ${
                              task.status === 'Blocked'
                                ? 'bg-red-50 border-red-200 text-red-900'
                                : 'bg-slate-50 border-slate-200 text-slate-700'
                            }`}
                          >
                            <strong className="font-semibold">
                              {task.status === 'Blocked'
                                ? 'Active Bottleneck: '
                                : 'Note: '}
                            </strong>
                            {task.bottleneckReason}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </article>
        </div>

        {/* Right Column: AI Live Ops Briefing + Ready-to-Send Broadcasts (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {!opsSummary ? (
            <article
              aria-label="AI Executive Operations Bottleneck Summary"
              className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    03. AI Executive Ops Briefing &amp; Broadcasts
                  </h2>
                  <p className="text-xs text-slate-500">
                    Clean state — generate when you are ready
                  </p>
                </div>
                <FileText className="w-4 h-4 text-indigo-600" />
              </div>

              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p className="font-semibold text-slate-900">
                  How this AI Briefing works:
                </p>
                <p>
                  1. Add a coordinator log entry on the left (e.g.,{' '}
                  <em>&ldquo;AV vendor asked for 50% advance by Friday&rdquo;</em>
                  ) or add your volunteer tasks.
                </p>
                <p>
                  2. Click <strong>&ldquo;Generate AI Executive Ops Briefing&rdquo;</strong>{' '}
                  below to get an instant summary of bottlenecks plus ready-to-copy
                  WhatsApp &amp; Email broadcasts.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={onRefreshOpsSummary}
                  disabled={isGeneratingSummary}
                  className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      isGeneratingSummary ? 'animate-spin' : ''
                    }`}
                  />
                  Generate AI Executive Ops Briefing
                </button>
                <button
                  type="button"
                  onClick={onLoadSampleVolunteerData}
                  className="py-2.5 px-3.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Load Intake Sample Data
                </button>
              </div>
            </article>
          ) : (
            <>
              {/* Card 1: Executive Ops Briefing */}
              <article
                aria-label="AI Executive Operations Bottleneck Summary"
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      AI Live Executive Ops Briefing
                    </h2>
                    <p className="text-xs text-slate-500 font-mono">
                      Synced with Intake ({plan.intake.festName}) ·{' '}
                      {opsSummary.generatedAt}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRefreshOpsSummary}
                    aria-label="Refresh AI Executive Ops Briefing from Intake and Logs"
                    className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Refresh
                  </button>
                </div>

                <div className="text-xs font-mono font-semibold text-indigo-800 bg-indigo-50/70 rounded-lg px-3 py-2">
                  {opsSummary.readinessScoreLabel}
                </div>

                {/* 1. Executive Progress Snapshot */}
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-slate-700">
                    01. Executive Progress Snapshot
                  </h3>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {opsSummary.executiveProgressSnapshot}
                  </p>
                </div>

                {/* 2. Critical Bottleneck & Clash Radar */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700">
                    02. Bottleneck &amp; Field Log Radar
                  </h3>
                  <p className="text-xs text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-lg">
                    {opsSummary.headlineBottleneck}
                  </p>
                  <ul className="space-y-1.5 text-xs text-slate-600 pt-1">
                    {opsSummary.criticalRisks.map((risk, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono font-bold text-red-600 shrink-0">
                          0{idx + 1}.
                        </span>
                        <span>{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 3. Next Coordinator Action Plan */}
                <div className="space-y-2 pt-3 border-t border-slate-100">
                  <h3 className="text-xs font-bold text-slate-700">
                    03. Immediate Coordinator Action Plan
                  </h3>
                  <div className="divide-y divide-slate-100">
                    {opsSummary.immediateNextActions.map((item, idx) => (
                      <div
                        key={idx}
                        className="py-2 first:pt-1 last:pb-0 text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between font-semibold text-slate-900">
                          <span>
                            0{idx + 1}. {item.owner} ({item.squad})
                          </span>
                          <span className="font-mono text-indigo-700">
                            {item.timeframe}
                          </span>
                        </div>
                        <p className="text-slate-600">{item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </article>

              {/* Card 2: Ready-to-Send Coordinator & Volunteer Broadcasts with Copy Message Button on Each */}
              <article
                aria-label="Ready-to-Send Coordinator and Volunteer Broadcasts"
                className="bg-white border border-slate-200 rounded-xl p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      04. AI-Generated WhatsApp &amp; Email Broadcasts
                    </h2>
                    <p className="text-xs text-slate-500">
                      Ready-to-send coordination messages with 1-click Copy
                    </p>
                  </div>
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>

                <div className="space-y-4">
                  {opsSummary.broadcasts.map((bItem, idx) => {
                    const isCopied = copiedBroadcastIdx === idx;
                    return (
                      <div
                        key={bItem.audience}
                        className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2.5 text-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <span className="font-bold text-slate-900">
                              {bItem.audience}
                            </span>
                            <span className="mx-1.5 text-slate-400">·</span>
                            <span className="font-mono text-indigo-700">
                              {bItem.channel}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleCopyBroadcast(idx)}
                            aria-label={`Copy Message for ${bItem.audience}`}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Message
                              </>
                            )}
                          </button>
                        </div>

                        <div className="font-semibold text-slate-900 bg-white px-2.5 py-1.5 rounded border border-slate-200">
                          {bItem.subjectLine}
                        </div>

                        <p className="text-slate-700 leading-relaxed whitespace-pre-line">
                          {bItem.messageBody}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Task-Specific Outreach Section */}
                {activeOutreachDraft && (
                  <div className="pt-4 border-t border-slate-200 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">
                        Task-Specific Message ({selectedTaskForOutreach?.taskCode})
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyOutreach}
                        aria-label="Copy Message for Selected Task Escalation"
                        className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md hover:bg-indigo-100 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        {isDraftingOutreach
                          ? 'Drafting...'
                          : copiedOutreach
                            ? 'Copied!'
                            : 'Copy Message'}
                      </button>
                    </div>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded">
                      {activeOutreachDraft.messageBody}
                    </p>
                  </div>
                )}
              </article>
            </>
          )}
        </div>
      </div>
    </section>
  );
};
