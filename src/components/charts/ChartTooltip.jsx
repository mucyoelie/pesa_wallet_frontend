import { formatMoney } from '../../lib/format.js';

/** Tooltip shared by every recharts chart so money is always formatted the same way. */
export default function ChartTooltip({ active, payload, label, labelFormatter }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="mb-1.5 text-xs font-semibold text-slate-700">
        {labelFormatter ? labelFormatter(label) : label}
      </p>
      <div className="space-y-1">
        {payload.map((item) => (
          <div
            key={item.dataKey ?? item.name}
            className="flex items-center justify-between gap-6 text-xs"
          >
            <span className="flex items-center gap-1.5 text-slate-500">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: item.color ?? item.fill }}
                aria-hidden="true"
              />
              {item.name}
            </span>
            <span className="font-semibold tabular-nums text-slate-900">{formatMoney(item.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
