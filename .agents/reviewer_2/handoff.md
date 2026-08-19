# Lemma Replay Guard — Reviewer 2 Handoff Report

## 1. Observation

### 1.1 Test & Build Execution
- **Command**: `npm test` in `web/`
  - **Result**: Failed (Exit Code 1)
  - **Output**: 8 passed suites, 1 failed suite (`tier5-adversarial-challenger.test.ts`), 80 passed assertions, 1 failed assertion.
  - **Exact Failure**: `tier5-adversarial-challenger.test.ts` -> `1.6 100 completely rewritten lines with zero overlap` (Expected `modifiedCount` 50, actual 1 at `dist-tests/tier5-adversarial-challenger.test.mjs:504:5`).

- **Command**: `npm run build` in `web/` (`tsc && vite build`)
  - **Result**: Failed (Exit Code 2)
  - **Output**: TypeScript type errors in `src/tests/*`:
    - `src/tests/tier1-r1-design-system.test.ts(1,30): error TS2307: Cannot find module 'node:test' or its corresponding type declarations.`
    - `src/tests/tier1-r1-design-system.test.ts(8,41): error TS2580: Cannot find name 'process'.`
    - `src/tests/tier3-cross-feature-combinations.test.ts(23,31): error TS2367: This comparison appears to be unintentional because the types '"patched"' and '"original"' have no overlap.`
    - `src/tests/tier3-cross-feature-combinations.test.ts(75,22): error TS2367: This comparison appears to be unintentional because the types '"custom"' and '"original"' have no overlap.`

### 1.2 Requirements Compliance Observations (R4 & R5)
- **R4: Zero Side-Effect Mock Harness & Replay Sandbox** (`ExecutionConsole.tsx`, `sampleTraces.ts`):
  - Deterministic tool mock inspector displays expected arguments, forbidden keys (`currency_format`, `raw_sql`), simulated payloads, and latency contracts across Stripe, SQL, and GitHub.
  - Step-by-step replay simulator supports 1x, 2x, 4x speed controls, Step Forward, Pause, Resume, Reset, and clean interval cleanup via `useRef`.
  - Real-time terminal logs emit timestamped `INIT`, `INGEST_TRACE`, `PROMPT_INJECT`, `LLM_DISPATCH`, `MOCK_DISPATCH`, `MOCK_SUCCESS`, `REJECTION` events.
  - Cycle detection banner correctly triggers `LOOP_BREAKER_TRIGGERED` when excessive retry loops occur with original prompt.
  - Assertion checklist dynamically evaluates rules against sandbox results with confetti triggers on pass.

- **R5: CI Regression Matrix, PR Bot, Cmd+K & Export Modal** (`CIRegressionMatrix.tsx`, `CommandPalette.tsx`, `McpCliExportModal.tsx`, `App.tsx`):
  - 4-card performance differential matrix correctly computes $\Delta$ latency, $\Delta$ tokens, $\Delta$ cost, and pass rate across all 4 LLM pricing models.
  - Realistic GitHub PR bot comment widget generates production-accurate markdown with collapsible `<details>` assertion evidence and copy confirmation.
  - `Cmd+K` / `Ctrl+K` Command Palette filters traces by title, agent ID, failure type, and handles chord hotkeys (`G W`, `G R`, `G C`, `G E`).
  - Developer Export Modal provides valid GitHub Actions YAML, MCP server JSON, CLI commands, and Python SDK code.

- **Integrity & Code Quality**:
  - Diff engine (`diffEngine.ts`) implements genuine Myers LCS dynamic programming matrix backtracking.
  - Cost model (`costModel.ts`) implements real per-million token arithmetic.
  - No hardcoded test facades or integrity violations detected.

---

## 2. Logic Chain

1. **Compilation Gate**: `ORIGINAL_REQUEST.md` (Acceptance Criteria) and `PROJECT.md` (§5.1) mandate clean compilation via `npm run build` (`tsc && vite build`).
2. `tsconfig.json` specifies `"include": ["src"]`, causing `tsc` to type-check `src/tests/*` without Node type definitions and with strict type narrowing errors.
3. Because `tsc` fails with exit code 2, `npm run build` fails, violating the authoritative acceptance criteria.
4. `npm test` runs 9 test suites via `scripts/run-tests.mjs`. Suite 5 (`tier5-adversarial-challenger.test.ts`) fails on subtest 1.6 because `buildSplitDiffRows` pairs only single adjacent deleted/added lines rather than contiguous chunks when full prompt replacement occurs.
5. Therefore, while the component features, design system, and core logic are exceptionally well implemented, the project cannot be approved until build compilation and test suite 5 are green.

---

## 3. Caveats

- Standalone Vite build (`npx vite build`) succeeds in 1.72s with zero bundle errors.
- Core test suites (Tier 1 through Tier 4, 55/55 assertions) pass 100% when run independently.
- The failures are localized to `tsconfig.json` test inclusion / type definitions and `diffEngine.ts` block-pairing edge cases.

---

## 4. Conclusion

**Verdict**: `REQUEST_CHANGES`

### Required Fixes:
1. **Fix Compilation Gate (`tsconfig.json` & type errors)**:
   - Exclude `src/tests` in `tsconfig.json` (e.g. `"exclude": ["src/tests"]`) or add `@types/node` to devDependencies and tsconfig.
   - Fix literal type comparison narrowing in `src/tests/tier3-cross-feature-combinations.test.ts` (lines 23 & 75).
2. **Fix Test Suite 5 (`tier5-adversarial-challenger.test.ts` / `diffEngine.ts`)**:
   - Update `buildSplitDiffRows` in `lib/diffEngine.ts` to properly pair contiguous blocks of deletions and additions into modified rows, or adjust test 1.6 to match single-item pair semantics.
3. **Sanitize Markdown Table Cells**:
   - Escape unescaped pipe characters (`|`) in assertion descriptions inside `CIRegressionMatrix.tsx`.

---

## 5. Verification Method

To independently verify this review:
```bash
cd /Users/shivanshu/Documents/Protoypes\\ -\\ Hiring/Lemma/web
# 1. Reproduce compilation gate failure:
npm run build
# 2. Reproduce test suite 5 failure:
npm test
```
