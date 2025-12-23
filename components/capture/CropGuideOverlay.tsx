"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface CropGuideOverlayProps {
  placeholderAspectRatio: number; // width / height of the placeholder
  isVisible: boolean;
}

export function CropGuideOverlay({ placeholderAspectRatio, isVisible }: CropGuideOverlayProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate safe zone dimensions based on screen size and aspect ratio
  useEffect(() => {
    const updateDimensions = () => {
      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;
      const padding = 0.15; // 15% padding on each side

      const availableWidth = screenWidth * (1 - padding * 2);
      const availableHeight = screenHeight * (1 - padding * 2);

      let width, height;

      // Calculate dimensions that fit within available space while maintaining aspect ratio
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
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, [placeholderAspectRatio]);

  if (!isVisible || dimensions.width === 0) return null;

  const { width, height } = dimensions;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
      {/* Dark overlay areas - top, bottom, left, right */}
      {/* Top overlay */}
      <div
        className="absolute left-0 right-0 top-0 bg-black/50"
        style={{ height: `calc(50% - ${height / 2}px)` }}
      />
      {/* Bottom overlay */}
      <div
        className="absolute left-0 right-0 bottom-0 bg-black/50"
        style={{ height: `calc(50% - ${height / 2}px)` }}
      />
      {/* Left overlay */}
      <div
        className="absolute left-0 bg-black/50"
        style={{
          top: `calc(50% - ${height / 2}px)`,
          width: `calc(50% - ${width / 2}px)`,
          height: height,
        }}
      />
      {/* Right overlay */}
      <div
        className="absolute right-0 bg-black/50"
        style={{
          top: `calc(50% - ${height / 2}px)`,
          width: `calc(50% - ${width / 2}px)`,
          height: height,
        }}
      />

      {/* Safe zone frame */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-white/80 rounded-lg"
        style={{ width, height }}
      >
        {/* Corner markers */}
        <div className="absolute -top-0.5 -left-0.5 w-8 h-8 border-l-4 border-t-4 border-white rounded-tl-lg" />
        <div className="absolute -top-0.5 -right-0.5 w-8 h-8 border-r-4 border-t-4 border-white rounded-tr-lg" />
        <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8 border-l-4 border-b-4 border-white rounded-bl-lg" />
        <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8 border-r-4 border-b-4 border-white rounded-br-lg" />

        {/* Center crosshair (subtle) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -translate-y-1/2" />
        </div>
      </div>

      {/* Helpful text */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-20 left-0 right-0 text-center"
      >
        <p className="text-white/90 text-sm font-medium bg-black/60 backdrop-blur-sm inline-block px-4 py-2 rounded-full">
          Stay inside the frame
        </p>
      </motion.div>
    </div>
  );
}
