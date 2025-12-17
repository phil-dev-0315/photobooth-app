"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCamera } from "@/hooks/useCamera";
import { useCountdown } from "@/hooks/useCountdown";
import { useSession } from "@/contexts/SessionContext";
import { getActiveEvent } from "@/lib/events";
import { CameraPreview } from "@/components/capture/CameraPreview";
import { Countdown } from "@/components/capture/Countdown";
import { StartSessionButton } from "@/components/capture/CaptureButton";
import { FlashOverlay, CaptureIndicator } from "@/components/capture/FlashOverlay";
import { Button } from "@/components/ui/Button";
import { CapturedPhoto, Event } from "@/types";

// Add these types to handle the experimental Multi-Screen Window Placement API
interface ScreenDetailed extends Screen {
  isExtended: boolean;
  devicePixelRatio: number;
  label: string;
  left: number;
  top: number;
}

interface ScreenDetails {
  screens: ScreenDetailed[];
  currentScreen: ScreenDetailed;
  onscreenschange: ((this: ScreenDetails, ev: Event) => any) | null;
}

declare global {
  interface Window {
    getScreenDetails?: () => Promise<ScreenDetails>;
  }
}

type CapturePhase = "ready" | "countdown" | "capturing" | "between" | "complete";

const BETWEEN_PHOTOS_DELAY = 1500; // ms

export default function CapturePage() {
  const router = useRouter();
  const { addPhoto, clearPhotos, photos } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  // Load active event settings
  useEffect(() => {
    const loadEvent = async () => {
      try {
        const activeEvent = await getActiveEvent();
        setEvent(activeEvent);
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setIsLoadingEvent(false);
      }
    };
    loadEvent();
  }, []);

  // Use event settings or defaults
  const PHOTOS_PER_SESSION = event?.photos_per_session || 3;
  const COUNTDOWN_SECONDS = event?.countdown_seconds || 5;

  const [phase, setPhase] = useState<CapturePhase>("ready");
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track photo count to avoid stale closures
  const photoCountRef = useRef(0);

  // Keep ref in sync with photos array
  useEffect(() => {
    photoCountRef.current = photos.length;
  }, [photos.length]);

  const currentPhotoIndex = photos.length;

  const {
    videoRef,
    isReady: isCameraReady,
    error: cameraError,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    currentFacingMode,
  } = useCamera({
    facingMode: "user",
  });

  // --- Projection Logic Start ---
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    broadcastChannelRef.current = new BroadcastChannel('booth_control');
    return () => {
      broadcastChannelRef.current?.close();
    };
  }, []);

  const openProjection = async () => {
    try {
      // Check if the API is supported
      if (!('getScreenDetails' in window) || !window.getScreenDetails) {
        console.warn('Multi-Screen Window Placement API not supported.');
        alert('Multi-screen API not supported. Opening in standard window.');
        window.open('/projection', 'booth_projection', 'width=800,height=600');
        return;
      }

      // Request permission and get screen details
      const screenDetails = await window.getScreenDetails();
      
      // Find the external display
      const externalScreen = screenDetails.screens.find(
        (s) => s !== screenDetails.currentScreen
      );

      if (externalScreen) {
        const { left, top, width, height } = externalScreen;
        window.open(
          '/projection',
          'booth_projection',
          `left=${left},top=${top},width=${width},height=${height},menubar=no,toolbar=no,location=no,status=no,resizable=yes,scrollbars=no`
        );
      } else {
        console.log('No external screen detected.');
        window.open('/projection', 'booth_projection', 'width=800,height=600');
      }
    } catch (error) {
      console.error('Error opening projection:', error);
      window.open('/projection', 'booth_projection', 'width=800,height=600');
    }
  };

  const handleDualScreenCapture = () => {
    if (broadcastChannelRef.current) {
      broadcastChannelRef.current.postMessage({ action: 'CLOSE' });
    }
    console.log('Projection closed for capture.');
  };

  // --- Projection Logic End ---

  // Use ref for countdown to access in callbacks
  const countdownRef = useRef<ReturnType<typeof useCountdown> | null>(null);

  const handleCaptureComplete = useCallback(() => {
    // Close projection window before capture to avoid infinite mirror or interference
    handleDualScreenCapture();
    // Trigger flash
    setIsFlashing(true);

    // Capture the photo
    const photoDataUrl = capturePhoto();

    if (photoDataUrl) {
      const newPhoto: CapturedPhoto = {
        id: `photo-${Date.now()}`,
        dataUrl: photoDataUrl,
        timestamp: Date.now(),
      };

      addPhoto(newPhoto);
      setLastCapturedPhoto(photoDataUrl);
      setShowIndicator(true);

      // Use the ref value + 1 for the count after adding this photo
      const newPhotoCount = photoCountRef.current + 1;

      // Check if we have all photos
      if (newPhotoCount >= PHOTOS_PER_SESSION) {
        setPhase("complete");
        // Navigate to review after a short delay
        setTimeout(() => {
          router.push("/review");
        }, 1500);
      } else {
        // Prepare for next photo
        setPhase("between");
        setTimeout(() => {
          setShowIndicator(false);
          setPhase("countdown");
          countdownRef.current?.restart();
        }, BETWEEN_PHOTOS_DELAY);
      }
    }
  }, [capturePhoto, addPhoto, router]);

  const countdown = useCountdown({
    initialSeconds: COUNTDOWN_SECONDS,
    onComplete: handleCaptureComplete,
  });

  // Sync Countdown with Projection
  useEffect(() => {
    if (!broadcastChannelRef.current) return;

    if (phase === 'countdown') {
      broadcastChannelRef.current.postMessage({
        action: 'SYNC_TIMER',
        payload: countdown.secondsRemaining,
      });
    } else {
      broadcastChannelRef.current.postMessage({
        action: 'SYNC_TIMER',
        payload: null,
      });
    }
  }, [phase, countdown.secondsRemaining]);

  // Store countdown in ref for access in callbacks
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  // Initialize on mount: clear photos and start camera
  useEffect(() => {
    clearPhotos();
    photoCountRef.current = 0;
    startCamera();

    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle camera error
  useEffect(() => {
    if (cameraError) {
      setError(cameraError);
    }
  }, [cameraError]);

  // Handler for retry button - clears error before retrying
  const handleRetry = () => {
    setError(null);
    startCamera();
  };

  const handleStartSession = () => {
    if (!isCameraReady) return;
    setPhase("countdown");
    countdown.start();
  };

  const handleFlashComplete = () => {
    setIsFlashing(false);
  };

  const handleCancel = () => {
    countdown.pause();
    stopCamera();
    clearPhotos();
    router.push("/");
  };

  // Loading state
  if (isLoadingEvent) {
    return (
      <main className="full-screen flex flex-col items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading event settings...</p>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="full-screen flex flex-col items-center justify-center bg-gray-900 p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Camera Error</h1>
          <p className="text-gray-400 mb-6 max-w-sm">
            {error}
          </p>
          <div className="flex flex-col gap-3">
            <Button onClick={handleRetry} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => router.push("/")} variant="ghost" className="text-white">
              Go Back
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="full-screen relative bg-black overflow-hidden">
      {/* Camera Preview */}
      <CameraPreview
        ref={videoRef}
        isReady={isCameraReady}
        isMirrored={currentFacingMode === "user"}
      />

      {/* Flash Overlay */}
      <FlashOverlay isFlashing={isFlashing} onFlashComplete={handleFlashComplete} />

      {/* Countdown Overlay */}
      <Countdown
        seconds={countdown.secondsRemaining}
        isVisible={phase === "countdown"}
        totalPhotos={PHOTOS_PER_SESSION}
        currentPhoto={currentPhotoIndex + 1}
      />

      {/* Capture Indicator */}
      <CaptureIndicator
        photoDataUrl={lastCapturedPhoto}
        photoNumber={currentPhotoIndex}
        isVisible={showIndicator}
      />

      {/* Photo counter (always visible except ready state) */}
      <AnimatePresence>
        {phase !== "ready" && phase !== "complete" && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-4 z-30"
          >
            <div className="flex gap-2">
              {Array.from({ length: PHOTOS_PER_SESSION }).map((_, i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                    i < currentPhotoIndex
                      ? "bg-green-500"
                      : i === currentPhotoIndex
                      ? "bg-white"
                      : "bg-white/30"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 safe-area-pb">
        <AnimatePresence mode="wait">
          {/* Ready state - Show start button */}
          {phase === "ready" && isCameraReady && (
            <motion.div
              key="start"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex flex-col items-center gap-4"
            >
              <StartSessionButton onClick={handleStartSession} />
              <button
                onClick={handleCancel}
                className="text-white/60 hover:text-white text-sm"
              >
                Cancel
              </button>
            </motion.div>
          )}

          {/* Capturing state - Show progress */}
          {(phase === "countdown" || phase === "between" || phase === "capturing") && (
            <motion.div
              key="capturing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              {/* Cancel button during capture */}
              <button
                onClick={handleCancel}
                className="text-white/60 hover:text-white text-sm flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancel Session
              </button>
            </motion.div>
          )}

          {/* Complete state - Show success */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="bg-green-500 text-white px-6 py-3 rounded-full flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <span className="font-semibold">All photos captured!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Projection Toggle Button */}
      <AnimatePresence>
        {phase === "ready" && isCameraReady && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={openProjection}
            className="absolute top-4 left-4 z-30 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition-colors"
            title="Start External Projection"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Camera switch button */}
      <AnimatePresence>
        {phase === "ready" && isCameraReady && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={switchCamera}
            className="absolute top-4 right-4 z-30 w-12 h-12 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
