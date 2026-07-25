'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { DashboardEmptyState } from '../components/DashboardEmptyState';
import { StatCard } from '../components/StatCard';
import { VolumeChart } from '../components/charts/VolumeChart';
import { SentimentChart } from '../components/charts/SentimentChart';
import { ThemeChart } from '../components/charts/ThemeChart';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function DashboardPage() {
  useSession(); // Keep session hook to maintain auth boundaries if needed
  const [statsData, setStatsData] = useState<any>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

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
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-8 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-64px)]">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 sm:mb-8 text-left">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-semibold mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0" />
            <span>Real-time Workspace Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Analytics{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Dashboard
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Monitor product health, volume trajectories, theme breakdowns, and overall sentiment
            trends across all feedback sources.
          </p>
        </div>
      </div>

      {/* Loading or Empty State Check */}
      {isStatsLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : statsData?.stats?.totalFeedback === 0 ? (
        <DashboardEmptyState
          canCreate={false}
          onCsvUpload={() => {}}
          onSimulate={() => {}}
          onLogFeedback={() => {}}
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="flex flex-col gap-6 flex-1"
        >
          {/* Top Row: Stat Cards */}
          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            />
          </motion.div>

          {/* Middle Row: Charts */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <VolumeChart data={statsData?.volume || []} />
            </div>
            <div>
              <SentimentChart data={statsData?.sentiment || []} />
            </div>
          </motion.div>

          {/* Bottom Row: Themes */}
          <motion.div variants={staggerItem} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ThemeChart
                data={statsData?.themes || []}
                activeTheme={null}
                onThemeClick={() => {}}
              />
            </div>
            <div className="flex flex-col gap-4">
              {/* Trending Themes Panel */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6 backdrop-blur-sm flex-1 flex flex-col h-[300px]">
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
                    <div
                      key={t.themeId}
                      className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all text-left bg-white/5 text-gray-300 border border-white/5"
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
                    </div>
                  ))}
                  {(!statsData?.trending || statsData.trending.length === 0) && (
                    <div className="text-sm text-gray-500 italic mt-4 text-center">
                      No trending themes yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
