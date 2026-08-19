import React, { useState } from 'react';
import { SampleTraceData } from '../data/sampleTraces';
import { ShieldCheck, GitPullRequest, Copy, Check, TrendingDown, DollarSign, Clock, Hash, CheckCircle2, ChevronDown, ChevronRight } from 'lucide-react';
import { calculateCostForModel } from '../lib/diffEngine';

interface CIRegressionMatrixProps {
  selectedTrace: SampleTraceData;
  selectedModel?: string;
}

export const CIRegressionMatrix: React.FC<CIRegressionMatrixProps> = ({ selectedTrace, selectedModel = 'gpt-4o' }) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [detailsOpen, setDetailsOpen] = useState<boolean>(true);

  const baselineTokens = selectedTrace.baseline_metrics.tokens;
  const replayTokens = selectedTrace.replay_metrics.tokens;

  const baseCost = calculateCostForModel(
    selectedModel,
    Math.round(baselineTokens * 0.8),
    Math.round(baselineTokens * 0.2)
  );
  const replayCost = calculateCostForModel(
    selectedModel,
    Math.round(replayTokens * 0.8),
    Math.round(replayTokens * 0.2)
  );

  const deltaLatency = selectedTrace.replay_metrics.latency_ms - selectedTrace.baseline_metrics.latency_ms;
  const deltaLatencyPct = ((deltaLatency / selectedTrace.baseline_metrics.latency_ms) * 100).toFixed(1);

  const deltaTokens = replayTokens - baselineTokens;
  const deltaTokensPct = ((deltaTokens / baselineTokens) * 100).toFixed(1);

  const deltaCostVal = replayCost - baseCost;
  const deltaCost = deltaCostVal.toFixed(5);
  const savingsPerMillion = ((baseCost - replayCost) * 1_000_000).toFixed(2);

  const prMarkdown = `## 🟢 Lemma CI Regression Guard Report
> **Summary:** All Regressions Resolved across \`1\` eval fixture(s).

### 📊 Regression Diff Matrix

| Eval ID | Status | Δ Latency | Δ Tokens | Δ Cost / Run | Assertion Pass Rate |
|---|:---:|:---:|:---:|:---:|:---:|
| \`eval_${selectedTrace.id}\` | ✅ \`RESOLVED\` | \`${deltaLatency}ms (${deltaLatencyPct}%)\` | \`${deltaTokens} (${deltaTokensPct}%)\` | \`$${deltaCost}\` | \`${selectedTrace.assertions.length}/${selectedTrace.assertions.length}\` |

### 🔍 Detailed Assertion Breakdown

<details open><summary><b>eval_${selectedTrace.id}</b> (Source Trace: <code>${selectedTrace.trace_id}</code>)</summary>

| Assertion | Result | Details |
|---|:---:|---|
${selectedTrace.assertions.map(a => `| ${a.description} | ✅ | Passed deterministic mock validation |`).join('\n')}
</details>

---
*Report generated automatically by [Lemma CI Regression Guard](https://uselemma.ai) • Deterministic Mock Execution Sandbox*`;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(prMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="ci-matrix" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-600 mb-1">
            <span className="h-2 w-2 rounded-full bg-zinc-900"></span>
            CI/CD Gating
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            CI Regression Matrix & PR Comment
          </h2>
          <p className="text-sm text-zinc-600 mt-1 font-normal">
            Pass/fail regression metrics, latency differentials, and token cost impact.
          </p>
        </div>

        <button
          onClick={handleCopyMarkdown}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 font-mono text-sm transition-all shadow-2xs self-start md:self-auto hover:border-zinc-300 font-semibold cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-zinc-500" />}
          <span>{copied ? 'Copied to Clipboard!' : 'Copy PR Markdown'}</span>
        </button>
      </div>

      {/* 4 Performance Differential Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        
        {/* Metric 1 */}
        <div className="p-5 rounded-xl devtools-panel bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2">
            <span className="uppercase font-bold tracking-wider">Status</span>
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono">RESOLVED</span>
            <span className="text-sm text-zinc-400 font-mono line-through">FAILED</span>
          </div>
          <div className="mt-2 text-xs text-zinc-600 font-mono font-medium">
            {selectedTrace.assertions.length}/{selectedTrace.assertions.length} assertions passed
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-5 rounded-xl devtools-panel bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2">
            <span className="uppercase font-bold tracking-wider">Latency</span>
            <Clock className="w-5 h-5 text-zinc-700" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">{selectedTrace.replay_metrics.latency_ms}ms</span>
            <span className="text-sm text-zinc-400 font-mono line-through">{selectedTrace.baseline_metrics.latency_ms}ms</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-mono font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{deltaLatency}ms ({deltaLatencyPct}%) faster</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-5 rounded-xl devtools-panel bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2">
            <span className="uppercase font-bold tracking-wider">Tokens</span>
            <Hash className="w-5 h-5 text-zinc-700" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">{replayTokens}</span>
            <span className="text-sm text-zinc-400 font-mono line-through">{baselineTokens}</span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-mono font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>{deltaTokens} ({deltaTokensPct}%) tokens saved</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-5 rounded-xl devtools-panel bg-white shadow-xs">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 mb-2">
            <span className="uppercase font-bold tracking-wider">Cost / 1M Runs</span>
            <DollarSign className="w-5 h-5 text-zinc-700" />
          </div>
          <div className="flex items-baseline gap-2.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-zinc-900 font-mono">
              ${(replayCost * 1_000_000).toFixed(0)}
            </span>
            <span className="text-sm text-zinc-400 font-mono line-through">
              ${(baseCost * 1_000_000).toFixed(0)}
            </span>
          </div>
          <div className="mt-2 text-xs text-emerald-700 font-mono font-semibold">
            +${savingsPerMillion} savings / 1M runs
          </div>
        </div>

      </div>

      {/* GitHub PR Comment Sandbox */}
      <div className="rounded-xl devtools-panel overflow-hidden bg-white shadow-xs">
        
        {/* PR Header Bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center">
              <GitPullRequest className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-zinc-900">lemma-replay-bot</span>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-200 text-zinc-700 border border-zinc-300 font-semibold">
                bot
              </span>
              <span className="text-zinc-500">• Pull Request #142</span>
            </div>
          </div>

          <span className="text-xs font-mono text-emerald-700 flex items-center gap-1.5 font-bold">
            <span className="h-2 w-2 rounded-full bg-emerald-600"></span>
            CI Gating Passed
          </span>
        </div>

        {/* PR Comment Markdown Render */}
        <div className="p-6 bg-white text-sm font-mono space-y-4 text-zinc-800">
          
          <div className="flex items-center gap-2 text-base font-bold text-zinc-900">
            <span className="text-emerald-600">🟢</span>
            <span>Lemma CI Regression Guard Report</span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border border-zinc-200 rounded-lg">
              <thead className="bg-zinc-50 text-zinc-700 uppercase text-xs border-b border-zinc-200 font-bold">
                <tr>
                  <th className="p-3">Eval ID</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Δ Latency</th>
                  <th className="p-3 text-right">Δ Tokens</th>
                  <th className="p-3 text-right">Δ Cost / Run</th>
                  <th className="p-3 text-center">Pass Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                <tr className="hover:bg-zinc-50/50">
                  <td className="p-3 font-bold text-zinc-900">eval_{selectedTrace.id}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                      RESOLVED
                    </span>
                  </td>
                  <td className="p-3 text-right text-emerald-700 font-bold">{deltaLatency}ms ({deltaLatencyPct}%)</td>
                  <td className="p-3 text-right text-emerald-700 font-bold">{deltaTokens} ({deltaTokensPct}%)</td>
                  <td className="p-3 text-right text-emerald-700 font-bold">${deltaCost}</td>
                  <td className="p-3 text-center text-zinc-800 font-semibold">{selectedTrace.assertions.length}/{selectedTrace.assertions.length}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Collapsible Details */}
          <div className="border border-zinc-200 rounded-lg overflow-hidden bg-white">
            <button
              onClick={() => setDetailsOpen(!detailsOpen)}
              className="w-full flex items-center justify-between p-3 text-sm text-zinc-800 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {detailsOpen ? <ChevronDown className="w-4 h-4 text-zinc-400" /> : <ChevronRight className="w-4 h-4 text-zinc-400" />}
                <span className="font-bold text-zinc-900">eval_{selectedTrace.id}</span>
                <span className="text-zinc-500 text-xs">({selectedTrace.trace_id})</span>
              </div>
              <span className="text-emerald-700 text-xs font-bold">4/4 Checks Passed</span>
            </button>

            {detailsOpen && (
              <div className="p-4 border-t border-zinc-200 overflow-x-auto bg-zinc-50/40">
                <table className="w-full text-left text-sm">
                  <thead className="text-xs uppercase text-zinc-600 border-b border-zinc-200 font-bold">
                    <tr>
                      <th className="pb-2">Assertion Rule</th>
                      <th className="pb-2 text-center w-20">Result</th>
                      <th className="pb-2">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {selectedTrace.assertions.map((a, idx) => (
                      <tr key={idx}>
                        <td className="py-2 text-zinc-800 font-medium">{a.description}</td>
                        <td className="py-2 text-center">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                        </td>
                        <td className="py-2 text-zinc-600">Passed deterministic mock validation</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

      </div>

    </section>
  );
};
