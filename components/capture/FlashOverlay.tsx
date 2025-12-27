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
        <>
          {/* Main flash - bright white burst */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{
              duration: 0.4,
              times: [0, 0.1, 0.3, 1],
              ease: "easeOut"
            }}
            onAnimationComplete={onFlashComplete}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{
              background: "radial-gradient(circle at center, rgba(255,255,255,1) 0%, rgba(255,255,255,0.95) 50%, rgba(255,255,255,0.8) 100%)",
            }}
          />

          {/* Secondary flash ring - adds depth */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{
              opacity: [0, 0.6, 0],
              scale: [0.8, 1.2, 1.5]
            }}
            transition={{
              duration: 0.5,
              ease: "easeOut"
            }}
            className="fixed inset-0 z-49 pointer-events-none flex items-center justify-center"
          >
            <div
              className="w-[200vmax] h-[200vmax] rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 70%)",
              }}
            />
          </motion.div>

          {/* Shutter animation overlay */}
          <motion.div
            initial={{ scaleY: 0 }}
            animate={{ scaleY: [0, 1, 1, 0] }}
            transition={{
              duration: 0.25,
              times: [0, 0.3, 0.7, 1],
              ease: [0.4, 0, 0.2, 1]
            }}
            className="fixed inset-0 z-51 pointer-events-none origin-center"
            style={{
              background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.3) 100%)",
            }}
          />
        </>
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
          initial={{ scale: 0, opacity: 0, y: -50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -20 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="absolute top-4 right-4 z-40"
        >
          <div className="relative">
            {/* Glow effect behind photo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -inset-2 bg-primary-500/30 rounded-2xl blur-lg"
            />

            {/* Photo thumbnail with polaroid style */}
            <motion.div
              className="relative w-28 h-32 bg-white rounded-xl shadow-2xl p-1.5 pb-4"
              initial={{ rotateZ: -5 }}
              animate={{ rotateZ: [0, 2, 0] }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full h-24 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={photoDataUrl}
                  alt={`Photo ${photoNumber}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Photo number at bottom */}
              <div className="absolute bottom-1 left-0 right-0 text-center">
                <span className="text-xs text-gray-500 font-medium">
                  Photo {photoNumber}
                </span>
              </div>
            </motion.div>

            {/* Checkmark badge */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
            >
              <motion.svg
                className="w-5 h-5 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </motion.svg>
            </motion.div>

            {/* Sparkle effects */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="absolute -top-3 -left-1 text-2xl"
            >
              ✨
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="absolute top-2 -right-3 text-xl"
            >
              ⭐
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Shutter animation component (camera aperture effect)
interface ShutterAnimationProps {
  isVisible: boolean;
}

export function ShutterAnimation({ isVisible }: ShutterAnimationProps) {
  const bladeCount = 8;
  const blades = Array.from({ length: bladeCount });

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          className="fixed inset-0 z-52 pointer-events-none flex items-center justify-center"
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {blades.map((_, index) => {
              const angle = (360 / bladeCount) * index;
              return (
                <motion.div
                  key={index}
                  initial={{
                    rotate: angle,
                    scaleY: 0,
                  }}
                  animate={{
                    rotate: angle,
                    scaleY: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 0.3,
                    times: [0, 0.2, 0.8, 1],
                    ease: "easeInOut",
                  }}
                  className="absolute w-2 bg-black/80 origin-bottom"
                  style={{
                    height: "50vh",
                    bottom: "50%",
                  }}
                />
              );
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
