import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const addLog = (message: string) => {
    console.log(`[useAuth] ${message}`);
    setLogs(prev => [...prev, `${new Date().toISOString()} - ${message}`]);
  };

  useEffect(() => {
    let mounted = true;

    async function getInitialSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error getting session:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to get session'));
          setLoading(false);
        }
      }
    }

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      setUser(data.user);
      return data;
    } catch (err) {
      console.error('Sign in error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred during sign in'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);

    // First, create the auth user
    // Create auth user
     const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: username,
          username: username
        }
      }
    });

    if (authError) {
      addLog(`Error creating auth user: ${authError.message}`);
      throw authError;
    }

    if (!authData.user) {
      addLog('No user data returned from auth signup');
      throw new Error('Failed to create auth user');
    }

    const userId = authData.user.id;
    addLog(`Created new auth user with ID: ${userId}`);

      // Then create the user profile using the auth user's ID
    const { data: { session } } = await supabase.auth.getSession();
    console.log("authData.user.id", authData.user.id);
    console.log("session", session);

    const { error: profileError } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          email: email,
          username: username,
          role: 'liver'
        }
      ]);
    if (profileError) {
      await supabase.auth.signOut();
      console.log('profileError', profileError);
      throw profileError;
    }
      setUser(authData.user);
      return authData;
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred during sign up'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      
      // Clear local storage first to prevent session-related errors
      window.localStorage.removeItem('supabase.auth.token');
      
      // Then sign out from Supabase
      const { error } = await supabase.auth.signOut({
        scope: 'local'
      });
      
      if (error) throw error;
      
      setUser(null);
    } catch (err) {
      console.error('Sign out error:', err);
      setError(err instanceof Error ? err : new Error('An error occurred during sign out'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut
  };
}