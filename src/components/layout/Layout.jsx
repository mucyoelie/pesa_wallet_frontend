import { useEffect, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useLocation, useOutlet } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext.jsx';
import { currentPeriod, periodLabel } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import Sidebar, { NAV_ITEMS } from './Sidebar.jsx';
import Topbar from './Topbar.jsx';

/** App shell: fixed sidebar on desktop, slide-over drawer on mobile. */
export default function Layout({ children }) {
  const outlet = useOutlet();
  const { accounts, budgetAlerts, status, error, reload } = useWallet();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const current = NAV_ITEMS.find((item) =>
    item.end ? location.pathname === item.to : location.pathname.startsWith(item.to),
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64">
        <Sidebar accounts={accounts} alertCount={budgetAlerts.length} />
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="relative h-full w-64 shadow-2xl">
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              aria-label="Close navigation"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              accounts={accounts}
              alertCount={budgetAlerts.length}
              onNavigate={() => setMenuOpen(false)}
            />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <Topbar
          title={current?.label ?? 'Pesa Wallet'}
          subtitle={`${periodLabel(currentPeriod())} · all accounts`}
          alerts={budgetAlerts}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:py-8">
          {status === 'loading' ? (
            <div className="flex h-[60vh] items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-500" aria-label="Loading" />
            </div>
          ) : status === 'error' ? (
            <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
              <h2 className="text-base font-semibold text-slate-900">Cannot load your wallet</h2>
              <p className="mt-1 text-sm text-slate-500">
                {error?.message ?? 'The API did not respond.'}
              </p>
              <Button className="mt-4" onClick={() => reload()}>
                Try again
              </Button>
            </div>
          ) : (
            <div className="space-y-6">{children ?? outlet}</div>
          )}
        </main>
      </div>
    </div>
  );
}
