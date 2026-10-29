# PromptWars Challenge 5 — Master Project & Engineering Log

## 1. Executive Summary & Workspace Index
This living document tracks all research, architectural decisions, prompt iterations, code quality audits, and submission milestones for PromptWars: Virtual on Hack2skill ([PromptWars Virtual Portal](https://promptwars.in/promptwarsVirtual.html)), organized by Google for Developers and Hack2skill.

- **Workspace Drive Folder**: PromptWars Challenge 5 — Project & Engineering Hub
- **Phase 1 Blueprint Doc**: Phase 1 Blueprint — Google AI Studio Prototyping & 4-Day Sprint Plan
- **Challenge Theme**: Challenge 5 — GenAI-Powered Celebration & Event Planner ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM))
- **Submission Deadline**: Sunday, November 1, 2026 at 11:59 PM IST ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM))
- **Internal Target Completion**: Saturday, October 31, 2026 (completing full implementation, Attempt 1 diagnostic check, and ChatGPT Plus / Codex audit before the monthly subscription cycle ends)

---

## 2. Challenge 5 Problem Statement & Evaluator Requirements
Based on the official Challenge 5 Explainer Session (presented by Subject Matter Expert Srinivas) and the Challenge 5 Submission Walkthrough, top-scoring applications must go beyond generic party-idea chatbots and solve real-world event execution challenges.

---

## 3. Engineering Log Entries

### Entry 4 — Target Persona Lock-In & Custom Coordinator Feature Design (Oct 27, 2026, 11:30 PM IST)
- **Selected Persona & Niche:** University / Inter-College Tech-Fest & Community Fest Coordinator ("CampusPulse AI").
- **Strategic Rationale:** Selected over the generic wedding planner example because organizing inter-college tech fests, hackathons, and multi-department university symposia is a domain we have direct, firsthand student experience with—especially during the busy year-end festival season when multiple campus events, exams, and competitions overlap. As emphasized in the Challenge 5 Explainer Session, evaluators reward authentic, user-grounded domain customization over generic AI outputs.
- **Meaningful Gemini API Integration (Beyond Basic CRUD Logs):** Rather than using Gemini as a superficial text generator on top of a static event log, CampusPulse AI uses `@google/genai` (`gemini-2.5-flash` with structured JSON `responseSchema`) across five high-leverage coordinator workflows:
  1. **Context-Aware Fest Intake (`generateClarifyingQuestions`):** Evaluates initial festival parameters (budget in `₹`, footfall, concurrent tracks, volunteer count) and asks targeted clarifying questions on university approvals, overnight lab/hostel permissions, Wi-Fi/power loads, and inter-department schedule clashes before generating the master plan.
  2. **Dependency-Sequenced Multi-Track Plan (`generateMasterFestPlan`):** Generates a dual-track budget (AI Estimate vs. Confirmed Quote) and a 4-phase dependency-gated schedule where downstream tasks (AV rigging, catering drops, volunteer rosters) explicitly depend on foundational locks (Dean/Registrar approval, Main Auditorium lock, sponsor MoUs).
  3. **Volunteer & Coordinator Command Center + Live Ops Self-Summarization (`generateOpsSummary`):** Tracks which student coordinator or department squad owns each task (Completed, In Progress / Undergoing, Pending, Blocked) plus timestamped coordinator log notes, and uses Gemini to synthesize an on-demand Executive Ops Briefing (identifying active bottlenecks, overloaded squads, next-48-hour priorities, and ready-to-send WhatsApp/Email coordination messages for volunteers, faculty advisors, and vendors).
  4. **Mid-Stream Fest Crisis & Ripple-Effect Simulator (`simulateConstraintShock`):** Simulates real university festival emergencies (+150 last-minute inter-college registrations, a delayed ₹75,000 title sponsor tranche, a double-booked Main Auditorium, or volunteer dropouts during exam week) and proposes 3 concrete budget, venue, and volunteer trade-offs with rupee (`₹`) delta badges.
  5. **Campus Vendor Quote Comparator (`evaluateVendorQuotes`):** Compares 2–3 competing vendor quotes (Stage/AV, Midnight Hackathon Catering, Custom Swag) on budget fit, hidden generator/setup costs, and reliability, converting locked quotes from AI Estimate to Confirmed Quote.
- **Documentation Updated:** Updated both the Canvas blueprint and the Phase 1 Blueprint — Google AI Studio Prototyping & 4-Day Sprint Plan in Google Drive with the complete CampusPulse AI System Instruction, 5-Module Master Build Prompt, and Step 3 Follow-Up Polish Prompt.

### Entry 5 — Phase 1 Completion in Google AI Studio & Custom Feature Expansion (Oct 29, 2026, 1:08 AM IST)
- **Milestone Reached:** Completed all Phase 1 UI & Schema Prototyping work inside Google AI Studio ahead of schedule.
- **Custom Enhancements Added:** In addition to the core 5-module CampusPulse AI blueprint (Clarifying Intake, Dependency Schedule & Dual-Track Budget, Volunteer Command Center & AI Live Ops Summarizer, Crisis Ripple-Effect Simulator, and Vendor Quote Comparator), custom user-designed features, workflow refinements, and UI improvements were implemented directly in Google AI Studio to further personalize the application—directly fulfilling the Challenge 5 Explainer Session guidance to customize the project beyond default AI output.
- **Phase 2 Transition Prepared:** Created the companion Phase 2 Blueprint — Google Antigravity Serverless Hardening, Testing & Vercel Prep inside the PromptWars Challenge 5 — Project & Engineering Hub Drive folder to guide the migration into Google Antigravity (`api/gemini.ts` Vercel serverless proxy, removal of client-side `GEMINI_API_KEY` exposure in `vite.config.ts`, Vitest unit test suite, and `README.md` documentation).
- **Next Immediate Action:** Record the exact list of custom features added in Google AI Studio (and the public GitHub repository URL once pushed) so the serverless proxy and test suite cover 100% of the custom functionality.

### Entry 5B — Deep Technical Inspection of FaTeHvEeR-cyber/Campus-Pluse & Pre-Deployment Audit (Oct 29, 2026, 1:58 AM IST)
- **Public Repository Verified:** Confirmed public visibility and inspected the complete file tree of `https://github.com/FaTeHvEeR-cyber/Campus-Pluse` (commits `0694946` and `cc08595`).
- **Catalog of Implemented Architecture & Custom Phase 1 Features:**
  - **Modular 5-Workspace Component Tree (`src/components/`):** `IntakeWizardWorkspace.tsx`, `ScheduleBudgetWorkspace.tsx`, `VolunteerOpsWorkspace.tsx`, `CrisisSimulatorWorkspace.tsx`, and `QuoteComparatorWorkspace.tsx`.
  - **Server-Side Planner API & Deterministic Fallback Engine (`api/planner.ts`, `server.ts`, `src/utils/festEngine.ts`, `src/data/seedFestData.ts`):** Already isolates `process.env.GEMINI_API_KEY` on the server via `getServerGenAI()` and implements 5 `@google/genai` structured output schemas (`CLARIFYING_QUESTIONS_SCHEMA`, `MASTER_PLAN_SYNTHESIS_SCHEMA`, `EXECUTIVE_OPS_SUMMARY_SCHEMA`, `OUTREACH_DRAFT_SCHEMA`, and `CRISIS_SIMULATION_SCHEMA`) with graceful fallback to `festEngine.ts` if the API key is absent.
  - **Custom User-Added Features Beyond Base Blueprint:**
    - **AI Executive Briefing Drawer (`App.tsx` + `generateExecutiveSummary`):** Global slide-out drawer generating an instant Executive Ops Summary with readiness score, progress snapshot, top bottlenecks, and prioritized next actions.
    - **Task-Level AI Outreach Draft Assistant (`draftCoordinatorOutreach`):** Generates targeted WhatsApp squad broadcasts, Dean's Office approval emails, and vendor SLA escalations directly from individual volunteer tasks.
    - **Applied Shock Audit Log (`AppliedShockLog`):** Tracks a historical ledger of every simulated crisis and applied trade-off strategy.
    - **Extended Fest Intake Parameters (`VenueType`, `sponsorTarget`, Custom Category):** Models campus vs. hybrid convention venues and sponsorship targets alongside total budget.
    - **Full Offline JSON Plan Import & Export:** Allows coordinators to download their complete `FestMasterPlan` state as JSON and re-import it anytime.
- **Five Critical Technical Findings Prepared for Phase 2 in Google Antigravity:**
  1. **Model Identifier Fix in `api/planner.ts`:** Currently hardcoded to `const MODEL_NAME = 'gemini-3.8-flash'`, which returns a 404 on standard Google AI Studio keys and triggers static fallback data. Must be updated to `process.env.GEMINI_MODEL || 'gemini-2.5-flash'` so live Gemini responses work in production (Challenge 5 Explainer Session).
  2. **Vercel Serverless Handler & `vercel.json`:** `server.ts` uses Express for local dev (`tsx server.ts`); `api/planner.ts` must export a standard Vercel serverless default handler (`export default async function handler(req, res)`) paired with a root `vercel.json` so `/api/planner` works automatically on Vercel.
  3. **Vitest Script & Package Naming in `package.json`:** `src/utils/festEngine.test.ts` is already written, but `package.json` is named `"react-example"` and lacks `"test": "vitest run"` and `vitest` in `devDependencies`. Adding these unlocks automated Testing points.
  4. **Missing `README.md` & Tracked `.aistudio/` Folder:** Removing `.aistudio/artifacts/brain/` from Git tracking and adding a comprehensive `README.md` will significantly boost the Hack2skill Code Quality and Problem Statement Alignment scores.
  5. **AI Vendor Quote Comparison Action:** Adding a 6th `evaluateVendorQuotes` action in `api/planner.ts` and `src/services/geminiService.ts` so `QuoteComparatorWorkspace.tsx` also invokes live Gemini analysis.

---

## 4. Upcoming Log Placeholders (To Be Updated As We Progress)
- **Entry 6 — Phase 2 Execution in Google Antigravity & Vercel Live Deployment:** (Running the repo-specific Phase 2 prompt in Antigravity, pushing to FaTeHvEeR-cyber/Campus-Pluse, and deploying live on Vercel)
- **Entry 7 — Hack2skill Attempt 1 Submission & Diagnostic Score Report Analysis:** (Submitting Attempt 1 and logging the automated Code Quality report)
- **Entry 8 — Phase 3 Codex Audit, Attempt 2 Refinements, Demo Video & LinkedIn Post:** (Completing final audit before Oct 31 and submitting Attempt 2)

