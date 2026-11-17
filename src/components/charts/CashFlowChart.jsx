import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMoney, monthLabel, shortPeriodLabel } from '../../lib/format.js';
import ChartTooltip from './ChartTooltip.jsx';

/**
 * Monthly income vs expenses. Data comes from the API as
 * `[{ period: 'YYYY-MM', income_cents, expense_cents }]`.
 */
export default function CashFlowChart({ data = [], height = 264 }) {
  const chartData = data.map((row) => ({ ...row, label: shortPeriodLabel(row.period) }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#64748b', fontSize: 12 }}
            dy={6}
          />
          <YAxis
            tickFormatter={(value) => formatMoney(value, { compact: true })}
            tickLine={false}
            axisLine={false}
            width={64}
            tick={{ fill: '#94a3b8', fontSize: 11 }}
          />
          <Tooltip
            content={<ChartTooltip labelFormatter={(label, payload) => {
              const row = chartData.find((item) => item.label === label);
              return row ? monthLabel(row.period) : label;
            }} />}
            cursor={{ fill: 'rgba(99, 102, 241, 0.06)' }}
          />
          <Bar dataKey="income_cents" name="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={26} />
          <Bar dataKey="expense_cents" name="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>

      <div className="mt-2 flex items-center justify-center gap-5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" /> Income
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" /> Expenses
        </span>
      </div>
    </div>
  );
}
