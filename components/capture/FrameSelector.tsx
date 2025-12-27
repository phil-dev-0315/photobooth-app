"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { EventLayout } from "@/types";
import { Button } from "@/components/ui/Button";

interface FrameSelectorProps {
  layouts: EventLayout[];
  onSelect: (layout: EventLayout) => void;
  eventName?: string;
}

export function FrameSelector({ layouts, onSelect, eventName }: FrameSelectorProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentLayout = layouts[currentIndex];

  const paginate = (newDirection: number) => {
    const newIndex = currentIndex + newDirection;
    if (newIndex >= 0 && newIndex < layouts.length) {
      setDirection(newDirection);
      setCurrentIndex(newIndex);
    }
  };

  const handleDragEnd = (e: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold && currentIndex > 0) {
      paginate(-1);
    } else if (info.offset.x < -threshold && currentIndex < layouts.length - 1) {
      paginate(1);
    }
  };

  const handleSelect = () => {
    onSelect(currentLayout);
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
    }),
  };

  // Format layout type for display
  const formatLayoutType = (type: string) => {
    return type
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col"
    >
      {/* Header */}
      <div className="pt-safe-top px-6 py-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {eventName && (
            <p className="text-slate-400 text-sm mb-1">{eventName}</p>
          )}
          <h1 className="text-2xl font-bold text-white">Choose Your Frame</h1>
          <p className="text-slate-400 text-sm mt-1">
            Swipe to browse available frames
          </p>
        </motion.div>
      </div>

      {/* Carousel */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center px-6 overflow-hidden"
      >
        <div className="relative w-full max-w-sm aspect-[3/4]">
          {/* Navigation arrows */}
          <button
            onClick={() => paginate(-1)}
            disabled={currentIndex === 0}
            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-opacity ${
              currentIndex === 0 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-white/20"
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => paginate(1)}
            disabled={currentIndex === layouts.length - 1}
            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-opacity ${
              currentIndex === layouts.length - 1 ? "opacity-30 cursor-not-allowed" : "opacity-100 hover:bg-white/20"
            }`}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Frame preview */}
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={handleDragEnd}
              className="w-full h-full cursor-grab active:cursor-grabbing"
            >
              <div className="w-full h-full rounded-2xl overflow-hidden shadow-2xl bg-slate-800 border-2 border-white/10 flex items-center justify-center p-2">
                {currentLayout.frame_url ? (
                  <img
                    src={currentLayout.frame_url}
                    alt={currentLayout.layout_type}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    draggable={false}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg">
                    <div className="text-center text-slate-400">
                      <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm">No preview</p>
                    </div>
                  </div>
                )}

                {/* Photo count badge */}
                <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  <span className="text-white text-sm font-medium">
                    {currentLayout.placeholders?.length || 0} {(currentLayout.placeholders?.length || 0) === 1 ? 'photo' : 'photos'}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Frame info and select button */}
      <div className="px-6 pb-safe-bottom pb-6">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-4"
        >
          <h2 className="text-xl font-semibold text-white mb-1">
            {formatLayoutType(currentLayout.layout_type)}
          </h2>
          <p className="text-slate-400 text-sm">
            {currentLayout.placeholders?.length || 0} photo{(currentLayout.placeholders?.length || 0) !== 1 ? 's' : ''} will be captured
          </p>
        </motion.div>

        {/* Pagination dots */}
        {layouts.length > 1 && (
          <div className="flex justify-center gap-2 mb-6">
            {layouts.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "w-6 bg-white"
                    : "bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        )}

        {/* Select button */}
        <Button
          onClick={handleSelect}
          size="lg"
          className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 text-lg font-semibold rounded-xl shadow-lg shadow-primary-500/25"
        >
          <span className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Select This Frame
          </span>
        </Button>
      </div>
    </motion.div>
  );
}
