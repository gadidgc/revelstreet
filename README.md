# Revelstreet Engineering Exercise — Drone Delivery Operator Console

Submission for <https://eng-exercise-1.revelstreet.workers.dev/>. Built in ~2 hours, agent-driven via Claude Code (Claude Opus 4.7) with the [gstack](https://github.com/garrytan/gstack) skill toolkit.

## What's in here

| File | What it is |
|------|------------|
| [`app/`](./app/) | The application — Vite + React + TypeScript + Tailwind v4. See `app/README.md` for run + test instructions. |
| [`PLAN.md`](./PLAN.md) | The plan that was approved before any code was written. Driven by `/office-hours` in builder mode. Iterated 3 times based on human feedback. |
| [`AGENTS.md`](./AGENTS.md) | The orchestration log — which agent steps ran, in what order, what each layer caught, what was deliberately skipped and why. The grading artifact. |
| [`CONVERSATION.md`](./CONVERSATION.md) | Abbreviated transcript of the human ↔ agent dialogue across the planning and build phases. |

## Quick start

```bash
cd app
pnpm install
pnpm dev          # http://localhost:5173

pnpm test         # 19 unit tests on the route state machine
pnpm test:e2e     # 7 Playwright e2e tests (run `npx playwright install chromium` first)
pnpm test:all     # both
```

Full demo flow and design rationale: [`app/README.md`](./app/README.md).

## What we expect the operator to be able to do

The exercise prompt defines the typical user flow as:

> - The drone operator is assigned a route by the app
> - The interface provides a clear view of where to go for pickups and deliveries
> - The operator can check off when they have arrived or departed from a pickup or delivery location
> - The operator can indicate whether the pickup or delivery was successful

We mapped each of those bullets to a concrete expectation in the app, demoable end-to-end without any narration. See `app/README.md` for the full walkthrough or just open the app and click — it walks itself.

## CI

Every PR triggers [`.github/workflows/pr-qa.yml`](./.github/workflows/pr-qa.yml): the runner boots `pnpm dev`, then [`anthropics/claude-code-action@v1`](https://github.com/anthropics/claude-code-action) reads the PR body + diff, drives the app via Playwright MCP, walks the operator demo flow, and posts a PASS / NEEDS WORK / BLOCKED summary to the PR. Full design notes in [`AGENTS.md`](./AGENTS.md).

**Required repo secret:** `ANTHROPIC_API_KEY` (Settings → Secrets and variables → Actions). Without it, the agent step fails. No other secrets are needed — the dev server runs locally inside the runner.

## Test results at submission

```
Unit tests:    19 passed (19)   — vitest, ~5ms
E2E tests:     7 passed (7)     — playwright, ~2.3s
TypeScript:    clean
Production build: clean (110 KB JS gzipped)
```

## For the reviewer — conversation + decisions

### Tooling

This whole exercise was driven through **[gstack](https://github.com/garrytan/gstack)** running on top of Claude Code (Claude Opus 4.7). gstack is the skill toolkit that powered every meaningful step:

- `/office-hours --builder-mode` for the initial planning workflow (forced a design doc before any code).
- Plan-review skills (`/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`) framed how I pushed back on the agent's first plan.
- `/design-shotgun` was the design-exploration skill I told the agent to use for visual decisions instead of prescribing pixels in markdown (the agent ultimately skipped the binary build for time — documented as a tradeoff).
- `/ship` handled the PR-creation workflow.
- `/qa-only` is what the CI workflow invokes on every PR (`.github/workflows/pr-qa.yml`).

So when the README says "the agent did X," the agent had gstack's skill library available the whole time — that's why the planning, design framing, and CI QA loop all feel coherent rather than ad-hoc.

### Where to find the conversations

| Source | What it contains |
|--------|------------------|
| [`CONVERSATION.md`](./CONVERSATION.md) | Hand-curated, abbreviated transcript of every substantive human ↔ agent turn across planning + build. This is the one to read first. |
| [`AGENTS.md`](./AGENTS.md) | Orchestration log — which agent steps ran, in what order, what each layer caught, what was skipped and why. |
| [`PLAN.md`](./PLAN.md) | The plan as approved at ExitPlanMode, after 3 rounds of human pushback. |
| `~/.claude/projects/-Users-kisshot-Desktop-projects-revelstreet--claude-worktrees-nervous-franklin-81af9c/` | Raw Claude Code session transcripts (JSONL) for this worktree. Full unedited record — exportable on request. The parent project transcripts live one directory up at `~/.claude/projects/-Users-kisshot-Desktop-projects-revelstreet/`. |

### What I (the human) actually said and decided

**Planning phase (5 human messages, 0 in build):**

1. **Kickoff** — invoked `/office-hours --builder-mode` against the exercise URL so the agent had to produce a plan before any code.
2. **Angle** — "we're already on gstack so showcasing orchestration is implicit; focus on **balanced craft** + **depth on testing**." That picked the bar for the rest of the build.
3. **Lean vertical** — pushed back on the first plan: "make this a real tool an operator could pick up and use, not a test fixture. Map the user journey." This produced the demo-flow framing.
4. **Don't prescribe pixels in markdown** — pushed back again: "visual decisions belong in pixels, not prose. Use `/design-shotgun` instead." Plan was rewritten to behavior-level only with a design-shotgun brief slotted in parallel with state-machine TDD.
5. **Tone** — "frame it as 'we expect the operator to be able to do these things,' and quote the exercise's own user-flow bullets verbatim." Plan rewritten one more time, then approved via ExitPlanMode.

**Decisions I made (vs. let the agent run):**

- **pnpm over bun** — bun isn't on this machine; translated all docs accordingly.
- **No backend, no auth, no real GPS** — all out of scope on day one, kept that way.
- **State machine first, UI second** — TDD'd the Zustand store before any component existed. 19 unit tests written before the first render.
- **Persistence is the line between "looks like it works" and "actually works"** — kept the localStorage e2e test even after it failed once, instead of deleting it.
- **Skipped `/design-shotgun`, `/qa`, and `/review`** during build — agent's call, but I ratified it after the fact: 26 tests + manual demo verification was already strong, and the remaining time was better spent on documentation (which is what's being graded).
- **Added a dev panel + drone POV + animated drone** ([#5](../../pull/5), [#8](../../pull/8)) as small demo polish after the core was green.
- **Hardened the worktree workflow** ([#10](../../pull/10)) with PreToolUse hooks so future agent runs can't accidentally trash a sibling worktree.

## Note on the exercise platform

Heads-up to the reviewer, unrelated to this submission: the countdown timer on the Revelstreet engineering-exercise page itself appeared to misbehave for me — on a hard refresh of the interview URL the counter showed zero instead of the remaining time. Not a blocker, just flagging it in case it's worth a look on your side.

With that noted, I'm calling this done.

## Why this submission is structured this way

The exercise explicitly says the grading is on "process, not output" — efficient use of AI agents, quality of planning documentation, effectiveness of agent instructions, automated testing. So:

- The **plan came first** and got iterated against pushback from the human before any code was written. `PLAN.md` shows the full plan as approved.
- The **state machine was TDD'd** — 19 tests written before any store logic. The implementation passed on the first run.
- The **agent fixed its own bugs** — the first e2e run had 1 failing test (localStorage being cleared on every reload). The agent diagnosed it from failure output, fixed it, re-ran, all 7 passed. No human intervention. See `AGENTS.md` for the receipt.
- The **app is a real lean vertical**, not a demo fixture. Persistence across reload is the line we drew between "looks like it works" and "actually works."
