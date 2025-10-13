import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';
import { useAuth } from './useAuth';

type Profile = Database['public']['Tables']['users']['Row'];

export const useProfile = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        if (!user) {
          setProfile(null);
          return;
        }

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    const channel = supabase
      .channel("realtime:users")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public", 
          table: "users",
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user]);

  return { profile, loading, error };
};

export const useSwitchProfile = () => {
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const switchProfile = async (profileId: string) => {
    setSwitching(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Fetch the selected user profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (profileError) throw profileError;
      if (!profileData) throw new Error('Profile not found');

      // Update the users table with the profile data
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          company: profileData.company,
          position: profileData.position,
          role: profileData.role,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          interests: profileData.interests,
          social_links: profileData.social_links,
          profile_id: profileId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

    } catch (err) {
      setError(err instanceof Error ? err : new Error('An error occurred while switching profiles'));
      throw err;
    } finally {
      setSwitching(false);
    }
  };

  return { switchProfile, switching, error };
};

