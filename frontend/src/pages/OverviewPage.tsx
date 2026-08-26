import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Server, 
  Layers, 
  Cpu, 
  HardDrive, 
  Activity, 
  CheckCircle2, 
  RefreshCw, 
  ShieldCheck, 
  Send,
  FileText,
  FileUp,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { Subcontractor } from '../types';

interface OverviewPageProps {
  subcontractors?: Subcontractor[];
  onTriggerReminder?: (subId: string) => void;
  onOpenAuditReport?: () => void;
  onNavigateToIntake?: () => void;
}

export default function OverviewPage({
  subcontractors = [],
  onTriggerReminder,
  onOpenAuditReport,
  onNavigateToIntake
}: OverviewPageProps) {
  const [refreshing, setRefreshing] = useState(false);

  const totalSubs = subcontractors.length;
  const compliantSubs = subcontractors.filter(s => s.complianceStatus === 'EMERALD').length;
  const amberSubs = subcontractors.filter(s => s.complianceStatus === 'AMBER').length;
  const roseSubs = subcontractors.filter(s => s.complianceStatus === 'ROSE').length;

  const healthScore = totalSubs > 0 ? Math.round((compliantSubs / totalSubs) * 100) : 100;

  const kpis = {
    health: { value: healthScore, max: 100, trend: '+2%', trendUp: true },
    activeSubs: { value: totalSubs, max: totalSubs || 1, trend: 'Active', trendUp: true },
    verifiedDocs: { value: compliantSubs, max: totalSubs || 1, trend: 'Verified', trendUp: true },
    expiringSoon: { value: amberSubs, unit: '<30d', trend: 'Warning', trendUp: false },
    nonCompliant: { value: roseSubs, unit: 'Lapsed', trend: 'Action', trendUp: false },
    humanQueue: { value: amberSubs + roseSubs, trend: 'Review', trendUp: false }
  };


  const history = [
    { time: '00h', compliant: 12, expiring: 1 },
    { time: '03h', compliant: 12, expiring: 1 },
    { time: '06h', compliant: 13, expiring: 2 },
    { time: '09h', compliant: 14, expiring: 2 },
    { time: '12h', compliant: 14, expiring: 2 },
    { time: '15h', compliant: 14, expiring: 2 },
    { time: '18h', compliant: 14, expiring: 2 },
    { time: '21h', compliant: 14, expiring: 2 },
    { time: 'Now', compliant: 14, expiring: 2 }
  ];

  const coverageCategories = [
    { name: 'W-9 Form', score: 100 },
    { name: 'COI Limits', score: 98 },
    { name: 'Trade License', score: 96 },
    { name: 'OSHA Cert', score: 95 },
    { name: 'Worker Comp', score: 92 }
  ];

  // Tree Activity Feed Data
  const recentActivityLogs = [
    {
      id: 'log-1',
      title: 'Document processed & verified',
      description: 'Apex Electrical Services LLC — COI Policy #TRV-8849201-IN',
      time: '10m ago',
      type: 'success'
    },
    {
      id: 'log-2',
      title: 'Renewal SMS sent',
      description: 'Crossroads Plumbing & Mechanical — Dave Miller (317-555-0192)',
      time: '28m ago',
      type: 'sent'
    },
    {
      id: 'log-3',
      title: 'Document routed to review queue',
      description: 'Wabash Valley Roofing Co — Indiana Trade License (Low confidence)',
      time: '1h ago',
      type: 'warning'
    },
    {
      id: 'log-4',
      title: 'Renewal email dispatched',
      description: 'Hoosier Framing & Concrete — compliance@hoosierframing.com',
      time: '3h ago',
      type: 'sent'
    },
    {
      id: 'log-5',
      title: 'Automated policy audit passed',
      description: 'Indy Concrete Works — Worker Comp Policy #WC-99201',
      time: '5h ago',
      type: 'success'
    },
    {
      id: 'log-6',
      title: 'Inbound mail parsed from SES',
      description: 'Attachment received: COI_2026_Renewal_Apex.pdf',
      time: '6h ago',
      type: 'info'
    }
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  // Filter subs needing attention (Expiring Soon or Non-Compliant)
  const actionQueueSubs = subcontractors.filter(s => s.complianceStatus !== 'EMERALD');


  return (
    <div className="space-y-6 w-full">
      
      {/* Header with Plain Business Title & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-400" />
            Compliance Overview
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time compliance status for active subcontractors and upcoming document renewals.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToIntake && (
            <button
              onClick={onNavigateToIntake}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/60 flex items-center gap-1.5"
            >
              <FileUp className="h-3.5 w-3.5 text-emerald-400" />
              <span>Document Vault</span>
            </button>
          )}

          {onOpenAuditReport && (
            <button 
              onClick={onOpenAuditReport}
              className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-slate-950" /> 
              <span>Audit Reports</span>
            </button>
          )}

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer border border-slate-700/60"
            title="Refresh dashboard"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. TOP SECTION: Summary Stat KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard title="Compliance Score" value={`${kpis.health.value}%`} icon={ShieldCheck} iconColor="text-emerald-400" />
        <KPICard title="Active Subs" value={`${kpis.activeSubs.value}`} icon={Server} iconColor="text-sky-400" />
        <KPICard title="Verified Docs" value={`${kpis.verifiedDocs.value}`} icon={Layers} iconColor="text-indigo-400" />
        <KPICard title="Expiring Soon" value={`${kpis.expiringSoon.value}`} badgeText="<30 Days" badgeStyle="amber" icon={Cpu} iconColor="text-amber-400" />
        <KPICard title="Non-Compliant" value={`${kpis.nonCompliant.value}`} badgeText="Lapsed" badgeStyle="rose" icon={HardDrive} iconColor="text-rose-400" />
        <KPICard title="Review Queue" value={`${kpis.humanQueue.value}`} badgeText="Needs Action" badgeStyle="amber" icon={AlertTriangle} iconColor="text-amber-400" />
      </div>

      {/* 2. MIDDLE SECTION: EQUAL HEIGHT CARDS GRID (h-[340px] for all 3 cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Document Activity Area Chart (Fixed Height h-[340px]) */}
        <div className="card-panel h-[340px] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1 pb-2 border-b border-slate-800/80 shrink-0">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Document Activity</h2>
              <p className="text-[11px] text-slate-400">Verified docs vs expiration warnings</p>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-sm bg-emerald-400"></span> Verified
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <span className="w-2 h-2 rounded-sm bg-amber-400"></span> Expiring
              </span>
            </div>
          </div>
          
          {/* Expanded Chart Height (Fills vertical card real estate) */}
          <div className="h-56 w-full flex-1 my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompliant" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpiring" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="#475569" fontSize={9} tickLine={false} />
                <YAxis stroke="#475569" fontSize={9} tickLine={false} domain={[0, 20]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '6px', fontSize: '11px', padding: '6px 10px' }}
                />
                <Area type="monotone" dataKey="compliant" stroke="#10b981" fillOpacity={1} fill="url(#colorCompliant)" strokeWidth={2} name="Verified Docs" />
                <Area type="monotone" dataKey="expiring" stroke="#fbbf24" fillOpacity={1} fill="url(#colorExpiring)" strokeWidth={2} name="Expiring" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
            <span>Intake Stream: Active</span>
            <span className="font-semibold text-emerald-400">14 Verified</span>
          </div>
        </div>

        {/* Card 2: Coverage Breakdown Horizontal Bars (Fixed Height h-[340px], Thicker Bars & Spacing) */}
        <div className="card-panel h-[340px] flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-800/80 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">Coverage Breakdown</h2>
            <p className="text-[11px] text-slate-400">Compliance rate by category</p>
          </div>

          {/* Increased bar thickness & vertical spacing to fill card height with presence */}
          <div className="space-y-3.5 my-auto py-1">
            {coverageCategories.map(item => (
              <div key={item.name} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span>{item.name}</span>
                  <span className="font-mono text-emerald-400">{item.score}%</span>
                </div>
                {/* Thicker 2.5 height progress bar */}
                <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800 shadow-inner">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-sm" 
                    style={{ width: `${item.score}%` }} 
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between shrink-0">
            <span>Account Compliance:</span>
            <span className="font-bold text-emerald-400">96.4%</span>
          </div>
        </div>

        {/* Card 3: Recent Activity Tree (Fixed Height h-[340px], Internally Scrollable) */}
        <div className="card-panel h-[340px] flex flex-col justify-between">
          <div className="pb-2 border-b border-slate-800/80 shrink-0">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-emerald-400" />
              Recent Activity Tree
            </h2>
            <p className="text-[11px] text-slate-400">Live scrollable document & notice timeline</p>
          </div>

          {/* Internally Scrollable Container capped inside fixed card height */}
          <div className="relative pl-6 space-y-3 my-auto flex-1 overflow-y-auto pr-1.5 custom-scrollbar py-1">
            
            {/* Vertical Tree Connector Line */}
            <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-800" />

            {recentActivityLogs.map(log => (
              <div key={log.id} className="relative group">
                
                {/* Node Icon on Tree Line */}
                <div className={`absolute -left-[23px] top-1 w-5 h-5 rounded-full flex items-center justify-center ring-4 ring-slate-900 ${
                  log.type === 'success' ? 'bg-emerald-500 text-slate-950' :
                  log.type === 'sent' ? 'bg-sky-500 text-slate-950' :
                  log.type === 'warning' ? 'bg-amber-500 text-slate-950' : 'bg-indigo-500 text-white'
                }`}>
                  {log.type === 'success' && <CheckCircle2 className="w-3 h-3 stroke-[2.5]" />}
                  {log.type === 'sent' && <Send className="w-3 h-3 stroke-[2.5]" />}
                  {log.type === 'warning' && <AlertTriangle className="w-3 h-3 stroke-[2.5]" />}
                  {log.type === 'info' && <FileText className="w-3 h-3 stroke-[2.5]" />}
                </div>

                {/* Tree Item Content Card */}
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/90 hover:border-slate-700 transition-colors space-y-0.5 shadow-sm">
                  <div className="flex items-center justify-between gap-1">
                    <p className="font-bold text-xs text-slate-100 truncate">{log.title}</p>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">{log.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{log.description}</p>
                </div>

              </div>
            ))}
          </div>

          <div className="pt-2 text-[10px] text-slate-500 text-center border-t border-slate-800/80 shrink-0">
            <span>Scrollable real-time timeline feed</span>
          </div>
        </div>

      </div>

      {/* 3. BOTTOM SECTION: Active Reminder Queue (DEDICATED FULL CANVAS-WIDTH SECTION) */}
      <div className="w-full card-panel border-amber-500/30 bg-gradient-to-r from-slate-900 via-amber-950/15 to-slate-900 p-5 rounded-2xl shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-amber-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide text-amber-200">
                Active Reminder Queue ({actionQueueSubs.length} Vendors Requiring Renewal Nudges)
              </h2>
              <p className="text-xs text-slate-400">
                Subcontractors with expiring or lapsed coverage requiring instant text/email reminder dispatch.
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs font-bold shrink-0 self-start sm:self-auto">
            Action Required
          </span>
        </div>

        {/* Full-Width Table View spanning 100% of canvas width */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 shadow-xl bg-slate-950/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Subcontractor Name</th>
                <th className="py-3 px-4">Trade & Specialty</th>
                <th className="py-3 px-4">Compliance Status</th>
                <th className="py-3 px-4">Active Project</th>
                <th className="py-3 px-4">Primary Contact Info</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {actionQueueSubs.map(sub => (
                <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                  
                  {/* Subcontractor Name */}
                  <td className="py-3.5 px-4 font-bold text-slate-100 text-xs">
                    {sub.name}
                  </td>

                  {/* Trade */}
                  <td className="py-3.5 px-4 text-slate-300 text-xs">
                    {sub.trade}
                  </td>

                  {/* Solid Fill Status Badge */}
                  <td className="py-3.5 px-4">
                    {sub.complianceStatus === 'AMBER' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[11px] shadow-sm">
                        Expiring Soon
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500 text-white font-bold text-[11px] shadow-sm">
                        Non-Compliant
                      </span>
                    )}
                  </td>

                  {/* Active Project */}
                  <td className="py-3.5 px-4 text-slate-200 font-semibold text-xs">
                    {sub.activeProject}
                  </td>

                  {/* Contact Info */}
                  <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                    {sub.contactName} ({sub.phone})
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => onTriggerReminder?.(sub.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-950" />
                      <span>Dispatch Reminder</span>
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}

function KPICard({ title, value, badgeText, badgeStyle, icon: Icon, iconColor }: {
  title: string;
  value: string;
  badgeText?: string;
  badgeStyle?: 'amber' | 'rose';
  icon: any;
  iconColor: string;
}) {
  return (
    <div className="card-panel p-3 flex flex-col justify-between hover:border-slate-700 transition-colors space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex items-baseline justify-between">
        <div className="text-xl font-bold tracking-tight text-white font-mono">
          {value}
        </div>
        {badgeText && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
            badgeStyle === 'rose' ? 'bg-rose-500 text-white' : 'bg-amber-500 text-slate-950'
          }`}>
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}
