'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Users, Shield, User, Trash2, Loader2 } from 'lucide-react';

interface OperatorUser {
  id: number;
  username: string;
  role: string;
  full_name: string;
  department: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-50 text-red-700 border-red-200',
  operator: 'bg-blue-50 text-blue-700 border-blue-200',
  engineer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  viewer: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function UsersPage() {
  const [users, setUsers] = useState<OperatorUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<any>('/api/v1/auth/users');
      if (data && Array.isArray(data.users)) {
        setUsers(data.users);
      } else if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load user registry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Operator & User Accounts</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">RBAC role management for sovereign workbench operators</p>
          </div>
        </div>
        <button
          onClick={fetchUsers}
          className="px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-white/[0.05] hover:bg-gray-200 dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 rounded border border-gray-200 dark:border-white/[0.08] transition-colors"
        >
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600 text-sm">
          No registered operators found. Users are managed via the authentication module.
        </div>
      ) : (
        <div className="bg-white dark:bg-[#111116] border border-gray-200 dark:border-white/[0.08] rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.02]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/[0.05] flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">{u.full_name || u.username}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">{u.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border ${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
                      <Shield className="w-3 h-3" />
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.department || '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
