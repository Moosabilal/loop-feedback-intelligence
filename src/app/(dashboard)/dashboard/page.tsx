'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FeedbackCreateModal } from '../components/FeedbackCreateModal';
import { CsvUploadModal } from '../components/CsvUploadModal';
import { Role } from '@prisma/client';

type FeedbackItem = {
  id: string;
  content: string;
  channel: string;
  status: string;
  createdAt: string;
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);

  const fetchFeedback = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/feedback');
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.feedback);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const canCreate = session?.user?.role === Role.ADMIN || session?.user?.role === Role.ANALYST;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Feedback Inbox</h1>
          <p className="text-gray-400">View and manage customer feedback.</p>
        </div>

        {canCreate && (
          <div className="flex gap-3">
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

      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No feedback found. Log some to get started!
          </div>
        ) : (
          <div className="divide-y divide-white/10">
            {feedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-white/5 transition-colors group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-white text-base leading-relaxed mb-3">{item.content}</p>
                    <div className="flex items-center gap-3 text-xs font-medium">
                      <span className="px-2.5 py-1 rounded-md bg-white/10 text-gray-300">
                        {item.channel}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-md ${
                          item.status === 'NEW'
                            ? 'bg-blue-500/10 text-blue-400'
                            : item.status === 'REVIEWED'
                              ? 'bg-yellow-500/10 text-yellow-400'
                              : 'bg-green-500/10 text-green-400'
                        }`}
                      >
                        {item.status}
                      </span>
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
