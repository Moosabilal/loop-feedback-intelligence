import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-[#0B0B1A] text-white flex">
      {/* Sidebar */}
      <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold mr-3 shadow-[0_0_10px_rgba(99,102,241,0.4)]">
            L
          </div>
          <span className="font-semibold text-lg tracking-wide">LOOP</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {/* Dashboard Placeholder */}
          <Link
            href="/dashboard"
            className="block px-4 py-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            Dashboard
          </Link>

          {/* Settings / Members */}
          <Link
            href="/settings/members"
            className="block px-4 py-2.5 rounded-lg bg-indigo-500/10 text-indigo-400 font-medium"
          >
            Members
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 bg-white/5 rounded-lg text-sm">
            <p className="font-medium truncate">{session.user.name}</p>
            <p className="text-gray-400 text-xs truncate">{session.user.role}</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">{children}</main>
    </div>
  );
}
