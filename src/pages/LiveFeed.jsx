import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  ShieldAlert, 
  ShieldCheck, 
  Clock, 
  CreditCard,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { generateLiveTransaction } from '@/mocks/mockData';
import { formatCurrency, cn } from '@/lib/utils';

export const LiveFeed = () => {
  const [transactions, setTransactions] = useState([]);
  const [connected, setConnected] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    // Simulate WebSocket Connection
    setConnected(true);
    
    const interval = setInterval(() => {
      if (paused) return;

      const newTxn = generateLiveTransaction();
      
      // If fraud, trigger toast
      if (newTxn.is_fraud) {
        toast.custom((t) => (
          <div className={cn(
            "max-w-md w-full bg-surface border border-fraud shadow-2xl rounded-2xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 transition-all duration-500",
            t.visible ? 'translate-y-0 opacity-100' : '-translate-y-10 opacity-0'
          )}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-10 w-10 bg-fraud/10 rounded-full flex items-center justify-center border border-fraud/20">
                    <ShieldAlert className="w-5 h-5 text-fraud" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-bold text-white uppercase tracking-tighter">FRAUD ALERT</p>
                  <p className="mt-1 text-xs text-slate-400 font-mono">ID: {newTxn.upi_id} flagged with {newTxn.confidence}% risk.</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-border/40">
              <button 
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-medium text-fraud hover:bg-fraud/5 focus:outline-none"
              >
                INTERCEPT
              </button>
            </div>
          </div>
        ), { duration: 4000 });
      }

      setTransactions((prev) => [newTxn, ...prev].slice(0, 50));
    }, 2000);

    return () => clearInterval(interval);
  }, [paused]);

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex h-[calc(100vh-2rem)] flex-col">
      <Toaster position="top-right" />
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white/90">Live Transaction Stream</h1>
          <p className="text-slate-400 text-sm mt-1 font-sans">Raw network telemetry from edge nodes via WebSocket</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setPaused(!paused)}
            className={cn(
              "flex items-center gap-2 px-6 py-2 border rounded-xl text-xs font-bold uppercase tracking-widest transition-all",
              paused ? "bg-warning/10 border-warning/40 text-warning" : "bg-slate-800 border-border/50 text-slate-400 hover:text-white"
            )}
          >
            {paused ? "RESUME STREAM" : "PAUSE STREAM"}
          </button>
          
          <div className="bg-surface/50 border border-border/50 rounded-xl px-4 py-2 flex items-center gap-3">
            <div className={cn("w-2.5 h-2.5 rounded-full", connected ? "bg-safe shadow-[0_0_8px_#10B981]" : "bg-fraud")} />
            <span className="text-[10px] font-bold text-slate-300 font-mono tracking-widest uppercase">
              {connected ? "Gateway Connected" : "Connection Lost"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-surface/60 border border-border/50 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(15,23,42,0)_0%,rgba(15,23,42,1)_100%)] z-10" />
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-[#162136] z-20 border-b border-border/60">
              <tr>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Transaction ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Type</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Account ID</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Risk Index</th>
                <th className="px-8 py-5 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/20">
              <AnimatePresence initial={false}>
                {transactions.map((txn, i) => (
                  <motion.tr 
                    key={txn.txn_id}
                    initial={{ opacity: 0, x: -30, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={cn(
                      "group transition-all duration-500",
                      txn.is_fraud ? "bg-fraud/10 animate-fraud-flash" : "hover:bg-white/[0.02]"
                    )}
                  >
                    <td className="px-8 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 opacity-60 font-mono text-[10px] text-slate-400">
                        <Clock className="w-3 h-3" />
                        {new Date(txn.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-xs font-mono text-slate-300 group-hover:text-white transition-colors">{txn.txn_id}</span>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[8px] font-bold font-sans">
                        <CreditCard className="w-2.5 h-2.5" />
                        {txn.type}
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="text-sm font-bold font-mono text-white">{formatCurrency(txn.amount)}</span>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-300">{txn.upi_id}</span>
                        <ExternalLink className="w-3 h-3 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-accent" />
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <div className="flex flex-col gap-1 w-24">
                        <div className="flex justify-between text-[8px] font-mono uppercase tracking-tighter">
                          <span className={txn.is_fraud ? "text-fraud" : "text-slate-500"}>Score</span>
                          <span className={txn.is_fraud ? "text-fraud font-bold" : "text-slate-400"}>{txn.confidence}%</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${txn.confidence}%` }}
                            className={cn(
                              "h-full",
                              txn.is_fraud ? "bg-fraud shadow-[0_0_4px_rgba(239,68,68,0.5)]" : "bg-safe"
                            )}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                      {txn.is_fraud ? (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-fraud text-white rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-fraud/20">
                          <ShieldAlert className="w-3.5 h-3.5" /> FRAUD
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-surface border border-safe/20 text-safe rounded-xl text-[10px] font-bold uppercase tracking-widest">
                          <ShieldCheck className="w-3.5 h-3.5" /> SAFE
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {transactions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-30">
              <Activity className="w-12 h-12 text-slate-500 animate-pulse" />
              <p className="text-xs font-mono uppercase tracking-[0.3em]">Connecting to Transaction Hub...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
