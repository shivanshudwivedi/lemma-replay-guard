import React, { useState, useEffect } from 'react';
import { SampleTraceData } from '../data/sampleTraces';
import { Play, RotateCcw, CheckCircle2, XCircle, Terminal, ShieldCheck } from 'lucide-react';

interface ExecutionConsoleProps {
  selectedTrace: SampleTraceData;
  activePrompt: string;
  promptMode: 'patched' | 'original' | 'custom';
  selectedModel: string;
  onProceedToCiMatrix: () => void;
}

export const ExecutionConsole: React.FC<ExecutionConsoleProps> = ({
  selectedTrace,
  activePrompt,
  promptMode,
  selectedModel,
  onProceedToCiMatrix,
}) => {
  const [isReplaying, setIsReplaying] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [replayFinished, setReplayFinished] = useState(false);
  const [replayPassed, setReplayPassed] = useState(true);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 4>(1);

  useEffect(() => {
    setReplayFinished(false);
    setCurrentStepIndex(-1);
  }, [selectedTrace, promptMode]);

  const handleRunReplay = () => {
    setIsReplaying(true);
    setReplayFinished(false);
    setCurrentStepIndex(0);

    const willPass = promptMode !== 'original';
    setReplayPassed(willPass);

    const totalSteps = selectedTrace.steps.length;
    let step = 0;
    const intervalTime = Math.max(140, 500 / replaySpeed);

    const interval = setInterval(() => {
      step += 1;
      setCurrentStepIndex(step);

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsReplaying(false);
        setReplayFinished(true);
      }
    }, intervalTime);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* Left: Terminal Console Logs (7 cols) */}
      <div className="lg:col-span-7 rounded-xl devtools-panel overflow-hidden flex flex-col justify-between bg-zinc-950 border border-zinc-800 text-zinc-100">
        
        <div>
          {/* Console Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-900/90">
            <div className="flex items-center gap-2.5">
              <Terminal className="w-4 h-4 text-zinc-400" />
              <span className="text-sm font-mono font-bold text-zinc-200">
                Sandbox Console
              </span>
            </div>

            {/* Speed & Replay Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center bg-zinc-950 rounded-md border border-zinc-800 text-xs font-mono">
                <button
                  onClick={() => setReplaySpeed(1)}
                  className={`px-2.5 py-1 rounded ${replaySpeed === 1 ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500'}`}
                >
                  1x
                </button>
                <button
                  onClick={() => setReplaySpeed(2)}
                  className={`px-2.5 py-1 rounded ${replaySpeed === 2 ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500'}`}
                >
                  2x
                </button>
                <button
                  onClick={() => setReplaySpeed(4)}
                  className={`px-2.5 py-1 rounded ${replaySpeed === 4 ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500'}`}
                >
                  4x
                </button>
              </div>

              <button
                onClick={handleRunReplay}
                disabled={isReplaying}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-mono font-bold transition-all cursor-pointer ${
                  isReplaying
                    ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-xs'
                }`}
              >
                {isReplaying ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Running...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current" />
                    <span>Run Replay</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Terminal Body */}
          <div className="p-5 bg-zinc-950 font-mono text-sm text-zinc-300 space-y-2.5 min-h-[320px] overflow-y-auto leading-relaxed">
            
            <div className="text-zinc-500">
              [00:00.000] <span className="text-zinc-400 font-bold">INIT</span> session_id=sess_99318 sandboxed=true zero_side_effects=enabled
            </div>

            <div className="text-zinc-500">
              [00:00.015] <span className="text-emerald-400 font-bold">INGEST</span> trace_id={selectedTrace.trace_id} agent_id={selectedTrace.agent_id}
            </div>

            {selectedTrace.steps.map((step, idx) => {
              const isExecuted = (isReplaying && currentStepIndex >= idx) || replayFinished;
              if (!isExecuted) return null;

              const isFailing = step.status === 'ERROR' && promptMode === 'original';
              const isResolved = step.status === 'ERROR' && promptMode !== 'original';

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-start gap-2.5">
                    <span className="text-zinc-600 font-mono">[00:0{idx + 1}.{(idx * 180 + 120) % 1000}]</span>
                    {step.type === 'LLM_CALL' ? (
                      <div>
                        <span className="text-zinc-200 font-bold">LLM_CALL</span> model={selectedModel} latency={step.latency_ms}ms tokens={step.tokens?.total_tokens}
                      </div>
                    ) : (
                      <div>
                        <span className="text-zinc-200 font-bold">TOOL_MOCK</span> tool={step.name}
                        {isFailing && (
                          <span className="text-rose-400 font-bold block mt-1">
                            ✖ REJECTION: {step.error_message}
                          </span>
                        )}
                        {isResolved && (
                          <span className="text-emerald-400 font-semibold block mt-1">
                            ✔ SUCCESS: response={'{ refund_id: "re_mock_993182", status: "succeeded" }'}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {replayFinished && (
              <div className="pt-3 border-t border-zinc-800 text-sm font-mono">
                {replayPassed ? (
                  <span className="text-emerald-400 font-bold">
                    ✔ VERIFIED: All 4 assertions passed. Zero side-effects triggered. Exit Code: 0
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold">
                    ✖ FAILED: Parameter schema rejection. Exit Code: 1
                  </span>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Console Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-800 bg-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>Deterministic Mock Engine</span>
          <span>Zero Network I/O Sandbox</span>
        </div>

      </div>

      {/* Right: Regression Assertion Matrix (5 cols) */}
      <div className="lg:col-span-5 rounded-xl devtools-panel p-5 sm:p-6 flex flex-col justify-between bg-white">
        
        <div>
          <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-zinc-200">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm font-mono font-bold uppercase text-zinc-900">
                Assertions ({selectedTrace.assertions.length})
              </h4>
            </div>

            {replayFinished && (
              <span
                className={`text-xs font-mono px-3 py-1 rounded-full font-bold border ${
                  replayPassed
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {replayPassed ? '4/4 PASSED' : 'FAILED'}
              </span>
            )}
          </div>

          {/* Assertion Checklist */}
          <div className="space-y-3">
            {selectedTrace.assertions.map((a, idx) => {
              let statusIcon = <div className="w-4 h-4 rounded-full border border-zinc-300 shrink-0" />;
              if (replayFinished) {
                if (replayPassed) {
                  statusIcon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
                } else {
                  statusIcon = idx === 2 || idx === 1 ? (
                    <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  );
                }
              }

              return (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200/80 flex items-start gap-3 text-sm"
                >
                  <div className="mt-0.5">{statusIcon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-mono font-bold text-zinc-900">{a.rule}</span>
                      <span className="text-xs font-mono text-zinc-500 uppercase font-semibold">{a.type}</span>
                    </div>
                    <p className="text-zinc-600 text-sm font-sans leading-relaxed">{a.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA to CI Matrix */}
        {replayFinished && (
          <div className="pt-4 border-t border-zinc-200 mt-4">
            <button
              onClick={onProceedToCiMatrix}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
            >
              <span>View CI Matrix & PR Comment</span>
            </button>
          </div>
        )}

      </div>

    </div>
  );
};
