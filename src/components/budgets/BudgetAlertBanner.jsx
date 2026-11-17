import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatMoney } from '../../lib/format.js';

/** Summary banner listing the budgets that are over (or near) their limit. */
export default function BudgetAlertBanner({ alerts = [] }) {
  if (alerts.length === 0) return null;

  const exceeded = alerts.filter((alert) => alert.status === 'exceeded');
  const warnings = alerts.filter((alert) => alert.status === 'warning');
  const headline =
    exceeded.length > 0
      ? `${exceeded.length} budget${exceeded.length > 1 ? 's' : ''} exceeded this month`
      : `${warnings.length} budget${warnings.length > 1 ? 's' : ''} close to the limit`;

  return (
    <div className="flex flex-wrap items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-rose-900">{headline}</p>
        <ul className="mt-1 space-y-0.5 text-sm text-rose-700">
          {alerts.slice(0, 3).map((alert) => (
            <li key={alert.id}>
              <span className="font-medium">{alert.category_name}</span> —{' '}
              {alert.status === 'exceeded'
                ? `${formatMoney(Math.abs(alert.remaining_cents))} over the ${formatMoney(alert.amount_cents)} limit`
                : `${formatMoney(alert.remaining_cents)} of ${formatMoney(alert.amount_cents)} remaining`}
            </li>
          ))}
        </ul>
      </div>
      <Link
        to="/budgets"
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        Review budgets
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  );
}
