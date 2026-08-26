import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import AIChatWidget from '../ai/AIChatWidget';
import SubscriptionModal from '../SubscriptionModal';
import SupportTicketModal, { SupportTicketItem } from '../SupportTicketModal';
import { AuditReportModal } from '../AuditReportModal';
import { Subcontractor, DocumentRecord } from '../../types';

const PAGE_TITLES: Record<string, string> = {
  '/overview':      'Overview',
  '/subcontractors':'Subcontractors',
  '/intake':        'Document Vault',
  '/reports':       'Audit Reports & Compliance History',
  '/human-review':  'Review Queue',
  '/super-admin':   'System Health & Monitoring',
};

interface LayoutProps {
  children: React.ReactNode;
  subcontractors?: Subcontractor[];
  documents?: DocumentRecord[];
}

export default function Layout({ children, subcontractors = [], documents = [] }: LayoutProps) {
  const { pathname } = useLocation();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  
  // Support & Feature Suggestion Modal state
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [supportModalMode, setSupportModalMode] = useState<'TICKET' | 'SUGGESTION'>('TICKET');

  const title = PAGE_TITLES[pathname] ?? 'IndyComply SaaS';

  const handleOpenSupport = (mode: 'TICKET' | 'SUGGESTION' = 'TICKET') => {
    setSupportModalMode(mode);
    setIsSupportModalOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: 'var(--color-bg-base)' }}>
      <SubscriptionModal isOpen={isSubModalOpen} onClose={() => setIsSubModalOpen(false)} />
      <AuditReportModal 
        isOpen={isAuditModalOpen} 
        onClose={() => setIsAuditModalOpen(false)} 
        subcontractors={subcontractors}
        documents={documents}
      />

      <SupportTicketModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        initialMode={supportModalMode}
      />

      {/* Sidebar */}
      <Sidebar 
        isOpen={mobileSidebarOpen} 
        onClose={() => setMobileSidebarOpen(false)} 
        onOpenSettings={() => setIsSubModalOpen(true)}
        onOpenAuditReport={() => setIsAuditModalOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar 
          title={title} 
          onMenuClick={() => setMobileSidebarOpen(true)} 
          onOpenAuditReport={() => setIsAuditModalOpen(true)}
          onOpenSupportModal={handleOpenSupport}
        />
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5">
          {children}
        </main>
      </div>

      {/* AIChatWidget hidden per user request while preserving component file */}
      {/* <AIChatWidget /> */}
    </div>
  );
}
