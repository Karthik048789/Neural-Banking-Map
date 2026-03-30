import React from 'react';
import { motion } from 'framer-motion';
import { cn, formatNumber } from '@/lib/utils';

export const StatCard = ({ label, value, icon: Icon, colorClass, prefix = "", suffix = "", isPulsing = false }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className={cn(
        "bg-surface border border-border/60 rounded-2xl p-6 relative overflow-hidden transition-all duration-300 shadow-xl",
        isPulsing && "border-fraud/30 ring-1 ring-fraud/10 animate-pulse-red"
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-slate-400 text-sm font-medium tracking-wide font-sans">{label}</span>
        <div className={cn("p-2 rounded-lg bg-slate-800/80 border border-border/80", colorClass)}>
          <Icon className="w-5 h-5 opacity-90" />
        </div>
      </div>

      <div className="flex items-baseline gap-1 mt-1">
        <span className="text-2xl font-bold font-mono tracking-tighter text-white">
          {prefix}{typeof value === 'number' ? formatNumber(value) : value}{suffix}
        </span>
      </div>

      {/* Decorative gradient corner */}
      <div className={cn(
        "absolute -right-2 -bottom-2 w-20 h-20 opacity-10 blur-2xl rounded-full",
        colorClass
      )} />
      
      {/* Subtle indicator bar */}
      <div className={cn("absolute bottom-0 left-0 h-0.5 w-full bg-gradient-to-r from-transparent via-transparent to-transparent opacity-50 transition-all duration-500", 
        colorClass?.includes('text-blue-400') && 'via-blue-500',
        colorClass?.includes('text-fraud') && 'via-fraud',
        colorClass?.includes('text-safe') && 'via-safe',
        colorClass?.includes('text-warning') && 'via-warning',
      )} />
    </motion.div>
  );
};
