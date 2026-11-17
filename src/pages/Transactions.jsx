import { useEffect, useMemo, useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Filter, Pencil, Plus, Receipt, Search, Trash2, X } from 'lucide-react';
import AccountIcon from '../components/accounts/AccountIcon.jsx';
import TransactionForm from '../components/transactions/TransactionForm.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Field, Select, TextInput } from '../components/ui/Field.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import useApiQuery from '../hooks/useApiQuery.js';
import useDebouncedValue from '../hooks/useDebouncedValue.js';
import { api } from '../lib/api.js';
import { categoryLabel, flattenCategories } from '../lib/categories.js';
import { cx } from '../lib/cx.js';
import { formatMoney, formatShortDate } from '../lib/format.js';

const PAGE_SIZE = 15;

const EMPTY_FILTERS = {
  type: '',
  accountId: '',
  categoryId: '',
  from: '',
  to: '',
  sort: 'date_desc',
  page: 1,
};

export default function Transactions() {
  const { accounts, expenseCategories, incomeCategories, version, refresh } = useWallet();
  const { push } = useToast();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // The debounced search term is folded into the filters so pagination starts over.
  useEffect(() => {
    setFilters((current) => ({ ...current, page: 1 }));
  }, [debouncedSearch]);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(filters.page),
      pageSize: String(PAGE_SIZE),
      sort: filters.sort,
    });
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (filters.type) params.set('type', filters.type);
    if (filters.accountId) params.set('accountId', filters.accountId);
    if (filters.categoryId) params.set('categoryId', filters.categoryId);
    if (filters.from) params.set('from', filters.from);
    if (filters.to) params.set('to', filters.to);
    return params.toString();
  }, [filters, debouncedSearch]);

  const { data: response, loading, error } = useApiQuery(`/transactions?${query}`, [version]);
  const transactions = response?.data ?? [];
  const meta = response?.meta;

  const categoryOptions = useMemo(
    () => [
      ...flattenCategories(expenseCategories).map((category) => ({ ...category, kind: 'expense' })),
      ...flattenCategories(incomeCategories).map((category) => ({ ...category, kind: 'income' })),
    ],
    [expenseCategories, incomeCategories],
  );

  const activeFilters =
    Boolean(filters.type || filters.accountId || filters.categoryId || filters.from || filters.to) ||
    Boolean(debouncedSearch);

  function updateFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value, page: 1 }));
  }

  function resetFilters() {
    setSearch('');
    setFilters(EMPTY_FILTERS);
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(transaction) {
    setEditing(transaction);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.transactions.remove(pendingDelete.id);
      await refresh();
      push({ title: 'Transaction deleted' });
      setPendingDelete(null);
    } catch (deleteError) {
      push({ tone: 'error', title: 'Could not delete', description: deleteError.message });
    } finally {
      setDeleting(false);
    }
  }

  const firstRow = meta && meta.total > 0 ? (meta.page - 1) * meta.pageSize + 1 : 0;
  const lastRow = meta ? Math.min(meta.page * meta.pageSize, meta.total) : 0;

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every coin in and out, across all of your accounts"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add transaction
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Filters"
          subtitle={activeFilters ? 'Showing a filtered view' : 'All transactions'}
          actions={
            activeFilters ? (
              <Button variant="ghost" size="sm" icon={X} onClick={resetFilters}>
                Clear
              </Button>
            ) : null
          }
        />
        <CardBody className="pt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Field label="Search" htmlFor="filter-search" className="xl:col-span-2">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden="true"
                />
                <TextInput
                  id="filter-search"
                  className="pl-9"
                  placeholder="Description, account or category"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
            </Field>

            <Field label="Type" htmlFor="filter-type">
              <Select
                id="filter-type"
                value={filters.type}
                onChange={(event) => updateFilter('type', event.target.value)}
              >
                <option value="">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </Select>
            </Field>

            <Field label="Account" htmlFor="filter-account">
              <Select
                id="filter-account"
                value={filters.accountId}
                onChange={(event) => updateFilter('accountId', event.target.value)}
              >
                <option value="">All accounts</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Category" htmlFor="filter-category">
              <Select
                id="filter-category"
                value={filters.categoryId}
                onChange={(event) => updateFilter('categoryId', event.target.value)}
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={`${category.kind}-${category.id}`} value={category.id}>
                    {category.depth > 0 ? `— ${category.parentName} › ${category.name}` : category.name}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Sort" htmlFor="filter-sort">
              <Select
                id="filter-sort"
                value={filters.sort}
                onChange={(event) => updateFilter('sort', event.target.value)}
              >
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
                <option value="amount_desc">Largest amount</option>
                <option value="amount_asc">Smallest amount</option>
              </Select>
            </Field>

            <Field label="From" htmlFor="filter-from">
              <TextInput
                id="filter-from"
                type="date"
                value={filters.from}
                onChange={(event) => updateFilter('from', event.target.value)}
              />
            </Field>

            <Field label="To" htmlFor="filter-to">
              <TextInput
                id="filter-to"
                type="date"
                value={filters.to}
                onChange={(event) => updateFilter('to', event.target.value)}
              />
            </Field>
          </div>
        </CardBody>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Matching transactions</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{meta?.total ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Money in</p>
          <p className="mt-1 text-lg font-semibold text-emerald-600">
            {formatMoney(meta?.totals.income_cents ?? 0)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Money out</p>
          <p className="mt-1 text-lg font-semibold text-rose-600">
            {formatMoney(meta?.totals.expense_cents ?? 0)}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden">
        {error ? (
          <CardBody>
            <p className="text-sm text-rose-600">{error.message}</p>
          </CardBody>
        ) : loading && transactions.length === 0 ? (
          <div className="space-y-3 p-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <CardBody>
            <EmptyState
              icon={Receipt}
              title="No transactions match"
              description={
                activeFilters
                  ? 'Try widening the date range or clearing the filters.'
                  : 'Record your first transaction to get started.'
              }
              action={
                activeFilters ? (
                  <Button variant="secondary" size="sm" icon={Filter} onClick={resetFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" icon={Plus} onClick={openCreate}>
                    Add transaction
                  </Button>
                )
              }
            />
          </CardBody>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Description</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Account</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Category</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Amount</th>
                    <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="transition hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        {formatShortDate(transaction.date)}
                      </td>
                      <td className="max-w-[16rem] px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={cx(
                              'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg',
                              transaction.type === 'income'
                                ? 'bg-emerald-50 text-emerald-600'
                                : 'bg-rose-50 text-rose-600',
                            )}
                          >
                            {transaction.type === 'income' ? (
                              <ArrowDownLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                          </span>
                          <span className="truncate font-medium text-slate-900">
                            {transaction.description || categoryLabel(transaction)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                        <span className="inline-flex items-center gap-1.5">
                          <AccountIcon type={transaction.account_type} className="h-3.5 w-3.5 text-slate-400" />
                          {transaction.account_name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3">
                        {transaction.category_name ? (
                          <span className="inline-flex items-center gap-1.5 text-slate-600">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: transaction.category_color ?? '#94a3b8' }}
                              aria-hidden="true"
                            />
                            {categoryLabel(transaction)}
                          </span>
                        ) : (
                          <Badge>Uncategorised</Badge>
                        )}
                      </td>
                      <td
                        className={cx(
                          'whitespace-nowrap px-5 py-3 text-right font-semibold tabular-nums',
                          transaction.type === 'income' ? 'text-emerald-600' : 'text-slate-900',
                        )}
                      >
                        {transaction.type === 'income' ? '+' : '-'}
                        {formatMoney(transaction.amount_cents)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            icon={Pencil}
                            onClick={() => openEdit(transaction)}
                            aria-label={`Edit transaction from ${transaction.date}`}
                          />
                          <Button
                            variant="danger-ghost"
                            size="icon"
                            icon={Trash2}
                            onClick={() => setPendingDelete(transaction)}
                            aria-label={`Delete transaction from ${transaction.date}`}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
              <p className="text-xs text-slate-500">
                Showing {firstRow}–{lastRow} of {meta?.total ?? 0}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta || meta.page <= 1}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-500">
                  Page {meta?.page ?? 1} of {meta?.totalPages ?? 1}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!meta || meta.page >= meta.totalPages}
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit transaction' : 'Add transaction'}
        description={editing ? `${editing.account_name} · ${editing.date}` : undefined}
      >
        <TransactionForm
          transaction={editing}
          onDone={() => setFormOpen(false)}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this transaction?"
        message={
          pendingDelete
            ? `${formatMoney(pendingDelete.amount_cents)} on ${pendingDelete.date} will be removed and account balances will update.`
            : ''
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
