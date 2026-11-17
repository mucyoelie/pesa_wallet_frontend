import { cx } from '../../lib/cx.js';

export function Skeleton({ className }) {
  return <div className={cx('animate-pulse rounded-lg bg-slate-200/70', className)} aria-hidden="true" />;
}

export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-3 w-full" />
      ))}
    </div>
  );
}

export default Skeleton;
