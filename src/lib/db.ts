import { supabase } from './supabase';

export async function fetchEvents() {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      throw new Error('No events found');
    }

    return data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
}