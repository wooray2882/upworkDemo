import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Filter,
  Mail, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Check, 
  X, 
  Building,
  Calendar,
  ShieldAlert,
  ArrowRight,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { DocumentRecord, Subcontractor } from '../types';
import { DocumentFileViewer } from '../components/DocumentFileViewer';
import { DocumentExtractionModal } from '../components/DocumentExtractionModal';
import { approveDocument } from '../services/apiService';




interface DocumentIntakePageProps {
  documents: DocumentRecord[];
  subcontractors: Subcontractor[];
  onAddDocument: (doc: Omit<DocumentRecord, 'id'>) => void;
  onApproveHumanReview?: (itemId: string, updatedFields?: { expirationDate?: string; carrierName?: string; policyNumber?: string }) => void;
}

export const DocumentIntakePage: React.FC<DocumentIntakePageProps> = ({
  documents,
  subcontractors,
  onAddDocument,
  onApproveHumanReview
}) => {
  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcontractor, setSelectedSubcontractor] = useState('ALL');
  const [selectedDocType, setSelectedDocType] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'EMERALD' | 'AMBER' | 'ROSE' | 'REVIEW'>('ALL');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Active side-by-side view document & zoom state
  const [activeDoc, setActiveDoc] = useState<DocumentRecord | null>(null);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Editable fields in verification view
  const [editExpDate, setEditExpDate] = useState('');
  const [editPolicyNum, setEditPolicyNum] = useState('');
  const [editCarrier, setEditCarrier] = useState('');

  // Human review items filter - only include documents requiring review that are not yet approved
  const reviewQueueDocs = documents.filter(d => 
    (d.needsHumanReview || d.reviewStatus === 'NEEDS_REVIEW') && d.reviewStatus !== 'APPROVED'
  );
  const hasActiveSecondaryFilters = selectedSubcontractor !== 'ALL' || selectedDocType !== 'ALL';

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = 
      doc.subcontractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.policyNumber && doc.policyNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSub = selectedSubcontractor === 'ALL' || doc.subcontractorId === selectedSubcontractor;
    const matchesDocType = selectedDocType === 'ALL' || doc.documentType === selectedDocType;
    
    let matchesStatus = true;
    if (selectedStatus === 'EMERALD') matchesStatus = doc.status === 'EMERALD' && !doc.needsHumanReview;
    if (selectedStatus === 'AMBER') matchesStatus = doc.status === 'AMBER' && !doc.needsHumanReview;
    if (selectedStatus === 'ROSE') matchesStatus = doc.status === 'ROSE' && !doc.needsHumanReview;
    if (selectedStatus === 'REVIEW') matchesStatus = doc.needsHumanReview || doc.confidenceScore < 0.85;

    return matchesSearch && matchesSub && matchesDocType && matchesStatus;
  });

  const handleOpenSideBySide = (doc: DocumentRecord) => {
    setActiveDoc(doc);
    let dStr = doc.expirationDate || '';
    if (dStr === 'unknown' || !dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      dStr = '';
    }
    setEditExpDate(dStr);
    setEditPolicyNum(doc.policyNumber || '');
    setEditCarrier(doc.carrierName || '');
    setZoomLevel(100);
  };

  const handleDocumentApproved = (updatedDoc: DocumentRecord) => {
    if (onApproveHumanReview) {
      onApproveHumanReview(updatedDoc.id, {
        expirationDate: updatedDoc.expirationDate,
        carrierName: updatedDoc.carrierName,
        policyNumber: updatedDoc.policyNumber
      });
    }
    setActiveDoc(null);
  };

  // Modal state for Email & Mobile Intake
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('coi-intake@indycomply.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      onAddDocument({
        subcontractorId: subcontractors[0]?.id || 'sub-101',
        subcontractorName: subcontractors[0]?.name || 'Apex Electrical Services LLC',
        client_company_id: 'comp-01',
        documentType: 'Certificate of Insurance (COI)',
        policyNumber: `POL-${Math.floor(100000 + Math.random() * 900000)}`,
        carrierName: 'Travelers Commercial Insurance',
        effectiveDate: '2026-08-30',
        expirationDate: '2027-08-30',
        daysUntilExpiration: 365,
        submittedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        status: 'EMERALD',
        needsHumanReview: false,
        confidenceScore: 0.98,
        s3Url: URL.createObjectURL(file),
        intakeChannel: isMobileModalOpen ? 'TAP_TO_PHOTO_SMS' : 'EMAIL_SES'
      });
      setIsMobileModalOpen(false);
      setIsEmailModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Clean Business Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            Document Vault
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            All subcontractor insurance certificates, licenses, and compliance files in one place.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button
            onClick={() => setIsEmailModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all cursor-pointer hover:border-sky-500/40"
          >
            <Mail className="w-3.5 h-3.5 text-sky-400" />
            <span>Email Intake</span>
          </button>
          <button
            onClick={() => setIsMobileModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 transition-all cursor-pointer hover:border-emerald-500/40"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mobile Upload</span>
          </button>
        </div>
      </div>

      {/* Action Needed (Lightweight Review To-Do List) */}
      {reviewQueueDocs.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-bold text-amber-200 uppercase tracking-wider">
                Action Needed ({reviewQueueDocs.length})
              </h2>
            </div>
            <span className="text-xs text-amber-400/90 font-medium">Please confirm extracted information below</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reviewQueueDocs.map(doc => (
              <div key={doc.id} className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-semibold text-xs text-slate-100">{doc.subcontractorName}</p>
                  <p className="text-xs text-slate-400">{doc.documentType}</p>
                  <p className="text-[11px] text-slate-500">Expiration: {doc.expirationDate}</p>
                </div>

                <button
                  onClick={() => handleOpenSideBySide(doc)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer shrink-0"
                >
                  <span>Review</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 bg-slate-900/60 border border-slate-800/80 rounded-xl">
          
          <div className="flex items-center gap-2 flex-1 max-w-md">
            {/* Simple Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            {/* Collapsible Filter Icon Button (Gmail / Linear pattern) */}
            <button
              type="button"
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-lg border text-xs font-semibold flex items-center justify-center transition-all cursor-pointer relative shrink-0 ${
                showFilterPanel || hasActiveSecondaryFilters
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Filter by Subcontractor or Document Type"
            >
              <Filter className="w-4 h-4" />
              {hasActiveSecondaryFilters && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 absolute -top-0.5 -right-0.5" />
              )}
            </button>
          </div>

          {/* Status Segmented Control (Front & Center) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 font-medium text-xs">
            <button
              onClick={() => setSelectedStatus('ALL')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedStatus === 'ALL' ? 'bg-slate-800 text-slate-100 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedStatus('EMERALD')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedStatus === 'EMERALD' ? 'bg-emerald-500/20 text-emerald-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Valid
            </button>
            <button
              onClick={() => setSelectedStatus('AMBER')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedStatus === 'AMBER' ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expiring
            </button>
            <button
              onClick={() => setSelectedStatus('ROSE')}
              className={`px-3 py-1 rounded-md transition-all ${
                selectedStatus === 'ROSE' ? 'bg-rose-500/20 text-rose-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Expired
            </button>
          </div>

        </div>

        {/* Collapsible Secondary Filter Dropdown Panel */}
        {showFilterPanel && (
          <div className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3 animate-in slide-in-from-top-2 duration-150 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Subcontractor:</span>
              <select
                value={selectedSubcontractor}
                onChange={e => setSelectedSubcontractor(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="ALL">All Subcontractors</option>
                {subcontractors.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium font-sans">Document Type:</span>
              <select
                value={selectedDocType}
                onChange={e => setSelectedDocType(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500/50 cursor-pointer"
              >
                <option value="ALL">All Types</option>
                <option value="Certificate of Insurance (COI)">Certificate of Insurance (COI)</option>
                <option value="Indiana Trade License">Indiana Trade License</option>
                <option value="W-9 Form">W-9 Form</option>
                <option value="Worker Comp Policy">Worker Comp Policy</option>
                <option value="OSHA 10/30 Cert">OSHA 10/30 Cert</option>
              </select>
            </div>

            {hasActiveSecondaryFilters && (
              <button
                onClick={() => {
                  setSelectedSubcontractor('ALL');
                  setSelectedDocType('ALL');
                }}
                className="text-slate-400 hover:text-rose-400 text-xs font-semibold ml-auto underline transition-colors cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Document List Table */}
      <div className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-900/40 shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Subcontractor</th>
                <th className="py-3.5 px-4">Document Type</th>
                <th className="py-3.5 px-4">Channel</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Expiration Date</th>
                <th className="py-3.5 px-4">Submitted</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No documents found matching your filter options.
                  </td>
                </tr>
              ) : (
                filteredDocs.map(doc => {
                  const isEmail = doc.intakeChannel === 'EMAIL_SES';
                  return (
                    <tr 
                      key={doc.id} 
                      onClick={() => handleOpenSideBySide(doc)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      {/* Subcontractor */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-100 text-xs truncate group-hover:text-emerald-400 transition-colors">
                          {doc.subcontractorName}
                        </p>
                      </td>

                      {/* Document Type */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-medium text-slate-200 text-xs">{doc.documentType}</p>
                          <p className="text-[11px] text-slate-500">{doc.policyNumber || doc.carrierName || 'Vault Document'}</p>
                        </div>
                      </td>

                      {/* Channel */}
                      <td className="py-3.5 px-4">
                        {isEmail ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-sky-500/10 text-sky-400 border border-sky-500/30 text-xs font-medium">
                            <Mail className="w-3 h-3 text-sky-400 shrink-0" />
                            Email
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-medium">
                            <Smartphone className="w-3 h-3 text-emerald-400 shrink-0" />
                            Mobile Upload
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {(() => {
                          const isNeedsReview = doc.needsHumanReview || doc.reviewStatus === 'NEEDS_REVIEW';
                          if (isNeedsReview) {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs shadow-sm">
                                <AlertTriangle className="w-3 h-3 text-white shrink-0" />
                                Needs Review
                              </span>
                            );
                          }
                          const expDt = doc.expirationDate ? new Date(doc.expirationDate) : null;
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const isExpired = expDt && !isNaN(expDt.getTime()) && expDt.getTime() < today.getTime();
                          const isExpiringSoon = expDt && !isNaN(expDt.getTime()) && (expDt.getTime() - today.getTime()) <= (30 * 24 * 60 * 60 * 1000);

                          if (isExpired || doc.status === 'ROSE') {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500 text-white font-extrabold text-xs shadow-sm">
                                Non-Compliant
                              </span>
                            );
                          }
                          if (isExpiringSoon || doc.status === 'AMBER') {
                            return (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-xs shadow-sm">
                                Expiring Soon
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-xs shadow-sm">
                              Compliant
                            </span>
                          );
                        })()}
                      </td>

                      {/* Expiration Date */}
                      <td className="py-3.5 px-4 text-slate-200 font-medium">
                        {doc.expirationDate}
                      </td>

                      {/* Submitted */}
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {doc.submittedAt || 'Aug 18, 2026'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenSideBySide(doc);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-700/60"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Review</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Detail Verification View Modal */}
      {activeDoc && (
        <DocumentExtractionModal
          document={activeDoc}
          onClose={() => setActiveDoc(null)}
          onConfirmApprove={handleDocumentApproved}
        />
      )}

      {/* Email Intake Information Modal */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Automated Email Intake System</h3>
                  <p className="text-xs text-slate-400">AWS SES Automated COI Ingestion Endpoint</p>
                </div>
              </div>
              <button onClick={() => setIsEmailModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <p className="text-slate-400 font-medium">Designated Ingestion Email Address:</p>
                <div className="flex items-center justify-between gap-2 bg-slate-900 p-2.5 rounded-lg border border-slate-800 font-mono text-sky-400 font-bold">
                  <span>coi-intake@indycomply.com</span>
                  <button
                    onClick={handleCopyEmail}
                    className="px-3 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-md font-sans text-xs transition-colors cursor-pointer"
                  >
                    {copiedEmail ? 'Copied!' : 'Copy Address'}
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-slate-300 leading-relaxed">
                <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider">How Email Intake Works:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-400">
                  <li>Share this email address with insurance brokers, agents, or subcontractors.</li>
                  <li>When an email with PDF/JPEG attachments is received, AWS SES triggers the intake pipeline.</li>
                  <li>AWS Textract & Bedrock AI parse carrier policy numbers, expiration dates, and GL coverage limits.</li>
                  <li>Matching records automatically appear in your Document Vault and Review Queue.</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                <label className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs cursor-pointer transition-colors flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>Simulate File Attachment Upload</span>
                  <input type="file" accept=".pdf,.jpg,.png" onChange={handleFileUpload} className="hidden" />
                </label>
                <button
                  onClick={() => setIsEmailModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Upload Information & Launcher Modal */}
      {isMobileModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Mobile Camera & Field Intake</h3>
                  <p className="text-xs text-slate-400">Direct Upload & SMS/MMS Mobile Portal</p>
                </div>
              </div>
              <button onClick={() => setIsMobileModalOpen(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-center space-y-3">
                <p className="text-slate-300 font-medium">Scan QR Code on Field Device or Mobile Camera:</p>
                <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl flex items-center justify-center shadow-inner">
                  {/* QR Code SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <path fill="#0f172a" d="M0 0h30v30H0zM10 10h10v10H10zM70 0h30v30H70zM80 10h10v10H80zM0 70h30v30H0zM10 80h10v10H10zM40 10h20v10H40zM10 40h20v20H10zM40 40h20v20H40zM70 40h20v10H70zM70 70h10v20H70zM80 80h20v20H80z" />
                  </svg>
                </div>
                <p className="text-[11px] text-emerald-400 font-mono">Mobile Portal: app.indycomply.com/upload</p>
              </div>

              <div className="space-y-2 text-slate-300">
                <h4 className="font-bold text-slate-200 uppercase text-[10px] tracking-wider">Upload directly from device:</h4>
                <label className="p-4 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-slate-950/50 hover:bg-slate-950">
                  <Smartphone className="w-6 h-6 text-emerald-400" />
                  <span className="font-bold text-slate-200">Click to Select Photo or PDF Scan</span>
                  <span className="text-[11px] text-slate-500">Supports JPEG, PNG, PDF (up to 25MB)</span>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setIsMobileModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
