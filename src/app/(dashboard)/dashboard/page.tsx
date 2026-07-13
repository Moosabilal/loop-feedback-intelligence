'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FeedbackCreateModal } from '../components/FeedbackCreateModal';
import { CsvUploadModal } from '../components/CsvUploadModal';
import { SimulateChannelDropdown } from '../components/SimulateChannelDropdown';
import { useToast } from '@/lib/contexts/ToastContext';
import { Role, FeedbackStatus } from '@prisma/client';

type FeedbackItem = {
  id: string;
  content: string;
  channel: string;
  status: FeedbackStatus;
  createdAt: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset to page 1 on new search
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      });
      const res = await fetch(`/api/feedback?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.feedback);
        setTotalPages(data.meta.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const canEdit = session?.user?.role === Role.ADMIN || session?.user?.role === Role.ANALYST;

  const handleStatusChange = async (id: string, newStatus: FeedbackStatus) => {
    if (!canEdit) return;

    // Optimistic UI Update
    const previousFeedback = [...feedback];
    setFeedback((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await fetch(`/api/feedback/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update status');
      }
    } catch (error: any) {
      toast({ message: `Error updating status: ${error.message}`, type: 'error' });
      // Rollback on failure
      setFeedback(previousFeedback);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Feedback Inbox</h1>
          <p className="text-gray-400">View and manage customer feedback.</p>
        </div>

        {canEdit && (
          <div className="flex gap-3">
            <SimulateChannelDropdown onSuccess={fetchFeedback} />
            <button
              onClick={() => setIsCsvModalOpen(true)}
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-medium transition-colors border border-white/5"
            >
              Upload CSV
            </button>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              + Log Feedback
            </button>
          </div>
        )}
      </div>

      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#1A1A3A] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
        />
      </div>

      <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
        {isLoading && feedback.length === 0 ? (
          <div className="flex-1 p-12 flex items-center justify-center text-gray-400">
            Loading feedback...
          </div>
        ) : feedback.length === 0 ? (
          <div className="flex-1 p-12 flex items-center justify-center text-gray-400">
            No feedback found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-white/10">
            {feedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-white/5 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-base leading-relaxed mb-3">{item.content}</p>
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-300">
                        {item.channel}
                      </span>

                      <div className="relative inline-block">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as FeedbackStatus)
                          }
                          disabled={!canEdit}
                          className={`appearance-none px-2.5 py-1 pr-6 rounded-md font-medium outline-none cursor-pointer border border-transparent transition-colors disabled:cursor-not-allowed ${
                            item.status === 'NEW'
                              ? 'bg-blue-500/10 text-blue-400 hover:border-blue-500/30'
                              : item.status === 'REVIEWED'
                                ? 'bg-yellow-500/10 text-yellow-400 hover:border-yellow-500/30'
                                : 'bg-green-500/10 text-green-400 hover:border-green-500/30'
                          }`}
                        >
                          <option value="NEW" className="bg-[#1A1A3A] text-white">
                            NEW
                          </option>
                          <option value="REVIEWED" className="bg-[#1A1A3A] text-white">
                            REVIEWED
                          </option>
                          <option value="ACTIONED" className="bg-[#1A1A3A] text-white">
                            ACTIONED
                          </option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-current opacity-50">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>

                      <span className="text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="border-t border-white/10 p-4 flex items-center justify-between bg-black/20">
          <span className="text-sm text-gray-400">
            Page <span className="text-white font-medium">{page}</span> of{' '}
            <span className="text-white font-medium">{totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || totalPages === 0}
              className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <FeedbackCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchFeedback}
      />
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={fetchFeedback}
      />
    </div>
  );
}
