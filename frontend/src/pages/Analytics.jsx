import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  Legend, ComposedChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, 
  Filter, Download, ChevronRight, PieChart as PieIcon,
  Activity, BarChart3, Layers, Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays } from 'date-fns';

const Analytics = () => {
  const [trends, setTrends] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [viewMode, setViewMode] = useState('active'); // 'active' or 'historical'
  
  // Refs for download
  const dateRangeRef = useRef(null);
  const categoryRef = useRef(null);
  const distributionRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [viewMode]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // If historical, we could pass a param to get older data
      const params = viewMode === 'historical' ? { range: 'historical' } : {};
      const [trendsRes, catsRes, statsRes] = await Promise.all([
        api.get('/analytics/trends', { params }),
        api.get('/analytics/categories', { params }),
        api.get('/analytics/stats', { params })
      ]);
      setTrends(trendsRes.data);
      setCategories(catsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
        link.download = `NKB_REPORT_${filename}_${format(new Date(), 'MMM_dd_yyyy')}.png`.toUpperCase();
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

  const COLORS = ['#2563eb', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#475569', '#6366f1'];

  // Get unique category names for bars
  const categoryNames = categories.map(c => c.name);

  // Filter trends for specific category chart
  const filteredCategoryData = trends.map(item => ({
    date: item.date,
    amount: item[selectedCategory] || 0
  })).filter(item => item.amount > 0 || selectedCategory === 'All');

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-erp-blue border-t-transparent rounded-full animate-spin"></div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Processing Big Data Analytics...</p>
    </div>
  );

  return (
    <div className="space-y-8 fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Financial Intelligence</h1>
          <p className="text-slate-500 font-medium mt-1">Multi-dimensional analysis of petty cash expenditures.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
             <button 
               onClick={() => setViewMode('active')}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'active' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
             >
               Active Analysis
             </button>
             <button 
               onClick={() => setViewMode('historical')}
               className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'historical' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}
             >
               Historical Archive
             </button>
          </div>
        </div>
      </div>

      {/* 1. GRAPH BY DATE RANGE (Stacked Bar) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="erp-card bg-white p-10 border border-slate-200 shadow-sm"
      >
        <div className="flex items-center justify-between mb-10">
          <div>
            <div className="flex items-center gap-3">
               <div className="bg-yellow-400 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2">Graph by Date Range</div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Daily Expenditure Breakdown</h3>
            <p className="text-sm text-slate-500 font-bold mt-1">Cross-categorical aggregate over time</p>
          </div>
          <button 
            onClick={() => downloadChart(dateRangeRef, 'date_range_breakdown')}
            className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-slate-900/20 hover:scale-[1.02] transition-all flex items-center gap-2"
          >
            <Download size={18} />
            <span>Export Graph</span>
          </button>
        </div>

        <div className="h-[500px]" ref={dateRangeRef}>
          <ResponsiveContainer width="100%" height="100%" minHeight={500}>
            <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis 
                dataKey="date" 
                tickFormatter={(str) => format(new Date(str), 'MMM dd')}
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val) => `₱${val.toLocaleString()}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', padding: '20px', backgroundColor: '#fff', color: '#000' }}
                itemStyle={{ fontSize: '12px', fontWeight: '800', textTransform: 'uppercase' }}
              />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '40px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }} />
              {categoryNames.slice(0, 10).map((name, index) => (
                <Bar key={name} dataKey={name} stackId="a" fill={COLORS[index % COLORS.length]} radius={index === 0 ? [0, 0, 4, 4] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 2. GRAPH BY CATEGORY */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="erp-card bg-white p-10 border border-slate-200 shadow-sm"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="bg-yellow-400 px-3 py-1 rounded text-[10px] font-black uppercase tracking-widest text-slate-900 mb-2 w-fit">Graph by Category</div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Category Intensity</h3>
            </div>
            <div className="flex items-center gap-3">
               <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest outline-none focus:ring-4 focus:ring-erp-blue/10 text-slate-900"
               >
                 <option value="All">All Categories</option>
                 {categoryNames.map(name => <option key={name} value={name}>{name}</option>)}
               </select>
               <button onClick={() => downloadChart(categoryRef, `category_${selectedCategory.toLowerCase()}`)} className="p-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
                  <Download size={18} />
               </button>
            </div>
          </div>

          <div className="h-[350px]" ref={categoryRef}>
            <ResponsiveContainer width="100%" height="100%" minHeight={350}>
              <BarChart data={filteredCategoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(str) => format(new Date(str), 'MMM dd')}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#fff', color: '#000', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="amount" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* 3. Distribution & Summary */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="erp-card bg-white p-10 border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="mb-8">
            <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase tracking-[0.1em]">Allocation Matrix</h3>
            <p className="text-xs text-slate-500 font-bold mt-1">Relative weight of departments</p>
          </div>
          
          <div className="flex-1 flex items-center justify-center relative" ref={distributionRef}>
             <div className="absolute flex flex-col items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Outflow</span>
                <span className="text-2xl font-black text-slate-900">₱{stats?.totalExpenses?.toLocaleString()}</span>
             </div>
             <ResponsiveContainer width="100%" height={280} minHeight={280}>
                <PieChart>
                  <Pie
                    data={stats?.departmentBreakdown || []}
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={8}
                    dataKey="total"
                    nameKey="name"
                    stroke="none"
                  >
                    {stats?.departmentBreakdown?.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#fff', color: '#000', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }}
                  />
                </PieChart>
             </ResponsiveContainer>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
             {stats?.departmentBreakdown?.slice(0, 4).map((d, i) => (
               <div key={d.name} className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                     <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }}></div>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
                  </div>
                  <div className="text-sm font-black text-slate-900 tracking-tight">₱{parseFloat(d.total).toLocaleString()}</div>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         {[
           { label: 'Avg Daily Burn', value: stats?.dailyExpenses || 0, icon: Activity, color: 'blue' },
           { label: 'Top Category', value: stats?.topCategory || 'N/A', icon: Layers, color: 'indigo' },
           { label: 'Active Depts', value: stats?.departmentBreakdown?.length || 0, icon: Briefcase, color: 'emerald' },
           { label: 'Vouchers Issue', value: stats?.recentExpenses?.length || 0, icon: BarChart3, color: 'amber' }
         ].map((stat, i) => (
           <div key={i} className="erp-card p-6 bg-white border border-slate-200 shadow-sm flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center`}>
                 <stat.icon size={24} className={`text-erp-blue`} />
              </div>
              <div>
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{stat.label}</p>
                 <p className="text-lg font-black text-slate-900 tracking-tight">
                    {typeof stat.value === 'number' && stat.label.includes('Burn') ? `₱${stat.value.toLocaleString()}` : stat.value}
                 </p>
              </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default Analytics;
