// Event types
export interface Event {
  id: string;
  name: string;
  event_date: string | null;
  event_type: 'wedding' | 'birthday' | 'christening' | 'corporate' | 'other';
  is_active: boolean;
  photos_per_session: number;
  countdown_seconds: number;
  message_enabled: boolean;
  message_char_limit: number;
  default_layout: string;
  logo_url: string | null;
  stickers_enabled: boolean; // Enable sticker feature for this event
  is_premium_frame_enabled: boolean; // Enable premium overlay frames for this event
  security_code_enabled: boolean; // Require security code to start session
  security_code: string | null; // The security code for this event
  created_at: string;
  updated_at: string;
}

export interface EventFormData {
  name: string;
  event_date: string | null;
  event_type: 'wedding' | 'birthday' | 'christening' | 'corporate' | 'other';
  is_active: boolean;
  photos_per_session: number;
  countdown_seconds: number;
  message_enabled: boolean;
  message_char_limit: number;
  default_layout: string;
  stickers_enabled?: boolean;
  is_premium_frame_enabled?: boolean;
  security_code_enabled?: boolean;
  security_code?: string;
}

// Placeholder for photo positioning
export type PlaceholderShape = 'rectangle' | 'circle';

export interface PhotoPlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
  shape?: PlaceholderShape; // defaults to 'rectangle' if undefined
}

// Frame overlay - fixed decorative element positioned by admin
export interface FrameOverlay {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Event layout types
export interface EventLayout {
  id: string;
  event_id: string;
  layout_type: string;
  frame_url: string | null;
  include_message: boolean;
  include_logo: boolean;
  is_default: boolean;
  width: number;
  height: number;
  placeholders: PhotoPlaceholder[];
  overlays?: FrameOverlay[]; // Fixed overlays positioned by admin
  created_at: string;
}

// Session types
export interface Session {
  id: string;
  event_id: string;
  session_code: string;
  message: string | null;
  composite_url: string | null;
  is_printed: boolean;
  created_at: string;
}

export interface SessionWithPhotos extends Session {
  photos: Photo[];
  event?: Event;
}

// Photo types
export interface Photo {
  id: string;
  session_id: string;
  photo_url: string;
  photo_order: number;
  created_at: string;
}

// Captured photo (client-side before upload)
export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

// Camera state for the camera hook
export interface CameraState {
  isReady: boolean;
  isCapturing: boolean;
  error: string | null;
  stream: MediaStream | null;
}

// Session context value
export interface SessionContextValue {
  eventId: string | null;
  event: Event | null;
  photos: CapturedPhoto[];
  message: string | null;
  setEventId: (id: string | null) => void;
  setEvent: (event: Event | null) => void;
  addPhoto: (photo: CapturedPhoto) => void;
  setPhotos: (photos: CapturedPhoto[]) => void;
  clearPhotos: () => void;
  setMessage: (message: string | null) => void;
  resetSession: () => void;
}

// Button types
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Storage types
export interface UploadResult {
  url: string;
  path: string;
}

export interface StorageBucket {
  name: 'frames' | 'logos' | 'photos' | 'composites' | 'stickers';
  publicAccess: boolean;
}

// Admin types
export interface AdminStats {
  totalEvents: number;
  activeEvents: number;
  totalSessions: number;
  todaySessions: number;
  totalPhotos: number;
}

// Sticker types
export interface Sticker {
  id: string;
  event_id: string;
  name: string;
  url: string;
  category?: string;
  created_at: string;
}

// Placed sticker on canvas (with transform properties)
export interface PlacedSticker {
  id: string; // Unique ID for this placed instance
  stickerId: string; // Reference to the original sticker
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
}
