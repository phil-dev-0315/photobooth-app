"use client";

import { motion } from "framer-motion";

interface CaptureButtonProps {
  onClick: () => void;
  disabled?: boolean;
  isCapturing?: boolean;
}

export function CaptureButton({
  onClick,
  disabled = false,
  isCapturing = false,
}: CaptureButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || isCapturing}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative w-20 h-20 rounded-full
        bg-white shadow-lg
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-primary-500/50
        transition-all duration-200
      `}
    >
      {/* Outer ring */}
      <span className="absolute inset-0 rounded-full border-4 border-white/80" />

      {/* Inner circle */}
      <motion.span
        animate={isCapturing ? { scale: 0.6 } : { scale: 1 }}
        className={`
          absolute inset-2 rounded-full
          ${isCapturing ? "bg-red-500" : "bg-white"}
          transition-colors duration-200
        `}
      />

      {/* Capturing indicator */}
      {isCapturing && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 0.8 }}
          className="absolute inset-0 rounded-full border-4 border-red-500"
        />
      )}
    </motion.button>
  );
}

// Alternative: Start Session button (larger, with text)
interface StartSessionButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export function StartSessionButton({
  onClick,
  disabled = false,
}: StartSessionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.95 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative px-12 py-6 rounded-full
        bg-gradient-to-r from-primary-500 to-primary-600
        text-white text-xl font-bold
        shadow-2xl shadow-primary-500/40
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-4 focus:ring-primary-500/50
        transition-all duration-200
      `}
    >
      {/* Animated gradient border */}
      <motion.span
        animate={{
          background: [
            "linear-gradient(0deg, rgba(168,85,247,0.4), rgba(147,51,234,0.4))",
            "linear-gradient(180deg, rgba(168,85,247,0.4), rgba(147,51,234,0.4))",
            "linear-gradient(360deg, rgba(168,85,247,0.4), rgba(147,51,234,0.4))",
          ],
        }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute inset-0 rounded-full -z-10 blur-xl"
      />

      <span className="flex items-center gap-3">
        {/* Camera icon */}
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
        Start Session
      </span>
    </motion.button>
  );
}
