import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Trash2, ExternalLink, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '../context/SocketContext';
import api from '../services/api';

const NotificationCenter = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, setNotifications, unreadCount, setUnreadCount, activeCritical } = useSocket();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.get('/notifications');
        if (data) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  const getTypeStyles = (type) => {
    switch (type) {
      case 'success': return { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' };
      case 'warning': return { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' };
      case 'error': return { icon: XCircle, color: 'text-rose-500', bg: 'bg-rose-50' };
      case 'approval': return { icon: Check, color: 'text-blue-500', bg: 'bg-blue-50' };
      default: return { icon: Info, color: 'text-slate-500', bg: 'bg-slate-50' };
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-3 rounded-2xl relative transition-all border border-transparent hover:border-slate-100 ${
          isOpen ? 'bg-slate-50 text-erp-blue' : 'text-slate-400 hover:bg-slate-50'
        } ${activeCritical ? 'animate-bounce border-rose-300 bg-rose-50/50 shadow-[0_0_15px_rgba(239,68,68,0.2)] text-rose-500' : ''}`}
      >
        <Bell size={20} className={activeCritical ? 'animate-pulse text-rose-600' : ''} />
        {unreadCount > 0 && (
          <span className={`absolute top-2.5 right-2.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-white border-2 border-white ${activeCritical ? 'bg-rose-600 animate-pulse' : 'bg-rose-500'}`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-[400px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-50"
          >
            <div className="p-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-black text-slate-900 tracking-tight">Notifications</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Recent Updates</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="text-xs font-bold text-erp-blue hover:text-blue-700 transition-colors"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-[450px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Bell size={32} className="opacity-20" />
                  </div>
                  <p className="text-sm font-bold">All caught up!</p>
                  <p className="text-xs">No new notifications for you.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {notifications.map((notification) => {
                    const { icon: Icon, color, bg } = getTypeStyles(notification.type);
                    return (
                      <div 
                        key={notification.id}
                        className={`p-4 hover:bg-slate-50 transition-all cursor-pointer relative group ${!notification.is_read ? 'bg-blue-50/20' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex gap-4">
                          <div className={`w-10 h-10 ${bg} ${color} rounded-xl flex items-center justify-center shrink-0`}>
                            <Icon size={20} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className={`text-sm font-bold truncate ${!notification.is_read ? 'text-slate-900' : 'text-slate-600'}`}>
                                {notification.title}
                              </h4>
                              <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap ml-2">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-erp-blue rounded-full mt-1 shrink-0"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-50 bg-slate-50/30">
              <button 
                className="w-full py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                View All Activity
                <ExternalLink size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
