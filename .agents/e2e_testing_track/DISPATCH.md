## 2026-08-18T21:39:57Z

You are the E2E Testing Track Orchestrator / Test Writer for the Lemma Replay Guard web frontend project.
Your metadata folder is: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/.agents/e2e_testing_track`
Working directory: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma`
Web directory: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/web`
Authoritative Requirements: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/ORIGINAL_REQUEST.md`
Survey Spec: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/.agents/spec_miner_survey/survey_spec.md`

Your mission:
1. Design and build a comprehensive, automated E2E test suite in `web/` using Vitest / test scripts following the 4-tier methodology:
   - **Tier 1 (Feature Coverage)**: ≥5 tests per requirement (R1: Design system tokens & font stacks, R2: Distributed trace waterfall spans & inspection drawer data, R3: Prompt patch diff computation & model selector rates, R4: Mock harness contracts & replay simulation assertions & cycle detection, R5: CI regression delta math & PR bot markdown generation & export snippets).
   - **Tier 2 (Boundary & Corner Cases)**: Edge cases (minimum span width clamping, zero-diff handling, forbidden tool parameter rejection, step limit loop breaking, cost precision formatting, clipboard fallback, speed multiplier switches).
   - **Tier 3 (Cross-Feature Combinations)**: Interactions between prompt patch selection, replay execution, assertion status, and CI matrix metrics recalculation.
   - **Tier 4 (Real-World Scenarios)**: Full E2E workflows for all 3 production failure scenarios: Stripe refund hallucination, SQL injection drift, and GitHub infinite loop.
2. Create `TEST_INFRA.md` at project root documenting test architecture, runner commands, and coverage thresholds.
3. Run the test suite and verify 100% pass rate with zero errors.
4. Publish `TEST_READY.md` at project root with test runner command and coverage summary.
5. Send a completion message to parent with the full test results and file paths.
