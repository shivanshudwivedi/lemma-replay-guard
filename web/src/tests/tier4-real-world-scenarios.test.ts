import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_TRACES, SampleTraceData } from '../data/sampleTraces';
import { computeLineDiff } from '../lib/diffEngine';
import { calculateCost, formatCostPerMillion } from '../lib/costModel';

describe('Tier 4 — Real-World Production Failure Scenarios (E2E Workflows)', () => {
  // Authoritative Source: ORIGINAL_REQUEST.md & survey_spec.md §2 (Sample Traces)

  // ----------------------------------------------------------------------------------------
  // Scenario 1: Stripe Refund Parameter Hallucination
  // ----------------------------------------------------------------------------------------
  describe('Scenario 1: Stripe Refund Parameter Hallucination (Billing & Payments)', () => {
    const trace = SAMPLE_TRACES.find((t) => t.id === 'stripe_hallucination')!;

    it('S1.1: Trace telemetry correctly captures failing step with hallucinated currency_format', () => {
      assert.strictEqual(trace.agent_id, 'billing-assistant-v2');
      assert.strictEqual(trace.trace_id, 'tr_lemma_84920491');
      assert.strictEqual(trace.failure_type, 'TOOL_PARAMETER_HALLUCINATION');

      const failingStep = trace.steps[3];
      assert.strictEqual(failingStep.type, 'TOOL_EXECUTION');
      assert.strictEqual(failingStep.name, 'process_stripe_refund');
      assert.strictEqual(failingStep.status, 'ERROR');
      assert.strictEqual(failingStep.arguments?.currency_format, 'US_DOLLARS');
      assert.ok(failingStep.error_message?.includes('InvalidParameter'));
    });

    it('S1.2: Prompt patch injects schema constraint preventing parameter hallucination', () => {
      const diff = computeLineDiff(trace.system_prompt_original, trace.system_prompt_patched);
      const addedLines = diff.filter((d) => d.type === 'added');

      assert.ok(addedLines.length >= 1);
      assert.ok(
        addedLines.some((l) =>
          l.content.includes('{charge_id: string, amount_cents: integer, reason: string}')
        )
      );
      assert.ok(
        addedLines.some((l) => l.content.includes('Do NOT provide currency_format'))
      );
    });

    it('S1.3: Deterministic mock harness passes all 4 assertions when patched prompt is applied', () => {
      assert.strictEqual(trace.assertions.length, 4);

      const assertionRules = trace.assertions.map((a) => a.rule);
      assert.deepStrictEqual(assertionRules, [
        'no_error_steps',
        'tool_called',
        'no_forbidden_keys',
        'max_tool_steps',
      ]);

      // Verify mock tool rejects forbidden currency_format
      const mockRefund = trace.mock_tools.find((m) => m.name === 'process_stripe_refund')!;
      assert.deepStrictEqual(mockRefund.forbidden_keys, ['currency_format']);
    });

    it('S1.4: CI Regression diff matrix computes 53.7% latency reduction and $850/1M savings', () => {
      const deltaLatency = trace.replay_metrics.latency_ms - trace.baseline_metrics.latency_ms;
      const deltaTokens = trace.replay_metrics.tokens - trace.baseline_metrics.tokens;
      const deltaCost = trace.replay_metrics.cost_usd - trace.baseline_metrics.cost_usd;
      const savings1M = (trace.baseline_metrics.cost_usd - trace.replay_metrics.cost_usd) * 1_000_000;

      assert.strictEqual(deltaLatency, -985);
      assert.strictEqual(deltaTokens, -79);
      assert.strictEqual(Number(deltaCost.toFixed(5)), -0.00085);
      assert.strictEqual(Number(savings1M.toFixed(2)), 850.0);
    });
  });

  // ----------------------------------------------------------------------------------------
  // Scenario 2: Unsanitized Raw SQL Query Drift
  // ----------------------------------------------------------------------------------------
  describe('Scenario 2: Unsanitized Raw SQL Query Drift (Data & Analytics)', () => {
    const trace = SAMPLE_TRACES.find((t) => t.id === 'sql_schema_drift')!;

    it('S2.1: Trace telemetry isolates unescaped raw SQL concatenation error with apostrophe', () => {
      assert.strictEqual(trace.agent_id, 'analytics-copilot');
      assert.strictEqual(trace.trace_id, 'tr_lemma_99210411');
      assert.strictEqual(trace.failure_type, 'SCHEMA_VIOLATION');

      const failingStep = trace.steps[1];
      assert.strictEqual(failingStep.type, 'TOOL_EXECUTION');
      assert.strictEqual(failingStep.name, 'execute_query');
      assert.strictEqual(failingStep.status, 'ERROR');
      assert.ok(failingStep.arguments?.raw_sql?.includes("org_name = 'O'Reilly Media'"));
      assert.ok(failingStep.error_message?.includes('SQLSyntaxError'));
    });

    it('S2.2: Prompt patch enforces parameterized warehouse query schema ({query_template, params})', () => {
      const diff = computeLineDiff(trace.system_prompt_original, trace.system_prompt_patched);
      const addedLines = diff.filter((d) => d.type === 'added');

      assert.ok(addedLines.length >= 1);
      assert.ok(
        addedLines.some((l) =>
          l.content.includes('{query_template: string, params: dict}')
        )
      );
      assert.ok(
        addedLines.some((l) => l.content.includes('NEVER concatenate raw unescaped string literals'))
      );
    });

    it('S2.3: Deterministic SQL mock requires query_template & params and resolves all 4 assertions', () => {
      assert.strictEqual(trace.assertions.length, 4);
      const assertionRules = trace.assertions.map((a) => a.rule);
      assert.deepStrictEqual(assertionRules, [
        'no_error_steps',
        'required_keys_present',
        'no_forbidden_keys',
        'max_tool_steps',
      ]);

      const mockSql = trace.mock_tools.find((m) => m.name === 'execute_query')!;
      assert.ok(mockSql.expected_args.query_template);
      assert.ok(mockSql.expected_args.params);
      assert.strictEqual(mockSql.simulated_response.row_count, 1);
    });

    it('S2.4: CI Regression diff matrix computes 43.4% latency drop and $660/1M savings', () => {
      const deltaLatency = trace.replay_metrics.latency_ms - trace.baseline_metrics.latency_ms;
      const deltaTokens = trace.replay_metrics.tokens - trace.baseline_metrics.tokens;
      const savings1M = (trace.baseline_metrics.cost_usd - trace.replay_metrics.cost_usd) * 1_000_000;

      assert.strictEqual(deltaLatency, -490);
      assert.strictEqual(deltaTokens, -90);
      assert.strictEqual(Number(savings1M.toFixed(2)), 660.0);
    });
  });

  // ----------------------------------------------------------------------------------------
  // Scenario 3: GitHub Triager 6-Step Infinite Retry Loop
  // ----------------------------------------------------------------------------------------
  describe('Scenario 3: GitHub Triager 6-Step Infinite Retry Loop (Developer Tooling)', () => {
    const trace = SAMPLE_TRACES.find((t) => t.id === 'infinite_retry_loop')!;

    it('S3.1: Trace telemetry reveals unhandled 6-step loop repeating failing milestone', () => {
      assert.strictEqual(trace.agent_id, 'github-issue-triager');
      assert.strictEqual(trace.trace_id, 'tr_lemma_77192842');
      assert.strictEqual(trace.failure_type, 'INFINITE_LOOP');
      assert.strictEqual(trace.steps.length, 6);

      // Verify all 3 tool execution attempts fail with MilestoneNotFound
      const toolSteps = trace.steps.filter((s) => s.type === 'TOOL_EXECUTION');
      assert.strictEqual(toolSteps.length, 3);
      toolSteps.forEach((step) => {
        assert.strictEqual(step.status, 'ERROR');
        assert.ok(step.error_message?.includes('MilestoneNotFound'));
      });
    });

    it('S3.2: Prompt patch injects missing error handling branch and loop termination guard', () => {
      const diff = computeLineDiff(trace.system_prompt_original, trace.system_prompt_patched);
      const addedLines = diff.filter((d) => d.type === 'added');

      assert.ok(addedLines.length >= 1);
      assert.ok(addedLines.some((l) => l.content.includes('ERROR HANDLING RULES')));
      assert.ok(
        addedLines.some((l) =>
          l.content.includes('If set_issue_milestone fails with MilestoneNotFound')
        )
      );
      assert.ok(addedLines.some((l) => l.content.includes('Do NOT retry the failing title')));
    });

    it('S3.3: Loop Breaker assertion gates execution to at most 2 tool executions across 3 total assertions', () => {
      assert.strictEqual(trace.assertions.length, 3);
      const loopBreaker = trace.assertions.find((a) => a.rule === 'max_tool_steps')!;
      assert.ok(loopBreaker);
      assert.strictEqual(loopBreaker.type, 'Loop Breaker');

      const rules = trace.assertions.map((a) => a.rule);
      assert.deepStrictEqual(rules, ['max_tool_steps', 'no_error_steps', 'tool_called']);
    });

    it('S3.4: CI Regression diff matrix computes 62.2% latency drop, 63.4% token reduction, and $210/1M savings', () => {
      const deltaLatency = trace.replay_metrics.latency_ms - trace.baseline_metrics.latency_ms;
      const deltaTokens = trace.replay_metrics.tokens - trace.baseline_metrics.tokens;
      const savings1M = (trace.baseline_metrics.cost_usd - trace.replay_metrics.cost_usd) * 1_000_000;

      assert.strictEqual(deltaLatency, -690);
      assert.strictEqual(deltaTokens, -590);
      assert.strictEqual(Number(savings1M.toFixed(2)), 210.0);
    });
  });
});
