import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const WalletContext = createContext(null);

/**
 * Holds the small pieces of data every screen needs (accounts, the category tree and
 * this month's budgets). Mutations call `refresh()`, which reloads them and bumps
 * `version` so pages that fetch their own reports know to refetch.
 */
export function WalletProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [budgets, setBudgets] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setStatus('loading');
    try {
      const [accountsResponse, categoriesResponse, budgetsResponse] = await Promise.all([
        api.accounts.list(),
        api.categories.list(),
        api.budgets.get(),
      ]);
      setAccounts(accountsResponse?.data ?? []);
      setCategories(categoriesResponse?.data ?? { expense: [], income: [] });
      setBudgets(budgetsResponse?.data ?? null);
      setError(null);
      setStatus('ready');
    } catch (requestError) {
      setError(requestError);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = useCallback(async () => {
    await load({ silent: true });
    setVersion((current) => current + 1);
  }, [load]);

  const value = useMemo(
    () => ({
      accounts,
      categories,
      expenseCategories: categories.expense ?? [],
      incomeCategories: categories.income ?? [],
      budgets,
      budgetAlerts: budgets?.alerts ?? [],
      status,
      error,
      version,
      refresh,
      reload: load,
    }),
    [accounts, categories, budgets, status, error, version, refresh, load],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used inside a WalletProvider');
  return context;
}
