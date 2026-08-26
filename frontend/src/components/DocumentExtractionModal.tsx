import React, { useState, useEffect } from 'react';
import { 
  X, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Building, 
  Calendar, 
  CreditCard, 
  Download,
  Sparkles,
  Check
} from 'lucide-react';
import { DocumentRecord } from '../types';
import { DocumentFileViewer } from './DocumentFileViewer';
import { approveDocument } from '../services/apiService';

interface DocumentExtractionModalProps {
  document: DocumentRecord | null;
  onClose: () => void;
  onConfirmApprove?: (updatedDoc: DocumentRecord) => void;
}

export const DocumentExtractionModal: React.FC<DocumentExtractionModalProps> = ({
  document,
  onClose,
  onConfirmApprove
}) => {
  if (!document) return null;

  const dateInputRef = React.useRef<HTMLInputElement>(null);
  const [editExpDate, setEditExpDate] = useState(document.expirationDate || '');
  const [editCarrier, setEditCarrier] = useState(document.carrierName || '');
  const [editPolicyNum, setEditPolicyNum] = useState(document.policyNumber || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (document) {
      // Ensure date format is YYYY-MM-DD for date input
      let dStr = document.expirationDate || '';
      if (dStr === 'unknown' || !dStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dStr = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
      setEditExpDate(dStr);
      setEditCarrier(document.carrierName || '');
      setEditPolicyNum(document.policyNumber || '');
    }
  }, [document]);

  const fileUrl = document.presignedUrl || document.s3Url;
  const isCompliant = document.status === 'EMERALD' || document.reviewStatus === 'APPROVED';
  const needsReview = document.needsHumanReview || document.reviewStatus === 'NEEDS_REVIEW';

  const handleConfirm = async () => {
    try {
      setSaving(true);
      await approveDocument(document.id, {
        subcontractorId: document.subcontractorId,
        expirationDate: editExpDate,
        carrierName: editCarrier,
        policyNumber: editPolicyNum,
        subcontractorName: document.subcontractorName,
        documentType: document.documentType
      });

      let computedStatus: 'EMERALD' | 'AMBER' | 'ROSE' = 'EMERALD';
      if (!editExpDate || editExpDate === 'unknown' || editExpDate === 'N/A' || editExpDate.trim() === '') {
        computedStatus = 'ROSE';
      } else {
        const expDt = new Date(editExpDate);
        if (isNaN(expDt.getTime())) {
          computedStatus = 'ROSE';
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const diffDays = Math.ceil((expDt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays < 0) computedStatus = 'ROSE';
          else if (diffDays <= 30) computedStatus = 'AMBER';
        }
      }

      const updatedDoc: DocumentRecord = {
        ...document,
        expirationDate: editExpDate,
        carrierName: editCarrier,
        policyNumber: editPolicyNum,
        reviewStatus: 'APPROVED',
        needsHumanReview: false,
        status: computedStatus
      };

      if (onConfirmApprove) {
        onConfirmApprove(updatedDoc);
      }

      onClose();
    } catch (err) {
      console.error('Error confirming document:', err);
      alert('Failed to save document verification. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">{document.documentType || 'Certificate of Insurance'}</h2>
                {isCompliant && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500 text-slate-950 flex items-center gap-1 shadow-sm font-sans">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Compliant
                  </span>
                )}
                {needsReview && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500 text-slate-950 flex items-center gap-1 shadow-sm font-sans">
                    <AlertTriangle className="w-3.5 h-3.5" /> Needs Human Review
                  </span>
                )}
                {!isCompliant && !needsReview && (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-rose-500 text-white flex items-center gap-1 shadow-sm font-sans">
                    <AlertTriangle className="w-3.5 h-3.5 text-white" /> Non-Compliant
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono">Document ID: {document.id} • Vendor: {document.subcontractorName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Open S3 File</span>
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - Side-by-Side View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Document File Preview (7 cols) */}
          <div className="lg:col-span-7 bg-slate-950/60 p-4 border-b lg:border-b-0 lg:border-r border-slate-800 flex flex-col justify-center items-center overflow-hidden">
            <DocumentFileViewer document={document} maxHeight="100%" />
          </div>

          {/* Right Column: AI Extraction & Interactive Verification (5 cols) */}
          <div className="lg:col-span-5 p-6 overflow-y-auto space-y-6 bg-slate-900/90 flex flex-col justify-between">
            
            <div className="space-y-5">
              {/* Extraction Overview Banner */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <Sparkles className="w-4 h-4" /> Amazon Bedrock Extraction
                  </span>
                  <span className="font-mono text-emerald-400">
                    {Math.round((document.confidenceScore || 0.94) * 100)}% Confidence
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Verify or update fields below against the document preview. Clicking confirm files the document and updates compliance status to Emerald.
                </p>
              </div>

              {/* Extracted & Editable Fields Grid */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Compliance Verification Fields
                </h3>

                <div className="space-y-3 text-xs">
                  
                  {/* Field 1: Subcontractor Name */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Subcontractor Name</label>
                    <input
                      type="text"
                      disabled
                      value={document.subcontractorName}
                      className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-slate-200 font-semibold"
                    />
                  </div>

                  {/* Field 2: Carrier Name */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Insurance Carrier</label>
                    <input
                      type="text"
                      autoComplete="off"
                      data-lpignore="true"
                      value={editCarrier}
                      onChange={e => setEditCarrier(e.target.value)}
                      placeholder="e.g. Travelers / Liberty Mutual"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Field 3: Policy Number */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">Policy Number</label>
                    <input
                      type="text"
                      autoComplete="off"
                      data-lpignore="true"
                      value={editPolicyNum}
                      onChange={e => setEditPolicyNum(e.target.value)}
                      placeholder="e.g. TRV-8849201-IN"
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>

                  {/* Field 4: Expiration Date (Interactive Date Picker) */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold flex items-center justify-between">
                      <span>Policy Expiration Date *</span>
                      <span className="text-[10px] text-emerald-400 font-mono font-normal">Click field or calendar icon</span>
                    </label>
                    <div className="relative flex items-center">
                      <input
                        ref={dateInputRef}
                        type="date"
                        required
                        autoComplete="off"
                        data-lpignore="true"
                        value={editExpDate}
                        onChange={e => setEditExpDate(e.target.value)}
                        onClick={e => (e.target as HTMLInputElement).showPicker?.()}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-emerald-500/60 rounded-xl text-emerald-400 font-bold font-mono focus:outline-none focus:border-emerald-400 cursor-pointer shadow-inner pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => dateInputRef.current?.showPicker()}
                        className="absolute right-2.5 p-1 text-emerald-400 hover:text-emerald-300 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                        title="Click to open calendar date picker"
                      >
                        <Calendar className="w-4 h-4 text-emerald-400" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>

            {/* Modal Footer Controls */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleConfirm}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/10 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-slate-950" />
                <span>{saving ? 'Saving...' : 'Confirm & Approve Document'}</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
