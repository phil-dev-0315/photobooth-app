"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { getEvents, deleteEvent, setActiveEvent } from '@/lib/events';
import type { Event } from '@/types';
import { Button } from '@/components/ui/Button';

export default function EventsListPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    setDeletingId(id);
    try {
      await deleteEvent(id);
      await loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      await setActiveEvent(id);
      await loadEvents();
    } catch (error) {
      console.error('Error setting active event:', error);
      alert('Failed to set active event');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Events</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your photobooth events
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => router.push('/admin')}
                variant="outline"
              >
                Back to Dashboard
              </Button>
              <Button
                onClick={() => router.push('/admin/events/new')}
                variant="primary"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Event
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {events.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h3>
            <p className="text-gray-600 mb-6">
              Get started by creating your first photobooth event
            </p>
            <Button
              onClick={() => router.push('/admin/events/new')}
              variant="primary"
            >
              Create Your First Event
            </Button>
          </div>
        ) : (
          <div className="grid gap-6">
            {events.map((event, index) => (
              <EventCard
                key={event.id}
                event={event}
                index={index}
                onEdit={() => router.push(`/admin/events/${event.id}`)}
                onAssets={() => router.push(`/admin/events/${event.id}/assets`)}
                onDelete={() => handleDelete(event.id, event.name)}
                onSetActive={() => handleSetActive(event.id)}
                isDeleting={deletingId === event.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EventCard({
  event,
  index,
  onEdit,
  onAssets,
  onDelete,
  onSetActive,
  isDeleting,
}: {
  event: Event;
  index: number;
  onEdit: () => void;
  onAssets: () => void;
  onDelete: () => void;
  onSetActive: () => void;
  isDeleting: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`bg-white rounded-lg shadow p-6 ${event.is_active ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-xl font-semibold text-gray-900">{event.name}</h3>
            {event.is_active && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div>
              <p className="text-xs text-gray-500">Type</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{event.event_type}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Date</p>
              <p className="text-sm font-medium text-gray-900">
                {event.event_date ? new Date(event.event_date).toLocaleDateString() : 'Not set'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Photos/Session</p>
              <p className="text-sm font-medium text-gray-900">{event.photos_per_session}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Countdown</p>
              <p className="text-sm font-medium text-gray-900">{event.countdown_seconds}s</p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            {event.message_enabled && (
              <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                Messages Enabled
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-2 ml-4">
          {!event.is_active && (
            <button
              onClick={onSetActive}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
              title="Set as active"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
          )}
          <button
            onClick={onAssets}
            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
            title="Manage Assets"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
            title="Edit"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
            title="Delete"
          >
            {isDeleting ? (
              <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
