"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Fun pose suggestions for guests
const POSE_PROMPTS = [
  { text: "Strike a silly pose!", emoji: "🤪" },
  { text: "Show your best smile!", emoji: "😁" },
  { text: "Make a funny face!", emoji: "😜" },
  { text: "Do a peace sign!", emoji: "✌️" },
  { text: "Give a thumbs up!", emoji: "👍" },
  { text: "Act surprised!", emoji: "😲" },
  { text: "Be a superstar!", emoji: "⭐" },
  { text: "Strike a model pose!", emoji: "💃" },
  { text: "Show some love!", emoji: "❤️" },
  { text: "Get crazy!", emoji: "🎉" },
  { text: "Duck face time!", emoji: "🦆" },
  { text: "Be yourself!", emoji: "🙌" },
  { text: "Group hug!", emoji: "🤗" },
  { text: "Jump for joy!", emoji: "🦘" },
  { text: "Look mysterious!", emoji: "🕵️" },
];

interface PosePromptProps {
  isVisible: boolean;
  photoNumber: number;
}

export function PosePrompt({ isVisible, photoNumber }: PosePromptProps) {
  const [currentPrompt, setCurrentPrompt] = useState(POSE_PROMPTS[0]);

  // Select a random prompt when becoming visible
  useEffect(() => {
    if (isVisible) {
      const randomIndex = Math.floor(Math.random() * POSE_PROMPTS.length);
      setCurrentPrompt(POSE_PROMPTS[randomIndex]);
    }
  }, [isVisible, photoNumber]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: -20 }}
          transition={{ type: "spring", damping: 15, stiffness: 300 }}
          className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none"
        >
          <motion.div
            className="bg-black/70 backdrop-blur-md rounded-3xl px-8 py-6 text-center max-w-xs mx-4"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            {/* Emoji */}
            <motion.div
              className="text-6xl mb-3"
              animate={{
                rotate: [-5, 5, -5],
                scale: [1, 1.1, 1],
              }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              {currentPrompt.emoji}
            </motion.div>

            {/* Text prompt */}
            <motion.p
              className="text-white text-2xl font-bold"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentPrompt.text}
            </motion.p>

            {/* Next photo indicator */}
            <motion.p
              className="text-white/60 text-sm mt-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Photo {photoNumber} coming up...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
