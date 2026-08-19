# Lemma Replay Guard: Comprehensive Web Frontend Codebase Survey

**Author**: Explorer 1 (Codebase Explorer)  
**Date**: 2026-08-18  
**Scope**: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/web` and surrounding repository context  
**Status**: COMPLETE

---

## 1. Executive Summary & Architecture Overview

The **Lemma Replay Guard** (`trace2test`) web application is a specialized developer observability and CI/CD regression guard interface designed for AI agent platform engineers. It bridges the gap between production runtime failure telemetry (OpenTelemetry / OpenInference) and deterministic, zero side-effect regression gating in continuous integration pipelines.

The codebase is organized as a modern, high-performance React 19 + TypeScript + Vite single-page application configured with Tailwind CSS, Lucide icons, Framer Motion, and Canvas Confetti.

### Key Architectural Layers:
1. **Presentation & Design System Layer**: Industrial dark theme (`#090b10`, `#0c0f17`, `#0d111a`) with fine-line borders (`border-white/[0.08]`), subtle grid overlays, ambient radial glow canvas, and semantic status accents (Emerald for Pass/Success, Rose for Error/Failure, Violet for CI/CD, Cyan for Tools/Mocks, Amber for Warnings).
2. **Telemetry Ingestion & Waterfall Layer**: Step-by-step distributed trace waterfall displaying execution spans, latency distribution bars, model tokens, error traceback banners, and a deep-inspection drawer with formatted arguments/outputs and `.lemma.eval.yaml` schema generation.
3. **Prompt Patch & Diff IDE Layer**: Split-view and unified visual diff editor comparing failing system prompts with patched guard prompts, accompanied by live textarea editing, model switching (`GPT-4o`, `Claude 3.5 Sonnet`, `GPT-4o-mini`, `DeepSeek-V3`), and one-click schema patch injection.
4. **Execution Sandbox & Deterministic Mock Harness**: Interactive replay simulator with speed controls (1x, 2x, 4x), live log stream, simulated mock responses (Stripe, SQL, GitHub), cycle breaking assertions, and exit-code validation.
5. **CI/CD Diff Matrix & PR Bot Layer**: Multi-metric differential dashboard ($\Delta\text{Latency}$, $\Delta\text{Tokens}$, $\Delta\text{Cost}$ / 1M runs, pass rate) alongside a production-accurate GitHub PR Bot comment widget with copyable markdown and collapsible test evidence.
6. **Developer Integrations**: Quick Command Palette (`⌘K` / `Ctrl+K`) for trace search and keyboard navigation, plus a 4-tab export modal for GitHub Actions YAML, Cursor/Claude MCP configuration, CLI commands, and Python SDK scripts.

---

## 2. Tooling, Dependencies, & Configuration

### 2.1 Package & Dependencies (`web/package.json`)
```json
{
  "name": "lemma-replay-studio",
  "version": "0.1.0",
  "dependencies": {
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "framer-motion": "^12.40.0",
    "lucide-react": "^1.16.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "tailwind-merge": "^3.0.1",
    "three": "^0.174.0"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.9.0",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@types/three": "^0.174.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.5.3",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "vite": "^6.2.0"
  }
}
```

### 2.2 Vite Configuration (`web/vite.config.ts`)
- **Port**: Configured explicitly for `3173`.
- **Host**: `true` (listens on all network interfaces).
- **Plugins**: `@vitejs/plugin-react`.

### 2.3 TypeScript Configuration (`web/tsconfig.json`)
- Target: `ES2020`, Module: `ESNext`, Bundler resolution.
- Strict mode enabled (`"strict": true`).
- `allowImportingTsExtensions: true`, `noEmit: true`.

### 2.4 Tailwind Configuration & CSS (`web/tailwind.config.js`, `web/src/index.css`)
- **Colors**:
  - `lemma.dark`: `#090d16`
  - `lemma.card`: `#0f172a`
  - `lemma.border`: `#1e293b`
  - `lemma.accent`: `#10b981` (Emerald)
  - `lemma.cyan`: `#06b6d4`
  - `lemma.violet`: `#8b5cf6`
- **Typography**:
  - `sans`: `['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif']`
  - `mono`: `['JetBrains Mono', 'Fira Code', 'monospace']`
- **Custom Utilities (`index.css`)**:
  - `.devtools-panel`: `bg-[#0e121b]/85 border border-white/[0.08] shadow-sm`
  - `.devtools-panel-active`: Emerald border highlight with subtle glow.
  - `.devtools-card`: `bg-[#0d111a] border border-white/[0.07]`
  - `.grid-subtle`: 24px subtle geometric grid lines.
  - `.glow-ambient`: Soft top-radial gradient blending emerald and cyan tints.
  - Linear/Vercel-style 6px minimalist scrollbars.

---

## 3. Data Models & Mock Data Inventory

Location: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/web/src/data/sampleTraces.ts`

### 3.1 Type Definitions
```typescript
export interface TraceStepData {
  step_index: number;
  type: 'LLM_CALL' | 'TOOL_EXECUTION' | 'USER_MESSAGE';
  name?: string;
  call_id?: string;
  model?: string;
  arguments?: Record<string, any>;
  output?: any;
  error_message?: string;
  latency_ms: number;
  tokens?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  status: 'SUCCESS' | 'ERROR';
}

export interface SampleTraceData {
  id: string;
  name: string;
  category: string;
  agent_id: string;
  trace_id: string;
  timestamp: string;
  failure_type: string;
  failure_badge_color: string;
  failure_summary: string;
  root_cause: string;
  system_prompt_original: string;
  system_prompt_patched: string;
  user_input: string;
  steps: TraceStepData[];
  baseline_metrics: {
    latency_ms: number;
    tokens: number;
    cost_usd: number;
  };
  replay_metrics: {
    latency_ms: number;
    tokens: number;
    cost_usd: number;
  };
  mock_tools: Array<{
    name: string;
    description: string;
    expected_args: Record<string, any>;
    forbidden_keys?: string[];
    simulated_response: any;
    latency_ms: number;
  }>;
  assertions: Array<{
    rule: string;
    description: string;
    type: string;
  }>;
}
```

### 3.2 Production Failure Scenarios in Mock Dataset
| Scenario ID | Name & Category | Failure Type | Root Cause & Mechanism | Assertions Enforced |
|---|---|---|---|---|
| `stripe_hallucination` | **Stripe Refund Param Hallucination** (Billing & Payments) | `TOOL_PARAMETER_HALLUCINATION` | Agent hallucinated `'currency_format: US_DOLLARS'` in `process_stripe_refund`. Patched prompt injects strict schema constraints. | `no_error_steps`, `tool_called`, `no_forbidden_keys`, `max_tool_steps` |
| `sql_schema_drift` | **Unsanitized Raw SQL Query Drift** (Data & Analytics) | `SCHEMA_VIOLATION` | Agent built unescaped raw string query with single-quote syntax break instead of parameterized format `{query_template, params}`. | `no_error_steps`, `required_keys_present`, `no_forbidden_keys` |
| `infinite_retry_loop` | **GitHub Triager 6-Step Loop** (Developer Tooling) | `INFINITE_LOOP` | Missing error handling on `404 MilestoneNotFound` caused 6-step loop. Patched prompt injects fallback query + termination rule. | `max_tool_steps`, `no_error_steps` |

---

## 4. Component Inventory & Interactive Workflows

| Component Path | Role & Key Features | Requirements Mapping |
|---|---|---|
| `src/components/Navbar.tsx` | Sticky top navigation with Lemma branding, live failure status indicator, search bar triggering Command Palette (`⌘K`), anchor section links, and quick export trigger. | R1, R5 |
| `src/components/HeroSection.tsx` | High-impact YC F25 header with value proposition, Quick Launch CTAs, and interactive right-column cards for switching active production failure feeds. | R1, R2 |
| `src/components/TraceWaterfall.tsx` | Distributed trace waterfall showing execution spans, timeline ruler (0ms to total duration), color-coded span bars (LLM/Tool/Error), 5-col Span Inspector drawer for payload/schema triage, and view switches for `.lemma.eval.yaml` and raw OTel JSON. | R2 |
| `src/components/PromptDiffEditor.tsx` | Code diff IDE supporting Split and Unified views, syntax highlighting of additions/deletions, custom prompt textarea with char/token counters, model dropdown (`GPT-4o`, `Claude 3.5 Sonnet`, `GPT-4o-mini`, `DeepSeek-V3`), and one-click schema patch button. | R3 |
| `src/components/ExecutionConsole.tsx` | Deterministic replay sandbox console with speed controls (1x, 2x, 4x), live log stream simulation, mock tool dispatchers (Stripe/SQL/GitHub), exit-code evaluator, assertion checklist, and celebratory confetti. | R4 |
| `src/components/CIRegressionMatrix.tsx` | Performance differential dashboard ($\Delta\text{Latency}$, $\Delta\text{Tokens}$, $\Delta\text{Cost}$, Assertion pass rate) and a realistic GitHub PR Bot comment widget with copyable markdown and collapsible test evidence table. | R5 |
| `src/components/ArchitectureGraph.tsx` | 5-stage closed telemetry-to-eval engine pipeline visualization: Production Agent → Lemma Ingest → Zero-FX Sandbox → Deterministic Replay → CI PR Gate Bot. | R1 |
| `src/components/CommandPalette.tsx` | Modal dialog triggered by `Cmd+K` / `Ctrl+K` or search bar. Features live fuzzy filtering over failure traces, quick action hotkeys (`G R`, `G C`, `G E`), and keyboard navigation. | R5 |
| `src/components/McpCliExportModal.tsx` | Modal with 4 integration tabs: GitHub Actions workflow YAML, CLI commands, Cursor/Claude MCP Server config JSON, and Python SDK script snippet with one-click copy buttons. | R5 |
| `src/components/Footer.tsx` | Minimal dark footer with YC F25 credits and external links. | R1 |
| *(Deprecated / Legacy)* `Canvas3DBackground.tsx` | Three.js particle canvas with heavy CPU/GPU load. Replaced in `App.tsx` with high-performance CSS grid + ambient glow per R1. | Replaced for R1 |
| *(Deprecated / Legacy)* `TraceIngestor.tsx` | Earlier combined trace ingestor, superseded by modular `TraceWaterfall.tsx`. | Modularized |
| *(Deprecated / Legacy)* `ReplayStudio.tsx` | Earlier monolithic studio view, refactored into decoupled `PromptDiffEditor.tsx` and `ExecutionConsole.tsx`. | Modularized |

---

## 5. Requirement-by-Requirement Audit & Gap Analysis

| Requirement | Specification | Implementation Status | Findings / Verification |
|---|---|---|---|
| **R1. Industrial Dark Theme & Micro-Typography** | High-density industrial dark design (`#090d16`, `#0f172a`, `border-white/[0.08]`), Inter & JetBrains Mono fonts, semantic functional accents, ambient glow canvas. | **FULLY SATISFIED** | High-density styling, precision status badges, and ambient glow are active in `App.tsx`, `index.css`, and `tailwind.config.js`. Heavy Three.js 3D visuals are cleanly replaced. |
| **R2. Distributed Trace Waterfall & Flamegraph** | Interactive span waterfall with execution timing, network latency bars, token gauges, error highlights, collapsible inspection drawer with args/schemas/tracebacks. | **FULLY SATISFIED** | Implemented in `TraceWaterfall.tsx` with timeline ruler, step selection, payload viewing, `.lemma.eval.yaml` generation, and OTel JSON export. |
| **R3. Split-View Prompt Patch & Diff IDE** | Side-by-side & unified code diff editor, syntax styling, live in-browser editing, schema validation, one-click patch templates, model selector (GPT-4o, Claude 3.5 Sonnet, GPT-4o-mini, DeepSeek-V3). | **FULLY SATISFIED** | Implemented in `PromptDiffEditor.tsx` with split and unified diffs, line numbers, addition highlighting, model dropdown, and one-click schema auto-injection. |
| **R4. Zero Side-Effect Mock Harness & Replay Sandbox** | Deterministic tool mock inspector (Stripe, SQL, GitHub), step-by-step replay simulator with speed toggles (1x, 2x, 4x), live log stream, cycle detection, assertion checklist, pass/fail gating. | **FULLY SATISFIED** | Implemented in `ExecutionConsole.tsx` with deterministic mock contracts, animated playback, confetti on pass, and real-time assertion verification. |
| **R5. CI Regression Diff Matrix & GitHub PR Bot Comment** | Multi-metric differential dashboard ($\Delta$ latency, $\Delta$ tokens, $\Delta$ cost / 1M queries, pass rate), GitHub PR Bot comment widget with copyable markdown and collapsible evidence, `Cmd+K` Command Palette, and Developer Export Modal. | **FULLY SATISFIED** | Implemented in `CIRegressionMatrix.tsx`, `CommandPalette.tsx`, and `McpCliExportModal.tsx`. |

---

## 6. Build, Compilation, & Server Verification

- **Command**: `npm run build` (`tsc && vite build`)
- **Compilation Result**: **SUCCESS (Exit Code 0)**
- **Duration**: ~1.22s - 1.30s
- **Transformed Modules**: 1821 modules transformed
- **Bundle Output**:
  - `dist/index.html`: 1.09 kB (gzip: 0.63 kB)
  - `dist/assets/index-QR-FKZuz.css`: 33.31 kB (gzip: 6.38 kB)
  - `dist/assets/index-C8OL8LnH.js`: 286.97 kB (gzip: 83.16 kB)
- **Dev Server Port**: Configured to `3173` on `0.0.0.0` / `localhost` in `vite.config.ts`.
- **TypeScript & Lint Errors**: 0 errors.

---

## 7. Surrounding Repository Context

1. **Python Engine (`/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/engine`)**:
   - Contains the core `lemma_replay` Python package with:
     - `ingestor.py`: Ingests OpenTelemetry / OpenInference JSON traces into `.lemma.eval.yaml` fixtures.
     - `mock_harness.py`: Zero side-effect mock dispatcher verifying argument contracts.
     - `replay_runner.py`: Replays agents against mock harnesses.
     - `diff_engine.py`: Computes metric deltas ($\Delta\text{Latency}$, $\Delta\text{Tokens}$, $\Delta\text{Cost}$).
     - `reporters/`: `markdown_reporter.py` (PR Bot format) and `rich_reporter.py` (Terminal ANSI).
     - `cli.py`: Command-line interface (`lemma-replay ingest`, `lemma-replay run`).
2. **Eval Fixtures (`/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/evals`)**:
   - `eval_stripe_refund.lemma.yaml`: Real-world schema guard eval fixture for Stripe refund argument validation.
   - `eval_sql_injection.lemma.yaml`: Parameterized SQL injection prevention fixture.
   - `eval_infinite_loop.lemma.yaml`: Loop breaker and milestone error handling fixture.
3. **Documentation**:
   - `TECHNICAL_BIBLE.md`: 300+ line technical architecture specification defining data schemas, telemetry conversion contracts, and CI gating protocols.
   - `PROJECT_BRIEF.md`: Strategic executive summary highlighting the value proposition for Jerry Zhang & Cole Gawin.

---

## 8. Summary of Findings & Next Steps

The web frontend codebase is in a complete, clean, and error-free state. All 5 core functional requirements (R1–R5) are mapped to dedicated modular components, styled with precision dark-mode aesthetics, backed by rich mock data, and compiled with zero TypeScript or build issues.
