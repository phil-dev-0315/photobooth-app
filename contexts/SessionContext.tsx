"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { CapturedPhoto, CropMetadata, Event, EventLayout, SessionContextValue } from "@/types";

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  const [eventId, setEventId] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedLayout, setSelectedLayout] = useState<EventLayout | null>(null);
  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  const addPhoto = useCallback((photo: CapturedPhoto) => {
    setPhotos((prev) => [...prev, photo]);
  }, []);

  const clearPhotos = useCallback(() => {
    setPhotos([]);
  }, []);

  const updatePhotoCrop = useCallback((photoId: string, cropMetadata: CropMetadata) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, cropMetadata } : photo
      )
    );
  }, []);

  const resetSession = useCallback(() => {
    setSelectedLayout(null);
    setPhotos([]);
    setMessage(null);
  }, []);

  const value: SessionContextValue = {
    eventId,
    event,
    selectedLayout,
    photos,
    message,
    setEventId,
    setEvent,
    setSelectedLayout,
    addPhoto,
    clearPhotos,
    setMessage,
    resetSession,
    updatePhotoCrop,
  };

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used within a SessionProvider");
  }
  return context;
}

// Hook for getting capture-specific utilities
export function useCaptureSession() {
  const session = useSession();
  // Photo count is now determined by the selected layout's placeholders
  const photosPerSession = session.selectedLayout?.placeholders?.length ?? 3;
  const countdownSeconds = session.event?.countdown_seconds ?? 8;

  const isSessionComplete = session.photos.length >= photosPerSession;
  const currentPhotoIndex = session.photos.length;
  const remainingPhotos = photosPerSession - session.photos.length;

  return {
    ...session,
    photosPerSession,
    countdownSeconds,
    isSessionComplete,
    currentPhotoIndex,
    remainingPhotos,
  };
}
