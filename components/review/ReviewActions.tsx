"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

interface ReviewActionsProps {
  onRetake: () => void;
  onContinue: () => void;
  isComplete: boolean;
  photosCount: number;
  requiredPhotos: number;
}

export function ReviewActions({
  onRetake,
  onContinue,
  isComplete,
  photosCount,
  requiredPhotos,
}: ReviewActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="w-full max-w-md mx-auto px-4"
    >
      {/* Status message */}
      <div className="text-center mb-6">
        {isComplete ? (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full mb-2">
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
            <p className="text-gray-600">
              Review your photos and continue when ready.
            </p>
          </motion.div>
        ) : (
          <p className="text-gray-600">
            {photosCount} of {requiredPhotos} photos captured
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3">
        {/* Continue button (primary action when complete) */}
        <Button
          onClick={onContinue}
          variant="primary"
          size="lg"
          fullWidth
          disabled={!isComplete}
          className={!isComplete ? "opacity-50" : ""}
        >
          <span className="flex items-center justify-center gap-2">
            {isComplete ? (
              <>
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
              </>
            ) : (
              <span>Waiting for all photos...</span>
            )}
          </span>
        </Button>

        {/* Retake button */}
        <Button onClick={onRetake} variant="outline" size="lg" fullWidth>
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
    </motion.div>
  );
}

// Compact action bar (for bottom of screen)
interface ActionBarProps {
  onRetake: () => void;
  onContinue: () => void;
  disabled?: boolean;
}

export function ActionBar({ onRetake, onContinue, disabled = false }: ActionBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 safe-area-pb"
    >
      <div className="max-w-md mx-auto flex gap-3">
        <Button onClick={onRetake} variant="outline" size="md" className="flex-1">
          Retake
        </Button>
        <Button
          onClick={onContinue}
          variant="primary"
          size="md"
          className="flex-1"
          disabled={disabled}
        >
          Continue
        </Button>
      </div>
    </motion.div>
  );
}
