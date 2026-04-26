import { useState } from 'react';
import type { Stop } from '../types';
import { useRouteStore, nextActionFor } from '../store/routeStore';
import { FAILURE_REASONS } from '../data/routes';

type Props = {
  stop: Stop;
  index: number;
  isActive: boolean;
};

const STATUS_STYLES: Record<Stop['status'], string> = {
  pending: 'bg-neutral-800 text-neutral-400',
  arrived: 'bg-amber-900/40 text-amber-300 border border-amber-700/50',
  departed: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
  completed: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/50',
  failed: 'bg-rose-900/40 text-rose-300 border border-rose-700/50',
};

const TYPE_BADGE: Record<Stop['type'], { label: string; cls: string }> = {
  pickup: { label: 'PICKUP', cls: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
  delivery: { label: 'DELIVERY', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
};

function formatTime(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function StopCard({ stop, index, isActive }: Props) {
  const [failOpen, setFailOpen] = useState(false);
  const [failReason, setFailReason] = useState('');

  const markArrived = useRouteStore((s) => s.markArrived);
  const markDeparted = useRouteStore((s) => s.markDeparted);
  const markCompleted = useRouteStore((s) => s.markCompleted);
  const markFailed = useRouteStore((s) => s.markFailed);

  const action = nextActionFor(stop);
  const typeBadge = TYPE_BADGE[stop.type];

  return (
    <li
      data-testid={`stop-card-${stop.id}`}
      data-active={isActive}
      data-status={stop.status}
      className={
        'rounded-lg border p-4 transition-all ' +
        (isActive
          ? 'border-amber-500/60 bg-neutral-900 shadow-[0_0_0_2px_rgba(245,158,11,0.15)]'
          : 'border-neutral-800 bg-neutral-900/40')
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-semibold ' +
            (isActive
              ? 'bg-amber-500 text-neutral-950'
              : 'bg-neutral-800 text-neutral-300')
          }
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={
                'rounded border px-1.5 py-0.5 text-[10px] font-bold tracking-wide ' +
                typeBadge.cls
              }
            >
              {typeBadge.label}
            </span>
            <span
              data-testid={`status-${stop.id}`}
              className={
                'rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ' +
                STATUS_STYLES[stop.status]
              }
            >
              {stop.status}
            </span>
          </div>
          <p className="truncate font-medium text-white">{stop.name}</p>
          <p className="truncate text-sm text-neutral-400">{stop.address}</p>

          {stop.arrivedAt && (
            <p className="mt-2 text-xs text-neutral-500">
              Arrived {formatTime(stop.arrivedAt)}
              {stop.departedAt && ` · Departed ${formatTime(stop.departedAt)}`}
              {stop.completedAt && ` · Delivered ${formatTime(stop.completedAt)}`}
              {stop.failedAt && ` · Failed ${formatTime(stop.failedAt)}`}
            </p>
          )}

          {stop.failureReason && (
            <p
              data-testid={`failure-reason-${stop.id}`}
              className="mt-2 inline-block rounded border border-rose-700/60 bg-rose-950/50 px-2 py-1 text-xs text-rose-200"
            >
              Reason: {stop.failureReason}
            </p>
          )}
        </div>
      </div>

      {/* Contextual action button — only the next legal action shows */}
      {action !== 'done' && (
        <div className="mt-3 flex gap-2">
          {action === 'arrived' && (
            <button
              data-testid={`btn-arrived-${stop.id}`}
              type="button"
              onClick={() => markArrived(stop.id)}
              className="flex-1 rounded bg-amber-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-amber-400"
            >
              Mark Arrived
            </button>
          )}
          {action === 'departed' && (
            <button
              data-testid={`btn-departed-${stop.id}`}
              type="button"
              onClick={() => markDeparted(stop.id)}
              className="flex-1 rounded bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
            >
              Departed with package
            </button>
          )}
          {action === 'completed-or-failed' && (
            <>
              <button
                data-testid={`btn-completed-${stop.id}`}
                type="button"
                onClick={() => markCompleted(stop.id)}
                className="flex-1 rounded bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-neutral-950 hover:bg-emerald-400"
              >
                Mark Delivered
              </button>
              <button
                data-testid={`btn-failed-${stop.id}`}
                type="button"
                onClick={() => setFailOpen(true)}
                className="rounded border border-rose-600/60 bg-rose-950/30 px-4 py-2.5 text-sm font-semibold text-rose-200 hover:bg-rose-900/40"
              >
                Mark Failed
              </button>
            </>
          )}
        </div>
      )}

      {failOpen && (
        <div
          data-testid={`fail-modal-${stop.id}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
        >
          <div className="w-full max-w-md rounded-lg border border-neutral-700 bg-neutral-900 p-5">
            <h2 className="mb-1 text-lg font-semibold text-white">
              Why did this delivery fail?
            </h2>
            <p className="mb-4 text-sm text-neutral-400">
              Stop {index + 1}: {stop.name}
            </p>

            <div className="mb-3 flex flex-wrap gap-2">
              {FAILURE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`fail-quick-${r.replaceAll(' ', '-')}`}
                  onClick={() => setFailReason(r)}
                  className={
                    'rounded border px-3 py-1.5 text-xs font-medium ' +
                    (failReason === r
                      ? 'border-rose-500 bg-rose-950/50 text-rose-200'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-300 hover:border-neutral-500')
                  }
                >
                  {r}
                </button>
              ))}
            </div>

            <textarea
              data-testid={`fail-reason-input-${stop.id}`}
              value={failReason}
              onChange={(e) => setFailReason(e.target.value)}
              placeholder="Or type a reason..."
              rows={3}
              className="w-full rounded border border-neutral-700 bg-neutral-950 p-2 text-sm text-white outline-none focus:border-rose-500"
            />

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFailOpen(false);
                  setFailReason('');
                }}
                className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 hover:bg-neutral-800"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid={`fail-confirm-${stop.id}`}
                disabled={!failReason.trim()}
                onClick={() => {
                  markFailed(stop.id, failReason);
                  setFailOpen(false);
                  setFailReason('');
                }}
                className="rounded bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}
    </li>
  );
}
