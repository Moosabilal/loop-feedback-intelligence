'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ExampleQuestion {
  category: string;
  question: string;
  icon: JSX.Element;
  gradient: string;
  badgeBg: string;
  badgeText: string;
}

export default function AskLoopPage() {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<{
    answer: string;
    sources: any[];
    isEmpty?: boolean;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const exampleQuestions: ExampleQuestion[] = [
    {
      category: 'Onboarding & UX',
      question: 'What are users saying about the onboarding experience?',
      badgeBg: 'bg-indigo-500/10 border-indigo-500/20',
      badgeText: 'text-indigo-300',
      gradient: 'from-indigo-500/20 via-indigo-500/5 to-transparent',
      icon: (
        <svg
          className="w-5 h-5 text-indigo-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      category: 'Friction & Billing',
      question: 'Why are customers experiencing confusion with billing details?',
      badgeBg: 'bg-rose-500/10 border-rose-500/20',
      badgeText: 'text-rose-300',
      gradient: 'from-rose-500/20 via-rose-500/5 to-transparent',
      icon: (
        <svg
          className="w-5 h-5 text-rose-400"
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
      ),
    },
    {
      category: 'Mobile & Speed',
      question: 'What improvements or bugs are being reported about the mobile app?',
      badgeBg: 'bg-amber-500/10 border-amber-500/20',
      badgeText: 'text-amber-300',
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      icon: (
        <svg
          className="w-5 h-5 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    {
      category: 'Feature Requests',
      question: 'Which new integrations and tool workflows are customers requesting?',
      badgeBg: 'bg-purple-500/10 border-purple-500/20',
      badgeText: 'text-purple-300',
      gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
      icon: (
        <svg
          className="w-5 h-5 text-purple-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z"
          />
        </svg>
      ),
    },
    {
      category: 'Support Timelines',
      question: 'How satisfied are users with our customer support responsiveness?',
      badgeBg: 'bg-cyan-500/10 border-cyan-500/20',
      badgeText: 'text-cyan-300',
      gradient: 'from-cyan-500/20 via-cyan-500/5 to-transparent',
      icon: (
        <svg
          className="w-5 h-5 text-cyan-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
    },
    {
      category: 'Positive Driver',
      question: 'Summarize the primary reasons customers love the speed performance.',
      badgeBg: 'bg-green-500/10 border-green-500/20',
      badgeText: 'text-green-300',
      gradient: 'from-green-500/20 via-green-500/5 to-transparent',
      icon: (
        <svg
          className="w-5 h-5 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  const submitQuestion = async (queryText: string) => {
    if (!queryText.trim()) return;

    setQuestion(queryText);
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuestion(question);
  };

  const handleExampleClick = (queryText: string) => {
    submitQuestion(queryText);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Premium Header */}
      <div className="mb-8 sm:mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-semibold mb-3 sm:mb-4 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span>Semantic Vector Search & Grounded RAG</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-2.5 sm:mb-3 tracking-tight">
          Ask{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            LOOP
          </span>{' '}
          Intelligence
        </h1>
        <p className="text-gray-400 text-sm sm:text-lg max-w-2xl leading-relaxed">
          Ask natural language questions about your workspace&apos;s feedback. Our AI retrieves
          exact customer citations to ground every answer in real data.
        </p>
      </div>

      {/* Futuristic Search Box - Stacked on Mobile, Inline on Desktop */}
      <form onSubmit={handleSubmit} className="mb-8 sm:mb-10 relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur-md opacity-30 group-hover:opacity-60 transition duration-500 pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-2 bg-[#13132B]/95 backdrop-blur-xl border border-white/15 rounded-2xl shadow-2xl p-3 sm:p-2">
          <div className="flex items-center flex-1">
            <div className="pl-1 sm:pl-3 text-indigo-400 shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 animate-spin-slow"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
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
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., What are customers saying about onboarding?"
              aria-label="Ask LOOP a question"
              className="w-full bg-transparent border-0 py-1.5 sm:py-3 px-2 sm:px-4 text-white text-sm sm:text-lg placeholder-gray-500 focus:outline-none transition-all"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !question.trim()}
            aria-disabled={isLoading || !question.trim()}
            className="shrink-0 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-40 disabled:hover:from-indigo-600 text-white font-semibold text-sm sm:text-base rounded-xl px-6 py-2.5 sm:py-3 shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Ask AI</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 mb-8 text-red-300 flex items-center gap-4 animate-in fade-in duration-300">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0 text-red-400 border border-red-500/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white">Query Failed</h3>
            <p className="text-sm text-red-300">{error}</p>
          </div>
        </div>
      )}

      {/* Suggested Prompts Grid when idle */}
      {!response && !isLoading && !error && (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <h2 className="text-xs sm:text-sm font-bold text-gray-400 tracking-wider uppercase">
              Suggested Exploratory Questions
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {exampleQuestions.map((item, index) => (
              <div
                key={index}
                onClick={() => handleExampleClick(item.question)}
                className="group relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 cursor-pointer transition-all duration-300 sm:hover:-translate-y-1 hover:shadow-[0_0_25px_rgba(99,102,241,0.15)] flex flex-col justify-between"
              >
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                />

                <div>
                  <div className="flex items-center justify-between gap-2 mb-3 sm:mb-4">
                    <span
                      className={`text-[11px] sm:text-xs font-semibold px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full border ${item.badgeBg} ${item.badgeText}`}
                    >
                      {item.category}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform duration-300">
                      {item.icon}
                    </div>
                  </div>

                  <p className="text-sm font-medium text-gray-200 group-hover:text-white leading-snug transition-colors">
                    &quot;{item.question}&quot;
                  </p>
                </div>

                <div className="mt-4 sm:mt-6 flex items-center gap-1 text-xs text-indigo-400 font-semibold opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>Ask this question</span>
                  <svg
                    className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Response Card */}
      {response && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Synthesized Insight
              </h2>
            </div>
            <button
              onClick={() => {
                setResponse(null);
                setQuestion('');
              }}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Ask Another Question</span>
            </button>
          </div>

          {response.isEmpty ? (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 sm:p-10 shadow-xl text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-500/20 text-orange-400 rounded-2xl flex items-center justify-center mb-5 border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.25)]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                No Feedback Matches Query
              </h3>
              <p className="text-orange-200/90 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
                {response.answer}
              </p>
              <Link
                href="/dashboard/inbox"
                className="w-full sm:w-auto px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 rounded-xl font-medium transition-colors shadow-lg shadow-orange-500/10 focus:outline-none focus:ring-2 focus:ring-orange-500 text-center"
              >
                Explore Feedback Inbox
              </Link>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-[#13132B] to-[#1a1a38] border border-indigo-500/30 rounded-2xl p-5 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)] shrink-0">
                  <span className="font-bold text-lg">L</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">LOOP AI Answer</h3>
                  <p className="text-[11px] sm:text-xs text-indigo-300 font-mono">
                    Grounded solely in verified customer verbatims
                  </p>
                </div>
              </div>

              <div className="prose prose-invert max-w-none text-gray-200 text-sm sm:text-base leading-relaxed space-y-4">
                {response.answer.split('\n').map((line: string, i: number) => (
                  <p key={i} className="last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}

          {!response.isEmpty && response.sources.length > 0 && (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 sm:p-8 mt-2 shadow-xl">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <svg
                    className="w-5 h-5 text-indigo-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Retrieved Source Verbatims
                  </h3>
                </div>
                <span className="text-xs font-semibold px-2.5 sm:px-3 py-1 bg-white/10 text-gray-300 rounded-full border border-white/10">
                  {response.sources.length} citations
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                {response.sources.map((source: any, index: number) => (
                  <div
                    key={source.id}
                    className="p-4 sm:p-5 bg-black/40 hover:bg-black/60 rounded-xl border border-white/5 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-lg">
                          Citation #{index + 1}
                        </span>
                        {source.sentiment && (
                          <span
                            className={`text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg border ${
                              source.sentiment === 'POSITIVE'
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : source.sentiment === 'NEGATIVE'
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                  : 'bg-gray-500/10 border-gray-500/30 text-gray-300'
                            }`}
                          >
                            {source.sentiment}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-gray-300 italic mb-4 leading-relaxed">
                        &quot;{source.content}&quot;
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/5 text-xs text-gray-500">
                      <span className="font-medium text-gray-400">
                        {source.channel || 'Direct Feedback'}
                      </span>
                      {source.themes && source.themes.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {source.themes.map((theme: string) => (
                            <span
                              key={theme}
                              className="text-[11px] sm:text-xs font-medium text-indigo-400"
                            >
                              #{theme}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
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
