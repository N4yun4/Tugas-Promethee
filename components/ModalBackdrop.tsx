'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portals to <body> so the fixed overlay is never offset by a parent's
 * spacing utilities (e.g. space-y-* adds margin-top to every child).
 */
export function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      {children}
    </div>,
    document.body
  );
}
