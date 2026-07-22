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
    <div className="flex flex-col h-full max-w-5xl mx-auto p-4 md:py-8 md:px-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Voice of Customer Reports</h1>
          <p className="text-gray-400">
            Generate executive summaries of feedback trends and sentiment.
          </p>
        </div>

        {!isViewer && (
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-2 rounded-xl">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              disabled={isGenerating}
              className="bg-transparent text-white text-sm outline-none cursor-pointer"
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
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 text-red-400">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Loading reports...</div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-white mb-2">No Reports Generated</h3>
            <p className="text-gray-400">Select a period and generate your first VOC report.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Report Title
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Period
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    Generated On
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-4 px-6">
                      <Link
                        href={`/dashboard/reports/${report.id}`}
                        className="text-indigo-400 group-hover:text-indigo-300 font-medium"
                      >
                        {report.title}
                      </Link>
                    </td>
                    <td className="py-4 px-6 text-gray-300">
                      {format(new Date(report.dateRangeStart), 'MMM d, yyyy')} -{' '}
                      {format(new Date(report.dateRangeEnd), 'MMM d, yyyy')}
                    </td>
                    <td className="py-4 px-6 text-gray-400 text-sm">
                      {format(new Date(report.createdAt), 'MMM d, yyyy h:mm a')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
