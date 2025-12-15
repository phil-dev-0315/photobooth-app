"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { Button } from "@/components/ui/Button";
import { toPng } from "html-to-image";
import { QRCodeSVG } from "qrcode.react";

const PHOTOS_PER_SESSION = 3;

export default function CompositePage() {
  const router = useRouter();
  const { photos, message, setMessage, clearPhotos } = useSession();
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState(message || "");
  const [isDownloading, setIsDownloading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string>("");
  const [showQR, setShowQR] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const captureRef = useRef<HTMLDivElement>(null);

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

  // Capture the photo strip using html-to-image
  const capturePhotoStrip = async (includeNote: boolean): Promise<string | null> => {
    if (!captureRef.current) return null;

    try {
      // Temporarily set note visibility if needed
      const originalShowNote = showNote;
      if (includeNote && !showNote) {
        setShowNote(true);
        // Wait for animation to complete
        await new Promise(resolve => setTimeout(resolve, 500));
      } else if (!includeNote && showNote) {
        setShowNote(false);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Use html-to-image which handles modern CSS better
      const dataUrl = await toPng(captureRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#f3f4f6",
      });

      // Restore original state
      if (originalShowNote !== showNote) {
        setShowNote(originalShowNote);
      }

      return dataUrl;
    } catch (error) {
      console.error("Error capturing photo strip:", error);
      return null;
    }
  };

  // Download strip only
  const handleDownloadStripOnly = async () => {
    setIsDownloading(true);
    setErrorMessage("");
    try {
      const dataUrl = await capturePhotoStrip(false);
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `photobooth-strip-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        setErrorMessage("Failed to capture photo strip. Please try again.");
      }
    } catch (error) {
      console.error("Error downloading strip:", error);
      setErrorMessage("Error downloading image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Download with note
  const handleDownloadWithNote = async () => {
    setIsDownloading(true);
    setErrorMessage("");
    try {
      const dataUrl = await capturePhotoStrip(true);
      if (dataUrl) {
        const link = document.createElement("a");
        link.download = `photobooth-with-note-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } else {
        setErrorMessage("Failed to capture image. Please try again.");
      }
    } catch (error) {
      console.error("Error downloading with note:", error);
      setErrorMessage("Error downloading image. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Generate QR code
  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    setErrorMessage("");
    try {
      const dataUrl = await capturePhotoStrip(showNote);
      if (dataUrl) {
        setQrCodeData(dataUrl);
        setShowQR(true);
      } else {
        setErrorMessage("Failed to generate QR code. Please try again.");
      }
    } catch (error) {
      console.error("Error generating QR code:", error);
      setErrorMessage("Error generating QR code. Please try again.");
    } finally {
      setIsGeneratingQR(false);
    }
  };

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
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
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
      <div className="flex-1 overflow-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-8 items-center justify-center">
            {/* Photo Strip and Note Container */}
            <div
              ref={captureRef}
              className="relative flex items-center justify-center"
              style={{ minHeight: "700px", width: "800px" }}
            >
            {/* Photo Strip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotate: -3 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: -3,
                y: 0
              }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20
              }}
              onClick={handleToggle}
              className="relative cursor-pointer"
              style={{
                transformOrigin: "center center",
                zIndex: showNote ? 5 : 10
              }}
            >
              {/* Film strip with perforated edges */}
              <div className="relative bg-white shadow-2xl" style={{ width: "340px" }}>
                {/* Perforated edges */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-around py-3">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={`left-${i}`}
                      className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"
                      style={{ marginLeft: "-6px" }}
                    />
                  ))}
                </div>
                <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-around py-3">
                  {[...Array(24)].map((_, i) => (
                    <div
                      key={`right-${i}`}
                      className="w-3 h-3 rounded-full bg-gray-200 border border-gray-300"
                      style={{ marginRight: "-6px" }}
                    />
                  ))}
                </div>

                {/* Inner content */}
                <div className="px-8 py-6">
                  {/* Photos */}
                  <div className="space-y-2">
                    {photos.map((photo, index) => (
                      <motion.div
                        key={photo.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="aspect-[4/3] bg-gray-200 overflow-hidden"
                      >
                        <img
                          src={photo.dataUrl}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Branding Section */}
                  <div className="mt-4 text-center space-y-1">
                    {/* Camera Icon */}
                    <div className="flex justify-center">
                      <svg
                        className="w-10 h-10 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
                        <path d="M12 9c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z"/>
                      </svg>
                    </div>

                    {/* Title */}
                    <h2 className="text-xl font-semibold text-gray-700">
                      Memories
                    </h2>

                    {/* Date */}
                    <p className="text-sm text-gray-600">
                      {getCurrentDate()}
                    </p>

                    {/* Hashtag */}
                    <p className="text-sm text-blue-600 font-medium">
                      #SummerVibes
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Polaroid Note Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
              animate={{
                opacity: 1,
                scale: 1,
                rotate: 5,
                x: showNote ? 50 : -180,
                y: showNote ? -30 : 180,
                zIndex: showNote ? 10 : 5
              }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 18
              }}
              onClick={handleToggle}
              className="absolute cursor-pointer"
              style={{
                width: "380px",
                transformOrigin: "center center"
              }}
            >
              {/* Polaroid card */}
              <div className="bg-white shadow-2xl p-4">
                {/* Cream inner area */}
                <div
                  className="flex flex-col justify-center items-center"
                  style={{
                    backgroundColor: "#FFF9E6",
                    minHeight: "340px",
                    padding: "32px"
                  }}
                >
                  {/* Note text area */}
                  <textarea
                    value={noteText}
                    onChange={handleNoteChange}
                    onClick={(e) => e.stopPropagation()}
                    placeholder="Best summer ever! These memories will last forever"
                    className="w-full flex-1 bg-transparent text-gray-700 text-center text-2xl italic leading-relaxed resize-none focus:outline-none placeholder:text-gray-500"
                    style={{
                      fontFamily: "Georgia, serif",
                      minHeight: "200px"
                    }}
                    maxLength={150}
                  />

                  {/* Toggle instruction */}
                  <p className="text-gray-500 text-base mt-4" style={{ fontFamily: "Georgia, serif" }}>
                    ~ Click to toggle ~
                  </p>
                </div>
              </div>
            </motion.div>
            </div>

            {/* QR Code Card */}
            <AnimatePresence>
              {showQR && qrCodeData && (
                <motion.div
                  initial={{ opacity: 0, x: 50, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 50, scale: 0.9 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="bg-white rounded-lg shadow-2xl p-6"
                  style={{ width: "300px" }}
                >
                  <div className="text-center space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Scan to Download
                    </h3>
                    <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block">
                      <QRCodeSVG
                        value={qrCodeData}
                        size={200}
                        level="H"
                        includeMargin={true}
                      />
                    </div>
                    <p className="text-sm text-gray-600">
                      Scan this QR code with your phone to download the image
                    </p>
                    <button
                      onClick={() => setShowQR(false)}
                      className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="shrink-0 bg-white border-t border-gray-200 px-4 py-4 safe-area-pb"
      >
        <div className="max-w-4xl mx-auto">
          {/* Error Message */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* Download Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Download Strip Only */}
            <Button
              onClick={handleDownloadStripOnly}
              variant="primary"
              size="lg"
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
                    <span>Strip Only</span>
                  </>
                )}
              </span>
            </Button>

            {/* Download With Note */}
            <Button
              onClick={handleDownloadWithNote}
              variant="primary"
              size="lg"
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
                    <span>With Note</span>
                  </>
                )}
              </span>
            </Button>

            {/* Generate QR Code */}
            <Button
              onClick={handleGenerateQR}
              variant="outline"
              size="lg"
              disabled={isGeneratingQR}
            >
              <span className="flex items-center justify-center gap-2">
                {isGeneratingQR ? (
                  <>
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
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
                        d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                      />
                    </svg>
                    <span>Generate QR</span>
                  </>
                )}
              </span>
            </Button>
          </div>

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
    </main>
  );
}
