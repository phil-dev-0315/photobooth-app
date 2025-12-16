'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function ProjectionPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  // 1. Setup Camera Feed
  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            facingMode: 'user', // Front camera by default
          },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
        setError('Could not access camera. Please ensure permissions are granted.');
      }
    };

    startCamera();

    // Cleanup: Stop tracks when component unmounts
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // 2. Setup BroadcastChannel Listener
  useEffect(() => {
    const channel = new BroadcastChannel('booth_control');

    const handleMessage = (event: MessageEvent) => {
      const { action, payload } = event.data || {};

      if (action === 'CLOSE') {
        window.close();
      } else if (action === 'SYNC_TIMER') {
        setCountdown(typeof payload === 'number' && payload > 0 ? payload : null);
      }
    };

    channel.addEventListener('message', handleMessage);

    return () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    };
  }, []);

  return (
    <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-black text-white">
      {error ? (
        <div className="p-4 text-center">
          <h1 className="text-xl font-bold text-red-500">Projection Error</h1>
          <p>{error}</p>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-contain"
            style={{ transform: 'scaleX(-1)' }} // Mirror the feed
          />

          {/* Countdown Overlay */}
          <AnimatePresence>
            {countdown !== null && (
              <motion.div
                key={countdown}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.5 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
              >
                <span className="text-[25vh] font-bold text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] tabular-nums leading-none">
                  {countdown}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}