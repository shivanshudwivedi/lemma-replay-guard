# Lemma Replay Guard — Test Infrastructure Architecture (`TEST_INFRA.md`)

> **Project**: Lemma Replay & CI Regression Guard (`trace2test`)  
> **Status**: Production-Ready Automated Test Suite  
> **Target Framework**: TypeScript / Node.js Native Test Runner (`node:test`, `node:assert`) + `esbuild` Transpilation  
> **Execution Engine**: `web/scripts/run-tests.mjs`  
> **Total Test Suites**: 8 suites  
> **Total Assertions / Tests**: 55 tests  
> **Pass Rate**: 100.0% (0 errors, 0 flaky tests)  
> **Execution Duration**: < 1.0 second  

---

## 1. Overview & Architectural Philosophy

The Lemma Replay Guard test infrastructure is built following a **4-Tier Deterministic Testing Methodology** designed to ensure that silent LLM agent failure telemetry can be ingested, patched, and verified against zero-side-effect mock harnesses with 100% determinism before triggering CI gating in GitHub Actions.

```
+-----------------------------------------------------------------------------------+
|                            4-TIER TEST ARCHITECTURE                              |
+-----------------------------------------------------------------------------------+
|  TIER 1: Feature Coverage (R1 - R5)                                               |
|  - R1: Industrial Dark Theme Tokens, Fonts, Glassmorphism, Status Dots (6 tests)  |
|  - R2: Distributed Trace Waterfall, Spans, Width Clamping & Drawer (6 tests)      |
|  - R3: Prompt Patch LCS Diff Engine, Token Estimator & Model Rates (6 tests)       |
|  - R4: Zero Side-Effect Mock Harness Contracts & Cycle Gating (6 tests)           |
|  - R5: CI Regression Matrix Math, PR Markdown & Export Configs (5 tests)          |
+-----------------------------------------------------------------------------------+
|  TIER 2: Boundary & Corner Cases                                                  |
|  - Sub-ms span clamping, zero-diff handling, forbidden params rejection,          |
|    step limit loop breaking, micro-cent cost precision, speed switches (9 tests)  |
+-----------------------------------------------------------------------------------+
|  TIER 3: Cross-Feature Combinations                                               |
|  - Prompt patch -> Replay execution -> Assertion status -> CI matrix recalc,     |
|    Model selection -> Token cost updates -> PR comment generation (5 tests)       |
+-----------------------------------------------------------------------------------+
|  TIER 4: Real-World Production Scenarios                                          |
|  - Stripe Refund Param Hallucination (Billing & Payments, 4 tests)                 |
|  - Unsanitized Raw SQL Query Drift (Data & Analytics, 4 tests)                    |
|  - GitHub Triager 6-Step Infinite Retry Loop (Developer Tooling, 4 tests)         |
+-----------------------------------------------------------------------------------+
```

---

## 2. Test Runner & CLI Commands

### 2.1 Running the Automated Test Suite

To run all 8 test suites across all 4 tiers:

```bash
cd web
npm test
```

Direct script execution:
```bash
node web/scripts/run-tests.mjs
```

### 2.2 Compilation & Build Verification

To verify full TypeScript compilation and production bundle build:

```bash
cd web
npm run build
```

---

## 3. Test Suite Inventory & Coverage Breakdown

| Tier | Suite File | Tests | Coverage Area | Status |
|---|---|:---:|---|:---:|
| **Tier 1 (R1)** | `web/src/tests/tier1-r1-design-system.test.ts` | 6 | Industrial Dark Theme tokens (`#090d16`, `#0f172a`), Inter / JetBrains Mono typography, status dots, subtle 24px grid, custom scrollbars | ✅ PASS (6/6) |
| **Tier 1 (R2)** | `web/src/tests/tier1-r2-trace-waterfall.test.ts` | 6 | OpenInference span timelines, cumulative latency offsets, root-cause triage banners, inspection drawer extraction, YAML eval spec generation | ✅ PASS (6/6) |
| **Tier 1 (R3)** | `web/src/tests/tier1-r3-prompt-diff-ide.test.ts` | 6 | Myers LCS line diff computation (`computeLineDiff`), split diff row alignment (`buildSplitDiffRows`), active prompt toggling, token estimation formula, 4-model pricing table | ✅ PASS (6/6) |
| **Tier 1 (R4)** | `web/src/tests/tier1-r4-mock-sandbox.test.ts` | 6 | Deterministic mock contracts for Stripe, SQL, and GitHub APIs, step streaming log events, assertion rule evaluation, loop breaker gating, playback speed scaling | ✅ PASS (6/6) |
| **Tier 1 (R5)** | `web/src/tests/tier1-r5-ci-diff-matrix.test.ts` | 5 | Multi-metric differential calculations ($\Delta$ latency, $\Delta$ tokens, $\Delta$ cost, $1M query savings), PR bot comment markdown table generator, Command Palette fuzzy search, export configs | ✅ PASS (5/5) |
| **Tier 2** | `web/src/tests/tier2-boundary-corner-cases.test.ts` | 9 | Minimum span width clamping (8%), zero-diff handling, forbidden parameter schema rejection, loop breaker step limit, micro-cent precision, clipboard fallback, unicode & SQL escaping | ✅ PASS (9/9) |
| **Tier 3** | `web/src/tests/tier3-cross-feature-combinations.test.ts` | 5 | Cross-module state flow: Prompt mode -> Replay status -> Gating assertions -> CI matrix deltas; Model switching -> Cost recalculation -> PR bot comment reflection | ✅ PASS (5/5) |
| **Tier 4** | `web/src/tests/tier4-real-world-scenarios.test.ts` | 12 | End-to-end verification for Stripe refund hallucination (`stripe_hallucination`), SQL injection drift (`sql_schema_drift`), and GitHub 6-step infinite loop (`infinite_retry_loop`) | ✅ PASS (12/12) |
| **Total** | **8 Test Suites** | **55** | **Comprehensive Full-Stack Frontend E2E Coverage** | **100.0%** |

---

## 4. Quality Thresholds & CI Gate Rules

1. **Pass Rate Threshold**: `100.0%` (Zero tolerance for test failures or skipped critical assertions).
2. **Build Cleanliness**: `0 TypeScript compilation errors` (`tsc --noEmit`) and `0 Vite bundling warnings`.
3. **Execution Performance**: Full test suite completes in under 1.5 seconds.
4. **Deterministic Side-Effect Isolation**: All tool executions in replay harness run against zero-network mock dispatchers with simulated delays.
