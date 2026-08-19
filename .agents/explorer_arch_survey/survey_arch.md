# Lemma Replay Guard — Architectural Survey & Re-Engineering Blueprint
**Author**: Explorer 2 (Architecture Explorer)  
**Date**: 2026-08-18  
**Scope**: Frontend Re-engineering from prototype to world-class Linear/Vercel-style YC Developer Tools Observability Platform (`web/`)

---

## 1. Executive Architectural Summary

The Lemma Replay Guard web frontend (`web/`) is being elevated from a disconnected prototype into a world-class, high-density developer tools observability platform. It empowers AI engineers to turn silent semantic production failures (tool hallucination, raw SQL drift, infinite retry loops) into immutable CI regression test fixtures within 60 seconds with zero side-effects.

This survey provides:
1. **Architectural Delta Analysis**: Comprehensive evaluation of current codebase gaps vs. YC devtools requirements (Linear/Vercel/Langfuse standard).
2. **Library & Package Ecosystem Strategy**: Selection of high-performance, lightweight, React 19-compatible libraries vs custom zero-dependency implementations.
3. **Modular Component Hierarchy**: Structured decomposition into 5 core domains (Navigation/Global, Waterfall & Flamegraph, Prompt Patch IDE, Replay Sandbox, CI/CD Matrix & Bot).
4. **State Management & Reactive Store Architecture**: Centralized, type-safe state machine for deterministic replays, span inspection, diffing, and keyboard orchestration.
5. **Formal TypeScript Interface Contracts**: Complete data models for traces, spans, mocks, assertions, diffs, and replay execution.
6. **Milestone Decomposition**: 4 phased implementation milestones with verification gates.

---

## 2. Architectural Delta Analysis

| Domain / Requirement | Current Prototype State | Required World-Class State | Architectural Delta & Remedy |
|---|---|---|---|
| **R1. Visual Design & Industrial Theme** | • Three.js 3D lattice canvas is GPU-heavy and noisy.<br>• Inconsistent CSS (`slate-*` vs `zinc-*`, `glass-panel` vs `devtools-panel`).<br>• Loose typographic hierarchy. | • Linear/Vercel industrial dark theme (`#080b11`, `#0c101b`, `#121826`, `border-white/[0.08]`).<br>• Crisp Inter (`-0.015em`) + JetBrains Mono.<br>• Semantic functional accents (Emerald = Pass, Rose = Fail, Cyan = Mock, Violet = CI, Amber = Warning).<br>• Ambient glow canvas + subtle grid + Framer Motion spring physics. | **Major Overhaul**: Remove heavy Three.js particle loop in favor of CSS ambient mesh gradient + SVG grid lines. Standardize on Tailwind design tokens, precision status dots, and micro-typography pills. |
| **R2. Telemetry Waterfall & Flamegraph** | • `TraceWaterfall.tsx` exists in isolation, not rendered in `App.tsx`.<br>• Flat bar list lacking hierarchical nesting or flamegraph visualization.<br>• Minimal latency/token gauges. | • Interactive Distributed Trace Waterfall & Flamegraph.<br>• Zoomable timeline ruler (0ms → total latency).<br>• Hierarchical span nesting (Root Trace → LLM Generation → Tool Execution).<br>• Real-time token usage gauges ($T_{in}$, $T_{out}$).<br>• Collapsible Slide-over Span Inspection Drawer with raw payload, schema, and error tracebacks. | **Component Re-architecture**: Implement unified Waterfall + Flamegraph viewer with multi-tab switching (Waterfall, Flamegraph, `.lemma.eval.yaml`, Raw OTel JSON) and slide-over span inspector. |
| **R3. Prompt Patch & Diff IDE** | • `PromptDiffEditor.tsx` uses primitive newline matching (`origLines.includes(line)`), breaking on reorders.<br>• Duplicate textarea inside `ReplayStudio.tsx`.<br>• No real syntax diff formatting. | • Industrial Split (side-by-side) & Unified Diff IDE.<br>• Myers/LCS line-by-line diff with line numbers, chunk markers, and inline token highlighting.<br>• Model switcher (`gpt-4o`, `claude-3-5-sonnet`, `gpt-4o-mini`, `deepseek-v3`) with dynamic token pricing.<br>• One-click schema injection templates.<br>• Live validation badge and token estimator. | **Engine & UI Upgrade**: Build custom Myers diff algorithm with token diff calculation. Replace inline textareas in ReplayStudio with integrated PromptDiffEditor. |
| **R4. Mock Sandbox & Execution DAG** | • Hardcoded `setInterval` replay in two separate files (`ExecutionConsole.tsx` and `ReplayStudio.tsx`).<br>• No interactive replay controls (Play, Pause, Step Forward/Back, Reset, Speed: 1x/2x/5x/Instant).<br>• Mock tools listed without interactive payload verification. | • Deterministic Zero Side-Effect Mock Harness.<br>• Mock tool contract inspector for Stripe, SQL Database, and GitHub APIs.<br>• Step-by-step replay execution simulator with live streaming log terminal.<br>• Infinite loop / cycle detection warning banner.<br>• Real-time Assertion Checklist updating dynamically per step. | **State Machine & Console**: Create centralized Replay State Machine (`useReplayStore`) driving animated execution DAG, live log stream, and interactive assertion evaluation. |
| **R5. CI Regression Matrix & Export** | • Metric cards have static calculations.<br>• GitHub PR comment widget is partially styled with generic borders.<br>• `CommandPalette.tsx` keyboard triggers broken (not mounted in `App.tsx`).<br>• TypeScript build fails (`tsc` errors on missing props). | • Multi-metric differential dashboard ($\Delta$ latency ms & %, $\Delta$ tokens, $\Delta$ USD cost / 1M queries, pass rate).<br>• Pixel-perfect GitHub PR Bot Comment preview with collapsible test evidence and copy button.<br>• Fully wired Command Palette (`Cmd+K`, `G T`, `G R`, `G C`, `G E`).<br>• Developer Export Modal (GitHub Actions YAML, MCP Config for Cursor/Claude, CLI commands, Python SDK).<br>• Zero build/lint errors. | **Integration & Build Fix**: Wire global keyboard listener, connect CommandPalette & ExportModal in App root, and ensure 100% strict TypeScript compilation. |

---

## 3. Package & Library Evaluation

### 3.1 Existing Dependencies Analysis
The project currently has in `package.json`:
- `react: ^19.0.0` & `react-dom: ^19.0.0` (Modern React 19)
- `framer-motion: ^12.40.0` (Ideal for micro-spring physics, layout transitions, drawer slide-overs)
- `lucide-react: ^1.16.0` (High-density iconography)
- `canvas-confetti: ^1.9.4` (Visual celebration on CI pass)
- `clsx: ^2.1.1` & `tailwind-merge: ^3.0.1` (Utility styling classes)
- `three: ^0.174.0` & `@types/three` (WebGL 3D lattice)

### 3.2 Library Recommendations & Architectural Decisions

1. **Diff Viewer Engine**:
   - *Option A*: `@monaco-editor/react` (Heavy ~5-8MB bundle, Web Worker requirements, potential React 19 peer-dependency warnings, complex custom styling).
   - *Option B (Recommended)*: **Bespoke Pure-TypeScript Myers/LCS Diff Engine & Syntax Renderer**.
     - *Rationale*: Zero extra bundle overhead, instant load (<1ms), 100% customizable Linear/Vercel styling, handles Split (Side-by-side) and Unified diffs, renders chunk headers (`@@ -1,4 +1,6 @@`), line numbers, deletion highlights (`-` rose), addition highlights (`+` emerald), and character-level change highlighting.
2. **Flamegraph & Telemetry Visualizer**:
   - *Option A*: External heavy canvas flamegraph library (e.g. `flamebearer` or `d3-flame-graph` — difficult to integrate with dark industrial design system).
   - *Option B (Recommended)*: **Custom SVG / Flexbox High-Density Flamegraph & Waterfall Component**.
     - *Rationale*: Powered by React 19 + Framer Motion layout animations, crisp typography, sub-pixel SVG markers, responsive collapsible spans, and instant hover/click inspection drawers.
3. **Background Visuals**:
   - *Decision*: **Retire Three.js canvas in favor of sleek CSS Radial Mesh + Ambient SVG Grid + Framer Motion Telemetry Node Accents**.
   - *Rationale*: Three.js adds 600KB+ bundle weight, continuous GPU battery drain, and visual noise. The Linear/Vercel standard uses subtle CSS radial gradients (`radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.08) 0%, transparent 70%)`) and precise grid overlays (`background-size: 24px 24px`), which feel faster, crisper, and more professional.
4. **Icons & Typography**:
   - Use `lucide-react` with unified 14px/16px sizing (`w-3.5 h-3.5`, `w-4 h-4`) and `strokeWidth={1.5}` or `{1.75}` for an ultra-clean developer tool feel.
   - Use `Inter` for headers/labels (`tracking-tight`) and `JetBrains Mono` for code, latency timestamps, token counts, and diffs.

---

## 4. Modular Component Architecture

```
web/src/
├── data/
│   └── sampleTraces.ts            # Production failure traces, mock definitions, assertions
├── types/
│   └── telemetry.ts               # Core TypeScript interfaces (Trace, Span, Mock, Diff, Replay)
├── lib/
│   ├── diffEngine.ts              # Fast Myers/LCS line & word diff computation engine
│   ├── costModel.ts               # Model pricing tables & token-to-USD calculation
│   └── formatters.ts              # Latency, token, timestamp, and byte formatters
├── hooks/
│   ├── useReplayStore.ts          # Central reactive store for trace, replay, and assertion state
│   └── useKeyboardShortcuts.ts    # Global hotkey router (Cmd+K, Esc, G-T, G-R, etc.)
├── components/
│   ├── common/
│   │   ├── Navbar.tsx             # Linear-style top bar with command trigger & quick links
│   │   ├── Footer.tsx             # Clean footer with YC F25 credits & links
│   │   ├── AmbientBackground.tsx  # Sleek CSS glow grid (replaces noisy 3D Three.js)
│   │   ├── CommandPalette.tsx     # Cmd+K interactive action launcher & trace switcher
│   │   └── McpCliExportModal.tsx  # Developer Integration Center (CLI, MCP, GitHub Actions, SDK)
│   ├── hero/
│   │   └── HeroSection.tsx        # High-impact devtools header + live failure feeds selector
│   ├── waterfall/
│   │   ├── TraceWaterfall.tsx     # Main container with view switcher (Waterfall, Flamegraph, Spec, OTel)
│   │   ├── SpanWaterfallView.tsx  # Step-by-step latency bars & timeline ruler
│   │   ├── FlamegraphView.tsx     # Nested hierarchical flamegraph execution tree
│   │   ├── SpanDrawer.tsx         # Slide-over inspector for tool args, outputs & error tracebacks
│   │   └── SpecYamlViewer.tsx     # Auto-generated .lemma.eval.yaml with copy capability
│   ├── diff/
│   │   ├── PromptDiffEditor.tsx   # Split & Unified prompt diff IDE
│   │   ├── SplitDiffView.tsx      # Side-by-side comparison with chunk lines
│   │   ├── UnifiedDiffView.tsx    # Single-column unified diff with +/- gutter
│   │   └── ModelSelector.tsx      # Dropdown for GPT-4o, Claude 3.5 Sonnet, Mini, DeepSeek
│   ├── sandbox/
│   │   ├── ReplayStudio.tsx       # Replay Sandbox container orchestrating prompt + execution
│   │   ├── ExecutionConsole.tsx   # Live streaming terminal logs with timestamped events
│   │   ├── ExecutionDAG.tsx       # Animated DAG execution flow nodes with step pulses
│   │   ├── MockHarnessInspector.tsx # Zero side-effect mock contract viewer (Stripe/DB/GitHub)
│   │   └── AssertionChecklist.tsx # Real-time assertion pass/fail checklist with rule badges
│   └── ci/
│       ├── CIRegressionMatrix.tsx # Multi-metric differential dashboard (Δt, Δtokens, Δcost)
│       └── GitHubPRComment.tsx    # Pixel-perfect GitHub PR Bot comment widget with copyable markdown
└── App.tsx                        # Master layout orchestrator & keyboard provider
```

---

## 5. Interface Contracts & Data Models

### 5.1 Telemetry & Trace Types (`types/telemetry.ts`)
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
```

### 5.2 Diff & Cost Types
```typescript
export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
  highlightWords?: Array<{ word: string; type: 'added' | 'removed' }>;
}

export interface ModelPricing {
  modelId: ModelId;
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
}
```

### 5.3 Replay State Store Contract (`hooks/useReplayStore.ts`)
```typescript
export type PromptMode = 'patched' | 'original' | 'custom';
export type ReplayStatus = 'idle' | 'running' | 'paused' | 'completed';

export interface ReplayStoreState {
  selectedTrace: SampleTraceData;
  promptMode: PromptMode;
  customPrompt: string;
  activePrompt: string;
  selectedModel: ModelId;
  replayStatus: ReplayStatus;
  currentStepIndex: number;
  replaySpeed: 1 | 2 | 5;
  replayPassed: boolean;
  selectedSpan: TraceStepData | null;
  isCommandPaletteOpen: boolean;
  isExportModalOpen: boolean;
  activeTabWaterfall: 'waterfall' | 'flamegraph' | 'spec' | 'otel';
  
  // Actions
  selectTrace: (trace: SampleTraceData) => void;
  setPromptMode: (mode: PromptMode) => void;
  setCustomPrompt: (prompt: string) => void;
  setSelectedModel: (model: ModelId) => void;
  startReplay: () => void;
  pauseReplay: () => void;
  resetReplay: () => void;
  stepForward: () => void;
  setReplaySpeed: (speed: 1 | 2 | 5) => void;
  setSelectedSpan: (span: TraceStepData | null) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setExportModalOpen: (open: boolean) => void;
  setWaterfallTab: (tab: 'waterfall' | 'flamegraph' | 'spec' | 'otel') => void;
}
```

---

## 6. Diff Engine & Execution Mechanics

### 6.1 Diff Engine (`lib/diffEngine.ts`)
A lightweight, deterministic line-by-line diff algorithm:
1. Normalizes input prompts into line arrays.
2. Constructs a 2D Longest Common Subsequence (LCS) matrix.
3. Computes the optimal edit script producing `added`, `removed`, and `unchanged` lines.
4. Provides dual rendering adapters:
   - **Split View**: Aligns original lines (left) and patched lines (right) side-by-side with gutter line numbers.
   - **Unified View**: Emits continuous chunk format with `-` and `+` markers.

### 6.2 Deterministic Replay Simulation
1. When **`Execute Replay`** is triggered:
   - Sets `replayStatus = 'running'` and initializes step index at 0.
   - Replays steps sequentially with time delays scaled by `replaySpeed` (400ms / speed).
   - If `promptMode === 'original'`, the faulty step encounters schema rejection / infinite loop, failing assertions.
   - If `promptMode === 'patched'` or corrected `custom`, the deterministic mock harness returns successful payloads, passing all assertions.
   - Upon completion, calculates $\Delta$ metrics, updates assertion checklist, triggers confetti on pass, and unlocks the CI Matrix review button.

---

## 7. Milestone Decomposition

### Milestone 1: Design System & Core Store Foundation (Day 1)
- **Scope**:
  - Replace `Canvas3DBackground.tsx` with clean CSS/SVG `AmbientBackground.tsx`.
  - Establish complete typography, color tokens, and custom scrollbars in `index.css` & `tailwind.config.js`.
  - Create `types/telemetry.ts` and centralized `useReplayStore.ts`.
  - Wire global hotkey router in `useKeyboardShortcuts.ts`.
  - Fix all build/prop errors in `App.tsx` and ensure `tsc && vite build` passes.
- **Verification**: Clean build with zero TypeScript warnings; responsive industrial dark layout rendering on `localhost:3173`.

### Milestone 2: Distributed Trace Waterfall & Flamegraph Engine (Day 1-2)
- **Scope**:
  - Build `TraceWaterfall.tsx` with view tabs: Span Waterfall, Nested Flamegraph, Eval Spec (`.yaml`), Raw OTel JSON.
  - Implement dynamic timeline ruler with micro-second accuracy and token gauge indicators.
  - Build collapsible `SpanDrawer.tsx` slide-over inspector displaying arguments, schema constraints, and stack traces.
- **Verification**: Smooth span selection, responsive hover states, accurate latency offsets, and clean tab switching.

### Milestone 3: Split-View Prompt Patch IDE & Zero Side-Effect Mock Harness (Day 2)
- **Scope**:
  - Implement `lib/diffEngine.ts` with Myers/LCS diff algorithm.
  - Build `PromptDiffEditor.tsx` with Split and Unified views, line gutters, and inline change highlights.
  - Build `MockHarnessInspector.tsx` (Stripe, SQL DB, GitHub mocks).
  - Build interactive `ExecutionDAG.tsx` and `ExecutionConsole.tsx` with step-by-step playback controls (Play, Pause, Step, Speed).
  - Connect live assertion checking during replay.
- **Verification**: Switching between Patched/Original prompts instantly updates diff view and changes replay pass/fail outcome with live log streaming.

### Milestone 4: CI Regression Diff Matrix, GitHub PR Bot & Developer Center (Day 2-3)
- **Scope**:
  - Implement `CIRegressionMatrix.tsx` with dynamic $\Delta$ latency, $\Delta$ tokens, and $\Delta$ USD calculations based on selected model.
  - Build pixel-perfect `GitHubPRComment.tsx` with copyable markdown and collapsible test evidence.
  - Polish `CommandPalette.tsx` (`Cmd+K`) and `McpCliExportModal.tsx` (GitHub Actions YAML, MCP config, CLI, SDK).
  - Final end-to-end polish: Framer Motion spring physics, tooltips, responsive mobile/desktop layouts.
- **Verification**: 100% build pass, flawless interactive replay workflow, clipboard copy verified, and unmistakable YC devtools polish.

---

## 8. Risk Assessment & Mitigation

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| **External diff library bundle bloat & React 19 incompatibility** | High | Avoid heavy third-party Monaco packages. Use custom pure-TypeScript diff engine (`lib/diffEngine.ts`) tailored for prompt comparisons. |
| **State fragmentation across nested components** | Medium | Single source of truth via `useReplayStore` hook/context. All components consume clean interfaces. |
| **Animation performance degradation** | Low | Rely on CSS transforms, opacity, and hardware-accelerated Framer Motion springs. Avoid heavy canvas particle loops. |
| **TypeScript build regression during re-engineering** | High | Run strict `tsc && vite build` at each milestone increment. |

---

## 9. Conclusion

The proposed architecture delivers a pristine, ultra-responsive, and visually stunning YC developer tools observability platform. It tightly couples telemetry ingestion, prompt diffing, zero side-effect replay simulation, and CI/CD gating into a cohesive, production-grade web experience.
