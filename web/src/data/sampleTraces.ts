import { SampleTraceData, TraceStepData, MockToolDefinition, AssertionRule } from '../types/telemetry';

export type { TraceStepData, SampleTraceData, MockToolDefinition, AssertionRule };

export const SAMPLE_TRACES: SampleTraceData[] = [
  {
    id: 'stripe_hallucination',
    name: 'Stripe Refund Param Hallucination',
    category: 'Billing & Payments',
    agent_id: 'billing-assistant-v2',
    trace_id: 'tr_lemma_84920491',
    timestamp: '2026-08-18 14:32:10 UTC',
    failure_type: 'TOOL_PARAMETER_HALLUCINATION',
    failure_badge_color: 'text-rose-700 bg-rose-50 border-rose-200',
    failure_summary: "Agent generated non-existent parameter 'currency_format: US_DOLLARS' in process_stripe_refund invocation, causing a fatal schema rejection.",
    root_cause: "System prompt did not specify strict parameter constraints for process_stripe_refund, allowing the LLM to invent formatting arguments.",
    system_prompt_original: `You are a customer billing assistant for SaaSify. When a customer asks for a refund, fetch their transaction history and process the refund using the process_stripe_refund tool.`,
    system_prompt_patched: `You are a customer billing assistant for SaaSify. When a customer asks for a refund, fetch their transaction history and process the refund using the process_stripe_refund tool.

CRITICAL SCHEMA CONSTRAINT:
The process_stripe_refund tool strictly accepts only {charge_id: string, amount_cents: integer, reason: string}.
Do NOT provide currency_format, currency, or any additional parameters.`,
    user_input: "Hi, I was accidentally double billed $49 on invoice inv_99182. Can you refund the extra charge?",
    steps: [
      {
        step_index: 0,
        type: 'LLM_CALL',
        model: 'gpt-4o',
        latency_ms: 780,
        tokens: { prompt_tokens: 312, completion_tokens: 48, total_tokens: 360 },
        arguments: { tool_called: 'lookup_invoice', invoice_id: 'inv_99182' },
        status: 'SUCCESS',
        start_offset_ms: 0
      },
      {
        step_index: 1,
        type: 'TOOL_EXECUTION',
        name: 'lookup_invoice',
        call_id: 'call_db_check_01',
        arguments: { invoice_id: 'inv_99182' },
        output: { status: 'paid', amount_cents: 4900, currency: 'USD', charge_id: 'ch_3N82910a' },
        latency_ms: 120,
        status: 'SUCCESS',
        start_offset_ms: 780
      },
      {
        step_index: 2,
        type: 'LLM_CALL',
        model: 'gpt-4o',
        latency_ms: 890,
        tokens: { prompt_tokens: 425, completion_tokens: 56, total_tokens: 481 },
        arguments: {
          charge_id: 'ch_3N82910a',
          amount_cents: 4900,
          currency_format: 'US_DOLLARS',
          reason: 'duplicate_charge'
        },
        status: 'SUCCESS',
        start_offset_ms: 900
      },
      {
        step_index: 3,
        type: 'TOOL_EXECUTION',
        name: 'process_stripe_refund',
        call_id: 'call_stripe_refund_02',
        arguments: {
          charge_id: 'ch_3N82910a',
          amount_cents: 4900,
          currency_format: 'US_DOLLARS',
          reason: 'duplicate_charge'
        },
        error_message: "InvalidParameter: 'currency_format' is not recognized by Stripe SDK. Expected: {charge_id, amount_cents, reason}",
        latency_ms: 45,
        status: 'ERROR',
        start_offset_ms: 1790
      }
    ],
    baseline_metrics: {
      latency_ms: 1835,
      tokens: 841,
      cost_usd: 0.00345
    },
    replay_metrics: {
      latency_ms: 850,
      tokens: 762,
      cost_usd: 0.00260
    },
    mock_tools: [
      {
        name: 'lookup_invoice',
        description: 'Fetches metadata and Stripe charge reference for an invoice ID',
        expected_args: { invoice_id: 'inv_99182' },
        simulated_response: { status: 'paid', amount_cents: 4900, currency: 'USD', charge_id: 'ch_3N82910a' },
        latency_ms: 35
      },
      {
        name: 'process_stripe_refund',
        description: 'Submits zero-side-effect mock refund against sandbox',
        expected_args: { charge_id: 'ch_3N82910a', amount_cents: 4900, reason: 'duplicate_charge' },
        forbidden_keys: ['currency_format'],
        simulated_response: { refund_id: 're_mock_993182', status: 'succeeded', amount_refunded_cents: 4900 },
        latency_ms: 55
      }
    ],
    assertions: [
      {
        rule: 'no_error_steps',
        description: 'Agent execution path must complete with 0 unhandled error steps',
        type: 'System Safety'
      },
      {
        rule: 'tool_called',
        description: "Must successfully dispatch 'process_stripe_refund'",
        type: 'Workflow Fidelity'
      },
      {
        rule: 'no_forbidden_keys',
        description: "Must NOT pass forbidden parameter 'currency_format'",
        type: 'Schema Contract'
      },
      {
        rule: 'max_tool_steps',
        description: 'Must complete refund within 2 tool execution steps',
        type: 'Efficiency Gate'
      }
    ]
  },
  {
    id: 'sql_schema_drift',
    name: 'Unsanitized Raw SQL Query Drift',
    category: 'Data & Analytics',
    agent_id: 'analytics-copilot',
    trace_id: 'tr_lemma_99210411',
    timestamp: '2026-08-18 15:10:44 UTC',
    failure_type: 'SCHEMA_VIOLATION',
    failure_badge_color: 'text-rose-700 bg-rose-50 border-rose-200',
    failure_summary: "Agent constructed an unescaped raw SQL string with single quote syntax failure instead of using parameterized warehouse queries.",
    root_cause: "Agent prompt allowed raw string concatenation for SQL filters containing apostrophes ('O'Reilly Media').",
    system_prompt_original: `You are an analytics assistant. Query the analytics warehouse using execute_query with whatever SQL query string is needed.`,
    system_prompt_patched: `You are an analytics assistant. Query the analytics warehouse using execute_query.
MANDATORY SAFETY PROTOCOL:
Always execute queries via parameterized format {query_template: string, params: dict}.
NEVER concatenate raw unescaped string literals into SQL text.`,
    user_input: "Show me total active seats for organization 'O'Reilly Media' in Q3.",
    steps: [
      {
        step_index: 0,
        type: 'LLM_CALL',
        model: 'claude-3-5-sonnet',
        latency_ms: 1100,
        tokens: { prompt_tokens: 540, completion_tokens: 70, total_tokens: 610 },
        arguments: { raw_sql: "SELECT COUNT(*) FROM seats WHERE org_name = 'O'Reilly Media' AND quarter = 'Q3'" },
        status: 'SUCCESS',
        start_offset_ms: 0
      },
      {
        step_index: 1,
        type: 'TOOL_EXECUTION',
        name: 'execute_query',
        call_id: 'call_sql_err_01',
        arguments: { raw_sql: "SELECT COUNT(*) FROM seats WHERE org_name = 'O'Reilly Media' AND quarter = 'Q3'" },
        error_message: "SQLSyntaxError: syntax error at or near 'Reilly'. Raw string concatenation violates parameterized security schema.",
        latency_ms: 30,
        status: 'ERROR',
        start_offset_ms: 1100
      }
    ],
    baseline_metrics: {
      latency_ms: 1130,
      tokens: 610,
      cost_usd: 0.00267
    },
    replay_metrics: {
      latency_ms: 640,
      tokens: 520,
      cost_usd: 0.00201
    },
    mock_tools: [
      {
        name: 'execute_query',
        description: 'Deterministic SQL warehouse mock dispatcher',
        expected_args: { query_template: 'SELECT COUNT(*) FROM seats WHERE org_name = $1 AND quarter = $2', params: { org_name: "O'Reilly Media", quarter: 'Q3' } },
        forbidden_keys: ['raw_sql'],
        simulated_response: { rows: [{ active_seats: 1420 }], row_count: 1 },
        latency_ms: 40
      }
    ],
    assertions: [
      {
        rule: 'no_error_steps',
        description: 'Must not trigger database syntax or schema rejection errors',
        type: 'System Safety'
      },
      {
        rule: 'required_keys_present',
        description: "Must provide parameterized 'query_template' and 'params'",
        type: 'Security Guard'
      },
      {
        rule: 'no_forbidden_keys',
        description: "Must NOT supply raw unescaped 'raw_sql'",
        type: 'SQL Injection Guard'
      },
      {
        rule: 'max_tool_steps',
        description: 'Must complete query within 1 tool execution step',
        type: 'Efficiency Gate'
      }
    ]
  },
  {
    id: 'infinite_retry_loop',
    name: 'GitHub Triager 6-Step Loop',
    category: 'Developer Tooling',
    agent_id: 'github-issue-triager',
    trace_id: 'tr_lemma_77192842',
    timestamp: '2026-08-18 16:05:12 UTC',
    failure_type: 'INFINITE_LOOP',
    failure_badge_color: 'text-rose-700 bg-rose-50 border-rose-200',
    failure_summary: "Agent got trapped in an unhandled 6-step loop continuously re-attempting a non-existent milestone title.",
    root_cause: "Missing error handling branch when set_issue_milestone returns 404 MilestoneNotFound.",
    system_prompt_original: `You are a GitHub issue triager. Assign labels and milestones to incoming issues using set_issue_milestone.`,
    system_prompt_patched: `You are a GitHub issue triager. Assign labels and milestones to incoming issues using set_issue_milestone.

ERROR HANDLING RULES:
1. If set_issue_milestone fails with MilestoneNotFound, immediately query list_open_milestones to find the closest match.
2. If no valid milestone matches, post a comment asking for milestone clarification and terminate. Do NOT retry the failing title.`,
    user_input: "Add issue #402 to the v2.4 Release milestone.",
    steps: [
      { step_index: 0, type: 'LLM_CALL', model: 'gpt-4o-mini', latency_ms: 320, tokens: { prompt_tokens: 200, completion_tokens: 30, total_tokens: 230 }, status: 'SUCCESS', start_offset_ms: 0 },
      { step_index: 1, type: 'TOOL_EXECUTION', name: 'set_issue_milestone', arguments: { milestone_title: 'v2.4 Release' }, error_message: "MilestoneNotFound: 'v2.4 Release'", latency_ms: 50, status: 'ERROR', start_offset_ms: 320 },
      { step_index: 2, type: 'LLM_CALL', model: 'gpt-4o-mini', latency_ms: 310, tokens: { prompt_tokens: 280, completion_tokens: 35, total_tokens: 315 }, status: 'SUCCESS', start_offset_ms: 370 },
      { step_index: 3, type: 'TOOL_EXECUTION', name: 'set_issue_milestone', arguments: { milestone_title: 'v2.4 Release' }, error_message: "MilestoneNotFound: 'v2.4 Release'", latency_ms: 48, status: 'ERROR', start_offset_ms: 680 },
      { step_index: 4, type: 'LLM_CALL', model: 'gpt-4o-mini', latency_ms: 330, tokens: { prompt_tokens: 350, completion_tokens: 35, total_tokens: 385 }, status: 'SUCCESS', start_offset_ms: 728 },
      { step_index: 5, type: 'TOOL_EXECUTION', name: 'set_issue_milestone', arguments: { milestone_title: 'v2.4 Release' }, error_message: "MilestoneNotFound: 'v2.4 Release'", latency_ms: 52, status: 'ERROR', start_offset_ms: 1058 }
    ],
    baseline_metrics: {
      latency_ms: 1110,
      tokens: 930,
      cost_usd: 0.00032
    },
    replay_metrics: {
      latency_ms: 420,
      tokens: 340,
      cost_usd: 0.00011
    },
    mock_tools: [
      {
        name: 'set_issue_milestone',
        description: 'Attempts to assign milestone to issue',
        expected_args: { milestone_title: 'v2.4-release' },
        simulated_response: { status: 'assigned', milestone_id: 'ms_4910', issue: 402 },
        latency_ms: 30
      },
      {
        name: 'list_open_milestones',
        description: 'Lists open repository milestones for fuzzy matching',
        expected_args: {},
        simulated_response: { milestones: [{ id: 'ms_4910', title: 'v2.4-release', state: 'open' }] },
        latency_ms: 25
      }
    ],
    assertions: [
      {
        rule: 'max_tool_steps',
        description: 'Must terminate loop within at most 2 tool executions',
        type: 'Loop Breaker'
      },
      {
        rule: 'no_error_steps',
        description: 'Must handle missing milestone without unhandled exceptions',
        type: 'System Safety'
      },
      {
        rule: 'tool_called',
        description: "Must successfully resolve milestone target",
        type: 'Workflow Fidelity'
      }
    ]
  }
];
