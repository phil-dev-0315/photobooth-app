"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { CameraState } from "@/types";

interface UseCameraOptions {
  facingMode?: "user" | "environment";
  width?: number;
  height?: number;
  onCapture?: (dataUrl: string) => void;
}

interface UseCameraReturn extends CameraState {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => string | null;
  switchCamera: () => Promise<void>;
  currentFacingMode: "user" | "environment";
}

export function useCamera(options: UseCameraOptions = {}): UseCameraReturn {
  const {
    facingMode: initialFacingMode = "user",
    width = 1920,
    height = 1080,
    onCapture,
  } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const [state, setState] = useState<CameraState>({
    isReady: false,
    isCapturing: false,
    error: null,
    stream: null,
  });

  const [currentFacingMode, setCurrentFacingMode] = useState<"user" | "environment">(
    initialFacingMode
  );

  const startCamera = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, error: null, isReady: false }));

      // Check if mediaDevices API is available
      // This requires HTTPS on non-localhost origins
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error(
          "Camera API not available. Please ensure you are using HTTPS or localhost."
        );
      }

      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: currentFacingMode,
          width: { ideal: width },
          height: { ideal: height },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      // Check if component is still mounted after async operation
      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;

        // Wait for video metadata to load before playing
        await new Promise<void>((resolve) => {
          const onLoadedMetadata = () => {
            video.removeEventListener("loadedmetadata", onLoadedMetadata);
            resolve();
          };

          // Check if already loaded
          if (video.readyState >= 1) {
            resolve();
          } else {
            video.addEventListener("loadedmetadata", onLoadedMetadata);
          }
        });

        // Check mounted state again after waiting
        if (!mountedRef.current) {
          return;
        }

        try {
          await video.play();
        } catch (playError) {
          // Ignore AbortError - happens when video is removed during play
          if (playError instanceof Error && playError.name === "AbortError") {
            return;
          }
          throw playError;
        }
      }

      // Final mounted check before state update
      if (!mountedRef.current) {
        return;
      }

      setState({
        isReady: true,
        isCapturing: false,
        error: null,
        stream,
      });
    } catch (err) {
      // Don't update state if unmounted
      if (!mountedRef.current) {
        return;
      }

      let errorMessage = "Failed to access camera";

      if (err instanceof Error) {
        // Provide more helpful error messages
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          errorMessage = "Camera permission denied. Please allow camera access and try again.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          errorMessage = "Camera is already in use by another application.";
        } else if (err.name === "OverconstrainedError") {
          errorMessage = "Camera does not support the requested settings.";
        } else if (err.name === "TypeError" && err.message.includes("undefined")) {
          errorMessage = "Camera API not available. HTTPS is required for camera access.";
        } else {
          errorMessage = err.message;
        }
      }

      setState({
        isReady: false,
        isCapturing: false,
        error: errorMessage,
        stream: null,
      });
    }
  }, [currentFacingMode, width, height]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setState({
      isReady: false,
      isCapturing: false,
      error: null,
      stream: null,
    });
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !state.isReady) {
      return null;
    }

    setState((prev) => ({ ...prev, isCapturing: true }));

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setState((prev) => ({ ...prev, isCapturing: false }));
      return null;
    }

    // Mirror the image for front-facing camera
    if (currentFacingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.95);

    setState((prev) => ({ ...prev, isCapturing: false }));

    if (onCapture) {
      onCapture(dataUrl);
    }

    return dataUrl;
  }, [state.isReady, currentFacingMode, onCapture]);

  const switchCamera = useCallback(async () => {
    const newFacingMode = currentFacingMode === "user" ? "environment" : "user";
    setCurrentFacingMode(newFacingMode);
  }, [currentFacingMode]);

  // Restart camera when facing mode changes (only if already streaming)
  useEffect(() => {
    if (state.stream) {
      startCamera();
    }
  }, [currentFacingMode]);

  // Track mounted state for cleanup
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
    currentFacingMode,
  };
}
