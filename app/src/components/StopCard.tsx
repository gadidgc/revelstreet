import { useState } from 'react';
import type { Stop } from '../types';
import { useRouteStore, nextActionFor } from '../store/routeStore';
import { FAILURE_REASONS } from '../data/routes';

type Props = {
  stop: Stop;
  index: number;
  isActive: boolean;
};

const STATUS_TEXT: Record<Stop['status'], string> = {
  pending: 'text-ink-muted',
  arrived: 'text-accent',
  departed: 'text-success',
  completed: 'text-success',
  failed: 'text-danger',
};

const TYPE_TEXT: Record<Stop['type'], { label: string; cls: string }> = {
  pickup: { label: 'PICKUP', cls: 'text-accent' },
  delivery: { label: 'DELIVERY', cls: 'text-ink-soft' },
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
  const typeText = TYPE_TEXT[stop.type];

  return (
    <li
      data-testid={`stop-card-${stop.id}`}
      data-active={isActive}
      data-status={stop.status}
      className={
        'relative shrink-0 overflow-hidden rounded-md p-5 transition-colors ' +
        (isActive
          ? 'bg-card-active ring-1 ring-accent/20'
          : 'bg-card')
      }
    >
      {isActive && (
        <span
          aria-hidden
          className="absolute left-0 top-0 h-full w-[3px] bg-accent"
        />
      )}

      <div className="flex items-start gap-4">
        <div
          className={
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-serif text-[15px] ' +
            (isActive
              ? 'bg-accent text-canvas'
              : 'bg-ink text-canvas')
          }
        >
          {index + 1}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-3">
            <span
              className={
                'text-[11px] font-semibold uppercase tracking-[0.16em] ' +
                typeText.cls
              }
            >
              {typeText.label}
            </span>
            <span
              data-testid={`status-${stop.id}`}
              className={
                'font-mono text-[11px] uppercase tracking-wider ' +
                STATUS_TEXT[stop.status]
              }
            >
              {stop.status}
            </span>
          </div>
          <p className="truncate font-medium text-[17px] text-ink">{stop.name}</p>
          <p className="truncate text-[14px] text-ink-soft">{stop.address}</p>

          {stop.arrivedAt && (
            <p className="mt-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              ARR {formatTime(stop.arrivedAt)}
              {stop.departedAt && ` · DEP ${formatTime(stop.departedAt)}`}
              {stop.completedAt && ` · DELIVERED ${formatTime(stop.completedAt)}`}
              {stop.failedAt && ` · FAILED ${formatTime(stop.failedAt)}`}
            </p>
          )}

          {stop.failureReason && (
            <p
              data-testid={`failure-reason-${stop.id}`}
              className="mt-2 inline-block rounded bg-[#fbe9e3] px-2.5 py-1 text-[12px] text-danger"
            >
              Reason: {stop.failureReason}
            </p>
          )}
        </div>
      </div>

      {action !== 'done' && (
        <div className="mt-4 flex gap-2">
          {action === 'arrived' && (
            <button
              data-testid={`btn-arrived-${stop.id}`}
              type="button"
              onClick={() => markArrived(stop.id)}
              className="flex-1 rounded-md bg-accent px-4 py-3 font-serif italic text-[15px] text-canvas transition-colors hover:bg-[#b04931]"
            >
              Mark Arrived
            </button>
          )}
          {action === 'departed' && (
            <button
              data-testid={`btn-departed-${stop.id}`}
              type="button"
              onClick={() => markDeparted(stop.id)}
              className="flex-1 rounded-md bg-success px-4 py-3 font-serif italic text-[15px] text-canvas transition-colors hover:bg-[#67795c]"
            >
              Departed with Package
            </button>
          )}
          {action === 'completed-or-failed' && (
            <>
              <button
                data-testid={`btn-completed-${stop.id}`}
                type="button"
                onClick={() => markCompleted(stop.id)}
                className="flex-1 rounded-md bg-accent px-4 py-3 font-serif italic text-[15px] text-canvas transition-colors hover:bg-[#b04931]"
              >
                Mark Delivered
              </button>
              <button
                data-testid={`btn-failed-${stop.id}`}
                type="button"
                onClick={() => setFailOpen(true)}
                className="rounded-md border border-danger/40 bg-transparent px-4 py-3 font-serif italic text-[15px] text-danger transition-colors hover:bg-[#fbe9e3]"
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
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-ink/40 p-4"
        >
          <div className="w-full max-w-md rounded-md border border-hairline bg-card p-6 shadow-[0_8px_32px_rgba(15,23,41,0.16)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
              Stop {index + 1}
            </p>
            <h2 className="mt-1 font-serif text-[22px] text-ink">
              Why did this delivery fail?
            </h2>
            <p className="mb-4 mt-1 text-[14px] text-ink-soft">{stop.name}</p>

            <div className="mb-3 flex flex-wrap gap-2">
              {FAILURE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  data-testid={`fail-quick-${r.replaceAll(' ', '-')}`}
                  onClick={() => setFailReason(r)}
                  className={
                    'rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors ' +
                    (failReason === r
                      ? 'border-accent bg-[#fbe9e3] text-danger'
                      : 'border-hairline bg-canvas text-ink-soft hover:bg-card-active')
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
              className="w-full rounded-md border border-hairline bg-canvas p-3 text-[14px] text-ink outline-none focus:border-accent"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setFailOpen(false);
                  setFailReason('');
                }}
                className="rounded-md border border-hairline px-4 py-2.5 font-serif italic text-[14px] text-ink-soft hover:bg-canvas"
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
                className="rounded-md bg-danger px-5 py-2.5 font-serif italic text-[14px] text-canvas transition-colors hover:bg-[#8a3024] disabled:cursor-not-allowed disabled:opacity-40"
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
