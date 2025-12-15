import { createClient } from '@supabase/supabase-js';
import type { Event, EventFormData, EventLayout, Session, SessionWithPhotos, Photo, AdminStats } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================
// Event Management Functions
// ============================================

/**
 * Get all events
 */
export async function getEvents(): Promise<Event[]> {
  const response = await fetch('/api/events');
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch events');
  return json.data || [];
}

/**
 * Get active event
 */
export async function getActiveEvent(): Promise<Event | null> {
  const response = await fetch('/api/events?active=true');
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch active event');
  return json.data || null;
}

/**
 * Get event by ID
 */
export async function getEventById(id: string): Promise<Event | null> {
  const response = await fetch(`/api/events/${id}`);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch event');
  return json.data || null;
}

/**
 * Create new event
 */
export async function createEvent(eventData: EventFormData): Promise<Event> {
  const response = await fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to create event');
  return json.data;
}

/**
 * Update event
 */
export async function updateEvent(id: string, eventData: Partial<EventFormData>): Promise<Event> {
  const response = await fetch(`/api/events?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(eventData),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to update event');
  return json.data;
}

/**
 * Delete event
 */
export async function deleteEvent(id: string): Promise<void> {
  const response = await fetch(`/api/events?id=${id}`, {
    method: 'DELETE',
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to delete event');
}

/**
 * Set event as active (deactivates others)
 */
export async function setActiveEvent(id: string): Promise<void> {
  const response = await fetch(`/api/events?id=${id}&setActive=true`, {
    method: 'PUT',
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to set active event');
}

// ============================================
// Event Layout Functions
// ============================================

/**
 * Get layouts for an event
 */
export async function getEventLayouts(eventId: string): Promise<EventLayout[]> {
  const response = await fetch(`/api/event-layouts?eventId=${eventId}`);
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch event layouts');
  return json.data || [];
}

/**
 * Create event layout
 */
export async function createEventLayout(layout: Omit<EventLayout, 'id' | 'created_at'>): Promise<EventLayout> {
  const response = await fetch('/api/event-layouts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layout),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to create event layout');
  return json.data;
}

/**
 * Update event layout
 */
export async function updateEventLayout(id: string, layout: Partial<EventLayout>): Promise<EventLayout> {
  const response = await fetch(`/api/event-layouts?id=${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(layout),
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to update event layout');
  return json.data;
}

/**
 * Delete event layout
 */
export async function deleteEventLayout(id: string): Promise<void> {
  const response = await fetch(`/api/event-layouts?id=${id}`, {
    method: 'DELETE',
  });
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to delete event layout');
}

// ============================================
// Session Management Functions
// ============================================

/**
 * Generate unique session code
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Create new session
 */
export async function createSession(eventId: string, message?: string): Promise<Session> {
  const sessionCode = generateSessionCode();

  const { data, error } = await supabase
    .from('sessions')
    .insert([{
      event_id: eventId,
      session_code: sessionCode,
      message: message || null
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to create session: ${error.message}`);
  return data;
}

/**
 * Update session
 */
export async function updateSession(id: string, updates: Partial<Session>): Promise<Session> {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update session: ${error.message}`);
  return data;
}

/**
 * Get session by ID with photos
 */
export async function getSessionById(id: string): Promise<SessionWithPhotos | null> {
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, event:events(*)')
    .eq('id', id)
    .single();

  if (sessionError && sessionError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch session: ${sessionError.message}`);
  }

  if (!session) return null;

  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('session_id', id)
    .order('photo_order', { ascending: true });

  if (photosError) throw new Error(`Failed to fetch photos: ${photosError.message}`);

  return {
    ...session,
    photos: photos || []
  };
}

/**
 * Get session by code
 */
export async function getSessionByCode(code: string): Promise<SessionWithPhotos | null> {
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('*, event:events(*)')
    .eq('session_code', code)
    .single();

  if (sessionError && sessionError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch session: ${sessionError.message}`);
  }

  if (!session) return null;

  const { data: photos, error: photosError } = await supabase
    .from('photos')
    .select('*')
    .eq('session_id', session.id)
    .order('photo_order', { ascending: true });

  if (photosError) throw new Error(`Failed to fetch photos: ${photosError.message}`);

  return {
    ...session,
    photos: photos || []
  };
}

/**
 * Get sessions for an event
 */
export async function getEventSessions(eventId: string): Promise<Session[]> {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Failed to fetch sessions: ${error.message}`);
  return data || [];
}

// ============================================
// Photo Management Functions
// ============================================

/**
 * Add photo to session
 */
export async function addPhotoToSession(
  sessionId: string,
  photoUrl: string,
  photoOrder: number
): Promise<Photo> {
  const { data, error } = await supabase
    .from('photos')
    .insert([{
      session_id: sessionId,
      photo_url: photoUrl,
      photo_order: photoOrder
    }])
    .select()
    .single();

  if (error) throw new Error(`Failed to add photo: ${error.message}`);
  return data;
}

/**
 * Get photos for a session
 */
export async function getSessionPhotos(sessionId: string): Promise<Photo[]> {
  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('session_id', sessionId)
    .order('photo_order', { ascending: true });

  if (error) throw new Error(`Failed to fetch photos: ${error.message}`);
  return data || [];
}

// ============================================
// Admin Stats Functions
// ============================================

/**
 * Get admin dashboard stats
 */
export async function getAdminStats(): Promise<AdminStats> {
  const response = await fetch('/api/admin/stats');
  const json = await response.json();
  if (!response.ok) throw new Error(json.error || 'Failed to fetch stats');
  return json.data;
}
