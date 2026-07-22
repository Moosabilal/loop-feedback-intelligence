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
    <div className="p-10 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Workspace Members</h1>
        <p className="text-gray-400">Manage who has access to your LOOP workspace.</p>
      </div>

      {isAdmin && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Invite New Member</h2>

          {inviteError && (
            <div className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm border border-red-500/50">
              {inviteError}
            </div>
          )}

          {inviteSuccess && (
            <div className="bg-green-500/10 text-green-400 px-4 py-4 rounded-lg mb-4 text-sm border border-green-500/50">
              <p className="font-semibold mb-1">{inviteSuccess.message}</p>
              {inviteSuccess.defaultPassword && (
                <p className="text-green-300/80">
                  Please securely share this default password with the user:{' '}
                  <code className="bg-black/30 px-2 py-1 rounded text-white tracking-wider ml-1">
                    {inviteSuccess.defaultPassword}
                  </code>
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-4 md:items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Name</label>
              <input
                type="text"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Jane Doe"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="jane@acme.com"
              />
            </div>
            <div className="w-full md:w-48">
              <label className="block text-sm font-medium text-gray-400 mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="ADMIN">Admin</option>
                <option value="ANALYST">Analyst</option>
                <option value="VIEWER">Viewer</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={isInviting}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-6 rounded-lg transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {isInviting ? 'Inviting...' : 'Invite'}
            </button>
          </form>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-black/20 text-gray-400 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium">Member</th>
                <th className="px-6 py-4 font-medium">Role</th>
                <th className="px-6 py-4 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-white">{member.name}</div>
                    <div className="text-sm text-gray-400">{member.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        member.role === 'ADMIN'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : member.role === 'ANALYST'
                            ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                            : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                      }`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
