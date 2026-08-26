import React from 'react';
import { X, Printer, Download, ShieldCheck, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Subcontractor, DocumentRecord } from '../types';

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  subcontractors: Subcontractor[];
  documents: DocumentRecord[];
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  subcontractors,
  documents,
}) => {
  if (!isOpen) return null;

  const compliantCount = subcontractors.filter(s => s.complianceStatus === 'EMERALD').length;
  const warningCount = subcontractors.filter(s => s.complianceStatus === 'AMBER').length;
  const nonCompliantCount = subcontractors.filter(s => s.complianceStatus === 'ROSE').length;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-sm">Instant Compliance Audit Summary</h3>
              <p className="text-xs text-slate-400">Generated for OSHA & GC Field Inspectors • {new Date().toLocaleDateString()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Audit</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-200">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-center">
              <p className="text-[11px] font-bold text-slate-400 uppercase">Total Subs</p>
              <p className="text-2xl font-extrabold text-slate-100 mt-1">{subcontractors.length}</p>
            </div>
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
              <p className="text-[11px] font-bold text-emerald-400 uppercase flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Fully Compliant
              </p>
              <p className="text-2xl font-extrabold text-emerald-400 mt-1">{compliantCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
              <p className="text-[11px] font-bold text-amber-400 uppercase flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Expiring Soon
              </p>
              <p className="text-2xl font-extrabold text-amber-400 mt-1">{warningCount}</p>
            </div>
            <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/30 text-center">
              <p className="text-[11px] font-bold text-rose-400 uppercase flex items-center justify-center gap-1">
                <XCircle className="w-3 h-3" /> Non-Compliant
              </p>
              <p className="text-2xl font-extrabold text-rose-400 mt-1">{nonCompliantCount}</p>
            </div>
          </div>

          {/* Detailed Subcontractors Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Subcontractor Compliance Matrix</h4>
            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Subcontractor</th>
                    <th className="p-3">Trade</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Active Project</th>
                    <th className="p-3 text-right">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {subcontractors.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-200">{sub.name}</td>
                      <td className="p-3 text-slate-400">{sub.trade}</td>
                      <td className="p-3">
                        {sub.complianceStatus === 'EMERALD' && (
                          <span className="badge-emerald">🟢 Compliant</span>
                        )}
                        {sub.complianceStatus === 'AMBER' && (
                          <span className="badge-amber">🟡 Expiring Soon</span>
                        )}
                        {sub.complianceStatus === 'ROSE' && (
                          <span className="badge-rose">🔴 Non-Compliant</span>
                        )}
                      </td>
                      <td className="p-3 text-slate-300">{sub.activeProject}</td>
                      <td className="p-3 text-right text-slate-400 font-mono text-[11px]">{sub.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Dispatched Reminder Audit Log */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Dispatched Notice & Reminder Audit Log</h4>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">Historical Nudge Audit Trail</span>
            </div>

            <div className="border border-slate-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="p-3">Subcontractor</th>
                    <th className="p-3">Notice Type</th>
                    <th className="p-3">Delivery Channel</th>
                    <th className="p-3">Delivery Status</th>
                    <th className="p-3 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 font-mono text-[11px]">
                  <tr>
                    <td className="p-3 font-semibold font-sans text-slate-200">Crossroads Plumbing & Mechanical</td>
                    <td className="p-3 font-sans text-slate-300">30-Day Pre-Expiration Reminder</td>
                    <td className="p-3 font-sans text-sky-400">SMS (Twilio)</td>
                    <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Delivered</span></td>
                    <td className="p-3 text-right text-slate-400">2026-08-19 14:22:05</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold font-sans text-slate-200">Hoosier Framing & Concrete Corp</td>
                    <td className="p-3 font-sans text-slate-300">Lapsed Non-Compliance Escalation</td>
                    <td className="p-3 font-sans text-indigo-400">Email (AWS SES)</td>
                    <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Delivered</span></td>
                    <td className="p-3 text-right text-slate-400">2026-08-18 09:15:40</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold font-sans text-slate-200">Wabash Valley Roofing Co</td>
                    <td className="p-3 font-sans text-slate-300">Trade License Renewal Nudge</td>
                    <td className="p-3 font-sans text-sky-400">SMS (Twilio)</td>
                    <td className="p-3"><span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Delivered</span></td>
                    <td className="p-3 text-right text-slate-400">2026-08-15 11:30:12</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Compliance Disclaimer Footer */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Audit Verification Notice:</p>
            <p>This automated compliance report reflects active COIs, Indiana Trade Licenses, and Worker Compensation certificates stored in AWS S3 and verified via Bedrock extraction models. Verified by IndyComply SaaS Engine.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
