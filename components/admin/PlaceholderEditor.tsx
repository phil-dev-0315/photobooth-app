"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { PhotoPlaceholder, PlaceholderShape } from "@/types";

interface PlaceholderEditorProps {
  frameUrl: string;
  width: number;
  height: number;
  placeholders: PhotoPlaceholder[];
  onChange: (placeholders: PhotoPlaceholder[]) => void;
  photosPerSession: number;
}

type DragMode = "none" | "draw" | "move" | "resize";
type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";

export default function PlaceholderEditor({
  frameUrl,
  width,
  height,
  placeholders,
  onChange,
  photosPerSession,
}: PlaceholderEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  // Shape selector state
  const [drawShape, setDrawShape] = useState<PlaceholderShape>("rectangle");

  // Drag state
  const [dragMode, setDragMode] = useState<DragMode>("none");
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [originalPlaceholder, setOriginalPlaceholder] = useState<PhotoPlaceholder | null>(null);

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

    // NEW: Observer detects if mobile keyboard changes container size
    const resizeObserver = new ResizeObserver(updateScale);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    window.addEventListener("resize", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
      resizeObserver.disconnect();
    }
  }, [width, height]);

  const scaledWidth = width * scale;
  const scaledHeight = height * scale;

  // Convert screen coordinates to canvas coordinates
  const screenToCanvas = useCallback((screenX: number, screenY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.max(0, Math.min(width, (screenX - rect.left) / scale)),
      y: Math.max(0, Math.min(height, (screenY - rect.top) / scale)),
    };
  }, [scale, width, height]);

  // Get preview rectangle while drawing
  const getDrawPreview = (): PhotoPlaceholder | null => {
    if (dragMode !== "draw") return null;
    return {
      x: Math.min(dragStart.x, dragCurrent.x),
      y: Math.min(dragStart.y, dragCurrent.y),
      width: Math.abs(dragCurrent.x - dragStart.x),
      height: Math.abs(dragCurrent.y - dragStart.y),
    };
  };

  // Handle mouse down
  // const handleMouseDown = (e: React.MouseEvent) => {
  //   if (e.button !== 0) return;
  //   e.preventDefault();
  const handlePointerDown = (e: React.PointerEvent) => {
      if (!e.isPrimary) return; // Ignores multi-touch (2nd finger)
        e.preventDefault();
        
    // CRITICAL: Locks the drag to the element even if finger slips off
    (e.target as Element).setPointerCapture(e.pointerId);

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    // Check if clicking on a placeholder
    const clickedIndex = placeholders.findIndex(p =>
      x >= p.x && x <= p.x + p.width && y >= p.y && y <= p.y + p.height
    );

    if (clickedIndex >= 0) {
      // Start moving existing placeholder
      setSelectedIndex(clickedIndex);
      setDragMode("move");
      setDragStart({ x, y });
      setDragCurrent({ x, y });
      setOriginalPlaceholder({ ...placeholders[clickedIndex] });
    } else {
      // Start drawing new placeholder
      setSelectedIndex(null);
      setDragMode("draw");
      setDragStart({ x, y });
      setDragCurrent({ x, y });
    }
  };

  // Handle mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragMode === "none") return;
    e.preventDefault();

    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setDragCurrent({ x, y });

    if (dragMode === "move" && selectedIndex !== null && originalPlaceholder) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      const newPlaceholders = [...placeholders];
      newPlaceholders[selectedIndex] = {
        ...originalPlaceholder,
        x: Math.max(0, Math.min(width - originalPlaceholder.width, originalPlaceholder.x + deltaX)),
        y: Math.max(0, Math.min(height - originalPlaceholder.height, originalPlaceholder.y + deltaY)),
      };
      onChange(newPlaceholders);
    } else if (dragMode === "resize" && selectedIndex !== null && originalPlaceholder && resizeHandle) {
      const newPlaceholders = [...placeholders];
      let newP = { ...originalPlaceholder };

      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      // Handle resize based on which handle is being dragged
      if (resizeHandle.includes("w")) {
        newP.x = Math.min(originalPlaceholder.x + originalPlaceholder.width - 50, originalPlaceholder.x + deltaX);
        newP.width = originalPlaceholder.width - (newP.x - originalPlaceholder.x);
      }
      if (resizeHandle.includes("e")) {
        newP.width = Math.max(50, originalPlaceholder.width + deltaX);
      }
      if (resizeHandle.includes("n")) {
        newP.y = Math.min(originalPlaceholder.y + originalPlaceholder.height - 50, originalPlaceholder.y + deltaY);
        newP.height = originalPlaceholder.height - (newP.y - originalPlaceholder.y);
      }
      if (resizeHandle.includes("s")) {
        newP.height = Math.max(50, originalPlaceholder.height + deltaY);
      }

      // Clamp to canvas bounds
      newP.x = Math.max(0, newP.x);
      newP.y = Math.max(0, newP.y);
      newP.width = Math.min(width - newP.x, newP.width);
      newP.height = Math.min(height - newP.y, newP.height);

      newPlaceholders[selectedIndex] = newP;
      onChange(newPlaceholders);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragMode === "none") return;
    e.preventDefault(); // Stop scrolling while dragging

    const { x, y } = screenToCanvas(e.clientX, e.clientY);
    setDragCurrent({ x, y });

    if (dragMode === "move" && selectedIndex !== null && originalPlaceholder) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      const newPlaceholders = [...placeholders];
      newPlaceholders[selectedIndex] = {
        ...originalPlaceholder,
        x: Math.max(0, Math.min(width - originalPlaceholder.width, originalPlaceholder.x + deltaX)),
        y: Math.max(0, Math.min(height - originalPlaceholder.height, originalPlaceholder.y + deltaY)),
      };
      onChange(newPlaceholders);
    } else if (dragMode === "resize" && selectedIndex !== null && originalPlaceholder && resizeHandle) {
      const newPlaceholders = [...placeholders];
      let newP = { ...originalPlaceholder };

      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      // Handle resize based on which handle is being dragged
      if (resizeHandle.includes("w")) {
        // constrain X to not go beyond right edge
        const maxX = originalPlaceholder.x + originalPlaceholder.width - 20;
        newP.x = Math.min(maxX, originalPlaceholder.x + deltaX);
        newP.width = originalPlaceholder.width - (newP.x - originalPlaceholder.x);
      }
      if (resizeHandle.includes("e")) {
        newP.width = Math.max(20, originalPlaceholder.width + deltaX);
      }
      if (resizeHandle.includes("n")) {
        const maxY = originalPlaceholder.y + originalPlaceholder.height - 20;
        newP.y = Math.min(maxY, originalPlaceholder.y + deltaY);
        newP.height = originalPlaceholder.height - (newP.y - originalPlaceholder.y);
      }
      if (resizeHandle.includes("s")) {
        newP.height = Math.max(20, originalPlaceholder.height + deltaY);
      }

      // Clamp to canvas bounds
      newP.x = Math.max(0, newP.x);
      newP.y = Math.max(0, newP.y);
      // Ensure it doesn't overflow container
      if (newP.x + newP.width > width) newP.width = width - newP.x;
      if (newP.y + newP.height > height) newP.height = height - newP.y;

      newPlaceholders[selectedIndex] = newP;
      onChange(newPlaceholders);
    }
  };
  // Handle pointer up
  const handlePointerUp = (e: React.PointerEvent) => {
    // Release the lock so other elements can be interacted with again
    (e.target as Element).releasePointerCapture(e.pointerId);

    if (dragMode === "draw") {
      const preview = getDrawPreview();
      if (preview && preview.width > 30 && preview.height > 30) {
        // Include the selected shape when creating new placeholder
        const newPlaceholder: PhotoPlaceholder = {
          ...preview,
          shape: drawShape,
        };
        onChange([...placeholders, newPlaceholder]);
        setSelectedIndex(placeholders.length);
      }
    }

    setDragMode("none");
    setOriginalPlaceholder(null);
    setResizeHandle(null);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent, index: number, handle: ResizeHandle) => {
    e.stopPropagation();
    e.preventDefault();

    const { x, y } = screenToCanvas(e.clientX, e.clientY);

    setSelectedIndex(index);
    setDragMode("resize");
    setResizeHandle(handle);
    setDragStart({ x, y });
    setDragCurrent({ x, y });
    setOriginalPlaceholder({ ...placeholders[index] });
  };

  // Delete placeholder
  const handleDelete = (index: number) => {
    const newPlaceholders = placeholders.filter((_, i) => i !== index);
    onChange(newPlaceholders);
    setSelectedIndex(null);
  };

  // Update placeholder manually
  const updatePlaceholder = (index: number, updates: Partial<PhotoPlaceholder>) => {
    const newPlaceholders = [...placeholders];
    newPlaceholders[index] = { ...newPlaceholders[index], ...updates };
    onChange(newPlaceholders);
  };

  // Toggle placeholder shape
  const togglePlaceholderShape = (index: number) => {
    const currentShape = placeholders[index].shape || "rectangle";
    const newShape: PlaceholderShape = currentShape === "rectangle" ? "circle" : "rectangle";
    updatePlaceholder(index, { shape: newShape });
  };

  // Generate default placeholders
  const generateDefaults = () => {
    const padding = Math.round(width * 0.05);
    const photoWidth = width - (padding * 2);
    const photoHeight = Math.round(photoWidth * 0.75);
    const spacing = Math.round(height * 0.02);

    const totalPhotosHeight = (photoHeight * photosPerSession) + (spacing * (photosPerSession - 1));
    const startY = Math.round((height - totalPhotosHeight) / 2);

    const newPlaceholders: PhotoPlaceholder[] = [];
    for (let i = 0; i < photosPerSession; i++) {
      newPlaceholders.push({
        x: padding,
        y: startY + (i * (photoHeight + spacing)),
        width: photoWidth,
        height: photoHeight,
        shape: drawShape, // Use currently selected shape
      });
    }
    onChange(newPlaceholders);
  };

  const drawPreview = getDrawPreview();

  // Resize handle component
  const ResizeHandles = ({ index, placeholder }: { index: number; placeholder: PhotoPlaceholder }) => {
    const handleSize = 10;
    const hitArea = 24;    // Touch target size
    const handles: { pos: ResizeHandle; style: React.CSSProperties }[] = [
      { pos: "nw", style: { left: -handleSize/2, top: -handleSize/2, cursor: "nw-resize" } },
      { pos: "ne", style: { right: -handleSize/2, top: -handleSize/2, cursor: "ne-resize" } },
      { pos: "sw", style: { left: -handleSize/2, bottom: -handleSize/2, cursor: "sw-resize" } },
      { pos: "se", style: { right: -handleSize/2, bottom: -handleSize/2, cursor: "se-resize" } },
      { pos: "n", style: { left: "50%", top: -handleSize/2, transform: "translateX(-50%)", cursor: "n-resize" } },
      { pos: "s", style: { left: "50%", bottom: -handleSize/2, transform: "translateX(-50%)", cursor: "s-resize" } },
      { pos: "w", style: { left: -handleSize/2, top: "50%", transform: "translateY(-50%)", cursor: "w-resize" } },
      { pos: "e", style: { right: -handleSize/2, top: "50%", transform: "translateY(-50%)", cursor: "e-resize" } },
    ];

    return (
      <>
        {handles.map(({ pos, style }) => (
          <div
            key={pos}
            // className="absolute bg-white border-2 border-blue-500 rounded-sm z-10"
            // style={{
            //   width: handleSize,
            //   height: handleSize,
            //   ...style,
            // }}
            // onMouseDown={(e) => handleResizeStart(e, index, pos)}
            className="absolute z-10 flex items-center justify-center"
            style={{
              ...style,
              width: hitArea,  // Larger hit area
              height: hitArea,
              // Adjust transform to center the hit area
              transform: style.transform 
                  ? `${style.transform} translate(${style.left ? '-25%' : '25%'}, ...)` 
                  : `translate(${style.left ? '-25%' : '25%'}, ...)`,
            }}
            onPointerDown={(e) => handleResizeStart(e, index, pos)}
          >
            <div className="bg-white border-2 border-blue-500 rounded-sm w-2.5 h-2.5 shadow-sm" />
            </div>
        ))}
      </>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">
          Photo Placeholders ({placeholders.length}/{photosPerSession})
        </h4>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={generateDefaults}
            className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200"
          >
            Auto-Generate
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Shape Selector */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-medium text-gray-700">Draw Shape:</span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setDrawShape("rectangle")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
              drawShape === "rectangle"
                ? "bg-blue-100 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
            </svg>
            Rectangle
          </button>
          <button
            type="button"
            onClick={() => setDrawShape("circle")}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
              drawShape === "circle"
                ? "bg-blue-100 border-blue-500 text-blue-700"
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
            Circle
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• <strong>Draw:</strong> Click and drag on empty area to create a new placeholder</p>
        <p>• <strong>Move:</strong> Click and drag inside a placeholder to reposition it</p>
        <p>• <strong>Resize:</strong> Drag the corner or edge handles to resize</p>
        <p>• <strong>Shape:</strong> Click the shape icon on a placeholder to toggle between rectangle and circle</p>
      </div>

      {/* Frame Preview with Placeholders */}
      <div
        ref={containerRef}
        className="relative border border-gray-300 rounded-lg overflow-hidden bg-gray-100 select-none touch-none"
        style={{
          width: scaledWidth,
          height: scaledHeight,
          touchAction: "none", // <--- PREVENTS SCROLLING WHEN DRAGGING
          cursor: dragMode === "draw" ? "crosshair" : dragMode === "move" ? "grabbing" : "default"
        }}
        // onMouseDown={handleMouseDown}
        // onMouseMove={handleMouseMove}
        // onMouseUp={handleMouseUp}
        // onMouseLeave={handleMouseUp}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* Frame Image */}
        <img
          src={frameUrl}
          alt="Frame preview"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />

        {/* Existing Placeholders */}
        {placeholders.map((placeholder, index) => {
          const isCircle = placeholder.shape === "circle";
          return (
            <div
              key={index}
              className={`absolute border-2 transition-colors ${
                isCircle ? "rounded-full" : "rounded-none"
              } ${
                selectedIndex === index
                  ? "border-blue-500 bg-blue-500/30"
                  : "border-green-500 bg-green-500/20 hover:border-green-600 hover:bg-green-500/30"
              }`}
              style={{
                left: placeholder.x * scale,
                top: placeholder.y * scale,
                width: placeholder.width * scale,
                height: placeholder.height * scale,
                cursor: dragMode === "none" ? "grab" : undefined,
              }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(index);
              }}
            >
              {/* Placeholder number */}
              <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded font-medium">
                Photo {index + 1}
              </div>

              {/* Shape toggle button */}
              <button
                className="absolute top-1 left-[70px] bg-purple-500 text-white w-6 h-6 rounded-full hover:bg-purple-600 flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlaceholderShape(index);
                }}
                title={`Switch to ${isCircle ? "rectangle" : "circle"}`}
              >
                {isCircle ? (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                  </svg>
                ) : (
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                )}
              </button>

              {/* Delete button */}
              <button
                className="absolute top-1 right-1 bg-red-500 text-white w-6 h-6 rounded-full hover:bg-red-600 flex items-center justify-center text-sm font-bold"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(index);
                }}
              >
                ×
              </button>

              {/* Dimensions display */}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded">
                {Math.round(placeholder.width)} × {Math.round(placeholder.height)}
              </div>

              {/* Shape indicator */}
              <div className="absolute bottom-1 right-1 bg-purple-600/80 text-white text-xs px-2 py-0.5 rounded capitalize">
                {placeholder.shape || "rectangle"}
              </div>

              {/* Resize handles - only show for selected placeholder */}
              {selectedIndex === index && dragMode !== "move" && (
                <ResizeHandles index={index} placeholder={placeholder} />
              )}
            </div>
          );
        })}

        {/* Draw Preview */}
        {drawPreview && drawPreview.width > 5 && drawPreview.height > 5 && (
          <div
            className={`absolute border-2 border-dashed border-blue-500 bg-blue-500/20 pointer-events-none ${
              drawShape === "circle" ? "rounded-full" : "rounded-none"
            }`}
            style={{
              left: drawPreview.x * scale,
              top: drawPreview.y * scale,
              width: drawPreview.width * scale,
              height: drawPreview.height * scale,
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-700 font-medium text-sm">
              <span>{Math.round(drawPreview.width)} × {Math.round(drawPreview.height)}</span>
              <span className="text-xs opacity-75 capitalize">{drawShape}</span>
            </div>
          </div>
        )}
      </div>

      {/* Placeholder List & Editor */}
      {placeholders.length > 0 && (
        <div className="space-y-2">
          <h5 className="text-xs font-medium text-gray-700">Fine-tune Positions (pixels)</h5>
          <div className="grid gap-2 max-h-64 overflow-y-auto">
            {placeholders.map((placeholder, index) => (
              <div
                key={index}
                className={`flex flex-col gap-2 p-2 rounded text-xs cursor-pointer transition-colors ${
                  selectedIndex === index
                    ? "bg-blue-50 border border-blue-200"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => setSelectedIndex(index)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium w-16 text-gray-700">Photo {index + 1}</span>
                  <div className="flex gap-1 flex-1 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-4">X:</span>
                      <input
                        type="number"
                        value={Math.round(placeholder.x)}
                        onChange={(e) => updatePlaceholder(index, { x: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 border rounded text-center"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-4">Y:</span>
                      <input
                        type="number"
                        value={Math.round(placeholder.y)}
                        onChange={(e) => updatePlaceholder(index, { y: parseInt(e.target.value) || 0 })}
                        className="w-16 px-2 py-1 border rounded text-center"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-4">W:</span>
                      <input
                        type="number"
                        value={Math.round(placeholder.width)}
                        onChange={(e) => updatePlaceholder(index, { width: parseInt(e.target.value) || 100 })}
                        className="w-16 px-2 py-1 border rounded text-center"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 w-4">H:</span>
                      <input
                        type="number"
                        value={Math.round(placeholder.height)}
                        onChange={(e) => updatePlaceholder(index, { height: parseInt(e.target.value) || 100 })}
                        className="w-16 px-2 py-1 border rounded text-center"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  {/* Shape selector for this placeholder */}
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Shape:</span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlaceholder(index, { shape: "rectangle" });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                          (placeholder.shape || "rectangle") === "rectangle"
                            ? "bg-purple-100 border-purple-500 text-purple-700"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                        </svg>
                        Rect
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePlaceholder(index, { shape: "circle" });
                        }}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded border transition-colors ${
                          placeholder.shape === "circle"
                            ? "bg-purple-100 border-purple-500 text-purple-700"
                            : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="9" />
                        </svg>
                        Circle
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(index);
                    }}
                    className="text-red-500 hover:text-red-700 px-2 py-1 hover:bg-red-50 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {placeholders.length < photosPerSession && (
        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
          ⚠️ You need {photosPerSession - placeholders.length} more placeholder(s) for {photosPerSession} photos.
        </p>
      )}

      {placeholders.length >= photosPerSession && (
        <p className="text-xs text-green-600 bg-green-50 p-2 rounded">
          ✓ All {photosPerSession} placeholders defined. Ready to save!
        </p>
      )}
    </div>
  );
}
