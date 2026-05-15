import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, AlertCircle, CheckCircle2, Clock, RotateCcw, BarChart3, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const StatCard = ({ label, value, icon: Icon, color, subtext }) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 ${color.replace('text-', 'bg-')}/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform`} />
    <div className="relative z-10">
      <div className={`w-14 h-14 ${color.replace('text-', 'bg-')}/10 ${color} rounded-2xl flex items-center justify-center mb-6`}>
        <Icon size={28} />
      </div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h3>
      <p className="text-xs text-slate-500 mt-2 font-medium">{subtext}</p>
    </div>
  </div>
);

const QueueMonitor = () => {
  const [stats, setStats] = useState({
    active: 0,
    waiting: 0,
    completed: 0,
    failed: 0,
    delayed: 0,
    system: 'Redis (BullMQ)'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real scenario, this would poll a backend endpoint that summarizes BullMQ stats
    const fetchStats = async () => {
      setLoading(true);
      try {
        // Mocking for now, as Bull Board handles the detailed view
        setStats({
          active: 0,
          waiting: 5,
          completed: 128,
          failed: 2,
          delayed: 0,
          system: 'Redis (BullMQ)'
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
              <Activity size={32} />
            </div>
            Queue Health Monitor
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Real-time status of background processes and notification workers.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-wider">
            <Server size={14} />
            {stats.system} Online
          </div>
          <button className="erp-button-primary py-3.5 px-6">
            <RotateCcw size={18} />
            Retry All Failed
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Active Jobs" 
          value={stats.active} 
          icon={Zap} 
          color="text-blue-600" 
          subtext="Processing right now" 
        />
        <StatCard 
          label="Waiting" 
          value={stats.waiting} 
          icon={Clock} 
          color="text-amber-500" 
          subtext="In queue for execution" 
        />
        <StatCard 
          label="Completed" 
          value={stats.completed} 
          icon={CheckCircle2} 
          color="text-emerald-500" 
          subtext="Successfully delivered" 
        />
        <StatCard 
          label="Failed" 
          value={stats.failed} 
          icon={AlertCircle} 
          color="text-rose-500" 
          subtext="Awaiting manual retry" 
        />
      </div>

      {/* Bull Board Link */}
      <div className="bg-slate-900 rounded-[40px] p-12 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-erp-blue/20 blur-[100px] -mr-32" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
              <BarChart3 size={32} />
            </div>
            <h2 className="text-4xl font-black tracking-tight leading-tight">Advanced Queue Management Dashboard</h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-xl">
              Access the technical Bull Board interface for granular control over every job, 
              real-time progress monitoring, and detailed failure analysis.
            </p>
            <a 
              href="http://localhost:5000/admin/queues" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm hover:bg-slate-100 transition-all active:scale-95"
            >
              Open Technical Dashboard
              < Zap size={18} fill="currentColor" />
            </a>
          </div>
          <div className="w-full md:w-1/3 aspect-video bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center p-8">
            <div className="w-full space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-4 bg-white/10 rounded-full w-full relative overflow-hidden">
                  <motion.div 
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{ duration: 2, repeat: Infinity, delay: i * 0.5 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-erp-blue/40 to-transparent"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueueMonitor;
