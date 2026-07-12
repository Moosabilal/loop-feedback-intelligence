'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHANNEL_ENUM } from '@/lib/schemas/feedback';

interface SimulateChannelDropdownProps {
  onSuccess: () => void;
}

export function SimulateChannelDropdown({ onSuccess }: SimulateChannelDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  const handleSimulate = async (channel: string) => {
    setIsSimulating(true);
    setIsOpen(false);
    try {
      const res = await fetch('/api/integrations/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to simulate');
      }

      onSuccess();
    } catch (err: any) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSimulating}
        className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5 disabled:opacity-50 flex items-center gap-2"
      >
        {isSimulating ? 'Simulating...' : 'Simulate Channel'}
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute right-0 mt-2 w-56 bg-[#1A1A3A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2">
                {CHANNEL_ENUM.map((channel) => (
                  <button
                    key={channel}
                    onClick={() => handleSimulate(channel)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {channel}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
