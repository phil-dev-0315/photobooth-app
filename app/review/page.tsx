"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { getActiveEvent } from "@/lib/events";
import { PhotoGrid } from "@/components/review/PhotoGrid";
import { Button } from "@/components/ui/Button";
import type { Event } from "@/types";

export default function ReviewPage() {
  const router = useRouter();
  const { photos, clearPhotos } = useSession();
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

  const PHOTOS_PER_SESSION = event?.photos_per_session || 3;
  const isComplete = !isLoadingEvent && photos.length >= PHOTOS_PER_SESSION;

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      router.replace("/capture");
    }
  }, [photos.length, router]);

  const handleRetake = () => {
    clearPhotos();
    router.push("/capture");
  };

  const handleContinue = () => {
    router.push("/composite-v2");
  };

  if (photos.length === 0) {
    return null;
  }

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
          {/* Photos grid */}
          <PhotoGrid photos={photos} maxPhotos={PHOTOS_PER_SESSION} />
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
          {isComplete && (
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
                <span className="font-medium">All photos captured!</span>
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
              disabled={!isComplete}
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
