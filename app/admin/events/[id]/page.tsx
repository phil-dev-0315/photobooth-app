"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getEventById, updateEvent } from '@/lib/events';
import { EventForm } from '@/components/admin/EventForm';
import type { Event, EventFormData } from '@/types';

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const data = await getEventById(eventId);
      if (!data) {
        alert('Event not found');
        router.push('/admin/events');
        return;
      }
      setEvent(data);
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
      router.push('/admin/events');
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      await updateEvent(eventId, data);
      router.push('/admin/events');
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to update event');
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-sm text-gray-600 mt-1">
            {event.name}
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventForm
          initialData={event}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/events')}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
