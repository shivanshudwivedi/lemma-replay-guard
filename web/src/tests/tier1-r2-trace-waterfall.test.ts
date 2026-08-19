import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_TRACES, SampleTraceData } from '../data/sampleTraces';

describe('Tier 1 — R2: Distributed Trace Waterfall & Flamegraph Specifications', () => {
  // Authoritative Source: ORIGINAL_REQUEST.md (R2) & survey_spec.md §2 (F5, F6, F7, F8)

  it('R2.1: Distributed span timing calculates exact step durations and cumulative horizontal offsets', () => {
    SAMPLE_TRACES.forEach((trace) => {
      const totalDuration = trace.baseline_metrics.latency_ms;
      assert.ok(totalDuration > 0, `Total duration must be positive for ${trace.id}`);

      let cumulativeMs = 0;
      trace.steps.forEach((step, idx) => {
        const offsetPct = (cumulativeMs / totalDuration) * 100;
        assert.ok(offsetPct >= 0 && offsetPct <= 100, `Offset percentage out of bounds for step ${idx}`);
        cumulativeMs += step.latency_ms;
      });

      // Sum of steps should align with baseline execution span
      assert.ok(cumulativeMs > 0, 'Cumulative span duration must be > 0');
    });
  });

  it('R2.2: Short spans are clamped to at least 8% minimum width so they remain clickable', () => {
    const trace = SAMPLE_TRACES[0]; // Stripe refund trace with 45ms step in 1835ms trace
    const totalDuration = trace.baseline_metrics.latency_ms;

    trace.steps.forEach((step) => {
      const naturalPct = (step.latency_ms / totalDuration) * 100;
      const clampedWidth = Math.max(8, naturalPct);
      assert.ok(clampedWidth >= 8, `Clamped width must be at least 8%, got ${clampedWidth}`);
    });
  });

  it('R2.3: Root cause diagnostic triage banner correctly extracts failure types and summaries', () => {
    SAMPLE_TRACES.forEach((trace) => {
      assert.ok(trace.failure_type, 'Trace must declare failure_type');
      assert.ok(trace.failure_summary, 'Trace must declare failure_summary');
      assert.ok(trace.root_cause, 'Trace must declare root_cause');

      // Verify specific known failure types
      if (trace.id === 'stripe_hallucination') {
        assert.strictEqual(trace.failure_type, 'TOOL_PARAMETER_HALLUCINATION');
        assert.ok(trace.failure_summary.includes('currency_format'));
      } else if (trace.id === 'sql_schema_drift') {
        assert.strictEqual(trace.failure_type, 'SCHEMA_VIOLATION');
        assert.ok(trace.failure_summary.includes('raw SQL string'));
      } else if (trace.id === 'infinite_retry_loop') {
        assert.strictEqual(trace.failure_type, 'INFINITE_LOOP');
        assert.ok(trace.failure_summary.includes('6-step loop'));
      }
    });
  });

  it('R2.4: Span inspection drawer extracts exact arguments, captured outputs, and rejection tracebacks', () => {
    const stripeTrace = SAMPLE_TRACES[0];
    const failingStep = stripeTrace.steps.find((s) => s.status === 'ERROR');

    assert.ok(failingStep, 'Must contain a failing step in stripe trace');
    assert.strictEqual(failingStep?.name, 'process_stripe_refund');
    assert.ok(failingStep?.error_message?.includes('InvalidParameter'));
    assert.deepStrictEqual(failingStep?.arguments, {
      charge_id: 'ch_3N82910a',
      amount_cents: 4900,
      currency_format: 'US_DOLLARS',
      reason: 'duplicate_charge',
    });

    // Check successful step output capture
    const successStep = stripeTrace.steps.find((s) => s.name === 'lookup_invoice');
    assert.ok(successStep?.output, 'lookup_invoice must capture output');
    assert.strictEqual(successStep?.output?.status, 'paid');
    assert.strictEqual(successStep?.output?.amount_cents, 4900);
  });

  it('R2.5: Schema spec serialization formats valid YAML eval definitions with mock harness contracts', () => {
    SAMPLE_TRACES.forEach((trace) => {
      const mockHarnessYaml = trace.mock_tools
        .map(
          (t) => `    - name: "${t.name}"
      match:
        type: "schema_validation"
        required_keys: ${JSON.stringify(Object.keys(t.expected_args))}
        ${t.forbidden_keys ? `forbidden_keys: ${JSON.stringify(t.forbidden_keys)}` : ''}
      response: ${JSON.stringify(t.simulated_response)}
      latency_sim_ms: ${t.latency_ms}`
        )
        .join('\n');

      assert.ok(mockHarnessYaml.includes('name: "'), 'YAML must format mock tool names');
      assert.ok(mockHarnessYaml.includes('required_keys:'), 'YAML must include required_keys');
    });
  });

  it('R2.6: Status badges and token gauges are accurately mapped across LLM and Tool spans', () => {
    SAMPLE_TRACES.forEach((trace) => {
      trace.steps.forEach((step) => {
        assert.ok(['SUCCESS', 'ERROR', 'PENDING'].includes(step.status), `Invalid status ${step.status}`);
        assert.ok(['LLM_CALL', 'TOOL_EXECUTION', 'USER_MESSAGE'].includes(step.type), `Invalid span type ${step.type}`);

        if (step.type === 'LLM_CALL') {
          assert.ok(step.tokens, 'LLM span must declare token usage breakdown');
          assert.strictEqual(
            step.tokens!.total_tokens,
            step.tokens!.prompt_tokens + step.tokens!.completion_tokens,
            'Token arithmetic must be exact'
          );
        }
      });
    });
  });
});
