"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CapturedPhoto, CropMetadata } from "@/types";
import { PhotoCropEditor } from "./PhotoCropEditor";

interface PhotoGridProps {
  photos: CapturedPhoto[];
  maxPhotos?: number;
  onPhotoCropUpdate?: (photoId: string, cropMetadata: CropMetadata) => void;
  placeholderAspectRatio?: number;
}

export function PhotoGrid({
  photos,
  maxPhotos = 3,
  onPhotoCropUpdate,
  placeholderAspectRatio = 4 / 3,
}: PhotoGridProps) {
  const [editingPhotoIndex, setEditingPhotoIndex] = useState<number | null>(null);

  // Create placeholder array for empty slots
  const slots = Array.from({ length: maxPhotos }, (_, i) => photos[i] || null);

  const handlePhotoClick = (index: number) => {
    if (photos[index] && onPhotoCropUpdate) {
      setEditingPhotoIndex(index);
    }
  };

  const handleCropSave = (cropMetadata: CropMetadata) => {
    if (editingPhotoIndex !== null && photos[editingPhotoIndex] && onPhotoCropUpdate) {
      onPhotoCropUpdate(photos[editingPhotoIndex].id, cropMetadata);
    }
  };

  const editingPhoto = editingPhotoIndex !== null ? photos[editingPhotoIndex] : null;

  return (
    <>
      <div className="w-full max-w-md mx-auto">
        <div className="flex flex-col gap-4">
          {slots.map((photo, index) => (
            <motion.div
              key={photo?.id || `empty-${index}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.4 }}
              className={`relative rounded-2xl overflow-hidden shadow-xl ${
                photo && onPhotoCropUpdate ? 'cursor-pointer' : ''
              }`}
              style={{ aspectRatio: placeholderAspectRatio }}
              onClick={() => handlePhotoClick(index)}
            >
              {photo ? (
                <>
                  {/* Photo with crop preview - matches compositor logic */}
                  <div className="w-full h-full overflow-hidden">
                    <img
                      src={photo.dataUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                      style={photo.cropMetadata ? (() => {
                        const zoom = photo.cropMetadata.zoom;
                        const maxOffsetPercent = 50 * (zoom - 1) / zoom;
                        // Negative: drag right = image moves left = see right side
                        const translateX = -photo.cropMetadata.offsetX * maxOffsetPercent;
                        const translateY = -photo.cropMetadata.offsetY * maxOffsetPercent;
                        return {
                          transform: `scale(${zoom}) translate(${translateX}%, ${translateY}%)`,
                          transformOrigin: 'center center',
                        };
                      })() : undefined}
                    />
                  </div>

                  {/* Photo number overlay */}
                  <div className="absolute top-3 left-3 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-gray-900 font-bold text-sm">
                      {index + 1}
                    </span>
                  </div>

                  {/* Tap to adjust indicator */}
                  {onPhotoCropUpdate && (
                    <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full flex items-center gap-1.5 shadow-lg">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                        />
                      </svg>
                      <span className="text-white text-xs font-medium">
                        {photo.cropMetadata ? 'Adjusted' : 'Tap to adjust'}
                      </span>
                    </div>
                  )}

                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
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
          ))}
        </div>
      </div>

      {/* Crop Editor Modal */}
      {editingPhoto && (
        <PhotoCropEditor
          photo={editingPhoto}
          photoIndex={editingPhotoIndex!}
          placeholderAspectRatio={placeholderAspectRatio}
          isOpen={editingPhotoIndex !== null}
          onClose={() => setEditingPhotoIndex(null)}
          onSave={handleCropSave}
        />
      )}
    </>
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
