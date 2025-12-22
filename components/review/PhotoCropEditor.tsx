"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CapturedPhoto, CropMetadata } from "@/types";

interface PhotoCropEditorProps {
  photo: CapturedPhoto;
  photoIndex: number;
  placeholderAspectRatio?: number; // Target aspect ratio (width/height)
  isOpen: boolean;
  onClose: () => void;
  onSave: (cropMetadata: CropMetadata) => void;
}

// Default crop metadata (centered, no zoom)
const DEFAULT_CROP: CropMetadata = {
  offsetX: 0,
  offsetY: 0,
  zoom: 1,
};

export function PhotoCropEditor({
  photo,
  photoIndex,
  placeholderAspectRatio = 4 / 3, // Default to 4:3
  isOpen,
  onClose,
  onSave,
}: PhotoCropEditorProps) {
  // Initialize from existing crop or defaults
  const [crop, setCrop] = useState<CropMetadata>(
    photo.cropMetadata || DEFAULT_CROP
  );

  // Touch/drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(1);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset crop when photo changes
  useEffect(() => {
    setCrop(photo.cropMetadata || DEFAULT_CROP);
  }, [photo.id, photo.cropMetadata]);

  // Prevent browser gestures when modal is open
  useEffect(() => {
    if (!isOpen) return;

    // Prevent default touch behaviors on the entire document when editor is open
    const preventDefaultTouch = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent zoom on double-tap
    const preventDoubleTapZoom = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
      }
    };

    document.addEventListener('touchmove', preventDefaultTouch, { passive: false });
    document.addEventListener('gesturestart', preventDefaultTouch as any, { passive: false });
    document.addEventListener('gesturechange', preventDefaultTouch as any, { passive: false });
    document.addEventListener('gestureend', preventDefaultTouch as any, { passive: false });

    return () => {
      document.removeEventListener('touchmove', preventDefaultTouch);
      document.removeEventListener('gesturestart', preventDefaultTouch as any);
      document.removeEventListener('gesturechange', preventDefaultTouch as any);
      document.removeEventListener('gestureend', preventDefaultTouch as any);
    };
  }, [isOpen]);

  // Handle mouse/touch drag start
  const handleDragStart = useCallback((clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  }, []);

  // Handle mouse/touch drag move - FAST response
  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    if (!isDragging || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const deltaX = (clientX - dragStart.x) / containerRect.width;
    const deltaY = (clientY - dragStart.y) / containerRect.height;

    // Much higher sensitivity for fast, responsive dragging
    const sensitivity = 8;

    setCrop((prev) => ({
      ...prev,
      offsetX: Math.max(-1, Math.min(1, prev.offsetX + deltaX * sensitivity)),
      offsetY: Math.max(-1, Math.min(1, prev.offsetY + deltaY * sensitivity)),
    }));

    setDragStart({ x: clientX, y: clientY });
  }, [isDragging, dragStart]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setInitialPinchDistance(null);
  }, []);

  // Calculate pinch distance
  const getPinchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleDragMove(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent browser zoom/scroll
    if (e.touches.length === 1) {
      handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      // Start pinch zoom
      setIsDragging(false); // Stop dragging when pinching
      const distance = getPinchDistance(e.touches);
      setInitialPinchDistance(distance);
      setInitialZoom(crop.zoom);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent browser zoom/scroll

    if (e.touches.length === 1 && !initialPinchDistance) {
      handleDragMove(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && initialPinchDistance) {
      // Handle pinch zoom
      const currentDistance = getPinchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.max(1, Math.min(3, initialZoom * scale));

      setCrop((prev) => ({
        ...prev,
        zoom: newZoom,
      }));
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleDragEnd();
  };

  // Wheel zoom (desktop)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setCrop((prev) => ({
      ...prev,
      zoom: Math.max(1, Math.min(3, prev.zoom + delta)),
    }));
  };

  // Reset to center
  const handleReset = () => {
    setCrop(DEFAULT_CROP);
  };

  // Save and close
  const handleSave = () => {
    onSave(crop);
    onClose();
  };

  // Calculate image transform based on crop metadata
  // This must match the compositor's getCropParams logic exactly
  const getImageStyle = (): React.CSSProperties => {
    // At zoom 1, the image exactly fills the frame - no panning possible
    // At higher zooms, panning becomes possible
    // maxOffset formula matches compositor: (zoom-1)/(2*zoom) * 100%
    const maxOffsetPercent = 50 * (crop.zoom - 1) / crop.zoom;

    // "Scroll" behavior: drag right = see more of RIGHT side
    // Positive offset = user dragged right = image moves LEFT (reveals right side)
    // CSS translate negative = image moves left
    const translateX = -crop.offsetX * maxOffsetPercent;
    const translateY = -crop.offsetY * maxOffsetPercent;

    return {
      transform: `scale(${crop.zoom}) translate(${translateX}%, ${translateY}%)`,
      transformOrigin: 'center center',
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black flex flex-col"
          style={{ touchAction: 'none' }} // Prevent browser zoom/scroll gestures
        >
          {/* Header */}
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <div className="text-white font-medium">
              Adjust Photo {photoIndex + 1}
            </div>
            <button
              onClick={handleSave}
              className="text-blue-400 hover:text-blue-300 font-medium px-3 py-2 rounded-lg transition-colors"
            >
              Done
            </button>
          </div>

          {/* Instructions */}
          <div className="flex-shrink-0 px-4 py-2 bg-black/60 text-center">
            <p className="text-white/60 text-sm">
              Pinch to zoom, drag to position
            </p>
          </div>

          {/* Crop Area */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden flex items-center justify-center"
            style={{ touchAction: 'none' }} // Prevent all browser touch gestures
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Crop viewport with aspect ratio */}
            <div
              className="relative overflow-hidden rounded-lg shadow-2xl"
              style={{
                width: '85%',
                aspectRatio: placeholderAspectRatio,
                maxHeight: '70vh',
              }}
            >
              {/* The image to crop */}
              <img
                ref={imageRef}
                src={photo.dataUrl}
                alt={`Photo ${photoIndex + 1}`}
                className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                style={getImageStyle()}
                draggable={false}
              />

              {/* Crop grid overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {/* Rule of thirds grid */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {[...Array(9)].map((_, i) => (
                    <div
                      key={i}
                      className="border border-white/20"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Dark overlay outside crop area */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/50" style={{
                clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 0, 7.5% 15%, 7.5% 85%, 92.5% 85%, 92.5% 15%, 7.5% 15%)',
              }} />
            </div>
          </div>

          {/* Controls */}
          <div className="flex-shrink-0 px-4 py-4 bg-black/80 backdrop-blur-sm border-t border-white/10">
            {/* Zoom slider */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-white/60 text-sm w-12">Zoom</span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={crop.zoom}
                onChange={(e) => setCrop((prev) => ({ ...prev, zoom: parseFloat(e.target.value) }))}
                className="flex-1 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white
                  [&::-webkit-slider-thumb]:shadow-lg"
              />
              <span className="text-white/80 text-sm w-12 text-right">
                {Math.round(crop.zoom * 100)}%
              </span>
            </div>

            {/* Reset button */}
            <button
              onClick={handleReset}
              className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
            >
              Reset to Center
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
