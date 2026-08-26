export type ComplianceStatus = 'EMERALD' | 'AMBER' | 'ROSE';

export type EntityType = 'Company' | 'Subcontractor' | 'Document' | 'Ticket' | 'IntakeEvent';

export interface SingleTableKeys {
  PK?: string;
  SK?: string;
  EntityType?: EntityType;
  GSI1PK?: string;
  GSI1SK?: string;
  deletedAt?: string | null;
}

export interface CompanyEntity extends SingleTableKeys {
  companyId: string;
  companyName: string;
  planTier: string;
  createdAt: string;
  status: string;
}

export interface Subcontractor extends SingleTableKeys {
  id: string;
  client_company_id: string;
  name: string;
  trade: string;
  contactName: string;
  phone: string;
  email: string;
  complianceStatus: ComplianceStatus;
  documentsCount: number;
  lastIngestionDate: string;
  activeProject: string;
  insuranceExpiryDate?: string;
}

export interface DocumentRecord extends SingleTableKeys {
  id: string;
  subcontractorId: string;
  subcontractorName: string;
  client_company_id?: string;
  documentType: string;
  carrierName?: string;
  policyNumber?: string;
  coverageLimit?: string;
  effectiveDate?: string;
  expirationDate: string;
  daysUntilExpiration?: number;
  status: ComplianceStatus;
  confidenceScore: number;
  needsHumanReview: boolean;
  s3Url: string;
  presignedUrl?: string;
  intakeChannel?: 'EMAIL_SES' | 'TAP_TO_PHOTO_SMS' | 'DIRECT_UPLOAD' | string;
  channel?: string;
  submittedAt?: string;
  submittedDate?: string;
  reviewStatus?: 'APPROVED' | 'NEEDS_REVIEW' | 'REJECTED' | string;
}


export interface IntakeEventEntity extends SingleTableKeys {
  intakeToken: string;
  subcontractorId: string;
  channel: 'email' | 'sms';
  rawMessageId: string;
  matchedDocumentId?: string;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
}

export interface TicketEntity extends SingleTableKeys {
  ticketId: string;
  companyId: string;
  subjectLine: string;
  description: string;
  aiInferredUrgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
}

export interface HumanReviewItem {
  id: string;
  documentId?: string;
  subcontractorId?: string;
  subcontractorName: string;
  documentType?: string;
  suggestedDocType: string;
  extractedExpiration?: string;
  extractedCoverage?: string;
  confidenceScore: number;
  rawOcrText?: string;
  flagReason?: string;
  rejectionReason?: string;
  uploadedAt?: string;
  receivedDate?: string;
  documentUrl?: string;
  presignedUrl?: string;
}


export interface SuperAdminLog {
  id: string;
  timestamp: string;
  executionId: string;
  workflow: 'DocumentProcessingStateMachine' | 'DailyExpirationScanCron' | 'BedrockClassifierLambda' | 'TwilioSmsDelivery' | 'NotificationDispatcher';
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS' | 'NEEDS_HUMAN_REVIEW';
  durationMs: number;
  details: string;
}


