import { useRouteStore, selectProgress, isRouteComplete } from '../store/routeStore';
import { useSimStore } from '../store/simStore';

export function ProgressHeader() {
  const route = useRouteStore((s) => s.route);
  const reset = useRouteStore((s) => s.resetRoute);
  const { done, total } = selectProgress(route);
  const complete = isRouteComplete(route);

  const simReset = useSimStore((s) => s.reset);
  const openCamera = useSimStore((s) => s.openCamera);

  return (
    <header className="flex items-center justify-between border-b border-hairline bg-canvas px-8 py-5">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-accent">
          Drone Operator
        </p>
        <h1 className="font-serif text-[28px] leading-tight text-ink">
          Hi, {route.operatorName}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <button
          data-testid="camera-button"
          type="button"
          onClick={openCamera}
          title="Open drone POV camera"
          className="flex items-center gap-2 rounded-md border border-accent/40 bg-accent/10 px-4 py-2 font-serif italic text-[14px] text-accent transition-colors hover:bg-accent/15"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          POV Drone
        </button>

        <div
          data-testid="progress-counter"
          className="flex items-baseline gap-2"
        >
          {complete ? (
            <span className="font-serif text-[24px] tabular-nums text-success">
              {done} of {total} — Route Complete
            </span>
          ) : (
            <>
              <span className="font-serif text-[28px] tabular-nums text-ink">
                {done}
              </span>
              <span className="font-serif italic text-[15px] text-ink-soft">
                of {total} stops complete
              </span>
            </>
          )}
        </div>

        <button
          data-testid="reset-button"
          type="button"
          onClick={() => {
            if (
              confirm(
                'Start a new route? This will reset all stop progress.',
              )
            ) {
              reset();
              simReset();
            }
          }}
          className="rounded-md border border-hairline bg-transparent px-5 py-2.5 font-serif italic text-[14px] text-ink transition-colors hover:bg-card"
        >
          Start New Route
        </button>
      </div>
    </header>
  );
}
