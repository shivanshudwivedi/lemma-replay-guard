"""
Comprehensive test suite for Lemma Replay Engine & CI Regression Guard.
"""

import json
from pathlib import Path
import pytest

from lemma_replay.schema import (
    AssertionSpec,
    AssertionType,
    EvalFixture,
    FailureType,
    LemmaTrace,
    MockHarnessSpec,
    MockMatchRule,
    MockToolSpec,
    MatchType,
)
from lemma_replay.ingestor import TraceIngestor
from lemma_replay.mock_harness import MockHarness
from lemma_replay.replay_runner import ReplayRunner, calculate_cost
from lemma_replay.diff_engine import DiffEngine
from lemma_replay.reporters import MarkdownReporter


FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"


def test_schema_serialization():
    trace_path = FIXTURES_DIR / "trace_01_tool_hallucination.json"
    trace = TraceIngestor.load_trace_file(trace_path)
    
    assert trace.trace_id == "tr_lemma_84920491"
    assert trace.failure_type == FailureType.TOOL_PARAMETER_HALLUCINATION
    assert len(trace.steps) == 4
    assert trace.metrics.total_tokens == 841


def test_trace_ingestion_to_fixture():
    trace_path = FIXTURES_DIR / "trace_01_tool_hallucination.json"
    trace = TraceIngestor.load_trace_file(trace_path)
    fixture = TraceIngestor.generate_eval_fixture(trace)

    assert fixture.schema_version == "v1.0"
    assert fixture.agent_id == "billing-assistant-v2"
    assert fixture.baseline.status == "FAILURE"
    assert len(fixture.mock_harness.tools) > 0
    assert len(fixture.assertions) > 0

    # Ensure forbidden keys assertion was auto-synthesized
    forbidden_rules = [a for a in fixture.assertions if a.type == AssertionType.NO_FORBIDDEN_KEYS]
    assert len(forbidden_rules) >= 1
    assert "currency_format" in forbidden_rules[0].keys


def test_mock_harness_exact_and_schema_rules():
    spec = MockHarnessSpec(
        tools=[
            MockToolSpec(
                name="test_tool",
                match=MockMatchRule(
                    type=MatchType.SCHEMA_VALIDATION,
                    required_keys=["user_id"],
                    forbidden_keys=["invalid_param"],
                ),
                response={"status": "ok"},
            )
        ]
    )
    harness = MockHarness(spec)

    # Valid call
    resp, lat, err = harness.dispatch("test_tool", {"user_id": "u_123"})
    assert resp == {"status": "ok"}
    assert err is None

    # Invalid call with forbidden parameter
    resp_bad, _, err_bad = harness.dispatch("test_tool", {"user_id": "u_123", "invalid_param": "hallucinated"})
    assert resp_bad is None
    assert "Forbidden parameter" in err_bad

    # Unregistered tool
    resp_unreg, _, err_unreg = harness.dispatch("non_existent_tool", {})
    assert resp_unreg is None
    assert "Unregistered tool" in err_unreg


def test_replay_runner_unpatched_vs_patched():
    trace_path = FIXTURES_DIR / "trace_01_tool_hallucination.json"
    trace = TraceIngestor.load_trace_file(trace_path)
    fixture = TraceIngestor.generate_eval_fixture(trace)

    # 1. Unpatched run -> should fail regression assertions
    runner = ReplayRunner(fixture)
    unpatched_res = runner.run(prompt_patch=None)
    assert unpatched_res.passed is False

    diff_unpatched = DiffEngine.compute_diff(fixture, unpatched_res)
    assert diff_unpatched.regression_resolved is False

    # 2. Patched run -> should pass assertions and resolve regression
    patched_prompt = (
        fixture.input.system_prompt
        + "\n\nCRITICAL: Do NOT pass currency_format to process_stripe_refund. Only pass charge_id, amount_cents, reason."
    )
    patched_res = runner.run(prompt_patch=patched_prompt)
    assert patched_res.passed is True

    diff_patched = DiffEngine.compute_diff(fixture, patched_res)
    assert diff_patched.regression_resolved is True
    assert diff_patched.assertion_summary["failed"] == 0


def test_cost_calculation():
    cost_gpt4o = calculate_cost("gpt-4o", 1000, 500)
    # 1000 * 2.50 / 1M = 0.0025, 500 * 10 / 1M = 0.005 => 0.0075
    assert cost_gpt4o == 0.0075

    cost_mini = calculate_cost("gpt-4o-mini", 1000, 500)
    assert cost_mini < cost_gpt4o


def test_markdown_pr_comment_generation():
    trace_path = FIXTURES_DIR / "trace_01_tool_hallucination.json"
    trace = TraceIngestor.load_trace_file(trace_path)
    fixture = TraceIngestor.generate_eval_fixture(trace)

    runner = ReplayRunner(fixture)
    patched_prompt = fixture.input.system_prompt + "\n\nFix currency_format schema constraint."
    res = runner.run(prompt_patch=patched_prompt)
    diff = DiffEngine.compute_diff(fixture, res)

    md = MarkdownReporter.generate_pr_comment([diff])
    assert "Lemma CI Regression Guard Report" in md
    assert "RESOLVED" in md
    assert "process_stripe_refund" in md
