import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ label = "Processing Network Data..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        className="w-12 h-12 text-accent"
      >
        <Loader2 className="w-12 h-12" />
      </motion.div>
      <div className="flex flex-col items-center">
        <span className="text-sm font-medium tracking-widest text-slate-300 uppercase animate-pulse">{label}</span>
        <div className="w-48 h-1 bg-surface border border-border/50 rounded-full mt-3 overflow-hidden">
          <motion.div 
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1/2 h-full bg-accent blur-[2px]"
          />
        </div>
      </div>
    </div>
  );
};
