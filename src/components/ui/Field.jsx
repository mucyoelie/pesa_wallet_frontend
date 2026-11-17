import { cx } from '../../lib/cx.js';

const CONTROL_CLASS =
  'w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50';

export function Field({ label, htmlFor, hint, error, className, children }) {
  return (
    <div className={cx('space-y-1.5', className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs text-rose-600">{error}</p>
      ) : hint ? (
        <p className="text-xs text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({ className, ...props }) {
  return <input className={cx(CONTROL_CLASS, className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cx(CONTROL_CLASS, 'cursor-pointer pr-8', className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ className, ...props }) {
  return <textarea className={cx(CONTROL_CLASS, 'resize-none', className)} {...props} />;
}
