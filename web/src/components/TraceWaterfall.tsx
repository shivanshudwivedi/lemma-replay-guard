import React, { useState } from 'react';
import { SampleTraceData, TraceStepData } from '../data/sampleTraces';
import { Layers, AlertTriangle, ChevronRight } from 'lucide-react';

interface TraceWaterfallProps {
  selectedTrace: SampleTraceData;
  onProceedToReplay: () => void;
}

export const TraceWaterfall: React.FC<TraceWaterfallProps> = ({ selectedTrace, onProceedToReplay }) => {
  const [selectedStep, setSelectedStep] = useState<TraceStepData>(selectedTrace.steps[0]);
  const [viewMode, setViewMode] = useState<'waterfall' | 'schema_spec' | 'raw_otel'>('waterfall');

  const totalDuration = selectedTrace.baseline_metrics.latency_ms || 1835;

  return (
    <div className="rounded-xl devtools-panel overflow-hidden">
      
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-zinc-200 bg-zinc-50/70 gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
            <span className="text-sm font-mono font-bold text-zinc-900">
              Trace: <span className="text-zinc-700 font-normal">{selectedTrace.trace_id}</span>
            </span>
          </div>
          <span className="text-zinc-300">|</span>
          <span className="text-sm font-mono text-zinc-600">
            Agent: <span className="text-zinc-900 font-semibold">{selectedTrace.agent_id}</span>
          </span>
          <span className="text-zinc-300">|</span>
          <span className="text-sm font-mono text-zinc-600">
            Duration: <span className="text-zinc-900 font-semibold">{totalDuration}ms</span>
          </span>
        </div>

        {/* View Mode Segmented Control */}
        <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg text-xs font-mono">
          <button
            onClick={() => setViewMode('waterfall')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'waterfall' ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Span Waterfall
          </button>
          <button
            onClick={() => setViewMode('schema_spec')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'schema_spec' ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Eval Spec (.yaml)
          </button>
          <button
            onClick={() => setViewMode('raw_otel')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'raw_otel' ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-600 hover:text-zinc-900'
            }`}
          >
            Raw Telemetry
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'waterfall' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-zinc-200">
          
          {/* Left Waterfall Timeline (7 cols) */}
          <div className="lg:col-span-7 p-6 space-y-4 bg-white">
            
            {/* Failure Root Cause Alert Banner */}
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 flex items-start gap-3 text-sm">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-bold text-rose-900 font-mono">Root Cause: </span>
                <span className="text-zinc-800 font-sans leading-relaxed">{selectedTrace.failure_summary}</span>
              </div>
            </div>

            {/* Timeline Ruler */}
            <div className="pt-2">
              <div className="flex justify-between text-xs font-mono text-zinc-500 pb-1.5 border-b border-zinc-200 font-medium">
                <span>0ms</span>
                <span>{(totalDuration * 0.25).toFixed(0)}ms</span>
                <span>{(totalDuration * 0.5).toFixed(0)}ms</span>
                <span>{(totalDuration * 0.75).toFixed(0)}ms</span>
                <span>{totalDuration}ms</span>
              </div>

              {/* Span Rows */}
              <div className="mt-3 space-y-2">
                {selectedTrace.steps.map((step, idx) => {
                  const isSelected = selectedStep.step_index === step.step_index;
                  let offsetPct = 0;
                  for (let i = 0; i < idx; i++) {
                    offsetPct += (selectedTrace.steps[i].latency_ms / totalDuration) * 100;
                  }
                  const naturalPct = (step.latency_ms / totalDuration) * 100;
                  const widthPct = Math.max(8, naturalPct);

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedStep(step)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-zinc-50 border-zinc-900 ring-1 ring-zinc-900/10 shadow-xs'
                          : 'bg-white border-zinc-200 hover:bg-zinc-50/60 hover:border-zinc-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-sm font-mono mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-zinc-400 font-bold">#{step.step_index}</span>
                          <span className="font-bold text-zinc-900">{step.type}</span>
                          {step.name && (
                            <span className="text-xs text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 font-semibold">
                              {step.name}
                            </span>
                          )}
                          {step.model && (
                            <span className="text-xs text-zinc-800 bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200 font-semibold">
                              {step.model}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 text-xs">
                          <span className="text-zinc-600 font-semibold">{step.latency_ms}ms</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                              step.status === 'ERROR'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>
                      </div>

                      {/* Visual Waterfall Bar */}
                      <div className="w-full bg-zinc-100 h-2.5 rounded-full overflow-hidden relative">
                        <div
                          className={`h-full rounded-full transition-all ${
                            step.status === 'ERROR'
                              ? 'bg-rose-500'
                              : step.type === 'TOOL_EXECUTION'
                              ? 'bg-zinc-400'
                              : 'bg-zinc-800'
                          }`}
                          style={{
                            marginLeft: `${offsetPct}%`,
                            width: `${widthPct}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Span Details Inspector (5 cols) */}
          <div className="lg:col-span-5 p-6 bg-zinc-50/50 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-sm font-mono font-bold uppercase text-zinc-900">
                    Span Details • Step #{selectedStep.step_index}
                  </h4>
                </div>
                <span className="text-xs font-mono text-zinc-500 font-semibold">{selectedStep.type}</span>
              </div>

              {/* Span Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm font-mono">
                <div className="p-3 rounded-lg bg-white border border-zinc-200 shadow-2xs">
                  <span className="text-zinc-500 text-xs font-medium">Latency</span>
                  <div className="text-zinc-900 font-bold mt-1 text-base">{selectedStep.latency_ms} ms</div>
                </div>
                <div className="p-3 rounded-lg bg-white border border-zinc-200 shadow-2xs">
                  <span className="text-zinc-500 text-xs font-medium">Status</span>
                  <div
                    className={`font-bold mt-1 text-base ${
                      selectedStep.status === 'ERROR' ? 'text-rose-600' : 'text-emerald-600'
                    }`}
                  >
                    {selectedStep.status}
                  </div>
                </div>
              </div>

              {/* Error Traceback if Error */}
              {selectedStep.error_message && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-sm font-mono text-rose-900">
                  <span className="text-rose-700 font-bold block mb-1">// Rejection Traceback:</span>
                  {selectedStep.error_message}
                </div>
              )}

              {/* Input Arguments */}
              {selectedStep.arguments && (
                <div>
                  <span className="text-xs font-mono uppercase text-zinc-500 block mb-1.5 font-bold">
                    Arguments (JSON)
                  </span>
                  <pre className="p-3 rounded-lg bg-white border border-zinc-200 font-mono text-xs text-zinc-800 overflow-x-auto shadow-2xs leading-relaxed">
                    {JSON.stringify(selectedStep.arguments, null, 2)}
                  </pre>
                </div>
              )}

              {/* Tool Execution Output */}
              {selectedStep.output && (
                <div>
                  <span className="text-xs font-mono uppercase text-zinc-500 block mb-1.5 font-bold">
                    Captured Output
                  </span>
                  <pre className="p-3 rounded-lg bg-white border border-zinc-200 font-mono text-xs text-emerald-800 overflow-x-auto shadow-2xs leading-relaxed">
                    {JSON.stringify(selectedStep.output, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Ingest Action CTA */}
            <div className="pt-4 border-t border-zinc-200 mt-4">
              <button
                onClick={onProceedToReplay}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
              >
                <span>Open in Replay IDE</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

      {/* YAML Spec View */}
      {viewMode === 'schema_spec' && (
        <div className="p-6 bg-white">
          <pre className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-sm text-zinc-800 overflow-x-auto leading-relaxed">
{`# Generated by Lemma Replay Guard
schema_version: "v1.0"
eval_id: "eval_${selectedTrace.id}"
source_trace_id: "${selectedTrace.trace_id}"
agent_id: "${selectedTrace.agent_id}"

baseline:
  model: "${selectedTrace.steps[0].model || 'gpt-4o'}"
  total_latency_ms: ${selectedTrace.baseline_metrics.latency_ms}
  total_tokens: ${selectedTrace.baseline_metrics.tokens}
  cost_usd: ${selectedTrace.baseline_metrics.cost_usd}
  status: "FAILED"

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

      {/* Raw JSON View */}
      {viewMode === 'raw_otel' && (
        <div className="p-6 bg-white">
          <pre className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 font-mono text-sm text-zinc-800 overflow-x-auto leading-relaxed">
            {JSON.stringify(selectedTrace, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
};
