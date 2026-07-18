'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Inbox', href: '/dashboard/inbox' },
    { name: 'Ask LOOP', href: '/dashboard/ask' },
    { name: 'Reports', href: '/dashboard/reports' },
    { name: 'Members', href: '/settings/members' },
  ];

  return (
    <div className="w-64 bg-white/5 border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-white/10 shrink-0">
        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold mr-3 shadow-[0_0_10px_rgba(99,102,241,0.4)]">
          L
        </div>
        <span className="font-semibold text-lg tracking-wide text-white">LOOP</span>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2.5 rounded-lg transition-all font-medium ${
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

      <div className="p-4 border-t border-white/10 shrink-0">
        <div className="px-4 py-3 bg-white/5 rounded-lg text-sm mb-3">
          <p className="font-medium text-white truncate">{user?.name}</p>
          <p className="text-gray-400 text-xs truncate">{user?.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors font-medium"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}
