# Set up Revelstreet drone console worktree

_Session `f7d00aef-a980-436b-b924-346b3f86fc25` · 2026-04-26 19:09:35Z → 2026-04-26 19:11:24Z · 4 turns · workspace: `worktree:upbeat-hofstadter-8585f2` · branch: `claude/upbeat-hofstadter-8585f2`_

---

## User · 19:09:35

Here's a self-contained context prompt. Paste it into each new worktree thread, then append the specific task for that thread at the bottom where indicated.

````markdown
# Project: Revelstreet Drone Operator Console

You are working on a take-home submission for Revelstreet (https://eng-exercise-1.revelstreet.workers.dev/). The exercise is graded on **AI agent orchestration quality** (planning docs, agent logs, automated testing) — NOT feature count or LOC. Process artifacts are part of the deliverable.

**Repo:** `gadidgc/revelstreet` (default branch `main`)
**Local path:** `/Users/kisshot/Desktop/projects/revelstreet`
**Worktrees live in:** `.claude/worktrees/<name>/` — each parallel thread runs in its own worktree on its own branch. Never modify another worktree's files.

## What's already shipped (on main)

A lean, usable drone-delivery operator console. An operator opens it, sees today's route (2 pickups + 3 deliveries in SF), works through the stops with one contextual button per state, marks success/failure with a reason modal, and reaches "5 of 5 — Route Complete." Refresh-survives via localStorage.

### Stack
- Vite 8 + React 19 + TypeScript
- Tailwind CSS v4 (`@import "tailwindcss"` + `@tailwindcss/vite` plugin — no v3 config file)
- Zustand with `persist` middleware (localStorage key: `revelstreet-route`)
- Leaflet + react-leaflet (OpenStreetMap tiles, no API key)
- Vitest + jsdom + @testing-library
- Playwright (chromium only, workers:1, auto-managed dev server on 127.0.0.1:5173)
- pnpm (NOT bun — bun isn't installed on this machine)

### File layout
```
app/
  src/
    types.ts                       # Stop, Route, StopType, StopStatus
    data/routes.ts                 # sample SF route + FAILURE_REASONS
    store/routeStore.ts            # zustand + state machine + IllegalTransitionError
    store/routeStore.test.ts       # 19 vitest tests
    components/
      ProgressHeader.tsx
      StopCard.tsx                 # contextual button + failure modal
      StopList.tsx
      RouteMap.tsx                 # Leaflet, numbered div-icon pins, polyline
    App.tsx                        # 2-pane layout
    main.tsx, index.css, test/setup.ts
  tests/e2e/
    operator-flow.spec.ts          # 3 specs: happy path, button visibility, reset
    failure-flow.spec.ts           # 4 specs: quick-pick, custom reason, disabled confirm, reload persistence
  vite.config.ts                   # also vitest config (env: jsdom, exclude tests/e2e)
  playwright.config.ts             # webServer auto-starts vite
  package.json                     # scripts: dev, build, test, test:e2e, test:all
[PLAN.md](http://PLAN.md), [AGENTS.md](http://AGENTS.md), [CONVERSATION.md](http://CONVERSATION.md), [README.md](http://README.md)   # process artifacts
.github/workflows/pr-qa.yml        # CI QA agent runs on every PR
.github/[qa-prompt.md](http://qa-prompt.md)               # prompt template the CI agent uses
```

### State machine (don't break this)
- Pickups: `pending → arrived → departed`
- Deliveries: `pending → arrived → completed | failed`
- Any other transition throws `IllegalTransitionError`
- Active stop = first non-terminal stop; UI auto-advances on departure/completion/failure
- Selectors: `selectActiveStop`, `selectProgress`, `isRouteComplete`, `nextActionFor`

### Test counts at last green
- Unit: 19 passing (vitest)
- E2E: 7 passing (playwright)
- Run: `cd app && pnpm test:all`
- E2E gotcha: `page.addInitScript(localStorage.clear)` runs on every reload and breaks persistence tests. Use `goto + evaluate(clear) + reload` in `beforeEach` instead. Already fixed — don't re-introduce.

### CI on PRs
Every PR triggers `.github/workflows/pr-qa.yml`, which spins up the dev server, runs Claude with Playwright MCP via `anthropics/claude-code-action@v1`, and posts a `/qa-only` report as a PR comment. It does NOT push fixes — report-only. Don't expect it to gate merge; treat its comment as advisory.

## Conventions
- pnpm, not bun. If you see `bun ...` in old docs, translate to pnpm.
- TDD the state machine: tests before implementation when touching `routeStore.ts`.
- Don't add features that aren't in [PLAN.md](http://PLAN.md) without flagging — scope creep eats the time budget.
- Don't create new top-level docs unless asked. Append to [AGENTS.md](http://AGENTS.md) if you want to log orchestration moves.
- Commit messages: conventional-ish (`feat:`, `fix:`, `chore:`, `docs:`). Always include the Claude Code co-author trailer.
- Never `--no-verify`, never force-push to main, never amend a pushed commit.
- This worktree's branch is already created. Push with `git push -u origin <branch>` first time, then `gh pr create --base main`.

## Working in parallel
Multiple agents are running in different worktrees on the same repo at the same time. Assume:
- `main` may move under you. Rebase or merge before pushing if your PR shows conflicts.
- Other branches may touch overlapping files — check `git fetch && git log --all --oneline -20` before starting on shared modules (routeStore, App.tsx, types.ts).
- If your task has obvious overlap with a known parallel task, scope your edits narrowly and call out the boundary in the PR body.

## Your task for this thread

<!-- PASTE THE SPECIFIC TASK FOR THIS WORKTREE BELOW -->

```
[describe the task here]
```
````

Replace the bottom block with the specific task per thread (e.g. "add drone telemetry sidebar", "swap sample data to NYC", "add ETA calculation"). Everything above stays identical across threads.

## Assistant · 19:09:42

The task block at the bottom is still the placeholder (`[describe the task here]`) — you haven't told me what this thread should actually do.

What's the task for this worktree?

## User · 19:10:59

We have these buttons. Please remove the ones that say "Play" and "Reset". We only should have "Camera" and "Camera renaming", and it should say "POB drone only" with a camera icon, just that.

## Assistant · 19:11:06

**Tool: Bash** — `grep -rn "Play\|Reset\|Camera" app/src --include="*.tsx" --include="*.ts" -l 2>/dev/null | head -20`

<details><summary>output (31 B)</summary>

```
(Bash completed with no output)
```

</details>

**Tool: Bash** — `ls && grep -rn "Play\|Reset\|Camera" app/src 2>/dev/null | head -30`

<details><summary>output (47 B)</summary>

```
AGENTS.md
CONVERSATION.md
PLAN.md
README.md
app
```

</details>

**Tool: Bash** — `grep -rni "play\|reset\|camera" app/src 2>/dev/null | head -40`

<details><summary>output (866 B)</summary>

```
app/src/components/RouteMap.tsx:26:      display: flex; align-items: center; justify-content: center;
app/src/components/ProgressHeader.tsx:5:  const reset = useRouteStore((s) => s.resetRoute);
app/src/components/ProgressHeader.tsx:38:          data-testid="reset-button"
app/src/components/ProgressHeader.tsx:43:                'Start a new route? This will reset all stop progress.',
app/src/components/ProgressHeader.tsx:46:              reset();
app/src/store/routeStore.ts:12:  resetRoute: () => void;
app/src/store/routeStore.ts:125:      resetRoute: () => {
app/src/store/routeStore.test.ts:16:  useRouteStore.getState().resetRoute();
app/src/store/routeStore.test.ts:19:  useRouteStore.getState().resetRoute();
app/src/store/routeStore.test.ts:174:describe('resetRoute', () => {
app/src/store/routeStore.test.ts:178:    useRouteStore.getState().resetRoute();
```

</details>

The screenshot doesn't match this codebase. I searched all of `app/src` and found:

- A **Reset** button in [ProgressHeader.tsx:38](app/src/components/ProgressHeader.tsx:38)
- **No "Play" button** anywhere
- **No "Camera" button** anywhere

The toolbar in your screenshot (Play / Reset / Camera) doesn't exist in this Revelstreet operator console. A few possibilities:

1. The screenshot is from a **different project** (maybe pasted into the wrong thread?)
2. Those buttons live on a **different branch / worktree** I'm not seeing — `git branch -a` from here only sees this branch's view
3. You want me to **add** a Camera button and remove the existing Reset (and Play doesn't exist yet)

Also — "Camera" and "Camera renaming" as the two remaining buttons is confusing. Did you mean: keep one button, rename it from "Camera" to "POB drone only" with a camera icon? Or two separate camera-related buttons?

Could you clarify:
- Which repo/file are these buttons actually in?
- Final state: one button labeled "POB drone only" with a 📷 icon, replacing the whole toolbar?

