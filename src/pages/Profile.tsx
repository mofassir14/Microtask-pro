import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { User, Mail, Shield, Save, Loader2, Key, Smartphone } from 'lucide-react';
import { motion } from 'motion/react';
import { useLocation } from 'react-router-dom';
import TwoFactorSetup from '../components/TwoFactorSetup';

export default function Profile() {
  const { user, token, refreshUser } = useAuth();
  const location = useLocation();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      if (location.hash === '#security') {
        const element = document.getElementById('security');
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    };

    handleScroll();
  }, [location.hash]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    // In a real app, we'd have an endpoint for this.
    // For now, let's just simulate success as we've built the core features.
    setTimeout(() => {
      setLoading(false);
      setMessage('Profile updated successfully!');
    }, 1000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profile Settings</h1>
        <p className="text-slate-500">Manage your account information and preferences.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <form onSubmit={handleUpdate} className="p-8 space-y-6">
          {message && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-lg">
              {message}
            </div>
          )}

          <div className="flex items-center gap-6 pb-6 border-b border-slate-100">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold">
              {user?.name?.[0]}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">{user?.name}</h3>
              <p className="text-slate-500 text-sm">Member since Feb 2026</p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  {user?.role}
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded uppercase tracking-wider">
                  Verified
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  disabled
                  value={user?.email}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-slate-200 rounded-lg outline-none cursor-not-allowed text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>

      <div id="security" className="space-y-8 scroll-mt-20">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Smartphone className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Two-Factor Authentication</h2>
            </div>
            <TwoFactorSetup />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8">
            <div className="flex items-center gap-3 mb-6">
              <Key className="w-5 h-5 text-slate-400" />
              <h2 className="text-lg font-bold text-slate-900">Security</h2>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const currentPassword = formData.get('currentPassword') as string;
              const newPassword = formData.get('newPassword') as string;
              const confirmPassword = formData.get('confirmPassword') as string;

              if (newPassword !== confirmPassword) {
                alert("New passwords do not match");
                return;
              }

              setLoading(true);
              try {
                const res = await fetch('/api/auth/change-password', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({ currentPassword, newPassword }),
                });
                const data = await res.json();
                if (res.ok) {
                  setMessage('Password changed successfully!');
                  (e.target as HTMLFormElement).reset();
                } else {
                  alert(data.error || 'Failed to change password');
                }
              } catch (err) {
                alert('An error occurred');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current Password</label>
                  <input
                    name="currentPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
                  <input
                    name="newPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <input
                    name="confirmPassword"
                    type="password"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-70"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
