'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConfirmModal } from './components/ConfirmModal';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/login');
    }
  }, [status]);

  if (status === 'loading' || !session) {
    return (
      <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Members', href: '/settings/members' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0B1A] text-white flex">
      {/* Sidebar - fixed and sticky */}
      <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col h-screen sticky top-0">
        <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold mr-3 shadow-[0_0_10px_rgba(99,102,241,0.4)]">
            L
          </div>
          <span className="font-semibold text-lg tracking-wide">LOOP</span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`block px-4 py-2.5 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0 space-y-3">
          <div className="px-4 py-3 bg-white/5 rounded-lg text-sm">
            <p className="font-medium truncate">{session.user.name}</p>
            <p className="text-gray-400 text-xs truncate">{session.user.role}</p>
          </div>

          <button
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-full px-4 py-2 text-sm text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            Log Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 min-h-screen overflow-auto relative">{children}</main>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        title="Log Out"
        message="Are you sure you want to log out?"
        confirmText="Log Out"
        isDestructive={true}
        onConfirm={() => signOut({ callbackUrl: '/login' })}
        onClose={() => setIsLogoutModalOpen(false)}
      />
    </div>
  );
}
