import { useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import CategoryForm from '../components/categories/CategoryForm.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button from '../components/ui/Button.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import { api } from '../lib/api.js';
import { cx } from '../lib/cx.js';
import { formatMoney } from '../lib/format.js';

function CategoryRow({ node, depth, onAddChild, onEdit, onDelete }) {
  return (
    <div
      className={cx(
        'group flex items-center gap-2 rounded-xl px-2 py-2 transition hover:bg-slate-50',
        depth > 0 && 'ml-5 border-l border-slate-100 pl-3',
      )}
    >
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: node.color }}
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className={cx('truncate text-sm', depth === 0 ? 'font-medium text-slate-900' : 'text-slate-600')}>
          {node.name}
        </p>
        <p className="text-[11px] text-slate-400">
          {node.transaction_count} transaction{node.transaction_count === 1 ? '' : 's'}
          {depth === 0 && node.children.length > 0 ? ` · ${node.children.length} subcategories` : ''}
        </p>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-slate-500">
        {formatMoney(node.total_cents, { compact: true })}
      </span>
      <div className="flex shrink-0 items-center gap-0.5 opacity-70 transition group-hover:opacity-100">
        {depth === 0 ? (
          <Button
            variant="ghost"
            size="icon"
            icon={Plus}
            onClick={() => onAddChild(node)}
            aria-label={`Add subcategory to ${node.name}`}
          />
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          icon={Pencil}
          onClick={() => onEdit(node)}
          aria-label={`Edit ${node.name}`}
        />
        <Button
          variant="danger-ghost"
          size="icon"
          icon={Trash2}
          onClick={() => onDelete(node)}
          aria-label={`Delete ${node.name}`}
        />
      </div>
    </div>
  );
}

function CategoryPanel({ title, subtitle, tree, kind, onAdd, onAddChild, onEdit, onDelete }) {
  const total = tree.reduce((sum, parent) => sum + parent.total_cents, 0);

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle={subtitle}
        actions={
          <Button size="sm" variant="secondary" icon={Plus} onClick={() => onAdd(kind)}>
            Add
          </Button>
        }
      />

      <div className="flex items-center justify-between px-5 pt-4 text-xs text-slate-500">
        <span>{tree.length} top level categories</span>
        <span className="font-medium text-slate-700">{formatMoney(total, { compact: true })} tracked</span>
      </div>

      <div className="p-3 pt-2">
        {tree.length === 0 ? (
          <p className="px-2 py-6 text-center text-sm text-slate-500">
            No {kind} categories yet. Add one to start classifying your transactions.
          </p>
        ) : (
          tree.map((parent) => (
            <div key={parent.id} className="py-1">
              <CategoryRow
                node={parent}
                depth={0}
                onAddChild={onAddChild}
                onEdit={onEdit}
                onDelete={onDelete}
              />
              {parent.children.map((child) => (
                <CategoryRow
                  key={child.id}
                  node={child}
                  depth={1}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

export default function Categories() {
  const { expenseCategories, incomeCategories, refresh } = useWallet();
  const { push } = useToast();

  const [formState, setFormState] = useState(null); // { kind, category?, parentId? }
  const [pendingDelete, setPendingDelete] = useState(null); // { category, kind }
  const [deleting, setDeleting] = useState(false);

  const totalCategories =
    [...expenseCategories, ...incomeCategories].reduce(
      (sum, parent) => sum + 1 + parent.children.length,
      0,
    );

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.categories.remove(pendingDelete.category.id);
      await refresh();
      push({ title: 'Category deleted', description: pendingDelete.category.name });
      setPendingDelete(null);
    } catch (error) {
      push({ tone: 'error', title: 'Could not delete category', description: error.message });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Categories"
        description={`${totalCategories} categories and subcategories used to classify every transaction`}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" icon={Plus} onClick={() => setFormState({ kind: 'income' })}>
              New income category
            </Button>
            <Button icon={Plus} onClick={() => setFormState({ kind: 'expense' })}>
              New expense category
            </Button>
          </div>
        }
      />

      {totalCategories === 0 ? (
        <EmptyState
          icon={Tags}
          title="No categories yet"
          description="Categories group your spending so reports and budgets make sense."
          action={
            <Button icon={Plus} onClick={() => setFormState({ kind: 'expense' })}>
              Create the first category
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <CategoryPanel
            title="Expense categories"
            subtitle="Where your money goes"
            tree={expenseCategories}
            kind="expense"
            onAdd={(kind) => setFormState({ kind })}
            onAddChild={(parent) => setFormState({ kind: parent.kind, parentId: parent.id })}
            onEdit={(category) => setFormState({ kind: category.kind, category })}
            onDelete={(category) => setPendingDelete({ category, kind: category.kind })}
          />
          <CategoryPanel
            title="Income categories"
            subtitle="Where it comes from"
            tree={incomeCategories}
            kind="income"
            onAdd={(kind) => setFormState({ kind })}
            onAddChild={(parent) => setFormState({ kind: parent.kind, parentId: parent.id })}
            onEdit={(category) => setFormState({ kind: category.kind, category })}
            onDelete={(category) => setPendingDelete({ category, kind: category.kind })}
          />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start gap-3">
          <Badge tone="info">Tip</Badge>
          <p className="flex-1 text-sm text-slate-600">
            Categories are two levels deep — a category such as <strong>Food &amp; Dining</strong> can hold
            subcategories like <strong>Groceries</strong> and <strong>Restaurants</strong>. Budgets and reports
            always include the subcategories, so you can budget at whichever level suits you.
          </p>
        </div>
      </div>

      <Modal
        open={Boolean(formState)}
        onClose={() => setFormState(null)}
        title={
          formState?.category
            ? 'Edit category'
            : formState?.parentId
              ? 'Add subcategory'
              : 'Add category'
        }
        description={
          formState?.parentId ? 'Subcategories help you report in more detail.' : undefined
        }
      >
        {formState ? (
          <CategoryForm
            kind={formState.kind}
            category={formState.category}
            parentId={formState.parentId ?? null}
            onDone={() => setFormState(null)}
            onCancel={() => setFormState(null)}
          />
        ) : null}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this category?"
        message={
          pendingDelete
            ? `"${pendingDelete.category.name}" will be removed. Subcategories are deleted with it, and ${pendingDelete.category.transaction_count} transactions keep their history but become uncategorised.`
            : ''
        }
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  );
}
