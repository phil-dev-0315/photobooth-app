"use client";

import { useRef, useEffect, useCallback } from "react";
import { Image as KonvaImage, Transformer } from "react-konva";
import useImage from "use-image";
import Konva from "konva";
import type { PlacedSticker } from "@/types";

interface StickerLayerProps {
  sticker: PlacedSticker;
  isSelected: boolean;
  onSelect: () => void;
  onChange: (newAttrs: Partial<PlacedSticker>) => void;
  onDelete?: () => void;
}

export default function StickerLayer({
  sticker,
  isSelected,
  onSelect,
  onChange,
  onDelete,
}: StickerLayerProps) {
  const shapeRef = useRef<Konva.Image>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Load sticker image
  const [image, status] = useImage(sticker.url, "anonymous");

  // Attach transformer when selected and image is loaded
  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current && image) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, image]);

  // Handle drag end
  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    onChange({
      x: e.target.x(),
      y: e.target.y(),
    });
  }, [onChange]);

  // Handle transform end (resize/rotate)
  const handleTransformEnd = useCallback(() => {
    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale and update width/height instead
    node.scaleX(1);
    node.scaleY(1);

    onChange({
      x: node.x(),
      y: node.y(),
      width: Math.max(20, node.width() * scaleX),
      height: Math.max(20, node.height() * scaleY),
      rotation: node.rotation(),
      scaleX: 1,
      scaleY: 1,
    });
  }, [onChange]);

  // Handle keyboard delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSelected && (e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        onDelete?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSelected, onDelete]);

  if (status !== "loaded" || !image) {
    return null;
  }

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        image={image}
        x={sticker.x}
        y={sticker.y}
        width={sticker.width}
        height={sticker.height}
        rotation={sticker.rotation}
        scaleX={sticker.scaleX}
        scaleY={sticker.scaleY}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        // Visual feedback
        shadowColor={isSelected ? "blue" : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.5 : 0}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Limit minimum size
            if (newBox.width < 20 || newBox.height < 20) {
              return oldBox;
            }
            return newBox;
          }}
          // Styling
          borderStroke="#3b82f6"
          borderStrokeWidth={2}
          anchorStroke="#3b82f6"
          anchorFill="#fff"
          anchorSize={12}
          anchorCornerRadius={2}
          rotateEnabled={true}
          rotateAnchorOffset={30}
          enabledAnchors={[
            "top-left",
            "top-right",
            "bottom-left",
            "bottom-right",
            "middle-left",
            "middle-right",
            "top-center",
            "bottom-center",
          ]}
        />
      )}
    </>
  );
}
