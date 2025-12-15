"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useSession } from "@/contexts/SessionContext";
import { getActiveEvent, getEventLayouts } from "@/lib/events";
import PhotoCompositor, { PhotoCompositorHandle } from "@/components/PhotoCompositor";
import { Button } from "@/components/ui/Button";
import type { Event, EventLayout } from "@/types";

export default function CompositeV2Page() {
  const router = useRouter();
  const { photos, message } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [layouts, setLayouts] = useState<EventLayout[]>([]);
  const [selectedLayout, setSelectedLayout] = useState<EventLayout | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const compositorRef = useRef<PhotoCompositorHandle>(null);

  // Redirect if no photos
  useEffect(() => {
    if (photos.length === 0) {
      router.replace("/capture");
    }
  }, [photos.length, router]);

  // Load active event and layouts
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
        }
      } catch (error) {
        console.error("Error loading event data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadEventData();
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
              />
            </div>

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
                      <span>Downloading...</span>
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
                      <span>Download</span>
                    </>
                  )}
                </span>
              </Button>

              <Button
                onClick={() => router.push("/review")}
                variant="outline"
                size="lg"
                fullWidth
              >
                Back to Review
              </Button>
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:grid lg:grid-cols-3 gap-8">
            {/* Preview Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Preview
                </h2>
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

              {/* Download Actions */}
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Download
                </h3>

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
                        <span>Downloading...</span>
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
                        <span>Download High Quality</span>
                      </>
                    )}
                  </span>
                </Button>

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
    </main>
  );
}
