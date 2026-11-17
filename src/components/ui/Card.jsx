import { cx } from '../../lib/cx.js';

export function Card({ className, children, ...props }) {
  return (
    <section className={cx('rounded-2xl border border-slate-200 bg-white shadow-sm', className)} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, actions, className, children }) {
  return (
    <header className={cx('flex flex-wrap items-start justify-between gap-3 px-5 pt-5', className)}>
      <div className="min-w-0">
        {title ? <h2 className="text-sm font-semibold text-slate-900">{title}</h2> : null}
        {subtitle ? <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p> : null}
        {children}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function CardBody({ className, children }) {
  return <div className={cx('p-5', className)}>{children}</div>;
}

export default Card;
