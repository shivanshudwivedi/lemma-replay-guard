import React, { useState } from 'react';
import { X, Copy, Check, Terminal, Code, Sparkles, GitPullRequest } from 'lucide-react';

interface McpCliExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const McpCliExportModal: React.FC<McpCliExportModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'github_actions' | 'mcp' | 'cli' | 'python_sdk'>('github_actions');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const SNIPPETS = {
    github_actions: `name: "Lemma CI Regression Guard"
on:
  pull_request:
    paths:
      - 'prompts/**'
      - 'agents/**'
      - 'evals/**'

jobs:
  lemma-replay-gate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - name: Install Lemma Replay Engine
        run: pip install lemma-replay

      - name: Execute Deterministic Replay Matrix
        run: lemma-replay run evals/ --reporter=markdown --out=summary.md

      - name: Post PR Regression Comment
        if: always()
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const summary = fs.readFileSync('summary.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });`,
    mcp: `{
  "mcpServers": {
    "lemma": {
      "command": "npx",
      "args": ["-y", "@lemma-ai/mcp-server"],
      "env": {
        "LEMMA_API_KEY": "lm_live_xxxxxxxxxxxx"
      }
    }
  }
}`,
    cli: `# 1. Ingest production failure trace into versioned eval fixture
lemma-replay ingest ./traces/prod_failure_9821.json --output ./evals/eval_stripe_refund.lemma.yaml

# 2. Run deterministic replay against patched prompt
lemma-replay run ./evals/eval_stripe_refund.lemma.yaml --patch-prompt ./prompts/billing_v2.txt

# 3. Export GitHub Actions Markdown comment
lemma-replay run ./evals/ --reporter=markdown --out=./ci_comment.md`,
    python_sdk: `from lemma_replay import TraceIngestor, ReplayRunner, DiffEngine

# Ingest trace
trace = TraceIngestor.load_trace_file("trace_01_tool_hallucination.json")
fixture = TraceIngestor.generate_eval_fixture(trace)

# Replay against patched prompt
runner = ReplayRunner(fixture)
result = runner.run(prompt_patch="Fixed prompt without currency_format")

# Compute performance & cost diff
diff = DiffEngine.compute_diff(fixture, result)
print(f"Regression Resolved: {diff.regression_resolved} | Latency: {diff.delta_latency_ms}ms")`
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-3xl rounded-xl bg-white border border-zinc-200 shadow-2xl overflow-hidden text-zinc-900">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-200 bg-zinc-50">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zinc-900 text-white flex items-center justify-center">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-xs text-zinc-900">Developer Integration Center</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 px-5 pt-2.5 border-b border-zinc-200 bg-white overflow-x-auto">
          <button
            onClick={() => setActiveTab('github_actions')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'github_actions'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <GitPullRequest className="w-3.5 h-3.5" />
            GitHub Action (.yml)
          </button>

          <button
            onClick={() => setActiveTab('cli')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'cli'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            CLI
          </button>

          <button
            onClick={() => setActiveTab('mcp')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'mcp'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            MCP Config
          </button>

          <button
            onClick={() => setActiveTab('python_sdk')}
            className={`pb-2 px-2.5 text-xs font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'python_sdk'
                ? 'border-zinc-900 text-zinc-900'
                : 'border-transparent text-zinc-500 hover:text-zinc-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Python SDK
          </button>
        </div>

        {/* Snippet Content */}
        <div className="p-4 bg-zinc-50/50">
          <div className="relative rounded-lg bg-zinc-900 p-3.5 border border-zinc-800 font-mono text-xs text-zinc-200">
            <button
              onClick={() => handleCopy(SNIPPETS[activeTab], activeTab)}
              className="absolute top-3 right-3 p-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1 text-[11px]"
            >
              {copiedKey === activeTab ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>

            <pre className="overflow-x-auto text-[11px] leading-relaxed text-zinc-300 pr-20 max-h-72">
              {SNIPPETS[activeTab]}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-zinc-200 bg-zinc-50 flex items-center justify-between text-xs text-zinc-500">
          <span>Deterministic Mock Execution</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-2xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
