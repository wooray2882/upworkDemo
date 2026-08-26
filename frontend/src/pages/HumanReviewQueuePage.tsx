import React from 'react';
import { FileSearch, CheckCircle, AlertTriangle, Eye, ThumbsUp, ThumbsDown } from 'lucide-react';
import { HumanReviewItem } from '../types';
import { DocumentFileViewer } from '../components/DocumentFileViewer';


interface HumanReviewQueuePageProps {
  items: HumanReviewItem[];
  onApproveItem: (id: string) => void;
  onRejectItem: (id: string) => void;
}

export const HumanReviewQueuePage: React.FC<HumanReviewQueuePageProps> = ({
  items,
  onApproveItem,
  onRejectItem,
}) => {
  const [viewingDocId, setViewingDocId] = React.useState<string | null>(null);

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto font-sans">
      
      {/* Title Header */}
      <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-amber-400" />
            Human-in-the-Loop Review Queue
          </h2>
          <span className="badge-amber font-mono font-bold">{items.length} Pending Review</span>
        </div>
        <p className="text-xs text-slate-400">
          AI Action Whitelist Guardrail Enforcement • Documents with confidence &lt;85% or ambiguous policy clauses require human verification.
        </p>
      </div>

      {/* Review Queue Items List */}
      {items.length === 0 ? (
        <div className="p-12 text-center border border-slate-800 rounded-xl bg-slate-900/40 text-slate-400 space-y-2">
          <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-slate-200 text-sm">Review Queue Empty!</h3>
          <p className="text-xs text-slate-500">All recent document classifications were verified above the 85% confidence threshold.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const isViewing = viewingDocId === item.id;

            return (
              <div key={item.id} className="card-panel space-y-4">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm">{item.subcontractorName}</h3>
                    <p className="text-xs text-slate-400">Uploaded at: {item.uploadedAt || item.receivedDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge-amber flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Score: {(item.confidenceScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Grid detail */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Suggested Category</p>
                    <p className="font-semibold text-slate-200">{item.suggestedDocType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Extracted Expiration</p>
                    <p className="font-semibold text-emerald-400 font-mono">{item.extractedExpiration || 'Pending Verification'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Flag Reason</p>
                    <p className="text-amber-300">{item.flagReason || item.rejectionReason || 'Confidence below 85%'}</p>
                  </div>
                </div>

                {/* Raw OCR Text snippet */}
                {item.rawOcrText && (
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Eye className="w-3 h-3 text-slate-400" /> AWS Textract Raw OCR Snippet
                    </p>
                    <p className="text-[11px] font-mono text-slate-300 leading-relaxed">
                      "{item.rawOcrText}"
                    </p>
                  </div>
                )}

                {/* Inline Source File Viewer using Shared DocumentFileViewer Component */}
                {isViewing && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 font-mono pb-2 border-b border-slate-800">
                      <span>📄 S3 Source Document Stream (Presigned 15m)</span>
                      <button onClick={() => setViewingDocId(null)} className="text-slate-400 hover:text-white font-bold">Close Preview ✕</button>
                    </div>
                    <DocumentFileViewer document={item} maxHeight="500px" />
                  </div>
                )}


                {/* Confirm / Reject / View Buttons */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
                  <button
                    onClick={() => setViewingDocId(isViewing ? null : item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{isViewing ? 'Hide Source File' : 'View Source File (S3)'}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onRejectItem(item.id)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold hover:bg-rose-500/25 transition-all cursor-pointer"
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                      <span>Reject & Request Re-upload</span>
                    </button>
                    <button
                      onClick={() => onApproveItem(item.id)}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-all cursor-pointer shadow-md shadow-emerald-500/10 active:scale-95"
                    >
                      <ThumbsUp className="w-3.5 h-3.5 text-slate-950" />
                      <span>Confirm Classification & File</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};

