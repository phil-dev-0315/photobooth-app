"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';

interface SecurityCodeGateProps {
  eventName: string;
  securityCode: string;
  onVerified: () => void;
  onCancel?: () => void;
}

export default function SecurityCodeGate({
  eventName,
  securityCode,
  onVerified,
  onCancel,
}: SecurityCodeGateProps) {
  const [codeInput, setCodeInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    // Small delay for UX feedback
    setTimeout(() => {
      // Case-insensitive comparison
      if (codeInput.trim().toUpperCase() === securityCode.toUpperCase()) {
        onVerified();
      } else {
        setError('Invalid security code. Please try again.');
        setIsVerifying(false);
      }
    }, 300);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodeInput(e.target.value.toUpperCase());
    if (error) setError(null);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white">Security Required</h2>
            <p className="text-red-100 mt-2">{eventName}</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-gray-600">
                Enter the event code to start the photobooth
              </p>
            </div>

            {/* Code Input */}
            <div>
              <input
                type="text"
                value={codeInput}
                onChange={handleInputChange}
                placeholder="Enter code"
                autoFocus
                autoComplete="off"
                className={`w-full px-4 py-4 text-center text-2xl font-mono tracking-widest border-2 rounded-xl transition-colors ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                } focus:outline-none focus:ring-2`}
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-center text-red-600 text-sm"
                >
                  {error}
                </motion.p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!codeInput.trim() || isVerifying}
              className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Verifying...</span>
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
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>Start Session</span>
                </>
              )}
            </button>

            {/* Cancel Link */}
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Cancel
              </button>
            )}
          </form>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-400 text-sm mt-4">
          Contact the event organizer if you don't have the code
        </p>
      </motion.div>
    </div>
  );
}
