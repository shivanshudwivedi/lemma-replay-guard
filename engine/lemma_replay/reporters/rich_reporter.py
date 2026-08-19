"""
Rich Terminal Reporter: Emits high-impact CLI tables, status badges, and diffs.
"""

from __future__ import annotations
from typing import List
from ..schema import DiffReport


class RichReporter:
    """
    Renders interactive terminal summaries using Rich.
    """

    @classmethod
    def print_diff_report(cls, report: DiffReport) -> None:
        try:
            from rich.console import Console
            from rich.table import Table
            from rich.panel import Panel
            from rich.text import Text
            
            console = Console()

            # Status Header
            if report.regression_resolved:
                header = Panel(
                    f"[bold green]✔ REGRESSION RESOLVED[/bold green] - Eval: [cyan]{report.eval_id}[/cyan]\n"
                    f"Production Trace: [dim]{report.source_trace_id}[/dim]",
                    title="[bold blue]Lemma CI Regression Guard[/bold blue]",
                    border_style="green",
                )
            else:
                header = Panel(
                    f"[bold red]✘ REGRESSION STILL ACTIVE[/bold red] - Eval: [cyan]{report.eval_id}[/cyan]\n"
                    f"Production Trace: [dim]{report.source_trace_id}[/dim]",
                    title="[bold blue]Lemma CI Regression Guard[/bold blue]",
                    border_style="red",
                )
            console.print(header)

            # Metrics Table
            table = Table(title="Execution & Performance Diff Matrix", show_header=True, header_style="bold magenta")
            table.add_column("Metric", style="cyan")
            table.add_column("Baseline (Prod Failure)", style="dim")
            table.add_column("Replay Run (Patched)", style="bold")
            table.add_column("Delta (Δ)", justify="right")

            # Status
            table.add_row(
                "Status",
                f"[red]{report.orig_status}[/red]",
                f"[green]{report.replay_status}[/green]" if report.replay_status == "PASSED" else f"[red]{report.replay_status}[/red]",
                "[green]RESOLVED[/green]" if report.regression_resolved else "[red]FAILED[/red]",
            )

            # Latency
            lat_color = "green" if report.delta_latency_ms <= 0 else "yellow"
            table.add_row(
                "Latency",
                f"{report.orig_latency_ms} ms",
                f"{report.replay_latency_ms} ms",
                f"[{lat_color}]{report.delta_latency_ms:+d} ms ({report.delta_latency_pct:+.1f}%)[/{lat_color}]",
            )

            # Tokens
            tok_color = "green" if report.delta_tokens <= 0 else "yellow"
            table.add_row(
                "Total Tokens",
                f"{report.orig_tokens}",
                f"{report.replay_tokens}",
                f"[{tok_color}]{report.delta_tokens:+d} ({report.delta_tokens_pct:+.1f}%)[/{tok_color}]",
            )

            # Cost
            cost_color = "green" if report.delta_cost_usd <= 0 else "yellow"
            table.add_row(
                "Est. Cost / Run",
                f"${report.orig_cost_usd:.5f}",
                f"${report.replay_cost_usd:.5f}",
                f"[{cost_color}]${report.delta_cost_usd:+.5f}[/{cost_color}]",
            )

            console.print(table)

            # Assertions breakdown
            assert_table = Table(title="Regression Guard Assertions", show_header=True, header_style="bold blue")
            assert_table.add_column("Status", width=8)
            assert_table.add_column("Assertion Rule", style="white")
            assert_table.add_column("Result Details", style="dim")

            for a in report.assertions:
                badge = "[green]✔ PASS[/green]" if a.passed else "[red]✘ FAIL[/red]"
                rule_desc = a.assertion.description or f"{a.assertion.type.value} ({a.assertion.tool_name or ''})"
                assert_table.add_row(badge, rule_desc, a.message)

            console.print(assert_table)
            console.print()

        except ImportError:
            # Fallback plain text output
            print(f"=== Lemma CI Regression Report: {report.eval_id} ===")
            print(f"Status: {'RESOLVED' if report.regression_resolved else 'FAILED'}")
            print(f"Latency: {report.orig_latency_ms}ms -> {report.replay_latency_ms}ms ({report.delta_latency_ms:+d}ms)")
            print(f"Tokens: {report.orig_tokens} -> {report.replay_tokens} ({report.delta_tokens:+d})")
            print(f"Cost: ${report.orig_cost_usd:.5f} -> ${report.replay_cost_usd:.5f}")
            for a in report.assertions:
                print(f"  [{'PASS' if a.passed else 'FAIL'}] {a.assertion.description}: {a.message}")
