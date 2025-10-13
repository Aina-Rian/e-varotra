import { supabase } from './supabase';

interface SpeakerEmailData {
  speaker_id: string;
  sessionId: string;
  sessionTitle: string;
  startTime: string;
  endTime: string;
}

interface ExhibitorEmailData {
  exhibitor_id: string;
  event_id: string;
  eventTitle: string;
  startTime: string;
  endTime: string;
}

interface SessionMaterialsEmailData {
  name: string;
  email: string;
  eventTitle: string;
  session_id: string;
}

export async function sendSpeakerInvitation(data: SpeakerEmailData) {
  try {
    // Ensure we have the required environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase configuration');
    }

    // Construct the complete URL for the edge function
    const functionUrl = `${supabaseUrl}/functions/v1/send-speaker-invitation`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to send invitation: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending speaker invitation:', error);
    throw new Error(`Failed to send speaker invitation: ${error.message}`);
  }
}

export async function sendExhibitorInvitation(data: ExhibitorEmailData) {
  try {
    // Ensure we have the required environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase configuration');
    }

    // Construct the complete URL for the edge function
    const functionUrl = `${supabaseUrl}/functions/v1/send-exhibitor-invitation`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to send invitation: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending exhibitor invitation:', error);
    throw new Error(`Failed to send exhibitor invitation: ${error.message}`);
  }
}

export async function sendSessionMaterials(data: SessionMaterialsEmailData) {
  try {
    // Ensure we have the required environment variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing required Supabase configuration');
    }

    // Construct the complete URL for the edge function
    const functionUrl = `${supabaseUrl}/functions/v1/send-session-materials`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to send session materials: ${response.status}`);
    }

    const result = await response.json();
    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending session materials:', error);
    throw new Error(`Failed to send session materials: ${error.message}`);
  }
}

export function validateSpeakerToken(token: string): {
  sessionId: string;
  speakerEmail: string;
} {
  try {
    // Token validation will be handled by the Edge Function
    const [header, payload] = token.split('.');
    const decodedPayload = JSON.parse(atob(payload));
    return {
      sessionId: decodedPayload.sessionId,
      speakerEmail: decodedPayload.speakerEmail,
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}