import { Loader2 } from 'lucide-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/layout/Layout.jsx';
import Button from './components/ui/Button.jsx';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { WalletProvider } from './context/WalletContext.jsx';
import Accounts from './pages/Accounts.jsx';
import AuthPage from './pages/AuthPage.jsx';
import Budgets from './pages/Budgets.jsx';
import Categories from './pages/Categories.jsx';
import Dashboard from './pages/Dashboard.jsx';
import NotFound from './pages/NotFound.jsx';
import Reports from './pages/Reports.jsx';
import Transactions from './pages/Transactions.jsx';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-indigo-500" aria-label="Loading" />
    </div>
  );
}

/** Login/register are only for signed-out visitors. */
function GuestOnly({ children }) {
  const { status } = useAuth();
  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'authenticated') return <Navigate to="/" replace />;
  return children;
}

/** The wallet shell is only mounted for a signed-in user. */
function ProtectedLayout() {
  const { status, error, reload } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullScreenLoader />;
  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (status === 'error') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-base font-semibold text-slate-900">Cannot reach the server</h1>
          <p className="mt-1 text-sm text-slate-500">{error?.message ?? 'The API did not respond.'}</p>
          <Button className="mt-4" onClick={() => reload()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <WalletProvider>
      <Layout />
    </WalletProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <AuthPage mode="login" />
              </GuestOnly>
            }
          />
          <Route
            path="/register"
            element={
              <GuestOnly>
                <AuthPage mode="register" />
              </GuestOnly>
            }
          />

          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/budgets" element={<Budgets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}
