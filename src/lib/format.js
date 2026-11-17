export const CURRENCY = 'RWF';

const pad = (value) => String(value).padStart(2, '0');

/** ISO calendar date (YYYY-MM-DD) in the user's local timezone. */
export function toISODate(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const todayISO = () => toISODate(new Date());

/**
 * Format integer cents as money. Amounts are stored and transported as cents to
 * avoid floating point drift; only the presentation layer divides by 100.
 */
export function formatMoney(cents, { compact = false, withDecimals = false } = {}) {
  const value = (cents ?? 0) / 100;
  const absolute = Math.abs(value);

  let text;
  if (compact && absolute >= 1_000_000) text = `${(absolute / 1_000_000).toFixed(1)}M`;
  else if (compact && absolute >= 10_000) text = `${Math.round(absolute / 1_000)}k`;
  else
    text = absolute.toLocaleString('en-US', {
      minimumFractionDigits: withDecimals || !Number.isInteger(absolute) ? 2 : 0,
      maximumFractionDigits: 2,
    });

  return `${value < 0 ? '-' : ''}${CURRENCY} ${text}`;
}

/** Signed amount, used in transaction rows and account balances. */
export function formatSignedMoney(cents, options) {
  const formatted = formatMoney(Math.abs(cents ?? 0), options);
  return `${cents < 0 ? '-' : '+'}${formatted}`;
}

/** Parse a user typed amount ("12,500" / "12500.50") into integer cents. */
export function toCents(value) {
  if (typeof value === 'number') return Math.round(value * 100);
  const cleaned = String(value ?? '').replace(/[^0-9.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return Number.NaN;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) : Number.NaN;
}

/** Cents to an editable input value without trailing zeros. */
export function fromCents(cents) {
  const value = (cents ?? 0) / 100;
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function formatDate(iso, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
  if (!iso) return '—';
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-US', options);
}

export const formatShortDate = (iso) => formatDate(iso, { month: 'short', day: 'numeric' });

export function currentPeriod() {
  return todayISO().slice(0, 7);
}

export function periodLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function shortPeriodLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short' });
}

export function monthLabel(period) {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

/** Move a YYYY-MM period by `delta` months. */
export function shiftPeriod(period, delta) {
  const [year, month] = period.split('-').map(Number);
  const shifted = new Date(year, month - 1 + delta, 1);
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}`;
}

/** First and last ISO date of a YYYY-MM period. */
export function periodRange(period) {
  const [year, month] = period.split('-').map(Number);
  const lastDay = new Date(year, month, 0).getDate();
  return { from: `${period}-01`, to: `${period}-${pad(lastDay)}` };
}

export function currentMonthRange() {
  return periodRange(currentPeriod());
}

export const RANGE_PRESETS = [
  { id: 'this_month', label: 'This month' },
  { id: 'last_month', label: 'Last month' },
  { id: 'last_30_days', label: 'Last 30 days' },
  { id: 'last_3_months', label: 'Last 3 months' },
  { id: 'this_year', label: 'This year' },
];

/** Date range for a named report preset. */
export function rangeForPreset(preset) {
  const now = new Date();
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  switch (preset) {
    case 'last_month': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toISODate(start), to: toISODate(end) };
    }
    case 'last_30_days': {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { from: toISODate(start), to: todayISO() };
    }
    case 'last_3_months': {
      const start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      return { from: toISODate(start), to: todayISO() };
    }
    case 'this_year':
      return { from: `${now.getFullYear()}-01-01`, to: todayISO() };
    case 'this_month':
    default:
      return { from: toISODate(firstOfMonth), to: todayISO() };
  }
}

/** "RWF 4,500 left" style helper for budget remaining labels. */
export function formatRemaining(remainingCents) {
  return remainingCents >= 0
    ? `${formatMoney(remainingCents)} left`
    : `${formatMoney(Math.abs(remainingCents))} over`;
}
