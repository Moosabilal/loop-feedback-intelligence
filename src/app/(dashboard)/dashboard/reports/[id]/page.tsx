'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

type Report = {
  id: string;
  title: string;
  content: string;
  dateRangeStart: string;
  dateRangeEnd: string;
  createdAt: string;
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await fetch(`/api/reports/${id}`);
        if (!res.ok) {
          throw new Error('Report not found or access denied');
        }
        const data = await res.json();
        setReport(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="p-8 text-gray-400">Loading report...</div>;
  }

  if (error || !report) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-red-400">
          {error || 'Failed to load report'}
        </div>
        <button
          onClick={() => router.push('/dashboard/reports')}
          className="mt-4 text-indigo-400 hover:text-indigo-300"
        >
          &larr; Back to Reports
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 md:py-8 md:px-6 min-w-0">
      {/* Hide navigation header when printing */}
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link
          href="/dashboard/reports"
          className="flex items-center text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <span className="mr-2">&larr;</span>
          Back to Reports
        </Link>
        <div className="flex items-center">
          <span className="text-xs text-gray-500 mr-4 italic hidden sm:inline-block">
            Tip: uncheck &quot;Headers and footers&quot; in the print dialog for a cleaner export.
          </span>
          <button
            onClick={handlePrint}
            className="flex items-center text-sm font-medium bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg transition-colors border border-white/10"
          >
            <span className="mr-2">🖨️</span>
            Export PDF
          </button>
        </div>
      </div>

      <div className="bg-white/5 print:bg-white border border-white/10 print:border-none rounded-xl p-8 shadow-xl print:shadow-none print:text-black">
        <div className="border-b border-white/10 print:border-gray-200 pb-6 mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white print:text-black mb-2 break-words leading-tight">
            {report.title}
          </h1>
          <div className="text-sm text-gray-400 print:text-gray-500">
            Generated on {format(new Date(report.createdAt), 'MMMM d, yyyy h:mm a')}
          </div>
        </div>

        {/* Use Typography plugin to format Markdown */}
        <div className="prose prose-invert print:prose-neutral max-w-none">
          <ReactMarkdown>{report.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
