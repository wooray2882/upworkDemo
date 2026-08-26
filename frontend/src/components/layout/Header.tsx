import React from 'react';
import { Building2, Search, FileText, Bell, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAuditReport: () => void;
  activeTabTitle: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAuditReport, activeTabTitle }) => {
  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-100">{activeTabTitle}</h2>
          <p className="text-[11px] text-slate-400">GC Tenant: <span className="text-slate-200 font-medium">Apex Construction Corp (Indiana)</span></p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Quick Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search subs, COIs, policies..."
            className="pl-8 pr-3 py-1.5 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-64 transition-all"
          />
        </div>

        {/* 1-Click Audit Report Generator */}
        <button
          onClick={onOpenAuditReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-semibold text-xs hover:bg-emerald-400 transition-all shadow-md shadow-emerald-500/10 active:scale-95 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1-Click Audit Report</span>
        </button>
      </div>
    </header>
  );
};
