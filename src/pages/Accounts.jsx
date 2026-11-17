import { useState } from 'react';
import { Landmark, Pencil, Plus, Trash2, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import AccountForm from '../components/accounts/AccountForm.jsx';
import AccountIcon from '../components/accounts/AccountIcon.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { api } from '../lib/api.js';
import { ACCOUNT_TYPE_LABELS } from '../lib/constants.js';
import { formatMoney } from '../lib/format.js';

export default function Accounts() {
  const { accounts, refresh } = useWallet();
  const { push } = useToast();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const active = accounts.filter((account) => !account.is_archived);
  const totalBalance = active.reduce((sum, account) => sum + account.balance_cents, 0);
  const totalIn = accounts.reduce((sum, account) => sum + account.income_cents, 0);
  const totalOut = accounts.reduce((sum, account) => sum + account.expense_cents, 0);

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(account) {
    setEditing(account);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.accounts.remove(pendingDelete.id);
      await refresh();
      push({ title: 'Account deleted', description: pendingDelete.name });
      setPendingDelete(null);
    } catch (error) {
      push({ tone: 'error', title: 'Could not delete account', description: error.message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Accounts"
        description="Bank accounts, mobile money wallets and cash in one place"
        actions={
          <Button icon={Plus} onClick={openCreate}>
            Add account
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total balance" value={formatMoney(totalBalance)} hint={`${active.length} active accounts`} icon={Wallet} />
        <StatCard label="Money in" value={formatMoney(totalIn)} hint="All time, all accounts" icon={TrendingUp} tone="emerald" />
        <StatCard label="Money out" value={formatMoney(totalOut)} hint="All time, all accounts" icon={TrendingDown} tone="rose" />
      </div>

      {accounts.length === 0 ? (
        <EmptyState
          icon={Landmark}
          title="No accounts yet"
          description="Add your bank account, mobile money wallet or cash to start tracking it."
          action={
            <Button icon={Plus} onClick={openCreate}>
              Add your first account
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {accounts.map((account) => (
            <div
              key={account.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white"
                    style={{ backgroundColor: account.color }}
                  >
                    <AccountIcon type={account.type} className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{account.name}</p>
                    <p className="truncate text-xs text-slate-500">
                      {ACCOUNT_TYPE_LABELS[account.type] ?? account.type}
                      {account.institution ? ` · ${account.institution}` : ''}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    icon={Pencil}
                    onClick={() => openEdit(account)}
                    aria-label={`Edit ${account.name}`}
                  />
                  <Button
                    variant="danger-ghost"
                    size="icon"
                    icon={Trash2}
                    onClick={() => setPendingDelete(account)}
                    aria-label={`Delete ${account.name}`}
                  />
                </div>
              </div>

              {account.is_archived ? (
                <Badge className="mt-3">Archived</Badge>
              ) : null}

              <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">
                {formatMoney(account.balance_cents)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {account.transaction_count} transactions · opening {formatMoney(account.opening_balance_cents)}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="font-medium text-emerald-600">+{formatMoney(account.income_cents, { compact: true })}</span>
                <span className="font-medium text-rose-600">-{formatMoney(account.expense_cents, { compact: true })}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Edit account' : 'Add account'}
        description={editing ? editing.name : 'Track another bank, mobile money or cash account'}
      >
        <AccountForm
          account={editing}
          onDone={() => setFormOpen(false)}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this account?"
        message={
          pendingDelete
            ? `"${pendingDelete.name}" and its ${pendingDelete.transaction_count} transactions will be permanently deleted. This cannot be undone.`
            : ''
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
