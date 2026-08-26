// Live AWS API Client for IndyComply SaaS (Single-Table Design)

export const AWS_CONFIG = {
  region: 'us-east-1',
  s3Bucket: 'indycomply-saas-dev-docs-000622214837',
  mainTable: 'indycomply-saas-dev-main',
};

export async function fetchLiveSubcontractors() {
  // Queries live AWS DynamoDB single-table or falls back to seed state
  try {
    const res = await fetch('/api/aws/subcontractors');
    if (res.ok) {
      const data = await res.json();
      // Filter out soft-deleted subcontractors for client-facing views
      return Array.isArray(data) ? data.filter((item: any) => !item.deletedAt) : data;
    }
  } catch (err) {
    console.log('Using AWS live seed client cache');
  }
  return null;
}

export async function fetchLiveDocuments() {
  try {
    const res = await fetch('/api/aws/documents');
    if (res.ok) {
      const data = await res.json();
      // Filter out soft-deleted documents for client-facing views
      return Array.isArray(data) ? data.filter((item: any) => !item.deletedAt) : data;
    }
  } catch (err) {
    console.log('Using AWS live seed client cache');
  }
  return null;
}

