# Sales Pitch Intelligence System

A local-first, full-stack web app for a performance marketing agency. It ingests RFPs,
discovery call transcripts, ad platform exports (Meta/Google/TikTok/YouTube/AppLovin), Shopify
exports, creative scorecards, screenshots, and prior pitch materials, and produces a complete,
evidence-grounded **Pitch Strategy Package**: RFP decode, discovery synthesis, business
diagnosis, paid media / creative / Shopify audit findings, measurement maturity score, win
strategy, a 12-slide deck outline with talk tracks, and Q&A prep.

All strategy content is LLM-generated but explicitly grounded in an **Evidence Vault** built from
the files you upload — every prompt is instructed to label claims as *Supported by uploaded
data*, *Directional inference*, *Needs validation*, or *Missing data*, and to never invent
numbers that aren't in the source material.

## Architecture Overview

- **Next.js (App Router) + TypeScript + Tailwind CSS** — single repo, npm, no separate backend.
- **SQLite** (`better-sqlite3`) for all project metadata, files, evidence, and generated
  artifacts. DB file lives at `./data/db.sqlite`.
- **Local filesystem storage** for uploaded files under `./data/uploads/<projectId>/`.
- **File parsing**: `pdf-parse` (PDF), `mammoth` (DOCX), `xlsx` (SheetJS, used for both XLSX and
  CSV), plain text for `.txt`/`.md`.
- **LLM layer** (`lib/llm.ts`): a single `callLLM(systemPrompt, userPrompt, opts)` function that
  picks Anthropic or OpenAI based on which API key is set in the environment. If neither key is
  set, it falls back to a clearly-labeled deterministic mock generator so the app is fully
  demoable without any keys — all mock output is prefixed `[MOCK LLM OUTPUT — no
  ANTHROPIC_API_KEY/OPENAI_API_KEY set]`.
- **Prompt library** (`/prompts/*.md`): one markdown file per generation module, each with
  Role / Task / Inputs / Rules / Output Schema / Quality Bar / Anti-Hallucination Requirements
  sections, loaded server-side as the system prompt for that module.
- **Generation modules** (`lib/modules/*.ts`): one file per pitch-package component. Modules that
  involve structured data (paid media, creative, Shopify) do real deterministic computation
  (spend concentration, ROAS/CPA/MER, grade distributions) before calling the LLM to interpret
  the computed numbers — so calculations are never hallucinated.
- **Parsers** (`lib/parsers/*.ts`) and **classification** (`lib/classify.ts`): files are
  classified by a combination of filename heuristics and detected spreadsheet headers (e.g.
  "Amount spent" + "Reach" + "Frequency" → Meta; "Order ID" + "Net Sales" → Shopify).
- **Scoring** (`lib/scoring.ts`): pure functions for creative grading, measurement maturity
  scoring, audit finding prioritization, and spend concentration — covered by unit tests.

## Data Model

SQLite tables (see `lib/db.ts`) and matching TS types (`lib/types.ts`):

- **projects** — name, prospect name, category, pitch stage, due date, budget/channels/goals,
  notes, generation status/step/error.
- **uploaded_files** — original filename, stored path, extension, size, detected/overridden
  source type, detected metadata (JSON), extracted text, extraction status.
- **evidence** — the grounding layer. Each row: source file, source type, page/sheet,
  row/section, extracted text, metric name/value, date range, confidence (High/Medium/Low/
  Missing), tags.
- **generated_artifacts** — one row per generation module per project, storing the structured
  JSON output (RFP summary, transcript synthesis, business diagnosis, audit findings,
  measurement plan, win strategy, recommendations, slides, talk tracks, Q&A items).

## Running Locally

```bash
npm install
npm run dev
```

Visit `http://localhost:3000`.

### Enabling real LLM generation

By default, with no API key set, the app runs in **mock mode** — fully functional, but all
narrative content is clearly labeled as mock output. To generate real, grounded strategy content:

```bash
# create a .env.local (not committed) with one of:
ANTHROPIC_API_KEY=sk-ant-...
# or
OPENAI_API_KEY=sk-...
```

Restart `npm run dev` after setting the key. The active provider is shown on the **Settings**
page (`/settings`).

### Running tests

```bash
npm run test
```

Unit tests (`tests/`) cover the scoring functions (creative grading, measurement maturity,
audit finding priority, spend concentration) and the file classification / parsing utilities.

### Building for production

```bash
npm run build
npm start
```

## Deploying to Vercel

1. **Push repo to GitHub** and import the project in the [Vercel dashboard](https://vercel.com/new).
2. **Provision a Vercel Postgres database** from the Vercel dashboard (Storage tab) and connect it
   to your project. Vercel will inject `DATABASE_URL` (and related `POSTGRES_*` vars) automatically.
3. **Provision Vercel Blob storage** from the Vercel dashboard (Storage tab) and connect it.
   Vercel will inject `BLOB_READ_WRITE_TOKEN` automatically.
4. **Add your LLM key** as an environment variable:
   - `ANTHROPIC_API_KEY` (preferred) or `OPENAI_API_KEY`
5. **Run the database migration** once after provisioning Postgres:
   ```bash
   DATABASE_URL=<your-connection-string> npm run migrate
   ```
   Or run it from the Vercel dashboard (Project → Settings → Environment Variables → Functions).
6. **Deploy** — Vercel will run `npm run build` automatically on push.

### Environment variables reference

See `.env.example` for all variables. For local development, none are required (SQLite + local
filesystem are the defaults). For production Vercel deployment, set:

| Variable | Purpose | Required for Vercel? |
|---|---|---|
| `ANTHROPIC_API_KEY` | Real LLM generation (Anthropic) | Either this or OpenAI |
| `OPENAI_API_KEY` | Real LLM generation (OpenAI) | Either this or Anthropic |
| `DATABASE_URL` | PostgreSQL connection string | Yes — provision via Vercel Postgres |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob upload token | Yes — provision via Vercel Blob |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `https://your-project.vercel.app`) | Optional — add directly in Vercel dashboard, do **not** use a secret reference |

**How the storage adapters work**: When `DATABASE_URL` is set, `lib/db.ts` uses the Postgres
adapter (`lib/db-pg.ts`). When not set, it uses the local SQLite database. When
`BLOB_READ_WRITE_TOKEN` is set, file uploads are stored in Vercel Blob. When not set, files
are stored locally under `./data/uploads/`. Text extraction always happens at upload time, so
the parsing code never needs to re-read the file after the initial ingest.

## Acceptance-Criteria Walkthrough

1. **Create a project** — go to `/`, fill in project name, prospect/brand name, category, pitch
   stage, due date, budget, channels, goals, and notes, then submit.
2. **Upload demo files** — on the project Workspace tab, drag-and-drop (or browse for) the sample
   files in `/demo`:
   - `sample_rfp.txt` (classified as RFP)
   - `sample_transcript.txt` (classified as Transcript)
   - `sample_meta_ads.csv` (classified as Meta platform data)
   - `sample_google_ads.csv` (classified as Google platform data)
   - `sample_shopify_export.csv` (classified as Shopify)
   - `sample_creative_scorecard.csv` (classified as Creative Scorecard)
   You can override any detected classification on the **Inputs** tab.
3. **Generate the package** — click "Generate Pitch Package" on the Workspace tab. The UI polls
   generation status until it reaches `done` (or `error`, with the error message surfaced).
4. **View results across tabs**:
   - **Analysis Dashboard** — RFP summary, discovery synthesis, business diagnosis, win strategy.
   - **Audit Findings** — paid media findings (with computed spend/ROAS/CPA/concentration
     metrics), creative grade distribution + findings, Shopify business health (net sales, AOV,
     CVR, MER) + findings, measurement maturity score (1-5) with rationale and roadmap.
   - **Slide Builder** — 12-slide outline with key messages, supporting points, evidence
     references, and 30s/60s talk tracks per slide. Export buttons for Markdown and Slides JSON.
   - **Evidence Vault** — every extracted fact, searchable and filterable by source file and
     confidence level.
   - **Q&A Prep** — anticipated tough questions with grounded suggested answers.
5. **Export** — Markdown export of the full pitch package, JSON export of the slide outline, CSV
   export of audit/Shopify findings (all via buttons on the Slide Builder / Audit Findings pages,
   or directly via `/api/projects/:id/export/{markdown,slides-json,findings-csv}`).

## Project Structure

```
app/                      Next.js App Router pages + API routes
  api/projects/...        Projects CRUD, file upload, per-module generate endpoints, exports
  projects/[id]/...       Workspace, Inputs, Analysis, Audit, Slides, Evidence, Q&A pages
  settings/               Read-only LLM provider config display
components/               Client components (upload, generate panel, file list, evidence vault)
lib/
  db.ts                   SQLite schema + connection
  types.ts                Shared TS types for the data model
  llm.ts                  Provider-agnostic LLM wrapper + mock fallback
  prompts.ts               Loads /prompts/*.md as system prompts
  classify.ts             File classification heuristics
  ingest.ts                Upload -> classify -> extract -> evidence pipeline
  evidence.ts              Evidence CRUD + prompt-block formatting
  scoring.ts               Pure scoring functions (creative grade, maturity, priority, concentration)
  exporters.ts             Markdown / JSON / CSV export builders
  pipeline.ts              Orchestrates the full MVP generation pipeline
  parsers/                 pdf.ts, docx.ts, xlsx.ts, csv.ts, text.ts
  modules/                 One generation module per pitch-package component
prompts/                   Markdown prompt library (one file per module)
demo/                      Sample RFP/transcript/CSV files for demoing without real client data
tests/                     Vitest unit tests
data/                      (gitignored) sqlite db + uploaded files, created at runtime
```

## What's Implemented (MVP)

All MVP scope items from the spec are implemented and verified end-to-end: project creation,
multi-file upload with classification (user-overridable), extraction for PDF/DOCX/XLSX/CSV/TXT
with evidence generation, RFP summary, transcript synthesis, paid media audit (with real
spend-concentration math), creative scorecard grading, Shopify analysis (with MER tie-in to paid
spend when available), business diagnosis, win strategy, 12-slide outline + talk tracks, Evidence
Vault UI, and Markdown/JSON exports.

## Phase 2 Status

All Phase 2 items are now implemented:

- **Measurement maturity scoring** (1-5 rubric): implemented and wired into the pipeline.
- **Q&A Prep engine**: implemented with category grouping UI.
- **CSV export of findings**: implemented for audit findings and roadmap items.
- **4 C's + Comms Compass + SOAP module**: `lib/modules/fourCs.ts`, wired at
  `POST /api/projects/[id]/generate/four-cs`, displayed in the Analysis Dashboard.
- **Pitch critique/QC engine**: `lib/modules/pitchCritique.ts`, wired at
  `POST /api/projects/[id]/generate/critique`, displayed in the Analysis Dashboard with
  per-dimension scores (1-10) and actionable verdict.
- **Screenshot manual-tagging UI**: inline form in the Inputs tab for files classified as
  screenshots (image ext or `source_type === "screenshot"`). Tags saved to the `image_tags`
  column on `uploaded_files` and displayed inline in the file list.
- **30/60/90 Roadmap page**: dedicated `/projects/[id]/roadmap` page with phase grouping,
  per-item complexity/owner/KPI/dependency display, and "Export CSV" button linking to
  `/api/projects/[id]/export/roadmap-csv`.
