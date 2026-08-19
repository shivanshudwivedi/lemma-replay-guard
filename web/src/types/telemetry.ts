export type SpanType = 'LLM_CALL' | 'TOOL_EXECUTION' | 'USER_MESSAGE' | 'SYSTEM_PROMPT';
export type StepStatus = 'SUCCESS' | 'ERROR' | 'PENDING';
export type ModelId = 'gpt-4o' | 'claude-3-5-sonnet' | 'gpt-4o-mini' | 'deepseek-v3';

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface TraceStepData {
  step_index: number;
  type: SpanType;
  name?: string;
  call_id?: string;
  model?: string;
  arguments?: Record<string, any>;
  output?: any;
  error_message?: string;
  latency_ms: number;
  tokens?: TokenUsage;
  status: StepStatus;
  start_offset_ms?: number;
}

export interface MockToolDefinition {
  name: string;
  description: string;
  expected_args: Record<string, any>;
  forbidden_keys?: string[];
  simulated_response: any;
  latency_ms: number;
}

export interface AssertionRule {
  rule: string;
  description: string;
  type: string;
  passed?: boolean;
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
  mock_tools: MockToolDefinition[];
  assertions: AssertionRule[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export interface ModelPricing {
  modelId: ModelId;
  name: string;
  inputPerMillion: number;
  outputPerMillion: number;
}
