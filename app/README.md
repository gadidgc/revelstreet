# Drone Delivery Operator Console

Web app for drone delivery operators to manage pickup-and-delivery routes — see where to go, mark arrival/departure, confirm success or failure, never lose progress.

Built for the Revelstreet engineering exercise. Total elapsed time: ~2 hours, agent-driven via Claude Code + gstack.

## Run it

Requires Node 20+ (developed on Node 22). No global install needed beyond `pnpm` (or use `npm`/`yarn` — scripts are interchangeable).

```bash
cd app
pnpm install
pnpm dev
# open http://localhost:5173
```

That's it. No backend, no database, no env vars. The sample route loads automatically.

## Test it

```bash
pnpm test          # 19 unit tests on the route state machine (Vitest)
pnpm test:e2e      # 7 end-to-end tests of the operator flow (Playwright)
pnpm test:all      # both
```

First-time Playwright run also needs:

```bash
npx playwright install chromium
```

## What the app actually does — the demo flow

This is what we expect a drone operator to be able to do, end-to-end, without anyone narrating. The interviewer should be able to sit down, open the app, and walk through it.

1. **Open the app.** Today's route is already loaded. Operator name shows in the header. Progress reads "0 of 5 stops complete." The 5 stops appear in order on the left; the same stops are plotted on a Leaflet map on the right with numbered pins (red = pickup, blue = delivery) and a dashed line connecting them in route order.
2. **Stop 1 — pickup at Tartine Bakery.** The first stop is highlighted in amber on both panels. Click "Mark Arrived." The status chip flips, a timestamp is captured, the map pin recolors. Click "Departed with package." Status flips to DEPARTED. The next stop auto-highlights. Progress: "1 of 5."
3. **Stop 2 — pickup at La Taqueria.** Same flow. Both pickups done.
4. **Stop 3 — delivery to 123 Oak St.** Click "Mark Arrived," then "Mark Delivered." Status COMPLETED. Progress: "3 of 5."
5. **Stop 4 — delivery to 450 Pine Ave.** Arrive, then "Mark Failed." A modal asks for a reason — pick a quick-pick chip ("No one home") or type your own. Confirm. The status flips to FAILED with a red reason badge visible on the card.
6. **Stop 5 — delivery to 78 Maple Rd.** Arrive, deliver. Header reads "5 of 5 — Route Complete" in green.
7. **Refresh the page.** Everything persists. Same stops, same statuses, same timestamps, same failure reason. This is the line between "demo" and "actually usable."
8. **Click "Start New Route."** Confirm the prompt. State resets, ready for the next shift.

Only the next legal action button is shown at any time — you can't accidentally mark a stop complete before arriving, can't depart before arriving, can't fail a pickup. The state machine in `src/store/routeStore.ts` enforces this and throws on illegal transitions.

## Design decisions worth knowing

**Single screen, no routing.** The whole job is one ops console. SPA routing would be ceremony.

**Operator-cockpit aesthetic.** Dark background, high contrast, large tap targets, status-color-driven (amber for in-progress, emerald for complete, rose for failed, sky for delivery, rose for pickup). Choice driven by the use case: this app gets used outdoors, on a tablet, with one hand. Not a marketing site.

**Zustand + persist middleware over Redux/Context.** Store is ~150 LOC and the entire app uses 4 selectors. localStorage persistence is one line of middleware config — no manual serialize/deserialize.

**State machine in the store, not the components.** Every transition (`markArrived`, `markDeparted`, `markCompleted`, `markFailed`) is a pure function on store state with explicit illegal-transition errors. This made TDD trivial — 19 tests written before the components, all passing on first build.

**Leaflet over Google Maps.** No API key, no billing, no setup. OpenStreetMap tiles, custom div-icon pins so we control the styling.

**No backend.** Sample data lives in `src/data/routes.ts`. State lives in memory + localStorage. The exercise explicitly said "no persistent database required" — taking that seriously frees up time for what's graded (testing + agent orchestration).

## What's intentionally not here

Real GPS, real auth, multiple operators, multiple routes, real road routing on the map, mobile responsive polish, drone telemetry, ETAs. All would be straightforward additions on top of the existing state machine. None would change the score for a 2-hour agent-orchestration exercise.

## Project structure

```
app/
├── src/
│   ├── App.tsx                  # 2-pane layout (header + list + map)
│   ├── types.ts                 # Stop / Route / StopStatus types
│   ├── components/
│   │   ├── ProgressHeader.tsx   # operator name, progress, reset
│   │   ├── StopList.tsx         # ordered list of cards
│   │   ├── StopCard.tsx         # status chip, contextual action, fail modal
│   │   └── RouteMap.tsx         # leaflet map with numbered pins + polyline
│   ├── store/
│   │   ├── routeStore.ts        # zustand store + state machine + selectors
│   │   └── routeStore.test.ts   # 19 unit tests (every legal + illegal transition)
│   ├── data/
│   │   └── routes.ts            # sample SF route: 2 pickups, 3 deliveries
│   └── test/setup.ts            # vitest setup
├── tests/e2e/
│   ├── operator-flow.spec.ts    # happy path + reset + contextual buttons
│   └── failure-flow.spec.ts     # failure modal + custom reason + persistence
├── playwright.config.ts
└── vite.config.ts               # vite + tailwind v4 + vitest config
```

See `../AGENTS.md` (one level up) for the agent orchestration log — what was delegated, in what order, and what each pass caught.
