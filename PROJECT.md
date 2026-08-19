# Lemma Replay Guard — System Architecture & Implementation Blueprint

> **Project**: Lemma Replay & CI Regression Guard (`trace2test`)  
> **Aesthetic Standard**: High-Density Linear/Vercel Industrial Dark Theme  
> **Framework Stack**: React 19 • TypeScript 5.7 • Vite 6 • Tailwind CSS • Framer Motion • Lucide Icons • Canvas Confetti  
> **Status**: Production-Ready (`tsc && vite build` clean)

---

## 1. Executive Summary & Problem Context

**Lemma** (YC F25) captures production OpenTelemetry / OpenInference traces when AI agents fail silently due to:
1. **Tool Parameter Hallucinations** (e.g. injecting unsupported `currency_format` into Stripe SDK invocations).
2. **Schema & Security Drifts** (e.g. concatenating unescaped raw SQL strings rather than parameterized queries).
3. **Unhandled Infinite Retry Loops** (e.g. endlessly retrying missing GitHub milestone titles without fallback).

**Lemma Replay Guard** bridges the 60-second gap between production failure ingestion and immutable, side-effect-free CI regression testing. It synthesizes versioned eval fixtures (`.lemma.eval.yaml`), provides a side-by-side prompt patch IDE, simulates deterministic replays against sandboxed mocks, computes differential metrics ($\Delta$ latency, $\Delta$ tokens, $\Delta$ USD cost / 1M runs), and generates production-accurate GitHub PR bot comments for gating PR merges to `main`.

---

## 2. Feature Inventory & Requirement Traceability (R1 – R5)

| Requirement | Module / Component | Implementation Details | Key Edge Cases Handled |
|---|---|---|---|
| **R1. Industrial Dark Theme & Micro-Typography** | `AmbientBackground.tsx`, `index.css`, `tailwind.config.js`, `Navbar.tsx` | • Industrial dark palette (`#090d16`, `#0f172a`, `border-white/[0.08]`)<br>• Inter body typography (`letter-spacing: -0.011em`) + JetBrains Mono for metrics/code<br>• Subtle 24px geometric grid with interactive radial cursor glow<br>• Precision 2px glowing status dots (`.status-dot-emerald`, `.status-dot-rose`, etc.) | Fallback gracefully across all viewport sizes without heavy 3D GPU battery drain. |
| **R2. Distributed Trace Waterfall & Flamegraph** | `TraceWaterfall.tsx`, `data/sampleTraces.ts` | • Interactive millisecond timing ruler with 0ms, 25%, 50%, 75%, 100% markers<br>• Span duration bars with 8% min-width clamping so sub-10ms spans remain clickable<br>• Collapsible 5-column Span Inspector drawer (latency, status, tokens, arguments JSON, captured output, error traceback)<br>• Multi-view switcher: Span Waterfall, Hierarchical Flamegraph, `.lemma.eval.yaml` Spec, Raw OTel JSON<br>• Root-cause triage alert banner with failure summary and triage note<br>• 3 production failure presets (Stripe refund, SQL query drift, GitHub loop) | Automatically synchronizes active step on trace switch via `useEffect`. Clamps offset + width to prevent timeline boundary overflow. |
| **R3. Split-View Prompt Patch & Diff IDE** | `PromptDiffEditor.tsx`, `lib/diffEngine.ts`, `lib/costModel.ts` | • Bespoke pure-TypeScript Myers / Longest Common Subsequence (LCS) diff algorithm<br>• Side-by-side Split Diff and Unified Diff views with line gutters and addition (`+`) / deletion (`-`) highlights<br>• Live in-browser editable textarea with real-time character count and token estimator (`Math.ceil(chars / 4)`)<br>• Multi-model selector (`gpt-4o`, `claude-3-5-sonnet`, `gpt-4o-mini`, `deepseek-v3`) with dynamic pricing rate hints<br>• One-click schema patch templates ("Auto-Inject Schema Guard" & "Restore Baseline") | Handles identical prompt comparisons (0 lines modified), prompt expansions, and multi-line reordering smoothly. |
| **R4. Zero Side-Effect Mock Harness & Replay Sandbox** | `ExecutionConsole.tsx`, `types/telemetry.ts` | • Deterministic mock contract inspector displaying expected arguments, forbidden keys, and simulated payloads for Stripe, SQL DB, and GitHub<br>• Step-by-step replay simulator with speed controls (1x, 2x, 4x) and playback controls (Play, Pause, Step Forward, Reset)<br>• Live streaming terminal console logging timestamped events (`INIT`, `INGEST_TRACE`, `LLM_DISPATCH`, `MOCK_DISPATCH`, `MOCK_SUCCESS`, `REJECTION`) with dynamic payloads per trace<br>• Excessive execution loop / cycle detection banner (`LOOP_BREAKER_TRIGGERED`) when retry thresholds are exceeded<br>• Real-time assertion checklist evaluation with dynamic rule checkmarks<br>• Targeted confetti celebration burst on passing replay | Interval timer properly cleared on unmount; state machine handles speed changes and step pauses without index desynchronization. |
| **R5. CI Regression Diff Matrix & Developer Center** | `CIRegressionMatrix.tsx`, `CommandPalette.tsx`, `McpCliExportModal.tsx`, `App.tsx` | • 4-card performance differential dashboard ($\Delta$ latency ms & %, $\Delta$ tokens, $\Delta$ USD cost / 1M runs, assertion pass rate)<br>• Dynamic cost calculation powered by selected model pricing rates<br>• Realistic GitHub PR Bot Comment preview widget with copyable markdown and collapsible test evidence<br>• Globally wired Command Palette (`Cmd+K` / `Ctrl+K`) with fast fuzzy search and section shortcuts (`G W`, `G R`, `G C`, `G E`)<br>• 4-tab Developer Export Center (GitHub Actions YAML, MCP server config for Cursor & Claude, CLI commands, Python SDK) | Robust clipboard copy with fallback textarea execution; ignores hotkeys when typing in text inputs. |

---

## 3. System Architecture & Code Layout

```
Lemma/
├── ORIGINAL_REQUEST.md             # Authoritative user requirements
├── PROJECT.md                      # System architecture & implementation blueprint
└── web/
    ├── index.html                  # HTML entry point with Inter & JetBrains Mono fonts
    ├── package.json                # Project dependencies (React 19, Framer Motion, Lucide, Confetti)
    ├── tailwind.config.js          # Tailwind theme tokens & color definitions
    ├── tsconfig.json               # Strict TypeScript configuration
    ├── vite.config.ts              # Vite bundler configuration
    └── src/
        ├── App.tsx                 # Main layout orchestrator & global keyboard shortcut listener
        ├── main.tsx                # Application root mounting
        ├── index.css               # Theme base layer, custom scrollbars, and glowing status dots
        ├── types/
        │   └── telemetry.ts        # Authoritative TypeScript interface contracts
        ├── lib/
        │   ├── diffEngine.ts       # Myers LCS line-by-line & split diff engine
        │   └── costModel.ts        # Model pricing tables and token-to-USD calculation
        ├── data/
        │   └── sampleTraces.ts     # Production failure fixtures (Stripe, SQL, GitHub)
        └── components/
            ├── AmbientBackground.tsx    # Sleek CSS/SVG grid & radial cursor parallax glow
            ├── Navbar.tsx               # Sticky glassmorphism header & command palette trigger
            ├── HeroSection.tsx          # YC F25 header & live failure feed selector
            ├── TraceWaterfall.tsx       # R2: Distributed Trace Waterfall, Flamegraph & YAML Spec
            ├── PromptDiffEditor.tsx     # R3: Split & Unified Prompt Diff IDE + Model Selector
            ├── ExecutionConsole.tsx     # R4: Deterministic Replay Sandbox, Terminal Logs & Assertions
            ├── CIRegressionMatrix.tsx   # R5: 4-Card Differential Metrics & GitHub PR Bot Comment
            ├── CommandPalette.tsx       # R5: Global Cmd+K keyboard action launcher
            ├── McpCliExportModal.tsx    # R5: Developer Export Center (CI, MCP, CLI, SDK)
            ├── ArchitectureGraph.tsx    # 5-Stage Closed Telemetry-to-CI Pipeline Visualizer
            └── Footer.tsx               # Minimal developer tools footer
```

---

## 4. TypeScript Interface Contracts (`src/types/telemetry.ts`)

```typescript
export type SpanType = 'LLM_CALL' | 'TOOL_EXECUTION' | 'USER_MESSAGE' | 'SYSTEM_PROMPT';
export type StepStatus = 'SUCCESS' | 'ERROR' | 'PENDING';
export type ModelId = 'gpt-4o' | 'claude-3-5-sonnet' | 'gpt-4o-mini' | 'deepseek-v3';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TraceStepData {
  step_index: number;
  type: SpanType;
  name?: string;
  call_id?: string;
  model?: string;
  arguments?: Record<string, any>;
  output?: any;
  error_message?: string;
  latency_ms: number;
  tokens?: TokenUsage;
  status: StepStatus;
  start_offset_ms?: number;
}

export interface MockToolDefinition {
  name: string;
  description: string;
  expected_args: Record<string, any>;
  forbidden_keys?: string[];
  simulated_response: any;
  latency_ms: number;
}

export interface AssertionRule {
  rule: string;
  description: string;
  type: string;
  passed?: boolean;
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
  mock_tools: MockToolDefinition[];
  assertions: AssertionRule[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface ModelPricing {
  modelId: ModelId;
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
}
```

---

## 5. Verification & Quality Gates

1. **Compilation Gate**:
   ```bash
   cd web && npm run build
   # Executing `tsc && vite build` -> Passed with code 0 (Zero errors)
   ```
2. **Interactive Workflow Verification**:
   - Trace preset switching dynamically updates Waterfall, Flamegraph, YAML Spec, Diff IDE, Terminal Logs, and CI Differential Cards.
   - Replaying with original prompt triggers mock schema rejection (`Exit Code: 1`), assertion failures, and loop detection warnings when applicable.
   - Replaying with patched prompt passes all assertions (`Exit Code: 0`), emits mock response payloads, and fires confetti.
   - `Cmd+K` / `Ctrl+K` and chord hotkeys (`G W`, `G R`, `G C`, `G E`) navigate seamlessly across sections.
   - PR comment markdown and export snippets copy cleanly with 2000ms visual confirmation.
