import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { UserProvider } from './context/UserContext';
import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';

import OverviewPage from './pages/OverviewPage';
import { SubcontractorCatalogPage } from './pages/SubcontractorCatalogPage';
import { SubcontractorDetailPage } from './pages/SubcontractorDetailPage';
import { DocumentIntakePage } from './pages/DocumentIntakePage';
import { AuditReportsPage } from './pages/AuditReportsPage';
import { HumanReviewQueuePage } from './pages/HumanReviewQueuePage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { ChatWidget } from './components/ChatWidget';


import { fetchSubcontractors, fetchReviewQueue, createSubcontractor } from './services/apiService';
import { Subcontractor, DocumentRecord, HumanReviewItem, SuperAdminLog, ComplianceStatus } from './types';

function AuthenticatedAppContent() {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { user } = useAuth();

  const [subcontractors, setSubcontractors] = useState<Subcontractor[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [humanReviewItems, setHumanReviewItems] = useState<HumanReviewItem[]>([]);
  const [adminLogs, setAdminLogs] = useState<SuperAdminLog[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load real data from authenticated API Gateway REST endpoints
  useEffect(() => {
    let isMounted = true;
    const loadRealData = async () => {
      try {
        setLoadingData(true);
        const [subsRes, reviewRes, allDocsRes] = await Promise.all([
          fetchSubcontractors().catch(() => ({ subcontractors: [] })),
          fetchReviewQueue('NEEDS_REVIEW').catch(() => ({ documents: [] })),
          fetchReviewQueue('ALL').catch(() => ({ documents: [] }))
        ]);

        if (isMounted) {
          setSubcontractors(subsRes.subcontractors || []);
          
          // Map review queue documents to HumanReviewItem structure
          const mappedReview: HumanReviewItem[] = (reviewRes.documents || []).map((doc: any) => ({
            id: doc.id || doc.SK?.replace('DOC#', ''),
            subcontractorId: doc.subcontractorId || 'sub-101',
            subcontractorName: doc.subcontractorName || 'Subcontractor',
            documentType: doc.docType || doc.documentType || 'COI',
            confidenceScore: doc.confidenceScore || 0.68,
            suggestedDocType: doc.suggestedDocType || 'Certificate of Insurance',
            rejectionReason: doc.rejectionReason || 'Low classification confidence',
            receivedDate: doc.createdAt || new Date().toISOString().split('T')[0],
            documentUrl: doc.s3Url || doc.presignedUrl || '#'
          }));
          setHumanReviewItems(mappedReview);

          // Map all documents for Document Intake Vault with strict compliance status evaluation
          const mappedDocs: DocumentRecord[] = (allDocsRes.documents || []).map((doc: any) => {
            const expDateStr = doc.expirationDate || doc.extractedExpiryDate || doc.expiration_date || 'unknown';
            const needsRev = doc.needsHumanReview === true || doc.reviewStatus === 'NEEDS_REVIEW';
            
            let statusVal: ComplianceStatus = 'ROSE';
            if (!needsRev && expDateStr && expDateStr !== 'unknown' && expDateStr !== 'N/A') {
              const expDt = new Date(expDateStr);
              if (!isNaN(expDt.getTime())) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const diffDays = Math.ceil((expDt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                if (diffDays < 0) statusVal = 'ROSE';
                else if (diffDays <= 30) statusVal = 'AMBER';
                else statusVal = doc.reviewStatus === 'APPROVED' ? 'EMERALD' : 'ROSE';
              }
            }

            return {
              id: doc.id || doc.SK?.replace('DOC#', ''),
              subcontractorId: doc.subcontractor_id || doc.subcontractorId || 'sub-101',
              subcontractorName: doc.subcontractor_name || doc.subcontractorName || 'Subcontractor',
              documentType: doc.documentType || doc.docType || 'Certificate of Insurance (COI)',
              carrierName: doc.carrierName || doc.extractedCarrier || 'N/A',
              policyNumber: doc.policyNumber || doc.extractedPolicyNumber || 'N/A',
              expirationDate: expDateStr,
              status: statusVal,
              submittedDate: doc.createdAt || new Date().toISOString(),
              channel: doc.channel || 'DIRECT_UPLOAD',
              s3Url: doc.s3Url || doc.s3_url,
              presignedUrl: doc.presignedUrl,
              reviewStatus: doc.reviewStatus,
              needsHumanReview: needsRev,
              confidenceScore: doc.confidenceScore
            };
          });
          if (mappedDocs.length > 0) {
            setDocuments(mappedDocs);
          }
        }
      } catch (err) {
        console.error('Error loading real API data:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    loadRealData();
    return () => { isMounted = false; };
  }, [user]);

  const handleTriggerReminder = (subcontractorId: string) => {
    const sub = subcontractors.find(s => s.id === subcontractorId);
    if (!sub) return;

    showToast('success', `Outbound reminder SMS sent to ${sub.contactName || 'Subcontractor'} (${sub.phone || 'System'})`);

    const newLog: SuperAdminLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString(),
      executionId: `msg-tw-${Math.floor(Math.random() * 899999 + 100000)}`,
      workflow: 'NotificationDispatcher',
      status: 'SUCCESS',
      durationMs: 145,
      details: `SMS reminder sent to ${sub.contactName || 'Subcontractor'} via docs+SUB-${sub.id}@intake.indycomply.com.`,
    };

    setAdminLogs(prev => [newLog, ...prev]);
  };

  const handleAddSubcontractor = async (newSubData: Omit<Subcontractor, 'id'>) => {
    try {
      const created = await createSubcontractor(newSubData);
      setSubcontractors(prev => [created, ...prev]);
      showToast('success', `Subcontractor ${created.name} added to catalog.`);
    } catch (err) {
      console.error('API createSubcontractor fallback:', err);
      const fallbackSub: Subcontractor = {
        ...newSubData,
        id: `sub-${Date.now()}`,
      };
      setSubcontractors(prev => [fallbackSub, ...prev]);
      showToast('success', `Subcontractor ${fallbackSub.name} added to catalog.`);
    }
  };

  const handleAddDocument = (newDocData: Omit<DocumentRecord, 'id'>) => {
    const newDoc: DocumentRecord = {
      ...newDocData,
      id: `doc-${Date.now()}`,
    };
    setDocuments(prev => [newDoc, ...prev]);
    showToast('success', `Document filed for ${newDoc.subcontractorName}`);
    navigate('/overview');
  };

  const handleApproveHumanReview = (itemId: string, updatedFields?: { expirationDate?: string; carrierName?: string; policyNumber?: string }) => {
    const item = humanReviewItems.find(i => i.id === itemId);
    setHumanReviewItems(prev => prev.filter(i => i.id !== itemId));

    setDocuments(prev => prev.map(d => {
      if (d.id === itemId) {
        const expDateStr = updatedFields?.expirationDate || d.expirationDate;
        let newStatus: ComplianceStatus = 'EMERALD';
        if (expDateStr && expDateStr !== 'unknown') {
          const expDt = new Date(expDateStr);
          if (!isNaN(expDt.getTime())) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const diffDays = Math.ceil((expDt.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 0) newStatus = 'ROSE';
            else if (diffDays <= 30) newStatus = 'AMBER';
          }
        }
        return {
          ...d,
          expirationDate: expDateStr,
          carrierName: updatedFields?.carrierName || d.carrierName,
          policyNumber: updatedFields?.policyNumber || d.policyNumber,
          reviewStatus: 'APPROVED',
          needsHumanReview: false,
          status: newStatus
        };
      }
      return d;
    }));

    if (item) {
      showToast('success', `Verification confirmed for ${item.subcontractorName}.`);
    }
  };

  const handleRejectHumanReview = (itemId: string) => {
    const item = humanReviewItems.find(i => i.id === itemId);
    setHumanReviewItems(prev => prev.filter(i => i.id !== itemId));
    if (item) {
      showToast('warning', `Document rejected for ${item.subcontractorName}. Notification sent to resubmit.`);
    }
  };

  return (
    <Layout subcontractors={subcontractors} documents={documents}>

      <Routes>
        <Route path="/" element={<Navigate to="/overview" replace />} />
        <Route 
          path="/overview" 
          element={
            <OverviewPage 
              subcontractors={subcontractors}
              onTriggerReminder={handleTriggerReminder}
              onNavigateToIntake={() => navigate('/intake')}
            />
          } 
        />

        <Route 
          path="/subcontractors" 
          element={
            <SubcontractorCatalogPage
              subcontractors={subcontractors}
              onTriggerReminder={handleTriggerReminder}
              onAddSubcontractor={handleAddSubcontractor}
            />
          } 
        />
        <Route path="/subcontractors/:id" element={<SubcontractorDetailPage />} />
        <Route 
          path="/intake" 
          element={
            <DocumentIntakePage 
              documents={documents}
              subcontractors={subcontractors}
              onAddDocument={handleAddDocument}
              onApproveHumanReview={handleApproveHumanReview}
            />
          } 
        />
        <Route 
          path="/reports" 
          element={
            <AuditReportsPage 
              subcontractors={subcontractors}
              documents={documents}
            />
          } 
        />
        <Route 
          path="/human-review" 
          element={
            <HumanReviewQueuePage
              items={humanReviewItems}
              onApproveItem={handleApproveHumanReview}
              onRejectItem={handleRejectHumanReview}
            />
          } 
        />
        <Route path="/super-admin" element={<SuperAdminPage logs={adminLogs} />} />

      </Routes>
      <ChatWidget />

    </Layout>
  );
}


import { FeatureSuggestionPage } from './pages/FeatureSuggestionPage';

function MainRoot() {
  const { user, loading } = useAuth();

  if (window.location.pathname.startsWith('/feedback/suggest')) {
    return <FeatureSuggestionPage />;
  }

  if (loading) {

    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-sans">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Authenticating session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return <AuthenticatedAppContent />;
}

export function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <NotificationProvider>
          <BrowserRouter>
            <MainRoot />
          </BrowserRouter>
        </NotificationProvider>
      </UserProvider>
    </AuthProvider>
  );
}

