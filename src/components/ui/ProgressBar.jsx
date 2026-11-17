import { cx } from '../../lib/cx.js';

const TONES = {
  ok: 'bg-emerald-500',
  warning: 'bg-amber-500',
  exceeded: 'bg-rose-500',
  indigo: 'bg-indigo-500',
};

/** Budget progress bar; the tone follows the budget status. */
export default function ProgressBar({ value = 0, tone = 'ok', className, label }) {
  const width = Math.min(100, Math.max(0, value));

  return (
    <div
      className={cx('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(width)}
      aria-label={label}
    >
      <div
        className={cx('h-full rounded-full transition-all duration-500', TONES[tone] ?? TONES.indigo)}
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
