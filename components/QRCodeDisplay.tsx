"use client";

import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeDisplayProps {
  sessionCode: string;
  size?: number;
  showCopyButton?: boolean;
}

export default function QRCodeDisplay({
  sessionCode,
  size = 200,
  showCopyButton = true,
}: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false);

  // Generate the download URL
  const downloadUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/download/${sessionCode}`
    : `/download/${sessionCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code Container */}
      <div className="bg-white p-4 rounded-xl shadow-lg">
        <QRCodeSVG
          value={downloadUrl}
          size={size}
          level="M"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-1">
          Scan to download your photo
        </p>
        <p className="text-xs text-gray-400 font-mono">
          Code: {sessionCode}
        </p>
      </div>

      {/* Copy Link Button */}
      {showCopyButton && (
        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
        >
          {copied ? (
            <>
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy Link</span>
            </>
          )}
        </button>
      )}
    </div>
  );
}
