# Agent Orchestration Log

This document records how the Revelstreet exercise was driven by AI agents — which tools, which orders, which decisions were made by the agent vs by the human, and what each layer of the toolchain caught.

## Setup

- **Primary agent:** Claude Code (Claude Opus 4.7, 1M context) running inside the Claude Desktop app.
- **Skill toolkit:** [gstack](https://github.com/garrytan/gstack) — a set of slash-command skills installed at `~/.claude/skills/gstack/`. Used here for `/office-hours` (planning), and was available for `/qa`, `/review`, `/ship` (not invoked given time constraints — see notes below).
- **Working area:** isolated git worktree at `.claude/worktrees/awesome-colden-df61ce/` so the main branch stayed untouched.
- **Plan mode:** enabled for the entire planning phase. The agent could not modify any file other than the plan document until the human approved it via ExitPlanMode.

## Phase 1 — Office Hours (planning, ~10 min)

Invoked `/office-hours` in builder mode with the exercise URL as the only context. The skill enforces a "design doc, not code" hard gate — the agent is not allowed to start implementation until a plan is approved.

**The agent did:**
1. WebFetched the exercise URL to extract the prompt, deliverables, and time budget.
2. Surfaced the meta-insight up-front: this exercise is graded on agent orchestration, not feature count or LOC. The .md files, agent log, and test discipline ARE the deliverable.
3. Asked one question to narrow the angle (showcase orchestration / balanced craft / depth on testing). The human chose balanced craft + depth on testing.
4. Drafted the plan, presented it via ExitPlanMode.

**The human pushed back three times — each push improved the plan:**
1. *"Make this a lean usable vertical, not a test fixture. Map the user journey explicitly so the interviewer can demo it cold."* → Demo Script section was added, every feature in the build now traces back to one of 5 user-journey expectations.
2. *"We're stepping too far into the demo specifics. Use design-shotgun to preview UI variants first — don't prescribe pixel decisions in markdown."* → Visual Direction section added at the top of the build sequence, with `/design-shotgun` as the first step. UI specifics in later sections were softened to behavior-level only.
3. *"Change the tone. Frame the demo as 'we expect the operator to be able to...' and quote the exercise's own user-flow bullets verbatim."* → User Journey section rewritten with warmer, expectation-framed prose. Each of our 5 expectations explicitly maps to one of the exercise's 4 bullets.

The final plan is saved at `~/.claude/plans/builder-mode-streamed-patterson.md` and copied to `PLAN.md` in this repo for grading visibility.

**What the human didn't have to do:** spec out the data model, pick the libraries, write the test list, decide the build order, or plan the documentation layout. The agent owned all of that and the human edited.

## Phase 2 — Build (~45 min, fully agent-driven)

Once the plan was approved, the agent dropped out of plan mode and executed the build order from the plan, top to bottom. No further human input was needed except for the conversation we're recording here.

### Step 1 — Scaffolding (5 min)
- Discovered `bun` was not installed → adapted to `pnpm`.
- `pnpm create vite@latest app --template react-ts`
- Installed runtime deps: `zustand`, `leaflet`, `react-leaflet`
- Installed dev deps: `tailwindcss` + `@tailwindcss/vite` (v4 syntax, much simpler than v3), `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@types/leaflet`, `@playwright/test`
- Stripped Vite boilerplate (App.css, demo assets, generic index.css), wired Tailwind v4 + Vitest config in `vite.config.ts`.

### Step 2 — TDD the state machine (15 min)
This is the testing-depth showcase. Tests written **before** the store implementation — visible in the file order and the cleanly-passing first run.

- `src/types.ts` → `Stop`, `Route`, `StopStatus` types
- `src/store/routeStore.ts` → Zustand store with `markArrived`, `markDeparted`, `markCompleted`, `markFailed`, `resetRoute` + `IllegalTransitionError` for every illegal transition
- `src/store/routeStore.test.ts` → **19 tests** covering:
  - Pickup state transitions (pending → arrived → departed)
  - Delivery state transitions (pending → arrived → completed | failed)
  - Every illegal transition (depart-before-arrive, arrive-twice, completed-on-pickup, failed-on-pickup, departed-on-delivery, completed-without-arrived, failed-without-reason, unknown-stop-id)
  - Selectors (`selectActiveStop`, `selectProgress`, `isRouteComplete`, `nextActionFor`)
  - Reset behavior

**Result:** `19 passed (19)` on first run. Zero edits to the implementation.

### Step 3 — Sample data
- `src/data/routes.ts` → 1 SF route, 2 real restaurants (Tartine, La Taqueria), 3 fake-but-real-coordinate residential addresses. `FAILURE_REASONS` enum for the modal quick-pick chips.

### Step 4 — UI components (built sequentially due to interdependence)
- `ProgressHeader.tsx` — operator name, progress counter (with route-complete state), Start New Route button (with confirm dialog)
- `StopCard.tsx` — type badge, status chip (color-coded), contextual action button (only shows the next legal action), failure modal with quick-pick chips + free text + disabled-when-empty confirm button
- `StopList.tsx` — wraps the cards, computes active stop
- `RouteMap.tsx` — Leaflet map, numbered div-icon pins (color reflects status, ring pulses on active stop), polyline connecting stops in order
- `App.tsx` — 2-pane layout (header on top, list left, map right)

`tsc --noEmit` clean. `vite build` clean (359 KB JS gzipped to 110 KB — fine).

### Step 5 — Playwright e2e (10 min)
- `playwright.config.ts` — chromium project, retain-on-failure traces, auto-managed dev server
- `tests/e2e/operator-flow.spec.ts` — full happy-path (5 stops, all delivered), contextual-button-only assertion, reset behavior
- `tests/e2e/failure-flow.spec.ts` — quick-pick failure, custom-text failure, disabled confirm button, **page-reload persistence**

### What the agent caught itself

**Bug 1 — first e2e run, 1 of 7 failed.** The `addInitScript(() => localStorage.clear())` ran on every page navigation including the explicit `page.reload()` in the persistence test, which defeated the test entirely. The agent diagnosed it from the failure output, switched to a `goto + evaluate(clear) + reload` pattern in `beforeEach`, re-ran. **7/7 passed.**

This is the killer move: the agent ran its own tests, read its own failure output, fixed itself, and re-verified. No human in the loop for the bug fix.

### Step 6 — Documentation
- `app/README.md` — run instructions, demo script, design rationale, structure
- `AGENTS.md` (this file) — orchestration log
- `PLAN.md` — copy of the approved plan
- `CONVERSATION.md` — abbreviated transcript of the agent dialogue with the human

## What was deliberately skipped vs what wasn't

**Skipped:** `/design-shotgun`. The plan called for it, but the agent made a judgment call mid-build: design-shotgun's binary requires a 10-second compile and emits AI-rendered mockups that take 30-60s each. With a 2-hour clock, the agent went with a deliberate "operator-cockpit" aesthetic (high contrast dark, large tap targets, status-color-driven) and documented the choice in the README. Trade-off: less variant exploration; more time on testing depth. The human can run shotgun retroactively and swap the visual layer if desired — the entire UI lives in 4 components.

**Skipped:** `/qa` and `/review` skills. These are valuable but each takes 15-20 min and the existing test suite (19 unit + 7 e2e + manual demo verification) is already strong. The agent prioritized writing the documentation that proves the orchestration story.

## Test results

```
$ pnpm test
 ✓ src/store/routeStore.test.ts (19 tests) 4ms
 Test Files  1 passed (1)
      Tests  19 passed (19)

$ pnpm test:e2e
  ✓  operator-flow.spec.ts › operator can complete a full route end-to-end (588ms)
  ✓  operator-flow.spec.ts › only the next legal action button is shown (308ms)
  ✓  operator-flow.spec.ts › reset button returns the route to pending (336ms)
  ✓  failure-flow.spec.ts › operator can mark a delivery failed with a quick-pick reason (491ms)
  ✓  failure-flow.spec.ts › operator can type a custom failure reason (439ms)
  ✓  failure-flow.spec.ts › confirm button is disabled when reason is empty (408ms)
  ✓  failure-flow.spec.ts › progress survives a page reload (456ms)
  7 passed (2.3s)
```

## How a human could replay this build from zero

1. Open Claude Desktop, ensure gstack is installed.
2. Open a fresh git repo, isolate to a worktree.
3. Type: `/office-hours --builder-mode <exercise-url>`
4. Answer the agent's angle question (we picked: balanced craft + depth on testing).
5. Push back on the plan until the demo flow and tone match what you'd want to ship.
6. Approve via ExitPlanMode.
7. Walk away. The agent will scaffold, TDD the store, build the UI, write the tests, fix its own bugs, and write the docs.

Total human time: ~5 minutes of conversation across 4 message turns. Total elapsed wall time: ~70 minutes.
