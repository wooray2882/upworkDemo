import { getAuthToken, autoLoginDevUser, signOut } from './authService';

const API_BASE_URL = "https://4z6a0f7rkd.execute-api.us-east-1.amazonaws.com/dev";

async function apiFetch<T>(endpoint: string, options: RequestInit = {}, isRetry = false): Promise<T> {
  let token = getAuthToken();

  if (!token && !isRetry) {
    const devUser = await autoLoginDevUser();
    if (devUser) token = devUser.token;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = token;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401 && !isRetry) {
    signOut();
    const devUser = await autoLoginDevUser();
    if (devUser) {
      return apiFetch<T>(endpoint, options, true);
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const fetchCompanyProfile = () => apiFetch<any>('/company');

export const fetchSubcontractors = (status?: string) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return apiFetch<{ subcontractors: any[]; count: number }>(`/subcontractors${query}`);
};

export const fetchSubcontractorDetail = (id: string) => apiFetch<any>(`/subcontractors/${id}`);

export const fetchSubcontractorDocs = (id: string) => 
  apiFetch<{ documents: any[]; count: number }>(`/subcontractors/${id}/documents`);

export const deleteSubcontractor = (id: string) => 
  apiFetch<any>(`/subcontractors/${id}`, { method: 'DELETE' });

export const fetchDocumentDetail = (id: string) => apiFetch<any>(`/documents/${id}`);

export const deleteDocument = (id: string) => 
  apiFetch<any>(`/documents/${id}`, { method: 'DELETE' });

export const fetchReviewQueue = (reviewStatus = 'NEEDS_REVIEW') => 
  apiFetch<{ documents: any[]; count: number; reviewStatus: string }>(`/documents?reviewStatus=${encodeURIComponent(reviewStatus)}`);

export const fetchAdminTickets = () => 
  apiFetch<{ tickets: any[]; count: number }>('/admin/tickets');

export const updateAdminTicketStatus = (id: string, status: string, resolutionNote = '') =>
  apiFetch<any>(`/admin/tickets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, resolutionNote, note: resolutionNote })
  });

export const fetchAdminDashboard = () =>
  apiFetch<{ summary: any; companies: any[] }>('/admin/dashboard');

export const sendChatQuery = (prompt: string) =>
  apiFetch<{ answer: string; citations: any[]; companyId: string }>('/chat/query', {
    method: 'POST',
    body: JSON.stringify({ prompt, question: prompt })
  });

export const fetchAdminDeleted = () => 
  apiFetch<{ deleted_items: any[]; count: number }>('/admin/deleted');



export const restoreDeletedItem = (id: string) => 
  apiFetch<any>(`/admin/deleted/${id}/restore`, { method: 'POST' });

export const createSupportTicket = (subject: string, description: string) => 
  apiFetch<any>('/tickets', {
    method: 'POST',
    body: JSON.stringify({ subject, description, subjectLine: subject, message: description })
  });

export const createFeatureSuggestion = (suggestionText: string, companyId?: string) => 
  apiFetch<any>('/feedback/suggestions', {
    method: 'POST',
    body: JSON.stringify({ suggestionText, suggestion: suggestionText, companyId })
  });

export const createSubcontractor = (subData: any) =>
  apiFetch<any>('/subcontractors', {
    method: 'POST',
    body: JSON.stringify(subData)
  });

export const getUploadPresignedUrl = (subcontractorId: string, filename: string, contentType: string) =>
  apiFetch<{ uploadUrl: string; s3Key: string; documentId: string; bucket: string }>(`/subcontractors/${subcontractorId}/documents/presigned-url`, {
    method: 'POST',
    body: JSON.stringify({ filename, contentType, action: 'GET_PRESIGNED_URL' })
  });

export const triggerDocumentProcessing = (subcontractorId: string, s3Key: string, documentId?: string) =>
  apiFetch<any>(`/subcontractors/${subcontractorId}/documents/process`, {
    method: 'POST',
    body: JSON.stringify({ s3Key, documentId, s3_key: s3Key, subcontractor_id: subcontractorId, document_id: documentId })
  });

export const approveDocument = (docId: string, data: { subcontractorId?: string; expirationDate?: string; carrierName?: string; policyNumber?: string; subcontractorName?: string; documentType?: string }) =>
  apiFetch<any>('/documents', {
    method: 'POST',
    body: JSON.stringify({ documentId: docId, id: docId, ...data })
  });
