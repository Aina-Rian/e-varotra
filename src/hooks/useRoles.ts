import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type UserRole = Database['public']['Tables']['users']['Row']['role'];

const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRIES = 3;

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchRoleWithRetry(
  userId: string,
  attempt = 1,
  delay = INITIAL_RETRY_DELAY
): Promise<UserRole | null> {
  try {
    if (!navigator.onLine) {
      throw new Error('No internet connection');
    }

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.role || null;

  } catch (err) {
    if (attempt >= MAX_RETRIES) {
      throw err;
    }

    await wait(delay);
    return fetchRoleWithRetry(userId, attempt + 1, delay * 2);
  }
}

export function useRoles() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRole() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          if (mounted) {
            setRole(null);
            setLoading(false);
          }
          return;
        }

        const userRole = await fetchRoleWithRetry(user.id);
        
        if (mounted) {
          console.log("Current user role:", userRole); // Debug log
          setRole(userRole);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching role:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch role'));
          setLoading(false);
        }
      }
    }

    fetchRole();

    // Add online/offline event listeners
    const handleOnline = () => {
      if (mounted) {
        setError(null);
        fetchRole();
      }
    };

    window.addEventListener('online', handleOnline);

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const hasRole = (requiredRole: UserRole): boolean => {
    // Admin a tous les rôles
    if (role === 'admin') return true;
    return role === requiredRole;
  };

  return {
    role,
    loading,
    error,
    isAdmin: () => role === 'admin',
    isOrganizer: () => role === 'organizer',
    hasRole
  };
}