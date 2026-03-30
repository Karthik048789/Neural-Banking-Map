import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  ShieldAlert, 
  CheckCircle2, 
  Zap, 
  ExternalLink,
  ArrowUpRight,
  RefreshCcw,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { getStats } from '@/api/client';
import { StatCard } from '@/components/StatCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';

// Mock trend data for the chart
const generateTrendData = () => 
  Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    txns: Math.floor(Math.random() * 5000) + 2000,
    fraud: Math.floor(Math.random() * 50),
  }));

export const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [trendData, setTrendData] = useState(generateTrendData());
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await getStats();
      setStats(data);
      // Update trend data slightly for animation effect
      setTrendData(prev => [...prev.slice(1), {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        txns: Math.floor(Math.random() * 5000) + 2000,
        fraud: Math.floor(Math.random() * 50),
      }]);
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSpinner label="Compiling Network Stats..." />;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 pb-12 space-y-6 md:space-y-8 max-w-[1600px] mx-auto overflow-x-hidden"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-border/40 pb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white/90">Threat Intelligence Dashboard</h1>
          <p className="text-slate-400 text-xs md:text-sm mt-1 font-sans max-w-md">Real-time UPI transaction monitoring across 228B node network</p>
        </div>
        <div className="flex items-center gap-4 bg-surface/50 border border-border/60 rounded-full px-4 py-1.5 backdrop-blur-sm shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-mono text-slate-400 uppercase tracking-widest">System Online</span>
          </div>
          <div className="w-px h-4 bg-border/50" />
          <span className="text-[9px] md:text-[10px] font-mono text-slate-500 uppercase tracking-widest whitespace-nowrap">Refreshes in 5s</span>
          <RefreshCcw className="w-3 h-3 text-slate-500 animate-spin-slow" />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Transactions" 
          value={stats.total_txns} 
          icon={TrendingUp}
          colorClass="text-blue-400"
        />
        <StatCard 
          label="Fraud Detected" 
          value={stats.fraud_count} 
          icon={ShieldAlert}
          colorClass="text-fraud"
          isPulsing={stats.fraud_count > 0}
        />
        <StatCard 
          label="Model Accuracy" 
          value={stats.accuracy <= 1 ? (stats.accuracy * 100).toFixed(1) : stats.accuracy} 
          icon={CheckCircle2}
          colorClass="text-safe"
          suffix="%"
        />
        <StatCard 
          label="Avg Latency" 
          value={stats.avg_response_ms} 
          icon={Zap}
          colorClass="text-warning"
          suffix=" ms"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface/40 border border-border/50 rounded-3xl p-4 md:p-8 backdrop-blur-md shadow-2xl relative overflow-hidden group">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
              <h3 className="text-base md:text-lg font-semibold text-slate-200 tracking-tight flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                Network Velocity (Last 20 mins)
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-accent/40 border border-accent/60" />
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-mono uppercase">Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-fraud/40 border border-fraud/60" />
                  <span className="text-[9px] md:text-[10px] text-slate-400 font-mono uppercase">Flagged</span>
                </div>
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorTxn" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorFraud" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" vertical={false} opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#4A5568" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    interval={3}
                  />
                  <YAxis 
                    stroke="#4A5568" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(val) => `${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                    labelStyle={{ color: '#94A3B8', fontSize: '10px' }}
                  />
                  <Area type="monotone" dataKey="txns" stroke="#8B5CF6" strokeWidth={2} fillOpacity={1} fill="url(#colorTxn)" />
                  <Area type="monotone" dataKey="fraud" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#colorFraud)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            {/* Glossy overlay */}
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-5 h-5 text-slate-500" />
            </div>
          </div>
        </div>

        {/* Sidebar Column: Top Fraud Nodes */}
        <div className="lg:col-span-1">
          <div className="bg-surface/60 border border-border/50 rounded-3xl p-6 h-full shadow-2xl">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-lg font-semibold text-slate-200 tracking-tight flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-fraud" />
                Active Masterminds
              </h3>
              <button className="text-[10px] text-accent font-bold uppercase tracking-widest hover:underline cursor-pointer">
                Full List
              </button>
            </div>

            <div className="space-y-4">
              {stats.top_fraud_nodes.map((node, i) => (
                <motion.div 
                  key={node.id}
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-slate-800/40 border border-border/30 hover:border-fraud/20 hover:bg-fraud/[0.03] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-fraud/10 flex items-center justify-center text-fraud font-mono text-xs border border-fraud/20">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-xs font-mono text-white group-hover:text-fraud transition-colors">{node.id}</div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5 uppercase tracking-tighter">Geometric Risk Pattern</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold font-mono text-fraud">{node.risk_score <= 1 ? Math.round(node.risk_score * 100) : Math.round(node.risk_score)}%</div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Risk Score</div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-center">
              <p className="text-[10px] text-slate-400 font-sans italic leading-relaxed">
                "GraphSAGE model indicates a 85% YoY growth in circular transfer patterns."
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
