import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useWallet } from '../../context/WalletContext.jsx';
import { api } from '../../lib/api.js';
import { cx } from '../../lib/cx.js';
import { formatMoney, fromCents, todayISO, toCents } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import { Field, Select, TextInput } from '../ui/Field.jsx';

/**
 * Add or edit a transaction. Type switches which category tree is offered, and the
 * API answers with any budget that the new expense just pushed over its limit.
 */
export default function TransactionForm({ transaction, defaultType = 'expense', onDone, onCancel }) {
  const { accounts, expenseCategories, incomeCategories, refresh } = useWallet();
  const { push, pushBudgetAlerts } = useToast();

  const activeAccounts = accounts.filter((account) => !account.is_archived);
  const [form, setForm] = useState({
    type: transaction?.type ?? defaultType,
    amount: transaction ? fromCents(transaction.amount_cents) : '',
    date: transaction?.date ?? todayISO(),
    account_id: transaction?.account_id ?? activeAccounts[0]?.id ?? '',
    category_id: transaction?.category_id ?? '',
    description: transaction?.description ?? '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const categoryTree = form.type === 'income' ? incomeCategories : expenseCategories;
  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  function changeType(type) {
    // Categories are kind specific, so the choice is cleared when the kind changes.
    setForm((current) => ({ ...current, type, category_id: '' }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const cents = toCents(form.amount);
    if (!Number.isFinite(cents) || cents <= 0) nextErrors.amount = 'Enter an amount greater than zero';
    if (!form.date) nextErrors.date = 'Pick a date';
    if (!form.account_id) nextErrors.account_id = 'Choose the account this belongs to';

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const payload = {
        type: form.type,
        amount_cents: cents,
        date: form.date,
        account_id: Number(form.account_id),
        category_id: form.category_id ? Number(form.category_id) : null,
        description: form.description.trim(),
      };

      const response = transaction
        ? await api.transactions.update(transaction.id, payload)
        : await api.transactions.create(payload);

      await refresh();

      push({
        title: transaction ? 'Transaction updated' : 'Transaction recorded',
        description: `${payload.type === 'income' ? 'Received' : 'Spent'} ${formatMoney(cents)}`,
      });
      pushBudgetAlerts(response?.meta?.budget_alerts ?? []);

      onDone?.(response?.data);
    } catch (error) {
      setFormError(error.message);
      setErrors({
        amount: error.fieldError?.('amount_cents') ?? '',
        account_id: error.fieldError?.('account_id') ?? '',
        category_id: error.fieldError?.('category_id') ?? '',
        date: error.fieldError?.('date') ?? '',
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1" role="group" aria-label="Transaction type">
        {[
          { value: 'expense', label: 'Expense' },
          { value: 'income', label: 'Income' },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => changeType(option.value)}
            aria-pressed={form.type === option.value}
            className={cx(
              'rounded-lg px-3 py-2 text-sm font-medium transition',
              form.type === option.value
                ? cx(
                    'bg-white shadow-sm',
                    option.value === 'expense' ? 'text-rose-600' : 'text-emerald-600',
                  )
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount (RWF)" htmlFor="tx-amount" error={errors.amount}>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
              RWF
            </span>
            <TextInput
              id="tx-amount"
              inputMode="decimal"
              className="pl-12 text-base font-semibold"
              value={form.amount}
              onChange={update('amount')}
              placeholder="0"
              autoFocus
            />
          </div>
        </Field>

        <Field label="Date" htmlFor="tx-date" error={errors.date}>
          <TextInput id="tx-date" type="date" value={form.date} onChange={update('date')} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Account" htmlFor="tx-account" error={errors.account_id}>
          <Select id="tx-account" value={form.account_id} onChange={update('account_id')}>
            <option value="">Select an account</option>
            {activeAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </Field>

        <Field
          label="Category"
          htmlFor="tx-category"
          error={errors.category_id}
          hint={form.type === 'expense' ? 'Link the expense to a category for reports' : undefined}
        >
          <Select id="tx-category" value={form.category_id} onChange={update('category_id')}>
            <option value="">Uncategorised</option>
            {categoryTree.map((parent) => (
              <optgroup key={parent.id} label={parent.name}>
                <option value={parent.id}>{parent.name} (general)</option>
                {(parent.children ?? []).map((child) => (
                  <option key={child.id} value={child.id}>
                    {child.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Description" htmlFor="tx-description" hint="Optional, but helpful later">
        <TextInput
          id="tx-description"
          value={form.description}
          onChange={update('description')}
          placeholder="e.g. Groceries at Simba Supermarket"
          maxLength={160}
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : transaction ? 'Save changes' : 'Add transaction'}
        </Button>
      </div>
    </form>
  );
}
