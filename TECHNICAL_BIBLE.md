# Lemma Replay Engine & CI Regression Guard (`trace2test`)
## The Technical Bible: Architecture, Schemas, Replay Engine & CI/CD Contract

---

## 1. System Architecture Overview

```
                                  PROD RUNTIME
                                       │
                         [ Lemma Observability Layer ]
                                       │ Captures Silent Failures
                                       ▼
                       [ Production Trace JSON / OTel ]
                                       │
                                       │ (lemma-replay ingest)
                                       ▼
                     ┌───────────────────────────────────┐
                     │    TRACE INGESTION & EXTRACTION   │
                     │  • Extracts system & user prompts │
                     │  • Isolates tool invocation graph │
                     │  • Formulates failure assertions  │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │    VERSIONED EVAL FIXTURE SPEC    │
                     │   (.lemma.eval.yaml / .json)      │
                     │  • Mock records & schema guards   │
                     │  • Baseline tokens & latencies    │
                     │  • Assertion rules                │
                     └─────────────────┬─────────────────┘
                                       │
                         DEVELOPER REPLAY / CI LOOP
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
    [ Developer IDE / Patch ]                       [ GitHub Actions CI ]
  • Modifies Prompt or Model                     • Triggered on `pull_request`
  • Tests locally via CLI / MCP                  • Runs `lemma-replay run`
               │                                               │
               └───────────────────────┬───────────────────────┘
                                       ▼
                     ┌───────────────────────────────────┐
                     │   DETERMINISTIC REPLAY ENGINE     │
                     │  • Agent Prompt / Model Harness   │
                     │  • Mock Tool Dispatcher (Zero FX) │
                     │  • Step & Cycle Detection Gate    │
                     └─────────────────┬─────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │      DIFF & EVALUATION ENGINE     │
                     │  • Assertion Passed / Failed      │
                     │  • Latency Delta: Δt (ms, %)      │
                     │  • Token & Cost Delta ($ / M req) │
                     └─────────────────┬─────────────────┘
                                       │
               ┌───────────────────────┴───────────────────────┐
               ▼                                               ▼
    [ Rich Terminal Matrix ]                       [ GitHub PR Bot Comment ]
  • Interactive ANSI tables                     • Markdown regression report
  • Node step diff trees                        • CI gate blocker on fail
```

---

## 2. Core Data Schemas

### 2.1 Lemma Production Trace Schema (`LemmaTrace`)
```json
{
  "trace_id": "tr_lemma_84920491",
  "agent_id": "billing-assistant-v2",
  "timestamp": "2026-08-18T14:32:10.120Z",
  "status": "FAILURE",
  "failure_type": "TOOL_PARAMETER_HALLUCINATION",
  "failure_summary": "Stripe refund tool called with non-existent currency parameter 'US_DOLLARS' instead of ISO code 'USD'.",
  "system_prompt": "You are a customer billing assistant for SaaSify. When a customer asks for a refund, fetch their transaction history and process the refund using the stripe_refund tool.",
  "messages": [
    {
      "role": "user",
      "content": "Hi, I was accidentally double billed $49 on invoice inv_99182. Can you refund the extra charge?"
    }
  ],
  "steps": [
    {
      "step_index": 0,
      "type": "LLM_CALL",
      "model": "gpt-4o-2024-08-06",
      "latency_ms": 780,
      "tokens": { "prompt_tokens": 312, "completion_tokens": 48, "total_tokens": 360 },
      "output_tool_calls": [
        {
          "call_id": "call_db_check_01",
          "name": "lookup_invoice",
          "arguments": { "invoice_id": "inv_99182" }
        }
      ]
    },
    {
      "step_index": 1,
      "type": "TOOL_EXECUTION",
      "call_id": "call_db_check_01",
      "name": "lookup_invoice",
      "arguments": { "invoice_id": "inv_99182" },
      "output": { "status": "paid", "amount_cents": 4900, "currency": "USD", "charge_id": "ch_3N82910a" },
      "duration_ms": 120
    },
    {
      "step_index": 2,
      "type": "LLM_CALL",
      "model": "gpt-4o-2024-08-06",
      "latency_ms": 890,
      "tokens": { "prompt_tokens": 425, "completion_tokens": 56, "total_tokens": 481 },
      "output_tool_calls": [
        {
          "call_id": "call_stripe_refund_02",
          "name": "process_stripe_refund",
          "arguments": {
            "charge_id": "ch_3N82910a",
            "amount_cents": 4900,
            "currency_format": "US_DOLLARS",
            "reason": "duplicate_charge"
          }
        }
      ]
    },
    {
      "step_index": 3,
      "type": "TOOL_EXECUTION",
      "call_id": "call_stripe_refund_02",
      "name": "process_stripe_refund",
      "status": "ERROR",
      "error_message": "InvalidParameter: 'currency_format' is not recognized. Expected schema requires no currency_format parameter or ISO 4217 'currency'.",
      "duration_ms": 45
    }
  ],
  "metrics": {
    "total_latency_ms": 1835,
    "total_tokens": 841,
    "cost_usd": 0.00345
  }
}
```

### 2.2 Versioned Eval Fixture (`.lemma.eval.yaml`)
Generated from the trace, this file is committed to source control:
```yaml
schema_version: "v1.0"
eval_id: "eval_stripe_refund_hallucination_v1"
source_trace_id: "tr_lemma_84920491"
agent_id: "billing-assistant-v2"
created_at: "2026-08-18T17:00:00Z"
category: "regression_guard"

# Baseline metrics captured from production failure
baseline:
  model: "gpt-4o-2024-08-06"
  total_latency_ms: 1835
  total_tokens: 841
  cost_usd: 0.00345
  status: "FAILED"

# Input configuration for replay
input:
  system_prompt: |
    You are a customer billing assistant for SaaSify. When a customer asks for a refund, fetch their transaction history and process the refund using the process_stripe_refund tool.
    CRITICAL: The process_stripe_refund tool only accepts {charge_id: str, amount_cents: int, reason: str}. Do NOT provide currency_format.
  user_input: "Hi, I was accidentally double billed $49 on invoice inv_99182. Can you refund the extra charge?"

# Deterministic Mock Harness: Prevents external side-effects
mock_harness:
  tools:
    - name: "lookup_invoice"
      match:
        type: "exact_args"
        args:
          invoice_id: "inv_99182"
      response:
        status: "paid"
        amount_cents: 4900
        currency: "USD"
        charge_id: "ch_3N82910a"
      latency_sim_ms: 45

    - name: "process_stripe_refund"
      match:
        type: "schema_validation"
        required_keys: ["charge_id", "amount_cents", "reason"]
        forbidden_keys: ["currency_format"]
      response:
        refund_id: "re_mock_993182"
        status: "succeeded"
        amount_refunded_cents: 4900
      latency_sim_ms: 80

# Assertions to satisfy for CI pass
assertions:
  - type: "tool_called"
    tool_name: "process_stripe_refund"
    required: true
  - type: "no_forbidden_keys"
    tool_name: "process_stripe_refund"
    keys: ["currency_format"]
  - type: "max_tool_steps"
    count: 3
  - type: "semantic_output_contains"
    phrase: "refund of $49"
```

---

## 3. Deterministic Tool Mocking Engine

### 3.1 Zero Side-Effect Guarantee
When developers or CI pipelines test an agent bugfix, running live tools is unacceptable:
1. **Financial Side-Effects**: Triggering live Stripe charges or refunds.
2. **State Pollution**: Mutating production or staging SQL databases.
3. **Flakiness & Rate Limits**: Network hiccups or rate-limiting in CI.

### 3.2 Mock Matching Strategies
1. **`exact_args`**: Checks deep equality on dictionary parameters.
2. **`schema_validation`**: Validates JSON Schema types, regex constraints, and checks forbidden keys (e.g. hallucinated fields).
3. **`stateful_sequence`**: Returns sequential responses for multi-step loops (e.g. first call returns `in_progress`, second call returns `completed`).
4. **`dynamic_mock_evaluator`**: Uses lightweight rule evaluation for parameterized assertions.

---

## 4. Multi-Metric Diff & Cost Model

The Replay Engine computes performance and financial diffs:

$$\Delta t = t_{\text{replay}} - t_{\text{orig}} \quad (\% \Delta t = \frac{\Delta t}{t_{\text{orig}}} \times 100)$$

$$\Delta \text{Tokens} = T_{\text{replay}} - T_{\text{orig}}$$

$$\text{Cost} = (T_{\text{in}} \times P_{\text{in}}) + (T_{\text{out}} \times P_{\text{out}})$$

### Model Cost Table (Standardized per 1M tokens, 2026 Reference)
| Model | Input ($/M) | Output ($/M) |
|---|---|---|
| `gpt-4o` | $2.50 | $10.00 |
| `gpt-4o-mini` | $0.15 | $0.60 |
| `claude-3-5-sonnet` | $3.00 | $15.00 |
| `deepseek-v3` | $0.14 | $0.28 |

---

## 5. CI/CD Reporter & GitHub Action Specification

### 5.1 GitHub Actions Workflow (`.github/workflows/lemma_regression.yml`)
```yaml
name: "Lemma CI Regression Guard"
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
            });
```

---

## 6. Frontend Architecture (3D Motion Web Studio)

- **Framework**: React 19 + TypeScript + Vite + Tailwind CSS.
- **Visuals**:
  - WebGL / Three.js 3D Interactive Telemetry Particle Lattice with dynamic mouse rotation & pulsing nodes.
  - Framer Motion micro-interactions, spring physics, and animated counters.
- **Key Modules**:
  1. `HeroSection`: High-impact landing with Lemma telemetry stats ($2.3M pre-seed badge, 1M+ traces daily, zero-regression guarantee).
  2. `TraceIngestor`: Interactive gallery of production silent failure traces with JSON inspection.
  3. `ReplayStudio`: DAG trace viewer, live prompt patch editor, deterministic mock inspector, and replay debugger.
  4. `CIRegressionMatrix`: Side-by-side comparison tables, $\Delta$ latency, $\Delta$ cost, and live GitHub PR markdown preview.
  5. `McpCliExportModal`: Instant setup for Cursor, Claude Code, and GitHub Actions CI.
