import { useRouteStore, selectProgress, isRouteComplete } from '../store/routeStore';

export function ProgressHeader() {
  const route = useRouteStore((s) => s.route);
  const reset = useRouteStore((s) => s.resetRoute);
  const { done, total } = selectProgress(route);
  const complete = isRouteComplete(route);

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
