"""
Trace Ingestor: Converts Lemma production traces (and OTel/OpenInference spans)
into versioned, reproducible Eval Fixtures (.lemma.eval.yaml / .json).
"""

from __future__ import annotations
import json
import yaml
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from .schema import (
    AssertionSpec,
    AssertionType,
    BaselineMetrics,
    EvalFixture,
    EvalInput,
    FailureType,
    LemmaTrace,
    MockHarnessSpec,
    MockMatchRule,
    MockToolSpec,
    MatchType,
    Message,
    StepType,
)


class TraceIngestor:
    """
    Ingests production traces and extracts reproducible test fixtures.
    """

    @classmethod
    def load_trace_file(cls, filepath: Union[str, Path]) -> LemmaTrace:
        path = Path(filepath)
        if not path.exists():
            raise FileNotFoundError(f"Trace file not found: {filepath}")
        
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        return cls.parse_raw_trace(data)

    @classmethod
    def parse_raw_trace(cls, raw: Dict[str, Any]) -> LemmaTrace:
        # If trace has an OpenInference/OTel structure, adapt it
        if "spans" in raw or "resourceSpans" in raw:
            return cls._adapt_otel_trace(raw)
        
        return LemmaTrace.model_validate(raw)

    @classmethod
    def _adapt_otel_trace(cls, raw: Dict[str, Any]) -> LemmaTrace:
        """Adapts OpenTelemetry / OpenInference format to standard LemmaTrace."""
        trace_id = raw.get("trace_id", "otel_imported_trace")
        return LemmaTrace(
            trace_id=trace_id,
            agent_id=raw.get("agent_id", "imported-agent"),
            timestamp=raw.get("timestamp", "2026-08-18T12:00:00Z"),
            status="FAILURE",
            failure_type=FailureType.CUSTOM,
            failure_summary="Imported OpenTelemetry failure span",
            system_prompt=raw.get("system_prompt", "You are an assistant."),
            messages=[Message(role="user", content=raw.get("user_input", "Test prompt"))],
        )

    @classmethod
    def generate_eval_fixture(
        cls,
        trace: LemmaTrace,
        eval_id_override: Optional[str] = None,
        custom_assertions: Optional[List[AssertionSpec]] = None,
    ) -> EvalFixture:
        """
        Synthesizes a versioned EvalFixture from a Lemma production failure trace.
        """
        eval_id = eval_id_override or f"eval_{trace.agent_id}_{trace.trace_id[:8]}"
        
        # 1. Extract user input
        user_messages = [m for m in trace.messages if m.role.lower() == "user"]
        last_user_input = user_messages[-1].content if user_messages else "Perform the requested action."
        
        # 2. Extract recorded tools and synthesize deterministic mocks
        mock_tools: List[MockToolSpec] = []
        observed_tool_names = set()
        
        for step in trace.steps:
            if step.type == StepType.TOOL_EXECUTION and step.name:
                observed_tool_names.add(step.name)
                
                # Check if this tool execution had valid output
                if step.output is not None:
                    mock_tools.append(
                        MockToolSpec(
                            name=step.name,
                            match=MockMatchRule(
                                type=MatchType.EXACT_ARGS if step.arguments else MatchType.ANY,
                                args=step.arguments,
                            ),
                            response=step.output,
                            latency_sim_ms=max(10, step.latency_ms),
                        )
                    )
            elif step.type == StepType.LLM_CALL and step.output_tool_calls:
                for tc in step.output_tool_calls:
                    if tc.name not in observed_tool_names:
                        observed_tool_names.add(tc.name)
                        mock_tools.append(
                            MockToolSpec(
                                name=tc.name,
                                match=MockMatchRule(type=MatchType.ANY),
                                response={"status": "mocked_success", "call_id": tc.call_id},
                                latency_sim_ms=30,
                            )
                        )

        # 3. Auto-generate assertions based on failure signature
        assertions: List[AssertionSpec] = custom_assertions or []
        if not custom_assertions:
            assertions = cls._synthesize_assertions(trace)

        # 4. Formulate Baseline metrics
        model_name = "gpt-4o"
        for step in trace.steps:
            if step.model:
                model_name = step.model
                break

        baseline = BaselineMetrics(
            model=model_name,
            total_latency_ms=trace.metrics.total_latency_ms or 1500,
            total_tokens=trace.metrics.total_tokens or 650,
            cost_usd=trace.metrics.cost_usd or 0.0025,
            status=trace.status,
            failure_type=trace.failure_type.value if hasattr(trace.failure_type, "value") else str(trace.failure_type),
        )

        return EvalFixture(
            schema_version="v1.0",
            eval_id=eval_id,
            source_trace_id=trace.trace_id,
            agent_id=trace.agent_id,
            created_at=trace.timestamp,
            category="regression_guard",
            description=f"Auto-generated regression guard from production failure: {trace.failure_summary}",
            baseline=baseline,
            input=EvalInput(
                system_prompt=trace.system_prompt,
                user_input=last_user_input,
                history=[m for m in trace.messages[:-1]] if len(trace.messages) > 1 else [],
            ),
            mock_harness=MockHarnessSpec(tools=mock_tools),
            assertions=assertions,
        )

    @classmethod
    def _synthesize_assertions(cls, trace: LemmaTrace) -> List[AssertionSpec]:
        """Automatically generates smart assertions based on failure pattern."""
        assertions: List[AssertionSpec] = [
            AssertionSpec(
                type=AssertionType.NO_ERROR_STEPS,
                description="Agent must not trigger unhandled error steps in execution path.",
            )
        ]

        # Check for tool parameter hallucinations
        if trace.failure_type == FailureType.TOOL_PARAMETER_HALLUCINATION:
            for step in trace.steps:
                if step.status == "ERROR" and step.name:
                    assertions.append(
                        AssertionSpec(
                            type=AssertionType.TOOL_CALLED,
                            tool_name=step.name,
                            description=f"Must invoke {step.name} correctly",
                        )
                    )
                    # Extract hallucinated keys if mentioned in error
                    if step.error_message and "'" in step.error_message:
                        parts = step.error_message.split("'")
                        if len(parts) >= 2:
                            hallucinated_key = parts[1]
                            assertions.append(
                                AssertionSpec(
                                    type=AssertionType.NO_FORBIDDEN_KEYS,
                                    tool_name=step.name,
                                    keys=[hallucinated_key],
                                    description=f"Ensure {step.name} does NOT include hallucinated parameter '{hallucinated_key}'",
                                )
                            )

        # Check for infinite loops
        elif trace.failure_type == FailureType.INFINITE_LOOP:
            tool_count = sum(1 for s in trace.steps if s.type == StepType.TOOL_EXECUTION)
            max_allowed = max(2, int(tool_count * 0.5))
            assertions.append(
                AssertionSpec(
                    type=AssertionType.MAX_TOOL_STEPS,
                    count=max_allowed,
                    description=f"Prevent infinite loop: maximum {max_allowed} tool invocations",
                )
            )

        # General tool call assertion
        for step in trace.steps:
            if step.type == StepType.TOOL_EXECUTION and step.name:
                assertions.append(
                    AssertionSpec(
                        type=AssertionType.TOOL_CALLED,
                        tool_name=step.name,
                        description=f"Agent must execute tool '{step.name}'",
                    )
                )

        # Deduplicate assertions
        unique_assertions = []
        seen = set()
        for a in assertions:
            key = (a.type, a.tool_name, tuple(a.keys) if a.keys else None, a.count)
            if key not in seen:
                seen.add(key)
                unique_assertions.append(a)

        return unique_assertions

    @classmethod
    def export_fixture_yaml(cls, fixture: EvalFixture, out_path: Union[str, Path]) -> Path:
        out = Path(out_path)
        out.parent.mkdir(parents=True, exist_ok=True)
        dump_dict = fixture.model_dump(mode="json")
        with open(out, "w", encoding="utf-8") as f:
            yaml.dump(dump_dict, f, default_flow_style=False, sort_keys=False)
        return out
