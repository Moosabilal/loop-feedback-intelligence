'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type Member = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
};

export default function MembersPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'ADMIN';

  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState('ANALYST');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<{
    message: string;
    defaultPassword?: string;
  } | null>(null);
  const [inviteError, setInviteError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch members');
      setMembers(data.members);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    setInviteError('');
    setInviteSuccess(null);

    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to invite member');
      }

      setInviteSuccess({
        message: 'Member invited successfully!',
        defaultPassword: data.defaultPassword,
      });
      setInviteName('');
      setInviteEmail('');
      setInviteRole('ANALYST');

      // Refresh list
      fetchMembers();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setIsInviting(false);
    }
  };

  if (isLoading) return <div className="p-10 text-gray-400">Loading members...</div>;
  if (error) return <div className="p-10 text-red-400">Error: {error}</div>;

  return (
    <div className="py-6 sm:py-10 px-4 sm:px-6 max-w-5xl mx-auto space-y-8 sm:space-y-10 min-w-0">
      <div className="text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-semibold mb-3 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span>Workspace Security & Role Management</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white mb-2 tracking-tight">
          Workspace{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
            Members
          </span>
        </h1>
        <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">
          Manage team member permissions, invite analysts, and control access across your LOOP
          feedback intelligence workspace.
        </p>
      </div>

      {isAdmin && (
        <div className="bg-gradient-to-br from-[#13132B]/95 to-[#1a1a38]/95 backdrop-blur-xl border border-indigo-500/25 rounded-2xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Invite Team Member</h2>
          </div>

          {inviteError && (
            <div className="bg-red-500/10 text-red-300 px-4 py-3 rounded-xl mb-5 text-sm border border-red-500/30 flex items-center gap-3">
              <svg
                className="w-5 h-5 text-red-400 shrink-0"
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
              <span>{inviteError}</span>
            </div>
          )}

          {inviteSuccess && (
            <div className="bg-green-500/10 text-green-300 px-5 py-4 rounded-xl mb-5 text-sm border border-green-500/30 shadow-lg">
              <div className="flex items-center gap-2.5 font-bold text-green-400 mb-1.5">
                <svg
                  className="w-5 h-5 shrink-0"
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
                <span>{inviteSuccess.message}</span>
              </div>
              {inviteSuccess.defaultPassword && (
                <p className="text-green-200/90 ml-7">
                  Please securely share this default password with the user:{' '}
                  <code className="bg-black/50 border border-green-500/30 px-2.5 py-1 rounded-lg text-white font-mono font-bold tracking-wider ml-1 shadow-inner">
                    {inviteSuccess.defaultPassword}
                  </code>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                placeholder="jane@company.com"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                Role Permission
              </label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-black/40 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all appearance-none cursor-pointer"
              >
                <option value="ADMIN" className="bg-[#13132B] text-white">
                  Admin
                </option>
                <option value="ANALYST" className="bg-[#13132B] text-white">
                  Analyst
                </option>
                <option value="VIEWER" className="bg-[#13132B] text-white">
                  Viewer
                </option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isInviting}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-2.5 px-7 rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isInviting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
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
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <span>Invite</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/30 text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Team Member</th>
                <th className="px-6 py-4">Role & Permissions</th>
                <th className="px-6 py-4 text-right">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => {
                const initials =
                  member.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase() || 'M';
                return (
                  <tr key={member.id} className="hover:bg-white/[0.04] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/15 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0 group-hover:scale-105 transition-transform">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm group-hover:text-indigo-200 transition-colors">
                            {member.name}
                          </div>
                          <div className="text-xs text-gray-400">{member.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          member.role === 'ADMIN'
                            ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-[0_0_12px_rgba(168,85,247,0.2)]'
                            : member.role === 'ANALYST'
                              ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 shadow-[0_0_12px_rgba(99,102,241,0.2)]'
                              : 'bg-gray-500/15 text-gray-300 border border-gray-500/30'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${member.role === 'ADMIN' ? 'bg-purple-400 animate-pulse' : member.role === 'ANALYST' ? 'bg-indigo-400' : 'bg-gray-400'}`}
                        />
                        <span>{member.role}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400 font-mono text-right">
                      {new Date(member.createdAt).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View */}
        <div className="sm:hidden divide-y divide-white/10">
          {members.map((member) => {
            const initials =
              member.name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase() || 'M';
            return (
              <div
                key={member.id}
                className="p-4 bg-transparent hover:bg-white/[0.03] transition-colors"
              >
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-white/15 flex items-center justify-center text-indigo-300 font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate">{member.name}</h4>
                      <p className="text-xs text-gray-400 truncate">{member.email}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      member.role === 'ADMIN'
                        ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                        : member.role === 'ANALYST'
                          ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                          : 'bg-gray-500/15 text-gray-300 border border-gray-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                    <span>{member.role}</span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-mono">
                    Joined {new Date(member.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
