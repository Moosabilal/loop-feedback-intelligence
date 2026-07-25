'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';

type Report = {
  id: string;
  title: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
};

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState('30'); // default 30 days
  const { data: session } = useSession();
  const isViewer = session?.user?.role === 'VIEWER';

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      if (!res.ok) throw new Error('Failed to fetch reports');
      const data = await res.json();
      setReports(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - parseInt(period));

      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRangeStart: start.toISOString(),
          dateRangeEnd: end.toISOString(),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      const { reportId } = await res.json();
      router.push(`/dashboard/reports/${reportId}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-6 mb-8 sm:mb-10">
        <div className="text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-semibold mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse shrink-0" />
            <span>Executive AI Insights & Sentiment</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
            Voice of Customer{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              Reports
            </span>
          </h1>
          <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Generate executive AI summaries of feedback trends, emerging pain points, and overall
            customer sentiment.
          </p>
        </div>

        {!isViewer && (
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-[#13132B] border border-white/15 p-2.5 rounded-2xl shadow-xl w-full md:w-auto">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={isGenerating}
              className="flex-1 sm:flex-none bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-white text-sm outline-none cursor-pointer focus:ring-2 focus:ring-indigo-500 transition-all"
            >
              <option value="7" className="text-black">
                Last 7 Days
              </option>
              <option value="30" className="text-black">
                Last 30 Days
              </option>
              <option value="90" className="text-black">
                Last Quarter (90 Days)
              </option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl px-5 py-2.5 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span>Generating AI Report...</span>
                </>
              ) : (
                <>
                  <span>Generate Report</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-5 mb-8 text-red-300 flex items-center gap-3">
          <svg
            className="w-6 h-6 text-red-400 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center justify-center">
            <svg
              className="w-8 h-8 text-indigo-400 animate-spin mb-3"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            <span className="text-sm">Loading reports...</span>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-500/20 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No Reports Generated Yet</h3>
            <p className="text-gray-400 text-sm">
              Select a time range above and generate your first Voice of Customer executive summary.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/10 bg-black/30">
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Report Title
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Period Covered
                    </th>
                    <th className="py-4 px-6 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                      Generated On
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reports.map((report) => (
                    <tr key={report.id} className="hover:bg-white/[0.04] transition-colors group">
                      <td className="py-4 px-6">
                        <Link
                          href={`/dashboard/reports/${report.id}`}
                          className="flex items-center gap-3 text-indigo-400 group-hover:text-indigo-300 font-semibold transition-colors"
                        >
                          <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                            📄
                          </span>
                          <span>{report.title}</span>
                        </Link>
                      </td>
                      <td className="py-4 px-6 text-gray-300 text-sm">
                        <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 font-mono text-xs">
                          {format(new Date(report.dateRangeStart), 'MMM d, yyyy')} -{' '}
                          {format(new Date(report.dateRangeEnd), 'MMM d, yyyy')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-400 text-sm text-right font-mono">
                        {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden divide-y divide-white/10">
              {reports.map((report) => (
                <Link
                  key={report.id}
                  href={`/dashboard/reports/${report.id}`}
                  className="block p-4 bg-transparent active:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 font-bold">
                      📄
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{report.title}</h4>
                      <p className="text-[11px] text-gray-500 font-mono">
                        Gen: {format(new Date(report.createdAt), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/[0.03] rounded-lg p-2.5 border border-white/5 flex items-center justify-between text-xs text-gray-300">
                    <span className="text-gray-500 text-[11px] uppercase tracking-wider font-semibold">
                      Period
                    </span>
                    <span className="font-mono font-medium text-[11px]">
                      {format(new Date(report.dateRangeStart), 'MMM d')} -{' '}
                      {format(new Date(report.dateRangeEnd), 'MMM d, yyyy')}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
