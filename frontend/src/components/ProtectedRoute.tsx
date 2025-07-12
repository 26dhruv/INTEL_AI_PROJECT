import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoaderIcon } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export function ProtectedRoute({ 
  children, 
  requiredPermission, 
  requiredRole 
}: ProtectedRouteProps) {
  const { state, hasPermission, hasRole } = useAuth();

  // Show loading spinner while checking authentication
  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <LoaderIcon className="h-8 w-8 animate-spin text-primary-400 mx-auto mb-4" />
          <p className="text-white text-lg">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!state.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-300 mb-2">Access Denied</h2>
            <p className="text-red-200">
              You don't have permission to access this page. Required permission: {requiredPermission}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Check required role
  if (requiredRole && !hasRole(requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="bg-red-500 bg-opacity-20 border border-red-400 border-opacity-30 rounded-lg p-6 max-w-md">
            <h2 className="text-xl font-semibold text-red-300 mb-2">Access Denied</h2>
            <p className="text-red-200">
              You don't have the required role to access this page. Required role: {requiredRole}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
} 