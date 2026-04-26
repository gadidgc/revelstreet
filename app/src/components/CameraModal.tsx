import { useEffect, useRef, useState } from 'react';
import { useSimStore, CAMERA_VIDEO_URL } from '../store/simStore';

type Mode = 'live' | 'past';

export function CameraModal() {
  const open = useSimStore((s) => s.cameraOpen);
  const close = useSimStore((s) => s.closeCamera);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mode, setMode] = useState<Mode>('live');

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
    if (open) setMode('live');
  }, [open]);

  const rewind = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
    setMode('past');
  };

  const goLive = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.duration && Number.isFinite(v.duration)) {
      v.currentTime = Math.max(0, v.duration - 0.5);
    }
    v.play().catch(() => {});
    setMode('live');
  };

  if (!open) return null;

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
          {mode === 'live' ? 'Live' : 'Playback · −10 min'}
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

        {/* Bottom control bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-3 bg-gradient-to-t from-black/85 to-transparent p-4">
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
  );
}
