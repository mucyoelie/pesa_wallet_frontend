import {
  ArrowLeftRight,
  FileBarChart,
  Landmark,
  LayoutDashboard,
  Tags,
  Target,
  Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { cx } from '../../lib/cx.js';
import { formatMoney } from '../../lib/format.js';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/transactions', label: 'Transactions', icon: ArrowLeftRight },
  { to: '/accounts', label: 'Accounts', icon: Landmark },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/budgets', label: 'Budgets', icon: Target },
  { to: '/reports', label: 'Reports', icon: FileBarChart },
];

export default function Sidebar({ accounts = [], alertCount = 0, onNavigate }) {
  const { user } = useAuth();
  const initials =
    (user?.name ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join('') || 'PW';

  const totalBalance = accounts
    .filter((account) => !account.is_archived)
    .reduce((sum, account) => sum + account.balance_cents, 0);

  return (
    <aside className="flex h-full w-64 flex-col bg-slate-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          <Wallet className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-white">Pesa Wallet</p>
          <p className="text-[11px] text-slate-400">Personal finance tracker</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                isActive
                  ? 'bg-indigo-500/15 text-white ring-1 ring-inset ring-indigo-400/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cx('h-4 w-4', isActive ? 'text-indigo-300' : 'text-slate-500')} />
                <span className="flex-1">{item.label}</span>
                {item.to === '/budgets' && alertCount > 0 ? (
                  <span className="rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {alertCount}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="m-3 flex items-center gap-3 rounded-xl bg-white/5 p-3 ring-1 ring-inset ring-white/5">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-semibold text-indigo-200">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{user?.name}</p>
          <p className="truncate text-[11px] text-slate-400">{user?.email}</p>
        </div>
      </div>

      <div className="m-3 rounded-xl bg-white/5 p-4 ring-1 ring-inset ring-white/5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Total balance</p>
        <p className="mt-1 text-lg font-semibold text-white">{formatMoney(totalBalance)}</p>
        <p className="mt-0.5 text-[11px] text-slate-400">
          {accounts.filter((account) => !account.is_archived).length} active accounts
        </p>
      </div>
    </aside>
  );
}
