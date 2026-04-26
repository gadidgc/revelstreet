# Revelstreet Engineering Exercise — Drone Delivery Operator App

## Context

Revelstreet take-home: build a web app for drone delivery operators to manage pickup (restaurants) and delivery (residential) routes — track locations, mark arrival/departure, confirm success/failure. **2 hours total, ~1h58m remaining.**

The exercise is explicitly meta: graded on **how AI agents are used**, not feature count or LOC. Required deliverables include planning .md files, agent conversation logs, and quality of automated testing.

**Chosen angle:** balanced craft (app feels real) + depth on testing (rigorous Playwright + Vitest, agents verify their own work). Orchestration showcase is implicit — running on Claude Desktop with gstack already.

**MVP target: a lean vertical that's actually usable.** Not a test fixture — a real tool an operator could pick up and use right now to run a route. The interviewer should be able to sit down, open the app, and complete a full delivery loop without us narrating. The demo script below defines exactly what that looks like.

## Stack

- **Vite + React + TypeScript** — fast dev, matches "React preferred"
- **Leaflet + react-leaflet** — free maps, no API key, runs on localhost immediately
- **Zustand** — tiny state store for routes/stops (no Redux ceremony)
- **Tailwind** — fast styling, no design debt
- **Vitest** — unit tests on store transitions
- **Playwright** — e2e on the operator flow
- **No backend.** Sample data ships as `src/data/routes.ts`. State lives in memory + localStorage for refresh persistence.

## Data Model (minimal)

```ts
type StopType = "pickup" | "delivery";
type StopStatus = "pending" | "arrived" | "departed" | "completed" | "failed";

type Stop = {
  id: string;
  type: StopType;
  name: string;        // "Joe's Pizza" or "123 Oak St, Apt 4"
  address: string;
  lat: number;
  lng: number;
  arrivedAt?: string;
  departedAt?: string;
  status: StopStatus;
  failureReason?: string;
};

type Route = {
  id: string;
  operatorName: string;
  stops: Stop[];       // ordered: pickups first, then deliveries
};
```

**Sample data:** 1 route, 2 restaurants (pickup) + 3 residential (delivery), real coordinates from a chosen local area (e.g. Brooklyn or SF — pick whichever the candidate is closer to).

## Visual Direction — Run `/design-shotgun` First

Before any UI code is written, run `/design-shotgun` with the brief below to generate 3 visual variants of the operator console. The chosen variant locks layout, color, typography, and component shape. We do NOT prescribe pixel-level decisions in this plan — the shotgun does.

**Brief for the shotgun:**
> Drone delivery operator dashboard. Single-screen ops console used in the field on a laptop or tablet. Left: ordered list of today's stops with status and one contextual action button per card. Right: live map with numbered pins (pickups vs deliveries differentiated) and a route line. Header: operator name, progress count, reset button. Aesthetic options to explore: (a) industrial logistics — dense, monospaced, dark, lots of data, (b) modern consumer — light, friendly, generous whitespace, (c) operator-cockpit — high-contrast, large tap targets, status-color-driven. Pick the one that feels usable in 5 seconds.

Once a variant is chosen, that variant's layout and visual system feed the build. The Demo Script below describes the user journey at the **behavior level** — buttons, transitions, and states. Visual specifics (colors, exact placement, icon style) come from the chosen mockup.

## User Journey — What We Expect The Operator To Be Able To Do

The exercise prompt defines the typical user flow as:

> - The drone operator is assigned a route by the app
> - The interface provides a clear view of where to go for pickups and deliveries
> - The operator can check off when they have arrived or departed from a pickup or delivery location
> - The operator can indicate whether the pickup or delivery was successful

Here's how we expect the operator to walk through that flow in our app. This is what the interviewer should be able to sit down and do, end to end, without us narrating.

**1. Get assigned a route.**
We expect the operator to open the app and immediately see today's route waiting for them — their name in the header, an ordered list of stops on the left, the same stops plotted on a map on the right, and a progress counter that says "0 of 5 stops complete." No login screen, no setup, no empty state. The route is already there because it's already been assigned.

**2. See clearly where to go.**
We expect the operator to be able to glance at the screen and know where the next stop is without thinking. The active stop is highlighted in the list and on the map. Pickups and deliveries are visually distinct (per the chosen design variant). The route is drawn as a line connecting the pins in order. If they're not sure what comes next, the highlighted card and the highlighted pin tell them.

**3. Check off arrival and departure.**
We expect the operator to tap a single button at each stop. When they get to a pickup, they tap "Arrived" — the timestamp captures, the status chip flips. When they leave with the package, they tap "Departed." Only the next legal action is shown, so they can't tap the wrong thing. The next stop auto-highlights so they know where to go.

**4. Indicate success or failure.**
We expect the operator to confirm each delivery clearly. Successful drop-off → "Mark Delivered." Couldn't complete it → "Mark Failed," and a small modal asks why (free text + quick-pick chips: "No one home," "Wrong address," "Damaged"). The failure reason persists on the stop card as a red badge so dispatch can see it later.

**5. Finish the route, start the next one.**
We expect the operator to reach the last stop, see "5 of 5 — Route Complete," and have a clear button to reset for the next shift. We also expect that if their browser crashes or they close the tab mid-route, everything they've done so far is still there when they reopen it — every timestamp, every status, every failure reason.

That's the bar. Real workflow, real state machine, real persistence. Every feature we build serves one of those five expectations. If something doesn't, we cut it.

## App Surface

- **Single page.** Left: ordered stop list with status chips + contextual action button (only the next legal action shows — "Arrived" → "Departed" → "Mark Delivered / Mark Failed"). Right: Leaflet map with numbered markers (pickup/delivery differentiation per chosen design) + polyline connecting stops in order. Active stop highlighted on both panels and auto-advances on departure.
- **Status state machine** enforced in the store. Pickups: pending → arrived → departed. Deliveries: pending → arrived → completed | failed. Illegal transitions throw.
- **Failure flow:** "Mark Failed" opens a small modal asking for reason (free text + 3 quick-pick chips: "No one home", "Wrong address", "Damaged"). Persists to stop, shown as a red badge on the card.
- **Progress header:** operator name, "X of N stops complete", "Start New Route" button (resets to fresh state).
- **Persistence:** every state change writes to localStorage. Page refresh restores exactly where you left off — this is the line between "demo" and "actually usable."

## Files to Create

```
src/
  App.tsx                  # layout: list + map
  components/
    StopList.tsx
    StopCard.tsx           # status chip + action buttons + failure modal
    RouteMap.tsx           # leaflet wrapper
    ProgressHeader.tsx
  store/
    routeStore.ts          # zustand: state machine for stop transitions
    routeStore.test.ts     # vitest: every legal+illegal transition
  data/
    routes.ts              # sample route with 5 stops
  types.ts
tests/
  e2e/
    operator-flow.spec.ts  # playwright: load → arrive → depart → complete all → done state
    failure-flow.spec.ts   # playwright: mark failed with reason → status reflects
README.md                   # how to run, how to test, design choices
AGENTS.md                   # the orchestration log: what was delegated, why
PLAN.md                     # this file, copied in
```

## Build Order (timeboxed, ~1h45m budget — leaves 15min buffer)

1. **0–5m:** `bun create vite`, install deps (leaflet, react-leaflet, zustand, tailwind, vitest, playwright)
2. **5–15m:** **`/design-shotgun`** with the brief above — generates 3 UI variants in parallel, pick one. This runs concurrently with step 3 mentally, but blocks UI work.
3. **5–20m:** (parallel to shotgun) types.ts + routeStore.ts + routeStore.test.ts (TDD the state machine first — testing-depth showcase). State logic is design-independent, can start immediately.
4. **20–25m:** sample data with real coords
5. **25–55m:** UI (StopList, StopCard, RouteMap, ProgressHeader) implementing the chosen shotgun variant. Tailwind tokens come from the variant.
6. **55–75m:** Playwright e2e specs covering the Demo Script. Run them. Fix what breaks.
7. **75–90m:** README.md (run/test/design decisions + Demo Script) + AGENTS.md (which prompts went to which subagent, shotgun output, what /qa caught)
8. **90–105m:** `/qa` pass via gstack — let it find bugs and fix them, log everything
9. **105–115m:** `/review` pass, polish, final test run
10. **115–118m:** buffer / commit / final README polish

## How to Use Gstack During the Build

- **`/plan-eng-review`** on this plan first (5min) — locks in architecture
- **Subagent the UI components in parallel** — StopList, RouteMap, ProgressHeader can be three independent Agent calls, since data model is locked
- **`/qa`** after the e2e tests pass — this is the killer move. Let gstack find bugs, then commit the fixes atomically. Each fix becomes evidence in AGENTS.md.
- **`/review`** before final commit — catches the stuff `/qa` doesn't (code structure, edge cases)

## Testing Strategy (the showcase)

- **Unit (Vitest):** every state transition in routeStore. ~12 tests. Tests written BEFORE the store logic — TDD trail visible in commit history.
- **E2E (Playwright):** operator flow happy path + failure path + page refresh persistence. Screenshots on failure.
- **`/qa` log in AGENTS.md:** what gstack found, what it fixed, what it verified.

## Verification

- `bun run dev` → app loads at localhost, map renders, 5 stops visible
- `bun run test` → all unit tests pass
- `bun run test:e2e` → all playwright tests pass
- **Run the full Demo Script above start to finish** without touching code or console. If any step requires explanation, the MVP isn't done.
- Refresh mid-route → state survives, exact same stop highlighted, exact same timestamps.
- README has clear run + test instructions + the demo script; AGENTS.md has the agent log.

## What's Explicitly Out of Scope

- No real GPS / no real backend / no auth / no map routing API (just straight lines)
- No drone telemetry / no weather / no ETAs
- No multi-route or multi-operator views
- No mobile responsive polish beyond "doesn't look broken"

These are the right cuts for a 2-hour exercise that grades agent orchestration, not feature breadth.
