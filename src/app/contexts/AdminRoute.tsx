"use client";
import { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthContext';

const AdminRoute = ({ children }: { children: ReactNode }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until authentication status is resolved
    if (!loading) {
      // If user is not authenticated or is not an admin, redirect them
      if (!isAuthenticated || user?.role !== 'admin') {
        router.push('/login'); // Redirect to login or a generic dashboard
      }
    }
  }, [isAuthenticated, user, loading, router]);

  // While loading or if not an admin, show a loading state to prevent content flash
  if (loading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-24 w-24 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  // If authenticated and is an admin, render the page
  return children;
};

export default AdminRoute;
