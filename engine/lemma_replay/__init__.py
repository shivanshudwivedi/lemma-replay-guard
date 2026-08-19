"""
Lemma Replay & CI Regression Guard (`trace2test`)
Closing the loop from production agent telemetry to deterministic CI regression testing.
"""

from .schema import (
    LemmaTrace,
    TraceStep,
    EvalFixture,
    MockToolSpec,
    MockHarnessSpec,
    AssertionSpec,
    AssertionType,
    ReplayExecutionResult,
    DiffReport,
)
from .ingestor import TraceIngestor
from .mock_harness import MockHarness
from .replay_runner import ReplayRunner
from .diff_engine import DiffEngine
from .reporters import RichReporter, MarkdownReporter

__version__ = "0.1.0"
__all__ = [
    "LemmaTrace",
    "TraceStep",
    "EvalFixture",
    "MockToolSpec",
    "MockHarnessSpec",
    "AssertionSpec",
    "AssertionType",
    "ReplayExecutionResult",
    "DiffReport",
    "TraceIngestor",
    "MockHarness",
    "ReplayRunner",
    "DiffEngine",
    "RichReporter",
    "MarkdownReporter",
]
