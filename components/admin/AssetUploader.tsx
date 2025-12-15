"use client";

import { useState, useRef } from "react";
import type { EventLayout } from "@/types";

type BucketName = "frames" | "logos" | "photos" | "composites";

interface AssetUploaderProps {
  eventId: string;
  assetType: "frame" | "logo";
  existingAssets?: EventLayout[];
  onUploadComplete?: () => void;
}

export default function AssetUploader({
  eventId,
  assetType,
  existingAssets = [],
  onUploadComplete,
}: AssetUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [width, setWidth] = useState(1080);
  const [height, setHeight] = useState(1920);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bucket: BucketName = assetType === "frame" ? "frames" : "logos";
  const title = assetType === "frame" ? "Frames/Backgrounds" : "Logos";

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

    setUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(30);

      // Upload via API route
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", bucket);
      formData.append("eventId", eventId);
      formData.append("assetType", assetType);
      formData.append("width", width.toString());
      formData.append("height", height.toString());

      const response = await fetch("/api/upload-asset", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to upload asset");
      }

      setUploadProgress(100);
      onUploadComplete?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload ${assetType}: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (layout: EventLayout) => {
    if (!confirm(`Are you sure you want to delete this ${assetType}?`)) {
      return;
    }

    try {
      if (layout.frame_url) {
        // Extract path from URL
        const url = new URL(layout.frame_url);
        const pathParts = url.pathname.split('/');
        const path = pathParts.slice(pathParts.indexOf(bucket) + 1).join('/');

        // Delete via API route
        const response = await fetch(
          `/api/delete-asset?layoutId=${layout.id}&bucket=${bucket}&path=${encodeURIComponent(path)}`,
          {
            method: "DELETE",
          }
        );

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error || "Failed to delete asset");
        }

        onUploadComplete?.();
      }
    } catch (error: any) {
      console.error("Delete error:", error);
      alert(`Failed to delete ${assetType}: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

        {/* Dimension Inputs */}
        {assetType === "frame" && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width (px)
              </label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 1080)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="100"
                max="4000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height (px)
              </label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 1920)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="100"
                max="4000"
              />
            </div>
          </div>
        )}

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive
              ? "border-blue-500 bg-blue-50"
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
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {uploading ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <div>
                  <p className="text-sm text-gray-600">
                    Drag and drop your {assetType} here, or
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Browse files
                  </button>
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG up to 10MB
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {existingAssets.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Uploaded {title}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingAssets.map((asset) => (
              <div
                key={asset.id}
                className="relative group border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <img
                    src={asset.frame_url || ""}
                    alt={`${assetType} asset`}
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  onClick={() => handleDelete(asset)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                  title="Delete"
                >
                  <svg
                    className="w-4 h-4"
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
                <div className="absolute bottom-2 left-2 space-y-1">
                  {asset.is_default && (
                    <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Default
                    </div>
                  )}
                  {assetType === "frame" && (
                    <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                      {asset.width}x{asset.height}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
