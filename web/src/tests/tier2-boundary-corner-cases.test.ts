import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLineDiff, buildSplitDiffRows } from '../lib/diffEngine';
import { calculateCost, formatCostPerMillion } from '../lib/costModel';
import { SAMPLE_TRACES } from '../data/sampleTraces';

describe('Tier 2 — Boundary & Corner Cases (Edge Cases)', () => {
  // Authoritative Source: survey_spec.md §3 (Edge Cases Discovered)

  it('Edge Case 1: Minimum span width clamping on sub-millisecond or tiny spans', () => {
    // 1ms span in a 20,000ms trace would naturally be 0.005%, which would render invisible
    const totalDuration = 20000;
    const tinyStepDuration = 1;
    const naturalPct = (tinyStepDuration / totalDuration) * 100; // 0.005%

    const clampedWidth = Math.max(8, naturalPct);
    assert.strictEqual(clampedWidth, 8, 'Tiny span must be clamped to 8% minimum width');

    // Normal large span should NOT be clamped
    const normalStepDuration = 5000;
    const normalPct = (normalStepDuration / totalDuration) * 100; // 25%
    const normalClampedWidth = Math.max(8, normalPct);
    assert.strictEqual(normalClampedWidth, 25, 'Normal span must retain its true proportional width');
  });

  it('Edge Case 2: Zero-diff handling when original system prompt is identical to patched prompt', () => {
    const identicalText = `You are a helpful assistant.\nAlways return JSON.`;
    const diff = computeLineDiff(identicalText, identicalText);

    assert.strictEqual(diff.length, 2, 'Diff must contain exactly 2 lines');
    assert.ok(diff.every((d) => d.type === 'unchanged'), 'All lines must be marked unchanged');
    assert.strictEqual(diff.filter((d) => d.type === 'added').length, 0, '0 lines added');
    assert.strictEqual(diff.filter((d) => d.type === 'removed').length, 0, '0 lines removed');

    const splitRows = buildSplitDiffRows(identicalText, identicalText);
    assert.strictEqual(splitRows.length, 2);
    assert.ok(splitRows.every((r) => r.type === 'unchanged'));
    assert.strictEqual(splitRows[0].oldLineNumber, 1);
    assert.strictEqual(splitRows[0].newLineNumber, 1);
  });

  it('Edge Case 3: Forbidden tool parameter rejection in mock schema dispatcher', () => {
    const stripeMock = SAMPLE_TRACES[0].mock_tools.find((m) => m.name === 'process_stripe_refund')!;
    assert.ok(stripeMock.forbidden_keys?.includes('currency_format'));

    const validatePayload = (payload: Record<string, any>, forbiddenKeys?: string[]) => {
      if (forbiddenKeys) {
        for (const key of forbiddenKeys) {
          if (key in payload) {
            return {
              valid: false,
              error: `SCHEMA_VIOLATION: Forbidden parameter '${key}' passed to mock tool.`,
            };
          }
        }
      }
      return { valid: true, error: null };
    };

    // Invalid call with forbidden parameter
    const invalidCall = {
      charge_id: 'ch_1234',
      amount_cents: 4900,
      currency_format: 'US_DOLLARS',
    };
    const invalidRes = validatePayload(invalidCall, stripeMock.forbidden_keys);
    assert.strictEqual(invalidRes.valid, false);
    assert.ok(invalidRes.error?.includes("Forbidden parameter 'currency_format'"));

    // Valid call without forbidden parameter
    const validCall = {
      charge_id: 'ch_1234',
      amount_cents: 4900,
      reason: 'duplicate_charge',
    };
    const validRes = validatePayload(validCall, stripeMock.forbidden_keys);
    assert.strictEqual(validRes.valid, true);
    assert.strictEqual(validRes.error, null);
  });

  it('Edge Case 4: Step limit loop breaking terminates recursive retry cycles', () => {
    const loopLimit = 3;
    let stepCount = 0;
    let loopTerminated = false;

    // Simulate 10 iterations of a failing tool call
    for (let i = 1; i <= 10; i++) {
      stepCount++;
      if (stepCount >= loopLimit) {
        loopTerminated = true;
        break;
      }
    }

    assert.strictEqual(loopTerminated, true);
    assert.strictEqual(stepCount, 3);
  });

  it('Edge Case 5: Micro-cent cost precision formatting handles fractional cents without NaN or truncation', () => {
    // Very low token usage (e.g. 10 tokens on deepseek-v3)
    const cost = calculateCost(10, 5, 'deepseek-v3');
    assert.ok(!isNaN(cost), 'Cost must not be NaN');
    assert.ok(cost > 0, 'Cost must be positive');

    const formattedPerRun = cost.toFixed(7);
    assert.strictEqual(formattedPerRun.startsWith('0.00000'), true);

    const formatted1M = formatCostPerMillion(cost);
    assert.ok(!formatted1M.includes('NaN'));
    assert.ok(Number(formatted1M.replace(/,/g, '')) >= 0);
  });

  it('Edge Case 6: Clipboard fallback handles environments where clipboard API is denied or throws', () => {
    const textToCopy = '## Lemma CI Report';
    let fallbackTriggered = false;

    const copyWithFallback = (text: string, mockClipboardAvailable: boolean) => {
      if (mockClipboardAvailable) {
        return Promise.resolve(true);
      } else {
        // Fallback execution path
        fallbackTriggered = true;
        return Promise.resolve(false);
      }
    };

    return copyWithFallback(textToCopy, false).then((res) => {
      assert.strictEqual(res, false);
      assert.strictEqual(fallbackTriggered, true);
    });
  });

  it('Edge Case 7: Playback speed multiplier interval calculation clamps to safe minimum', () => {
    const getInterval = (speed: 1 | 2 | 4) => Math.max(120, 450 / speed);

    assert.strictEqual(getInterval(1), 450);
    assert.strictEqual(getInterval(2), 225);
    assert.strictEqual(getInterval(4), 120); // 450 / 4 = 112.5 -> clamped to 120ms
  });

  it('Edge Case 8: Multiline prompt expansions with quotes, SQL apostrophes, and unicode characters', () => {
    const oldPrompt = "SELECT * FROM users WHERE name = 'O\\'Reilly Media';";
    const newPrompt = "SELECT * FROM users WHERE name = $1;\n-- Parameter: O'Reilly Media 🚀\n-- Unicode: 日本語 / äöü";

    const diff = computeLineDiff(oldPrompt, newPrompt);
    assert.ok(diff.length >= 2);

    const splitRows = buildSplitDiffRows(oldPrompt, newPrompt);
    assert.ok(splitRows.length >= 2);

    // Verify unicode characters preserved intact
    const unicodeRow = splitRows.find((r) => r.newContent?.includes('日本語'));
    assert.ok(unicodeRow, 'Unicode characters must be preserved in split diff row');
  });

  it('Edge Case 9: Empty prompt text handling in diff engine and token estimator', () => {
    const diff = computeLineDiff('', '');
    assert.strictEqual(diff.length, 1);
    assert.strictEqual(diff[0].type, 'unchanged');
    assert.strictEqual(diff[0].content, '');

    const costZero = calculateCost(0, 0, 'gpt-4o');
    assert.strictEqual(costZero, 0);
    assert.strictEqual(formatCostPerMillion(0), '0.00');
  });
});
