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
      // Convert base64 data URL to Blob for efficient upload
      const base64Data = dataUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteArray = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteArray[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([byteArray], { type: 'image/png' });

      // Send as FormData to avoid JSON body size limits
      const formData = new FormData();
      formData.append('file', blob, `composite-${Date.now()}.png`);
      formData.append('eventId', eventId);
      if (message) {
        formData.append('message', message);
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Failed to save session');
      }

      const data: SessionData = {
        sessionCode: json.data.sessionCode,
        compositeUrl: json.data.compositeUrl,
        sessionId: json.data.sessionId,
        message: json.data.message,
        createdAt: json.data.createdAt,
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
