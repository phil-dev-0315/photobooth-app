"use client";

import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from "react";
import { Stage, Layer, Image as KonvaImage, Text } from "react-konva";
import useImage from "use-image";

interface Photo {
  id: string;
  dataUrl: string;
}

interface PhotoPlaceholder {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PhotoCompositorProps {
  photos: Photo[];
  frameUrl?: string | null;
  logoUrl?: string | null;
  message?: string | null;
  layout?: "3-vertical" | "2x2" | "collage";
  width?: number;
  height?: number;
  placeholders?: PhotoPlaceholder[];
  onExport?: (dataUrl: string) => void;
}

// Custom hook for loading images with proper error handling
function useKonvaImage(url: string | null | undefined) {
  const [image, status] = useImage(url || "", "anonymous");
  return [image, status] as const;
}

export interface PhotoCompositorHandle {
  exportImage: () => string | null;
}

const PhotoCompositor = forwardRef<PhotoCompositorHandle, PhotoCompositorProps>(({
  photos,
  frameUrl,
  logoUrl,
  message,
  layout = "3-vertical",
  width = 1080,
  height = 1920,
  placeholders = [],
  onExport,
}, ref) => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const canvasSize = { width, height };

  // Calculate scale to fit container
  const updateScale = useCallback(() => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const maxHeight = window.innerHeight * 0.6; // 60% of viewport height max

      // Calculate scale to fit width
      const scaleX = containerWidth / width;
      // Calculate scale to fit height
      const scaleY = maxHeight / height;

      // Use the smaller scale to ensure it fits both dimensions
      const newScale = Math.min(scaleX, scaleY, 1); // Never scale up, only down

      setScale(newScale);
      setContainerSize({
        width: width * newScale,
        height: height * newScale,
      });
    }
  }, [width, height]);

  // Update scale on mount and resize
  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [updateScale]);

  // Load images
  const [frameImage] = useKonvaImage(frameUrl);
  const [logoImage] = useKonvaImage(logoUrl);
  const [photoImages, setPhotoImages] = useState<(HTMLImageElement | undefined)[]>([]);

  // Load photo images
  useEffect(() => {
    const loadPhotos = async () => {
      const loadedImages = await Promise.all(
        photos.map((photo) => {
          return new Promise<HTMLImageElement | undefined>((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = () => resolve(undefined);
            img.src = photo.dataUrl;
          });
        })
      );
      setPhotoImages(loadedImages);
    };

    loadPhotos();
  }, [photos]);

  // Calculate photo positions - use placeholders if available, otherwise generate defaults
  const getPhotoPositions = (): PhotoPlaceholder[] => {
    // If placeholders are defined, use them
    if (placeholders && placeholders.length > 0) {
      return placeholders;
    }

    // Otherwise generate default positions based on layout
    const positions: PhotoPlaceholder[] = [];
    const padding = 60;
    const photoWidth = canvasSize.width - padding * 2;
    const photoHeight = (photoWidth * 3) / 4; // 4:3 aspect ratio
    const spacing = 20;

    switch (layout) {
      case "3-vertical":
        for (let i = 0; i < 3; i++) {
          positions.push({
            x: padding,
            y: 200 + i * (photoHeight + spacing),
            width: photoWidth,
            height: photoHeight,
          });
        }
        break;

      case "2x2":
        const gridPhotoWidth = (canvasSize.width - padding * 2 - spacing) / 2;
        const gridPhotoHeight = (gridPhotoWidth * 3) / 4;
        for (let i = 0; i < 4; i++) {
          const row = Math.floor(i / 2);
          const col = i % 2;
          positions.push({
            x: padding + col * (gridPhotoWidth + spacing),
            y: 300 + row * (gridPhotoHeight + spacing),
            width: gridPhotoWidth,
            height: gridPhotoHeight,
          });
        }
        break;

      case "collage":
        positions.push(
          {
            x: padding,
            y: 200,
            width: photoWidth * 0.6,
            height: photoHeight * 0.6,
          },
          {
            x: padding + photoWidth * 0.65,
            y: 250,
            width: photoWidth * 0.3,
            height: photoHeight * 0.4,
          },
          {
            x: padding,
            y: 200 + photoHeight * 0.65,
            width: photoWidth * 0.4,
            height: photoHeight * 0.5,
          }
        );
        break;
    }

    return positions;
  };

  // Calculate crop parameters for "cover" fit (fill placeholder, crop excess)
  const getCropParams = (
    img: HTMLImageElement,
    placeholder: PhotoPlaceholder
  ) => {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const placeholderRatio = placeholder.width / placeholder.height;

    let cropX = 0;
    let cropY = 0;
    let cropWidth = img.naturalWidth;
    let cropHeight = img.naturalHeight;

    if (imgRatio > placeholderRatio) {
      // Image is wider - crop sides
      cropWidth = img.naturalHeight * placeholderRatio;
      cropX = (img.naturalWidth - cropWidth) / 2;
    } else {
      // Image is taller - crop top/bottom
      cropHeight = img.naturalWidth / placeholderRatio;
      cropY = (img.naturalHeight - cropHeight) / 2;
    }

    return { cropX, cropY, cropWidth, cropHeight };
  };

  const photoPositions = getPhotoPositions();

  // Export canvas as image at full resolution
  const exportImage = useCallback(() => {
    if (stageRef.current) {
      // Temporarily reset scale to export at full resolution
      const stage = stageRef.current;
      const oldScaleX = stage.scaleX();
      const oldScaleY = stage.scaleY();

      stage.scaleX(1);
      stage.scaleY(1);

      const dataUrl = stage.toDataURL({
        mimeType: "image/png",
        quality: 1,
        pixelRatio: 1, // Already at full res since we reset scale
      });

      // Restore scale
      stage.scaleX(oldScaleX);
      stage.scaleY(oldScaleY);

      onExport?.(dataUrl);
      return dataUrl;
    }
    return null;
  }, [onExport]);

  // Expose export function via ref
  useImperativeHandle(ref, () => ({
    exportImage,
  }), [exportImage]);

  return (
    <div ref={containerRef} className="w-full">
      <div
        className="mx-auto bg-gray-100 rounded-lg overflow-hidden shadow-inner"
        style={{
          width: containerSize.width || "100%",
          height: containerSize.height || "auto",
        }}
      >
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          scaleX={scale}
          scaleY={scale}
          style={{
            transformOrigin: "top left",
          }}
        >
        <Layer>
          {/* Background frame/template */}
          {frameImage && (
            <KonvaImage
              image={frameImage}
              x={0}
              y={0}
              width={canvasSize.width}
              height={canvasSize.height}
            />
          )}

          {/* Photos - rendered with crop to fill placeholders */}
          {photoImages.map((photoImage, index) => {
            if (!photoImage || !photoPositions[index]) return null;

            const pos = photoPositions[index];
            const crop = getCropParams(photoImage, pos);

            return (
              <KonvaImage
                key={`photo-${index}`}
                image={photoImage}
                x={pos.x}
                y={pos.y}
                width={pos.width}
                height={pos.height}
                crop={{
                  x: crop.cropX,
                  y: crop.cropY,
                  width: crop.cropWidth,
                  height: crop.cropHeight,
                }}
              />
            );
          })}

          {/* Message text */}
          {message && (
            <Text
              text={message}
              x={60}
              y={canvasSize.height - 300}
              width={canvasSize.width - 120}
              fontSize={32}
              fontFamily="Georgia, serif"
              fontStyle="italic"
              fill="#333"
              align="center"
              wrap="word"
            />
          )}

          {/* Logo */}
          {logoImage && (
            <KonvaImage
              image={logoImage}
              x={canvasSize.width - 220}
              y={60}
              width={160}
              height={160}
              opacity={0.9}
            />
          )}

        </Layer>
        </Stage>
      </div>
    </div>
  );
});

PhotoCompositor.displayName = "PhotoCompositor";

export default PhotoCompositor;
export { PhotoCompositor };
