import React, { useState } from 'react';
import { 
  Bell, 
  AlertTriangle, 
  Clock, 
  Send, 
  CheckCircle2, 
  ShieldAlert, 
  Search 
} from 'lucide-react';
import { Subcontractor } from '../types';

interface AlertsPageProps {
  subcontractors: Subcontractor[];
  onTriggerReminder: (subId: string) => void;
}

export function AlertsPage({ subcontractors, onTriggerReminder }: AlertsPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<'ALL' | 'CRITICAL' | 'WARNING'>('ALL');

  // Filter expiring (AMBER) and lapsed (ROSE) subcontractors
  const alertSubs = subcontractors.filter(sub => {
    const isAlert = sub.complianceStatus === 'AMBER' || sub.complianceStatus === 'ROSE';
    if (!isAlert) return false;

    const matchesSearch = 
      sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.trade.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.activeProject.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterSeverity === 'CRITICAL') return matchesSearch && sub.complianceStatus === 'ROSE';
    if (filterSeverity === 'WARNING') return matchesSearch && sub.complianceStatus === 'AMBER';
    return matchesSearch;
  });

  const criticalCount = subcontractors.filter(s => s.complianceStatus === 'ROSE').length;
  const warningCount = subcontractors.filter(s => s.complianceStatus === 'AMBER').length;

  const mockReminderHistory = [
    {
      id: 'rem-1',
      subName: 'Crossroads Plumbing & Heating',
      contact: 'Dave Miller (+1 317-555-0192)',
      channel: 'Twilio SMS',
      type: '30-Day Pre-Expiration Notice',
      sentAt: 'Today at 09:14 AM',
      status: 'DELIVERED',
    },
    {
      id: 'rem-2',
      subName: 'Wabash Valley Roofing',
      contact: 'Marcus Vance (marcus@wabashroofing.com)',
      channel: 'Email & SMS',
      type: 'Lapsed Document Escalation',
      sentAt: 'Yesterday at 04:30 PM',
      status: 'DELIVERED',
    },
    {
      id: 'rem-3',
      subName: 'Apex Electrical Services',
      contact: 'Sarah Jenkins (+1 317-555-0144)',
      channel: 'Twilio SMS',
      type: '7-Day Urgent Renewal Reminder',
      sentAt: 'Aug 19, 2026 at 11:00 AM',
      status: 'DELIVERED',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-base sm:text-lg font-semibold tracking-tight text-white flex items-center gap-2">
            <Bell className="h-4.5 w-4.5 text-amber-400" />
            Alerts & Automated Reminders
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Active expiration alerts, automatic 60/30/7-day notice queues, and dispatched Twilio SMS audit logs
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-400 border border-rose-500/30 font-medium">
            🔴 {criticalCount} Lapsed
          </span>
          <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 font-medium">
            🟡 {warningCount} Expiring Soon
          </span>
        </div>
      </div>

      {/* Main Grid: Active Alerts & Reminder History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Column: Active Expiration Alerts (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-panel">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-400" />
                Active Expiration Action Queue ({alertSubs.length})
              </h2>

              <div className="flex items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search alert subs..."
                    className="pl-8 pr-3 py-1 bg-slate-900 border border-slate-700/80 rounded-md text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/60 w-44"
                  />
                </div>

                {/* Filter buttons */}
                <div className="flex items-center bg-slate-900 rounded-md p-0.5 border border-slate-700/80 text-[11px]">
                  <button
                    onClick={() => setFilterSeverity('ALL')}
                    className={`px-2 py-0.5 rounded ${filterSeverity === 'ALL' ? 'bg-slate-700 text-white font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterSeverity('CRITICAL')}
                    className={`px-2 py-0.5 rounded ${filterSeverity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Lapsed
                  </button>
                  <button
                    onClick={() => setFilterSeverity('WARNING')}
                    className={`px-2 py-0.5 rounded ${filterSeverity === 'WARNING' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    Expiring
                  </button>
                </div>
              </div>
            </div>

            {/* Alert Items List */}
            {alertSubs.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                No active expiration warnings matching filter criteria.
              </div>
            ) : (
              <div className="space-y-3">
                {alertSubs.map(sub => {
                  const isCritical = sub.complianceStatus === 'ROSE';
                  return (
                    <div 
                      key={sub.id}
                      className={`p-3.5 rounded-lg border transition-all ${
                        isCritical 
                          ? 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/50' 
                          : 'bg-amber-950/20 border-amber-500/30 hover:border-amber-500/50'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-100">{sub.name}</span>
                            <span className="text-xs text-slate-400">({sub.trade})</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCritical ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}>
                              {isCritical ? 'Lapsed / Expired' : 'Expiring <30 Days'}
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                            <span>Project: <strong className="text-slate-300 font-medium">{sub.activeProject}</strong></span>
                            <span>Contact: <strong className="text-slate-300 font-medium">{sub.contactName} ({sub.phone})</strong></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => onTriggerReminder(sub.id)}
                            className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Dispatch SMS</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Automated Dispatch History */}
        <div className="space-y-4">
          <div className="card-panel">
            <div className="mb-3 pb-2 border-b border-slate-800/80">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-sky-400" />
                Dispatched Notice Log
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Automated Twilio & Email audit trail</p>
            </div>

            <div className="space-y-3">
              {mockReminderHistory.map(item => (
                <div key={item.id} className="p-3 rounded-md bg-slate-900/80 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-200 truncate">{item.subName}</span>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      ✓ {item.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>{item.type}</span>
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                    <span>{item.channel}</span>
                    <span className="font-mono">{item.sentAt}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
              <p className="text-[10px] text-slate-500">
                Automated 60-day, 30-day, and 7-day escalation rules executed via AWS EventBridge.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
