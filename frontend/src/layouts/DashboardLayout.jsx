import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  FileText, 
  Tag,
  Building2,
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Bell,
  Search,
  ChevronRight,
  ChevronLeft,
  User,
  Calendar,
  Wallet,
  History,
  Database,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import api from '../services/api';
import logo from '../assets/logo.png';

const SidebarItem = ({ icon: Icon, label, to, active, collapsed, external }) => {
  const linkContent = (
    <>
      {active && !external && <div className="sidebar-glow" />}
      <div className={`sidebar-erp-link w-full ${active && !external ? 'sidebar-erp-link-active' : ''} ${collapsed ? 'justify-center px-0' : ''}`}>
        <Icon size={18} className={`${active && !external ? 'text-white' : 'text-slate-400 group-hover:text-white'} transition-colors`} />
        {!collapsed && <span className="text-sm">{label}</span>}
        {!collapsed && active && !external && <ChevronRight size={12} className="ml-auto opacity-50" />}
      </div>
      
      <div className="sidebar-tooltip">
        {label}
        {/* Tooltip Arrow */}
        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
      </div>
    </>
  );

  if (external) {
    return (
      <a href={to} target="_blank" rel="noopener noreferrer" className="relative group flex items-center">
        {linkContent}
      </a>
    );
  }

  return (
    <Link to={to} className="relative group flex items-center">
      {linkContent}
    </Link>
  );
};

import NotificationCenter from '../components/NotificationCenter';

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [balance, setBalance] = useState(0);
  const { user, logout } = useAuth();
  const { activeCritical, acknowledgeCritical } = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const res = await api.get('/funds/balance');
        setBalance(res.data.balance);
      } catch (err) {
        console.error(err);
      }
    };
    fetchBalance();
  }, [location.pathname]); // Refresh on navigation

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/' },
    { icon: Receipt, label: 'Expenses', to: '/expenses' },
    { icon: Wallet, label: 'Funds', to: '/funds', roles: ['Super Admin'] },
    { icon: PieChart, label: 'Analytics', to: '/analytics' },
    { icon: FileText, label: 'Reports', to: '/reports' },
    { icon: Tag, label: 'Categories', to: '/categories' },
    { icon: Building2, label: 'Cost Centers', to: '/departments', roles: ['Super Admin', 'Accounting'] },
    { icon: Bell, label: 'Notification Center', to: '/email-automation', roles: ['Super Admin', 'Accounting'] },
    { icon: History, label: 'Audit Logs', to: '/logs', roles: ['Super Admin'] },
    { icon: Database, label: 'Maintenance', to: '/maintenance', roles: ['Super Admin'] },
    { icon: Settings, label: 'Settings', to: '/settings', roles: ['Super Admin'] },
    { icon: BookOpen, label: 'User Manual', to: '/user-manual' },
  ];

  const filteredNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  return (
    <div className="flex h-screen w-full bg-white">
      {/* Sidebar - Desktop (The only non-white part) */}
      <motion.aside 
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        className="hidden lg:flex flex-col bg-[#0f172a] text-white overflow-visible z-30 shadow-2xl relative"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent pointer-events-none opacity-50" />

        <div className="p-4 pb-4 flex flex-col items-center justify-center relative z-10 border-b border-slate-800/55">
          {/* Fries Menu Button - Absolute Positioned */}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className={`absolute top-3 ${collapsed ? 'left-1/2 -translate-x-1/2' : 'right-3'} p-2 hover:bg-white/10 rounded-xl text-slate-400 transition-colors z-20`}
            title={collapsed ? "Expand Menu" : "Collapse Menu"}
          >
            <Menu size={20} className="opacity-75" />
            <div className="sidebar-tooltip">
              {collapsed ? 'Expand Menu' : 'Collapse Menu'}
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
          </button>
          
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center justify-center px-1 pt-4"
            >
              <img src={logo} alt="NKB Petty Cash Logo" className="h-36 w-auto object-contain" />
            </motion.div>
          )}
        </div>

        <div className="px-4 py-2 relative z-10">
          <p className={`text-[10px] font-bold text-slate-500 uppercase tracking-widest px-4 mb-4 ${collapsed ? 'text-center opacity-0' : ''}`}>Main Menu</p>
          <nav className="space-y-1.5">
            {filteredNavItems.map((item) => (
              <SidebarItem 
                key={item.to} 
                {...item} 
                active={location.pathname === item.to} 
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4 relative z-10 border-t border-white/5">
          {!collapsed && (
            <div className="bg-white/5 rounded-2xl p-4 mb-4 border border-white/5">
              <p className="text-xs text-slate-400 mb-2 font-medium">Petty Cash Fund</p>
              <h3 className="text-xl font-bold text-emerald-400">₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h3>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Real-time Balance</p>
            </div>
          )}
          <button 
            onClick={handleLogout}
            className={`w-full relative group flex items-center gap-3 px-4 py-3.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all duration-300 ${collapsed ? 'justify-center px-0' : ''}`}
          >
            <LogOut size={20} />
            {!collapsed && <span className="font-semibold text-[15px]">Sign Out</span>}
            
            <div className="sidebar-tooltip">
              Sign Out
              <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
            </div>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-white">
        {/* Navbar */}
        <header className="h-14 flex items-center justify-between px-6 bg-white border-b border-slate-100 z-20">
          <div className="flex items-center gap-6">
            <button className="lg:hidden p-2.5 bg-slate-50 rounded-xl text-slate-500" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={22} />
            </button>

            <div className="hidden lg:flex items-center gap-3">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {navItems.find(i => i.to === location.pathname)?.label || 'Overview'}
              </h2>
            </div>

            <div className="hidden md:flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 w-80 focus-within:ring-2 focus-within:ring-erp-blue/20 transition-all">
              <Search size={18} className="text-slate-400" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="bg-transparent border-none focus:ring-0 text-sm text-slate-900 w-full placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {collapsed && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-2xl text-emerald-700 shadow-sm"
              >
                <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">Petty Cash:</span>
                <span className="text-sm font-black text-emerald-600">₱{balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </motion.div>
            )}

            <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-slate-600 cursor-pointer hover:bg-slate-50 transition-colors">
              <Calendar size={16} />
              <span className="text-xs font-bold">{format(new Date(), 'MMMM d, yyyy')}</span>
            </div>

            <NotificationCenter />

            <div className="h-8 w-px bg-slate-100 mx-2"></div>

            <div 
              className="flex items-center gap-3 pl-2 group cursor-pointer"
              onClick={() => navigate('/profile')}
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-black text-slate-900 leading-none tracking-tight">{user?.full_name}</p>
                <p className="text-[9px] text-slate-500 mt-1 font-bold uppercase tracking-widest">{user?.role}</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-erp-blue to-blue-400 flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform overflow-hidden">
                <User size={18} fill="currentColor" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-5 relative scroll-smooth bg-white">
          <div className="max-w-[1366px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 z-40 lg:hidden backdrop-blur-md"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-80 bg-[#0f172a] z-50 lg:hidden flex flex-col shadow-2xl"
            >
              <div className="p-8 flex items-center justify-between">
                <img src={logo} alt="NKB Petty Cash Logo" className="h-36 w-auto object-contain" />
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>
              <nav className="flex-1 px-4 space-y-1.5">
                {filteredNavItems.map((item) => (
                  <SidebarItem 
                    key={item.to} 
                    {...item} 
                    active={location.pathname === item.to} 
                    collapsed={false}
                  />
                ))}
              </nav>
              <div className="p-6 border-t border-white/5">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-4 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-2xl transition-all font-semibold"
                >
                  <LogOut size={20} />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* GLOBAL CRITICAL ALARM MODAL */}
      <AnimatePresence>
        {activeCritical && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md animate-pulse duration-[3000ms]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 15 }}
              className="bg-slate-900 border border-rose-500/50 rounded-[2.5rem] shadow-[0_0_50px_rgba(239,68,68,0.4)] w-full max-w-lg p-10 text-center relative overflow-hidden"
            >
              {/* Pulsing red background glow */}
              <div className="absolute -inset-10 bg-rose-600/10 rounded-full blur-3xl animate-ping opacity-50" />
              
              <div className="relative z-10 space-y-8">
                <div className="mx-auto w-24 h-24 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center border border-rose-500/30 animate-bounce">
                  <Bell size={48} className="animate-spin duration-1000" />
                </div>
                
                <div>
                  <span className="px-4 py-1.5 bg-rose-500/20 text-rose-400 rounded-full text-xs font-black uppercase tracking-[0.2em] border border-rose-500/30">
                    CRITICAL ALARM WARNING
                  </span>
                  <h2 className="text-3xl font-black text-white tracking-tight mt-6 leading-tight">
                    {activeCritical.title}
                  </h2>
                  <p className="text-rose-200/70 text-sm mt-4 font-medium leading-relaxed bg-rose-950/30 p-6 rounded-2xl border border-rose-900/40 shadow-inner">
                    {activeCritical.message}
                  </p>
                </div>

                <div className="pt-4">
                  <button
                    onClick={() => acknowledgeCritical(activeCritical.id)}
                    className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-xs transition-all shadow-[0_0_30px_rgba(239,68,68,0.4)] hover:shadow-[0_0_40px_rgba(239,68,68,0.6)] active:scale-95 border border-rose-400/30 flex items-center justify-center gap-3"
                  >
                    Acknowledge Alert & Mute Alarm
                  </button>
                  <p className="text-[10px] text-slate-500 mt-4 font-semibold uppercase tracking-widest">
                    This warning requires manual acknowledgment to mute.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DashboardLayout;
