# Phase 2 Blueprint: Repo-Specific Google Antigravity Hardening & Vercel Prep for `Campus-Pluse`

## Audit of `FaTeHvEeR-cyber/Campus-Pluse` Identifies High-Value Custom Features and Five Pre-Deployment Fixes

Inspection of your public repository [`FaTeHvEeR-cyber/Campus-Pluse`](https://github.com/FaTeHvEeR-cyber/Campus-Pluse) confirms a modular Phase 1 architecture with `api/planner.ts`, `server.ts`, `src/services/geminiService.ts`, `src/utils/festEngine.ts`, `src/utils/festEngine.test.ts`, and five dedicated workspace components (`IntakeWizardWorkspace.tsx`, `ScheduleBudgetWorkspace.tsx`, `VolunteerOpsWorkspace.tsx`, `CrisisSimulatorWorkspace.tsx`, and `QuoteComparatorWorkspace.tsx`), plus custom features like the **AI Executive Briefing Drawer**, **Task-Level Outreach Draft Assistant**, **Applied Shock Audit Log**, **Venue Type & Sponsor Target Modeling**, and **JSON Plan Import/Export**.

Before deploying to Vercel and submitting **Attempt 1** on [PromptWars: Virtual](https://hack2skill.com/event/pwvirtual1), we need [Google Antigravity](https://antigravity.google/docs/overview/) to resolve **5 repo-specific blockers** that would otherwise lower your score or cause production failures on Vercel:

| Audit Finding in `Campus-Pluse` | Impact on Vercel & Hack2skill Evaluator | Exact Fix in Google Antigravity |
| :--- | :--- | :--- |
| **1. `MODEL_NAME = 'gemini-3.8-flash'` in `api/planner.ts`** | Standard Google AI Studio keys return a `404` for `'gemini-3.8-flash'`, forcing your app onto static fallback data instead of real-time Gemini responses ([Challenge 5 Explainer Session](http://www.youtube.com/watch?v=fdi63eSyyYM)). | Change `MODEL_NAME` in `api/planner.ts` to `process.env.GEMINI_MODEL \|\| 'gemini-2.5-flash'`. |
| **2. Express `server.ts` vs. Vercel Serverless Routing** | Locally, `tsx server.ts` serves `/api/planner`, but Vercel static Vite builds require `api/planner.ts` to export a Vercel-compatible `default async function handler(req, res)` and a `vercel.json` config. | Ensure `api/planner.ts` exports a standard Vercel Serverless handler (`export default async function handler(req, res)`) and add `vercel.json`. |
| **3. Missing `"test"` Script & `vitest` in `package.json`** | Although `src/utils/festEngine.test.ts` exists, `package.json` lacks `"test": "vitest run"` and `vitest` in `devDependencies`, and `"name"` is still `"react-example"`. | Rename package to `"campuspulse-ai"`, install `vitest`, and add `"test": "vitest run"` to `package.json`. |
| **4. Missing `README.md` & Tracked `.aistudio/` Folder** | There is currently no `README.md` in the root, and `.aistudio/artifacts/brain/` is tracked in Git. The Hack2skill evaluator grades documentation and repo cleanliness heavily. | Remove `.aistudio/` from Git tracking (`git rm -r --cached .aistudio`), add `.aistudio/` to `.gitignore`, and generate a complete `README.md`. |
| **5. AI Vendor Comparison Endpoint in `QuoteComparatorWorkspace.tsx`** | `src/services/geminiService.ts` currently exports 5 Gemini functions; adding an `evaluateVendorQuotes` action in `api/planner.ts` and `geminiService.ts` ensures all 5 tabs use live Gemini analysis. | Add `evaluateVendorQuotes` to `api/planner.ts` and `src/services/geminiService.ts` with a structured schema. |

## Step 1: Prompt for Google Antigravity to Create the `docs/` Folder & Save Your Blueprints

Attach or paste your three documentation files (**Master Project & Engineering Log**, **Phase 1 Google AI Studio Blueprint**, and **Phase 2 Google Antigravity Blueprint**) into the [Google Antigravity](https://antigravity.google/docs/overview/) chat along with this prompt so the agent creates the `docs/` folder and stores them in your repository ([Google Antigravity Skills & Markdown Docs](https://antigravity.google/docs/skills/)):

```text
Create a `docs/` directory in the root of this repository and save the attached/provided project documentation files inside it with the following exact filenames:
1. `docs/MASTER_PROJECT_LOG.md` — The Master Project & Engineering Log (containing our PromptWars Challenge 5 rubric requirements, hybrid workflow decisions, and chronological engineering log entries).
2. `docs/PHASE_1_AI_STUDIO_BLUEPRINT.md` — The Phase 1 Google AI Studio Blueprint (containing the CampusPulse AI system instruction, master build prompt, and 5-module coordinator architecture).
3. `docs/PHASE_2_ANTIGRAVITY_BLUEPRINT.md` — The Phase 2 Google Antigravity Hardening & Vercel Prep Blueprint.

After creating those three files inside `docs/`, read through all three documents so you have the full project context, problem statement alignment rules, and custom feature history before we run the Phase 2 code updates and generate the root `README.md`.
```

## Step 2: Paste This Repo-Specific Hardening Prompt into Google Antigravity

Once Antigravity creates the `docs/` folder and confirms it has read the blueprints, paste the following prompt into the **Google Antigravity Agent** to fix all 5 audit findings in one clean pass while keeping every custom feature intact:

```text
Using the context in `docs/`, inspect the repository (`api/planner.ts`, `server.ts`, `package.json`, `vite.config.ts`, `src/types.ts`, `src/services/geminiService.ts`, `src/utils/festEngine.ts`, `src/utils/festEngine.test.ts`, `src/App.tsx`, and all 5 components in `src/components/`).

Execute the following Phase 2 production hardening upgrades for Vercel deployment and the Hack2skill PromptWars Challenge 5 automated code evaluator, without removing or breaking any existing UI feature or custom workflow:

1. FIX GEMINI MODEL ID & VERCEL SERVERLESS COMPATIBILITY IN `api/planner.ts`:
   - In `api/planner.ts`, update `MODEL_NAME` from `'gemini-3.8-flash'` to `process.env.GEMINI_MODEL || 'gemini-2.5-flash'` so live Gemini API calls succeed with standard Google AI Studio keys in production.
   - Ensure `api/planner.ts` exports a standard Vercel Serverless default handler (`export default async function handler(req: any, res: any)`) that handles `POST /api/planner` requests cleanly on Vercel while still remaining compatible with `server.ts` for local development.
   - Add a `vercel.json` file in the repository root configured for a Vite SPA + `/api/*` serverless functions so deploying to Vercel works out of the box with `GEMINI_API_KEY` set in Vercel Environment Variables.
   - Add a 6th structured Gemini action `evaluateVendorQuotes` (with a `VENDOR_QUOTE_COMPARISON_SCHEMA` in `api/planner.ts` and an exported `evaluateVendorQuotes` function in `src/services/geminiService.ts`) and wire a "Compare Quotes with Gemini AI" button in `src/components/QuoteComparatorWorkspace.tsx` so all 5 workspaces invoke live Gemini reasoning.

2. WIRE UP VITEST & EXPAND `src/utils/festEngine.test.ts`:
   - Update `package.json`: change `"name"` from `"react-example"` to `"campuspulse-ai"`, add `"test": "vitest run"` to `"scripts"`, and ensure `vitest` is installed in `devDependencies`.
   - Verify and expand `src/utils/festEngine.test.ts` so `npm test` runs and passes all unit tests covering budget calculations, dependency blocking, readiness score computation, vendor quote locking, and crisis simulation fallbacks.
   - Run `npm run lint`, `npm test`, and `npm run build` to confirm zero TypeScript, test, or build errors.

3. REPOSITORY HYGIENE & `.gitignore` CLEANUP:
   - Remove the `.aistudio/` directory from Git tracking (`git rm -r --cached .aistudio` and delete `.aistudio/`) and add `.aistudio/` and `.vercel/` to `.gitignore`.
   - Verify that `.env.example` clearly documents `GEMINI_API_KEY=your_google_ai_studio_api_key_here` and `GEMINI_MODEL=gemini-2.5-flash`, and confirm zero API keys or secrets exist anywhere in the codebase.

4. ACCESSIBILITY & COMPREHENSIVE `README.md`:
   - Ensure all interactive buttons, modals, and form controls across `src/App.tsx` and `src/components/*.tsx` have explicit `aria-label` attributes and semantic landmarks.
   - Create a detailed, well-structured `README.md` in the root directory (and link to the three blueprints inside `docs/`) covering:
     - Project Overview & Problem Statement Alignment for Google x Hack2skill PromptWars Challenge 5
     - Target Persona: University & Inter-College Tech-Fest Coordinator ("CampusPulse AI")
     - Architecture Diagram & Security Model (`React 19 + Vite Client -> /api/planner Serverless Endpoint -> @google/genai gemini-2.5-flash with Structured JSON Schemas + Deterministic Fallback Engine`)
     - Complete Breakdown of All 5 Core Workspaces + Custom Features (Clarifying Questions Wizard, Critical-Path Schedule & Dual-Track Budget Matrix, Volunteer Ops & Task Outreach Assistant, AI Executive Ops Briefing Drawer, Crisis & Shock Simulator with Applied Shock Audit Log, Vendor Quote Comparator, and JSON Plan Import/Export)
     - Prompt Engineering Strategy & Schema Enforcement (referencing `docs/MASTER_PROJECT_LOG.md`, `docs/PHASE_1_AI_STUDIO_BLUEPRINT.md`, and `docs/PHASE_2_ANTIGRAVITY_BLUEPRINT.md`)
     - Local Development (`npm install`, `.env`, `npm run dev`), Testing (`npm test`), and Vercel Deployment Instructions.
```

## Step 3: Commit, Push & Deploy to Vercel

After Antigravity finishes running Step 2 and confirms `npm test` and `npm run build` succeed, run these commands in the Antigravity terminal:

```bash
git status
git add .
git commit -m "feat: add docs blueprints, harden Vercel serverless route, fix Gemini model ID, add Vitest and README"
git push origin main
```

Then deploy on **Vercel**:
1. Import `FaTeHvEeR-cyber/Campus-Pluse` into your Vercel Dashboard.
2. Under **Environment Variables**, add `GEMINI_API_KEY` with your Google AI Studio API key (and optionally `GEMINI_MODEL` set to `gemini-2.5-flash`).
3. Click **Deploy** and share the live Vercel URL here so we can verify the live deployment before you submit **Attempt 1** on Hack2skill!

