import { cx } from '../../lib/cx.js';

const BASE =
  'inline-flex items-center justify-center rounded-xl font-medium transition focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60';

const VARIANTS = {
  primary:
    'bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-indigo-600 disabled:hover:bg-indigo-600',
  secondary:
    'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus-visible:outline-indigo-600',
  subtle: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 focus-visible:outline-indigo-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger: 'bg-rose-600 text-white shadow-sm hover:bg-rose-500 focus-visible:outline-rose-600',
  'danger-ghost': 'text-rose-600 hover:bg-rose-50',
};

const SIZES = {
  sm: 'h-8 gap-1.5 px-3 text-xs',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-11 gap-2 px-5 text-sm',
  icon: 'h-8 w-8',
};

/** Shared button/link classes, exported so anchors can look identical to buttons. */
export function buttonClasses(variant = 'primary', size = 'md', className) {
  return cx(BASE, VARIANTS[variant] ?? VARIANTS.primary, SIZES[size] ?? SIZES.md, className);
}

export const ICON_SIZE = (size) => (size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4');

export default function Button({
  variant = 'primary',
  size = 'md',
  type = 'button',
  icon: Icon,
  className,
  children,
  ...props
}) {
  return (
    <button type={type} className={buttonClasses(variant, size, className)} {...props}>
      {Icon ? <Icon className={ICON_SIZE(size)} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}
