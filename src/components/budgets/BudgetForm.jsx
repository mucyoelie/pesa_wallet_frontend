import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useWallet } from '../../context/WalletContext.jsx';
import { api } from '../../lib/api.js';
import { fromCents, periodLabel, toCents } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import { Field, Select, TextInput } from '../ui/Field.jsx';

/**
 * Set (or update) the budget for a month, either overall or for one expense
 * category. Saving twice for the same category updates the existing row.
 */
export default function BudgetForm({ period, budget, budgetedCategoryIds = [], onDone, onCancel }) {
  const { expenseCategories, refresh } = useWallet();
  const { push, pushBudgetAlerts } = useToast();

  const [form, setForm] = useState({
    category_id: budget?.category_id ? String(budget.category_id) : '',
    amount: budget ? fromCents(budget.amount_cents) : '',
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Only offer categories that do not have a budget yet, plus the one being edited.
  const options = expenseCategories.filter(
    (category) => !budgetedCategoryIds.includes(category.id) || category.id === budget?.category_id,
  );

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    const cents = toCents(form.amount);
    if (!Number.isFinite(cents) || cents <= 0) nextErrors.amount = 'Enter a budget greater than zero';
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const response = await api.budgets.save({
        period,
        category_id: form.category_id ? Number(form.category_id) : null,
        amount_cents: cents,
      });

      await refresh();
      push({
        title: budget ? 'Budget updated' : 'Budget set',
        description: `${periodLabel(period)} · ${form.amount} RWF`,
      });
      pushBudgetAlerts(response?.data?.alerts ?? []);
      onDone?.(response?.data);
    } catch (error) {
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
      ) : null}

      <Field
        label="Budget for"
        htmlFor="budget-category"
        hint={`Applies to ${periodLabel(period)} only.`}
      >
        <Select
          id="budget-category"
          value={form.category_id}
          onChange={(event) => setForm((current) => ({ ...current, category_id: event.target.value }))}
          disabled={Boolean(budget)}
        >
          <option value="">Overall — every expense</option>
          {options.map((category) => (
            <optgroup key={category.id} label={category.name}>
              <option value={category.id}>{category.name} (whole category)</option>
              {(category.children ?? []).map((child) => (
                <option key={child.id} value={child.id}>
                  {child.name}
                </option>
              ))}
            </optgroup>
          ))}
        </Select>
      </Field>

      <Field label="Limit (RWF)" htmlFor="budget-amount" error={errors.amount} hint="Spending includes every subcategory.">
        <TextInput
          id="budget-amount"
          inputMode="decimal"
          className="text-base font-semibold"
          value={form.amount}
          onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
          placeholder="0"
          autoFocus
        />
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : budget ? 'Update budget' : 'Set budget'}
        </Button>
      </div>
    </form>
  );
}
