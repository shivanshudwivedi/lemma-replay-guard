import React from 'react';
import { Activity, Terminal, Search, ExternalLink } from 'lucide-react';

interface NavbarProps {
  onOpenExportModal: () => void;
  onOpenCommandPalette: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenExportModal,
  onOpenCommandPalette,
  onScrollToSection,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Left: Brand */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onScrollToSection('hero')}>
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 text-white shadow-xs">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-base tracking-tight text-zinc-900 font-sans">
              Lemma
            </span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200 font-medium">
              Replay Guard
            </span>
          </div>
        </div>

        {/* Center: Command Palette Search Bar */}
        <button
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 text-sm text-zinc-500 transition-all hover:border-zinc-300 shadow-2xs w-80 justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-zinc-400" />
            <span className="text-zinc-600 text-sm font-sans">Search traces, actions...</span>
          </div>
          <kbd className="px-2 py-0.5 rounded text-xs font-mono bg-white text-zinc-600 border border-zinc-200 shadow-2xs">
            ⌘K
          </kbd>
        </button>

        {/* Right: Navigation Links & Actions */}
        <div className="flex items-center gap-5">
          <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-zinc-600">
            <button onClick={() => onScrollToSection('waterfall')} className="hover:text-zinc-900 transition-colors">
              Waterfall
            </button>
            <button onClick={() => onScrollToSection('ide')} className="hover:text-zinc-900 transition-colors">
              Prompt IDE
            </button>
            <button onClick={() => onScrollToSection('ci-matrix')} className="hover:text-zinc-900 transition-colors">
              CI Matrix
            </button>
            <button onClick={() => onScrollToSection('architecture')} className="hover:text-zinc-900 transition-colors">
              Architecture
            </button>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenExportModal}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-mono bg-white hover:bg-zinc-50 text-zinc-800 border border-zinc-200 transition-all hover:border-zinc-300 shadow-2xs font-medium cursor-pointer"
            >
              <Terminal className="w-4 h-4 text-emerald-600" />
              <span>CI Config</span>
            </button>

            <a
              href="https://lemma.ai"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-zinc-900 hover:bg-zinc-800 text-white transition-all shadow-xs font-sans"
            >
              <span>Lemma.ai</span>
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
            </a>
          </div>
        </div>

      </div>
    </header>
  );
};
