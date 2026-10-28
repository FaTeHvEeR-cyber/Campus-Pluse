export type WorkspaceId =
  | 'intake'
  | 'schedule-budget'
  | 'volunteer-ops'
  | 'crisis-simulator'
  | 'quote-comparator';

export type FestCategoryType =
  | 'Inter-College Tech Fest & Hackathon'
  | 'Multi-Department Annual Cultural & Tech Symposium'
  | 'Campus Developer Summit'
  | 'Community Innovation Fair'
  | 'Custom Category';

export type VenueType =
  | 'College Campus'
  | 'External Convention Center / Hotel'
  | 'Community Ground / Open-Air Venue'
  | 'Hybrid (Campus + External)';

export type BudgetCategory =
  | 'Stage, Sound & AV Rigging'
  | 'Hackathon Wi-Fi, Power & Lab Setup'
  | 'Catering, Stalls & Midnight Refreshments'
  | 'Swag, IDs, Certificates & Printing'
  | 'Judge Travel, Security & Hospitality'
  | 'Prize Pool & Contingency Buffer';

export type BudgetPriority = 'Must-Have' | 'Flexible' | 'Nice-to-Have';

export type QuoteStatusType = 'AI Estimate' | 'Confirmed Quote' | 'Overrun Risk';

export type TaskStatus = 'Completed' | 'In-Progress' | 'Pending' | 'Blocked';

export type SchedulePhase =
  | 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs'
  | 'Phase 2: AV/Network Infrastructure & Vendor Contracts'
  | 'Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster'
  | 'Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling';

export type DepartmentName =
  | 'Technical & Lab Ops'
  | 'Sponsorship & Finance'
  | 'Logistics & Food Committee'
  | 'Stage & PR Squad'
  | 'Registration & Hospitality Desk'
  | 'Core Executive'
  | 'Security & Crowd Control'
  | 'Media, Photography & Design'
  | 'Hospitality & Guest Escort'
  | (string & {});

export interface PriorityWeights {
  techInfraWifi: number;
  stageAvProduction: number;
  foodNightRefreshments: number;
  prizesSwag: number;
  guestJudgeHospitality: number;
}

export interface FestIntakeConfig {
  festName: string;
  festCategory: FestCategoryType;
  customCategory?: string;
  hostInstitution: string;
  venueType?: VenueType;
  eventLocality?: string;
  dates: string;
  startTime?: string;
  endTime?: string;
  weeksUntilFest: number;
  expectedFootfall: number;
  totalBudgetINR: number;
  activeVolunteerCoordinators: number;
  tracks: string[];
  concurrentVenueTracks: string[];
  overnightStayRequired: boolean;
  primaryVenues: string;
  sponsorTargetINR: number;
  priorityWeights: PriorityWeights;
  additionalContextNotes?: string;
}

export interface ClarifyingQuestion {
  id: string;
  category:
    | 'Campus Permissions'
    | 'Multi-Track Room Clashes'
    | 'Sponsor Timelines'
    | 'Overnight Logistics';
  question: string;
  whyItMatters: string;
  suggestedOptions: string[];
  answer: string;
}

export interface ScheduleNode {
  id: string;
  code: string;
  title: string;
  track: string;
  phase: SchedulePhase;
  tier: 'Critical-Path Approval' | 'Downstream Vendor/Volunteer';
  daySlot: string;
  venue: string;
  ownerCoordinator: string;
  department: DepartmentName;
  dependsOnIds: string[];
  status: TaskStatus;
  blockedIfDelayedWarning: string;
  blockerNote?: string;
}

export interface BudgetLineItem {
  id: string;
  category: BudgetCategory;
  itemTitle: string;
  track: string;
  priority: BudgetPriority;
  aiEstimateINR: number;
  confirmedQuoteINR: number | null;
  quoteStatus: QuoteStatusType;
  lockedVendorName?: string;
  lockedVendorId?: string;
  sponsorBackedINR: number;
  notes: string;
}

export interface VolunteerTask {
  id: string;
  taskCode: string;
  title: string;
  coordinatorName: string;
  coordinatorRole: string;
  department: DepartmentName;
  assignedVolunteersCount: number;
  status: TaskStatus;
  priority: 'Critical' | 'High' | 'Standard';
  deadlineWindow: string;
  venueTrack: string;
  linkedScheduleId?: string;
  bottleneckReason?: string;
  contactChannel: string;
}

export interface CoordinatorLogEntry {
  id: string;
  timestamp: string;
  author: string;
  squad: DepartmentName;
  note: string;
}

export interface BroadcastDraftItem {
  audience:
    | 'Volunteer Leads'
    | "University Faculty Advisors / Dean's Office"
    | 'Pending Vendors / Sponsors';
  channel: 'WhatsApp Squad Broadcast' | 'Official Dean/Faculty Email' | 'Vendor SLA Escalation';
  subjectLine: string;
  messageBody: string;
}

export interface ExecutiveOpsSummary {
  generatedAt: string;
  readinessScoreLabel: string;
  executiveProgressSnapshot: string;
  headlineBottleneck: string;
  criticalRisks: string[];
  immediateNextActions: {
    owner: string;
    squad: string;
    action: string;
    timeframe: string;
  }[];
  broadcasts: BroadcastDraftItem[];
}

export interface OutreachDraft {
  recipientName: string;
  recipientRole: string;
  channel:
    | 'WhatsApp Squad Broadcast'
    | 'Official Dean/Faculty Email'
    | 'Vendor SLA Escalation';
  subjectLine: string;
  messageBody: string;
  actionChecklist: string[];
}

export interface CrisisScenario {
  id: string;
  title: string;
  category:
    | 'Footfall Surge'
    | 'Sponsor Cashflow'
    | 'Venue Clash'
    | 'Workforce Attrition';
  triggerDescription: string;
  severityLabel: 'High Impact Shock' | 'Critical Path Shock';
  impactSummary: string;
}

export interface CrisisTradeOffOption {
  id: string;
  optionLabel: string;
  strategyTitle: string;
  summary: string;
  budgetDeltaINR: number;
  targetBudgetCategory: BudgetCategory;
  scheduleAdjustment: string;
  affectedScheduleId?: string;
  volunteerReallocation: string;
  affectedTaskId?: string;
  riskTradeOff: string;
  recommended?: boolean;
}

export interface CrisisSimulationResult {
  scenarioId: string;
  scenarioTitle: string;
  rippleAnalysis: string;
  impactedCategories: BudgetCategory[];
  impactedVenueTracks: string[];
  impactedSquads: DepartmentName[];
  beforeFootfall: number;
  afterFootfall: number;
  ProjectedUnmitigatedOverrunINR: number;
  options: CrisisTradeOffOption[];
}

export interface VendorQuote {
  id: string;
  category: BudgetCategory;
  vendorName: string;
  totalQuoteINR: number;
  gstIncluded: boolean;
  advancePaymentPercent: number;
  paymentTerms: string;
  deliveryLeadTime: string;
  inclusions: string[];
  hiddenCostsGeneratorCharges: string;
  slaGuarantee: string;
  campusPastTrackRecord: string;
  budgetFitScore: number;
  campusReliabilityScore: number;
  hiddenCostRisk: 'Low' | 'Moderate' | 'High';
  negotiationTip: string;
  aiRecommendationNote: string;
}

export interface AppliedShockLog {
  id: string;
  timestamp: string;
  scenarioTitle: string;
  chosenStrategy: string;
  budgetDeltaINR: number;
  scheduleNote: string;
  volunteerNote: string;
}

export interface FestMasterPlan {
  intake: FestIntakeConfig;
  clarifyingQuestions: ClarifyingQuestion[];
  schedule: ScheduleNode[];
  budget: BudgetLineItem[];
  volunteerTasks: VolunteerTask[];
  coordinatorLogs: CoordinatorLogEntry[];
  vendorQuotes: VendorQuote[];
  appliedShocks: AppliedShockLog[];
  lastUpdatedISO: string;
}
