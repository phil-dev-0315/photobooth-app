"use client";

import { useState, useRef } from "react";
import PlaceholderEditor from "./PlaceholderEditor";
import type { PhotoPlaceholder, EventLayout } from "@/types";

interface FrameUploaderProps {
  eventId: string;
  photosPerSession: number;
  existingLayouts: EventLayout[];
  onUploadComplete: () => void;
  isPremiumFrameEnabled?: boolean;
}

type UploadStep = "select" | "configure" | "uploading";

export default function FrameUploader({
  eventId,
  photosPerSession,
  existingLayouts,
  onUploadComplete,
  isPremiumFrameEnabled = false,
}: FrameUploaderProps) {
  const [step, setStep] = useState<UploadStep>("select");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1920);
  const [placeholders, setPlaceholders] = useState<PhotoPlaceholder[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setSelectedFile(file);

    // Create preview URL and get image dimensions
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);

      // Get actual image dimensions
      const img = new Image();
      img.onload = () => {
        setWidth(img.naturalWidth);
        setHeight(img.naturalHeight);
        setStep("configure");
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile || placeholders.length === 0) {
      alert("Please add at least one placeholder for photos");
      return;
    }

    setUploading(true);
    setStep("uploading");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("bucket", "frames");
      formData.append("eventId", eventId);
      formData.append("assetType", "frame");
      formData.append("width", width.toString());
      formData.append("height", height.toString());
      formData.append("placeholders", JSON.stringify(placeholders));

      const response = await fetch("/api/upload-asset", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to upload frame");
      }

      // Reset state
      setSelectedFile(null);
      setPreviewUrl("");
      setPlaceholders([]);
      setStep("select");
      onUploadComplete();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload frame: ${error.message}`);
      setStep("configure");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setPlaceholders([]);
    setStep("select");
  };

  const handleDelete = async (layout: EventLayout) => {
    if (!confirm("Are you sure you want to delete this frame?")) return;

    try {
      const url = new URL(layout.frame_url || "");
      const pathParts = url.pathname.split("/");
      const path = pathParts.slice(pathParts.indexOf("frames") + 1).join("/");

      const response = await fetch(
        `/api/delete-asset?layoutId=${layout.id}&bucket=frames&path=${encodeURIComponent(path)}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || "Failed to delete frame");
      }

      onUploadComplete();
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`Failed to delete frame: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Frames/Backgrounds</h3>

      {step === "select" && (
        <>
          {/* Upload Area */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
              dragActive
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
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
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-600">Drag and drop your frame image here, or</p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  Browse files
                </button>
              </div>
              <p className="text-xs text-gray-500">PNG with transparency recommended. Any size.</p>
            </div>
          </div>

          {/* Existing Frames */}
          {existingLayouts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Frames</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingLayouts.map((layout) => (
                  <div
                    key={layout.id}
                    className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
                      <img
                        src={layout.frame_url || ""}
                        alt="Frame"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <button
                      onClick={() => handleDelete(layout)}
                      className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <div className="absolute bottom-2 left-2 space-y-1">
                      <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                        {layout.width}x{layout.height}
                      </div>
                      <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                        {layout.placeholders?.length || 0} slots
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {step === "configure" && previewUrl && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-1">Configure Photo Placeholders</h4>
            <p className="text-xs text-blue-700">
              Define where photos will be placed on this frame. Draw rectangles or use Auto-Generate.
            </p>
          </div>

          {/* Dimension Override */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 1080)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Output Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 1920)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Placeholder Editor */}
          <PlaceholderEditor
            frameUrl={previewUrl}
            width={width}
            height={height}
            placeholders={placeholders}
            onChange={setPlaceholders}
            photosPerSession={photosPerSession}
            eventId={eventId}
            isPremiumFrameEnabled={isPremiumFrameEnabled}
          />

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={placeholders.length === 0 || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading..." : "Save Frame"}
            </button>
          </div>
        </div>
      )}

      {step === "uploading" && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Uploading frame...</p>
        </div>
      )}
    </div>
  );
}
