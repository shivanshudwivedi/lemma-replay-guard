# Lemma Replay Guard (Frontend R1, R2, R3) — Review & Adversarial Critic Report

> **Reviewer**: Reviewer 1 (Reviewer & Adversarial Critic)  
> **Target**: Lemma Replay Guard Web Frontend (`web/`)  
> **Scope**: R1 (Industrial Dark Theme & Micro-Typography), R2 (Distributed Trace Waterfall & Flamegraph), R3 (Split-View Prompt Patch & Diff IDE), Compilation & Build Verification  
> **Date**: 2026-08-18  
> **Verdict**: 🔴 `REQUEST_CHANGES`

---

## 1. Executive Summary & Verdict

| Review Dimension | Status | Notes |
|---|:---:|---|
| **R1: Industrial Dark Theme & Micro-Typography** | ✅ PASS | High-density `#090d16` palette, Inter (-0.011em tracking), JetBrains Mono, precision glowing status dots, 24px grid + Framer Motion spring parallax glow. |
| **R2: Trace Waterfall & Flamegraph** | ✅ PASS | Interactive millisecond ruler, 8% minimum width clamped spans, collapsible 5-column span inspector drawer, flamegraph stack, `.lemma.eval.yaml` exporter, 3 production failure presets. |
| **R3: Split-View Prompt Diff IDE** | ✅ PASS | Myers LCS line diff algorithm, side-by-side split & unified diffs, live custom edit textarea with char & token estimators, 4-model selector with pricing rates, one-click patch templates. |
| **Automated Test Suite (`npm test`)** | ✅ PASS | 8 test suites, 55/55 assertions passed in 0.73s via `scripts/run-tests.mjs`. |
| **Production Build Gate (`npm run build`)** | ❌ **FAIL** | `tsc && vite build` exits with **code 2** due to 23 TypeScript compilation errors in `src/tests/`. |

**Explicit Verdict**: **`REQUEST_CHANGES`**  
*Rationale*: While runtime component logic, styling, and unit test suites are of exceptional quality, the build compilation gate mandated by `ORIGINAL_REQUEST.md` line 38 (`tsc && vite build`) fails due to TypeScript configuration and test file type errors. Furthermore, `PROJECT.md` line 164 inaccurately claims that `tsc && vite build` passed with zero errors.

---

## 2. 5-Component Handoff Report

### 2.1. Observation

#### Observation 1: `npm test` Execution Output
Running `npm test` in `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/web`:
```text
> lemma-replay-studio@0.1.0 test
> node scripts/run-tests.mjs

======================================================================
🧪 LEMMA REPLAY GUARD — 4-TIER AUTOMATED E2E TEST SUITE RUNNER
======================================================================

📦 Discovered 8 test suites:
   • tier1-r1-design-system.test.ts
   • tier1-r2-trace-waterfall.test.ts
   • tier1-r3-prompt-diff-ide.test.ts
   • tier1-r4-mock-sandbox.test.ts
   • tier1-r5-ci-diff-matrix.test.ts
   • tier2-boundary-corner-cases.test.ts
   • tier3-cross-feature-combinations.test.ts
   • tier4-real-world-scenarios.test.ts

⚡ All TypeScript test suites compiled with esbuild (target=Node20).

----------------------------------------------------------------------
RUNNING TEST SUITES
----------------------------------------------------------------------
  ✅ PASS  tier1-r1-design-system.test.ts                (6/6 tests in 118.2ms)
  ✅ PASS  tier1-r2-trace-waterfall.test.ts              (6/6 tests in 79.5ms)
  ✅ PASS  tier1-r3-prompt-diff-ide.test.ts              (6/6 tests in 93.4ms)
  ✅ PASS  tier1-r4-mock-sandbox.test.ts                 (6/6 tests in 80.3ms)
  ✅ PASS  tier1-r5-ci-diff-matrix.test.ts               (5/5 tests in 89.9ms)
  ✅ PASS  tier2-boundary-corner-cases.test.ts           (9/9 tests in 90.8ms)
  ✅ PASS  tier3-cross-feature-combinations.test.ts      (5/5 tests in 92.1ms)
  ✅ PASS  tier4-real-world-scenarios.test.ts            (12/12 tests in 87.5ms)
----------------------------------------------------------------------
📊 4-TIER TEST EXECUTION SUMMARY
----------------------------------------------------------------------
  • Test Suites:       8 passed, 0 failed, 8 total
  • Test Assertions:   55 passed, 0 failed, 55 total
  • Pass Rate:         100.0%
  • Total Duration:    0.73s
======================================================================
🏆 ALL 4 TIERS PASSED WITH 100% SUCCESS RATE!
```

#### Observation 2: `npm run build` Compilation Failure
Running `npm run build` in `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/web`:
```text
> lemma-replay-studio@0.1.0 build
> tsc && vite build

src/tests/tier1-r1-design-system.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier1-r1-design-system.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier1-r1-design-system.test.ts(3,30): error TS2307: Cannot find module 'node:fs' or its corresponding type declarations.
src/tests/tier1-r1-design-system.test.ts(4,25): error TS2307: Cannot find module 'node:path' or its corresponding type declarations.
src/tests/tier1-r1-design-system.test.ts(8,41): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
src/tests/tier1-r1-design-system.test.ts(9,47): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
src/tests/tier1-r1-design-system.test.ts(59,44): error TS2580: Cannot find name 'process'. Do you need to install type definitions for node? Try `npm i --save-dev @types/node`.
src/tests/tier1-r2-trace-waterfall.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier1-r2-trace-waterfall.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier1-r3-prompt-diff-ide.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier1-r3-prompt-diff-ide.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier1-r4-mock-sandbox.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier1-r4-mock-sandbox.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier1-r5-ci-diff-matrix.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier1-r5-ci-diff-matrix.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier2-boundary-corner-cases.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier2-boundary-corner-cases.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier3-cross-feature-combinations.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier3-cross-feature-combinations.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
src/tests/tier3-cross-feature-combinations.test.ts(23,31): error TS2367: This comparison appears to be unintentional because the types '"patched"' and '"original"' have no overlap.
src/tests/tier3-cross-feature-combinations.test.ts(75,22): error TS2367: This comparison appears to be unintentional because the types '"custom"' and '"original"' have no overlap.
src/tests/tier4-real-world-scenarios.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.
src/tests/tier4-real-world-scenarios.test.ts(2,20): error TS2307: Cannot find module 'node:assert/strict' or its corresponding type declarations.
```

#### Observation 3: Direct Vite Build Output (`npx vite build`)
Running `npx vite build` directly succeeds in 2.11s:
```text
vite v6.4.3 building for production...
transforming...
✓ 2225 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.09 kB │ gzip:   0.63 kB
dist/assets/index-YT6yaAz7.css   38.30 kB │ gzip:   7.01 kB
dist/assets/index-BAe4fk6f.js   437.97 kB │ gzip: 129.98 kB
✓ built in 2.11s
```

#### Observation 4: Codebase & Component Analysis
- `src/components/AmbientBackground.tsx`: Implements fixed 24px geometric grid, top-center radial gradient, and Framer Motion spring cursor parallax.
- `src/index.css`: Implements `#090d16` dark base, Inter typography (-0.011em tracking), custom 5px WebKit scrollbar, `.devtools-panel` glassmorphism with `border-white/[0.08]`, and glowing precision dots (`.status-dot-emerald`, `.status-dot-rose`, `.status-dot-cyan`, `.status-dot-violet`).
- `src/components/TraceWaterfall.tsx`: Implements interactive millisecond timing ruler, 8% min-width span duration clamping, 5-column collapsible span inspector drawer, flamegraph execution stack, `.lemma.eval.yaml` spec generator, and raw OTel JSON views with clipboard copy.
- `src/components/PromptDiffEditor.tsx`: Implements side-by-side split diff with line numbers and added/removed highlight styles, unified diff stream, live in-browser custom edit textarea with real-time character count and `Math.ceil(chars / 4)` token estimator, 4-model selector (`gpt-4o`, `claude-3-5-sonnet`, `gpt-4o-mini`, `deepseek-v3`), and one-click schema patch templates.
- `src/lib/diffEngine.ts`: Implements Myers / Longest Common Subsequence (LCS) line diff algorithm with backtrack stack and split row pair builder.
- `src/lib/costModel.ts`: Implements pricing matrix with exact rates for all 4 models and per-million calculation helper.

---

### 2.2. Logic Chain

1. **Requirement Definition**: `ORIGINAL_REQUEST.md` line 38 explicitly requires: `Frontend compiles with zero TypeScript/lint errors (tsc && vite build).`
2. **Project Specification Claim**: `PROJECT.md` line 6 and lines 164-168 claim that `tsc && vite build` passes cleanly with code 0.
3. **Empirical Verification**: Executing `npm run build` fails with exit code 2 on the `tsc` step.
4. **Root Cause Analysis**:
   - In `tsconfig.json`, `"include": ["src"]` includes `src/tests/*.ts`.
   - `src/tests/*.ts` use Node standard library modules (`node:test`, `node:assert/strict`, `node:fs`, `node:path`, `process`), but `tsconfig.json` is configured for the browser/DOM environment and lacks Node type declarations.
   - `scripts/run-tests.mjs` uses `esbuild` (which strips TypeScript types without type checking), allowing `npm test` to pass while hiding type errors from `tsc`.
   - In `src/tests/tier3-cross-feature-combinations.test.ts` lines 23 and 75, literal string comparisons (`"patched" !== "original"` and `"custom" !== "original"`) trigger TypeScript error TS2367 (unintentional comparison with no type overlap).
5. **Deductive Conclusion**: Because the production build command (`npm run build`) fails to compile cleanly under `tsc`, the work product fails a non-negotiable acceptance criterion and requires remediation.

---

### 2.3. Caveats

- **No Caveats on Runtime Logic**: The browser application bundle created by Vite builds cleanly and all interactive UI workflows (trace switching, waterfall timeline, flamegraph, split diff rendering, mock execution, assertion checklists, PR comment generation, command palette) function properly without runtime exceptions.
- **Scope Limitation**: The review was strictly conducted within frontend requirements R1, R2, R3, and full build/test verification. Implementation code was not modified per agent constraints.

---

### 2.4. Conclusion & Actionable Findings

#### [Critical] Finding 1: TypeScript Build Compilation Failure on `tsc && vite build` (INTEGRITY / BUILD GATE)
- **What**: `npm run build` fails with 23 compilation errors.
- **Where**: `web/tsconfig.json`, `web/package.json`, `web/src/tests/tier3-cross-feature-combinations.test.ts`
- **Why**: Test files located in `src/tests/` are included in `tsc` type checking without Node type definitions and contain TS2367 type overlap errors.
- **Suggested Fix**:
  1. Add `@types/node` to `web/package.json` devDependencies (or exclude `"src/tests"` from `web/tsconfig.json` and create a dedicated `tsconfig.test.json` for tests).
  2. In `src/tests/tier3-cross-feature-combinations.test.ts` lines 23 and 75, type the variable explicitly as `const patchedPromptMode: 'patched' | 'original' | 'custom' = 'patched';` to satisfy TypeScript strict comparison checks.
  3. Ensure `npm run build` (`tsc && vite build`) executes and exits with code 0.

#### [Major] Finding 2: LCS Diff Engine Line Ending Normalization (Adversarial Robustness)
- **What**: In `src/lib/diffEngine.ts`, `oldText.split('\n')` and `newText.split('\n')` do not strip Windows carriage returns (`\r\n`).
- **Where**: `web/src/lib/diffEngine.ts` lines 15-16
- **Why**: Pasting text containing Windows line breaks causes trailing `\r` characters to persist in line content, causing false-positive diff lines.
- **Suggested Fix**: Normalize input text: `oldText.replace(/\r\n/g, '\n').split('\n')`.

#### [Minor] Finding 3: Unused Legacy Components in Source Tree
- **What**: `Canvas3DBackground.tsx`, `ReplayStudio.tsx`, and `TraceIngestor.tsx` remain in `src/components/`.
- **Where**: `web/src/components/`
- **Why**: Redundant files that are no longer referenced in `App.tsx`.
- **Suggested Fix**: Remove or archive these unused files.

#### [Minor] Finding 4: Minor HTML Body Class Discrepancy
- **What**: `index.html` specifies `class="bg-[#080b11] text-slate-100..."` while the design system standardizes on `#090d16` / `text-zinc-100`.
- **Where**: `web/index.html` line 12
- **Suggested Fix**: Align body class in `index.html` to `bg-[#090d16] text-zinc-100`.

---

### 2.5. Verification Method

To independently verify this report and resolution:

```bash
# 1. Navigate to web directory
cd web

# 2. Run the automated test suite (must pass 55/55 assertions)
npm test

# 3. Run production typecheck & build gate (MUST exit with code 0)
npm run build
```

**Invalidation Conditions**:
- If `npm run build` exits with code 0 with zero TypeScript errors and zero warnings, Finding 1 is invalidated and the verdict transitions to `APPROVE`.

---

## 3. Detailed Requirement Verification Matrix (R1 – R3)

| Requirement | Implementation Details | Verified Properties | Result |
|---|---|---|:---:|
| **R1.1 Industrial Dark Palette** | `#090d16`, `#0f172a`, `border-white/[0.08]` in `index.css`, `tailwind.config.js` | Exact hex colors match spec; subtle 0.08 borders enforced | ✅ PASS |
| **R1.2 Semantic Functional Accents** | Emerald (pass), Rose (fail), Cyan (mocks), Violet (CI), Amber (warn) | Color tokens applied strictly to state indicators | ✅ PASS |
| **R1.3 Micro-Typography** | Inter with `-0.011em` letter spacing + JetBrains Mono for metrics/code | Loaded via Google Fonts, applied across all components | ✅ PASS |
| **R1.4 Precision Status Dots & Panels** | `.status-dot-*` classes with box-shadow radial glows; `.devtools-panel` | Glow animations and linear 5px scrollbar rendered | ✅ PASS |
| **R1.5 Ambient Glow Canvas & Grid** | `AmbientBackground.tsx` with 24px grid & Framer Motion spring physics | Sleek ambient glow with smooth mouse parallax | ✅ PASS |
| **R2.1 Timing Ruler & Millisecond Spans** | `TraceWaterfall.tsx` with 0ms, 25%, 50%, 75%, 100% time markers | Accurate step durations and cumulative offsets | ✅ PASS |
| **R2.2 Span Width Clamping (8%)** | `Math.max(8, (step.latency_ms / totalDuration) * 100)` | Sub-10ms spans remain clickable and visible | ✅ PASS |
| **R2.3 Root-Cause Triage Banner** | Triage alert card with summary, badge, and triage note | 3 production failure presets loaded and triaged | ✅ PASS |
| **R2.4 5-Column Span Inspector Drawer** | Collapsible inspector showing latency, status, tokens, arguments, output, error | Exact payloads and error tracebacks displayed | ✅ PASS |
| **R2.5 Multi-View Mode Switcher** | Span Waterfall, Hierarchical Flamegraph, `.lemma.eval.yaml`, Raw OTel JSON | Seamless view switching with 2000ms copy feedback | ✅ PASS |
| **R3.1 Myers LCS Diff Engine** | `computeLineDiff` dynamic programming LCS table with backtrack stack | Accurate additions, removals, and unchanged lines | ✅ PASS |
| **R3.2 Side-by-Side Split Diff View** | Paired rows with line number gutters and `+`/`-` highlight styles | Clear side-by-side comparison of failing vs fixed prompt | ✅ PASS |
| **R3.3 Unified Diff View** | `@@ -1,x +1,y @@` stream with addition/deletion formatting | Clean unified diff presentation | ✅ PASS |
| **R3.4 Live Custom Prompt Editor** | In-browser textarea with char count and `Math.ceil(chars / 4)` tokens | Real-time updates to token count and mock evaluation | ✅ PASS |
| **R3.5 Multi-Model Pricing Matrix** | Standardized pricing for `gpt-4o`, `claude-3-5-sonnet`, `gpt-4o-mini`, `deepseek-v3` | Cost calculation and $ / 1M queries calculated | ✅ PASS |
| **R3.6 One-Click Schema Templates** | "Auto-Inject Schema Guard" & "Restore Baseline" buttons | Prompt state immediately updates and switches modes | ✅ PASS |
| **Build & Type Safety** | `npm run build` (`tsc && vite build`) | Fails on `tsc` due to test file typings | ❌ **FAIL** |
