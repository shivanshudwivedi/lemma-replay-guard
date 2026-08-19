# Authoritative Specification & Feature Inventory: Lemma Replay Guard

> **Project**: Lemma Replay & CI Regression Guard (`trace2test`) Frontend Re-Engineering  
> **Author**: Specification Miner Agent  
> **Source Documents**: `ORIGINAL_REQUEST.md`, `PROJECT_BRIEF.md`, `TECHNICAL_BIBLE.md`, `README.md`, codebase in `web/` and `engine/`  
> **Target Framework**: React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + Lucide Icons  
> **Target Integrity**: Zero-error TypeScript compilation (`tsc && vite build`), High-density Linear/Vercel DevTools observability aesthetic

---

## 1. Executive Summary & Problem Context

**Lemma** (YC F25, $2.3M Pre-seed led by Matrix, Liquid 2, YC, OpenAI/xAI/Meta/DoorDash angels) captures runtime telemetry and silent semantic failures in AI agents. However, engineering teams face a critical gap: **turning production failure traces into immutable, side-effect-free CI regression tests within 60 seconds**.

The web frontend of Lemma Replay Guard serves as the primary visual interface for:
1. Ingesting and diagnosing production silent failures (parameter hallucinations, SQL injection/schema drifts, unhandled retry loops).
2. Inspecting distributed OpenInference / OpenTelemetry spans in a high-density waterfall and flamegraph viewer.
3. Patching system prompts and testing alternative model configurations in a split-view code diff IDE.
4. Executing deterministic replay simulations against zero-side-effect mock harnesses with cycle detection and live log streaming.
5. Computing multi-metric performance diffs ($\Delta$ latency, $\Delta$ tokens, $\Delta$ USD cost per 1M runs) and generating production-accurate GitHub PR bot comments.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|---|---|---|---|---|---|---|
| 1 | R1: Theme & Typography | Industrial Dark Design System | Crisp, high-density dark theme (`#090d16`, `#0f172a`, `border-white/[0.08]`) with semantic accents reserved strictly for functional states. | CSS theme tokens, tailwind config, DOM hierarchy | High-contrast, glare-free dark UI surface | Fallback to default zinc/slate palette if custom class missing | `ORIGINAL_REQUEST.md` (R1), `index.css`, `tailwind.config.js` |
| 2 | R1: Theme & Typography | Micro-Typography Hierarchy | Inter for body text with tight tracking (`-0.011em`) and JetBrains Mono for code, metrics, token counts, timestamps, and schemas. | Font declarations, CSS font-family stacks | Clean readability, monospace numerical alignment | Fallback to system monospace/sans-serif | `ORIGINAL_REQUEST.md` (R1), `TECHNICAL_BIBLE.md` §6 |
| 3 | R1: Theme & Typography | Ambient Glow & Grid Canvas | Subtle geometric 24px grid overlay with radial ambient glow and Framer Motion spring physics replacing noisy 3D visuals. | Viewport dimensions, mouse movement coordinates | Smooth subtle gradient backdrop with interactive depth | Graceful CSS fallback if canvas unsupported | `ORIGINAL_REQUEST.md` (R1), `Canvas3DBackground.tsx` |
| 4 | R1: Theme & Typography | Precision Status Dots & Badge Pills | 2px glowing status dots (emerald, rose, cyan, violet) and compact badge pills for execution states and error categories. | Status enum (`SUCCESS`, `ERROR`, `FAILED`, `RESOLVED`) | Visual status indicators with 20% opacity backdrops | Unrecognized status displays neutral zinc pill | `ORIGINAL_REQUEST.md` (R1), `sampleTraces.ts` |
| 5 | R2: Trace Waterfall | Distributed Span Waterfall Viewer | Interactive horizontal waterfall timeline showing step-by-step execution timing, span offsets, duration bars, and token gauges. | Trace steps array (`TraceStepData[]`), baseline total duration | Visual timeline bars with accurate percentage offsets and durations | Clamps minimum width to 8% so short spans remain clickable | `ORIGINAL_REQUEST.md` (R2), `TraceWaterfall.tsx` |
| 6 | R2: Trace Waterfall | Collapsible Span Inspector Drawer | Detailed metadata drawer displaying clicked step type, latency (ms), token breakdown, input arguments, output payloads, and rejection errors. | Click on span row (`selectedStep`) | Formatted JSON arguments, output preview, traceback | Displays formatted error callout if `error_message` present | `ORIGINAL_REQUEST.md` (R2), `TraceWaterfall.tsx` |
| 7 | R2: Trace Waterfall | Root Cause Diagnostic Banner | High-priority alert banner highlighting silent failure type, failure summary, and root-cause analysis from production telemetry. | `failure_type`, `failure_summary`, `root_cause` | Rose-tinted triage alert box at top of waterfall | Hidden if trace status is clean/success | `ORIGINAL_REQUEST.md` (R2), `TECHNICAL_BIBLE.md` §2.1 |
| 8 | R2: Trace Waterfall | Multi-View Mode Switcher | Toggle between Span Waterfall timeline (`waterfall`), YAML Eval Spec (`schema_spec`), and Raw Telemetry JSON (`raw_otel`). | User tab selection button | Rendered waterfall UI, formatted YAML pre block, or formatted JSON | Retains selected step state across mode toggles | `TraceWaterfall.tsx`, `TraceIngestor.tsx` |
| 9 | R2: Trace Waterfall | Production Trace Preset Feeds | Quick selector gallery for 3 realistic production failure scenarios (Stripe refund hallucination, SQL injection drift, GitHub infinite loop). | Preset array (`SAMPLE_TRACES`) | Active trace selection and UI state refresh | Automatically resets replay playback and custom edits | `sampleTraces.ts`, `TraceIngestor.tsx`, `HeroSection.tsx` |
| 10 | R3: Prompt Diff IDE | Side-by-Side Split Code Diff | Split-screen editor comparing original failing system prompt (left) against patched prompt with schema constraints (right). | `system_prompt_original`, `system_prompt_patched` | Dual-pane code view with line numbers and highlighted line additions | Line-wraps long prompt instructions smoothly | `ORIGINAL_REQUEST.md` (R3), `PromptDiffEditor.tsx` |
| 11 | R3: Prompt Diff IDE | Unified Line-by-Line Diff View | Consolidated single-column diff view rendering additions in green (`+ line`) and unchanged lines with line index gutters. | Diff view mode toggle (`split` vs. `unified`) | Unified diff view with emerald highlighted additions | Gracefully handles multiline prompt expansions | `ORIGINAL_REQUEST.md` (R3), `PromptDiffEditor.tsx` |
| 12 | R3: Prompt Diff IDE | Live In-Browser Prompt Editor | Editable textarea allowing developers to customize system prompts with real-time character counter and estimated token calculation. | Custom prompt text string, textarea keystrokes | Live updated active prompt string passed to Replay Runner | Real-time token recalculation (`Math.ceil(chars / 4)`) | `ORIGINAL_REQUEST.md` (R3), `PromptDiffEditor.tsx` |
| 13 | R3: Prompt Diff IDE | Multi-Model Selector Engine | Dropdown allowing model configuration between `gpt-4o`, `claude-3-5-sonnet`, `gpt-4o-mini`, and `deepseek-v3`. | Model selection dropdown | Updates active model identifier and cost differential calculations | Defaults to trace baseline model if unselected | `ORIGINAL_REQUEST.md` (R3), `TECHNICAL_BIBLE.md` §4 |
| 14 | R3: Prompt Diff IDE | One-Click Patch Templates | Quick-action toolbar button ("Auto-Inject Schema Guard") that automatically applies verified schema patches to system prompts. | Button click event | Replaces active prompt with patched prompt and sets mode to `patched` | Restores original if user switches mode back | `ORIGINAL_REQUEST.md` (R3), `PromptDiffEditor.tsx` |
| 15 | R4: Mock Sandbox | Deterministic Tool Mock Inspector | Displays mock contracts for Stripe, SQL database, and GitHub APIs with expected arguments, forbidden keys, simulated response, and latency. | `mock_tools` array in trace fixture | Formatted mock schema cards with forbidden keys warnings | Shows strict schema rejection if forbidden parameter present | `ORIGINAL_REQUEST.md` (R4), `TECHNICAL_BIBLE.md` §3 |
| 16 | R4: Mock Sandbox | Step-by-Step Replay Simulator | Animated execution engine re-running agent step sequence against deterministic mocks with playback speed controls (1x, 2x, 4x). | "Execute Replay" button, speed toggle | Incremental step progress animation, node highlighting, progress bar | Simulates failure if unpatched prompt active; passes if patched | `ORIGINAL_REQUEST.md` (R4), `ExecutionConsole.tsx`, `ReplayStudio.tsx` |
| 17 | R4: Mock Sandbox | Live Streaming Terminal Console | Terminal output window logging timestamped agent events (`INIT`, `INGEST_TRACE`, `LLM_DISPATCH`, `MOCK_DISPATCH`, `MOCK_SUCCESS`, `REJECTION`). | Replay runner state updates | Timestamped terminal text logs with color-coded log levels | Emits `Exit Code: 1` on regression failure, `Exit Code: 0` on pass | `ORIGINAL_REQUEST.md` (R4), `ExecutionConsole.tsx` |
| 18 | R4: Mock Sandbox | Cycle Detection & Step Gating | Safeguard monitoring execution loops (e.g. GitHub 6-step loop), halting execution if steps exceed assertion threshold. | `max_tool_steps` assertion rule, step counter | Triggers gating rejection if step count exceeds limit | Flags unhandled infinite loops with rose error banner | `ORIGINAL_REQUEST.md` (R4), `TECHNICAL_BIBLE.md` §1 |
| 19 | R4: Mock Sandbox | Assertion Guard Rules Checklist | Visual assertion checklist evaluating system safety, workflow fidelity, schema contracts, and loop breaker assertions. | `assertions` array (`rule`, `description`, `type`) | Real-time pass/fail checkmarks and gating summary badge | Displays red X icon on failing assertion rules when unpatched | `ORIGINAL_REQUEST.md` (R4), `ExecutionConsole.tsx`, `ReplayStudio.tsx` |
| 20 | R4: Mock Sandbox | Replay Success Particle Celebration | Targeted confetti celebration triggered when all assertions pass on replay completion. | Replay pass event (`willPass === true`) | Dynamic confetti burst (emerald, cyan, violet) | Suppressed if replay fails or user cancels | `ExecutionConsole.tsx`, `ReplayStudio.tsx` |
| 21 | R5: CI Diff Matrix | Multi-Metric Differential Dashboard | 4-card differential analytics displaying Regression Status, Execution Latency ($\Delta t$, % change), Token Consumption ($\Delta \text{Tokens}$), and Cost Savings / 1M runs. | `baseline_metrics`, `replay_metrics`, model pricing | 4 high-density metric cards with strikethrough baselines and green deltas | Calculates negative deltas for improvements, positive for regressions | `ORIGINAL_REQUEST.md` (R5), `CIRegressionMatrix.tsx` |
| 22 | R5: CI Diff Matrix | Cost Calculation Engine | Pricing calculator evaluating USD cost per run and cost per 1M queries based on standardized model pricing ($2.50/$10 for GPT-4o, etc.). | Input tokens, output tokens, model rate table | Formatted dollar cost per run and projected savings per 1M invocations | Handles fractional cent values formatted to 5 decimal places | `TECHNICAL_BIBLE.md` §4, `CIRegressionMatrix.tsx` |
| 23 | R5: CI Diff Matrix | Production GitHub PR Bot Comment | Markdown bot comment simulator with authentic GitHub styling, collapsible assertion evidence, summary table, and copyable text. | Replay results, assertion list, trace metadata | Interactive PR comment preview with copyable markdown | Collapsible section expands/collapses on click | `ORIGINAL_REQUEST.md` (R5), `CIRegressionMatrix.tsx` |
| 24 | R5: CI Diff Matrix | Copy PR Markdown to Clipboard | One-click copy button copying GitHub-formatted markdown regression report directly to clipboard with visual copied indicator. | Click event on copy button | Clipboard write, temporary checkmark feedback (2000ms) | Displays error fallback if clipboard API denied | `ORIGINAL_REQUEST.md` (R5), `CIRegressionMatrix.tsx` |
| 25 | R5: CI Diff Matrix | Quick Command Palette (`Cmd+K`) | Keyboard-triggered modal (`Cmd+K` / `Ctrl+K`) for fuzzy searching traces, navigating sections, and running developer actions. | Keyboard shortcut, search query string | Filtered trace list, action triggers, shortcut badges (`G R`, `G C`, `G E`) | Dismisses on `Escape` key or backdrop click | `ORIGINAL_REQUEST.md` (R5), `CommandPalette.tsx` |
| 26 | R5: CI Diff Matrix | Developer Integration & Export Modal | Tabbed exporter containing copy-ready snippets for GitHub Actions YAML, Cursor/Claude MCP config, CLI commands, and Python SDK. | User tab selection, copy button clicks | Formatted syntax-highlighted snippets with single-click copy | Confirms copy with 2s checkmark animation per tab | `ORIGINAL_REQUEST.md` (R5), `McpCliExportModal.tsx` |
| 27 | Architecture Visualizer | Telemetry-to-CI Pipeline Diagram | 5-stage architectural flow diagram showing Production Runtime -> Ingest & Triage -> Zero-FX Sandbox -> Deterministic Replay -> CI Gate & PR Bot. | Static stage definitions | Interactive 5-card pipeline visualizer with hover micro-animations | Responsive grid collapses gracefully on mobile | `ArchitectureGraph.tsx`, `TECHNICAL_BIBLE.md` §1 |
| 28 | Navigation & Header | Sticky Glassmorphism Header | Sticky header with Lemma branding, live YC F25 badge, Command Palette trigger, section anchor navigation, and external links. | Scroll position, navigation clicks | Smooth scrolling to anchor sections, sticky backdrop blur | Stays pinned with `backdrop-blur-md` on scroll | `Navbar.tsx`, `App.tsx` |

---

## 3. Edge Cases Discovered

| # | Feature | Input / Condition | Observed & Required Behavior |
|---|---|---|---|
| 1 | Span Waterfall Timeline | Span with extremely short latency (e.g. 5ms in 2000ms trace) | Clamped to a minimum width of `8%` to prevent zero-width rendering and ensure the span remains interactive and clickable. |
| 2 | Span Waterfall Timeline | Trace with multiple sequential spans where cumulative offset exceeds timeline | Offset calculation uses running sum of previous span latencies divided by total duration (`Math.min(offsetPct, 92)%`) to prevent overflow beyond right boundary. |
| 3 | Prompt Diff IDE | System prompt containing no modifications (original == patched) | Unified and split diff render lines in neutral zinc styling without green addition highlights; diff counter displays `0 lines added`. |
| 4 | Prompt Diff IDE | Developer enters arbitrary multiline text in "Custom Edit" mode | Character count and estimated token count (`Math.ceil(chars / 4)`) dynamically update on every keystroke; textarea resizes smoothly without horizontal blowout. |
| 5 | Replay Execution Simulator | User switches prompt mode from "Patched" to "Original" while replay is running | Active interval cancels immediately, replay resets to step 0, and status evaluates to `FAILED` with gating rejection alert. |
| 6 | Replay Execution Simulator | Speed multiplier changed during active replay execution (e.g. 1x -> 4x) | Playback interval seamlessly adjusts timer delay (`450 / replaySpeed`) for remaining steps without resetting current step index. |
| 7 | Mock Tool Dispatcher | Tool call includes hallucinated parameter forbidden by mock contract (e.g. `currency_format`) | Mock dispatcher immediately intercepts the call, flags a `SCHEMA_VIOLATION`, emits a rejection traceback to console, and sets exit code to 1. |
| 8 | Mock Tool Dispatcher | Unhandled infinite retry loop (e.g. GitHub triager retrying 404 milestone 6 times) | Replay engine terminates at maximum configured tool step threshold (`max_tool_steps: 3`), asserting `Loop Breaker` failure. |
| 9 | CI Regression Diff Matrix | Trace where replay latency is equal or higher than baseline | Latency delta card renders red upward trend indicator (`+X ms slower`) rather than green downward savings indicator. |
| 10 | GitHub PR Bot Comment Exporter | Copy button clicked in an environment with restricted clipboard permissions (e.g. non-HTTPS iframe) | Catches clipboard promise rejection, provides fallback textarea selection, and retains UI stability. |
| 11 | Command Palette (`Cmd+K`) | User opens command palette and types non-matching query string | Displays empty state message (`"No matching production traces found"`) with options to view documentation or reset search. |
| 12 | Command Palette (`Cmd+K`) | User presses keyboard navigation keys (`Escape`, `Enter`, `ArrowUp`, `ArrowDown`) | `Escape` immediately closes modal; `Enter` navigates to selected trace or section action. |
| 13 | Multi-Model Cost Calculator | Model switched to high-cost model (e.g. Claude 3.5 Sonnet vs. GPT-4o-mini) | Cost per run and savings per 1M runs recalculate instantly using model's input ($3.00/M) and output ($15.00/M) pricing rates. |
| 14 | Responsive Layout | Viewport resized from desktop 1440px to mobile 375px | Split-diff IDE stacks vertically into single column, navbar collapses command search into icon, and waterfall renders scrollable timeline. |

---

## 4. Design System & Micro-Typography Specifications

### 4.1 Color System (Tailwind / CSS Variables)
```css
/* Surface & Background */
--bg-primary: #090d16;        /* Deep Industrial Charcoal */
--bg-secondary: #0f172a;      /* Slate Card Base */
--bg-panel: #0c0f17;          /* Panel Header Surface */
--bg-card: #0d111a;           /* DevTools Card Surface */
--border-subtle: rgba(255, 255, 255, 0.08);
--border-active: rgba(16, 185, 129, 0.4);

/* Functional Semantic Accents */
--accent-pass: #10b981;       /* Emerald: Resolved, Passing Assertions, Active Guards */
--accent-fail: #f43f5e;       /* Rose: Errors, Rejections, Hallucinated Params */
--accent-ci: #8b5cf6;         /* Violet: CI/CD, EvalOps, Gating Rules, LLM calls */
--accent-tool: #06b6d4;       /* Cyan: Tool Executions, Sandbox Mocks, Telemetry */
--accent-warn: #f59e0b;       /* Amber: Warnings, Retry loops, Cost differentials */
```

### 4.2 Typography Stack
- **Primary Interface Font**: `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
  - Body tracking: `-0.011em`
  - Headline tracking: `-0.025em`
  - Sizes: `10px` (micro badges), `11px` (labels/subtitles), `12px` (standard devtools text), `14px` (card titles), `24px`-`36px` (section headers)
- **Monospace Code Font**: `JetBrains Mono, Fira Code, 'SF Mono', Menlo, monospace`
  - Used for: Trace IDs, execution timestamps, code diffs, JSON arguments, token numbers, latency measurements, CLI snippets, and metric deltas.

### 4.3 Component Surface Hierarchy
1. **Background Layer**: `#090d16` with subtle 24px grid overlay and ambient radial glow.
2. **Panel / Section Layer**: `devtools-panel` (`rgba(14, 18, 27, 0.85)` + `border: 1px solid rgba(255, 255, 255, 0.08)` + subtle shadow).
3. **Elevated Card Layer**: `devtools-card` (`#0d111a` + `border: 1px solid rgba(255, 255, 255, 0.07)`).
4. **Interactive Hover / Active Layer**: `devtools-panel-active` with `rgba(16, 185, 129, 0.15)` glow.

---

## 5. Component Architecture & Data Contracts

### 5.1 Core Types & Interfaces
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

### 5.2 Component Hierarchy & Integration Map
```
App.tsx (Main Layout & State Coordinator)
 ├── Canvas3DBackground (Ambient Grid & Particle Mesh)
 ├── Navbar (Sticky Glass Header, Cmd+K search trigger, section navigation)
 ├── CommandPalette (Global Cmd+K keyboard shortcut modal)
 ├── HeroSection (Value Proposition, YC F25 Badge, Live Trace Feed Selector)
 ├── TraceWaterfall (R2: Span Waterfall, Ruler, Collapsible Span Inspector, Spec Exporter)
 ├── PromptDiffEditor (R3: Side-by-Side Split Diff IDE, Unified Diff, Custom Prompt Editor, Model Selector)
 ├── ExecutionConsole (R4: Step-by-Step Replay Sandbox, Live Terminal Logs, Assertions Checklist)
 ├── CIRegressionMatrix (R5: 4-Metric Differential Cards, GitHub PR Bot Comment Simulator & Copy)
 ├── ArchitectureGraph (5-Stage Telemetry-to-CI Pipeline Visualizer)
 ├── McpCliExportModal (Developer Export Center for GitHub Actions, MCP, CLI, Python SDK)
 └── Footer (Brand links, Lemma.ai reference, Zero Regressions badge)
```

---

## 6. Authoritative Requirements Traceability Matrix

| Requirement | Specification Ref | Component Implementation | Verification Method |
|---|---|---|---|
| **R1. Industrial Dark Theme & Micro-Typography** | §4.1, §4.2, §4.3 | `index.css`, `tailwind.config.js`, `Canvas3DBackground.tsx` | Visual inspection of `#090d16`, Inter/JetBrains typography, and 1px borders |
| **R2. Distributed Trace Waterfall & Flamegraph** | §2 (F5, F6, F7, F8) | `TraceWaterfall.tsx`, `TraceIngestor.tsx` | Click spans, verify latency bars, inspection drawer JSON formatting, and mode toggle |
| **R3. Split-View Prompt Patch & Diff IDE** | §2 (F10, F11, F12, F13, F14) | `PromptDiffEditor.tsx` | Toggle split/unified view, edit custom prompt, change models, apply auto-patch |
| **R4. Zero Side-Effect Mock Harness & Sandbox** | §2 (F15, F16, F17, F18, F19, F20) | `ExecutionConsole.tsx`, `ReplayStudio.tsx` | Run replay on original vs patched prompt, test speed 1x/2x/4x, verify assertion passes |
| **R5. CI Regression Diff Matrix & PR Bot Comment** | §2 (F21, F22, F23, F24, F25, F26) | `CIRegressionMatrix.tsx`, `CommandPalette.tsx`, `McpCliExportModal.tsx` | Verify $\Delta$ calculations, copy PR markdown to clipboard, trigger `Cmd+K` palette |

---

## 7. Acceptance Criteria & Quality Gates

1. **TypeScript / Compilation Zero-Error Rule**:
   - `npm run build` (`tsc && vite build`) executes cleanly with 0 TypeScript compilation errors and 0 lint failures.
2. **Instant Responsiveness on Localhost**:
   - Runs on `http://localhost:3173` without runtime console exceptions or lag.
3. **Linear / Vercel DevTools Aesthetics**:
   - Clean dark palette, high-density layouts, subtle borders, monospace telemetry numbers, and micro-typography.
4. **Deterministic Interactive Workflows**:
   - Switching production traces immediately refreshes waterfall, diff editor, replay logs, and CI matrices.
   - Running replay with original prompt fails assertions; running with patched prompt resolves regressions with green checkmarks and confetti.
   - Command palette opens on `Cmd+K` / `Ctrl+K` and supports keyboard navigation.
   - PR comment markdown and export snippets copy cleanly to clipboard.
