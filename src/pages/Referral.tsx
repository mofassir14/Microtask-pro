import React from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Users, Gift, Copy, CheckCircle2, Share2 } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

export default function Referral() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const referralLink = `${window.location.origin}/register?ref=${user?.referral_code}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    alert('Referral link copied to clipboard!');
  };

  const steps = [
    { title: 'Invite Friends', desc: 'Share your unique referral link with your friends and family.', icon: Share2, color: 'bg-indigo-500' },
    { title: 'They Join', desc: 'When they sign up using your link, they become your referrals.', icon: Users, color: 'bg-emerald-500' },
    { title: 'Earn Commission', desc: `Get ${settings?.referral_commission || '5'}% of everything they earn from completing jobs, forever!`, icon: Gift, color: 'bg-amber-500' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-slate-900">Refer & Earn</h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Invite your friends to {settings?.site_name || 'MicroTask Pro'} and earn a lifetime commission of {settings?.referral_commission || '5'}% on every task they complete.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step, idx) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center"
          >
            <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg", step.color)}>
              <step.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
            <p className="text-slate-500 text-sm leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-3xl font-bold">Your Referral Link</h2>
            <p className="text-indigo-100">Copy and share this link to start earning commissions.</p>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl font-mono text-sm w-full sm:w-auto overflow-hidden text-ellipsis whitespace-nowrap">
                {referralLink}
              </div>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors whitespace-nowrap"
              >
                <Copy className="w-4 h-4" />
                Copy Link
              </button>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center border border-white/20">
                <Gift className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-slate-900">Referral Stats</h2>
          <div className="px-4 py-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-600">
            Your Code: <span className="text-indigo-600">{user?.referral_code}</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">Total Referrals</p>
            <p className="text-3xl font-bold text-slate-900">0</p>
          </div>
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-slate-500 text-sm font-medium mb-1">Referral Earnings</p>
            <p className="text-3xl font-bold text-emerald-600">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  );
}
