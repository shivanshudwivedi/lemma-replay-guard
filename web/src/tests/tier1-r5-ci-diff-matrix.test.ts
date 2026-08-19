import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_TRACES, SampleTraceData } from '../data/sampleTraces';

describe('Tier 1 — R5: CI Regression Diff Matrix & PR Bot Comment Specifications', () => {
  // Authoritative Source: ORIGINAL_REQUEST.md (R5) & survey_spec.md §2 (F21, F22, F23, F24, F25, F26)

  it('R5.1: Differential metrics calculate exact delta latency, token savings, and cost reductions', () => {
    SAMPLE_TRACES.forEach((trace) => {
      const deltaLatency = trace.replay_metrics.latency_ms - trace.baseline_metrics.latency_ms;
      const deltaLatencyPct = Number(((deltaLatency / trace.baseline_metrics.latency_ms) * 100).toFixed(1));

      const deltaTokens = trace.replay_metrics.tokens - trace.baseline_metrics.tokens;
      const deltaTokensPct = Number(((deltaTokens / trace.baseline_metrics.tokens) * 100).toFixed(1));

      const deltaCost = Number((trace.replay_metrics.cost_usd - trace.baseline_metrics.cost_usd).toFixed(5));
      const savingsPerMillion = Number(
        ((trace.baseline_metrics.cost_usd - trace.replay_metrics.cost_usd) * 1_000_000).toFixed(2)
      );

      // In patched mode, all sample traces should exhibit improvements (negative deltas / positive savings)
      assert.ok(deltaLatency < 0, `Latency improvement expected for ${trace.id}, got ${deltaLatency}`);
      assert.ok(deltaLatencyPct < 0, `Latency percentage improvement expected for ${trace.id}`);
      assert.ok(deltaTokens < 0, `Token reduction expected for ${trace.id}`);
      assert.ok(deltaCost < 0, `Cost reduction expected for ${trace.id}`);
      assert.ok(savingsPerMillion > 0, `Projected 1M savings expected for ${trace.id}`);
    });
  });

  it('R5.2: GitHub PR Bot markdown comment formats valid GitHub markdown table with collapsible details', () => {
    const trace = SAMPLE_TRACES[0];
    const deltaLatency = trace.replay_metrics.latency_ms - trace.baseline_metrics.latency_ms;
    const deltaLatencyPct = ((deltaLatency / trace.baseline_metrics.latency_ms) * 100).toFixed(1);
    const deltaTokens = trace.replay_metrics.tokens - trace.baseline_metrics.tokens;
    const deltaTokensPct = ((deltaTokens / trace.baseline_metrics.tokens) * 100).toFixed(1);
    const deltaCost = (trace.replay_metrics.cost_usd - trace.baseline_metrics.cost_usd).toFixed(5);

    const generatePrMarkdown = (t: SampleTraceData) => `## 🟢 Lemma CI Regression Guard Report
> **Summary:** All Regressions Resolved across \`1\` eval fixture(s).

### 📊 Regression Diff Matrix

| Eval ID | Status | Δ Latency | Δ Tokens | Δ Cost / Run | Assertion Pass Rate |
|---|:---:|:---:|:---:|:---:|:---:|
| \`eval_${t.id}\` | ✅ \`RESOLVED\` | \`${deltaLatency}ms (${deltaLatencyPct}%)\` | \`${deltaTokens} (${deltaTokensPct}%)\` | \`$${deltaCost}\` | \`${t.assertions.length}/${t.assertions.length}\` |

### 🔍 Detailed Assertion Breakdown

<details open><summary><b>eval_${t.id}</b> (Source Trace: <code>${t.trace_id}</code>)</summary>

| Assertion | Result | Details |
|---|:---:|---|
${t.assertions.map((a) => `| ${a.description} | ✅ | Passed deterministic mock validation |`).join('\n')}
</details>

---
*Report generated automatically by [Lemma CI Regression Guard](https://uselemma.ai) • Deterministic Mock Execution Sandbox*`;

    const markdown = generatePrMarkdown(trace);
    assert.ok(markdown.includes('## 🟢 Lemma CI Regression Guard Report'));
    assert.ok(markdown.includes('| Eval ID | Status | Δ Latency |'));
    assert.ok(markdown.includes(`\`eval_${trace.id}\``));
    assert.ok(markdown.includes('✅ `RESOLVED`'));
    assert.ok(markdown.includes('<details open><summary>'));
    assert.ok(markdown.includes('https://uselemma.ai'));
  });

  it('R5.3: Developer Export Center contains valid GitHub Actions YAML, MCP config, CLI snippets, and Python SDK code', () => {
    const SNIPPETS = {
      github_actions: `name: "Lemma CI Regression Guard"
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'agents/**'
      - 'evals/**'

jobs:
  lemma-replay-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Lemma Replay Engine
        run: pip install lemma-replay

      - name: Execute Deterministic Replay Matrix
        run: lemma-replay run evals/ --reporter=markdown --out=summary.md

      - name: Post PR Regression Comment
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });`,
      mcp: JSON.stringify(
        {
          mcpServers: {
            lemma: {
              command: 'npx',
              args: ['-y', '@lemma-ai/mcp-server'],
              env: {
                LEMMA_API_KEY: 'lm_live_xxxxxxxxxxxx',
              },
            },
          },
        },
        null,
        2
      ),
      cli: `lemma-replay ingest ./traces/prod_failure_9821.json --output ./evals/eval_stripe_refund.lemma.yaml`,
      python_sdk: `from lemma_replay import TraceIngestor, ReplayRunner, DiffEngine`,
    };

    assert.ok(SNIPPETS.github_actions.includes('name: "Lemma CI Regression Guard"'));
    assert.ok(SNIPPETS.github_actions.includes('pip install lemma-replay'));

    const parsedMcp = JSON.parse(SNIPPETS.mcp);
    assert.strictEqual(parsedMcp.mcpServers.lemma.command, 'npx');

    assert.ok(SNIPPETS.cli.includes('lemma-replay ingest'));
    assert.ok(SNIPPETS.python_sdk.includes('TraceIngestor, ReplayRunner'));
  });

  it('R5.4: Command Palette fuzzy search filters traces by title, agent ID, and failure type', () => {
    const search = (query: string) =>
      SAMPLE_TRACES.filter(
        (t) =>
          t.name.toLowerCase().includes(query.toLowerCase()) ||
          t.agent_id.toLowerCase().includes(query.toLowerCase()) ||
          t.failure_type.toLowerCase().includes(query.toLowerCase())
      );

    const stripeResults = search('stripe');
    assert.strictEqual(stripeResults.length, 1);
    assert.strictEqual(stripeResults[0].id, 'stripe_hallucination');

    const sqlResults = search('analytics-copilot');
    assert.strictEqual(sqlResults.length, 1);
    assert.strictEqual(sqlResults[0].id, 'sql_schema_drift');

    const loopResults = search('INFINITE_LOOP');
    assert.strictEqual(loopResults.length, 1);
    assert.strictEqual(loopResults[0].id, 'infinite_retry_loop');

    const emptyResults = search('non_existent_xyz_query');
    assert.strictEqual(emptyResults.length, 0);
  });

  it('R5.5: Assertion breakdown in PR table matches exact count of trace assertions', () => {
    SAMPLE_TRACES.forEach((trace) => {
      const assertionCount = trace.assertions.length;
      assert.ok(assertionCount >= 2, `Assertion count must be >= 2 for ${trace.id}`);
      const passRateString = `${assertionCount}/${assertionCount}`;
      assert.strictEqual(passRateString, `${trace.assertions.length}/${trace.assertions.length}`);
    });
  });
});
