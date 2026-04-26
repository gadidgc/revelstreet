import { useRouteStore, selectProgress, isRouteComplete } from '../store/routeStore';
import { useSimStore } from '../store/simStore';

export function ProgressHeader() {
  const route = useRouteStore((s) => s.route);
  const reset = useRouteStore((s) => s.resetRoute);
  const { done, total } = selectProgress(route);
  const complete = isRouteComplete(route);

  const isPlaying = useSimStore((s) => s.isPlaying);
  const play = useSimStore((s) => s.play);
  const pause = useSimStore((s) => s.pause);
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
        <div
          data-testid="sim-controls"
          className="flex items-center gap-1 rounded-md border border-neutral-700 bg-neutral-900 p-1"
        >
          {isPlaying ? (
            <button
              data-testid="sim-pause"
              type="button"
              onClick={pause}
              className="rounded px-3 py-1.5 text-sm font-medium text-neutral-100 hover:bg-neutral-800"
              title="Pause drone simulation"
            >
              ⏸ Pause
            </button>
          ) : (
            <button
              data-testid="sim-play"
              type="button"
              onClick={play}
              className="rounded bg-sky-500/15 px-3 py-1.5 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
              title="Play drone simulation"
            >
              ▶ Play
            </button>
          )}
          <button
            data-testid="sim-reset"
            type="button"
            onClick={simReset}
            className="rounded px-3 py-1.5 text-sm text-neutral-300 hover:bg-neutral-800"
            title="Reset drone to first stop"
          >
            ↺ Reset
          </button>
          <button
            data-testid="camera-button"
            type="button"
            onClick={openCamera}
            className="rounded px-3 py-1.5 text-sm font-medium text-rose-300 hover:bg-rose-500/15"
            title="Open drone camera"
          >
            📷 Camera
          </button>
        </div>

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
