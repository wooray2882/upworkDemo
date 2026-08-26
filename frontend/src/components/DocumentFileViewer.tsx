import React from 'react';
import { AlertTriangle, FileText } from 'lucide-react';
import { DocumentRecord, HumanReviewItem } from '../types';

interface DocumentFileViewerProps {
  document: DocumentRecord | HumanReviewItem;
  zoomLevel?: number;
  maxHeight?: string;
}

export const DocumentFileViewer: React.FC<DocumentFileViewerProps> = ({
  document,
  zoomLevel = 100,
  maxHeight = '620px'
}) => {
  const fileUrl = document.presignedUrl || (document as DocumentRecord).s3Url || (document as HumanReviewItem).documentUrl;

  const isPdf = 
    fileUrl?.toLowerCase().includes('.pdf') || 
    (document as DocumentRecord).documentType?.toLowerCase().includes('pdf') || 
    (document as HumanReviewItem).suggestedDocType?.toLowerCase().includes('coi') ||
    (document as HumanReviewItem).suggestedDocType?.toLowerCase().includes('pdf') ||
    (document as DocumentRecord).intakeChannel === 'EMAIL_SES';

  if (!fileUrl || (!fileUrl.startsWith('http') && !fileUrl.startsWith('https') && !fileUrl.startsWith('blob'))) {
    return (
      <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-xl space-y-3 max-w-md my-auto mx-auto">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
        <h4 className="font-bold text-slate-200 text-sm">Source Document Link Not Presigned</h4>
        <p className="text-xs text-slate-400">
          S3 Storage URI: <span className="font-mono text-slate-300 break-all">{(document as DocumentRecord).s3Url || 's3://indycomply-saas-dev-docs/intake/coi.pdf'}</span>
        </p>
        <p className="text-[11px] text-slate-500 italic">
          Live S3 presigned URL generation is active. Connect to AWS to stream original file bytes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-auto p-2">
      {isPdf ? (
        <iframe 
          src={`${fileUrl}#toolbar=1`}
          title={`PDF View - ${document.subcontractorName}`}
          className="w-full rounded-lg border border-slate-800 bg-slate-900 shadow-2xl"
          style={{ height: maxHeight }}
        />
      ) : (
        <div className="relative overflow-auto flex justify-center items-center" style={{ maxHeight }}>
          <img 
            src={fileUrl} 
            alt={`Uploaded document snapshot for ${document.subcontractorName}`}
            className="max-w-full max-h-[600px] object-contain rounded-lg shadow-2xl border border-slate-800 transition-transform duration-150"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center center' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
              const parent = (e.target as HTMLElement).parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="p-6 text-center bg-rose-500/10 border border-rose-500/30 rounded-xl space-y-2 max-w-md text-rose-300">
                    <p class="font-bold text-xs">Couldn't load image preview from S3</p>
                    <p class="text-[11px] font-mono opacity-80 break-all">${fileUrl}</p>
                  </div>
                `;
              }
            }}
          />
        </div>
      )}
    </div>
  );
};
