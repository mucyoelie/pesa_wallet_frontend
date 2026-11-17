import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_FALLBACK_COLORS } from '../../lib/constants.js';
import { formatMoney } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';

/**
 * Spending split by category. `items` is `[{ name, total_cents, color }]`; categories
 * are already rolled up to their parent by the API.
 */
export default function CategoryDonut({ items = [], total, height = 190 }) {
  const data = items.filter((item) => item.total_cents > 0);
  const grandTotal = total ?? data.reduce((sum, item) => sum + item.total_cents, 0);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-center text-sm text-slate-400">
        No expenses recorded in this period yet.
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={data}
              dataKey="total_cents"
              nameKey="name"
              innerRadius="62%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((item, index) => (
                <Cell key={item.name} fill={item.color ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-slate-400">Spent</span>
          <span className="text-lg font-semibold text-slate-900">{formatMoney(grandTotal, { compact: true })}</span>
        </div>
      </div>

      <ul className="mt-3 space-y-2">
        {data.map((item, index) => {
          const percent = grandTotal > 0 ? Math.round((item.total_cents / grandTotal) * 100) : 0;
          return (
            <li key={item.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color ?? CHART_FALLBACK_COLORS[index % CHART_FALLBACK_COLORS.length] }}
                  aria-hidden="true"
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-slate-400">{percent}%</span>
                <span className="font-semibold tabular-nums text-slate-900">
                  {formatMoney(item.total_cents, { compact: true })}
                </span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
