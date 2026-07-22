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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
    <div className="min-h-screen bg-[#0B0B1A] text-white flex flex-col md:flex-row print:bg-white print:text-black">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/10 bg-[#0B0B1A] shrink-0 sticky top-0 z-20 print:hidden">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold mr-3 shadow-[0_0_10px_rgba(99,102,241,0.4)]">
            L
          </div>
          <span className="font-semibold text-lg tracking-wide">LOOP</span>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -mr-2 text-gray-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Open navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - sliding drawer on mobile, fixed and sticky on md+ */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#111122] md:bg-white/5 border-r border-white/10 flex flex-col h-screen transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 print:hidden ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold mr-3 shadow-[0_0_10px_rgba(99,102,241,0.4)]">
              L
            </div>
            <span className="font-semibold text-lg tracking-wide">LOOP</span>
          </div>
          <button
            className="md:hidden p-2 -mr-2 text-gray-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
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
            className="w-full px-4 py-2 text-sm text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
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
