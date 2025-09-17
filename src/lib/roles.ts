import { supabase } from './supabase';

export type Role = 'attendee' | 'exhibitor' | 'speaker' | 'organizer' | 'admin';

export async function getUserRole(): Promise<Role | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .limit(1)
      .single();

    if (error) throw error;
    return data?.role || 'attendee';
  } catch (error) {
    console.error('Error fetching user role:', error);
    return 'attendee';
  }
}

export async function isAdmin(): Promise<boolean> {
  try {
    const role = await getUserRole();
    return role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

export async function hasPermission(permission: string): Promise<boolean> {
  try {
    const role = await getUserRole();
    if (!role) return false;

    // Define permission mappings
    const rolePermissions: Record<Role, string[]> = {
      admin: ['*'], // Admin has all permissions
      organizer: ['create_event', 'manage_event', 'view_analytics'],
      speaker: ['manage_session', 'view_schedule'],
      exhibitor: ['manage_stand', 'view_analytics'],
      attendee: ['view_event', 'register_event']
    };

    // Admin has all permissions
    if (role === 'admin') return true;

    // Check if the role has the specific permission
    return rolePermissions[role]?.includes(permission) || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}