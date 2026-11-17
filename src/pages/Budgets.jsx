import { useState } from 'react';
import { ChevronLeft, ChevronRight, Pencil, Plus, Target, Trash2 } from 'lucide-react';
import BudgetAlertBanner from '../components/budgets/BudgetAlertBanner.jsx';
import BudgetForm from '../components/budgets/BudgetForm.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import ProgressBar from '../components/ui/ProgressBar.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import useApiQuery from '../hooks/useApiQuery.js';
import { api } from '../lib/api.js';
import { cx } from '../lib/cx.js';
import {
  currentPeriod,
  formatMoney,
  formatRemaining,
  periodLabel,
  shiftPeriod,
} from '../lib/format.js';

const STATUS_LABELS = { ok: 'On track', warning: 'Close to limit', exceeded: 'Exceeded' };
const STATUS_TONES = { ok: 'success', warning: 'warning', exceeded: 'danger' };

function BudgetCard({ budget, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">
            {budget.category_name ?? 'Overall budget'}
          </p>
          <p className="text-xs text-slate-500">{formatMoney(budget.amount_cents)} limit</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Badge tone={STATUS_TONES[budget.status]}>{STATUS_LABELS[budget.status]}</Badge>
        </div>
      </div>

      <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900">
        {formatMoney(budget.spent_cents)}
      </p>

      <ProgressBar
        value={budget.percent}
        tone={budget.status}
        className="mt-3"
        label={`${budget.category_name ?? 'Overall'} budget used`}
      />

      <div className="mt-2 flex items-center justify-between text-xs">
        <span className="text-slate-500">{Math.round(budget.percent)}% used</span>
        <span className={cx(budget.remaining_cents < 0 ? 'font-semibold text-rose-600' : 'text-slate-500')}>
          {formatRemaining(budget.remaining_cents)}
        </span>
      </div>

      <div className="mt-4 flex justify-end gap-1 border-t border-slate-100 pt-2">
        <Button variant="ghost" size="sm" icon={Pencil} onClick={() => onEdit(budget)}>
          Edit
        </Button>
        <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => onDelete(budget)}>
          Remove
        </Button>
      </div>
    </div>
  );
}

export default function Budgets() {
  const { refresh, version } = useWallet();
  const { push, pushBudgetAlerts } = useToast();

  const [period, setPeriod] = useState(currentPeriod());
  const [formState, setFormState] = useState(null); // { budget? }
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const { data: response, loading, error } = useApiQuery(`/budgets?period=${period}`, [version]);
  const overview = response?.data;

  const categoryBudgets = (overview?.budgets ?? []).filter((budget) => budget.category_id !== null);
  const budgetedCategoryIds = categoryBudgets.map((budget) => budget.category_id);

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.budgets.remove(pendingDelete.id);
      await refresh();
      push({ title: 'Budget removed', description: pendingDelete.category_name ?? 'Overall budget' });
      setPendingDelete(null);
    } catch (deleteError) {
      push({ tone: 'error', title: 'Could not remove budget', description: deleteError.message });
    } finally {
      setDeleting(false);
    }
  }

  const isCurrent = period === currentPeriod();

  return (
    <>
      <PageHeader
        title="Budgets"
        description="Set a monthly limit per category and get notified the moment you cross it"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-1 py-1 shadow-sm">
              <Button
                variant="ghost"
                size="icon"
                icon={ChevronLeft}
                onClick={() => setPeriod((current) => shiftPeriod(current, -1))}
                aria-label="Previous month"
              />
              <span className="min-w-[8.5rem] text-center text-sm font-medium text-slate-700">
                {periodLabel(period)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                icon={ChevronRight}
                onClick={() => setPeriod((current) => shiftPeriod(current, 1))}
                aria-label="Next month"
              />
            </div>
            {!isCurrent ? (
              <Button variant="secondary" size="md" onClick={() => setPeriod(currentPeriod())}>
                This month
              </Button>
            ) : null}
            <Button icon={Plus} onClick={() => setFormState({})}>
              Set budget
            </Button>
          </div>
        }
      />

      {overview ? <BudgetAlertBanner alerts={overview.alerts} /> : null}

      {error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-rose-600">{error.message}</p>
          </CardBody>
        </Card>
      ) : loading && !overview ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <Card>
            <CardHeader
              title="Overall budget"
              subtitle={`Every expense in ${periodLabel(period)} counts towards this limit`}
            />
            <CardBody>
              {overview?.overall ? (
                <div>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <p className="text-3xl font-semibold tracking-tight text-slate-900">
                        {formatMoney(overview.overall.spent_cents)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        of {formatMoney(overview.overall.amount_cents)} ·{' '}
                        {formatRemaining(overview.overall.remaining_cents)}
                      </p>
                    </div>
                    <Badge tone={STATUS_TONES[overview.overall.status]}>
                      {Math.round(overview.overall.percent)}% · {STATUS_LABELS[overview.overall.status]}
                    </Badge>
                  </div>
                  <ProgressBar
                    value={overview.overall.percent}
                    tone={overview.overall.status}
                    className="mt-4 h-2.5"
                    label="Overall budget used"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Pencil}
                      onClick={() => setFormState({ budget: overview.overall })}
                    >
                      Edit limit
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="text-sm text-slate-600">
                    You have not set an overall limit for {periodLabel(period)}.
                  </p>
                  <Button size="sm" icon={Plus} onClick={() => setFormState({})}>
                    Set overall budget
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Category budgets</h2>
              <p className="text-xs text-slate-500">
                Spending in a subcategory counts towards its parent category.
              </p>
            </div>
            <Button variant="secondary" size="sm" icon={Plus} onClick={() => setFormState({})}>
              Add category budget
            </Button>
          </div>

          {categoryBudgets.length === 0 ? (
            <EmptyState
              icon={Target}
              title="No category budgets for this month"
              description="Limit the categories you overspend on most — food, transport or entertainment are good places to start."
              action={
                <Button size="sm" icon={Plus} onClick={() => setFormState({})}>
                  Set a category budget
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {categoryBudgets.map((budget) => (
                <BudgetCard
                  key={budget.id}
                  budget={budget}
                  onEdit={(selected) => setFormState({ budget: selected })}
                  onDelete={setPendingDelete}
                />
              ))}
            </div>
          )}

          {overview ? (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Budgeted</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatMoney(overview.totals.budget_cents)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Spent</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {formatMoney(overview.totals.spent_cents)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Alerts</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">{overview.alerts.length}</p>
              </div>
            </div>
          ) : null}
        </>
      )}

      <Modal
        open={Boolean(formState)}
        onClose={() => setFormState(null)}
        title={formState?.budget ? 'Update budget' : 'Set a budget'}
        description={periodLabel(period)}
      >
        {formState ? (
          <BudgetForm
            period={period}
            budget={formState.budget}
            budgetedCategoryIds={budgetedCategoryIds}
            onDone={(data) => {
              setFormState(null);
              pushBudgetAlerts(data?.alerts ?? []);
            }}
            onCancel={() => setFormState(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove this budget?"
        message={
          pendingDelete
            ? `The ${formatMoney(pendingDelete.amount_cents)} limit for ${pendingDelete.category_name ?? 'all expenses'} in ${periodLabel(period)} will be removed. Transactions are not affected.`
            : ''
        }
        confirmLabel="Remove"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
