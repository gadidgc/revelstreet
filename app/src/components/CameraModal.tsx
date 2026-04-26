import { useEffect } from 'react';
import { useSimStore, CAMERA_VIDEO_URL } from '../store/simStore';

export function CameraModal() {
  const open = useSimStore((s) => s.cameraOpen);
  const close = useSimStore((s) => s.closeCamera);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);

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
        className="w-full max-w-3xl overflow-hidden rounded-lg border border-neutral-700 bg-neutral-950 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-neutral-800 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
              Live · Drone Camera
            </span>
          </div>
          <button
            type="button"
            data-testid="camera-close"
            onClick={close}
            className="rounded border border-neutral-700 px-3 py-1 text-xs text-neutral-300 hover:bg-neutral-800"
            aria-label="Close camera"
          >
            Close (ESC)
          </button>
        </div>
        <video
          data-testid="camera-video"
          src={CAMERA_VIDEO_URL}
          controls
          autoPlay
          muted
          loop
          playsInline
          className="block h-auto w-full bg-black"
        />
        <p className="px-4 py-2 text-xs text-neutral-500">
          Real-time drone POV. Use the timeline to scrub back to earlier footage.
        </p>
      </div>
    </div>
  );
}
