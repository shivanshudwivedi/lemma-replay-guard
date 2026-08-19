"""
Differential Analysis Engine: Computes performance, correctness, and cost deltas
between production failure baselines and replay execution runs.
"""

from __future__ import annotations
from typing import Any, Dict, List
from .schema import (
    DiffReport,
    EvalFixture,
    ReplayExecutionResult,
)


class DiffEngine:
    """
    Computes comparative diffs for CI and PR reports.
    """

    @classmethod
    def compute_diff(
        cls,
        fixture: EvalFixture,
        replay_result: ReplayExecutionResult,
    ) -> DiffReport:
        base = fixture.baseline
        
        orig_lat = base.total_latency_ms
        rep_lat = replay_result.total_latency_ms
        delta_lat = rep_lat - orig_lat
        delta_lat_pct = round((delta_lat / orig_lat * 100), 2) if orig_lat else 0.0

        orig_tok = base.total_tokens
        rep_tok = replay_result.total_tokens.total_tokens
        delta_tok = rep_tok - orig_tok
        delta_tok_pct = round((delta_tok / orig_tok * 100), 2) if orig_tok else 0.0

        orig_cost = base.cost_usd
        rep_cost = replay_result.cost_usd
        delta_cost = round(rep_cost - orig_cost, 6)

        passed_count = sum(1 for a in replay_result.assertion_results if a.passed)
        total_count = len(replay_result.assertion_results)
        failed_count = total_count - passed_count

        resolved = (base.status.upper() in ["FAILED", "FAILURE", "ERROR"] and replay_result.passed)

        # Generate step diffs
        step_diffs = []
        for s in replay_result.steps:
            step_diffs.append({
                "step_index": s.step_index,
                "type": s.type.value if hasattr(s.type, "value") else str(s.type),
                "tool_name": s.tool_name,
                "status": "ERROR" if s.error else "SUCCESS",
                "latency_ms": s.latency_ms,
                "tokens": s.tokens.total_tokens,
                "mocked": s.mocked,
            })

        return DiffReport(
            eval_id=fixture.eval_id,
            source_trace_id=fixture.source_trace_id,
            orig_status=base.status,
            replay_status="PASSED" if replay_result.passed else "FAILED",
            regression_resolved=resolved,
            orig_latency_ms=orig_lat,
            replay_latency_ms=rep_lat,
            delta_latency_ms=delta_lat,
            delta_latency_pct=delta_lat_pct,
            orig_tokens=orig_tok,
            replay_tokens=rep_tok,
            delta_tokens=delta_tok,
            delta_tokens_pct=delta_tok_pct,
            orig_cost_usd=orig_cost,
            replay_cost_usd=rep_cost,
            delta_cost_usd=delta_cost,
            model_orig=base.model,
            model_replay=replay_result.model,
            assertion_summary={
                "total": total_count,
                "passed": passed_count,
                "failed": failed_count,
            },
            assertions=replay_result.assertion_results,
            step_diffs=step_diffs,
        )
