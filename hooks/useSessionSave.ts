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
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId,
          imageData: dataUrl,
          message: message || null,
        }),
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
