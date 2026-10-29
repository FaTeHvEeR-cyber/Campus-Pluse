# Phase 1 Blueprint: Google AI Studio Prototyping & 4-Day Sprint Plan for PromptWars Challenge 5 (CampusPulse AI)

## Four-Day Execution Schedule Secures Early Submission and Codex Audit Before November 1

With the [PromptWars Virtual Challenge 5](https://promptwars.in/promptwarsVirtual.html) deadline set for **Sunday, November 1, 2026 at 11:59 PM IST** ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM)), this 4-day schedule completes the build, testing, and Attempt 1 diagnostic check before your ChatGPT Plus / Codex subscription window closes at the end of the month.

| Day & Target Window | Workflow Stage | Core Deliverables & Actions | Target Evaluator Signals |
| :--- | :--- | :--- | :--- |
| **Day 1 (Oct 28)** | **Phase 1: Google AI Studio UI & Schema Prototype** | Generate the **CampusPulse AI** React + Tailwind + `@google/genai` prototype in Google AI Studio, verify all 5 coordinator workflows (Intake, Timeline/Budget, Volunteer & Ops Summarizer, Shock Simulator, Vendor Comparator), and export the project ZIP. | **Problem Statement Alignment** (Clarifying questions, trade-offs, dependencies, volunteer ops, vendor quotes) |
| **Day 2 (Oct 29)** | **Phase 2A: Antigravity Serverless & Security Hardening** | Open the exported repo in Google Antigravity, move `@google/genai` calls into a Vercel Serverless route (`/api/planner.ts`) using `process.env.GEMINI_API_KEY`, and modularize components. | **Security** (Zero client-side API keys) & **Code Quality** (Clean SDLC modularity) |
| **Day 3 (Oct 30)** | **Phase 2B: Testing, Accessibility & Vercel Deployment + Attempt 1** | Add Vitest unit tests, semantic HTML/ARIA attributes, and `.env.example`; deploy to Vercel; submit **Attempt 1** on Hack2skill to unlock the automated Code Quality diagnostic report. | **Testing**, **Accessibility**, **Efficiency**, & First Diagnostic Score |
| **Day 4 (Oct 31)** | **Phase 3: Codex Audit, Attempt 2 Refinement & Final Assets** | Run full repo through Codex + Attempt 1 report feedback, push fixes for **Attempt 2**, record the screen-walkthrough video, and publish the Build-in-Public LinkedIn post. | **Top-400 Leaderboard Polish** & Complete Submission Package |

## Why the College & Community Tech-Fest Coordinator Niche Scores High

In the [Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM), the hosts emphasized that evaluators look for authentic, user-grounded problem-solving rather than generic AI templates. Building **CampusPulse AI** for student coordinators and university department leads tackling simultaneous year-end inter-college festivals directly addresses all rubric requirements while adding practical coordinator workflows:

* **Clarifying Intake Before Planning:** Captures festival scale, multi-track events, budget (`₹`), and campus constraints first, then uses Gemini to ask targeted clarifying questions about auditorium capacity, overnight hackathon logistics, sponsor tranches, and inter-department schedule clashes ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM)).
* **Volunteer & Coordinator Command Center with AI Self-Summarization:** Tracks which coordinator or volunteer squad owns each task and sub-event (Completed vs. Ongoing vs. Blocked), generates an on-demand **AI Live Ops Executive Summary** of pending bottlenecks, and drafts ready-to-send coordination messages for volunteers, faculty advisors, and vendors.
* **Dependency-Sequenced Multi-Track Schedule & Dual-Track Budget:** Sequences tasks by hard university dependencies (Dean/Registrar Approval & Auditorium Lock before AV Rigging, Catering Drops, and Swag Printing) and separates `AI Estimated Cost (₹)` from `Confirmed Vendor Quote (₹)` ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM)).
* **Dynamic Ripple-Effect & Fest Crisis Simulator:** Recalculates budget trade-offs, volunteer shift assignments, and room schedules in place when real campus crises hit (such as a delayed sponsor payout, +150 last-minute inter-college registrations, a double-booked auditorium, or volunteer dropouts during exams) ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM)).

## Step 1: Paste This System Instruction into Google AI Studio

Open **Google AI Studio** and paste the following into the **System Instructions** field:

```text
You are a Principal Full-Stack Engineer and AI Product Architect building a flagship submission for Google for Developers x Hack2skill PromptWars Challenge 5 ("Celebration & Event Planner").

Follow these strict engineering and product rules:
1. PROBLEM ALIGNMENT & AUTHENTIC PERSONA: Build "CampusPulse AI", a structured, state-driven University Tech-Fest & Community Event Execution Engine designed for student coordinators and department leads managing multi-track inter-college festivals. Do NOT build a generic chat interface. Provide five integrated workspaces:
   - Smart Fest Intake & Clarifying Questions Wizard (AI asks 3-4 targeted clarifying questions on campus permissions, multi-track room clashes, sponsor timelines, and overnight logistics before generating the master plan).
   - Dependency-Sequenced Multi-Track Schedule & Dual-Track Budget Dashboard (separating Critical-Path Campus Approvals from Downstream Vendor/Volunteer Tasks, and distinguishing AI Estimates from Confirmed Quotes in INR ₹).
   - Volunteer & Coordinator Command Center + AI Live Ops Summarizer (tracks task ownership by coordinator/department, filters Completed vs. In-Progress vs. Blocked tasks, uses Gemini to generate an instant Executive Ops Summary of bottlenecks, and drafts outreach/coordination messages to volunteers and vendors).
   - Dynamic Ripple-Effect & Fest Crisis Simulator (applies mid-stream shocks like "+150 Last-Minute Registrations", "Sponsor Delays ₹75,000 Payout", "Main Auditorium Double-Booked", or "Volunteer Squad Dropouts" and computes 3 concrete budget, schedule, and volunteer trade-offs without resetting the plan).
   - Side-by-Side Vendor & Sponsor Quote Comparator (evaluates competing AV, catering, or swag vendor quotes against remaining category budgets and locks confirmed quotes into the master budget).
2. CODE QUALITY & MODULARITY: Isolate all Gemini API calls inside `services/geminiService.ts` using `@google/genai` (`gemini-2.5-flash`) with strict `Type` structured JSON `responseSchema` definitions. Keep state and TypeScript interfaces cleanly separated in `types.ts` so the backend call can be moved to a Vercel Serverless route (`/api/planner.ts`) in Phase 2.
3. ACCESSIBILITY & UX: Use semantic HTML5 landmarks (`<main>`, `<nav>`, `<section>`, `<article>`), explicit `aria-label` attributes on all controls, keyboard-accessible tabs, and high-contrast WCAG AA styling with Tailwind CSS and `lucide-react` icons.
```

## Step 2: Paste This Master Build Prompt into Google AI Studio

Paste the complete **Master Build Prompt** below into Google AI Studio to generate the application:

```text
Build a complete, responsive React + TypeScript + Tailwind CSS web application called "CampusPulse AI — College Tech-Fest & Community Event Execution Engine" powered by the `@google/genai` SDK (`gemini-2.5-flash`).

### Target Persona & Core Problem
CampusPulse AI is built for university student coordinators, technical society leads, and department organizers running busy year-end inter-college festivals, 24-hour hackathons, and multi-track cultural/community fests (managing ₹1,50,000 to ₹10,000,000 budgets, 200 to 1,500 participants, multiple simultaneous venues, and 20–50 student volunteers). Instead of a static checklist or generic chatbot, it acts as a live AI operations chief that sequences dependencies, coordinates volunteer squads, summarizes ongoing vs. blocked tasks, compares vendor quotes, and dynamically replans when last-minute campus crises hit.

### Required Application Architecture & 5 Core Modules

1. **Module 1: Two-Step Clarifying Fest Intake Engine**
   - **Stage A (Initial Fest Brief):** User inputs Fest Name, Fest Category (e.g., Inter-College Tech Fest & Hackathon, Multi-Department Annual Cultural & Tech Symposium, Campus Developer Summit, Community Innovation Fair), Total Budget in INR (`₹`), Expected Footfall/Participants, Weeks Until Fest, Number of Active Volunteer Coordinators, Concurrent Venue Tracks (e.g., Main Auditorium, Lab Block A, Central Lawn, Seminar Halls), and Priority Weights (Technical Infrastructure & Wi-Fi, Stage & AV Production, Food & Night Refreshments, Prizes & Swag, Guest/Judge Hospitality).
   - **Preset Demo Scenarios (1-Click Evaluator Testing):** Include 3 one-click buttons at the top so evaluators can load realistic data immediately:
     1. "TechnoVerse '26 • ₹4,50,000 Budget • 500 Attendees • 36-Hr Hackathon + 6 Tech Tracks • 4 Weeks Out"
     2. "Synergy Inter-College Fest • ₹8,00,000 Budget • 1,200 Attendees • Cultural + Robotics + Gaming • 6 Weeks Out"
     3. "Dev Days Community Summit • ₹1,50,000 Budget • 250 Attendees • Single-Day Workshop & Pitch Fest • 3 Weeks Out"
   - **Stage B (AI Clarifying Questions):** Clicking "Analyze Fest Brief" calls Gemini (`generateClarifyingQuestions`) to return 3–4 context-aware clarifying questions (e.g., overnight hostel/lab access permissions from the Dean, sponsor cash vs. in-kind split, backup generator/Wi-Fi load for 500 laptops, clashes with university exam or department schedules) with clickable quick-answer chips PLUS custom text input.
   - Submitting the answers calls Gemini (`generateMasterFestPlan`) to construct the complete state-driven `FestPlan`.

2. **Module 2: Dependency-Gated Schedule & Dual-Track Budget Dashboard**
   - **KPI Command Bar:** Displays Total Budget (`₹`), AI Estimated Spend (`₹`), Confirmed Vendor Spend (`₹`), Remaining Buffer (`₹`), Active Volunteers, Execution Readiness Score (`0-100%`), and Budget Health Status Badge.
   - **Dual-Track Budget Table:** Covers campus fest categories (Stage, Sound & AV Rigging; Hackathon Wi-Fi, Power & Lab Setup; Catering, Stalls & Midnight Refreshments; Swag, IDs, Certificates & Printing; Judge Travel, Security & Hospitality; Prize Pool & Contingency Buffer). Each row shows `AI Estimated Cost (₹)`, `Confirmed Quote Cost (₹)`, Status (`AI Estimate` vs. `Confirmed Quote` vs. `Overrun Risk`), Priority (`Must-Have` / `Flexible` / `Nice-to-Have`), and Per-Attendee Cost breakdown.
   - **Dependency-Sequenced Multi-Track Timeline:** Groups tasks into Phase 1 (University Approvals, Venue Lock & Core Sponsor MoUs), Phase 2 (AV/Network Infrastructure & Vendor Contracts), Phase 3 (Inter-College PR, Registrations & Volunteer Shift Roster), and Phase 4 (Day-Of Run-of-Show & Parallel Track Scheduling). Every task displays its `Depends On` prerequisites, `Assigned Department/Squad`, `Venue/Track`, and `Blocked If Delayed` warning.

3. **Module 3: Volunteer & Coordinator Command Center + AI Live Ops Summarizer (Custom Coordinator Feature)**
   - **Coordinator & Volunteer Roster View:** Displays tasks and simultaneous sub-events grouped by Assigned Coordinator / Volunteer Squad (e.g., Technical & Lab Ops, Sponsorship & Finance, Logistics & Food Committee, Stage & PR Squad, Registration & Hospitality Desk) with interactive status toggles (`Completed`, `In Progress / Undergoing`, `Pending`, `Blocked`) and a live Activity Log where coordinators can append quick timestamped notes.
   - **AI Live Ops Self-Summarization (`generateOpsSummary`):** Clicking "Generate AI Executive Ops Briefing" calls Gemini with the current state of all completed, ongoing, and blocked tasks + coordinator logs to produce:
     - **Executive Progress Snapshot:** What is completed vs. currently undergoing vs. falling behind across tracks.
     - **Critical Bottleneck & Clash Radar:** Identifies overloaded volunteers, unblocked downstream tasks, or overlapping venue schedules.
     - **Next 48-Hour Coordinator Action Plan:** Top 5 prioritized actions by squad.
     - **Ready-to-Send Coordinator & Volunteer Broadcasts:** Auto-generates copyable WhatsApp/Email/Slack coordination updates tailored for (a) Volunteer Leads, (b) University Faculty Advisors/Dean's Office, and (c) Pending Vendors/Sponsors.

4. **Module 4: "What-If" Ripple-Effect & Fest Crisis Simulator (Star Evaluator Feature)**
   - Allows coordinators to simulate mid-stream festival disruptions without losing their existing plan:
     - 4 One-Click Campus Crisis Presets:
       1. "Registration Surge: +150 Last-Minute Inter-College Participants Added"
       2. "Sponsorship Delay: Title Sponsor Delays ₹75,000 Tranche; Costs Run 20% Over Active Cash"
       3. "Venue Clash: Main Auditorium Double-Booked by University Admin for 4 Hours on Day 1"
       4. "Volunteer Crunch: 6 Core Volunteers & Stage Lead Unavailable Due to Exam Rescheduling"
     - Plus a custom free-text crisis input.
   - Clicking "Simulate Ripple Effect & Rebalance" calls Gemini (`simulateConstraintShock`) with the active `FestPlan` and disruption.
   - Renders a **Before vs. After Delta View** with:
     - **Ripple Impact Analysis:** Exact budget categories, venue tracks, and volunteer squads impacted, with color-coded `₹` delta badges.
     - **3 Concrete AI Trade-Off Strategies:** (e.g., Strategy A: Absorb within existing budget by shifting non-final rounds to Seminar Halls and switching to digital certificates/tiered swag; Strategy B: Reallocate contingency buffer + reassign 3 PR volunteers to Stage Ops; Strategy C: Emergency mini-sponsor bridge + schedule compression).
     - **"Apply Selected Trade-Off to Master Plan" Button:** Updates the live budget, timeline, and volunteer assignments in-place.

5. **Module 5: Vendor Quote Comparator & Estimate-to-Confirmed Converter**
   - Lets coordinators pick any budget category (e.g., Sound & LED Stage Setup, Midnight Hackathon Catering, or Custom Merchandise/Swag) and compare 2–3 vendor quotes (Vendor Name, Quoted Price in `₹`, Deliverables, Hidden Costs/Generator Charges, Payment Terms), with a "Load Sample Campus Vendor Quotes" button.
   - Clicking "Compare Vendor Quotes with AI" calls Gemini (`evaluateVendorQuotes`) to score each vendor on Budget Fit, Campus Reliability, Hidden-Cost Risk, and Negotiation Tip.
   - Clicking "Confirm & Lock Vendor" updates that category in the Master Budget from `AI Estimate` to `Confirmed Quote` and recalculates remaining fest buffer.

### Technical, Security & Code Quality Requirements
- Centralize all `@google/genai` calls in `services/geminiService.ts` using strict `Type.OBJECT` and `Type.ARRAY` `responseSchema` configurations so every response maps cleanly to TypeScript interfaces in `types.ts`.
- Provide instant fallback/error recovery banners, loading states, and an "Export Fest Master Runbook (JSON / Printable Markdown)" button.
- Use semantic HTML5 tags, explicit `aria-label` attributes on all buttons/inputs/tabs, and high-contrast WCAG AA dark/light UI polish.
```

## Step 3: Follow-Up Polish Prompt Inside Google AI Studio

After Google AI Studio builds the initial version of **CampusPulse AI**, test the 5 tabs in the live preview and run this follow-up polish prompt before downloading the project ZIP for **Google Antigravity**:

```text
Refine CampusPulse AI with these targeted enhancements:
1. Make sure all 3 "Load Realistic Scenario" preset buttons on the Intake tab and the "Load Sample Campus Vendor Quotes" button on the Vendor Comparator tab work with 1 click and pre-populate rich, realistic Indian college tech-fest data (including named student coordinators, volunteer squads, room numbers, and INR ₹ figures).
2. In the Volunteer & Coordinator Command Center tab, add a quick "Add Coordinator Log Entry" input (e.g., "AV vendor asked for 50% advance by Friday" or "CSE Seminar Hall projector repaired") that feeds directly into the Gemini "Generate AI Executive Ops Briefing" call, and include a "Copy Message" button on each AI-generated WhatsApp/Email volunteer broadcast.
3. In the "What-If" Fest Crisis Simulator, show clear green/amber/red rupee (`₹`) delta badges comparing the current budget allocation against the selected trade-off option before the user clicks "Apply Selected Trade-Off to Master Plan".
```

