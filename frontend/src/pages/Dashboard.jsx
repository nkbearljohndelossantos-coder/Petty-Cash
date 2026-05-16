import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  FileText,
  Receipt,
  Users as UsersIcon,
  Filter,
  Download,
  Calendar,
  ArrowRight,
  MoreHorizontal,
  Activity,
  History
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon: Icon, trend, trendLabel, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="erp-card erp-card-hover p-5 group bg-white border border-slate-200 shadow-sm"
  >
    <div className="flex items-start justify-between">
      <div className="space-y-3">
        <p className="text-[11px] font-extrabold text-slate-500 uppercase tracking-[0.15em]">{title}</p>
        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {typeof value === 'number' ? `₱${value.toLocaleString()}` : value}
        </h3>
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-bold ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
              {trend >= 0 ? <ArrowUpRight size={12} strokeWidth={3} /> : <ArrowDownRight size={12} strokeWidth={3} />}
              <span>{Math.abs(trend)}%</span>
            </div>
          )}
          <span className="text-[11px] font-semibold text-slate-500">{trendLabel || 'vs last month'}</span>
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 shadow-lg bg-white border border-slate-100 text-slate-900`}>
        <Icon size={22} strokeWidth={2.5} className={`text-erp-blue`} />
      </div>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Chart Refs
  const trendRef = useRef(null);
  const allocationRef = useRef(null);

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('balance_updated', (data) => {
        console.log('Real-time balance update received:', data);
        fetchData();
      });

      return () => {
        socket.off('balance_updated');
      };
    }
  }, [socket]);

  const downloadChart = async (ref, filename) => {
    if (!ref.current) return;
    try {
      const svgElement = ref.current.querySelector('.recharts-surface');
      if (!svgElement) throw new Error('Chart SVG not found');
      const clonedSvg = svgElement.cloneNode(true);
      const copyStyles = (original, clone) => {
        const styles = window.getComputedStyle(original);
        for (const key of styles) {
          clone.style[key] = styles.getPropertyValue(key);
        }
        for (let i = 0; i < original.children.length; i++) {
          copyStyles(original.children[i], clone.children[i]);
        }
      };
      copyStyles(svgElement, clonedSvg);
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('width', '100%');
      rect.setAttribute('height', '100%');
      rect.setAttribute('fill', 'white');
      clonedSvg.insertBefore(rect, clonedSvg.firstChild);
      const svgData = new XMLSerializer().serializeToString(clonedSvg);
      const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      const size = svgElement.getBoundingClientRect();
      const scale = 3;
      canvas.width = size.width * scale;
      canvas.height = size.height * scale;
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `NKB_DASHBOARD_${filename}_${format(new Date(), 'MMM_dd_yyyy')}.png`.toUpperCase();
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
      img.src = `data:image/svg+xml;base64,${svgBase64}`;
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const fetchData = async () => {
    try {
      const [statsRes, trendsRes, catsRes] = await Promise.all([
        api.get('/analytics/stats'),
        api.get('/analytics/trends'),
        api.get('/analytics/categories')
      ]);
      setStats(statsRes.data);
      setTrends(trendsRes.data);
      setCategories(catsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4'];

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Approved': return <CheckCircle size={14} strokeWidth={3} className="text-emerald-500" />;
      case 'Pending': return <Clock size={14} strokeWidth={3} className="text-amber-500" />;
      case 'Rejected': return <AlertCircle size={14} strokeWidth={3} className="text-rose-500" />;
      default: return <History size={14} className="text-blue-500" />;
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-slate-100 opacity-20"></div>
        <div className="absolute inset-0 rounded-full border-4 border-erp-blue border-t-transparent animate-spin"></div>
      </div>
      <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] animate-pulse">Initializing Financial Analytics...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 font-medium mt-0.5 text-sm">Real-time expense monitoring and financial analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/reports')} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">
            <Download size={18} className="inline mr-2" />
            <span>Generate Reports</span>
          </button>
        </div>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Expenses" 
          value={stats?.totalExpenses} 
          icon={DollarSign} 
          trend={12.5} 
          color="blue"
          delay={0}
        />
        <StatCard 
          title="Today's Spend" 
          value={stats?.dailyExpenses || 0} 
          icon={TrendingUp} 
          trend={-8.2} 
          trendLabel="vs yesterday"
          color="indigo"
          delay={0.1}
        />
        <StatCard 
          title="Pending Approval" 
          value={stats?.pendingApproval || 0} 
          icon={Clock} 
          color="amber"
          delay={0.2}
        />
        <StatCard 
          title="Available Fund" 
          value={stats?.availableBalance} 
          icon={Wallet} 
          color="emerald"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div 
          ref={trendRef}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 erp-card p-6 bg-white border border-slate-200 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Expenses Trend</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Daily expenditure aggregate over time</p>
              </div>
              <button onClick={() => downloadChart(trendRef, 'expenses_trend')} className="p-1.5 text-slate-300 hover:text-erp-blue transition-colors">
                <Download size={16} />
              </button>
            </div>
            <div className="flex items-center gap-4 bg-white border border-slate-100 px-4 py-2 rounded-xl">
               <Activity size={16} className="text-erp-blue" />
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Real-time Data</span>
            </div>
          </div>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%" minHeight={400}>
              <AreaChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                   <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                   </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => format(new Date(str), 'MMM dd')} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }} 
                  tickFormatter={(val) => `₱${val > 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#fff', color: '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="total" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pie Chart */}
        <motion.div 
          ref={allocationRef}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="erp-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Category Allocation</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Distribution of funds across categories</p>
            </div>
            <button onClick={() => downloadChart(allocationRef, 'category_allocation')} className="p-1.5 text-slate-300 hover:text-erp-blue transition-colors">
              <Download size={16} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative">
             <div className="absolute flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Total</span>
                <span className="text-2xl font-black text-slate-800 leading-none mt-1">₱{stats?.totalExpenses?.toLocaleString() || '0'}</span>
             </div>
            <ResponsiveContainer width="100%" height={300} minHeight={300}>
              <PieChart>
                <Pie
                  data={categories.slice(0, 8)}
                  innerRadius={85}
                  outerRadius={110}
                  paddingAngle={8}
                  dataKey="total"
                  nameKey="name"
                  stroke="none"
                >
                  {categories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                   formatter={(val) => [`₱${val.toLocaleString()}`, 'Total']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 space-y-4">
            {categories.slice(0, 4).map((cat, i) => (
              <div key={cat.name} className="flex items-center justify-between group cursor-default">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                  <span className="text-sm font-bold text-slate-600 uppercase tracking-tight">{cat.name}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 tracking-tight">₱{parseFloat(cat.total).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Recent Activity Table */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3 erp-card bg-white border border-slate-200 shadow-sm"
        >
          <div className="p-6 flex items-center justify-between border-b border-slate-100">
            <div>
              <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Latest Voucher Feed</h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Real-time stream of manufacturing expenditures</p>
            </div>
            <button onClick={() => navigate('/expenses')} className="text-erp-blue hover:text-blue-700 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 bg-white border border-slate-200 rounded-lg transition-all">Full Ledger</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead>
                <tr className="bg-white">
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Requester</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Category</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100">Date</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-right">Amount</th>
                  <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-100 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats?.recentExpenses?.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs uppercase">
                            {expense.requested_by.split(' ').map(n => n[0]).join('')}
                         </div>
                         <div>
                           <p className="font-bold text-slate-900 tracking-tight">{expense.requested_by}</p>
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{expense.department_name}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 rounded-lg border border-slate-100 bg-white text-slate-600 text-[10px] font-black uppercase tracking-widest">{expense.category_name}</span>
                    </td>
                    <td className="px-8 py-5 text-sm font-bold text-slate-500">
                      {format(new Date(expense.date), 'MMM dd')}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="font-black text-slate-900 tracking-tight">₱{parseFloat(expense.amount).toLocaleString()}</div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <div className="flex items-center justify-center gap-1.5 font-bold text-[11px] uppercase tracking-wider">
                        {getStatusIcon(expense.status)}
                        <span className={expense.status === 'Approved' ? 'text-emerald-500' : expense.status === 'Pending' ? 'text-amber-500' : 'text-slate-500'}>
                          {expense.status}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Quick Actions Analysis */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="erp-card p-6 bg-white border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="mb-6 text-center">
            <h3 className="text-lg font-extrabold text-slate-800 tracking-tight">Quick Actions</h3>
          </div>
          <div className="space-y-3">
             <button onClick={() => navigate('/expenses')} className="w-full px-6 py-4 bg-erp-blue text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-blue-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
               <Receipt size={20} />
               <span>New Expense</span>
             </button>
             <button onClick={() => navigate('/reports')} className="w-full px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
               <FileText size={20} />
               <span>Audit Reports</span>
             </button>
             <button onClick={() => navigate('/users')} className="w-full px-6 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
               <UsersIcon size={20} />
               <span>Manage Personnel</span>
             </button>
          </div>

          <div className="mt-10 p-6 bg-white rounded-2xl border border-dashed border-slate-200">
             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center mb-4">Dept Expenditure</h4>
             <div className="space-y-4">
                {stats?.departmentBreakdown?.map(d => (
                  <div key={d.name}>
                    <div className="flex justify-between text-xs font-bold mb-1.5">
                      <span className="text-slate-600 uppercase tracking-tight">{d.name}</span>
                      <span className="text-slate-900">₱{(d.total / 1000).toFixed(1)}k</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <div className="h-full bg-erp-blue rounded-full" style={{ width: `${(d.total / (stats?.totalExpenses || 1)) * 100}%` }}></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
