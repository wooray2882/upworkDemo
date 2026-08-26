import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  LifeBuoy, 
  CheckCircle2, 
  RefreshCw, 
  RotateCcw, 
  Building2, 
  Users, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  LayoutDashboard,
  MessageSquare,
  FileText
} from 'lucide-react';
import { SuperAdminLog } from '../types';
import { SupportTicketItem } from '../components/SupportTicketModal';
import { useAuth } from '../context/AuthContext';
import { 
  fetchAdminTickets, 
  fetchAdminDeleted, 
  restoreDeletedItem,
  fetchAdminDashboard,
  updateAdminTicketStatus
} from '../services/apiService';

interface SuperAdminPageProps {
  logs: SuperAdminLog[];
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = () => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TICKETS' | 'DELETED'>('DASHBOARD');
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [deletedItems, setDeletedItems] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  // Ticket status edit state
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  const loadAdminData = async () => {
    if (!isSuperAdmin) return;
    try {
      setLoading(true);
      const [ticketsRes, deletedRes, dashRes] = await Promise.all([
        fetchAdminTickets().catch(() => ({ tickets: [] })),
        fetchAdminDeleted().catch(() => ({ deleted_items: [] })),
        fetchAdminDashboard().catch(() => ({ summary: null, companies: [] }))
      ]);

      const mappedTickets: SupportTicketItem[] = (ticketsRes.tickets || []).map((t: any) => ({
        id: t.id || t.SK,
        type: t.type || 'TICKET',
        subject: t.subject || t.subjectLine || 'Support Request',
        description: t.description || t.message || 'Support ticket submitted via client portal.',
        submittedBy: `${t.clientCompanyId || t.companyId || 'Client'} User`,
        submittedAt: t.createdAt ? new Date(t.createdAt).toLocaleString() : 'Recent',
        inferredUrgency: t.aiInferredUrgency || t.priority || 'MEDIUM',
        status: t.status || 'OPEN'
      }));

      setTickets(mappedTickets);
      setDeletedItems(deletedRes.deleted_items || []);
      setDashboardData(dashRes);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [isSuperAdmin]);

  const handleRestore = async (itemId: string) => {
    try {
      setRestoringId(itemId);
      await restoreDeletedItem(itemId);
      setDeletedItems(prev => prev.filter(i => i.id !== itemId));
    } catch (err) {
      alert(`Error restoring item: ${err}`);
    } finally {
      setRestoringId(null);
    }
  };

  const handleStatusChange = async (ticketId: string, newStatus: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED') => {
    try {
      setUpdatingTicketId(ticketId);
      const note = resolutionNotes[ticketId] || '';
      await updateAdminTicketStatus(ticketId, newStatus, note);
      
      setTickets(prev => prev.map(t => {
        if (t.id === ticketId) {
          return { ...t, status: newStatus };
        }
        return t;
      }));
    } catch (err) {
      alert(`Error updating ticket status: ${err}`);
    } finally {
      setUpdatingTicketId(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-4xl mx-auto font-sans">
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-rose-400 flex items-start gap-4">
          <ShieldAlert className="w-8 h-8 shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-bold text-white">Access Denied: Super Admin Restricted Area</h2>
            <p className="text-xs text-rose-300/80 mt-1">
              Your logged-in Cognito account (<span className="font-mono text-white">{user?.email}</span>) belongs to role{' '}
              <span className="font-mono text-emerald-400">{user?.role}</span>. Multi-tenant business metrics and ticket queues require Platform <span className="font-mono text-indigo-400">SUPER_ADMIN</span> credentials.
            </p>
            <p className="text-xs text-slate-400 mt-3">
              To test this view, sign out from the top-right profile menu and log in as <span className="font-mono text-slate-200">admin@indycomply.com</span>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const summary = dashboardData?.summary || {
    totalActiveAccounts: (dashboardData?.companies && dashboardData.companies.length) || 3,
    totalSubcontractorsTracked: 6,
    overallComplianceHealthPct: 83,
    openSupportTickets: tickets.filter(t => t.status === 'OPEN').length,
    totalSupportTickets: tickets.length
  };

  const defaultCompanies = [
    { companyId: 'comp-01', companyName: 'Midwest General Contractors', subcontractorCount: 4, complianceHealthPct: 75, emeraldCount: 2, amberCount: 1, roseCount: 1 },
    { companyId: 'comp-indiana-gc-01', companyName: 'Indiana Construction Group', subcontractorCount: 2, complianceHealthPct: 100, emeraldCount: 2, amberCount: 0, roseCount: 0 },
    { companyId: 'comp-02', companyName: 'Midwest Builders', subcontractorCount: 1, complianceHealthPct: 100, emeraldCount: 1, amberCount: 0, roseCount: 0 }
  ];

  const companies = (dashboardData?.companies && dashboardData.companies.length > 0)
    ? dashboardData.companies
    : defaultCompanies;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs font-sans">
      
      {/* Super Admin Control Header */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Super Admin Platform Control Center</h2>
              <p className="text-xs text-slate-400">
                Multi-Tenant Operating Metrics • Ticket Queue Management • 1-Year Soft-Delete Recovery
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadAdminData}
              disabled={loading}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <span className="badge-emerald flex items-center gap-1 font-mono text-xs px-3 py-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> AWS Dev Live
            </span>
          </div>
        </div>

        {/* 3-Tab Navigation Bar */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
          <button
            onClick={() => setActiveTab('DASHBOARD')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'DASHBOARD'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Business Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab('TICKETS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'TICKETS'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Support Ticket Queue ({tickets.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('DELETED')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'DELETED'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Soft-Delete Recovery ({deletedItems.length})</span>
          </button>
        </div>

      </div>

      {/* TAB 1: BUSINESS DASHBOARD */}
      {activeTab === 'DASHBOARD' && (
        <div className="space-y-6">
          
          {/* Stat Cards (Reusing OverviewPage layout aesthetics) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Active Client Accounts</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{summary.totalActiveAccounts}</p>
              <p className="text-[11px] text-slate-500 font-mono">Multi-tenant client organizations</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Subcontractors</span>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-slate-100">{summary.totalSubcontractorsTracked}</p>
              <p className="text-[11px] text-slate-500 font-mono">Tracked across all platform tenants</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Platform Compliance Health</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-extrabold text-emerald-400">{summary.overallComplianceHealthPct}%</p>
              <p className="text-[11px] text-slate-500 font-mono">% EMERALD subcontractors platform-wide</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Open Support Tickets</span>
                <LifeBuoy className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-extrabold text-amber-400">{summary.openSupportTickets}</p>
              <p className="text-[11px] text-slate-500 font-mono">{summary.totalSupportTickets} total tickets filed</p>
            </div>

          </div>

          {/* Company Breakdown Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-400" />
                  Client Account Breakdown
                </h3>
                <p className="text-xs text-slate-400">Real-time subcontractor tracking volume & compliance health per company</p>
              </div>
              <span className="badge-indigo font-mono font-bold">{companies.length} Companies</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-950/60">
                    <th className="p-3">Company Name & ID</th>
                    <th className="p-3">Subcontractors Tracked</th>
                    <th className="p-3">Compliance Health</th>
                    <th className="p-3">Status Breakdown (E / A / R)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {companies.map((comp: any) => (
                    <tr key={comp.companyId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3">
                        <p className="font-bold text-slate-200">{comp.companyName}</p>
                        <p className="text-[10px] font-mono text-slate-500">{comp.companyId}</p>
                      </td>
                      <td className="p-3 font-semibold text-slate-300">
                        {comp.subcontractorCount} Subcontractors
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold font-mono ${
                          comp.complianceHealthPct >= 80 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {comp.complianceHealthPct}% Emerald
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] flex items-center gap-3">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> {comp.emeraldCount || 0}
                        </span>
                        <span className="text-amber-400 font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {comp.amberCount || 0}
                        </span>
                        <span className="text-rose-400 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {comp.roseCount || 0}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: SUPPORT TICKET QUEUE (INTERACTIVE STATUS & RESOLUTION NOTES) */}
      {activeTab === 'TICKETS' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <LifeBuoy className="w-4 h-4 text-amber-400" />
                Platform Support Ticket Queue & Management
              </h3>
              <p className="text-xs text-slate-400">Review tickets, update resolution status (OPEN → IN_PROGRESS → RESOLVED), and attach notes</p>
            </div>
            <span className="badge-amber font-mono font-bold">{tickets.length} Tickets Total</span>
          </div>

          {tickets.length === 0 ? (
            <p className="text-slate-500 py-8 text-center italic">No support tickets currently in queue.</p>
          ) : (
            <div className="space-y-4">
              {tickets.map((t) => {
                const isUpdating = updatingTicketId === t.id;

                return (
                  <div key={t.id} className="p-5 bg-slate-950/80 border border-slate-800/90 rounded-2xl space-y-3">
                    
                    <div className="flex items-start justify-between gap-4 border-b border-slate-800/80 pb-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-sm">{t.subject}</h4>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.inferredUrgency === 'URGENT' || t.inferredUrgency === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            Urgency: {t.inferredUrgency}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono">
                          Ticket ID: {t.id} • Submitted by: <span className="text-slate-200">{t.submittedBy}</span> • {t.submittedAt}
                        </p>
                      </div>

                      {/* Status Dropdown */}
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Status:</label>
                        <select
                          value={t.status}
                          disabled={isUpdating}
                          onChange={(e) => handleStatusChange(t.id, e.target.value as any)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold font-mono focus:outline-none cursor-pointer ${
                            t.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          }`}
                        >
                          <option value="OPEN" className="bg-slate-900 text-slate-200">OPEN</option>
                          <option value="IN_PROGRESS" className="bg-slate-900 text-amber-400">IN_PROGRESS</option>
                          <option value="RESOLVED" className="bg-slate-900 text-emerald-400">RESOLVED</option>
                        </select>
                      </div>
                    </div>

                    <p className="text-slate-300 text-xs leading-relaxed">{t.description}</p>

                    {/* Resolution Note Drawer */}
                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <input
                          type="text"
                          placeholder="Add resolution note or admin explanation..."
                          value={resolutionNotes[t.id] || ''}
                          onChange={(e) => setResolutionNotes({ ...resolutionNotes, [t.id]: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-slate-300 text-xs focus:outline-none focus:border-indigo-500/50"
                        />
                      </div>
                      
                      <button
                        onClick={() => handleStatusChange(t.id, t.status)}
                        disabled={isUpdating}
                        className="px-3 py-1 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
                      >
                        {isUpdating ? 'Saving...' : 'Save Note'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SOFT-DELETE RECOVERY WINDOW */}
      {activeTab === 'DELETED' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-emerald-400" />
                Soft-Deleted Items (1-Year Recovery Window)
              </h3>
              <p className="text-xs text-slate-400">1-click item restoration. Sparse GSI1 index automatically reinstates restored items into default queries.</p>
            </div>
            <span className="badge-emerald font-mono font-bold">{deletedItems.length} Eligible Items</span>
          </div>

          {deletedItems.length === 0 ? (
            <p className="text-slate-500 py-8 text-center italic">No soft-deleted items currently in 1-year recovery window.</p>
          ) : (
            <div className="divide-y divide-slate-800 border border-slate-800/60 rounded-xl overflow-hidden">
              {deletedItems.map((item) => (
                <div key={item.id || item.SK} className="p-4 bg-slate-950/40 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-sm">{item.name || item.documentType || item.id}</span>
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-md text-[10px] font-mono">{item.EntityType}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 font-mono">
                      PK: {item.PK} • SK: {item.SK} • DeletedAt: {item.deletedAt}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(item.id)}
                    disabled={restoringId === item.id}
                    className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>{restoringId === item.id ? 'Restoring...' : 'Restore Item'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
