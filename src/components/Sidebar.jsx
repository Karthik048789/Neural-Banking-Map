import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Share2, FileText, Activity, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/graph', label: 'Fraud Graph', icon: Share2 },
  { path: '/activity-report', label: 'Fraud Reports', icon: FileText },
  { path: '/live-feed', label: 'Live Feed', icon: Activity },
];

export const Sidebar = () => {
  return (
    <div className="w-64 bg-surface border-r border-border h-screen flex flex-col sticky top-0 p-4">
      <div className="flex items-center gap-3 mb-10 px-2 group cursor-pointer">
        <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center border border-accent/40 group-hover:bg-accent/30 transition-all duration-300">
          <ShieldAlert className="w-6 h-6 text-accent drop-shadow-[0_0_8px_rgba(139,92,246,0.5)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold tracking-tight text-white/90 leading-none">NEURAL</span>
          <span className="text-[10px] font-mono text-accent tracking-widest mt-1">BANKING MAP</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border border-transparent",
                isActive 
                  ? "bg-accent/15 text-accent border-accent/25 shadow-[0_0_15px_-5px_rgba(139,92,246,0.3)]" 
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              )
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-border/50 pt-4 px-2">
        <div className="text-[10px] text-slate-500 font-mono flex justify-between items-center">
          <span>Secure AI software & systems hackthon</span>
          <div className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
        </div>
      </div>
    </div>
  );
};
