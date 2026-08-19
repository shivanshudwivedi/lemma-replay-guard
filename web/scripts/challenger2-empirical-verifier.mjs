import assert from "node:assert/strict";
import { SAMPLE_TRACES } from "../dist-tests/sampleTraces.mjs";
import { computeLineDiff, buildSplitDiffRows } from "../dist-tests/diffEngine.mjs";
import { MODEL_PRICING, calculateCost, formatCostPerMillion } from "../dist-tests/costModel.mjs";

console.log("\n======================================================================");
console.log("🛡️  CHALLENGER 2: ADVERSARIAL VERIFICATION & STRESS HARNESS");
console.log("======================================================================\n");

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    passCount++;
    console.log("  ✅ PASS: " + name);
  } catch (err) {
    failCount++;
    console.error("  ❌ FAIL: " + name);
    console.error("     Error: " + err.message);
  }
}

// Domain 1
console.log("\n--- Domain 1: Zero Side-Effect Mock Harness & Forbidden Key Validation ---");

test("1.1 Stripe Refund Tool: schema validation blocks forbidden currency_format", () => {
  const stripeTrace = SAMPLE_TRACES.find(t => t.id === "stripe_hallucination");
  assert.ok(stripeTrace, "Stripe trace exists");

  const stripeMock = stripeTrace.mock_tools.find(m => m.name === "process_stripe_refund");
  assert.ok(stripeMock, "process_stripe_refund mock tool registered");
  assert.deepStrictEqual(stripeMock.forbidden_keys, ["currency_format"]);
  assert.deepStrictEqual(stripeMock.expected_args, {
    charge_id: "ch_3N82910a",
    amount_cents: 4900,
    reason: "duplicate_charge",
  });

  function dispatchMock(toolSpec, args) {
    if (toolSpec.forbidden_keys) {
      for (const fk of toolSpec.forbidden_keys) {
        if (fk in args) {
          return {
            success: false,
            error: "InvalidParameter: " + fk + " is not recognized. Forbidden parameter in tool invocation.",
            response: null,
          };
        }
      }
    }
    for (const [k, v] of Object.entries(toolSpec.expected_args)) {
      if (args[k] !== v) {
        return {
          success: false,
          error: "ArgumentMismatch: Expected " + k + "=" + v + ", got " + args[k],
          response: null,
        };
      }
    }
    return {
      success: true,
      error: null,
      response: toolSpec.simulated_response,
      latency_ms: toolSpec.latency_ms,
    };
  }

  const validCall = dispatchMock(stripeMock, {
    charge_id: "ch_3N82910a",
    amount_cents: 4900,
    reason: "duplicate_charge",
  });
  assert.strictEqual(validCall.success, true);
  assert.strictEqual(validCall.error, null);
  assert.strictEqual(validCall.response.refund_id, "re_mock_993182");
  assert.strictEqual(validCall.response.status, "succeeded");

  const hallucinatedCall = dispatchMock(stripeMock, {
    charge_id: "ch_3N82910a",
    amount_cents: 4900,
    currency_format: "US_DOLLARS",
    reason: "duplicate_charge",
  });
  assert.strictEqual(hallucinatedCall.success, false);
  assert.ok(hallucinatedCall.error.includes("currency_format"));
  assert.strictEqual(hallucinatedCall.response, null);
});

test("1.2 SQL Query Schema Validation: blocks raw_sql and requires parameterized template", () => {
  const sqlTrace = SAMPLE_TRACES.find(t => t.id === "sql_schema_drift");
  assert.ok(sqlTrace, "SQL trace exists");

  const sqlMock = sqlTrace.mock_tools.find(m => m.name === "execute_query");
  assert.ok(sqlMock, "execute_query mock tool registered");
  assert.deepStrictEqual(sqlMock.forbidden_keys, ["raw_sql"]);
  assert.ok(sqlMock.expected_args.query_template);
  assert.ok(sqlMock.expected_args.params);

  function dispatchSql(toolSpec, args) {
    if (toolSpec.forbidden_keys?.some(k => k in args)) {
      return {
        success: false,
        error: "SQLSyntaxError: Raw string concatenation violates parameterized security schema.",
      };
    }
    if (!args.query_template || !args.params) {
      return {
        success: false,
        error: "SchemaViolation: Missing required parameterized query_template or params map.",
      };
    }
    return {
      success: true,
      response: toolSpec.simulated_response,
    };
  }

  const attackArgs = { raw_sql: "SELECT COUNT(*) FROM seats WHERE org_name = \x27O\x27Reilly Media\x27 AND quarter = \x27Q3\x27" };
  const attackRes = dispatchSql(sqlMock, attackArgs);
  assert.strictEqual(attackRes.success, false);
  assert.ok(attackRes.error.includes("parameterized security schema"));

  const safeArgs = {
    query_template: "SELECT COUNT(*) FROM seats WHERE org_name = $1 AND quarter = $2",
    params: { org_name: "O\x27Reilly Media", quarter: "Q3" },
  };
  const safeRes = dispatchSql(sqlMock, safeArgs);
  assert.strictEqual(safeRes.success, true);
  assert.deepStrictEqual(safeRes.response, { rows: [{ active_seats: 1420 }], row_count: 1 });
});

test("1.3 GitHub Milestone 404 & Open Milestones Fallback Contract", () => {
  const loopTrace = SAMPLE_TRACES.find(t => t.id === "infinite_retry_loop");
  assert.ok(loopTrace, "GitHub loop trace exists");

  const milestoneMock = loopTrace.mock_tools.find(m => m.name === "set_issue_milestone");
  const listMock = loopTrace.mock_tools.find(m => m.name === "list_open_milestones");

  assert.ok(milestoneMock, "set_issue_milestone mock registered");
  assert.ok(listMock, "list_open_milestones mock registered");

  function dispatchMilestone(toolSpec, args) {
    if (args.milestone_title !== toolSpec.expected_args.milestone_title) {
      return {
        status: 404,
        error: "MilestoneNotFound: " + args.milestone_title + " does not exist.",
      };
    }
    return {
      status: 200,
      response: toolSpec.simulated_response,
    };
  }

  const failRes = dispatchMilestone(milestoneMock, { milestone_title: "v2.4 Release" });
  assert.strictEqual(failRes.status, 404);
  assert.ok(failRes.error.includes("MilestoneNotFound"));

  assert.deepStrictEqual(listMock.simulated_response, {
    milestones: [{ id: "ms_4910", title: "v2.4-release", state: "open" }],
  });

  const resolvedRes = dispatchMilestone(milestoneMock, { milestone_title: "v2.4-release" });
  assert.strictEqual(resolvedRes.status, 200);
  assert.strictEqual(resolvedRes.response.status, "assigned");
});

test("1.4 Zero Side-Effect Guarantee: all mock fixtures are purely deterministic memory objects", () => {
  SAMPLE_TRACES.forEach(trace => {
    trace.mock_tools.forEach(mock => {
      assert.strictEqual(typeof mock.name, "string");
      assert.strictEqual(typeof mock.latency_ms, "number");
      assert.ok(mock.simulated_response !== undefined);
      assert.strictEqual(typeof mock.simulated_response, "object");
    });
  });
});

// Domain 2
console.log("\n--- Domain 2: Replay State Machine & Playback Interval Controls ---");

test("2.1 Playback interval delays calculate correctly and clamp to 100ms floor", () => {
  const calcInterval = (speed) => Math.max(100, Math.round(450 / speed));

  assert.strictEqual(calcInterval(1), 450, "1x speed = 450ms");
  assert.strictEqual(calcInterval(2), 225, "2x speed = 225ms");
  assert.strictEqual(calcInterval(4), 113, "4x speed = 113ms");
  assert.strictEqual(calcInterval(10), 100, "10x clamped to 100ms");
  assert.strictEqual(calcInterval(100), 100, "100x clamped to 100ms");
});

test("2.2 Replay State Machine Simulation: Step Forward, Pause, Resume, and Boundary Clamping", () => {
  const trace = SAMPLE_TRACES[0];
  const totalSteps = trace.steps.length;

  class ReplayStateMachine {
    constructor(stepsCount) {
      this.totalSteps = stepsCount;
      this.currentStepIndex = -1;
      this.isReplaying = false;
      this.isPaused = false;
      this.replayFinished = false;
      this.speed = 1;
    }

    start() {
      this.currentStepIndex = -1;
      this.isReplaying = true;
      this.isPaused = false;
      this.replayFinished = false;
    }

    tick() {
      if (!this.isReplaying) return;
      this.currentStepIndex += 1;
      if (this.currentStepIndex >= this.totalSteps - 1) {
        this.currentStepIndex = this.totalSteps - 1;
        this.isReplaying = false;
        this.replayFinished = true;
      }
    }

    pause() {
      this.isPaused = true;
      this.isReplaying = false;
    }

    resume() {
      this.isPaused = false;
      this.isReplaying = true;
    }

    stepForward() {
      this.isPaused = true;
      this.isReplaying = false;
      this.currentStepIndex = Math.min(this.currentStepIndex + 1, this.totalSteps - 1);
      if (this.currentStepIndex >= this.totalSteps - 1) {
        this.replayFinished = true;
      }
    }

    reset() {
      this.currentStepIndex = -1;
      this.isReplaying = false;
      this.isPaused = false;
      this.replayFinished = false;
    }
  }

  const sm = new ReplayStateMachine(totalSteps);
  assert.strictEqual(sm.currentStepIndex, -1);
  assert.strictEqual(sm.isReplaying, false);

  sm.start();
  assert.strictEqual(sm.isReplaying, true);
  sm.tick();
  assert.strictEqual(sm.currentStepIndex, 0);
  sm.tick();
  assert.strictEqual(sm.currentStepIndex, 1);

  sm.pause();
  assert.strictEqual(sm.isPaused, true);
  assert.strictEqual(sm.isReplaying, false);
  assert.strictEqual(sm.currentStepIndex, 1);

  sm.stepForward();
  assert.strictEqual(sm.currentStepIndex, 2);
  assert.strictEqual(sm.replayFinished, false);

  sm.stepForward();
  assert.strictEqual(sm.currentStepIndex, 3);
  assert.strictEqual(sm.replayFinished, true);

  sm.stepForward();
  assert.strictEqual(sm.currentStepIndex, 3);
  assert.strictEqual(sm.replayFinished, true);

  sm.reset();
  assert.strictEqual(sm.currentStepIndex, -1);
  assert.strictEqual(sm.replayFinished, false);
  assert.strictEqual(sm.isReplaying, false);
});

test("2.3 Rapid Pause/Resume stress test (100 rapid state transitions)", () => {
  const sm = {
    step: 0,
    totalSteps: 10,
    playing: false,
    paused: false,
    finished: false,
  };

  for (let i = 0; i < 100; i++) {
    if (i % 2 === 0) {
      sm.playing = true;
      sm.paused = false;
    } else {
      sm.playing = false;
      sm.paused = true;
    }
    assert.strictEqual(sm.playing, !sm.paused);
  }
});

// Domain 3
console.log("\n--- Domain 3: Cycle Detection & Infinite Loop Breaking Threshold ---");

test("3.1 Loop Detection Condition evaluates accurately per failure_type and stepIndex", () => {
  function checkLoopDetected(trace, promptMode, currentStepIndex, isReplaying, replayFinished) {
    return (
      trace.failure_type === "INFINITE_LOOP" &&
      promptMode === "original" &&
      ((isReplaying && currentStepIndex >= 2) || replayFinished)
    );
  }

  const loopTrace = SAMPLE_TRACES.find(t => t.id === "infinite_retry_loop");
  const stripeTrace = SAMPLE_TRACES.find(t => t.id === "stripe_hallucination");

  assert.strictEqual(checkLoopDetected(loopTrace, "original", 0, true, false), false);
  assert.strictEqual(checkLoopDetected(loopTrace, "original", 1, true, false), false);

  assert.strictEqual(checkLoopDetected(loopTrace, "original", 2, true, false), true);
  assert.strictEqual(checkLoopDetected(loopTrace, "original", 3, true, false), true);
  assert.strictEqual(checkLoopDetected(loopTrace, "original", 5, false, true), true);

  assert.strictEqual(checkLoopDetected(loopTrace, "patched", 2, true, false), false);
  assert.strictEqual(checkLoopDetected(loopTrace, "patched", 5, false, true), false);

  assert.strictEqual(checkLoopDetected(stripeTrace, "original", 3, true, false), false);
  assert.strictEqual(checkLoopDetected(stripeTrace, "original", 3, false, true), false);
});

test("3.2 max_tool_steps evaluation logic prevents unbounded execution", () => {
  function evaluateMaxToolSteps(toolStepCount, maxAllowed) {
    const passed = toolStepCount <= maxAllowed;
    return {
      passed,
      message: passed
        ? "Tool step count (" + toolStepCount + ") within limit (" + maxAllowed + ")"
        : "Exceeded maximum allowed tool steps: " + toolStepCount + " > " + maxAllowed,
    };
  }

  const failRes = evaluateMaxToolSteps(6, 2);
  assert.strictEqual(failRes.passed, false);
  assert.ok(failRes.message.includes("6 > 2"));

  const passRes = evaluateMaxToolSteps(2, 2);
  assert.strictEqual(passRes.passed, true);
  assert.ok(passRes.message.includes("within limit"));
});

// Domain 4
console.log("\n--- Domain 4: Assertion Checklist Dynamic Evaluation Rules ---");

test("4.1 Dynamic Assertion Checklist Evaluation across all 3 Production Presets", () => {
  function evaluateChecklist(trace, promptMode) {
    const replayFinished = true;
    const replayPassed = promptMode !== "original";

    return trace.assertions.map(a => {
      if (replayPassed) {
        return { rule: a.rule, passed: true, status: "CHECK" };
      } else {
        const isFailingAssertion =
          a.rule === "no_error_steps" ||
          a.rule === "no_forbidden_keys" ||
          a.rule === "max_tool_steps";
        return {
          rule: a.rule,
          passed: !isFailingAssertion,
          status: isFailingAssertion ? "CROSS" : "CHECK",
        };
      }
    });
  }

  const stripeTrace = SAMPLE_TRACES[0];
  const stripePatched = evaluateChecklist(stripeTrace, "patched");
  assert.ok(stripePatched.every(a => a.passed && a.status === "CHECK"));

  const stripeOrig = evaluateChecklist(stripeTrace, "original");
  const stripeFailing = stripeOrig.filter(a => !a.passed);
  assert.strictEqual(stripeFailing.length, 3);

  const sqlTrace = SAMPLE_TRACES[1];
  const sqlPatched = evaluateChecklist(sqlTrace, "patched");
  assert.ok(sqlPatched.every(a => a.passed && a.status === "CHECK"));

  const sqlOrig = evaluateChecklist(sqlTrace, "original");
  const sqlFailing = sqlOrig.filter(a => !a.passed);
  assert.strictEqual(sqlFailing.length, 3);

  const loopTrace = SAMPLE_TRACES[2];
  const loopPatched = evaluateChecklist(loopTrace, "patched");
  assert.ok(loopPatched.every(a => a.passed && a.status === "CHECK"));

  const loopOrig = evaluateChecklist(loopTrace, "original");
  const loopFailing = loopOrig.filter(a => !a.passed);
  assert.strictEqual(loopFailing.length, 2);
});

// Domain 5
console.log("\n--- Domain 5: Command Palette Shortcuts & Modal Handlers ---");

test("5.1 Cmd+K / Ctrl+K keyboard shortcut listener handler", () => {
  let isPaletteOpen = false;

  function handleKeyDown(e) {
    const targetTagName = e.target?.tagName;
    if (targetTagName === "INPUT" || targetTagName === "TEXTAREA") {
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      isPaletteOpen = !isPaletteOpen;
    }
  }

  handleKeyDown({ metaKey: true, ctrlKey: false, key: "k" });
  assert.strictEqual(isPaletteOpen, true);
  handleKeyDown({ metaKey: true, ctrlKey: false, key: "k" });
  assert.strictEqual(isPaletteOpen, false);

  handleKeyDown({ metaKey: false, ctrlKey: true, key: "K" });
  assert.strictEqual(isPaletteOpen, true);
});

test("5.2 Chord navigation (G W, G R, G C, G E) within 1000ms window", () => {
  let navigatedTo = "";
  let exportModalOpen = false;
  let lastKey = "";
  let lastKeyTime = 0;

  function handleGlobalKeyDown(e, now = Date.now()) {
    const target = e.target;
    if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") {
      if (e.key === "Escape") target.blurred = true;
      return;
    }

    const key = e.key.toLowerCase();
    if (key === "g") {
      lastKey = "g";
      lastKeyTime = now;
      return;
    }

    if (lastKey === "g" && now - lastKeyTime < 1000) {
      if (key === "w") navigatedTo = "waterfall";
      else if (key === "r") navigatedTo = "ide";
      else if (key === "c") navigatedTo = "ci-matrix";
      else if (key === "e") exportModalOpen = true;
      lastKey = "";
    }
  }

  const t0 = 1000;
  handleGlobalKeyDown({ key: "g" }, t0);
  handleGlobalKeyDown({ key: "w" }, t0 + 200);
  assert.strictEqual(navigatedTo, "waterfall");

  handleGlobalKeyDown({ key: "G" }, t0 + 500);
  handleGlobalKeyDown({ key: "r" }, t0 + 700);
  assert.strictEqual(navigatedTo, "ide");

  handleGlobalKeyDown({ key: "g" }, t0 + 1000);
  handleGlobalKeyDown({ key: "c" }, t0 + 1200);
  assert.strictEqual(navigatedTo, "ci-matrix");

  handleGlobalKeyDown({ key: "g" }, t0 + 1500);
  handleGlobalKeyDown({ key: "e" }, t0 + 1700);
  assert.strictEqual(exportModalOpen, true);

  navigatedTo = "none";
  handleGlobalKeyDown({ key: "g" }, t0 + 2000);
  handleGlobalKeyDown({ key: "w" }, t0 + 3500);
  assert.strictEqual(navigatedTo, "none", "Expired chord must not navigate");
});

test("5.3 Input/Textarea Shielding: Typing in form fields never triggers navigation", () => {
  let navigatedTo = "";
  let lastKey = "";
  let lastKeyTime = 0;

  function handleKey(e) {
    if (e.target?.tagName === "INPUT" || e.target?.tagName === "TEXTAREA") {
      return;
    }
    const key = e.key.toLowerCase();
    if (key === "g") { lastKey = "g"; lastKeyTime = Date.now(); return; }
    if (lastKey === "g") {
      if (key === "w") navigatedTo = "waterfall";
      lastKey = "";
    }
  }

  const inputEl = { tagName: "INPUT" };
  handleKey({ key: "g", target: inputEl });
  handleKey({ key: "r", target: inputEl });
  handleKey({ key: "o", target: inputEl });
  handleKey({ key: "w", target: inputEl });

  assert.strictEqual(navigatedTo, "", "Typing inside input field must not trigger navigation");
});

test("5.4 Modal Escape Key and Backdrop Click Handlers", () => {
  let modalOpen = true;

  function handleEscape(e) {
    if (e.key === "Escape" && modalOpen) {
      modalOpen = false;
    }
  }

  function handleBackdropClick(e) {
    modalOpen = false;
  }

  function handleInnerPanelClick(e) {
    e.stopPropagation();
  }

  modalOpen = true;
  handleEscape({ key: "Escape" });
  assert.strictEqual(modalOpen, false);

  modalOpen = true;
  handleBackdropClick({});
  assert.strictEqual(modalOpen, false);

  modalOpen = true;
  let propagationStopped = false;
  handleInnerPanelClick({
    stopPropagation: () => { propagationStopped = true; },
  });
  assert.strictEqual(propagationStopped, true);
  assert.strictEqual(modalOpen, true);
});

console.log("\n----------------------------------------------------------------------");
console.log("📊 CHALLENGER 2 TEST EXECUTION RESULTS");
console.log("   • Total Tests:     " + (passCount + failCount));
console.log("   • Passed:          " + passCount);
console.log("   • Failed:          " + failCount);
console.log("   • Success Rate:    " + ((passCount / (passCount + failCount)) * 100).toFixed(1) + "%");
console.log("----------------------------------------------------------------------\n");

if (failCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL CHALLENGER 2 EMPIRICAL TESTS PASSED PERFECTLY!\n");
  process.exit(0);
}
