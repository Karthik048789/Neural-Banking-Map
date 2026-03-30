import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const FraudBadge = ({ score }) => {
  // Normalize: backend sends 0-1, thresholds expect 0-100
  const pct = score <= 1 ? Math.round(score * 100) : Math.round(score);

  let label = "LOW";
  let colorClass = "bg-safe/10 text-safe border-safe/20";
  let Icon = CheckCircle2;

  if (pct >= 90) {
    label = "CRITICAL";
    colorClass = "bg-fraud/15 text-fraud border-fraud/30 drop-shadow-[0_0_8px_rgba(239,68,68,0.2)]";
    Icon = AlertCircle;
  } else if (pct >= 75) {
    label = "HIGH";
    colorClass = "bg-warning/15 text-warning border-warning/30";
    Icon = AlertTriangle;
  } else if (pct >= 50) {
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
