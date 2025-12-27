"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FrameOverlay } from "@/types";

interface OverlayEditorProps {
  frameUrl: string;
  width: number;
  height: number;
  overlays: FrameOverlay[];
  onChange: (overlays: FrameOverlay[]) => void;
  eventId: string;
}

type DragMode = "none" | "move" | "resize";
type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export default function OverlayEditor({
  frameUrl,
  width,
  height,
  overlays,
  onChange,
  eventId,
}: OverlayEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Drag state
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [originalOverlay, setOriginalOverlay] = useState<FrameOverlay | null>(null);

  // Calculate scale to fit container
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxHeight = 500;
        const scaleX = containerWidth / width;
        const scaleY = maxHeight / height;
        setScale(Math.min(scaleX, scaleY, 1));
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [width, height]);

  // Get mouse position relative to canvas
  const getCanvasPosition = useCallback((e: React.MouseEvent | MouseEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    };
  }, [scale]);

  // Handle overlay upload
  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "frames");
      formData.append("eventId", eventId);
      formData.append("assetType", "overlay");

      const response = await fetch("/api/upload-asset", {
        method: "POST",
        body: formData,
      });

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || "Failed to upload overlay");
      }

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        // Scale down if larger than frame
        let overlayWidth = img.naturalWidth;
        let overlayHeight = img.naturalHeight;
        const maxWidth = width * 0.5;
        const maxHeight = height * 0.5;

        if (overlayWidth > maxWidth || overlayHeight > maxHeight) {
          const scaleRatio = Math.min(maxWidth / overlayWidth, maxHeight / overlayHeight);
          overlayWidth = Math.round(overlayWidth * scaleRatio);
          overlayHeight = Math.round(overlayHeight * scaleRatio);
        }

        // Create new overlay centered
        const newOverlay: FrameOverlay = {
          id: `overlay-${Date.now()}`,
          url: json.data.url,
          x: Math.round((width - overlayWidth) / 2),
          y: Math.round((height - overlayHeight) / 2),
          width: overlayWidth,
          height: overlayHeight,
        };

        onChange([...overlays, newOverlay]);
        setSelectedId(newOverlay.id);
      };
      img.src = json.data.url;
    } catch (error: any) {
      console.error("Upload error:", error);
      alert(`Failed to upload overlay: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Delete overlay
  const handleDelete = (id: string) => {
    onChange(overlays.filter((o) => o.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Update overlay
  const updateOverlay = (id: string, updates: Partial<FrameOverlay>) => {
    onChange(
      overlays.map((o) => (o.id === id ? { ...o, ...updates } : o))
    );
  };

  // Start dragging/resizing
  const handleMouseDown = (e: React.MouseEvent, overlay: FrameOverlay, mode: DragMode, handle?: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedId(overlay.id);
    setDragMode(mode);
    setDragStartPos(getCanvasPosition(e));
    setResizeHandle(handle || null);
    setOriginalOverlay({ ...overlay });
  };

  // Handle mouse move for drag/resize
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (dragMode === "none" || !originalOverlay) return;

    const pos = getCanvasPosition(e);
    const dx = pos.x - dragStartPos.x;
    const dy = pos.y - dragStartPos.y;

    if (dragMode === "move") {
      updateOverlay(originalOverlay.id, {
        x: Math.max(0, Math.min(width - originalOverlay.width, originalOverlay.x + dx)),
        y: Math.max(0, Math.min(height - originalOverlay.height, originalOverlay.y + dy)),
      });
    } else if (dragMode === "resize" && resizeHandle) {
      let newX = originalOverlay.x;
      let newY = originalOverlay.y;
      let newWidth = originalOverlay.width;
      let newHeight = originalOverlay.height;

      const minSize = 50;

      switch (resizeHandle) {
        case "se":
          newWidth = Math.max(minSize, originalOverlay.width + dx);
          newHeight = Math.max(minSize, originalOverlay.height + dy);
          break;
        case "sw":
          newX = originalOverlay.x + dx;
          newWidth = Math.max(minSize, originalOverlay.width - dx);
          newHeight = Math.max(minSize, originalOverlay.height + dy);
          if (newWidth === minSize) newX = originalOverlay.x + originalOverlay.width - minSize;
          break;
        case "ne":
          newY = originalOverlay.y + dy;
          newWidth = Math.max(minSize, originalOverlay.width + dx);
          newHeight = Math.max(minSize, originalOverlay.height - dy);
          if (newHeight === minSize) newY = originalOverlay.y + originalOverlay.height - minSize;
          break;
        case "nw":
          newX = originalOverlay.x + dx;
          newY = originalOverlay.y + dy;
          newWidth = Math.max(minSize, originalOverlay.width - dx);
          newHeight = Math.max(minSize, originalOverlay.height - dy);
          if (newWidth === minSize) newX = originalOverlay.x + originalOverlay.width - minSize;
          if (newHeight === minSize) newY = originalOverlay.y + originalOverlay.height - minSize;
          break;
        case "n":
          newY = originalOverlay.y + dy;
          newHeight = Math.max(minSize, originalOverlay.height - dy);
          if (newHeight === minSize) newY = originalOverlay.y + originalOverlay.height - minSize;
          break;
        case "s":
          newHeight = Math.max(minSize, originalOverlay.height + dy);
          break;
        case "e":
          newWidth = Math.max(minSize, originalOverlay.width + dx);
          break;
        case "w":
          newX = originalOverlay.x + dx;
          newWidth = Math.max(minSize, originalOverlay.width - dx);
          if (newWidth === minSize) newX = originalOverlay.x + originalOverlay.width - minSize;
          break;
      }

      // Constrain to canvas
      newX = Math.max(0, Math.min(width - newWidth, newX));
      newY = Math.max(0, Math.min(height - newHeight, newY));

      updateOverlay(originalOverlay.id, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    }
  }, [dragMode, originalOverlay, dragStartPos, resizeHandle, getCanvasPosition, width, height]);

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    setDragMode("none");
    setResizeHandle(null);
    setOriginalOverlay(null);
  }, []);

  // Attach mouse event listeners
  useEffect(() => {
    if (dragMode !== "none") {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragMode, handleMouseMove, handleMouseUp]);

  const selectedOverlay = overlays.find((o) => o.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="text-sm font-medium text-gray-700">Overlays</h5>
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer transition-colors">
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Overlay
            </>
          )}
          <input
            type="file"
            accept="image/png,image/webp"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {/* Canvas Preview */}
      <div
        ref={containerRef}
        className="relative bg-gray-200 rounded-lg overflow-hidden mx-auto"
        style={{
          width: width * scale,
          height: height * scale,
        }}
        onClick={() => setSelectedId(null)}
      >
        {/* Frame Background */}
        <img
          src={frameUrl}
          alt="Frame"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Overlays */}
        {overlays.map((overlay) => {
          const isSelected = selectedId === overlay.id;
          return (
            <div
              key={overlay.id}
              className={`absolute cursor-move ${isSelected ? "ring-2 ring-amber-500" : ""}`}
              style={{
                left: overlay.x * scale,
                top: overlay.y * scale,
                width: overlay.width * scale,
                height: overlay.height * scale,
              }}
              onMouseDown={(e) => handleMouseDown(e, overlay, "move")}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedId(overlay.id);
              }}
            >
              <img
                src={overlay.url}
                alt="Overlay"
                className="w-full h-full object-contain pointer-events-none"
                draggable={false}
              />

              {/* Resize handles when selected */}
              {isSelected && (
                <>
                  {/* Corner handles */}
                  {(["nw", "ne", "sw", "se"] as ResizeHandle[]).map((handle) => (
                    <div
                      key={handle}
                      className="absolute w-3 h-3 bg-amber-500 border border-white rounded-sm cursor-pointer"
                      style={{
                        top: handle.includes("n") ? -6 : "auto",
                        bottom: handle.includes("s") ? -6 : "auto",
                        left: handle.includes("w") ? -6 : "auto",
                        right: handle.includes("e") ? -6 : "auto",
                        cursor: handle === "nw" || handle === "se" ? "nwse-resize" : "nesw-resize",
                      }}
                      onMouseDown={(e) => handleMouseDown(e, overlay, "resize", handle)}
                    />
                  ))}
                  {/* Edge handles */}
                  {(["n", "s", "e", "w"] as ResizeHandle[]).map((handle) => {
                    // Define position styles for each edge handle
                    const edgeStyles: Record<string, React.CSSProperties> = {
                      n: { top: -3, left: "50%", transform: "translateX(-50%)", width: 12, height: 6, cursor: "ns-resize" },
                      s: { bottom: -3, left: "50%", transform: "translateX(-50%)", width: 12, height: 6, cursor: "ns-resize" },
                      e: { right: -3, top: "50%", transform: "translateY(-50%)", width: 6, height: 12, cursor: "ew-resize" },
                      w: { left: -3, top: "50%", transform: "translateY(-50%)", width: 6, height: 12, cursor: "ew-resize" },
                    };
                    return (
                      <div
                        key={handle}
                        className="absolute bg-amber-500 border border-white rounded-sm cursor-pointer"
                        style={edgeStyles[handle]}
                        onMouseDown={(e) => handleMouseDown(e, overlay, "resize", handle)}
                      />
                    );
                  })}
                  {/* Delete button */}
                  <button
                    className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(overlay.id);
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Overlay Controls */}
      {selectedOverlay && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-amber-900">Selected Overlay</span>
            <button
              onClick={() => handleDelete(selectedOverlay.id)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              Delete
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-gray-500">X</label>
              <input
                type="number"
                value={Math.round(selectedOverlay.x)}
                onChange={(e) => updateOverlay(selectedOverlay.id, { x: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-center"
              />
            </div>
            <div>
              <label className="text-gray-500">Y</label>
              <input
                type="number"
                value={Math.round(selectedOverlay.y)}
                onChange={(e) => updateOverlay(selectedOverlay.id, { y: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-center"
              />
            </div>
            <div>
              <label className="text-gray-500">W</label>
              <input
                type="number"
                value={Math.round(selectedOverlay.width)}
                onChange={(e) => updateOverlay(selectedOverlay.id, { width: parseInt(e.target.value) || 100 })}
                className="w-full px-2 py-1 border rounded text-center"
              />
            </div>
            <div>
              <label className="text-gray-500">H</label>
              <input
                type="number"
                value={Math.round(selectedOverlay.height)}
                onChange={(e) => updateOverlay(selectedOverlay.id, { height: parseInt(e.target.value) || 100 })}
                className="w-full px-2 py-1 border rounded text-center"
              />
            </div>
          </div>
        </div>
      )}

      {/* Overlay List */}
      {overlays.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-700">Overlay List ({overlays.length})</h5>
          <div className="flex flex-wrap gap-2">
            {overlays.map((overlay, index) => (
              <div
                key={overlay.id}
                className={`relative w-16 h-16 rounded border-2 cursor-pointer overflow-hidden ${
                  selectedId === overlay.id ? "border-amber-500" : "border-gray-200"
                }`}
                onClick={() => setSelectedId(overlay.id)}
              >
                <img
                  src={overlay.url}
                  alt={`Overlay ${index + 1}`}
                  className="w-full h-full object-contain bg-gray-100"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] text-center">
                  #{index + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {overlays.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">
          No overlays added yet. Click "Add Overlay" to upload PNG images that will be positioned on top of photos.
        </p>
      )}
    </div>
  );
}
