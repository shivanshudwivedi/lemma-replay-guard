import React, { useState } from 'react';
import { SAMPLE_TRACES, SampleTraceData } from '../data/sampleTraces';
import { ShieldAlert, Terminal, FileCode, CheckCircle2, ArrowRight, Code, AlertTriangle, Cpu, Layers } from 'lucide-react';

interface TraceIngestorProps {
  selectedTrace: SampleTraceData;
  onSelectTrace: (trace: SampleTraceData) => void;
  onProceedToReplay: () => void;
}

export const TraceIngestor: React.FC<TraceIngestorProps> = ({
  selectedTrace,
  onSelectTrace,
  onProceedToReplay,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'raw_json' | 'synthesized_eval'>('overview');

  return (
    <section id="ingestor" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            Telemetry Ingest Stage
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Production Failure Trace Ingestor
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Select a live silent failure trace captured from production to inspect root-cause telemetry and synthesize a regression fixture.
          </p>
        </div>

        <button
          onClick={onProceedToReplay}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-all shadow-md shadow-emerald-500/20 self-start md:self-auto"
        >
          <span>Send to Replay Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Preset Trace Selector Tabs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {SAMPLE_TRACES.map((trace) => {
          const isSelected = trace.id === selectedTrace.id;
          return (
            <button
              key={trace.id}
              onClick={() => onSelectTrace(trace)}
              className={`p-4 rounded-xl text-left transition-all border ${
                isSelected
                  ? 'bg-slate-800/90 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/50'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono text-slate-400">{trace.agent_id}</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${trace.failure_badge_color}`}>
                  {trace.failure_type}
                </span>
              </div>
              <h4 className="font-semibold text-sm text-white mb-1">{trace.name}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {trace.failure_summary}
              </p>
            </button>
          );
        })}
      </div>

      {/* Main Inspection Container */}
      <div className="rounded-2xl glass-panel border border-slate-800/80 overflow-hidden shadow-2xl">
        
        {/* Container Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              Trace ID: <span className="text-emerald-400">{selectedTrace.trace_id}</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-mono text-slate-400">
              Timestamp: {selectedTrace.timestamp}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Visual Trace
            </button>
            <button
              onClick={() => setActiveTab('synthesized_eval')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'synthesized_eval'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              .lemma.eval.yaml Spec
            </button>
            <button
              onClick={() => setActiveTab('raw_json')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeTab === 'raw_json'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw Telemetry JSON
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Failure Root Cause Alert */}
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-800/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase font-bold text-rose-400">
                      Silent Failure Triage
                    </span>
                    <span className="text-xs text-slate-400">• Root Cause Identified</span>
                  </div>
                  <p className="text-sm text-slate-200 mt-1">{selectedTrace.failure_summary}</p>
                  <p className="text-xs text-slate-400 mt-1 font-mono">{selectedTrace.root_cause}</p>
                </div>
              </div>

              {/* Execution Steps Timeline */}
              <div>
                <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  Execution Path & Span Breakdown ({selectedTrace.steps.length} steps)
                </h4>

                <div className="space-y-3">
                  {selectedTrace.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        step.status === 'ERROR'
                          ? 'bg-rose-950/20 border-rose-800/50'
                          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            Step #{step.step_index}
                          </span>
                          <span className="text-xs font-mono font-semibold text-white">
                            {step.type}
                          </span>
                          {step.name && (
                            <span className="text-xs font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                              tool: {step.name}
                            </span>
                          )}
                          {step.model && (
                            <span className="text-xs font-mono text-violet-400 bg-violet-950/40 px-2 py-0.5 rounded border border-violet-800/40">
                              model: {step.model}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                          <span>{step.latency_ms}ms</span>
                          {step.tokens && (
                            <span>{step.tokens.total_tokens} tok</span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              step.status === 'ERROR'
                                ? 'bg-rose-500/20 text-rose-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>

                      {/* Arguments / Output / Errors */}
                      {step.arguments && (
                        <div className="mt-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 text-slate-300">
                          <span className="text-slate-500">// Arguments:</span>
                          <pre className="mt-0.5 overflow-x-auto text-[11px]">
                            {JSON.stringify(step.arguments, null, 2)}
                          </pre>
                        </div>
                      )}

                      {step.error_message && (
                        <div className="mt-2 text-xs font-mono bg-rose-950/40 p-2.5 rounded-lg border border-rose-800/60 text-rose-300">
                          <span className="text-rose-400 font-bold">// Rejection Error: </span>
                          <span>{step.error_message}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Synthesized Zero Side-Effect Mock Harness Preview */}
              <div className="pt-4 border-t border-slate-800/80">
                <h4 className="text-xs font-mono uppercase text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Auto-Synthesized Deterministic Mocks ({selectedTrace.mock_tools.length} Tools)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedTrace.mock_tools.map((mock, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-semibold text-emerald-400">{mock.name}</span>
                        <span className="font-mono text-slate-500">~{mock.latency_ms}ms sim</span>
                      </div>
                      <p className="text-slate-400 mb-2">{mock.description}</p>
                      <div className="text-[10px] font-mono bg-slate-950/70 p-2 rounded border border-slate-800/60">
                        <span className="text-slate-500">Expected Schema:</span>
                        <div className="text-slate-300 truncate">{JSON.stringify(mock.expected_args)}</div>
                        {mock.forbidden_keys && (
                          <div className="text-rose-400 mt-0.5">
                            Forbidden: {mock.forbidden_keys.join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {activeTab === 'synthesized_eval' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre className="text-emerald-400/90 leading-relaxed">
{`# Auto-generated by Lemma Replay Guard
schema_version: "v1.0"
eval_id: "eval_${selectedTrace.id}"
source_trace_id: "${selectedTrace.trace_id}"
agent_id: "${selectedTrace.agent_id}"
created_at: "${selectedTrace.timestamp}"

baseline:
  model: "${selectedTrace.steps[0].model || 'gpt-4o'}"
  total_latency_ms: ${selectedTrace.baseline_metrics.latency_ms}
  total_tokens: ${selectedTrace.baseline_metrics.tokens}
  cost_usd: ${selectedTrace.baseline_metrics.cost_usd}
  status: "FAILED"

input:
  system_prompt: |
    ${selectedTrace.system_prompt_original.replace(/\n/g, '\n    ')}
  user_input: "${selectedTrace.user_input}"

mock_harness:
  tools:
${selectedTrace.mock_tools.map(t => `    - name: "${t.name}"
      match:
        type: "schema_validation"
        required_keys: ${JSON.stringify(Object.keys(t.expected_args))}
        ${t.forbidden_keys ? `forbidden_keys: ${JSON.stringify(t.forbidden_keys)}` : ''}
      response: ${JSON.stringify(t.simulated_response)}
      latency_sim_ms: ${t.latency_ms}`).join('\n')}

assertions:
${selectedTrace.assertions.map(a => `  - type: "${a.rule}"
    description: "${a.description}"`).join('\n')}`}
              </pre>
            </div>
          )}

          {activeTab === 'raw_json' && (
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
              <pre className="text-cyan-400/90">
                {JSON.stringify(selectedTrace, null, 2)}
              </pre>
            </div>
          )}
        </div>

      </div>

    </section>
  );
};
