import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { LayoutDashboard, Briefcase, Wallet, ArrowUpCircle, Users, Settings, LogOut, Shield, Menu, X, Lock, ShieldAlert } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { label: 'Find Jobs', icon: Briefcase, path: '/jobs' },
    { label: 'Deposit', icon: Wallet, path: '/deposit' },
    { label: 'Withdraw', icon: ArrowUpCircle, path: '/withdraw' },
    { label: 'Referrals', icon: Users, path: '/referral' },
    { label: 'Security', icon: Lock, path: '/profile#security' },
  ];

  const adminItems = [
    { label: 'Admin Panel', icon: ShieldAlert, path: '/admin' },
  ];

  const supportItems = [
    { label: 'Support Panel', icon: Shield, path: '/support' },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">{settings?.site_name || 'MicroTask Pro'}</span>
            {user?.role === 'premium' && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                Premium
              </span>
            )}
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
            {user?.role === 'support' && supportItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link to="/profile" className="flex flex-col items-end hover:opacity-80 transition-opacity">
              <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate max-w-[80px] sm:max-w-none">{user?.name}</span>
              <span className="text-[10px] sm:text-xs text-indigo-600 font-bold">{formatCurrency(user?.balance)}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="hidden sm:p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            {user?.role === 'admin' && adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            {user?.role === 'support' && supportItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-base font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-base font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
