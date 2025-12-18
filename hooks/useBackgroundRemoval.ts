"use client";

import { useState, useCallback, useRef } from 'react';
import { removeBackground, type Config } from '@imgly/background-removal';
import { CapturedPhoto } from '@/types';

interface UseBackgroundRemovalReturn {
  processPhotos: (photos: CapturedPhoto[]) => Promise<void>;
  getProcessedUrl: (photoId: string) => string | null;
  isProcessing: boolean;
  progress: number;
  processedCount: number;
  totalCount: number;
  error: string | null;
  clearCache: () => void;
  isSupported: boolean;
}

// Cache for processed photos (persists across re-renders)
const processedCache = new Map<string, string>();

export function useBackgroundRemoval(): UseBackgroundRemovalReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Track if we're currently processing to prevent duplicate calls
  const processingRef = useRef(false);

  // Check if SharedArrayBuffer is supported (required for high performance)
  const isSupported = typeof window !== 'undefined' &&
    typeof SharedArrayBuffer !== 'undefined' &&
    (window as any).crossOriginIsolated === true;

  const processPhotos = useCallback(async (photos: CapturedPhoto[]) => {
    // Prevent duplicate processing
    if (processingRef.current) {
      console.log('Background removal already in progress');
      return;
    }

    // Check for photos that haven't been processed yet
    const unprocessedPhotos = photos.filter(p => !processedCache.has(p.id));

    if (unprocessedPhotos.length === 0) {
      console.log('All photos already processed');
      return;
    }

    processingRef.current = true;
    setIsProcessing(true);
    setError(null);
    setTotalCount(unprocessedPhotos.length);
    setProcessedCount(0);
    setProgress(0);

    // Build config with full URL at runtime (ensures window is available)
    const config: Config = {
      publicPath: `${window.location.origin}/assets/imgly/`,
      debug: false,
      device: 'gpu', // Use WebGPU if available, falls back to CPU
      model: 'isnet_fp16', // Medium quality model (~80MB)
      output: {
        format: 'image/png',
        quality: 0.9,
      },
    };

    try {
      // Process photos sequentially to avoid memory issues
      // (parallel processing can crash on mobile devices)
      for (let i = 0; i < unprocessedPhotos.length; i++) {
        const photo = unprocessedPhotos[i];

        try {
          // Convert base64 data URL to blob
          const response = await fetch(photo.dataUrl);
          const blob = await response.blob();

          // Process the image
          const resultBlob = await removeBackground(blob, config);

          // Convert result blob to data URL
          const reader = new FileReader();
          const dataUrl = await new Promise<string>((resolve, reject) => {
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(resultBlob);
          });

          // Cache the result
          processedCache.set(photo.id, dataUrl);

          // Update progress
          const completed = i + 1;
          setProcessedCount(completed);
          setProgress(Math.round((completed / unprocessedPhotos.length) * 100));
        } catch (photoError) {
          console.error(`Error processing photo ${photo.id}:`, photoError);
          // Continue with next photo even if one fails
        }
      }
    } catch (err: any) {
      console.error('Background removal error:', err);
      setError(err.message || 'Failed to remove background');
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  }, []);

  const getProcessedUrl = useCallback((photoId: string): string | null => {
    return processedCache.get(photoId) || null;
  }, []);

  const clearCache = useCallback(() => {
    processedCache.clear();
    setProcessedCount(0);
    setProgress(0);
    setError(null);
  }, []);

  return {
    processPhotos,
    getProcessedUrl,
    isProcessing,
    progress,
    processedCount,
    totalCount,
    error,
    clearCache,
    isSupported,
  };
}
