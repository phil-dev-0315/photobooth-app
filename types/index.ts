// Event types
export type EventType = "wedding" | "birthday" | "christening" | "corporate" | "other";

export interface Event {
  id: string;
  name: string;
  event_date: string | null;
  event_type: EventType | null;
  is_active: boolean;
  photos_per_session: number;
  countdown_seconds: number;
  message_enabled: boolean;
  message_char_limit: number;
  default_layout: LayoutType;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

// Layout types
export type LayoutType = "3-vertical" | "2x2" | "single" | "4-strip";

export interface EventLayout {
  id: string;
  event_id: string;
  layout_type: LayoutType;
  frame_url: string | null;
  include_message: boolean;
  include_logo: boolean;
  is_default: boolean;
  created_at: string;
}

export interface LayoutConfig {
  type: LayoutType;
  photoCount: number;
  photoPositions: PhotoPosition[];
  logoPosition: Position | null;
  messagePosition: Position | null;
  width: number;
  height: number;
}

export interface PhotoPosition {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
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

export interface Photo {
  id: string;
  session_id: string;
  photo_url: string;
  photo_order: number;
  created_at: string;
}

// Capture flow types
export type CapturePhase = "idle" | "countdown" | "capturing" | "review" | "complete";

export interface CaptureState {
  phase: CapturePhase;
  photos: CapturedPhoto[];
  currentPhotoIndex: number;
  countdownValue: number;
}

export interface CapturedPhoto {
  id: string;
  dataUrl: string;
  timestamp: number;
}

// Camera types
export interface CameraConfig {
  facingMode: "user" | "environment";
  width: number;
  height: number;
}

export interface CameraState {
  isReady: boolean;
  isCapturing: boolean;
  error: string | null;
  stream: MediaStream | null;
}

// UI types
export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

// Session context types
export interface SessionContextValue {
  eventId: string | null;
  event: Event | null;
  photos: CapturedPhoto[];
  message: string | null;
  setEventId: (id: string | null) => void;
  setEvent: (event: Event | null) => void;
  addPhoto: (photo: CapturedPhoto) => void;
  clearPhotos: () => void;
  setMessage: (message: string | null) => void;
  resetSession: () => void;
}
