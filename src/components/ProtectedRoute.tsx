import { ReactNode, useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useRoles } from '../hooks/useRoles';
import { supabase } from '../lib/supabase';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  requireOrganizer?: boolean;
  requireAttendee?: boolean;
  requireModerator?: boolean;
  requireRegisteredAttendee?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAdmin = false,
  requireOrganizer = false,
  requireAttendee = false,
  requireModerator = false,
  requireRegisteredAttendee = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: rolesLoading } = useRoles();
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegisteredAttendee, setIsRegisteredAttendee] = useState(false);
  const [registrationLoading, setRegistrationLoading] = useState(true);

  useEffect(() => {
    const checkRegistration = async () => {
      if (user && (role === 'attendee' || requireRegisteredAttendee)) {
        try {
          setRegistrationLoading(true);
          const { data, error } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('user_id', user.id)
            .limit(1);

          if (error) {
            console.error('Error checking registration:', error);
            setIsRegisteredAttendee(false);
          } else {
            setIsRegisteredAttendee(!!data && data.length > 0);
          }
        } catch (error) {
          console.error('Error checking registration:', error);
          setIsRegisteredAttendee(false);
        } finally {
          setRegistrationLoading(false);
        }
      } else {
        setRegistrationLoading(false);
        setIsRegisteredAttendee(false);
      }
    };

    checkRegistration();
  }, [user, role, requireRegisteredAttendee]);

  useEffect(() => {
    if (!authLoading && !rolesLoading && !registrationLoading) {
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

      // Vérification pour l'accès organisateur
      if (requireOrganizer && role !== 'organizer' && role !== 'admin') {
        console.log("User is not organizer or admin, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }

      if (requireAttendee && role !== 'attendee') {
        console.log("User is not attendee, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }

      if (requireModerator && role !== 'moderator' && role !== 'admin') {
        console.log("User is not moderator or admin, redirecting from", location.pathname);
        navigate('/', { replace: true });
        return;
      }

      if (requireRegisteredAttendee) {
        if (role !== 'attendee') {
          console.log("User is not attendee, redirecting from", location.pathname);
          navigate('/', { replace: true });
          return;
        }
        
        if (!isRegisteredAttendee) {
          console.log("User is not registered for any events, redirecting from", location.pathname);
          navigate('/attendee/program', { replace: true });
          return;
        }
      }
    }
  }, [
    user, 
    role, 
    authLoading, 
    rolesLoading, 
    registrationLoading, 
    navigate, 
    requireAdmin, 
    requireOrganizer, 
    requireAttendee, 
    requireModerator, 
    requireRegisteredAttendee,
    isRegisteredAttendee,
    location.pathname
  ]);

  if (authLoading || rolesLoading || registrationLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}