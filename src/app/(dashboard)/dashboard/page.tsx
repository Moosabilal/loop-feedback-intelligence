'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { FeedbackCreateModal } from '../components/FeedbackCreateModal';
import { CsvUploadModal } from '../components/CsvUploadModal';
import { SimulateChannelDropdown } from '../components/SimulateChannelDropdown';
import { useToast } from '@/lib/contexts/ToastContext';
import { Role, FeedbackStatus } from '@prisma/client';
import { DashboardEmptyState } from '../components/DashboardEmptyState';
import { StatCard } from '../components/StatCard';
import { VolumeChart } from '../components/charts/VolumeChart';
import { SentimentChart } from '../components/charts/SentimentChart';
import { ThemeChart } from '../components/charts/ThemeChart';

type FeedbackItem = {
  id: string;
  content: string;
  channel: string;
  status: FeedbackStatus;
  sentiment: string | null;
  sentimentScore: number | null;
  featureArea: string | null;
  rationale: string | null;
  themes: { theme: { name: string } }[];
  createdAt: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isClassifyingBatch, setIsClassifyingBatch] = useState(false);
  const [isEmbeddingBatch, setIsEmbeddingBatch] = useState(false);
  const [reclassifyingIds, setReclassifyingIds] = useState<Set<string>>(new Set());
  const [activeTheme, setActiveTheme] = useState<string | null>(null);

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

  // Reset pagination when theme changes
  useEffect(() => {
    setPage(1);
  }, [activeTheme]);

  const fetchFeedback = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(activeTheme ? { theme: activeTheme } : {}),
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
  }, [page, debouncedSearch, activeTheme]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStatsData(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setIsStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refreshAll = useCallback(() => {
    fetchFeedback();
    fetchStats();
  }, [fetchFeedback, fetchStats]);

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

  const handleEmbeddingBatch = async () => {
    if (!canEdit) return;
    setIsEmbeddingBatch(true);
    try {
      const res = await fetch('/api/feedback/embed-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to backfill embeddings');
      toast({ message: data.message, type: 'success' });
      refreshAll();
    } catch (error: any) {
      toast({ message: error.message, type: 'error' });
    } finally {
      setIsEmbeddingBatch(false);
    }
  };

  const handleClassifyBatch = async () => {
    if (!canEdit) return;
    setIsClassifyingBatch(true);
    try {
      const res = await fetch('/api/feedback/classify-batch', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to batch classify');
      toast({ message: data.message, type: 'success' });
      refreshAll();
    } catch (error: any) {
      toast({ message: error.message, type: 'error' });
    } finally {
      setIsClassifyingBatch(false);
    }
  };

  const handleReclassify = async (id: string) => {
    if (!canEdit) return;
    setReclassifyingIds((prev) => new Set(prev).add(id));
    try {
      const res = await fetch(`/api/feedback/${id}/classify`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to re-classify');
      }
      toast({ message: 'Feedback successfully re-classified', type: 'success' });
      refreshAll();
    } catch (error: any) {
      toast({ message: error.message, type: 'error' });
    } finally {
      setReclassifyingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Feedback Inbox</h1>
          <p className="text-gray-400">View and manage customer feedback.</p>
        </div>

        {canEdit && (
          <div className="flex gap-3">
            <button
              onClick={handleClassifyBatch}
              disabled={isClassifyingBatch}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 rounded-xl font-medium transition-colors border border-purple-500/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isClassifyingBatch ? (
                <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              )}
              Classify Backlog
            </button>
            <button
              onClick={handleEmbeddingBatch}
              disabled={isEmbeddingBatch}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-300 rounded-xl font-medium transition-colors border border-blue-500/30 flex items-center gap-2 disabled:opacity-50"
            >
              {isEmbeddingBatch ? (
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              )}
              Backfill Embeddings
            </button>
            <SimulateChannelDropdown onSuccess={refreshAll} />
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

      {/* Loading or Empty State Check */}
      {isStatsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : statsData?.stats?.totalFeedback === 0 ? (
        <DashboardEmptyState
          canCreate={canEdit}
          onCsvUpload={() => setIsCsvModalOpen(true)}
          onSimulate={() => {}} // Simulation is handled in header dropdown, but we could trigger it directly if needed. We'll leave the button to match the brief.
          onLogFeedback={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="flex flex-col gap-6 flex-1">
          {/* Top Row: Stat Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Feedback"
              value={statsData?.stats?.totalFeedback || 0}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                  />
                </svg>
              }
              delay={0.1}
            />
            <StatCard
              title="Negative Sentiment"
              value={`${statsData?.stats?.pctNegative || 0}%`}
              icon={
                <svg
                  className="w-5 h-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"
                  />
                </svg>
              }
              delay={0.2}
            />
            <StatCard
              title="New This Week"
              value={statsData?.stats?.newThisWeek || 0}
              icon={
                <svg
                  className="w-5 h-5 text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              }
              delay={0.3}
            />
          </div>

          {/* Middle Row: Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VolumeChart data={statsData?.volume || []} />
            </div>
            <div>
              <SentimentChart data={statsData?.sentiment || []} />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ThemeChart
                data={statsData?.themes || []}
                activeTheme={activeTheme}
                onThemeClick={(t) => setActiveTheme(activeTheme === t ? null : t)}
              />
            </div>
            <div className="flex flex-col gap-4">
              {/* Trending Themes Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm flex-1 flex flex-col h-[300px]">
                <h3 className="text-white font-semibold mb-4 tracking-tight flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-orange-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                  Trending This Week
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3">
                  {statsData?.trending?.map((t: any) => (
                    <button
                      key={t.themeId}
                      onClick={() => setActiveTheme(activeTheme === t.name ? null : t.name)}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                        activeTheme === t.name
                          ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10 border border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[120px]">#{t.name}</span>
                        <span className="text-gray-500 text-xs">({t.currentCount})</span>
                      </div>
                      {t.isNew ? (
                        <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-green-500/20 text-green-400 border border-green-500/30 whitespace-nowrap">
                          🆕 New
                        </span>
                      ) : t.percentageGrowth && t.percentageGrowth > 0 ? (
                        <span className="px-2 py-1 rounded-md text-[10px] uppercase font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30 whitespace-nowrap">
                          🔥 +{Math.round(t.percentageGrowth)}%
                        </span>
                      ) : null}
                    </button>
                  ))}
                  {(!statsData?.trending || statsData.trending.length === 0) && (
                    <div className="text-sm text-gray-500 italic mt-4 text-center">
                      No trending themes yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Inbox */}
          <div className="flex flex-col mt-2">
            <div className="mb-4 relative flex gap-3">
              <div className="relative flex-1">
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
              {activeTheme && (
                <button
                  onClick={() => setActiveTheme(null)}
                  className="px-4 py-3 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-indigo-500/30 transition-colors whitespace-nowrap"
                >
                  <span>#{activeTheme}</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm flex flex-col">
              {isLoading && feedback.length === 0 ? (
                <div className="flex-1 p-12 flex items-center justify-center text-gray-400">
                  Loading feedback...
                </div>
              ) : feedback.length === 0 ? (
                <div className="flex-1 p-12 flex items-center justify-center text-gray-400">
                  No feedback found.
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {feedback.map((item) => (
                    <div key={item.id} className="p-6 hover:bg-white/5 transition-colors group">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-white text-base leading-relaxed mb-3">
                            {item.content}
                          </p>

                          {/* AI Metadata Display */}
                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            {!item.sentiment ? (
                              <span className="px-2.5 py-1 rounded-md bg-yellow-500/20 text-yellow-400 text-xs font-medium border border-yellow-500/30 flex items-center gap-1">
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                  />
                                </svg>
                                Needs Classification
                              </span>
                            ) : (
                              <>
                                <span
                                  className={`px-2.5 py-1 rounded-md text-xs font-medium border flex items-center gap-1 ${
                                    item.sentiment === 'POSITIVE'
                                      ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                      : item.sentiment === 'NEGATIVE'
                                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                                        : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                                  }`}
                                >
                                  {item.sentiment} ({item.sentimentScore?.toFixed(2)})
                                </span>
                                {item.featureArea && (
                                  <span className="px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-300 text-xs font-medium border border-purple-500/20">
                                    {item.featureArea}
                                  </span>
                                )}
                                {item.themes?.map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-1 rounded-md bg-white/5 text-gray-300 text-xs border border-white/10"
                                  >
                                    #{t.theme.name}
                                  </span>
                                ))}
                              </>
                            )}

                            {item.rationale && (
                              <p className="text-gray-400 text-xs italic w-full mt-1">
                                &quot;{item.rationale}&quot;
                              </p>
                            )}
                          </div>

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

                            {canEdit && (
                              <button
                                onClick={() => handleReclassify(item.id)}
                                disabled={reclassifyingIds.has(item.id)}
                                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-purple-400 hover:bg-purple-500/10 hover:text-purple-300 disabled:opacity-50 transition-colors border border-transparent hover:border-purple-500/20"
                              >
                                {reclassifyingIds.has(item.id) ? (
                                  <div className="w-3 h-3 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                )}
                                Re-classify
                              </button>
                            )}
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
          </div>
        </div>
      )}

      <FeedbackCreateModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={refreshAll}
      />
      <CsvUploadModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onSuccess={refreshAll}
      />
    </div>
  );
}
