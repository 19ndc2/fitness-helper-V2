import { Outlet, Navigate } from 'react-router-dom';
import { MobileNav } from './MobileNav';
import { useAuth } from '@/contexts/AuthContext';

export function AppLayout() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <main className="container max-w-lg mx-auto">
        <Outlet />
      </main>
      <MobileNav />
    </div>
  );
}
