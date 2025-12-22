"use client";

import { useState, useCallback } from 'react';

interface SessionData {
  sessionCode: string;
  compositeUrl: string;
  sessionId: string;
  message: string | null;
  createdAt: string;
}

interface UseSessionSaveReturn {
  saveSession: (dataUrl: string, eventId: string, message?: string) => Promise<SessionData | null>;
  isLoading: boolean;
  error: string | null;
  sessionData: SessionData | null;
  reset: () => void;
}

export function useSessionSave(): UseSessionSaveReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);

  const saveSession = useCallback(async (
    dataUrl: string,
    eventId: string,
    message?: string
  ): Promise<SessionData | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Convert base64 data URL to Blob
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Step 1: Get a signed upload URL from our API (small request)
      const uploadUrlResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      if (!uploadUrlResponse.ok) {
        const uploadUrlError = await uploadUrlResponse.json();
        throw new Error(uploadUrlError.error || 'Failed to get upload URL');
      }

      const { data: uploadData } = await uploadUrlResponse.json();

      // Step 2: Upload directly to Supabase Storage (bypasses Vercel size limit)
      const uploadResponse = await fetch(uploadData.signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'image/png',
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload composite image');
      }

      // Step 3: Create session record with the uploaded file path (small request)
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          compositeUrl: uploadData.publicUrl,
          filePath: uploadData.path,
          message: message || null,
        }),
      });

      const sessionJson = await sessionResponse.json();

      if (!sessionResponse.ok) {
        throw new Error(sessionJson.error || 'Failed to save session');
      }

      const data: SessionData = {
        sessionCode: sessionJson.data.sessionCode,
        compositeUrl: sessionJson.data.compositeUrl,
        sessionId: sessionJson.data.sessionId,
        message: sessionJson.data.message,
        createdAt: sessionJson.data.createdAt,
      };

      setSessionData(data);
      return data;

    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Session save error:', err);
      return null;

    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setSessionData(null);
  }, []);

  return {
    saveSession,
    isLoading,
    error,
    sessionData,
    reset,
  };
}
