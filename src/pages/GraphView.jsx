import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ForceGraph2D from 'react-force-graph-2d';
import { 
  ShieldAlert, 
  Activity, 
  Settings2, 
  Maximize2, 
  Zap, 
  LayoutList,
  Info,
  Play,
  FileText,
  X,
  Download,
  History,
  CreditCard,
  Loader2
} from 'lucide-react';
import { getGraphFraud } from '@/api/client';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { mockReport } from '@/mocks/mockData';
import { formatCurrency, cn } from '@/lib/utils';
import { toast, Toaster } from 'react-hot-toast';

const COLORS = {
  MASTERMIND: '#FF2D2D',
  FRAUD_UPI: '#EF4444',
  DEVICE: '#3B82F6',
  MERCHANT: '#8B5CF6',
  RELAY: '#F59E0B',
  VICTIM: '#10B981',
  SAFE: '#94A3B8',
};

export const GraphView = () => {
  const location = useLocation();
  const fgRef = useRef();
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [isFrozen, setIsFrozen] = useState(false);
  const [incidentData, setIncidentData] = useState(null);
  const [isGeneratingSAR, setIsGeneratingSAR] = useState(false);
  const [sarReport, setSarReport] = useState(null);
  const [showSARModal, setShowSARModal] = useState(false);

  // Resize handler
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (location.state?.fraudEvent) {
      setIncidentData(location.state.fraudEvent);
      // Auto-trigger simulation or show graph for the specific event
    }
  }, [location.state]);

  const handleFreeze = () => {
    setIsFrozen(true);
    toast.success(`Account ${incidentData?.upi_id || selectedNode?.id || "MASTER_ID_X"} frozen successfully.`, {
      style: {
        background: '#1E293B',
        color: '#10B981',
        border: '1px solid #10B981',
      },
    });
  };

  const handleGenerateSAR = async () => {
    const targetId = selectedNode?.id || incidentData?.upi_id || "MASTER_ID_X";
    setIsGeneratingSAR(true);
    
    const toastId = toast.loading("Compiling transaction footprints...", {
      style: { background: '#1E293B', color: '#94A3B8', border: '1px solid #334155' }
    });

    try {
      // Simulate AI Narrative Generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const report = mockReport(targetId);
      setSarReport(report);
      setShowSARModal(true);
      
      toast.success("SAR Intelligence Draft Generated", {
        id: toastId,
        style: { background: '#1E293B', color: '#8B5CF6', border: '1px solid #8B5CF6' }
      });
    } catch (err) {
      toast.error("Failed to compile narrative", { id: toastId });
    } finally {
      setIsGeneratingSAR(false);
    }
  };

  const fetchGraph = useCallback(async () => {
    try {
      const data = await getGraphFraud();
      // Transform incoming edges (from/to) to links (source/target) for ForceGraph
      const links = data.edges.map(e => ({
        source: e.from,
        target: e.to,
        amount: e.amount,
        isCycle: e.isCycle
      }));
      setGraphData({ nodes: data.nodes, links });
      setLoading(false);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
    const interval = setInterval(fetchGraph, 3000);
    return () => clearInterval(interval);
  }, [fetchGraph]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    // Center at node
    fgRef.current.centerAt(node.x, node.y, 1000);
    fgRef.current.zoom(2.5, 1000);
  };

  const getLinkColor = (link) => (link.isCycle ? '#EF4444' : '#F59E0B');
  const getLinkWidth = (link) => (link.isCycle ? 3 : 1);
  const getParticleSpeed = (link) => (link.isCycle ? 0.02 : 0.01);

  if (loading) return <LoadingSpinner label="Compiling Inductive Graph Embeddings..." />;

  const isEmpty = graphData.nodes.length === 0;

  return (
    <div className="flex h-full md:h-[calc(100vh-2rem)] overflow-hidden relative" ref={containerRef}>
      <Toaster position="top-right" />
      
      {/* Graph Area */}
      <div className="flex-1 relative bg-[#0B1120]">
        
        {isEmpty ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
            <motion.div 
              animate={{ scale: [1, 1.1, 1] }} 
              transition={{ repeat: Infinity, duration: 3 }}
              className="w-32 h-32 rounded-full border-2 border-accent/20 flex items-center justify-center mb-6"
            >
              <Activity className="w-12 h-12 text-accent/40" />
            </motion.div>
            <h2 className="text-xl font-bold text-slate-400 tracking-widest uppercase">Monitoring...</h2>
            <p className="text-sm text-slate-600 mt-2 font-mono">No active fraud rings detected in current window</p>
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            width={dimensions.width}
            height={dimensions.height}
            nodeLabel="id"
            nodeColor={(node) => {
              if (node.role === 'mastermind') return COLORS.MASTERMIND;
              if (node.type === 'upi') return COLORS.FRAUD_UPI;
              if (node.type === 'device') return COLORS.DEVICE;
              if (node.type === 'merchant') return COLORS.MERCHANT;
              return COLORS.SAFE;
            }}
            nodeRelSize={6}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.id;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px JetBrains Mono`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              // Draw node circle
              const color = node.role === 'mastermind' ? COLORS.MASTERMIND : (node.type === 'upi' ? COLORS.FRAUD_UPI : (node.type === 'device' ? COLORS.DEVICE : COLORS.MERCHANT));
              ctx.beginPath();
              ctx.arc(node.x, node.y, 4, 0, 2 * Math.PI, false);
              ctx.fillStyle = color;
              ctx.fill();
              
              if (node.role === 'mastermind') {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1/globalScale;
                ctx.stroke();
              }

              // Draw label if zoom is sufficient or it's a mastermind
              if (globalScale > 1.5 || node.role === 'mastermind') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                ctx.fillText(label, node.x + 6, node.y + 3);
              }
            }}
            linkColor={getLinkColor}
            linkWidth={getLinkWidth}
            linkDirectionalParticles={4}
            linkDirectionalParticleSpeed={getParticleSpeed}
            linkDirectionalParticleWidth={2}
            linkLineDash={(link) => (link.isCycle ? [5, 2] : [2, 2])}
            backgroundColor="#0B1120"
            onNodeClick={handleNodeClick}
          />
        )}

        {/* Overlay Controls */}
        <div className="absolute top-4 left-4 md:top-6 md:left-6 space-y-4 z-30">
          <div className="bg-surface/80 border border-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl shadow-2xl max-w-[200px] md:max-w-none">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-fraud/20 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-fraud" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-tighter">Fraud-Only Mode</h3>
                <div className="text-[10px] text-slate-500 font-mono">24H Windowing Active</div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                <span className="text-[10px] text-slate-400 font-mono">SMOTE Preprocessing Active</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[10px] text-slate-400 font-mono">GraphSAGE Inductive Inference</span>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setSimulationActive(true)}
            className="flex items-center gap-2 px-4 py-2 bg-accent/20 border border-accent/40 rounded-xl text-accent text-xs font-bold uppercase tracking-widest hover:bg-accent/30 transition-all group"
          >
            <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Simulate Fraud Ring
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 right-4 md:right-auto md:bottom-6 md:left-6 flex flex-wrap gap-3 md:gap-6 bg-surface/80 border border-white/10 backdrop-blur-md px-4 py-2.5 md:px-6 md:py-3 rounded-2xl md:rounded-full shadow-2xl z-30">
          {Object.entries(COLORS).map(([key, color]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">{key.replace('_', ' ')}</span>
            </div>
          ))}
          <div className="w-px h-3 bg-white/10 mx-2" />
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-fraud border-t border-dashed border-fraud/50" />
            <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Cycle Detected</span>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <AnimatePresence>
        {selectedNode || !isEmpty ? (
          <motion.div 
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            className="absolute top-0 right-0 h-full w-full max-w-[320px] bg-surface border-l border-border/60 p-6 shadow-2xl z-40 flex flex-col backdrop-blur-md bg-surface/90"
          >
            <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-3">
              <Info className="w-5 h-5 text-accent" />
              Intelligence Report
            </h3>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              
              {/* Ring Overview Card */}
              <div className="p-4 rounded-2xl bg-slate-800/40 border border-border/40 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Confidence Score</div>
                    <div className="text-3xl font-bold font-mono text-fraud mt-1">98.4%</div>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-fraud/10 flex items-center justify-center border border-fraud/20">
                    <Zap className={cn("w-6 h-6", isFrozen ? "text-safe" : "text-fraud")} />
                  </div>
                </div>

                {isFrozen && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-2 bg-safe/10 border border-safe/20 rounded-lg text-center"
                  >
                    <span className="text-[10px] font-bold text-safe uppercase tracking-[0.2em]">Account Frozen & Secured</span>
                  </motion.div>
                )}

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20">
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">Ring Size</div>
                    <div className="text-sm font-bold font-mono text-white">12 Nodes</div>
                  </div>
                  <div>
                    <div className="text-[8px] text-slate-500 uppercase tracking-widest">Exposure</div>
                    <div className="text-sm font-bold font-mono text-white">₹3.4L</div>
                  </div>
                </div>
              </div>

              {/* Selected Node Details */}
              {selectedNode ? (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-border/40 pb-2">Node Inspector</div>
                  <div className="p-4 rounded-2xl bg-accent/5 border border-accent/20">
                    <div className="text-[10px] text-accent font-bold font-mono mb-1">{selectedNode.id}</div>
                    <div className="grid grid-cols-2 gap-y-3 mt-4">
                      <div>
                        <div className="text-[8px] text-slate-500 uppercase">Node Type</div>
                        <div className="text-[10px] text-white font-mono uppercase">{selectedNode.type}</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-slate-500 uppercase">Role</div>
                        <div className="text-[10px] text-white font-mono uppercase">{selectedNode.role}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-[8px] text-slate-500 uppercase">Last Interaction</div>
                        <div className="text-[10px] text-white font-mono">2024-03-30 11:20:45</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-500 italic">Click a node to inspect geometric properties</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-6 space-y-3">
                <button 
                  onClick={handleFreeze}
                  disabled={isFrozen}
                  className={cn(
                    "w-full py-3 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg",
                    isFrozen 
                      ? "bg-safe/50 cursor-not-allowed border border-safe/30 text-safe-foreground" 
                      : "bg-fraud hover:bg-fraud/80 shadow-fraud/10"
                  )}
                >
                  {isFrozen ? "Account Frozen" : "Initiate Auto-Freeze"}
                </button>
                <button 
                  onClick={handleGenerateSAR}
                  disabled={isGeneratingSAR}
                  className="w-full py-3 bg-surface border border-border/80 text-slate-300 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  {isGeneratingSAR ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {isGeneratingSAR ? "Compiling Draft..." : "Generate SAR Draft"}
                </button>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-border/40">
              <div className="flex gap-2 p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <Info className="w-4 h-4 text-orange-400 shrink-0" />
                <p className="text-[9px] text-orange-400/80 leading-relaxed">
                  Cycles are identified using DFS timestamp analysis within a 24-hour sliding window.
                </p>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
      {/* SAR Report Modal */}
      <AnimatePresence>
        {showSARModal && sarReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSARModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div 
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-surface border border-border/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border/40 flex justify-between items-center bg-slate-900/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-fraud/10 border border-fraud/20 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-fraud" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white tracking-tight">Financial Intelligence Report</h2>
                    <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">ID: {sarReport.account_id}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowSARModal(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-500"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Meta Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-border/50">
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Risk Confidence</div>
                    <div className="text-2xl font-bold font-mono text-fraud">{sarReport.confidence}%</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-800/40 border border-border/50 flex flex-col justify-center">
                    <div className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">Status</div>
                    <div className={cn(
                      "text-xs font-bold uppercase tracking-widest",
                      isFrozen ? "text-fraud" : "text-safe"
                    )}>
                      {isFrozen ? "Account Frozen & Secured" : "Monitoring active"}
                    </div>
                  </div>
                </div>

                {/* SAR Narrative */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <History className="w-4 h-4 text-accent" />
                    <span className="text-sm">Automated Narrative Analysis</span>
                  </div>
                  <div className="p-6 rounded-2xl bg-black/40 border border-border/40 font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap shadow-inner">
                    {sarReport.sar_draft}
                  </div>
                </div>

                {/* Related Nodes Summary */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-300 font-medium">
                    <CreditCard className="w-4 h-4 text-accent" />
                    <span className="text-sm">Ring Nodes Summary</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface border border-border/40 space-y-2">
                    {sarReport.ring_nodes.map((node, i) => (
                      <div key={node} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0 opacity-80">
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

              <div className="p-6 border-t border-border/40 bg-slate-900/30">
                <button 
                  onClick={() => {
                    toast.success("SAR Report exported as neural_sar_draft.pdf", {
                      style: { background: '#1E293B', color: '#10B981', border: '1px solid #10B981' }
                    });
                  }}
                  className="w-full py-4 bg-accent text-white rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-accent/80 transition-all shadow-xl shadow-accent/20"
                >
                  <Download className="w-4 h-4" /> Download Official PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
