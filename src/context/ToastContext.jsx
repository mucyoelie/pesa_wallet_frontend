import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { cx } from '../lib/cx.js';
import { formatMoney } from '../lib/format.js';

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CheckCircle2, iconClass: 'text-emerald-600', ring: 'ring-slate-200' },
  error: { icon: AlertTriangle, iconClass: 'text-rose-600', ring: 'ring-rose-200' },
  warning: { icon: AlertTriangle, iconClass: 'text-amber-600', ring: 'ring-amber-200' },
  info: { icon: Info, iconClass: 'text-indigo-600', ring: 'ring-slate-200' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (toast) => {
      const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      // Keep at most four on screen so a burst of alerts cannot cover the UI.
      setToasts((current) => [...current.slice(-3), { tone: 'success', ...toast, id }]);
      if (toast.duration !== 0) {
        setTimeout(() => dismiss(id), toast.duration ?? 5000);
      }
      return id;
    },
    [dismiss],
  );

  /** Turn API budget alerts into individual notifications with the amounts. */
  const pushBudgetAlerts = useCallback(
    (alerts = []) => {
      alerts.forEach((alert) => {
        push({
          tone: 'error',
          title: `${alert.category_name} budget exceeded`,
          description: `Spent ${formatMoney(alert.spent_cents)} of ${formatMoney(alert.amount_cents)}.`,
          duration: 8000,
        });
      });
    },
    [push],
  );

  const value = useMemo(() => ({ push, dismiss, pushBudgetAlerts }), [push, dismiss, pushBudgetAlerts]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end sm:p-6"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const tone = TONES[toast.tone] ?? TONES.info;
          const Icon = tone.icon;
          return (
            <div
              key={toast.id}
              className={cx(
                'pointer-events-auto w-full max-w-sm rounded-xl bg-white p-4 shadow-lg ring-1',
                tone.ring,
              )}
            >
              <div className="flex gap-3">
                <Icon className={cx('mt-0.5 h-5 w-5 shrink-0', tone.iconClass)} aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900">{toast.title}</p>
                  {toast.description ? (
                    <p className="mt-0.5 text-sm text-slate-500">{toast.description}</p>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(toast.id)}
                  className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
}
