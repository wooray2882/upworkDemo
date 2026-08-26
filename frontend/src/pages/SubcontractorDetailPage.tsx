import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Building2, 
  FileText, 
  Upload, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  RefreshCw, 
  ArrowLeft,
  FileCheck,
  Eye
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { DocumentExtractionModal } from '../components/DocumentExtractionModal';
import { 
  fetchSubcontractorDetail, 
  fetchSubcontractorDocs, 
  getUploadPresignedUrl, 
  triggerDocumentProcessing 
} from '../services/apiService';
import { Subcontractor, DocumentRecord } from '../types';

export const SubcontractorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [subcontractor, setSubcontractor] = useState<Subcontractor | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatusMsg, setUploadStatusMsg] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [subRes, docsRes] = await Promise.all([
        fetchSubcontractorDetail(id).catch(() => null),
        fetchSubcontractorDocs(id).catch(() => ({ documents: [] }))
      ]);

      if (subRes) {
        setSubcontractor(subRes);
      }
      setDocuments(docsRes.documents || []);
    } catch (err) {
      console.error('Error loading subcontractor details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !id) return;

    const file = files[0];
    try {
      setUploading(true);
      setUploadStatusMsg(`Requesting secure S3 upload URL for ${file.name}...`);

      // 1. Get short-lived S3 presigned PUT URL (Zero AWS credentials in browser)
      const presignedRes = await getUploadPresignedUrl(id, file.name, file.type || 'application/pdf');
      const { uploadUrl, s3Key, documentId } = presignedRes;

      setUploadStatusMsg(`Uploading file directly to S3 bucket...`);

      // 2. Direct HTTP PUT to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type || 'application/pdf'
        },
        body: file
      });

      if (!uploadRes.ok) {
        throw new Error(`S3 upload failed with status ${uploadRes.status}`);
      }

      setUploadStatusMsg(`Triggering AWS Step Functions document pipeline...`);

      // 3. Trigger Step Functions execution server-side
      const triggerRes = await triggerDocumentProcessing(id, s3Key, documentId);

      setUploadStatusMsg(`⚡ Extracting compliance data via AI (Textract + Bedrock)...`);
      
      // Clear file input
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Polling loop: check every 3 seconds for up to 30 seconds
      const initialCount = documents.length;
      let attempts = 0;
      const intervalId = setInterval(async () => {
        attempts++;
        try {
          const docsRes = await fetchSubcontractorDocs(id);
          const currentDocs = docsRes.documents || [];
          setDocuments(currentDocs);
          
          if (currentDocs.length > initialCount || attempts >= 10) {
            clearInterval(intervalId);
            loadData();
            setUploadStatusMsg(null);
            setUploading(false);
          }
        } catch (err) {
          if (attempts >= 10) {
            clearInterval(intervalId);
            setUploadStatusMsg(null);
            setUploading(false);
          }
        }
      }, 3000);

    } catch (err: any) {
      console.error('Upload error:', err);
      alert(`Upload failed: ${err.message || err}`);
      setUploading(false);
      setUploadStatusMsg(null);
    }
  };

  if (loading && !subcontractor) {
    return (
      <div className="p-8 max-w-5xl mx-auto font-sans flex items-center justify-center text-slate-400">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading subcontractor details...</span>
        </div>
      </div>
    );
  }

  const subName = subcontractor?.name || `Subcontractor (${id})`;
  const status = subcontractor?.complianceStatus || (documents.length > 0 ? 'EMERALD' : 'ROSE');

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-xs font-sans">
      
      {/* Reusable Breadcrumb Trail */}
      <Breadcrumbs items={[
        { label: 'Subcontractors', path: '/subcontractors' },
        { label: subName }
      ]} />

      {/* Subcontractor Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-slate-100">{subName}</h1>
                
                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-bold font-sans flex items-center gap-1.5 shadow-md ${
                  status === 'EMERALD' 
                    ? 'bg-emerald-500 text-slate-950'
                    : status === 'AMBER'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-rose-500 text-white'
                }`}>
                  {status === 'EMERALD' && <CheckCircle className="w-3.5 h-3.5" />}
                  {status === 'AMBER' && <AlertTriangle className="w-3.5 h-3.5" />}
                  {status === 'ROSE' && <XCircle className="w-3.5 h-3.5" />}
                  <span>{status === 'EMERALD' ? 'Compliant' : status === 'AMBER' ? 'Expiring Soon' : 'Non-Compliant'}</span>
                </span>
              </div>
              
              <p className="text-xs text-slate-400 flex items-center gap-3">
                <span>Trade: <strong className="text-slate-200">{subcontractor?.trade || 'Subcontractor'}</strong></span>
                <span>•</span>
                <span>Active Project: <strong className="text-slate-200">{subcontractor?.activeProject || 'Indiana Operations'}</strong></span>
                <span>•</span>
                <span>Subcontractor ID: <strong className="font-mono text-slate-300">{id}</strong></span>
              </p>
            </div>
          </div>

          {/* Action Button & Upload Control */}
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-500/10"
            >
              <Upload className="w-4 h-4" />
              <span>{uploading ? 'Processing...' : 'Upload Document'}</span>
            </button>
          </div>

        </div>

        {/* Contact Info Footer */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Contact: <strong className="text-slate-200">{subcontractor?.contactName || 'Primary Contact'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>Email: <strong className="text-slate-200">{subcontractor?.email || 'N/A'}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-slate-500" />
            <span>Phone: <strong className="text-slate-200">{subcontractor?.phone || 'N/A'}</strong></span>
          </div>
        </div>

        {/* Upload Status Banner */}
        {uploadStatusMsg && (
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-xl text-indigo-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-400 shrink-0" />
            <span>{uploadStatusMsg}</span>
          </div>
        )}

      </div>

      {/* Document History Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              Subcontractor Compliance Documents
            </h3>
            <p className="text-xs text-slate-400">Certificates of Insurance, Trade Licenses, and Workers Comp Policies</p>
          </div>
          <span className="badge-emerald font-mono font-bold">{documents.length} Documents On File</span>
        </div>

        {documents.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <FileText className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 text-xs italic">No documents uploaded for this subcontractor yet.</p>
            <p className="text-slate-500 text-[11px]">
              Click <strong>"Upload Document"</strong> above to upload a PDF/Image Certificate of Insurance directly.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 font-bold bg-slate-950/60">
                  <th className="p-3">Document Type</th>
                  <th className="p-3">Carrier / Policy #</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Expiration Date</th>
                  <th className="p-3">Submitted</th>
                  <th className="p-3">Channel</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {documents.map((doc) => (
                  <tr 
                    key={doc.id || doc.SK} 
                    onClick={() => setSelectedDoc(doc)}
                    className="hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  >
                    <td className="p-3">
                      <p className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{doc.documentType}</p>
                      <p className="text-[10px] font-mono text-slate-500">{doc.id}</p>
                    </td>
                    <td className="p-3 font-semibold text-slate-300">
                      <p>{doc.carrierName || 'Insurance Carrier'}</p>
                      <p className="text-[10px] font-mono text-slate-500">{doc.policyNumber || 'N/A'}</p>
                    </td>
                    <td className="p-3">
                      {(() => {
                        const getDocStatus = (d: DocumentRecord): 'EMERALD' | 'AMBER' | 'ROSE' => {
                          if (d.needsHumanReview || d.reviewStatus === 'NEEDS_REVIEW') return 'ROSE';
                          if (!d.expirationDate || d.expirationDate === 'unknown' || d.expirationDate === 'N/A') return 'ROSE';
                          const expDt = new Date(d.expirationDate);
                          if (isNaN(expDt.getTime())) return 'ROSE';
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const diffDays = Math.ceil((expDt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          if (diffDays < 0) return 'ROSE';
                          if (diffDays <= 30) return 'AMBER';
                          return d.status === 'ROSE' ? 'ROSE' : 'EMERALD';
                        };
                        const docStatus = getDocStatus(doc);
                        return (
                          <span className={`px-3 py-1 rounded-full text-[11px] font-extrabold font-sans inline-flex items-center gap-1 shadow-sm whitespace-nowrap shrink-0 ${
                            docStatus === 'EMERALD' 
                              ? 'bg-emerald-500 text-slate-950' 
                              : docStatus === 'AMBER'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-rose-500 text-white'
                          }`}>
                            {docStatus === 'EMERALD' ? 'Compliant' : docStatus === 'AMBER' ? 'Expiring Soon' : 'Non-Compliant'}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 font-mono text-slate-300">
                      {doc.expirationDate || 'N/A'}
                    </td>
                    <td className="p-3 text-slate-400 font-mono">
                      {doc.submittedDate ? new Date(doc.submittedDate).toLocaleDateString() : 'Recent'}
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-400">
                      {doc.channel || doc.intakeChannel || 'DIRECT_UPLOAD'}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoc(doc);
                        }}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30 rounded-lg text-[11px] inline-flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Extraction</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side Document & AI Extraction Comparison Modal */}
      <DocumentExtractionModal
        document={selectedDoc}
        onClose={() => setSelectedDoc(null)}
        onConfirmApprove={(updatedDoc) => {
          setDocuments(prev => prev.map(d => d.id === updatedDoc.id ? updatedDoc : d));
          loadData();
        }}
      />

    </div>
  );
};
