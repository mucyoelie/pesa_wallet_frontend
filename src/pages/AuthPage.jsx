import { useState } from 'react';
import { ArrowRight, BarChart3, Loader2, LockKeyhole, Mail, ShieldCheck, User, Wallet } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button.jsx';
import { Field, TextInput } from '../components/ui/Field.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const HIGHLIGHTS = [
  { icon: Wallet, text: 'Every bank, mobile money and cash account in one ledger' },
  { icon: BarChart3, text: 'Monthly budgets, live balances and reports for any date range' },
  { icon: ShieldCheck, text: 'Your wallet is private to your own sign-in' },
];

/** Combined sign-in / create-account screen. */
export default function AuthPage({ mode = 'login' }) {
  const isRegister = mode === 'register';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
  };

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (isRegister) {
        await register({ name: values.name.trim(), email: values.email.trim(), password: values.password });
      } else {
        await login({ email: values.email.trim(), password: values.password });
      }

      const from = location.state?.from;
      const target = from && !from.startsWith('/login') && !from.startsWith('/register') ? from : '/';
      navigate(target, { replace: true });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-900 p-10 text-slate-300 lg:flex">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-indigo-500/20 blur-3xl"
          aria-hidden="true"
        />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" aria-hidden="true" />

        <div className="relative flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
            <Wallet className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Pesa Wallet</p>
            <p className="text-[11px] text-slate-400">Personal finance tracker</p>
          </div>
        </div>

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight text-white">
            One wallet for every account you own.
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Track income and expenses across bank, mobile money and cash, keep spending inside
            budgets, and see exactly where the money went.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((highlight) => (
              <li key={highlight.text} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-indigo-300 ring-1 ring-inset ring-white/10">
                  <highlight.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                {highlight.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[11px] text-slate-500">
          Amounts are stored as whole cents and formatted in RWF.
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
              <Wallet className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">Pesa Wallet</p>
              <p className="text-[11px] text-slate-500">Personal finance tracker</p>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {isRegister ? 'Create your wallet' : 'Welcome back'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {isRegister
              ? 'Your own accounts, categories and budgets — private to you.'
              : 'Sign in to pick up where your money left off.'}
          </p>

          <form
            onSubmit={handleSubmit}
            className="mt-6 space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            noValidate
          >
            {error && error.status !== 401 ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error.message}
              </p>
            ) : null}

            {isRegister ? (
              <Field label="Name" htmlFor="name" error={error?.fieldError('name')}>
                <TextInput
                  id="name"
                  name="name"
                  autoComplete="name"
                  placeholder="Eric Nkusi"
                  value={values.name}
                  onChange={update('name')}
                  required
                />
              </Field>
            ) : null}

            <Field label="Email" htmlFor="email" error={error?.fieldError('email')}>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <TextInput
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="pl-9"
                  value={values.email}
                  onChange={update('email')}
                  required
                />
              </div>
            </Field>

            <Field
              label="Password"
              htmlFor="password"
              error={error?.fieldError('password') || (error?.status === 401 ? error.message : null)}
              hint={isRegister ? 'At least 8 characters' : undefined}
            >
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" aria-hidden="true" />
                <TextInput
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="••••••••"
                  className="pl-9"
                  minLength={isRegister ? 8 : undefined}
                  value={values.password}
                  onChange={update('password')}
                  required
                />
              </div>
            </Field>

            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  {isRegister ? 'Creating wallet…' : 'Signing in…'}
                </>
              ) : (
                <>
                  {isRegister ? 'Create account' : 'Sign in'}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-slate-500">
            {isRegister ? (
              <>
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to Pesa Wallet?{' '}
                <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
                  Create an account
                </Link>
              </>
            )}
          </p>

          {!isRegister ? (
            <p className="mt-6 flex items-start gap-2 rounded-xl bg-slate-100 px-3 py-2.5 text-xs text-slate-500">
              <User className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>
                Demo wallet: <span className="font-medium text-slate-700">demo@pesawallet.com</span> /{' '}
                <span className="font-medium text-slate-700">demo1234</span>
              </span>
            </p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
