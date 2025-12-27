import React, { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import type { Event, EventFormData } from '@/types';

interface EventFormProps {
  initialData?: Event;
  onSubmit: (data: EventFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function EventForm({ initialData, onSubmit, onCancel, isLoading }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    name: initialData?.name || '',
    event_date: initialData?.event_date || null,
    event_type: initialData?.event_type || 'wedding',
    is_active: initialData?.is_active || false,
    photos_per_session: initialData?.photos_per_session || 3,
    countdown_seconds: initialData?.countdown_seconds || 8,
    message_enabled: initialData?.message_enabled || false,
    message_char_limit: initialData?.message_char_limit || 100,
    default_layout: initialData?.default_layout || '3-vertical',
    stickers_enabled: initialData?.stickers_enabled || false,
    is_premium_frame_enabled: initialData?.is_premium_frame_enabled || false,
    security_code_enabled: initialData?.security_code_enabled || false,
    security_code: initialData?.security_code || '',
    voice_guidance_enabled: initialData?.voice_guidance_enabled || false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : type === 'number'
        ? parseInt(value)
        : value,
    }));

    // Clear error for this field
    if (errors[name as keyof EventFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Event name is required';
    }

    // photos_per_session is now determined by frame placeholders, no validation needed

    if (formData.countdown_seconds < 3 || formData.countdown_seconds > 30) {
      newErrors.countdown_seconds = 'Must be between 3 and 30';
    }

    if (formData.message_char_limit < 50 || formData.message_char_limit > 500) {
      newErrors.message_char_limit = 'Must be between 50 and 500';
    }

    if (formData.security_code_enabled && !formData.security_code?.trim()) {
      newErrors.security_code = 'Security code is required when enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>

        <Input
          label="Event Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          error={errors.name}
          placeholder="e.g., John & Jane's Wedding"
          required
        />

        <Input
          label="Event Date"
          name="event_date"
          type="date"
          value={formData.event_date || ''}
          onChange={handleChange}
          error={errors.event_date}
        />

        <Select
          label="Event Type"
          name="event_type"
          value={formData.event_type}
          onChange={handleChange}
          options={[
            { value: 'wedding', label: 'Wedding' },
            { value: 'birthday', label: 'Birthday' },
            { value: 'christening', label: 'Christening' },
            { value: 'corporate', label: 'Corporate' },
            { value: 'other', label: 'Other' },
          ]}
        />

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Set as active event
          </label>
        </div>
      </div>

      {/* Capture Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Capture Settings</h3>

        {/* Photos per session is now determined by frame placeholders */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-blue-800">Photos Per Session</p>
              <p className="text-sm text-blue-600 mt-1">
                The number of photos is now determined by each frame's placeholder count.
                Guests will select a frame before capturing, and the photo count will match the frame's placeholders.
              </p>
            </div>
          </div>
        </div>

        <Input
          label="Countdown Duration (seconds)"
          name="countdown_seconds"
          type="number"
          min={3}
          max={30}
          value={formData.countdown_seconds}
          onChange={handleChange}
          error={errors.countdown_seconds}
          helperText="Countdown time between photos (3-30 seconds)"
        />

        <Select
          label="Default Layout"
          name="default_layout"
          value={formData.default_layout}
          onChange={handleChange}
          options={[
            { value: '3-vertical', label: '3-Photo Vertical Strip' },
            { value: '2x2', label: '2x2 Grid' },
            { value: 'single', label: 'Single Photo' },
          ]}
        />
      </div>

      {/* Message Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Message Settings</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="message_enabled"
            name="message_enabled"
            checked={formData.message_enabled}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="message_enabled" className="text-sm font-medium text-gray-700">
            Enable message feature
          </label>
        </div>

        {formData.message_enabled && (
          <Input
            label="Message Character Limit"
            name="message_char_limit"
            type="number"
            min={50}
            max={500}
            value={formData.message_char_limit}
            onChange={handleChange}
            error={errors.message_char_limit}
            helperText="Maximum characters allowed in messages (50-500)"
          />
        )}
      </div>

      {/* Sticker Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sticker Settings</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="stickers_enabled"
            name="stickers_enabled"
            checked={formData.stickers_enabled}
            onChange={handleChange}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
          />
          <label htmlFor="stickers_enabled" className="text-sm font-medium text-gray-700">
            Enable stickers feature
          </label>
        </div>

        {formData.stickers_enabled && (
          <p className="text-sm text-gray-500">
            Users will be able to add stickers to their photos. Upload stickers in the Assets section after saving the event.
          </p>
        )}
      </div>

      {/* Premium Frame Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Premium Frame Settings</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_premium_frame_enabled"
            name="is_premium_frame_enabled"
            checked={formData.is_premium_frame_enabled}
            onChange={handleChange}
            className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
          />
          <label htmlFor="is_premium_frame_enabled" className="text-sm font-medium text-gray-700">
            Enable premium overlay frames
          </label>
        </div>

        {formData.is_premium_frame_enabled && (
          <p className="text-sm text-gray-500">
            Allows adding transparent PNG overlays on top of photos. Upload overlays in the Assets section after saving.
          </p>
        )}
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Settings</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="security_code_enabled"
            name="security_code_enabled"
            checked={formData.security_code_enabled}
            onChange={handleChange}
            className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
          />
          <label htmlFor="security_code_enabled" className="text-sm font-medium text-gray-700">
            Require security code to start session
          </label>
        </div>

        {formData.security_code_enabled && (
          <>
            <Input
              label="Security Code"
              name="security_code"
              value={formData.security_code || ''}
              onChange={handleChange}
              error={errors.security_code}
              placeholder="e.g., WEDDING2024"
              helperText="Operator must enter this code to start a photobooth session"
            />
            <p className="text-sm text-gray-500">
              This prevents unauthorized use of the photobooth. Share the code only with event staff/operators.
            </p>
          </>
        )}
      </div>

      {/* Interactive Experience Settings */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Interactive Experience</h3>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="voice_guidance_enabled"
            name="voice_guidance_enabled"
            checked={formData.voice_guidance_enabled}
            onChange={handleChange}
            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="voice_guidance_enabled" className="text-sm font-medium text-gray-700">
            Enable voice guidance
          </label>
        </div>

        {formData.voice_guidance_enabled && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Audio Instructions Enabled</p>
                <p className="text-sm text-green-600 mt-1">
                  Guests will hear voice prompts during the capture experience:
                </p>
                <ul className="text-sm text-green-600 mt-2 space-y-1 list-disc list-inside">
                  <li>&quot;Get ready!&quot; before the countdown starts</li>
                  <li>Countdown: &quot;3, 2, 1&quot;</li>
                  <li>&quot;Smile!&quot; at capture moment</li>
                  <li>Encouraging phrases between photos</li>
                  <li>&quot;All done!&quot; after the session</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {initialData ? 'Updating...' : 'Creating...'}
            </span>
          ) : (
            initialData ? 'Update Event' : 'Create Event'
          )}
        </Button>
      </div>
    </form>
  );
}
