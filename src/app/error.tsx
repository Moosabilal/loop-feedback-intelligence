'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in a real app
    console.error(error);
  }, [error]);

  const isForbidden = error.message?.toLowerCase().includes('forbidden');

  return (
    <div className="min-h-screen bg-[#0B0B1A] flex flex-col items-center justify-center text-white px-6">
      <div className="relative flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-[100px] rounded-full pointer-events-none ${isForbidden ? 'bg-orange-500/20' : 'bg-red-500/20'}`} />
        
        <div className="mb-6 relative">
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mx-auto ${isForbidden ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {isForbidden ? (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            ) : (
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 text-white">
          {isForbidden ? 'Access Denied' : 'Something went wrong'}
        </h1>
        
        <p className="text-gray-400 max-w-md mb-8">
          {isForbidden 
            ? "You don't have permission to access this area or perform this action. If you believe this is a mistake, please contact your workspace administrator." 
            : "An unexpected error occurred while loading this page. Our team has been notified."}
        </p>

        <div className="flex gap-4">
          {!isForbidden && (
            <button
              onClick={() => reset()}
              className="bg-white/10 hover:bg-white/20 text-white font-medium px-6 py-2.5 rounded-lg transition-all border border-white/10"
            >
              Try Again
            </button>
          )}
          <Link
            href="/dashboard"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
