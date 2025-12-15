"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '@/lib/events';
import { EventForm } from '@/components/admin/EventForm';
import type { EventFormData } from '@/types';

export default function NewEventPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (data: EventFormData) => {
    setIsLoading(true);
    try {
      await createEvent(data);
      router.push('/admin/events');
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
          <p className="text-sm text-gray-600 mt-1">
            Set up a new photobooth event
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EventForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/admin/events')}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
