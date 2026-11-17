import { useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  PiggyBank,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AccountIcon from '../components/accounts/AccountIcon.jsx';
import BudgetAlertBanner from '../components/budgets/BudgetAlertBanner.jsx';
import CashFlowChart from '../components/charts/CashFlowChart.jsx';
import CategoryDonut from '../components/charts/CategoryDonut.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import useApiQuery from '../hooks/useApiQuery.js';
import { categoryLabel } from '../lib/categories.js';
import { ACCOUNT_TYPE_LABELS } from '../lib/constants.js';
import { cx } from '../lib/cx.js';
import { currentMonthRange, currentPeriod, formatMoney, formatShortDate, periodLabel } from '../lib/format.js';

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-4 h-7 w-32" />
            <Skeleton className="mt-2 h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { budgets, budgetAlerts, version } = useWallet();
  const [formOpen, setFormOpen] = useState(false);

  const range = currentMonthRange();
  const summaryQuery = useApiQuery(`/summary?from=${range.from}&to=${range.to}`, [version]);
  const summary = summaryQuery.data?.data;

  const donutItems = useMemo(() => {
    if (!summary) return [];
    const sorted = [...summary.categories].sort((a, b) => b.total_cents - a.total_cents);
    const items = sorted.slice(0, 5).map((category) => ({
      name: category.name,
      total_cents: category.total_cents,
      color: category.color,
    }));
    const other =
      sorted.slice(5).reduce((sum, category) => sum + category.total_cents, 0) +
      (summary.uncategorized_cents ?? 0);
    if (other > 0) items.push({ name: 'Other', total_cents: other, color: '#94a3b8' });
    return items;
  }, [summary]);

  const accounts = summary?.accounts ?? [];
  const maxBalance = Math.max(...accounts.map((account) => Math.abs(account.balance_cents)), 1);
  const savingsRate =
    summary && summary.totals.income_cents > 0
      ? Math.round((summary.totals.net_cents / summary.totals.income_cents) * 100)
      : 0;

  const budgetList = (budgets?.budgets ?? []).slice(0, 4);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={`Everything across your accounts · ${periodLabel(currentPeriod())}`}
        actions={
          <Button icon={Plus} onClick={() => setFormOpen(true)}>
            Add transaction
          </Button>
        }
      />

      <BudgetAlertBanner alerts={budgetAlerts} />

      {summaryQuery.error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-rose-600">{summaryQuery.error.message}</p>
            <Button variant="secondary" className="mt-3" onClick={() => summaryQuery.reload()}>
              Try again
            </Button>
          </CardBody>
        </Card>
      ) : !summary ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total balance"
              value={formatMoney(summary.total_balance_cents)}
              hint={`Across ${accounts.filter((account) => !account.is_archived).length} accounts`}
              icon={Wallet}
              tone="indigo"
            />
            <StatCard
              label="Income this month"
              value={formatMoney(summary.totals.income_cents)}
              hint={`${summary.totals.transaction_count} transactions recorded`}
              icon={TrendingUp}
              tone="emerald"
            />
            <StatCard
              label="Spent this month"
              value={formatMoney(summary.totals.expense_cents)}
              hint={
                budgets?.overall
                  ? `${Math.round(budgets.overall.percent)}% of your ${formatMoney(budgets.overall.amount_cents, { compact: true })} budget`
                  : 'No overall budget set'
              }
              icon={TrendingDown}
              tone="rose"
            />
            <StatCard
              label="Net savings"
              value={formatMoney(summary.totals.net_cents)}
              hint={summary.totals.income_cents > 0 ? `${savingsRate}% of income kept` : 'No income this month'}
              icon={PiggyBank}
              tone={summary.totals.net_cents >= 0 ? 'emerald' : 'rose'}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title="Cash flow"
                subtitle="Income versus expenses over the last 6 months"
                actions={
                  <Link to="/reports" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                    View reports
                  </Link>
                }
              />
              <CardBody className="pt-3">
                <CashFlowChart data={summary.monthly} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Where the money went" subtitle={periodLabel(currentPeriod())} />
              <CardBody className="pt-3">
                <CategoryDonut items={donutItems} />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader
                title="Accounts"
                subtitle="Live balances"
                actions={
                  <Link to="/accounts" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                    Manage
                  </Link>
                }
              />
              <CardBody className="space-y-4 pt-4">
                {accounts.length === 0 ? (
                  <p className="text-sm text-slate-500">No accounts yet.</p>
                ) : (
                  accounts.map((account) => (
                    <div key={account.id}>
                      <div className="flex items-center gap-2.5">
                        <span
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: account.color }}
                        >
                          <AccountIcon type={account.type} className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">{account.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                          {formatMoney(account.balance_cents, { compact: true })}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(4, (Math.abs(account.balance_cents) / maxBalance) * 100)}%`,
                            backgroundColor: account.color,
                          }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardBody>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader
                title="Recent activity"
                subtitle="Latest transactions across every account"
                actions={
                  <Link to="/transactions" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                    See all
                  </Link>
                }
              />
              <div className="px-5 pb-2 pt-3">
                {summary.recent_transactions.length === 0 ? (
                  <EmptyState
                    icon={ArrowUpRight}
                    title="No transactions yet"
                    description="Record your first income or expense to see it here."
                    action={
                      <Button size="sm" icon={Plus} onClick={() => setFormOpen(true)}>
                        Add transaction
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-slate-100">
                    {summary.recent_transactions.map((transaction) => (
                      <li key={transaction.id} className="flex items-center gap-3 py-3">
                        <span
                          className={cx(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                            transaction.type === 'income'
                              ? 'bg-emerald-50 text-emerald-600'
                              : 'bg-rose-50 text-rose-600',
                          )}
                        >
                          {transaction.type === 'income' ? (
                            <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                          ) : (
                            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {transaction.description || categoryLabel(transaction)}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {formatShortDate(transaction.date)} · {transaction.account_name} ·{' '}
                            {categoryLabel(transaction)}
                          </p>
                        </div>
                        <span
                          className={cx(
                            'shrink-0 text-sm font-semibold tabular-nums',
                            transaction.type === 'income' ? 'text-emerald-600' : 'text-slate-900',
                          )}
                        >
                          {transaction.type === 'income' ? '+' : '-'}
                          {formatMoney(transaction.amount_cents)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Budgets this month"
              subtitle="How much of each limit you have used"
              actions={
                <Link to="/budgets" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">
                  Manage budgets
                </Link>
              }
            />
            <CardBody className="pt-4">
              {budgetList.length === 0 ? (
                <EmptyState
                  icon={Target}
                  title="No budgets set"
                  description="Set a monthly limit and you will be notified as soon as you cross it."
                  action={
                    <Link to="/budgets">
                      <Button size="sm" variant="secondary">
                        Set a budget
                      </Button>
                    </Link>
                  }
                />
              ) : (
                <div className="grid gap-5 sm:grid-cols-2">
                  {budgetList.map((budget) => (
                    <div key={budget.id}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {budget.category_name ?? 'Overall budget'}
                        </p>
                        <Badge
                          tone={
                            budget.status === 'exceeded'
                              ? 'danger'
                              : budget.status === 'warning'
                                ? 'warning'
                                : 'success'
                          }
                        >
                          {Math.round(budget.percent)}%
                        </Badge>
                      </div>
                      <ProgressBar value={budget.percent} tone={budget.status} className="mt-2" />
                      <p className="mt-1.5 text-xs text-slate-500">
                        {formatMoney(budget.spent_cents)} of {formatMoney(budget.amount_cents)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Add transaction">
        <TransactionForm onDone={() => setFormOpen(false)} onCancel={() => setFormOpen(false)} />
      </Modal>
    </>
  );
}
