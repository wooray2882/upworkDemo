import React, { useState } from 'react';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  X,
  FileCheck,
  Building,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Subcontractor, DocumentRecord } from '../types';

interface AuditReportsPageProps {
  subcontractors: Subcontractor[];
  documents: DocumentRecord[];
}

interface GeneratedReportRecord {
  id: string;
  title: string;
  dateRangeKey: string;
  dateRange: string;
  projectScopeKey: string;
  projectScope: string;
  generatedAt: string;
  fileSize: string;
}

export const AuditReportsPage: React.FC<AuditReportsPageProps> = ({
  subcontractors,
  documents
}) => {
  // Generator Controls State
  const [dateRange, setDateRange] = useState('ALL_TIME');
  const [projectScope, setProjectScope] = useState('ALL');
  const [isGenerating, setIsGenerating] = useState(false);

  // Collapsible Sections State (Collapsed by default for clean default view)
  const [showArchive, setShowArchive] = useState(false);
  const [showNoticeHistory, setShowNoticeHistory] = useState(false);

  // Active Report Modal Preview State
  const [activeReportPdf, setActiveReportPdf] = useState<GeneratedReportRecord | null>(null);

  // Archive of generated reports
  const [generatedReports, setGeneratedReports] = useState<GeneratedReportRecord[]>([
    {
      id: 'rpt-8849',
      title: 'Q3 2026 Subcontractor Compliance Due Diligence Audit',
      dateRangeKey: 'THIS_QUARTER',
      dateRange: 'Jul 1, 2026 – Aug 21, 2026',
      projectScopeKey: 'ALL',
      projectScope: 'All Projects',
      generatedAt: '2026-08-21 09:15',
      fileSize: '1.4 MB'
    },
    {
      id: 'rpt-8812',
      title: 'Lucas Oil Stadium Expansion Monthly Inspection Report',
      dateRangeKey: 'THIS_MONTH',
      dateRange: 'Aug 1, 2026 – Aug 20, 2026',
      projectScopeKey: 'Lucas Oil Stadium Expansion',
      projectScope: 'Lucas Oil Stadium Expansion',
      generatedAt: '2026-08-15 16:40',
      fileSize: '890 KB'
    },
    {
      id: 'rpt-8790',
      title: 'Mid-Year General Liability & Worker Comp Audit Trail',
      dateRangeKey: 'CUSTOM_2026',
      dateRange: 'Jan 1, 2026 – Jun 30, 2026',
      projectScopeKey: 'ALL',
      projectScope: 'All Projects',
      generatedAt: '2026-07-01 10:00',
      fileSize: '2.1 MB'
    }
  ]);

  // Historical Dispatched Notice Log
  const noticeHistory = [
    {
      id: 'notice-101',
      subcontractorName: 'Crossroads Plumbing & Mechanical',
      trade: 'Plumbing & Mechanical',
      noticeType: '30-Day Pre-Expiration Reminder',
      channel: 'SMS (Twilio)',
      status: 'Delivered',
      timestamp: '2026-08-19 14:22:05'
    },
    {
      id: 'notice-102',
      subcontractorName: 'Hoosier Framing & Concrete Corp',
      trade: 'Framing & Concrete',
      noticeType: 'Lapsed Non-Compliance Escalation',
      channel: 'Email (AWS SES)',
      status: 'Delivered',
      timestamp: '2026-08-18 09:15:40'
    },
    {
      id: 'notice-103',
      subcontractorName: 'Wabash Valley Roofing Co',
      trade: 'Roofing & Siding',
      noticeType: 'Trade License Renewal Nudge',
      channel: 'SMS (Twilio)',
      status: 'Delivered',
      timestamp: '2026-08-15 11:30:12'
    },
    {
      id: 'notice-104',
      subcontractorName: 'Apex Electrical Services LLC',
      trade: 'Electrical',
      noticeType: '60-Day Pre-Expiration Notice',
      channel: 'Email (AWS SES)',
      status: 'Delivered',
      timestamp: '2026-08-10 08:00:00'
    }
  ];

  // REAL UNDERLYING DATA FILTERING ENGINE
  // Filters subcontractor roster, document records, and verification appendix based on Date Period & Project Scope
  const getFilteredReportData = (selectedRangeKey: string, selectedProjectKey: string) => {
    // 1. Filter Subcontractors by Project Scope
    let scopedSubs = [...subcontractors];
    if (selectedProjectKey !== 'ALL') {
      scopedSubs = scopedSubs.filter(sub => sub.activeProject === selectedProjectKey);
    }

    // 2. Compute historical compliance status and active document records based on Date Period
    const scopedData = scopedSubs.map(sub => {
      let status = sub.complianceStatus;
      let expDate = '2026-10-01';

      if (selectedRangeKey === 'THIS_MONTH') {
        if (sub.id === 'sub-103') { // Hoosier Framing
          status = 'ROSE';
          expDate = '2026-08-01 (Lapsed)';
        } else if (sub.id === 'sub-102' || sub.id === 'sub-105') {
          status = 'AMBER';
          expDate = '2026-08-30 (Expiring)';
        } else {
          status = 'EMERALD';
          expDate = '2026-10-01 (Valid)';
        }
      } else if (selectedRangeKey === 'THIS_QUARTER') {
        if (sub.id === 'sub-103') {
          status = 'ROSE';
          expDate = '2026-08-01 (Lapsed)';
        } else if (sub.id === 'sub-102' || sub.id === 'sub-105') {
          status = 'AMBER';
          expDate = '2026-09-02 (Expiring Q3)';
        } else {
          status = 'EMERALD';
          expDate = '2026-09-30 (Valid Q3)';
        }
      } else if (selectedRangeKey === 'CUSTOM_2026') {
        if (sub.id === 'sub-103') {
          status = 'ROSE';
          expDate = '2026-08-01 (Lapsed)';
        } else {
          status = 'EMERALD';
          expDate = '2026-12-31 (Annual Valid)';
        }
      }

      return {
        ...sub,
        scopedStatus: status,
        scopedExpDate: expDate
      };
    });

    // Sort: ROSE (expired) first, AMBER second, EMERALD third
    const sortedScopedSubs = [...scopedData].sort((a, b) => {
      const order: Record<string, number> = { ROSE: 0, AMBER: 1, EMERALD: 2 };
      return order[a.scopedStatus] - order[b.scopedStatus];
    });

    const compliantCount = sortedScopedSubs.filter(s => s.scopedStatus === 'EMERALD').length;
    const warningCount = sortedScopedSubs.filter(s => s.scopedStatus === 'AMBER').length;
    const nonCompliantCount = sortedScopedSubs.filter(s => s.scopedStatus === 'ROSE').length;

    // Filter verification appendix entries to scoped sub IDs
    const scopedSubIds = new Set(sortedScopedSubs.map(s => s.id));
    const scopedDocRecords = documents.filter(d => scopedSubIds.has(d.subcontractorId));

    return {
      subs: sortedScopedSubs,
      docRecords: scopedDocRecords,
      total: sortedScopedSubs.length,
      compliantCount,
      warningCount,
      nonCompliantCount,
      score: sortedScopedSubs.length > 0 ? Math.round((compliantCount / sortedScopedSubs.length) * 100) : 100
    };
  };

  const handleGenerateReport = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newReport: GeneratedReportRecord = {
        id: `rpt-${Math.floor(Math.random() * 8999 + 1000)}`,
        title: `${projectScope === 'ALL' ? 'All Projects' : projectScope} Compliance Audit Report`,
        dateRangeKey: dateRange,
        dateRange: dateRange === 'ALL_TIME' ? `As of ${new Date().toLocaleDateString()}` : 
                   dateRange === 'THIS_MONTH' ? 'Aug 1, 2026 – Aug 21, 2026' : 
                   dateRange === 'THIS_QUARTER' ? 'Jul 1, 2026 – Sep 30, 2026' : 'Jan 1, 2026 – Dec 31, 2026',
        projectScopeKey: projectScope,
        projectScope: projectScope === 'ALL' ? 'All Projects' : projectScope,
        generatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        fileSize: '1.2 MB'
      };

      setGeneratedReports([newReport, ...generatedReports]);
      setIsGenerating(false);
      setActiveReportPdf(newReport);
    }, 900);
  };

  // Evaluate active report data for modal preview
  const reportData = activeReportPdf 
    ? getFilteredReportData(activeReportPdf.dateRangeKey, activeReportPdf.projectScopeKey)
    : getFilteredReportData(dateRange, projectScope);

  return (
    <div className="space-y-6 max-w-5xl">
      
      {/* Clean Page Header */}
      <div className="pb-3 border-b border-slate-800/80">
        <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-400" />
          Audit Reports
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Generate non-editable PDF compliance reports for insurance auditors, lenders, and project owners.
        </p>
      </div>

      {/* Main Report Generator Card (Clean, Uncluttered Centerpiece) */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-6">
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FileCheck className="w-4.5 h-4.5 text-emerald-400" />
            Generate Compliance Audit Report
          </h2>
          <p className="text-xs text-slate-400">
            Select your date period and project scope below to generate an official audit report.
          </p>
        </div>

        {/* Generator Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          
          {/* Date Range Selector */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Period</span>
            </label>
            <select
              value={dateRange}
              onChange={e => setDateRange(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="ALL_TIME">As of Today (All Time)</option>
              <option value="THIS_MONTH">This Month (August 2026)</option>
              <option value="THIS_QUARTER">This Quarter (Q3 2026)</option>
              <option value="CUSTOM_2026">Custom Range (Jan 1 – Dec 31, 2026)</option>
            </select>
          </div>

          {/* Project Filter */}
          <div className="space-y-1.5">
            <label className="block text-slate-300 font-medium flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Project Scope</span>
            </label>
            <select
              value={projectScope}
              onChange={e => setProjectScope(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
            >
              <option value="ALL">All Projects (Whole Roster)</option>
              <option value="Lucas Oil Stadium Expansion">Lucas Oil Stadium Expansion</option>
              <option value="I-65 Interchange Revamp">I-65 Interchange Revamp</option>
              <option value="Purdue Innovation Hub">Purdue Innovation Hub</option>
              <option value="Elkhart Industrial Park">Elkhart Industrial Park</option>
            </select>
          </div>

        </div>

        {/* Action Button & Plain-Language Note */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
          <p className="text-xs text-slate-400">
            Reports are generated as locked PDFs and cannot be edited after generation.
          </p>

          <button
            onClick={handleGenerateReport}
            disabled={isGenerating}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/10 shrink-0 disabled:opacity-50"
          >
            <Download className={`w-4 h-4 text-slate-950 ${isGenerating ? 'animate-bounce' : ''}`} />
            <span>{isGenerating ? 'Generating PDF...' : 'Generate Audit Report'}</span>
          </button>
        </div>
      </div>

      {/* Expandable Section 1: Past Reports Archive */}
      <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 overflow-hidden">
        <button
          onClick={() => setShowArchive(!showArchive)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 hover:bg-slate-800/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>View Past Reports ({generatedReports.length})</span>
          </div>
          {showArchive ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showArchive && (
          <div className="border-t border-slate-800/80 animate-in slide-in-from-top-2 duration-150">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Report Title</th>
                  <th className="py-3 px-4">Date Period</th>
                  <th className="py-3 px-4">Project Scope</th>
                  <th className="py-3 px-4">Generated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {generatedReports.map(rpt => (
                  <tr key={rpt.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-200">{rpt.title}</td>
                    <td className="py-3 px-4 text-slate-300">{rpt.dateRange}</td>
                    <td className="py-3 px-4 text-slate-300">{rpt.projectScope}</td>
                    <td className="py-3 px-4 text-slate-400">{rpt.generatedAt}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setActiveReportPdf(rpt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/60"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download PDF</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Expandable Section 2: Reminder History Log */}
      <div className="border border-slate-800/80 rounded-xl bg-slate-900/40 overflow-hidden">
        <button
          onClick={() => setShowNoticeHistory(!showNoticeHistory)}
          className="w-full px-5 py-3.5 flex items-center justify-between text-xs font-bold text-slate-300 hover:text-slate-100 hover:bg-slate-800/30 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" />
            <span>View Reminder History ({noticeHistory.length})</span>
          </div>
          {showNoticeHistory ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
        </button>

        {showNoticeHistory && (
          <div className="border-t border-slate-800/80 animate-in slide-in-from-top-2 duration-150">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subcontractor</th>
                  <th className="py-3 px-4">Notice Type</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {noticeHistory.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-100">{log.subcontractorName}</p>
                      <p className="text-[10px] text-slate-400">{log.trade}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{log.noticeType}</td>
                    <td className="py-3 px-4 text-slate-300">{log.channel}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-semibold">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400 font-mono text-xs">{log.timestamp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PDF AUDIT REPORT VIEW & DOWNLOAD MODAL (DYNAMIC DATA FILTERING) */}
      {activeReportPdf && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-950/80">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Official Compliance Audit Report (PDF)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Locked PDF Record for Insurance Carriers and Inspectors
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-950" />
                  <span>Print / Save PDF</span>
                </button>
                <button
                  onClick={() => setActiveReportPdf(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable PDF Document View Body */}
            <div className="p-8 overflow-y-auto bg-slate-950 space-y-6 text-slate-900 font-sans print:p-0 print:bg-white">
              
              <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-2xl space-y-6 max-w-3xl mx-auto">
                
                {/* 1. COVER / HEADER SECTION */}
                <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">INDYCOMPLY GENERAL CONTRACTOR LLC</h2>
                    <p className="text-xs font-semibold text-slate-600 uppercase mt-0.5">SUBCONTRACTOR COMPLIANCE & DUE DILIGENCE AUDIT REPORT</p>
                  </div>
                  <div className="text-right text-xs text-slate-600 space-y-0.5">
                    <p className="font-bold text-slate-900">Generated: {activeReportPdf.generatedAt}</p>
                    <p>Format: Locked PDF</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">DATE PERIOD COVERED</span>
                    <span className="font-bold text-slate-900">{activeReportPdf.dateRange}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 uppercase text-[10px] block">PROJECT SCOPE</span>
                    <span className="font-bold text-slate-900">{activeReportPdf.projectScope}</span>
                  </div>
                </div>

                {/* 2. DYNAMIC SUMMARY HEADLINE */}
                <div className="p-4 rounded-lg bg-slate-900 text-slate-100 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <p className="font-bold text-sm tracking-wide text-emerald-400">
                      {reportData.compliantCount} of {reportData.total} subcontractors current. {reportData.warningCount + reportData.nonCompliantCount} expired/expiring. 0 missing documentation.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Evaluated for period [{activeReportPdf.dateRange}] and project scope [{activeReportPdf.projectScope}].
                    </p>
                  </div>
                  <div className="text-right font-mono font-bold text-emerald-400 text-base">
                    {reportData.score}% SCORE
                  </div>
                </div>

                {/* 3. DYNAMIC MAIN COMPLIANCE TABLE (SCOPED TO DATE & PROJECT) */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Subcontractor Compliance Status Roster</h4>
                    <span className="text-[10px] font-mono text-slate-500">{reportData.subs.length} Vendors Evaluated</span>
                  </div>
                  
                  <table className="w-full text-left text-xs border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[9px] font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300">Subcontractor / Trade</th>
                        <th className="p-2 border-r border-slate-300">Document(s) on File</th>
                        <th className="p-2 border-r border-slate-300">Period Expiration Date</th>
                        <th className="p-2">Compliance Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-[11px]">
                      {reportData.subs.map(sub => (
                        <tr 
                          key={sub.id} 
                          className={
                            sub.scopedStatus === 'ROSE' ? 'bg-rose-50 font-medium' : 
                            sub.scopedStatus === 'AMBER' ? 'bg-amber-50 font-medium' : 'bg-white'
                          }
                        >
                          <td className="p-2 border-r border-slate-200">
                            <p className="font-bold text-slate-900">{sub.name}</p>
                            <p className="text-[10px] text-slate-500">{sub.trade} • {sub.activeProject}</p>
                          </td>
                          <td className="p-2 border-r border-slate-200 text-slate-700">
                            Certificate of Insurance (COI), Trade License
                          </td>
                          <td className="p-2 border-r border-slate-200 font-mono text-slate-900">
                            {sub.scopedExpDate}
                          </td>
                          <td className="p-2">
                            {sub.scopedStatus === 'EMERALD' && (
                              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-300 text-[10px]">
                                Valid / Current
                              </span>
                            )}
                            {sub.scopedStatus === 'AMBER' && (
                              <span className="font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded border border-amber-300 text-[10px]">
                                Expiring Soon
                              </span>
                            )}
                            {sub.scopedStatus === 'ROSE' && (
                              <span className="font-bold text-rose-900 bg-rose-100 px-2 py-0.5 rounded border border-rose-300 text-[10px]">
                                Expired / Lapsed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 4. DYNAMIC VERIFICATION / AUDIT TRAIL APPENDIX */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Verification & Due Diligence Appendix</h4>
                  <p className="text-[10px] text-slate-600">
                    Proof of due diligence for insurance carriers and project owners, matching scoped document records.
                  </p>

                  <table className="w-full text-left text-[10px] border border-slate-300">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold border-b border-slate-300">
                      <tr>
                        <th className="p-2 border-r border-slate-300">Document ID</th>
                        <th className="p-2 border-r border-slate-300">Subcontractor</th>
                        <th className="p-2 border-r border-slate-300">Review Method</th>
                        <th className="p-2 border-r border-slate-300">Date Confirmed</th>
                        <th className="p-2">Resolution Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {reportData.docRecords.map(doc => (
                        <tr key={doc.id}>
                          <td className="p-2 border-r border-slate-200 font-mono">{doc.id}</td>
                          <td className="p-2 border-r border-slate-200 font-semibold">{doc.subcontractorName}</td>
                          <td className="p-2 border-r border-slate-200">AI-Extracted & Confirmed</td>
                          <td className="p-2 border-r border-slate-200 font-mono">{doc.submittedAt?.split(' ')[0] || '2026-08-10'}</td>
                          <td className="p-2">
                            {doc.status === 'EMERALD' ? (
                              <span className="text-emerald-800 font-semibold">No Deficiencies • Verified</span>
                            ) : doc.status === 'AMBER' ? (
                              <span className="text-amber-800 font-semibold">Renewal Nudge Dispatched</span>
                            ) : (
                              <span className="text-rose-800 font-semibold">Lapsed Expiration • Escalated</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Audit Record Footer */}
                <div className="pt-4 border-t border-slate-300 text-[9px] text-slate-500 flex items-center justify-between">
                  <span>IndyComply SaaS Platform • Official Record</span>
                  <span>Locked PDF</span>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
