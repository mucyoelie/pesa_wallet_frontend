import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useWallet } from '../../context/WalletContext.jsx';
import { api } from '../../lib/api.js';
import { COLOR_SWATCHES } from '../../lib/constants.js';
import { cx } from '../../lib/cx.js';
import Button from '../ui/Button.jsx';
import { Field, Select, TextInput } from '../ui/Field.jsx';

/**
 * Add or rename a category. `kind` decides whether it classifies income or expenses,
 * and `parentId` pre-selects a parent when adding a subcategory from the tree.
 */
export default function CategoryForm({ kind, category, parentId = null, onDone, onCancel }) {
  const { expenseCategories, incomeCategories, refresh } = useWallet();
  const { push } = useToast();

  const tree = kind === 'income' ? incomeCategories : expenseCategories;
  const [form, setForm] = useState({
    name: category?.name ?? '',
    kind: category?.kind ?? kind,
    parent_id: category ? (category.parent_id ? String(category.parent_id) : '') : parentId ? String(parentId) : '',
    color: category?.color ?? COLOR_SWATCHES[1],
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  // A category that already has children cannot become a subcategory itself.
  const canPickParent = !category || (category.children ?? []).length === 0;
  const parentOptions = (form.kind === 'income' ? incomeCategories : expenseCategories).filter(
    (node) => node.id !== category?.id,
  );

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Give this category a name';
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: form.kind,
        parent_id: form.parent_id ? Number(form.parent_id) : null,
        color: form.color,
      };

      if (category) await api.categories.update(category.id, payload);
      else await api.categories.create(payload);

      await refresh();
      push({ title: category ? 'Category updated' : 'Category added', description: payload.name });
      onDone?.();
    } catch (error) {
      setFormError(error.message);
      setErrors({ name: error.fieldError?.('name') ?? '' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
      ) : null}

      <Field label="Name" htmlFor="category-name" error={errors.name}>
        <TextInput
          id="category-name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder={kind === 'expense' ? 'e.g. Groceries' : 'e.g. Freelance'}
          autoFocus
          maxLength={50}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Kind" htmlFor="category-kind" hint={category ? 'Cannot change once used' : undefined}>
          <Select
            id="category-kind"
            value={form.kind}
            onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value, parent_id: '' }))}
            disabled={Boolean(category)}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </Select>
        </Field>

        <Field label="Parent" htmlFor="category-parent" hint="Leave empty for a top level category">
          <Select
            id="category-parent"
            value={form.parent_id}
            onChange={(event) => setForm((current) => ({ ...current, parent_id: event.target.value }))}
            disabled={!canPickParent}
          >
            <option value="">None — top level</option>
            {parentOptions.map((parent) => (
              <option key={parent.id} value={parent.id}>
                {parent.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Colour">
        <div className="flex flex-wrap gap-2">
          {COLOR_SWATCHES.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setForm((current) => ({ ...current, color }))}
              aria-label={`Use colour ${color}`}
              aria-pressed={form.color === color}
              className={cx(
                'h-7 w-7 rounded-full ring-offset-2 transition hover:scale-110',
                form.color === color ? 'ring-2 ring-slate-900' : 'ring-1 ring-slate-200',
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </Field>

      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : category ? 'Save changes' : 'Add category'}
        </Button>
      </div>
    </form>
  );
}
