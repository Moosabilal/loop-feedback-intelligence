'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CHANNEL_ENUM } from '@/lib/schemas/feedback';
import { useToast } from '@/lib/contexts/ToastContext';

interface MobileActionsDropdownProps {
  onClassify: () => void;
  isClassifying: boolean;
  onEmbed: () => void;
  isEmbedding: boolean;
  onSimulateSuccess: () => void;
}

export function MobileActionsDropdown({
  onClassify,
  isClassifying,
  onEmbed,
  isEmbedding,
  onSimulateSuccess,
}: MobileActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const { toast } = useToast();

  const handleSimulate = async (channel: string) => {
    setIsSimulating(true);
    setIsSimulateOpen(false);
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

      onSimulateSuccess();
    } catch (err: any) {
      toast({ message: `Simulation failed: ${err.message}`, type: 'error' });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="relative lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-2 text-xs bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5 flex items-center gap-1.5"
      >
        More Actions
        <svg
          className={`w-3 h-3 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setIsSimulateOpen(false); }} />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 mt-2 w-56 bg-[#1A1A3A] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden p-2 flex flex-col gap-1"
            >
              <button
                onClick={() => {
                  onClassify();
                  setIsOpen(false);
                }}
                disabled={isClassifying}
                className="w-full text-left px-3 py-2.5 text-sm text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isClassifying && <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />}
                Classify Backlog
              </button>
              
              <button
                onClick={() => {
                  onEmbed();
                  setIsOpen(false);
                }}
                disabled={isEmbedding}
                className="w-full text-left px-3 py-2.5 text-sm text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isEmbedding && <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />}
                Backfill Embeddings
              </button>

              <div className="h-px w-full bg-white/10 my-1" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsSimulateOpen(!isSimulateOpen);
                }}
                disabled={isSimulating}
                className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center justify-between disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  {isSimulating && <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />}
                  Simulate Channel
                </div>
                <svg
                  className={`w-3 h-3 transition-transform ${isSimulateOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <AnimatePresence>
                {isSimulateOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden flex flex-col pl-2 border-l border-white/10 ml-3"
                  >
                    {CHANNEL_ENUM.map((channel) => (
                      <button
                        key={channel}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSimulate(channel);
                        }}
                        className="text-left px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      >
                        {channel}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
