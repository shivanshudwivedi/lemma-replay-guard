import React from 'react';
import { Server, ShieldAlert, Lock, Cpu, GitPullRequest } from 'lucide-react';

export const ArchitectureGraph: React.FC = () => {
  return (
    <section id="architecture" className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10 relative">
      
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-mono uppercase text-zinc-600 mb-1">
          <span className="h-2 w-2 rounded-full bg-zinc-900"></span>
          Pipeline Architecture
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Closed Telemetry-to-Eval Engine
        </h2>
        <p className="text-sm text-zinc-600 mt-1 font-normal">
          How Lemma bridges production observability traces into immutable CI/CD regression suites.
        </p>
      </div>

      {/* 5-Stage Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Stage 1 */}
        <div className="p-5 rounded-xl devtools-panel bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-3">
              <Server className="w-5 h-5 text-zinc-700" />
            </div>
            <span className="text-xs font-mono uppercase text-zinc-400 font-bold">Stage 01</span>
            <h4 className="text-sm font-bold text-zinc-900 mt-1">Production Agent</h4>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
              Captures runtime silent failures and tool arguments.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-zinc-100 text-xs font-mono text-zinc-500 font-medium">
            OpenInference / OTel
          </div>
        </div>

        {/* Stage 2 */}
        <div className="p-5 rounded-xl devtools-panel bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-3">
              <ShieldAlert className="w-5 h-5 text-zinc-700" />
            </div>
            <span className="text-xs font-mono uppercase text-zinc-400 font-bold">Stage 02</span>
            <h4 className="text-sm font-bold text-zinc-900 mt-1">Lemma Ingestion</h4>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
              Extracts prompts, schemas, and creates <code>.lemma.yaml</code>.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-zinc-100 text-xs font-mono text-zinc-500 font-medium">
            Auto-Mock Synthesis
          </div>
        </div>

        {/* Stage 3 */}
        <div className="p-5 rounded-xl devtools-panel bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-3">
              <Lock className="w-5 h-5 text-zinc-700" />
            </div>
            <span className="text-xs font-mono uppercase text-zinc-400 font-bold">Stage 03</span>
            <h4 className="text-sm font-bold text-zinc-900 mt-1">Zero-FX Sandbox</h4>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
              Mocks Stripe, SQL, and Webhooks without side-effects.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-zinc-100 text-xs font-mono text-zinc-500 font-medium">
            Strict Schema Guard
          </div>
        </div>

        {/* Stage 4 */}
        <div className="p-5 rounded-xl devtools-panel bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-3">
              <Cpu className="w-5 h-5 text-zinc-700" />
            </div>
            <span className="text-xs font-mono uppercase text-zinc-400 font-bold">Stage 04</span>
            <h4 className="text-sm font-bold text-zinc-900 mt-1">Deterministic Replay</h4>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
              Replays prompt patch against deterministic mocks.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-zinc-100 text-xs font-mono text-zinc-500 font-medium">
            Δ Latency & Cost
          </div>
        </div>

        {/* Stage 5 */}
        <div className="p-5 rounded-xl devtools-panel bg-white flex flex-col justify-between shadow-xs">
          <div>
            <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-800 mb-3">
              <GitPullRequest className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-xs font-mono uppercase text-zinc-400 font-bold">Stage 05</span>
            <h4 className="text-sm font-bold text-zinc-900 mt-1">CI Gate Bot</h4>
            <p className="text-xs sm:text-sm text-zinc-600 mt-1.5 leading-relaxed">
              Gates PR merges in GitHub Actions with diff summaries.
            </p>
          </div>
          <div className="mt-4 pt-2.5 border-t border-zinc-100 text-xs font-mono text-zinc-500 font-medium">
            Exit Code 0 / 1 Gate
          </div>
        </div>

      </div>

    </section>
  );
};
