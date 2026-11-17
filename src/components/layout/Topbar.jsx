import { useEffect, useRef, useState } from 'react';
import { Bell, LogOut, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { cx } from '../../lib/cx.js';
import { formatMoney } from '../../lib/format.js';
import Button from '../ui/Button.jsx';

function AlertRow({ alert }) {
  const exceeded = alert.status === 'exceeded';
  return (
    <li className="px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{alert.category_name}</p>
        <span
          className={cx(
            'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            exceeded ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700',
          )}
        >
          {Math.round(alert.percent)}%
        </span>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">
        {formatMoney(alert.spent_cents)} of {formatMoney(alert.amount_cents)} spent
        {exceeded ? ' — over the limit' : ' — almost there'}
      </p>
    </li>
  );
}

/** Sticky header with the budget notification bell. */
export default function Topbar({ title, subtitle, alerts = [], onOpenMenu }) {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!containerRef.current?.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>
      </div>

      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="relative rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label={`Budget alerts${alerts.length ? ` (${alerts.length} active)` : ''}`}
          aria-expanded={open}
        >
          <Bell className="h-5 w-5" />
          {alerts.length > 0 ? (
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
              {alerts.length}
            </span>
          ) : null}
        </button>

        {open ? (
          <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
            <div className="border-b border-slate-100 px-4 py-3">
              <p className="text-sm font-semibold text-slate-900">Budget alerts</p>
              <p className="text-xs text-slate-500">Current month</p>
            </div>

            {alerts.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-500">
                All budgets are on track. Nice work.
              </p>
            ) : (
              <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
                {alerts.map((alert) => (
                  <AlertRow key={alert.id} alert={alert} />
                ))}
              </ul>
            )}

            <Link
              to="/budgets"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-indigo-600 transition hover:bg-slate-50"
            >
              Manage budgets
            </Link>
          </div>
        ) : null}
      </div>

      <Button variant="secondary" size="sm" icon={LogOut} onClick={() => logout()}>
        Log out
      </Button>
    </header>
  );
}
