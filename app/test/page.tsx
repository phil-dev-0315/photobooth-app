"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

export default function TestPage() {
  const [status, setStatus] = useState<{
    connection: 'pending' | 'success' | 'error';
    tables: 'pending' | 'success' | 'error';
    storage: 'pending' | 'success' | 'error';
    errors: string[];
  }>({
    connection: 'pending',
    tables: 'pending',
    storage: 'pending',
    errors: [],
  });

  useEffect(() => {
    testSupabase();
  }, []);

  const testSupabase = async () => {
    const errors: string[] = [];

    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL is not set');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
    }

    if (errors.length > 0) {
      setStatus({ connection: 'error', tables: 'error', storage: 'error', errors });
      return;
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Test 1: Connection
    try {
      const { data, error } = await supabase.from('events').select('count');
      if (error && error.code !== 'PGRST116') {
        errors.push(`Connection error: ${error.message}`);
        setStatus(prev => ({ ...prev, connection: 'error', errors }));
      } else {
        setStatus(prev => ({ ...prev, connection: 'success' }));
      }
    } catch (error: any) {
      errors.push(`Connection failed: ${error.message}`);
      setStatus(prev => ({ ...prev, connection: 'error', errors }));
      return;
    }

    // Test 2: Tables exist
    try {
      const tables = ['events', 'event_layouts', 'sessions', 'photos'];
      for (const table of tables) {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error && !error.message.includes('JWT')) {
          errors.push(`Table '${table}' error: ${error.message}`);
        }
      }

      if (errors.some(e => e.includes('Table'))) {
        setStatus(prev => ({ ...prev, tables: 'error', errors }));
      } else {
        setStatus(prev => ({ ...prev, tables: 'success' }));
      }
    } catch (error: any) {
      errors.push(`Tables check failed: ${error.message}`);
      setStatus(prev => ({ ...prev, tables: 'error', errors }));
    }

    // Test 3: Storage buckets
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) {
        errors.push(`Storage error: ${error.message}`);
        setStatus(prev => ({ ...prev, storage: 'error', errors }));
      } else {
        const requiredBuckets = ['frames', 'logos', 'photos', 'composites'];
        const existingBuckets = buckets?.map(b => b.name) || [];
        const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

        if (missingBuckets.length > 0) {
          errors.push(`Missing storage buckets: ${missingBuckets.join(', ')}`);
          setStatus(prev => ({ ...prev, storage: 'error', errors }));
        } else {
          setStatus(prev => ({ ...prev, storage: 'success' }));
        }
      }
    } catch (error: any) {
      errors.push(`Storage check failed: ${error.message}`);
      setStatus(prev => ({ ...prev, storage: 'error', errors }));
    }

    setStatus(prev => ({ ...prev, errors }));
  };

  const StatusIcon = ({ state }: { state: 'pending' | 'success' | 'error' }) => {
    if (state === 'pending') {
      return <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />;
    }
    if (state === 'success') {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Supabase Connection Test</h1>

        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          {/* Connection Test */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Supabase Connection</h3>
              <p className="text-sm text-gray-600">Testing connection to Supabase</p>
            </div>
            <StatusIcon state={status.connection} />
          </div>

          {/* Tables Test */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Database Tables</h3>
              <p className="text-sm text-gray-600">Checking events, sessions, photos tables</p>
            </div>
            <StatusIcon state={status.tables} />
          </div>

          {/* Storage Test */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h3 className="font-semibold text-gray-900">Storage Buckets</h3>
              <p className="text-sm text-gray-600">Verifying frames, logos, photos, composites buckets</p>
            </div>
            <StatusIcon state={status.storage} />
          </div>
        </div>

        {/* Errors */}
        {status.errors.length > 0 && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-900 mb-3">Errors Found:</h3>
            <ul className="space-y-2">
              {status.errors.map((error, i) => (
                <li key={i} className="text-sm text-red-700 flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Success Message */}
        {status.connection === 'success' && status.tables === 'success' && status.storage === 'success' && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-900">All Tests Passed!</h3>
                <p className="text-sm text-green-700">Your Supabase setup is working correctly.</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-4">
          <a
            href="/admin/login"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Test Admin Login
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition"
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
