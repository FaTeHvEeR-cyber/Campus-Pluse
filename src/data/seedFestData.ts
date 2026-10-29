import type {
  CrisisScenario,
  CrisisSimulationResult,
  ExecutiveOpsSummary,
  FestIntakeConfig,
  FestMasterPlan,
  OutreachDraft,
} from '../types';

export const PRESET_DEMO_SCENARIOS: {
  id: 'technoverse' | 'synergy' | 'devdays';
  buttonLabel: string;
  shortTitle: string;
  config: FestIntakeConfig;
}[] = [
  {
    id: 'technoverse',
    buttonLabel:
      "TechnoVerse '26 • ₹4,50,000 Budget • 500 Attendees • 36-Hr Hackathon + 6 Tech Tracks • 4 Weeks Out",
    shortTitle: "TechnoVerse '26 (₹4.5L · 500 Pax · 36-Hr Hackathon)",
    config: {
      festName: "TechnoVerse '26 — 36-Hr Hackathon & 6-Track Tech Symposium",
      festCategory: 'Inter-College Tech Fest & Hackathon',
      customCategory: '',
      hostInstitution: 'Institute Technical Society & CSE Department',
      venueType: 'College Campus',
      eventLocality: 'Main Campus, Powai, Mumbai',
      dates: 'Nov 20–22, 2026',
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      weeksUntilFest: 4,
      expectedFootfall: 500,
      totalBudgetINR: 450000,
      activeVolunteerCoordinators: 32,
      tracks: [
        '36-Hr GenAI & Systems Hackathon',
        'Autonomous Robotics & Drone Track',
        'Cybersecurity CTF Arena',
        'Cloud & DevOps Workshop Track',
        'FinTech Product Pitch Track',
        'Hardware & IoT Build Track',
      ],
      concurrentVenueTracks: [
        'Main Auditorium (Room 101)',
        'CSE Lab Block A (Rooms 201–204)',
        'Central Lawn Robotics Arena',
        'CSE Seminar Halls 104 & 105',
      ],
      overnightStayRequired: true,
      primaryVenues:
        'Main Auditorium (Room 101), CSE Lab Block A (Rooms 201–204), Central Lawn Robotics Arena, CSE Seminar Halls 104 & 105',
      sponsorTargetINR: 300000,
      priorityWeights: {
        techInfraWifi: 95,
        stageAvProduction: 75,
        foodNightRefreshments: 90,
        prizesSwag: 80,
        guestJudgeHospitality: 70,
      },
    },
  },
  {
    id: 'synergy',
    buttonLabel:
      'Synergy Inter-College Fest • ₹8,00,000 Budget • 1,200 Attendees • Cultural + Robotics + Gaming • 6 Weeks Out',
    shortTitle: 'Synergy Fest (₹8.0L · 1,200 Pax · Cultural + Robotics)',
    config: {
      festName: 'Synergy 2026 — Annual Inter-College Cultural, Robotics & Gaming Fest',
      festCategory: 'Multi-Department Annual Cultural & Tech Symposium',
      customCategory: '',
      hostInstitution: 'University Student Gymkhana & Cultural Council',
      venueType: 'College Campus',
      eventLocality: 'South Campus Gymkhana Grounds, Pune',
      dates: 'Dec 04–06, 2026',
      startTime: '10:00 AM',
      endTime: '10:00 PM',
      weeksUntilFest: 6,
      expectedFootfall: 1200,
      totalBudgetINR: 800000,
      activeVolunteerCoordinators: 48,
      tracks: [
        'RoboWars 30kg Combat Arena',
        'Pro-Night Battle of Bands & EDM',
        'Valorant & E-Sports LAN Championship',
        'Street Dance & Choreography Showcase',
      ],
      concurrentVenueTracks: [
        'Main Auditorium (Room 101)',
        'Central Lawn Concert Stage',
        'CSE Lab Block A (Rooms 201–204 LAN Bay)',
        'SAC Indoor Arena (Room G-04)',
      ],
      overnightStayRequired: true,
      primaryVenues:
        'Main Auditorium (Room 101), Central Lawn Concert Stage, CSE Lab Block A (Rooms 201–204 LAN Bay), SAC Indoor Arena (Room G-04)',
      sponsorTargetINR: 550000,
      priorityWeights: {
        techInfraWifi: 80,
        stageAvProduction: 95,
        foodNightRefreshments: 85,
        prizesSwag: 85,
        guestJudgeHospitality: 80,
      },
    },
  },
  {
    id: 'devdays',
    buttonLabel:
      'Dev Days Community Summit • ₹1,50,000 Budget • 250 Attendees • Single-Day Workshop & Pitch Fest • 3 Weeks Out',
    shortTitle: 'Dev Days Summit (₹1.5L · 250 Pax · 1-Day Pitch Fest)',
    config: {
      festName: 'Dev Days Community Summit — Open Source & Startup Pitch Fest',
      festCategory: 'Campus Developer Summit',
      customCategory: '',
      hostInstitution: 'Campus Developer Student Club & E-Cell',
      venueType: 'Hybrid (Campus + External)',
      eventLocality: 'Innovation Park, HSR Layout, Bengaluru',
      dates: 'Nov 14, 2026',
      startTime: '08:30 AM',
      endTime: '08:00 PM',
      weeksUntilFest: 3,
      expectedFootfall: 250,
      totalBudgetINR: 150000,
      activeVolunteerCoordinators: 20,
      tracks: [
        'Hands-On AI Engineering Workshop',
        'Inter-College Startup Pitch Finale',
        'Open-Source Maintainer Lightning Talks',
      ],
      concurrentVenueTracks: [
        'Main Auditorium (Room 101)',
        'CSE Seminar Halls 104 & 105',
        'Innovation Atrium Stalls (Block B Foyer)',
      ],
      overnightStayRequired: false,
      primaryVenues:
        'Main Auditorium (Room 101), CSE Seminar Halls 104 & 105, Innovation Atrium Stalls (Block B Foyer)',
      sponsorTargetINR: 100000,
      priorityWeights: {
        techInfraWifi: 90,
        stageAvProduction: 65,
        foodNightRefreshments: 75,
        prizesSwag: 80,
        guestJudgeHospitality: 85,
      },
    },
  },
];

export const CLEAN_INITIAL_MASTER_PLAN: FestMasterPlan = {
  intake: {
    festName: 'Campus Innovation & Cultural Fest 2026',
    festCategory: 'Inter-College Tech Fest & Hackathon',
    customCategory: '',
    hostInstitution: 'Student Organizing Committee',
    venueType: 'College Campus',
    eventLocality: 'Main Campus, Powai, Mumbai',
    dates: 'Nov 20, 2026',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    weeksUntilFest: 4,
    expectedFootfall: 300,
    totalBudgetINR: 250000,
    activeVolunteerCoordinators: 16,
    tracks: ['Main Track & Keynote', 'Hands-On Workshop & Competition'],
    concurrentVenueTracks: ['Main Auditorium', 'Seminar Hall 1'],
    overnightStayRequired: false,
    primaryVenues: 'Main Auditorium, Seminar Hall 1',
    sponsorTargetINR: 150000,
    priorityWeights: {
      techInfraWifi: 85,
      stageAvProduction: 75,
      foodNightRefreshments: 80,
      prizesSwag: 75,
      guestJudgeHospitality: 70,
    },
  },
  clarifyingQuestions: [
    {
      id: 'cq-clean-1',
      category: 'Campus Permissions',
      question:
        'What venue permissions or facility approvals are needed for your selected location and event timings?',
      whyItMatters:
        'Securing venue and sound permissions early prevents last-minute timing or gate restrictions.',
      suggestedOptions: [
        'College Dean / Admin approval in progress',
        'External venue booking & local permit confirmed',
        'Single-day daytime event — standard hall booking only',
      ],
      answer: 'College Dean / Admin approval in progress',
    },
    {
      id: 'cq-clean-2',
      category: 'Multi-Track Room Clashes',
      question:
        'How will sessions be scheduled across your venues between start time and end time?',
      whyItMatters:
        'Staggering high-traffic sessions avoids audio overlap and Wi-Fi congestion.',
      suggestedOptions: [
        'Morning keynote in Main Auditorium; afternoon tracks in Seminar Hall',
        'Single main stage schedule with sequential sessions',
        'Parallel tracks with dedicated room coordinators',
      ],
      answer:
        'Morning keynote in Main Auditorium; afternoon tracks in Seminar Hall',
    },
    {
      id: 'cq-clean-3',
      category: 'Sponsor Timelines',
      question:
        'How is your event budget funded (college grant, ticket fees, or sponsor advances)?',
      whyItMatters:
        'Catering and sound vendors typically request 40–50% advance before event day.',
      suggestedOptions: [
        'Mix of sponsor cash + institute/organization budget',
        '100% funded by host institution / registration fees',
        'Sponsor advances expected 1 week before event',
      ],
      answer: 'Mix of sponsor cash + institute/organization budget',
    },
    {
      id: 'cq-clean-4',
      category: 'Overnight Logistics',
      question:
        'What food, refreshment, and guest hospitality arrangements are planned during event hours?',
      whyItMatters:
        'Matching meal slots to your start and end time keeps per-person catering costs predictable.',
      suggestedOptions: [
        'Lunch + afternoon tea/snacks during daytime hours',
        'Full-day meals + overnight hackathon refreshments',
        'Light snacks & beverage stalls only',
      ],
      answer: 'Lunch + afternoon tea/snacks during daytime hours',
    },
  ],
  schedule: [],
  budget: [],
  volunteerTasks: [],
  coordinatorLogs: [],
  vendorQuotes: [],
  appliedShocks: [],
  lastUpdatedISO: new Date().toISOString(),
};

export const INITIAL_FEST_MASTER_PLAN: FestMasterPlan = {
  intake: PRESET_DEMO_SCENARIOS[0].config,
  clarifyingQuestions: [
    {
      id: 'cq-1',
      category: 'Campus Permissions',
      question:
        'Has the Dean of Student Welfare (DSW) signed the post-23:00 overnight lab & hostel curfew waiver for 500 participants inside Lab Block A?',
      whyItMatters:
        'Without a stamped DSW curfew relaxation and Chief Warden endorsement 10 days prior, campus security locks Lab Block A gates at 22:30 IST, halting the 36-hour hackathon.',
      suggestedOptions: [
        'DSW waiver approved; Warden biometric roster pending',
        'Application submitted; awaiting Chief Proctor sign-off',
        'Restrict overnight access to single enclosed Lab Block A wing',
      ],
      answer: 'DSW waiver approved; Warden biometric roster pending',
    },
    {
      id: 'cq-2',
      category: 'Multi-Track Room Clashes',
      question:
        'How will 500 concurrent hackathon laptops in Lab Block A and acoustic spill on Central Lawn be isolated from University Mid-Sem Viva schedules?',
      whyItMatters:
        'Simultaneous Wi-Fi association of 500+ devices saturates default campus APs, and outdoor PA checks during exam hours trigger Registrar intervention.',
      suggestedOptions: [
        'Deploy 8 dedicated enterprise Wi-Fi 6 APs + silent PA curfew until 14:00 IST',
        'Shift Robotics arena to SAC Courtyard + dedicated 65kVA DG set',
        'Stagger keynote slots (10:00–13:00) and outdoor bouts (14:00–19:00)',
      ],
      answer:
        'Deploy 8 dedicated enterprise Wi-Fi 6 APs + silent PA curfew until 14:00 IST',
    },
    {
      id: 'cq-3',
      category: 'Sponsor Timelines',
      question:
        'What is the cash vs. in-kind split of the ₹3,00,000 sponsorship target, and how much liquid cash is in the Gymkhana account for pre-fest vendor advances?',
      whyItMatters:
        'Stage AV, generator, and catering vendors require 50% NEFT advance 72 hours prior to load-in, whereas cloud credits and post-event MoUs cannot pay upfront vendors.',
      suggestedOptions: [
        '70% Cash (₹2,10,000 in bank) + 30% Cloud/Swag In-Kind; ₹90,000 Net-15 invoice',
        '50% collected; requesting ₹75,000 bridge advance from Dean Finance',
        '85% realized via early-bird developer & stall tier sponsors',
      ],
      answer:
        '70% Cash (₹2,10,000 in bank) + 30% Cloud/Swag In-Kind; ₹90,000 Net-15 invoice',
    },
    {
      id: 'cq-4',
      category: 'Overnight Logistics',
      question:
        'What is the 02:00 IST midnight refreshment, backup 65kVA generator load, and medical responder plan for overnight hackathon & robotics squads?',
      whyItMatters:
        'Overnight participants require 02:00 IST hot snacks/chai, uninterrupted 3-phase power in Lab Block A, and gender-segregated rest rooms.',
      suggestedOptions: [
        'Night Canteen 02:00 IST buffer + 65kVA CPCB silent DG set + 200 hostel mattresses',
        'Partner with 2 nearby transit hostels + campus shuttle every 60 mins',
        'Convert Seminar Hall 3 into supervised quiet sleeping bay with campus ambulance on call',
      ],
      answer:
        'Night Canteen 02:00 IST buffer + 65kVA CPCB silent DG set + 200 hostel mattresses',
    },
  ],
  schedule: [
    // Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs
    {
      id: 'sched-cp-1',
      code: 'CP-01',
      title: 'Dean of Student Welfare (DSW) Master NOC & 36-Hr Lab Block A Curfew Waiver',
      track: '36-Hr GenAI & Systems Hackathon',
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: 'T-14 Days · 14:00 IST',
      venue: 'Admin Block Room 102',
      ownerCoordinator: 'Aarav Mehta',
      department: 'Core Executive',
      dependsOnIds: [],
      status: 'Completed',
      blockedIfDelayedWarning:
        'Halts all overnight Lab Block A access and invalidates Chief Warden hostel permit.',
    },
    {
      id: 'sched-cp-2',
      code: 'CP-02',
      title: 'Estate Office 65kVA 3-Phase Load Sanction & Backup DG Earthing NOC',
      track: 'Autonomous Robotics & Drone Track',
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: 'T-10 Days · 11:00 IST',
      venue: 'Campus Electrical Sub-Station',
      ownerCoordinator: 'Rohan Kulkarni',
      department: 'Technical & Lab Ops',
      dependsOnIds: ['sched-cp-1'],
      status: 'In-Progress',
      blockedIfDelayedWarning:
        'Blocks Stage AV load-in (OPS-01) and Lab Block A 500-laptop power strip energization (OPS-02).',
    },
    {
      id: 'sched-cp-3',
      code: 'CP-03',
      title: 'Chief Proctor & Fire Marshal Inspection for Robotics Arena & Main Auditorium',
      track: 'Autonomous Robotics & Drone Track',
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: 'T-7 Days · 16:00 IST',
      venue: 'Central Lawn & Main Auditorium',
      ownerCoordinator: 'Vikramaditya Nair',
      department: 'Registration & Hospitality Desk',
      dependsOnIds: ['sched-cp-1', 'sched-cp-2'],
      status: 'Blocked',
      blockedIfDelayedWarning:
        'Proctor will seal Robotics Combat Cage and deny gate entry for external college teams.',
      blockerNote:
        'Awaiting Estate Office earthing certificate (CP-02) before Fire Officer signs arena safety clearance.',
    },
    {
      id: 'sched-cp-4',
      code: 'CP-04',
      title: 'Gymkhana Finance Committee Purchase Order & Sponsor Escrow Sign-Off',
      track: 'FinTech Product Pitch Track',
      phase: 'Phase 1: University Approvals, Venue Lock & Core Sponsor MoUs',
      tier: 'Critical-Path Approval',
      daySlot: 'T-7 Days · 15:30 IST',
      venue: 'Gymkhana Treasury Office',
      ownerCoordinator: 'Ananya Iyer',
      department: 'Sponsorship & Finance',
      dependsOnIds: ['sched-cp-1'],
      status: 'Completed',
      blockedIfDelayedWarning:
        'Freezes 50% NEFT advance payouts to Stage AV and Catering vendors.',
    },
    // Phase 2: AV/Network Infrastructure & Vendor Contracts
    {
      id: 'sched-ops-1',
      code: 'OPS-01',
      title: 'Main Auditorium Line-Array PA, DMX Truss Rigging & P3 LED Backdrop Load-In',
      track: 'FinTech Product Pitch Track',
      phase: 'Phase 2: AV/Network Infrastructure & Vendor Contracts',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'T-2 Days · 20:00 IST',
      venue: 'Main Auditorium',
      ownerCoordinator: 'Kabir Deshmukh',
      department: 'Stage & PR Squad',
      dependsOnIds: ['sched-cp-2', 'sched-cp-4'],
      status: 'In-Progress',
      blockedIfDelayedWarning:
        'Delays Day-1 Inaugural Keynote and sponsor backdrop branding check.',
    },
    {
      id: 'sched-ops-2',
      code: 'OPS-02',
      title: 'Lab Block A Wi-Fi 6 High-Density AP Provisioning & 500-Port Power Daisy-Chain',
      track: '36-Hr GenAI & Systems Hackathon',
      phase: 'Phase 2: AV/Network Infrastructure & Vendor Contracts',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'T-1 Day · 14:00 IST',
      venue: 'Lab Block A (24x7 Hackathon Bay)',
      ownerCoordinator: 'Rohan Kulkarni',
      department: 'Technical & Lab Ops',
      dependsOnIds: ['sched-cp-1', 'sched-cp-2'],
      status: 'In-Progress',
      blockedIfDelayedWarning:
        'Causes immediate packet loss and breaker trips when 500 hackathon laptops connect simultaneously.',
    },
    // Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster
    {
      id: 'sched-ops-3',
      code: 'OPS-03',
      title: 'Outstation College RFID Badge Check-In, Swag Kit Handout & Hostel Allotment',
      track: '36-Hr GenAI & Systems Hackathon',
      phase: 'Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'Day 1 · 08:00 IST',
      venue: 'Main Gate Registration Canopy',
      ownerCoordinator: 'Vikramaditya Nair',
      department: 'Registration & Hospitality Desk',
      dependsOnIds: ['sched-cp-1'],
      status: 'Completed',
      blockedIfDelayedWarning:
        'Creates 90-minute queue spillover at Main Gate and delays hackathon problem statement release.',
    },
    {
      id: 'sched-ops-4',
      code: 'OPS-04',
      title: 'Robotics Safety Weigh-In, Fail-Safe Radio Interlock Test & Pit Allocation',
      track: 'Autonomous Robotics & Drone Track',
      phase: 'Phase 3: Inter-College PR, Registrations & Volunteer Shift Roster',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'Day 1 · 10:30 IST',
      venue: 'Central Lawn',
      ownerCoordinator: 'Sneha Reddy',
      department: 'Technical & Lab Ops',
      dependsOnIds: ['sched-cp-3'],
      status: 'Blocked',
      blockedIfDelayedWarning:
        'Pushes Quarter-Final Robotics bouts into evening curfew window.',
      blockerNote:
        'Blocked by CP-03 Fire Marshal polycarbonate cage inspection.',
    },
    // Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling
    {
      id: 'sched-ops-5',
      code: 'OPS-05',
      title: 'Industry CXO Keynote, Sponsor Booth Ribbon-Cutting & Live Pitch Finale',
      track: 'FinTech Product Pitch Track',
      phase: 'Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'Day 1 · 14:30 IST',
      venue: 'Main Auditorium',
      ownerCoordinator: 'Ananya Iyer',
      department: 'Sponsorship & Finance',
      dependsOnIds: ['sched-cp-1', 'sched-ops-1'],
      status: 'In-Progress',
      blockedIfDelayedWarning:
        'Breaches Title Sponsor MoU deliverable for main-stage keynote slot.',
    },
    {
      id: 'sched-ops-6',
      code: 'OPS-06',
      title: 'Midnight 02:00 IST Hackathon Fuel Counter, RedBull Drop & Medical Triage Shift',
      track: '36-Hr GenAI & Systems Hackathon',
      phase: 'Phase 4: Day-Of Run-of-Show & Parallel Track Scheduling',
      tier: 'Downstream Vendor/Volunteer',
      daySlot: 'Day 2 · 01:30 IST',
      venue: 'Lab Block A Atrium',
      ownerCoordinator: 'Kabir Deshmukh',
      department: 'Logistics & Food Committee',
      dependsOnIds: ['sched-cp-4', 'sched-ops-3'],
      status: 'Pending',
      blockedIfDelayedWarning:
        'Leaves 500 overnight hackers without midnight food/coffee during peak coding sprint.',
    },
  ],
  budget: [
    {
      id: 'b-1',
      category: 'Stage, Sound & AV Rigging',
      itemTitle: 'Main Auditorium Line-Array PA, P3 LED Backdrop, DMX Lighting & Collars',
      track: 'FinTech Product Pitch Track',
      priority: 'Must-Have',
      aiEstimateINR: 95000,
      confirmedQuoteINR: 88000,
      quoteStatus: 'Confirmed Quote',
      lockedVendorName: 'Decibel Pro Stageworks Pune',
      lockedVendorId: 'vq-av-1',
      sponsorBackedINR: 60000,
      notes: 'Includes 2 FOH engineers, cardioid sub-bass array, and backup digital mixer.',
    },
    {
      id: 'b-2',
      category: 'Hackathon Wi-Fi, Power & Lab Setup',
      itemTitle: '65kVA Silent DG Set, 8 Enterprise Wi-Fi 6 APs & 100 Industrial Spike Busters',
      track: '36-Hr GenAI & Systems Hackathon',
      priority: 'Must-Have',
      aiEstimateINR: 62000,
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: 45000,
      notes: 'Awaiting Estate Office earthing certificate CP-02 before locking VoltGuard quote.',
    },
    {
      id: 'b-3',
      category: 'Catering, Stalls & Midnight Refreshments',
      itemTitle: '500 Delegate Meals (2 Days) + 02:00 IST Hackathon Chai, Maggi & Snack Buffer',
      track: '36-Hr GenAI & Systems Hackathon',
      priority: 'Must-Have',
      aiEstimateINR: 115000,
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: 65000,
      notes: 'Compare Annapurna Caterers vs Metro Bite vs Hostel Co-Op in Quote Comparator.',
    },
    {
      id: 'b-4',
      category: 'Swag, IDs, Certificates & Printing',
      itemTitle: '240 GSM Bio-Wash Hackathon Tees, RFID Lanyards, Sticker Packs & Flex Standees',
      track: 'All Tracks · Delegate Kit',
      priority: 'Flexible',
      aiEstimateINR: 54000,
      confirmedQuoteINR: null,
      quoteStatus: 'AI Estimate',
      sponsorBackedINR: 40000,
      notes: 'Co-branded sleeve print required by Title Sponsor; can tier down for spot entries.',
    },
    {
      id: 'b-5',
      category: 'Judge Travel, Security & Hospitality',
      itemTitle: '12mm Polycarbonate Robotics Enclosure, 12 Security Marshals & Judge Guest House',
      track: 'Autonomous Robotics & Drone Track',
      priority: 'Must-Have',
      aiEstimateINR: 48000,
      confirmedQuoteINR: 45500,
      quoteStatus: 'Confirmed Quote',
      lockedVendorName: 'Apex Industrial Fabrication & SecuraForce',
      sponsorBackedINR: 30000,
      notes: 'Mandatory per Chief Proctor & Fire Marshal directive CP-03.',
    },
    {
      id: 'b-6',
      category: 'Prize Pool & Contingency Buffer',
      itemTitle: '6-Track Winner Cash Pool, Best Freshers Bounty & Emergency Reserve',
      track: 'All Tracks · Awards',
      priority: 'Nice-to-Have',
      aiEstimateINR: 65000,
      confirmedQuoteINR: 65000,
      quoteStatus: 'Confirmed Quote',
      lockedVendorName: 'Gymkhana Escrow NEFT Pool',
      sponsorBackedINR: 60000,
      notes: 'Disbursed via direct NEFT within 7 working days of valedictory.',
    },
  ],
  volunteerTasks: [
    {
      id: 'vt-1',
      taskCode: 'VOL-101',
      title: 'Obtain Estate Engineer Signature on 65kVA DG Earthing Log & Lab Block A Feeder',
      coordinatorName: 'Rohan Kulkarni',
      coordinatorRole: 'Technical & Lab Ops Lead',
      department: 'Technical & Lab Ops',
      assignedVolunteersCount: 6,
      status: 'Blocked',
      priority: 'Critical',
      deadlineWindow: 'Today · 16:00 IST',
      venueTrack: 'Lab Block A (24x7 Hackathon Bay)',
      linkedScheduleId: 'sched-cp-2',
      bottleneckReason:
        'Estate Sub-Divisional Officer is at North Campus site inspection until 15:00 IST; blocking CP-03 Fire Marshal sign-off.',
      contactChannel: '+91 98201-44102 · #tech-lab-ops',
    },
    {
      id: 'vt-2',
      taskCode: 'VOL-102',
      title: 'Complete Polycarbonate Seam Bolting & Emergency Cut-Off Switch Test',
      coordinatorName: 'Sneha Reddy',
      coordinatorRole: 'Robotics & Hardware Convener',
      department: 'Technical & Lab Ops',
      assignedVolunteersCount: 8,
      status: 'Blocked',
      priority: 'Critical',
      deadlineWindow: 'Today · 18:30 IST',
      venueTrack: 'Central Lawn',
      linkedScheduleId: 'sched-cp-3',
      bottleneckReason:
        'Cannot energize kill-switch test rig until VOL-101 3-phase feeder sanction is cleared.',
      contactChannel: '+91 98450-19283 · #robotics-pit-crew',
    },
    {
      id: 'vt-3',
      taskCode: 'VOL-103',
      title: 'Collect Pending ₹75,000 Tranche-2 NEFT UTR from Title Sponsor Finance Desk',
      coordinatorName: 'Ananya Iyer',
      coordinatorRole: 'Sponsorship & Finance Secretary',
      department: 'Sponsorship & Finance',
      assignedVolunteersCount: 4,
      status: 'In-Progress',
      priority: 'Critical',
      deadlineWindow: 'Tomorrow · 11:00 IST',
      venueTrack: 'Main Auditorium',
      linkedScheduleId: 'sched-ops-5',
      bottleneckReason:
        'Sponsor finance desk requested stamped GST exemption letter from Institute Registrar.',
      contactChannel: '+91 99104-88219 · #sponsor-escrow',
    },
    {
      id: 'vt-4',
      taskCode: 'VOL-104',
      title: 'Deploy 100 Spike Busters, 8 Wi-Fi 6 APs & Label Breakers in Lab Block A',
      coordinatorName: 'Rohan Kulkarni',
      coordinatorRole: 'Technical & Lab Ops Lead',
      department: 'Technical & Lab Ops',
      assignedVolunteersCount: 6,
      status: 'In-Progress',
      priority: 'High',
      deadlineWindow: 'Day 1 · 06:30 IST',
      venueTrack: 'Lab Block A (24x7 Hackathon Bay)',
      linkedScheduleId: 'sched-ops-2',
      contactChannel: '+91 98201-44102 · #tech-lab-ops',
    },
    {
      id: 'vt-5',
      taskCode: 'VOL-105',
      title: 'Staff Main Gate RFID Check-In Desks & Verify Outstation College IDs',
      coordinatorName: 'Vikramaditya Nair',
      coordinatorRole: 'Registration & Hospitality Lead',
      department: 'Registration & Hospitality Desk',
      assignedVolunteersCount: 5,
      status: 'Completed',
      priority: 'High',
      deadlineWindow: 'Day 1 · 08:00 IST',
      venueTrack: 'Main Auditorium',
      linkedScheduleId: 'sched-ops-3',
      contactChannel: '+91 97654-33011 · #gate-hospitality',
    },
    {
      id: 'vt-6',
      taskCode: 'VOL-106',
      title: 'Supervise Caterer Bulk Vessel Entry & Midnight 02:00 IST Hackathon Snack Buffer',
      coordinatorName: 'Kabir Deshmukh',
      coordinatorRole: 'Logistics & Food Committee Head',
      department: 'Logistics & Food Committee',
      assignedVolunteersCount: 5,
      status: 'Pending',
      priority: 'High',
      deadlineWindow: 'Day 1 · 23:30 IST',
      venueTrack: 'Lab Block A (24x7 Hackathon Bay)',
      linkedScheduleId: 'sched-ops-6',
      contactChannel: '+91 98112-77405 · #food-logistics',
    },
    {
      id: 'vt-7',
      taskCode: 'VOL-107',
      title: 'Main Auditorium Stage Cue-Sheet Sync & Sponsor Standee Placement',
      coordinatorName: 'Meera Krishnan',
      coordinatorRole: 'Stage & PR Squad Lead',
      department: 'Stage & PR Squad',
      assignedVolunteersCount: 4,
      status: 'In-Progress',
      priority: 'Standard',
      deadlineWindow: 'Day 1 · 09:00 IST',
      venueTrack: 'Main Auditorium',
      linkedScheduleId: 'sched-ops-1',
      contactChannel: '+91 98990-11223 · #stage-pr-squad',
    },
  ],
  coordinatorLogs: [
    {
      id: 'log-1',
      timestamp: '11:20 IST',
      author: 'Rohan Kulkarni',
      squad: 'Technical & Lab Ops',
      note: 'Tested 6 of 8 enterprise Wi-Fi 6 access points in Lab Block A; awaiting Estate SDO signature on 65kVA backup generator earthing log.',
    },
    {
      id: 'log-2',
      timestamp: '11:45 IST',
      author: 'Ananya Iyer',
      squad: 'Sponsorship & Finance',
      note: 'Registrar office stamped the educational GST exemption certificate; emailed to Title Sponsor finance controller for ₹75,000 tranche release.',
    },
    {
      id: 'log-3',
      timestamp: '12:10 IST',
      author: 'Vikramaditya Nair',
      squad: 'Registration & Hospitality Desk',
      note: 'Pre-printed 500 QR/RFID badges sorted by college contingent; 200 coir mattresses delivered to Visitors Hostel.',
    },
  ],
  vendorQuotes: [
    // Catering, Stalls & Midnight Refreshments (3 competing quotes)
    {
      id: 'vq-cat-1',
      category: 'Catering, Stalls & Midnight Refreshments',
      vendorName: 'Annapurna Institutional Caterers & Night Kitchen',
      totalQuoteINR: 106000,
      gstIncluded: true,
      advancePaymentPercent: 40,
      paymentTerms: '40% NEFT Advance · 60% T+3 Days Post-Fest',
      deliveryLeadTime: 'On-campus base kitchen · 20 mins buffer',
      inclusions: [
        '500 delegate buffet meals (2 Days) with Jain & Vegan counters',
        '02:00 IST Midnight Poha, Maggi & Masala Chai for 500 hackers',
        'Compostable birchwood cutlery & 6 uniformed serving stewards',
      ],
      hiddenCostsGeneratorCharges:
        'Zero hidden transport or gate entry fees; utilizes existing hostel kitchen LPG bank.',
      slaGuarantee: '₹10,000 penalty clause if any batch arrives >20 mins past slot',
      campusPastTrackRecord: 'Served 4 previous Gymkhana fests; valid FSSAI & Campus Gate Pass',
      budgetFitScore: 94,
      campusReliabilityScore: 96,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Offer exclusive paid food-stall space near Central Lawn in exchange for 50 complimentary judge high-tea boxes.',
      aiRecommendationNote:
        'Best overall value: Saves ₹9,000 below ₹1,15,000 AI Estimate with GST included and zero night-curfew truck risk.',
    },
    {
      id: 'vq-cat-2',
      category: 'Catering, Stalls & Midnight Refreshments',
      vendorName: 'Metro Bite Corporate & Event Hospitality',
      totalQuoteINR: 124000,
      gstIncluded: true,
      advancePaymentPercent: 60,
      paymentTerms: '60% Upfront Advance · 40% Before Day-2 Lunch',
      deliveryLeadTime: 'Off-campus commissary (14 km) · 45 mins transit',
      inclusions: [
        '500 boxed executive thalis + live pasta counter',
        'Midnight cold coffee & sandwich packs for 500 participants',
        'Stainless steel chaffing dishes & 10 stewards',
      ],
      hiddenCostsGeneratorCharges:
        '₹4,500 extra night-transport surcharge after 23:00 IST + requires 3kVA power tap for food warmers.',
      slaGuarantee: 'Standard replacement guarantee; no financial SLA deduction',
      campusPastTrackRecord: 'First-time campus vendor; requires temporary vehicle entry pass',
      budgetFitScore: 72,
      campusReliabilityScore: 78,
      hiddenCostRisk: 'High',
      negotiationTip:
        'Ask them to waive the ₹4,500 night-transport fee and cap advance at 40% to match campus purchase norms.',
      aiRecommendationNote:
        'Exceeds category AI estimate by ₹9,000 and carries main-gate commercial truck curfew risk at night.',
    },
    {
      id: 'vq-cat-3',
      category: 'Catering, Stalls & Midnight Refreshments',
      vendorName: 'Hostel Co-Op Mess & Nescafé Kiosk Consortium',
      totalQuoteINR: 94500,
      gstIncluded: false,
      advancePaymentPercent: 25,
      paymentTerms: '25% Internal Gymkhana Transfer · 75% Book Adjustment',
      deliveryLeadTime: 'Zero transit · Prepared in Hostel 4 Central Mess',
      inclusions: [
        '500 standard hostel special thalis served across 2 mess halls',
        'Midnight tea & samosa coupons redeemable at campus Nescafé kiosk',
        'Student volunteer coupon verification required',
      ],
      hiddenCostsGeneratorCharges:
        '5% GST applicable on external Nescafé kiosk redemption (+₹2,200); no disposables included.',
      slaGuarantee: 'Managed internally by Mess Secretary',
      campusPastTrackRecord: '100% resident reliability; limited VIP/Judge dining polish',
      budgetFitScore: 98,
      campusReliabilityScore: 91,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Lock this quote if sponsor cash is delayed, and book Faculty Guest House separately for 10 visiting judges.',
      aiRecommendationNote:
        'Lowest cost (saves ₹20,500 vs estimate), ideal for tight cashflow scenarios.',
    },
    // Swag, IDs, Certificates & Printing (2 competing quotes)
    {
      id: 'vq-swag-1',
      category: 'Swag, IDs, Certificates & Printing',
      vendorName: 'ThreadCraft Apparel & Merch Studio Tirupur',
      totalQuoteINR: 49500,
      gstIncluded: true,
      advancePaymentPercent: 50,
      paymentTerms: '50% Advance on Artwork Lock · 50% on Campus Delivery',
      deliveryLeadTime: '4 days express surface cargo to campus store',
      inclusions: [
        '500 × 240 GSM 100% combed cotton bio-wash tees (3-color puff print)',
        '500 satin multi-color lanyards with dual-hook PVC RFID badge holders',
        '30 laser-engraved acrylic speaker & judge plaques',
      ],
      hiddenCostsGeneratorCharges:
        'Zero hidden screen-setup charges; includes campus unloading.',
      slaGuarantee: '100% size-defect replacement + pre-dispatch video verification',
      campusPastTrackRecord: 'Supplied E-Summit & Inter-IIT contingent kits in 2025',
      budgetFitScore: 95,
      campusReliabilityScore: 94,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Request 25 extra volunteer crew tees free of cost by placing ThreadCraft logo on the registration backdrop.',
      aiRecommendationNote:
        'Saves ₹4,500 against AI Estimate with superior 240 GSM fabric and guaranteed sponsor sleeve logo fidelity.',
    },
    {
      id: 'vq-swag-2',
      category: 'Swag, IDs, Certificates & Printing',
      vendorName: 'PrintSprint Express Merch Hub',
      totalQuoteINR: 57500,
      gstIncluded: true,
      advancePaymentPercent: 50,
      paymentTerms: '50% Advance · 50% COD',
      deliveryLeadTime: '48 hours local rush delivery',
      inclusions: [
        '500 × 210 GSM poly-cotton tees + canvas tote bags',
        '500 printed NFC-enabled smart delegate cards',
        '30 wooden mementos',
      ],
      hiddenCostsGeneratorCharges:
        '₹2,500 rush plate-making fee if sponsor logos change within 72 hours of print.',
      slaGuarantee: 'Same-day reprint on misprints',
      campusPastTrackRecord: 'Local city vendor; reliable for last-minute rush orders',
      budgetFitScore: 79,
      campusReliabilityScore: 88,
      hiddenCostRisk: 'Moderate',
      negotiationTip:
        'Drop the canvas tote bags (-₹6,000) to bring the quote under the ₹54,000 AI Estimate.',
      aiRecommendationNote:
        '₹3,500 over AI estimate, but provides 48-hour rush turnaround if sponsor logo approvals run late.',
    },
    {
      id: 'vq-swag-3',
      category: 'Swag, IDs, Certificates & Printing',
      vendorName: 'CampusStore Co-Op Press & Khadi Merch Hub',
      totalQuoteINR: 44000,
      gstIncluded: true,
      advancePaymentPercent: 25,
      paymentTerms: '25% Advance · 75% Gymkhana Book Transfer',
      deliveryLeadTime: 'On-campus Printing Block Room G-12 · 24h buffer',
      inclusions: [
        '500 × 200 GSM bio-wash cotton crew tees (2-color screen print)',
        '500 laminated QR delegate passes with satin college lanyards',
        '30 framed certificates & brass-finish mementos for Seminar Hall 104 judges',
      ],
      hiddenCostsGeneratorCharges:
        'Zero delivery or gate entry charges; printed inside Campus Press Room G-12.',
      slaGuarantee: 'Managed with Student Publication Secretary oversight',
      campusPastTrackRecord: 'Handled 12+ department symposiums & convocation kits',
      budgetFitScore: 98,
      campusReliabilityScore: 92,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Best budget saver (saves ₹10,000 vs AI Estimate); upgrade 35 coordinator tees to polo collars for +₹1,500.',
      aiRecommendationNote:
        'Lowest cost option saving ₹10,000 below estimate with zero external courier delay risk.',
    },
    // Hackathon Wi-Fi, Power & Lab Setup (3 competing quotes)
    {
      id: 'vq-pow-1',
      category: 'Hackathon Wi-Fi, Power & Lab Setup',
      vendorName: 'VoltGuard Industrial Rentals & NetWorks',
      totalQuoteINR: 58000,
      gstIncluded: true,
      advancePaymentPercent: 30,
      paymentTerms: '30% Advance · 70% Post-Event Estate Sign-Off',
      deliveryLeadTime: 'Installed T-2 Days at CSE Lab Block A (Rooms 201–204)',
      inclusions: [
        '65kVA CPCB-II silent diesel generator with 180L HSD fuel buffer',
        '8 Ruckus Enterprise Wi-Fi 6 access points + PoE switch rental',
        '100 heavy-duty 6-socket surge strips with 2 licensed wiremen 24×7',
      ],
      hiddenCostsGeneratorCharges:
        'Includes 180L diesel (covers 36 hours at 75% load); extra fuel billed at actual pump receipt.',
      slaGuarantee: 'Auto-changeover <15 seconds; standby 25kVA backup unit on trailer',
      campusPastTrackRecord: 'Approved on Estate Office empanelled contractor list',
      budgetFitScore: 96,
      campusReliabilityScore: 98,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Use their Estate Office empanelment certificate to immediately clear CP-02 earthing sign-off today.',
      aiRecommendationNote:
        'Empanelled with Campus Estate Office—accelerates CP-02 earthing sign-off and saves ₹4,000.',
    },
    {
      id: 'vq-pow-2',
      category: 'Hackathon Wi-Fi, Power & Lab Setup',
      vendorName: 'Surya Gensets & Event Electrics',
      totalQuoteINR: 51000,
      gstIncluded: false,
      advancePaymentPercent: 50,
      paymentTerms: '50% Advance · Diesel Billed Extra Per Hour',
      deliveryLeadTime: 'Day-0 Morning Load-In',
      inclusions: [
        '62.5kVA diesel generator (base rental only; fuel excluded)',
        '80 standard 4-way extension boxes for Lab Block A Rooms 201–204',
        '1 shift technician',
      ],
      hiddenCostsGeneratorCharges:
        'Excludes diesel (~₹16,000 for 36 hrs) and 18% GST (+₹9,180), pushing real cost to ₹76,180!',
      slaGuarantee: '2-hour callout replacement',
      campusPastTrackRecord: 'Non-empanelled; requires extra Estate SDO inspection',
      budgetFitScore: 62,
      campusReliabilityScore: 70,
      hiddenCostRisk: 'High',
      negotiationTip:
        'Avoid unless they cap total all-inclusive diesel + GST price below ₹58,000 in writing.',
      aiRecommendationNote:
        'High Hidden-Cost Trap: Base quote looks ₹7,000 cheaper, but excluded diesel and GST cause a ₹14,180 overrun.',
    },
    {
      id: 'vq-pow-3',
      category: 'Hackathon Wi-Fi, Power & Lab Setup',
      vendorName: 'NetGrid Campus Fiber & Kirloskar Power Systems',
      totalQuoteINR: 61500,
      gstIncluded: true,
      advancePaymentPercent: 35,
      paymentTerms: '35% NEFT Advance · 65% T+5 Days',
      deliveryLeadTime: 'T-2 Days Load-In at Sub-Station & Lab Block A',
      inclusions: [
        '80kVA Kirloskar Silent DG Set with 200L diesel included',
        '10 Ubiquiti UniFi Wi-Fi 6 Pro APs + 1Gbps dedicated load balancer',
        '120 industrial MCB-protected power strips across Rooms 201–204',
      ],
      hiddenCostsGeneratorCharges:
        '₹2,000 crane unloading charge if crane gate pass is delayed past 18:00 IST.',
      slaGuarantee: '99.99% uptime SLA with 3 on-site network & electrical engineers',
      campusPastTrackRecord: 'Powered Smart India Hackathon Nodal Center in 2025',
      budgetFitScore: 91,
      campusReliabilityScore: 96,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Ideal if hackathon registration surges to 650 participants requiring 120 power strips.',
      aiRecommendationNote:
        '₹500 under AI Estimate with highest 80kVA headroom and 10 Wi-Fi 6 Pro APs.',
    },
    // Stage, Sound & AV Rigging (3 competing quotes)
    {
      id: 'vq-av-1',
      category: 'Stage, Sound & AV Rigging',
      vendorName: 'Decibel Pro Stageworks Pune',
      totalQuoteINR: 88000,
      gstIncluded: true,
      advancePaymentPercent: 50,
      paymentTerms: '50% Advance · 50% After Valedictory',
      deliveryLeadTime: 'Load-in T-1 Day 20:00 IST at Main Auditorium (Room 101)',
      inclusions: [
        'JBL VTX Line Array (8 tops + 6 dual-18 subs) + Midas M32 Console',
        '20ft × 10ft P3 Indoor/Outdoor LED Wall with Novastar processor',
        'Acoustic directional cardioid sub-array to prevent exam hall spill',
      ],
      hiddenCostsGeneratorCharges:
        'All cabling, rigging crew meals, and transport included in lump sum.',
      slaGuarantee: 'Redundant processor + 2 FOH engineers on site throughout fest',
      campusPastTrackRecord: 'Locked vendor for TechnoVerse 2024 & 2025',
      budgetFitScore: 95,
      campusReliabilityScore: 97,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Already locked at ₹7,000 below AI Estimate; confirm free lectern mic backup for CSE Seminar Hall 104.',
      aiRecommendationNote:
        'Currently locked quote (₹7,000 under estimate); cardioid sub-array directly mitigates multi-track acoustic spill.',
    },
    {
      id: 'vq-av-2',
      category: 'Stage, Sound & AV Rigging',
      vendorName: 'SonicBoom Concert Production',
      totalQuoteINR: 79000,
      gstIncluded: true,
      advancePaymentPercent: 40,
      paymentTerms: '40% Advance · 60% Day-1 Evening',
      deliveryLeadTime: 'Load-in Day 1 06:00 IST',
      inclusions: [
        'Standard RCF Line Array (6 tops + 4 subs)',
        '16ft × 8ft P4 LED Backdrop for Main Auditorium Room 101',
        '1 FOH engineer + 4 wireless lapel mics',
      ],
      hiddenCostsGeneratorCharges:
        'Charges ₹5,000 overtime if valedictory ceremony extends past 21:30 IST.',
      slaGuarantee: 'Standard equipment backup',
      campusPastTrackRecord: 'Used for smaller department freshers events',
      budgetFitScore: 89,
      campusReliabilityScore: 84,
      hiddenCostRisk: 'Moderate',
      negotiationTip:
        'Viable fallback if sponsorship cashflow tightens and ₹9,000 stage savings are required.',
      aiRecommendationNote:
        'Saves ₹9,000 vs Decibel Pro if stage LED wall size is trimmed during a cashflow crunch.',
    },
    {
      id: 'vq-av-3',
      category: 'Stage, Sound & AV Rigging',
      vendorName: 'AuraVisuals Arena & NDI Broadcast Systems',
      totalQuoteINR: 93500,
      gstIncluded: true,
      advancePaymentPercent: 45,
      paymentTerms: '45% Advance · 55% Post-Valedictory',
      deliveryLeadTime: 'Load-in T-1 Day 18:00 IST across Room 101 & Seminar Halls 104–105',
      inclusions: [
        'd&b audiotechnik Line Array + 22ft P2.6 high-refresh LED Backdrop',
        'Zero-latency NDI fiber video simulcast link to CSE Seminar Halls 104 & 105',
        '3-camera PTZ live YouTube/Discord stream setup + 2 FOH engineers',
      ],
      hiddenCostsGeneratorCharges:
        'Zero hidden charges; includes 100m armored SDI/fiber reel between Auditorium Room 101 and Seminar Hall 104.',
      slaGuarantee: 'Full dual-UPS broadcast redundancy',
      campusPastTrackRecord: 'Handled Annual Convocation & TEDxUniversity',
      budgetFitScore: 91,
      campusReliabilityScore: 98,
      hiddenCostRisk: 'Low',
      negotiationTip:
        'Switch to AuraVisuals if Main Auditorium double-booking requires NDI simulcast to Seminar Halls 104 & 105.',
      aiRecommendationNote:
        '₹1,500 below AI Estimate and includes built-in NDI multi-room simulcast across Seminar Halls 104 & 105.',
    },
  ],
  appliedShocks: [],
  lastUpdatedISO: '2026-10-27T12:25:00.000Z',
};

export const PRESET_CRISIS_SCENARIOS: CrisisScenario[] = [
  {
    id: 'crisis-reg-surge',
    title: 'Registration Surge: +150 Last-Minute Inter-College Participants Added',
    category: 'Footfall Surge',
    triggerDescription:
      '150 additional pre-qualified inter-college participants arrived via spot-qualifier partner colleges, pushing total footfall by +150 and spiking Lab Block A Wi-Fi/power and midnight catering load.',
    severityLabel: 'High Impact Shock',
    impactSummary:
      'Creates immediate deficit of 150 meals/night snacks (+₹18,500 pressure), 30 hackathon power ports in Lab Block A, and 150 delegate kits.',
  },
  {
    id: 'crisis-sponsor-delay',
    title:
      'Sponsorship Delay: Title Sponsor Delays ₹75,000 Tranche; Costs Run 20% Over Active Cash',
    category: 'Sponsor Cashflow',
    triggerDescription:
      'Title Sponsor confirmed their ₹75,000 tranche is stuck in quarterly vendor compliance and will clear 21 days post-fest, creating an immediate liquid cash deficit for upfront vendor advances.',
    severityLabel: 'Critical Path Shock',
    impactSummary:
      'Threatens 50% advance NEFT payouts for Catering and Stage AV vendors 48 hours before fest gates open.',
  },
  {
    id: 'crisis-auditorium-clash',
    title:
      'Venue Clash: Main Auditorium Double-Booked by University Admin for 4 Hours on Day 1',
    category: 'Venue Clash',
    triggerDescription:
      'University Admin requisitioned the Main Auditorium on Day 1 (13:00–17:00 IST) for an unscheduled Senate Convocation rehearsal, clashing directly with the Industry CXO Keynote & Pitch Finale (OPS-05).',
    severityLabel: 'Critical Path Shock',
    impactSummary:
      'Displaces 500 keynote attendees and sponsor showcase booths during peak Day-1 afternoon slot.',
  },
  {
    id: 'crisis-volunteer-dropout',
    title:
      'Volunteer Crunch: 6 Core Volunteers & Stage Lead Unavailable Due to Exam Rescheduling',
    category: 'Workforce Attrition',
    triggerDescription:
      'ECE & CSE departments scheduled an emergency make-up lab exam on Day 1 morning, pulling 6 core volunteers and the Stage Lead from Lab Block A Power Setup (VOL-104) and Main Auditorium Stage Cue Sync (VOL-107).',
    severityLabel: 'High Impact Shock',
    impactSummary:
      'Leaves Main Auditorium stage cueing and Lab Block A power daisy-chaining understaffed during critical Day-1 07:00–12:00 window.',
  },
];

export const DETERMINISTIC_CRISIS_RESULTS: Record<string, CrisisSimulationResult> = {
  'crisis-reg-surge': {
    scenarioId: 'crisis-reg-surge',
    scenarioTitle:
      'Registration Surge: +150 Last-Minute Inter-College Participants Added',
    rippleAnalysis:
      'Accommodating +150 inter-college participants increases peak Lab Block A power draw by 4.2 kVA, requires 300 additional meal plates + 02:00 IST snacks over 36 hours, and exceeds printed swag kit inventory by 150 units.',
    impactedCategories: [
      'Catering, Stalls & Midnight Refreshments',
      'Hackathon Wi-Fi, Power & Lab Setup',
      'Swag, IDs, Certificates & Printing',
    ],
    impactedVenueTracks: [
      'Lab Block A (24x7 Hackathon Bay)',
      'Seminar Halls 1–3',
    ],
    impactedSquads: [
      'Logistics & Food Committee',
      'Technical & Lab Ops',
      'Registration & Hospitality Desk',
    ],
    beforeFootfall: 500,
    afterFootfall: 650,
    ProjectedUnmitigatedOverrunINR: 31000,
    options: [
      {
        id: 'opt-surge-1',
        optionLabel: 'Strategy A · Absorb Within Buffer via Seminar Hall Spillover (Recommended)',
        strategyTitle:
          'Open Seminar Hall 1 Spillover Bay + Hostel Co-Op Meal Top-Up & Digital Certificates',
        summary:
          'Route 30 spot teams to Seminar Hall 1, cover +150 meals via Hostel Co-Op coupon add-on (+₹14,500), and issue verifiable digital certificates & QR passes instead of extra physical tees.',
        budgetDeltaINR: 14500,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment:
          'OPS-02 extended by 30 mins to lay 25 additional extension boards in Seminar Hall 1.',
        affectedScheduleId: 'sched-ops-2',
        volunteerReallocation:
          'Reassign 3 volunteers from completed Registration Desk (VOL-105) to Seminar Hall 1 floor marshaling.',
        affectedTaskId: 'vt-4',
        riskTradeOff:
          'Spot registrants receive digital kit & certificate rather than physical 240 GSM tee.',
        recommended: true,
      },
      {
        id: 'opt-surge-2',
        optionLabel: 'Strategy B · Zero-Budget Cap & Hybrid Cloud Sandbox',
        strategyTitle:
          'Cap Overnight Bay at 500 + Grant Day-Pass Keynote & Cloud Submission Rights',
        summary:
          'Keep Lab Block A overnight seating at 500; grant the +150 spot participants Day-Pass auditorium access + cloud-hosted hackathon submission rights with ₹0 net budget increase.',
        budgetDeltaINR: 0,
        targetBudgetCategory: 'Hackathon Wi-Fi, Power & Lab Setup',
        scheduleAdjustment:
          'OPS-03 adds separate Fast-Track Day-Pass wristband lane at 08:30 IST.',
        affectedScheduleId: 'sched-ops-3',
        volunteerReallocation:
          'Assign 2 Technical Ops volunteers (VOL-102) to Discord/GitHub remote submission verification.',
        affectedTaskId: 'vt-5',
        riskTradeOff:
          'Spot teams cannot stay overnight inside Lab Block A after 22:30 IST curfew.',
      },
      {
        id: 'opt-surge-3',
        optionLabel: 'Strategy C · Full VIP Parity Expansion',
        strategyTitle:
          'Full Caterer Top-Up + Rush PrintSprint Swag & 150 Extra Hostel Mattresses',
        summary:
          'Expand Annapurna Catering plate count, procure 150 rush tees via PrintSprint, and rent 150 extra mattresses in Visitors Block.',
        budgetDeltaINR: 31000,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment:
          'OPS-06 midnight canteen slot expanded with second serving counter at 01:15 IST.',
        affectedScheduleId: 'sched-ops-6',
        volunteerReallocation:
          'Mobilize 4 Food Committee volunteers (VOL-106) for second midnight meal queue.',
        affectedTaskId: 'vt-6',
        riskTradeOff:
          'Consumes 85% of remaining unallocated fest contingency buffer.',
      },
    ],
  },
  'crisis-sponsor-delay': {
    scenarioId: 'crisis-sponsor-delay',
    scenarioTitle:
      'Sponsorship Delay: Title Sponsor Delays ₹75,000 Tranche; Costs Run 20% Over Active Cash',
    rippleAnalysis:
      'A ₹75,000 liquidity gap 48 hours before fest launch jeopardizes upfront vendor advances for Catering and Stage AV while post-event prize transfers can safely wait 7–14 days.',
    impactedCategories: [
      'Catering, Stalls & Midnight Refreshments',
      'Stage, Sound & AV Rigging',
      'Prize Pool & Contingency Buffer',
    ],
    impactedVenueTracks: ['Main Auditorium', 'Lab Block A (24x7 Hackathon Bay)'],
    impactedSquads: ['Sponsorship & Finance', 'Logistics & Food Committee'],
    beforeFootfall: 500,
    afterFootfall: 500,
    ProjectedUnmitigatedOverrunINR: 75000,
    options: [
      {
        id: 'opt-spon-1',
        optionLabel: 'Strategy A · Cashflow Bridge & Vendor Re-Tier (Recommended)',
        strategyTitle:
          'Switch Catering to Hostel Co-Op Consortium (-₹20,500) + Defer Prize NEFT to T+14 Days',
        summary:
          'Lock Hostel Co-Op Mess Consortium (25% internal transfer vs 60% cash advance) saving ₹20,500 outright, and convert Winner Prize checks to ceremonial cheques with NEFT payout at T+14 days once sponsor funds clear.',
        budgetDeltaINR: -20500,
        targetBudgetCategory: 'Catering, Stalls & Midnight Refreshments',
        scheduleAdjustment:
          'CP-04 updated with revised Purchase Order splitting vendor advance 25% pre-fest / 75% T+14.',
        affectedScheduleId: 'sched-cp-4',
        volunteerReallocation:
          'Sponsorship squad (VOL-103) executes formal Net-14 promissory addendum with Gymkhana Treasurer.',
        affectedTaskId: 'vt-3',
        riskTradeOff:
          'Requires faculty guest house dining arrangement for 8 keynote VIPs.',
        recommended: true,
      },
      {
        id: 'opt-spon-2',
        optionLabel: 'Strategy B · Stage AV Spec Trim + Flexible Swag Reduction',
        strategyTitle:
          'Switch Stage AV to SonicBoom P4 Rig (-₹9,000) & Drop Printed Tote Bags (-₹5,000)',
        summary:
          'Re-lock Stage AV quote to SonicBoom Concert Production and trim non-essential printed flexes to preserve 100% of hackathon catering & Wi-Fi reliability.',
        budgetDeltaINR: -14000,
        targetBudgetCategory: 'Stage, Sound & AV Rigging',
        scheduleAdjustment:
          'OPS-01 load-in shifted to Day 1 · 05:30 IST (smaller rig requires 3 hrs fewer setup).',
        affectedScheduleId: 'sched-ops-1',
        volunteerReallocation:
          'Shift 2 Stage & PR volunteers from OPS-01 to sponsor stall branding.',
        affectedTaskId: 'vt-7',
        riskTradeOff:
          'Slightly smaller LED wall footprint (16ft vs 20ft) in Main Auditorium.',
      },
      {
        id: 'opt-spon-3',
        optionLabel: 'Strategy C · Emergency Mini-Sponsor Stall Bridge + Dean Corpus Loan',
        strategyTitle:
          'Onboard 2 Local EdTech Recruitment Stalls (-₹25,000 Net Cost) + Gymkhana Bridge',
        summary:
          'Sell 2 fast-track foyer recruitment tables at ₹12,500 each payable via instant UPI/IMPS and draw temporary corpus bridge against stamped Sponsor PO.',
        budgetDeltaINR: -25000,
        targetBudgetCategory: 'Prize Pool & Contingency Buffer',
        scheduleAdjustment:
          'Add 30-min Dean Finance signatory verification to CP-04 today at 17:00 IST.',
        affectedScheduleId: 'sched-cp-4',
        volunteerReallocation:
          'Sponsorship Secretary (VOL-103) allocates 2 foyer tables near Main Auditorium entrance.',
        affectedTaskId: 'vt-3',
        riskTradeOff: 'Requires mandatory faculty advisor counter-guarantee.',
      },
    ],
  },
  'crisis-auditorium-clash': {
    scenarioId: 'crisis-auditorium-clash',
    scenarioTitle:
      'Venue Clash: Main Auditorium Double-Booked by University Admin for 4 Hours on Day 1',
    rippleAnalysis:
      'Losing the Main Auditorium from 13:00 to 17:00 IST on Day 1 directly impacts OPS-05 (Industry CXO Keynote & Pitch Finale) and sponsor booth footfall, requiring either a Seminar Hall simulcast or twilight slot swap.',
    impactedCategories: [
      'Stage, Sound & AV Rigging',
      'Judge Travel, Security & Hospitality',
    ],
    impactedVenueTracks: ['Main Auditorium', 'Seminar Halls 1–3'],
    impactedSquads: [
      'Stage & PR Squad',
      'Sponsorship & Finance',
      'Registration & Hospitality Desk',
    ],
    beforeFootfall: 500,
    afterFootfall: 500,
    ProjectedUnmitigatedOverrunINR: 22000,
    options: [
      {
        id: 'opt-aud-1',
        optionLabel: 'Strategy A · Seminar Hall 1–2 NDI Simulcast (Recommended)',
        strategyTitle:
          'Shift Preliminary Pitches & CXO Panel to Seminar Halls 1+2 with Live NDI Video Relay',
        summary:
          'Host CXO Panel in tiered Seminar Hall 1 (280 cap) with zero-latency NDI video feed to Seminar Hall 2 (220 cap); resume Main Auditorium at 17:15 IST for Grand Finale (+₹4,500 SDI cabling).',
        budgetDeltaINR: 4500,
        targetBudgetCategory: 'Stage, Sound & AV Rigging',
        scheduleAdjustment:
          'OPS-05 venue updated to Seminar Halls 1 & 2 Simulcast (14:30–16:45 IST); Main Auditorium resumes at 17:15 IST.',
        affectedScheduleId: 'sched-ops-5',
        volunteerReallocation:
          'Deploy 4 Registration & Hospitality volunteers (VOL-105) as wayfinding marshals from Main Audi to Seminar Halls.',
        affectedTaskId: 'vt-7',
        riskTradeOff:
          'Requires 80m armored SDI/fiber cable run between Seminar Halls 1 and 2.',
        recommended: true,
      },
      {
        id: 'opt-aud-2',
        optionLabel: 'Strategy B · Evening Prime-Time Slot Compression (₹0 Extra Cost)',
        strategyTitle:
          'Move CXO Keynote & Pitch Finale to Day 1 · 17:30 IST Post-Rehearsal Slot',
        summary:
          'Keep Main Auditorium venue intact by shifting OPS-05 to 17:30–20:00 IST right after Admin rehearsal ends, guaranteeing a packed hall with zero extra AV rental.',
        budgetDeltaINR: 0,
        targetBudgetCategory: 'Stage, Sound & AV Rigging',
        scheduleAdjustment:
          'OPS-05 moved from 14:30 IST to 17:30 IST; evening cultural showcase compressed by 30 mins.',
        affectedScheduleId: 'sched-ops-5',
        volunteerReallocation:
          'Sponsorship crew (VOL-103) updates judge chauffeur airport pickup times by +2 hours.',
        affectedTaskId: 'vt-3',
        riskTradeOff:
          '1 visiting CXO panelist on a 20:15 IST return flight will join the first 45 mins only.',
      },
      {
        id: 'opt-aud-3',
        optionLabel: 'Strategy C · Covered Acoustic Pavilion on Central Lawn',
        strategyTitle:
          'Erect Temporary 500-Seat Truss Canopy Tent Next to Sponsor Arena',
        summary:
          'Hire rapid-deploy truss canopy with 6 tower coolers on Central Lawn to keep keynote and sponsor stalls unified outdoors.',
        budgetDeltaINR: 22000,
        targetBudgetCategory: 'Stage, Sound & AV Rigging',
        scheduleAdjustment:
          'OPS-01 overnight crew adds 4-hour canopy erection window (02:00–06:00 IST).',
        affectedScheduleId: 'sched-ops-1',
        volunteerReallocation:
          'Assign 5 Logistics & Stage volunteers (VOL-106, VOL-107) to overnight tent supervision.',
        affectedTaskId: 'vt-6',
        riskTradeOff:
          'High cost (+₹22,000) and requires Estate Lawn digging clearance.',
      },
    ],
  },
  'crisis-volunteer-dropout': {
    scenarioId: 'crisis-volunteer-dropout',
    scenarioTitle:
      'Volunteer Crunch: 6 Core Volunteers & Stage Lead Unavailable Due to Exam Rescheduling',
    rippleAnalysis:
      'Losing 6 core volunteers and the Stage Lead between 07:00 and 12:00 IST on Day 1 threatens Lab Block A power strip deployment (VOL-104) and Main Auditorium Stage Cue Sync (VOL-107).',
    impactedCategories: [
      'Hackathon Wi-Fi, Power & Lab Setup',
      'Judge Travel, Security & Hospitality',
    ],
    impactedVenueTracks: [
      'Lab Block A (24x7 Hackathon Bay)',
      'Main Auditorium',
    ],
    impactedSquads: [
      'Technical & Lab Ops',
      'Stage & PR Squad',
      'Registration & Hospitality Desk',
    ],
    beforeFootfall: 500,
    afterFootfall: 500,
    ProjectedUnmitigatedOverrunINR: 9500,
    options: [
      {
        id: 'opt-vol-1',
        optionLabel: 'Strategy A · Cross-Squad Shift Rotation + 2 Vendor Wiremen (Recommended)',
        strategyTitle:
          'Reassign 3 PR/Registration Volunteers to Stage Ops + Add 2 VoltGuard Wiremen',
        summary:
          'Once peak 08:00 IST gate check-in (VOL-105) stabilizes at 09:15 IST, rotate 3 Registration volunteers to Main Auditorium stage cueing and pay VoltGuard ₹3,500 for 2 licensed wiremen to finish Lab Block A power strips.',
        budgetDeltaINR: 3500,
        targetBudgetCategory: 'Hackathon Wi-Fi, Power & Lab Setup',
        scheduleAdjustment:
          'OPS-02 completed at 07:45 IST by professional wiremen; OPS-01 stage cue check led by Deputy PR Lead.',
        affectedScheduleId: 'sched-ops-2',
        volunteerReallocation:
          'Transfer 3 volunteers from VOL-105 (Registration) to VOL-107 (Stage Ops) & VOL-104 (Lab Ops).',
        affectedTaskId: 'vt-7',
        riskTradeOff:
          'Minor ₹3,500 vendor labor add-on; completely eliminates student electrical hazard.',
        recommended: true,
      },
      {
        id: 'opt-vol-2',
        optionLabel: 'Strategy B · Dean Academic Duty-Leave Staggered Viva Slot',
        strategyTitle:
          'Issue Official DSW Duty-Leave Memo for First-Batch 08:00–08:30 IST Viva',
        summary:
          'Coordinate with Faculty Advisor so the 6 volunteers and Stage Lead take their lab viva in the first 30-minute batch (08:00–08:30 IST) and return to fest duty by 08:45 IST with ₹0 budget impact.',
        budgetDeltaINR: 0,
        targetBudgetCategory: 'Judge Travel, Security & Hospitality',
        scheduleAdjustment:
          'OPS-04 Robotics weigh-in shifted by 30 mins (10:30 -> 11:00 IST).',
        affectedScheduleId: 'sched-ops-4',
        volunteerReallocation:
          'Core Executive delivers signed DSW duty-leave roster to ECE/CSE HODs today.',
        affectedTaskId: 'vt-1',
        riskTradeOff: '45-minute staffing dip between 08:00 and 08:45 IST.',
      },
      {
        id: 'opt-vol-3',
        optionLabel: 'Strategy C · Pre-Rig Night Before + Hire 4 External Event Stewards',
        strategyTitle:
          'Complete Lab Block A Cabling on Day-0 22:00 IST + Contract 4 Event Marshals',
        summary:
          'Finish all Lab Block A extension cabling the night before the exam and contract 4 external stewards for Day-1 morning stage gate management.',
        budgetDeltaINR: 8000,
        targetBudgetCategory: 'Judge Travel, Security & Hospitality',
        scheduleAdjustment:
          'OPS-02 moved from Day 1 · 06:30 IST to Day 0 · 22:00 IST.',
        affectedScheduleId: 'sched-ops-2',
        volunteerReallocation:
          'Technical & Lab Ops squad works Day-0 night shift (22:00–00:30 IST) ahead of morning exam.',
        affectedTaskId: 'vt-4',
        riskTradeOff:
          'Fatigue risk for Technical Ops volunteers taking morning lab exam.',
      },
    ],
  },
};

export const DEFAULT_EXECUTIVE_OPS_SUMMARY: ExecutiveOpsSummary = {
  generatedAt: '2026-10-27 · 12:30 IST',
  readinessScoreLabel: '76% Execution Readiness · 2 Critical-Path Blockers Active',
  executiveProgressSnapshot:
    '2 of 7 core squad milestones are Completed (DSW Curfew NOC & Main Gate RFID Prep), 3 are actively Undergoing/In-Progress (Lab Block A Wi-Fi/Power, Stage AV Load-In, Sponsor Tranche Follow-Up), 1 is Pending (Midnight 02:00 IST Canteen), and 2 are Blocked by the Estate Office 65kVA earthing signature.',
  headlineBottleneck:
    'Estate Office 65kVA 3-Phase Earthing Sign-Off (CP-02 / VOL-101) is blocking the Chief Proctor & Fire Marshal inspection (CP-03), which in turn holds up Autonomous Robotics & Drone Track safety weigh-in (OPS-04).',
  criticalRisks: [
    'Electrical & Fire Dependency Chain: VOL-101 (Estate SDO earthing log) must clear before 16:00 IST today or the Fire Marshal will postpone polycarbonate cage certification (CP-03) to Day 1 morning.',
    'Sponsorship Cashflow Timing: ₹75,000 Tranche-2 NEFT from Title Sponsor (VOL-103) awaits Registrar GST exemption verification; needed prior to locking Catering advance.',
    'Unconfirmed Quotes Exposure: 3 of 6 budget categories (Catering ₹1,15,000, Wi-Fi/Power ₹62,000, Swag ₹54,000) remain on AI Estimates until locked in the Quote Comparator.',
    'Venue & Volunteer Overlap: Rohan Kulkarni is double-allocated across CP-02 (Sub-Station) and VOL-104 (Lab Block A 100-port power strip layout).',
  ],
  immediateNextActions: [
    {
      owner: 'Rohan Kulkarni',
      squad: 'Technical & Lab Ops',
      action:
        'Meet Estate SDO at Campus Electrical Sub-Station with VoltGuard CPCB-II test certificate to sign off CP-02.',
      timeframe: 'Next 2 Hours (by 15:30 IST)',
    },
    {
      owner: 'Sneha Reddy',
      squad: 'Technical & Lab Ops',
      action:
        'Pre-bolt 12mm polycarbonate arena panels and stage emergency E-stop relay for Fire Marshal walkthrough (CP-03).',
      timeframe: 'Next 4 Hours (16:30 IST)',
    },
    {
      owner: 'Ananya Iyer',
      squad: 'Sponsorship & Finance',
      action:
        'Follow up with Title Sponsor finance controller on stamped GST exemption letter to collect ₹75,000 UTR.',
      timeframe: 'Within 18 Hours (Tomorrow 11:00 IST)',
    },
    {
      owner: 'Kabir Deshmukh',
      squad: 'Logistics & Food Committee',
      action:
        'Lock Annapurna Institutional Caterers (₹1,06,000) in Quote Comparator to capture ₹9,000 savings and confirm 02:00 IST snack buffer.',
      timeframe: 'Within 24 Hours',
    },
    {
      owner: 'Meera Krishnan & Vikramaditya Nair',
      squad: 'Stage & PR Squad',
      action:
        'Finalize Main Auditorium cue sheet and position 3 backup hospitality volunteers for Day-1 morning gate surge.',
      timeframe: 'Within 36 Hours',
    },
  ],
  broadcasts: [
    {
      audience: 'Volunteer Leads',
      channel: 'WhatsApp Squad Broadcast',
      subjectLine:
        '[WAR-ROOM SYNC · T-48 HRS] Priority Unblock on CP-02 Earthing & Lab Block A Power',
      messageBody:
        'Squad Leads (@Rohan, @Sneha, @Kabir, @Meera, @Vikramaditya): 1) Rohan is clearing CP-02 Estate earthing at 15:00 IST—Sneha, keep the Robotics kill-switch ready at Central Lawn for the 16:00 IST Fire Marshal inspection. 2) Lab Block A 100-port spike buster layout starts at 18:00 IST; Registration Desk will lend 3 volunteers after 09:15 IST on Day 1. Post shift check-ins in #core-war-room every 2 hours.',
    },
    {
      audience: "University Faculty Advisors / Dean's Office",
      channel: 'Official Dean/Faculty Email',
      subjectLine:
        "Status Briefing & CP-02/CP-03 Compliance Update — TechnoVerse '26 Execution Committee",
      messageBody:
        "Respected Dean (Student Welfare) & Faculty Advisor, Pursuant to the approved post-23:00 curfew relaxation (CP-01), we have completed biometric roster verification for 500 participants in Lab Block A and deployed an empanelled 65kVA CPCB-II silent generator. The Estate Office SDO earthing inspection (CP-02) and Chief Proctor safety walkthrough (CP-03) are scheduled for 15:30–16:30 IST today. All acoustic curfew norms during university exam hours are strictly enforced.",
    },
    {
      audience: 'Pending Vendors / Sponsors',
      channel: 'Vendor SLA Escalation',
      subjectLine:
        "URGENT: Load-In Gate Pass & Advance NEFT Confirmation — TechnoVerse '26",
      messageBody:
        "Dear Partner Vendor / Sponsor Finance Desk, 1) For Catering & Power Vendors: Campus Main Gate commercial vehicle entry passes are active from T-1 Day 18:00 IST; please adhere strictly to the 20-minute SLA buffer. 2) For Title Sponsor Finance Team: Please find attached the Registrar-stamped GST Exemption Certificate; kindly share the NEFT UTR for the ₹75,000 tranche by 11:00 IST tomorrow so stage backdrop co-branding goes to print on schedule.",
    },
  ],
};

export const DEFAULT_OUTREACH_DRAFTS: Record<string, OutreachDraft> = {
  'vt-1': {
    recipientName: 'Rohan Kulkarni & Tech Ops Squad + Estate Office SDO',
    recipientRole: 'Technical & Lab Ops Lead (VOL-101)',
    channel: 'WhatsApp Squad Broadcast',
    subjectLine: '[URGENT · CP-02] 65kVA DG Earthing Log Signature Needed by 15:30 IST',
    messageBody:
      'Team Tech Ops (@Rohan), Chief Proctor & Fire Marshal inspection for the Robotics Arena (CP-03) is locked for 16:00 IST at Central Lawn. Please carry the VoltGuard CPCB-II insulation certificate to the Estate Sub-Station immediately and upload the stamped CP-02 earthing sheet on #tech-lab-ops by 15:30 IST.',
    actionChecklist: [
      'Collect physical earthing megger test slip from VoltGuard supervisor',
      'Obtain Estate SDO stamp at Electrical Sub-Station Room 4',
      'Hand over copy to Vikramaditya Nair at Central Lawn before 16:00 IST',
    ],
  },
  'vt-2': {
    recipientName: 'Sneha Reddy & Robotics Pit Crew',
    recipientRole: 'Robotics & Hardware Convener (VOL-102)',
    channel: 'WhatsApp Squad Broadcast',
    subjectLine: '[ACTION · CP-03] Stage Robotics Kill-Switch & Polycarbonate Seam Check',
    messageBody:
      'Hi @Sneha & Pit Crew, as soon as Rohan clears CP-02 earthing at 15:30 IST, we have a 30-minute window to energize the master red E-stop mushroom switch and demonstrate the fail-safe radio interlock to the Fire Marshal. Keep 2 CO2 and 2 ABC fire extinguishers mounted at Pit Gate A & B.',
    actionChecklist: [
      'Torque-check all 48 M10 bolts on 12mm polycarbonate corner panels',
      'Verify 2.4GHz fail-safe cut-off relay drops power in <400ms',
      'Keep team captain indemnity forms ready at weigh-in desk',
    ],
  },
  'vt-3': {
    recipientName: 'Ananya Iyer & Corporate Sponsor Desk',
    recipientRole: 'Sponsorship & Finance Secretary (VOL-103)',
    channel: 'Official Dean/Faculty Email',
    subjectLine: "Expedited UTR Confirmation & Registrar GST Letter — TechnoVerse '26 Sponsorship",
    messageBody:
      'Dear Title Sponsor Finance Team, Please find attached the signed Institute Registrar GST Exemption & Educational Conclave Certificate along with Gymkhana Escrow Account NEFT details. Kindly share the UTR reference for the ₹75,000 Tranche-2 release by 11:00 IST tomorrow so we can finalize stage backdrop & lanyard co-branding.',
    actionChecklist: [
      'Attach scanned Registrar GST notice + educational declaration',
      'CC Faculty Treasurer & General Secretary (Aarav Mehta)',
      'Update UTR number in Gymkhana ledger once received',
    ],
  },
};

export function buildPresetMasterPlan(
  presetId: 'technoverse' | 'synergy' | 'devdays'
): FestMasterPlan {
  const preset =
    PRESET_DEMO_SCENARIOS.find((p) => p.id === presetId) ??
    PRESET_DEMO_SCENARIOS[0];
  const cfg = preset.config;
  const scaleFactor =
    cfg.totalBudgetINR / Math.max(1, INITIAL_FEST_MASTER_PLAN.intake.totalBudgetINR);

  const scaledBudget = INITIAL_FEST_MASTER_PLAN.budget.map((item) => ({
    ...item,
    aiEstimateINR: Math.round((item.aiEstimateINR * scaleFactor) / 500) * 500,
    confirmedQuoteINR:
      item.confirmedQuoteINR !== null
        ? Math.round((item.confirmedQuoteINR * scaleFactor) / 500) * 500
        : null,
    sponsorBackedINR:
      Math.round((item.sponsorBackedINR * scaleFactor) / 500) * 500,
  }));

  const scaledQuotes = INITIAL_FEST_MASTER_PLAN.vendorQuotes.map((q) => ({
    ...q,
    totalQuoteINR: Math.round((q.totalQuoteINR * scaleFactor) / 500) * 500,
  }));

  if (presetId === 'technoverse') {
    return {
      ...INITIAL_FEST_MASTER_PLAN,
      intake: cfg,
      budget: scaledBudget,
      vendorQuotes: scaledQuotes,
      lastUpdatedISO: new Date().toISOString(),
    };
  }

  if (presetId === 'synergy') {
    return {
      ...INITIAL_FEST_MASTER_PLAN,
      intake: cfg,
      clarifyingQuestions: [
        {
          id: 'cq-1',
          category: 'Campus Permissions',
          question:
            'Has the Dean of Student Welfare (DSW) & City Police Traffic Cell cleared the 1,200-attendee Pro-Night curfew waiver at Central Lawn Concert Stage & SAC Room G-04?',
          whyItMatters:
            'Outdoor concert PA above 75dB after 22:00 IST requires stamped DSW & Police NOC 14 days prior.',
          suggestedOptions: [
            'DSW & Police NOC signed; SAC Room G-04 backup stage ready at 22:00 IST',
            'Outdoor concert capped at 21:45 IST; Valorant LAN continues in Lab Block A Rooms 201–204',
            'Awaiting Proctor signature on 20-marshal crowd control deployment',
          ],
          answer:
            'DSW & Police NOC signed; SAC Room G-04 backup stage ready at 22:00 IST',
        },
        {
          id: 'cq-2',
          category: 'Multi-Track Room Clashes',
          question:
            'How will RoboWars 30kg Arena in SAC Room G-04 and Valorant LAN in CSE Lab Block A (Rooms 201–204) avoid power feeder trips during Pro-Night soundcheck?',
          whyItMatters:
            'Concert lighting truss + 30kg combat robots draw 110kVA peak load on the South Campus feeder.',
          suggestedOptions: [
            'Isolate Concert Stage on dedicated 125kVA DG set + LAN on Lab Block A UPS',
            'Stagger RoboWars bouts (10:00–17:00 IST) and Pro-Night soundcheck (18:00–22:00 IST)',
            'Deploy 2 Estate wiremen at Electrical Sub-Station Room 4',
          ],
          answer:
            'Isolate Concert Stage on dedicated 125kVA DG set + LAN on Lab Block A UPS',
        },
        {
          id: 'cq-3',
          category: 'Sponsor Timelines',
          question:
            'What is the cash vs. in-kind split of the ₹5,50,000 Gymkhana sponsorship pool for artist & stage advances?',
          whyItMatters:
            'Headline band and line-array vendors require 50% NEFT advance (₹2,20,000) 5 days before Day-1.',
          suggestedOptions: [
            '75% Cash (₹4,12,500 in Gymkhana account) + 25% Beverage/Merch In-Kind',
            '60% realized; ₹1,10,000 Title Sponsor tranche releasing Friday',
            'Using ₹1,50,000 Gymkhana Cultural Reserve bridge until T+7 sponsor settlement',
          ],
          answer:
            '75% Cash (₹4,12,500 in Gymkhana account) + 25% Beverage/Merch In-Kind',
        },
        {
          id: 'cq-4',
          category: 'Overnight Logistics',
          question:
            'What is the overnight accommodation & midnight refreshment plan for 400 outstation cultural, robotics, and e-sports participants?',
          whyItMatters:
            'Outstation teams require Visitors Hostel check-in and 01:30 IST night canteen meals.',
          suggestedOptions: [
            'Hostel Block C Common Rooms + Annapurna 01:30 IST Night Kitchen buffer',
            'Partner with 3 campus guest houses + 24x7 medical desk in SAC Room G-02',
            'Issue RFID night-curfew passes verified by Chief Warden squad',
          ],
          answer:
            'Hostel Block C Common Rooms + Annapurna 01:30 IST Night Kitchen buffer',
        },
      ],
      schedule: INITIAL_FEST_MASTER_PLAN.schedule.map((node, i) => ({
        ...node,
        venue: cfg.concurrentVenueTracks[i % cfg.concurrentVenueTracks.length],
        track: cfg.tracks[i % cfg.tracks.length],
      })),
      budget: scaledBudget,
      volunteerTasks: INITIAL_FEST_MASTER_PLAN.volunteerTasks.map((t, i) => ({
        ...t,
        assignedVolunteersCount: t.assignedVolunteersCount + 3,
        venueTrack: cfg.concurrentVenueTracks[i % cfg.concurrentVenueTracks.length],
      })),
      coordinatorLogs: [
        {
          id: 'log-syn-1',
          timestamp: '11:30 IST',
          author: 'Devansh Sharma',
          squad: 'Stage & PR Squad',
          note: 'Central Lawn Concert Stage truss & Main Auditorium Room 101 acoustic check cleared; AV vendor requested 50% NEFT advance by Friday.',
        },
        {
          id: 'log-syn-2',
          timestamp: '12:05 IST',
          author: 'Rohan Kulkarni',
          squad: 'Technical & Lab Ops',
          note: 'Configured gigabit VLAN switch in CSE Lab Block A (Rooms 201–204) for 64 Valorant LAN rigs and SAC Room G-04 RoboWars telemetry.',
        },
        ...INITIAL_FEST_MASTER_PLAN.coordinatorLogs.slice(1),
      ],
      vendorQuotes: scaledQuotes,
      lastUpdatedISO: new Date().toISOString(),
    };
  }

  // Dev Days Community Summit preset
  return {
    ...INITIAL_FEST_MASTER_PLAN,
    intake: cfg,
    clarifyingQuestions: [
      {
        id: 'cq-1',
        category: 'Campus Permissions',
        question:
          'Has the CSE Head of Department & Dean Academics approved Saturday full-day access for Main Auditorium (Room 101) and CSE Seminar Halls 104 & 105?',
        whyItMatters:
          'Weekend external developer entry requires Main Gate security clearance list 72 hours prior.',
        suggestedOptions: [
          'HOD & Security Officer signed gate pass for 250 external & campus builders',
          'Approved with mandatory QR badge scan at Block B Innovation Atrium',
          'Awaiting Estate AC plant Saturday extension sign-off for Room 101',
        ],
        answer:
          'HOD & Security Officer signed gate pass for 250 external & campus builders',
      },
      {
        id: 'cq-2',
        category: 'Multi-Track Room Clashes',
        question:
          'How will concurrent Hands-On AI Workshops in CSE Seminar Halls 104 & 105 and Startup Pitches in Auditorium Room 101 share Wi-Fi bandwidth?',
        whyItMatters:
          '250 developers pulling container images simultaneously can saturate standard classroom routers.',
        suggestedOptions: [
          'Pre-cache workshop models on local NAS in Seminar Hall 104 + 4 Wi-Fi 6 APs',
          'Dedicated 1Gbps Campus Fiber VLAN for Seminar Halls 104 & 105',
          'Stagger heavy downloads during 09:00 IST registration window',
        ],
        answer:
          'Pre-cache workshop models on local NAS in Seminar Hall 104 + 4 Wi-Fi 6 APs',
      },
      {
        id: 'cq-3',
        category: 'Sponsor Timelines',
        question:
          'What is the cash vs. cloud-credit split of the ₹1,00,000 Dev Days sponsor pool?',
        whyItMatters:
          'Lunch catering and printed lanyards for 250 attendees require ₹65,000 liquid cash in E-Cell account.',
        suggestedOptions: [
          '80% Cash (₹80,000 in E-Cell bank) + ₹20,000 API/Cloud Credits for winners',
          '100% cash realized via 4 developer tool booth sponsors',
          '65% cash collected; balance ₹35,000 covered by CSE Department grant',
        ],
        answer:
          '80% Cash (₹80,000 in E-Cell bank) + ₹20,000 API/Cloud Credits for winners',
      },
      {
        id: 'cq-4',
        category: 'Overnight Logistics',
        question:
          'What is the high-tea, speaker hospitality, and evening wrap-up transport plan by 20:00 IST?',
        whyItMatters:
          'Single-day summit must vacate Main Auditorium Room 101 by 20:30 IST per Estate rules.',
        suggestedOptions: [
          '2-slot catering (Lunch + 17:00 IST High Tea) in Block B Foyer; zero overnight stay',
          'VIP Guest House dinner for 12 startup jury members + campus cab desk',
          'Express teardown squad (10 volunteers) scheduled for 19:45–20:30 IST',
        ],
        answer:
          '2-slot catering (Lunch + 17:00 IST High Tea) in Block B Foyer; zero overnight stay',
      },
    ],
    schedule: INITIAL_FEST_MASTER_PLAN.schedule.map((node, i) => ({
      ...node,
      venue: cfg.concurrentVenueTracks[i % cfg.concurrentVenueTracks.length],
      track: cfg.tracks[i % cfg.tracks.length],
    })),
    budget: scaledBudget,
    volunteerTasks: INITIAL_FEST_MASTER_PLAN.volunteerTasks.map((t, i) => ({
      ...t,
      assignedVolunteersCount: Math.max(2, Math.round(t.assignedVolunteersCount * 0.65)),
      venueTrack: cfg.concurrentVenueTracks[i % cfg.concurrentVenueTracks.length],
    })),
    coordinatorLogs: [
      {
        id: 'log-dev-1',
        timestamp: '10:45 IST',
        author: 'Priya Nair',
        squad: 'Technical & Lab Ops',
        note: 'CSE Seminar Hall 104 4K laser projector repaired and local AI workshop cache server verified at 940 Mbps.',
      },
      {
        id: 'log-dev-2',
        timestamp: '11:30 IST',
        author: 'Aditya Verma',
        squad: 'Sponsorship & Finance',
        note: 'Received ₹80,000 NEFT sponsor confirmation for Block B Innovation Atrium demo booths.',
      },
      ...INITIAL_FEST_MASTER_PLAN.coordinatorLogs.slice(2),
    ],
    vendorQuotes: scaledQuotes,
    lastUpdatedISO: new Date().toISOString(),
  };
}

