import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoles } from '../hooks/useRoles';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireSeller?: boolean;
  requireVisitor?: boolean;
  requireDeliver?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireSeller = false,
  requireVisitor = false,
  requireDeliver = false,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!authLoading && !rolesLoading) {
      if (!user) {
        console.log("No user, redirecting to auth from", location.pathname);
        navigate('/auth', { replace: true });
        return;
      }

      // Vérification pour l'accès admin
      if (requireAdmin && role !== 'admin') {
        console.log("User is not admin, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }

      if (requireSeller && role !== 'liver') {
        console.log("User is not seller, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }

      if (requireVisitor && role !== 'visitor') {
        console.log("User is not attendee, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }

      if (requireDeliver && role !== 'deliver' && role !== 'admin') {
        console.log("User is not deliver or admin, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }
    }
  }, [
    user, 
    role, 
    authLoading, 
    rolesLoading, 
    navigate, 
    requireAdmin, 
    requireSeller, 
    requireVisitor, 
    requireDeliver, 
    location.pathname
  ]);

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}