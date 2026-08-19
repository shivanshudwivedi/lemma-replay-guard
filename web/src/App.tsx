import React, { useState, useEffect } from 'react';
import { SAMPLE_TRACES, SampleTraceData } from './data/sampleTraces';
import { AmbientBackground } from './components/AmbientBackground';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { TraceWaterfall } from './components/TraceWaterfall';
import { PromptDiffEditor } from './components/PromptDiffEditor';
import { ExecutionConsole } from './components/ExecutionConsole';
import { CIRegressionMatrix } from './components/CIRegressionMatrix';
import { ArchitectureGraph } from './components/ArchitectureGraph';
import { McpCliExportModal } from './components/McpCliExportModal';
import { CommandPalette } from './components/CommandPalette';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [selectedTrace, setSelectedTrace] = useState<SampleTraceData>(SAMPLE_TRACES[0]);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Prompt patch IDE state
  const [promptMode, setPromptMode] = useState<'patched' | 'original' | 'custom'>('patched');
  const [customPrompt, setCustomPrompt] = useState<string>(SAMPLE_TRACES[0].system_prompt_patched);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o');

  // Reset custom prompt when selected trace changes
  useEffect(() => {
    setCustomPrompt(selectedTrace.system_prompt_patched);
    setPromptMode('patched');
  }, [selectedTrace]);

  // Global Keyboard Shortcuts (Cmd+K, Ctrl+K, G-key chords)
  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.key === 'Escape') {
          target.blur();
        }
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      const now = Date.now();
      const key = e.key.toLowerCase();

      if (key === 'g') {
        lastKey = 'g';
        lastKeyTime = now;
        return;
      }

      if (lastKey === 'g' && now - lastKeyTime < 1000) {
        if (key === 'w') {
          e.preventDefault();
          scrollToSection('waterfall');
        } else if (key === 'r') {
          e.preventDefault();
          scrollToSection('ide');
        } else if (key === 'c') {
          e.preventDefault();
          scrollToSection('ci-matrix');
        } else if (key === 'e') {
          e.preventDefault();
          setIsExportModalOpen(true);
        }
        lastKey = '';
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  const activePrompt =
    promptMode === 'patched'
      ? selectedTrace.system_prompt_patched
      : promptMode === 'original'
      ? selectedTrace.system_prompt_original
      : customPrompt;

  const scrollToSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative min-h-screen bg-[#fafafa] text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* Subtle Background */}
      <AmbientBackground />

      {/* Navbar */}
      <Navbar
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onScrollToSection={scrollToSection}
      />

      {/* Main Content */}
      <main className="relative z-10 space-y-8">
        {/* 1. Hero & Active Traces */}
        <HeroSection
          selectedTrace={selectedTrace}
          onSelectTrace={(t) => setSelectedTrace(t)}
          onStartReplay={() => scrollToSection('ide')}
          onOpenExportModal={() => setIsExportModalOpen(true)}
        />

        {/* 2. Trace Waterfall */}
        <section id="waterfall" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                Trace Waterfall & Triage
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">OpenInference OTel</span>
          </div>

          <TraceWaterfall
            selectedTrace={selectedTrace}
            onProceedToReplay={() => scrollToSection('ide')}
          />
        </section>

        {/* 3. Replay IDE */}
        <section id="ide" className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-4">
          <div className="mb-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
              <h3 className="text-lg sm:text-xl font-bold text-zinc-900 tracking-tight">
                Prompt Diff IDE & Sandbox
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">Zero Side-Effect</span>
          </div>

          {/* Prompt Diff Editor */}
          <PromptDiffEditor
            selectedTrace={selectedTrace}
            activePrompt={activePrompt}
            onChangePrompt={(p) => setCustomPrompt(p)}
            promptMode={promptMode}
            onChangePromptMode={(m) => setPromptMode(m)}
            selectedModel={selectedModel}
            onChangeModel={(m) => setSelectedModel(m)}
          />

          {/* Execution Console */}
          <ExecutionConsole
            selectedTrace={selectedTrace}
            activePrompt={activePrompt}
            promptMode={promptMode}
            selectedModel={selectedModel}
            onProceedToCiMatrix={() => scrollToSection('ci-matrix')}
          />
        </section>

        {/* 4. CI Regression Matrix */}
        <CIRegressionMatrix
          selectedTrace={selectedTrace}
          selectedModel={selectedModel}
        />

        {/* 5. Pipeline Architecture */}
        <ArchitectureGraph />
      </main>

      {/* Footer */}
      <Footer onOpenExportModal={() => setIsExportModalOpen(true)} />

      {/* Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTrace={(t) => setSelectedTrace(t)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onScrollToSection={scrollToSection}
      />

      <McpCliExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
};

export default App;
