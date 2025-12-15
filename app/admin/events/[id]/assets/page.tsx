"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getEventById, getEventLayouts } from "@/lib/events";
import FrameUploader from "@/components/admin/FrameUploader";
import AssetUploader from "@/components/admin/AssetUploader";
import StickerUploader from "@/components/admin/StickerUploader";
import type { Event, EventLayout } from "@/types";

export default function EventAssetsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [layouts, setLayouts] = useState<EventLayout[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [eventData, layoutsData] = await Promise.all([
        getEventById(eventId),
        getEventLayouts(eventId),
      ]);

      if (!eventData) {
        alert("Event not found");
        router.push("/admin/events");
        return;
      }

      setEvent(eventData);
      setLayouts(layoutsData);
    } catch (error: any) {
      console.error("Error loading data:", error);
      alert(`Failed to load event: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return null;
  }

  const frameLayouts = layouts.filter((l) => l.frame_url);
  const logoLayouts = layouts.filter((l) => l.include_logo && l.frame_url);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/admin/events")}
            className="text-sm text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Events
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Assets
              </h1>
              <p className="mt-1 text-gray-600">
                Upload frames, backgrounds, and logos for {event.name}
              </p>
            </div>
          </div>
        </div>

        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-600">Event Name</p>
              <p className="font-semibold text-gray-900">{event.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Event Type</p>
              <p className="font-semibold text-gray-900 capitalize">
                {event.event_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  event.is_active
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {event.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        {/* Frame Uploader */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <FrameUploader
            eventId={eventId}
            photosPerSession={event.photos_per_session}
            existingLayouts={frameLayouts}
            onUploadComplete={loadData}
          />
        </div>

        {/* Logos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <AssetUploader
            eventId={eventId}
            assetType="logo"
            existingAssets={logoLayouts}
            onUploadComplete={loadData}
          />
        </div>

        {/* Stickers - Only show if stickers are enabled for this event */}
        {event.stickers_enabled ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <StickerUploader
              eventId={eventId}
              onUploadComplete={loadData}
            />
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-6">
            <div className="text-center">
              <svg
                className="w-12 h-12 text-gray-300 mx-auto mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-sm font-medium text-gray-900 mb-1">Stickers Disabled</h3>
              <p className="text-sm text-gray-500">
                Enable stickers in the{" "}
                <button
                  onClick={() => router.push(`/admin/events/${eventId}`)}
                  className="text-purple-600 hover:text-purple-500 font-medium"
                >
                  event settings
                </button>{" "}
                to upload stickers.
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            How to Create Frames
          </h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              <strong>Step 1:</strong> Upload a PNG image (with or without transparency)
            </li>
            <li>
              <strong>Step 2:</strong> Define photo placeholders by drawing rectangles or using Auto-Generate
            </li>
            <li>
              <strong>Step 3:</strong> Adjust dimensions to match your desired output size
            </li>
            <li>
              Photos will be cropped to fill each placeholder while maintaining aspect ratio
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
