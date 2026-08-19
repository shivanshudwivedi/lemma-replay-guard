# Original User Request

## 2026-08-18T21:37:12Z

Re-engineer the Lemma Replay Guard web frontend into a world-class, professional Linear/Vercel-style YC developer tools observability platform with high-density telemetry waterfalls, code diff split-views, live mock debugger, interactive CI regression matrices, and keyboard shortcuts.

Working directory: `/Users/shivanshu/Documents/Protoypes - Hiring/Lemma/web`
Integrity mode: development

## Requirements

### R1. Linear / Vercel Industrial Dark Theme & Micro-Typography
- Implement a crisp, high-density industrial dark design system (`#090d16`, `#0f172a`, `border-white/[0.08]`) with semantic accents reserved strictly for functional states (emerald for pass, rose for fail, violet for CI, amber for warnings).
- Clean typographic hierarchy (Inter / JetBrains Mono) with tight tracking, subtle badge pills, and precision status dots.
- Replace noisy 3D visuals with a sleek ambient glow canvas, subtle grid, and silky smooth Framer Motion spring physics.

### R2. Distributed Trace Waterfall & Flamegraph Viewer
- Interactive span waterfall showing step-by-step execution timing, network latency bars, token usage gauges, and error highlights.
- Collapsible span inspection drawer showing exact tool arguments, response schemas, and failure root causes.

### R3. Split-View Prompt Patch & Diff IDE
- Side-by-side and unified code diff editor comparing original (failing) system prompts against patched prompts with syntax styling.
- Live in-browser editing with instant schema validation and one-click patch templates.
- Model selector (`GPT-4o`, `Claude 3.5 Sonnet`, `GPT-4o-mini`, `DeepSeek-V3`).

### R4. Zero Side-Effect Mock Harness & Execution Sandbox
- Deterministic tool mock inspector displaying response contracts for Stripe, SQL database, and GitHub APIs.
- Step-by-step replay execution simulator with live log streaming, cycle detection alerts, and assertion checklist.

### R5. CI Regression Diff Matrix & GitHub PR Bot Comment
- Multi-metric differential dashboard ($\Delta$ latency, $\Delta$ tokens, $\Delta$ USD cost / 1M queries, pass rate).
- Production-accurate GitHub PR Bot comment widget with copyable markdown and collapsible test evidence.
- Quick Command Palette (`Cmd+K`) and developer export modal (GitHub Action YAML, Cursor/Claude MCP config, CLI snippets).

## Acceptance Criteria

### Visual & Functional Quality
- [ ] Frontend compiles with zero TypeScript/lint errors (`tsc && vite build`).
- [ ] Runs seamlessly on `http://localhost:3173` with instant responsiveness.
- [ ] Aesthetic is unmistakably high-end YC devtools (Linear/Vercel/Langfuse quality).
- [ ] Interactive workflows (trace switching, prompt patching, animated replay playback, diff computation, markdown export) function flawlessly.
