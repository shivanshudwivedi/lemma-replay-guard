import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLineDiff, buildSplitDiffRows, SplitDiffRow } from '../lib/diffEngine';
import { MODEL_PRICING, calculateCost, formatCostPerMillion } from '../lib/costModel';
import { SAMPLE_TRACES } from '../data/sampleTraces';
import { ModelId } from '../types/telemetry';

describe('Tier 5 — Adversarial Challenger: Diff Engine, Math & Boundary Stress Tests', () => {
  // =========================================================================
  // SECTION 1: MYERS / LCS DIFF ENGINE ADVERSARIAL STRESS TESTS
  // =========================================================================

  describe('1. Diff Engine: Edge cases, boundaries, and multiline reconstructions', () => {
    it('1.1 Empty strings on both sides produces 1 unchanged empty line', () => {
      const diff = computeLineDiff('', '');
      assert.strictEqual(diff.length, 1);
      assert.strictEqual(diff[0].type, 'unchanged');
      assert.strictEqual(diff[0].content, '');
      assert.strictEqual(diff[0].oldLineNumber, 1);
      assert.strictEqual(diff[0].newLineNumber, 1);

      const split = buildSplitDiffRows('', '');
      assert.strictEqual(split.length, 1);
      assert.strictEqual(split[0].type, 'unchanged');
      assert.strictEqual(split[0].oldContent, '');
      assert.strictEqual(split[0].newContent, '');
    });

    it('1.2 Empty oldText with non-empty newText produces pure addition', () => {
      const newText = 'Line 1\nLine 2\nLine 3';
      const diff = computeLineDiff('', newText);

      const added = diff.filter((d) => d.type === 'added');
      assert.strictEqual(added.length, 3);
      assert.strictEqual(added[0].content, 'Line 1');
      assert.strictEqual(added[1].content, 'Line 2');
      assert.strictEqual(added[2].content, 'Line 3');

      const split = buildSplitDiffRows('', newText);
      assert.ok(split.length >= 3);
      const addedRows = split.filter((r) => r.type === 'added' || r.type === 'modified');
      assert.ok(addedRows.length >= 3);
    });

    it('1.3 Non-empty oldText with empty newText produces pure removal', () => {
      const oldText = 'Line 1\nLine 2\nLine 3';
      const diff = computeLineDiff(oldText, '');

      const removed = diff.filter((d) => d.type === 'removed');
      assert.strictEqual(removed.length, 3);
      assert.strictEqual(removed[0].content, 'Line 1');
      assert.strictEqual(removed[1].content, 'Line 2');
      assert.strictEqual(removed[2].content, 'Line 3');

      const split = buildSplitDiffRows(oldText, '');
      assert.ok(split.length >= 3);
    });

    it('1.4 Single-character and single-line complete replacement', () => {
      const oldText = 'A';
      const newText = 'B';
      const diff = computeLineDiff(oldText, newText);

      assert.strictEqual(diff.length, 2);
      assert.strictEqual(diff[0].type, 'removed');
      assert.strictEqual(diff[0].content, 'A');
      assert.strictEqual(diff[1].type, 'added');
      assert.strictEqual(diff[1].content, 'B');

      const split = buildSplitDiffRows(oldText, newText);
      assert.strictEqual(split.length, 1);
      assert.strictEqual(split[0].type, 'modified');
      assert.strictEqual(split[0].oldContent, 'A');
      assert.strictEqual(split[0].newContent, 'B');
      assert.strictEqual(split[0].oldLineNumber, 1);
      assert.strictEqual(split[0].newLineNumber, 1);
    });

    it('1.5 100 identical lines produces 100 unchanged lines with exact sequential line numbers', () => {
      const lines = Array.from({ length: 100 }, (_, i) => `System instruction line #${i + 1}: enforce strict typing`);
      const text = lines.join('\n');

      const diff = computeLineDiff(text, text);
      assert.strictEqual(diff.length, 100);
      diff.forEach((d, idx) => {
        assert.strictEqual(d.type, 'unchanged');
        assert.strictEqual(d.content, lines[idx]);
        assert.strictEqual(d.oldLineNumber, idx + 1);
        assert.strictEqual(d.newLineNumber, idx + 1);
      });

      const split = buildSplitDiffRows(text, text);
      assert.strictEqual(split.length, 100);
      split.forEach((r, idx) => {
        assert.strictEqual(r.type, 'unchanged');
        assert.strictEqual(r.oldLineNumber, idx + 1);
        assert.strictEqual(r.newLineNumber, idx + 1);
        assert.strictEqual(r.oldContent, lines[idx]);
        assert.strictEqual(r.newContent, lines[idx]);
      });
    });

    it('1.6 100 completely rewritten lines with zero overlap - LCS diff returns 50 removals followed by 50 additions', () => {
      const oldLines = Array.from({ length: 50 }, (_, i) => `OLD_RULE_${i + 1}`);
      const newLines = Array.from({ length: 50 }, (_, i) => `NEW_RULE_${i + 1}`);

      const diff = computeLineDiff(oldLines.join('\n'), newLines.join('\n'));
      assert.strictEqual(diff.length, 100);
      assert.strictEqual(diff.filter((d) => d.type === 'removed').length, 50);
      assert.strictEqual(diff.filter((d) => d.type === 'added').length, 50);
      assert.strictEqual(diff.filter((d) => d.type === 'unchanged').length, 0);

      const split = buildSplitDiffRows(oldLines.join('\n'), newLines.join('\n'));
      assert.ok(split.length > 0);
      // Verify all lines are accounted for across split rows
      const oldAccounted = split.filter((r) => r.oldContent !== undefined).length;
      const newAccounted = split.filter((r) => r.newContent !== undefined).length;
      assert.strictEqual(oldAccounted, 50);
      assert.strictEqual(newAccounted, 50);
    });

    it('1.7 Interleaved additions, removals, and unchanged anchor lines', () => {
      const oldText = 'Anchor 1\nDel 1\nAnchor 2\nDel 2\nAnchor 3';
      const newText = 'Anchor 1\nAdd 1\nAnchor 2\nAdd 2\nAnchor 3';

      const diff = computeLineDiff(oldText, newText);
      const unchanged = diff.filter((d) => d.type === 'unchanged');
      assert.strictEqual(unchanged.length, 3);
      assert.strictEqual(unchanged[0].content, 'Anchor 1');
      assert.strictEqual(unchanged[1].content, 'Anchor 2');
      assert.strictEqual(unchanged[2].content, 'Anchor 3');

      const split = buildSplitDiffRows(oldText, newText);
      assert.strictEqual(split.length, 5);
      assert.strictEqual(split[0].type, 'unchanged');
      assert.strictEqual(split[1].type, 'modified');
      assert.strictEqual(split[1].oldContent, 'Del 1');
      assert.strictEqual(split[1].newContent, 'Add 1');
      assert.strictEqual(split[2].type, 'unchanged');
      assert.strictEqual(split[3].type, 'modified');
      assert.strictEqual(split[3].oldContent, 'Del 2');
      assert.strictEqual(split[3].newContent, 'Add 2');
      assert.strictEqual(split[4].type, 'unchanged');
    });

    it('1.8 Special characters, unicode, emojis, quotes, backslashes, escape sequences', () => {
      const complexOld = [
        'SELECT * FROM "users" WHERE name = \'O\\\'Reilly\' AND status = "active";',
        'const regex = /[a-zA-Z0-9_\\-\\.]+/g;',
        '<!-- HTML with special chars: <script>alert("XSS")</script> &amp; &lt; -->',
        'Unicode test: 日本語 🇨🇦 🚀 🔥 ⚡ 🎯 💻 🛡️',
        'Tab:\t, Backslash:\\, NullChar:\0, Quote:\'", Template:`${val}`',
      ].join('\n');

      const complexNew = [
        'SELECT * FROM "users" WHERE name = $1 AND status = $2;',
        'const regex = /[a-zA-Z0-9_\\-\\.]+/g;',
        '<!-- HTML sanitized: &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; -->',
        'Unicode test: 日本語 🇨🇦 🚀 🔥 ⚡ 🎯 💻 🛡️ (UPDATED UTF-8)',
        'Tab:\t, Backslash:\\, NullChar:\0, Quote:\'", Template:`${val}`',
        'NEW_TRAILING_LINE_WITH_SPECIAL_CHARS: {}[]()<>=!&|^~?@#$%',
      ].join('\n');

      const diff = computeLineDiff(complexOld, complexNew);
      assert.ok(diff.length >= 6);

      const split = buildSplitDiffRows(complexOld, complexNew);
      assert.ok(split.length >= 5);

      // Line 2 (regex) and Line 5 (tab/backslash) must be unchanged
      const regexRow = split.find((r) => r.oldContent?.includes('const regex'));
      assert.ok(regexRow);
      assert.strictEqual(regexRow?.type, 'unchanged');

      // Unicode line must be modified
      const unicodeRow = split.find((r) => r.newContent?.includes('(UPDATED UTF-8)'));
      assert.ok(unicodeRow);
      assert.ok(unicodeRow?.newContent?.includes('日本語 🇨🇦 🚀'));
    });

    it('1.9 SplitDiffRow invariant validation on all sample traces', () => {
      SAMPLE_TRACES.forEach((trace) => {
        const splitRows = buildSplitDiffRows(trace.system_prompt_original, trace.system_prompt_patched);
        assert.ok(splitRows.length > 0);

        let lastOldLine = 0;
        let lastNewLine = 0;

        splitRows.forEach((row, idx) => {
          assert.ok(
            ['added', 'removed', 'unchanged', 'modified'].includes(row.type),
            `Invalid row type at ${idx}: ${row.type}`
          );

          if (row.oldLineNumber !== undefined) {
            assert.ok(
              row.oldLineNumber > lastOldLine,
              `Old line number out of order: ${row.oldLineNumber} <= ${lastOldLine} at row ${idx}`
            );
            lastOldLine = row.oldLineNumber;
            assert.ok(row.oldContent !== undefined, `Old content missing when oldLineNumber present at row ${idx}`);
          }

          if (row.newLineNumber !== undefined) {
            assert.ok(
              row.newLineNumber > lastNewLine,
              `New line number out of order: ${row.newLineNumber} <= ${lastNewLine} at row ${idx}`
            );
            lastNewLine = row.newLineNumber;
            assert.ok(row.newContent !== undefined, `New content missing when newLineNumber present at row ${idx}`);
          }

          if (row.type === 'unchanged') {
            assert.strictEqual(row.oldContent, row.newContent);
            assert.ok(row.oldLineNumber !== undefined && row.newLineNumber !== undefined);
          } else if (row.type === 'modified') {
            assert.ok(row.oldLineNumber !== undefined && row.newLineNumber !== undefined);
            assert.ok(row.oldContent !== undefined && row.newContent !== undefined);
          } else if (row.type === 'added') {
            assert.strictEqual(row.oldLineNumber, undefined);
            assert.strictEqual(row.oldContent, undefined);
            assert.ok(row.newLineNumber !== undefined);
          } else if (row.type === 'removed') {
            assert.ok(row.oldLineNumber !== undefined);
            assert.strictEqual(row.newLineNumber, undefined);
            assert.strictEqual(row.newContent, undefined);
          }
        });
      });
    });

    it('1.10 Performance & memory stress on 500-line prompt diff', () => {
      const old500 = Array.from({ length: 500 }, (_, i) => `Line ${i}: const val_${i} = ${i * 2};`).join('\n');
      const new500 = Array.from({ length: 500 }, (_, i) =>
        i % 2 === 0 ? `Line ${i}: const val_${i} = ${i * 2};` : `Line ${i}: const val_${i} = ${i * 3} /* modified */;`
      ).join('\n');

      const start = performance.now();
      const diff = computeLineDiff(old500, new500);
      const split = buildSplitDiffRows(old500, new500);
      const duration = performance.now() - start;

      assert.ok(diff.length > 500);
      assert.ok(split.length === 500);
      assert.ok(duration < 200, `500-line diff took ${duration.toFixed(1)}ms, expected < 200ms`);
    });
  });

  // =========================================================================
  // SECTION 2: COST MODEL & PRICING ARITHMETIC ADVERSARIAL STRESS TESTS
  // =========================================================================

  describe('2. Cost Model: Precision arithmetic, scaling, and edge cases', () => {
    it('2.1 Model pricing constants match official specifications', () => {
      const expectedPricing = {
        'gpt-4o': { in: 2.5, out: 10.0 },
        'claude-3-5-sonnet': { in: 3.0, out: 15.0 },
        'gpt-4o-mini': { in: 0.15, out: 0.6 },
        'deepseek-v3': { in: 0.14, out: 0.28 },
      };

      for (const [mId, rates] of Object.entries(expectedPricing)) {
        const pricing = MODEL_PRICING[mId as ModelId];
        assert.ok(pricing, `Pricing definition missing for ${mId}`);
        assert.strictEqual(pricing.inputPerMillion, rates.in);
        assert.strictEqual(pricing.outputPerMillion, rates.out);
      }
    });

    it('2.2 calculateCost fallback to gpt-4o for unknown or invalid modelId', () => {
      const costKnown = calculateCost(1000, 500, 'gpt-4o');
      const costUnknown = calculateCost(1000, 500, 'non-existent-model' as ModelId);
      assert.strictEqual(costKnown, costUnknown);
    });

    it('2.3 Zero token inputs return exact 0.00 cost and format without NaN', () => {
      const models: ModelId[] = ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini', 'deepseek-v3'];
      models.forEach((m) => {
        const cost = calculateCost(0, 0, m);
        assert.strictEqual(cost, 0);
        assert.strictEqual(formatCostPerMillion(cost), '0.00');
      });
    });

    it('2.4 Micro-token fractional calculations (1 input token, 1 output token)', () => {
      const cost = calculateCost(1, 1, 'deepseek-v3');
      assert.ok(cost > 0);
      assert.ok(Math.abs(cost - 0.00000042) < 1e-12);

      const formatted1M = formatCostPerMillion(cost);
      assert.strictEqual(formatted1M, '0.42');
    });

    it('2.5 Scaling to 100 Million runs handles large numbers with correct comma formatting', () => {
      const cost = calculateCost(2000, 1000, 'claude-3-5-sonnet');
      assert.strictEqual(Number(cost.toFixed(4)), 0.021);

      const formatted1M = formatCostPerMillion(cost);
      assert.strictEqual(formatted1M, '21,000.00');
    });

    it('2.6 Cost monotonicity property: Higher token count always yields >= cost', () => {
      const models: ModelId[] = ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini', 'deepseek-v3'];
      models.forEach((m) => {
        let prevCost = -1;
        for (let tokens = 0; tokens <= 100000; tokens += 5000) {
          const cost = calculateCost(tokens, tokens, m);
          assert.ok(cost >= prevCost, `Monotonicity violated at ${tokens} tokens for ${m}`);
          prevCost = cost;
        }
      });
    });

    it('2.7 CIRegressionMatrix formula precision across all sample traces', () => {
      SAMPLE_TRACES.forEach((trace) => {
        const baselineTokens = trace.baseline_metrics.tokens;
        const replayTokens = trace.replay_metrics.tokens;
        const pricing = MODEL_PRICING['gpt-4o'];

        const baselineCost =
          (baselineTokens * 0.75 / 1_000_000) * pricing.inputPerMillion +
          (baselineTokens * 0.25 / 1_000_000) * pricing.outputPerMillion;

        const replayCost =
          (replayTokens * 0.75 / 1_000_000) * pricing.inputPerMillion +
          (replayTokens * 0.25 / 1_000_000) * pricing.outputPerMillion;

        assert.ok(baselineCost > 0);
        assert.ok(replayCost > 0);
        assert.ok(replayCost <= baselineCost, `Patched replay should not exceed baseline cost for ${trace.id}`);

        const deltaCostPerRun = Number((replayCost - baselineCost).toFixed(5));
        assert.ok(deltaCostPerRun <= 0, `Delta cost should be non-positive for ${trace.id}`);

        const savingsPerMillion = Number(
          Math.max(0, (baselineCost - replayCost) * 1_000_000).toFixed(2)
        );
        assert.ok(savingsPerMillion >= 0);
      });
    });
  });

  // =========================================================================
  // SECTION 3: TRACE WATERFALL TIMELINE CLAMPING & OFFSET SAFETY
  // =========================================================================

  describe('3. Trace Waterfall: Timeline width clamping (8% min) and offset boundaries', () => {
    it('3.1 Sub-millisecond and tiny spans clamp strictly to 8% min width', () => {
      const totalDuration = 10000; // 10s trace
      const tinyDurations = [0, 0.001, 0.5, 1, 10, 50, 799]; // 799ms / 10000ms = 7.99%

      tinyDurations.forEach((d) => {
        const naturalPct = (d / totalDuration) * 100;
        const widthPct = Math.max(8, naturalPct);
        assert.strictEqual(widthPct, 8, `Duration ${d}ms (${naturalPct}%) must clamp to 8%`);
      });
    });

    it('3.2 Spans >= 8% maintain natural proportional width without artificial inflation', () => {
      const totalDuration = 1000;
      const largeDurations = [80, 150, 300, 500, 1000];

      largeDurations.forEach((d) => {
        const naturalPct = (d / totalDuration) * 100;
        const widthPct = Math.max(8, naturalPct);
        assert.strictEqual(widthPct, naturalPct, `Duration ${d}ms must equal natural ${naturalPct}%`);
      });
    });

    it('3.3 Offset clamping to 92% prevents waterfall bars from exceeding 100% total layout width', () => {
      const totalDuration = 1000;

      // Simulate step starting at offset 990ms (99%)
      const lateOffsetPct = 99;
      const clampedOffsetPct = Math.min(lateOffsetPct, 92);
      assert.strictEqual(clampedOffsetPct, 92);

      const widthPct = Math.max(8, (10 / totalDuration) * 100); // 8%
      const renderedWidth = Math.min(widthPct, 100 - clampedOffsetPct);

      assert.strictEqual(renderedWidth, 8);
      assert.strictEqual(clampedOffsetPct + renderedWidth, 100);
      assert.ok(clampedOffsetPct + renderedWidth <= 100, 'Bar must not overflow right edge');
    });

    it('3.4 Sequential waterfall execution never overflows 100% across all sample traces', () => {
      SAMPLE_TRACES.forEach((trace) => {
        const totalDuration = trace.baseline_metrics.latency_ms || 1835;

        trace.steps.forEach((step, idx) => {
          let offsetPct = 0;
          for (let i = 0; i < idx; i++) {
            offsetPct += (trace.steps[i].latency_ms / totalDuration) * 100;
          }

          const clampedOffsetPct = Math.min(offsetPct, 92);
          const widthPct = Math.max(8, (step.latency_ms / totalDuration) * 100);
          const finalRenderedWidth = Math.min(widthPct, 100 - clampedOffsetPct);

          assert.ok(clampedOffsetPct >= 0, `Offset must be >= 0 for trace ${trace.id} step ${idx}`);
          assert.ok(clampedOffsetPct <= 92, `Offset must be <= 92 for trace ${trace.id} step ${idx}`);
          assert.ok(finalRenderedWidth >= 8, `Rendered width must be >= 8% for trace ${trace.id} step ${idx}`);
          assert.ok(
            clampedOffsetPct + finalRenderedWidth <= 100.001,
            `Bar overflows 100%: offset ${clampedOffsetPct}% + width ${finalRenderedWidth}% for trace ${trace.id} step ${idx}`
          );
        });
      });
    });

    it('3.5 Extreme case: 50 sequential zero-millisecond spans all render safely without crash or overflow', () => {
      const totalDuration = 1000;
      const mockSteps = Array.from({ length: 50 }, (_, i) => ({
        step_index: i + 1,
        latency_ms: 0,
      }));

      mockSteps.forEach((step, idx) => {
        let offsetPct = 0;
        for (let i = 0; i < idx; i++) {
          offsetPct += (mockSteps[i].latency_ms / totalDuration) * 100;
        }

        const clampedOffsetPct = Math.min(offsetPct, 92);
        const widthPct = Math.max(8, (step.latency_ms / totalDuration) * 100);
        const renderedWidth = Math.min(widthPct, 100 - clampedOffsetPct);

        assert.strictEqual(clampedOffsetPct, 0);
        assert.strictEqual(widthPct, 8);
        assert.strictEqual(renderedWidth, 8);
        assert.ok(clampedOffsetPct + renderedWidth <= 100);
      });
    });

    it('3.6 Flamegraph grid column calculation bounds: always between 2 and 12 columns', () => {
      const totalDuration = 2000;
      const testLatencies = [0, 1, 10, 100, 500, 1000, 1999, 2000, 5000];

      testLatencies.forEach((lat) => {
        const cols = Math.max(2, Math.round((lat / totalDuration) * 12));
        const clampedCols = Math.min(cols, 12);
        assert.ok(clampedCols >= 2, `Cols must be >= 2 for ${lat}ms, got ${clampedCols}`);
        assert.ok(clampedCols <= 12, `Cols must be <= 12 for ${lat}ms, got ${clampedCols}`);
      });
    });

    it('3.7 Fallback duration safety when total latency is 0, undefined, or NaN', () => {
      const fallbackDuration = (latMs?: number) => latMs || 1835;

      assert.strictEqual(fallbackDuration(0), 1835);
      assert.strictEqual(fallbackDuration(undefined), 1835);
      assert.strictEqual(fallbackDuration(2500), 2500);
    });
  });

  // =========================================================================
  // SECTION 4: PROPERTY-BASED RANDOM FUZZING
  // =========================================================================

  describe('4. Property-Based Random Fuzzing', () => {
    it('4.1 Randomized string pairs fuzzing for computeLineDiff', () => {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789 \t\n`~!@#$%^&*()_+-=[]{}\\|;:\'",.<>/?';

      const generateRandomString = (length: number) => {
        let str = '';
        for (let i = 0; i < length; i++) {
          str += alphabet[Math.floor(Math.random() * alphabet.length)];
        }
        return str;
      };

      for (let run = 0; run < 50; run++) {
        const s1 = generateRandomString(Math.floor(Math.random() * 80));
        const s2 = generateRandomString(Math.floor(Math.random() * 80));

        const diff = computeLineDiff(s1, s2);
        assert.ok(Array.isArray(diff));
        assert.ok(diff.length > 0);

        const split = buildSplitDiffRows(s1, s2);
        assert.ok(Array.isArray(split));
        assert.ok(split.length > 0);

        // Every item has valid type
        split.forEach((r) => {
          assert.ok(['added', 'removed', 'unchanged', 'modified'].includes(r.type));
        });
      }
    });

    it('4.2 Randomized token load fuzzing across models', () => {
      const models: ModelId[] = ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini', 'deepseek-v3'];

      for (let run = 0; run < 100; run++) {
        const promptTokens = Math.floor(Math.random() * 50000);
        const compTokens = Math.floor(Math.random() * 20000);
        const model = models[Math.floor(Math.random() * models.length)];

        const cost = calculateCost(promptTokens, compTokens, model);
        assert.ok(!isNaN(cost), `Cost was NaN for prompt=${promptTokens}, comp=${compTokens}, model=${model}`);
        assert.ok(cost >= 0, `Cost was negative for prompt=${promptTokens}, comp=${compTokens}, model=${model}`);

        const formatted = formatCostPerMillion(cost);
        assert.ok(!formatted.includes('NaN'));
        assert.ok(formatted.length > 0);
      }
    });
  });
});
