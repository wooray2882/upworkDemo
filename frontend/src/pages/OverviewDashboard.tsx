import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  Send, 
  ArrowUpRight, 
  FileText, 
  Filter,
  CheckCircle2
} from 'lucide-react';
import { Subcontractor, DocumentRecord } from '../types';

interface OverviewDashboardProps {
  subcontractors: Subcontractor[];
  documents: DocumentRecord[];
  onTriggerReminder: (subcontractorId: string) => void;
  onNavigateToIntake: () => void;
  onNavigateToHumanReview: () => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  subcontractors,
  documents,
  onTriggerReminder,
  onNavigateToIntake,
  onNavigateToHumanReview,
}) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'EMERALD' | 'AMBER' | 'ROSE'>('ALL');

  const emeraldCount = subcontractors.filter(s => s.complianceStatus === 'EMERALD').length;
  const amberCount = subcontractors.filter(s => s.complianceStatus === 'AMBER').length;
  const roseCount = subcontractors.filter(s => s.complianceStatus === 'ROSE').length;

  const filteredSubs = subcontractors.filter(s => {
    if (filter === 'ALL') return true;
    return s.complianceStatus === filter;
  });

  const expiringDocs = documents.filter(d => (d.daysUntilExpiration ?? 999) <= 30);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Hero Header Banner */}
      <div className="p-6 rounded-xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between shadow-xl">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
            Indiana Subcontractor Compliance Hub
            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
              Live Engine
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Zero subcontractor login required • Automated Bedrock OCR Extraction & EventBridge Daily Renewal Scanner
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onNavigateToIntake}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>Submit / Upload Document</span>
          </button>
        </div>
      </div>

      {/* 3-Tier Status Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Total Active Subcontractors */}
        <div 
          onClick={() => setFilter('ALL')}
          className={`card-panel cursor-pointer transition-all ${filter === 'ALL' ? 'border-sky-500/50 bg-sky-500/5' : ''}`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Subcontractors</span>
            <ShieldCheck className="w-4 h-4 text-sky-400" />
          </div>
          <p className="text-3xl font-extrabold text-slate-100 mt-2">{subcontractors.length}</p>
          <p className="text-[11px] text-slate-400 mt-1">Across 3 active job sites</p>
        </div>

        {/* 🟢 Emerald: Fully Compliant */}
        <div 
          onClick={() => setFilter('EMERALD')}
          className={`card-panel cursor-pointer transition-all ${filter === 'EMERALD' ? 'border-emerald-500/50 bg-emerald-500/5' : ''}`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">🟢 Fully Compliant</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <p className="text-3xl font-extrabold text-emerald-400 mt-2">{emeraldCount}</p>
          <p className="text-[11px] text-emerald-500/80 mt-1">Active COIs & licenses on file</p>
        </div>

        {/* 🟡 Amber: Expiring / Action Needed */}
        <div 
          onClick={() => setFilter('AMBER')}
          className={`card-panel cursor-pointer transition-all ${filter === 'AMBER' ? 'border-amber-500/50 bg-amber-500/5' : ''}`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">🟡 Expiring Soon (&lt;30d)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400 mt-2">{amberCount}</p>
          <p className="text-[11px] text-amber-500/80 mt-1">Renewal SMS reminders sent</p>
        </div>

        {/* 🔴 Rose: Non-Compliant / Lapsed */}
        <div 
          onClick={() => setFilter('ROSE')}
          className={`card-panel cursor-pointer transition-all ${filter === 'ROSE' ? 'border-rose-500/50 bg-rose-500/5' : ''}`}
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">🔴 Non-Compliant / Lapsed</span>
            <XCircle className="w-4 h-4" />
          </div>
          <p className="text-3xl font-extrabold text-rose-400 mt-2">{roseCount}</p>
          <p className="text-[11px] text-rose-500/80 mt-1">Immediate action required</p>
        </div>

      </div>

      {/* Main Grid: Subcontractors Status + Expiring Documents Alert List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Subcontractors Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-200">Subcontractor Compliance Status</h3>
              <span className="text-xs text-slate-500">({filteredSubs.length} items)</span>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-lg text-xs">
              <button 
                onClick={() => setFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${filter === 'ALL' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All
              </button>
              <button 
                onClick={() => setFilter('EMERALD')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${filter === 'EMERALD' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🟢 Emerald
              </button>
              <button 
                onClick={() => setFilter('AMBER')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${filter === 'AMBER' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🟡 Amber
              </button>
              <button 
                onClick={() => setFilter('ROSE')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${filter === 'ROSE' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400 hover:text-slate-200'}`}
              >
                🔴 Rose
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60 shadow-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Subcontractor</th>
                  <th className="p-3.5">Trade</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Active Project</th>
                  <th className="p-3.5 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredSubs.map((sub) => (
                  <tr 
                    key={sub.id} 
                    onClick={() => navigate(`/subcontractors/${sub.id}`)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="p-3.5">
                      <p className="font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">{sub.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{sub.contactName} • {sub.phone}</p>
                    </td>
                    <td className="p-3.5 text-slate-300">{sub.trade}</td>
                    <td className="p-3.5">
                      {sub.complianceStatus === 'EMERALD' && <span className="badge-emerald">🟢 Compliant</span>}
                      {sub.complianceStatus === 'AMBER' && <span className="badge-amber">🟡 Expiring Soon</span>}
                      {sub.complianceStatus === 'ROSE' && <span className="badge-rose">🔴 Lapsed</span>}
                    </td>
                    <td className="p-3.5 text-slate-400">{sub.activeProject}</td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onTriggerReminder(sub.id);
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-[11px] font-semibold transition-all cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send SMS</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Expiring Documents & Escalation Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-400" />
              Expiring Documents Timeline
            </h3>
            <span className="text-[11px] text-amber-400 font-semibold">{expiringDocs.length} Flagged</span>
          </div>

          <div className="space-y-3">
            {expiringDocs.map((doc) => {
              const daysLeft = doc.daysUntilExpiration ?? 0;
              return (
                <div 
                  key={doc.id} 
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-all ${
                    daysLeft < 0
                      ? 'bg-rose-500/5 border-rose-500/30'
                      : 'bg-amber-500/5 border-amber-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{doc.subcontractorName}</span>
                    <span className={daysLeft < 0 ? 'badge-rose' : 'badge-amber'}>
                      {daysLeft < 0 ? `Expired ${Math.abs(daysLeft)}d ago` : `Expires in ${daysLeft}d`}
                    </span>
                  </div>

                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <p><span className="text-slate-300 font-semibold">{doc.documentType}</span> • {doc.carrierName}</p>
                  <p className="font-mono text-[10px] text-slate-500">Limits: {doc.coverageLimit}</p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Exp Date: <strong className="text-slate-200">{doc.expirationDate}</strong></span>
                  <button 
                    onClick={() => onTriggerReminder(doc.subcontractorId)}
                    className="text-sky-400 hover:underline font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <span>Chase Renewal</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
