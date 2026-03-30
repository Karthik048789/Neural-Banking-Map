import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Share2, 
  FileText, 
  Activity, 
  ShieldAlert, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/graph', label: 'Fraud Graph', icon: Share2 },
  { path: '/activity-report', label: 'Fraud Reports', icon: FileText },
  { path: '/live-feed', label: 'Live Feed', icon: Activity },
];

export const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const SidebarContent = ({ className, mobile = false }) => (
    <div className={cn(
      "h-full bg-surface border-r border-border flex flex-col transition-all duration-300",
      isCollapsed && !mobile ? "w-20" : "w-64",
      className
    )}>
      {/* Header */}
      <div className={cn(
        "flex items-center gap-3 py-8 px-4",
        isCollapsed && !mobile ? "justify-center" : "px-6"
      )}>
        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/40 shrink-0">
          <ShieldAlert className="w-6 h-6 text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
        </div>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col"
          >
            <span className="text-sm font-bold tracking-tight text-white/90 leading-none">NEURAL</span>
            <span className="text-[10px] font-mono text-accent tracking-widest mt-1 uppercase">Banking Map</span>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-3">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={() => mobile && setIsMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group overflow-hidden whitespace-nowrap",
                isActive 
                  ? "bg-accent/15 text-accent border border-accent/25" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent"
              )
            }
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-medium text-sm"
              >
                {item.label}
              </motion.span>
            )}
            {isCollapsed && !mobile && (
              <div className="absolute left-20 ml-2 px-2 py-1 bg-slate-900 border border-border text-[10px] text-white rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none uppercase tracking-widest">
                {item.label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle (Desktop only) */}
      {!mobile && (
        <button 
          onClick={toggleCollapse}
          className="mx-4 my-4 p-2 bg-slate-800/50 hover:bg-slate-800 border border-border rounded-lg text-slate-400 hover:text-white transition-all flex items-center justify-center cursor-pointer"
        >
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      )}

      {/* Footer */}
      <div className={cn(
        "mt-auto border-t border-border/50 p-4",
        isCollapsed && !mobile ? "items-center" : "px-6"
      )}>
        {!isCollapsed || mobile ? (
          <div className="text-[9px] text-slate-500 font-mono flex justify-between items-center">
            <span className="uppercase opacity-60">Neural v1.0</span>
            <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse shadow-[0_0_8px_#10B981]" />
          </div>
        ) : (
          <div className="w-2 h-2 rounded-full bg-safe mx-auto animate-pulse" />
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-surface/80 backdrop-blur-md border-b border-border z-[60] flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-6 h-6 text-accent" />
          <span className="text-sm font-bold tracking-tight text-white uppercase italic">Neural Banking Map</span>
        </div>
        <button 
          onClick={toggleMobile}
          className="p-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Desktop Sidebar Container */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobile}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-64 z-[80] md:hidden"
            >
              <SidebarContent mobile={true} className="w-64" />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
