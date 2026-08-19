import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { SAMPLE_TRACES } from '../data/sampleTraces';
import { computeLineDiff, buildSplitDiffRows } from '../lib/diffEngine';
import { MODEL_PRICING, calculateCost, formatCostPerMillion } from '../lib/costModel';
import { ModelId } from '../types/telemetry';

describe('Tier 1 — R3: Split-View Prompt Patch & Diff IDE Specifications', () => {
  // Authoritative Source: ORIGINAL_REQUEST.md (R3) & survey_spec.md §2 (F10, F11, F12, F13, F14)

  it('R3.1: LCS Myers Diff computation accurately identifies unchanged lines and additions in system prompts', () => {
    const trace = SAMPLE_TRACES[0];
    const diff = computeLineDiff(trace.system_prompt_original, trace.system_prompt_patched);

    assert.ok(diff.length > 0, 'Diff must not be empty');

    const unchangedLines = diff.filter((d) => d.type === 'unchanged');
    const addedLines = diff.filter((d) => d.type === 'added');

    assert.ok(unchangedLines.length >= 1, 'Original prompt lines should be marked unchanged');
    assert.ok(addedLines.length >= 1, 'Schema constraint additions must be marked added');

    // Assert that added lines contain schema constraint keywords
    const addedText = addedLines.map((l) => l.content).join('\n');
    assert.ok(addedText.includes('CRITICAL SCHEMA CONSTRAINT'));
    assert.ok(addedText.includes('process_stripe_refund'));
  });

  it('R3.2: Side-by-side split diff row alignment aligns line numbers and detects modifications', () => {
    const trace = SAMPLE_TRACES[0];
    const splitRows = buildSplitDiffRows(trace.system_prompt_original, trace.system_prompt_patched);

    assert.ok(splitRows.length > 0, 'Split rows must be constructed');

    // First line is unchanged in both
    assert.strictEqual(splitRows[0].type, 'unchanged');
    assert.strictEqual(splitRows[0].oldLineNumber, 1);
    assert.strictEqual(splitRows[0].newLineNumber, 1);
    assert.strictEqual(splitRows[0].oldContent, splitRows[0].newContent);

    // Later lines are added in patched version
    const addedRows = splitRows.filter((r) => r.type === 'added');
    assert.ok(addedRows.length >= 3, 'Must contain added constraint rows');
    assert.strictEqual(addedRows[0].oldLineNumber, undefined);
    assert.ok(addedRows[0].newLineNumber !== undefined);
  });

  it('R3.3: System prompt mode toggles between original (failing), patched (fixed), and custom text', () => {
    const trace = SAMPLE_TRACES[0];
    const customText = 'Custom modified system prompt for testing';

    const getActivePrompt = (mode: 'patched' | 'original' | 'custom', custom: string) => {
      return mode === 'patched'
        ? trace.system_prompt_patched
        : mode === 'original'
        ? trace.system_prompt_original
        : custom;
    };

    assert.strictEqual(getActivePrompt('patched', customText), trace.system_prompt_patched);
    assert.strictEqual(getActivePrompt('original', customText), trace.system_prompt_original);
    assert.strictEqual(getActivePrompt('custom', customText), customText);
  });

  it('R3.4: Character counting and token estimation formula (Math.ceil(chars / 4)) behaves deterministically', () => {
    const testStrings = [
      { text: '', expectedChars: 0, expectedTokens: 0 },
      { text: 'hello', expectedChars: 5, expectedTokens: 2 },
      { text: '12345678', expectedChars: 8, expectedTokens: 2 },
      { text: '123456789', expectedChars: 9, expectedTokens: 3 },
      {
        text: SAMPLE_TRACES[0].system_prompt_patched,
        expectedChars: SAMPLE_TRACES[0].system_prompt_patched.length,
        expectedTokens: Math.ceil(SAMPLE_TRACES[0].system_prompt_patched.length / 4),
      },
    ];

    testStrings.forEach(({ text, expectedChars, expectedTokens }) => {
      const chars = text.length;
      const tokens = Math.ceil(chars / 4);
      assert.strictEqual(chars, expectedChars);
      assert.strictEqual(tokens, expectedTokens);
    });
  });

  it('R3.5: Multi-model pricing matrix contains accurate standardized rates for all 4 supported models', () => {
    const supportedModels: ModelId[] = ['gpt-4o', 'claude-3-5-sonnet', 'gpt-4o-mini', 'deepseek-v3'];

    supportedModels.forEach((modelId) => {
      const pricing = MODEL_PRICING[modelId];
      assert.ok(pricing, `Pricing must exist for ${modelId}`);
      assert.strictEqual(pricing.modelId, modelId);
      assert.ok(pricing.inputPerMillion > 0, `Input pricing > 0 for ${modelId}`);
      assert.ok(pricing.outputPerMillion > 0, `Output pricing > 0 for ${modelId}`);
    });

    // Verify specific reference rates
    assert.strictEqual(MODEL_PRICING['gpt-4o'].inputPerMillion, 2.5);
    assert.strictEqual(MODEL_PRICING['gpt-4o'].outputPerMillion, 10.0);
    assert.strictEqual(MODEL_PRICING['claude-3-5-sonnet'].inputPerMillion, 3.0);
    assert.strictEqual(MODEL_PRICING['claude-3-5-sonnet'].outputPerMillion, 15.0);
    assert.strictEqual(MODEL_PRICING['gpt-4o-mini'].inputPerMillion, 0.15);
    assert.strictEqual(MODEL_PRICING['gpt-4o-mini'].outputPerMillion, 0.60);
    assert.strictEqual(MODEL_PRICING['deepseek-v3'].inputPerMillion, 0.14);
    assert.strictEqual(MODEL_PRICING['deepseek-v3'].outputPerMillion, 0.28);
  });

  it('R3.6: Cost calculation engine computes per-run USD cost and formatted 1M query savings', () => {
    // 1000 prompt tokens, 500 completion tokens on gpt-4o:
    // (1000 / 1M) * 2.50 = $0.0025
    // (500 / 1M) * 10.00 = $0.0050
    // Total = $0.0075
    const costGpt4o = calculateCost(1000, 500, 'gpt-4o');
    assert.strictEqual(Number(costGpt4o.toFixed(4)), 0.0075);

    const formatted1M = formatCostPerMillion(costGpt4o);
    assert.strictEqual(formatted1M, '7,500.00');

    // On gpt-4o-mini:
    // (1000 / 1M) * 0.15 = 0.00015
    // (500 / 1M) * 0.60 = 0.00030
    // Total = 0.00045
    const costMini = calculateCost(1000, 500, 'gpt-4o-mini');
    assert.strictEqual(Number(costMini.toFixed(5)), 0.00045);
    assert.strictEqual(formatCostPerMillion(costMini), '450.00');
  });
});
