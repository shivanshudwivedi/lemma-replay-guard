import React, { useState, useEffect } from 'react';
import { Search, Terminal, Cpu, ShieldCheck, Activity, ArrowRight } from 'lucide-react';
import { SAMPLE_TRACES, SampleTraceData } from '../data/sampleTraces';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrace: (trace: SampleTraceData) => void;
  onOpenExportModal: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTrace,
  onOpenExportModal,
  onScrollToSection,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTraces = SAMPLE_TRACES.filter(
    (t) =>
      t.name.toLowerCase().includes(query.toLowerCase()) ||
      t.agent_id.toLowerCase().includes(query.toLowerCase()) ||
      t.failure_type.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
      <div className="w-full max-w-xl rounded-xl bg-white border border-zinc-200 shadow-2xl overflow-hidden text-zinc-900">
        
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-2.5 border-b border-zinc-200 gap-2.5 bg-white">
          <Search className="w-4 h-4 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search traces, actions..."
            className="flex-1 bg-transparent border-none outline-none text-xs font-mono text-zinc-900 placeholder-zinc-400"
            autoFocus
          />
          <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-500 border border-zinc-200">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 bg-white">
          
          {/* Traces Group */}
          <div className="px-2.5 py-1 text-[11px] font-mono font-semibold uppercase text-zinc-400">
            Production Traces ({filteredTraces.length})
          </div>

          {filteredTraces.map((trace) => (
            <button
              key={trace.id}
              onClick={() => {
                onSelectTrace(trace);
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-100 text-left transition-colors group"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 group-hover:text-emerald-700 transition-colors">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-zinc-900">{trace.name}</span>
                    <span className="text-[11px] font-mono text-zinc-500">({trace.agent_id})</span>
                  </div>
                  <p className="text-xs text-zinc-500 font-sans line-clamp-1">{trace.failure_summary}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded-full border font-medium ${trace.failure_badge_color}`}>
                  {trace.failure_type}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-700 transition-colors" />
              </div>
            </button>
          ))}

          {/* Quick Actions Group */}
          <div className="pt-2 px-2.5 py-1 text-[11px] font-mono font-semibold uppercase text-zinc-400 border-t border-zinc-100">
            Quick Actions
          </div>

          <button
            onClick={() => {
              onScrollToSection('ide');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-100 text-left transition-colors group"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
              <Cpu className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-900">Open Replay & Patch IDE</div>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-500 border border-zinc-200">
              G R
            </kbd>
          </button>

          <button
            onClick={() => {
              onScrollToSection('ci-matrix');
              onClose();
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-100 text-left transition-colors group"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-900">View CI Matrix & PR Comment</div>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-500 border border-zinc-200">
              G C
            </kbd>
          </button>

          <button
            onClick={() => {
              onOpenExportModal();
              onClose();
            }}
            className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-100 text-left transition-colors group"
          >
            <div className="w-6 h-6 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700">
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <div className="text-xs font-medium text-zinc-900">Export CLI & GitHub Actions Config</div>
            </div>
            <kbd className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-100 text-zinc-500 border border-zinc-200">
              G E
            </kbd>
          </button>

        </div>

        {/* Footer */}
        <div className="px-4 py-1.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
          <span>Navigate with ↑↓ • Select with ↵</span>
          <span>Lemma DevTools</span>
        </div>

      </div>
    </div>
  );
};
