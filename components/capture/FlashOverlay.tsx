"use client";

import { motion, AnimatePresence } from "framer-motion";

interface FlashOverlayProps {
  isFlashing: boolean;
  onFlashComplete?: () => void;
}

export function FlashOverlay({ isFlashing, onFlashComplete }: FlashOverlayProps) {
  return (
    <AnimatePresence>
      {isFlashing && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          onAnimationComplete={onFlashComplete}
          className="fixed inset-0 bg-white z-50 pointer-events-none"
        />
      )}
    </AnimatePresence>
  );
}

// Capture success indicator (small thumbnail preview)
interface CaptureIndicatorProps {
  photoDataUrl: string | null;
  photoNumber: number;
  isVisible: boolean;
}

export function CaptureIndicator({
  photoDataUrl,
  photoNumber,
  isVisible,
}: CaptureIndicatorProps) {
  return (
    <AnimatePresence>
      {isVisible && photoDataUrl && (
        <motion.div
          initial={{ scale: 0, opacity: 0, x: 100 }}
          animate={{ scale: 1, opacity: 1, x: 0 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="absolute top-4 right-4 z-40"
        >
          <div className="relative">
            {/* Photo thumbnail */}
            <div className="w-24 h-24 rounded-xl overflow-hidden shadow-2xl border-2 border-white">
              <img
                src={photoDataUrl}
                alt={`Photo ${photoNumber}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Photo number badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="absolute -top-2 -left-2 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg"
            >
              {photoNumber}
            </motion.div>

            {/* Checkmark animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg"
            >
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
