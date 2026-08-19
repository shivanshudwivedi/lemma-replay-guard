import React from 'react';
import { Play, Terminal, Activity } from 'lucide-react';
import { SAMPLE_TRACES, SampleTraceData } from '../data/sampleTraces';

interface HeroSectionProps {
  selectedTrace: SampleTraceData;
  onSelectTrace: (trace: SampleTraceData) => void;
  onStartReplay: () => void;
  onOpenExportModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  selectedTrace,
  onSelectTrace,
  onStartReplay,
  onOpenExportModal,
}) => {
  return (
    <section id="hero" className="pt-8 pb-4 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-zinc-200 text-xs sm:text-sm font-mono text-zinc-500 gap-2">
        <div className="flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          <span className="text-zinc-800 font-semibold">YC F25 • Pre-Seed $2.3M</span>
          <span className="text-zinc-300">|</span>
          <span className="text-zinc-600">Built for Jerry Zhang & Cole Gawin</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-zinc-900 font-bold">1,000,000+</span> production traces triaged daily
        </div>
      </div>

      {/* Main Title & Action Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-zinc-900 leading-tight">
            Production Telemetry to CI Regression Guard
          </h1>
          <p className="text-base sm:text-lg text-zinc-600 mt-2 font-normal leading-relaxed">
            Turn runtime silent failures into immutable, zero side-effect regression tests.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onStartReplay}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Launch Replay IDE</span>
          </button>

          <button
            onClick={onOpenExportModal}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 text-sm font-mono font-semibold transition-all hover:border-zinc-300 shadow-2xs cursor-pointer"
          >
            <Terminal className="w-4 h-4 text-emerald-600" />
            <span>CI / MCP Config</span>
          </button>
        </div>
      </div>

      {/* Production Trace Selector Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SAMPLE_TRACES.map((trace) => {
          const isSelected = trace.id === selectedTrace.id;
          return (
            <div
              key={trace.id}
              onClick={() => onSelectTrace(trace)}
              className={`p-4 sm:p-5 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-zinc-50/80 border-zinc-900 ring-2 ring-zinc-900/10 shadow-sm'
                  : 'bg-white border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50/50'
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-bold text-zinc-900 text-sm">{trace.name}</span>
                <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border font-bold ${trace.failure_badge_color}`}>
                  {trace.failure_type}
                </span>
              </div>
              <p className="text-sm text-zinc-600 line-clamp-2 font-sans leading-relaxed">{trace.failure_summary}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-mono text-zinc-500 pt-2 border-t border-zinc-100">
                <span className="text-zinc-600 font-medium">{trace.agent_id}</span>
                <span className="text-emerald-700 font-bold text-xs">{trace.baseline_metrics.latency_ms}ms</span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
