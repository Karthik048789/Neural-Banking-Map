import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  ChevronRight, 
  X, 
  ShieldCheck, 
  ShieldAlert,
  FileText,
  CreditCard,
  User,
  History
} from 'lucide-react';
import { getFlaggedAccounts, getReport } from '@/api/client';
import { FraudBadge } from '@/components/FraudBadge';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { formatCurrency, formatNumber, cn } from '@/lib/utils';

export const ActivityReport = () => {
  const [flagged, setFlagged] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getFlaggedAccounts();
        setFlagged(data);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const handleRowClick = async (id) => {
    setReportLoading(true);
    try {
      const report = await getReport(id);
      setSelectedReport(report);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const filteredFlagged = flagged.filter(f => 
    f.account_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportSAR = (report) => {
    const element = document.createElement("a");
    const file = new Blob([report.sar_draft], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `SAR_${report.account_id}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  if (loading) return <LoadingSpinner label="Querying Neo4j Graph Database..." />;

  return (
    <div className="p-8 max-w-[1600px] mx-auto min-h-screen">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Fraudulent Activity Reports</h1>
          <p className="text-slate-400 text-sm mt-1 font-sans">High-risk accounts flagged by GraphSAGE & Centrality algorithms</p>
        </div>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-6 py-2 bg-slate-800 border border-border/50 text-slate-300 rounded-xl text-sm font-medium hover:bg-slate-700 transition-all">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-surface/50 border border-border/50 rounded-2xl p-4 mb-8 flex items-center gap-6 backdrop-blur-md">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="Search by Account ID or Device ID..."
            className="w-full bg-slate-900/50 border border-border/50 rounded-xl pl-12 pr-4 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/40 transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-slate-800/80 border border-border/50 rounded-xl text-slate-400 hover:text-white transition-all text-sm font-medium">
          <Filter className="w-4 h-4" /> Filter By Risk
        </button>
      </div>

      {/* Table Container */}
      <div className="bg-surface/60 border border-border/50 rounded-3xl overflow-hidden shadow-2xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 border-b border-border/50">
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account ID</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Score</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nodes in Ring</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Exposure</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Time Detected</th>
              <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredFlagged.map((row, i) => (
              <motion.tr 
                key={row.account_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleRowClick(row.account_id)}
                className="group border-b border-border/30 hover:bg-white/[0.02] cursor-pointer transition-all"
              >
                <td className="px-8 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-surface border border-border/50 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-500 group-hover:text-accent transition-colors" />
                    </div>
                    <span className="text-sm font-mono text-white group-hover:text-accent transition-colors">{row.account_id}</span>
                  </div>
                </td>
                <td className="px-8 py-5"><FraudBadge score={row.risk_score} /></td>
                <td className="px-8 py-5"><span className="text-sm font-mono text-slate-300">{row.ring_size} Related Node(s)</span></td>
                <td className="px-8 py-5"><span className="text-sm font-bold font-mono text-white">{formatCurrency(row.total_amount)}</span></td>
                <td className="px-8 py-5"><span className="text-xs text-slate-500 font-sans">{new Date(row.timestamp).toLocaleString()}</span></td>
                <td className="px-8 py-5 text-right">
                  {row.is_frozen ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-fraud/10 text-fraud border border-fraud/20 rounded-md text-[9px] font-bold uppercase tracking-widest">
                      <ShieldAlert className="w-3 h-3" /> Locked
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 text-slate-500 border border-border/50 rounded-md text-[9px] font-bold uppercase tracking-widest">
                      <ShieldCheck className="w-3 h-3" /> Active
                    </div>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        
        {filteredFlagged.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center">
            <ShieldCheck className="w-12 h-12 text-safe/20 mb-4" />
            <p className="text-slate-500 font-mono text-sm tracking-widest">No matching high-risk accounts found</p>
          </div>
        )}
      </div>

      {/* Side Report Drawer */}
      <AnimatePresence>
        {selectedReport && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedReport(null)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />
            
            {/* Drawer */}
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 w-[550px] h-screen bg-surface border-l border-border/60 z-50 shadow-[-20px_0_40px_rgba(0,0,0,0.5)] flex flex-col"
            >
              <div className="p-8 border-b border-border/40 flex justify-between items-center bg-slate-900/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-fraud/10 border border-fraud/20 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6 text-fraud" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">SAR Intelligence Report</h2>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">ID: {selectedReport.account_id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500 cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-border/50">
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Risk Confidence</div>
                    <div className="text-2xl font-bold font-mono text-fraud">{selectedReport.confidence}%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-border/50 flex flex-col justify-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</div>
                    <div className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      selectedReport.is_frozen ? "text-fraud" : "text-safe"
                    )}>
                      {selectedReport.is_frozen ? "Frozen by LangChain" : "Monitoring active"}
                    </div>
                  </div>
                </div>

                {/* SAR Narrative */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <History className="w-4 h-4 text-accent" />
                    <span className="text-sm">Automated Narrative Analysis</span>
                  </div>
                  <div className="p-6 rounded-2xl bg-black/40 border border-border/40 font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {selectedReport.sar_draft}
                  </div>
                </div>

                {/* Transaction Graph Mini Preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <CreditCard className="w-4 h-4 text-accent" />
                    <span className="text-sm">Ring Nodes Summary</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-border/40 space-y-2">
                    {selectedReport.ring_nodes.map((node, i) => (
                      <div key={node} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 opacity-80 hover:opacity-100 transition-opacity">
                        <span className="text-xs font-mono text-white">{node}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 uppercase">Weight</span>
                          <span className="text-[10px] font-mono text-accent">0.{(9 - i).toString().repeat(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border/40 bg-slate-900/30">
                <button 
                  onClick={() => exportSAR(selectedReport)}
                  className="w-full py-4 bg-accent text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-accent/80 transition-all shadow-xl shadow-accent/20"
                >
                  <Download className="w-5 h-5" /> Download SAR Protocol (.txt)
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
