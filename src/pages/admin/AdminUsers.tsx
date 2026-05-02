import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { User } from '../../types';
import { Search, Ban, CheckCircle2, DollarSign, Shield, Loader2, X, Plus, Minus } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'sonner';

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [balanceModalUser, setBalanceModalUser] = useState<User | null>(null);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
  const [isSubmittingBalance, setIsSubmittingBalance] = useState(false);

  const fetchUsers = async () => {
    const res = await fetch('/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleStatusChange = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'banned' : 'active';
    try {
      const res = await fetch(`/api/admin/users/${id}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`User status updated to ${newStatus}`);
        fetchUsers();
      } else {
        toast.error('Failed to update user status');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleRoleChange = async (id: number, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${id}/role`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        toast.success(`User role updated to ${newRole}`);
        fetchUsers();
      } else {
        toast.error('Failed to update user role');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const submitBalanceChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!balanceModalUser || !balanceAmount || isNaN(parseFloat(balanceAmount))) return;
    
    setIsSubmittingBalance(true);
    const val = parseFloat(balanceAmount);
    
    try {
      const res = await fetch(`/api/admin/users/${balanceModalUser.id}/balance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount: Math.abs(val), type: balanceAction }),
      });
      
      if (res.ok) {
        toast.success(`Successfully ${balanceAction === 'add' ? 'added' : 'deducted'} ${formatCurrency(Math.abs(val))}`);
        setBalanceModalUser(null);
        setBalanceAmount('');
        fetchUsers();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update balance');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    } finally {
      setIsSubmittingBalance(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roles = ['basic', 'premium', 'support', 'admin', 'user'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Level/Rep</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Balance</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading users...</td></tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="text-xs font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {roles.map(r => (
                        <option key={r} value={r}>{r.toUpperCase()}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">Lvl {user.level}</div>
                    <div className="text-xs text-slate-500">{user.reputation} Rep</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-indigo-600">{formatCurrency(user.balance)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                      user.status === 'active' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                    )}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setBalanceModalUser(user)}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors border border-indigo-100 mr-2"
                      title="Adjust Balance"
                    >
                      <DollarSign className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleStatusChange(user.id, user.status)}
                      className={cn(
                        "p-2 rounded-lg transition-colors",
                        user.status === 'active' ? "text-red-600 hover:bg-red-50" : "text-emerald-600 hover:bg-emerald-50"
                      )}
                      title={user.status === 'active' ? 'Ban User' : 'Unban User'}
                    >
                      {user.status === 'active' ? <Ban className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Adjustment Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-900">Adjust Balance</h2>
              <button 
                onClick={() => setBalanceModalUser(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={submitBalanceChange} className="p-6 space-y-6">
              <div>
                <p className="text-sm text-slate-500 mb-1">Target User</p>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="font-bold text-slate-900">{balanceModalUser.name}</span>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(balanceModalUser.balance)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase">Action type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBalanceAction('add')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors",
                      balanceAction === 'add' 
                        ? "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold" 
                        : "border-slate-100 hover:border-slate-200 text-slate-600"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                    Add Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceAction('deduct')}
                    className={cn(
                      "flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors",
                      balanceAction === 'deduct' 
                        ? "border-red-500 bg-red-50 text-red-700 font-bold" 
                        : "border-slate-100 hover:border-slate-200 text-slate-600"
                    )}
                  >
                    <Minus className="w-4 h-4" />
                    Deduct Funds
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">Amount ($)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={balanceAmount}
                    onChange={(e) => setBalanceAmount(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingBalance}
                className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
              >
                {isSubmittingBalance ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>Apply Changes</>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
