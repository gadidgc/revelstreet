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
    <header className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-6 py-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-neutral-500">
          Drone Operator
        </p>
        <h1 className="text-xl font-semibold text-white">
          Hi, {route.operatorName}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        <button
          data-testid="camera-button"
          type="button"
          onClick={openCamera}
          title="Open drone POV camera"
          className="flex items-center gap-2 rounded-md border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-300 hover:border-rose-400 hover:bg-rose-500/20"
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
          className={
            'text-lg font-medium tabular-nums ' +
            (complete ? 'text-emerald-400' : 'text-neutral-200')
          }
        >
          {complete ? (
            <span>{done} of {total} — Route Complete</span>
          ) : (
            <span>
              {done} <span className="text-neutral-500">of</span> {total} stops complete
            </span>
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
          className="rounded border border-neutral-700 bg-neutral-900 px-4 py-2 text-sm font-medium text-neutral-200 hover:border-neutral-500 hover:bg-neutral-800"
        >
          Start New Route
        </button>
      </div>
    </header>
  );
}
