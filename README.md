# CampusPulse AI — University Tech-Fest & Event Execution Engine

[![Google for Developers](https://img.shields.io/badge/Google%20for%20Developers-PromptWars%20Challenge%205-4285F4?style=flat-square&logo=google)](https://promptwars.in/promptwarsVirtual.html)
[![Model](https://img.shields.io/badge/Gemini%202.5%20Flash-Structured%20JSON-34A853?style=flat-square&logo=googlegemini)](https://aistudio.google.com/)
[![React](https://img.shields.io/badge/React%2019-Vite%20SPA-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Serverless](https://img.shields.io/badge/Vercel-Serverless%20Functions-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![Tests](https://img.shields.io/badge/Unit%20Tests-19%2F19%20Passing-emerald?style=flat-square)](file:///d:/Campus-Pulse/Campus-Pluse/src/utils/festEngine.test.ts)

> **Flagship submission for Google for Developers x Hack2skill PromptWars Challenge 5: "GenAI-Powered Celebration & Event Planner"**  
> Built for student festival coordinators, technical society leads, and department chairs managing high-stakes inter-college festivals, 24-hour hackathons, and multi-track symposia.

---

## Table of Contents
1. [Project Overview & Problem Statement Alignment](#1-project-overview--problem-statement-alignment)
2. [Target Persona & Domain-Grounded Authenticity](#2-target-persona--domain-grounded-authenticity)
3. [System Architecture & Security Model](#3-system-architecture--security-model)
4. [The 5 Core Coordinator Workspaces + Custom Features](#4-the-5-core-coordinator-workspaces--custom-features)
5. [Prompt Engineering & Structured Schemas](#5-prompt-engineering--structured-schemas)
6. [Engineering Blueprints & Documentation Hub](#6-engineering-blueprints--documentation-hub)
7. [Local Development, Testing & Verification](#7-local-development-testing--verification)
8. [Vercel Production Deployment Guide](#8-vercel-production-deployment-guide)

---

## 1. Project Overview & Problem Statement Alignment

Most AI event planners fail in practice because they act like generic party chat-bots: offering vague checklists, ungrounded budget guesses, and ignoring real-world campus bureaucracy. 

**CampusPulse AI** was architected from the ground up for university tech-fest organizers. It handles the chaotic reality of campus event management—where Dean approvals gate AV rigging, multi-track seminar halls clash with academic schedules, title sponsor tranches arrive late, and volunteer squads get reshuffled during mid-terms.

### PromptWars Challenge 5 Rubric Alignment

| Challenge 5 Evaluation Dimension | Evaluator Expectation (Challenge 5 Explainer Session) | How CampusPulse AI Solves It |
| :--- | :--- | :--- |
| **Problem Statement Alignment** | Clarifying questions, trade-offs, budget logic, dependency gating | Two-step intake wizard asks 3–4 context-aware clarifying questions before plan generation; schedules enforce strict approval dependencies. |
| **Meaningful Gemini Integration** | Live structured reasoning beyond basic text logs | Centralized `@google/genai` calls with 6 strict JSON `responseSchema` definitions for intake, schedule, volunteer briefings, outreach, crisis simulation, and vendor comparison. |
| **Security & Architecture** | Zero exposed client-side credentials, serverless isolation | All Gemini API calls route through a secure backend `/api/planner` serverless function. `GEMINI_API_KEY` is never exposed in client bundles. |
| **Code Quality & Testing** | Modular SDLC, unit tests, accessible UI | 19 unit tests passing (`src/utils/festEngine.test.ts`), strict TypeScript interfaces, semantic HTML5 landmarks, WCAG AA contrast, and explicit `aria-label` coverage. |
| **Disruption Management** | Mid-stream shock handling with concrete trade-offs | Dynamic "What-If" crisis simulator computes rupee (`₹`) budget delta badges, venue adjustments, and volunteer shift rebalancing without wiping the master plan. |

---

## 2. Target Persona & Domain-Grounded Authenticity

CampusPulse AI targets **University Student Festival Convenors, Technical Society Leads, and Faculty Event Advisors** managing:
* **Scale**: 200 to 1,500 participants across multiple colleges
* **Budgets**: ₹1,50,000 to ₹10,00,000 INR
* **Logistics**: 24–36 hour hackathons, 4–8 simultaneous tracks (Main Auditorium, Lab Blocks, Seminar Halls, Central Lawn)
* **Human Resources**: 20 to 50 active student volunteers across 5 specialized squads

### Authentic Indian Campus Fest Presets
Evaluators can test realistic data with one click on the Intake Wizard:
1. **TechnoVerse '26**: ₹4,50,000 Budget · 500 Attendees · 36-Hr Hackathon + 6 Tech Tracks · 4 Weeks Out
2. **Synergy Inter-College Fest**: ₹8,00,000 Budget · 1,200 Attendees · Cultural + Robotics + Gaming · 6 Weeks Out
3. **Dev Days Community Summit**: ₹1,50,000 Budget · 250 Attendees · Single-Day Workshop & Pitch Fest · 3 Weeks Out

---

## 3. System Architecture & Security Model

CampusPulse AI follows a robust client-serverless architecture designed for zero API key leakage and 100% deterministic fallback reliability.

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Vite + React 19 Client UI                            │
│  • Intake Wizard (Clarifying Questions)   • Dual-Track Budget Matrix   │
│  • Dependency-Gated Timeline              • Volunteer Command Center   │
│  • "What-If" Crisis Shock Simulator       • Vendor Quote Comparator    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ POST /api/planner (Action + Payload)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                 Vercel Serverless Function (/api/planner.ts)           │
│  • Reads process.env.GEMINI_API_KEY (Server-Side Only)                 │
│  • Enforces gemini-2.5-flash with 6 Structured Output Schemas         │
│  • Graceful Zero-Downtime Fallback to festEngine.ts if Key Absent     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
      Google Gemini API                    Deterministic Engine
      gemini-2.5-flash                     src/utils/festEngine.ts
      Structured JSON Schemas              Instant Offline Calibration
```

### Zero-Exposure Security Guarantee
* **No Client Keys**: `GEMINI_API_KEY` is read strictly on the server (`api/planner.ts` or `server.ts`).
* **Vite Config Guarded**: No environment secrets are injected into client-side `import.meta.env`.
* **Repository Hygiene**: `.aistudio/` artifacts untracked from Git; `.env*` excluded in `.gitignore`.

---

## 4. The 5 Core Coordinator Workspaces + Custom Features

### Workspace 1: Two-Step Clarifying Intake Wizard
* **Stage A (Brief Intake)**: Captures Fest Name, Category, INR Budget (`₹`), Expected Footfall, Weeks Out, Active Volunteers, Venue Tracks, and Priority Sliders.
* **Stage B (AI Clarifying Engine)**: Invokes Gemini `generateClarifyingQuestions` to evaluate campus risks (Dean hostel/lab permissions, Wi-Fi generator loads, sponsor disbursement schedules, semester exam clashes) with quick-select chips.
* **Plan Synthesis**: Generates the comprehensive `FestMasterPlan` upon submitting answers.

### Workspace 2: Dependency-Gated Schedule & Dual-Track Budget Dashboard
* **KPI Command Bar**: Tracks Total Budget (`₹`), Confirmed Vendor Spend (`₹`), Uncommitted Buffer (`₹`), Active Volunteers, and 0–100% Execution Readiness Score.
* **Dual-Track Budget Matrix**: Categorizes expenses into Stage/AV, Hackathon Wi-Fi/Power, Catering & Midnight Refreshments, Swag & IDs, Hospitality, and Prize Buffer. Differentiates `AI Estimated Cost (₹)` from `Confirmed Quote Cost (₹)` to prevent budget overruns.
* **Dependency-Sequenced Schedule**: Separates *Critical-Path Campus Approvals* (Dean sign-off, venue lock) from *Downstream Vendor & Volunteer Execution*. Automatically warns when downstream tasks are blocked by pending upstream prerequisites.

### Workspace 3: Volunteer Command Center & Task Outreach Assistant
* **Roster Management**: Groups volunteer tasks across Technical & Lab Ops, Sponsorship & Finance, Logistics & Catering, Stage & PR Squad, and Registration Desks.
* **Interactive Status Toggles**: Quickly flip tasks between `Completed`, `In-Progress`, `Pending`, and `Blocked`.
* **Task-Level AI Outreach Draft Assistant**: Click on any volunteer task to auto-generate customized copyable outreach messages for WhatsApp squad broadcasts, Dean approval emails, and vendor SLA escalations.
* **Live Coordinator Activity Log**: Student leads record timestamped field updates (e.g., "AV vendor requested 50% advance by Friday") which feed directly into AI summaries.

### Workspace 4: "What-If" Ripple-Effect & Fest Crisis Simulator
* **Pre-Engineered Campus Crisis Scenarios**:
  1. *Registration Surge*: +150 last-minute inter-college teams arrive
  2. *Sponsorship Delay*: Title sponsor delays ₹75,000 tranche; cash flow runs tight
  3. *Venue Clash*: Main Auditorium double-booked by university admin for 4 hours
  4. *Volunteer Crunch*: 6 core coordinators unavailable due to rescheduled exams
* **AI Ripple Analysis**: Displays affected budget categories, venues, and squads with green/amber/red rupee (`₹`) delta badges.
* **3 Concrete AI Trade-Off Strategies**: Proposes Strategy A (Reallocate contingency), Strategy B (Compress track schedules), and Strategy C (Emergency mini-sponsor bridge).
* **In-Place Rebalancing**: Coordinators can apply any strategy directly to the master plan with one click.
* **Applied Shock Audit Log**: Maintains a historical audit ledger of all simulated crises and applied strategies.

### Workspace 5: Side-by-Side Campus Vendor Quote Comparator
* **Comparative Bidding**: Evaluate 2–3 competing bids per procurement category (Sound & AV Rigging, Midnight Catering, Custom Swag/Badges).
* **AI Quote Evaluation (`evaluateVendorQuotes`)**: Scores vendors on Budget Fit (0–100), Campus Reliability (0–100), Hidden Cost Risk (Low/Moderate/High), and actionable Negotiation Tips.
* **Quote Lock**: Locking a confirmed vendor converts that category in the Master Budget from `AI Estimate` to `Confirmed Quote` and recalculates remaining fest buffer.

### Custom Workflow Enhancements
* **Global AI Executive Briefing Drawer**: Slide-out briefing displaying live fest readiness score, progress snapshot, critical bottlenecks, and 48-hour action plan.
* **JSON & Markdown Master Runbook Export**: Export complete festival state as human-readable Markdown or full JSON schema for offline portability.

---

## 5. Prompt Engineering & Structured Schemas

All Gemini API integrations utilize `@google/genai` (`gemini-2.5-flash`) with strict structured JSON schemas:

| Schema Name | Target Workflow | Output Structure |
| :--- | :--- | :--- |
| `CLARIFYING_QUESTIONS_SCHEMA` | Intake Wizard | Array of 3–4 questions with category, whyItMatters, suggestedOptions |
| `MASTER_PLAN_SYNTHESIS_SCHEMA` | Schedule & Budget | Dependency-sequenced schedule nodes and dual-track budget allocations |
| `EXECUTIVE_OPS_SUMMARY_SCHEMA` | Volunteer Ops | Executive snapshot, squad bottlenecks, 48-hr priority actions, broadcasts |
| `OUTREACH_DRAFT_SCHEMA` | Task Outreach Assistant | WhatsApp squad broadcasts, Dean emails, and vendor SLA notices |
| `CRISIS_SIMULATION_SCHEMA` | Crisis Simulator | Ripple effect analysis, rupee delta breakdown, 3 concrete trade-off strategies |
| `VENDOR_QUOTE_COMPARISON_SCHEMA`| Vendor Comparator | Vendor scores, reliability ratings, hidden cost warnings, negotiation tips |

---

## 6. Engineering Blueprints & Documentation Hub

Detailed documentation, sprint plans, and engineering logs are located inside the [`docs/`](file:///d:/Campus-Pulse/Campus-Pluse/docs) directory:

- [docs/MASTER_PROJECT_LOG.md](file:///d:/Campus-Pulse/Campus-Pluse/docs/MASTER_PROJECT_LOG.md) — Comprehensive engineering log tracking Challenge 5 requirements, persona selection rationale, pre-deployment audit findings, and milestone logs.
- [docs/PHASE_1_AI_STUDIO_BLUEPRINT.md](file:///d:/Campus-Pulse/Campus-Pluse/docs/PHASE_1_AI_STUDIO_BLUEPRINT.md) — Phase 1 Google AI Studio prototyping blueprint, system instructions, master build prompts, and follow-up polish prompts.
- [docs/PHASE_2_ANTIGRAVITY_BLUEPRINT.md](file:///d:/Campus-Pulse/Campus-Pluse/docs/PHASE_2_ANTIGRAVITY_BLUEPRINT.md) — Phase 2 Google Antigravity hardening blueprint, pre-deployment audit fixes, Vitest setup, and Vercel routing configuration.

---

## 7. Local Development, Testing & Verification

### Prerequisites
* **Node.js**: v20+ or v22+
* **npm**: v10+
* **Google AI Studio API Key**: Get a free API key from [aistudio.google.com](https://aistudio.google.com/app/apikey)

### Quick Start
```bash
# 1. Clone the repository
git clone https://github.com/FaTeHvEeR-cyber/Campus-Pluse.git
cd Campus-Pluse

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env and paste your GEMINI_API_KEY
```

### Running Locally
```bash
# Start local development server with Express proxy + Vite client
npm run dev

# Open http://localhost:3000 in your browser
```

### Running Unit Tests
CampusPulse AI includes a 19-test suite verifying budget formulas, dependency trees, readiness scores, vendor quote locking, and crisis trade-off simulations:
```bash
# Run unit tests via Vitest
npm test

# Or run tests using Node's built-in test runner
npm run test:node
```

### Production Build Check
```bash
# Verify TypeScript typing and production asset build
npm run lint
npm run build
```

---

## 8. Vercel Production Deployment Guide

Deploying CampusPulse AI to Vercel takes under 2 minutes:

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: complete Phase 2 hardening upgrades for Vercel deployment"
   git push origin main
   ```
2. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new) and select `FaTeHvEeR-cyber/Campus-Pluse`.
   - Vercel automatically detects the Vite framework and root `vercel.json`.
3. **Configure Environment Variables**:
   - Add `GEMINI_API_KEY` = `your_google_ai_studio_api_key`
   - Add `GEMINI_MODEL` = `gemini-2.5-flash`
4. **Deploy**:
   - Click **Deploy**. Vercel will build the Vite SPA and deploy `/api/planner` as a Serverless Function.
   - Your live deployment is now ready for **Attempt 1** submission on Hack2skill!

---

*Developed with Google AI Studio, Google Antigravity, and Gemini 2.5 Flash for PromptWars Challenge 5.*

