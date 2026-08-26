import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building, 
  Search, 
  Plus, 
  Phone, 
  Mail, 
  Send, 
  X, 
  Filter
} from 'lucide-react';
import { Subcontractor } from '../types';

interface SubcontractorCatalogPageProps {
  subcontractors: Subcontractor[];
  onTriggerReminder: (id: string) => void;
  onAddSubcontractor: (sub: Omit<Subcontractor, 'id'>) => void;
}

export const SubcontractorCatalogPage: React.FC<SubcontractorCatalogPageProps> = ({
  subcontractors,
  onTriggerReminder,
  onAddSubcontractor,
}) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'EMERALD' | 'AMBER' | 'ROSE'>('ALL');
  const [selectedTrade, setSelectedTrade] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [trade, setTrade] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [activeProject, setActiveProject] = useState('Keystone Office Plaza Phase 2');

  // Stats calculation for filter tabs
  const totalCount = subcontractors.length;
  const compliantCount = subcontractors.filter(s => s.complianceStatus === 'EMERALD').length;
  const expiringCount = subcontractors.filter(s => s.complianceStatus === 'AMBER').length;
  const nonCompliantCount = subcontractors.filter(s => s.complianceStatus === 'ROSE').length;

  const uniqueTrades = Array.from(new Set(subcontractors.map(s => s.trade).filter(Boolean)));

  const filtered = subcontractors.filter(sub => {
    const matchesSearch = 
      sub.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.trade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || sub.complianceStatus === statusFilter;
    const matchesTrade = selectedTrade === 'ALL' || sub.trade === selectedTrade;

    return matchesSearch && matchesStatus && matchesTrade;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !trade || !contactName) return;
    onAddSubcontractor({
      client_company_id: 'comp-01',
      name,
      trade,
      contactName,
      phone,
      email,
      complianceStatus: 'ROSE', // Default status for new subcontractor with 0 documents
      documentsCount: 0,
      lastIngestionDate: new Date().toISOString().split('T')[0],
      activeProject,
    });
    setShowAddModal(false);
    setName('');
    setTrade('');
    setContactName('');
    setPhone('');
    setEmail('');
  };

  const getInitials = (companyName: string) => {
    return companyName
      .split(' ')
      .filter(w => !['LLC', 'Inc', 'Corp', 'Co', 'and', '&'].includes(w))
      .map(w => w[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'SC';
  };

  return (
    <div className="space-y-5 w-full">
      
      {/* 1. Page Header & Primary Action Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Building className="w-5 h-5 text-emerald-400" />
            Subcontractor Directory
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Indiana vendor compliance catalog, automated document tracking, and SMS renewal dispatch.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all cursor-pointer shadow-md shadow-emerald-500/10 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subcontractor</span>
        </button>
      </div>

      {/* 2. Toolbar & Filter Controls (Search + Trade Dropdown + Status Tabs) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl">
        
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vendor name, trade, or contact..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Trade Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedTrade}
              onChange={e => setSelectedTrade(e.target.value)}
              className="bg-transparent border-none text-slate-300 text-xs focus:outline-none cursor-pointer"
            >
              <option key="trade-opt-all" value="ALL" className="bg-slate-900 text-slate-200">All Trades</option>
              {uniqueTrades.map((t, idx) => (
                <option key={`trade-opt-${t}-${idx}`} value={t} className="bg-slate-900 text-slate-200">{t}</option>
              ))}
            </select>
          </div>

          {/* Status Filter Segmented Control (Standardized Terminology) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'ALL' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('EMERALD')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'EMERALD' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compliant ({compliantCount})
            </button>
            <button
              onClick={() => setStatusFilter('AMBER')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'AMBER' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expiring ({expiringCount})
            </button>
            <button
              onClick={() => setStatusFilter('ROSE')}
              className={`px-3 py-1 rounded-md transition-all ${
                statusFilter === 'ROSE' ? 'bg-rose-500/20 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Non-Compliant ({nonCompliantCount})
            </button>
          </div>
        </div>
      </div>

      {/* 3. Directory Data Table (Full Width Spacing) */}
      <div className="w-full border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Subcontractor Name</th>
                <th className="py-4 px-6">Trade</th>
                <th className="py-4 px-6">Compliance Status</th>
                <th className="py-4 px-6">Active Project</th>
                <th className="py-4 px-6">Primary Contact</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No subcontractors match your search or filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((sub) => (
                  <tr 
                    key={sub.id} 
                    onClick={() => navigate(`/subcontractors/${sub.id}`)}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  >
                    
                    {/* Subcontractor Name */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 to-sky-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {getInitials(sub.name)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-100 text-xs group-hover:text-emerald-400 transition-colors">
                            {sub.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">ID: {sub.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Trade */}
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {sub.trade}
                    </td>

                    {/* Solid Fill Compliance Badges */}
                    <td className="py-4 px-6">
                      {sub.complianceStatus === 'EMERALD' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-500 text-slate-950 font-bold text-[11px] shadow-sm">
                          Compliant
                        </span>
                      )}
                      {sub.complianceStatus === 'AMBER' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-500 text-slate-950 font-bold text-[11px] shadow-sm">
                          Expiring Soon
                        </span>
                      )}
                      {sub.complianceStatus === 'ROSE' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-500 text-white font-bold text-[11px] shadow-sm">
                          Non-Compliant
                        </span>
                      )}
                    </td>

                    {/* Active Project */}
                    <td className="py-4 px-6 text-slate-300 font-medium">
                      {sub.activeProject}
                    </td>

                    {/* Primary Contact */}
                    <td className="py-4 px-6">
                      <p className="text-slate-200 font-medium text-xs">{sub.contactName}</p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          {sub.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                          {sub.email}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => onTriggerReminder(sub.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
                      >
                        <Send className="w-3.5 h-3.5 text-slate-950" />
                        <span>Dispatch Reminder</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Subcontractor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Building className="w-4 h-4 text-emerald-400" />
                Add New Subcontractor
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Electrical Services LLC"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Trade Specialty *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Electrical"
                    value={trade}
                    onChange={e => setTrade(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Primary Contact Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dave Miller"
                    value={contactName}
                    onChange={e => setContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Phone (SMS Reminders)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 317-555-0192"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-slate-300 font-semibold">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. dave@apex.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-300 font-semibold">Assigned Project</label>
                <select
                  value={activeProject}
                  onChange={e => setActiveProject(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
                >
                  <option key="proj-1" value="Lucas Oil Stadium Expansion">Lucas Oil Stadium Expansion</option>
                  <option key="proj-2" value="I-65 Interchange Revamp">I-65 Interchange Revamp</option>
                  <option key="proj-3" value="Purdue Innovation Hub">Purdue Innovation Hub</option>
                  <option key="proj-4" value="Elkhart Industrial Park">Elkhart Industrial Park</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  Create Subcontractor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
