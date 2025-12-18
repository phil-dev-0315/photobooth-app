"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import EmailModal from '@/components/EmailModal';

interface SessionData {
  id: string;
  sessionCode: string;
  compositeUrl: string | null;
  message: string | null;
  createdAt: string;
  event: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

interface DownloadClientProps {
  session: SessionData;
}

export default function DownloadClient({ session }: DownloadClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);

  const handleDownload = async () => {
    if (!session.compositeUrl) return;

    setIsDownloading(true);

    try {
      // Fetch the image
      const response = await fetch(session.compositeUrl);
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `photobooth-${session.sessionCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download photo. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!session.compositeUrl) return;

    if (navigator.share) {
      try {
        // Fetch the image as blob for sharing
        const response = await fetch(session.compositeUrl);
        const blob = await response.blob();
        const file = new File([blob], `photobooth-${session.sessionCode}.png`, {
          type: 'image/png',
        });

        await navigator.share({
          title: session.event?.name || 'Photobooth',
          text: session.message || 'Check out my photobooth picture!',
          files: [file],
        });
      } catch (error: any) {
        // User cancelled or share failed
        if (error.name !== 'AbortError') {
          console.error('Share error:', error);
        }
      }
    } else {
      // Fallback: copy link to clipboard
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      } catch (error) {
        console.error('Clipboard error:', error);
      }
    }
  };

  const formattedDate = new Date(session.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-3">
          {session.event?.logo_url && (
            <img
              src={session.event.logo_url}
              alt={session.event.name}
              className="h-10 w-auto object-contain"
            />
          )}
          <h1 className="text-lg font-semibold text-gray-900">
            {session.event?.name || 'Photobooth'}
          </h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          {/* Photo */}
          {session.compositeUrl ? (
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <img
                src={session.compositeUrl}
                alt="Your photo"
                className="w-full h-auto"
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
              <svg
                className="w-16 h-16 text-gray-300 mx-auto mb-4"
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
              <p className="text-gray-500">Photo not available</p>
            </div>
          )}

          {/* Message */}
          {session.message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-center"
            >
              <p className="text-gray-600 italic">"{session.message}"</p>
            </motion.div>
          )}

          {/* Date */}
          <p className="text-center text-sm text-gray-400 mt-3">
            {formattedDate}
          </p>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 space-y-3"
          >
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={!session.compositeUrl || isDownloading}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              {isDownloading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  <span>Save Photo</span>
                </>
              )}
            </button>

            {/* Share Button */}
            <button
              onClick={handleShare}
              disabled={!session.compositeUrl}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-gray-50 disabled:bg-gray-100 text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                />
              </svg>
              <span>Share</span>
            </button>

            {/* Email Button - Disabled until custom domain is configured */}
            <button
              onClick={() => setIsEmailModalOpen(true)}
              disabled
              title="Coming soon"
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed text-gray-700 font-semibold rounded-xl border border-gray-200 shadow-sm transition-all active:scale-[0.98]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <span>Email Photo (Coming Soon)</span>
            </button>
          </motion.div>

          {/* Session Code */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Session: {session.sessionCode}
          </p>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        Powered by Photobooth App
      </footer>

      {/* Email Modal */}
      <EmailModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        compositeUrl={session.compositeUrl || ''}
        sessionCode={session.sessionCode}
        eventName={session.event?.name}
      />
    </main>
  );
}
