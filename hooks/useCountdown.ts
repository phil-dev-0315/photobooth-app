"use client";

import { useState, useCallback, useRef, useEffect } from "react";

interface UseCountdownOptions {
  initialSeconds: number;
  onTick?: (secondsRemaining: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

interface UseCountdownReturn {
  secondsRemaining: number;
  isRunning: boolean;
  isComplete: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
  restart: () => void;
}

export function useCountdown({
  initialSeconds,
  onTick,
  onComplete,
  autoStart = false,
}: UseCountdownOptions): UseCountdownReturn {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isComplete, setIsComplete] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onCompleteRef = useRef(onComplete);
  const hasCalledCompleteRef = useRef(false);

  // Update callback ref when it changes
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Sync secondsRemaining when initialSeconds changes (only when not running)
  // This ensures the countdown uses the correct value after async data loads
  useEffect(() => {
    if (!isRunning && !isComplete) {
      setSecondsRemaining(initialSeconds);
    }
  }, [initialSeconds, isRunning, isComplete]);

  const clearCountdownInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    // Reset complete state when starting
    setIsComplete(false);
    hasCalledCompleteRef.current = false;
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
    clearCountdownInterval();
  }, [clearCountdownInterval]);

  const reset = useCallback(() => {
    clearCountdownInterval();
    setSecondsRemaining(initialSeconds);
    setIsRunning(false);
    setIsComplete(false);
    hasCalledCompleteRef.current = false;
  }, [initialSeconds, clearCountdownInterval]);

  const restart = useCallback(() => {
    clearCountdownInterval();
    hasCalledCompleteRef.current = false;
    setSecondsRemaining(initialSeconds);
    setIsComplete(false);
    setIsRunning(true);
  }, [initialSeconds, clearCountdownInterval]);

  // Main countdown effect
  useEffect(() => {
    // Clear any existing interval
    clearCountdownInterval();

    if (!isRunning) {
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        const next = prev - 1;

        if (onTick) {
          onTick(next);
        }

        if (next <= 0) {
          clearCountdownInterval();
          setIsRunning(false);
          setIsComplete(true);

          // Only call onComplete once per countdown cycle
          if (!hasCalledCompleteRef.current && onCompleteRef.current) {
            hasCalledCompleteRef.current = true;
            // Use requestAnimationFrame to ensure state updates are flushed
            requestAnimationFrame(() => {
              onCompleteRef.current?.();
            });
          }

          return 0;
        }

        return next;
      });
    }, 1000);

    return () => {
      clearCountdownInterval();
    };
  }, [isRunning, clearCountdownInterval, onTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearCountdownInterval();
    };
  }, [clearCountdownInterval]);

  return {
    secondsRemaining,
    isRunning,
    isComplete,
    start,
    pause,
    reset,
    restart,
  };
}
