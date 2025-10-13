import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/supabase';

type Event = Database['public']['Tables']['events']['Row'];

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 3;

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);

        // Check connection first
        const isConnected = await supabase.from('events').select('count').single();
        if (isConnected.error) {
          throw new Error('Failed to connect to database');
        }

        // Only fetch published and live events
        const { data, error: supabaseError } = await supabase
          .from('events')
          .select('*')
          .in('status', ['published', 'live'])
          .order('start_date', { ascending: true });

        if (supabaseError) throw supabaseError;

        if (mounted) {
          setEvents(data || []);
          setLoading(false);
          setRetryCount(0); // Reset retry count on successful fetch
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch events');
          setLoading(false);
          
          // Implement retry logic with exponential backoff
          if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
            retryTimeout = setTimeout(() => {
              setRetryCount(prev => prev + 1);
              fetchEvents();
            }, delay);
          }
        }
      }
    }

    fetchEvents();

    return () => {
      mounted = false;
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [retryCount]);

  return { events, loading, error };
}