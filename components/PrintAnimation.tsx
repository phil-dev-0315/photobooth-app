"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode } from 'react';

interface PrintAnimationProps {
  children: ReactNode;
  isAnimating: boolean;
  onAnimationComplete: () => void;
}

export default function PrintAnimation({
  children,
  isAnimating,
  onAnimationComplete,
}: PrintAnimationProps) {
  return (
    <div className="relative overflow-hidden">
      {/* Printer slot visual (top edge) */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-gray-800 to-gray-600 z-10 rounded-t-lg shadow-inner"
          />
        )}
      </AnimatePresence>

      {/* Animated content */}
      <motion.div
        animate={isAnimating ? {
          y: '120%',
          opacity: [1, 1, 0.8],
        } : {
          y: 0,
          opacity: 1,
        }}
        transition={{
          duration: 1.5,
          ease: [0.4, 0, 0.2, 1], // Custom easing for realistic feel
        }}
        onAnimationComplete={() => {
          if (isAnimating) {
            onAnimationComplete();
          }
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

// Alternative: Standalone print trigger with full-screen overlay
interface PrintOverlayProps {
  isVisible: boolean;
  compositeUrl: string;
  onComplete: () => void;
}

export function PrintOverlay({
  isVisible,
  compositeUrl,
  onComplete,
}: PrintOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-gray-900 flex items-start justify-center pt-8 overflow-hidden"
        >
          {/* Printer slot at top */}
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-gray-950 to-gray-800 shadow-lg" />

          {/* Animated photo strip */}
          <motion.div
            initial={{ y: '-100%' }}
            animate={{ y: '120vh' }}
            transition={{
              duration: 2,
              ease: [0.4, 0, 0.2, 1],
              delay: 0.3,
            }}
            onAnimationComplete={onComplete}
            className="relative"
          >
            {/* Photo strip with shadow for depth */}
            <div className="relative shadow-2xl">
              <img
                src={compositeUrl}
                alt="Photo strip"
                className="max-w-[300px] rounded-lg"
              />
              {/* Paper texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-lg" />
            </div>
          </motion.div>

          {/* Printing text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="absolute bottom-20 left-0 right-0 text-center"
          >
            <p className="text-white text-lg font-medium">Printing...</p>
            <div className="flex justify-center gap-1 mt-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-white rounded-full"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
