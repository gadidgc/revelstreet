import { useEffect, useRef, useState } from 'react';
import { useSimStore, CAMERA_VIDEO_URL } from '../store/simStore';

type Mode = 'live' | 'past';

const WINDOW_SECONDS = 10 * 60; // simulated rewindable window: 10 minutes

function formatOffset(secondsAgo: number): string {
  const s = Math.max(0, Math.round(secondsAgo));
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `−${mm}:${ss}`;
}

export function CameraModal() {
  const open = useSimStore((s) => s.cameraOpen);
  const close = useSimStore((s) => s.closeCamera);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('live');
  // 0 = 10 minutes ago, 1 = now (live).
  const [scrub, setScrub] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

  // Reset to live whenever the modal is opened.
  useEffect(() => {
    if (open) {
      setMode('live');
      setScrub(1);
    }
  }, [open]);

  const seekToScrub = (next: number) => {
    const v = videoRef.current;
    if (!v) return;
    const dur = Number.isFinite(v.duration) ? v.duration : 0;
    if (dur > 0) v.currentTime = Math.max(0, Math.min(dur, dur * next));
    v.play().catch(() => {});
  };

  const rewind = () => {
    setMode('past');
    setScrub(0);
    seekToScrub(0);
  };

  const goLive = () => {
    setMode('live');
    setScrub(1);
    const v = videoRef.current;
    if (!v) return;
    if (Number.isFinite(v.duration) && v.duration > 0) {
      v.currentTime = Math.max(0, v.duration - 0.5);
    }
    v.play().catch(() => {});
  };

  const onScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = parseFloat(e.target.value);
    setScrub(next);
    seekToScrub(next);
    // Touching the slider while live moves us into playback.
    if (next < 1 && mode === 'live') setMode('past');
    if (next >= 1 && mode === 'past') setMode('live');
  };

  if (!open) return null;

  const secondsAgo = Math.round((1 - scrub) * WINDOW_SECONDS);
  const offsetLabel = mode === 'live' ? 'Live' : formatOffset(secondsAgo);

  return (
    <div
      data-testid="camera-modal"
      role="dialog"
      aria-label="Drone camera"
      onClick={close}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl overflow-hidden rounded-lg border border-neutral-700 bg-black shadow-2xl"
      >
        <video
          ref={videoRef}
          data-testid="camera-video"
          src={CAMERA_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          className="block h-auto w-full bg-black"
        />

        {/* Status pill, top-left */}
        <div
          data-testid="camera-status"
          className={
            'pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm ' +
            (mode === 'live'
              ? 'bg-rose-600/80 text-white'
              : 'bg-amber-500/85 text-neutral-950')
          }
        >
          <span
            className={
              'inline-block h-2 w-2 rounded-full ' +
              (mode === 'live' ? 'animate-pulse bg-white' : 'bg-neutral-900')
            }
          />
          {mode === 'live' ? 'Live' : `Playback · ${offsetLabel}`}
        </div>

        {/* Close button, top-right */}
        <button
          type="button"
          data-testid="camera-close"
          onClick={close}
          aria-label="Close camera"
          className="absolute right-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm hover:bg-black/75"
        >
          ✕ Close
        </button>

        {/* Bottom control bar — timeline + actions */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
          {/* Timeline: −10:00 ──[slider]── Now */}
          <div className="flex items-center gap-3 text-xs font-medium text-white/80">
            <span className="tabular-nums" data-testid="timeline-left">
              −10:00
            </span>
            <input
              type="range"
              data-testid="camera-scrub"
              min={0}
              max={1}
              step={0.001}
              value={scrub}
              onChange={onScrubChange}
              aria-label="Scrub last 10 minutes of drone footage"
              className="h-1 flex-1 cursor-pointer appearance-none rounded-full bg-white/20 accent-rose-500
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:w-3.5
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-rose-500
                [&::-webkit-slider-thumb]:shadow-[0_0_0_2px_rgba(255,255,255,0.6)]
                [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:w-3.5
                [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0
                [&::-moz-range-thumb]:bg-rose-500"
            />
            <span className="tabular-nums" data-testid="timeline-right">
              Now
            </span>
            <span
              data-testid="timeline-offset"
              className={
                'min-w-[62px] rounded px-2 py-0.5 text-center font-bold tabular-nums ' +
                (mode === 'live' ? 'bg-rose-600/80 text-white' : 'bg-amber-500/85 text-neutral-950')
              }
            >
              {offsetLabel}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            {mode === 'live' ? (
              <button
                type="button"
                data-testid="camera-rewind"
                onClick={rewind}
                className="rounded-md border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm hover:bg-white/20"
              >
                ⏪ Rewind 10 min
              </button>
            ) : (
              <button
                type="button"
                data-testid="camera-go-live"
                onClick={goLive}
                className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
              >
                <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-white align-middle" />
                Back to Live
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
