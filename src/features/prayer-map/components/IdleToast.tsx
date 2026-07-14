import type { SessionToast } from '../hooks/useMemberSession';

interface IdleToastProps {
  toast: SessionToast | null;
  onStay: () => void;
}

/**
 * Bottom toast for session events. The idle warning ('warn') offers a "Stay
 * signed in" button ~30s before idle sign-out; sign-out reasons ('info') just
 * explain what happened and auto-dismiss.
 */
export default function IdleToast({ toast, onStay }: IdleToastProps) {
  if (!toast) return null;

  return (
    <div className="pm-idle-toast" role="status" aria-live="polite">
      <div className="pm-idle-toast__text">
        <b>{toast.kind === 'warn' ? 'Still there?' : 'Signed out'}</b>
        <span>{toast.message}</span>
      </div>
      {toast.kind === 'warn' && (
        <button type="button" className="pm-idle-toast__btn" onClick={onStay}>
          Stay signed in
        </button>
      )}
    </div>
  );
}
