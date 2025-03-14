import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/auth';
import { Header } from './Header';

export function AuthGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    // Save the attempted URL for redirecting after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated, render header and child routes
  return (
    <>
      <Header />
      <main className="pt-20">
        <Outlet />
      </main>
    </>
  );
}
