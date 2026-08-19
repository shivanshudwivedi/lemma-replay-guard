import React from 'react';
import { Activity, ExternalLink } from 'lucide-react';

interface FooterProps {
  onOpenExportModal: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenExportModal }) => {
  return (
    <footer className="border-t border-zinc-200 bg-white py-8 px-4 sm:px-6 lg:px-8 z-10 relative">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm font-mono text-zinc-500">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-zinc-900 font-bold font-sans">Lemma Replay Guard</span>
          <span>• Built for Jerry Zhang & Cole Gawin (YC F25)</span>
        </div>

        {/* Links */}
        <div className="flex items-center gap-6">
          <button onClick={onOpenExportModal} className="hover:text-zinc-900 transition-colors cursor-pointer font-medium">
            CLI & CI Config
          </button>
          <a
            href="https://uselemma.ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-zinc-900 transition-colors flex items-center gap-1.5 font-medium cursor-pointer"
          >
            <span>uselemma.ai</span>
            <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
          </a>
        </div>

      </div>
    </footer>
  );
};
