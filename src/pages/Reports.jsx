import { useMemo, useState } from 'react';
import {
  Download,
  FileBarChart,
  Printer,
  Receipt,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import CashFlowChart from '../components/charts/CashFlowChart.jsx';
import Badge from '../components/ui/Badge.jsx';
import Button, { buttonClasses } from '../components/ui/Button.jsx';
import { Card, CardBody, CardHeader } from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Field, TextInput } from '../components/ui/Field.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { Skeleton } from '../components/ui/Skeleton.jsx';
import StatCard from '../components/ui/StatCard.jsx';
import { useWallet } from '../context/WalletContext.jsx';
import useApiQuery from '../hooks/useApiQuery.js';
import { api } from '../lib/api.js';
import { cx } from '../lib/cx.js';
import { RANGE_PRESETS, formatDate, formatMoney, formatShortDate, rangeForPreset } from '../lib/format.js';

/** Turn the API category tree into flat rows for the report table. */
function flattenReportRows(roots, uncategorized, prefix) {
  const sorted = [...roots].sort((a, b) => b.total_cents - a.total_cents);
  const rows = sorted.flatMap((root) => [
    { key: `${prefix}-${root.id}`, name: root.name, cents: root.total_cents, depth: 0, color: root.color },
    ...root.children
      .slice()
      .sort((a, b) => b.total_cents - a.total_cents)
      .map((child) => ({
        key: `${prefix}-child-${child.id}`,
        name: child.name,
        cents: child.total_cents,
        depth: 1,
        color: child.color,
      })),
  ]);

  if (uncategorized && uncategorized.total_cents > 0) {
    rows.push({
      key: `${prefix}-uncategorised`,
      name: 'Uncategorised',
      cents: uncategorized.total_cents,
      depth: 0,
      color: '#cbd5e1',
    });
  }

  return rows;
}

function BreakdownTable({ rows, total, emptyLabel }) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-slate-500">{emptyLabel}</p>;
  }

  return (
    <table className="w-full">
      <thead>
        <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
          <th scope="col" className="pb-2 font-semibold">Category</th>
          <th scope="col" className="pb-2 font-semibold">Share</th>
          <th scope="col" className="pb-2 text-right font-semibold">Amount</th>
          <th scope="col" className="pb-2 text-right font-semibold">%</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const share = total > 0 ? Math.round((row.cents / total) * 100) : 0;
          return (
            <tr key={row.key} className="border-t border-slate-100">
              <td className="py-2.5 pr-3">
                <span className={cx('flex items-center gap-2', row.depth > 0 && 'pl-5')}>
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                    aria-hidden="true"
                  />
                  <span
                    className={cx(
                      'truncate text-sm',
                      row.depth === 0 ? 'font-medium text-slate-900' : 'text-slate-600',
                    )}
                  >
                    {row.name}
                  </span>
                </span>
              </td>
              <td className="w-24 py-2.5 pr-3 sm:w-40">
                <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-indigo-500"
                    style={{ width: `${Math.min(100, share)}%` }}
                  />
                </div>
              </td>
              <td className="whitespace-nowrap py-2.5 text-right text-sm font-medium tabular-nums text-slate-900">
                {formatMoney(row.cents)}
              </td>
              <td className="whitespace-nowrap py-2.5 text-right text-xs tabular-nums text-slate-500">
                {share}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function Reports() {
  const { version } = useWallet();
  const [preset, setPreset] = useState('this_month');
  const [range, setRange] = useState(() => rangeForPreset('this_month'));

  const invalidRange = Boolean(range.from && range.to && range.from > range.to);
  const path = invalidRange ? null : `/reports?from=${range.from}&to=${range.to}`;
  const { data: response, loading, error } = useApiQuery(path, [version]);
  const report = response?.data;

  const expenseRows = useMemo(
    () =>
      report
        ? flattenReportRows(report.expense_categories.roots, report.expense_categories.uncategorized, 'expense')
        : [],
    [report],
  );

  const incomeRows = useMemo(
    () =>
      report
        ? flattenReportRows(report.income_categories.roots, report.income_categories.uncategorized, 'income')
        : [],
    [report],
  );

  function applyPreset(id) {
    setPreset(id);
    setRange(rangeForPreset(id));
  }

  function updateDate(field, value) {
    setPreset('custom');
    setRange((current) => ({ ...current, [field]: value }));
  }

  return (
    <>
      <PageHeader
        title="Reports"
        description="Generate a breakdown for any period and export it"
        actions={
          <div className="no-print flex flex-wrap gap-2">
            <a
              href={api.reportCsvUrl({ from: range.from, to: range.to })}
              download
              className={buttonClasses('secondary', 'md')}
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Export CSV
            </a>
            <Button variant="secondary" icon={Printer} onClick={() => window.print()}>
              Print
            </Button>
          </div>
        }
      />

      <Card className="no-print">
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {RANGE_PRESETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => applyPreset(option.id)}
                aria-pressed={preset === option.id}
                className={cx(
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                  preset === option.id
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-sm'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900',
                )}
              >
                {option.label}
              </button>
            ))}
            {preset === 'custom' ? <Badge tone="info">Custom range</Badge> : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="From" htmlFor="report-from">
              <TextInput
                id="report-from"
                type="date"
                value={range.from}
                onChange={(event) => updateDate('from', event.target.value)}
              />
            </Field>
            <Field label="To" htmlFor="report-to">
              <TextInput
                id="report-to"
                type="date"
                value={range.to}
                onChange={(event) => updateDate('to', event.target.value)}
              />
            </Field>
            <div className="sm:col-span-2 lg:col-span-2 lg:self-end">
              <p className="text-sm text-slate-500">
                Report range:{' '}
                <span className="font-medium text-slate-700">
                  {formatDate(range.from)} — {formatDate(range.to)}
                </span>
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {invalidRange ? (
        <Card>
          <CardBody>
            <p className="text-sm text-rose-600">The start date must be on or before the end date.</p>
          </CardBody>
        </Card>
      ) : error ? (
        <Card>
          <CardBody>
            <p className="text-sm text-rose-600">{error.message}</p>
          </CardBody>
        </Card>
      ) : loading && !report ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
          <Skeleton className="h-72" />
        </div>
      ) : !report ? null : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Income"
              value={formatMoney(report.totals.income_cents)}
              hint={`${formatDate(range.from)} — ${formatDate(range.to)}`}
              icon={TrendingUp}
              tone="emerald"
            />
            <StatCard
              label="Expenses"
              value={formatMoney(report.totals.expense_cents)}
              hint={`${report.transaction_count} transactions`}
              icon={TrendingDown}
              tone="rose"
            />
            <StatCard
              label="Net"
              value={formatMoney(report.totals.net_cents)}
              hint={report.totals.net_cents >= 0 ? 'You kept more than you spent' : 'You spent more than you earned'}
              icon={Wallet}
              tone={report.totals.net_cents >= 0 ? 'emerald' : 'rose'}
            />
            <StatCard
              label="Average expense"
              value={formatMoney(
                report.totals.expense_count > 0
                  ? Math.round(report.totals.expense_cents / report.totals.expense_count)
                  : 0,
              )}
              hint="Per expense in this range"
              icon={Receipt}
              tone="slate"
            />
          </div>

          <Card>
            <CardHeader title="Cash flow" subtitle="Income versus expenses within the report range" />
            <CardBody className="pt-3">
              <CashFlowChart data={report.monthly} />
            </CardBody>
          </Card>

          {report.transaction_count === 0 ? (
            <EmptyState
              icon={FileBarChart}
              title="Nothing recorded in this period"
              description="Pick a different range or record a transaction to see a report here."
            />
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader
                    title="Expenses by category"
                    subtitle="Parent categories include their subcategories"
                  />
                  <CardBody className="pt-4">
                    <BreakdownTable
                      rows={expenseRows}
                      total={report.totals.expense_cents}
                      emptyLabel="No expenses in this range."
                    />
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader title="Income by category" subtitle="Where the money came from" />
                  <CardBody className="pt-4">
                    <BreakdownTable
                      rows={incomeRows}
                      total={report.totals.income_cents}
                      emptyLabel="No income in this range."
                    />
                  </CardBody>
                </Card>
              </div>

              <Card>
                <CardHeader title="Account activity" subtitle="Opening and closing balances within the range" />
                <CardBody className="overflow-x-auto pt-4">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
                        <th scope="col" className="pb-2 font-semibold">Account</th>
                        <th scope="col" className="pb-2 text-right font-semibold">Opening</th>
                        <th scope="col" className="pb-2 text-right font-semibold">In</th>
                        <th scope="col" className="pb-2 text-right font-semibold">Out</th>
                        <th scope="col" className="pb-2 text-right font-semibold">Closing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.accounts.map((account) => (
                        <tr key={account.id} className="border-t border-slate-100">
                          <td className="py-2.5 text-sm font-medium text-slate-900">{account.name}</td>
                          <td className="py-2.5 text-right text-sm tabular-nums text-slate-600">
                            {formatMoney(account.opening_balance_range_cents)}
                          </td>
                          <td className="py-2.5 text-right text-sm tabular-nums text-emerald-600">
                            +{formatMoney(account.income_cents)}
                          </td>
                          <td className="py-2.5 text-right text-sm tabular-nums text-rose-600">
                            -{formatMoney(account.expense_cents)}
                          </td>
                          <td className="py-2.5 text-right text-sm font-semibold tabular-nums text-slate-900">
                            {formatMoney(account.closing_balance_cents)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardBody>
              </Card>

              <Card>
                <CardHeader title="Largest expenses" subtitle="The five biggest outgoings in this range" />
                <div className="px-5 pb-4 pt-3">
                  {report.top_expenses.length === 0 ? (
                    <p className="py-4 text-sm text-slate-500">No expenses in this range.</p>
                  ) : (
                    <ul className="divide-y divide-slate-100">
                      {report.top_expenses.map((transaction) => (
                        <li key={transaction.id} className="flex items-center justify-between gap-3 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-slate-900">
                              {transaction.description || 'Expense'}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                              {formatShortDate(transaction.date)} · {transaction.account_name} ·{' '}
                              {transaction.parent_category_name
                                ? `${transaction.parent_category_name} › ${transaction.category_name}`
                                : transaction.category_name ?? 'Uncategorised'}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                            {formatMoney(transaction.amount_cents)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </Card>
            </>
          )}

          <p className="text-xs text-slate-400">
            Report generated on {formatDate(new Date().toISOString().slice(0, 10))} · amounts in Rwandan francs
            (RWF)
          </p>
        </>
      )}
    </>
  );
}
