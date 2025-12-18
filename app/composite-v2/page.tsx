"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { getActiveEvent, getEventLayouts, getEventStickers } from "@/lib/events";
import PhotoCompositor, { PhotoCompositorHandle } from "@/components/PhotoCompositor";
import { Button } from "@/components/ui/Button";
import { useSessionSave } from "@/hooks/useSessionSave";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { PrintOverlay } from "@/components/PrintAnimation";
import EmailModal from "@/components/EmailModal";
import type { Event, EventLayout, Sticker, PlacedSticker } from "@/types";

export default function CompositeV2Page() {
  const router = useRouter();
  const { photos, message, clearPhotos } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [layouts, setLayouts] = useState<EventLayout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<EventLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const compositorRef = useRef<PhotoCompositorHandle>(null);

  // Session save state
  const { saveSession, isLoading: isSaving, error: saveError, sessionData, reset: resetSaveState } = useSessionSave();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  // Sticker state
  const [availableStickers, setAvailableStickers] = useState<Sticker[]>([]);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [showStickerPanel, setShowStickerPanel] = useState(false);

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      router.replace("/capture");
    }
  }, [photos.length, router]);

  // Load active event, layouts, and stickers
  useEffect(() => {
    const loadEventData = async () => {
      try {
        setIsLoading(true);
        const activeEvent = await getActiveEvent();

        if (activeEvent) {
          setEvent(activeEvent);
          const eventLayouts = await getEventLayouts(activeEvent.id);
          setLayouts(eventLayouts);

          // Select default layout or first layout
          const defaultLayout = eventLayouts.find((l) => l.is_default) || eventLayouts[0];
          setSelectedLayout(defaultLayout || null);

          // Load stickers if enabled
          if (activeEvent.stickers_enabled) {
            try {
              const stickers = await getEventStickers(activeEvent.id);
              setAvailableStickers(stickers);
            } catch (err) {
              console.error("Error loading stickers:", err);
            }
          }
        }
      } catch (error) {
        console.error("Error loading event data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
  }, []);

  // Sticker handlers
  const handleAddSticker = useCallback((sticker: Sticker) => {
    const canvasWidth = selectedLayout?.width || 1080;
    const canvasHeight = selectedLayout?.height || 1920;

    const newPlacedSticker: PlacedSticker = {
      id: `placed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stickerId: sticker.id,
      url: sticker.url,
      x: canvasWidth / 2 - 75, // Center horizontally
      y: canvasHeight / 2 - 75, // Center vertically
      width: 150,
      height: 150,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setPlacedStickers((prev) => [...prev, newPlacedSticker]);
    setSelectedStickerId(newPlacedSticker.id);
  }, [selectedLayout]);

  const handleStickerChange = useCallback((id: string, attrs: Partial<PlacedSticker>) => {
    setPlacedStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...attrs } : s))
    );
  }, []);

  const handleStickerDelete = useCallback((id: string) => {
    setPlacedStickers((prev) => prev.filter((s) => s.id !== id));
    if (selectedStickerId === id) {
      setSelectedStickerId(null);
    }
  }, [selectedStickerId]);

  const handleClearAllStickers = useCallback(() => {
    setPlacedStickers([]);
    setSelectedStickerId(null);
  }, []);

  const handleDownload = () => {
    if (compositorRef.current) {
      setIsDownloading(true);
      try {
        const dataUrl = compositorRef.current.exportImage();
        if (dataUrl) {
          const link = document.createElement("a");
          link.download = `photobooth-${Date.now()}.png`;
          link.href = dataUrl;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          alert("Failed to generate image");
        }
      } catch (error) {
        console.error("Error downloading composite:", error);
        alert("Failed to download image");
      } finally {
        setIsDownloading(false);
      }
    } else {
      alert("Compositor not ready");
    }
  };

  const handleLayoutChange = (layout: EventLayout) => {
    setSelectedLayout(layout);
  };

  // Save session handler
  const handleSaveSession = async () => {
    if (!compositorRef.current || !event) return;

    try {
      const dataUrl = compositorRef.current.exportImage();
      if (dataUrl) {
        await saveSession(dataUrl, event.id, message || undefined);
      } else {
        alert("Failed to generate image for saving");
      }
    } catch (error) {
      console.error("Error saving session:", error);
      alert("Failed to save session");
    }
  };

  // Print handler
  const handlePrint = () => {
    setIsPrinting(true);
  };

  const handlePrintComplete = () => {
    setIsPrinting(false);
    window.print();
  };

  // Start new session
  const handleNewSession = () => {
    clearPhotos();
    resetSaveState();
    router.push("/capture");
  };

  if (photos.length === 0) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-4 shrink-0"
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Composite</h1>
            {event && (
              <p className="text-sm text-gray-600">{event.name}</p>
            )}
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            New Session
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-8">
          {/* Mobile Layout */}
          <div className="lg:hidden space-y-4">
            {/* Preview */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <PhotoCompositor
                ref={compositorRef}
                photos={photos}
                frameUrl={selectedLayout?.frame_url}
                logoUrl={event?.logo_url}
                message={selectedLayout?.include_message ? message : null}
                layout={event?.default_layout as any}
                width={selectedLayout?.width || 1080}
                height={selectedLayout?.height || 1920}
                placeholders={selectedLayout?.placeholders || []}
                overlays={event?.is_premium_frame_enabled ? selectedLayout?.overlays || [] : []}
                // Sticker props
                stickers={placedStickers}
                selectedStickerId={selectedStickerId}
                onStickerSelect={setSelectedStickerId}
                onStickerChange={handleStickerChange}
                onStickerDelete={handleStickerDelete}
              />
              {selectedStickerId && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Tap sticker to select. Press Delete key or use button below to remove.
                </p>
              )}
            </div>

            {/* Sticker Panel - Mobile */}
            {event?.stickers_enabled && availableStickers.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    Add Stickers
                  </h3>
                  {placedStickers.length > 0 && (
                    <button
                      onClick={handleClearAllStickers}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Clear All ({placedStickers.length})
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {availableStickers.map((sticker) => (
                    <button
                      key={sticker.id}
                      onClick={() => handleAddSticker(sticker)}
                      className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition p-1"
                    >
                      <img
                        src={sticker.url}
                        alt={sticker.name}
                        className="w-full h-full object-contain"
                      />
                    </button>
                  ))}
                </div>
                {selectedStickerId && (
                  <button
                    onClick={() => handleStickerDelete(selectedStickerId)}
                    className="mt-3 w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                  >
                    Remove Selected Sticker
                  </button>
                )}
              </div>
            )}

            {/* Layout Selection */}
            {layouts.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  Choose Frame
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {layouts.map((layout) => (
                    <button
                      key={layout.id}
                      onClick={() => handleLayoutChange(layout)}
                      className={`aspect-square border-2 rounded-lg overflow-hidden transition ${
                        selectedLayout?.id === layout.id
                          ? "border-blue-600 ring-2 ring-blue-200"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {layout.frame_url ? (
                        <img
                          src={layout.frame_url}
                          alt="Frame preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                          No Frame
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {/* Show success state with QR code after saving */}
              {sessionData ? (
                <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Photo Saved!</h3>
                    <p className="text-sm text-gray-500 mt-1">Scan QR code to download on your phone</p>
                  </div>

                  <QRCodeDisplay sessionCode={sessionData.sessionCode} size={180} />

                  <div className="space-y-3">
                    <Button onClick={handleDownload} variant="outline" size="lg" fullWidth disabled={isDownloading}>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </span>
                    </Button>

                    <Button onClick={handlePrint} variant="outline" size="lg" fullWidth>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Print</span>
                      </span>
                    </Button>

                    <Button onClick={() => setIsEmailModalOpen(true)} variant="outline" size="lg" fullWidth>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Email</span>
                      </span>
                    </Button>

                    <Button onClick={handleNewSession} variant="primary" size="lg" fullWidth>
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Start New Session</span>
                      </span>
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Save Error */}
                  {saveError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                      {saveError}
                    </div>
                  )}

                  <Button
                    onClick={handleSaveSession}
                    variant="primary"
                    size="lg"
                    fullWidth
                    disabled={isSaving}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isSaving ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Finish & Save</span>
                        </>
                      )}
                    </span>
                  </Button>

                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    size="lg"
                    fullWidth
                    disabled={isDownloading}
                  >
                    <span className="flex items-center justify-center gap-2">
                      {isDownloading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                          <span>Downloading...</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download Only</span>
                        </>
                      )}
                    </span>
                  </Button>

                  <Button
                    onClick={() => router.push("/review")}
                    variant="ghost"
                    size="lg"
                    fullWidth
                  >
                    Back to Review
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8">
            {/* Preview Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Preview
                  </h2>
                  {selectedStickerId && (
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                      Sticker selected - drag to move, corners to resize
                    </span>
                  )}
                </div>
                <PhotoCompositor
                  ref={compositorRef}
                  photos={photos}
                  frameUrl={selectedLayout?.frame_url}
                  logoUrl={event?.logo_url}
                  message={selectedLayout?.include_message ? message : null}
                  layout={event?.default_layout as any}
                  width={selectedLayout?.width || 1080}
                  height={selectedLayout?.height || 1920}
                  placeholders={selectedLayout?.placeholders || []}
                  overlays={event?.is_premium_frame_enabled ? selectedLayout?.overlays || [] : []}
                  // Sticker props
                  stickers={placedStickers}
                  selectedStickerId={selectedStickerId}
                  onStickerSelect={setSelectedStickerId}
                  onStickerChange={handleStickerChange}
                  onStickerDelete={handleStickerDelete}
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Layout Selection */}
              {layouts.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Choose Frame
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {layouts.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => handleLayoutChange(layout)}
                        className={`aspect-square border-2 rounded-lg overflow-hidden transition ${
                          selectedLayout?.id === layout.id
                            ? "border-blue-600 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {layout.frame_url ? (
                          <img
                            src={layout.frame_url}
                            alt="Frame preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
                            No Frame
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Sticker Panel - Desktop */}
              {event?.stickers_enabled && availableStickers.length > 0 && (
                <div className="bg-white rounded-lg shadow-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Add Stickers
                    </h3>
                    {placedStickers.length > 0 && (
                      <button
                        onClick={handleClearAllStickers}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        Clear All ({placedStickers.length})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableStickers.map((sticker) => (
                      <button
                        key={sticker.id}
                        onClick={() => handleAddSticker(sticker)}
                        className="aspect-square border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 hover:shadow-md transition p-1"
                        title={sticker.name}
                      >
                        <img
                          src={sticker.url}
                          alt={sticker.name}
                          className="w-full h-full object-contain"
                        />
                      </button>
                    ))}
                  </div>
                  {selectedStickerId && (
                    <button
                      onClick={() => handleStickerDelete(selectedStickerId)}
                      className="mt-4 w-full py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove Selected Sticker
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    Click a sticker to add it. Drag to move, use corners to resize and rotate.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-4">
                {sessionData ? (
                  <>
                    <div className="text-center mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Photo Saved!</h3>
                    </div>

                    <QRCodeDisplay sessionCode={sessionData.sessionCode} size={160} />

                    <div className="space-y-3 pt-4">
                      <Button onClick={handleDownload} variant="outline" size="lg" fullWidth disabled={isDownloading}>
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          <span>Download</span>
                        </span>
                      </Button>

                      <Button onClick={handlePrint} variant="outline" size="lg" fullWidth>
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                          </svg>
                          <span>Print</span>
                        </span>
                      </Button>

                      <Button onClick={() => setIsEmailModalOpen(true)} variant="outline" size="lg" fullWidth>
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>Email</span>
                        </span>
                      </Button>

                      <Button onClick={handleNewSession} variant="primary" size="lg" fullWidth>
                        <span className="flex items-center justify-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          <span>Start New Session</span>
                        </span>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Actions
                    </h3>

                    {saveError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                        {saveError}
                      </div>
                    )}

                    <Button
                      onClick={handleSaveSession}
                      variant="primary"
                      size="lg"
                      fullWidth
                      disabled={isSaving}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isSaving ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Finish & Save</span>
                          </>
                        )}
                      </span>
                    </Button>

                    <Button
                      onClick={handleDownload}
                      variant="outline"
                      size="lg"
                      fullWidth
                      disabled={isDownloading}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {isDownloading ? (
                          <>
                            <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            <span>Downloading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span>Download Only</span>
                          </>
                        )}
                      </span>
                    </Button>

                    <Button
                      onClick={() => router.push("/review")}
                      variant="ghost"
                      size="lg"
                      fullWidth
                    >
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                        </svg>
                        <span>Back to Review</span>
                      </span>
                    </Button>
                  </>
                )}
              </div>

              {/* Event Info */}
              {event && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Event Details
                  </h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Type:</strong> {event.event_type}</p>
                    {event.event_date && (
                      <p>
                        <strong>Date:</strong>{" "}
                        {new Date(event.event_date).toLocaleDateString()}
                      </p>
                    )}
                    <p><strong>Layout:</strong> {event.default_layout}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Print Animation Overlay */}
      <PrintOverlay
        isVisible={isPrinting}
        compositeUrl={sessionData?.compositeUrl || ""}
        onComplete={handlePrintComplete}
      />

      {/* Email Modal */}
      {sessionData && (
        <EmailModal
          isOpen={isEmailModalOpen}
          onClose={() => setIsEmailModalOpen(false)}
          compositeUrl={sessionData.compositeUrl}
          sessionCode={sessionData.sessionCode}
          eventName={event?.name}
        />
      )}
    </main>
  );
}
