'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import type { ActionResult } from '@/lib/action';

type Kind = 'success' | 'error' | 'warning';
type ToastItem = { id: number; message: string; kind: Kind };
type Notify = (message: string, kind?: Kind) => void;

const ToastContext = createContext<Notify>(() => {});
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const notify = useCallback<Notify>((message, kind = 'success') => {
    const id = nextId++;
    setItems((cur) => [...cur, { id, message, kind }]);
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast ${t.kind}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

/** Shows the outcome of a server action and reports whether it succeeded. */
export function useReport() {
  const notify = useToast();
  return (result: ActionResult) => {
    notify(result.ok ? result.message : result.error, result.ok ? 'success' : 'error');
    return result.ok;
  };
}
