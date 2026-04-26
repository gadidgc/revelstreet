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

## Why this submission is structured this way

The exercise explicitly says the grading is on "process, not output" — efficient use of AI agents, quality of planning documentation, effectiveness of agent instructions, automated testing. So:

- The **plan came first** and got iterated against pushback from the human before any code was written. `PLAN.md` shows the full plan as approved.
- The **state machine was TDD'd** — 19 tests written before any store logic. The implementation passed on the first run.
- The **agent fixed its own bugs** — the first e2e run had 1 failing test (localStorage being cleared on every reload). The agent diagnosed it from failure output, fixed it, re-ran, all 7 passed. No human intervention. See `AGENTS.md` for the receipt.
- The **app is a real lean vertical**, not a demo fixture. Persistence across reload is the line we drew between "looks like it works" and "actually works."
