# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Take-home submission for Revelstreet (https://eng-exercise-1.revelstreet.workers.dev/) — a drone-delivery operator console. Graded on **AI agent orchestration quality** (planning docs, agent logs, automated testing), not feature count or LOC. The process artifacts at the repo root are part of the deliverable.

## Repo shape

- `app/` — the application (Vite + React 19 + TS + Tailwind v4). All code work happens here.
- `PLAN.md`, `AGENTS.md`, `CONVERSATION.md`, `README.md` — submission artifacts. Don't churn them on routine edits. If you need to log an orchestration move, append to `AGENTS.md`.
- `.github/workflows/pr-qa.yml` + `.github/qa-prompt.md` — CI QA agent (see below).
- `.claude/worktrees/<name>/` — parallel agent worktrees. **Never modify another worktree's files.**

## Commands (run from `app/`)

```bash
pnpm install
pnpm dev                 # http://localhost:5173
pnpm test                # vitest, run once
pnpm test:watch          # vitest watch mode
pnpm test:e2e            # playwright (first run: npx playwright install chromium)
pnpm test:all            # vitest + playwright
pnpm build               # tsc -b && vite build
pnpm lint                # eslint
```

Run a single unit test:
```bash
pnpm test src/store/routeStore.test.ts -t "marks arrived"
```

**pnpm only.** Bun is not installed on this machine. Translate any `bun ...` references in older docs (including the CI workflow) to pnpm.

## Architecture

The non-obvious part is the state-machine-in-the-store contract. Everything else is thin.

**State machine** lives in `app/src/store/routeStore.ts` — Zustand with `persist` middleware (localStorage key `revelstreet-route`).

- Pickups: `pending → arrived → departed`
- Deliveries: `pending → arrived → completed | failed`
- Any other transition throws `IllegalTransitionError`.
- Active stop = first non-terminal stop; UI auto-advances on departure / completion / failure.
- Selectors: `selectActiveStop`, `selectProgress`, `isRouteComplete`, `nextActionFor`.

**UI never branches on status.** Components call `nextActionFor(stop)` and render the single legal action button. If you find yourself writing `if (status === ...)` in a component, push it into the store instead.

**Components** in `app/src/components/` are thin:
- `ProgressHeader` — operator name, progress, reset
- `StopList` — ordered cards
- `StopCard` — status chip, contextual action button, owns the failure modal
- `RouteMap` — Leaflet, numbered div-icon pins, polyline, OSM tiles (no API key)

**Sample data** is hardcoded in `app/src/data/routes.ts` (1 SF route, 5 stops). No backend.

**Tailwind v4** via `@tailwindcss/vite`; styles via `@import "tailwindcss"` in `index.css`. There is no `tailwind.config.*`.

**Vitest config** lives inside `vite.config.ts` (env: jsdom, excludes `tests/e2e`). Playwright auto-starts the dev server (chromium only, workers: 1).

## Testing discipline

TDD the state machine — add tests in `routeStore.test.ts` **before** changing transitions in `routeStore.ts`. Last known green: 19 unit + 7 e2e.

**E2E gotcha (already fixed — don't re-introduce):** `page.addInitScript(() => localStorage.clear())` runs on every reload and silently defeats the persistence test. Use `goto → evaluate(clear) → reload` in `beforeEach` instead.

## CI

Every PR triggers `.github/workflows/pr-qa.yml`: it boots the dev server and runs Claude with Playwright MCP via `anthropics/claude-code-action@v1`, which invokes `/qa-only` and posts a report as a PR comment. Report-only — it does not push fixes and does not gate merge. Treat the comment as advisory.

Requires repo secret `ANTHROPIC_API_KEY`.

## Conventions

- Don't add features outside `PLAN.md` without flagging — scope creep eats the time budget.
- Don't create new top-level docs unless asked.
- Commit messages: conventional-ish (`feat:`, `fix:`, `chore:`, `docs:`) with the Claude Code co-author trailer.
- Never `--no-verify`. Never force-push `main`. Never amend a pushed commit.
- First push on a worktree branch: `git push -u origin <branch>`, then `gh pr create --base main`.

## Parallel worktrees

Multiple agents may be running in sibling worktrees on the same repo. Before touching shared modules (`routeStore.ts`, `App.tsx`, `types.ts`):

```bash
git fetch && git log --all --oneline -20
```

Rebase or merge if `main` moved. Scope edits narrowly when overlap with another active branch is obvious, and call out the boundary in the PR body.
