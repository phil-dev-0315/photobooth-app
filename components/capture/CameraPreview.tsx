"use client";

import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraPreviewProps {
  isReady: boolean;
  isMirrored?: boolean;
  className?: string;
}

export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  ({ isReady, isMirrored = true, className = "" }, ref) => {
    return (
      <div className={`absolute inset-0 w-full h-full overflow-hidden bg-black ${className}`}>
        {/* Video element - ensure it fills the container */}
        <video
          ref={ref}
          autoPlay
          playsInline
          muted
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transform: isMirrored ? 'scaleX(-1)' : 'none',
          }}
        />

        {/* Loading state overlay */}
        <AnimatePresence>
          {!isReady && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 flex items-center justify-center bg-gray-900 z-10"
            >
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white text-lg">Starting camera...</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera frame guide - subtle corners */}
        {isReady && (
          <div className="absolute inset-8 pointer-events-none z-20">
            {/* Top left corner */}
            <div className="absolute top-0 left-0 w-12 h-12 border-l-4 border-t-4 border-white/30 rounded-tl-lg" />
            {/* Top right corner */}
            <div className="absolute top-0 right-0 w-12 h-12 border-r-4 border-t-4 border-white/30 rounded-tr-lg" />
            {/* Bottom left corner */}
            <div className="absolute bottom-0 left-0 w-12 h-12 border-l-4 border-b-4 border-white/30 rounded-bl-lg" />
            {/* Bottom right corner */}
            <div className="absolute bottom-0 right-0 w-12 h-12 border-r-4 border-b-4 border-white/30 rounded-br-lg" />
          </div>
        )}
      </div>
    );
  }
);

CameraPreview.displayName = "CameraPreview";
