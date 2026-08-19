"""
CLI Interface for Lemma Replay Adapter & CI Regression Guard (`lemma-replay` / `trace2test`).
"""

from __future__ import annotations
import json
import sys
from pathlib import Path
from typing import Optional
import click
import yaml

from .schema import EvalFixture, LemmaTrace
from .ingestor import TraceIngestor
from .replay_runner import ReplayRunner
from .diff_engine import DiffEngine
from .reporters import RichReporter, MarkdownReporter


@click.group()
def cli():
    """Lemma Replay & CI Regression Guard (trace2test) - Telemetry to Eval Loop"""
    pass


@cli.command()
@click.argument("trace_path", type=click.Path(exists=True))
@click.option("--output", "-o", default=None, help="Output .lemma.eval.yaml file path")
@click.option("--eval-id", default=None, help="Custom Eval ID identifier")
def ingest(trace_path: str, output: Optional[str], eval_id: Optional[str]):
    """
    Ingests a Lemma production failure trace JSON and converts it to a versioned Eval Fixture.
    """
    click.echo(f"📥 Ingesting production trace from {trace_path}...")
    trace = TraceIngestor.load_trace_file(trace_path)
    fixture = TraceIngestor.generate_eval_fixture(trace, eval_id_override=eval_id)
    
    out_target = output or f"./evals/{fixture.eval_id}.lemma.yaml"
    saved_path = TraceIngestor.export_fixture_yaml(fixture, out_target)
    
    click.echo(f"✅ Generated Eval Fixture: {saved_path}")
    click.echo(f"   Agent ID: {fixture.agent_id}")
    click.echo(f"   Baseline Failure: {fixture.baseline.failure_type}")
    click.echo(f"   Mocks Synthesized: {len(fixture.mock_harness.tools)} tool(s)")
    click.echo(f"   Assertions Generated: {len(fixture.assertions)} rule(s)")


@cli.command()
@click.argument("eval_path", type=click.Path(exists=True))
@click.option("--patch-prompt", "-p", default=None, help="Inline prompt patch or path to prompt text file")
@click.option("--model", "-m", default=None, help="Model override for replay")
@click.option("--reporter", "-r", type=click.Choice(["rich", "markdown", "json"]), default="rich")
@click.option("--out", "-o", default=None, help="Output file for generated report")
def run(eval_path: str, patch_prompt: Optional[str], model: Optional[str], reporter: str, out: Optional[str]):
    """
    Runs deterministic replay for an eval fixture (or directory of fixtures) and validates assertions.
    """
    target = Path(eval_path)
    eval_files = [target] if target.is_file() else list(target.glob("*.yaml")) + list(target.glob("*.json"))

    if not eval_files:
        click.echo(f"❌ No eval fixture files found at {eval_path}", err=True)
        sys.exit(1)

    # Read patch prompt if path provided
    patch_text = patch_prompt
    if patch_prompt and Path(patch_prompt).exists():
        with open(patch_prompt, "r", encoding="utf-8") as f:
            patch_text = f.read()

    reports = []
    has_failure = False

    for ef in eval_files:
        with open(ef, "r", encoding="utf-8") as f:
            content = f.read()
            data = yaml.safe_load(content) if ef.suffix in [".yaml", ".yml"] else json.loads(content)
        
        fixture = EvalFixture.model_validate(data)
        runner = ReplayRunner(fixture)
        replay_res = runner.run(prompt_patch=patch_text, model_override=model)
        diff = DiffEngine.compute_diff(fixture, replay_res)
        reports.append(diff)

        if not diff.regression_resolved:
            has_failure = True

        if reporter == "rich":
            RichReporter.print_diff_report(diff)

    if reporter == "markdown":
        md = MarkdownReporter.generate_pr_comment(reports)
        if out:
            with open(out, "w", encoding="utf-8") as f:
                f.write(md)
            click.echo(f"📝 Markdown report saved to {out}")
        else:
            click.echo(md)

    elif reporter == "json":
        json_dumps = [r.model_dump(mode="json") for r in reports]
        if out:
            with open(out, "w", encoding="utf-8") as f:
                json.dump(json_dumps, f, indent=2)
            click.echo(f"📊 JSON report saved to {out}")
        else:
            click.echo(json.dumps(json_dumps, indent=2))

    if has_failure:
        sys.exit(1)


@cli.command()
def demo():
    """
    Runs a live end-to-end demonstration of the Lemma Replay Guard workflow.
    """
    fixtures_dir = Path(__file__).parent.parent / "fixtures"
    sample_trace = fixtures_dir / "trace_01_tool_hallucination.json"
    
    if not sample_trace.exists():
        click.echo("Demo fixture not found, generating sample trace...")
        from .fixtures_generator import generate_sample_fixtures
        generate_sample_fixtures()

    click.echo("\n" + "="*70)
    click.echo("🎬 STEP 1: Ingesting Production Failure Trace (Stripe Refund Hallucination)")
    click.echo("="*70)
    trace = TraceIngestor.load_trace_file(sample_trace)
    fixture = TraceIngestor.generate_eval_fixture(trace)
    click.echo(f"✓ Parsed Trace: {trace.trace_id} (Failure: {trace.failure_type})")
    click.echo(f"✓ Synthesized {len(fixture.mock_harness.tools)} zero-side-effect mock tool(s)")
    click.echo(f"✓ Formulated {len(fixture.assertions)} regression assertion rules")

    click.echo("\n" + "="*70)
    click.echo("❌ STEP 2: Running Replay with UNPATCHED Prompt (Baseline Regression Check)")
    click.echo("="*70)
    unpatched_runner = ReplayRunner(fixture)
    unpatched_res = unpatched_runner.run(prompt_patch=None)
    unpatched_diff = DiffEngine.compute_diff(fixture, unpatched_res)
    RichReporter.print_diff_report(unpatched_diff)

    click.echo("\n" + "="*70)
    click.echo("✅ STEP 3: Running Replay with PATCHED Prompt (Regression Resolved)")
    click.echo("="*70)
    patched_prompt = (
        fixture.input.system_prompt
        + "\n\nCRITICAL FIX: When calling process_stripe_refund, only provide charge_id, amount_cents, and reason. Do NOT include currency_format."
    )
    patched_runner = ReplayRunner(fixture)
    patched_res = patched_runner.run(prompt_patch=patched_prompt)
    patched_diff = DiffEngine.compute_diff(fixture, patched_res)
    RichReporter.print_diff_report(patched_diff)

    click.echo("\n" + "="*70)
    click.echo("📝 STEP 4: GitHub Actions PR Comment Preview")
    click.echo("="*70)
    pr_comment = MarkdownReporter.generate_pr_comment([patched_diff])
    click.echo(pr_comment)


def main():
    cli()


if __name__ == "__main__":
    main()
