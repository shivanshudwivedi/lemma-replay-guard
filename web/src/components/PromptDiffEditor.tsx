import React, { useState } from 'react';
import { SampleTraceData } from '../data/sampleTraces';
import { Code2, Wand2 } from 'lucide-react';

interface PromptDiffEditorProps {
  selectedTrace: SampleTraceData;
  activePrompt: string;
  onChangePrompt: (newPrompt: string) => void;
  promptMode: 'patched' | 'original' | 'custom';
  onChangePromptMode: (mode: 'patched' | 'original' | 'custom') => void;
  selectedModel: string;
  onChangeModel: (model: string) => void;
}

export const PromptDiffEditor: React.FC<PromptDiffEditorProps> = ({
  selectedTrace,
  activePrompt,
  onChangePrompt,
  promptMode,
  onChangePromptMode,
  selectedModel,
  onChangeModel,
}) => {
  const [diffView, setDiffView] = useState<'split' | 'unified'>('split');

  const origLines = selectedTrace.system_prompt_original.split('\n');
  const patchedLines = selectedTrace.system_prompt_patched.split('\n');

  return (
    <div className="rounded-xl devtools-panel overflow-hidden bg-white">
      
      {/* Top IDE Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-zinc-200 bg-zinc-50/70 gap-3">
        
        {/* Left: Title & Mode Selector */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm font-mono font-bold text-zinc-900">
            <Code2 className="w-4 h-4 text-emerald-600" />
            <span>Prompt Diff IDE</span>
          </div>

          <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg text-xs font-mono">
            <button
              onClick={() => onChangePromptMode('patched')}
              className={`px-3 py-1 rounded-md transition-colors ${
                promptMode === 'patched'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Patched (Fixed)
            </button>
            <button
              onClick={() => onChangePromptMode('original')}
              className={`px-3 py-1 rounded-md transition-colors ${
                promptMode === 'original'
                  ? 'bg-white text-rose-800 font-bold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Original (Failing)
            </button>
            <button
              onClick={() => onChangePromptMode('custom')}
              className={`px-3 py-1 rounded-md transition-colors ${
                promptMode === 'custom'
                  ? 'bg-white text-zinc-900 font-bold shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900'
              }`}
            >
              Custom Edit
            </button>
          </div>
        </div>

        {/* Right: Model Switcher & Diff View Mode */}
        <div className="flex items-center gap-4">
          
          {/* Model Selector */}
          <div className="flex items-center gap-2 text-sm font-mono">
            <span className="text-zinc-600 font-medium">Model:</span>
            <select
              value={selectedModel}
              onChange={(e) => onChangeModel(e.target.value)}
              className="bg-white border border-zinc-200 text-zinc-800 rounded-md px-2.5 py-1 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs cursor-pointer"
            >
              <option value="gpt-4o">gpt-4o</option>
              <option value="claude-3-5-sonnet">claude-3-5-sonnet</option>
              <option value="gpt-4o-mini">gpt-4o-mini</option>
              <option value="deepseek-v3">deepseek-v3</option>
            </select>
          </div>

          <div className="flex items-center gap-1 bg-zinc-200/70 p-1 rounded-lg text-xs font-mono">
            <button
              onClick={() => setDiffView('split')}
              className={`px-2.5 py-1 rounded-md ${diffView === 'split' ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-600'}`}
            >
              Split
            </button>
            <button
              onClick={() => setDiffView('unified')}
              className={`px-2.5 py-1 rounded-md ${diffView === 'unified' ? 'bg-white text-zinc-900 font-bold shadow-2xs' : 'text-zinc-600'}`}
            >
              Unified
            </button>
          </div>

        </div>

      </div>

      {/* Editor Body */}
      {promptMode === 'custom' ? (
        <div className="p-5 bg-white">
          <div className="flex items-center justify-between text-sm font-mono text-zinc-500 mb-2">
            <span>// System Prompt</span>
            <span>{activePrompt.length} chars • ~{Math.ceil(activePrompt.length / 4)} tokens</span>
          </div>
          <textarea
            value={activePrompt}
            onChange={(e) => onChangePrompt(e.target.value)}
            rows={9}
            className="w-full p-4 rounded-lg bg-zinc-50 border border-zinc-200 text-sm font-mono text-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-400 resize-none leading-relaxed"
          />
        </div>
      ) : diffView === 'split' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-200 bg-white text-sm font-mono leading-relaxed">
          
          {/* Left: Original (Failing) */}
          <div className="p-5">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100 text-zinc-600 text-xs">
              <span className="text-rose-700 font-bold uppercase tracking-wider">Original Prompt (Failing)</span>
              <span>{origLines.length} lines</span>
            </div>
            <div className="space-y-1">
              {origLines.map((line, idx) => (
                <div key={idx} className="flex items-start gap-3 text-zinc-500">
                  <span className="text-zinc-400 select-none w-6 text-right shrink-0">{idx + 1}</span>
                  <span className="text-zinc-800">{line || '\u00A0'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Patched (Resolved) */}
          <div className="p-5 bg-emerald-50/20">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-zinc-100 text-zinc-600 text-xs">
              <span className="text-emerald-800 font-bold uppercase tracking-wider">Patched Prompt (Fixed)</span>
              <span>{patchedLines.length} lines</span>
            </div>
            <div className="space-y-1">
              {patchedLines.map((line, idx) => {
                const isNew = idx >= origLines.length || !origLines.includes(line);
                return (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 ${
                      isNew ? 'bg-emerald-100/80 text-emerald-950 font-semibold px-2 py-0.5 rounded -mx-2' : 'text-zinc-500'
                    }`}
                  >
                    <span className="text-zinc-400 select-none w-6 text-right shrink-0">{idx + 1}</span>
                    <span className={isNew ? 'text-emerald-950 font-semibold' : 'text-zinc-800'}>
                      {isNew ? `+ ${line}` : line || '\u00A0'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      ) : (
        /* Unified View */
        <div className="p-5 bg-white text-sm font-mono space-y-1 leading-relaxed">
          {patchedLines.map((line, idx) => {
            const isNew = idx >= origLines.length || !origLines.includes(line);
            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-1.5 rounded ${
                  isNew ? 'bg-emerald-100/80 text-emerald-950 font-semibold' : 'text-zinc-800'
                }`}
              >
                <span className="text-zinc-400 select-none w-7 text-right shrink-0">{idx + 1}</span>
                <span>{isNew ? `+ ${line}` : `  ${line}`}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Fix Toolbar */}
      <div className="px-5 py-3 border-t border-zinc-200 bg-zinc-50/70 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex items-center gap-2.5">
          <Wand2 className="w-4 h-4 text-emerald-600" />
          <button
            onClick={() => {
              onChangePrompt(selectedTrace.system_prompt_patched);
              onChangePromptMode('patched');
            }}
            className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-zinc-100 border border-zinc-200 text-zinc-800 text-xs font-mono transition-colors shadow-2xs font-bold cursor-pointer"
          >
            Auto-Inject Schema Guard
          </button>
        </div>

        <div className="text-xs font-mono text-zinc-600">
          Target: <span className="text-emerald-700 font-bold">Zero Side-Effect Replay</span>
        </div>
      </div>

    </div>
  );
};
