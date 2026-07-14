import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  /** Accessible label for the sheet dialog. */
  label: string;
  children: ReactNode;
}

/**
 * A bottom sheet that slides up over everything, dismisses on backdrop tap or
 * Escape, and traps its content (SPEC §6). Rendered above the card overlay.
 */
export default function BottomSheet({ open, onClose, label, children }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="pm-sheet-overlay" role="presentation" onClick={onClose}>
      <div
        className="pm-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pm-sheet__grab" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}
