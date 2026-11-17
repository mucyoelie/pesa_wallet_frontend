import { Link } from 'react-router-dom';
import { buttonClasses } from '../components/ui/Button.jsx';

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">404</p>
      <h1 className="mt-2 text-xl font-semibold text-slate-900">This page does not exist</h1>
      <p className="mt-1 text-sm text-slate-500">
        The link may be outdated. Head back to the dashboard to keep tracking your money.
      </p>
      <Link to="/" className={buttonClasses('primary', 'md', 'mt-6')}>
        Back to dashboard
      </Link>
    </div>
  );
}
