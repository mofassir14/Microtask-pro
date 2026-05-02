import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Users, Briefcase, Download, ArrowUpCircle, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../../lib/utils';

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setStats(data);
    };
    fetchStats();
  }, [token]);

  if (!stats) return <div>Loading...</div>;

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-indigo-500', path: '/admin/users' },
    { label: 'Total Jobs', value: stats.totalJobs, icon: Briefcase, color: 'bg-emerald-500', path: '/admin/jobs' },
    { label: 'Total Deposits', value: formatCurrency(stats.totalDeposits), icon: Download, color: 'bg-amber-500', path: '/admin/transactions' },
    { label: 'Total Withdrawals', value: formatCurrency(stats.totalWithdrawals), icon: ArrowUpCircle, color: 'bg-red-500', path: '/admin/transactions' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Admin Control Center</h1>
          <p className="text-slate-500">Overview of platform performance and pending actions.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-sm">
          <ShieldCheck className="w-4 h-4" />
          Admin Mode
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", card.color)}>
                <card.icon className="w-6 h-6" />
              </div>
              <Link to={card.path} className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
            <h3 className="text-slate-500 text-sm font-medium">{card.label}</h3>
            <p className="text-2xl font-bold text-slate-900 mt-1">{card.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Pending Actions</h2>
          </div>
          <div className="space-y-4">
            <Link to="/admin/proofs" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600">Pending Proofs</h4>
                  <p className="text-xs text-slate-500">Review submitted work</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                Action Required
              </span>
            </Link>
            <Link to="/admin/transactions" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-amber-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-600">Pending Deposits</h4>
                  <p className="text-xs text-slate-500">{stats.pendingDeposits} requests waiting</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">
                {stats.pendingDeposits}
              </span>
            </Link>
            <Link to="/admin/transactions" className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-red-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ArrowUpCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-red-600">Pending Withdrawals</h4>
                  <p className="text-xs text-slate-500">{stats.pendingWithdrawals} requests waiting</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold rounded-full">
                {stats.pendingWithdrawals}
              </span>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Quick Settings</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/admin/settings" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <h3 className="font-bold text-slate-900">Platform Rules</h3>
              <p className="text-xs text-slate-500 mt-1">Min withdrawal, fees, etc.</p>
            </Link>
            <Link to="/admin/jobs" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
              <h3 className="font-bold text-slate-900">Post New Job</h3>
              <p className="text-xs text-slate-500 mt-1">Create a micro-task</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
