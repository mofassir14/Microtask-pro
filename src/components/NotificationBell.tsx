import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, ChevronDown, Check, Briefcase } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';
import { toast } from 'sonner';

interface Notification {
  id: number;
  user_id: number | null;
  type: string;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export default function NotificationBell() {
  const { token } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [lastId, setLastId] = useState<number | null>(null);

  const fetchNotifications = async (showToasts = true) => {
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        
        // Check for new notifications to trigger toast
        if (data.length > 0) {
          const maxId = Math.max(...data.map((n: Notification) => n.id));
          if (showToasts && lastId !== null && maxId > lastId) {
            const newNotifs = data.filter((n: Notification) => n.id > lastId);
            newNotifs.forEach((n: Notification) => {
              if (n.type === 'new_job') {
                toast.info(n.title, { description: n.message, icon: <Briefcase className="w-4 h-4 text-indigo-500" /> });
              } else if (n.type === 'proof_approved') {
                toast.success(n.title, { description: n.message });
              } else {
                toast(n.title, { description: n.message });
              }
            });
          }
          setLastId(maxId);
        } else {
          setLastId(0);
        }
      }
    } catch (err) {
      console.error("Error fetching notifications", err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchNotifications(false); // don't toast on initial load
      const interval = setInterval(() => fetchNotifications(true), 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [token]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async () => {
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggle = () => {
    const newIsOpen = !isOpen;
    setIsOpen(newIsOpen);
    if (newIsOpen) {
      markAsRead();
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors flex items-center justify-center"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden z-50 origin-top-right animate-in fade-in slide-in-from-top-5 duration-200">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            <button
              onClick={markAsRead}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Mark all read
            </button>
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                <Bell className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm">You have no notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id} 
                    className={cn(
                      "p-4 hover:bg-slate-50 transition-colors cursor-default",
                      notif.is_read === 0 ? "bg-indigo-50/50" : ""
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {notif.type === 'new_job' ? (
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-indigo-600" />
                          </div>
                        ) : notif.type === 'proof_approved' ? (
                          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Bell className="w-4 h-4 text-slate-600" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className={cn(
                          "text-sm",
                          notif.is_read === 0 ? "font-bold text-slate-900" : "font-medium text-slate-700"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.message}</p>
                        <p className="text-[10px] text-slate-400 mt-2 uppercase tracking-wider font-bold">
                          {new Date(notif.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
