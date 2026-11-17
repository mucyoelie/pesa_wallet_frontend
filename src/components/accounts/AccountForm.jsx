import { useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { useWallet } from '../../context/WalletContext.jsx';
import { api } from '../../lib/api.js';
import { ACCOUNT_TYPES, COLOR_SWATCHES } from '../../lib/constants.js';
import { cx } from '../../lib/cx.js';
import { fromCents, toCents } from '../../lib/format.js';
import Button from '../ui/Button.jsx';
import { Field, Select, TextInput } from '../ui/Field.jsx';

/** Modal content for adding or editing an account. */
export default function AccountForm({ account, onDone, onCancel }) {
  const { refresh } = useWallet();
  const { push } = useToast();

  const [form, setForm] = useState({
    name: account?.name ?? '',
    type: account?.type ?? 'bank',
    institution: account?.institution ?? '',
    opening_balance: account ? fromCents(account.opening_balance_cents) : '',
    color: account?.color ?? COLOR_SWATCHES[0],
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Give this account a name';
    const opening = form.opening_balance.trim() === '' ? 0 : toCents(form.opening_balance);
    if (!Number.isFinite(opening)) nextErrors.opening_balance = 'Enter a valid amount';

    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length > 0) return;

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        institution: form.institution.trim() || null,
        opening_balance_cents: opening,
        color: form.color,
      };

      if (account) await api.accounts.update(account.id, payload);
      else await api.accounts.create(payload);

      await refresh();
      push({
        title: account ? 'Account updated' : 'Account added',
        description: `${payload.name} · opening balance ${opening / 100} RWF`,
      });
      onDone?.();
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

      <Field label="Account name" htmlFor="account-name" error={errors.name}>
        <TextInput
          id="account-name"
          value={form.name}
          onChange={update('name')}
          placeholder="e.g. Kigali Bank Account"
          autoFocus
          maxLength={60}
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type" htmlFor="account-type">
          <Select id="account-type" value={form.type} onChange={update('type')}>
            {ACCOUNT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Institution" htmlFor="account-institution" hint="Optional">
          <TextInput
            id="account-institution"
            value={form.institution}
            onChange={update('institution')}
            placeholder="e.g. Bank of Kigali"
            maxLength={80}
          />
        </Field>
      </div>

      <Field
        label="Opening balance (RWF)"
        htmlFor="account-opening"
        error={errors.opening_balance}
        hint="The balance this account had before you started tracking it."
      >
        <TextInput
          id="account-opening"
          inputMode="decimal"
          value={form.opening_balance}
          onChange={update('opening_balance')}
          placeholder="0"
        />
      </Field>

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
          {busy ? 'Saving…' : account ? 'Save changes' : 'Add account'}
        </Button>
      </div>
    </form>
  );
}
