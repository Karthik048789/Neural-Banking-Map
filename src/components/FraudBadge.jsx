import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const FraudBadge = ({ score }) => {
  let label = "LOW";
  let colorClass = "bg-safe/10 text-safe border-safe/20";
  let Icon = CheckCircle2;

  if (score >= 90) {
    label = "CRITICAL";
    colorClass = "bg-fraud/15 text-fraud border-fraud/30 drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]";
    Icon = AlertCircle;
  } else if (score >= 75) {
    label = "HIGH";
    colorClass = "bg-warning/15 text-warning border-warning/30";
    Icon = AlertTriangle;
  } else if (score >= 50) {
    label = "MEDIUM";
    colorClass = "bg-warning/10 text-warning/80 border-warning/20";
    Icon = AlertTriangle;
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider border uppercase transition-all duration-300",
      colorClass
    )}>
      <Icon className="w-3 h-3" />
      {label}
    </div>
  );
};
