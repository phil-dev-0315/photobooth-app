"use client";

import { useState, useRef, useEffect } from "react";
import type { Sticker } from "@/types";
import { getEventStickers, deleteSticker } from "@/lib/events";

interface StickerUploaderProps {
  eventId: string;
  onUploadComplete?: () => void;
}

export default function StickerUploader({
  eventId,
  onUploadComplete,
}: StickerUploaderProps) {
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [stickerName, setStickerName] = useState("");
  const [stickerCategory, setStickerCategory] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load existing stickers
  useEffect(() => {
    loadStickers();
  }, [eventId]);

  const loadStickers = async () => {
    try {
      setLoading(true);
      const data = await getEventStickers(eventId);
      setStickers(data);
    } catch (error) {
      console.error("Failed to load stickers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    const file = files[0];

    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    // Max 5MB for stickers
    if (file.size > 5 * 1024 * 1024) {
      alert("Sticker file size must be less than 5MB");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(30);

      // Upload via API route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("eventId", eventId);
      formData.append("name", stickerName || file.name.replace(/\.[^/.]+$/, ""));
      if (stickerCategory) {
        formData.append("category", stickerCategory);
      }

      const response = await fetch("/api/stickers", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to upload sticker");
      }

      setUploadProgress(100);
      setStickerName("");
      setStickerCategory("");
      await loadStickers();
      onUploadComplete?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload sticker: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (sticker: Sticker) => {
    if (!confirm(`Are you sure you want to delete "${sticker.name}"?`)) {
      return;
    }

    try {
      await deleteSticker(sticker.id);
      await loadStickers();
      onUploadComplete?.();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`Failed to delete sticker: ${error.message}`);
    }
  };

  // Get unique categories from stickers
  const categories = Array.from(new Set(stickers.map(s => s.category).filter(Boolean)));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stickers</h3>

        {/* Optional name and category inputs */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sticker Name (optional)
            </label>
            <input
              type="text"
              value={stickerName}
              onChange={(e) => setStickerName(e.target.value)}
              placeholder="e.g., Heart, Star, Crown"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category (optional)
            </label>
            <input
              type="text"
              value={stickerCategory}
              onChange={(e) => setStickerCategory(e.target.value)}
              placeholder="e.g., Decorations, Emojis"
              list="sticker-categories"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            {categories.length > 0 && (
              <datalist id="sticker-categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat || ""} />
                ))}
              </datalist>
            )}
          </div>
        </div>

        {/* Drop zone */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive
              ? "border-purple-500 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          } ${uploading ? "opacity-50 pointer-events-none" : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
          />

          <div className="space-y-4">
            <div className="flex justify-center">
              <svg
                className="w-12 h-12 text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            {uploading ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading sticker...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-600">
                    Drag and drop sticker images here, or
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm text-purple-600 hover:text-purple-500 font-medium"
                  >
                    Browse files
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  PNG with transparency recommended. Max 5MB.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Existing stickers */}
      {loading ? (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading stickers...</p>
        </div>
      ) : stickers.length > 0 ? (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded Stickers ({stickers.length})
          </h4>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {stickers.map((sticker) => (
              <div
                key={sticker.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-gray-50"
              >
                <div className="aspect-square flex items-center justify-center p-2">
                  <img
                    src={sticker.url}
                    alt={sticker.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => handleDelete(sticker)}
                  className="absolute top-1 right-1 bg-red-600 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Delete"
                >
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
                <div className="px-2 py-1.5 bg-white border-t border-gray-200">
                  <p className="text-xs font-medium text-gray-700 truncate" title={sticker.name}>
                    {sticker.name}
                  </p>
                  {sticker.category && (
                    <p className="text-xs text-gray-500 truncate">{sticker.category}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 border border-dashed border-gray-300 rounded-lg">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-sm text-gray-500">No stickers uploaded yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Upload PNG images with transparency for best results
          </p>
        </div>
      )}
    </div>
  );
}
