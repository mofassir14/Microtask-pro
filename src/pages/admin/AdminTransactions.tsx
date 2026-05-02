import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../AuthContext';
import { Transaction } from '../../types';
import { Check, X, Download, ArrowUpCircle, Filter, Calendar, Search, RefreshCw, ArrowUpRight, Gift, Users } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { toast } from 'sonner';

type FilterType = 'all' | 'deposit' | 'withdrawal' | 'reward' | 'referral';
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function AdminTransactions() {
  const { token } = useAuth();
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTxs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/transactions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTxs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [token]);

  const handleApprove = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Transaction approved successfully');
        fetchTxs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to approve transaction');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/transactions/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Transaction rejected successfully');
        fetchTxs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to reject transaction');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const filteredTxs = useMemo(() => {
    return txs.filter(tx => {
      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;
      
      // Status filter
      if (filterStatus !== 'all' && tx.status !== filterStatus) return false;
      
      // Date range filter
      if (startDate) {
        const txDate = new Date(tx.created_at).toISOString().split('T')[0];
        if (txDate < startDate) return false;
      }
      if (endDate) {
        const txDate = new Date(tx.created_at).toISOString().split('T')[0];
        if (txDate > endDate) return false;
      }
      
      // Search query (name or email)
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const nameMatch = tx.user_name?.toLowerCase().includes(query);
        const emailMatch = tx.user_email?.toLowerCase().includes(query);
        const txIdMatch = tx.transaction_id?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !txIdMatch) return false;
      }
      
      return true;
    });
  }, [txs, filterType, filterStatus, startDate, endDate, searchQuery]);

  const resetFilters = () => {
    setFilterType('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Transaction History</h1>
          <p className="text-slate-500">Manage deposits, withdrawals, and rewards.</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setFilterType('deposit'); setFilterStatus('pending'); }}
            className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100 hover:bg-amber-100 transition-colors"
          >
            Pending Deposits
          </button>
          <button 
            onClick={() => { setFilterType('withdrawal'); setFilterStatus('pending'); }}
            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-bold border border-red-100 hover:bg-red-100 transition-colors"
          >
            Pending Withdrawals
          </button>
          <button 
            onClick={fetchTxs}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 uppercase tracking-wider">
            <Filter className="w-4 h-4 text-indigo-500" />
            Filters
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Filtered Total</div>
              <div className="text-lg font-black text-indigo-600">
                {formatCurrency(filteredTxs.reduce((acc, tx) => acc + tx.amount, 0))}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Count</div>
              <div className="text-lg font-black text-slate-900">{filteredTxs.length}</div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Name, email, or TX ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Type</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterType)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="deposit">Deposits</option>
              <option value="withdrawal">Withdrawals</option>
              <option value="reward">Rewards</option>
              <option value="referral">Referrals</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Status</label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase">Date Range</label>
            <div className="flex items-center gap-2">
              <input 
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        </div>

        {(filterType !== 'all' || filterStatus !== 'all' || startDate || endDate || searchQuery) && (
          <div className="flex justify-end">
            <button 
              onClick={resetFilters}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 uppercase tracking-wider"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && txs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading transactions...</td></tr>
              ) : filteredTxs.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400">No transactions found matching your criteria.</td></tr>
              ) : filteredTxs.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{tx.user_name}</div>
                    <div className="text-xs text-slate-500">{tx.user_email}</div>
                    <div className="text-[10px] text-slate-400 mt-1">{new Date(tx.created_at).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {tx.type === 'deposit' && <Download className="w-4 h-4 text-emerald-600" />}
                      {tx.type === 'withdrawal' && <ArrowUpRight className="w-4 h-4 text-amber-600" />}
                      {tx.type === 'reward' && <Gift className="w-4 h-4 text-indigo-600" />}
                      {tx.type === 'referral' && <Users className="w-4 h-4 text-purple-600" />}
                      <span className="capitalize font-medium">{tx.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{formatCurrency(tx.amount)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      tx.status === 'pending' && "bg-amber-50 text-amber-600",
                      tx.status === 'approved' && "bg-emerald-50 text-emerald-600",
                      tx.status === 'rejected' && "bg-red-50 text-red-600"
                    )}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 font-medium">{tx.method || 'System'}</div>
                    {tx.sender_number && (
                      <div className="text-[10px] text-slate-400">Sender: {tx.sender_number}</div>
                    )}
                    {tx.transaction_id && (
                      <div className="text-[10px] text-indigo-500 font-mono">ID: {tx.transaction_id}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {tx.status === 'pending' ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApprove(tx.id)}
                          className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(tx.id)}
                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading && txs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Loading transactions...</div>
          ) : filteredTxs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No transactions found.</div>
          ) : filteredTxs.map((tx) => (
            <div key={tx.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-bold text-slate-900">{tx.user_name}</div>
                  <div className="text-xs text-slate-500">{tx.user_email}</div>
                  <div className="text-[10px] text-slate-400 mt-1">{new Date(tx.created_at).toLocaleString()}</div>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  tx.status === 'pending' && "bg-amber-50 text-amber-600",
                  tx.status === 'approved' && "bg-emerald-50 text-emerald-600",
                  tx.status === 'rejected' && "bg-red-50 text-red-600"
                )}>
                  {tx.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                  {tx.type === 'deposit' && <Download className="w-4 h-4 text-emerald-600" />}
                  {tx.type === 'withdrawal' && <ArrowUpRight className="w-4 h-4 text-amber-600" />}
                  <span className="capitalize font-bold text-slate-700">{tx.type}</span>
                </div>
                <div className="font-black text-slate-900">{formatCurrency(tx.amount)}</div>
              </div>

              <div className="text-sm">
                <div className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Details</div>
                <div className="font-medium text-slate-700">{tx.method || 'System'}</div>
                {tx.sender_number && <div className="text-xs text-slate-500">Sender: {tx.sender_number}</div>}
                {tx.transaction_id && <div className="text-xs text-indigo-600 font-mono">ID: {tx.transaction_id}</div>}
              </div>

              {tx.status === 'pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApprove(tx.id)}
                    className="flex-1 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    onClick={() => handleReject(tx.id)}
                    className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
