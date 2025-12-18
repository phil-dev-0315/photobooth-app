"use client";

import { motion } from "framer-motion";
import { CapturedPhoto } from "@/types";

interface PhotoGridProps {
  photos: CapturedPhoto[];
  maxPhotos?: number;
  getDisplayUrl?: (photo: CapturedPhoto) => string;
  isProcessing?: boolean;
  getProcessingStatus?: (photoId: string) => 'pending' | 'processing' | 'done' | null;
}

export function PhotoGrid({
  photos,
  maxPhotos = 3,
  getDisplayUrl,
  isProcessing = false,
  getProcessingStatus,
}: PhotoGridProps) {
  // Create placeholder array for empty slots
  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] || null);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex flex-col gap-4">
        {slots.map((photo, index) => {
          const displayUrl = photo && getDisplayUrl ? getDisplayUrl(photo) : photo?.dataUrl;
          const status = photo && getProcessingStatus ? getProcessingStatus(photo.id) : null;

          return (
            <motion.div
              key={photo?.id || `empty-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
              className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl"
            >
              {photo ? (
                <>
                  {/* Photo */}
                  <img
                    src={displayUrl}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />

                  {/* Photo number overlay */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-gray-900 font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>

                  {/* Processing overlay */}
                  {isProcessing && status !== 'done' && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center text-white">
                        {status === 'processing' ? (
                          <>
                            <div className="w-10 h-10 border-3 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                            <p className="text-sm font-medium">Processing...</p>
                          </>
                        ) : (
                          <>
                            <div className="w-10 h-10 border-3 border-white/30 rounded-full flex items-center justify-center mx-auto mb-2">
                              <span className="text-white/70 text-xs">Wait</span>
                            </div>
                            <p className="text-sm text-white/70">Queued</p>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Done indicator */}
                  {isProcessing && status === 'done' && (
                    <div className="absolute top-3 right-3 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
                </>
              ) : (
                // Empty placeholder
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
                      <span className="text-gray-400 font-bold text-lg">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm">Not captured yet</p>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// Single photo card for larger display
interface PhotoCardProps {
  photo: CapturedPhoto;
  index: number;
  onClick?: () => void;
}

export function PhotoCard({ photo, index, onClick }: PhotoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl cursor-pointer group"
    >
      <img
        src={photo.dataUrl}
        alt={`Photo ${index + 1}`}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Overlay on hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

      {/* Photo number */}
      <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
        <span className="text-gray-900 font-bold text-sm">{index + 1}</span>
      </div>
    </motion.div>
  );
}

// Horizontal strip preview (for showing what the final will look like)
interface PhotoStripPreviewProps {
  photos: CapturedPhoto[];
}

export function PhotoStripPreview({ photos }: PhotoStripPreviewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xs mx-auto"
    >
      <div className="bg-white p-3 rounded-xl shadow-2xl">
        <div className="flex flex-col gap-2">
          {photos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="aspect-[4/3] rounded-lg overflow-hidden"
            >
              <img
                src={photo.dataUrl}
                alt={`Photo ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Branding area placeholder */}
        <div className="mt-3 py-2 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-400 text-xs">Your Event</p>
        </div>
      </div>
    </motion.div>
  );
}
