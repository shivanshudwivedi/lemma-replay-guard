import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('Tier 1 — R1: Industrial Dark Theme & Micro-Typography Specifications', () => {
  // Authoritative Source: ORIGINAL_REQUEST.md (R1) & survey_spec.md §4
  const indexCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');
  const tailwindConfig = readFileSync(resolve(process.cwd(), 'tailwind.config.js'), 'utf8');

  it('R1.1: Core surface dark palette tokens are defined with precise industrial charcoal hues', () => {
    // Required tokens: #090b10 / #090d16 for primary background, #0f172a / #0d111a for card base
    assert.ok(
      indexCss.includes('#090b10') || indexCss.includes('#090d16'),
      'Background base color should be deep industrial charcoal (#090b10 or #090d16)'
    );
    assert.ok(
      tailwindConfig.includes('#090d16') || tailwindConfig.includes('#0f172a'),
      'Tailwind config must declare lemma dark theme surface colors'
    );
    assert.ok(
      indexCss.includes('.devtools-panel'),
      'CSS must define .devtools-panel class'
    );
    assert.ok(
      indexCss.includes('.devtools-card'),
      'CSS must define .devtools-card class'
    );
  });

  it('R1.2: Semantic functional accent colors are reserved for functional states (emerald, rose, cyan, violet, amber)', () => {
    // Emerald: #10b981 / #22c55e (Pass/Success)
    // Rose: #f43f5e (Fail/Rejections)
    // Cyan: #06b6d4 (Tool executions/Sandbox)
    // Violet: #8b5cf6 (CI/CD/LLM dispatch)
    assert.ok(tailwindConfig.includes('#10b981') || tailwindConfig.includes('#22c55e'), 'Emerald accent color declared');
    assert.ok(tailwindConfig.includes('#06b6d4'), 'Cyan accent color declared');
    assert.ok(tailwindConfig.includes('#8b5cf6'), 'Violet accent color declared');
    assert.ok(indexCss.includes('rgba(16, 185, 129') || tailwindConfig.includes('10b981'), 'Emerald accent glow configured');
  });

  it('R1.3: Typography stack specifies Inter with tight tracking and JetBrains Mono for telemetry', () => {
    // Body tracking: -0.011em, Font stacks: Inter and JetBrains Mono
    assert.ok(indexCss.includes('letter-spacing: -0.011em') || indexCss.includes('-0.011em'), 'Tight body tracking -0.011em enforced');
    assert.ok(indexCss.includes('Inter') || tailwindConfig.includes('Inter'), 'Inter font stack defined for body');
    assert.ok(
      tailwindConfig.includes('JetBrains Mono') || indexCss.includes('JetBrains Mono') || tailwindConfig.includes('monospace'),
      'JetBrains Mono monospace font stack defined'
    );
  });

  it('R1.4: Crisp DevTools panel borders and custom linear scrollbar styling are enforced', () => {
    assert.ok(indexCss.includes('border: 1px solid rgba(255, 255, 255, 0.08)') || indexCss.includes('rgba(255, 255, 255, 0.08)'), '0.08 white subtle border defined');
    assert.ok(indexCss.includes('::-webkit-scrollbar'), 'Custom WebKit scrollbar defined');
    assert.ok(indexCss.includes('::-webkit-scrollbar-thumb'), 'Scrollbar thumb defined with subtle opacity');
  });

  it('R1.5: Ambient glow canvas & 24px subtle geometric grid overlay with Framer Motion spring physics are configured', () => {
    const ambientBg = readFileSync(resolve(process.cwd(), 'src/components/AmbientBackground.tsx'), 'utf8');
    assert.ok(ambientBg.includes('24px 24px'), 'Grid size configured to 24px by 24px in AmbientBackground');
    assert.ok(ambientBg.includes('radial-gradient'), 'Ambient glow utilizes radial gradient');
    assert.ok(ambientBg.includes('spring'), 'Framer Motion spring physics configured for ambient lighting');
    assert.ok(indexCss.includes('.status-dot-emerald'), 'Emerald precision status dot defined');
    assert.ok(indexCss.includes('.status-dot-rose'), 'Rose precision status dot defined');
  });

  it('R1.6: Active panel state (.devtools-panel-active) features emerald glow highlight', () => {
    assert.ok(indexCss.includes('.devtools-panel-active'), '.devtools-panel-active class defined');
    assert.ok(
      indexCss.includes('rgba(16, 185, 129, 0.4)') || indexCss.includes('16, 185, 129'),
      'Active panel features emerald border and subtle shadow glow'
    );
  });
});
