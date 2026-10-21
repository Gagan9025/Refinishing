'use client';

import { useEffect, type ReactNode } from 'react';

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div className={`modal-overlay${open ? ' active' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" aria-label="Close" onClick={onClose}>×</button>
        </div>
        {/* unmounted when closed so form state resets */}
        {open && children}
      </div>
    </div>
  );
}
