"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { getActiveEvent } from "@/lib/events";
import { PhotoGrid } from "@/components/review/PhotoGrid";
import { Button } from "@/components/ui/Button";
import { useBackgroundRemoval } from "@/hooks/useBackgroundRemoval";
import type { Event, CapturedPhoto } from "@/types";

export default function ReviewPage() {
  const router = useRouter();
  const { photos, clearPhotos, setPhotos } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);

  // Magic background state
  const [isMagicMode, setIsMagicMode] = useState(false);
  const {
    processPhotos,
    getProcessedUrl,
    isProcessing,
    progress,
    processedCount,
    totalCount,
    error: bgError,
    isSupported: isBgRemovalSupported,
  } = useBackgroundRemoval();

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

  const PHOTOS_PER_SESSION = event?.photos_per_session || 3;
  const isComplete = !isLoadingEvent && photos.length >= PHOTOS_PER_SESSION;

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      router.replace("/capture");
    }
  }, [photos.length, router]);

  // Handle magic mode toggle
  const handleMagicToggle = useCallback(async (enabled: boolean) => {
    setIsMagicMode(enabled);
    if (enabled && photos.length > 0) {
      // Start processing if not already cached
      await processPhotos(photos);
    }
  }, [photos, processPhotos]);

  // Get display URL for photo (processed or original based on mode)
  const getDisplayUrl = useCallback((photo: CapturedPhoto): string => {
    if (isMagicMode) {
      const processedUrl = getProcessedUrl(photo.id);
      return processedUrl || photo.dataUrl;
    }
    return photo.dataUrl;
  }, [isMagicMode, getProcessedUrl]);

  // Get processing status for photo
  const getProcessingStatus = useCallback((photoId: string): 'pending' | 'processing' | 'done' | null => {
    if (!isMagicMode || !isProcessing) return null;
    const processed = getProcessedUrl(photoId);
    if (processed) return 'done';
    // Simple heuristic: first unprocessed is "processing", rest are "pending"
    const photoIndex = photos.findIndex(p => p.id === photoId);
    if (photoIndex < processedCount) return 'done';
    if (photoIndex === processedCount) return 'processing';
    return 'pending';
  }, [isMagicMode, isProcessing, getProcessedUrl, photos, processedCount]);

  const handleRetake = () => {
    clearPhotos();
    router.push("/capture");
  };

  const handleContinue = () => {
    // If magic mode is on, update photos with processed URLs before continuing
    if (isMagicMode) {
      const updatedPhotos = photos.map(photo => {
        const processedUrl = getProcessedUrl(photo.id);
        if (processedUrl) {
          return { ...photo, dataUrl: processedUrl };
        }
        return photo;
      });
      // Update session with processed photos
      setPhotos(updatedPhotos);
    }
    router.push("/composite-v2");
  };

  if (photos.length === 0) {
    return null;
  }

  // Check if all photos are processed when in magic mode
  const allPhotosProcessed = isMagicMode && photos.every(p => getProcessedUrl(p.id));
  const canContinue = isComplete && (!isMagicMode || allPhotosProcessed || !isProcessing);

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-4 shrink-0"
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Review Photos</h1>
          <span className="text-sm text-gray-500">
            {isLoadingEvent ? (
              <span className="inline-block w-12 h-4 bg-gray-200 rounded animate-pulse" />
            ) : (
              `${photos.length} / ${PHOTOS_PER_SESSION}`
            )}
          </span>
        </div>
      </motion.header>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Magic Background Toggle */}
          {isBgRemovalSupported && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Magic Background</p>
                    <p className="text-sm text-gray-500">Remove photo backgrounds</p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => handleMagicToggle(!isMagicMode)}
                  disabled={isProcessing}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                    isMagicMode ? 'bg-purple-600' : 'bg-gray-300'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow transition-transform duration-200 ${
                      isMagicMode ? 'translate-x-6' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Processing Progress */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Processing photos...</span>
                      <span>{processedCount}/{totalCount}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-purple-600 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error Message */}
              {bgError && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600">{bgError}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Not Supported Warning */}
          {!isBgRemovalSupported && typeof window !== 'undefined' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-yellow-600 mt-0.5"
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
                <div>
                  <p className="font-medium text-yellow-800">Magic Background Unavailable</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Background removal requires a secure context with SharedArrayBuffer support.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Photos grid */}
          <PhotoGrid
            photos={photos}
            maxPhotos={PHOTOS_PER_SESSION}
            getDisplayUrl={getDisplayUrl}
            isProcessing={isProcessing}
            getProcessingStatus={getProcessingStatus}
          />
        </div>
      </div>

      {/* Fixed bottom actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="shrink-0 bg-white border-t border-gray-200 px-4 py-4 safe-area-pb"
      >
        <div className="max-w-md mx-auto">
          {/* Status message */}
          {isComplete && !isProcessing && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full">
                <svg
                  className="w-5 h-5"
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
                <span className="font-medium">
                  {isMagicMode && allPhotosProcessed
                    ? "Backgrounds removed!"
                    : "All photos captured!"}
                </span>
              </div>
            </div>
          )}

          {/* Processing message */}
          {isProcessing && (
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full">
                <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-medium">Removing backgrounds...</span>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            <Button
              onClick={handleContinue}
              variant="primary"
              size="lg"
              fullWidth
              disabled={!canContinue}
            >
              <span className="flex items-center justify-center gap-2">
                <span>Continue</span>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </span>
            </Button>

            <Button onClick={handleRetake} variant="outline" size="lg" fullWidth>
              <span className="flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5"
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
                <span>Retake All Photos</span>
              </span>
            </Button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
