export interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  image_url: string;
  type: 'online' | 'hybrid' | 'physical';
  status: 'upcoming' | 'ongoing' | 'past';
  capacity: number;
  registered_count: number;
  early_bird_deadline?: string;
  created_at: string;
}