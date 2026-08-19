import React, { useState, useEffect } from 'react';
import { SampleTraceData } from '../data/sampleTraces';
import { Play, CheckCircle2, XCircle, RotateCcw, Cpu, Sparkles, Zap, ShieldCheck, ArrowRight, CornerDownRight, Check, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReplayStudioProps {
  selectedTrace: SampleTraceData;
  onProceedToCiMatrix: () => void;
}

export const ReplayStudio: React.FC<ReplayStudioProps> = ({
  selectedTrace,
  onProceedToCiMatrix,
}) => {
  const [promptMode, setPromptMode] = useState<'patched' | 'original' | 'custom'>('patched');
  const [customPrompt, setCustomPrompt] = useState<string>(selectedTrace.system_prompt_patched);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');
  
  // Replay execution states
  const [isReplaying, setIsReplaying] = useState<boolean>(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [replayFinished, setReplayFinished] = useState<boolean>(false);
  const [replayPassed, setReplayPassed] = useState<boolean>(true);

  // Update prompt when trace changes
  useEffect(() => {
    setCustomPrompt(selectedTrace.system_prompt_patched);
    setPromptMode('patched');
    setReplayFinished(false);
    setCurrentStepIndex(-1);
  }, [selectedTrace]);

  const activePrompt =
    promptMode === 'patched'
      ? selectedTrace.system_prompt_patched
      : promptMode === 'original'
      ? selectedTrace.system_prompt_original
      : customPrompt;

  const handleRunReplay = () => {
    setIsReplaying(true);
    setReplayFinished(false);
    setCurrentStepIndex(0);

    const willPass = promptMode !== 'original';
    setReplayPassed(willPass);

    // Step-by-step replay animation
    const totalSteps = selectedTrace.steps.length;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      setCurrentStepIndex(step);

      if (step >= totalSteps) {
        clearInterval(interval);
        setIsReplaying(false);
        setReplayFinished(true);

        if (willPass) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#10b981', '#06b6d4', '#8b5cf6'],
          });
        }
      }
    }, 450);
  };

  return (
    <section id="replay" className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-cyan-400 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400"></span>
            Replay & Patch Debugger
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Deterministic Agent Replay Studio
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Apply prompt patches or switch models, then replay agent execution against zero-side-effect deterministic mocks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunReplay}
            disabled={isReplaying}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
              isReplaying
                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-500/20'
            }`}
          >
            {isReplaying ? (
              <>
                <RotateCcw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>Replaying Agent Path...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute Replay Test</span>
              </>
            )}
          </button>

          {replayFinished && (
            <button
              onClick={onProceedToCiMatrix}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs transition-all shadow-md shadow-violet-500/20"
            >
              <span>View CI Matrix</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Grid: Left Prompt Patcher / Right DAG Replay Visualizer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Prompt Patching & Model Config (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="rounded-2xl glass-panel border border-slate-800/80 p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Prompt Patching Harness
              </h3>

              {/* Model Selector */}
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="text-xs font-mono bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              >
                <option value="gpt-4o">gpt-4o (Default)</option>
                <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
                <option value="gpt-4o-mini">gpt-4o-mini</option>
                <option value="deepseek-v3">deepseek-v3</option>
              </select>
            </div>

            {/* Prompt Mode Buttons */}
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setPromptMode('patched')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                  promptMode === 'patched'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Patched (Fixed)
              </button>
              <button
                onClick={() => setPromptMode('original')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                  promptMode === 'original'
                    ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Original (Failing)
              </button>
              <button
                onClick={() => setPromptMode('custom')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                  promptMode === 'custom'
                    ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-400 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                Custom Edit
              </button>
            </div>

            {/* System Prompt Textarea */}
            <div className="relative">
              <textarea
                value={activePrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  setPromptMode('custom');
                }}
                rows={9}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-xs font-mono text-slate-200 focus:ring-1 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
                placeholder="Enter system prompt instructions..."
              />
              {promptMode === 'patched' && (
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  Schema Guard Injected
                </div>
              )}
            </div>

            {/* User Input Preview */}
            <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
              <span className="font-mono text-slate-500">// Simulated User Prompt:</span>
              <p className="mt-1 text-slate-200 font-medium">"{selectedTrace.user_input}"</p>
            </div>

          </div>

          {/* Assertions Evaluation Checklist */}
          <div className="rounded-2xl glass-panel border border-slate-800/80 p-5 shadow-xl">
            <h3 className="font-semibold text-sm text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-violet-400" />
                Regression Guard Assertions ({selectedTrace.assertions.length})
              </span>
              {replayFinished && (
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded font-bold ${
                    replayPassed ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                  }`}
                >
                  {replayPassed ? 'ALL ASSERTIONS PASSED (4/4)' : 'ASSERTION FAILED'}
                </span>
              )}
            </h3>

            <div className="space-y-2">
              {selectedTrace.assertions.map((a, idx) => {
                let statusIcon = <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />;
                if (replayFinished) {
                  if (replayPassed) {
                    statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                  } else {
                    // If failing prompt, highlight the schema assertion failure
                    statusIcon = idx === 2 || idx === 1
                      ? <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
                  }
                }

                return (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex items-start gap-2.5 text-xs"
                  >
                    <div className="mt-0.5">{statusIcon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-semibold text-slate-200">{a.rule}</span>
                        <span className="text-[10px] text-slate-500 uppercase">{a.type}</span>
                      </div>
                      <p className="text-slate-400 text-[11px] mt-0.5">{a.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Interactive DAG Node Replay Visualizer (7 cols) */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl glass-panel border border-slate-800/80 p-6 shadow-xl h-full flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <h3 className="font-semibold text-sm text-white">
                    Agent Execution DAG Visualizer
                  </h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="flex h-2 w-2 rounded-full bg-cyan-400"></span>
                  <span className="text-slate-400">Deterministic Mock Sandbox</span>
                </div>
              </div>

              {/* Progress Bar during Replay */}
              {isReplaying && (
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-6">
                  <div
                    className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-violet-400 h-full transition-all duration-300"
                    style={{
                      width: `${((currentStepIndex + 1) / selectedTrace.steps.length) * 100}%`,
                    }}
                  />
                </div>
              )}

              {/* DAG Nodes */}
              <div className="space-y-4 relative before:absolute before:left-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-800 before:z-0">
                
                {/* Node 0: User Input */}
                <div className="relative z-10 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 font-mono text-xs shrink-0 shadow-md">
                    IN
                  </div>
                  <div className="flex-1 p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-emerald-400 font-semibold">User Message Ingest</span>
                      <span className="text-slate-500 font-mono text-[10px]">t = 0ms</span>
                    </div>
                    <p className="text-slate-200">{selectedTrace.user_input}</p>
                  </div>
                </div>

                {/* Steps Nodes */}
                {selectedTrace.steps.map((step, idx) => {
                  const isCurrent = isReplaying && currentStepIndex === idx;
                  const isExecuted = (isReplaying && currentStepIndex >= idx) || replayFinished;
                  const isFailingStep = step.status === 'ERROR' && promptMode === 'original';
                  const isResolvedStep = step.status === 'ERROR' && promptMode !== 'original';

                  return (
                    <div key={idx} className="relative z-10 flex items-start gap-4">
                      
                      {/* Step Circle */}
                      <div
                        className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-xs shrink-0 transition-all ${
                          isCurrent
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse shadow-lg shadow-cyan-500/20'
                            : isExecuted
                            ? isFailingStep
                              ? 'bg-rose-950/40 border-rose-500 text-rose-400'
                              : 'bg-emerald-950/30 border-emerald-500 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}
                      >
                        #{step.step_index}
                      </div>

                      {/* Step Card */}
                      <div
                        className={`flex-1 p-3.5 rounded-xl border transition-all text-xs ${
                          isCurrent
                            ? 'bg-slate-800/90 border-cyan-500/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                            : isExecuted
                            ? isFailingStep
                              ? 'bg-rose-950/20 border-rose-800/60'
                              : isResolvedStep
                              ? 'bg-emerald-950/20 border-emerald-800/60'
                              : 'bg-slate-900/80 border-slate-800'
                            : 'bg-slate-950/40 border-slate-900 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-white">
                              {step.type}
                            </span>
                            {step.name && (
                              <span className="font-mono text-cyan-400 text-[11px] bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                                {step.name}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                            <span>{isResolvedStep ? '45ms (Mock)' : `${step.latency_ms}ms`}</span>
                            {isExecuted && (
                              <span
                                className={`px-1.5 py-0.5 rounded font-bold ${
                                  isFailingStep
                                    ? 'bg-rose-500/20 text-rose-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {isFailingStep ? 'MOCK REJECTED' : 'MOCK PASSED'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Step Details */}
                        {isExecuted && (
                          <div className="mt-2 text-slate-300 font-mono text-[11px] bg-slate-950/80 p-2 rounded border border-slate-800/80">
                            {isResolvedStep ? (
                              <div className="text-emerald-300">
                                <span className="text-slate-500">// Zero Side-Effect Mock Response:</span>
                                <div>{`{ refund_id: "re_mock_993182", status: "succeeded", amount: 4900 }`}</div>
                              </div>
                            ) : isFailingStep ? (
                              <div className="text-rose-400">
                                <span className="font-bold">// Fatal Schema Error:</span> {step.error_message}
                              </div>
                            ) : (
                              <div>
                                <span className="text-slate-500">// Args: </span>
                                <span>{JSON.stringify(step.arguments)}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Final Completion Node */}
                {replayFinished && (
                  <div className="relative z-10 flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center font-mono text-xs shrink-0 shadow-md ${
                        replayPassed
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-rose-500/20 border-rose-400 text-rose-300'
                      }`}
                    >
                      {replayPassed ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div
                      className={`flex-1 p-4 rounded-xl border text-xs ${
                        replayPassed
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-slate-200'
                          : 'bg-rose-950/20 border-rose-500/40 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-white uppercase">
                          {replayPassed ? 'Replay Verified • Zero Regressions' : 'Replay Failed • Regression Active'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">Exit Code: {replayPassed ? '0' : '1'}</span>
                      </div>
                      <p className="mt-1 text-slate-300">
                        {replayPassed
                          ? 'All deterministic tool mocks executed cleanly. System prompt patch resolved parameter hallucination without side-effects.'
                          : 'Agent executed hallucinated parameters against mock harness. Gating failure in CI.'}
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Bottom Metrics Bar */}
            <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  Model: <span className="text-white">{selectedModel}</span>
                </span>
                <span className="text-slate-400">
                  Mock Dispatcher: <span className="text-emerald-400">Zero Side-Effect</span>
                </span>
              </div>
              <div className="text-slate-400">
                Sandboxed APIs: <span className="text-cyan-400">Stripe, DB, GitHub</span>
              </div>
            </div>

          </div>
        </div>

      </div>

    </section>
  );
};
