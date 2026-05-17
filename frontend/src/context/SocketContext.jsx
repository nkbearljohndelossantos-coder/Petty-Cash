import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

// --- TAB SOUND LOCK ENGINE (Prevents audio duplication across multiple tabs) ---
const tabId = Math.random().toString(36).substring(2, 9);
const canPlaySound = () => {
  const activeTab = localStorage.getItem('nkb_active_alarm_tab');
  const activeHeartbeat = parseInt(localStorage.getItem('nkb_active_alarm_heartbeat') || '0');
  const now = Date.now();
  
  if (!activeTab || activeTab === tabId || (now - activeHeartbeat > 2500)) {
    localStorage.setItem('nkb_active_alarm_tab', tabId);
    localStorage.setItem('nkb_active_alarm_heartbeat', now.toString());
    return true;
  }
  return false;
};

// --- WEB AUDIO API SYNTHESIZER ENGINE (100% reliable direct browser synthesis) ---
let audioCtx = null;
let soundOscillators = [];

const stopSounds = () => {
  soundOscillators.forEach(osc => {
    try { osc.stop(); } catch(e) {}
  });
  soundOscillators = [];
};

const playNormalSound = () => {
  if (!canPlaySound()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Nice high electronic chime (Ding!)
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6
    
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.5);
  } catch (err) {
    console.error('[Audio Engine] Chime failed:', err);
  }
};

const playImportantSound = () => {
  if (!canPlaySound()) return;
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Rapid double-beep warning
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.setValueAtTime(0.01, ctx.currentTime + 0.1);
    
    // Second beep
    osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.22);
    gain.gain.setValueAtTime(0.3, ctx.currentTime + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.38);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.45);
  } catch (err) {
    console.error('[Audio Engine] Important warning failed:', err);
  }
};

const startCriticalAlarm = () => {
  stopSounds();
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Repeating urgent radar beep (continuous looping every second)
  const interval = setInterval(() => {
    if (!canPlaySound()) return;
    
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.35); // A5
      
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.55);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);
      
      soundOscillators.push(osc);
      
      // Periodically truncate list sizes
      if (soundOscillators.length > 30) {
        soundOscillators.shift();
      }
    } catch(e) {
      console.error('[Audio Engine] Looping alarm failed:', e);
    }
  }, 1000);
  
  return interval;
};

export const SocketProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeCritical, setActiveCritical] = useState(null);

  // 1. Fetch recent notifications on boot/login to check for historic unread critical alerts
  const fetchUnreadNotifications = async () => {
    if (!token) return;
    try {
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      const res = await fetch(`${apiUrl}/api/notifications`, {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      const data = await res.json();
      if (data && data.notifications) {
        // Compare with current state to discover newly arrived notifications!
        setNotifications(prev => {
          const prevIds = new Set(prev.map(n => n.id));
          const newNotifications = data.notifications.filter(n => !prevIds.has(n.id));
          
          if (newNotifications.length > 0) {
            console.log('[Polling Fallback] Detected new notifications:', newNotifications);
            
            // Dispatch priority, sound alerts, and critical modals on new arrivals
            newNotifications.forEach(notification => {
              if (notification.priority === 'critical') {
                setActiveCritical(notification);
              } else if (notification.priority === 'important') {
                playImportantSound();
              } else {
                playNormalSound();
              }
              
              // Browser push alert
              if (Notification.permission === 'granted') {
                new Notification(notification.title, {
                  body: notification.message
                });
              }

              // Dispatch custom window event so pages (like EmailAutomation.jsx) update live instantly!
              window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));
            });
          }
          return data.notifications;
        });

        setUnreadCount(data.unreadCount || 0);
        
        // Find if there's any unread critical notification that hasn't been acknowledged
        const criticalNotif = data.notifications.find(n => n.priority === 'critical' && (!n.is_read || !n.acknowledged));
        if (criticalNotif) {
          setActiveCritical(criticalNotif);
        } else {
          setActiveCritical(null);
        }
      }
    } catch (err) {
      console.error('[SocketProvider] Failed fetching notifications:', err);
    }
  };

  // 1.5 Fallback Periodic Polling Loop: Runs every 7 seconds to keep dashboard, notifications, and ledger real-time
  useEffect(() => {
    if (!user || !token) return;

    // Run immediately on mount
    fetchUnreadNotifications();
    window.dispatchEvent(new Event('balance_updated'));

    const interval = setInterval(() => {
      fetchUnreadNotifications();
      window.dispatchEvent(new Event('balance_updated'));
    }, 7000);

    return () => clearInterval(interval);
  }, [user, token]);

  useEffect(() => {
    if (user && token) {
      const newSocket = io(import.meta.env.VITE_API_URL || window.location.origin, {
        auth: { token },
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000
      });

      newSocket.on('connect', () => {
        console.log('[Socket.IO] Connected & Synchronized successfully.');
      });

      newSocket.on('new_notification', (notification) => {
        setNotifications(prev => {
          if (prev.some(n => n.id === notification.id)) return prev;
          
          // Sound dispatch and priority logic
          if (notification.priority === 'critical') {
            setActiveCritical(notification);
          } else if (notification.priority === 'important') {
            playImportantSound();
          } else {
            playNormalSound();
          }

          // Browser push alert
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message
            });
          }

          // Dispatch custom window event so pages (like EmailAutomation.jsx) update live instantly!
          window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));

          return [notification, ...prev];
        });
        setUnreadCount(prev => prev + 1);
      });

      // Support custom receiveNotification event to match example
      newSocket.on('receiveNotification', (data) => {
        console.log('[Socket.IO] Received receiveNotification custom user event:', data);
        
        // Map to a normalized notification object
        const notification = {
          id: Date.now() + Math.random(),
          title: data.postTitle || 'New Post Notification',
          message: `Post Created By: ${data.postCreatedBy || 'Admin'}`,
          type: 'info',
          priority: 'normal',
          category: 'general',
          acknowledged: false,
          archived: false,
          created_at: new Date()
        };

        setNotifications(prev => {
          if (prev.some(n => n.message === notification.message)) return prev;
          
          playNormalSound();

          // Browser push alert
          if (Notification.permission === 'granted') {
            new Notification(notification.title, {
              body: notification.message
            });
          }

          // Dispatch custom window event so pages (like EmailAutomation.jsx) update live instantly!
          window.dispatchEvent(new CustomEvent('new_notification', { detail: notification }));

          return [notification, ...prev];
        });
        setUnreadCount(prev => prev + 1);
      });

      // Listen for global balance updates to refresh UI live
      newSocket.on('balance_updated', () => {
        window.dispatchEvent(new Event('balance_updated'));
      });

      setSocket(newSocket);

      return () => newSocket.close();
    } else {
      setSocket(null);
      setNotifications([]);
      setUnreadCount(0);
      setActiveCritical(null);
    }
  }, [user, token]);

  // Multi-tab audio engine synchronization: instantly mute if alarm acknowledged in another tab
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'nkb_mute_alarm') {
        console.log('[Multi-Tab Audio Engine] Detected alarm mute from another tab:', e.newValue);
        setActiveCritical(null);
        stopSounds();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // 2. Continuous looping alarm trigger effect for CRITICAL warnings
  useEffect(() => {
    let alarmInterval = null;
    
    if (activeCritical) {
      alarmInterval = startCriticalAlarm();
    } else {
      stopSounds();
    }
    
    return () => {
      if (alarmInterval) clearInterval(alarmInterval);
      stopSounds();
    };
  }, [activeCritical]);

  // Keep lock heartbeat active for looping alarm
  useEffect(() => {
    let heartbeatInterval = null;
    if (activeCritical) {
      heartbeatInterval = setInterval(() => {
        localStorage.setItem('nkb_active_alarm_heartbeat', Date.now().toString());
      }, 1000);
    }
    return () => {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    };
  }, [activeCritical]);

  // Acknowledge a critical notification
  const acknowledgeCritical = async (id) => {
    if (!token) return;
    try {
      // Write to localStorage for instant cross-tab mute
      localStorage.setItem('nkb_mute_alarm', id.toString() + '_' + Date.now());
      
      const apiUrl = import.meta.env.VITE_API_URL || window.location.origin;
      await fetch(`${apiUrl}/api/notifications/${id}/acknowledge`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, acknowledged: true, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      if (activeCritical && activeCritical.id === id) {
        setActiveCritical(null);
      }
    } catch (err) {
      console.error('[SocketProvider] Acknowledge failed:', err);
    }
  };

  const value = {
    socket,
    notifications,
    setNotifications,
    unreadCount,
    setUnreadCount,
    activeCritical,
    setActiveCritical,
    acknowledgeCritical,
    refreshNotifications: fetchUnreadNotifications
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
