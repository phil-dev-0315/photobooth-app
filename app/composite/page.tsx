"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/Button";

const PHOTOS_PER_SESSION = 3;

export default function CompositePage() {
  const router = useRouter();
  const { photos, message, setMessage, clearPhotos } = useSession();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(message || "");
  const [isDownloading, setIsDownloading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      router.replace("/capture");
    }
  }, [photos.length, router]);

  // Get current date formatted
  const getCurrentDate = () => {
    const date = new Date();
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  // Toggle between photo strip and note view
  const handleToggle = () => {
    setShowNote(!showNote);
  };

  // Save note to session
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setNoteText(text);
    setMessage(text);
  };

  // Helper function to draw rounded rectangles
  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Generate and download the composite image
  const handleDownload = useCallback(async () => {
    if (photos.length < PHOTOS_PER_SESSION) return;

    setIsDownloading(true);

    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Photo strip dimensions (2:3 aspect ratio photos, stacked vertically)
      const stripPadding = 40;
      const photoWidth = 300;
      const photoHeight = 400;
      const photoGap = 20;
      const bottomPadding = 80; // Space for date

      canvas.width = photoWidth + stripPadding * 2;
      canvas.height =
        stripPadding +
        (photoHeight * PHOTOS_PER_SESSION) +
        (photoGap * (PHOTOS_PER_SESSION - 1)) +
        bottomPadding;

      // Draw white background (polaroid style)
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Load and draw photos
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      for (let i = 0; i < photos.length; i++) {
        const img = await loadImage(photos[i].dataUrl);
        const y = stripPadding + i * (photoHeight + photoGap);

        // Draw photo with cover fit
        const imgAspect = img.width / img.height;
        const targetAspect = photoWidth / photoHeight;

        let sx = 0, sy = 0, sw = img.width, sh = img.height;

        if (imgAspect > targetAspect) {
          // Image is wider - crop sides
          sw = img.height * targetAspect;
          sx = (img.width - sw) / 2;
        } else {
          // Image is taller - crop top/bottom
          sh = img.width / targetAspect;
          sy = (img.height - sh) / 2;
        }

        ctx.drawImage(img, sx, sy, sw, sh, stripPadding, y, photoWidth, photoHeight);
      }

      // Draw date at bottom
      ctx.fillStyle = "#374151";
      ctx.font = "500 18px system-ui, -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        getCurrentDate(),
        canvas.width / 2,
        canvas.height - 30
      );

      // If showing note, create a combined image with note card in front
      if (showNote && noteText.trim()) {
        const finalCanvas = document.createElement("canvas");
        const finalCtx = finalCanvas.getContext("2d");
        if (!finalCtx) return;

        // Note card dimensions (smaller than the strip)
        const noteCardWidth = 280;
        const noteCardHeight = 320;
        const notePadding = 16;
        const noteInnerPadding = 24;

        // Final canvas size to fit both with some overlap
        finalCanvas.width = canvas.width + 40;
        finalCanvas.height = canvas.height + 40;

        // Draw photo strip first (in background)
        finalCtx.drawImage(canvas, 20, 20);

        // Calculate note position (centered over the strip)
        const noteX = (finalCanvas.width - noteCardWidth) / 2;
        const noteY = (finalCanvas.height - noteCardHeight) / 2;

        // Draw note card white background
        finalCtx.fillStyle = "#FFFFFF";
        finalCtx.shadowColor = "rgba(0, 0, 0, 0.2)";
        finalCtx.shadowBlur = 20;
        finalCtx.shadowOffsetX = 0;
        finalCtx.shadowOffsetY = 4;
        roundRect(finalCtx, noteX, noteY, noteCardWidth, noteCardHeight, 8);
        finalCtx.fill();

        // Reset shadow
        finalCtx.shadowColor = "transparent";
        finalCtx.shadowBlur = 0;
        finalCtx.shadowOffsetX = 0;
        finalCtx.shadowOffsetY = 0;

        // Draw cream inner area
        finalCtx.fillStyle = "#FAF8F5";
        roundRect(
          finalCtx,
          noteX + notePadding,
          noteY + notePadding,
          noteCardWidth - notePadding * 2,
          noteCardHeight - notePadding * 2,
          4
        );
        finalCtx.fill();

        // Draw note text (centered)
        finalCtx.fillStyle = "#374151";
        finalCtx.font = "400 28px Georgia, serif";
        finalCtx.textAlign = "center";

        // Word wrap the note text
        const maxWidth = noteCardWidth - notePadding * 2 - noteInnerPadding * 2;
        const words = noteText.split(" ");
        let line = "";
        let textY = noteY + notePadding + noteInnerPadding + 40;
        const lineHeight = 36;

        for (const word of words) {
          const testLine = line + word + " ";
          const metrics = finalCtx.measureText(testLine);
          if (metrics.width > maxWidth && line !== "") {
            finalCtx.fillText(line.trim(), noteX + noteCardWidth / 2, textY);
            line = word + " ";
            textY += lineHeight;
          } else {
            line = testLine;
          }
        }
        finalCtx.fillText(line.trim(), noteX + noteCardWidth / 2, textY);

        // Draw date at bottom right of note
        finalCtx.fillStyle = "#6B7280";
        finalCtx.font = "400 20px Georgia, serif";
        finalCtx.textAlign = "right";
        finalCtx.fillText(
          getCurrentDate(),
          noteX + noteCardWidth - notePadding - noteInnerPadding,
          noteY + noteCardHeight - notePadding - noteInnerPadding
        );

        // Download final canvas
        const link = document.createElement("a");
        link.download = `photobooth-${Date.now()}.png`;
        link.href = finalCanvas.toDataURL("image/png");
        link.click();
      } else {
        // Download just the photo strip
        const link = document.createElement("a");
        link.download = `photobooth-${Date.now()}.png`;
        link.href = canvas.toDataURL("image/png");
        link.click();
      }
    } catch (error) {
      console.error("Error generating composite:", error);
    } finally {
      setIsDownloading(false);
    }
  }, [photos, showNote, noteText]);

  // Start new session
  const handleNewSession = () => {
    clearPhotos();
    setMessage(null);
    router.push("/");
  };

  if (photos.length === 0) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-4 shrink-0"
      >
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Your Photo Strip</h1>
          <button
            onClick={handleNewSession}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            New Session
          </button>
        </div>
      </motion.header>

      {/* Photo Strip Display */}
      <div className="flex-1 overflow-auto px-4 py-6">
        <div className="max-w-md mx-auto flex flex-col items-center">
          {/* Tap instruction */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-sm text-gray-500 mb-4"
          >
            Tap the strip to {showNote ? "hide" : "show"} message
          </motion.p>

          {/* Photo Strip Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={handleToggle}
            className="relative cursor-pointer"
          >
            {/* Photo Strip */}
            <div
              className="relative bg-white rounded-lg shadow-xl p-4"
              style={{ width: "280px" }}
            >
              {/* Photos */}
              <div className="space-y-3">
                {photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="aspect-[3/4] bg-gray-200 rounded overflow-hidden"
                  >
                    <img
                      src={photo.dataUrl}
                      alt={`Photo ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ))}
              </div>

              {/* Date */}
              <div className="mt-4 text-center">
                <p className="text-gray-600 font-medium text-sm italic">
                  {getCurrentDate()}
                </p>
              </div>
            </div>

            {/* Note Card (appears in front when visible) */}
            <AnimatePresence>
              {showNote && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", damping: 20 }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ width: "260px" }}
                >
                  {/* Polaroid-style note card */}
                  <div className="bg-white rounded-lg shadow-2xl p-4">
                    {/* Cream/off-white inner area */}
                    <div
                      className="rounded flex flex-col justify-between"
                      style={{
                        backgroundColor: "#FAF8F5",
                        height: "280px",
                        padding: "24px"
                      }}
                    >
                      {/* Note text area */}
                      <textarea
                        value={noteText}
                        onChange={handleNoteChange}
                        onClick={(e) => e.stopPropagation()}
                        placeholder="Write your message here..."
                        className="w-full flex-1 bg-transparent text-gray-700 text-center text-2xl leading-relaxed resize-none focus:outline-none placeholder:text-gray-400 font-[family-name:var(--font-caveat)]"
                        maxLength={150}
                      />

                      {/* Date at bottom right */}
                      <div className="text-right mt-4">
                        <p className="text-gray-500 text-lg font-[family-name:var(--font-caveat)]">
                          {getCurrentDate()}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="shrink-0 bg-white border-t border-gray-200 px-4 py-4 safe-area-pb"
      >
        <div className="max-w-md mx-auto space-y-3">
          {/* Download Button */}
          <Button
            onClick={handleDownload}
            variant="primary"
            size="lg"
            fullWidth
            disabled={isDownloading}
          >
            <span className="flex items-center justify-center gap-2">
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Download Photo Strip</span>
                </>
              )}
            </span>
          </Button>

          {/* Back to Review */}
          <Button
            onClick={() => router.push("/review")}
            variant="outline"
            size="lg"
            fullWidth
          >
            <span className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 17l-5-5m0 0l5-5m-5 5h12"
                />
              </svg>
              <span>Back to Review</span>
            </span>
          </Button>
        </div>
      </motion.div>

      {/* Hidden canvas for generating composite */}
      <canvas ref={canvasRef} className="hidden" />
    </main>
  );
}
