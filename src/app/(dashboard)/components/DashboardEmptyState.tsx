'use client';

import { motion } from 'framer-motion';

interface DashboardEmptyStateProps {
  onSimulate: () => void;
  onCsvUpload: () => void;
  onLogFeedback: () => void;
  canCreate: boolean;
}

export function DashboardEmptyState({
  onSimulate,
  onCsvUpload,
  onLogFeedback,
  canCreate,
}: DashboardEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center h-full text-center p-8 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md relative overflow-hidden"
    >
      {/* Subtle ambient glow in the background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-lg">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center shadow-2xl">
          <svg
            className="w-10 h-10 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>

        <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Your Inbox is Empty</h2>
        <p className="text-gray-400 text-lg leading-relaxed mb-8">
          Your workspace is ready, but no feedback has been ingested yet. Get started by uploading a
          CSV, simulating data, or manually logging feedback.
        </p>

        {canCreate ? (
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={onSimulate}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/10 flex items-center gap-2 hover:scale-105"
            >
              Simulate Channel
            </button>
            <button
              onClick={onCsvUpload}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-all duration-200 border border-white/10 flex items-center gap-2 hover:scale-105"
            >
              Upload CSV
            </button>
            <button
              onClick={onLogFeedback}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.4)] flex items-center gap-2 hover:scale-105"
            >
              + Log Feedback
            </button>
          </div>
        ) : (
          <p className="text-gray-500 italic">
            Please contact your workspace admin to import data.
          </p>
        )}
      </div>
    </motion.div>
  );
}
