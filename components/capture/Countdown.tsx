"use client";

import { motion, AnimatePresence } from "framer-motion";

interface CountdownProps {
  seconds: number;
  isVisible: boolean;
  totalPhotos?: number;
  currentPhoto?: number;
}

export function Countdown({
  seconds,
  isVisible,
  totalPhotos = 3,
  currentPhoto = 1,
}: CountdownProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {/* Photo counter */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-8"
          >
            <span className="text-white/80 text-xl font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm">
              Photo {currentPhoto} of {totalPhotos}
            </span>
          </motion.div>

          {/* Main countdown number */}
          <AnimatePresence mode="wait">
            <motion.div
              key={seconds}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{
                scale: [0.5, 1.2, 1],
                opacity: [0, 1, 1],
              }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{
                duration: 0.5,
                times: [0, 0.6, 1],
                ease: "easeOut",
              }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 bg-primary-500/30 rounded-full blur-3xl" />
              </div>

              {/* Number */}
              <span className="relative text-9xl font-bold text-white drop-shadow-2xl tabular-nums">
                {seconds}
              </span>
            </motion.div>
          </AnimatePresence>

          {/* Pulse ring animation */}
          <motion.div
            key={`ring-${seconds}`}
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="absolute w-32 h-32 border-4 border-white rounded-full"
          />

          {/* "Get ready" text */}
          {seconds > 3 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-8 text-white/70 text-lg"
            >
              Get ready...
            </motion.p>
          )}

          {/* "Smile!" text for last few seconds */}
          {seconds <= 3 && seconds > 0 && (
            <motion.p
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 text-white text-2xl font-semibold"
            >
              Smile!
            </motion.p>
          )}
        </div>
      )}
    </AnimatePresence>
  );
}
