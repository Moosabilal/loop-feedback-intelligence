'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0B1A] flex flex-col items-center justify-center text-white px-6">
      <div className="relative flex flex-col items-center text-center animate-in fade-in zoom-in duration-700">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

        <h1 className="text-[8rem] font-bold tracking-tighter leading-none bg-gradient-to-b from-white to-white/20 text-transparent bg-clip-text">
          404
        </h1>

        <h2 className="text-2xl md:text-3xl font-semibold mt-4 mb-2 text-gray-200">
          Page Not Found
        </h2>

        <p className="text-gray-400 max-w-md mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you
          back to your workspace.
        </p>

        <Link
          href="/dashboard"
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-8 py-3 rounded-lg transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)]"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
