import React from 'react';
import { ShieldCheck, MessageSquare, Users, AlertCircle } from 'lucide-react';

export default function SupportDashboard() {
  const stats = [
    { label: 'Open Tickets', value: '12', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Active Users', value: '1,234', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Pending Proofs', value: '45', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Reports', value: '3', icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Support Dashboard</h1>
        <p className="text-slate-500">Manage user inquiries and platform integrity.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
        <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-900">No active tickets</h3>
        <p className="text-slate-500 mt-1">Great job! All user inquiries have been resolved.</p>
      </div>
    </div>
  );
}
