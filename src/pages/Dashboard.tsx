import React from 'react';
import { useAuth } from '../AuthContext';
import { Wallet, TrendingUp, Download, Users, Briefcase, ChevronRight, ShieldCheck, Star, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { formatCurrency, cn } from '../lib/utils';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [activities, setActivities] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchActivity = async () => {
      try {
        const res = await fetch('/api/user/activity', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setActivities(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchActivity();
  }, [token]);

  const stats = [
    { label: 'Available Balance', value: user?.balance || 0, icon: Wallet, color: 'bg-indigo-500', textColor: 'text-indigo-600' },
    { label: 'Total Earned', value: user?.total_earned || 0, icon: TrendingUp, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { label: 'Total Deposited', value: user?.total_deposited || 0, icon: Download, color: 'bg-amber-500', textColor: 'text-amber-600' },
  ];

  const getLevelThresholds = (level: number) => {
    const thresholds = [0, 5, 15, 30, 50, 100];
    const current = thresholds[level - 1] || 0;
    const next = thresholds[level] || thresholds[thresholds.length - 1];
    return { current, next };
  };

  const { current, next } = getLevelThresholds(user?.level || 1);
  const progress = user?.level === 6 ? 100 : Math.min(100, ((user?.completed_tasks || 0) - current) / (next - current) * 100);

  return (
    <div className="space-y-8">
      {/* Ad Banner */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-100"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold mb-2">Boost Your Earnings!</h2>
            <p className="text-indigo-100 max-w-md">Refer friends and get 5% lifetime commission on every task they complete. Start sharing your link today.</p>
            <Link to="/referral" className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
              Get Started
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="hidden lg:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
              <TrendingUp className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      </motion.div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {user?.name}!</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-slate-500">User ID: #{user?.id?.toString().padStart(5, '0')}</p>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1 text-indigo-600 font-semibold text-sm">
              <ShieldCheck className="w-4 h-4" />
              {user?.role?.toUpperCase() || 'USER'}
            </div>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1 text-amber-600 font-semibold text-sm">
              <Trophy className="w-4 h-4" />
              Level {user?.level || 1}
            </div>
            <span className="w-1 h-1 bg-slate-300 rounded-full" />
            <div className="flex items-center gap-1 text-indigo-600 font-semibold text-sm">
              <Star className="w-4 h-4" />
              {user?.reputation || 0} Rep
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user?.role === 'admin' && (
            <Link to="/admin" className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Admin Panel
            </Link>
          )}
          <Link to="/deposit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors">
            Deposit
          </Link>
          <Link to="/withdraw" className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors">
            Withdraw
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatCurrency(stat.value)}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Level Progress</h3>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                {user?.level === 6 ? 'MAX' : `LVL ${user?.level || 1}`}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>{user?.completed_tasks || 0} tasks completed</span>
                <span>{user?.level === 6 ? '∞' : next} tasks</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-indigo-600 rounded-full"
                />
              </div>
              {user?.level !== 6 && (
                <p className="text-[10px] text-slate-400 text-center italic">
                  {next - (user?.completed_tasks || 0)} more tasks to reach Level {user?.level ? user.level + 1 : 2}
                </p>
              )}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Reputation Score</span>
              <span className="font-bold text-slate-900">{user?.reputation || 0}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/jobs" className="p-4 bg-slate-50 rounded-xl hover:bg-indigo-50 transition-colors group">
              <Briefcase className="w-6 h-6 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-slate-900">Find Jobs</h3>
              <p className="text-xs text-slate-500 mt-1">Browse available micro-tasks</p>
            </Link>
            <Link to="/referral" className="p-4 bg-slate-50 rounded-xl hover:bg-emerald-50 transition-colors group">
              <Users className="w-6 h-6 text-emerald-600 mb-2" />
              <h3 className="font-semibold text-slate-900">Refer Friends</h3>
              <p className="text-xs text-slate-500 mt-1">Earn 5% commission</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <button className="text-sm text-indigo-600 font-medium hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
              ))
            ) : activities.length > 0 ? (
              activities.map((activity, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    activity.type === 'proof' ? "bg-indigo-100" : "bg-emerald-100"
                  )}>
                    {activity.type === 'proof' ? (
                      <Briefcase className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Download className="w-5 h-5 text-emerald-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900">
                      {activity.type === 'proof' ? activity.job_title : `${activity.sub_type.charAt(0).toUpperCase() + activity.sub_type.slice(1)}`}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {activity.sub_type.charAt(0).toUpperCase() + activity.sub_type.slice(1)} • {formatCurrency(activity.amount)}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-slate-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
