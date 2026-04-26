# AGENTS.md

Log of how AI agents are used in this project. Section per orchestration concern.

## CI Verification — PR QA agent

Every PR triggers an AI agent that reads the PR's intent, drives the running
app via Playwright MCP, and posts a structured "where are we?" review back to
the PR conversation. No code changes from CI — pure verification.

### Loop

1. PR opened or pushed → `.github/workflows/pr-qa.yml` fires.
2. Runner checks out the PR branch, installs deps, boots `bun run dev` on
   `127.0.0.1:5173`, waits for the server.
3. Workflow renders `.github/qa-prompt.md` with PR title, body, and
   `git diff base...head` (capped at 8k lines) prepended.
4. `anthropics/claude-code-action@v1` runs Claude with Playwright MCP and a
   restricted toolset (`Bash,Read,Write,mcp__playwright__*`).
5. Agent invokes the gstack `/qa-only` skill, walks the operator demo flow,
   captures screenshots on bugs, writes `qa-report.md`, and ends with a
   PR-comment-shaped summary that the action posts automatically.
6. Workflow uploads `qa-report.md` + screenshots as a workflow artifact for
   permanence.

### Design decisions

- **`/qa-only` over `/qa`.** Report-only is the honest demo for a 2h exercise.
  Letting CI commit fixes back to PRs needs branch-protection carve-outs and
  a kill switch we don't have time for.
- **Local dev server, not Cloudflare preview.** No backend, no secrets beyond
  `ANTHROPIC_API_KEY`, no per-PR deploy time. The runner is self-contained.
- **`anthropics/claude-code-action@v1` instead of a custom Agent SDK script.**
  Auth, MCP wiring, and PR comment posting are already solved. ~150 lines of
  glue we don't write.
- **Trigger: `opened + synchronize`.** Matches "each time we create a PR…
  we verify" literally — and re-verifies on every push so regressions
  surface without a manual nudge.
- **Prior-state context: PR title + body + diff.** No artifact storage, no
  baseline-screenshot pipeline. The PR description is the contract; the
  diff is the evidence.

### Files

- [.github/workflows/pr-qa.yml](.github/workflows/pr-qa.yml) — workflow
- [.github/qa-prompt.md](.github/qa-prompt.md) — prompt template the workflow
  feeds the action (kept out of YAML so it's diffable on its own)

### Required repo secret

- `ANTHROPIC_API_KEY` — set under repo Settings → Secrets → Actions.
