"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCamera } from "@/hooks/useCamera";
import { useCountdown } from "@/hooks/useCountdown";
import { useCameraSound } from "@/hooks/useCameraSound";
import { useVoiceGuidance } from "@/hooks/useVoiceGuidance";
import { useSession } from "@/contexts/SessionContext";
import { getActiveEvent, getEventLayouts } from "@/lib/events";
import { CameraPreview } from "@/components/capture/CameraPreview";
import { Countdown } from "@/components/capture/Countdown";
import { StartSessionButton } from "@/components/capture/CaptureButton";
import { FlashOverlay, CaptureIndicator } from "@/components/capture/FlashOverlay";
import { PosePrompt } from "@/components/capture/PosePrompt";
import { CelebrationOverlay } from "@/components/capture/CelebrationOverlay";
import { GetReadyOverlay } from "@/components/capture/GetReadyOverlay";
import { FrameSelector } from "@/components/capture/FrameSelector";
import { AttractScreen } from "@/components/AttractScreen";
import { Button } from "@/components/ui/Button";
import SecurityCodeGate from "@/components/capture/SecurityCodeGate";
import { CapturedPhoto, Event, EventLayout } from "@/types";

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

type CapturePhase = "frameselect" | "attract" | "getready" | "countdown" | "capturing" | "between" | "complete";

const BETWEEN_PHOTOS_DELAY = 1500; // ms before showing pose prompt
const POSE_PROMPT_DURATION = 3000; // ms to show pose prompt
const GET_READY_DURATION = 3000; // ms to show "Get Ready"

export default function CapturePage() {
  const router = useRouter();
  const { addPhoto, resetSession, photos, setSelectedLayout, selectedLayout } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [layouts, setLayouts] = useState<EventLayout[]>([]);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [isCodeVerified, setIsCodeVerified] = useState(false);

  // Load active event settings and all layouts
  useEffect(() => {
    const loadEventData = async () => {
      try {
        const activeEvent = await getActiveEvent();
        setEvent(activeEvent);

        // Load all layouts for frame selection
        if (activeEvent) {
          const eventLayouts = await getEventLayouts(activeEvent.id);
          setLayouts(eventLayouts);

          // If only one layout, auto-select it and skip frame selector
          if (eventLayouts.length === 1) {
            setSelectedLayout(eventLayouts[0]);
          }
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setIsLoadingEvent(false);
      }
    };
    loadEventData();
  }, [setSelectedLayout]);

  // Photo count is determined by selected layout's placeholders
  const PHOTOS_PER_SESSION = selectedLayout?.placeholders?.length || 3;
  const COUNTDOWN_SECONDS = event?.countdown_seconds || 5;

  // Start with frameselect if multiple layouts, otherwise attract (single layout auto-selected)
  const [phase, setPhase] = useState<CapturePhase>("frameselect");
  const [isFlashing, setIsFlashing] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState<string | null>(null);
  const [showIndicator, setShowIndicator] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to track photo count to avoid stale closures
  const photoCountRef = useRef(0);
  // Use ref for PHOTOS_PER_SESSION to avoid stale closures in callbacks
  const photosPerSessionRef = useRef(PHOTOS_PER_SESSION);

  // Keep refs in sync
  useEffect(() => {
    photoCountRef.current = photos.length;
  }, [photos.length]);

  useEffect(() => {
    photosPerSessionRef.current = PHOTOS_PER_SESSION;
  }, [PHOTOS_PER_SESSION]);

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
    facingMode: "environment",
  });

  // Camera sound effects
  const { playShutterSound } = useCameraSound({ volume: 0.6 });

  // Voice guidance (audio instructions) - fun, energetic female voice
  const {
    speakGetReady,
    speakCountdown,
    speakCapture,
    speakAfterCapture,
    speakBetweenPhotos,
    speakComplete,
    stop: stopVoice,
  } = useVoiceGuidance({
    enabled: event?.voice_guidance_enabled ?? false,
    volume: 1,
    rate: 1.5, // Upbeat pace without sounding rushed
    pitch: 2.3, // Brighter tone, still sounds natural
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

    // Play shutter sound and trigger flash
    playShutterSound();
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

      // Use the ref values to avoid stale closures
      const newPhotoCount = photoCountRef.current + 1;
      const targetPhotoCount = photosPerSessionRef.current;

      // Check if we have all photos
      if (newPhotoCount >= targetPhotoCount) {
        setPhase("complete");
        speakComplete(); // Voice: "All done!"
        // Navigate to review after a short delay
        setTimeout(() => {
          router.push("/review");
        }, 2000);
      } else {
        speakAfterCapture(); // Voice: "Great shot!" / "Perfect!" etc.
        // Prepare for next photo - show capture indicator first
        setTimeout(() => {
          // Hide indicator and show pose prompt
          setShowIndicator(false);
          setPhase("between");
          speakBetweenPhotos(); // Voice: "Strike a pose!" etc.

          // After pose prompt duration, start countdown
          setTimeout(() => {
            setPhase("countdown");
            countdownRef.current?.restart();
          }, POSE_PROMPT_DURATION);
        }, BETWEEN_PHOTOS_DELAY);
      }
    }
  }, [capturePhoto, addPhoto, router, playShutterSound, speakAfterCapture, speakBetweenPhotos, speakComplete]);

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

  // Voice guidance for countdown (last 3 seconds) and capture
  const prevSecondsRef = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'countdown') {
      prevSecondsRef.current = null;
      return;
    }

    const seconds = countdown.secondsRemaining;

    // Speak countdown for last 3 seconds (3, 2, 1)
    if (seconds <= 3 && seconds >= 1 && seconds !== prevSecondsRef.current) {
      speakCountdown(seconds);
    }

    // Speak "Smile!" right at 0 (capture moment)
    if (seconds === 0 && prevSecondsRef.current !== 0) {
      speakCapture();
    }

    prevSecondsRef.current = seconds;
  }, [phase, countdown.secondsRemaining, speakCountdown, speakCapture]);

  // Store countdown in ref for access in callbacks
  useEffect(() => {
    countdownRef.current = countdown;
  }, [countdown]);

  // Check if security code is required
  const requiresSecurityCode = event?.security_code_enabled && event?.security_code;
  const canProceed = !requiresSecurityCode || isCodeVerified;

  // Initialize on mount: reset session (clear photos and selectedLayout)
  useEffect(() => {
    resetSession();
    photoCountRef.current = 0;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start camera when allowed to proceed (either no security required or code verified)
  useEffect(() => {
    if (!isLoadingEvent && canProceed) {
      startCamera();
    }

    return () => {
      if (canProceed) {
        stopCamera();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoadingEvent, canProceed]);

  // Handler for successful security code verification
  const handleCodeVerified = () => {
    setIsCodeVerified(true);
  };

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

  const handleAttractScreenTap = () => {
    // Don't start capture if no layout selected
    if (!selectedLayout) {
      console.warn("Cannot start capture: no layout selected");
      return;
    }
    setPhase("getready");
    speakGetReady(); // Voice: "Get ready!"
    // Auto-start countdown after GET_READY_DURATION
    setTimeout(() => {
      setPhase("countdown");
      countdown.start();
    }, GET_READY_DURATION);
  };

  const handleFlashComplete = () => {
    setIsFlashing(false);
  };

  const handleCancel = () => {
    countdown.pause();
    stopCamera();
    stopVoice(); // Stop any ongoing voice guidance
    resetSession();
    router.push("/");
  };

  const handleBackToAttract = () => {
    countdown.pause();
    stopVoice(); // Stop any ongoing voice guidance
    setPhase("attract");
  };

  const handleFrameSelect = (layout: EventLayout) => {
    setSelectedLayout(layout);
    setPhase("attract");
  };

  // Auto-transition from frameselect to attract when layout is already selected (single layout case)
  useEffect(() => {
    if (phase === "frameselect" && selectedLayout && layouts.length <= 1) {
      setPhase("attract");
    }
  }, [phase, selectedLayout, layouts.length]);

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

  // Security code gate - show before camera initialization
  if (requiresSecurityCode && !isCodeVerified) {
    return (
      <SecurityCodeGate
        eventName={event?.name || 'Photobooth'}
        securityCode={event?.security_code || ''}
        onVerified={handleCodeVerified}
        onCancel={() => router.push('/')}
      />
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
      {/* Camera Preview - fitted to placeholder aspect ratio */}
      <CameraPreview
        ref={videoRef}
        isReady={isCameraReady}
        isMirrored={currentFacingMode === "user"}
        placeholderAspectRatio={
          selectedLayout?.placeholders?.[0]
            ? selectedLayout.placeholders[0].width / selectedLayout.placeholders[0].height
            : undefined
        }
      />

      {/* Frame Selector (shown before attract if multiple layouts) */}
      <AnimatePresence>
        {phase === "frameselect" && layouts.length > 1 && (
          <FrameSelector
            layouts={layouts}
            onSelect={handleFrameSelect}
            eventName={event?.name}
          />
        )}
      </AnimatePresence>

      {/* Attract Screen (shown when camera is ready and layout is selected) */}
      <AnimatePresence>
        {phase === "attract" && isCameraReady && event && selectedLayout && (
          <AttractScreen event={event} onStart={handleAttractScreenTap} />
        )}
      </AnimatePresence>

      {/* Get Ready Overlay (shown after attract, before countdown) */}
      <GetReadyOverlay isVisible={phase === "getready"} />

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

      {/* Pose Prompt (shown between photos) */}
      <PosePrompt
        isVisible={phase === "between"}
        photoNumber={currentPhotoIndex + 1}
      />

      {/* Celebration Overlay (shown when complete) */}
      <CelebrationOverlay isVisible={phase === "complete"} />

      {/* Photo counter (visible during active capture) */}
      <AnimatePresence>
        {phase !== "frameselect" && phase !== "attract" && phase !== "getready" && phase !== "complete" && (
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
          {/* Get Ready state - show cancel option */}
          {phase === "getready" && (
            <motion.div
              key="getready"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4"
            >
              <button
                onClick={handleBackToAttract}
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

          {/* Complete state - CelebrationOverlay handles the display */}
          {phase === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center"
            >
              {/* Empty - CelebrationOverlay shows the success message */}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Projection Toggle Button - only in attract phase */}
      <AnimatePresence>
        {phase === "attract" && isCameraReady && event && (
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

      {/* Camera switch button - only in attract phase */}
      <AnimatePresence>
        {phase === "attract" && isCameraReady && (
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
