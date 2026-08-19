"""
Deterministic Mock Harness: Intercepts external tool calls (Stripe, DB, Webhooks)
during agent execution with zero side-effects, strict schema validation, and sequence tracking.
"""

from __future__ import annotations
import re
from typing import Any, Dict, List, Optional, Tuple
from .schema import (
    MockHarnessSpec,
    MockMatchRule,
    MockToolSpec,
    MatchType,
)


class MockInvocationRecord:
    def __init__(self, tool_name: str, arguments: Dict[str, Any], response: Any, latency_ms: int, matched: bool, error: Optional[str] = None):
        self.tool_name = tool_name
        self.arguments = arguments
        self.response = response
        self.latency_ms = latency_ms
        self.matched = matched
        self.error = error


class MockHarness:
    """
    Zero-side-effect deterministic tool dispatcher.
    """

    def __init__(self, spec: Optional[MockHarnessSpec] = None):
        self.spec = spec or MockHarnessSpec()
        self.call_history: List[MockInvocationRecord] = []
        self._sequence_counters: Dict[str, int] = {}

    def register_tool(self, tool_spec: MockToolSpec) -> None:
        self.spec.tools.append(tool_spec)

    def dispatch(self, tool_name: str, arguments: Dict[str, Any]) -> Tuple[Any, int, Optional[str]]:
        """
        Dispatches a tool call against registered mocks.
        Returns (response, latency_ms, error_message).
        """
        candidate_specs = [t for t in self.spec.tools if t.name == tool_name]

        if not candidate_specs:
            if self.spec.default_behavior == "fail_on_unmatched":
                err = f"MockError: Unregistered tool execution attempted: '{tool_name}'"
                record = MockInvocationRecord(tool_name, arguments, None, 0, False, err)
                self.call_history.append(record)
                return None, 0, err
            else:
                resp = {"status": "default_mocked", "tool": tool_name}
                record = MockInvocationRecord(tool_name, arguments, resp, 10, True)
                self.call_history.append(record)
                return resp, 10, None

        # Check each candidate spec against arguments
        for tool_spec in candidate_specs:
            matched, reason = self._check_match(tool_spec.match, arguments)
            if matched:
                # Handle sequential responses
                if tool_spec.sequential_responses:
                    idx = self._sequence_counters.get(tool_name, 0)
                    resp = tool_spec.sequential_responses[min(idx, len(tool_spec.sequential_responses) - 1)]
                    self._sequence_counters[tool_name] = idx + 1
                else:
                    resp = tool_spec.response

                err = tool_spec.error
                lat = tool_spec.latency_sim_ms

                record = MockInvocationRecord(tool_name, arguments, resp, lat, True, err)
                self.call_history.append(record)
                return resp, lat, err

        # If we had candidate specs but none matched
        last_reason = reason if 'reason' in locals() and reason else "failed mock validation constraints."
        err = f"MockSchemaMismatch: Arguments for tool '{tool_name}' {last_reason}"
        record = MockInvocationRecord(tool_name, arguments, None, 0, False, err)
        self.call_history.append(record)
        return None, 0, err

    def _check_match(self, rule: MockMatchRule, arguments: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
        if rule.type == MatchType.ANY:
            return True, None

        if rule.type == MatchType.EXACT_ARGS:
            if rule.args is None:
                return True, None
            # Check deep equality for keys present in rule
            for k, v in rule.args.items():
                if arguments.get(k) != v:
                    return False, f"Expected arg '{k}' = {v}, got {arguments.get(k)}"
            return True, None

        if rule.type == MatchType.SCHEMA_VALIDATION:
            # Check required keys
            if rule.required_keys:
                for k in rule.required_keys:
                    if k not in arguments:
                        return False, f"Missing required parameter '{k}'"
            
            # Check forbidden keys (e.g. hallucinated fields)
            if rule.forbidden_keys:
                for k in rule.forbidden_keys:
                    if k in arguments:
                        return False, f"Forbidden parameter '{k}' was present in tool invocation"
            return True, None

        if rule.type == MatchType.REGEX_MATCH:
            if rule.regex_patterns:
                for k, pattern in rule.regex_patterns.items():
                    val = str(arguments.get(k, ""))
                    if not re.search(pattern, val):
                        return False, f"Parameter '{k}' ({val}) failed pattern match '{pattern}'"
            return True, None

        return True, None

    def get_calls_for_tool(self, tool_name: str) -> List[MockInvocationRecord]:
        return [c for c in self.call_history if c.tool_name == tool_name]

    def reset(self) -> None:
        self.call_history.clear()
        self._sequence_counters.clear()
