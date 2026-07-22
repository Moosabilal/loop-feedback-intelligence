'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function AskLoopPage() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{ answer: string; sources: any[]; isEmpty?: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!res.ok) {
        throw new Error('Failed to fetch response');
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while asking LOOP.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto py-8 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Ask LOOP</h1>
        <p className="text-gray-400">
          Ask natural language questions about your workspace&apos;s feedback.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g., What are users saying about the new dashboard?"
            aria-label="Ask LOOP a question"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-4 pr-32 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            aria-disabled={isLoading || !question.trim()}
            className="absolute right-2 top-2 bottom-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-medium rounded-lg px-6 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-[#0B0B1A]"
          >
            {isLoading ? 'Thinking...' : 'Ask'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8 text-red-400">
          {error}
        </div>
      )}

      {response && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {response.isEmpty ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-8 shadow-xl text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-4 border border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No Feedback Available</h2>
              <p className="text-orange-300 max-w-md mb-6">{response.answer}</p>
              <Link 
                href="/dashboard" 
                className="px-6 py-2.5 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-xl font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Go to Inbox
              </Link>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 shadow-xl">
              <h2 className="text-xl font-semibold text-white mb-4">Answer</h2>
              <div className="prose prose-invert max-w-none text-gray-300">
                {response.answer.split('\n').map((line: string, i: number) => (
                  <p key={i} className="mb-4 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!response.isEmpty && response.sources.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h3 className="text-lg font-semibold text-white mb-4">Retrieved Sources</h3>
              <div className="space-y-4">
                {response.sources.map((source: any, index: number) => (
                  <div key={source.id} className="p-4 bg-black/20 rounded-lg border border-white/5">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-medium px-2 py-1 bg-white/10 text-gray-300 rounded">
                        Source {index + 1}
                      </span>
                      {source.sentiment && (
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            source.sentiment === 'POSITIVE'
                              ? 'bg-green-500/20 text-green-400'
                              : source.sentiment === 'NEGATIVE'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-gray-500/20 text-gray-400'
                          }`}
                        >
                          {source.sentiment}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">&quot;{source.content}&quot;</p>
                    {source.themes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {source.themes.map((theme: string) => (
                          <span key={theme} className="text-xs text-indigo-300">
                            #{theme}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
