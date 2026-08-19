"""
Markdown Reporter: Generates GitHub PR Comment / GitHub Actions Step Summary markdown.
"""

from __future__ import annotations
from typing import List
from ..schema import DiffReport


class MarkdownReporter:
    """
    Renders GitHub PR markdown comments.
    """

    @classmethod
    def generate_pr_comment(cls, reports: List[DiffReport]) -> str:
        total = len(reports)
        resolved = sum(1 for r in reports if r.regression_resolved)
        failed = total - resolved

        status_emoji = "🟢" if failed == 0 else "🔴"
        status_text = "All Regressions Resolved" if failed == 0 else f"{failed}/{total} Regressions Active"

        lines = [
            f"## {status_emoji} Lemma CI Regression Guard Report",
            f"> **Summary:** {status_text} across `{total}` eval fixture(s).",
            "",
            "### 📊 Regression Diff Matrix",
            "",
            "| Eval ID | Status | Δ Latency | Δ Tokens | Δ Cost / Run | Assertion Pass Rate |",
            "|---|:---:|:---:|:---:|:---:|:---:|",
        ]

        for r in reports:
            badge = "✅ `RESOLVED`" if r.regression_resolved else "❌ `FAILED`"
            lat_delta = f"{r.delta_latency_ms:+d}ms ({r.delta_latency_pct:+.1f}%)"
            tok_delta = f"{r.delta_tokens:+d} ({r.delta_tokens_pct:+.1f}%)"
            cost_delta = f"${r.delta_cost_usd:+.5f}"
            pass_rate = f"{r.assertion_summary['passed']}/{r.assertion_summary['total']}"
            lines.append(f"| `{r.eval_id}` | {badge} | `{lat_delta}` | `{tok_delta}` | `{cost_delta}` | `{pass_rate}` |")

        lines.extend([
            "",
            "### 🔍 Detailed Assertion Breakdown",
            "",
        ])

        for r in reports:
            lines.append(f"<details><summary><b>{r.eval_id}</b> (Source Trace: <code>{r.source_trace_id}</code>)</summary>")
            lines.append("")
            lines.append("| Assertion | Result | Details |")
            lines.append("|---|:---:|---|")
            for a in r.assertions:
                icon = "✅" if a.passed else "❌"
                desc = a.assertion.description or f"{a.assertion.type.value}"
                lines.append(f"| {desc} | {icon} | {a.message} |")
            lines.append("</details>")
            lines.append("")

        lines.extend([
            "---",
            "*Report generated automatically by [Lemma CI Regression Guard](https://lemma.ai) • Deterministic Mock Execution Sandbox*",
        ])

        return "\n".join(lines)
