"use client";

import { forwardRef, useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CameraPreviewProps {
  isReady: boolean;
  isMirrored?: boolean;
  placeholderAspectRatio?: number; // width / height of the placeholder
  padding?: number; // percentage padding (e.g., 0.05 for 5%)
  className?: string;
}

export const CameraPreview = forwardRef<HTMLVideoElement, CameraPreviewProps>(
  ({ isReady, isMirrored = true, placeholderAspectRatio, padding = 0.05, className = "" }, ref) => {
    const bgVideoRef = useRef<HTMLVideoElement>(null);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // Calculate preview dimensions based on aspect ratio
    useEffect(() => {
      const updateDimensions = () => {
        if (!placeholderAspectRatio) {
          setDimensions({ width: 0, height: 0 });
          return;
        }

        const availableWidth = window.innerWidth * (1 - padding * 2);
        const availableHeight = window.innerHeight * (1 - padding * 2);

        let width, height;

        if (availableWidth / availableHeight > placeholderAspectRatio) {
          // Height constrained
          height = availableHeight;
          width = height * placeholderAspectRatio;
        } else {
          // Width constrained
          width = availableWidth;
          height = width / placeholderAspectRatio;
        }

        setDimensions({ width, height });
      };

      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }, [placeholderAspectRatio, padding]);

    // Copy stream from main video to background video
    useEffect(() => {
      if (isReady && ref && "current" in ref && ref.current && bgVideoRef.current) {
        bgVideoRef.current.srcObject = ref.current.srcObject;
      }
    }, [isReady, ref]);

    const mirrorTransform = isMirrored ? "scaleX(-1)" : "none";
    const useFittedPreview = placeholderAspectRatio && dimensions.width > 0;

    return (
      <div className={`absolute inset-0 w-full h-full overflow-hidden bg-black ${className}`}>
        {/* Blurred background video - only shown in fitted mode */}
        {useFittedPreview && (
          <video
            ref={bgVideoRef}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `${mirrorTransform} scale(1.1)`,
              filter: "blur(20px)",
              opacity: 0.7,
            }}
          />
        )}

        {/* Main video container - ALWAYS rendered, styling changes based on mode */}
        <div
          className={useFittedPreview
            ? "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-lg shadow-2xl"
            : "absolute inset-0"
          }
          style={useFittedPreview ? {
            width: dimensions.width,
            height: dimensions.height,
          } : undefined}
        >
          {/* Main preview video - ALWAYS the same element */}
          <video
            ref={ref}
            autoPlay
            playsInline
            muted
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: mirrorTransform,
            }}
          />

          {/* Corner frame guides */}
          {isReady && (
            <div className={useFittedPreview ? "absolute inset-4 pointer-events-none z-20" : "absolute inset-8 pointer-events-none z-20"}>
              {/* Top left corner */}
              <div className={`absolute top-0 left-0 ${useFittedPreview ? "w-10 h-10" : "w-12 h-12"} border-l-4 border-t-4 ${useFittedPreview ? "border-white/40" : "border-white/30"} rounded-tl-lg`} />
              {/* Top right corner */}
              <div className={`absolute top-0 right-0 ${useFittedPreview ? "w-10 h-10" : "w-12 h-12"} border-r-4 border-t-4 ${useFittedPreview ? "border-white/40" : "border-white/30"} rounded-tr-lg`} />
              {/* Bottom left corner */}
              <div className={`absolute bottom-0 left-0 ${useFittedPreview ? "w-10 h-10" : "w-12 h-12"} border-l-4 border-b-4 ${useFittedPreview ? "border-white/40" : "border-white/30"} rounded-bl-lg`} />
              {/* Bottom right corner */}
              <div className={`absolute bottom-0 right-0 ${useFittedPreview ? "w-10 h-10" : "w-12 h-12"} border-r-4 border-b-4 ${useFittedPreview ? "border-white/40" : "border-white/30"} rounded-br-lg`} />
            </div>
          )}
        </div>

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
      </div>
    );
  }
);

CameraPreview.displayName = "CameraPreview";
