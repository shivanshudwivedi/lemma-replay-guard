"""
Core data schemas for Lemma Replay Adapter & CI Regression Guard (trace2test).
"""

from __future__ import annotations
from enum import Enum
from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, Field


class StepType(str, Enum):
    LLM_CALL = "LLM_CALL"
    TOOL_EXECUTION = "TOOL_EXECUTION"
    USER_MESSAGE = "USER_MESSAGE"
    SYSTEM_MESSAGE = "SYSTEM_MESSAGE"
    ERROR = "ERROR"


class FailureType(str, Enum):
    TOOL_PARAMETER_HALLUCINATION = "TOOL_PARAMETER_HALLUCINATION"
    SCHEMA_VIOLATION = "SCHEMA_VIOLATION"
    INFINITE_LOOP = "INFINITE_LOOP"
    SEMANTIC_DRIFT = "SEMANTIC_DRIFT"
    UNHANDLED_EXCEPTION = "UNHANDLED_EXCEPTION"
    SECURITY_BYPASS = "SECURITY_BYPASS"
    CUSTOM = "CUSTOM"


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


class ToolCall(BaseModel):
    call_id: str
    name: str
    arguments: Dict[str, Any] = Field(default_factory=dict)


class TraceStep(BaseModel):
    step_index: int
    type: StepType
    name: Optional[str] = None
    call_id: Optional[str] = None
    model: Optional[str] = None
    arguments: Optional[Dict[str, Any]] = None
    output: Optional[Any] = None
    output_tool_calls: Optional[List[ToolCall]] = None
    error_message: Optional[str] = None
    latency_ms: int = 0
    tokens: Optional[TokenUsage] = None
    status: str = "SUCCESS"


class TraceMetrics(BaseModel):
    total_latency_ms: int = 0
    total_tokens: int = 0
    cost_usd: float = 0.0


class Message(BaseModel):
    role: str
    content: str


class LemmaTrace(BaseModel):
    trace_id: str
    agent_id: str
    timestamp: str
    status: str = "FAILURE"
    failure_type: FailureType = FailureType.CUSTOM
    failure_summary: str
    system_prompt: str
    messages: List[Message] = Field(default_factory=list)
    steps: List[TraceStep] = Field(default_factory=list)
    metrics: TraceMetrics = Field(default_factory=TraceMetrics)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MatchType(str, Enum):
    EXACT_ARGS = "exact_args"
    SCHEMA_VALIDATION = "schema_validation"
    REGEX_MATCH = "regex_match"
    ANY = "any"


class MockMatchRule(BaseModel):
    type: MatchType = MatchType.ANY
    args: Optional[Dict[str, Any]] = None
    required_keys: Optional[List[str]] = None
    forbidden_keys: Optional[List[str]] = None
    regex_patterns: Optional[Dict[str, str]] = None


class MockToolSpec(BaseModel):
    name: str
    match: MockMatchRule = Field(default_factory=MockMatchRule)
    response: Any = None
    error: Optional[str] = None
    latency_sim_ms: int = 20
    sequential_responses: Optional[List[Any]] = None


class MockHarnessSpec(BaseModel):
    tools: List[MockToolSpec] = Field(default_factory=list)
    default_behavior: str = "fail_on_unmatched"  # or 'empty_success'


class AssertionType(str, Enum):
    TOOL_CALLED = "tool_called"
    TOOL_NOT_CALLED = "tool_not_called"
    NO_FORBIDDEN_KEYS = "no_forbidden_keys"
    REQUIRED_KEYS_PRESENT = "required_keys_present"
    MAX_TOOL_STEPS = "max_tool_steps"
    SEMANTIC_OUTPUT_CONTAINS = "semantic_output_contains"
    NO_ERROR_STEPS = "no_error_steps"


class AssertionSpec(BaseModel):
    type: AssertionType
    tool_name: Optional[str] = None
    keys: Optional[List[str]] = None
    count: Optional[int] = None
    phrase: Optional[str] = None
    required: bool = True
    description: Optional[str] = None


class BaselineMetrics(BaseModel):
    model: str
    total_latency_ms: int
    total_tokens: int
    cost_usd: float
    status: str = "FAILED"
    failure_type: Optional[str] = None


class EvalInput(BaseModel):
    system_prompt: str
    user_input: str
    history: List[Message] = Field(default_factory=list)


class EvalFixture(BaseModel):
    schema_version: str = "v1.0"
    eval_id: str
    source_trace_id: str
    agent_id: str
    created_at: str
    category: str = "regression_guard"
    description: str = ""
    baseline: BaselineMetrics
    input: EvalInput
    mock_harness: MockHarnessSpec
    assertions: List[AssertionSpec] = Field(default_factory=list)


class AssertionResult(BaseModel):
    assertion: AssertionSpec
    passed: bool
    message: str


class ReplayStepResult(BaseModel):
    step_index: int
    type: StepType
    tool_name: Optional[str] = None
    arguments: Optional[Dict[str, Any]] = None
    response: Optional[Any] = None
    mocked: bool = True
    latency_ms: int = 0
    tokens: TokenUsage = Field(default_factory=TokenUsage)
    error: Optional[str] = None


class ReplayExecutionResult(BaseModel):
    eval_id: str
    source_trace_id: str
    model: str
    passed: bool
    final_output: str
    steps: List[ReplayStepResult] = Field(default_factory=list)
    assertion_results: List[AssertionResult] = Field(default_factory=list)
    total_latency_ms: int = 0
    total_tokens: TokenUsage = Field(default_factory=TokenUsage)
    cost_usd: float = 0.0
    error_summary: Optional[str] = None


class DiffReport(BaseModel):
    eval_id: str
    source_trace_id: str
    orig_status: str
    replay_status: str
    regression_resolved: bool
    
    orig_latency_ms: int
    replay_latency_ms: int
    delta_latency_ms: int
    delta_latency_pct: float
    
    orig_tokens: int
    replay_tokens: int
    delta_tokens: int
    delta_tokens_pct: float
    
    orig_cost_usd: float
    replay_cost_usd: float
    delta_cost_usd: float
    
    model_orig: str
    model_replay: str
    
    assertion_summary: Dict[str, int] = Field(default_factory=lambda: {"total": 0, "passed": 0, "failed": 0})
    assertions: List[AssertionResult] = Field(default_factory=list)
    step_diffs: List[Dict[str, Any]] = Field(default_factory=list)
